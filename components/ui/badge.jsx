import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/12 text-primary",
        secondary: "border-transparent bg-secondary/15 text-secondary",
        accent: "border-transparent bg-accent/15 text-accent-foreground",
        success: "border-transparent bg-[oklch(0.65_0.17_150_/_0.15)] text-[oklch(0.4_0.13_150)]",
        warning: "border-transparent bg-[oklch(0.78_0.16_75_/_0.2)] text-[oklch(0.45_0.12_70)]",
        destructive: "border-transparent bg-destructive/12 text-destructive",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
