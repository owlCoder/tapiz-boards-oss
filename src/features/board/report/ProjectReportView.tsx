"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { ProjectExportData } from "@/domain/types";
import { buildProjectReport, type ReportGroup, type ReportStory, type ReportTotals } from "@/domain/services/project-report";
import { INTL_LOCALES, type Locale } from "@/i18n/config";
import type { Dict } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/I18nProvider";
import "./project-report.css";

function dateLabel(value: string, locale: Locale, withTime = false): string {
  const date = new Date(value.length === 10 ? value + "T00:00:00Z" : value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "UTC",
  }).format(date) + (withTime ? " UTC" : "");
}

function ReportMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="report-metric rounded-xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface) px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-(--tapiz-text-muted)">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-(--tapiz-text-primary)">{value}</p>
    </div>
  );
}

function GroupMetrics({ totals, t }: { totals: ReportTotals; t: Dict["report"] }) {
  return (
    <div className="report-group-metrics flex flex-wrap gap-x-5 gap-y-1 text-sm text-(--tapiz-text-secondary)">
      <span>{t.stories}: <strong>{totals.stories}</strong></span>
      <span>{t.doneStories}: <strong>{totals.done}</strong></span>
      <span>{t.points}: <strong>{totals.donePoints}/{totals.storyPoints}</strong></span>
      <span>{t.estimatedHours}: <strong>{totals.estimatedHours} h</strong></span>
      <span>{t.checklist}: <strong>{totals.checklistDone}/{totals.checklistItems}</strong></span>
    </div>
  );
}

