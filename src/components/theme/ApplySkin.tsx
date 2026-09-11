"use client";

import { useApplySkin } from "./useApplySkin";

/**
 * Renderless client mounter for {@link useApplySkin}. Lets server components
 * (e.g. the auth layout) opt into the chosen skin without becoming client
 * components themselves. The app shell calls the hook directly and doesn't
 * need this.
 */
export function ApplySkin() {
  useApplySkin();
  return null;
}
