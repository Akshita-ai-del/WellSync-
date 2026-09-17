import { useState } from 'react';
import type { Problem, DifficultyLevel, ProblemCategory } from '../../types';
import styles from './ProblemDetail.module.css';

interface ProblemDetailProps {
  problem: Problem | null;
}

export function ProblemDetail({ problem }: ProblemDetailProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('description');

  if (!problem) {
    return (
      <div className={styles.empty} role="main" aria-label="Problem details">
        <div className={styles.emptyContent}>
          <span className={styles.emptyGlyph} aria-hidden="true">⊡</span>
          <h2 className={styles.emptyTitle}>Select a problem statement</h2>
          <p className={styles.emptyBody}>
            Choose a problem from the list to view its full details, background context, and expected solution.
          </p>
          <div className={styles.shortcuts}>
            <kbd>↑</kbd><kbd>↓</kbd> Navigate
            <span>·</span>
            <kbd>Enter</kbd> Select
            <span>·</span>
            <kbd>/</kbd> Search
            <span>·</span>
            <kbd>T</kbd> Theme
          </div>
        </div>
      </div>
    );
  }

  const toggle = (key: string) => {
    setExpandedSection((prev) => (prev === key ? null : key));
  };

  return (
    <main className={styles.panel} aria-label="Problem detail">
      {/* ── Header ──────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.idGroup}>
            <span className={`${styles.psId} text-mono`}>{problem.psId}</span>
            <CategoryTag category={problem.category} />
            <DifficultyTag level={problem.difficulty} />
            <TypeTag type={problem.problemType} />
          </div>
          <div className={styles.prizes}>
            <span className={styles.prizeLabel}>Prize</span>
            <span className={styles.prizeVal}>{problem.prizes}</span>
          </div>
        </div>

        <h1 className={styles.title}>{problem.title}</h1>

        {/* Metadata grid */}
        <div className={styles.metaGrid}>
          <MetaCell label="Organisation" value={problem.organization} />
          <MetaCell label="Ministry" value={problem.ministry} />
          <MetaCell label="Department" value={problem.department} />
          <MetaCell label="Team Size" value={problem.teamSize} />
          <MetaCell label="Deadline" value={formatDate(problem.deadline)} />
          <MetaCell label="Posted" value={formatDate(problem.postedAt)} />
        </div>

        {/* Tags */}
        <div className={styles.tags} aria-label="Tags">
          {problem.tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>

      {/* ── Sections ────────────────────────────────────── */}
      <div className={styles.sections}>
        <Section
          id="description"
          label="Problem Statement"
          content={problem.description}
          isOpen={expandedSection === 'description'}
          onToggle={() => toggle('description')}
        />
        <Section
          id="background"
          label="Background Context"
          content={problem.backgroundContext}
          isOpen={expandedSection === 'background'}
          onToggle={() => toggle('background')}
        />
        <Section
          id="solution"
          label="Expected Solution"
          content={problem.expectedSolution}
          isOpen={expandedSection === 'solution'}
          onToggle={() => toggle('solution')}
        />
      </div>
    </main>
  );
}

/* ─── Section accordion ─────────────────────────────────── */
interface SectionProps {
  id: string;
  label: string;
  content: string;
  isOpen: boolean;
  onToggle: () => void;
}

function Section({ id, label, content, isOpen, onToggle }: SectionProps) {
  return (
    <div className={`${styles.section} ${isOpen ? styles.sectionOpen : ''}`}>
      <button
        className={styles.sectionHeader}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`section-${id}`}
        id={`section-btn-${id}`}
      >
        <span className={styles.sectionLabel}>{label}</span>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} aria-hidden="true">
          ›
        </span>
      </button>

      <div
        id={`section-${id}`}
        role="region"
        aria-labelledby={`section-btn-${id}`}
        className={styles.sectionBody}
        hidden={!isOpen}
      >
        <p className={styles.sectionText}>{content}</p>
      </div>
    </div>
  );
}

/* ─── Metadata cell ─────────────────────────────────────── */
function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metaCell}>
      <span className={styles.metaLabel}>{label}</span>
      <span className={styles.metaValue}>{value}</span>
    </div>
  );
}

/* ─── Tag components ────────────────────────────────────── */
const catMap: Record<ProblemCategory, string> = {
  'AI/ML': 'aiml', 'Software': 'software', 'Hardware': 'hardware',
  'Blockchain': 'blockchain', 'IoT': 'iot', 'Robotics': 'robotics', 'Other': 'other',
};

function CategoryTag({ category }: { category: ProblemCategory }) {
  const key = catMap[category];
  return (
    <span
      className={styles.tag2}
      style={{ color: `var(--cat-${key})`, background: `var(--cat-${key}-bg)` }}
    >
      {category}
    </span>
  );
}

function DifficultyTag({ level }: { level: DifficultyLevel }) {
  const colorMap: Record<DifficultyLevel, { c: string; bg: string }> = {
    Easy:   { c: 'var(--diff-easy)',   bg: 'var(--diff-easy-bg)' },
    Medium: { c: 'var(--diff-medium)', bg: 'var(--diff-medium-bg)' },
    Hard:   { c: 'var(--diff-hard)',   bg: 'var(--diff-hard-bg)' },
  };
  return (
    <span
      className={styles.tag2}
      style={{ color: colorMap[level].c, background: colorMap[level].bg }}
    >
      {level}
    </span>
  );
}

function TypeTag({ type }: { type: string }) {
  return <span className={styles.tag2} style={{ color: 'var(--text-secondary)', background: 'var(--bg-badge)' }}>{type}</span>;
}

/* ─── Utilities ─────────────────────────────────────────── */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
