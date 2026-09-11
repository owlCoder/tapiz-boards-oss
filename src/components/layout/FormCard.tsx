"use client";

import type { ReactNode } from "react";

interface FormCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
}

/** On-page forma u stilu /ui: top border primary, ikonica u soft kvadratu, naslov + akcentovan podnaslov. */
export function FormCard({ title, subtitle, icon, children }: FormCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-(--tapiz-bg-surface) p-4 animate-in fade-in slide-in-from-top-2 duration-200 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        {icon ? (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-300/10 text-primary-300">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="font-display text-sm font-bold text-txt-1">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-primary-300">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
