"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  Clipboard,
  EmptyState,
  Button,
  Hash,
  InfoBanner,
  Layers,
  Plus,
  Surface,
  UserCheck,
  useToast,
} from "@tapizlabs/ui";
import type { ReactNode } from "react";
import type { BoardColumnDto, ProjectDto, ProjectMemberDto, SprintDto, StoryDto } from "@/domain/types";
import type { SessionUser } from "@/lib/guards";
import { moveStoryAction } from "@/lib/actions/board.actions";
import { useI18n } from "@/i18n/I18nProvider";
import { ProjectPageHeader } from "./ProjectPageHeader";
import { StoryDetailPanel } from "./story/StoryDetailPanel";
import { StoryCreateForm } from "./StoryCreateForm";
import { BacklogStoryRow } from "./BacklogStoryRow";
import { useBacklogDragDrop } from "./useBacklogDragDrop";

interface BacklogViewProps {
  project: ProjectDto;
  stories: StoryDto[];
  columns: BoardColumnDto[];
  members: ProjectMemberDto[];
  sprints: SprintDto[];
  currentUser: SessionUser;
  canManage: boolean;
}

export function BacklogView({
  project,
  stories: initialStories,
  columns,
  members,
  sprints,
  currentUser,
  canManage,
}: BacklogViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dict } = useI18n();
  const t = dict.board;
  const activeSprint = sprints.find((sprint) => sprint.status === "active") ?? null;
  const [openStory, setOpenStory] = useState<StoryDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Optimistički rang backlog-a; uskladi kad server pošalje nove podatke (React šablon).
  const [stories, setStories] = useState(initialStories);
  const [prevInitial, setPrevInitial] = useState(initialStories);
  if (initialStories !== prevInitial) {
    setPrevInitial(initialStories);
    setStories(initialStories);
  }

  const dragDisabled = activeSprint === null;
  const { sensors, activeStory, handleDragStart, handleDragEnd } = useBacklogDragDrop({
    projectId: project.id,
    stories,
    setStories,
    dragDisabled,
  });

  const assignedStories = stories.filter((s) => s.assigneeName).length;
  const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);

  const moveToColumn = async (story: StoryDto, columnId: string) => {
    if (!columnId) return;
    const result = await moveStoryAction(project.id, { storyId: story.id, toColumnId: columnId, toIndex: 0 });
    showToast(result.ok ? t.movedToBoard : result.error, result.ok);
    router.refresh();
  };

  const stats: { label: string; value: ReactNode; icon: ReactNode }[] = [
    { label: t.tabBacklog, value: stories.length, icon: <Clipboard size={15} /> },
    { label: t.columns, value: columns.length, icon: <Layers size={15} /> },
    { label: t.colAssignee, value: assignedStories, icon: <UserCheck size={15} /> },
    { label: t.colPoints, value: `${totalPoints} SP`, icon: <Hash size={15} /> },
  ];

  return (
    <div className="space-y-5">
      <ProjectPageHeader
        project={project}
        showProjectMeta={false}
        banner={
          activeSprint === null ? (
            <InfoBanner text={t.backlogNeedsActiveSprint} variant="warn" />
          ) : (
            <InfoBanner text={t.backlogInfoBanner} />
          )
        }
      />
      <StoryCreateForm
        isOpen={createOpen}
        projectId={project.id}
        columns={columns}
        sprints={sprints}
        defaultColumnId={null}
        onClose={() => setCreateOpen(false)}
      />

      <Surface
        variant="raised"
        padding="sm"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-x-4"
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:items-center">
          {stats.map((stat) => (
            <span key={stat.label} className="flex items-center gap-2">
              <span className="text-(--tapiz-accent)">{stat.icon}</span>
              <span className="font-display text-sm font-bold leading-none text-(--tapiz-text-primary)">
                {stat.value}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--tapiz-text-secondary)">
                {stat.label}
              </span>
            </span>
          ))}
        </div>
        <Button
          icon={<Plus size={16} />}
          onClick={() => setCreateOpen(true)}
          className="h-10 w-full justify-center sm:ml-auto sm:h-9 sm:w-auto"
        >
          {t.newStory}
        </Button>
      </Surface>

      {stories.length === 0 ? (
        <Surface variant="raised" padding="md" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <EmptyState title={t.backlogEmptyTitle} message={t.backlogEmptyMessage} />
        </Surface>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={(e) => void handleDragEnd(e)}
        >
          <SortableContext items={stories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul className="overflow-hidden rounded-2xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface-raised) animate-in fade-in slide-in-from-bottom-2 duration-300">
              {stories.map((story) => (
                <BacklogStoryRow
                  key={story.id}
                  story={story}
                  columns={columns}
                  readOnly={activeSprint === null}
                  dragDisabled={dragDisabled}
                  onOpen={setOpenStory}
                  onMove={(s, col) => void moveToColumn(s, col)}
                />
              ))}
            </ul>
          </SortableContext>
          <DragOverlay>
            {activeStory && (
              <Surface variant="raised" padding="sm" className="rotate-1">
                <span className="text-sm font-semibold text-(--tapiz-text-primary)">
                  {activeStory.title}
                </span>
              </Surface>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <StoryDetailPanel
        projectId={project.id}
        story={openStory}
        currentUser={currentUser}
        columns={columns}
        members={members}
        sprints={sprints}
        canModerate={canManage}
        onClose={() => setOpenStory(null)}
      />
    </div>
  );
}
