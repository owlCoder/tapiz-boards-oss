"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export function LandingButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const variantClass = variant === "primary" || variant === "secondary"
    ? `btn-${variant} inline-flex items-center justify-center px-5 py-2.5 text-sm transition-all duration-150 cursor-pointer`
    : `lp-btn lp-btn-${variant}`;
  const classes = `${variantClass} ${className}`.trim();

  if (href.startsWith("#")) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
