"use client";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** Aceternity-style "Text Generate Effect": words fade in with blur, one by one */
export function TextGenerateEffect({
  words, className, wordClassName, delay = 0.2,
}: { words: string; className?: string; wordClassName?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className={cn("inline", className)} aria-label={words}>
      {words.split(" ").map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          aria-hidden
          className={cn("inline-block whitespace-pre", wordClassName)}
          initial={reduce ? false : { opacity: 0, filter: "blur(12px)", y: 18 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.9, delay: delay + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
        >
          {w}{" "}
        </motion.span>
      ))}
    </span>
  );
}
