"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Check,
  FieldLabel,
  FormError,
  Input,
  InputGroup,
  Mail,
  User,
  X,
  useToast,
} from "@tapizlabs/ui";
import { updateMyProfileAction } from "@/lib/actions/profile.actions";
import { useI18n } from "@/i18n/I18nProvider";

interface ProfileEditFormProps {
  initialFirstName: string;
  initialLastName: string;
  initialEmail: string;
  onBack: () => void;
}

export function ProfileEditForm({
  initialFirstName,
  initialLastName,
  initialEmail,
  onBack,
}: ProfileEditFormProps) {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.settings.account;
  const { showToast } = useToast();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await updateMyProfileAction({ firstName, lastName, email });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast(t.profileSaved, true);
    router.refresh();
    onBack();
  };

  return (
    <div className="animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-border bg-ink-200 p-4"
      >
        <div>
          <FieldLabel htmlFor="pe-first-name">{t.firstNameLabel}</FieldLabel>
          <InputGroup className="settings-input-group" prefix={<User size={15} className="text-primary-300" />}>
            <Input
              id="pe-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </InputGroup>
        </div>
        <div>
          <FieldLabel htmlFor="pe-last-name">{t.lastNameLabel}</FieldLabel>
          <InputGroup className="settings-input-group" prefix={<User size={15} className="text-primary-300" />}>
            <Input
              id="pe-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </InputGroup>
        </div>
        <div>
          <FieldLabel htmlFor="pe-email">{t.emailLabel}</FieldLabel>
          <InputGroup className="settings-input-group" prefix={<Mail size={15} className="text-primary-300" />}>
            <Input
              id="pe-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </InputGroup>
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
