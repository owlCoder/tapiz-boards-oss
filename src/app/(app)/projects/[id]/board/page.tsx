import { boardService } from "@/application/board.service";
import { sprintsService } from "@/application/sprints.service";
import { projectsService } from "@/application/projects.service";
import { requireProjectPageAccess } from "@/lib/team-access";
import { BoardView } from "@/features/board/BoardView";

export default async function ProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, project, canManage } = await requireProjectPageAccess(id);
  const [columns, members, sprints] = await Promise.all([
    boardService.getBoard(id),
    projectsService.members(id),
    sprintsService.listByProject(id),
  ]);
  return (
    <BoardView
      project={{ ...project, memberCount: members.length }}
      columns={columns}
      members={members}
      sprints={sprints}
      currentUser={user}
      canManage={canManage}
    />
  );
}
