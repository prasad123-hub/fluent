import { notFound } from "next/navigation";
import { requireOwnerPage } from "@/lib/auth-helpers";
import { getSessionReport } from "@/lib/queries/report";
import { ReportGate } from "@/components/report/report-gate";
import { ReportView } from "@/components/report/report-view";

export const metadata = { title: "Session report" };
export const dynamic = "force-dynamic";

export default async function SessionReportPage({ params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwnerPage();
  const { id } = await params;
  const data = await getSessionReport(owner.id, id);
  if (!data) notFound();
  const { session, report } = data;
  if (session.status === "complete" && report) {
    return <ReportView data={{ ...data, report }} />;
  }
  return (
    <ReportGate
      sessionId={session.id}
      initialStatus={session.status}
      hasReport={!!report}
      scenarioTitle={session.scenarioTitle}
      scenarioId={session.scenarioId}
      failureReason={session.failureReason}
    />
  );
}
