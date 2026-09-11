"use client";

import dynamic from "next/dynamic";
import { BarChart, Skeleton } from "@tapizlabs/ui";
import type { BoardColumnWithStories, ProjectMemberDto } from "@/domain/types";
import { useI18n } from "@/i18n/I18nProvider";
import { SidePanel } from "@/components/layout/SidePanel";

const BoardInsightsLazy = dynamic(
  () => import("./BoardInsights").then((mod) => mod.BoardInsights),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> },
);

interface BoardInsightsPanelProps {
  open: boolean;
  columns: BoardColumnWithStories[];
  members: ProjectMemberDto[];
  onClose: () => void;
}

/** Статистика тима у side panel-у (kao i kalendar) — chartovi se učitavaju lenjo. */
export function BoardInsightsPanel({ open, columns, members, onClose }: BoardInsightsPanelProps) {
  const { dict } = useI18n();
  return (
    <SidePanel
      open={open}
      title={dict.board.insightsTitle}
      icon={<BarChart size={18} />}
      width="md"
      onClose={onClose}
    >
      {open && <BoardInsightsLazy columns={columns} members={members} stacked />}
    </SidePanel>
  );
}
