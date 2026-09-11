"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@tapizlabs/ui";
import type { CommentDto } from "@/domain/types";
import {
  addCommentAction,
  deleteCommentAction,
  getCommentsAction,
} from "@/lib/actions/board.actions";

export function useCommentList(projectId: string, storyId: string | null) {
  const router = useRouter();
  const { showToast } = useToast();
  const [comments, setComments] = useState<CommentDto[] | null>(null);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deleteCommentLoading, setDeleteCommentLoading] = useState(false);

  const load = useCallback(async () => {
    if (!storyId) return;
    const result = await getCommentsAction(projectId, storyId);
    if (result.ok) setComments(result.data);
  }, [projectId, storyId]);

  const reset = useCallback(() => {
    setComments(null);
    setNewComment("");
  }, []);

  const handleAdd = async (): Promise<string | null> => {
    if (!storyId || !newComment.trim()) return null;
    setCommentLoading(true);
    const result = await addCommentAction(projectId, { storyId, body: newComment });
    setCommentLoading(false);
    if (!result.ok) return result.error;
    setNewComment("");
    await load();
    router.refresh();
    return null;
  };

  const handleDelete = async (): Promise<void> => {
    if (!storyId || !deletingCommentId) return;
    setDeleteCommentLoading(true);
    const result = await deleteCommentAction(projectId, deletingCommentId);
    setDeleteCommentLoading(false);
    setDeletingCommentId(null);
    if (!result.ok) {
      showToast(result.error, false);
      return;
    }
    await load();
    router.refresh();
  };

  return {
    comments,
    newComment,
    setNewComment,
    commentLoading,
    deletingCommentId,
    setDeletingCommentId,
    deleteCommentLoading,
    load,
    reset,
    handleAdd,
    handleDelete,
  };
}
