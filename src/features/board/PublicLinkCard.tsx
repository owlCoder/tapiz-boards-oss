"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Copy, ExternalLink, Lock, RefreshCw, useToast } from "@tapizlabs/ui";
import { FormCard } from "@/components/layout/FormCard";
import type { ProjectDto } from "@/domain/types";
import { disablePublicLinkAction, enablePublicLinkAction } from "@/lib/actions/projects.actions";
import { useI18n } from "@/i18n/I18nProvider";

interface PublicLinkCardProps {
  project: ProjectDto;
}

/** Vlasnik projekta upravlja javnim read-only linkom boarda (demo/prezentacija projekta). */
export function PublicLinkCard({ project }: PublicLinkCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dict } = useI18n();
  const t = dict.board;
  const [loading, setLoading] = useState(false);

  const publicUrl = (token: string) => `${window.location.origin}/board/${token}`;

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    showToast(t.publicLinkCopied, true);
  };

  const enable = async () => {
    setLoading(true);
    const result = await enablePublicLinkAction(project.id);
    setLoading(false);
    showToast(result.ok ? t.publicLinkEnabled : result.error, result.ok);
    router.refresh();
  };

  const disable = async () => {
    setLoading(true);
    const result = await disablePublicLinkAction(project.id);
    setLoading(false);
    showToast(result.ok ? t.publicLinkDisabledToast : result.error, result.ok);
    router.refresh();
  };

  return (
    <FormCard
      title={t.publicLinkTitle}
      subtitle={t.publicLinkDescription}
      icon={<ExternalLink size={18} />}
    >
      <div className="space-y-3">
        {project.publicToken ? (
          <>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md border border-(--tapiz-border-strong) bg-(--tapiz-accent-soft) px-3 py-2 font-mono text-xs">
                /board/{project.publicToken}
              </code>
              <Button
                variant="ghost"
                size="sm"
                icon={<Copy size={14} />}
                aria-label={dict.common.copy}
                onClick={() => void copy(publicUrl(project.publicToken as string))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={14} />}
                loading={loading}
                onClick={() => void enable()}
                className="w-full justify-center"
              >
                {t.publicLinkRegenerate}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Lock size={14} />}
                disabled={loading}
                onClick={() => void disable()}
                className="w-full justify-center"
              >
                {t.publicLinkDisable}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-(--tapiz-text-muted)">{t.publicLinkOff}</p>
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} />}
              loading={loading}
              onClick={() => void enable()}
            >
              {t.publicLinkEnable}
            </Button>
          </div>
        )}
      </div>
    </FormCard>
  );
}
