"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-sm text-tertiary">500</p>
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-secondary">
        An unexpected error occurred. Try again, and if it keeps happening check the server logs.
      </p>
      {error.digest ? <p className="font-mono text-xs text-tertiary">ref {error.digest}</p> : null}
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
