"use client";

import { Star, Trash } from "@tapizlabs/ui";
import Link from "next/link";
import type { ProjectDto } from "@/domain/types";
import { useI18n } from "@/i18n/I18nProvider";
import { PersonalTeamsSection } from "@/features/projects/personal/PersonalTeamsSection";
import { DashboardAppInfoCard } from "./DashboardAppInfoCard";
import { DashboardHero } from "./DashboardHero";
import { SectionHeader } from "./SectionHeader";

interface DashboardProps {
  firstName: string;
  projects: ProjectDto[];
  currentUserId: string;
}

export function Dashboard({ firstName, projects, currentUserId }: DashboardProps) {
  const { dict } = useI18n();
  const t = dict.dashboard;

  return (
    <div className="mx-auto max-w-[1600px] space-y-7 sm:space-y-8">
      <DashboardHero
        firstName={firstName}
        description={t.studentDescription}
        stats={[{ label: t.personalTeams, value: projects.length, icon: Star }]}
      />

      <section>
        <SectionHeader
          num="00"
          title={t.personalTeams}
          action={
            <Link
              href="/trash"
              className="flex items-center gap-1.5 text-[11px] font-semibold text-txt-4 no-underline transition-colors hover:text-primary-300"
            >
              <Trash size={13} />
              {dict.trash.title}
            </Link>
          }
        />
        <PersonalTeamsSection projects={projects} currentUserId={currentUserId} />
      </section>

      <section>
        <SectionHeader num="01" title={dict.settings.nav.info} />
        <DashboardAppInfoCard />
      </section>
    </div>
  );
}
