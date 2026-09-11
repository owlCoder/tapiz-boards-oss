import { boardService } from "@/application/board.service";
import { sprintsService } from "@/application/sprints.service";
import { projectsService } from "@/application/projects.service";
import { requireProjectPageAccess } from "@/lib/team-access";
import { BacklogView } from "@/features/board/BacklogView";

export default async function ProjectBacklogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, project, canManage } = await requireProjectPageAccess(id);
  const [stories, columns, members, sprints] = await Promise.all([
    boardService.getBacklog(id),
    boardService.getColumns(id),
    projectsService.members(id),
    sprintsService.listByProject(id),
  ]);
  return (
    <BacklogView
      project={{ ...project, memberCount: members.length }}
      stories={stories}
      columns={columns}
      members={members}
      sprints={sprints}
      currentUser={user}
      canManage={canManage}
    />
  );
}
