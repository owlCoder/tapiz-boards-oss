"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Copy, ExternalLink, Hash, Lock, RefreshCw, useToast } from "@tapizlabs/ui";
import { FormCard } from "@/components/layout/FormCard";
import type { ProjectDto } from "@/domain/types";
import {
  disableInviteCodeAction,
  regenerateInviteCodeAction,
} from "@/lib/actions/projects.actions";
import { useI18n } from "@/i18n/I18nProvider";

interface InviteCodeCardProps {
  project: ProjectDto;
}

/** Project owner panel: view/copy invite code + regenerate/lock. */
export function InviteCodeCard({ project }: InviteCodeCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dict } = useI18n();
  const t = dict.teams;
  const [loading, setLoading] = useState(false);

  const copy = async (value: string, message: string) => {
    await navigator.clipboard.writeText(value);
    showToast(message, true);
  };

  const regenerate = async () => {
    setLoading(true);
    const result = await regenerateInviteCodeAction(project.id);
    setLoading(false);
    showToast(result.ok ? t.inviteRegenerated : result.error, result.ok);
    router.refresh();
  };

  const disable = async () => {
    setLoading(true);
    const result = await disableInviteCodeAction(project.id);
    setLoading(false);
    showToast(result.ok ? t.inviteDisabledToast : result.error, result.ok);
    router.refresh();
  };

  return (
    <FormCard title={t.inviteTitle} subtitle={t.inviteDescription} icon={<Hash size={18} />}>
      <div className="space-y-3">
        {project.inviteCode ? (
          <>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md border border-(--tapiz-border-strong) bg-(--tapiz-accent-soft) px-3 py-2 font-mono text-sm font-bold tracking-widest">
                {project.inviteCode}
              </code>
              <Button
                variant="ghost"
                size="sm"
                icon={<Copy size={14} />}
                aria-label={dict.common.copy}
                onClick={() => void copy(project.inviteCode as string, t.inviteCopied)}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<ExternalLink size={14} />}
                aria-label={t.inviteCopyLink}
                onClick={() =>
                  void copy(`${window.location.origin}/join/${project.inviteCode}`, t.inviteLinkCopied)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={14} />}
                loading={loading}
                onClick={() => void regenerate()}
                className="w-full justify-center"
              >
                {t.inviteRegenerate}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Lock size={14} />}
                disabled={loading}
                onClick={() => void disable()}
                className="w-full justify-center"
              >
                {t.inviteDisable}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-(--tapiz-text-muted)">{t.inviteDisabled}</p>
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} />}
              loading={loading}
              onClick={() => void regenerate()}
            >
              {t.inviteEnable}
            </Button>
          </div>
        )}
      </div>
    </FormCard>
  );
}
