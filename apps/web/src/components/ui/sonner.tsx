"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "dark"}
      position="bottom-right"
      icons={{
        success: <CheckCircle2 className="size-4 text-green-800" />,
        warning: <AlertTriangle className="size-4 text-amber-800" />,
        error: <XCircle className="size-4 text-red-700" />,
        info: <Info className="size-4 text-blue-700" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group flex w-[356px] items-center gap-3 rounded-lg border border-border bg-background-200 p-4 text-base text-foreground shadow-menu",
          title: "font-medium",
          description: "text-sm text-secondary",
          actionButton:
            "ml-auto rounded-sm bg-foreground px-2.5 py-1 text-xs font-medium text-inverse",
          cancelButton: "ml-auto rounded-sm border border-border px-2.5 py-1 text-xs",
        },
      }}
      {...props}
    />
  );
}
