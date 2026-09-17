import type { Problem } from '../../types';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  selectedProblem: Problem | null;
  resultCount: number;
  totalCount: number;
  activeFilterCount: number;
}

export function StatusBar({ selectedProblem, resultCount, totalCount, activeFilterCount: _activeFilterCount }: StatusBarProps) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <footer className={styles.bar} role="contentinfo" aria-label="Status bar">
      <div className={styles.left}>
        {selectedProblem ? (
          <span className={`${styles.chip} ${styles.active}`}>
            <span className={styles.dot} aria-hidden="true" />
            {selectedProblem.id}
          </span>
        ) : (
          <span className={styles.idle}>No selection</span>
        )}
      </div>

      <div className={styles.center}>
        <span className={styles.brand}>WellSync</span>
        <span className={styles.sep} aria-hidden="true">·</span>
        <span className={styles.version}>v1.0.0</span>
      </div>

      <div className={styles.right}>
        <span className={styles.stat} aria-live="polite">
          {resultCount} of {totalCount} problems
        </span>
        <span className={styles.sep} aria-hidden="true">·</span>
        <time className={styles.time} aria-label="Current time">{timeStr}</time>
      </div>
    </footer>
  );
}
