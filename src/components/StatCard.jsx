import styles from "../styles/page.module.css";

export default function StatCard({ label, value, note }) {
  return (
    <article className={styles.widgetCard}>
      <p>{label}</p>
      <h3>{value}</h3>
      <span>{note}</span>
    </article>
  );
}