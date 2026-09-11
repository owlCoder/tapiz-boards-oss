/**
 * Današnji dan u ISO formatu (yyyy-mm-dd) u vremenskoj zoni Beograda,
 * neovisno o TZ servera (Vercel radi u UTC-u — bez ovoga je rok kod ponoći
 * pomeren za dan). `en-CA` lokal daje baš yyyy-mm-dd.
 */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** yyyy-mm-dd → dd.mm.yyyy. (Nevalidan ulaz se vraća netaknut.) */
export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}.`;
}

/**
 * Kratka relativna oznaka za `dd.mm.yyyy.` datum (granularnost je dan, pa nema sati):
 * `0` (danas), inače `Nd` (< 30 dana), `Nm` (< 12 meseci) ili `Ny`.
 * Vraća `null` za prazan/nevažeći ulaz. Pozivalac dodaje "пре" prefiks / "данас".
 */
export function relativeDayLabel(dmy: string | null, todayIsoStr: string): string | null {
  if (!dmy) return null;
  const [d, m, y] = dmy.split(".");
  if (!d || !m || !y) return null;
  const then = new Date(Number(y), Number(m) - 1, Number(d));
  const [ty, tm, td] = todayIsoStr.split("-");
  const today = new Date(Number(ty), Number(tm) - 1, Number(td));
  const days = Math.max(0, Math.round((today.getTime() - then.getTime()) / 86_400_000));
  if (days === 0) return "0";
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m`;
  return `${Math.floor(days / 365)}y`;
}
