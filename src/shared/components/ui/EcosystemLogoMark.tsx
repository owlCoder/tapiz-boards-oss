export type LogoMarkVariant = "boards";

/**
 * Standalone brand glyph (not from `@tapizlabs/ui` — each product owns its
 * own mark).
 *
 * Rendering is 3 overlaid strokes (ink bar, then a halo stroke in the
 * surrounding background color, then the color thread) instead of an SVG
 * `<mask>` — the halo stroke visually punches the crossing gap. Simpler and
 * avoids `<mask>` id-collision/hydration edge cases across repeated icons.
 */
const GLYPHS: Record<LogoMarkVariant, { barPath: string; accentPath: string; accent: string }> = {
  boards: {
    barPath: "M13 10 V34 M24 8 V28 M35 14 V40",
    accentPath: "M6 24 H42",
    accent: "#7759c2",
  },
};

const TILE_BG = "#f6f4fa";
const TILE_BORDER = "#e7e2f0";
const INK = "#221c30";

export function EcosystemLogoMark({
  variant,
  size = 22,
  tone = "solid",
  haloVar = "--tapiz-bg-surface",
  className,
}: {
  variant: LogoMarkVariant;
  size?: number;
  /**
   * "solid" = tile + ink bar + accent stroke.
   * "glyph" = ink bar + accent stroke, no tile — halo must match whatever
   *   surface it's drawn on, see `haloVar`.
   * "mono" = single glyph colour via `currentColor` so it inverts with the
   *   theme — white on dark, ink-black on light.
   */
  tone?: "solid" | "glyph" | "mono";
  /**
   * CSS variable name (with leading `--`) providing the halo color for
   * "glyph" tone — must resolve to whatever surface the mark is drawn on, or
   * the crossing-gap effect shows as a solid unmasked bar.
   */
  haloVar?: string;
  className?: string;
}) {
  const glyph = GLYPHS[variant];
  const ink = tone === "mono" ? "currentColor" : INK;
  const accent = tone === "mono" ? "currentColor" : glyph.accent;
  const halo = tone === "solid" ? TILE_BG : tone === "mono" ? "none" : `var(${haloVar})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {tone === "solid" && (
        <>
          <rect width="48" height="48" rx="11.5" fill={TILE_BG} />
          <rect x="0.5" y="0.5" width="47" height="47" rx="11" fill="none" stroke={TILE_BORDER} />
        </>
      )}
      <path d={glyph.barPath} stroke={ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {tone !== "mono" && (
        <path d={glyph.accentPath} stroke={halo} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
      <path d={glyph.accentPath} stroke={accent} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
