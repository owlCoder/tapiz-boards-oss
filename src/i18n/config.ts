export const LOCALES = ["sr", "sr-Cyrl", "en", "fr", "hu"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "sr";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<Locale, string> = {
  sr: "Srpski (latinica)",
  "sr-Cyrl": "Српски (ћирилица)",
  en: "English",
  fr: "Français",
  hu: "Magyar",
};

/** Kratki kodovi u switcheru — isti kao u tapiz-reactjs-ui. */
export const LOCALE_SHORT: Record<Locale, string> = {
  sr: "SR",
  "sr-Cyrl": "СР",
  en: "EN",
  fr: "FR",
  hu: "HU",
};

/** BCP-47 oznake za Intl API (formatiranje datuma) i <html lang>. */
export const INTL_LOCALES: Record<Locale, string> = {
  sr: "sr-Latn-RS",
  "sr-Cyrl": "sr-Cyrl-RS",
  en: "en-GB",
  fr: "fr-FR",
  hu: "hu-HU",
};

export const HTML_LANGS: Record<Locale, string> = {
  sr: "sr-Latn",
  "sr-Cyrl": "sr-Cyrl",
  en: "en",
  fr: "fr",
  hu: "hu",
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Mini interpolacija: fmt("Zdravo {name}", { name: "Ana" }) → "Zdravo Ana". */
export function fmt(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  );
}
