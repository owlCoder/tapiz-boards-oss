"use client";

import { useState, type FormEvent } from "react";
import {
  Button,
  Check,
  FieldLabel,
  FormError,
  Input,
  InputGroup,
  Lock,
  X,
  useToast,
} from "@tapizlabs/ui";
import { changeMyPasswordAction } from "@/lib/actions/profile.actions";
import { useI18n } from "@/i18n/I18nProvider";

interface PasswordChangeFormProps {
  onBack: () => void;
}

export function PasswordChangeForm({ onBack }: PasswordChangeFormProps) {
  const { dict } = useI18n();
  const t = dict.settings.account;
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await changeMyPasswordAction({ currentPassword, newPassword });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast(t.passwordChanged, true);
    onBack();
  };

  return (
    <div className="animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-border bg-ink-200 p-4"
      >
        <div>
          <FieldLabel htmlFor="pc-current">{t.currentPasswordLabel}</FieldLabel>
          <InputGroup className="settings-input-group" prefix={<Lock size={15} className="text-primary-300" />}>
            <Input
              id="pc-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </InputGroup>
        </div>
        <div>
          <FieldLabel htmlFor="pc-new">{t.newPasswordLabel}</FieldLabel>
          <InputGroup className="settings-input-group" prefix={<Lock size={15} className="text-primary-300" />}>
            <Input
              id="pc-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </InputGroup>
          <p className="mt-1.5 text-xs text-txt-4">{t.newPasswordHint}</p>
        </div>
        <FormError message={error} />
        <div className="flex gap-2 border-t border-border pt-3">
          <Button type="submit" fullWidth icon={<Check size={14} />} loading={loading}>
            {dict.common.save}
          </Button>
          <Button variant="secondary" type="button" fullWidth icon={<X size={14} />} onClick={onBack}>
            {dict.common.cancel}
          </Button>
        </div>
      </form>
    </div>
  );
}
