from __future__ import annotations

import io
import sqlite3
from typing import Optional

import pandas as pd
import plotly.express as px
import requests
import streamlit as st

from data_generator import SyntheticConfig, generate_synthetic_transactions
from recommender import RecommendationConfig, recommend_products
from utils import (
    DataValidationError,
    REQUIRED_COLUMNS,
    build_pipeline,
    infer_column_mapping,
)

try:
    # Optional: real-time auto-refresh helper
    from streamlit_autorefresh import st_autorefresh
except Exception:  # pragma: no cover - optional dependency
    st_autorefresh = None


st.set_page_config(
    page_title="Real-Time Customer Segmentation & Recommendations",
    page_icon="📈",
    layout="wide",
)


def _kpi_card(label: str, value: str, help_text: Optional[str] = None) -> None:
    with st.container():
        st.caption(label)
        st.subheader(value)
        if help_text:
            st.caption(help_text)


def _download_csv_button(df: pd.DataFrame, filename: str, label: str) -> None:
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    st.download_button(
        label=label,
        data=buf.getvalue().encode("utf-8"),
        file_name=filename,
        mime="text/csv",
        use_container_width=True,
    )


@st.cache_data(show_spinner=False)
def _read_csv(file_bytes: bytes) -> pd.DataFrame:
    return pd.read_csv(io.BytesIO(file_bytes), encoding_errors="ignore")


def fetch_transactions(
    mode: str,
    csv_url: Optional[str] = None,
    api_url: Optional[str] = None,
    db_path: Optional[str] = None,
    db_query: Optional[str] = None,
) -> Optional[pd.DataFrame]:
    """
    Fetch transactions from an external, potentially real-time source.

    - mode="remote_csv": csv_url expected to point to a CSV (e.g. Google Sheets export)
    - mode="api": api_url expected to return JSON or CSV text
    - mode="sqlite": db_path + db_query used to run a SQL query
    """
    try:
        if mode == "remote_csv" and csv_url:
            resp = requests.get(csv_url, timeout=10)
            resp.raise_for_status()
            return pd.read_csv(io.StringIO(resp.text), encoding_errors="ignore")

        if mode == "api" and api_url:
            resp = requests.get(api_url, timeout=10)
            resp.raise_for_status()
            ctype = resp.headers.get("content-type", "").lower()
            if "json" in ctype:
                data = resp.json()
                return pd.DataFrame(data)
            return pd.read_csv(io.StringIO(resp.text), encoding_errors="ignore")

        if mode == "sqlite" and db_path and db_query:
            conn = sqlite3.connect(db_path)
            try:
                return pd.read_sql_query(db_query, conn)
            finally:
                conn.close()
    except Exception as exc:
        st.error(f"Failed to fetch live transactions: {exc}")
        return None

    return None


def _ensure_state() -> None:
    if "df_raw" not in st.session_state:
        st.session_state.df_raw = None
    if "df_live" not in st.session_state:
        st.session_state.df_live = None
    if "column_mapping" not in st.session_state:
        st.session_state.column_mapping = None
    if "products_df" not in st.session_state:
        st.session_state.products_df = None
    if "last_model_update" not in st.session_state:
        st.session_state.last_model_update = None
    if "artifacts_cache" not in st.session_state:
        st.session_state.artifacts_cache = None


def _empty_state() -> None:
    st.info("Upload a CSV or generate synthetic data in the sidebar to begin.")
    st.markdown(
        """
**Expected columns**
- CustomerID, InvoiceNo, InvoiceDate, StockCode, Description, Quantity, UnitPrice

**What this app will do**
- Clean transactions and compute RFM + scores (R fixed buckets, F/M percentiles)
- Classify customers into segments (Champions, Loyal, At Risk, etc.)
- Recommend products using segment affinity + customer history + optional cross-sell
"""
    )


_ensure_state()

