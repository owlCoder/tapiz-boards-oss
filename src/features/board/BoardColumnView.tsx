"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Badge, Surface } from "@tapizlabs/ui";
import type { BoardColumnWithStories, StoryDto } from "@/domain/types";
import { useI18n } from "@/i18n/I18nProvider";
import { StoryCard } from "./StoryCard";

interface BoardColumnViewProps {
  column: BoardColumnWithStories;
  onOpenStory: (story: StoryDto) => void;
  dragDisabled?: boolean;
}

export const BoardColumnView = memo(function BoardColumnView({
  column,
  onOpenStory,
  dragDisabled = false,
}: BoardColumnViewProps) {
  const { dict } = useI18n();
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column" },
  });

  const count = column.stories.length;
  const limit = column.wipLimit;
  const overLimit = limit !== null && count > limit;
  const atLimit = limit !== null && count === limit;

  return (
    <Surface
      variant="surface"
      padding="none"
      className={`flex h-full w-[min(18rem,85vw)] shrink-0 snap-start flex-col overflow-hidden border-t-2 transition-colors sm:w-76 lg:w-80 ${
        isOver ? "border-t-primary-300" : "border-t-(--tapiz-border-subtle)"
      }`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface) px-3 py-3.5">
        <h3 className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.18em] text-(--tapiz-text-primary)">
          {column.name}
        </h3>
        <span title={overLimit ? dict.board.wipOverLimit : undefined}>
          <Badge variant={overLimit ? "danger" : atLimit ? "warning" : "info"}>
            {limit === null ? count : `${count}/${limit}`}
          </Badge>
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-48 space-y-3 overflow-y-auto px-3 py-3 transition-colors ${
          isOver ? "bg-(--tapiz-accent-soft)" : "bg-(--tapiz-bg-surface)"
        }`}
      >
        <SortableContext
          items={column.stories.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.stories.map((story) => (
            <StoryCard key={story.id} story={story} onOpen={onOpenStory} dragDisabled={dragDisabled} />
          ))}
        </SortableContext>
        {column.stories.length === 0 && (
          <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-(--tapiz-accent) bg-(--tapiz-bg-surface-muted) px-4 text-center">
            <p className="text-xs text-(--tapiz-text-muted)">{dict.board.dropHere}</p>
          </div>
        )}
      </div>
    </Surface>
  );
});
