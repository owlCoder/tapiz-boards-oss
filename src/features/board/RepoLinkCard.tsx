"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Check, Edit, FormError, GitHubIcon, Input, Trash, useToast } from "@tapizlabs/ui";
import { FormCard } from "@/components/layout/FormCard";
import type { ProjectDto } from "@/domain/types";
import { clearProjectRepoAction, setProjectRepoAction } from "@/lib/actions/projects.actions";
import { useI18n } from "@/i18n/I18nProvider";

interface RepoLinkCardProps {
  project: ProjectDto;
}

/** GitHub repo projekta — link unose i menjaju sami članovi; repo mora biti JAVAN. */
export function RepoLinkCard({ project }: RepoLinkCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dict } = useI18n();
  const t = dict.board;
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(project.repoUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setError(null);
    setLoading(true);
    const result = await setProjectRepoAction(project.id, url);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(false);
    showToast(t.repoSaved, true);
    router.refresh();
  };

  const remove = async () => {
    setLoading(true);
    const result = await clearProjectRepoAction(project.id);
    setLoading(false);
    showToast(result.ok ? t.repoRemoved : result.error, result.ok);
    setUrl("");
    router.refresh();
  };

  return (
    <FormCard title={t.repoTitle} subtitle={t.repoDescription} icon={<GitHubIcon size={18} />}>
      <div className="space-y-3">
        {project.repoUrl && !editing ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 truncate font-mono text-sm text-(--tapiz-accent) hover:underline"
            >
              {project.repoUrl.replace("https://github.com/", "")}
            </a>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Edit size={14} />}
                onClick={() => {
                  setUrl(project.repoUrl ?? "");
                  setEditing(true);
                }}
              >
                {dict.common.edit}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash size={14} />}
                disabled={loading}
                onClick={() => void remove()}
              >
                {dict.common.remove}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={url}
                onChange={(e) => {
                  setError(null);
                  setUrl(e.target.value);
                }}
                placeholder="https://github.com/vas-tim/vas-projekat"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void save();
                  }
                }}
              />
              {url.trim() && (
                <Button
                  size="sm"
                  icon={<Check size={14} />}
                  loading={loading}
                  onClick={() => void save()}
                  className="shrink-0"
                >
                  {dict.common.save}
                </Button>
              )}
            </div>
            <FormError message={error} />
          </div>
        )}
        {/* Naglašeno: integracija radi samo sa javnim repoima. */}
        <p className="text-xs text-(--tapiz-text-muted)">⚠ {t.repoPublicNote}</p>
      </div>
    </FormCard>
  );
}
