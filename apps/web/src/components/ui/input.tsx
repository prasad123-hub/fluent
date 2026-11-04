import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, prefix, suffix, invalid, type, ...props }, ref) => {
    const field = (
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-10 w-full min-w-0 rounded-sm border border-border bg-background-100 px-3 text-base text-foreground shadow-none transition-colors duration-150 outline-none placeholder:text-tertiary hover:border-border-hover focus:border-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50",
          invalid && "border-red-700 focus:border-red-700",
          prefix && "pl-9",
          suffix && "pr-9",
          className,
        )}
        {...props}
      />
    );
    if (!prefix && !suffix) return field;
    return (
      <div className="relative w-full">
        {prefix ? (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-tertiary [&_svg]:size-4">
            {prefix}
          </span>
        ) : null}
        {field}
        {suffix ? (
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-tertiary [&_svg]:size-4">
            {suffix}
          </span>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-24 w-full rounded-sm border border-border bg-background-100 px-3 py-2 text-base text-foreground transition-colors outline-none placeholder:text-tertiary hover:border-border-hover focus:border-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Input, Textarea };
