import type { Locale } from "../config";
import { sr, type Dict } from "./sr";
import { srCyrl } from "./sr-Cyrl";
import { en } from "./en";
import { fr } from "./fr";
import { hu } from "./hu";

export type { Dict };

export const DICTIONARIES: Record<Locale, Dict> = {
  sr,
  "sr-Cyrl": srCyrl,
  en,
  fr,
  hu,
};
