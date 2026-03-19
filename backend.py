from __future__ import annotations

import io
import logging
import sqlite3
import threading
import time
from dataclasses import dataclass
from typing import Callable, Dict, Iterable, Optional, Tuple

import pandas as pd
import requests

from utils import DataValidationError


###############################################################################
# Logging configuration
###############################################################################

LOGGER_NAME = "retail_backend"
logger = logging.getLogger(LOGGER_NAME)
if not logger.handlers:
    logger.setLevel(logging.INFO)
    handler = logging.FileHandler("backend.log", encoding="utf-8")
    fmt = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(fmt)
    logger.addHandler(handler)


###############################################################################
# Configuration dataclasses
###############################################################################


@dataclass
class FetchConfig:
    api_url: Optional[str] = None
    sqlite_path: Optional[str] = "retail.db"
    sqlite_query: Optional[str] = "SELECT * FROM transactions"


@dataclass
class RFMConfig:
    as_of: Optional[pd.Timestamp] = None
    output_csv_path: Optional[str] = "rfm_segments.csv"
    # Name of customer id / date / order / amount columns in standardized dataframe
    customer_col: str = "customer_id"
    order_col: str = "order_id"
    date_col: str = "order_date"
    amount_col: str = "amount"


###############################################################################
# 1. Live data handling
###############################################################################


def fetch_transactions(cfg: FetchConfig) -> pd.DataFrame:
    """
    Fetch transaction data from an API or SQLite database.

    - Tries API first if api_url is provided, otherwise falls back to SQLite.
    - On any failure, logs the error and returns an empty DataFrame.
    """
    # Try API
    if cfg.api_url:
        try:
            logger.info("Fetching transactions from API: %s", cfg.api_url)
            resp = requests.get(cfg.api_url, timeout=15)
            resp.raise_for_status()
            ctype = resp.headers.get("content-type", "").lower()
            if "json" in ctype:
                data = resp.json()
                df = pd.DataFrame(data)
            else:
                df = pd.read_csv(io.StringIO(resp.text), encoding_errors="ignore")
            logger.info("Fetched %d rows from API", len(df))
            return df
        except Exception as exc:  # noqa: BLE001
            logger.error("API fetch failed: %s", exc, exc_info=True)

    # Fallback: SQLite
    if cfg.sqlite_path and cfg.sqlite_query:
        try:
            logger.info(
                "Fetching transactions from SQLite '%s' with query '%s'",
                cfg.sqlite_path,
                cfg.sqlite_query,
            )
            conn = sqlite3.connect(cfg.sqlite_path)
            try:
                df = pd.read_sql_query(cfg.sqlite_query, conn)
            finally:
                conn.close()
            logger.info("Fetched %d rows from SQLite", len(df))
            return df
        except Exception as exc:  # noqa: BLE001
            logger.error("SQLite fetch failed: %s", exc, exc_info=True)

    logger.warning("No live data source succeeded; returning empty DataFrame.")
    return pd.DataFrame()


###############################################################################
# 2. CSV upload auto-conversion
###############################################################################

REQUIRED_CANONICAL_COLUMNS = ["customer_id", "order_id", "order_date", "amount"]

_CSV_KEYWORDS: Dict[str, Iterable[str]] = {
    "customer_id": ["customer_id", "cust_id", "customer", "cust", "client"],
    "order_id": ["order_id", "invoice", "order", "id", "txn", "transaction"],
    "order_date": ["order_date", "date", "invoice_date", "datetime"],
    "amount": ["amount", "total", "price", "unitprice", "value"],
}


def _infer_csv_mapping(df: pd.DataFrame) -> Dict[str, Optional[str]]:
    cols = [str(c) for c in df.columns]
    norm = {c: c.lower().replace(" ", "").replace("-", "").replace("_", "") for c in cols}
    mapping: Dict[str, Optional[str]] = {k: None for k in REQUIRED_CANONICAL_COLUMNS}
    for target, keywords in _CSV_KEYWORDS.items():
        for col, n in norm.items():
            if any(kw in n for kw in keywords):
                mapping[target] = col
                break
    return mapping


