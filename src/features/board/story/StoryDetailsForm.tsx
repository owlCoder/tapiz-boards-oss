"use client";

import { useId } from "react";
import { FieldLabel, Input, Select, Textarea } from "@tapizlabs/ui";
import type { BoardColumnDto, ProjectMemberDto, SprintDto, StoryPriority } from "@/domain/types";
import { useI18n } from "@/i18n/I18nProvider";
import { BACKLOG, NONE } from "./hooks/useStoryForm";

interface DetailRowProps {
  id: string;
  label: string;
  children: React.ReactNode;
}

function DetailRow({ id, label, children }: DetailRowProps) {
  return (
    <div className="space-y-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
    </div>
  );
}

interface StoryDetailsFormProps {
  title: string;
  description: string;
  columnId: string;
  assigneeId: string;
  sprintId: string;
  storyPoints: string;
  priority: StoryPriority;
  dueDate: string;
  columns: BoardColumnDto[];
  members: ProjectMemberDto[];
  sprints: SprintDto[];
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onColumnChange: (v: string) => void;
  onAssigneeChange: (v: string) => void;
  onSprintChange: (v: string) => void;
  onStoryPointsChange: (v: string) => void;
  onPriorityChange: (v: StoryPriority) => void;
  onDueDateChange: (v: string) => void;
}

export function StoryDetailsForm({
  title, description, columnId, assigneeId, sprintId,
  storyPoints, priority, dueDate,
  columns, members, sprints,
  onTitleChange, onDescriptionChange, onColumnChange,
  onAssigneeChange, onSprintChange, onStoryPointsChange,
  onPriorityChange, onDueDateChange,
}: StoryDetailsFormProps) {
  const { dict } = useI18n();
  const fieldId = useId();
  const t = dict.board;
  const availableSprints = sprints.filter((s) => s.status !== "completed" || s.id === sprintId);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <FieldLabel htmlFor={`${fieldId}-story-title`}>{t.titleLabel}</FieldLabel>
        <Input
          id={`${fieldId}-story-title`}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="font-display text-lg font-semibold"
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow id={`${fieldId}-story-status`} label={t.statusLabel}>
          <Select
            id={`${fieldId}-story-status`}
            value={columnId}
            onChange={(e) => onColumnChange(e.target.value)}
          >
            <option value={BACKLOG}>{t.backlog}</option>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </DetailRow>
        <DetailRow id={`${fieldId}-story-assignee`} label={t.assigneeLabel}>
          <Select
            id={`${fieldId}-story-assignee`}
            value={assigneeId}
            onChange={(e) => onAssigneeChange(e.target.value)}
          >
            <option value={NONE}>{t.nobody}</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </Select>
        </DetailRow>
        <DetailRow id={`${fieldId}-story-points`} label={t.storyPointsLabel}>
          <Input
            id={`${fieldId}-story-points`}
            type="number"
            min={0}
            max={100}
            step={1}
            value={storyPoints}
            onChange={(e) => onStoryPointsChange(e.target.value)}
            placeholder="—"
          />
        </DetailRow>
        <DetailRow id={`${fieldId}-story-sprint`} label={t.sprintLabel}>
          <Select
            id={`${fieldId}-story-sprint`}
            value={sprintId}
            onChange={(e) => onSprintChange(e.target.value)}
          >
            <option value={NONE}>{t.noSprint}</option>
            {availableSprints.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </DetailRow>
        <DetailRow id={`${fieldId}-story-priority`} label={t.priorityLabel}>
          <Select
            id={`${fieldId}-story-priority`}
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as StoryPriority)}
          >
            <option value="low">{t.priorityLow}</option>
            <option value="medium">{t.priorityMedium}</option>
            <option value="high">{t.priorityHigh}</option>
          </Select>
        </DetailRow>
        <DetailRow id={`${fieldId}-story-due-date`} label={t.dueDateLabel}>
          <Input
            id={`${fieldId}-story-due-date`}
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />
        </DetailRow>
      </div>
      <div>
        <FieldLabel htmlFor={`${fieldId}-story-description`}>{t.descriptionLabel}</FieldLabel>
        <Textarea
          id={`${fieldId}-story-description`}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={5}
          placeholder={t.descriptionPlaceholder}
        />
      </div>
    </div>
  );
}
