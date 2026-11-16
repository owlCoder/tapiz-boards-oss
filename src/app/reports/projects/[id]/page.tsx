import { notFound } from "next/navigation";
import { projectExportService } from "@/application/project-export.service";
import { ProjectReportView } from "@/features/board/report/ProjectReportView";
import { requireProjectPageAccess } from "@/lib/team-access";

/** Dedicated, authenticated layout for print/PDF; no sidebar or navigation chrome. */
export default async function ProjectReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project, canManage } = await requireProjectPageAccess(id);
  // Match the existing JSON/CSV export permission: only the project owner.
  if (!canManage) notFound();
  const data = await projectExportService.load(project);
  return <ProjectReportView data={data} />;
}
