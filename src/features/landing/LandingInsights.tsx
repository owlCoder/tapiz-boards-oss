"use client";

import type { ReactNode } from "react";
import { ArrowRight, BarChart, ExternalLink, UserCheck, Users } from "@tapizlabs/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { SectionHeader } from "./primitives/SectionHeader";

const ROLE_ICONS: ReactNode[] = [
  <Users key="team" size={22} />,
  <UserCheck key="assistant" size={22} />,
  <BarChart key="progress" size={22} />,
  <ExternalLink key="defense" size={22} />,
];

export function LandingInsights() {
  const { dict } = useI18n();
  const t = dict.landing.insights;

  return (
    <section className="lp-section lp-roles" id="insights">
      <div className="lp-container lp-roles-layout">
        <div className="lp-roles-intro">
          <SectionHeader eyebrow={t.eyebrow} title={t.title} description={t.description} />
          <div className="lp-roles-callout">
            <span>{t.calloutKicker}</span>
            <strong>{t.calloutTitle}</strong>
            <p>{t.calloutDescription}</p>
          </div>
        </div>
        <ul className="lp-role-list">
          {t.items.map((item, index) => (
            <li key={item.title}>
              <span className="lp-role-icon" aria-hidden="true">{ROLE_ICONS[index]}</span>
              <div>
                <small>{item.kicker}</small>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <ArrowRight size={18} aria-hidden="true" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
