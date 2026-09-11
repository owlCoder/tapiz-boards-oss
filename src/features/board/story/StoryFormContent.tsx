"use client";

import type { BoardColumnDto, ProjectMemberDto, SprintDto } from "@/domain/types";
import type { SessionUser } from "@/lib/guards";
import type { useStoryForm } from "./hooks/useStoryForm";
import type { useTaskList } from "./hooks/useTaskList";
import type { useCommentList } from "./hooks/useCommentList";
import { StoryDetailsForm } from "./StoryDetailsForm";
import { StoryTasksSection } from "./StoryTasksSection";
import { StoryCommentsSection } from "./StoryCommentsSection";

interface StoryFormContentProps {
  currentUser: SessionUser;
  columns: BoardColumnDto[];
  members: ProjectMemberDto[];
  sprints: SprintDto[];
  canModerate: boolean;
  form: ReturnType<typeof useStoryForm>;
  taskList: ReturnType<typeof useTaskList>;
  commentList: ReturnType<typeof useCommentList>;
}

export function StoryFormContent({
  currentUser,
  columns,
  members,
  sprints,
  canModerate,
  form,
  taskList,
  commentList,
}: StoryFormContentProps) {
  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
      <StoryDetailsForm
        title={form.title}
        description={form.description}
        columnId={form.columnId}
        assigneeId={form.assigneeId}
        sprintId={form.sprintId}
        storyPoints={form.storyPoints}
        priority={form.priority}
        dueDate={form.dueDate}
        columns={columns}
        members={members}
        sprints={sprints}
        onTitleChange={form.setTitle}
        onDescriptionChange={form.setDescription}
        onColumnChange={form.setColumnId}
        onAssigneeChange={form.setAssigneeId}
        onSprintChange={form.setSprintId}
        onStoryPointsChange={form.setStoryPoints}
        onPriorityChange={form.setPriority}
        onDueDateChange={form.setDueDate}
      />
      <StoryTasksSection
        tasks={taskList.tasks}
        newTask={taskList.newTask}
        taskLoading={taskList.taskLoading}
        onNewTaskChange={taskList.setNewTask}
        onAdd={() => void taskList.handleAdd().then((err) => err && form.setError(err))}
        onToggle={(task) => void taskList.handleToggle(task)}
        onDelete={(task) => void taskList.handleDelete(task)}
      />
      <StoryCommentsSection
        comments={commentList.comments}
        newComment={commentList.newComment}
        commentLoading={commentList.commentLoading}
        deletingCommentId={commentList.deletingCommentId}
        deleteCommentLoading={commentList.deleteCommentLoading}
        canModerate={canModerate}
        currentUser={currentUser}
        onNewCommentChange={commentList.setNewComment}
        onAdd={() => void commentList.handleAdd().then((err) => err && form.setError(err))}
        onRequestDelete={commentList.setDeletingCommentId}
        onConfirmDelete={() => void commentList.handleDelete()}
        onCancelDelete={() => commentList.setDeletingCommentId(null)}
      />
    </div>
  );
}
