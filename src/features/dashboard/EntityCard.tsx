"use client";

import Link from "next/link";
import { ArrowRight, Card, CardBody } from "@tapizlabs/ui";
import type { ComponentType, ReactNode } from "react";
import { useI18n } from "@/i18n/I18nProvider";

interface EntityCardProps {
  href: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Krupna brojka desno (kao na karticama timova na detalju predmeta). */
  metricValue: ReactNode;
  metricLabel: string;
  badge?: ReactNode;
  /** Velika bleda ikona u pozadini donjeg desnog ugla — čisto dekorativna tekstura. */
  doodle?: ComponentType<{ size?: number; className?: string }>;
}

/** Klikabilna kartica entiteta (predmet/tim) — naslov levo, krupna metrika desno, dekorativni doodle u pozadini. */
export function EntityCard({
  href,
  title,
  subtitle,
  icon,
  metricValue,
  metricLabel,
  badge,
  doodle: Doodle,
}: EntityCardProps) {
  const { dict } = useI18n();

  return (
    <Link href={href} className="group block h-full no-underline">
      <Card
        variant="surface"
        hover
        className="relative isolate flex h-full flex-col overflow-hidden rounded-lg border border-border bg-ink-200 transition-colors hover:border-primary-300/30"
      >
        {Doodle ? (
          <Doodle
            size={56}
            className="pointer-events-none absolute -bottom-3 -right-3 -z-10 -rotate-12 text-primary-300/8"
          />
        ) : null}
        <CardBody className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            {icon ? (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary-300/25 bg-primary-300/10 text-primary-300">
                {icon}
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-bold leading-tight text-txt-1 transition-colors group-hover:text-primary-300">
                {title}
              </p>
              {subtitle ? (
                <p className="truncate text-xs text-(--tapiz-text-muted)">{subtitle}</p>
              ) : null}
            </div>
            <ArrowRight
              size={14}
              className="shrink-0 text-txt-4 transition-all group-hover:translate-x-0.5 group-hover:text-primary-300"
            />
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
            <div className="min-w-0">
              {badge ? (
                badge
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-txt-4">
                  {dict.dashboard.viewDetails}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-baseline gap-1.5">
              <span className="font-display text-lg font-bold leading-none text-txt-1">
                {metricValue}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-txt-4">
                {metricLabel}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
