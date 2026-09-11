import { auth } from "@/lib/auth";
import { projectsService } from "@/application/projects.service";
import { usersService } from "@/application/users.service";
import { AppShellLayout } from "@/components/layout/AppShellLayout";
import { LandingPage } from "@/features/landing/LandingPage";
import { Dashboard } from "@/features/dashboard/Dashboard";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) return <LandingPage />;

  const [profile, projects] = await Promise.all([
    usersService.getById(session.user.id),
    projectsService.listForUser(session.user.id),
  ]);
  const user = {
    name: profile ? `${profile.firstName} ${profile.lastName}` : session.user.name ?? "",
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    role: session.user.role,
    email: profile?.email ?? session.user.email ?? undefined,
  };

  return (
    <AppShellLayout user={user}>
      <Dashboard firstName={user.firstName} projects={projects} currentUserId={session.user.id} />
    </AppShellLayout>
  );
}
