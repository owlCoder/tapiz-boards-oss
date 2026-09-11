"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./config";
import type { Dict } from "./dictionaries";

interface I18nContextValue {
  locale: Locale;
  dict: Dict;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Root layout učitava rečnik server-side i prosleđuje ga ovde — jedan rečnik po requestu. */
export function I18nProvider({
  locale,
  dict,
  children,
}: I18nContextValue & { children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n mora biti unutar I18nProvider-a");
  return ctx;
}
