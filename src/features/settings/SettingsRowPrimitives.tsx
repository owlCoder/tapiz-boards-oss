"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "@tapizlabs/ui";

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="font-display text-sm font-bold text-txt-1">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function SRow({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  desc: string;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`group flex w-full items-center gap-3 rounded-xl border border-border bg-ink-300/40 p-3 text-left transition-colors duration-150 ${
        interactive ? "cursor-pointer hover:border-primary-300/40 hover:bg-ink-300" : "cursor-default"
      }`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-300/10 text-primary-300 ring-1 ring-inset ring-primary-300/20">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-semibold text-txt-1">{label}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-txt-3">{desc}</span>
      </span>
      {interactive && (
        <ChevronRight size={14} className="shrink-0 text-txt-4 transition-colors group-hover:text-txt-2" />
      )}
    </button>
  );
}

/** Ikona-chip + naslov/opis red sa statusnim pill-om umesto chevron-a (Licenca sekcija). */
export function SRowStatus({
  icon,
  label,
  desc,
  pill,
}: {
  icon: ReactNode;
  label: string;
  desc: string;
  pill: { label: string; tone: "mint" | "neutral" };
}) {
  const chipTone =
    pill.tone === "mint"
      ? "bg-signal-400/10 text-signal-400 ring-signal-400/20"
      : "bg-primary-300/10 text-primary-300 ring-primary-300/20";
  const pillTone =
    pill.tone === "mint"
      ? "border-signal-400/30 bg-signal-400/10 text-signal-400"
      : "border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface-muted) text-(--tapiz-text-muted)";
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-border bg-ink-300/40 p-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${chipTone}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-semibold text-txt-1">{label}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-txt-3">{desc}</span>
      </span>
      <span
        className={`inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${pillTone}`}
      >
        {pill.label}
      </span>
    </div>
  );
}
