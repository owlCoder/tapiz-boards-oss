"use client";

import { useMemo, useState } from "react";
import type { BoardColumnWithStories, StoryPriority } from "@/domain/types";
import { ALL } from "./board/BoardFilters";

export interface BoardFiltersState {
  search: string;
  filterAssignee: string;
  filterPriority: string;
  filtersActive: boolean;
  setSearch: (v: string) => void;
  setFilterAssignee: (v: string) => void;
  setFilterPriority: (v: string) => void;
  clearFilters: () => void;
  applyFilters: (columns: BoardColumnWithStories[]) => BoardColumnWithStories[];
}

export function useBoardFilters(): BoardFiltersState {
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState(ALL);
  const [filterPriority, setFilterPriority] = useState<string>(ALL);

  const filtersActive =
    search.trim() !== "" ||
    filterAssignee !== ALL ||
    filterPriority !== ALL;

  const clearFilters = () => {
    setSearch("");
    setFilterAssignee(ALL);
    setFilterPriority(ALL);
  };

  const applyFilters = useMemo(
    () =>
      (columns: BoardColumnWithStories[]): BoardColumnWithStories[] => {
        if (!filtersActive) return columns;
        const query = search.trim().toLowerCase();
        return columns.map((column) => ({
          ...column,
          stories: column.stories.filter((story) => {
            if (query !== "" && !story.title.toLowerCase().includes(query)) return false;
            if (filterAssignee !== ALL && story.assigneeId !== filterAssignee) return false;
            if (filterPriority !== ALL && story.priority !== (filterPriority as StoryPriority))
              return false;
            return true;
          }),
        }));
      },
    [filtersActive, search, filterAssignee, filterPriority],
  );

  return {
    search,
    filterAssignee,
    filterPriority,
    filtersActive,
    setSearch,
    setFilterAssignee,
    setFilterPriority,
    clearFilters,
    applyFilters,
  };
}