with st.sidebar:
    st.title("Retail Analytics")
    page = st.radio("Navigation", ["Dashboard", "Segmentation", "Insights", "Simulator"], index=0)

    st.divider()
    st.subheader("Data Source")
    mode = st.radio("Base data", ["Upload CSV", "Use synthetic test data"], index=0)
    st.caption("Required columns: " + ", ".join(REQUIRED_COLUMNS))

    upload = None
    if mode == "Upload CSV":
        upload = st.file_uploader("Upload retail transactions CSV", type=["csv"])
        if upload is not None:
            file_bytes = upload.getvalue()
            if not file_bytes:
                st.error("The uploaded file is empty. Please upload a valid CSV.")
            else:
                st.session_state.df_raw = _read_csv(file_bytes)
                st.session_state.df_live = st.session_state.df_raw.copy()
    else:
        with st.expander("Synthetic data settings", expanded=True):
            customers = st.slider("Customers", 50, 5000, 500, 50)
            products = st.slider("Products", 30, 500, 120, 10)
            days = st.slider("History days", 30, 730, 365, 15)
            avg_inv = st.slider("Avg invoices/customer", 1.0, 20.0, 6.0, 0.5)
            seed = st.number_input("Seed", value=42, step=1)
        if st.button("Generate synthetic dataset", use_container_width=True):
            cfg = SyntheticConfig(
                customers=int(customers),
                products=int(products),
                days=int(days),
                avg_invoices_per_customer=float(avg_inv),
                seed=int(seed),
            )
            st.session_state.df_raw = generate_synthetic_transactions(cfg)
            st.session_state.df_live = st.session_state.df_raw.copy()

        if st.session_state.df_raw is not None and not st.session_state.df_raw.empty:
            _download_csv_button(st.session_state.df_raw, "synthetic_transactions.csv", "Download synthetic CSV")

    # Column mapping UI (flexible schema)
    if st.session_state.df_raw is not None and not st.session_state.df_raw.empty:
        st.subheader("Column mapping")
        inferred = infer_column_mapping(st.session_state.df_raw)
        if st.session_state.column_mapping is None:
            st.session_state.column_mapping = inferred

        cols = list(st.session_state.df_raw.columns)
        with st.expander("Map your columns → internal schema", expanded=False):
            new_mapping: dict[str, Optional[str]] = {}
            for internal in REQUIRED_COLUMNS:
                default = st.session_state.column_mapping.get(internal) or inferred.get(internal)
                label = f"{internal} column"
                options = ["<None>"] + cols
                idx = 0
                if default in cols:
                    idx = options.index(default)
                chosen = st.selectbox(label, options=options, index=idx, key=f"map_{internal}")
                new_mapping[internal] = None if chosen == "<None>" else chosen
            st.session_state.column_mapping = new_mapping
            st.caption("If a required field is unmapped, processing will show a clear error.")

    st.divider()
    st.subheader("Product data (optional)")
    prod_upload = st.file_uploader("Upload products.csv", type=["csv"], key="prod_upload")
    if prod_upload is not None:
        try:
            pdf = _read_csv(prod_upload.getvalue())
            # Try to standardize to StockCode, Description, Category, UnitPrice
            cols = {c.lower(): c for c in pdf.columns}
            stock = cols.get("stockcode") or cols.get("product_id") or cols.get("sku")
            name = cols.get("product_name") or cols.get("description") or cols.get("name")
            cat = cols.get("category")
            price = cols.get("price") or cols.get("unitprice")
            if not stock or not name or not price:
                st.warning("products.csv should contain stock/product id, name/description, and price columns.")
            else:
                prod_std = pdf.rename(
                    columns={
                        stock: "StockCode",
                        name: "Description",
                        price: "UnitPrice",
                        (cat or "Category"): "Category",
                    }
                )
                if "Category" not in prod_std.columns:
                    prod_std["Category"] = "Unknown"
                st.session_state.products_df = prod_std[["StockCode", "Description", "Category", "UnitPrice"]]
                st.success("Product catalog loaded.")
        except Exception as e:
            st.error("Failed to read products.csv")
            st.exception(e)

    st.divider()
    st.subheader("Live source (optional)")
    live_mode = st.selectbox(
        "Attach real-time source",
        ["None", "Remote CSV / Google Sheets", "HTTP API", "SQLite database"],
        index=0,
    )
    csv_url = api_url = db_path = db_query = None
    if live_mode == "Remote CSV / Google Sheets":
        csv_url = st.text_input("CSV URL (public or with access)", value="", key="live_csv_url")
    elif live_mode == "HTTP API":
        api_url = st.text_input("API URL (JSON or CSV)", value="", key="live_api_url")
    elif live_mode == "SQLite database":
        db_path = st.text_input("SQLite path (e.g. data.db)", value="transactions.db", key="live_db_path")
        db_query = st.text_area(
            "SQL query",
            value="SELECT * FROM transactions",
            height=80,
            key="live_db_query",
        )

    st.subheader("Auto refresh")
    auto_refresh = st.checkbox("Enable auto refresh", value=False)
    refresh_secs = st.slider("Refresh interval (seconds)", 5, 30, 10, 1)
    if auto_refresh and st_autorefresh is not None:
        st_autorefresh(interval=refresh_secs * 1000, key="auto_refresh_timer")

    st.divider()
    st.subheader("RFM Options")
    months = st.slider("Time window (months)", min_value=1, max_value=36, value=12, step=1)

    st.subheader("Recommendation Options")
    enable_cross_sell = st.checkbox("Enable cross-sell (co-purchase)", value=True)

    st.divider()
    if st.session_state.df_live is not None and st.button("Reset live session to raw", use_container_width=True):
        st.session_state.df_live = st.session_state.df_raw.copy()


