import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { endPracticeSession } from "@/lib/sessions";

export const POST = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const owner = await requireOwner();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  const s = await endPracticeSession(owner.id, id, body.reason ?? "user_ended");
  return json({ id: s.id, status: s.status });
});
