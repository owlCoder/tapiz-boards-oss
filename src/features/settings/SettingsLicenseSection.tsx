"use client";

import { ExternalLink, Star } from "@tapizlabs/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { SettingsSection, SRowStatus } from "./SettingsRowPrimitives";

const REPO_URL = "https://github.com/owlCoder/tapiz-boards-oss";

export function SettingsLicenseSection() {
  const { dict } = useI18n();
  const t = dict.settings.license;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <SettingsSection title={dict.settings.sections.license}>
        <SRowStatus
          icon={<Star size={18} />}
          label={t.editionTitle}
          desc={t.editionDescription}
          pill={{ label: t.mitBadge, tone: "mint" }}
        />
      </SettingsSection>
      <p className="text-[13px] leading-snug text-txt-3">{t.licenseNote}</p>
      <div className="flex flex-col gap-2">
        <a
          href={`${REPO_URL}/blob/main/LICENSE`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-lg border border-border bg-ink-100 px-4 py-3 text-sm font-medium text-txt-1 no-underline transition-colors hover:border-primary-300 hover:text-primary-300"
        >
          <span>{t.viewLicenseLabel}</span>
          <ExternalLink size={14} />
        </a>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-lg border border-border bg-ink-100 px-4 py-3 text-sm font-medium text-txt-1 no-underline transition-colors hover:border-primary-300 hover:text-primary-300"
        >
          <span>{t.viewSourceLabel}</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
