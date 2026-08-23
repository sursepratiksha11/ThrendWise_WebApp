import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./global.css";
import styles from "./styles/page.module.css";
import AppFooter from "./components/AppFooter";
import AppNav from "./components/AppNav";
import DeskPage from "./components/DeskPage";
import MarketsPage from "./components/MarketsPage";
import MoneyPage from "./components/MoneyPage";
import OverviewPage from "./components/OverviewPage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const USD_TO_INR_RATE = 83.5;
const STOCK_DATA = {
  symbol: "NVDA",
  currency: "USD",
  current: 1048.24,
  predicted: 1089.63
};
const TESTIMONIALS = [
  {
    name: "Riya S.",
    text: "TrendWise AI helped me spot better entry points and simplify my monthly finance tracking."
  },
  {
    name: "Marcus L.",
    text: "The AI chatbot explains financial concepts clearly. It feels like having a personal analyst."
  },
  {
    name: "Tanya K.",
    text: "Expense insights and fraud alerts gave me confidence to automate more of my investing workflow."
  }
];
const FEATURE_LIST = [
  "AI Stock Prediction",
  "Expense Tracking",
  "Fraud Detection",
  "AI Chatbot",
  "Portfolio Management"
];
const PAGES = [
  { id: "overview", label: "Overview", description: "Platform snapshot" },
  { id: "markets", label: "Markets", description: "Stock intelligence" },
  { id: "money", label: "Money", description: "Expenses and risk" },
  { id: "desk", label: "AI Desk", description: "Chat and guidance" }
];

function parseNumberInput(value) {
  return value
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v));
}

function parseTransactionsCsv(csvText) {
  return csvText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [description = "", amount = "0", date] = line.split(",").map((part) => part.trim());
      return {
        description,
        amount: Number(amount),
        date: date || undefined
      };
    })
    .filter((tx) => tx.description && Number.isFinite(tx.amount));
}

function formatStockPrice(value, currency = "USD") {
  const amount = Number(value);
  const normalizedCurrency = String(currency || "USD").toUpperCase();
  const inRupees = normalizedCurrency === "INR" ? amount : amount * USD_TO_INR_RATE;
  const locale = "en-IN";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number.isFinite(inRupees) ? inRupees : 0);
}

function normalizePrediction(data, fallbackValues) {
  const historyRaw = data.history;

  if (Array.isArray(historyRaw) && historyRaw.length > 0 && typeof historyRaw[0] === "number") {
    const values = historyRaw;
    const predicted = Number(data.predicted_price ?? values[values.length - 1]);
    return {
      history: values.map((actual, idx) => ({ x: idx + 1, actual, predicted: actual })),
      forecast: [{ x: values.length + 1, predicted }],
      model: String(data.model ?? "LinearRegression")
    };
  }

  if (Array.isArray(historyRaw) && historyRaw.length > 0 && typeof historyRaw[0] === "object") {
    const shaped = historyRaw;
    const forecast = Array.isArray(data.forecast) ? data.forecast : [];
    return {
      history: shaped.map((point, idx) => ({
        x: Number(point.x ?? idx + 1),
        actual: Number(point.actual),
        predicted: Number(point.predicted ?? point.actual)
      })),
      forecast,
      model: String(data.model ?? "LinearRegression")
    };
  }

  const fallbackPredicted = Number(data.predicted_price ?? fallbackValues[fallbackValues.length - 1] ?? 0);
  return {
    history: fallbackValues.map((actual, idx) => ({ x: idx + 1, actual, predicted: actual })),
    forecast: [{ x: fallbackValues.length + 1, predicted: fallbackPredicted }],
    model: String(data.model ?? "LinearRegression")
  };
}

function generateClientFallbackPrediction(symbol, values) {
  const history = values.length > 0 ? values : [980, 995, 1004, 1010, 1024, 1035, 1048];
  const lastValue = history[history.length - 1];
  const direction = symbol.toUpperCase().includes("NVDA") || symbol.toUpperCase().includes("AAPL") ? 1.018 : 0.992;
  const forecast = Array.from({ length: 5 }, (_, idx) => ({
    x: history.length + idx + 1,
    predicted: Number((lastValue * Math.pow(direction, idx + 1)).toFixed(2))
  }));

  return {
    history: history.map((actual, idx) => ({ x: idx + 1, actual, predicted: actual })),
    forecast,
    model: "ClientFallbackLinearRegression"
  };
}

