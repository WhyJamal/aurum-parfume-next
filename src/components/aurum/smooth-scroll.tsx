"use client";
import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
      if (!a) return;
      const href = a.getAttribute("href")!;
      if (href.startsWith("/#") && window.location.pathname !== "/") return;
      const el = document.querySelector(href.replace(/^\//, ""));
      if (el) { e.preventDefault(); lenis.scrollTo(el as HTMLElement, { offset: -20 }); }
    };
    document.addEventListener("click", onAnchor);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("click", onAnchor); lenis.destroy(); };
  }, []);
  return null;
}
