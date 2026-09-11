"use client";

import { useState } from "react";
import { Edit, Lock } from "@tapizlabs/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { ProfileEditForm } from "./ProfileEditForm";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { SettingsProfileCard } from "./SettingsProfileCard";
import { SettingsSection, SRow } from "./SettingsRowPrimitives";
import type { SettingsDialogUser } from "./BoardsSettingsDialog";

type AccountView = "menu" | "edit" | "password";

interface SettingsAccountSectionProps {
  user: SettingsDialogUser;
}

export function SettingsAccountSection({ user }: SettingsAccountSectionProps) {
  const { dict } = useI18n();
  const t = dict.settings.account;
  const [view, setView] = useState<AccountView>("menu");

  if (view === "edit") {
    return (
      <ProfileEditForm
        initialFirstName={user.firstName}
        initialLastName={user.lastName}
        initialEmail={user.email ?? ""}
        onBack={() => setView("menu")}
      />
    );
  }
  if (view === "password") {
    return <PasswordChangeForm onBack={() => setView("menu")} />;
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <SettingsProfileCard user={user} />
      <SettingsSection title={t.securityTitle}>
        <SRow icon={<Lock size={18} />} label={t.changePasswordTitle} desc={t.changePasswordDescription} onClick={() => setView("password")} />
      </SettingsSection>
      <SettingsSection title={t.personalTitle}>
        <SRow icon={<Edit size={18} />} label={t.editProfileTitle} desc={t.editProfileDescription} onClick={() => setView("edit")} />
      </SettingsSection>
    </div>
  );
}
