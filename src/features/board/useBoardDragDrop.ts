"use client";

import { useRef, useState } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useToast } from "@tapizlabs/ui";
import { useRouter } from "next/navigation";
import type { BoardColumnWithStories, StoryDto } from "@/domain/types";
import { moveStoryAction } from "@/lib/actions/board.actions";

interface UseBoardDragDropOptions {
  projectId: string;
  columns: BoardColumnWithStories[];
  setColumns: React.Dispatch<React.SetStateAction<BoardColumnWithStories[]>>;
  dragDisabled: boolean;
}

export interface BoardDragDropHandlers {
  sensors: ReturnType<typeof useSensors>;
  activeStory: StoryDto | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
}

function findColumnId(cols: BoardColumnWithStories[], itemId: string): string | null {
  if (cols.find((c) => c.id === itemId)) return itemId;
  return cols.find((c) => c.stories.some((s) => s.id === itemId))?.id ?? null;
}

export function useBoardDragDrop({
  projectId,
  columns,
  setColumns,
  dragDisabled,
}: UseBoardDragDropOptions): BoardDragDropHandlers {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeStory, setActiveStory] = useState<StoryDto | null>(null);
  const snapshot = useRef<BoardColumnWithStories[] | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragStartEvent) => {
    snapshot.current = columns;
    setActiveStory(columns.flatMap((c) => c.stories).find((s) => s.id === event.active.id) ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    setColumns((cols) => {
      const fromId = findColumnId(cols, String(active.id));
      const toId = findColumnId(cols, String(over.id));
      if (!fromId || !toId || fromId === toId) return cols;
      const story = cols.find((c) => c.id === fromId)!.stories.find((s) => s.id === active.id);
      if (!story) return cols;
      return cols.map((c) => {
        if (c.id === fromId) return { ...c, stories: c.stories.filter((s) => s.id !== active.id) };
        if (c.id === toId) {
          const overIndex = c.stories.findIndex((s) => s.id === over.id);
          const insertAt = overIndex === -1 ? c.stories.length : overIndex;
          const next = [...c.stories];
          next.splice(insertAt, 0, { ...story, columnId: c.id });
          return { ...c, stories: next };
        }
        return c;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (dragDisabled) return;
    const { active, over } = event;
    setActiveStory(null);
    const prev = snapshot.current;
    snapshot.current = null;
    if (!over) {
      if (prev) setColumns(prev);
      return;
    }

    let nextCols: BoardColumnWithStories[] = columns;
    setColumns((cols) => {
      const fromId = findColumnId(cols, String(active.id));
      const toId = findColumnId(cols, String(over.id));
      if (!fromId || !toId) return cols;
      if (fromId === toId && active.id !== over.id) {
        const col = cols.find((c) => c.id === fromId)!;
        const oldIndex = col.stories.findIndex((s) => s.id === active.id);
        const newIndex = col.stories.findIndex((s) => s.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return cols;
        const next = [...col.stories];
        const [moved] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, moved);
        nextCols = cols.map((c) => (c.id === fromId ? { ...c, stories: next } : c));
        return nextCols;
      }
      nextCols = cols;
      return cols;
    });

    const targetCol = nextCols.find((c) => c.stories.some((s) => s.id === active.id));
    if (!targetCol) return;
    const result = await moveStoryAction(projectId, {
      storyId: String(active.id),
      toColumnId: targetCol.id,
      toIndex: targetCol.stories.findIndex((s) => s.id === active.id),
    });
    if (!result.ok) {
      if (prev) setColumns(prev);
      showToast(result.error, false);
    }
    router.refresh();
  };

  return { sensors, activeStory, handleDragStart, handleDragOver, handleDragEnd };
}
