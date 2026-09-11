"use client";

import { SidePanel as UISidePanel } from "@tapizlabs/ui";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n/I18nProvider";

interface SidePanelProps {
  open: boolean;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  width?: "md" | "lg";
  onClose: () => void;
  /** Sticky footer slot — save/cancel uvek ovde (vidi sidepanel-footer-buttons pravilo). */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Tanak adapter nad standardnim `SidePanel`-om iz `@tapizlabs/ui`.
 * Postoji samo da zadrži boards API (`open`, lokalni `dict.common.close`) i da postojeći
 * pozivi ostanu nepromenjeni; sva logika (tranzicije, scroll-lock, ESC) živi u design systemu.
 */
export function SidePanel({ open, title, subtitle, icon, width = "md", onClose, footer, children }: SidePanelProps) {
  const { dict } = useI18n();
  return (
    <UISidePanel
      isOpen={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      width={width}
      footer={footer}
      closeLabel={dict.common.close}
    >
      {children}
    </UISidePanel>
  );
}
