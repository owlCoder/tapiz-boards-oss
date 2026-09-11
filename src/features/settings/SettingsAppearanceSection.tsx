"use client";

import { Check, Moon, Sun, TAPIZ_SKINS, type TapizSkin } from "@tapizlabs/ui";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { SettingsSection } from "./SettingsRowPrimitives";

function ThemeModeTile({
  label,
  icon,
  selected,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${
        selected
          ? "border-primary-300/60 bg-primary-300/10 text-primary-300"
          : "border-border bg-ink-300/40 text-txt-3 hover:border-primary-300/40 hover:bg-ink-300"
      }`}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span className={`text-[13px] font-semibold ${selected ? "text-primary-300" : "text-txt-2"}`}>
        {label}
      </span>
    </button>
  );
}

function SkinTile({
  skin,
  theme,
  label,
  selected,
  onSelect,
}: {
  skin: TapizSkin;
  theme: "light" | "dark";
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const preview = skin.preview[theme];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
        selected
          ? "border-primary-300/60 bg-primary-300/10"
          : "border-border bg-ink-300/40 hover:border-primary-300/40 hover:bg-ink-300"
      }`}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border"
        style={{ background: preview.surface }}
      >
        <span className="flex items-center gap-0.5">
          <span className="h-3 w-1.5 rounded-full" style={{ background: preview.accent }} />
          <span className="h-3 w-1.5 rounded-full" style={{ background: preview.signal }} />
        </span>
      </span>
      <span className="min-w-0 flex-1 font-display text-sm font-semibold text-txt-1">
        {label}
      </span>
      {selected && (
        <span className="shrink-0 text-primary-300">
          <Check size={16} />
        </span>
      )}
    </button>
  );
}

export function SettingsAppearanceSection() {
  const { dict } = useI18n();
  const t = dict.settings.appearance;
  const { theme, toggleTheme, skin, setSkin } = useTheme();

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <SettingsSection title={t.themeTitle}>
        <p className="mb-1 text-[13px] leading-snug text-txt-3">{t.themeDesc}</p>
        <div className="grid grid-cols-2 gap-3">
          <ThemeModeTile
            label={t.light}
            icon={<Sun size={20} />}
            selected={theme === "light"}
            onSelect={() => theme === "dark" && toggleTheme()}
          />
          <ThemeModeTile
            label={t.dark}
            icon={<Moon size={20} />}
            selected={theme === "dark"}
            onSelect={() => theme === "light" && toggleTheme()}
          />
        </div>
      </SettingsSection>

      <SettingsSection title={t.skinTitle}>
        <p className="mb-1 text-[13px] leading-snug text-txt-3">{t.skinDesc}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TAPIZ_SKINS.map((s) => (
            <SkinTile
              key={s.id}
              skin={s}
              theme={theme}
              label={t.skins[s.id]}
              selected={skin === s.id}
              onSelect={() => setSkin(s.id)}
            />
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
