import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function VocabularyLoading() {
  return (
    <div aria-busy>
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="space-y-4 p-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-36" />
          </Card>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-8 w-56" />
      </div>
      <Skeleton className="mt-4 h-96" />
    </div>
  );
}
