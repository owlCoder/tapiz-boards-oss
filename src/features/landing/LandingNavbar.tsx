"use client";

import { Fragment } from "react";
import { ArrowRight, CheckSquare, LandingNavbarShell, Layers, Users } from "@tapizlabs/ui";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { Brand } from "./primitives/Brand";
import { LandingButton } from "./primitives/LandingButton";

export function LandingNavbar() {
  const { theme, toggleTheme } = useTheme();
  const { dict } = useI18n();
  const t = dict.landing.nav;

  const navItems = [
    { label: t.board, href: "#board", icon: <Layers size={15} /> },
    { label: t.features, href: "#features", icon: <CheckSquare size={15} /> },
    { label: t.teams, href: "#insights", icon: <Users size={15} /> },
  ];

  return (
    <LandingNavbarShell
      ariaNavLabel={t.ariaNav}
      brand={<Brand />}
      containerClassName="lp-container"
      closeMenuLabel={t.closeMenu}
      desktopActions={(
        <Fragment>
          <LandingButton href="/login" className="lp-nav-primary">
            {t.login}<ArrowRight size={14} />
          </LandingButton>
        </Fragment>
      )}
      desktopLanguageSwitcher={<LanguageSwitcher hideShortCode />}
      items={navItems}
      menuLabel={t.menu}
      mobileActions={(
        <Fragment>
          <LandingButton href="/login">{t.login}</LandingButton>
        </Fragment>
      )}
      mobileDialogLabel={t.menu}
      mobileLanguageSwitcher={<LanguageSwitcher hideShortCode />}
      mobileNavLabel={t.ariaMobileNav}
      onThemeToggle={toggleTheme}
      theme={theme}
      themeLabels={{
        dark: dict.common.darkTheme,
        light: dict.common.lightTheme,
      }}
    />
  );
}
