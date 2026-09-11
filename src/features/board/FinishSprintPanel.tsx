"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Check,
  FieldLabel,
  FormError,
  InfoBanner,
  Select,
  X,
  useToast,
} from "@tapizlabs/ui";
import type { BoardColumnDto, SprintDto, StoryDto } from "@/domain/types";
import { doneColumnId } from "@/domain/services/board-insights";
import { finishSprintAction } from "@/lib/actions/sprints.actions";
import { useI18n } from "@/i18n/I18nProvider";
import { SidePanel } from "@/components/layout/SidePanel";

interface FinishSprintPanelProps {
  isOpen: boolean;
  projectId: string;
  sprint: SprintDto | null;
  stories: StoryDto[];
  columns: BoardColumnDto[];
  sprints: SprintDto[];
  onClose: () => void;
}

const BACKLOG = "__backlog__";
const NEXT_SPRINT = "__next__";

export function FinishSprintPanel({
  isOpen,
  projectId,
  sprint,
  stories,
  columns,
  sprints,
  onClose,
}: FinishSprintPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dict } = useI18n();
  const t = dict.sprints;
  const [destination, setDestination] = useState(BACKLOG);
  const [targetSprintId, setTargetSprintId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const targetSprints = sprints.filter(
    (candidate) =>
      sprint !== null &&
      candidate.id !== sprint.id &&
      candidate.status !== "completed",
  );
  const doneId = doneColumnId(columns);
  const unfinishedCount = stories.filter((story) => story.columnId !== doneId).length;
  const doneCount = stories.length - unfinishedCount;

  const [prevOpen, setPrevOpen] = useState(false);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setDestination(BACKLOG);
      setTargetSprintId(targetSprints[0]?.id ?? "");
      setError(null);
    }
  }

  const handleSubmit = async () => {
    if (!sprint) return;
    if (destination === NEXT_SPRINT && !targetSprintId) {
      setError(t.finishSelectSprintError);
      return;
    }

    setError(null);
    setLoading(true);
    const result = await finishSprintAction(projectId, sprint.id, {
      targetSprintId: destination === NEXT_SPRINT ? targetSprintId : null,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast(t.finishedToast, true);
    onClose();
    router.refresh();
  };

  return (
    <SidePanel
      open={isOpen && sprint !== null}
      title={t.finishPanelTitle}
      subtitle={sprint?.name}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button
            fullWidth
            icon={<Check size={14} />}
            loading={loading}
            disabled={destination === NEXT_SPRINT && targetSprints.length === 0}
            onClick={() => void handleSubmit()}
          >
            {t.finishConfirm}
          </Button>
          <Button variant="secondary" fullWidth icon={<X size={14} />} onClick={onClose}>
            {dict.common.cancel}
          </Button>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        className="space-y-4"
      >
        <InfoBanner text={t.finishPanelInfo} />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface-muted) px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-(--tapiz-text-muted)">
              {t.finishDoneCount}
            </p>
            <p className="mt-2 text-2xl font-semibold text-(--tapiz-text-primary)">{doneCount}</p>
          </div>
          <div className="rounded-lg border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface-muted) px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-(--tapiz-text-muted)">
              {t.finishUnfinishedCount}
            </p>
            <p className="mt-2 text-2xl font-semibold text-(--tapiz-text-primary)">{unfinishedCount}</p>
          </div>
        </div>

        {unfinishedCount > 0 ? (
          <>
            <FieldLabel htmlFor="finish-destination">{t.finishMoveLabel}</FieldLabel>
            <div id="finish-destination" className="space-y-2">
              <label className="flex items-start gap-3 rounded-lg border border-(--tapiz-border-subtle) px-3 py-3">
                <input
                  type="radio"
                  name="finish-destination"
                  value={BACKLOG}
                  checked={destination === BACKLOG}
                  onChange={(e) => setDestination(e.target.value)}
                />
                <span className="text-sm text-(--tapiz-text-primary)">{t.finishMoveToBacklog}</span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-(--tapiz-border-subtle) px-3 py-3">
                <input
                  type="radio"
                  name="finish-destination"
                  value={NEXT_SPRINT}
                  checked={destination === NEXT_SPRINT}
                  onChange={(e) => setDestination(e.target.value)}
                />
                <span className="text-sm text-(--tapiz-text-primary)">{t.finishMoveToSprint}</span>
              </label>
            </div>
            {destination === NEXT_SPRINT && (
              <div>
                <FieldLabel htmlFor="finish-target-sprint">{dict.board.sprintLabel}</FieldLabel>
                <Select
                  id="finish-target-sprint"
                  value={targetSprintId}
                  onChange={(e) => setTargetSprintId(e.target.value)}
                >
                  {targetSprints.length === 0 ? (
                    <option value="">{t.finishNoTargetSprint}</option>
                  ) : (
                    targetSprints.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.name}
                      </option>
                    ))
                  )}
                </Select>
              </div>
            )}
          </>
        ) : (
          <InfoBanner text={t.finishNoUnfinished} />
        )}

        <FormError message={error} />
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </SidePanel>
  );
}
