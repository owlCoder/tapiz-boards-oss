"use client";

import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

function setLocaleCookie(value: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function LocaleSelector() {
  const router = useRouter();
  const { locale, dict } = useI18n();

  const selectLocale = (value: Locale) => {
    setLocaleCookie(value);
    router.refresh();
  };

  return (
    <div className="mt-4 px-4">
      <div className="flex items-center gap-1.5 pb-2">
        <p className="text-[11px] font-semibold text-txt-3">{dict.common.language}</p>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {LOCALES.map((l) => {
          const active = l === locale;
          return (
            <button
              key={l}
              type="button"
              onClick={() => selectLocale(l)}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-1 py-2.5 transition-colors duration-150 active:scale-95 ${
                active
                  ? "border-primary-300 bg-primary-300/10 text-primary-300"
                  : "border-border bg-ink-200 text-txt-3"
              }`}
            >
              <span className="text-xs font-bold">{LOCALE_SHORT[l]}</span>
              <span className={`text-[11px] ${active ? "text-primary-300" : "text-txt-4"}`}>
                {LOCALE_LABELS[l]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
