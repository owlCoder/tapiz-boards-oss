const PRODUCT_NAME = "Tapiz Boards";

export type PublicLegalSection = {
  title: string;
  body: string;
};

interface PublicLegalPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  sections: PublicLegalSection[];
}

function legalTitle(title: string) {
  return title.replace(/^\s*\d+[).\s]+/, "");
}

export function PublicLegalPage({ eyebrow, title, intro, updated, sections }: PublicLegalPageProps) {
  return (
    <article className="mx-auto max-w-6xl pb-10">
      <header className="mb-6 rounded-2xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface) p-5 shadow-(--tapiz-shadow-sm) sm:p-6">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary-300">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-black tracking-[-0.01em] text-txt-1 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-txt-2 sm:text-base">{intro}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-txt-4">
            <span>{PRODUCT_NAME}</span>
            <span aria-hidden="true">/</span>
            <span>{updated}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-4">
        {sections.map((section, index) => (
          <section key={section.title} className="rounded-2xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface) p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary-300">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display text-lg font-bold text-txt-1">{legalTitle(section.title)}</h2>
            </div>
            <p className="max-w-4xl text-sm leading-7 text-txt-2">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
