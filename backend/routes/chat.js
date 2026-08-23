import express from "express";
import axios from "axios";
import OpenAI from "openai";

const router = express.Router();

const ALPHA_VANTAGE_API_KEY = String(process.env.ALPHA_VANTAGE_API_KEY || "").trim();
const AV_CACHE_TTL_MS = 60_000;
const quoteCache = new Map();
const BACKEND_BASE_URL = `http://127.0.0.1:${Number(process.env.PORT || 4000)}`;

const INDIA_LIVE_SYMBOLS = ["RELIANCE.BSE", "TCS.BSE", "SBIN.BSE", "HDFCBANK.BSE", "INFY.BSE"];
const US_LIVE_SYMBOLS = ["AAPL", "MSFT", "NVDA", "AMZN", "TSLA"];
const SYMBOL_LABELS = {
  AAPL: "Apple",
  MSFT: "Microsoft",
  NVDA: "Nvidia",
  AMZN: "Amazon",
  TSLA: "Tesla",
  "RELIANCE.BSE": "Reliance Industries",
  "TCS.BSE": "TCS (Tata Consultancy Services)",
  "SBIN.BSE": "State Bank of India (SBI)",
  "HDFCBANK.BSE": "HDFC Bank",
  "INFY.BSE": "Infosys",
};

function formatChangePercent(value) {
  if (!Number.isFinite(value)) return "n/a";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function isFinanceGuidanceQuestion(question) {
  const normalized = question.toLowerCase();
  if (wantsLiveMarketSnapshot(question)) {
    return false;
  }

  return (
    normalized.includes("asset allocation") ||
    normalized.includes("retirement") ||
    normalized.includes("emergency fund") ||
    normalized.includes("emergency") ||
    normalized.includes("debt") ||
    normalized.includes("loan") ||
    normalized.includes("tax") ||
    normalized.includes("credit score") ||
    normalized.includes("insurance") ||
    normalized.includes("bond") ||
    normalized.includes("fd ") ||
    normalized.includes("fixed deposit") ||
    normalized.includes("recurring deposit") ||
    normalized.includes("sip") ||
    normalized.includes("mutual fund") ||
    normalized.includes("mutual funds") ||
    normalized.includes("index fund") ||
    normalized.includes("etf") ||
    normalized.includes("portfolio") ||
    normalized.includes("diversification") ||
    normalized.includes("finance") ||
    normalized.includes("investment") ||
    normalized.includes("wealth") ||
    normalized.includes("savings") ||
    normalized.includes("stock") ||
    normalized.includes("share") ||
    normalized.includes("invest") ||
    normalized.includes("buy") ||
    normalized.includes("budget") ||
    normalized.includes("expense") ||
    normalized.includes("fraud") ||
    normalized.includes("scam")
  );
}

function wantsLiveMarketSnapshot(question) {
  const normalized = question.toLowerCase();
  return (
    normalized.includes("live price") ||
    normalized.includes("current price") ||
    normalized.includes("latest price") ||
    normalized.includes("market snapshot") ||
    normalized.includes("stock quote") ||
    normalized.includes("share price") ||
    normalized.includes("quote for") ||
    normalized.includes("price of")
  );
}

async function fetchLiveQuotes(symbols) {
  const uniqueSymbols = [...new Set(symbols.filter(Boolean).map((symbol) => String(symbol).toUpperCase()))];
  if (!uniqueSymbols.length) return [];

  const snapshots = [];

  for (const symbol of uniqueSymbols) {
    const cached = quoteCache.get(symbol);
    if (cached && Date.now() - cached.fetchedAt < AV_CACHE_TTL_MS) {
      snapshots.push(cached.snapshot);
      continue;
    }

    if (ALPHA_VANTAGE_API_KEY) {
      try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(ALPHA_VANTAGE_API_KEY)}`;
        const { data } = await axios.get(url, { timeout: 15000 });
        const quote = data?.["Global Quote"] || {};
        const price = Number(quote["05. price"]);
        const change = Number(quote["09. change"]);
        const changePercent = Number(String(quote["10. change percent"] || "").replace("%", ""));

        if (Number.isFinite(price)) {
          const snapshot = {
            symbol,
            name: SYMBOL_LABELS[symbol] || symbol,
            price,
            change,
            changePercent,
            currency: "",
          };

          quoteCache.set(symbol, { snapshot, fetchedAt: Date.now() });
          snapshots.push(snapshot);
          continue;
        }
      } catch (error) {
        // Fall through to the local live stock endpoint below.
      }
    }

    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/stocks/${encodeURIComponent(symbol)}`, { timeout: 20000 });
      const points = Array.isArray(response?.data?.points) ? response.data.points : [];
      const validPoints = points.filter((point) => Number.isFinite(Number(point?.price)));
      const lastPoint = validPoints[validPoints.length - 1];
      const previousPoint = validPoints[validPoints.length - 2];

      if (!lastPoint) {
        continue;
      }

      const lastPrice = Number(lastPoint.price);
      const previousPrice = Number(previousPoint?.price);
      const change = Number.isFinite(previousPrice) ? lastPrice - previousPrice : NaN;
      const changePercent = Number.isFinite(change) && Number.isFinite(previousPrice) && previousPrice !== 0 ? (change / previousPrice) * 100 : NaN;

      const snapshot = {
        symbol,
        name: SYMBOL_LABELS[symbol] || symbol,
        price: lastPrice,
        change,
        changePercent,
        currency: "",
      };

      quoteCache.set(symbol, { snapshot, fetchedAt: Date.now() });
      snapshots.push(snapshot);
    } catch (error) {
      console.error(`Live fallback failed for ${symbol}:`, error?.message || error);
    }
  }

  return snapshots;
}

