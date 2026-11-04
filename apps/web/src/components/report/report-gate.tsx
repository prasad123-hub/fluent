"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useSessionStatus } from "@/hooks/use-session-status";

const STEPS = [
  "Finalising transcript",
  "Measuring fluency and pauses",
  "Checking grammar and vocabulary",
  "Scoring communication skills",
  "Writing your summary",
];

/**
 * Shows the analysing / failed states and refreshes into the full report when it is ready.
 */
export function ReportGate({
  sessionId,
  initialStatus,
  hasReport,
  scenarioTitle,
  scenarioId,
  failureReason,
}: {
  sessionId: string;
  initialStatus: string;
  hasReport: boolean;
  scenarioTitle: string;
  scenarioId: string | null;
  failureReason: string | null;
}) {
  const router = useRouter();
  const waiting =
    initialStatus === "analyzing" ||
    initialStatus === "ended" ||
    initialStatus === "live" ||
    initialStatus === "starting";
  const { data } = useSessionStatus(sessionId, {
    enabled: waiting,
    intervalMs: 2500,
    stopWhen: (s) => s.status === "complete" || s.status === "failed",
  });
  const status = data?.status ?? initialStatus;
  const [step, setStep] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (status !== "analyzing") return;
    const t = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 9000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (data?.status === "complete" && data.hasReport) router.refresh();
  }, [data, router]);

  async function retry() {
    setRetrying(true);
    const res = await fetch(`/api/sessions/${sessionId}/retry-analysis`, { method: "POST" });
    if (!res.ok)
      toast.error((await res.json().catch(() => ({ error: "" }))).error || "Could not retry");
    else router.refresh();
    setRetrying(false);
  }

  if (status === "complete" && hasReport) {
    // The server page renders ReportView for complete sessions; reaching here means a refresh is pending.
    return <PageHeader title={scenarioTitle} description="Loading your report…" />;
  }

  if (status === "failed") {
    return (
      <>
        <PageHeader title={scenarioTitle} description="This session didn't complete." />
        <ErrorState
          title="Session failed"
          description={
            failureReason ?? data?.failureReason ?? "Something went wrong during this session."
          }
        />
        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            prefix={<RefreshCw />}
            loading={retrying}
            onClick={() => void retry()}
          >
            Retry analysis
          </Button>
          <Button asChild prefix={<Mic />}>
            <Link href={scenarioId ? `/practice?scenario=${scenarioId}` : "/practice"}>
              Practice again
            </Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={scenarioTitle}
        description="Analysing your session. This usually takes under a minute."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-background-200 p-5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-4 h-8 w-16" />
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-background-200 p-5">
            <Skeleton className="h-4 w-40" />
            <SkeletonText lines={6} className="mt-4" />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background-200 p-5">
          <p className="text-sm font-medium">Working on it</p>
          <ol className="mt-3 space-y-2 text-sm">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={
                  i < step
                    ? "text-secondary line-through decoration-gray-500"
                    : i === step
                      ? "text-foreground"
                      : "text-tertiary"
                }
              >
                <span className="mr-2 inline-block size-1.5 rounded-full bg-current align-middle" />
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
