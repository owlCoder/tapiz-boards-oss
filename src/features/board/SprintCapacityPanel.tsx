"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Surface, useToast } from "@tapizlabs/ui";
import type { BoardColumnWithStories, ProjectMemberDto, SprintDto } from "@/domain/types";
import { doneColumnId } from "@/domain/services/board-insights";
import {
  MAX_WEEKLY_CAPACITY_HOURS,
  formatHours,
  inclusiveSprintDays,
  memberLoads,
  suggestSprintAssignments,
} from "@/domain/services/sprint-capacity";
import { assignStorySuggestionAction } from "@/lib/actions/board.actions";
import { setMemberCapacityAction } from "@/lib/actions/projects.actions";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

interface SprintCapacityPanelProps {
  projectId: string;
  sprint: SprintDto;
  columns: BoardColumnWithStories[];
  members: ProjectMemberDto[];
  canManage: boolean;
}

function WeeklyHoursField({
  projectId,
  userId,
  name,
  weeklyCapacityHours,
  label,
  onSaved,
}: {
  projectId: string;
  userId: string;
  name: string;
  weeklyCapacityHours: number | null;
  label: string;
  onSaved: (weeklyCapacityHours: number | null) => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dict } = useI18n();
  const saved = weeklyCapacityHours === null ? "" : String(weeklyCapacityHours);
  const [value, setValue] = useState(saved);
  const [prevSaved, setPrevSaved] = useState(saved);
  const [saving, setSaving] = useState(false);
  if (saved !== prevSaved) {
    setPrevSaved(saved);
    setValue(saved);
  }

  const commit = async () => {
    const trimmed = value.trim();
    if (trimmed === saved || saving) return;
    const hours = trimmed === "" ? null : Number(trimmed);
    if (hours !== null && (!Number.isInteger(hours) || hours < 0 || hours > MAX_WEEKLY_CAPACITY_HOURS)) {
      showToast(dict.teams.capacityInvalid, false);
      setValue(saved);
      return;
    }
    setSaving(true);
    const result = await setMemberCapacityAction(projectId, userId, hours);
    setSaving(false);
    if (!result.ok) {
      showToast(result.error, false);
      setValue(saved);
      return;
    }
    showToast(dict.teams.capacitySaved, true);
    onSaved(hours);
    router.refresh();
  };

  return (
    <label className="mt-3 flex items-center gap-2 text-xs text-(--tapiz-text-muted)">
      <span className="whitespace-nowrap">{label}</span>
      <input
        type="number"
        min={0}
        max={MAX_WEEKLY_CAPACITY_HOURS}
        step={1}
        inputMode="numeric"
        value={value}
        disabled={saving}
        placeholder="20"
        aria-label={`${label}: ${name}`}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className="w-16 rounded-lg border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface) px-2 py-1 text-sm text-(--tapiz-text-primary) outline-none focus:border-violet-500"
      />
    </label>
  );
}