if st.session_state.df_live is None or st.session_state.df_live.empty:
    _empty_state()
    st.stop()

try:
    # Optionally override session data with a live source on each run
    live_source_mode = None
    if live_mode == "Remote CSV / Google Sheets":
        live_source_mode = "remote_csv"
    elif live_mode == "HTTP API":
        live_source_mode = "api"
    elif live_mode == "SQLite database":
        live_source_mode = "sqlite"

    if live_source_mode is not None:
        live_df = fetch_transactions(
            mode=live_source_mode,
            csv_url=csv_url,
            api_url=api_url,
            db_path=db_path,
            db_query=db_query,
        )
        if live_df is not None and not live_df.empty:
            st.session_state.df_live = live_df
        elif live_df is not None and live_df.empty:
            st.warning("Live source returned no rows. Falling back to current session data.")

    # Lightweight "scheduler": refresh model artifacts at most every 10 minutes
    import datetime as _dt

    now = _dt.datetime.utcnow()
    need_rebuild = (
        st.session_state.artifacts_cache is None
        or st.session_state.last_model_update is None
        or (now - st.session_state.last_model_update).total_seconds() > 600
    )

    if need_rebuild:
        artifacts = build_pipeline(
            st.session_state.df_live,
            months=int(months),
            top_n_affinity=15,
            column_mapping=st.session_state.column_mapping,
            products_df=st.session_state.products_df,
        )
        st.session_state.artifacts_cache = artifacts
        st.session_state.last_model_update = now
    else:
        artifacts = st.session_state.artifacts_cache
except DataValidationError as e:
    st.error(str(e))
    st.stop()
except Exception as e:
    st.error("Something went wrong while processing the data.")
    st.exception(e)
    st.stop()


tx = artifacts.transactions
rfm = artifacts.rfm

segment_filter = st.sidebar.multiselect(
    "Filter by Segment",
    options=sorted(rfm["Segment"].unique().tolist()),
    default=sorted(rfm["Segment"].unique().tolist()),
)
rfm_view = rfm.loc[rfm["Segment"].isin(segment_filter)].copy()


