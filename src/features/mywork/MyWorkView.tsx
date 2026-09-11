"use client";

import Link from "next/link";
import {
  Avatar,
  Badge,
  ChevronRight,
  Clock,
  EmptyState,
  Grid,
  PageHeader,
  SectionCard,
  Surface,
  Users,
} from "@tapizlabs/ui";
import { isOverdue, type MyWorkItem } from "@/domain/types";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";
import { formatIsoDate, todayIso } from "@/lib/date";

interface MyWorkViewProps {
  firstName: string;
  items: MyWorkItem[];
}

interface ProjectGroup {
  projectId: string;
  projectName: string;
  items: MyWorkItem[];
}

function groupByProject(items: MyWorkItem[]): ProjectGroup[] {
  const map = new Map<string, ProjectGroup>();
  for (const item of items) {
    const group = map.get(item.projectId);
    if (group) {
      group.items.push(item);
    } else {
      map.set(item.projectId, { projectId: item.projectId, projectName: item.projectName, items: [item] });
    }
  }
  return Array.from(map.values());
}

export function MyWorkView({ firstName, items }: MyWorkViewProps) {
  const { dict } = useI18n();
  const t = dict.myWork;
  const today = todayIso();
  const overdueCount = items.filter((item) => isOverdue(item.dueDate, today)).length;
  const highCount = items.filter((item) => item.priority === "high").length;
  const groups = groupByProject(items);

  const stats: { label: string; value: number; tone: "default" | "danger" | "accent" }[] = [
    { label: t.statTotal, value: items.length, tone: "default" },
    { label: t.statOverdue, value: overdueCount, tone: "danger" },
    { label: t.statHigh, value: highCount, tone: "accent" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={fmt(t.title, { name: firstName })}
        subtitle={t.description}
        variant="enterprise"
      />

      {items.length > 0 && (
        <Surface
          variant="raised"
          padding="sm"
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-x-4"
        >
          <div className="grid grid-cols-3 gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:items-center">
            {stats.map((stat) => {
              const active = stat.value > 0;
              const valueColor =
                stat.tone === "danger" && active
                  ? "text-warn"
                  : stat.tone === "accent" && active
                    ? "text-(--tapiz-accent)"
                    : "text-(--tapiz-text-primary)";
              return (
                <span key={stat.label} className="flex items-center gap-2">
                  <span className={`font-display text-sm font-bold leading-none ${valueColor}`}>
                    {stat.value}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--tapiz-text-secondary)">
                    {stat.label}
                  </span>
                </span>
              );
            })}
          </div>
        </Surface>
      )}

      {items.length === 0 ? (
        <EmptyState title={t.emptyTitle} message={t.emptyMessage} />
      ) : (
        groups.map((group) => (
          <SectionCard
            key={group.projectId}
            title={
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-(--tapiz-accent) bg-(--color-icon-bg) text-(--tapiz-accent)">
                  <Users size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block">{group.projectName}</span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-(--tapiz-text-muted)">
                    {group.items.length} {t.taskCountLabel}
                  </span>
                </span>
              </span>
            }
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            action={
              <Link
                href={`/projects/${group.projectId}/board`}
                className="flex items-center gap-1 whitespace-nowrap rounded-md border border-(--tapiz-border-strong) bg-(--tapiz-bg-surface-raised) px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-(--tapiz-accent) no-underline transition-colors hover:bg-(--tapiz-accent-soft)"
              >
                <Grid size={13} /> {t.openBoard}
              </Link>
            }
          >
            <ul className="divide-y divide-(--tapiz-border-subtle) overflow-hidden rounded-xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface)">
              {group.items.map((item) => {
                const overdue = isOverdue(item.dueDate, today);
                const railColor = overdue
                  ? "bg-warn"
                  : item.priority === "high"
                  ? "bg-primary-400"
                  : "bg-primary-300";
                return (
                  <li key={item.id}>
                    <Link
                      href={`/projects/${item.projectId}/board`}
                      className="group relative flex items-center gap-3 py-3 pl-5 pr-3 no-underline transition-colors hover:bg-(--tapiz-accent-soft)"
                    >
                      <span className={`absolute inset-y-0 left-0 w-1 ${railColor}`} aria-hidden />

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="truncate text-sm font-semibold text-(--tapiz-text-primary)">{item.title}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="muted">{item.columnName ?? dict.board.tabBacklog}</Badge>
                          {item.sprintName && <Badge variant="info">{item.sprintName}</Badge>}
                          {item.priority !== "medium" && (
                            <Badge variant={item.priority === "high" ? "danger" : "muted"}>
                              {item.priority === "high" ? dict.board.priorityHigh : dict.board.priorityLow}
                            </Badge>
                          )}
                          {item.storyPoints !== null && <Badge variant="info">{item.storyPoints} SP</Badge>}
                          {item.dueDate !== null && (
                            <span
                              className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                                overdue ? "font-bold text-warn" : "text-(--tapiz-text-muted)"
                              }`}
                            >
                              {overdue && <Clock size={12} />}
                              {overdue
                                ? fmt(t.overdue, { date: formatIsoDate(item.dueDate) })
                                : fmt(t.dueOn, { date: formatIsoDate(item.dueDate) })}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="shrink-0" title={item.assigneeName ?? item.authorName}>
                        <Avatar name={item.assigneeName ?? item.authorName} size="xs" />
                      </span>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-(--tapiz-text-muted) opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        ))
      )}
    </div>
  );
}
