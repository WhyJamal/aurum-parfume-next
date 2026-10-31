"use client";

import { useEffect } from "react";
import { motion, stagger, useAnimate } from "motion/react";
import { cn } from "@/lib/utils";

// Aceternity "Text Generate Effect" uslubida: so'zlar ketma-ket blur'dan chiqadi
export function TextGenerateEffect({
  words,
  className,
  delay = 0,
  duration = 0.7,
}: {
  words: string;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const [scope, animate] = useAnimate();
  const list = words.split(" ");

  useEffect(() => {
    animate(
      "span",
      { opacity: 1, filter: "blur(0px)", y: 0 },
      { duration, delay: stagger(0.12, { startDelay: delay }) },
    );
  }, [animate, delay, duration]);

  return (
    <motion.div ref={scope} className={cn(className)}>
      {list.map((w, i) => (
        <motion.span
          key={w + i}
          className="inline-block opacity-0"
          style={{ filter: "blur(10px)", transform: "translateY(10px)" }}
        >
          {w}&nbsp;
        </motion.span>
      ))}
    </motion.div>
  );
}
