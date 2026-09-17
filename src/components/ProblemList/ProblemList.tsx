import type { Problem, ProblemCategory, DifficultyLevel } from '../../types';
import styles from './ProblemList.module.css';

interface ProblemListProps {
  problems: Problem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProblemList({ problems, selectedId, onSelect }: ProblemListProps) {
  if (problems.length === 0) {
    return (
      <div className={styles.empty} role="status">
        <span className={styles.emptyIcon} aria-hidden="true">◌</span>
        <p className={styles.emptyTitle}>No problems found</p>
        <p className={styles.emptyBody}>Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <ul className={styles.list} role="listbox" aria-label="Problem statements">
      {problems.map((problem) => (
        <ProblemListItem
          key={problem.id}
          problem={problem}
          isSelected={problem.id === selectedId}
          onClick={() => onSelect(problem.id)}
        />
      ))}
    </ul>
  );
}

/* ─── List item ─────────────────────────────────────────── */
interface ItemProps {
  problem: Problem;
  isSelected: boolean;
  onClick: () => void;
}

function ProblemListItem({ problem, isSelected, onClick }: ItemProps) {
  return (
    <li
      role="option"
      aria-selected={isSelected}
      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      tabIndex={0}
    >
      {/* Top row: ID + category badge */}
      <div className={styles.itemHeader}>
        <span className={`${styles.psId} text-mono`}>{problem.psId}</span>
        <CategoryBadge category={problem.category} />
      </div>

      {/* Title */}
      <p className={`${styles.title} truncate`}>{problem.title}</p>

      {/* Bottom row: org + difficulty */}
      <div className={styles.itemFooter}>
        <span className={`${styles.org} truncate`}>{problem.organization}</span>
        <DifficultyPip level={problem.difficulty} />
      </div>
    </li>
  );
}

/* ─── Category badge ────────────────────────────────────── */
const catMap: Record<ProblemCategory, string> = {
  'AI/ML':      'aiml',
  'Software':   'software',
  'Hardware':   'hardware',
  'Blockchain': 'blockchain',
  'IoT':        'iot',
  'Robotics':   'robotics',
  'Other':      'other',
};

function CategoryBadge({ category }: { category: ProblemCategory }) {
  const key = catMap[category];
  return (
    <span
      className={styles.catBadge}
      style={{
        color: `var(--cat-${key})`,
        background: `var(--cat-${key}-bg)`,
      }}
    >
      {category}
    </span>
  );
}

/* ─── Difficulty pip ────────────────────────────────────── */
function DifficultyPip({ level }: { level: DifficultyLevel }) {
  const colorMap: Record<DifficultyLevel, string> = {
    Easy:   'var(--diff-easy)',
    Medium: 'var(--diff-medium)',
    Hard:   'var(--diff-hard)',
  };
  return (
    <span
      className={styles.diffPip}
      aria-label={`Difficulty: ${level}`}
      title={`Difficulty: ${level}`}
      style={{ color: colorMap[level] }}
    >
      ● {level}
    </span>
  );
}
