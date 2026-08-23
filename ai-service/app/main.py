from typing import List, Optional

import numpy as np
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression


app = FastAPI(title="TrendWise AI Service", version="1.0.0")


class PredictPayload(BaseModel):
    stock: str = "AAPL"
    prices: List[float] = []


class Transaction(BaseModel):
    description: str
    amount: float
    date: Optional[str] = None


class TransactionPayload(BaseModel):
    transactions: List[Transaction]


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-service"}


@app.post("/predict")
def predict_stock(payload: PredictPayload):
    prices = payload.prices

    if len(prices) < 2:
        # Fetch fallback data if user did not provide enough history.
        df = yf.download(payload.stock, period="6mo", interval="1d", progress=False)
        closes = df["Close"].dropna().tolist() if "Close" in df else []
        prices = [float(x) for x in closes[-60:]]

    if len(prices) < 2:
        raise HTTPException(status_code=400, detail="Not enough price data for prediction")

    values = np.array(prices, dtype=float)
    x_train = np.arange(1, len(values) + 1).reshape(-1, 1)

    model = LinearRegression()
    model.fit(x_train, values)

    next_day = np.array([[len(values) + 1]])
    predicted_price = float(model.predict(next_day)[0])

    return {
        "stock": payload.stock.upper(),
        "predicted_price": round(predicted_price, 2),
        "history": [round(float(v), 2) for v in values.tolist()],
        "model": "LinearRegression",
    }


def classify_expense(description: str) -> str:
    lowered = description.lower()
    keyword_map = {
        "Food": ["food", "cafe", "restaurant", "swiggy", "zomato", "grocery"],
        "Travel": ["uber", "ola", "train", "flight", "hotel", "taxi"],
        "Bills": ["electric", "water", "rent", "internet", "bill", "utility"],
        "Shopping": ["amazon", "flipkart", "mall", "store", "purchase"],
    }

    for category, words in keyword_map.items():
        if any(word in lowered for word in words):
            return category
    return "Other"


@app.post("/categorize-expenses")
def categorize_expenses(payload: TransactionPayload):
    if not payload.transactions:
        raise HTTPException(status_code=400, detail="transactions are required")

    response = {}
    totals = {}

    for tx in payload.transactions:
        category = classify_expense(tx.description)
        response[tx.description] = category
        totals[category] = round(totals.get(category, 0.0) + tx.amount, 2)

    return {"categories": response, "totals": totals}


@app.post("/detect-fraud")
def detect_fraud(payload: TransactionPayload):
    if not payload.transactions:
        raise HTTPException(status_code=400, detail="transactions are required")

    frame = pd.DataFrame([tx.model_dump() for tx in payload.transactions])
    frame["amount"] = frame["amount"].astype(float)

    if len(frame) < 3:
        return {
            "suspicious_count": 0,
            "scored": [
                {
                    "description": row["description"],
                    "amount": float(row["amount"]),
                    "score": 0.0,
                    "suspicious": False,
                }
                for _, row in frame.iterrows()
            ],
        }

    model = IsolationForest(contamination=0.15, random_state=42)
    model.fit(frame[["amount"]])
    decision = model.decision_function(frame[["amount"]])
    labels = model.predict(frame[["amount"]])

    scored = []
    for idx, row in frame.iterrows():
        risk = float(round(-decision[idx], 4))
        suspicious = bool(labels[idx] == -1)
        scored.append(
            {
                "description": row["description"],
                "amount": float(row["amount"]),
                "score": risk,
                "suspicious": suspicious,
            }
        )

    suspicious_count = sum(1 for entry in scored if entry["suspicious"])
    return {"suspicious_count": suspicious_count, "scored": scored}
