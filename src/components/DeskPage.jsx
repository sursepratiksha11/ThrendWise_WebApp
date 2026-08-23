import styles from "../styles/page.module.css";
import PageHeader from "./PageHeader";

export default function DeskPage({ chatError, chatInput, chatLoading, messages, onPrompt, onSendMessage, setChatInput }) {
  return (
    <>
      <PageHeader
        badge="Context Aware"
        eyebrow="AI Desk"
        title="Financial Chatbot"
        description="Ask about stocks, SIPs, portfolio strategy, or anything else related to your money workflow."
      />

      <section className={styles.sectionGrid}>
        <article className={styles.card} id="chatbot">
          <div className={styles.cardHead}>
            <h2>AI Financial Chatbot</h2>
            <span className={styles.badge}>Context Aware</span>
          </div>
          <div className={styles.chatWindow}>
            {messages.map((message, idx) => (
              <p className={message.role === "user" ? styles.userBubble : styles.aiBubble} key={`${message.role}-${idx}`}>
                {message.text}
              </p>
            ))}
          </div>
          <div className={styles.promptRow}>
            <button type="button" onClick={() => onPrompt("What is asset allocation?")}>Asset allocation</button>
            <button type="button" onClick={() => onPrompt("How much emergency fund do I need?")}>Emergency fund</button>
            <button type="button" onClick={() => onPrompt("Explain SIP for long-term investing")}>Long-term SIP</button>
          </div>
          <form className={styles.chatForm} onSubmit={onSendMessage}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask your finance question"
            />
            <button type="submit" disabled={chatLoading}>{chatLoading ? "Sending..." : "Send"}</button>
          </form>
          {chatError ? <p className={styles.errorText}>{chatError}</p> : null}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHead}>
            <h2>What to ask</h2>
            <span className={styles.badge}>Suggested flows</span>
          </div>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <h3>Market research</h3>
              <p>Use the assistant to translate market jargon into plain advice before making a decision.</p>
            </div>
            <div className={styles.featureCard}>
              <h3>Budget planning</h3>
              <p>Ask for saving strategies, monthly targets, or category-by-category spending tips.</p>
            </div>
            <div className={styles.featureCard}>
              <h3>Learning mode</h3>
              <p>Get short explainers for SIPs, index funds, diversification, and risk management.</p>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}