function buildLiveStockRequest(question) {
  const normalized = question.toLowerCase();
  const liveIntent = wantsLiveMarketSnapshot(question);

  if (!liveIntent) return null;

  if (normalized.includes("nvda") || normalized.includes("nvidia")) {
    return { region: "us", symbols: ["NVDA"] };
  }

  if (normalized.includes("aapl") || normalized.includes("apple")) {
    return { region: "us", symbols: ["AAPL"] };
  }

  if (normalized.includes("msft") || normalized.includes("microsoft")) {
    return { region: "us", symbols: ["MSFT"] };
  }

  if (normalized.includes("amazon") || normalized.includes("amzn")) {
    return { region: "us", symbols: ["AMZN"] };
  }

  if (normalized.includes("tesla") || normalized.includes("tsla")) {
    return { region: "us", symbols: ["TSLA"] };
  }

  if (normalized.includes("reliance")) {
    return { region: "india", symbols: ["RELIANCE.BSE"] };
  }

  if (normalized.includes("hdfc")) {
    return { region: "india", symbols: ["HDFCBANK.BSE"] };
  }

  if (normalized.includes("infosys") || normalized.includes("infy")) {
    return { region: "india", symbols: ["INFY.BSE"] };
  }

  if (normalized.includes("sbi") || normalized.includes("state bank")) {
    return { region: "india", symbols: ["SBIN.BSE"] };
  }

  if (
    (normalized.includes("top") || normalized.includes("best") || normalized.includes("popular")) &&
    (normalized.includes("india") || normalized.includes("indian") || normalized.includes("us") || normalized.includes("usa") || normalized.includes("america") || normalized.includes("global"))
  ) {
    return null;
  }

  return null;
}