function ReportStoryItem({ item, t, locale }: { item: ReportStory; t: Dict["report"]; locale: Locale }) {
  const story = item.story;
  return (
    <li className="report-story rounded-xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface) p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="min-w-0 flex-1 text-sm font-bold text-(--tapiz-text-primary)">{story.title}</h4>
        <span className="rounded-md border border-(--tapiz-border-strong) px-2 py-0.5 text-xs font-semibold">
          {item.done ? t.doneStatus : (item.columnName || t.backlog)}
        </span>
      </div>
      {story.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-(--tapiz-text-secondary)">{story.description}</p>}
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-(--tapiz-text-muted) md:grid-cols-4">
        <div><dt>{t.assignee}</dt><dd className="mt-0.5 font-semibold text-(--tapiz-text-primary)">{story.assigneeName || t.unassigned}</dd></div>
        <div><dt>{t.author}</dt><dd className="mt-0.5 font-semibold text-(--tapiz-text-primary)">{story.authorName}</dd></div>
        <div><dt>{t.priority}</dt><dd className="mt-0.5 font-semibold text-(--tapiz-text-primary)">{t[story.priority]}</dd></div>
        <div><dt>{t.points}</dt><dd className="mt-0.5 font-semibold text-(--tapiz-text-primary)">{story.storyPoints ?? "—"}</dd></div>
        <div><dt>{t.estimatedHours}</dt><dd className="mt-0.5 font-semibold text-(--tapiz-text-primary)">{story.estimatedHours === null ? "—" : story.estimatedHours + " h"}</dd></div>
        <div><dt>{t.dueDate}</dt><dd className="mt-0.5 font-semibold text-(--tapiz-text-primary)">{story.dueDate ? dateLabel(story.dueDate, locale) : "—"}</dd></div>
      </dl>
      {item.tasks.length > 0 && (
        <div className="mt-3 border-t border-(--tapiz-border-subtle) pt-2">
          <h5 className="text-xs font-bold">{t.checklist} ({item.tasks.filter((task) => task.done).length}/{item.tasks.length})</h5>
          <ul className="mt-1 space-y-1 text-sm text-(--tapiz-text-secondary)">
            {item.tasks.map((task) => <li key={task.id}><span aria-hidden="true">{task.done ? "☑" : "☐"}</span> {task.title}</li>)}
          </ul>
        </div>
      )}
      {item.comments.length > 0 && (
        <div className="mt-3 border-t border-(--tapiz-border-subtle) pt-2">
          <h5 className="text-xs font-bold">{t.comments} ({item.comments.length})</h5>
          <ul className="mt-2 space-y-2">
            {item.comments.map((comment) => (
              <li key={comment.id} className="text-sm">
                <span className="font-semibold">{comment.authorName}</span>
                <span className="ml-2 text-xs text-(--tapiz-text-muted)">{dateLabel(comment.createdAt, locale, true)}</span>
                <p className="mt-0.5 whitespace-pre-wrap text-(--tapiz-text-secondary)">{comment.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function ReportSection({ group, t, locale }: { group: ReportGroup; t: Dict["report"]; locale: Locale }) {
  const sprint = group.sprint;
  return (
    <section className="report-section space-y-3 rounded-2xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface-muted) p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">{sprint?.name ?? t.backlog}</h3>
          {sprint?.goal && <p className="mt-1 whitespace-pre-wrap text-sm text-(--tapiz-text-secondary)">{t.goal}: {sprint.goal}</p>}
        </div>
        {sprint && (
          <div className="text-right text-xs text-(--tapiz-text-secondary)">
            <p className="font-bold">{t[sprint.status]}</p>
            <p>{dateLabel(sprint.startDate, locale)} – {dateLabel(sprint.endDate, locale)}</p>
          </div>
        )}
      </div>
      <GroupMetrics totals={group.totals} t={t} />
      {group.stories.length === 0 ? (
        <p className="text-sm text-(--tapiz-text-muted)">{t.noStories}</p>
      ) : (
        <ol className="space-y-3">
          {group.stories.map((item) => <ReportStoryItem key={item.story.id} item={item} t={t} locale={locale} />)}
        </ol>
      )}
      {group.retrospectives.length > 0 && (
        <div className="report-retrospective border-t border-(--tapiz-border-subtle) pt-3">
          <h4 className="font-semibold">{t.retrospectives} ({group.retrospectives.length})</h4>
          <ul className="mt-2 space-y-3">
            {group.retrospectives.map((retro) => (
              <li key={retro.id} className="text-sm">
                <span className="mr-2 font-bold">{retro.category === "good" ? t.good : t.bad}</span>
                <span className="text-xs text-(--tapiz-text-muted)">{retro.authorName} · {dateLabel(retro.createdAt, locale)}</span>
                <p className="mt-1 whitespace-pre-wrap text-(--tapiz-text-secondary)">{retro.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** A complete, print-first report using the same authorized export snapshot as JSON/CSV. */
export function ProjectReportView({ data }: { data: ProjectExportData }) {
  const { dict, locale } = useI18n();
  const t = dict.report;
  const report = buildProjectReport(data);

  useEffect(() => {
    // Direct PDF export opens this printable report; keep the manual button as fallback.
    if (new URLSearchParams(window.location.search).get("print") !== "1") return;
    const timer = window.setTimeout(() => window.print(), 450);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="project-report mx-auto w-full max-w-5xl px-4 py-6 text-(--tapiz-text-primary) sm:px-8">
      <nav className="report-controls mb-6 flex flex-wrap items-center justify-between gap-3" aria-label={t.reportTitle}>
        <Link href={"/projects/" + data.project.id + "/sprints"} className="rounded-lg border border-(--tapiz-border-strong) px-4 py-2 text-sm font-semibold hover:bg-(--tapiz-bg-surface-muted)">
          {t.backToSprints}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="max-w-sm text-xs text-(--tapiz-text-muted)">{t.pdfHint}</span>
          <button type="button" onClick={() => window.print()} className="rounded-lg bg-(--tapiz-accent) px-4 py-2 text-sm font-bold text-(--tapiz-accent-contrast)">
            {t.saveAsPdf}
          </button>
        </div>
      </nav>
      <header className="report-header border-b-2 border-(--tapiz-border-strong) pb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-(--tapiz-accent)">{t.reportTitle}</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{data.project.name}</h1>
        <p className="mt-2 text-sm text-(--tapiz-text-secondary)">{t.description}</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-(--tapiz-text-muted)">
          <span>{t.owner}: {data.project.ownerName}</span>
          <span>{t.generated}: {dateLabel(data.exportedAt, locale, true)}</span>
          {data.project.githubRepo && <span>{t.repository}: {data.project.githubRepo}</span>}
        </div>
        <p className="mt-2 text-xs text-(--tapiz-text-muted)">{t.snapshotNote}</p>
      </header>

      <section className="report-summary mt-6 space-y-3">
        <h2 className="font-display text-xl font-bold">{t.overview}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <ReportMetric label={t.sprints} value={report.totals.sprints} />
          <ReportMetric label={t.completedSprints} value={report.totals.completedSprints} />
          <ReportMetric label={t.stories} value={report.totals.stories} />
          <ReportMetric label={t.doneStories} value={report.totals.done} />
          <ReportMetric label={t.points} value={String(report.totals.donePoints) + "/" + report.totals.storyPoints} />
          <ReportMetric label={t.estimatedHours} value={String(report.totals.estimatedHours) + " h"} />
          <ReportMetric label={t.checklist} value={String(report.totals.checklistDone) + "/" + report.totals.checklistItems} />
          <ReportMetric label={t.members} value={report.totals.members} />
        </div>
      </section>

      <section className="report-members mt-6">
        <h2 className="mb-3 font-display text-xl font-bold">{t.members} ({data.members.length})</h2>
        {data.members.length === 0 ? <p className="text-sm">{t.none}</p> : (
          <ul className="grid gap-2 md:grid-cols-2">
            {data.members.map((member) => (
              <li key={member.userId} className="report-member rounded-xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface) p-3">
                <p className="text-sm font-semibold">{member.firstName} {member.lastName}{member.isOwner ? " · " + t.owner : ""}</p>
                <p className="text-xs text-(--tapiz-text-muted)">{member.email}</p>
                <p className="mt-1 text-xs text-(--tapiz-text-muted)">{t.weeklyCapacity}: {member.weeklyCapacityHours === null ? "—" : member.weeklyCapacityHours + " h"}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="report-sprints mt-8 space-y-4">
        <h2 className="font-display text-xl font-bold">{t.allSprints} ({report.groups.length})</h2>
        {report.groups.length === 0 ? <p className="text-sm">{t.noSprints}</p> :
          report.groups.map((group) => <ReportSection key={group.sprint!.id} group={group} t={t} locale={locale} />)}
      </section>

      <section className="report-backlog mt-8">
        <h2 className="mb-3 font-display text-xl font-bold">{t.outsideSprints} ({report.backlog.totals.stories})</h2>
        <ReportSection group={report.backlog} t={t} locale={locale} />
      </section>

      <section className="report-activities mt-8">
        <h2 className="mb-3 font-display text-xl font-bold">{t.activities} ({data.activities.length})</h2>
        {data.activities.length === 0 ? <p className="text-sm">{t.none}</p> : (
          <ol className="space-y-2">
            {[...data.activities].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((activity) => (
              <li key={activity.id} className="report-activity flex flex-wrap gap-x-3 rounded-lg border-b border-(--tapiz-border-subtle) py-2 text-sm">
                <span className="font-semibold">{activity.actorName}</span>
                <span className="text-(--tapiz-text-secondary)">{activity.type.replaceAll("_", " ")}</span>
                {activity.detail && <span className="text-(--tapiz-text-secondary)">{activity.detail}</span>}
                <time className="ml-auto text-xs text-(--tapiz-text-muted)">{dateLabel(activity.createdAt, locale, true)}</time>
              </li>
            ))}
          </ol>
        )}
      </section>
      <footer className="mt-8 border-t border-(--tapiz-border-subtle) py-4 text-xs text-(--tapiz-text-muted)">
        {t.footer} · {data.project.name} · {dateLabel(data.exportedAt, locale, true)}
      </footer>
    </main>
  );
}
