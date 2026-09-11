"use client";

import { Calendar, CheckCircle, Layers, Surface, Zap } from "@tapizlabs/ui";
import type { ReactNode } from "react";
import type { SprintDto } from "@/domain/types";
import { useI18n } from "@/i18n/I18nProvider";

interface SprintStatsProps {
  sprints: SprintDto[];
  /** Akcije (Статистика / Нови спринт) — stoje desno u traci. */
  actions?: ReactNode;
}

/** Танка Jira-стил трака бројача спринтова (исти образац као BoardSprintBar / Backlog). */
export function SprintStats({ sprints, actions }: SprintStatsProps) {
  const { dict } = useI18n();
  const t = dict.sprints;

  const stats: { label: string; value: ReactNode; icon: ReactNode }[] = [
    { label: dict.board.tabSprints, value: sprints.length, icon: <Layers size={15} /> },
    { label: t.statusPlanned, value: sprints.filter((s) => s.status === "planned").length, icon: <Calendar size={15} /> },
    { label: t.statusActive, value: sprints.filter((s) => s.status === "active").length, icon: <Zap size={15} /> },
    { label: t.statusCompleted, value: sprints.filter((s) => s.status === "completed").length, icon: <CheckCircle size={15} /> },
  ];

  return (
    <Surface
      variant="raised"
      padding="sm"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-x-4"
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6">
        {stats.map((stat) => (
          <span key={stat.label} className="flex items-center gap-2">
            <span className="text-(--tapiz-accent)">{stat.icon}</span>
            <span className="font-display text-sm font-bold leading-none text-(--tapiz-text-primary)">
              {stat.value}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--tapiz-text-secondary)">
              {stat.label}
            </span>
          </span>
        ))}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{actions}</div>}
    </Surface>
  );
}
