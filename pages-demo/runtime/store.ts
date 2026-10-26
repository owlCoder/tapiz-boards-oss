import { useSyncExternalStore } from "react";
import { createSeed } from "./seed";
import { STORAGE_KEY, validateState, type LocalState } from "./model";

let state: LocalState | null = null;
let warning = "";
let revision = 0;
const listeners = new Set<() => void>();
export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const notify = () => {
  revision++;
  listeners.forEach((fn) => fn());
};
export const useRevision = () =>
  useSyncExternalStore(
    subscribe,
    () => revision,
    () => 0,
  );
export const storageWarning = () => warning;
export function getState(): LocalState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? validateState(JSON.parse(raw)) : createSeed();
    if (!raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    state = createSeed();
    warning =
      "Sačuvani podaci ili browser skladište nisu dostupni. Postojeći zapis nije prepisan. Izvezite podatke ili resetujte demo.";
  }
  return state;
}
export function replaceState(next: LocalState) {
  const validated = validateState(next);
  // Persist before announcing success. A full/disabled storage never silently loses edits.
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
  } catch {
    throw new Error(
      "Nema prostora ili pristupa localStorage. Izvezite podatke pre zatvaranja stranice.",
    );
  }
  state = validated;
  warning = "";
  notify();
}
export function transaction<T>(update: (draft: LocalState) => T): T {
  const draft = structuredClone(getState());
  const result = update(draft);
  replaceState(draft);
  return result;
}
export const resetDemo = () => replaceState(createSeed());
export function startStorageSync() {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    try {
      state = event.newValue
        ? validateState(JSON.parse(event.newValue))
        : createSeed();
      warning = "";
      notify();
    } catch {
      warning = "Promena podataka iz druge kartice nije ispravna.";
      notify();
    }
  });
}
