"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button, Check, ConfirmDialog, FormError, Trash, X } from "@tapizlabs/ui";
import type { BoardColumnDto, ProjectMemberDto, SprintDto, StoryDto } from "@/domain/types";
import type { SessionUser } from "@/lib/guards";
import { deleteStoryAction } from "@/lib/actions/board.actions";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt } from "@/i18n/config";
import { useStoryForm } from "./hooks/useStoryForm";
import { useTaskList } from "./hooks/useTaskList";
import { useCommentList } from "./hooks/useCommentList";
import { StoryFormContent } from "./StoryFormContent";

interface StoryDetailPanelProps {
  projectId: string;
  story: StoryDto | null;
  currentUser: SessionUser;
  columns: BoardColumnDto[];
  members: ProjectMemberDto[];
  sprints: SprintDto[];
  canModerate: boolean;
  onClose: () => void;
}

/** Detalji story-ja: desni panel na desktopu, full-screen na mobilnom. */
export function StoryDetailPanel({
  projectId,
  story,
  currentUser,
  columns,
  members,
  sprints,
  canModerate,
  onClose,
}: StoryDetailPanelProps) {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.board;

  // Čuva story tokom izlazne tranzicije.
  const [renderStory, setRenderStory] = useState<StoryDto | null>(story);
  const [shown, setShown] = useState(false);
  if (story !== null && story !== renderStory) setRenderStory(story);
  if (story === null && shown) setShown(false);

  useEffect(() => {
    if (story !== null) {
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    const timer = setTimeout(() => setRenderStory(null), 250);
    return () => clearTimeout(timer);
  }, [story]);

  const form = useStoryForm(projectId, renderStory, onClose);
  const taskList = useTaskList(projectId, renderStory?.id ?? null);
  const commentList = useCommentList(projectId, renderStory?.id ?? null);

  // Reset state pri otvaranju novog story-ja (tokom rendera — React šablon).
  const [prevStory, setPrevStory] = useState<StoryDto | null>(null);
  if (story !== prevStory) {
    setPrevStory(story);
    if (story) {
      form.resetToStory(story);
      taskList.reset();
      commentList.reset();
    }
  }

  useEffect(() => {
    if (!story) return;
    let cancelled = false;
    taskList.load().then(() => { if (cancelled) taskList.reset(); });
    commentList.load().then(() => { if (cancelled) commentList.reset(); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteStory = async () => {
    if (!renderStory) return;
    setDeleteLoading(true);
    const result = await deleteStoryAction(projectId, renderStory.id);
    setDeleteLoading(false);
    setConfirmDelete(false);
    if (result.ok) {
      onClose();
      router.refresh();
    }
  };

  // Scroll lock na mobilnom.
  useEffect(() => {
    if (!renderStory) return;
    const mq = window.matchMedia("(max-width: 639px)");
    let restore: (() => void) | null = null;
    const lock = () => {
      if (restore) return;
      const h = document.documentElement.style.overflow;
      const b = document.body.style.overflow;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      restore = () => {
        document.documentElement.style.overflow = h;
        document.body.style.overflow = b;
        restore = null;
      };
    };
    const sync = () => (mq.matches ? lock() : restore?.());
    sync();
    mq.addEventListener("change", sync);
    return () => { mq.removeEventListener("change", sync); restore?.(); };
  }, [renderStory]);

  if (!renderStory) return null;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-140 flex justify-end bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 max-sm:h-dvh max-sm:w-dvw max-sm:justify-start max-sm:overflow-hidden ${shown ? "opacity-100" : "opacity-0"}`}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className={`flex h-full w-full transform flex-col overflow-hidden border-l border-border-hi bg-ink-100 transition-transform duration-200 ease-out max-sm:h-dvh max-sm:max-w-none max-sm:border-l-0 sm:max-w-136 ${shown ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <h2 className="font-display text-sm font-bold text-txt-1">{t.storyModalTitle}</h2>
              <p className="mt-0.5 truncate font-mono text-[10px] text-txt-4">
                {fmt(t.storyAuthorMeta, { name: renderStory.authorName, date: renderStory.createdAt })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              title={dict.common.close}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent text-txt-3 transition-colors hover:text-txt-1"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={form.handleSave} className="flex min-h-0 flex-1 flex-col">
            <StoryFormContent
              currentUser={currentUser}
              columns={columns}
              members={members}
              sprints={sprints}
              canModerate={canModerate}
              form={form}
              taskList={taskList}
              commentList={commentList}
            />

            <div className="shrink-0 space-y-2 border-t border-border px-4 py-3 sm:px-5">
              <FormError message={form.error} />
              <div className="flex gap-2">
                <Button type="submit" fullWidth icon={<Check size={14} />} loading={form.saveLoading}>
                  {dict.common.save}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  icon={<Trash size={14} />}
                  onClick={() => setConfirmDelete(true)}
                  className="text-warn"
                >
                  {dict.common.delete}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title={t.deleteStoryTitle}
        description={t.deleteStoryDescription}
        confirmLabel={dict.common.delete}
        cancelLabel={dict.common.cancel}
        danger
        loading={deleteLoading}
        onConfirm={() => void handleDeleteStory()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>,
    document.body,
  );
}
