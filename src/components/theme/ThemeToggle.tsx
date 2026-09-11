"use client";

import { Moon, Sun } from "@tapizlabs/ui";
import { useTheme } from "./ThemeProvider";
import { useI18n } from "@/i18n/I18nProvider";

/** Običan button bez bordera — vizuelno u liniji sa ostalim ikonicama sidebar footera. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { dict } = useI18n();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? dict.common.lightTheme : dict.common.darkTheme}
      className="flex cursor-pointer border-none bg-transparent p-1.5 text-txt-3 hover:text-primary-300"
    >
      <span className="inline-flex h-4 w-4 items-center justify-center">
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </span>
    </button>
  );
}
