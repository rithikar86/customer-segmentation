# Real-Time Customer Segmentation & Recommendation Simulator

Production-style Streamlit app that simulates real-time retail analytics using **RFM** (Recency, Frequency, Monetary),
classifies customers into business segments, and produces personalized product recommendations.

## Features
- **CSV ingestion** with schema validation and friendly errors
- **Synthetic data generator** for demo/testing
- **RFM engine** with configurable time window (default 12 months)
  - Recency scoring: fixed buckets (5→1)
  - Frequency & Monetary: percentile (quintile) scoring
- **Rule-based segmentation**
  - Champions, Loyal Customers, Potential Loyalists, New Customers, At Risk, Hibernating, Lost
- **Product affinity engine**
  - Top products + top categories per segment
  - Basket metrics per segment
  - Product co-occurrence (co-purchase)
- **Recommendation engine**
  - Segment popularity base + customer preference boost + optional cross-sell + explanations
- **Real-time simulator**
  - Add a new purchase → recompute RFM/segment/recommendations instantly

## Required CSV columns
`CustomerID, InvoiceNo, InvoiceDate, StockCode, Description, Quantity, UnitPrice`

## Run
```bash
pip install -r requirements.txt
python -m streamlit run app.py
```

## Project structure
- `app.py` – Streamlit UI + simulator
- `utils.py` – cleaning, RFM, segmentation, affinity, co-occurrence
- `recommender.py` – recommendation logic + reasoning
- `data_generator.py` – synthetic dataset generator

