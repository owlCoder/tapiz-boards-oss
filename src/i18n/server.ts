import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { DICTIONARIES, type Dict } from "./dictionaries";

/** Jezik iz cookie-ja (server komponente / server actions). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Rečnik za trenutni jezik (server komponente). */
export async function getDict(): Promise<Dict> {
  return DICTIONARIES[await getLocale()];
}
