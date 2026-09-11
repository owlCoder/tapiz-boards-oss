"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useToast } from "@tapizlabs/ui";
import type { StoryDto } from "@/domain/types";
import { moveStoryAction } from "@/lib/actions/board.actions";

interface UseBacklogDragDropOptions {
  projectId: string;
  stories: StoryDto[];
  setStories: React.Dispatch<React.SetStateAction<StoryDto[]>>;
  dragDisabled: boolean;
}

export interface BacklogDragDropHandlers {
  sensors: ReturnType<typeof useSensors>;
  activeStory: StoryDto | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
}

/**
 * Rang backlog-a (drag-reorder). Rang se čuva u `stories.position`; `moveStoryAction`
 * sa `toColumnId: null` renormalizuje pozicije unutar backlog-a (vidi move.queries).
 */
export function useBacklogDragDrop({
  projectId,
  stories,
  setStories,
  dragDisabled,
}: UseBacklogDragDropOptions): BacklogDragDropHandlers {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeStory, setActiveStory] = useState<StoryDto | null>(null);
  const snapshot = useRef<StoryDto[] | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragStartEvent) => {
    snapshot.current = stories;
    setActiveStory(stories.find((s) => s.id === event.active.id) ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveStory(null);
    const prev = snapshot.current;
    snapshot.current = null;
    if (dragDisabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stories.findIndex((s) => s.id === active.id);
    const newIndex = stories.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(stories, oldIndex, newIndex);
    setStories(reordered);

    const result = await moveStoryAction(projectId, {
      storyId: String(active.id),
      toColumnId: null,
      toIndex: newIndex,
    });
    if (!result.ok) {
      if (prev) setStories(prev);
      showToast(result.error, false);
    }
    router.refresh();
  };

  return { sensors, activeStory, handleDragStart, handleDragEnd };
}
