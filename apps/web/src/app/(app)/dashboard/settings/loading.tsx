import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div aria-busy>
      <div className="pb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {[2, 6, 1, 1].map((fields, i) => (
            <Card key={i} className="space-y-5 p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3.5 w-64" />
              <div className="grid gap-5 sm:grid-cols-2">
                {Array.from({ length: fields }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-4 lg:col-span-2">
          <Card className="space-y-4 p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-40" />
          </Card>
          <Card className="space-y-4 p-5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </Card>
        </div>
      </div>
    </div>
  );
}
