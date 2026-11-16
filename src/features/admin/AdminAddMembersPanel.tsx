"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, FieldLabel, FormError, Select, Spinner, UserPlus, useToast } from "@tapizlabs/ui";
import type { ProjectDto, UserDto } from "@/domain/types";
import { fullName } from "@/domain/types";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";
import { SidePanel } from "@/components/layout/SidePanel";
import { addProjectMemberAction, getProjectMembersAction } from "@/lib/actions/projects.actions";

interface AdminAddMembersPanelProps {
  open: boolean;
  projects: ProjectDto[];
  users: UserDto[];
  onClose: () => void;
}

export function AdminAddMembersPanel({ open, projects, users, onClose }: AdminAddMembersPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dict } = useI18n();
  const t = dict.admin;
  const teams = dict.teams;
  const [projectId, setProjectId] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setProjectId("");
      setMemberIds([]);
      setLoadedProjectId(null);
      setSelectedIds([]);
      setError(null);
    }
  }

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void getProjectMembersAction(projectId).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setMemberIds(result.data.map((member) => member.userId));
        setLoadedProjectId(projectId);
      } else {
        setError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const membersReady = projectId !== "" && loadedProjectId === projectId;
  const candidates = useMemo(() => {
    if (!membersReady) return [];
    const taken = new Set(memberIds);
    return users.filter((user) => user.isActive && !taken.has(user.id));
  }, [membersReady, users, memberIds]);

  const toggle = (id: string) =>
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const handleAdd = async () => {
    if (!projectId || selectedIds.length === 0) return;
    setError(null);
    setLoading(true);
    const results = await Promise.all(selectedIds.map((id) => addProjectMemberAction(projectId, id)));
    setLoading(false);
    const failed = results.find((result) => !result.ok);
    const added = results.filter((result) => result.ok).length;
    if (failed && !failed.ok) setError(failed.error);
    if (added > 0) {
      showToast(fmt(teams.membersAdded, { count: added }), true);
      setSelectedIds([]);
      const refreshed = await getProjectMembersAction(projectId);
      if (refreshed.ok) {
        setMemberIds(refreshed.data.map((member) => member.userId));
        setLoadedProjectId(projectId);
      }
      router.refresh();
    }
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={t.addToTeamTitle}
      subtitle={t.addToTeamSubtitle}
      icon={<UserPlus size={18} />}
      footer={
        <div className="space-y-2">
          <Button
            fullWidth
            icon={<UserPlus size={14} />}
            loading={loading}
            disabled={!projectId || selectedIds.length === 0}
            onClick={() => void handleAdd()}
          >
            {selectedIds.length > 0 ? `${t.addToTeamButton} (${selectedIds.length})` : t.addToTeamButton}
          </Button>
          <FormError message={error} />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <FieldLabel htmlFor="admin-add-team">{t.teamLabel}</FieldLabel>
          <Select
            id="admin-add-team"
            value={projectId}
            onChange={(event) => {
              setProjectId(event.target.value);
              setSelectedIds([]);
              setError(null);
            }}
          >
            <option value="">{t.chooseTeam}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </div>

        {!projectId ? (
          <p className="text-sm text-(--tapiz-text-muted)">{projects.length === 0 ? t.noTeams : t.chooseTeam}</p>
        ) : !membersReady ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-(--tapiz-text-muted)">{teams.allAlreadyAdded}</p>
        ) : (
          <ul className="space-y-2">
            {candidates.map((user) => {
              const selected = selectedIds.includes(user.id);
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(user.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left ${
                      selected
                        ? "border-(--tapiz-accent) bg-(--tapiz-accent-soft)"
                        : "border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface)"
                    }`}
                  >
                    <Avatar name={fullName(user)} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{fullName(user)}</span>
                      <span className="block truncate text-xs text-(--tapiz-text-muted)">{user.email}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SidePanel>
  );
}
