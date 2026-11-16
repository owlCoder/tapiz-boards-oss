import type {
  ProjectExportData,
  ProjectExportStory,
  ProjectExportSprint,
  ProjectExportTask,
  ProjectExportComment,
  ProjectExportRetrospective,
} from "../types/project-export.types";

export interface ReportStory {
  story: ProjectExportStory;
  tasks: ProjectExportTask[];
  comments: ProjectExportComment[];
  done: boolean;
  columnName: string;
}

export interface ReportTotals {
  stories: number;
  done: number;
  storyPoints: number;
  donePoints: number;
  estimatedHours: number;
  checklistItems: number;
  checklistDone: number;
  comments: number;
}

export interface ReportGroup {
  sprint: ProjectExportSprint | null;
  stories: ReportStory[];
  retrospectives: ProjectExportRetrospective[];
  totals: ReportTotals;
}

export interface ProjectReport {
  groups: ReportGroup[];
  backlog: ReportGroup;
  totals: ReportTotals & {
    sprints: number;
    completedSprints: number;
    members: number;
    activities: number;
    retrospectives: number;
  };
}

/** The report always derives its metrics from the exported *current* story state.
 * Sprint snapshots can be stale, so never rely on sprint.storyCount/totalPoints.
 */
export function buildProjectReport(data: ProjectExportData): ProjectReport {
  const doneColumn =
    data.columns.find((column) => column.isDone) ??
    [...data.columns].sort((a, b) => b.position - a.position)[0];
  const doneId = doneColumn?.id ?? null;
  const columnNames = new Map(data.columns.map((column) => [column.id, column.name]));

  const tasksByStory = new Map<string, ProjectExportTask[]>();
  for (const task of data.tasks) {
    const items = tasksByStory.get(task.storyId) ?? [];
    items.push(task);
    tasksByStory.set(task.storyId, items);
  }
  for (const tasks of tasksByStory.values()) {
    tasks.sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  }

  const commentsByStory = new Map<string, ProjectExportComment[]>();
  for (const comment of data.comments) {
    const items = commentsByStory.get(comment.storyId) ?? [];
    items.push(comment);
    commentsByStory.set(comment.storyId, items);
  }
  for (const comments of commentsByStory.values()) {
    comments.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  const reportStories = data.stories.map((story): ReportStory => ({
    story,
    tasks: tasksByStory.get(story.id) ?? [],
    comments: commentsByStory.get(story.id) ?? [],
    done: doneId !== null && story.columnId === doneId,
    columnName: story.columnId === null ? "" : (columnNames.get(story.columnId) ?? story.columnName ?? ""),
  }));
  const storiesBySprint = new Map<string, ReportStory[]>();
  const unplanned: ReportStory[] = [];
  for (const item of reportStories) {
    if (item.story.sprintId === null) {
      unplanned.push(item);
    } else {
      const list = storiesBySprint.get(item.story.sprintId) ?? [];
      list.push(item);
      storiesBySprint.set(item.story.sprintId, list);
    }
  }

  const sortedStories = (stories: ReportStory[]) =>
    [...stories].sort((a, b) =>
      a.story.position - b.story.position ||
      a.story.createdAt.localeCompare(b.story.createdAt) ||
      a.story.id.localeCompare(b.story.id),
    );

  const totals = (stories: ReportStory[]): ReportTotals =>
    stories.reduce<ReportTotals>((sum, item) => ({
      stories: sum.stories + 1,
      done: sum.done + Number(item.done),
      storyPoints: sum.storyPoints + (item.story.storyPoints ?? 0),
      donePoints: sum.donePoints + (item.done ? (item.story.storyPoints ?? 0) : 0),
      estimatedHours: sum.estimatedHours + (item.story.estimatedHours ?? 0),
      checklistItems: sum.checklistItems + item.tasks.length,
      checklistDone: sum.checklistDone + item.tasks.filter((task) => task.done).length,
      comments: sum.comments + item.comments.length,
    }), {
      stories: 0,
      done: 0,
      storyPoints: 0,
      donePoints: 0,
      estimatedHours: 0,
      checklistItems: 0,
      checklistDone: 0,
      comments: 0,
    });

  const groups: ReportGroup[] = [...data.sprints]
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id))
    .map((sprint) => {
      const stories = sortedStories(storiesBySprint.get(sprint.id) ?? []);
      return {
        sprint,
        stories,
        retrospectives: data.retrospectives
          .filter((item) => item.sprintId === sprint.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        totals: totals(stories),
      };
    });

  const backlogStories = sortedStories(unplanned);
  const backlog: ReportGroup = {
    sprint: null,
    stories: backlogStories,
    retrospectives: [],
    totals: totals(backlogStories),
  };

  return {
    groups,
    backlog,
    totals: {
      ...totals(reportStories),
      sprints: groups.length,
      completedSprints: groups.filter((group) => group.sprint?.status === "completed").length,
      members: data.members.length,
      activities: data.activities.length,
      retrospectives: data.retrospectives.length,
    },
  };
}