def validate_and_convert_csv(file) -> Tuple[pd.DataFrame, Dict[str, Optional[str]]]:
    """
    Convert an uploaded CSV (file-like or bytes) into the required format:
    columns: ["customer_id", "order_id", "order_date", "amount"]

    - Detect likely column names via keyword heuristics
    - Rename columns
    - Add any missing columns with sensible defaults
    - Reorder columns

    Returns:
        (converted_df, mapping_used)
    """
    try:
        if hasattr(file, "read"):
            content = file.read()
        else:
            content = file
        df = pd.read_csv(io.BytesIO(content)) if isinstance(content, (bytes, bytearray)) else pd.read_csv(
            io.StringIO(content)
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to read uploaded CSV: %s", exc, exc_info=True)
        raise DataValidationError("Invalid CSV file uploaded.") from exc

    if df.empty:
        logger.warning("Uploaded CSV is empty.")
        return pd.DataFrame(columns=REQUIRED_CANONICAL_COLUMNS), {}

    mapping = _infer_csv_mapping(df)
    rename_map: Dict[str, str] = {}
    for target in REQUIRED_CANONICAL_COLUMNS:
        src = mapping.get(target)
        if src and src in df.columns:
            rename_map[src] = target

    converted = df.rename(columns=rename_map).copy()

    # Add missing columns with defaults
    for col in REQUIRED_CANONICAL_COLUMNS:
        if col not in converted.columns:
            if col in ("customer_id", "order_id"):
                converted[col] = ""
            elif col == "order_date":
                converted[col] = pd.NaT
            else:  # amount
                converted[col] = 0.0

    # Basic type normalization
    converted["customer_id"] = converted["customer_id"].astype(str)
    converted["order_id"] = converted["order_id"].astype(str)
    converted["order_date"] = pd.to_datetime(converted["order_date"], errors="coerce")
    converted["amount"] = pd.to_numeric(converted["amount"], errors="coerce").fillna(0.0)

    # Reorder columns
    converted = converted[REQUIRED_CANONICAL_COLUMNS].copy()

    logger.info(
        "Converted uploaded CSV: %d rows, mapping=%s",
        len(converted),
        {k: v for k, v in mapping.items() if v},
    )
    return converted, mapping


###############################################################################
# 3. RFM & segmentation for the canonical schema
###############################################################################


def _rfm_from_canonical(df: pd.DataFrame, cfg: RFMConfig) -> pd.DataFrame:
    if df.empty:
        logger.warning("RFM requested on empty dataset.")
        return pd.DataFrame(columns=["customer_id", "Recency", "Frequency", "Monetary", "Segment"])

    df = df.copy()
    df[cfg.date_col] = pd.to_datetime(df[cfg.date_col], errors="coerce")
    df = df.dropna(subset=[cfg.customer_col, cfg.order_col, cfg.date_col])

    if df.empty:
        logger.warning("No valid rows after datetime conversion for RFM.")
        return pd.DataFrame(columns=["customer_id", "Recency", "Frequency", "Monetary", "Segment"])

    as_of = cfg.as_of or (pd.to_datetime(df[cfg.date_col].max()) + pd.Timedelta(days=1))

    grouped = (
        df.groupby(cfg.customer_col, as_index=False)
        .agg(
            LastPurchase=(cfg.date_col, "max"),
            Frequency=(cfg.order_col, "nunique"),
            Monetary=(cfg.amount_col, "sum"),
        )
        .rename(columns={cfg.customer_col: "customer_id"})
    )

    grouped["Recency"] = (as_of - grouped["LastPurchase"]).dt.days.astype(int)
    grouped = grouped.drop(columns=["LastPurchase"])

    # Simple RFM-based segmentation
    def segment_row(r) -> str:
        rec, freq, mon = int(r["Recency"]), float(r["Frequency"]), float(r["Monetary"])
        if rec <= 30 and freq >= 5 and mon >= df[cfg.amount_col].quantile(0.75):
            return "Champions"
        if rec <= 90 and freq >= 3:
            return "Loyal"
        if rec > 180 and (freq >= 2 or mon >= df[cfg.amount_col].quantile(0.5)):
            return "At Risk"
        if rec > 365 and freq <= 1:
            return "Lost"
        return "Loyal" if freq >= 2 else "New"

    grouped["Segment"] = grouped.apply(segment_row, axis=1)
    return grouped


def update_rfm_segments(
    tx_df: pd.DataFrame,
    rfm_cfg: Optional[RFMConfig] = None,
) -> pd.DataFrame:
    """
    Recalculate RFM metrics and customer segments for a canonical dataframe
    with columns: customer_id, order_id, order_date, amount.

    - Returns the RFM dataframe
    - Optionally writes it to CSV when output_csv_path is provided.
    """
    if rfm_cfg is None:
        rfm_cfg = RFMConfig()

    rfm = _rfm_from_canonical(tx_df, rfm_cfg)
    if rfm_cfg.output_csv_path:
        try:
            rfm.to_csv(rfm_cfg.output_csv_path, index=False)
            logger.info("RFM segments written to %s (%d rows)", rfm_cfg.output_csv_path, len(rfm))
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to write RFM CSV: %s", exc, exc_info=True)
    return rfm


###############################################################################
# 4. Scheduler / background processing
###############################################################################


def _scheduler_loop(
    interval_seconds: int,
    fetch_cfg: FetchConfig,
    rfm_cfg: RFMConfig,
    stop_flag: threading.Event,
    on_update: Optional[Callable[[pd.DataFrame, pd.DataFrame], None]] = None,
) -> None:
    """
    Internal loop that periodically fetches transactions, updates RFM,
    and logs all successes/errors. Designed to run in a background thread.
    """
    logger.info("Starting backend scheduler loop with interval=%ss", interval_seconds)
    while not stop_flag.is_set():
        try:
            tx = fetch_transactions(fetch_cfg)
            if tx.empty:
                logger.warning("Scheduler tick: fetched empty transactions dataset.")
            else:
                converted, _ = validate_and_convert_csv(tx.to_csv(index=False).encode("utf-8"))
                rfm = update_rfm_segments(converted, rfm_cfg)
                logger.info(
                    "Scheduler tick: updated RFM for %d customers from %d transactions",
                    len(rfm),
                    len(converted),
                )
                if on_update is not None:
                    try:
                        on_update(converted, rfm)
                    except Exception as cb_exc:  # noqa: BLE001
                        logger.error("on_update callback failed: %s", cb_exc, exc_info=True)
        except Exception as exc:  # noqa: BLE001
            logger.error("Scheduler tick failed: %s", exc, exc_info=True)

        stop_flag.wait(interval_seconds)

    logger.info("Backend scheduler loop stopped.")


def run_scheduler(
    interval_seconds: int = 600,
    fetch_cfg: Optional[FetchConfig] = None,
    rfm_cfg: Optional[RFMConfig] = None,
    on_update: Optional[Callable[[pd.DataFrame, pd.DataFrame], None]] = None,
) -> threading.Event:
    """
    Start a background scheduler that:
    - periodically fetches live transactions
    - converts them into canonical CSV format
    - recomputes RFM & segments
    - writes updated RFM to CSV
    - optionally calls an on_update(tx_df, rfm_df) callback

    Returns:
        A threading.Event that can be set() to stop the scheduler loop.
    """
    if fetch_cfg is None:
        fetch_cfg = FetchConfig()
    if rfm_cfg is None:
        rfm_cfg = RFMConfig()

    stop_flag = threading.Event()
    thread = threading.Thread(
        target=_scheduler_loop,
        args=(interval_seconds, fetch_cfg, rfm_cfg, stop_flag, on_update),
        name="RetailBackendScheduler",
        daemon=True,
    )
    thread.start()
    logger.info("Scheduler thread started (interval=%ss).", interval_seconds)
    return stop_flag


__all__ = [
    "FetchConfig",
    "RFMConfig",
    "fetch_transactions",
    "validate_and_convert_csv",
    "update_rfm_segments",
    "run_scheduler",
]

