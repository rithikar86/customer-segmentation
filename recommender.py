from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import pandas as pd

from utils import DataValidationError


@dataclass(frozen=True)
class RecommendationConfig:
    top_n: int = 5
    history_category_boost: float = 0.15
    cross_sell_boost: float = 0.20
    enable_cross_sell: bool = True


def _get_customer_segment(customer_id: int, rfm: pd.DataFrame) -> str:
    row = rfm.loc[rfm["CustomerID"] == int(customer_id)]
    if row.empty:
        raise DataValidationError("Unknown CustomerID: %s" % customer_id)
    return str(row.iloc[0]["Segment"])


def _product_label(df: pd.DataFrame) -> pd.Series:
    return df["StockCode"].astype(str) + " — " + df["Description"].astype(str)


def _customer_history_summary(df: pd.DataFrame, customer_id: int) -> Tuple[set, List[str]]:
    cust = df.loc[df["CustomerID"] == int(customer_id)].copy()
    if cust.empty:
        return set(), []
    cust["ProductLabel"] = _product_label(cust)
    purchased = set(cust["ProductLabel"].unique().tolist())
    top_cats = (
        cust.groupby("Category", as_index=False)["TotalPrice"]
        .sum()
        .sort_values("TotalPrice", ascending=False)["Category"]
        .head(3)
        .tolist()
    )
    return purchased, [str(c) for c in top_cats]


def recommend_products(
    customer_id: int,
    transactions: pd.DataFrame,
    rfm: pd.DataFrame,
    segment_top_products: Dict[str, pd.DataFrame],
    cooccurrence: Optional[Dict[str, List[Tuple[str, int]]]] = None,
    cfg: Optional[RecommendationConfig] = None,
) -> pd.DataFrame:
    """
    Returns top-N recommended products with score + reasoning.
    Logic:
    1) Segment top products as base
    2) Boost products in customer's top categories
    3) Remove already purchased products (fallback to allow if empty)
    4) Optional cross-sell via co-occurrence with customer's top items
    """
    if cfg is None:
        cfg = RecommendationConfig()

    seg = _get_customer_segment(customer_id, rfm)
    base = segment_top_products.get(seg)
    if base is None or base.empty:
        raise DataValidationError("Not enough data to recommend products for segment: %s" % seg)

    df = transactions.copy()
    df["ProductLabel"] = _product_label(df)

    purchased, top_cats = _customer_history_summary(df, customer_id)
    base2 = base.copy()
    base2["reason"] = "Popular in your segment (%s)" % seg

    # Derive category for each ProductLabel using first seen row.
    cat_map = (
        df.drop_duplicates(subset=["ProductLabel"])[["ProductLabel", "Category"]]
        .set_index("ProductLabel")["Category"]
        .to_dict()
    )
    base2["Category"] = base2["ProductLabel"].map(lambda x: cat_map.get(x, "Unknown"))

    score = base2["score"].astype(float)
    reasons: List[str] = []
    out_rows: List[dict] = []

    # Cross-sell candidates based on co-occurrence with customer's top purchased products
    cross_sell_bonus: Dict[str, float] = {}
    if cfg.enable_cross_sell and cooccurrence:
        # pick top bought products by monetary
        cust = df.loc[df["CustomerID"] == int(customer_id)]
        if not cust.empty:
            top_items = (
                cust.groupby("ProductLabel", as_index=False)["TotalPrice"]
                .sum()
                .sort_values("TotalPrice", ascending=False)["ProductLabel"]
                .head(5)
                .tolist()
            )
            for it in top_items:
                for co_it, cnt in cooccurrence.get(it, []):
                    cross_sell_bonus[co_it] = cross_sell_bonus.get(co_it, 0.0) + float(cnt)
        if cross_sell_bonus:
            mx = max(cross_sell_bonus.values())
            for k in list(cross_sell_bonus.keys()):
                cross_sell_bonus[k] = (cross_sell_bonus[k] / mx) * cfg.cross_sell_boost

    for _, r in base2.iterrows():
        p = str(r["ProductLabel"])
        s = float(r["score"])
        reason_parts = [str(r["reason"])]

        if str(r.get("Category", "Unknown")) in top_cats:
            s += cfg.history_category_boost
            reason_parts.append("Matches your preferred category (%s)" % str(r["Category"]))

        if p in cross_sell_bonus:
            s += cross_sell_bonus[p]
            reason_parts.append("Often bought together with your recent items")

        out_rows.append(
            {
                "ProductLabel": p,
                "Category": str(r.get("Category", "Unknown")),
                "purchase_count": int(r.get("purchase_count", 0)),
                "monetary": float(r.get("monetary", 0.0)),
                "score": float(s),
                "reasoning": "; ".join(reason_parts),
            }
        )

    out = pd.DataFrame(out_rows).sort_values(["score", "monetary", "purchase_count"], ascending=False)

    filtered = out.loc[~out["ProductLabel"].isin(purchased)].copy()
    if filtered.empty:
        filtered = out.copy()

    return filtered.head(int(cfg.top_n)).reset_index(drop=True)

