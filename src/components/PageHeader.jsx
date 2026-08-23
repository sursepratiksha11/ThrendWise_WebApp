import styles from "../styles/page.module.css";

export default function PageHeader({ badge, eyebrow, title, description }) {
  return (
    <section className={styles.pageHeader}>
      <div>
        <p className={styles.kicker}>{eyebrow}</p>
        <h1>{title}</h1>
        <p className={styles.subheading}>{description}</p>
      </div>
      {badge ? <span className={styles.badge}>{badge}</span> : null}
    </section>
  );
}