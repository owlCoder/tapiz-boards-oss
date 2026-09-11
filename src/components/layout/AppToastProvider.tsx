"use client";

import { ToastProvider } from "@tapizlabs/ui";
import type { ReactNode } from "react";

export function AppToastProvider({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
