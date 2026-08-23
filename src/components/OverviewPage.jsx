import styles from "../styles/page.module.css";
import StatCard from "./StatCard";

export default function OverviewPage({
  currentPrice,
  formatStockPrice,
  featureList,
  liveMarketCurrency,
  onNavigate,
  predictedPrice,
  signal,
  stockChartPoints,
  stockData,
  testimonials,
  trend
}) {
  return (
    <>
      <section id="home" className={styles.hero}>
        <div>
          <p className={styles.kicker}>Futuristic Finance Intelligence</p>
          <h1>AI-Powered Financial Intelligence Platform</h1>
          <p className={styles.subheading}>
            Predict market trends, manage expenses, and get smart investment insights from one workspace.
          </p>
          <div className={styles.heroCta}>
            <button type="button" className={styles.primaryBtn} onClick={() => onNavigate("markets")}>
              Explore Markets
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={() => onNavigate("desk")}>
              Open AI Desk
            </button>
          </div>
        </div>
        <div className={styles.graphCard}>
          <h3>Live Market Pulse</h3>
          <svg viewBox="0 0 580 260" role="img" aria-label="Animated stock graph">
            <polyline
              className={styles.graphLineGhost}
              points="20,220 80,175 140,184 200,142 260,154 320,95 380,112 440,62 500,88 560,38"
            />
            <polyline className={styles.graphLineMain} points={stockChartPoints} />
          </svg>
          <div className={styles.graphMeta}>
            <span>{trend === "Bullish" ? "+8.2% weekly momentum" : "Momentum cooling"}</span>
            <span>AI confidence 92%</span>
          </div>
        </div>
      </section>

      <section className={styles.widgetStrip}>
        <StatCard label="Portfolio Value" value="$248,520" note="+4.8% this month" />
        <StatCard label="AI Predictions" value="37 Active" note="29 high-confidence signals" />
        <StatCard label="Expense Efficiency" value="81 / 100" note="3 categories need optimization" />
      </section>

      <section className={styles.sectionGrid}>
        <article className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Today’s Signal</h2>
            <span className={styles.badge}>{signal}</span>
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
          </div>
          <p className={styles.statusText}>
            {stockData.symbol} is currently showing a {trend.toLowerCase()} outlook with model-backed projections.
          </p>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Quick Routes</h2>
            <span className={styles.badge}>Multi-page UI</span>
          </div>
          <div className={styles.promptRow}>
            <button type="button" onClick={() => onNavigate("markets")}>Markets</button>
            <button type="button" onClick={() => onNavigate("money")}>Money</button>
            <button type="button" onClick={() => onNavigate("desk")}>AI Desk</button>
          </div>
          <p className={styles.reco}>
            The dashboard is now split into dedicated pages so each workflow feels focused instead of crowded.
          </p>
        </article>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2>Features</h2>
          <span className={styles.badge}>All-in-One Platform</span>
        </div>
        <div className={styles.featureGrid}>
          {featureList.map((feature) => (
            <div className={styles.featureCard} key={feature}>
              <h3>{feature}</h3>
              <p>Advanced AI tooling with rich analytics, smart automation, and intuitive user flows.</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2>Testimonials</h2>
          <span className={styles.badge}>Trusted by Investors</span>
        </div>
        <div className={styles.testimonialGrid}>
          {testimonials.map((testimonial) => (
            <blockquote className={styles.quoteCard} key={testimonial.name}>
              <p>{testimonial.text}</p>
              <footer>{testimonial.name}</footer>
            </blockquote>
          ))}
        </div>
      </section>
    </>
  );
}