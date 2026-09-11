import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import { getDict } from "@/i18n/server";
import type { Dict } from "@/i18n/dictionaries";

export const dynamic = "force-static";

type ChangeType = "new" | "improved" | "fix";

interface ChangelogEntry {
  version: string;
  date: string;
  items: { type: ChangeType; text: string }[];
}

function buildEntries(t: Dict["changelog"]): ChangelogEntry[] {
  return [
    {
      version: "0.8.0",
      date: t.v080Date,
      items: t.v080Items.map((text) => ({ type: "new" as const, text })),
    },
    {
      version: "0.1.0",
      date: t.v010Date,
      items: t.v010Items.map((text) => ({ type: "new" as const, text })),
    },
  ];
}

const TYPE_COLORS: Record<ChangeType, { color: string; bg: string }> = {
  new: { color: "var(--color-good)", bg: "color-mix(in srgb, var(--color-good) 12%, transparent)" },
  improved: { color: "var(--tapiz-info)", bg: "color-mix(in srgb, var(--tapiz-info) 12%, transparent)" },
  fix: { color: "var(--color-signal-400)", bg: "color-mix(in srgb, var(--color-signal-400) 12%, transparent)" },
};

function TypeBadge({ type, label }: { type: ChangeType; label: string }) {
  const color = TYPE_COLORS[type];
  return (
    <span
      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-widest shrink-0"
      style={{ color: color.color, background: color.bg, border: `1px solid color-mix(in srgb, ${color.color} 30%, transparent)` }}
    >
      {label}
    </span>
  );
}

function ReleaseCard({
  entry,
  index,
  typeLabels,
}: {
  entry: ChangelogEntry;
  index: number;
  typeLabels: Record<ChangeType, string>;
}) {
  return (
    <article className="sm:pl-10 relative">
      <div
        className={`hidden sm:block absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-(--tapiz-border-subtle) z-1 ${
          index === 0 ? "bg-primary-300" : "bg-ink-400"
        }`}
      />
      <div className="rounded-2xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface) overflow-hidden">
        <div
          className={`flex items-center justify-between px-5 py-4 gap-4 flex-wrap border-b border-(--tapiz-border-subtle) ${
            index === 0 ? "bg-primary-300/4" : "bg-(--tapiz-bg-surface-muted)"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-base text-txt-1">v{entry.version}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest font-mono"
              style={{
                color: "var(--color-primary-300)",
                background: "color-mix(in srgb, var(--color-primary-300) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-primary-300) 19%, transparent)",
              }}
            >
              RELEASE
            </span>
          </div>
          <span className="text-[11px] font-mono text-txt-4">{entry.date}</span>
        </div>
        <div className="p-5 flex flex-col gap-2.5">
          {entry.items.map((item) => (
            <div key={item.text} className="flex items-start gap-3">
              <TypeBadge type={item.type} label={typeLabels[item.type]} />
              <span className="text-sm leading-snug text-txt-2">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export default async function ChangelogPage() {
  const dict = await getDict();
  const t = dict.changelog;
  const entries = buildEntries(t);
  const typeLabels: Record<ChangeType, string> = {
    new: t.typeNew,
    improved: t.typeImproved,
    fix: t.typeFix,
  };
  return (
    <div>
      <PublicPageHeader icon="history" title={t.title} subtitle={t.subtitle} className="mb-3" />
      <p className="text-sm mb-12 text-txt-3">{t.description}</p>
      <div className="relative">
        <div className="absolute left-1.75 top-2 bottom-2 w-px hidden sm:block bg-(--tapiz-border-subtle)" />
        <div className="flex flex-col gap-10">
          {entries.map((entry, index) => (
            <ReleaseCard key={entry.version} entry={entry} index={index} typeLabels={typeLabels} />
          ))}
        </div>
      </div>
    </div>
  );
}
