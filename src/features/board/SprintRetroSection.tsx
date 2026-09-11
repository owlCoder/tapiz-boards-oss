"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Check, Input, Plus, Spinner, Trash, X, useToast } from "@tapizlabs/ui";
import type { RetroCategory, SprintDto, SprintRetroItemDto } from "@/domain/types";
import type { SessionUser } from "@/lib/guards";
import {
  addSprintRetroItemAction,
  deleteSprintRetroItemAction,
  getSprintRetroAction,
} from "@/lib/actions/sprints.actions";
import { useI18n } from "@/i18n/I18nProvider";

interface SprintRetroSectionProps {
  projectId: string;
  sprint: SprintDto;
  currentUser: SessionUser;
  canModerate: boolean;
}

/** Retrospektiva završenog sprinta: šta je bilo dobro / šta treba popraviti. */
export function SprintRetroSection({
  projectId,
  sprint,
  currentUser,
  canModerate,
}: SprintRetroSectionProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dict } = useI18n();
  const t = dict.sprints;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SprintRetroItemDto[] | null>(null);
  const [drafts, setDrafts] = useState<Record<RetroCategory, string>>({ good: "", bad: "" });
  const [busyCategory, setBusyCategory] = useState<RetroCategory | null>(null);

  const load = async () => {
    const result = await getSprintRetroAction(projectId, sprint.id);
    if (result.ok) setItems(result.data);
    else showToast(result.error, false);
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && items === null) void load();
  };

  const add = async (category: RetroCategory) => {
    const body = drafts[category].trim();
    if (!body) return;
    setBusyCategory(category);
    const result = await addSprintRetroItemAction(projectId, sprint.id, { category, body });
    setBusyCategory(null);
    if (!result.ok) {
      showToast(result.error, false);
      return;
    }
    setDrafts((prev) => ({ ...prev, [category]: "" }));
    await load();
    router.refresh();
  };

  const remove = async (item: SprintRetroItemDto) => {
    const result = await deleteSprintRetroItemAction(projectId, item.id);
    if (!result.ok) {
      showToast(result.error, false);
      return;
    }
    await load();
    router.refresh();
  };

  const column = (category: RetroCategory) => {
    const list = (items ?? []).filter((item) => item.category === category);
    const good = category === "good";
    return (
      <div
        className="space-y-2 rounded-2xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface) p-3"
      >
        <h5 className="text-sm font-semibold text-(--tapiz-text-primary)">
          {good ? t.retroGood : t.retroBad}
        </h5>
        {items === null ? (
          <div className="flex justify-center py-2">
            <Spinner />
          </div>
        ) : list.length === 0 ? (
          <p className="text-sm text-(--tapiz-text-muted)">{t.retroEmpty}</p>
        ) : (
          <ul className="space-y-1.5">
            {list.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                <span aria-hidden className="mt-0.5 shrink-0">
                  {good ? (
                    <Check size={14} className="text-(--tapiz-success)" />
                  ) : (
                    <X size={14} className="text-(--tapiz-text-muted)" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="whitespace-pre-wrap">{item.body}</span>
                  <span className="ml-2 text-xs text-(--tapiz-text-muted)">
                    {item.authorName}
                  </span>
                </span>
                {(canModerate || item.authorId === currentUser.id) && (
                  <button
                    type="button"
                    onClick={() => void remove(item)}
                    title={dict.common.remove}
                    className="shrink-0 cursor-pointer border-none bg-transparent p-0.5 text-(--tapiz-text-muted) transition-colors hover:text-(--tapiz-danger)"
                  >
                    <Trash size={13} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 pt-1">
          <Input
            value={drafts[category]}
            onChange={(e) => setDrafts((prev) => ({ ...prev, [category]: e.target.value }))}
            placeholder={good ? t.retroPlaceholderGood : t.retroPlaceholderBad}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void add(category);
              }
            }}
          />
          {drafts[category].trim() && (
            <Button
              size="sm"
              type="button"
              icon={<Plus size={14} />}
              loading={busyCategory === category}
              onClick={() => void add(category)}
            >
              {dict.common.add}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 border-t border-(--tapiz-border-subtle) pt-3">
      <button
        type="button"
        onClick={toggle}
        className="flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 font-mono text-[11px] uppercase tracking-[0.16em] text-(--tapiz-text-muted) transition-colors hover:text-(--tapiz-text-primary)"
      >
        <span aria-hidden>{open ? "▾" : "▸"}</span>
        {t.retroTitle}
        {sprint.retroCount > 0 ? ` (${sprint.retroCount})` : ""}
      </button>
      {open && (
        <div className="grid gap-3 animate-in fade-in slide-in-from-top-1 duration-200 sm:grid-cols-2">
          {column("good")}
          {column("bad")}
        </div>
      )}
    </div>
  );
}
