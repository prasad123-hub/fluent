import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-9 w-full max-w-xl" />
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}
