"use client";
import { useRouter, usePathname } from "next/navigation";
import { Segmented } from "@/components/ui/segmented";

export function RangePicker({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <Segmented
      aria-label="Date range"
      size="sm"
      value={value}
      onValueChange={(v) => router.push(`${pathname}?range=${v}`)}
      options={[
        { value: "7d", label: "7d" },
        { value: "30d", label: "30d" },
        { value: "90d", label: "90d" },
        { value: "all", label: "All" },
      ]}
    />
  );
}