export function SprintCapacityPanel({
  projectId,
  sprint,
  columns,
  members,
  canManage,
}: SprintCapacityPanelProps) {
  const { dict } = useI18n();
  const t = dict.board;
  const router = useRouter();
  const { showToast } = useToast();
  const [busyStoryId, setBusyStoryId] = useState<string | null>(null);
  const [weeklyOverride, setWeeklyOverride] = useState<Record<string, number | null>>({});
  const [membersStamp, setMembersStamp] = useState(members);
  if (members !== membersStamp) {
    setMembersStamp(members);
    setWeeklyOverride({});
  }

  const effectiveMembers = useMemo(
    () =>
      members.map((member) =>
        Object.prototype.hasOwnProperty.call(weeklyOverride, member.userId)
          ? { ...member, weeklyCapacityHours: weeklyOverride[member.userId] ?? null }
          : member,
      ),
    [members, weeklyOverride],
  );
  const stories = useMemo(() => columns.flatMap((column) => column.stories), [columns]);
  const doneId = doneColumnId(columns);
  const loads = useMemo(
    () => memberLoads(effectiveMembers, stories, sprint),
    [effectiveMembers, stories, sprint],
  );
  const plan = useMemo(
    () => suggestSprintAssignments(loads, stories, doneId),
    [loads, stories, doneId],
  );
  const ordered = [...loads].sort(
    (a, b) => Number(b.overloaded) - Number(a.overloaded) || a.name.localeCompare(b.name),
  );
  const busy = busyStoryId !== null;
  const missingEstimate = plan.unplaced.filter((item) => item.reason === "no_estimate");
  const noRoom = plan.unplaced.filter((item) => item.reason === "no_capacity");
  const sprintDays = inclusiveSprintDays(sprint.startDate, sprint.endDate);
  const showPlan =
    plan.suggestions.length > 0 ||
    missingEstimate.length > 0 ||
    plan.stillOverloaded.length > 0 ||
    plan.missingCapacity ||
    (!plan.missingCapacity && noRoom.length > 0);

  const applySuggestion = async (storyId: string, userId: string): Promise<boolean> => {
    const story = stories.find((item) => item.id === storyId);
    if (!story) return false;
    setBusyStoryId(storyId);
    const result = await assignStorySuggestionAction(projectId, story.id, userId, {
      assigneeId: story.assigneeId,
      estimatedHours: story.estimatedHours,
      sprintId: story.sprintId,
      columnId: story.columnId,
    });
    setBusyStoryId(null);
    if (!result.ok) {
      showToast(result.error, false);
      return false;
    }
    return true;
  };

  const applyOne = async (storyId: string, userId: string, moved: boolean) => {
    const applied = await applySuggestion(storyId, userId);
    if (!applied) return;
    showToast(moved ? t.suggestMoved : t.suggestApplied, true);
    router.refresh();
  };

  const applyAll = async () => {
    let appliedCount = 0;
    for (const suggestion of plan.suggestions) {
      const applied = await applySuggestion(suggestion.storyId, suggestion.userId);
      if (!applied) {
        if (appliedCount > 0) router.refresh();
        return;
      }
      appliedCount += 1;
    }
    showToast(t.suggestAllApplied, true);
    router.refresh();
  };

  return (
    <Surface variant="surface" padding="md" className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-(--tapiz-text-primary)">{t.capacityTitle}</h3>
        <p className="text-sm text-(--tapiz-text-muted)">{t.capacityIntro}</p>
      </div>

      {ordered.length === 0 ? (
        <p className="text-sm text-(--tapiz-text-muted)">{t.capacityNoMembers}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map((load) => {
            const capacity = load.sprintCapacityHours;
            const ratio =
              capacity !== null && capacity > 0 ? Math.min(100, (load.assignedHours / capacity) * 100) : 0;
            const status =
              capacity === null
                ? !canManage
                  ? t.capacityUnsetReadonly
                  : load.assignedHours > 0
                    ? fmt(t.capacityUnsetWithLoad, { hours: formatHours(load.assignedHours) })
                    : t.capacityUnset
                : load.overloaded
                  ? fmt(t.capacityOverload, { hours: formatHours(load.assignedHours - capacity) })
                  : fmt(t.capacityFree, { hours: formatHours(load.freeHours ?? 0) });
            return (
              <li
                key={load.userId}
                className="rounded-xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface) p-3"
              >
                <div className="flex items-center gap-2">
                  <Avatar name={load.name} size="xs" />
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-(--tapiz-text-primary)">
                    {load.name}
                  </p>
                </div>
                {canManage ? (
                  <WeeklyHoursField
                    projectId={projectId}
                    userId={load.userId}
                    name={load.name}
                    weeklyCapacityHours={load.weeklyCapacityHours}
                    label={t.capacityWeeklyInput}
                    onSaved={(hours) =>
                      setWeeklyOverride((current) => ({ ...current, [load.userId]: hours }))
                    }
                  />
                ) : load.weeklyCapacityHours !== null ? (
                  <p className="mt-3 text-xs text-(--tapiz-text-muted)">
                    {fmt(t.capacityWeekly, { hours: load.weeklyCapacityHours })}
                  </p>
                ) : null}
                {load.weeklyCapacityHours !== null && capacity !== null && sprintDays !== 7 && (
                  <p className="mt-1 text-xs text-(--tapiz-text-muted)">
                    {fmt(t.capacityScale, {
                      weekly: load.weeklyCapacityHours,
                      weeks: formatHours(sprintDays / 7),
                      sprint: formatHours(capacity),
                    })}
                  </p>
                )}
                <p className={`mt-3 font-mono text-xl leading-none ${load.overloaded ? "text-warn" : "text-(--tapiz-text-primary)"}`}>
                  {capacity === null
                    ? formatHours(load.assignedHours)
                    : `${formatHours(load.assignedHours)} / ${formatHours(capacity)}`}
                  <span className="ml-1 text-xs font-sans text-(--tapiz-text-muted)">h</span>
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-(--tapiz-bg-surface-muted)">
                  <div
                    className={`h-full rounded-full ${load.overloaded ? "bg-warn" : "bg-(--tapiz-accent)"}`}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
                <p className={`mt-2 text-xs ${load.overloaded ? "text-warn" : "text-(--tapiz-text-muted)"}`}>
                  {status}
                  {load.unestimatedCount > 0
                    ? ` · ${fmt(t.capacityUnestimated, { count: load.unestimatedCount })}`
                    : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {showPlan && (
        <div className="space-y-2 border-t border-(--tapiz-border-subtle) pt-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-(--tapiz-text-primary)">{t.suggestTitle}</h4>
            {plan.suggestions.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => void applyAll()} loading={busy} disabled={busy}>
                {t.suggestApplyAll}
              </Button>
            )}
          </div>
          <p className="text-sm text-(--tapiz-text-muted)">{t.suggestIntro}</p>
          {plan.missingCapacity && (
            <p className="text-sm text-(--tapiz-text-secondary)">{t.suggestMissingCapacity}</p>
          )}
          {plan.suggestions.length > 0 && (
            <ul className="divide-y divide-(--tapiz-border-subtle)">
              {plan.suggestions.map((suggestion) => {
                const sentence = suggestion.fromName
                  ? fmt(t.suggestMove, {
                      title: suggestion.storyTitle,
                      hours: formatHours(suggestion.estimatedHours),
                      from: suggestion.fromName,
                      to: suggestion.memberName,
                      fromHours: formatHours(suggestion.fromAssignedHoursAfter ?? 0),
                      toHours: formatHours(suggestion.assignedHoursAfter),
                    })
                  : fmt(t.suggestAssign, {
                      title: suggestion.storyTitle,
                      hours: formatHours(suggestion.estimatedHours),
                      to: suggestion.memberName,
                      toHours: formatHours(suggestion.assignedHoursAfter),
                    });
                return (
                  <li key={suggestion.storyId} className="flex items-center gap-3 py-2.5">
                    <span className="w-14 shrink-0 rounded-md bg-(--tapiz-bg-surface-muted) px-2 py-1 text-center font-mono text-xs text-(--tapiz-text-secondary)">
                      {fmt(t.hoursBadge, { hours: formatHours(suggestion.estimatedHours) })}
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-(--tapiz-text-primary)">{sentence}</p>
                    <Button
                      size="sm"
                      onClick={() => void applyOne(suggestion.storyId, suggestion.userId, suggestion.fromUserId !== null)}
                      loading={busyStoryId === suggestion.storyId}
                      disabled={busy}
                    >
                      {suggestion.fromUserId ? t.suggestApplyMove : t.suggestApply}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          {plan.stillOverloaded.map((member) => (
            <p key={member.userId} className="text-sm text-warn">
              {fmt(t.suggestStillOver, {
                name: member.memberName,
                hours: formatHours(member.overHours),
              })}
            </p>
          ))}
          {missingEstimate.length > 0 && (
            <p className="text-sm text-(--tapiz-text-muted)">
              {fmt(t.suggestNoEstimate, { title: missingEstimate.map((item) => item.storyTitle).join(", ") })}
            </p>
          )}
          {!plan.missingCapacity && noRoom.length > 0 && (
            <p className="text-sm text-warn">
              {fmt(t.suggestNoFitList, {
                titles: noRoom
                  .map((item) =>
                    item.estimatedHours === null
                      ? item.storyTitle
                      : `${item.storyTitle} (${formatHours(item.estimatedHours)} h)`,
                  )
                  .join(", "),
              })}
            </p>
          )}
        </div>
      )}
    </Surface>
  );
}