async function buildRealtimeAnswer(question) {
  const request = buildLiveStockRequest(question);
  if (!request) return null;

  try {
    const quotes = await fetchLiveQuotes(request.symbols);
    if (!quotes.length) return null;

    if (request.symbols.length === 1) {
      const quote = quotes[0];
      return `Live market snapshot for ${quote.name} (${quote.symbol}): latest price ${quote.price} ${quote.currency || ""}, change ${formatChangePercent(quote.changePercent)} versus the previous close. This is based on the latest Alpha Vantage market data, so check earnings, valuation, and news before acting.`.trim();
    }

    const ordered = [...quotes].sort((a, b) => {
      const aScore = Number.isFinite(a.changePercent) ? a.changePercent : -Infinity;
      const bScore = Number.isFinite(b.changePercent) ? b.changePercent : -Infinity;
      return bScore - aScore;
    });

    const quoteMap = new Map(ordered.map((quote) => [quote.symbol, quote]));

    const header = request.region === "india"
      ? "Live market snapshot for major Indian stocks:"
      : request.region === "us"
        ? "Live market snapshot for major US stocks:"
        : "Live market snapshot for major global stocks:";

    const lines = request.symbols.map((symbol, index) => {
      const quote = quoteMap.get(symbol);
      const label = SYMBOL_LABELS[symbol] || symbol;

      if (!quote) {
        return `${index + 1}) ${label} (${symbol}) - live quote unavailable right now`;
      }

      return `${index + 1}) ${quote.name} (${quote.symbol}) - ${quote.price} ${quote.currency || ""}, ${formatChangePercent(quote.changePercent)} versus the previous close`;
    });

    if (request.region === "india") {
      lines.push("4) HDFC Bank (HDFCBANK.BSE) - live quote unavailable right now");
      lines.push("5) Infosys (INFY.BSE) - live quote unavailable right now");
    }

    return `${header} ${lines.join(". ")}. These are the latest Alpha Vantage market snapshots, not personalized investment advice.`.trim();
  } catch (error) {
    console.error("Live market lookup failed:", error?.message || error);
    return null;
  }
}

