import { useEffect, useRef, useState } from "react";

const dropdownStyle: React.CSSProperties = {
  background: "color-mix(in srgb, var(--color-ink-200) 92%, transparent)",
  border: "1px solid var(--color-border-hi)",
  borderRadius: "10px",
  padding: "4px",
  boxShadow: "0 16px 48px -8px rgba(0,0,0,0.45)",
  backdropFilter: "blur(18px) saturate(145%)",
  WebkitBackdropFilter: "blur(18px) saturate(145%)",
};

interface UseDropdownPositionOptions {
  open: boolean;
  variant: "full" | "compact";
}

interface UseDropdownPositionResult {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  menuStyle: React.CSSProperties;
}

export function useDropdownPosition({
  open,
  variant,
}: UseDropdownPositionOptions): UseDropdownPositionResult {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = buttonRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;

      const rect = trigger.getBoundingClientRect();
      const menuWidth = Math.max(menu.offsetWidth, 176);
      const menuHeight = menu.offsetHeight;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      const top = openUp
        ? Math.max(8, rect.top - menuHeight - 8)
        : Math.min(window.innerHeight - menuHeight - 8, rect.bottom + 8);
      const leftBase = variant === "full" ? rect.right - menuWidth : rect.left;
      const left = Math.min(window.innerWidth - menuWidth - 8, Math.max(8, leftBase));

      setMenuStyle({
        ...dropdownStyle,
        position: "fixed",
        top,
        left,
        minWidth: menuWidth,
        zIndex: 400,
      });
    };

    const rafId = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, variant]);

  const fallbackStyle: React.CSSProperties = {
    ...dropdownStyle,
    position: "fixed",
    visibility: "hidden",
    zIndex: 400,
  };

  return {
    buttonRef,
    menuRef,
    menuStyle: menuStyle ?? fallbackStyle,
  };
}
