"use client";
import { cn } from "@/lib/utils";

type Props = { as?: React.ElementType; className?: string; children: React.ReactNode } & Record<string, unknown>;

/** Aceternity-style Moving Border button: a gold light runs around the edge */
export function MovingBorderButton({ children, className, as: Tag = "button", ...props }: Props) {
  return (
    <Tag {...props} className={cn("group relative inline-flex overflow-hidden rounded-full bg-[#c9a96e]/25 p-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]", className)}>
      <span aria-hidden className="absolute inset-0 flex items-center justify-center">
        <span className="aspect-square w-[260%] shrink-0 animate-[spin-border_3.5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0%,transparent_65%,#f3dca6_90%,#c9a96e_100%)]" />
      </span>
      <span className="relative inline-flex h-full w-full items-center justify-center gap-2 rounded-full bg-[#0a0908]/90 px-7 py-3.5 text-sm font-medium tracking-wide text-[#f5efe6] backdrop-blur transition-colors group-hover:bg-[#14110e]">
        {children}
      </span>
    </Tag>
  );
}
