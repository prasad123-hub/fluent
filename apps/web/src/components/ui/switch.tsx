"use client";
import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & { size?: "sm" | "md" }
>(({ className, size = "md", ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-gray-500 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-700",
      size === "md" ? "h-5 w-9" : "h-4 w-7",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block rounded-full bg-white shadow-sm transition-transform duration-150",
        size === "md"
          ? "size-4 translate-x-0.5 data-[state=checked]:translate-x-[18px]"
          : "size-3 translate-x-0.5 data-[state=checked]:translate-x-[14px]",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";

export { Switch };
