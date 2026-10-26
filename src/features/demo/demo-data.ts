/**
 * Browser-only teaching sandbox. No API calls, cookies, authentication, or database.
 * IDs and dates in the starter fixture are stable to avoid SSR hydration mismatches.
 */
export type DemoPriority = "low" | "medium" | "high";
export type DemoSprintStatus = "planned" | "active" | "completed";

export interface DemoTask {
  id: string;
  title: string;
  done: boolean;
}
export interface DemoComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}
export interface DemoStory {
  id: string;
  title: string;
  description: string;
  columnId: string;
  sprintId: string;
  assignee: string;
  priority: DemoPriority;
  points: number;
  dueDate: string;
  order: number;
  tasks: DemoTask[];
  comments: DemoComment[];
}
export interface DemoColumn {
  id: string;
  name: string;
  done: boolean;
  wipLimit: number;
}
export interface DemoSprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: DemoSprintStatus;
  retro: { id: string; category: "good" | "bad"; text: string }[];
}
export interface DemoProject {
  id: string;
  name: string;
  description: string;
  archived: boolean;
  columns: DemoColumn[];
  members: string[];
  sprints: DemoSprint[];
  stories: DemoStory[];
}
export interface DemoState {
  version: 1;
  projects: DemoProject[];
  activity: { id: string; text: string; time: string }[];
}
export const DEMO_STORAGE_KEY = "tapiz-boards-browser-demo-v1";
export const uid = () => crypto.randomUUID();
export const makeColumns = (): DemoColumn[] => [
  { id: uid(), name: "TO DO", done: false, wipLimit: 0 },
  { id: uid(), name: "IN PROGRESS", done: false, wipLimit: 3 },
  { id: uid(), name: "DONE", done: true, wipLimit: 0 },
];

const col = ["todo", "doing", "done"] as const;
const seedStory = (
  id: string, title: string, description: string, columnId: string,
  sprintId: string, assignee: string, priority: DemoPriority, points: number,
  order: number, dueDate = ""
): DemoStory => ({
  id, title, description, columnId, sprintId, assignee, priority, points, order, dueDate,
  tasks: [], comments: [],
});

export const STARTER_DEMO: DemoState = {
  version: 1,
  projects: [{
    id: "sample-project",
    name: "Studentski projekat",
    description: "Demo planiranje rada na veb aplikaciji",
    archived: false,
    columns: [
      { id: col[0], name: "TO DO", done: false, wipLimit: 0 },
      { id: col[1], name: "IN PROGRESS", done: false, wipLimit: 3 },
      { id: col[2], name: "DONE", done: true, wipLimit: 0 },
    ],
    members: ["Profesor", "Ana", "Marko"],
    sprints: [{
      id: "sprint-1", name: "Sprint 1", goal: "Osnovni korisnički tokovi",
      startDate: "2026-10-26", endDate: "2026-11-09", status: "active", retro: [],
    }, {
      id: "sprint-2", name: "Sprint 2", goal: "Završno testiranje",
      startDate: "2026-11-10", endDate: "2026-11-24", status: "planned", retro: [],
    }],
    stories: [
      {
        ...seedStory("story-1", "Napraviti početnu stranicu", "Hero sekcija i navigacija", "done", "sprint-1", "Ana", "high", 5, 0),
        tasks: [{ id: "task-1", title: "Navigacija", done: true }, { id: "task-2", title: "Responsive stilovi", done: true }],
      },
      seedStory("story-2", "Implementirati pretragu", "Filtriranje rezultata po ključnoj reči", "doing", "sprint-1", "Marko", "high", 8, 0),
      seedStory("story-3", "Dodati validaciju forme", "Prikazati jasne poruke za pogrešan unos", "todo", "sprint-1", "Ana", "medium", 3, 0),
      seedStory("story-4", "Pisati unit testove", "Testirati kritične komponente", "todo", "sprint-1", "Profesor", "medium", 5, 1),
      seedStory("story-5", "Uraditi pristupačnost", "Tastatura, kontrast i semantika", "todo", "", "", "low", 3, 2),
      seedStory("story-6", "Pripremiti dokumentaciju", "Uputstvo za korisnike", "todo", "sprint-2", "Marko", "low", 2, 3),
    ],
  }],
  activity: [{ id: "initial-event", text: "Demo podaci su spremni za radionicu.", time: "2026-10-26" }],
};

/** Validate the imported JSON shape before using it in the UI. */
export function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<DemoState>;
  if (v.version !== 1 || !Array.isArray(v.projects) || !Array.isArray(v.activity)) return false;
  return v.projects.every((project) =>
    project && typeof project.id === "string" &&
    typeof project.name === "string" && typeof project.archived === "boolean" &&
    Array.isArray(project.columns) && project.columns.every((c) =>
      c && typeof c.id === "string" && typeof c.name === "string" && typeof c.done === "boolean"
    ) &&
    Array.isArray(project.members) && project.members.every((m) => typeof m === "string") &&
    Array.isArray(project.sprints) && project.sprints.every((s) =>
      s && typeof s.id === "string" && typeof s.name === "string" &&
      ["planned", "active", "completed"].includes(s.status) && Array.isArray(s.retro)
    ) &&
    Array.isArray(project.stories) && project.stories.every((s) =>
      s && typeof s.id === "string" && typeof s.title === "string" &&
      typeof s.columnId === "string" && typeof s.sprintId === "string" &&
      Array.isArray(s.tasks) && Array.isArray(s.comments)
    )
  );
}

export function blankStory(project: DemoProject, activeSprintId: string): DemoStory {
  return {
    id: uid(), title: "", description: "", columnId: project.columns[0]?.id ?? "",
    sprintId: activeSprintId, assignee: "", priority: "medium", points: 0,
    dueDate: "", order: project.stories.length, tasks: [], comments: [],
  };
}

export function formattedDate(date: string): string {
  if (!date) return "—";
  return `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}.`;
}
