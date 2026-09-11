import { PublicLegalPage } from "@/components/layout/PublicLegalPage";
import { getDict } from "@/i18n/server";

export const dynamic = "force-static";

export default async function PrivacyPolicyPage() {
  const dict = await getDict();
  const t = dict.legal.privacy;

  return (
    <PublicLegalPage
      eyebrow={t.eyebrow}
      title={t.title}
      intro={t.intro}
      updated={dict.legal.updated}
      sections={t.sections}
    />
  );
}
