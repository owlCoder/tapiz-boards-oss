"use client";

import { useId } from "react";
import { Badge, Button, Checkbox, FieldLabel, Input, Plus, Spinner, Trash } from "@tapizlabs/ui";
import type { StoryTaskDto } from "@/domain/types";
import { useI18n } from "@/i18n/I18nProvider";

interface StoryTasksSectionProps {
  tasks: StoryTaskDto[] | null;
  newTask: string;
  taskLoading: boolean;
  onNewTaskChange: (v: string) => void;
  onAdd: () => void;
  onToggle: (task: StoryTaskDto) => void;
  onDelete: (task: StoryTaskDto) => void;
}

export function StoryTasksSection({
  tasks,
  newTask,
  taskLoading,
  onNewTaskChange,
  onAdd,
  onToggle,
  onDelete,
}: StoryTasksSectionProps) {
  const { dict } = useI18n();
  const fieldId = useId();
  const t = dict.board;
  const doneCount = tasks?.filter((task) => task.done).length ?? 0;

  return (
    <div className="space-y-3 border-t border-(--tapiz-border-subtle) pt-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">{t.tasksTitle}</h4>
        {tasks && tasks.length > 0 && <Badge variant="muted">{doneCount}/{tasks.length}</Badge>}
      </div>
      {tasks === null ? (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-(--tapiz-text-muted)">{t.noTasks}</p>
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((task) => (
            <li key={task.id} className="group flex items-center gap-2">
              <Checkbox
                checked={task.done}
                onChange={() => onToggle(task)}
                label={task.title}
                className={task.done ? "line-through opacity-60" : ""}
              />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                icon={<Trash size={13} />}
                onClick={() => onDelete(task)}
                title={dict.common.remove}
                className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100"
              />
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <FieldLabel htmlFor={`${fieldId}-new-task`} className="sr-only">
          {t.newTaskPlaceholder}
        </FieldLabel>
        <Input
          id={`${fieldId}-new-task`}
          value={newTask}
          onChange={(e) => onNewTaskChange(e.target.value)}
          placeholder={t.newTaskPlaceholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        {newTask.trim() && (
          <Button
            size="sm"
            type="button"
            icon={<Plus size={14} />}
            onClick={onAdd}
            loading={taskLoading}
          >
            {dict.common.add}
          </Button>
        )}
      </div>
    </div>
  );
}
