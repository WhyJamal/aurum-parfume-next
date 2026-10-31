"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

// Aceternity "3D Card Effect" uslubida: sichqoncha harakatiga qarab qiyshayadi,
// ichidagi `data-depth` li elementlar oldinga chiqadi.
export function Card3D({
  children,
  className,
  max = 10,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${x * max * 2}deg) rotateX(${-y * max * 2}deg)`;
  }
  function onLeave() {
    const el = ref.current;
    if (el) el.style.transform = "rotateY(0deg) rotateX(0deg)";
  }

  return (
    <div className={cn("[perspective:1000px]", className)}>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="h-full transition-transform duration-200 ease-out [transform-style:preserve-3d]"
      >
        {children}
      </div>
    </div>
  );
}

export function Depth({
  z = 40,
  className,
  children,
}: {
  z?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className} style={{ transform: `translateZ(${z}px)` }}>
      {children}
    </div>
  );
}
