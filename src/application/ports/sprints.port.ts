import type { RetroCategory, SprintDto, SprintRetroItemDto, SprintStatus } from "@/domain/types";

export interface SprintsRepo {
  listByProject(projectId: string): Promise<SprintDto[]>;
  findById(id: string): Promise<SprintDto | null>;
  findActiveByProject(projectId: string): Promise<SprintDto | null>;
  create(input: {
    projectId: string;
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
  }): Promise<void>;
  setStatus(id: string, status: SprintStatus): Promise<void>;
  remove(id: string): Promise<void>;
  retroItems(sprintId: string): Promise<SprintRetroItemDto[]>;
  retroItemById(id: string): Promise<SprintRetroItemDto | null>;
  addRetroItem(
    sprintId: string,
    authorId: string,
    category: RetroCategory,
    body: string,
  ): Promise<void>;
  removeRetroItem(id: string): Promise<void>;
}
