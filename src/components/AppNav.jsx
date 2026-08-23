import styles from "../styles/page.module.css";

export default function AppNav({ activePage, onNavigate, onToggleTheme, pages, theme }) {
  return (
    <nav className={styles.navbar}>
      <div>
        <div className={styles.logo}>TrendWise AI</div>
        <p className={styles.navCaption}>Multi-page finance studio</p>
      </div>
      <div className={styles.pageTabs}>
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            className={`${styles.pageTab} ${activePage === page.id ? styles.pageTabActive : ""}`}
            onClick={() => onNavigate(page.id)}
          >
            <span>{page.label}</span>
            <small>{page.description}</small>
          </button>
        ))}
      </div>
      <button className={styles.themeToggle} onClick={onToggleTheme} aria-label="Toggle theme" type="button">
        {theme === "dark" ? "Light" : "Dark"}
      </button>
    </nav>
  );
}