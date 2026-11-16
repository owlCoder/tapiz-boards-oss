import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/guards";
import { projectsService } from "@/application/projects.service";
import { usersService } from "@/application/users.service";
import { AdminUsersView } from "@/features/admin/AdminUsersView";

export default async function AdminUsersPage() {
  const { user } = await requirePageSession();
  if (user.role !== "admin") notFound();
  const [users, projects] = await Promise.all([usersService.listAll(), projectsService.listAll()]);
  return <AdminUsersView users={users} projects={projects} currentUserId={user.id} />;
}