function normalizeCategorizeResult(data, originalTransactions) {
  const totals = data.totals ?? {};
  if (Array.isArray(data.categorized)) {
    return {
      categorized: data.categorized,
      totals
    };
  }
  const categories = data.categories ?? {};
  const categorized = originalTransactions.map((tx) => ({
    ...tx,
    category: categories[tx.description] ?? "Other"
  }));
  return {
    categorized,
    totals
  };
}

function normalizeFraudResult(data) {
  return {
    scored: Array.isArray(data.scored) ? data.scored : [],
    suspiciousCount: Number(data.suspiciousCount ?? data.suspicious_count ?? 0)
  };
}

function normalizeStockSeries(data) {
  const series = Array.isArray(data?.points)
    ? data.points.map((point) => Number(point.price)).filter((value) => Number.isFinite(value))
    : [];

  return {
    series,
    source: String(data?.source || "live"),
    resolvedSymbol: String(data?.resolvedSymbol || data?.symbol || "")
  };
}

function App() {
  const [activePage, setActivePage] = useState("overview");
  const [symbol, setSymbol] = useState("NVDA");
  const [theme, setTheme] = useState("dark");
  const [priceSeries, setPriceSeries] = useState("980, 995, 1004, 1010, 1024, 1035, 1048");
  const [horizon] = useState(5);
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Welcome to TrendWise AI. Ask about investing, SIPs, mutual funds, asset allocation, budgeting, or live stock prices."
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [txCsv, setTxCsv] = useState(
    "Rent,1120,2026-04-01\nStar Cafe,42,2026-04-03\nMetro Taxi,24,2026-04-05\nAmazon Purchase,190,2026-04-06"
  );
  const [categorizeResult, setCategorizeResult] = useState(null);
  const [categorizeLoading, setCategorizeLoading] = useState(false);
  const [categorizeError, setCategorizeError] = useState("");
  const [merchant, setMerchant] = useState("Luxury Gadgets Store");
  const [amount, setAmount] = useState(1700);
  const [fraudResult, setFraudResult] = useState(null);
  const [fraudLoading, setFraudLoading] = useState(false);
  const [fraudError, setFraudError] = useState("");
  const [liveStockSeries, setLiveStockSeries] = useState([]);
  const [liveMarketStatus, setLiveMarketStatus] = useState("idle");
  const [liveMarketError, setLiveMarketError] = useState("");
  const [liveMarketUpdatedAt, setLiveMarketUpdatedAt] = useState("");
  const [liveResolvedSymbol, setLiveResolvedSymbol] = useState("");
  const [liveMarketCurrency, setLiveMarketCurrency] = useState(STOCK_DATA.currency);

  const symbolRef = useRef(symbol);

  useEffect(() => {
    symbolRef.current = symbol;
  }, [symbol]);

  const marketSeries = useMemo(() => {
    if (liveStockSeries.length > 0) {
      return liveStockSeries;
    }

    if (prediction?.history?.length) {
      return prediction.history.map((point) => point.actual);
    }

    return [150, 132, 120, 124, 96, 100, 82, 92, 64, 58, 34, 40];
  }, [liveStockSeries, prediction]);

  const predictionHistory = prediction?.history ?? [];
  const currentPrice = predictionHistory[predictionHistory.length - 1]?.actual ?? liveStockSeries[liveStockSeries.length - 1] ?? STOCK_DATA.current;
  const predictedPrice = prediction?.forecast?.[0]?.predicted ?? STOCK_DATA.predicted;
  const trend = predictedPrice >= currentPrice ? "Bullish" : "Bearish";
  const signal = predictedPrice >= currentPrice ? "Buy" : "Watch";

  const refreshMarketSnapshot = useCallback(
    async ({ syncInputSeries = false, targetSymbol } = {}) => {
      const activeSymbol = String(targetSymbol || symbolRef.current || STOCK_DATA.symbol).toUpperCase();

      setLiveMarketStatus("syncing");
      setLiveMarketError("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/stocks/${encodeURIComponent(activeSymbol)}`);
        const data = await response.json();

        if (!response.ok) {
          const error = new Error(data.error || "Live market sync failed");
          error.status = response.status;
          throw error;
        }

        const { series: closes, source, resolvedSymbol } = normalizeStockSeries(data);
        if (!closes.length) {
          throw new Error("No live market points returned");
        }

        setLiveStockSeries(closes);
        setLiveResolvedSymbol(resolvedSymbol || activeSymbol);
        setLiveMarketCurrency(String(data?.currency || STOCK_DATA.currency).toUpperCase());
        setLiveMarketStatus(source === "fallback" ? "fallback" : "live");
        setLiveMarketUpdatedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

        if (syncInputSeries) {
          setPriceSeries(closes.map((value) => value.toFixed(2)).join(", "));
        }

        return {
          ok: true,
          series: closes,
          resolvedSymbol: resolvedSymbol || activeSymbol,
          source
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not sync live market data";
        const status = error && typeof error === "object" && "status" in error ? error.status : undefined;

        if (status === 404) {
          setLiveMarketStatus("error");
          setLiveMarketError(message);
        } else {
          setLiveMarketStatus("stale");
          setLiveMarketError(`${message}. Using the current input series instead.`);
        }

        return {
          ok: false,
          series: [],
          error: message
        };
      }
    },
    []
  );

  useEffect(() => {
    if (activePage !== "markets") {
      return undefined;
    }

    let cancelled = false;

    const syncLiveFeed = async () => {
      if (cancelled) {
        return;
      }

      await refreshMarketSnapshot({ targetSymbol: symbolRef.current });
    };

    syncLiveFeed();
    const intervalId = window.setInterval(syncLiveFeed, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activePage, refreshMarketSnapshot]);

  const fraudProbability = useMemo(() => {
    if (!fraudResult?.scored.length) {
      const merchantRisk = /luxury|gift|crypto|wire/i.test(merchant) ? 28 : 12;
      const amountRisk = Math.min(55, Math.round(amount / 45));
      return Math.min(96, merchantRisk + amountRisk);
    }
    const topScore = Math.max(...fraudResult.scored.map((tx) => tx.score));
    return Math.min(98, Math.round(topScore * 28));
  }, [amount, fraudResult, merchant]);

  const stockChartPoints = useMemo(() => {
    const values = marketSeries;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return values
      .map((value, idx) => {
        const x = 10 + idx * (440 / Math.max(1, values.length - 1));
        const y = 150 - ((value - min) / Math.max(1, max - min)) * 118;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [marketSeries]);

  const expenseTotals = categorizeResult?.totals ?? {
    Housing: 1120,
    Food: 620,
    Transport: 240,
    Other: 180
  };
  const sortedExpenseEntries = Object.entries(expenseTotals).sort((a, b) => b[1] - a[1]);

  const pieChartStyle = useMemo(() => {
    const entries = sortedExpenseEntries.slice(0, 4);
    const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
    const colors = ["#3bd0ff", "#8f68ff", "#ff6ad8", "#65f0a0"];
    let cursor = 0;
    const slices = entries.map(([, value], idx) => {
      const start = Math.round((cursor / total) * 100);
      cursor += value;
      const end = Math.round((cursor / total) * 100);
      return `${colors[idx]} ${start}% ${end}%`;
    });
    return { background: `conic-gradient(${slices.join(", ")})` };
  }, [sortedExpenseEntries]);

  async function analyzeStock() {
    setPredictionError("");
    setPredictionLoading(true);
    setPrediction(null);
    try {
      const liveSnapshot = await refreshMarketSnapshot({ syncInputSeries: true, targetSymbol: symbol });
      if (!liveSnapshot.ok || !liveSnapshot.series.length) {
        throw new Error(liveSnapshot.error || `Unknown or unsupported stock symbol: ${symbol}`);
      }

      const values = liveSnapshot.series;
      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: symbol, prices: values, horizon })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }
      setPrediction(normalizePrediction(data, values));
    } catch (error) {
      setPrediction(null);
      setPredictionError(error instanceof Error ? error.message : "Prediction request failed");
    } finally {
      setPredictionLoading(false);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    setChatError("");
    const trimmed = chatInput.trim();
    if (!trimmed) {
      return;
    }
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setChatInput("");
    try {
      setChatLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Chat request failed");
      }
      setMessages((prev) => [...prev, { role: "ai", text: String(data.answer ?? data.reply ?? "No response") }]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Could not get AI response");
      setMessages((prev) => [...prev, { role: "ai", text: "I could not process your request right now. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function analyzeExpenses() {
    setCategorizeError("");
    setCategorizeLoading(true);
    try {
      const transactions = parseTransactionsCsv(txCsv);
      const response = await fetch(`${API_BASE_URL}/api/expenses/categorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions })
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Server returned invalid response. Please ensure the AI service is running.");
      }
      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status})`);
      }
      setCategorizeResult(normalizeCategorizeResult(data, transactions));
    } catch (error) {
      setCategorizeError(error instanceof Error ? error.message : "Could not analyze expenses");
    } finally {
      setCategorizeLoading(false);
    }
  }

  async function detectFraudRisk() {
    setFraudError("");
    setFraudLoading(true);
    try {
      const transactions = [
        { description: "Groceries", amount: 74, date: "2026-04-10" },
        { description: "Taxi", amount: 22, date: "2026-04-10" },
        { description: "Coffee", amount: 9, date: "2026-04-10" },
        { description: merchant, amount: Number(amount), date: "2026-04-10" }
      ];
      const response = await fetch(`${API_BASE_URL}/api/fraud/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Fraud detection failed");
      }
      setFraudResult(normalizeFraudResult(data));
    } catch (error) {
      setFraudError(error instanceof Error ? error.message : "Could not detect fraud risk");
    } finally {
      setFraudLoading(false);
    }
  }

  function usePrompt(prompt) {
    setChatInput(prompt);
    setActivePage("desk");
  }

  return (
    <main className={`${styles.page} ${styles[theme]}`}>
      <div className={styles.glowOne} />
      <div className={styles.glowTwo} />
      <AppNav
        activePage={activePage}
        onNavigate={setActivePage}
        onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        pages={PAGES}
        theme={theme}
      />
      <div className={styles.pageShell}>
        {activePage === "overview" ? (
          <OverviewPage
            currentPrice={currentPrice}
            formatStockPrice={formatStockPrice}
            featureList={FEATURE_LIST}
            onNavigate={setActivePage}
            predictedPrice={predictedPrice}
            signal={signal}
            stockChartPoints={stockChartPoints}
            stockData={STOCK_DATA}
            testimonials={TESTIMONIALS}
            trend={trend}
          />
        ) : null}

        {activePage === "markets" ? (
          <MarketsPage
            analyzeStock={analyzeStock}
            currentPrice={currentPrice}
            formatStockPrice={formatStockPrice}
            liveMarketError={liveMarketError}
            liveMarketStatus={liveMarketStatus}
            liveMarketUpdatedAt={liveMarketUpdatedAt}
            liveResolvedSymbol={liveResolvedSymbol}
            liveMarketCurrency={liveMarketCurrency}
            prediction={prediction}
            predictionError={predictionError}
            predictionLoading={predictionLoading}
            predictedPrice={predictedPrice}
            priceSeries={priceSeries}
            refreshMarketSnapshot={() => refreshMarketSnapshot({ syncInputSeries: true, targetSymbol: symbol })}
            setPriceSeries={setPriceSeries}
            setSymbol={setSymbol}
            signal={signal}
            stockChartPoints={stockChartPoints}
            stockData={STOCK_DATA}
            symbol={symbol}
            trend={trend}
          />
        ) : null}

        {activePage === "money" ? (
          <MoneyPage
            amount={amount}
            analyzeExpenses={analyzeExpenses}
            categorizeError={categorizeError}
            categorizeLoading={categorizeLoading}
            categorizeResult={categorizeResult}
            detectFraudRisk={detectFraudRisk}
            expenseTotals={expenseTotals}
            fraudError={fraudError}
            fraudLoading={fraudLoading}
            fraudProbability={fraudProbability}
            fraudResult={fraudResult}
            merchant={merchant}
            pieChartStyle={pieChartStyle}
            setAmount={setAmount}
            setMerchant={setMerchant}
            setTxCsv={setTxCsv}
            sortedExpenseEntries={sortedExpenseEntries}
            txCsv={txCsv}
          />
        ) : null}

        {activePage === "desk" ? (
          <DeskPage
            chatError={chatError}
            chatInput={chatInput}
            chatLoading={chatLoading}
            messages={messages}
            onPrompt={usePrompt}
            onSendMessage={sendMessage}
            setChatInput={setChatInput}
          />
        ) : null}
      </div>
      <AppFooter />
    </main>
  );
}

export default App;