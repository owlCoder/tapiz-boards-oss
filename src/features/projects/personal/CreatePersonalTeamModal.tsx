"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Check, FieldLabel, FormError, Input, Users, X } from "@tapizlabs/ui";
import { createProjectAction } from "@/lib/actions/projects.actions";
import { useI18n } from "@/i18n/I18nProvider";
import { SidePanel } from "@/components/layout/SidePanel";

interface CreatePersonalTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** New project — side panel on the right. */
export function CreatePersonalTeamModal({ isOpen, onClose }: CreatePersonalTeamModalProps) {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.dashboard;
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset on open during render (React pattern instead of setState in an effect).
  const [prevOpen, setPrevOpen] = useState(false);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setName("");
      setError(null);
    }
  }

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const result = await createProjectAction({ name });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
    router.push(`/projects/${result.data.projectId}/board`);
  };

  return (
    <SidePanel
      open={isOpen}
      title={t.createPersonalTitle}
      subtitle={t.personalTeamsDescription}
      icon={<Users size={18} />}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button
            fullWidth
            icon={<Check size={14} />}
            loading={loading}
            disabled={name.trim().length < 3}
            onClick={() => void handleSubmit()}
          >
            {dict.common.create}
          </Button>
          <Button variant="secondary" fullWidth icon={<X size={14} />} onClick={onClose}>
            {dict.common.cancel}
          </Button>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <FieldLabel htmlFor="pt-name">{t.teamNameLabel}</FieldLabel>
          <Input
            id="pt-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            maxLength={100}
          />
        </div>
        <FormError message={error} />
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </SidePanel>
  );
}
