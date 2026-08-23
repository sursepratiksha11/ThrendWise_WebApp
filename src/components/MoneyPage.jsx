import styles from "../styles/page.module.css";
import PageHeader from "./PageHeader";

export default function MoneyPage({
  amount,
  analyzeExpenses,
  categorizeError,
  categorizeLoading,
  categorizeResult,
  detectFraudRisk,
  expenseTotals,
  fraudError,
  fraudLoading,
  fraudProbability,
  fraudResult,
  merchant,
  pieChartStyle,
  setAmount,
  setMerchant,
  setTxCsv,
  sortedExpenseEntries,
  txCsv
}) {
  return (
    <>
      <PageHeader
        badge="Budget + Security"
        eyebrow="Money"
        title="Expense Analyzer and Fraud Detection"
        description="Review spending categories and run a quick fraud risk check without leaving the finance workspace."
      />

      <section className={styles.sectionGrid}>
        <article className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Expense Analyzer</h2>
            <button
              type="button"
              className={styles.secondaryGhostBtn}
              onClick={analyzeExpenses}
              disabled={categorizeLoading}
            >
              {categorizeLoading ? "Analyzing..." : "Analyze CSV"}
            </button>
          </div>
          <div className={styles.expenseGrid}>
            <div className={styles.pieChart} style={pieChartStyle} aria-label="Expense categories pie chart" />
            <div className={styles.summaryCol}>
              {sortedExpenseEntries.slice(0, 3).map(([name, total]) => (
                <div key={name}>
                  <p>{name}</p>
                  <h4>${total.toFixed(2)}</h4>
                </div>
              ))}
              <p className={styles.reco}>AI Recommendation: Reduce subscription overlap and route 12% savings into index funds.</p>
              {categorizeError ? <p className={styles.errorText}>{categorizeError}</p> : null}
            </div>
          </div>
          <div className={styles.formStack}>
            <label htmlFor="txCsv">Transactions CSV: description, amount, date</label>
            <textarea id="txCsv" className={styles.textarea} value={txCsv} onChange={(e) => setTxCsv(e.target.value)} />
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Fraud Detection</h2>
            <span className={styles.badge}>Risk Engine</span>
          </div>
          <div className={styles.formStack}>
            <label htmlFor="merchant">Transaction merchant</label>
            <input id="merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
            <label htmlFor="amount">Transaction amount ($)</label>
            <input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value || 1))}
            />
          </div>
          <div className={styles.meterWrap}>
            <p>Fraud Probability: {fraudProbability}%</p>
            <div className={styles.meterTrack}>
              <span style={{ width: `${fraudProbability}%` }} />
            </div>
            <p className={styles.alertText}>
              {fraudProbability > 60
                ? "High risk alert: Step-up verification recommended."
                : "Risk level acceptable with normal monitoring."}
            </p>
            <button type="button" className={styles.secondaryGhostBtn} onClick={detectFraudRisk} disabled={fraudLoading}>
              {fraudLoading ? "Running check..." : "Run Fraud Check"}
            </button>
            {fraudResult ? <p className={styles.statusText}>Suspicious transactions found: {fraudResult.suspiciousCount}</p> : null}
            {fraudError ? <p className={styles.errorText}>{fraudError}</p> : null}
          </div>
        </article>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2>Expense Mix</h2>
          <span className={styles.badge}>{categorizeResult ? "Live Data" : "Baseline Data"}</span>
        </div>
        <div className={styles.metricsGrid}>
          {Object.entries(expenseTotals).slice(0, 4).map(([label, value]) => (
            <div key={label}>
              <p>{label}</p>
              <h4>${value.toFixed(2)}</h4>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}