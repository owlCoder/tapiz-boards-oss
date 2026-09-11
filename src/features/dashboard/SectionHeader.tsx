interface SectionHeaderProps {
  num: string;
  title: string;
  action?: React.ReactNode;
}

/** Numerisan zaglavlje sekcije, po uzoru na /ui (tapiz-lms/apps/web) dashboard. */
export function SectionHeader({ num, title, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3 px-0.5">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-bold text-signal-400">{num}</span>
        <span className="font-display text-sm font-bold uppercase tracking-wide text-txt-1">{title}</span>
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
