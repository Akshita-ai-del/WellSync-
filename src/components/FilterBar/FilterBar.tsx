import type { FilterState, ProblemCategory, ProblemType, DifficultyLevel } from '../../types';
import { ministries } from '../../data/problems';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  filters: FilterState;
  onUpdate: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onReset: () => void;
  activeCount: number;
}

const CATEGORIES: Array<ProblemCategory | 'All'> = [
  'All', 'AI/ML', 'Software', 'Hardware', 'Blockchain', 'IoT', 'Robotics', 'Other',
];
const TYPES: Array<ProblemType | 'All'> = ['All', 'Software', 'Hardware', 'Both'];
const DIFFICULTIES: Array<DifficultyLevel | 'All'> = ['All', 'Easy', 'Medium', 'Hard'];

export function FilterBar({ filters, onUpdate, onReset, activeCount }: FilterBarProps) {
  return (
    <div className={styles.bar} role="search" aria-label="Filter problems">
      {/* Search */}
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon} aria-hidden="true">⌕</span>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search problems, IDs, organisations…"
          value={filters.search}
          onChange={(e) => onUpdate('search', e.target.value)}
          aria-label="Search problems"
        />
        {filters.search && (
          <button
            className={styles.clearBtn}
            onClick={() => onUpdate('search', '')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdowns row */}
      <div className={styles.dropdowns}>
        <FilterSelect
          label="Category"
          value={filters.category}
          options={CATEGORIES}
          onChange={(v) => onUpdate('category', v as FilterState['category'])}
        />
        <FilterSelect
          label="Ministry"
          value={filters.ministry}
          options={['All', ...ministries]}
          onChange={(v) => onUpdate('ministry', v as FilterState['ministry'])}
          wide
        />
        <FilterSelect
          label="Type"
          value={filters.problemType}
          options={TYPES}
          onChange={(v) => onUpdate('problemType', v as FilterState['problemType'])}
        />
        <FilterSelect
          label="Difficulty"
          value={filters.difficulty}
          options={DIFFICULTIES}
          onChange={(v) => onUpdate('difficulty', v as FilterState['difficulty'])}
        />

        {activeCount > 0 && (
          <button className={styles.resetBtn} onClick={onReset} aria-label="Reset all filters">
            Reset
            <span className={styles.resetBadge}>{activeCount}</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── FilterSelect sub-component ──────────────────────── */
interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  wide?: boolean;
}

function FilterSelect({ label, value, options, onChange, wide }: FilterSelectProps) {
  const isActive = value !== 'All';
  return (
    <div className={`${styles.selectWrap} ${wide ? styles.wide : ''}`}>
      <label className={styles.selectLabel}>{label}</label>
      <select
        className={`${styles.select} ${isActive ? styles.active : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Filter by ${label}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
