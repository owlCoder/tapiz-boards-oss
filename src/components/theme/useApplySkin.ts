"use client";

import { useLayoutEffect } from "react";
import { applyTapizSkin, clearTapizSkin } from "@tapizlabs/ui";
import { useTheme } from "./ThemeProvider";

/**
 * Applies the chosen skin (`data-skin` on <html>) while the mounting layout is
 * shown and clears it on unmount. Mounted by the app shell and by the auth
 * layout (via {@link ApplySkin}), so login/register follow the user's chosen
 * skin — the auth chrome reads design-system tokens (`--color-primary/-signal`),
 * which the skin swaps. The landing/public pages never mount it, so they keep
 * the fixed Ink & Ember brand.
 */
export function useApplySkin() {
  const { skin } = useTheme();

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    applyTapizSkin(skin);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove("theme-switching"));
    });
    return () => clearTapizSkin();
  }, [skin]);
}
