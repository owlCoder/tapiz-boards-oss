"use client";

import { BarList, DonutMetric, Surface } from "@tapizlabs/ui";
import type { BoardColumnWithStories, ProjectMemberDto } from "@/domain/types";
import { doneColumnId, storyProgress } from "@/domain/services/board-insights";
import { useI18n } from "@/i18n/I18nProvider";

interface BoardInsightsProps {
  columns: BoardColumnWithStories[];
  members: ProjectMemberDto[];
  /** Vertikalni stack (za uski side panel); podrazumevano je grid sa 3 kolone. */
  stacked?: boolean;
}

/**
 * Chartovi tima nad već učitanim board podacima — bez dodatnih upita.
 * Učitava se lenjo (next/dynamic) da ne ulazi u inicijalni bundle boarda.
 */
export function BoardInsights({ columns, members, stacked = false }: BoardInsightsProps) {
  const { dict } = useI18n();
  const t = dict.board;
  const stories = columns.flatMap((column) => column.stories);
  const progress = storyProgress(stories, doneColumnId(columns));

  const byMember = members
    .map((member) => {
      const mine = stories.filter((story) => story.assigneeId === member.userId);
      const points = mine.reduce((sum, story) => sum + (story.storyPoints ?? 0), 0);
      return {
        label: `${member.firstName} ${member.lastName}`,
        value: mine.length,
        detail: `${points} SP`,
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const byColumn = columns.map((column) => ({
    label: column.name,
    value: column.stories.length,
    detail: `${column.stories.reduce((sum, story) => sum + (story.storyPoints ?? 0), 0)} SP`,
  }));

  return (
    <div className={stacked ? "grid gap-4" : "grid gap-4 lg:grid-cols-3"}>
      <Surface variant="surface" padding="md" className="flex flex-col items-center justify-center gap-2">
        <DonutMetric
          value={progress.donePoints}
          max={Math.max(progress.totalPoints, 1)}
          label={`${progress.donePoints}/${progress.totalPoints} SP`}
          caption={t.insightsDone}
          size={132}
        />
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-(--tapiz-text-muted)">
          {progress.doneCount}/{progress.totalCount} {dict.sprints.storyMany}
        </p>
      </Surface>
      <Surface variant="surface" padding="md" className="space-y-3">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-(--tapiz-text-muted)">
          {t.insightsByMember}
        </h4>
        {byMember.length === 0 ? (
          <p className="text-sm text-(--tapiz-text-muted)">{t.insightsNoAssigned}</p>
        ) : (
          <BarList items={byMember} />
        )}
      </Surface>
      <Surface variant="surface" padding="md" className="space-y-3">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-(--tapiz-text-muted)">
          {t.insightsByColumn}
        </h4>
        <BarList items={byColumn} />
      </Surface>
    </div>
  );
}
