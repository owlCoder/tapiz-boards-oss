import { useSyncExternalStore } from "react";
import { notify } from "./store";
const subscribePath = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};
export const currentPath = () =>
  window.location.hash.slice(1).split("?")[0] || "/";
export function navigate(path: string) {
  window.location.hash = path;
}
const router = {
  push: navigate,
  replace: (path: string) => {
    history.replaceState(null, "", `#${path}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  },
  refresh: notify,
  back: () => history.back(),
  forward: () => history.forward(),
  prefetch: () => Promise.resolve(),
};
export const useRouter = () => router;
export const usePathname = () =>
  useSyncExternalStore(subscribePath, currentPath, () => "/");
