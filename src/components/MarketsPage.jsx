import styles from "../styles/page.module.css";
import PageHeader from "./PageHeader";

export default function MarketsPage({
  analyzeStock,
  currentPrice,
  formatStockPrice,
  liveMarketError,
  liveMarketStatus,
  liveMarketUpdatedAt,
  liveResolvedSymbol,
  liveMarketCurrency,
  prediction,
  predictionError,
  predictionLoading,
  predictedPrice,
  priceSeries,
  refreshMarketSnapshot,
  setPriceSeries,
  setSymbol,
  signal,
  stockChartPoints,
  stockData,
  symbol,
  trend
}) {
  return (
    <>
      <PageHeader
        badge="Realtime AI Model"
        eyebrow="Markets"
        title="Stock Prediction Dashboard"
        description="Track the current trend, update your input series, and validate the model output in one focused workspace."
      />

      <section className={styles.sectionGrid}>
        <article className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Prediction Engine</h2>
            <span className={liveMarketStatus === "live" ? styles.liveBadge : styles.badge}>
              {liveMarketStatus === "live" ? <span className={styles.liveDot} aria-hidden="true" /> : null}
              {liveMarketStatus === "live"
                ? "Realtime Feed"
                : liveMarketStatus === "error"
                  ? "Invalid Symbol"
                  : stockData.symbol}
            </span>
          </div>
          <div className={styles.searchRow}>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Search stock symbol"
            />
            <button type="button" onClick={analyzeStock} disabled={predictionLoading}>
              {predictionLoading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
          <div className={styles.promptRow}>
            <button type="button" className={styles.secondaryGhostBtn} onClick={refreshMarketSnapshot} disabled={predictionLoading}>
              Sync live feed
            </button>
          </div>
          <div className={styles.formStack}>
            <label htmlFor="priceSeries">Price Series (comma separated)</label>
            <input id="priceSeries" value={priceSeries} onChange={(e) => setPriceSeries(e.target.value)} />
          </div>
          <div className={styles.metricsGrid}>
            <div>
              <p>Current Price</p>
              <h4>{formatStockPrice(currentPrice, liveMarketCurrency)}</h4>
            </div>
            <div>
              <p>Predicted Price</p>
              <h4>{formatStockPrice(predictedPrice, liveMarketCurrency)}</h4>
            </div>
            <div>
              <p>Market Trend</p>
              <h4>{trend}</h4>
            </div>
            <div>
              <p>Indicator</p>
              <h4 className={styles.buyPill}>{signal}</h4>
            </div>
            <div>
              <p>Feed Status</p>
              <h4>
                {liveMarketStatus === "live"
                  ? `Live ${liveMarketUpdatedAt}`
                  : liveMarketStatus === "error"
                    ? "Error"
                    : liveMarketStatus}
              </h4>
            </div>
          </div>
          <div className={styles.miniChart}>
            <svg viewBox="0 0 480 180" role="img" aria-label="Interactive stock chart">
              <polyline points={stockChartPoints} />
            </svg>
            <p>
              {symbol || stockData.symbol} momentum {trend === "Bullish" ? "remains above" : "is below"} baseline trend.
            </p>
            {prediction ? <p className={styles.statusText}>Model: {prediction.model}</p> : null}
            {liveMarketStatus !== "idle" ? <p className={styles.statusText}>Market feed: {liveMarketStatus}{liveMarketUpdatedAt ? ` · ${liveMarketUpdatedAt}` : ""}</p> : null}
            {predictionError ? <p className={styles.errorText}>{predictionError}</p> : null}
            {liveMarketError ? <p className={styles.errorText}>{liveMarketError}</p> : null}
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Market Snapshot</h2>
            <span className={styles.badge}>{prediction?.source === "ai" ? "AI Backed" : "Signal Summary"}</span>
          </div>
          <div className={styles.metricsGrid}>
            <div>
              <p>Source Symbol</p>
              <h4>{liveResolvedSymbol || stockData.symbol}</h4>
            </div>
            <div>
              <p>Direction</p>
              <h4>{trend}</h4>
            </div>
            <div>
              <p>Risk Action</p>
              <h4>{signal}</h4>
            </div>
            <div>
              <p>Confidence</p>
              <h4>{prediction?.confidence ? `${Math.round(prediction.confidence * 100)}%` : prediction ? "Model tuned" : "Baseline"}</h4>
            </div>
            <div>
              <p>Live Feed</p>
              <h4>{liveMarketStatus === "live" ? "Synced" : liveMarketStatus === "fallback" ? "Fallback" : "Polling"}</h4>
            </div>
          </div>
          <p className={styles.reco}>
            Live closes refresh into the prediction engine. Unknown symbols now surface a clear error instead of a 500.
          </p>
        </article>
      </section>
    </>
  );
}