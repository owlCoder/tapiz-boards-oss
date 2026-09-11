export type ProjectEventType =
  | "story_created"
  | "story_moved"
  | "story_updated"
  | "story_deleted"
  | "comment_added"
  | "task_done"
  | "sprint_started"
  | "sprint_completed"
  | "member_added"
  | "member_removed"
  | "repo_linked";

/** Event in a project's activity log (activity calendar). */
export interface ProjectEventDto {
  id: string;
  type: ProjectEventType;
  actorName: string;
  storyId: string | null;
  detail: string;
  /** HH:mm within the selected day. */
  time: string;
}

/** Day with an event count — markers in the mini calendar. */
export interface ActivityDay {
  day: string;
  count: number;
}
