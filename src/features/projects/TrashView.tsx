"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog, EmptyState, PageHeader, RefreshCw, Trash, Users } from "@tapizlabs/ui";
import type { ProjectDto } from "@/domain/types";
import {
  permanentDeleteProjectAction,
  restoreProjectAction,
} from "@/lib/actions/projects.actions";
import { useI18n } from "@/i18n/I18nProvider";

interface TrashViewProps {
  projects: ProjectDto[];
}

export function TrashView({ projects }: TrashViewProps) {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.trash;
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ProjectDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleRestore = async (projectId: string) => {
    setRestoring(projectId);
    const result = await restoreProjectAction(projectId);
    setRestoring(null);
    if (result.ok) router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    const result = await permanentDeleteProjectAction(deleting.id);
    setDeleteLoading(false);
    setDeleting(null);
    if (result.ok) router.refresh();
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t.title} subtitle={t.description} variant="enterprise" />

      {projects.length === 0 ? (
        <EmptyState title={t.emptyTitle} message={t.emptyMessage} />
      ) : (
        <ul className="divide-y divide-(--tapiz-border-subtle) overflow-hidden rounded-xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface)">
          {projects.map((project) => (
            <li key={project.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-(--tapiz-border-strong) bg-(--tapiz-bg-surface-muted) text-(--tapiz-text-muted)">
                <Users size={16} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-(--tapiz-text-primary)">
                {project.name}
              </span>
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={14} />}
                loading={restoring === project.id}
                onClick={() => void handleRestore(project.id)}
              >
                {t.restore}
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                icon={<Trash size={14} />}
                onClick={() => setDeleting(project)}
              >
                {t.permanentDelete}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={t.confirmDeleteTitle}
        description={t.confirmDeleteDescription}
        confirmLabel={t.permanentDelete}
        cancelLabel={dict.common.cancel}
        danger
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
