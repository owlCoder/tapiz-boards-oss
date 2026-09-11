"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { useI18n } from "@/i18n/I18nProvider";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export interface HeroStat {
  label: string;
  value: ReactNode;
  icon?: ComponentType<{ size?: number; className?: string }>;
}

interface DashboardHeroProps {
  firstName: string;
  /** Kratak opis uloge/stranice ispod pozdrava. */
  description: string;
  /** Status pilule desno (do 4), kao na /ui dashboardu. */
  stats: HeroStat[];
  actions?: ReactNode;
}

/** Pozdravni hero po uzoru na tapiz-reactjs-ui DashboardHero: status linija, pozdrav i pilule. */
export function DashboardHero({ firstName, description, stats, actions }: DashboardHeroProps) {
  const { dict } = useI18n();
  const t = dict.dashboard.hero;
  // Jednom po mount-u; server i klijent se mogu razlikovati u minutu — zato suppressHydrationWarning.
  const [now] = useState(() => new Date());

  const greeting =
    now.getHours() >= 6 && now.getHours() < 12
      ? t.morning
      : now.getHours() >= 12 && now.getHours() < 20
        ? t.afternoon
        : t.evening;
  const dateStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;

  return (
    <section className="grid grid-cols-1 gap-7 pb-7 pt-2 lg:grid-cols-2">
      <div>
        <div className="mb-3.5 flex items-center gap-3 text-[11px] font-semibold text-txt-3">
          <span className="h-2 w-2 shrink-0 rounded-full bg-signal-400 tz-pulse" />
          <span suppressHydrationWarning>
            {t.days[now.getDay()]} - {dateStr} - {pad(now.getHours())}:{pad(now.getMinutes())}
          </span>
        </div>
        <h1
          suppressHydrationWarning
          className="font-display text-[clamp(32px,5vw,56px)] font-semibold leading-[1.02] tracking-tight text-txt-1"
        >
          {greeting},{" "}
          <span className="relative isolate inline-block px-0.5 text-primary-300">
            {firstName}
            <span className="absolute -bottom-1 left-0 right-0 -z-10 h-1.5 rounded-full bg-signal-400" />
          </span>
          <span className="text-signal-400">.</span>
        </h1>
        <p className="mt-3.5 text-sm text-txt-2 sm:text-base">{description}</p>
        {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      <div className="relative isolate flex self-end overflow-hidden rounded-lg border border-border bg-ink-200">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`relative isolate flex flex-1 flex-col overflow-hidden p-3.5 px-4 text-txt-1 ${index < stats.length - 1 ? "border-r border-border" : ""}`}
            >
              {Icon ? (
                <Icon
                  size={48}
                  className="pointer-events-none absolute -bottom-2.5 -right-2.5 -z-10 -rotate-12 text-primary-300/8"
                />
              ) : null}
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-txt-3">
                {Icon ? <Icon size={12} className="shrink-0 text-primary-300/70" /> : null}
                {stat.label}
              </div>
              <div className="mt-1.5 font-display text-[22px] font-semibold leading-none text-txt-1">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
