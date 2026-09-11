import { revalidatePath } from "next/cache";

/** Osvežava keširane server-rendered stranice tima nakon mutacije (web action ili mobile API ruta). */
export function revalidateBoard(teamId: string): void {
  revalidatePath(`/teams/${teamId}/board`);
  revalidatePath(`/teams/${teamId}/backlog`);
  revalidatePath(`/teams/${teamId}/sprints`);
}
