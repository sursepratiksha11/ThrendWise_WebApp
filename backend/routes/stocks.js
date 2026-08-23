import express from "express";
import axios from "axios";
import Stock from "../models/Stock.js";

const router = express.Router();

const SYMBOL_ALIASES = {
  TATA: ["TATAMOTORS.NS", "TCS.NS", "TATAPOWER.NS"],
  HDFC: ["HDFCBANK.NS", "HDFCBANK.BO"],
  HDFCBANK: ["HDFCBANK.NS", "HDFCBANK.BO"],
  TATAMOTORS: ["TATAMOTORS.NS"],
  TCS: ["TCS.NS"],
  TATAPOWER: ["TATAPOWER.NS"],
  AMD: ["AMD"],
  NVDA: ["NVDA"],
  AAPL: ["AAPL"],
  MSFT: ["MSFT"]
};

function inferCurrency(symbol) {
  const normalized = String(symbol || "AAPL").trim().toUpperCase();
  return normalized.endsWith(".NS") || normalized.endsWith(".BO") ? "INR" : "USD";
}

function hashSymbol(symbol) {
  return Array.from(String(symbol || "AAPL").trim().toUpperCase()).reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 0);
}

function buildFallbackRows(symbol, basePrice = 100) {
  const seed = hashSymbol(symbol);
  const startPrice = Math.max(1, Number((basePrice + (seed % 500) / 10).toFixed(2)));
  const slope = (((seed >> 3) % 21) - 10) / 25;
  const amplitude = (((seed >> 7) % 9) + 1) / 12;
  const phase = (seed % 360) * (Math.PI / 180);
  const now = Date.now();

  return Array.from({ length: 30 }, (_, index) => {
    const wave = Math.sin(index / 2.8 + phase) * amplitude;
    const trend = slope * index;
    const price = Number(Math.max(1, startPrice + trend + wave).toFixed(2));

    return {
      stockName: symbol.toUpperCase(),
      price,
      date: new Date(now - (29 - index) * 86400000),
    };
  });
}

function buildCandidates(symbol) {
  const normalized = String(symbol || "AAPL").trim().toUpperCase();
  const base = normalized.replace(/\s+/g, "");
  const candidates = [normalized, base];

  if (!base.includes(".")) {
    candidates.push(`${base}.NS`);
    candidates.push(`${base}.BO`);
  }

  const aliasCandidates = SYMBOL_ALIASES[base] || [];
  return [...new Set([...aliasCandidates, ...candidates])];
}

async function fetchYahooSeries(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`;
  const { data } = await axios.get(url, { timeout: 8000 });

  const result = data?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closes = result?.indicators?.quote?.[0]?.close || [];
  const currency = String(result?.meta?.currency || inferCurrency(symbol)).toUpperCase();

  return {
    currency,
    rows: timestamps
      .map((ts, idx) => ({
      stockName: symbol.toUpperCase(),
      price: Number(closes[idx]),
      date: new Date(ts * 1000),
    }))
      .filter((row) => Number.isFinite(row.price))
  };
}

router.get("/:symbol", async (req, res) => {
  try {
    const requestedSymbol = String(req.params.symbol || "AAPL").trim().toUpperCase();
    const candidates = buildCandidates(requestedSymbol);

    let resolvedSymbol = requestedSymbol;
    let rows = [];
    let currency = inferCurrency(requestedSymbol);
    let networkFailure = false;

    for (const candidate of candidates) {
      try {
        const candidateFeed = await fetchYahooSeries(candidate);
        if (candidateFeed.rows.length > 0) {
          rows = candidateFeed.rows;
          currency = candidateFeed.currency;
          resolvedSymbol = candidate;
          break;
        }
      } catch {
        networkFailure = true;
        // Try the next candidate, then fall back to generated data.
      }
    }

    if (!rows.length) {
      if (networkFailure) {
        rows = buildFallbackRows(resolvedSymbol, requestedSymbol.endsWith(".NS") || requestedSymbol.endsWith(".BO") ? 2500 : 100);
        res.json({
          symbol: requestedSymbol,
          resolvedSymbol,
          points: rows,
          currency,
          source: "fallback"
        });
        return;
      }

      res.status(404).json({
        error: `Unknown stock symbol: ${requestedSymbol}`,
        symbol: requestedSymbol,
        resolvedSymbol: requestedSymbol
      });
      return;
    }

    if (rows.length && process.env.MONGODB_URI) {
      try {
        await Stock.deleteMany({ stockName: resolvedSymbol });
        await Stock.insertMany(rows);
      } catch (storageError) {
        console.warn(`Stock cache write skipped for ${resolvedSymbol}:`, storageError.message);
      }
    }

    res.json({
      symbol: requestedSymbol,
      resolvedSymbol,
      points: rows,
      currency,
      source: "live"
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch stock prices",
      detail: error.message
    });
  }
});

export default router;
