"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "@tapizlabs/ui";
import { useI18n } from "@/i18n/I18nProvider";

/* Portovano iz tapiz-reactjs-ui landing footer-a (BackToTop). */
export function BackToTop() {
  const { dict } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label={dict.common.backToTop}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`tapiz-back-to-top ${visible ? "is-visible" : ""}`}
    >
      <span className="grid place-items-center">
        <ArrowRight size={14} />
      </span>
    </button>
  );
}
