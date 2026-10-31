"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** Aceternity-style Spotlight: a soft light cone that sweeps in */
export function Spotlight({ className, fill = "#c9a96e" }: { className?: string; fill?: string }) {
  return (
    <motion.svg
      aria-hidden
      className={cn("pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%]", className)}
      viewBox="0 0 3787 2842" fill="none"
      initial={{ opacity: 0, x: -80 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 2.2, ease: "easeOut" }}
    >
      <g filter="url(#sp)">
        <ellipse cx="1924.7" cy="273.5" rx="1924.7" ry="273.5" transform="matrix(-0.822 -0.57 -0.57 0.822 3631 2291)" fill={fill} fillOpacity="0.22" />
      </g>
      <defs>
        <filter id="sp" x="0.86" y="0.84" width="3785" height="2840" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" result="blur" />
        </filter>
      </defs>
    </motion.svg>
  );
}
