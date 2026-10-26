import { useI18n } from "@/i18n/I18nProvider";
function useDict() {
  return useI18n().dict;
}
export { useDict as getDict };
