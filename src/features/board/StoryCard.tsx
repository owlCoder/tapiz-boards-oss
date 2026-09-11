"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, Badge, Surface } from "@tapizlabs/ui";
import { isOverdue, type StoryDto } from "@/domain/types";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";
import { formatIsoDate, todayIso } from "@/lib/date";

interface StoryCardProps {
  story: StoryDto;
  onOpen: (story: StoryDto) => void;
  dragDisabled?: boolean;
}

export function StoryCardContent({ story }: { story: StoryDto }) {
  const { dict } = useI18n();
  const overdue = isOverdue(story.dueDate, todayIso());
  return (
    <Surface
      variant="raised"
      padding="sm"
      className="space-y-3 transition-colors hover:bg-(--tapiz-bg-surface)"
    >
      <div className="space-y-1.5">
        <p className="text-sm font-semibold leading-snug text-(--tapiz-text-primary)">{story.title}</p>
        {story.description ? (
          <p className="line-clamp-2 text-xs leading-5 text-(--tapiz-text-muted)">
            {story.description}
          </p>
        ) : null}
      </div>
      {story.sprintName && (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--tapiz-accent)">
          {story.sprintName}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-1.5">
          {story.priority !== "medium" && (
            <Badge variant={story.priority === "high" ? "danger" : "muted"}>
              {story.priority === "high" ? dict.board.priorityHigh : dict.board.priorityLow}
            </Badge>
          )}
          {story.dueDate !== null && (
            <Badge variant={overdue ? "danger" : "warning"}>
              {overdue ? `⚠ ${formatIsoDate(story.dueDate)}` : formatIsoDate(story.dueDate)}
            </Badge>
          )}
          {story.taskCount > 0 && (
            <Badge variant={story.tasksDone === story.taskCount ? "success" : "muted"}>
              ✓ {story.tasksDone}/{story.taskCount}
            </Badge>
          )}
          {story.commentCount > 0 && (
            <Badge variant="muted">
              {story.commentCount} {dict.board.colComments.toLowerCase()}
            </Badge>
          )}
          {story.storyPoints !== null && <Badge variant="info">{story.storyPoints} SP</Badge>}
        </span>
        <span
          className="shrink-0"
          title={
            story.assigneeName
              ? fmt(dict.board.assignedTo, { name: story.assigneeName })
              : fmt(dict.board.authorTooltip, { name: story.authorName })
          }
        >
          <Avatar name={story.assigneeName ?? story.authorName} size="xs" />
        </span>
      </div>
    </Surface>
  );
}

export const StoryCard = memo(function StoryCard({
  story,
  onOpen,
  dragDisabled = false,
}: StoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: story.id,
    data: { type: "story", columnId: story.columnId },
    disabled: dragDisabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={
        isDragging ? "opacity-40" : dragDisabled ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
      }
      {...attributes}
      {...listeners}
      onClick={() => onOpen(story)}
    >
      <StoryCardContent story={story} />
    </div>
  );
});
