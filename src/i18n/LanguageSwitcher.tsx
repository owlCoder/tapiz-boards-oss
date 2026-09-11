"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Globe, ChevronDown, Check } from "@tapizlabs/ui";
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT, LOCALE_COOKIE, type Locale } from "./config";
import { useI18n } from "./I18nProvider";
import { useDropdownPosition } from "./useDropdownPosition";

/* Dropdown u stilu LanguageSwitcher-a iz tapiz-reactjs-ui:
   - full: landing/auth navbar, otvara se nadole;
   - compact: dno sidebara, otvara se NAGORE (da ga viewport ne odseče);
   - collapsed: skupljeni sidebar, samo globus, otvara se nagore. */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <ChevronDown
      size={10}
      strokeWidth={2.5}
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}
    />
  );
}

function setLocaleCookie(value: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
}

function OptionRow({
  locale,
  current,
  onSelect,
}: {
  locale: Locale;
  current: Locale;
  onSelect: () => void;
}) {
  const active = locale === current;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-left transition-colors duration-100 hover:bg-ink-300"
      style={{
        color: active ? "var(--color-primary-300)" : "var(--color-txt-2)",
        background: active ? "color-mix(in srgb, var(--color-primary-300) 8%, transparent)" : undefined,
      }}
    >
      <span className="flex h-5 w-7 shrink-0 items-center justify-center rounded-xs border border-border bg-ink-300 text-[10px] font-semibold">
        {LOCALE_SHORT[locale]}
      </span>
      <span>{LOCALE_LABELS[locale]}</span>
      {active && <Check className="ml-auto" size={12} strokeWidth={2.5} />}
    </button>
  );
}

interface LanguageSwitcherProps {
  variant?: "full" | "compact";
  /** Za uske navbare: prikazi samo globus + chevron, bez kratkog koda jezika. */
  hideShortCode?: boolean;
  /** Skupljeni sidebar: samo globus, bez koda jezika. */
  collapsed?: boolean;
}

export function LanguageSwitcher({
  variant = "full",
  hideShortCode = false,
  collapsed = false,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const { locale, dict } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { buttonRef, menuRef, menuStyle } = useDropdownPosition({ open, variant });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuRef]);

  const select = (value: Locale) => {
    setLocaleCookie(value);
    setOpen(false);
    router.refresh();
  };

  const dropdown = open ? createPortal(
    <div ref={menuRef} style={menuStyle}>
      {LOCALES.map((l) => (
        <OptionRow key={l} locale={l} current={locale} onSelect={() => select(l)} />
      ))}
    </div>,
    document.body,
  ) : null;

  if (collapsed) {
    return (
      <div ref={ref} className="relative flex justify-center">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          title={dict.common.language}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150"
          style={{
            color: "var(--color-txt-3)",
            background: open ? "var(--color-ink-300)" : "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Globe size={15} />
        </button>
        {dropdown}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div ref={ref} className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          title={dict.common.language}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-xs font-semibold transition-colors duration-150"
          style={{
            color: "var(--color-txt-3)",
            background: open ? "var(--color-ink-300)" : "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Globe size={14} />
          {!hideShortCode ? (
            <span className="font-mono text-xs font-bold">{LOCALE_SHORT[locale]}</span>
          ) : null}
          <ChevronIcon open={open} />
        </button>
        {dropdown}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={dict.common.language}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150"
        style={{
          color: open ? "var(--color-txt-1)" : "var(--color-txt-3)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <Globe size={14} />
        <span className="font-mono text-xs font-bold">{LOCALE_SHORT[locale]}</span>
        <ChevronIcon open={open} />
      </button>
      {dropdown}
    </div>
  );
}
