"use client";

import { useEffect, useState } from "react";
import { Badge, Calendar, Spinner } from "@tapizlabs/ui";
import type { ActivityDay, ProjectEventDto } from "@/domain/types";
import {
  getActivityDaysAction,
  getProjectActivityAction,
} from "@/lib/actions/activity.actions";
import { INTL_LOCALES, fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";
import { SidePanel } from "@/components/layout/SidePanel";
import { todayIso } from "@/lib/date";
import { CalendarGrid } from "./CalendarGrid";
import { dayIso, getSelectedLabel } from "./calendarUtils";

interface ProjectCalendarPanelProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
}

interface DayActivity {
  events: ProjectEventDto[];
  dueStories: string[];
}

/**
 * Kalendar aktivnosti projekta: mini mesečni kalendar (dani sa aktivnošću su obeleženi),
 * klik na dan otvara hronologiju — ko je šta i kada uradio + rokovi story-ja tog dana.
 */
export function ProjectCalendarPanel({ open, projectId, onClose }: ProjectCalendarPanelProps) {
  const { dict, locale } = useI18n();
  const t = dict.calendar;
  const intlLocale = INTL_LOCALES[locale];
  const today = todayIso();

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [activeDays, setActiveDays] = useState<Map<string, number>>(new Map());
  const [selectedDay, setSelectedDay] = useState<string>(today);
  const [activity, setActivity] = useState<DayActivity | null>(null);

  // Reset hronologije pri promeni dana / ponovnom otvaranju — tokom rendera
  // (React šablon umesto setState u efektu).
  const [prevDay, setPrevDay] = useState(selectedDay);
  const [prevOpen, setPrevOpen] = useState(open);
  if (selectedDay !== prevDay) {
    setPrevDay(selectedDay);
    setActivity(null);
  }
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setActivity(null);
  }

  // Markeri meseca — jedan grupisani upit po prikazanom mesecu.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const lastDay = new Date(year, month + 1, 0).getDate();
    getActivityDaysAction(projectId, dayIso(year, month, 1), dayIso(year, month, lastDay)).then(
      (result) => {
        if (cancelled || !result.ok) return;
        setActiveDays(new Map(result.data.map((d: ActivityDay) => [d.day, d.count])));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [open, projectId, year, month]);

  // Hronologija izabranog dana.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getProjectActivityAction(projectId, selectedDay).then((result) => {
      if (!cancelled && result.ok) setActivity(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, projectId, selectedDay]);

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const selectedLabel = getSelectedLabel(intlLocale, selectedDay);

  return (
    <SidePanel
      open={open}
      title={t.title}
      subtitle={t.subtitle}
      icon={<Calendar size={18} />}
      onClose={onClose}
    >
      <div className="space-y-5">
        <CalendarGrid
          year={year}
          month={month}
          intlLocale={intlLocale}
          today={today}
          selectedDay={selectedDay}
          activeDays={activeDays}
          prevMonthLabel={t.prevMonth}
          nextMonthLabel={t.nextMonth}
          onShiftMonth={shiftMonth}
          onSelectDay={setSelectedDay}
        />

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">{selectedLabel}</h4>
          {activity === null ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <>
              {activity.dueStories.length > 0 && (
                <div className="space-y-1.5 rounded-xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface) p-3">
                  <p className="text-xs font-semibold">{t.dueTitle}</p>
                  <ul className="space-y-1">
                    {activity.dueStories.map((title) => (
                      <li key={title} className="text-sm text-(--tapiz-text-secondary)">
                        {title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {activity.events.length === 0 ? (
                <p className="text-sm text-(--tapiz-text-muted)">{t.empty}</p>
              ) : (
                <ul className="space-y-2">
                  {activity.events.map((event) => (
                    <li key={event.id} className="flex items-start gap-3 text-sm">
                      <Badge variant="muted">{event.time}</Badge>
                      <span className="min-w-0 flex-1 leading-6">
                        {fmt(t.events[event.type], {
                          name: event.actorName,
                          detail: event.detail,
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </SidePanel>
  );
}
