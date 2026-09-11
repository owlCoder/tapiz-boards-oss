"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { TAPIZ_SKIN_IDS, type TapizSkinId } from "@tapizlabs/ui";

type Theme = "light" | "dark";

const STORAGE_KEY = "tb-theme";
const CHANGE_EVENT = "tb-theme-change";
const SKIN_STORAGE_KEY = "tb-skin";
const DEFAULT_SKIN: TapizSkinId = "default";

function readStoredSkin(): TapizSkinId {
  if (typeof window === "undefined") return DEFAULT_SKIN;
  const stored = localStorage.getItem(SKIN_STORAGE_KEY);
  return (TAPIZ_SKIN_IDS as readonly string[]).includes(stored ?? "")
    ? (stored as TapizSkinId)
    : DEFAULT_SKIN;
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  skin: TapizSkinId;
  setSkin: (skin: TapizSkinId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

type VTDocument = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

/* Tema je eksterno stanje (klasa na <html> koju postavlja themeInitScript pre hidratacije
   + localStorage), pa je čitamo kroz useSyncExternalStore umesto setState u efektu —
   React posle hidratacije sam uskladi server snapshot ("dark") sa stvarnim stanjem. */
function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [skin, setSkinState] = useState<TapizSkinId>(readStoredSkin);

  const setSkin = useCallback((next: TapizSkinId) => {
    localStorage.setItem(SKIN_STORAGE_KEY, next);
    setSkinState(next);
  }, []);

  /* Kao u tapiz-reactjs-ui: View Transition crossfade (220ms, globals.css) menja temu glatko,
     a `theme-switching` gasi per-element tranzicije iz @tapizlabs/ui da ne bi "pola svetlo /
     pola tamno" lagovalo. */
  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const next: Theme = root.classList.contains("dark") ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    root.classList.add("theme-switching");

    const apply = () => {
      flushSync(() => {
        applyTheme(next);
        window.dispatchEvent(new Event(CHANGE_EVENT));
      });
    };

    const cleanup = () => root.classList.remove("theme-switching");
    const doc = document as VTDocument;
    if (doc.startViewTransition) {
      const vt = doc.startViewTransition(apply);
      // I na skip/abort tranzicije mora cleanup, inače tranzicije ostaju ugašene.
      vt.finished.then(cleanup, cleanup);
    } else {
      apply();
      requestAnimationFrame(() => requestAnimationFrame(cleanup));
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, skin, setSkin }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme mora biti unutar ThemeProvider-a");
  return ctx;
}
