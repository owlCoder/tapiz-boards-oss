import { requireAdmin } from "@/lib/guards";
import { usersService } from "@/application/users.service";
import { AdminUsersView } from "@/features/admin/AdminUsersView";

export default async function AdminUsersPage() {
  const user = await requireAdmin();
  const users = await usersService.listAll();
  return <AdminUsersView users={users} currentUserId={user.id} />;
}
