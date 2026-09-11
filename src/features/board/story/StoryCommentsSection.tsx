"use client";

import { useId } from "react";
import { ArrowRight, Avatar, Button, ConfirmDialog, FieldLabel, Spinner, Textarea, Trash } from "@tapizlabs/ui";
import type { CommentDto } from "@/domain/types";
import type { SessionUser } from "@/lib/guards";
import { useI18n } from "@/i18n/I18nProvider";

interface StoryCommentsSectionProps {
  comments: CommentDto[] | null;
  newComment: string;
  commentLoading: boolean;
  deletingCommentId: string | null;
  deleteCommentLoading: boolean;
  canModerate: boolean;
  currentUser: SessionUser;
  onNewCommentChange: (v: string) => void;
  onAdd: () => void;
  onRequestDelete: (commentId: string) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

export function StoryCommentsSection({
  comments,
  newComment,
  commentLoading,
  deletingCommentId,
  deleteCommentLoading,
  canModerate,
  currentUser,
  onNewCommentChange,
  onAdd,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: StoryCommentsSectionProps) {
  const { dict } = useI18n();
  const fieldId = useId();
  const t = dict.board;

  return (
    <>
      <div className="space-y-3 border-t border-(--tapiz-border-subtle) pt-4">
        <h4 className="text-sm font-semibold">
          {t.activityComments} {comments ? `(${comments.length})` : ""}
        </h4>
        <div className="flex gap-2">
          <Avatar name={currentUser.name} size="sm" />
          <div className="flex-1">
            <FieldLabel htmlFor={`${fieldId}-new-comment`} className="sr-only">
              {t.commentPlaceholder}
            </FieldLabel>
            <Textarea
              id={`${fieldId}-new-comment`}
              value={newComment}
              onChange={(e) => onNewCommentChange(e.target.value)}
              rows={2}
              placeholder={t.commentPlaceholder}
            />
            {newComment.trim() && (
              <div className="mt-2 flex justify-end">
                <Button size="sm" type="button" icon={<ArrowRight size={14} />} onClick={onAdd} loading={commentLoading}>
                  {dict.common.send}
                </Button>
              </div>
            )}
          </div>
        </div>
        {comments === null ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-(--tapiz-text-muted)">{t.noComments}</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="group flex gap-3">
                <Avatar name={c.authorName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-(--tapiz-text-muted)">
                    <span className="font-medium text-(--tapiz-text-primary)">{c.authorName}</span>{" "}
                    · {c.createdAt}
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                </div>
                {(canModerate || c.authorId === currentUser.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    icon={<Trash size={14} />}
                    onClick={() => onRequestDelete(c.id)}
                    title={t.deleteComment}
                    className="opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={deletingCommentId !== null}
        title={t.deleteCommentTitle}
        description={t.deleteCommentDescription}
        confirmLabel={dict.common.delete}
        cancelLabel={dict.common.cancel}
        danger
        loading={deleteCommentLoading}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </>
  );
}
