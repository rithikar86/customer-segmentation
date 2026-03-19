from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np
import pandas as pd


REQUIRED_COLUMNS = [
    "CustomerID",
    "InvoiceNo",
    "InvoiceDate",
    "StockCode",
    "Description",
    "Quantity",
    "UnitPrice",
]

# Internal canonical column names -> keywords to auto-detect from raw data
_COLUMN_KEYWORDS: Dict[str, List[str]] = {
    "CustomerID": ["customer", "cust", "client", "buyer"],
    "InvoiceNo": ["invoice", "order", "bill", "receipt", "txn", "transaction"],
    "InvoiceDate": ["date", "invoice_date", "order_date", "datetime"],
    "StockCode": ["sku", "stock", "product_id", "item_code", "code"],
    "Description": ["description", "product", "item", "name", "title"],
    "Quantity": ["qty", "quantity", "units", "count"],
    "UnitPrice": ["unitprice", "price", "amount", "rate"],
}


class DataValidationError(ValueError):
    pass


@dataclass(frozen=True)
class PipelineArtifacts:
    transactions: pd.DataFrame
    rfm: pd.DataFrame
    segment_stats: pd.DataFrame
    segment_top_products: Dict[str, pd.DataFrame]
    segment_top_categories: Dict[str, pd.DataFrame]
    cooccurrence: Dict[str, List[Tuple[str, int]]]


def infer_column_mapping(df: pd.DataFrame) -> Dict[str, Optional[str]]:
    """
    Best-effort mapping from internal column names to raw columns, using simple
    keyword matching on lowercased column names.
    """
    cols = [str(c) for c in df.columns]
    lower = {c: c.lower().replace(" ", "").replace("-", "").replace("_", "") for c in cols}

    mapping: Dict[str, Optional[str]] = {k: None for k in REQUIRED_COLUMNS}
    for internal, keywords in _COLUMN_KEYWORDS.items():
        for col, norm in lower.items():
            if any(kw in norm for kw in keywords):
                mapping[internal] = col
                break
        if mapping[internal] is None and internal in df.columns:
            mapping[internal] = internal
    return mapping


def apply_column_mapping(
    df: pd.DataFrame,
    column_mapping: Optional[Dict[str, Optional[str]]] = None,
) -> pd.DataFrame:
    """
    Rename user-provided columns into our canonical names.
    - column_mapping maps canonical name -> raw column name
    - missing mappings raise a DataValidationError
    """
    if column_mapping is None:
        column_mapping = infer_column_mapping(df)

    rename_map: Dict[str, str] = {}
    missing: List[str] = []
    for internal in REQUIRED_COLUMNS:
        raw_name = column_mapping.get(internal)
        if not raw_name:
            missing.append(internal)
            continue
        if raw_name not in df.columns:
            missing.append(internal)
        else:
            rename_map[raw_name] = internal

    if missing:
        raise DataValidationError(
            "Missing required fields after column mapping: "
            + ", ".join(sorted(missing))
            + ". Please adjust the column mapping in the sidebar."
        )

    std = df.rename(columns=rename_map).copy()
    return std


def validate_schema(df: pd.DataFrame, required: Iterable[str] = REQUIRED_COLUMNS) -> None:
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise DataValidationError(
            "Missing required columns: " + ", ".join(missing) + ". "
            "Expected: " + ", ".join(list(required))
        )


def clean_transactions(df: pd.DataFrame) -> pd.DataFrame:
    validate_schema(df)
    out = df.copy()

    out["CustomerID"] = pd.to_numeric(out["CustomerID"], errors="coerce")
    out = out.dropna(subset=["CustomerID"])
    out["CustomerID"] = out["CustomerID"].astype(int)

    out["Quantity"] = pd.to_numeric(out["Quantity"], errors="coerce")
    out["UnitPrice"] = pd.to_numeric(out["UnitPrice"], errors="coerce")
    out = out.dropna(subset=["Quantity", "UnitPrice", "InvoiceDate", "InvoiceNo", "StockCode"])

    out = out[out["Quantity"] > 0]
    out = out[out["UnitPrice"] >= 0]

    out["InvoiceDate"] = pd.to_datetime(out["InvoiceDate"], errors="coerce")
    out = out.dropna(subset=["InvoiceDate"])

    out["InvoiceNo"] = out["InvoiceNo"].astype(str)
    out["StockCode"] = out["StockCode"].astype(str)
    out["Description"] = out["Description"].astype(str).fillna("")

    out["TotalPrice"] = out["Quantity"] * out["UnitPrice"]
    out["Category"] = out["Description"].astype(str).str.strip().str.split().str[0].fillna("Unknown")

    return out.reset_index(drop=True)


def filter_time_window(df: pd.DataFrame, months: int = 12, as_of: Optional[pd.Timestamp] = None) -> pd.DataFrame:
    if df.empty:
        return df
    if as_of is None:
        as_of = pd.to_datetime(df["InvoiceDate"].max())
    start = as_of - pd.DateOffset(months=int(months))
    return df.loc[df["InvoiceDate"] >= start].copy()


