"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  EmptyState,
  FormError,
  Input,
  Plus,
  QrCode,
  Star,
  UserPlus,
  useToast,
} from "@tapizlabs/ui";
import type { ProjectDto } from "@/domain/types";
import { joinByInviteCodeAction } from "@/lib/actions/projects.actions";
import { useI18n } from "@/i18n/I18nProvider";
import { CreatePersonalTeamModal } from "./CreatePersonalTeamModal";
import { EntityCard } from "@/features/dashboard/EntityCard";

interface PersonalTeamsSectionProps {
  projects: ProjectDto[];
  currentUserId: string;
}

export function PersonalTeamsSection({ projects, currentUserId }: PersonalTeamsSectionProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dict } = useI18n();
  const t = dict.dashboard;
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinLoading(true);
    const result = await joinByInviteCodeAction(code);
    setJoinLoading(false);
    if (!result.ok) {
      setJoinError(result.error);
      return;
    }
    setCode("");
    showToast(t.joinedPersonalToast, true);
    router.push(`/projects/${result.data.projectId}/board`);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
          {t.newPersonalTeam}
        </Button>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 order-2 xl:order-1">
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
        </div>

        <form
          onSubmit={handleJoin}
          className="order-1 flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-ink-300/30 p-5 xl:order-2 xl:sticky xl:top-4 xl:self-start"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-primary-300/25 bg-primary-300/10 text-primary-300">
              <QrCode size={18} />
            </span>
            <span className="min-w-0">
              <p className="font-display text-xl font-semibold text-txt-1">{t.joinByCode}</p>
              <p className="mt-1 text-sm leading-5 text-(--tapiz-text-muted)">
                {t.codePlaceholder}
              </p>
            </span>
          </div>
          <Input
            aria-label={t.joinByCode}
            value={code}
            onChange={(e) => {
              setJoinError(null);
              setCode(e.target.value.toUpperCase());
            }}
            placeholder={t.codePlaceholder}
            className="font-mono uppercase"
            maxLength={9}
          />
          <Button
            type="submit"
            variant="secondary"
            icon={<UserPlus size={14} />}
            loading={joinLoading}
            disabled={!code.trim()}
            className="w-full"
          >
            {t.joinByCode}
          </Button>
          <FormError message={joinError} />
        </form>
      </div>
      <CreatePersonalTeamModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
