"use client";

import { PageHeader, Users } from "@tapizlabs/ui";
import type { ReactNode } from "react";
import { projectDisplayName, type ProjectDto } from "@/domain/types";
import { useI18n } from "@/i18n/I18nProvider";

interface ProjectPageHeaderProps {
  project: ProjectDto;
  /** Kod projekta + broj članova; isključi gde su te info već prikazane (npr. board → Подешавања). */
  showProjectMeta?: boolean;
  /** InfoBanner (ili sl.) unutar headera — stoji ispod naslova umesto opisnog reda. */
  banner?: ReactNode;
  actions?: ReactNode;
}

/** Navigacija Board/Backlog/Sprintovi živi u sidebaru (AppShellLayout) — header je bez tabova. */
export function ProjectPageHeader({
  project,
  showProjectMeta = true,
  banner,
  actions,
}: ProjectPageHeaderProps) {
  const { dict } = useI18n();

  const meta =
    showProjectMeta ? (
      <div className="flex flex-wrap items-center gap-2">
        {typeof project.memberCount === "number" && (
          <span className="flex items-center gap-2 rounded-full border border-(--tapiz-border-strong) bg-(--tapiz-bg-surface-raised) px-3 py-1.5">
            <Users size={14} className="text-(--tapiz-text-muted)" />
            <span className="font-display text-lg font-bold leading-none text-(--tapiz-text-primary)">
              {project.memberCount}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-(--tapiz-text-muted)">
              {dict.teams.members}
            </span>
          </span>
        )}
      </div>
    ) : undefined;

  return (
    <PageHeader
      title={projectDisplayName(project)}
      banner={banner ? <div className="-mt-1">{banner}</div> : undefined}
      variant="enterprise"
      actions={actions}
      meta={meta}
    />
  );
}