def compute_rfm(df: pd.DataFrame, as_of: Optional[pd.Timestamp] = None) -> pd.DataFrame:
    if df.empty:
        raise DataValidationError("After cleaning/time filtering, there are no valid rows to process.")

    if as_of is None:
        as_of = pd.to_datetime(df["InvoiceDate"].max()) + pd.Timedelta(days=1)

    rfm = (
        df.groupby("CustomerID", as_index=False)
        .agg(
            LastPurchase=("InvoiceDate", "max"),
            Frequency=("InvoiceNo", "nunique"),
            Monetary=("TotalPrice", "sum"),
        )
    )
    rfm["Recency"] = (as_of - rfm["LastPurchase"]).dt.days.astype(int)
    rfm = rfm.drop(columns=["LastPurchase"])
    return rfm


def score_recency_fixed(recency_days: pd.Series) -> pd.Series:
    bins = [-1, 30, 60, 90, 180, 10**9]
    labels = [5, 4, 3, 2, 1]
    return pd.cut(recency_days, bins=bins, labels=labels).astype(int)


def score_quintiles(values: pd.Series, ascending: bool = True) -> pd.Series:
    """
    Percentile-based 1..5 scoring that is robust to ties / low cardinality.
    Pandas qcut can fail when bin edges are not unique; we gracefully degrade.
    """
    if values.empty:
        return values.astype(int)

    ranked = values.rank(method="first", ascending=ascending)

    # If there is not enough variation, return neutral-ish scores
    if values.nunique(dropna=True) <= 1:
        return pd.Series([3] * len(values), index=values.index, dtype=int)

    try:
        return pd.qcut(ranked, 5, labels=[1, 2, 3, 4, 5], duplicates="drop").astype(int)
    except ValueError:
        # Fallback: fewer bins then scale to 1..5
        bins = min(5, max(2, int(values.nunique(dropna=True))))
        s = pd.qcut(ranked, bins, labels=list(range(1, bins + 1)), duplicates="drop").astype(int)
        # Map bins to 1..5
        if bins == 5:
            return s
        scaled = ((s - 1) * (4 / (bins - 1)) + 1).round().astype(int)
        return scaled.clip(1, 5)


def add_rfm_scores(rfm: pd.DataFrame) -> pd.DataFrame:
    out = rfm.copy()
    out["R_Score"] = score_recency_fixed(out["Recency"])
    out["F_Score"] = score_quintiles(out["Frequency"], ascending=True)
    out["M_Score"] = score_quintiles(out["Monetary"], ascending=True)
    out["RFM_Score"] = out["R_Score"] + out["F_Score"] + out["M_Score"]
    return out


def segment_from_scores(r: pd.Series) -> str:
    R = int(r["R_Score"])
    F = int(r["F_Score"])
    M = int(r["M_Score"])

    if R >= 4 and F >= 4 and M >= 4:
        return "Champions"
    if F >= 4 and R >= 3:
        return "Loyal Customers"
    if R >= 4 and F in (2, 3):
        return "Potential Loyalists"
    if R == 5 and F == 1:
        return "New Customers"
    if R <= 2 and (F >= 3 or M >= 3):
        return "At Risk"
    if R <= 2 and F <= 2 and M <= 2:
        return "Hibernating"
    if R == 1 and F == 1 and M == 1:
        return "Lost"
    if R <= 2:
        return "At Risk"
    if R >= 4:
        return "Potential Loyalists"
    return "Loyal Customers" if F >= 3 else "New Customers"


def classify_segments(rfm_scored: pd.DataFrame) -> pd.DataFrame:
    out = rfm_scored.copy()
    out["Segment"] = out.apply(segment_from_scores, axis=1)
    return out


def segment_distribution(rfm: pd.DataFrame) -> pd.DataFrame:
    dist = rfm["Segment"].value_counts().reset_index()
    dist.columns = ["Segment", "Customers"]
    dist["Share"] = dist["Customers"] / max(dist["Customers"].sum(), 1)
    return dist


def _segment_product_scores(df: pd.DataFrame) -> pd.DataFrame:
    g = df.groupby(["Segment", "ProductLabel"], as_index=False).agg(
        purchase_count=("InvoiceNo", "count"),
        monetary=("TotalPrice", "sum"),
    )
    g["score"] = (
        0.65 * (g["purchase_count"] / g.groupby("Segment")["purchase_count"].transform(lambda s: max(s.max(), 1)))
        + 0.35 * (g["monetary"] / g.groupby("Segment")["monetary"].transform(lambda s: max(s.max(), 1e-9)))
    )
    return g


