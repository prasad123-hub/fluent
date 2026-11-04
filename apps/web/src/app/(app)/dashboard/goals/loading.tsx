import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function GoalsLoading() {
  return (
    <div aria-busy>
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-7 w-32 rounded-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="space-y-4 p-5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-2 w-full rounded-full" />
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <Skeleton className="h-5 w-20" />
        <Card className="mt-3 space-y-5 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-10 w-full max-w-sm" />
            </div>
          ))}
          <Skeleton className="h-10 w-28" />
        </Card>
      </div>
    </div>
  );
}
