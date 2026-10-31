"use client";
import { useEffect, useRef } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { TextGenerateEffect } from "@/components/aceternity/text-generate";
import { Sparkles } from "@/components/aceternity/sparkles";

const beats = [
  { at: [0.14, 0.26, 0.38], label: "Верхние ноты", title: "Первая искра", text: "Бергамот и шафран. Аромат входит в комнату раньше вас." },
  { at: [0.42, 0.54, 0.66], label: "Сердце", title: "Сердце", text: "Роза, уд и жасмин. Здесь раскрывается настоящий характер." },
  { at: [0.7, 0.82, 0.96], label: "База", title: "Шлейф", text: "Амбра и мускус. Вы ушли, а аромат остался." },
] as const;

/** First screen of the site: the scroll position drives the video's playback (scrubbing). */
export function ScrollStory() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const target = useRef(0);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => { target.current = v; });

  useEffect(() => {
    const el = video.current;
    if (!el || reduce) return;
    let raf = 0;
    let current = 0;
    // some browsers (iOS) only allow seeking after a first play/pause
    el.play().then(() => el.pause()).catch(() => {});
    const tick = () => {
      // duration is read live, so replacing the file with an 8s one needs no code change
      const d = el.duration;
      if (Number.isFinite(d) && d > 0) {
        current += (target.current - current) * 0.12;
        const t = Math.min(Math.max(current * d, 0), d - 0.04);
        if (Math.abs(el.currentTime - t) > 0.016) el.currentTime = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const introOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.08], [0, -60]);

  return (
    <section ref={section} id="story" className="relative h-[460vh] bg-black">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <video ref={video} src="/video/scroll.mp4" poster="/video/scroll-poster.jpg" muted playsInline preload="auto" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-[#0a0908]/10 to-[#0a0908]/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,9,8,.7)_100%)]" />
        <Sparkles count={22} />

        {/* intro: the very first thing visitors see */}
        <motion.div style={{ opacity: introOpacity, y: introY }} className="absolute inset-0 z-10 mx-auto flex max-w-7xl flex-col justify-end px-5 pb-24 md:px-8 md:pb-28">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5 text-xs uppercase tracking-[0.5em] text-[#c9a96e]">Премиальная парфюмерия</motion.p>
          <h1 className="font-display max-w-4xl text-[clamp(2.5rem,6.2vw,5.8rem)] font-light leading-[0.95] text-[#f5efe6]">
            <TextGenerateEffect words="Аромат," />
            <br />
            <span className="italic"><TextGenerateEffect words="который остаётся." delay={0.5} wordClassName="text-gold-shimmer" /></span>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mt-6 max-w-md text-base leading-relaxed text-[#f5efe6]/70 md:text-lg">
            Листайте вниз и посмотрите, как раскрывается аромат: от первой искры до долгого шлейфа.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="mt-8 flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] text-[#c9a96e]">
            <span className="h-10 w-px animate-pulse bg-gradient-to-b from-[#c9a96e] to-transparent" /> Листайте вниз
          </motion.div>
        </motion.div>

        {beats.map((b, i) => <Beat key={b.label} beat={b} index={i} progress={scrollYProgress} />)}

        <div className="absolute bottom-8 left-5 right-5 z-10 md:left-10 md:right-10">
          <div className="h-px bg-[#f5efe6]/15"><motion.div className="h-px origin-left bg-[#c9a96e]" style={{ scaleX: scrollYProgress }} /></div>
        </div>
      </div>
    </section>
  );
}

function Beat({ beat, index, progress }: { beat: (typeof beats)[number]; index: number; progress: MotionValue<number> }) {
  const [a, b, c] = beat.at;
  const opacity = useTransform(progress, [a, b - 0.04, b + 0.04, c], [0, 1, 1, 0]);
  const y = useTransform(progress, [a, b, c], [50, 0, -50]);
  const blur = useTransform(progress, [a, b - 0.04, b + 0.04, c], [14, 0, 0, 14]);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);
  const right = index % 2 === 1;
  return (
    <motion.div style={{ opacity, y, filter }} className={`absolute bottom-28 z-10 max-w-sm px-5 md:bottom-1/3 md:max-w-md md:px-10 ${right ? "right-0 text-right" : "left-0"}`}>
      <p className="text-xs uppercase tracking-[0.4em] text-[#c9a96e]">{`0${index + 1} · ${beat.label}`}</p>
      <h3 className="font-display mt-2 text-5xl font-light italic text-[#f5efe6] md:text-7xl">{beat.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#f5efe6]/75 md:text-base">{beat.text}</p>
    </motion.div>
  );
}
