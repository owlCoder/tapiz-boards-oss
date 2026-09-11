import { boardService } from "@/application/board.service";
import { sprintsService } from "@/application/sprints.service";
import { projectsService } from "@/application/projects.service";
import { requireProjectPageAccess } from "@/lib/team-access";
import { SprintsView } from "@/features/board/SprintsView";

export default async function ProjectSprintsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, project, canManage } = await requireProjectPageAccess(id);
  const sprintsPromise = sprintsService.listByProject(id);
  const [sprints, columns, members, storiesBySprint] = await Promise.all([
    sprintsPromise,
    boardService.getColumns(id),
    projectsService.members(id),
    sprintsPromise.then((s) => sprintsService.getStoriesBySprints(s.map((sprint) => sprint.id))),
  ]);

  return (
    <SprintsView
      project={{ ...project, memberCount: members.length }}
      sprints={sprints}
      storiesBySprint={storiesBySprint}
      columns={columns}
      members={members}
      currentUser={user}
      canManage={canManage}
    />
  );
}
