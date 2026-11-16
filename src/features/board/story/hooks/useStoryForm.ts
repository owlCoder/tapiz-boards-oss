"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@tapizlabs/ui";
import type { StoryDto, StoryPriority } from "@/domain/types";
import { MAX_ESTIMATED_HOURS } from "@/domain/services/sprint-capacity";
import { updateStoryFullAction } from "@/lib/actions/board.actions";
import { useI18n } from "@/i18n/I18nProvider";

const BACKLOG = "__backlog__";
const NONE = "__none__";

export { BACKLOG, NONE };

export function useStoryForm(projectId: string, story: StoryDto | null, onClose: () => void) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dict } = useI18n();

  const [title, setTitle] = useState(story?.title ?? "");
  const [description, setDescription] = useState(story?.description ?? "");
  const [columnId, setColumnId] = useState(story?.columnId ?? BACKLOG);
  const [assigneeId, setAssigneeId] = useState(story?.assigneeId ?? NONE);
  const [sprintId, setSprintId] = useState(story?.sprintId ?? NONE);
  const [storyPoints, setStoryPoints] = useState(
    story?.storyPoints === null || story?.storyPoints === undefined
      ? ""
      : String(story.storyPoints),
  );
  const [estimatedHours, setEstimatedHours] = useState(
    story?.estimatedHours === null || story?.estimatedHours === undefined
      ? ""
      : String(story.estimatedHours),
  );
  const [priority, setPriority] = useState<StoryPriority>(story?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(story?.dueDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const resetToStory = (s: StoryDto) => {
    setTitle(s.title);
    setDescription(s.description ?? "");
    setColumnId(s.columnId ?? BACKLOG);
    setAssigneeId(s.assigneeId ?? NONE);
    setSprintId(s.sprintId ?? NONE);
    setStoryPoints(s.storyPoints === null ? "" : String(s.storyPoints));
    setEstimatedHours(s.estimatedHours === null ? "" : String(s.estimatedHours));
    setPriority(s.priority);
    setDueDate(s.dueDate ?? "");
    setError(null);
  };

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!story) return;
    setError(null);

    const pointsTrimmed = storyPoints.trim();
    const points = pointsTrimmed === "" ? null : Number(pointsTrimmed);
    if (points !== null && (!Number.isInteger(points) || points < 0)) {
      setError(dict.board.invalidPoints);
      return;
    }
    const hoursTrimmed = estimatedHours.trim();
    const hours = hoursTrimmed === "" ? null : Number(hoursTrimmed);
    if (hours !== null && (!Number.isInteger(hours) || hours < 0 || hours > MAX_ESTIMATED_HOURS)) {
      setError(dict.board.invalidHours);
      return;
    }

    setSaveLoading(true);
    const result = await updateStoryFullAction(projectId, story.id, {
      title,
      description,
      assigneeId: assigneeId === NONE ? null : assigneeId,
      storyPoints: points,
      estimatedHours: hours,
      sprintId: sprintId === NONE ? null : sprintId,
      columnId: columnId === BACKLOG ? null : columnId,
      priority,
      dueDate: dueDate.trim() === "" ? null : dueDate,
    });
    setSaveLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast("Sačuvano", true);
    onClose();
    router.refresh();
  };

  return {
    title, setTitle,
    description, setDescription,
    columnId, setColumnId,
    assigneeId, setAssigneeId,
    sprintId, setSprintId,
    storyPoints, setStoryPoints,
    estimatedHours, setEstimatedHours,
    priority, setPriority,
    dueDate, setDueDate,
    error, setError,
    saveLoading,
    resetToStory,
    handleSave,
  };
}
