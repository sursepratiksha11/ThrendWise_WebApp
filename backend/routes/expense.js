import express from "express";
import axios from "axios";

const router = express.Router();
const aiServiceUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

function inferCategory(description, amount) {
  const text = String(description || "").toLowerCase();

  if (/rent|mortgage|landlord|lease|apartment/.test(text)) return "Housing";
  if (/uber|ola|taxi|metro|fuel|petrol|diesel|bus|train/.test(text)) return "Transport";
  if (/grocery|supermarket|cafe|coffee|restaurant|food|swiggy|zomato/.test(text)) return "Food";
  if (/electric|water|internet|mobile|wifi|utility|gas/.test(text)) return "Utilities";
  if (/doctor|hospital|pharmacy|medical|clinic|health/.test(text)) return "Health";
  if (/netflix|spotify|movie|cinema|game|entertainment/.test(text)) return "Entertainment";
  if (/amazon|flipkart|myntra|shopping|store/.test(text)) return "Shopping";

  if (amount >= 1000) return "Housing";
  if (amount >= 200) return "Shopping";
  return "Other";
}

function confidenceForCategory(description, category) {
  const text = String(description || "").toLowerCase();
  if (category === "Other") return 0.62;
  const keywordHits = {
    Housing: /rent|mortgage|landlord|lease|apartment/.test(text),
    Transport: /uber|ola|taxi|metro|fuel|petrol|diesel|bus|train/.test(text),
    Food: /grocery|supermarket|cafe|coffee|restaurant|food|swiggy|zomato/.test(text),
    Utilities: /electric|water|internet|mobile|wifi|utility|gas/.test(text),
    Health: /doctor|hospital|pharmacy|medical|clinic|health/.test(text),
    Entertainment: /netflix|spotify|movie|cinema|game|entertainment/.test(text),
    Shopping: /amazon|flipkart|myntra|shopping|store/.test(text),
  };

  return keywordHits[category] ? 0.92 : 0.74;
}

const buildLocalCategorization = (transactions) => {
  const totals = {};

  const categorized = transactions.map((transaction) => {
    const amount = Number(transaction.amount);
    const category = inferCategory(transaction.description, amount);
    totals[category] = (totals[category] || 0) + amount;

    return {
      description: transaction.description,
      amount,
      date: transaction.date,
      category,
      confidence: confidenceForCategory(transaction.description, category),
    };
  });

  const categoriesDetected = [...new Set(categorized.map((item) => item.category))];

  return {
    categorized,
    totals,
    summary: {
      total_categorized: transactions.length,
      categories_detected: categoriesDetected,
    },
  };
};

router.post("/categorize", async (req, res) => {
  try {
    const transactions = Array.isArray(req.body?.transactions) ? req.body.transactions : [];
    
    if (!transactions || transactions.length === 0) {
      return res.status(400).json({ error: "No transactions provided" });
    }

    try {
      const { data } = await axios.post(
        `${aiServiceUrl}/categorize-expenses`,
        { transactions },
        { timeout: 5000 }
      );
      
      if (!data) {
        return res.status(500).json({ error: "Empty response from AI service" });
      }
      
      res.json(data);
    } catch (aiError) {
      const localData = buildLocalCategorization(transactions);
      res.json({ ...localData, source: "local" });
    }
  } catch (error) {
    console.error("Expense categorization error:", error.message);
    res.status(500).json({ error: "Expense categorization failed", detail: error.message });
  }
});

export default router;
