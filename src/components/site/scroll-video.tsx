"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";

// Video scroll bilan "tortiladi": davomiylik videoning o'zidan o'qiladi,
// shuning uchun 5 soniyadan 8 soniyaga almashtirsangiz kod o'zgarmaydi.
const SRC = "/materials/scroll-video.mp4.mp4";

const STEPS = [
  { from: 0.04, to: 0.3, title: "Sukunat", text: "Qorong'ulikda faqat bitta shisha." },
  { from: 0.38, to: 0.64, title: "Yorug'lik", text: "Oltin suyuqlik nurni ichiga oladi." },
  { from: 0.72, to: 0.97, title: "Iz", text: "Hid ketadi — xotira qoladi." },
];

function Step({
  step,
  progress,
  index,
}: {
  step: (typeof STEPS)[number];
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  index: number;
}) {
  const opacity = useTransform(
    progress,
    [step.from, step.from + 0.06, step.to - 0.06, step.to],
    [0, 1, 1, 0],
  );
  const y = useTransform(progress, [step.from, step.to], [30, -30]);
  return (
    <motion.div
      style={{ opacity, y }}
      className={`absolute bottom-[14vh] max-w-sm ${index % 2 === 0 ? "left-6 md:left-16" : "right-6 text-right md:right-16"}`}
    >
      <h3 className="font-[family-name:var(--font-cormorant)] text-4xl text-[#e8c987] md:text-5xl">{step.title}</h3>
      <p className="mt-2 text-white/70">{step.text}</p>
    </motion.div>
  );
}

export function ScrollVideo() {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const target = useRef(0);
  const raf = useRef<number | null>(null);

  const { scrollYProgress } = useScroll({ target: box, offset: ["start start", "end end"] });

  function apply() {
    raf.current = null;
    const v = video.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return;
    const t = Math.min(Math.max(target.current * v.duration, 0), v.duration - 0.05);
    if (Math.abs(v.currentTime - t) > 0.02) v.currentTime = t;
  }

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    target.current = p;
    if (raf.current == null) raf.current = requestAnimationFrame(apply);
  });

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const onMeta = () => apply();
    v.addEventListener("loadedmetadata", onMeta);
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

  const barScale = scrollYProgress;

  return (
    <section id="hikoya" ref={box} className="relative h-[420vh] bg-black">
      <div className="sticky top-0 h-svh overflow-hidden">
        <video
          ref={video}
          src={SRC}
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />

        {STEPS.map((s, i) => (
          <Step key={s.title} step={s} progress={scrollYProgress} index={i} />
        ))}

        <motion.div
          style={{ scaleX: barScale }}
          className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-[#e8c987]"
        />
      </div>
    </section>
  );
}
