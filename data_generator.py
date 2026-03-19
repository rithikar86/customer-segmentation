from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class SyntheticConfig:
    customers: int = 500
    products: int = 120
    days: int = 365
    avg_invoices_per_customer: float = 6.0
    max_lines_per_invoice: int = 8
    seed: int = 42


def _make_catalog(n_products: int, rng: np.random.Generator) -> pd.DataFrame:
    categories = [
        "GIFT",
        "HOME",
        "KITCHEN",
        "TOY",
        "DECOR",
        "STATIONERY",
        "PARTY",
        "BAG",
        "CANDLE",
        "MUG",
    ]
    cat = rng.choice(categories, size=n_products, replace=True)
    stock = [f"P{idx:05d}" for idx in range(1, n_products + 1)]
    desc = [f"{cat[i]} ITEM {i+1}" for i in range(n_products)]
    base_price = rng.uniform(1.5, 35.0, size=n_products).round(2)
    return pd.DataFrame(
        {"StockCode": stock, "Description": desc, "Category": cat, "BasePrice": base_price}
    )


def generate_synthetic_transactions(cfg: Optional[SyntheticConfig] = None) -> pd.DataFrame:
    """
    Generates a realistic-ish retail dataset with required columns:
    CustomerID, InvoiceNo, InvoiceDate, StockCode, Description, Quantity, UnitPrice
    """
    if cfg is None:
        cfg = SyntheticConfig()

    rng = np.random.default_rng(cfg.seed)
    catalog = _make_catalog(cfg.products, rng)

    customer_ids = np.arange(10000, 10000 + cfg.customers, dtype=int)

    rows: List[dict] = []
    invoice_counter = 1

    for cust in customer_ids:
        invoices = max(1, int(rng.poisson(cfg.avg_invoices_per_customer)))
        for _ in range(invoices):
            invoice_no = f"INV{invoice_counter:07d}"
            invoice_counter += 1

            day_offset = int(rng.integers(0, cfg.days))
            invoice_date = (pd.Timestamp.utcnow().normalize() - pd.Timedelta(days=day_offset)).to_pydatetime()

            lines = int(rng.integers(1, cfg.max_lines_per_invoice + 1))
            picks = rng.choice(cfg.products, size=lines, replace=False if cfg.products >= lines else True)

            for p_idx in picks:
                p = catalog.iloc[int(p_idx)]
                qty = int(max(1, rng.poisson(2)))
                price = float(max(0.1, rng.normal(p["BasePrice"], p["BasePrice"] * 0.15)))
                price = round(price, 2)
                rows.append(
                    {
                        "CustomerID": int(cust),
                        "InvoiceNo": invoice_no,
                        "InvoiceDate": invoice_date,
                        "StockCode": str(p["StockCode"]),
                        "Description": str(p["Description"]),
                        "Quantity": qty,
                        "UnitPrice": price,
                    }
                )

    df = pd.DataFrame(rows)
    return df

