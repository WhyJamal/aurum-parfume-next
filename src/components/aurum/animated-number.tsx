"use client";
import { useEffect, useState } from "react";
import { animate, useMotionValue } from "motion/react";
import { formatPrice } from "@/lib/utils";

export function AnimatedPrice({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const [text, setText] = useState(formatPrice(value));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.6, ease: "easeOut" });
    const off = mv.on("change", (v) => setText(formatPrice(v)));
    return () => { controls.stop(); off(); };
  }, [value, mv]);
  return <span>{text}</span>;
}
