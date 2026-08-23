const CATEGORY_KEYWORDS = {
  Food: ["restaurant", "cafe", "coffee", "food", "grocery", "uber eats", "zomato"],
  Travel: ["flight", "air", "train", "bus", "taxi", "uber", "lyft", "hotel"],
  Shopping: ["amazon", "flipkart", "mall", "store", "shopping", "clothes", "electronics"],
  Bills: ["electric", "water", "internet", "rent", "phone", "bill", "utility", "emi"]
};
function linearRegression(values) {
  const n = values.length;
  const xs = values.map((_, i) => i + 1);
  const sumX = xs.reduce((acc, x) => acc + x, 0);
  const sumY = values.reduce((acc, y) => acc + y, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * values[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) {
    return { slope: 0, intercept: values[values.length - 1] ?? 0 };
  }
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}
function predictTrend(values, horizon) {
  if (values.length < 2) {
    throw new Error("Need at least two data points for prediction");
  }
  const { slope, intercept } = linearRegression(values);
  const history = values.map((actual, idx) => {
    const x = idx + 1;
    return {
      x,
      actual,
      predicted: intercept + slope * x
    };
  });
  const forecast = Array.from({ length: Math.max(1, horizon) }, (_, i) => {
    const x = values.length + i + 1;
    return {
      x,
      predicted: intercept + slope * x
    };
  });
  return {
    model: "Linear Regression",
    slope,
    intercept,
    history,
    forecast
  };
}
function normalizeDescription(description) {
  return description.trim().toLowerCase();
}
function categorizeTransaction(description) {
  const normalized = normalizeDescription(description);
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }
  return "Other";
}
function categorizeExpenses(transactions) {
  const categorized = transactions.map((tx) => ({
    ...tx,
    category: categorizeTransaction(tx.description)
  }));
  const totals = categorized.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount;
    return acc;
  }, {});
  return { categorized, totals };
}
function detectFraud(transactions) {
  if (transactions.length < 3) {
    return transactions.map((tx) => ({ ...tx, score: 0, suspicious: false }));
  }
  const amounts = transactions.map((tx) => tx.amount);
  const mean = amounts.reduce((acc, value) => acc + value, 0) / amounts.length;
  const variance = amounts.reduce((acc, value) => acc + (value - mean) ** 2, 0) / amounts.length;
  const stdDev = Math.sqrt(variance) || 1;
  return transactions.map((tx) => {
    const zScore = Math.abs((tx.amount - mean) / stdDev);
    const dailyBurst = tx.date !== void 0 ? transactions.filter((other) => other.date === tx.date).length > 4 : false;
    const score = Number((zScore + (dailyBurst ? 1 : 0)).toFixed(2));
    return {
      ...tx,
      score,
      suspicious: score >= 2.5
    };
  });
}
export {
  categorizeExpenses,
  categorizeTransaction,
  detectFraud,
  predictTrend
};
