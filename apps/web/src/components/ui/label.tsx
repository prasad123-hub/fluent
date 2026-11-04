import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { hint?: string }
>(({ className, hint, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("flex flex-col gap-1 text-sm font-medium text-foreground", className)}
    {...props}
  >
    <span>{children}</span>
    {hint ? <span className="text-xs font-normal text-secondary">{hint}</span> : null}
  </LabelPrimitive.Root>
));
Label.displayName = "Label";

export { Label };
