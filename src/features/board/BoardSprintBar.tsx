"use client";

import { Surface } from "@tapizlabs/ui";
import type { BoardColumnWithStories, SprintDto } from "@/domain/types";
import { doneColumnId, storyProgress } from "@/domain/services/board-insights";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";
import { formatIsoDate, todayIso } from "@/lib/date";

interface BoardSprintBarProps {
  /** Aktivan sprint; NULL kada ga nema. */
  sprint: SprintDto | null;
  columns: BoardColumnWithStories[];
}

/**
 * Tanka Jira-stil sprint traka: ime + datumi + dani-do-kraja, sa sažetim progresom desno.
 * Bez velikog progress bara i bez metric čipova — sve u jednom redu iznad board-a.
 */
export function BoardSprintBar({ sprint, columns }: BoardSprintBarProps) {
  const { dict } = useI18n();
  const t = dict.board;
  if (!sprint) return null;

  const doneId = doneColumnId(columns);
  const stories = columns.flatMap((c) => c.stories);
  const { doneCount, totalCount, donePoints, totalPoints } = storyProgress(stories, doneId);
  const pct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const today = todayIso();
  const overdue = sprint.endDate < today && pct < 100;
  const msPerDay = 86_400_000;
  const daysLeft = Math.ceil((new Date(sprint.endDate).getTime() - new Date(today).getTime()) / msPerDay);
  const daysLabel =
    daysLeft < 0
      ? fmt(t.sprintDaysOver, { days: Math.abs(daysLeft) })
      : fmt(t.sprintDaysLeft, { days: Math.max(0, daysLeft) });

  return (
    <Surface
      variant="raised"
      padding="sm"
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
    >
      <span className="font-display text-sm font-bold tracking-tight text-(--tapiz-accent)">
        {sprint.name}
      </span>
      <span className="font-mono text-xs text-(--tapiz-text-secondary)">
        {formatIsoDate(sprint.startDate)}–{formatIsoDate(sprint.endDate)}
      </span>
      <span
        className={`rounded-full border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest ${
          overdue ? "border-warn/40 text-warn" : "border-signal-400 text-signal-400"
        }`}
      >
        {daysLabel}
      </span>
      {sprint.goal?.trim() && (
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-(--tapiz-text-primary)">
          {sprint.goal}
        </span>
      )}
      <span className="ml-auto flex items-center gap-2 whitespace-nowrap">
        <span className="font-mono text-xs font-medium text-(--tapiz-text-secondary)">
          {fmt(t.sprintProgress, { done: doneCount, total: totalCount, points: donePoints, totalPoints })}
        </span>
        <span
          className={`font-display text-sm font-bold ${
            pct === 100 ? "text-(--tapiz-accent)" : overdue ? "text-warn" : "text-(--tapiz-text-primary)"
          }`}
        >
          {pct}%
        </span>
      </span>
    </Surface>
  );
}
