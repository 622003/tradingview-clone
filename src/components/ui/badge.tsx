import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-zinc-700 bg-zinc-800 text-zinc-200",
        success: "border-emerald-700/40 bg-emerald-950/40 text-emerald-300",
        warning: "border-amber-700/40 bg-amber-950/40 text-amber-300",
        danger: "border-rose-700/40 bg-rose-950/40 text-rose-300",
        info: "border-blue-700/40 bg-blue-950/40 text-blue-300",
        outline: "border-zinc-700 bg-transparent text-zinc-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
