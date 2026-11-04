import Link from "next/link";
import { Mic } from "lucide-react";
import { requireOwnerPage } from "@/lib/auth-helpers";
import { listSessions } from "@/lib/queries/dashboard";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { SessionsTable } from "@/components/dashboard/sessions-table";

export const metadata = { title: "Sessions" };
export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const owner = await requireOwnerPage();
  const [sessions, themes] = await Promise.all([
    listSessions(owner.id, { take: 500 }),
    prisma.theme.findMany({ select: { slug: true, title: true }, orderBy: { order: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description="Every practice session, with its score and report."
        actions={
          <Button asChild prefix={<Mic />}>
            <Link href="/practice">Practice</Link>
          </Button>
        }
      />
      {sessions.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="No sessions yet"
          description="Your first session will show up here with a full report."
          action={
            <Button asChild>
              <Link href="/practice">Start practising</Link>
            </Button>
          }
        />
      ) : (
        <SessionsTable
          rows={sessions.map((s) => ({
            ...s,
            createdAt: s.createdAt.toISOString(),
            startedAt: s.startedAt?.toISOString() ?? null,
          }))}
          themes={themes}
        />
      )}
    </div>
  );
}
