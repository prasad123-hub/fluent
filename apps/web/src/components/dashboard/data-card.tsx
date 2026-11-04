"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DataCard({
  sessionCount,
  vocabCount,
}: {
  sessionCount: number;
  vocabCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const clear = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/data/clear", { method: "POST" });
      if (!res.ok) {
        toast.error("Couldn't clear your data");
        return;
      }
      toast.success("All practice data cleared. Fresh start.");
      setOpen(false);
      router.refresh();
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data</CardTitle>
        <CardDescription>
          Everything lives in your own database. Take a copy any time, or wipe it and start over.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3 rounded-md border border-border bg-background-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Export everything as JSON</p>
            <p className="text-xs text-secondary">
              {sessionCount} sessions with transcripts and reports, {vocabCount} vocabulary entries,
              goals, profile and settings.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm" prefix={<Download />}>
            <a href="/api/export" download>
              Export JSON
            </a>
          </Button>
        </div>
        <div className="flex flex-col gap-3 rounded-md border border-red-500/40 bg-red-100/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Clear all data</p>
            <p className="text-xs text-secondary">
              Deletes sessions, vocabulary, goals and usage, and resets your profile and settings.
              Your login and the scenario library stay.
            </p>
          </div>
          <Button
            variant="outlineDestructive"
            size="sm"
            prefix={<Trash2 />}
            onClick={() => setOpen(true)}
          >
            Clear all data
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Clear all practice data?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes {sessionCount} sessions and {vocabCount} vocabulary entries,
            along with your goals, progress profile and settings. Export first if you want a copy —
            this cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing}>Keep my data</AlertDialogCancel>
            <AlertDialogAction
              destructive
              disabled={clearing}
              onClick={(e) => {
                e.preventDefault();
                void clear();
              }}
            >
              {clearing ? "Clearing…" : "Yes, clear everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
