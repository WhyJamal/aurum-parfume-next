"use client";
import { motion } from "motion/react";
import { useUI } from "@/lib/store";

/** Bottle image that flies from the "add" button into the cart icon */
export function FlyLayer() {
  const flyers = useUI((s) => s.flyers);
  const landed = useUI((s) => s.landed);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
      {flyers.map((f) => (
        // eslint-disable-next-line @next/next/no-img-element
        <motion.img
          key={f.id}
          src={f.src}
          alt=""
          className="absolute left-0 top-0 object-contain drop-shadow-[0_0_18px_rgba(201,169,110,.7)]"
          initial={{ x: f.from.x, y: f.from.y, width: f.from.w, height: f.from.h, opacity: 1, rotate: 0 }}
          animate={{ x: f.to.x, y: f.to.y, width: 22, height: 30, opacity: [1, 1, 0.2], rotate: 220 }}
          transition={{ duration: 0.85, ease: [0.5, 0, 0.2, 1] }}
          onAnimationComplete={() => landed(f.id)}
        />
      ))}
    </div>
  );
}
