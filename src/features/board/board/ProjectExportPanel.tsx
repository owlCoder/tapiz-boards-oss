"use client";

import { useState } from "react";
import { Button, Download, FormError, Select } from "@tapizlabs/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { SidePanel } from "@/components/layout/SidePanel";
import { getProjectExportDataAction } from "@/lib/actions/project-export.actions";
import { downloadProjectExport, type ProjectExportFormat } from "./export/project-export";
import { REPORT_TEXT } from "@/features/board/report/report-text";

interface ProjectExportPanelProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
}

export function ProjectExportPanel({ open, projectId, onClose }: ProjectExportPanelProps) {
  const { dict, locale } = useI18n();
  const t = dict.board;
  const reportText = REPORT_TEXT[locale];
  const [format, setFormat] = useState<ProjectExportFormat | "pdf">("json");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportProject = async () => {
    if (format === "pdf") {
      window.location.assign("/reports/projects/" + encodeURIComponent(projectId) + "?print=1");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getProjectExportDataAction(projectId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      downloadProjectExport(result.data, format);
      onClose();
    } catch (exportError) {
      console.error("Project data export failed:", exportError);
      setError(t.exportFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={t.exportTitle}
      subtitle={t.exportDescription}
      icon={<Download size={18} />}
      footer={
        <div className="space-y-2">
          <FormError message={error} />
          <Button
            className="w-full justify-center"
            icon={<Download size={16} />}
            loading={loading}
            onClick={() => void exportProject()}
          >
            {format === "pdf" ? reportText.exportPdfSubmit : t.exportSubmit}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <label htmlFor="project-export-format" className="block text-sm font-semibold">
          {t.exportFormatLabel}
        </label>
        <Select
          id="project-export-format"
          value={format}
          onChange={(event) => {
            const value = event.target.value;
            setFormat(value === "csv" || value === "pdf" ? value : "json");
          }}
          disabled={loading}
        >
          <option value="json">{t.exportJsonOption}</option>
          <option value="csv">{t.exportCsvOption}</option>
          <option value="pdf">{reportText.exportPdfOption}</option>
        </Select>
        <p className="text-sm leading-6 text-(--tapiz-text-muted)">
          {format === "pdf" ? reportText.exportPdfHelp : format === "csv" ? t.exportCsvHelp : t.exportJsonHelp}
        </p>
      </div>
    </SidePanel>
  );
}
