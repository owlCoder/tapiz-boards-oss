/** Whole hours a member can spend in one week. 168 = 24 × 7. */
export const MAX_WEEKLY_CAPACITY_HOURS = 168;

/** Whole hours allowed on a single story estimate. */
export const MAX_ESTIMATED_HOURS = 999;

const DAY_MS = 86_400_000;

export interface CapacityMemberInput {
  userId: string;
  firstName: string;
  lastName: string;
  weeklyCapacityHours: number | null;
}

export interface CapacityStoryInput {
  id: string;
  title: string;
  assigneeId: string | null;
  estimatedHours: number | null;
  columnId: string | null;
}

export interface MemberLoad {
  userId: string;
  name: string;
  weeklyCapacityHours: number | null;
  /** Null when the member has no weekly capacity. */
  sprintCapacityHours: number | null;
  assignedHours: number;
  unestimatedCount: number;
  /** Null when capacity is unset. Negative when the member is over capacity. */
  freeHours: number | null;
  overloaded: boolean;
}

export interface AssignmentSuggestion {
  storyId: string;
  storyTitle: string;
  estimatedHours: number;
  userId: string;
  memberName: string;
  freeHoursAfter: number;
  /** Hours the recipient will have assigned after this step. */
  assignedHoursAfter: number;
  /** Set when the story is taken from someone who is already over capacity. */
  fromUserId: string | null;
  fromName: string | null;
  fromAssignedHoursAfter: number | null;
}

export interface UnplacedStory {
  storyId: string;
  storyTitle: string;
  estimatedHours: number | null;
  reason: "no_estimate" | "no_capacity";
}

export interface OverloadedMember {
  userId: string;
  memberName: string;
  overHours: number;
}

export interface SprintAssignmentPlan {
  suggestions: AssignmentSuggestion[];
  unplaced: UnplacedStory[];
  /** Nobody has weekly hours, so free time cannot be calculated. */
  missingCapacity: boolean;
  /** People who stay over capacity after every story that fits has been moved. */
  stillOverloaded: OverloadedMember[];
}

/** Inclusive calendar days. Invalid or reversed ranges fall back to one week. */
export function inclusiveSprintDays(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 7;
  return Math.floor((end - start) / DAY_MS) + 1;
}

export function sprintCapacityHours(
  weeklyHours: number,
  startDate: string,
  endDate: string,
): number {
  return weeklyHours * (inclusiveSprintDays(startDate, endDate) / 7);
}

