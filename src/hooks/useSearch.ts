import { useMemo, useState } from 'react';
import type { FilterState, Problem } from '../types';
import { problems as allProblems } from '../data/problems';

const defaultFilters: FilterState = {
  search: '',
  category: 'All',
  organization: 'All',
  ministry: 'All',
  problemType: 'All',
  difficulty: 'All',
};

export function useSearch() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  const filtered = useMemo<Problem[]>(() => {
    return allProblems.filter((p) => {
      const q = filters.search.toLowerCase();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.psId.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.organization.toLowerCase().includes(q);

      const matchCategory = filters.category === 'All' || p.category === filters.category;
      const matchOrg = filters.organization === 'All' || p.organization === filters.organization;
      const matchMinistry = filters.ministry === 'All' || p.ministry === filters.ministry;
      const matchType = filters.problemType === 'All' || p.problemType === filters.problemType;
      const matchDiff = filters.difficulty === 'All' || p.difficulty === filters.difficulty;

      return matchSearch && matchCategory && matchOrg && matchMinistry && matchType && matchDiff;
    });
  }, [filters]);

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'search' && v !== 'All'
  ).length;

  return { filters, filtered, updateFilter, resetFilters, activeFilterCount };
}