if page == "Dashboard":
    st.header("Dashboard")

    total_customers = int(rfm_view["CustomerID"].nunique())
    avg_spend = float(rfm_view["Monetary"].mean()) if not rfm_view.empty else 0.0
    avg_freq = float(rfm_view["Frequency"].mean()) if not rfm_view.empty else 0.0

    c1, c2, c3 = st.columns(3)
    with c1:
        _kpi_card("Total Customers", f"{total_customers:,}")
    with c2:
        _kpi_card("Avg Spend", f"{avg_spend:,.2f}")
    with c3:
        _kpi_card("Avg Frequency", f"{avg_freq:,.2f}")

    st.subheader("Segment distribution")
    left, right = st.columns([2, 1])
    with left:
        seg_counts = rfm_view["Segment"].value_counts().reset_index()
        seg_counts.columns = ["Segment", "Customers"]
        fig = px.bar(seg_counts, x="Segment", y="Customers", color="Segment", text="Customers")
        fig.update_layout(height=420, legend_title_text="Segment")
        st.plotly_chart(fig, use_container_width=True)
    with right:
        st.caption("Avg basket metrics (by segment)")
        if not artifacts.segment_stats.empty:
            st.dataframe(artifacts.segment_stats, use_container_width=True)

    st.subheader("Download")
    _download_csv_button(rfm, "segmented_customers.csv", "Download segmented customers (CSV)")
    _download_csv_button(tx, "cleaned_transactions.csv", "Download cleaned transactions (CSV)")


elif page == "Segmentation":
    st.header("Segmentation")
    st.caption("RFM scatter plot: Recency vs Monetary (colored by segment).")

    hover_cols = ["CustomerID", "Frequency", "Recency", "Monetary", "R_Score", "F_Score", "M_Score", "Segment"]
    fig = px.scatter(
        rfm_view,
        x="Recency",
        y="Monetary",
        color="Segment",
        hover_data=hover_cols,
        size="Frequency",
        size_max=30,
    )
    fig.update_layout(height=560, legend_title_text="Segment")
    st.plotly_chart(fig, use_container_width=True)

    st.subheader("Top products by segment")
    segs = sorted(list(artifacts.segment_top_products.keys()))
    seg_choice = st.selectbox("Select segment", segs, index=0 if segs else 0)
    if seg_choice:
        st.dataframe(
            artifacts.segment_top_products[seg_choice][["ProductLabel", "purchase_count", "monetary", "score"]],
            use_container_width=True,
        )


elif page == "Insights":
    st.header("Insights")

    left, right = st.columns([1, 2])
    with left:
        st.subheader("Segment distribution")
        seg_counts = rfm_view["Segment"].value_counts().reset_index()
        seg_counts.columns = ["Segment", "Customers"]
        fig = px.pie(seg_counts, names="Segment", values="Customers", hole=0.45)
        fig.update_traces(textinfo="percent+label")
        fig.update_layout(height=420)
        st.plotly_chart(fig, use_container_width=True)

    with right:
        st.subheader("RFM by segment")
        melted = rfm_view.melt(
            id_vars=["CustomerID", "Segment"],
            value_vars=["Recency", "Frequency", "Monetary"],
            var_name="Metric",
            value_name="Value",
        )
        fig2 = px.box(melted, x="Metric", y="Value", color="Segment", points="outliers")
        fig2.update_layout(height=420)
        st.plotly_chart(fig2, use_container_width=True)

    st.subheader("Top categories per segment")
    segs = sorted(list(artifacts.segment_top_categories.keys()))
    seg_choice = st.selectbox("Segment (categories)", segs, index=0 if segs else 0)
    if seg_choice:
        st.dataframe(
            artifacts.segment_top_categories[seg_choice][["Category", "purchase_count", "monetary", "score"]],
            use_container_width=True,
        )


