"use client";

import { useMemo, useState } from "react";
import { Gear, Info, SegmentedTabs, Star, User } from "@tapizlabs/ui";
import { useI18n } from "@/i18n/I18nProvider";
import type { Role } from "@/domain/types";
import { SidePanel } from "@/components/layout/SidePanel";
import { SettingsAccountSection } from "./SettingsAccountSection";
import { SettingsLicenseSection } from "./SettingsLicenseSection";
import { SettingsInfoSection } from "./SettingsInfoSection";

type SettingsSection = "account" | "license" | "info";

export interface SettingsDialogUser {
  name: string;
  firstName: string;
  lastName: string;
  role: Role;
  email?: string;
}

interface BoardsSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  user: SettingsDialogUser;
}

export function BoardsSettingsDialog({ open, onClose, user }: BoardsSettingsDialogProps) {
  const { dict } = useI18n();
  const [section, setSection] = useState<SettingsSection>("account");

  // Reset section on open — during render (prevOpen pattern), not via useEffect.
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setSection("account");
  }

  const navItems = useMemo(
    () => [
      { id: "account", label: dict.settings.nav.account, icon: <User size={16} /> },
      { id: "license", label: dict.settings.nav.license, icon: <Star size={16} /> },
      { id: "info", label: dict.settings.nav.info, icon: <Info size={16} /> },
    ],
    [dict.settings.nav.account, dict.settings.nav.license, dict.settings.nav.info],
  );

  const subtitle =
    section === "account"
      ? dict.settings.sections.account
      : section === "license"
        ? dict.settings.sections.license
        : dict.settings.sections.info;

  return (
    <SidePanel
      open={open}
      title={dict.settings.title}
      subtitle={subtitle}
      icon={<Gear size={18} />}
      width="md"
      onClose={onClose}
    >
      <SegmentedTabs
        className="mb-5"
        activeId={section}
        onChange={(id) => setSection(id as SettingsSection)}
        items={navItems}
      />

      <div className="animate-in fade-in duration-200">
        {section === "account" ? (
          <SettingsAccountSection user={user} />
        ) : section === "license" ? (
          <SettingsLicenseSection />
        ) : (
          <SettingsInfoSection />
        )}
      </div>
    </SidePanel>
  );
}
