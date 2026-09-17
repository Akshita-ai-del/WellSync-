// ─── Core domain types ────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark';

export type ProblemCategory =
  | 'Software'
  | 'Hardware'
  | 'AI/ML'
  | 'Blockchain'
  | 'IoT'
  | 'Robotics'
  | 'Other';

export type ProblemType = 'Software' | 'Hardware' | 'Both';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface Organization {
  id: string;
  name: string;
  ministry: string;
}

export interface Department {
  id: string;
  name: string;
  organizationId: string;
}

export interface Problem {
  id: string;
  psId: string;           // SIH Problem Statement ID e.g. "SIH1234"
  title: string;
  description: string;
  backgroundContext: string;
  expectedSolution: string;
  organization: string;
  ministry: string;
  department: string;
  category: ProblemCategory;
  problemType: ProblemType;
  difficulty: DifficultyLevel;
  tags: string[];
  teamSize: string;        // e.g. "2-6 members"
  prizes: string;          // e.g. "₹1,00,000"
  postedAt: string;        // ISO date string
  deadline: string;        // ISO date string
  isBookmarked?: boolean;
}

// ─── UI state types ────────────────────────────────────────────────────────────

export interface FilterState {
  search: string;
  category: ProblemCategory | 'All';
  organization: string | 'All';
  ministry: string | 'All';
  problemType: ProblemType | 'All';
  difficulty: DifficultyLevel | 'All';
}

export interface AppState {
  selectedProblemId: string | null;
  theme: Theme;
  filters: FilterState;
  isDetailExpanded: boolean;
  isLoading: boolean;
  error: string | null;
}