def build_segment_affinity(
    df: pd.DataFrame,
    rfm: pd.DataFrame,
    top_n: int = 10,
) -> Tuple[Dict[str, pd.DataFrame], Dict[str, pd.DataFrame], pd.DataFrame]:
    seg_map = rfm.set_index("CustomerID")["Segment"].to_dict()
    tmp = df.copy()
    tmp["Segment"] = tmp["CustomerID"].map(seg_map)
    tmp = tmp.dropna(subset=["Segment"]).copy()

    tmp["ProductLabel"] = tmp["StockCode"].astype(str) + " — " + tmp["Description"].astype(str)

    prod_scores = _segment_product_scores(tmp)
    top_products: Dict[str, pd.DataFrame] = {}
    for seg, g in prod_scores.groupby("Segment"):
        top_products[seg] = g.sort_values(["score", "monetary", "purchase_count"], ascending=False).head(top_n)

    cat = tmp.groupby(["Segment", "Category"], as_index=False).agg(
        purchase_count=("InvoiceNo", "count"),
        monetary=("TotalPrice", "sum"),
    )
    cat["score"] = (
        0.6 * (cat["purchase_count"] / cat.groupby("Segment")["purchase_count"].transform(lambda s: max(s.max(), 1)))
        + 0.4 * (cat["monetary"] / cat.groupby("Segment")["monetary"].transform(lambda s: max(s.max(), 1e-9)))
    )
    top_categories: Dict[str, pd.DataFrame] = {}
    for seg, g in cat.groupby("Segment"):
        top_categories[seg] = g.sort_values(["score", "monetary", "purchase_count"], ascending=False).head(top_n)

    basket = tmp.groupby(["Segment", "InvoiceNo"], as_index=False).agg(
        basket_value=("TotalPrice", "sum"),
        basket_items=("StockCode", "nunique"),
    )
    seg_stats = basket.groupby("Segment", as_index=False).agg(
        AvgBasketValue=("basket_value", "mean"),
        AvgItemsPerBasket=("basket_items", "mean"),
        Invoices=("InvoiceNo", "nunique"),
    )
    return top_products, top_categories, seg_stats


def build_cooccurrence(df: pd.DataFrame, min_pair_count: int = 3, top_k: int = 10) -> Dict[str, List[Tuple[str, int]]]:
    """
    Product co-occurrence across invoices.
    Returns mapping: product_label -> [(co_product_label, count), ...]
    """
    if df.empty:
        return {}
    tmp = df.copy()
    tmp["ProductLabel"] = tmp["StockCode"].astype(str) + " — " + tmp["Description"].astype(str)
    inv = tmp.groupby("InvoiceNo")["ProductLabel"].apply(lambda s: sorted(set(s.tolist()))).tolist()

    pair_counts: Dict[Tuple[str, str], int] = {}
    for items in inv:
        n = len(items)
        if n < 2:
            continue
        for i in range(n):
            for j in range(i + 1, n):
                a, b = items[i], items[j]
                pair_counts[(a, b)] = pair_counts.get((a, b), 0) + 1

    neigh: Dict[str, Dict[str, int]] = {}
    for (a, b), c in pair_counts.items():
        if c < min_pair_count:
            continue
        neigh.setdefault(a, {})[b] = c
        neigh.setdefault(b, {})[a] = c

    out: Dict[str, List[Tuple[str, int]]] = {}
    for p, m in neigh.items():
        out[p] = sorted(m.items(), key=lambda x: x[1], reverse=True)[:top_k]
    return out


def build_pipeline(
    df_raw: pd.DataFrame,
    months: int = 12,
    top_n_affinity: int = 10,
    column_mapping: Optional[Dict[str, Optional[str]]] = None,
    products_df: Optional[pd.DataFrame] = None,
) -> PipelineArtifacts:
    # 1) Map arbitrary column names into our canonical schema
    std = apply_column_mapping(df_raw, column_mapping=column_mapping)

    # 2) Optional product enrichment
    if products_df is not None and not products_df.empty:
        prod = products_df.copy()
        if "StockCode" in prod.columns:
            prod["StockCode"] = prod["StockCode"].astype(str)
            # Use product data to enrich description/category/price when present
            std["StockCode"] = std["StockCode"].astype(str)
            merged = std.merge(
                prod[["StockCode", "Description", "Category", "UnitPrice"]],
                on="StockCode",
                how="left",
                suffixes=("", "_prod"),
            )
            for col in ["Description", "Category", "UnitPrice"]:
                prod_col = f"{col}_prod"
                if prod_col in merged.columns:
                    merged[col] = merged[col].fillna(merged[prod_col])
            keep_cols = [c for c in merged.columns if not c.endswith("_prod")]
            std = merged[keep_cols]

    # 3) Standard cleaning / RFM / segments
    cleaned = clean_transactions(std)
    filtered = filter_time_window(cleaned, months=months)
    rfm = compute_rfm(filtered)
    rfm = add_rfm_scores(rfm)
    rfm = classify_segments(rfm)

    seg_top_products, seg_top_categories, seg_stats = build_segment_affinity(
        filtered, rfm, top_n=top_n_affinity
    )
    co = build_cooccurrence(filtered)

    return PipelineArtifacts(
        transactions=filtered,
        rfm=rfm,
        segment_stats=seg_stats,
        segment_top_products=seg_top_products,
        segment_top_categories=seg_top_categories,
        cooccurrence=co,
    )