else:
    st.header("Live Customer Simulator")
    st.caption("Select a customer, view RFM/segment, then simulate a new purchase to see changes instantly.")

    customer_ids = rfm_view["CustomerID"].sort_values().astype(int).tolist()
    if not customer_ids:
        st.warning("No customers match the current segment filter.")
        st.stop()

    selected = st.selectbox("Select CustomerID", options=customer_ids, index=0)

    cust = rfm.loc[rfm["CustomerID"] == int(selected)].iloc[0]
    seg = str(cust["Segment"])

    c1, c2, c3, c4 = st.columns(4)
    with c1:
        _kpi_card("Segment", seg)
    with c2:
        _kpi_card("Recency (days)", str(int(cust["Recency"])))
    with c3:
        _kpi_card("Frequency", str(int(cust["Frequency"])))
    with c4:
        _kpi_card("Monetary", f"{float(cust['Monetary']):,.2f}")

    # Customer alerts based on segment
    if seg.lower() == "at risk":
        st.warning("This customer is At Risk – consider win-back campaigns.")
    elif seg in ("Champions", "High Value", "High Value Customers"):
        st.success("This is a high value customer – prioritize retention and cross-sell.")

    st.subheader("Recommended products")
    rec_cfg = RecommendationConfig(top_n=5, enable_cross_sell=bool(enable_cross_sell))
    recs = recommend_products(
        customer_id=int(selected),
        transactions=tx,
        rfm=rfm,
        segment_top_products=artifacts.segment_top_products,
        cooccurrence=artifacts.cooccurrence,
        cfg=rec_cfg,
    )
    st.dataframe(recs[["ProductLabel", "Category", "score", "reasoning"]], use_container_width=True)

    st.subheader("Simulate a new purchase")
    with st.form("purchase_form"):
        prod_choices = tx.drop_duplicates(subset=["StockCode", "Description"])[
            ["StockCode", "Description", "UnitPrice"]
        ].sort_values("StockCode")
        prod_label = (prod_choices["StockCode"].astype(str) + " — " + prod_choices["Description"].astype(str)).tolist()
        pick = st.selectbox("Product", options=prod_label, index=0)
        qty = st.number_input("Quantity", min_value=1, max_value=100, value=1, step=1)
        price = st.number_input(
            "UnitPrice",
            min_value=0.0,
            value=float(prod_choices["UnitPrice"].iloc[0]) if len(prod_choices) else 0.0,
            step=0.5,
        )
        submitted = st.form_submit_button("Add purchase and recompute", use_container_width=True)

    if submitted:
        stock = pick.split(" — ")[0].strip()
        desc = " — ".join(pick.split(" — ")[1:]).strip()
        new_row = {
            "CustomerID": int(selected),
            "InvoiceNo": "SIM-%s" % pd.Timestamp.utcnow().strftime("%Y%m%d%H%M%S"),
            "InvoiceDate": pd.Timestamp.utcnow(),
            "StockCode": stock,
            "Description": desc,
            "Quantity": int(qty),
            "UnitPrice": float(price),
        }
        st.session_state.df_live = pd.concat([st.session_state.df_live, pd.DataFrame([new_row])], ignore_index=True)
        st.success("Purchase added successfully!")
        try:
            st.toast("Customer data updated")
        except Exception:
            # toast may not exist in very old Streamlit; ignore gracefully
            pass
        st.experimental_rerun()

    st.subheader("Purchase behavior summary")
    cust_tx = tx.loc[tx["CustomerID"] == int(selected)].copy()
    cust_tx["ProductLabel"] = cust_tx["StockCode"].astype(str) + " — " + cust_tx["Description"].astype(str)
    top_bought = (
        cust_tx.groupby("ProductLabel", as_index=False)
        .agg(purchase_count=("InvoiceNo", "count"), monetary=("TotalPrice", "sum"))
        .sort_values(["purchase_count", "monetary"], ascending=False)
        .head(10)
    )

    left, right = st.columns(2)
    with left:
        fig = px.bar(
            top_bought,
            x="purchase_count",
            y="ProductLabel",
            orientation="h",
            title="Top products bought (count)",
        )
        fig.update_layout(height=420, yaxis_title="")
        st.plotly_chart(fig, use_container_width=True)
    with right:
        fig2 = px.bar(
            top_bought,
            x="monetary",
            y="ProductLabel",
            orientation="h",
            title="Top products bought (spend)",
        )
        fig2.update_layout(height=420, yaxis_title="")
        st.plotly_chart(fig2, use_container_width=True)

