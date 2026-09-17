import type { Theme } from '../../types';
import styles from './SystemBar.module.css';

interface SystemBarProps {
  theme: Theme;
  onToggleTheme: () => void;
  resultCount: number;
  totalCount: number;
}

export function SystemBar({ theme, onToggleTheme, resultCount, totalCount }: SystemBarProps) {
  return (
    <header className={styles.bar} role="banner">
      {/* Traffic lights */}
      <div className={styles.trafficLights} aria-hidden="true">
        <span className={`${styles.dot} ${styles.close}`} />
        <span className={`${styles.dot} ${styles.min}`} />
        <span className={`${styles.dot} ${styles.full}`} />
      </div>

      {/* App identity */}
      <div className={styles.identity}>
        <span className={styles.logoMark} aria-hidden="true">◈</span>
        <span className={styles.appName}>WellSync</span>
        <span className={styles.divider} aria-hidden="true">·</span>
        <span className={styles.subtitle}>SIH Problem Explorer</span>
      </div>

      {/* Right controls */}
      <div className={styles.controls}>
        <span className={styles.counter} aria-live="polite" aria-atomic="true">
          {resultCount} / {totalCount}
        </span>

        <button
          className={styles.themeBtn}
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode (T)`}
        >
          {theme === 'light' ? '◑' : '◐'}
        </button>
      </div>
    </header>
  );
}
