"use client";

import Link from "next/link";
import { EcosystemLogoMark } from "@/shared/components/ui/EcosystemLogoMark";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="lp-brand" aria-label="Tapiz Boards">
      <span className="lp-brand-mark" aria-hidden="true">
        <EcosystemLogoMark size={compact ? 21 : 24} variant="boards" tone="mono" />
      </span>
      {!compact && <span className="lp-brand-name">Tapiz Boards</span>}
    </Link>
  );
}
