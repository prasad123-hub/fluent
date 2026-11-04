import { notFound } from "next/navigation";
import { requireOwnerPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { ReportGate } from "@/components/report/report-gate";

export const metadata = { title: "Session report" };
export const dynamic = "force-dynamic";

export default async function SessionReportPage({ params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwnerPage();
  const { id } = await params;
  const s = await prisma.session.findFirst({
    where: { id, userId: owner.id },
    include: { report: { select: { id: true } } },
  });
  if (!s) notFound();
  return (
    <ReportGate
      sessionId={s.id}
      initialStatus={s.status}
      hasReport={!!s.report}
      scenarioTitle={s.scenarioTitle}
      scenarioId={s.scenarioId}
      failureReason={s.failureReason}
    />
  );
}
