import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { projectsService } from "@/application/projects.service";
import { inviteCodeSchema } from "@/domain/validation/project.schema";
import { getDict } from "@/i18n/server";

/** Project invite link: /join/TB-X7K2M9 — joins and redirects to the board. */
export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const session = await auth();
  const { code } = await params;
  if (!session?.user?.id) redirect(`/login?callbackUrl=/join/${encodeURIComponent(code)}`);

  const dict = await getDict();
  const parsed = inviteCodeSchema.safeParse(code);
  let error: string | null = null;
  let projectId: string | null = null;

  if (!parsed.success) {
    error = dict.teams.inviteInvalid;
  } else {
    const result = await projectsService.joinByInviteCode(parsed.data, session.user.id);
    if (!result.ok) {
      error = result.error;
    } else {
      projectId = result.data.id;
    }
  }
  // redirect() throws — deliberately outside try/catch so the DomainError branch doesn't swallow it.
  if (projectId) redirect(`/projects/${projectId}/board`);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-display text-xl font-bold text-txt-1">{dict.teams.inviteJoinTitle}</h1>
      <p className="mt-3 text-sm text-txt-3">{error}</p>
      <Link
        href="/"
        className="mt-6 inline-block border border-border bg-ink-200 px-4 py-2 text-sm font-medium text-txt-2 no-underline transition-colors hover:border-primary-300 hover:text-primary-300"
      >
        {dict.common.backToHome}
      </Link>
    </div>
  );
}
