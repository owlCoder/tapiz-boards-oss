import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { usersService } from "@/application/users.service";
import { AppShellLayout } from "@/components/layout/AppShellLayout";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const profile = await usersService.getById(session.user.id);
  return (
    <AppShellLayout
      user={{
        name: profile ? `${profile.firstName} ${profile.lastName}` : session.user.name ?? "",
        firstName: profile?.firstName ?? "",
        lastName: profile?.lastName ?? "",
        role: session.user.role,
        email: profile?.email ?? session.user.email ?? undefined,
      }}
    >
      {children}
    </AppShellLayout>
  );
}