function buildFallbackAnswer(question) {
  const normalized = question.toLowerCase();

  if (normalized.includes("emergency fund") || normalized === "emergency" || normalized.includes("emergency fund")) {
    return (
      "An emergency fund should usually cover 3-6 months of essential expenses. " +
      "Keep it in a safe, liquid place such as a savings account, sweep account, or short-term debt fund. " +
      "Build it before taking on aggressive investments or extra risk."
    );
  }

  if (normalized.includes("asset allocation")) {
    return (
      "Asset allocation is how you split money across equities, bonds, cash, and other assets. " +
      "A simple long-term approach is: more equity when your horizon is long and you can tolerate swings, more debt/cash when your goal is near or your risk tolerance is low. " +
      "Rebalance periodically so one asset class does not dominate the portfolio."
    );
  }

  if (normalized.includes("retirement")) {
    return (
      "For retirement, start with three steps: estimate the monthly income you want, choose a realistic retirement age, and invest consistently in a diversified portfolio. " +
      "Use low-cost index funds or diversified mutual funds for long-term growth, keep a separate emergency fund, and increase contributions as your income rises."
    );
  }

  if (normalized.includes("credit score")) {
    return (
      "A credit score is a summary of how reliably you repay borrowed money. " +
      "Pay bills on time, keep credit utilization low, avoid too many hard inquiries, and check reports for errors. " +
      "A good score usually helps with loans and lower interest rates."
    );
  }

  if (normalized.includes("debt") || normalized.includes("loan")) {
    return (
      "For debt management, first list every loan with interest rate and minimum payment. " +
      "Pay minimums on all loans, then attack the highest-interest debt first. " +
      "If cash flow is tight, refinance or consolidate only when the total cost improves."
    );
  }

  if (normalized.includes("insurance")) {
    return (
      "Insurance is risk protection, not an investment product. " +
      "Health insurance, term life insurance, and basic property coverage are the most common personal finance priorities. " +
      "Choose coverage based on risk exposure, dependents, and affordability."
    );
  }

  if (normalized.includes("tax")) {
    return (
      "For taxes, keep records of income, investments, and deductible expenses through the year. " +
      "Use tax-advantaged accounts where available, and consider a qualified tax professional for jurisdiction-specific advice."
    );
  }

  if (normalized.includes("bond")) {
    return (
      "Bonds are debt instruments that can add stability and income to a portfolio. " +
      "They usually move less than stocks, but still carry interest-rate and credit risk. " +
      "Short-duration, high-quality bonds are generally less volatile than long-duration or lower-rated bonds."
    );
  }

  if (normalized.includes("fixed deposit") || normalized.includes("recurring deposit") || normalized.includes("fd")) {
    return (
      "Fixed deposits and recurring deposits are savings products that prioritize capital preservation over growth. " +
      "They can be useful for short-term goals or an emergency reserve, but long-term wealth building usually needs more growth-oriented assets as well."
    );
  }

  if (normalized.includes("sip")) {
    return (
      "A SIP (Systematic Investment Plan) is a way to invest a fixed amount regularly into a mutual fund. " +
      "For long-term investing, a simple approach is to use low-cost broad equity index funds or diversified equity mutual funds, keep the expense ratio low, and stay invested consistently for 5-10+ years. " +
      "There is no single 'best SIP' for everyone, so choose based on your goal, risk tolerance, and time horizon."
    );
  }

  // Check for specific questions about concepts first
  if (
    normalized.includes("what is") ||
    normalized.includes("explain") ||
    normalized.includes("define")
  ) {
    if (normalized.includes("diversification")) {
      return (
        "Diversification means spreading your money across different types of investments (stocks, bonds, sectors, geographies) " +
        "so that if one area underperforms, others can help balance it. It reduces risk by not putting all eggs in one basket."
      );
    }

    if (normalized.includes("mutual fund") || normalized.includes("mutual funds") || normalized.includes("index fund") || normalized.includes("etf")) {
      return (
        "A mutual fund is a pooled investment vehicle that can hold stocks, bonds, or both. " +
        "Mutual funds and ETFs give instant diversification and professional management, while index funds try to match a market index at lower cost. " +
        "For long-term goals, low-cost diversified funds are usually easier to maintain than trying to pick many individual stocks."
      );
    }

    if (normalized.includes("sip")) {
      return (
        "SIP (Systematic Investment Plan) means investing a fixed amount regularly (weekly, monthly, yearly) into a mutual fund. " +
        "It reduces timing risk and builds discipline. Over time, small regular investments can compound into significant wealth. " +
        "If you want a long-term SIP, look for a low-cost diversified fund that matches your risk level rather than chasing recent returns."
      );
    }

    if (
      normalized.includes("stock") ||
      normalized.includes("equity")
    ) {
      return (
        "A stock is a share of ownership in a company. When you buy stock, you own a tiny piece of that business and can earn returns from price appreciation and dividends. " +
        "Stocks are riskier than bonds but offer higher long-term growth potential."
      );
    }
  }

  // Check for 'how to' or getting started questions
  if (
    normalized.includes("how to") ||
    normalized.includes("how should") ||
    normalized.includes("get started")
  ) {
    if (
      normalized.includes("invest") ||
      normalized.includes("start investing")
    ) {
      return (
        "Start investing by: 1) Define your goal and time horizon. 2) Emergency fund first (3-6 months expenses). " +
        "3) Pick low-cost index funds or ETFs if new. 4) Start with whatever you can afford regularly. 5) Rebalance once or twice a year."
      );
    }

    if (
      normalized.includes("budget") ||
      normalized.includes("save")
    ) {
      return (
        "Build a budget by: 1) Track all spending for 2 weeks. 2) Categorize (fixed bills, variable, discretionary). 3) Cut the top 2-3 leaks. " +
        "4) Automate savings transfers right after paycheck. 5) Review monthly."
      );
    }
  }

  // Check for stock/company specific questions
  if (normalized.includes("stock") || normalized.includes("buy")) {
    if (normalized.includes("top") || normalized.includes("best") || normalized.includes("popular")) {
      return (
        "I can help compare stocks, but there is no single 'best' stock for everyone. " +
        "A better way is to match the company to your goal: growth, dividends, stability, or turnaround potential. " +
        "For a useful shortlist, compare earnings growth, debt, profit margins, valuation, industry outlook, and whether you need current price data. " +
        "If you want a live quote, ask for a specific company and say 'live price' or 'current price'."
      );
    }

    if (normalized.includes("tata")) {
      return (
        "For Tata Group stocks, first decide which company you mean, because Tata Motors, TCS, and Tata Power behave very differently. " +
        "Check revenue growth, profit margins, debt, and whether the business is cyclical. Size the position modestly and diversify."
      );
    }

    if (normalized.includes("nvda") || normalized.includes("nvidia")) {
      return (
        "For NVIDIA, watch valuation metrics (P/E, PEG), earnings growth, AI demand trends, and competition. Growth stocks like NVIDIA move fast. " +
        "Position sizing matters—avoid concentration. Monitor quarterly earnings for guidance changes."
      );
    }

    if (normalized.includes("reliance")) {
      return (
        "Reliance Industries is India's largest company by market cap. It operates in energy, petrochemicals, telecom (Jio), and retail. " +
        "Check dividend yield, debt-to-equity ratio, and energy sector trends before investing."
      );
    }

    if (normalized.includes("hdfc") || normalized.includes("bank")) {
      return (
        "HDFC Bank is a leading private sector bank in India with strong capital ratios and asset quality. " +
        "Monitor interest rate trends, NPA (bad loan) levels, and quarterly earnings growth."
      );
    }

    if (normalized.includes("infosys")) {
      return (
        "Infosys is a major Indian IT services company with global clients. Track IT services demand, rupee movements (affects overseas earnings), and attrition rates."
      );
    }

    return (
      "Before buying any stock: 1) Compare valuation (P/E ratio, PEG). 2) Check earnings growth and trend. 3) Review debt levels. " +
      "4) Assess business quality and competitive edge. 5) Diversify and size positions appropriately."
    );
  }

  // Budget and expense tracking
  if (normalized.includes("budget") || normalized.includes("expense") || normalized.includes("save")) {
    return (
      "To track expenses: 1) Categorize spending (food, transport, entertainment, utilities, etc.). 2) Set monthly limits per category. " +
      "3) Review weekly. 4) Cut unnecessary categories. 5) Automate savings so you pay yourself first."
    );
  }

  // Fraud and security
  if (
    normalized.includes("fraud") ||
    normalized.includes("scam") ||
    normalized.includes("suspicious") ||
    normalized.includes("secure")
  ) {
    return (
      "Detect fraud by watching for: unusual amounts, late-night transactions, repeated failed attempts, or unrecognized merchants. " +
      "If suspicious: freeze the card immediately, contact your bank, review recent activity, and monitor for identity theft."
    );
  }

  return (
    "I can help with asset allocation, retirement planning, emergency funds, SIPs, mutual funds, index funds, ETFs, stocks, debt, credit scores, taxes, insurance, budgeting, and fraud detection. " +
    "Try asking: 'What is asset allocation?', 'How much emergency fund do I need?', 'Explain SIP for long-term investing', or 'live price of TSLA'."
  );
}

