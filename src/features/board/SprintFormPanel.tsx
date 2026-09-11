"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Check,
  CheckSquare,
  FieldHint,
  FieldLabel,
  FormError,
  Input,
  Textarea,
  X,
} from "@tapizlabs/ui";
import { createSprintAction } from "@/lib/actions/sprints.actions";
import { useI18n } from "@/i18n/I18nProvider";
import { SidePanel } from "@/components/layout/SidePanel";

interface SprintFormPanelProps {
  isOpen: boolean;
  projectId: string;
  /** Predlog imena, npr. "Sprint 3" na osnovu broja postojećih. */
  suggestedName: string;
  onClose: () => void;
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Novi sprint — bočni panel sa desne strane. */
export function SprintFormPanel({ isOpen, projectId, suggestedName, onClose }: SprintFormPanelProps) {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.sprints;
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset pri otvaranju tokom rendera (React šablon umesto setState u efektu).
  const [prevOpen, setPrevOpen] = useState(false);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 14);
      setName(suggestedName);
      setGoal("");
      setStartDate(toDateInput(start));
      setEndDate(toDateInput(end));
      setError(null);
    }
  }

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const result = await createSprintAction(projectId, { name, goal, startDate, endDate });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
    router.refresh();
  };

  return (
    <SidePanel
      open={isOpen}
      title={t.newSprint}
      subtitle={t.goalPlaceholder}
      icon={<CheckSquare size={18} />}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button
            fullWidth
            icon={<Check size={14} />}
            loading={loading}
            disabled={!name.trim() || !startDate || !endDate}
            onClick={() => void handleSubmit()}
          >
            {t.createSprint}
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
        <div>
          <FieldLabel htmlFor="sp-name">{t.nameLabel}</FieldLabel>
          <Input id="sp-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <FieldLabel htmlFor="sp-goal">{t.goalLabel}</FieldLabel>
          <Textarea
            id="sp-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={3}
            placeholder={t.goalPlaceholder}
          />
          <FieldHint>{dict.common.optional}</FieldHint>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="sp-start">{t.startLabel}</FieldLabel>
            <Input
              id="sp-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="sp-end">{t.endLabel}</FieldLabel>
            <Input
              id="sp-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
        <FormError message={error} />
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </SidePanel>
  );
}
