import express from "express";
import axios from "axios";

const router = express.Router();
const aiServiceUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function buildLocalFraudDetection(transactions) {
  const numericAmounts = transactions.map((t) => Number(t.amount)).filter((v) => Number.isFinite(v));
  const baseline = median(numericAmounts) || 1;

  const scored = transactions.map((transaction) => {
    const description = String(transaction.description || "");
    const amount = Number(transaction.amount);
    const text = description.toLowerCase();

    let score = 0.08;
    const reasons = [];

    if (amount > baseline * 3) {
      score += 0.35;
      reasons.push("amount is much higher than your typical transaction");
    }

    if (amount >= 1000) {
      score += 0.25;
      reasons.push("high absolute amount");
    }

    if (/crypto|gift card|wire|luxury|casino|bet|forex|wallet/.test(text)) {
      score += 0.28;
      reasons.push("merchant category is commonly targeted in fraud");
    }

    if (/international|overseas|unknown|atm withdrawal/.test(text)) {
      score += 0.2;
      reasons.push("transaction pattern is unusual");
    }

    score = Math.min(0.99, Number(score.toFixed(2)));
    const isSuspicious = score >= 0.55;

    return {
      description,
      amount,
      date: transaction.date,
      score,
      risk_level: score >= 0.75 ? "high" : score >= 0.55 ? "medium" : "low",
      is_suspicious: isSuspicious,
      reason: reasons.length ? reasons.join("; ") : "normal transaction profile",
    };
  });

  const suspicious = scored.filter((item) => item.is_suspicious);
  const averageScore = scored.length
    ? scored.reduce((sum, item) => sum + item.score, 0) / scored.length
    : 0;

  return {
    scored,
    suspicious_transactions: suspicious,
    suspiciousCount: suspicious.length,
    summary: {
      total_analyzed: transactions.length,
      suspicious_count: suspicious.length,
      overall_risk: averageScore >= 0.65 ? "high" : averageScore >= 0.45 ? "medium" : "low",
    },
  };
}

router.post("/detect", async (req, res) => {
  try {
    const transactions = Array.isArray(req.body?.transactions) ? req.body.transactions : [];
    
    try {
      const { data } = await axios.post(
        `${aiServiceUrl}/detect-fraud`,
        { transactions },
        { timeout: 5000 }
      );
      const suspiciousCount = Number(data?.suspiciousCount ?? data?.suspicious_count ?? data?.summary?.suspicious_count ?? 0);
      res.json({ ...data, suspiciousCount, source: "ai" });
    } catch (aiError) {
      const localData = buildLocalFraudDetection(transactions);
      res.json({ ...localData, source: "local" });
    }
  } catch (error) {
    res.status(500).json({ error: "Fraud detection failed", detail: error.message });
  }
});

export default router;
