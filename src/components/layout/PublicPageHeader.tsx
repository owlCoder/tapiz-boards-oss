"use client";

import { Activity, History, PageHeader } from "@tapizlabs/ui";

const ICONS = { activity: Activity, history: History } as const;

interface PublicPageHeaderProps {
  icon: keyof typeof ICONS;
  title: string;
  subtitle: string;
  className?: string;
}

/* @tapizlabs/ui bundle nema "use client" — server stranice ne smeju da ga importuju direktno. */
export function PublicPageHeader({ icon, title, subtitle, className }: PublicPageHeaderProps) {
  const Icon = ICONS[icon];
  return <PageHeader icon={<Icon size={18} />} title={title} subtitle={subtitle} className={className} />;
}
