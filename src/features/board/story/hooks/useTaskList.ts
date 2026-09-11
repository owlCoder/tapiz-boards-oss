"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@tapizlabs/ui";
import type { StoryTaskDto } from "@/domain/types";
import {
  addStoryTaskAction,
  deleteStoryTaskAction,
  getStoryTasksAction,
  setStoryTaskDoneAction,
} from "@/lib/actions/board.actions";

export function useTaskList(projectId: string, storyId: string | null) {
  const router = useRouter();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<StoryTaskDto[] | null>(null);
  const [newTask, setNewTask] = useState("");
  const [taskLoading, setTaskLoading] = useState(false);

  const load = useCallback(async () => {
    if (!storyId) return;
    const result = await getStoryTasksAction(projectId, storyId);
    if (result.ok) setTasks(result.data);
  }, [projectId, storyId]);

  const reset = useCallback(() => {
    setTasks(null);
    setNewTask("");
  }, []);

  const handleAdd = async (): Promise<string | null> => {
    if (!storyId || !newTask.trim()) return null;
    setTaskLoading(true);
    const result = await addStoryTaskAction(projectId, storyId, { title: newTask });
    setTaskLoading(false);
    if (!result.ok) return result.error;
    setNewTask("");
    await load();
    router.refresh();
    return null;
  };

  const handleToggle = async (task: StoryTaskDto): Promise<void> => {
    if (!storyId) return;
    setTasks((prev) =>
      prev?.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item)) ?? prev,
    );
    const result = await setStoryTaskDoneAction(projectId, task.id, !task.done);
    if (!result.ok) {
      showToast(result.error, false);
      await load();
      return;
    }
    router.refresh();
  };

  const handleDelete = async (task: StoryTaskDto): Promise<void> => {
    if (!storyId) return;
    const result = await deleteStoryTaskAction(projectId, task.id);
    if (!result.ok) {
      showToast(result.error, false);
      return;
    }
    await load();
    router.refresh();
  };

  return {
    tasks,
    newTask,
    setNewTask,
    taskLoading,
    load,
    reset,
    handleAdd,
    handleToggle,
    handleDelete,
  };
}
