"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, Badge, Menu, Select } from "@tapizlabs/ui";
import { isOverdue, type BoardColumnDto, type StoryDto } from "@/domain/types";
import { useI18n } from "@/i18n/I18nProvider";
import { formatIsoDate, todayIso } from "@/lib/date";

interface BacklogStoryRowProps {
  story: StoryDto;
  columns: BoardColumnDto[];
  readOnly: boolean;
  /** Onemogućava drag (npr. dok je active sprint odsutan ili read-only). */
  dragDisabled: boolean;
  onOpen: (story: StoryDto) => void;
  onMove: (story: StoryDto, columnId: string) => void;
}

export function BacklogStoryRow({
  story,
  columns,
  readOnly,
  dragDisabled,
  onOpen,
  onMove,
}: BacklogStoryRowProps) {
  const { dict } = useI18n();
  const t = dict.board;
  const overdue = isOverdue(story.dueDate, todayIso());
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: story.id,
    disabled: dragDisabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="border-b border-(--tapiz-border-subtle) last:border-b-0"
    >
      <div className="group p-3 transition-colors hover:bg-(--tapiz-bg-surface-raised)">
        <div className="flex items-start gap-3">
          {!dragDisabled && (
            <button
              type="button"
              className="hidden shrink-0 cursor-grab touch-none pt-0.5 text-(--tapiz-text-muted) hover:text-(--tapiz-accent) lg:block"
              aria-label={t.dragHandle}
              {...attributes}
              {...listeners}
            >
              <Menu size={16} />
            </button>
          )}

          {/* Sadržaj: naslov + opis + meta (autor iznad datuma kreiranja) */}
          <button type="button" onClick={() => onOpen(story)} className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold text-(--tapiz-text-primary)">{story.title}</span>
            {story.description && (
              <span className="mt-1 line-clamp-2 text-xs leading-5 text-(--tapiz-text-muted)">{story.description}</span>
            )}
            <span className="mt-2 flex items-center gap-2">
              <Avatar name={story.assigneeName ?? story.authorName} size="xs" />
              <span className="flex flex-col">
                <span className="text-xs text-(--tapiz-text-secondary)">
                  {story.assigneeName ?? story.authorName}
                </span>
                <span className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-(--tapiz-text-muted)">
                  {t.colCreated}: {story.createdAt}
                </span>
              </span>
            </span>
          </button>

          {/* Desna zona: badge-evi i select, poravnati na istu desnu ivicu */}
          <div className="flex shrink-0 flex-col items-end gap-2 lg:w-44">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {story.sprintName && <Badge variant="default">{story.sprintName}</Badge>}
            {story.priority !== "medium" && (
              <Badge variant={story.priority === "high" ? "danger" : "muted"}>
                {story.priority === "high" ? t.priorityHigh : t.priorityLow}
              </Badge>
            )}
            {story.dueDate !== null && (
              <Badge variant={overdue ? "danger" : "warning"}>
                {formatIsoDate(story.dueDate)}
              </Badge>
            )}
            {story.storyPoints !== null && <Badge variant="info">{story.storyPoints} SP</Badge>}
            {story.taskCount > 0 && (
              <Badge variant={story.tasksDone === story.taskCount ? "success" : "muted"}>
                {story.tasksDone}/{story.taskCount}
              </Badge>
            )}
            {story.commentCount > 0 && (
              <Badge variant="muted">{story.commentCount} {t.colComments.toLowerCase()}</Badge>
            )}
          </div>
          {!readOnly && (
            <div className="w-full" onClick={(e) => e.stopPropagation()}>
              <Select
                value=""
                onChange={(e) => onMove(story, e.target.value)}
                aria-label={t.moveToColumn}
              >
                <option value="" disabled>{t.moveToPlaceholder}</option>
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
          )}
          </div>
        </div>
      </div>
    </li>
  );
}