export function formatHours(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10;
  if (Object.is(rounded, -0) || rounded === 0) return "0";
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * Occupancy is the sum of estimates on stories assigned in the sprint, including
 * work already in Done — that time is already spent from the sprint budget.
 * Stories without an estimate are counted, but they do not add hours.
 */
export function memberLoads(
  members: CapacityMemberInput[],
  stories: CapacityStoryInput[],
  sprint: { startDate: string; endDate: string },
): MemberLoad[] {
  return members
    .map((member) => {
      const mine = stories.filter((story) => story.assigneeId === member.userId);
      const assignedHours = mine.reduce((sum, story) => sum + (story.estimatedHours ?? 0), 0);
      const unestimatedCount = mine.filter((story) => story.estimatedHours === null).length;
      const sprintHours =
        member.weeklyCapacityHours === null
          ? null
          : sprintCapacityHours(member.weeklyCapacityHours, sprint.startDate, sprint.endDate);
      const freeHours = sprintHours === null ? null : sprintHours - assignedHours;
      return {
        userId: member.userId,
        name: `${member.firstName} ${member.lastName}`,
        weeklyCapacityHours: member.weeklyCapacityHours,
        sprintCapacityHours: sprintHours,
        assignedHours,
        unestimatedCount,
        freeHours,
        overloaded: sprintHours !== null && assignedHours > sprintHours,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name) || a.userId.localeCompare(b.userId));
}

const HOURS_EPS = 1e-6;

interface CapacityBucket {
  userId: string;
  name: string;
  capacity: number;
  assigned: number;
}

function isDoneStory(story: CapacityStoryInput, doneColumnId: string | null): boolean {
  return doneColumnId !== null && story.columnId === doneColumnId;
}

function freeHoursOf(bucket: CapacityBucket): number {
  return bucket.capacity - bucket.assigned;
}

/**
 * Person who can take `hours` with the least spare time left afterwards.
 * That keeps the move off someone who is already full.
 */
function tightestRecipient(
  buckets: Map<string, CapacityBucket>,
  hours: number,
  exceptUserId: string | null,
): CapacityBucket | null {
  let best: CapacityBucket | null = null;
  let bestFree = Number.POSITIVE_INFINITY;
  for (const bucket of buckets.values()) {
    if (bucket.userId === exceptUserId) continue;
    const free = freeHoursOf(bucket);
    if (free + HOURS_EPS < hours) continue;
    if (free < bestFree - HOURS_EPS || (Math.abs(free - bestFree) <= HOURS_EPS && best !== null && bucket.userId < best.userId)) {
      best = bucket;
      bestFree = free;
    }
  }
  return best;
}

/** Prefer a story that covers the extra hours without dropping the sender below them. */
function prefersMove(
  best: { estimatedHours: number; id: string } | null,
  bestOvershoot: boolean,
  hours: number,
  overshoot: boolean,
  storyId: string,
): boolean {
  if (!best) return true;
  if (bestOvershoot !== overshoot) return !overshoot;
  if (!overshoot) {
    if (hours > best.estimatedHours + HOURS_EPS) return true;
    if (hours < best.estimatedHours - HOURS_EPS) return false;
    return storyId < best.id;
  }
  if (hours < best.estimatedHours - HOURS_EPS) return true;
  if (hours > best.estimatedHours + HOURS_EPS) return false;
  return storyId < best.id;
}

/**
 * Two passes:
 * 1. Someone over their sprint hours gives a whole story to someone who can
 *    take it without going over. A 5 h story moves off a person who is 5 h
 *    over before a larger story that would push the sender under their hours.
 * 2. Stories that nobody owns yet fill the tightest remaining gap.
 * Finished stories stay put. Stories without an estimate stay unplaced.
 */
export function suggestSprintAssignments(
  loads: MemberLoad[],
  stories: CapacityStoryInput[],
  doneColumnId: string | null,
): SprintAssignmentPlan {
  const buckets = new Map<string, CapacityBucket>();
  for (const load of loads) {
    if (load.sprintCapacityHours === null) continue;
    buckets.set(load.userId, {
      userId: load.userId,
      name: load.name,
      capacity: load.sprintCapacityHours,
      assigned: load.assignedHours,
    });
  }

  const assigneeOf = new Map<string, string | null>();
  for (const story of stories) assigneeOf.set(story.id, story.assigneeId);

  const suggestions: AssignmentSuggestion[] = [];
  const unplaced: UnplacedStory[] = [];

  for (const story of stories) {
    if (story.estimatedHours !== null || isDoneStory(story, doneColumnId)) continue;
    const assignee = story.assigneeId;
    const onOverloadedMember = assignee !== null && (loads.find((load) => load.userId === assignee)?.overloaded ?? false);
    if (assignee !== null && !onOverloadedMember) continue;
    unplaced.push({
      storyId: story.id,
      storyTitle: story.title,
      estimatedHours: null,
      reason: "no_estimate",
    });
  }

  for (let guard = 0; guard < stories.length; guard += 1) {
    let bestStory: (CapacityStoryInput & { estimatedHours: number }) | null = null;
    let bestFrom: CapacityBucket | null = null;
    let bestTo: CapacityBucket | null = null;
    let bestOvershoot = true;

    for (const from of buckets.values()) {
      const excess = from.assigned - from.capacity;
      if (excess <= HOURS_EPS) continue;
      for (const story of stories) {
        if (assigneeOf.get(story.id) !== from.userId || story.estimatedHours === null || story.estimatedHours <= 0) continue;
        if (isDoneStory(story, doneColumnId)) continue;
        const recipient = tightestRecipient(buckets, story.estimatedHours, from.userId);
        if (!recipient) continue;
        const overshoot = story.estimatedHours > excess + HOURS_EPS;
        if (!prefersMove(bestStory, bestOvershoot, story.estimatedHours, overshoot, story.id)) continue;
        bestStory = story as CapacityStoryInput & { estimatedHours: number };
        bestFrom = from;
        bestTo = recipient;
        bestOvershoot = overshoot;
      }
    }

    if (!bestStory || !bestFrom || !bestTo) break;
    bestFrom.assigned -= bestStory.estimatedHours;
    bestTo.assigned += bestStory.estimatedHours;
    assigneeOf.set(bestStory.id, bestTo.userId);
    suggestions.push({
      storyId: bestStory.id,
      storyTitle: bestStory.title,
      estimatedHours: bestStory.estimatedHours,
      userId: bestTo.userId,
      memberName: bestTo.name,
      freeHoursAfter: freeHoursOf(bestTo),
      assignedHoursAfter: bestTo.assigned,
      fromUserId: bestFrom.userId,
      fromName: bestFrom.name,
      fromAssignedHoursAfter: bestFrom.assigned,
    });
  }

  const open = stories.filter(
    (story) => (assigneeOf.get(story.id) ?? null) === null && !isDoneStory(story, doneColumnId),
  );
  const estimated = open
    .filter((story): story is CapacityStoryInput & { estimatedHours: number } => story.estimatedHours !== null)
    .sort((a, b) => b.estimatedHours - a.estimatedHours || a.id.localeCompare(b.id));

  for (const story of estimated) {
    const recipient = tightestRecipient(buckets, story.estimatedHours, null);
    if (!recipient) {
      unplaced.push({
        storyId: story.id,
        storyTitle: story.title,
        estimatedHours: story.estimatedHours,
        reason: "no_capacity",
      });
      continue;
    }
    recipient.assigned += story.estimatedHours;
    assigneeOf.set(story.id, recipient.userId);
    suggestions.push({
      storyId: story.id,
      storyTitle: story.title,
      estimatedHours: story.estimatedHours,
      userId: recipient.userId,
      memberName: recipient.name,
      freeHoursAfter: freeHoursOf(recipient),
      assignedHoursAfter: recipient.assigned,
      fromUserId: null,
      fromName: null,
      fromAssignedHoursAfter: null,
    });
  }

  const stillOverloaded: OverloadedMember[] = [];
  for (const bucket of buckets.values()) {
    const overHours = bucket.assigned - bucket.capacity;
    if (overHours <= HOURS_EPS) continue;
    stillOverloaded.push({ userId: bucket.userId, memberName: bucket.name, overHours });
    for (const story of stories) {
      if (assigneeOf.get(story.id) !== bucket.userId || story.estimatedHours === null || story.estimatedHours <= 0) continue;
      if (isDoneStory(story, doneColumnId)) continue;
      unplaced.push({
        storyId: story.id,
        storyTitle: story.title,
        estimatedHours: story.estimatedHours,
        reason: "no_capacity",
      });
    }
  }
  stillOverloaded.sort((a, b) => b.overHours - a.overHours || a.memberName.localeCompare(b.memberName));

  return {
    suggestions,
    unplaced,
    missingCapacity: buckets.size === 0 && loads.length > 0,
    stillOverloaded,
  };
}