function shouldUseOpenAI() {
  const enabled = String(process.env.OPENAI_CHAT_ENABLED || "false").toLowerCase() === "true";
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  return enabled && apiKey.length > 0 && !apiKey.includes("<") && !apiKey.includes(">");
}

router.post("/", async (req, res) => {
  try {
    const question = String(req.body?.message || "").trim();
    if (!question) {
      return res.status(400).json({ error: "message is required" });
    }

    const realtimeAnswer = await buildRealtimeAnswer(question);
    if (realtimeAnswer) {
      return res.json({
        answer: realtimeAnswer,
        source: "realtime"
      });
    }

    if (isFinanceGuidanceQuestion(question)) {
      return res.json({
        answer: buildFallbackAnswer(question),
        source: "local"
      });
    }

    if (!shouldUseOpenAI()) {
      return res.json({
        answer: buildFallbackAnswer(question),
        source: "local"
      });
    }

    const client = new OpenAI({ apiKey: String(process.env.OPENAI_API_KEY || "").trim() });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a finance assistant. Provide educational, risk-aware guidance and avoid guaranteed return claims.",
        },
        { role: "user", content: question },
      ],
    });

    const answer = completion.choices[0]?.message?.content || buildFallbackAnswer(question);
    return res.json({ answer, source: "openai" });
  } catch (error) {
    console.error("Chat endpoint falling back:", error?.status || "", error?.message || error);
    return res.json({
      answer: buildFallbackAnswer(String(req.body?.message || "")),
      source: "local",
      fallback_reason: String(error?.message || "openai_error")
    });
  }
});

export default router;
