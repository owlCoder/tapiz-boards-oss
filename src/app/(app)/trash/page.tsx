import { requireUser } from "@/lib/guards";
import { projectsService } from "@/application/projects.service";
import { TrashView } from "@/features/projects/TrashView";

export default async function TrashPage() {
  const user = await requireUser();
  const projects = await projectsService.listTrashForUser(user.id);
  return <TrashView projects={projects} />;
}
