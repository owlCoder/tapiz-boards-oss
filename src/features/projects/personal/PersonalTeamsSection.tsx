"use client";

import { useState } from "react";
import { Button, EmptyState, Plus, Star } from "@tapizlabs/ui";
import type { ProjectDto } from "@/domain/types";
import { useI18n } from "@/i18n/I18nProvider";
import { CreatePersonalTeamModal } from "./CreatePersonalTeamModal";
import { EntityCard } from "@/features/dashboard/EntityCard";

interface PersonalTeamsSectionProps {
  projects: ProjectDto[];
  currentUserId: string;
}

export function PersonalTeamsSection({ projects, currentUserId }: PersonalTeamsSectionProps) {
  const { dict } = useI18n();
  const t = dict.dashboard;
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
          {t.newPersonalTeam}
        </Button>
      </div>
      {projects.length === 0 ? (
        <EmptyState title={t.noPersonalTeamsTitle} message={t.noPersonalTeamsMessage} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <EntityCard
              key={project.id}
              href={`/projects/${project.id}/board`}
              title={project.name}
              subtitle={
                project.ownerId === currentUserId ? dict.teams.owner : dict.teams.personalTeam
              }
              icon={<Star size={16} />}
              metricValue={project.memberCount ?? 0}
              metricLabel={dict.teams.colMembers}
              doodle={Star}
            />
          ))}
        </div>
      )}
      <CreatePersonalTeamModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
