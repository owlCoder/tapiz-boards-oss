"use client";

import { Gear, LogOut, Palette } from "@tapizlabs/ui";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n/I18nProvider";

function ActionButton({
  label,
  icon,
  onClick,
  warn = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  warn?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 transition-all active:scale-95 ${
        warn
          ? "border-warn/30 bg-warn/10 text-warn hover:bg-warn/20"
          : "border-border bg-ink-200 text-txt-2 hover:bg-ink-300"
      }`}
    >
      <span className={`flex items-center justify-center [&_svg]:h-8 [&_svg]:w-8 ${warn ? "text-warn" : "text-txt-3"}`}>
        {icon}
      </span>
      <span className={`text-center text-[12px] font-medium ${warn ? "text-warn" : "text-txt-2"}`}>
        {label}
      </span>
    </button>
  );
}

interface AccountActionsProps {
  onClose: () => void;
  onSettings: () => void;
  onAppearance: () => void;
  onLogout: () => void;
}

export function AccountActions({ onClose, onSettings, onAppearance, onLogout }: AccountActionsProps) {
  const { dict } = useI18n();

  return (
    <div className="mb-4">
      <p className="px-4 pb-2 pt-2 text-[11px] font-semibold text-txt-3">{dict.nav.account}</p>
      <div className="grid grid-cols-3 gap-3 px-4">
        <ActionButton
          label={dict.nav.settings}
          icon={<Gear />}
          onClick={() => {
            onClose();
            onSettings();
          }}
        />
        <ActionButton
          label={dict.settings.nav.appearance}
          icon={<Palette />}
          onClick={() => {
            onClose();
            onAppearance();
          }}
        />
        <ActionButton
          warn
          label={dict.nav.logout}
          icon={<LogOut />}
          onClick={() => {
            onClose();
            onLogout();
          }}
        />
      </div>
    </div>
  );
}
