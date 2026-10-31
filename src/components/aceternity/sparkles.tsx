"use client";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface Dot { id: number; x: number; y: number; s: number; d: number; delay: number; dx: number }

/** Aceternity-style Sparkles: drifting gold dust (created after mount, no random in render) */
export function Sparkles({ count = 28, className, color = "#e9c98a" }: { count?: number; className?: string; color?: string }) {
  const [dots, setDots] = useState<Dot[]>([]);
  const reduce = useReducedMotion();
  useEffect(() => {
    setDots(Array.from({ length: count }, (_, id) => ({
      id, x: Math.random() * 100, y: 40 + Math.random() * 60, s: 1 + Math.random() * 2.6,
      d: 5 + Math.random() * 7, delay: Math.random() * 6, dx: (Math.random() - 0.5) * 60,
    })));
  }, [count]);
  if (reduce) return null;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s, background: color, boxShadow: `0 0 ${d.s * 4}px ${color}` }}
          animate={{ y: [0, -220], x: [0, d.dx], opacity: [0, 0.9, 0] }}
          transition={{ duration: d.d, delay: d.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
