import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function MistakesLoading() {
  return (
    <div aria-busy>
      <div className="pb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="space-y-4 p-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-40" />
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-5 h-[220px]" />
        </Card>
        <Card className="p-5 lg:col-span-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-5 h-[220px]" />
        </Card>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="space-y-3 p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3.5 w-56" />
            <Skeleton className="h-8 w-28" />
          </Card>
        ))}
      </div>
      <Skeleton className="mt-8 h-64" />
    </div>
  );
}
