import type { VocabStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export interface VocabItem {
  id: string;
  word: string;
  definition: string;
  example: string;
  ipa: string | null;
  partOfSpeech: string | null;
  source: string | null;
  status: VocabStatus;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  createdAt: string;
}

const STATUS_META: Record<VocabStatus, { label: string; variant: "blue" | "amber" | "green" }> = {
  new: { label: "New", variant: "blue" },
  learning: { label: "Learning", variant: "amber" },
  mastered: { label: "Mastered", variant: "green" },
};

export function StatusPill({ status }: { status: VocabStatus }) {
  const m = STATUS_META[status];
  return (
    <Badge variant={m.variant} dot>
      {m.label}
    </Badge>
  );
}
