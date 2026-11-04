import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium transition-colors duration-150 ease-ds select-none disabled:opacity-50 disabled:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700",
  {
    variants: {
      variant: {
        primary: "bg-foreground text-inverse hover:bg-gray-900 border border-transparent",
        secondary:
          "bg-background-100 text-foreground border border-border hover:bg-background-hover hover:border-border-hover",
        tertiary:
          "bg-transparent text-foreground hover:bg-background-hover border border-transparent",
        ghost:
          "bg-transparent text-secondary hover:text-foreground hover:bg-background-hover border border-transparent",
        destructive: "bg-red-700 text-white hover:bg-red-800 border border-transparent",
        outlineDestructive: "bg-transparent text-red-700 border border-red-500/60 hover:bg-red-100",
        link: "bg-transparent text-blue-700 hover:underline underline-offset-4 border-0 px-0 h-auto",
        accent: "bg-blue-700 text-white hover:bg-blue-800 border border-transparent",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-md",
        icon: "size-10",
        iconSm: "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "prefix">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      prefix,
      suffix,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot.Root
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        >
          {children}
        </Slot.Root>
      );
    }
    const Comp = "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Spinner className="size-4" /> : prefix}
        <span className="truncate">{children}</span>
        {!loading && suffix}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
