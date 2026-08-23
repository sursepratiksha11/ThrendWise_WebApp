import express from "express";
import axios from "axios";

const router = express.Router();
const aiServiceUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

async function fetchRecentCloses(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=3mo&interval=1d`;
  const { data } = await axios.get(url, { timeout: 6000 });

  const result = data?.chart?.result?.[0];
  const closes = result?.indicators?.quote?.[0]?.close || [];
  return closes.filter((value) => Number.isFinite(Number(value))).map(Number);
}

function linearRegressionPredict(values, horizon = 5) {
  const series = values.filter((value) => Number.isFinite(value));
  if (series.length < 2) {
    const last = Number(series[series.length - 1] ?? 0);
    return Array.from({ length: horizon }, (_, idx) => Number((last + idx * 0.25).toFixed(2)));
  }

  const n = series.length;
  const xMean = (n - 1) / 2;
  const yMean = series.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i += 1) {
    const dx = i - xMean;
    numerator += dx * (series[i] - yMean);
    denominator += dx * dx;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  const predicted = Array.from({ length: horizon }, (_, idx) => {
    const x = n + idx;
    const y = intercept + slope * x;
    return Number(Math.max(0.01, y).toFixed(2));
  });

  return predicted;
}

function buildLocalPrediction(stock, prices, horizon, source) {
  const cleaned = prices.filter((value) => Number.isFinite(value));
  const predictedPrices = linearRegressionPredict(cleaned, horizon);
  const last = cleaned[cleaned.length - 1] ?? predictedPrices[0] ?? 0;
  const firstPrediction = predictedPrices[0] ?? last;

  const trendDirection = firstPrediction >= last ? "upward" : "downward";
  const confidence = cleaned.length >= 20 ? 0.86 : cleaned.length >= 8 ? 0.78 : 0.68;

  return {
    stock,
    history: cleaned,
    predicted_price: firstPrediction,
    predicted_prices: predictedPrices,
    forecast: predictedPrices.map((value, idx) => ({ x: cleaned.length + idx + 1, predicted: value })),
    confidence,
    trend_direction: trendDirection,
    model: "LocalLinearRegression",
    source,
  };
}

router.post("/", async (req, res) => {
  try {
    const { stock, prices, horizon } = req.body;

    const symbol = String(stock || "AAPL").toUpperCase();
    const requestedHorizon = Number.isFinite(Number(horizon)) ? Math.max(1, Math.min(15, Number(horizon))) : 5;
    const inputPrices = Array.isArray(prices) ? prices.map(Number).filter((value) => Number.isFinite(value)) : [];

    let enrichedPrices = [...inputPrices];
    try {
      const liveCloses = await fetchRecentCloses(symbol);
      if (liveCloses.length > 0) {
        if (enrichedPrices.length >= 4) {
          const latestClose = liveCloses[liveCloses.length - 1];
          const lastInput = enrichedPrices[enrichedPrices.length - 1];
          if (!Number.isFinite(lastInput) || Math.abs(lastInput - latestClose) / Math.max(1, Math.abs(latestClose)) > 0.002) {
            enrichedPrices.push(latestClose);
          }
        } else {
          enrichedPrices = liveCloses.slice(-30);
        }
      }
    } catch {
      // Keep deterministic local prediction with provided input when live price fetch is unavailable.
    }

    const payload = {
      stock: symbol,
      prices: enrichedPrices,
      horizon: requestedHorizon,
    };

    try {
      // Try to call AI service
      const { data } = await axios.post(`${aiServiceUrl}/predict`, payload, {
        timeout: 5000,
      });
      const aiHistory = Array.isArray(data?.history) ? data.history : enrichedPrices;
      const aiPredicted = Number(data?.predicted_price ?? data?.predicted_prices?.[0]);

      res.json({
        ...data,
        stock: symbol,
        history: aiHistory,
        predicted_price: Number.isFinite(aiPredicted) ? aiPredicted : (aiHistory[aiHistory.length - 1] ?? 0),
        model: String(data?.model || "AIServiceModel"),
        source: "ai",
      });
    } catch (aiError) {
      const local = buildLocalPrediction(symbol, enrichedPrices, requestedHorizon, "local");
      res.json(local);
    }
  } catch (error) {
    res.status(500).json({ error: "Prediction service failed", detail: error.message });
  }
});

export default router;
