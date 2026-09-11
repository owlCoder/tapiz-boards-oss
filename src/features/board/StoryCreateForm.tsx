"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Check,
  FieldLabel,
  FormError,
  Input,
  Plus,
  Select,
  Textarea,
  X,
} from "@tapizlabs/ui";
import type { BoardColumnDto, SprintDto } from "@/domain/types";
import { createStoryAction } from "@/lib/actions/board.actions";
import { useI18n } from "@/i18n/I18nProvider";
import { SidePanel } from "@/components/layout/SidePanel";

interface StoryCreateFormProps {
  isOpen: boolean;
  projectId: string;
  columns: BoardColumnDto[];
  sprints: SprintDto[];
  /** null = backlog */
  defaultColumnId: string | null;
  defaultSprintId?: string | null;
  onClose: () => void;
}

const BACKLOG = "__backlog__";
const NONE = "__none__";

/** Novi user story — bočni panel sa desne strane. */
export function StoryCreateForm({
  isOpen,
  projectId,
  columns,
  sprints,
  defaultColumnId,
  defaultSprintId = null,
  onClose,
}: StoryCreateFormProps) {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.board;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState<string>(defaultColumnId ?? BACKLOG);
  const [sprintId, setSprintId] = useState<string>(defaultSprintId ?? NONE);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const availableSprints = sprints.filter((sprint) => sprint.status !== "completed");

  // Reset pri otvaranju tokom rendera (React šablon umesto setState u efektu).
  const [prevOpen, setPrevOpen] = useState(false);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setTitle("");
      setDescription("");
      setColumnId(defaultColumnId ?? BACKLOG);
      setSprintId(defaultSprintId ?? NONE);
      setError(null);
    }
  }

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const result = await createStoryAction(
      projectId,
      { title, description },
      columnId === BACKLOG ? null : columnId,
      sprintId === NONE ? null : sprintId,
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
    router.refresh();
  };

  return (
    <SidePanel
      open={isOpen}
      title={t.newStoryTitle}
      subtitle={t.newStorySubtitle}
      icon={<Plus size={18} />}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button
            fullWidth
            icon={<Check size={14} />}
            loading={loading}
            disabled={!title.trim()}
            onClick={() => void handleSubmit()}
          >
            {dict.common.create}
          </Button>
          <Button variant="secondary" fullWidth icon={<X size={14} />} onClick={onClose}>
            {dict.common.cancel}
          </Button>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <FieldLabel htmlFor="st-title">{t.titleLabel}</FieldLabel>
          <Input
            id="st-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div>
          <FieldLabel htmlFor="st-col">{t.placeIn}</FieldLabel>
          <Select id="st-col" value={columnId} onChange={(e) => setColumnId(e.target.value)}>
            <option value={BACKLOG}>{t.backlog}</option>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor="st-sprint">{t.sprintLabel}</FieldLabel>
          <Select id="st-sprint" value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
            <option value={NONE}>{t.noSprint}</option>
            {availableSprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor="st-desc">{t.descriptionLabel}</FieldLabel>
          <Textarea
            id="st-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={t.descriptionPlaceholder}
          />
        </div>
        <FormError message={error} />
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </SidePanel>
  );
}
