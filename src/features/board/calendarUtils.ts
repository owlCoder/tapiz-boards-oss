const pad = (value: number) => String(value).padStart(2, "0");

export const dayIso = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

export function getMonthLabel(intlLocale: string, year: number, month: number): string {
  return new Intl.DateTimeFormat(intlLocale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
}

/** Monday-first weekday narrow labels (Mon 2024-01-01 is a Monday). */
export function getWeekdayLabels(intlLocale: string): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(intlLocale, { weekday: "narrow" }).format(new Date(2024, 0, i + 1)),
  );
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Number of blank cells before the 1st (Monday = 0). */
export function getLeadingBlanks(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

export function getSelectedLabel(intlLocale: string, selectedDay: string): string {
  return new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(selectedDay));
}
