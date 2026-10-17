"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster(props) {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-xl border bg-card text-card-foreground soft-shadow text-sm",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          error: "!text-destructive",
          success: "!text-[oklch(0.45_0.13_150)]",
        },
      }}
      {...props}
    />
  );
}
