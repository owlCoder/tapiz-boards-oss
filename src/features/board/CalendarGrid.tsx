"use client";

import {
  dayIso,
  getDaysInMonth,
  getLeadingBlanks,
  getMonthLabel,
  getWeekdayLabels,
} from "./calendarUtils";

interface CalendarGridProps {
  year: number;
  month: number;
  intlLocale: string;
  today: string;
  selectedDay: string;
  activeDays: Map<string, number>;
  prevMonthLabel: string;
  nextMonthLabel: string;
  onShiftMonth: (delta: number) => void;
  onSelectDay: (iso: string) => void;
}

export function CalendarGrid({
  year,
  month,
  intlLocale,
  today,
  selectedDay,
  activeDays,
  prevMonthLabel,
  nextMonthLabel,
  onShiftMonth,
  onSelectDay,
}: CalendarGridProps) {
  const monthLabel = getMonthLabel(intlLocale, year, month);
  const weekdayLabels = getWeekdayLabels(intlLocale);
  const daysInMonth = getDaysInMonth(year, month);
  const leadingBlanks = getLeadingBlanks(year, month);

  return (
    <div className="rounded-2xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface) p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onShiftMonth(-1)}
          title={prevMonthLabel}
          className="cursor-pointer border-none bg-transparent px-2 py-1 text-(--tapiz-text-muted) transition-colors hover:text-(--tapiz-text-primary)"
        >
          ‹
        </button>
        <p className="text-sm font-semibold capitalize">{monthLabel}</p>
        <button
          type="button"
          onClick={() => onShiftMonth(1)}
          title={nextMonthLabel}
          className="cursor-pointer border-none bg-transparent px-2 py-1 text-(--tapiz-text-muted) transition-colors hover:text-(--tapiz-text-primary)"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdayLabels.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="py-1 font-mono text-[10px] uppercase text-(--tapiz-text-muted)"
          >
            {label}
          </span>
        ))}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const iso = dayIso(year, month, i + 1);
          const count = activeDays.get(iso) ?? 0;
          const selected = iso === selectedDay;
          const isToday = iso === today;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDay(iso)}
              className={`relative cursor-pointer rounded-md border py-1.5 text-xs transition-colors ${
                selected
                  ? "border-(--tapiz-accent) bg-(--tapiz-accent-soft) font-bold text-(--tapiz-accent)"
                  : isToday
                  ? "border-(--tapiz-border-strong) bg-transparent font-semibold"
                  : "border-transparent bg-transparent hover:border-(--tapiz-border-subtle)"
              }`}
            >
              {i + 1}
              {count > 0 && (
                <span
                  aria-hidden
                  className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-(--tapiz-accent)"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
