"use client";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown } from "lucide-react";
import { TextGenerateEffect } from "@/components/aceternity/text-generate";
import { Spotlight } from "@/components/aceternity/spotlight";
import { Sparkles } from "@/components/aceternity/sparkles";
import { MovingBorderButton } from "@/components/aceternity/moving-border";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative h-[100svh] min-h-[620px] overflow-hidden bg-black">
      <motion.div className="absolute inset-0" style={{ scale }}>
        {/* poster (the smoky background) shows until the video is ready */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/video/hero-bg.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-70" />
        {!reduce && (
          <video className="absolute inset-0 size-full object-cover" src="/video/hero.mp4" poster="/video/hero-poster.jpg" autoPlay muted loop playsInline preload="auto" />
        )}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-[#0a0908]/30 to-[#0a0908]/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0908]/80 via-transparent to-transparent md:from-[#0a0908]/60" />
      <Spotlight className="-left-40 -top-40 md:-top-20" />
      <Sparkles count={30} />

      <motion.div style={{ y: textY, opacity: fade }} className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-20 md:px-8 md:pb-24">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5 text-xs uppercase tracking-[0.5em] text-[#c9a96e]">
          Premium atirlar kolleksiyasi
        </motion.p>
        <h1 className="font-display max-w-4xl text-[clamp(2.6rem,7.2vw,6.8rem)] font-light leading-[0.95] text-[#f5efe6]">
          <TextGenerateEffect words="Hid — bu" />
          <br />
          <span className="italic"><TextGenerateEffect words="unutilmas xotira." delay={0.7} wordClassName="text-gold-shimmer" /></span>
        </h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-6 max-w-md text-base leading-relaxed text-[#f5efe6]/70 md:text-lg">
          Oud, atirgul, amber va dengiz shamoli. O'zingizga mos hidni toping va bugunoq buyurtma bering.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.9 }} className="mt-9 flex flex-wrap items-center gap-4">
          <MovingBorderButton as="a" href="#collection">Kolleksiyani ko'rish</MovingBorderButton>
          <a href="#quiz" className="rounded-full px-5 py-3.5 text-sm text-[#f5efe6]/80 underline-offset-8 transition hover:text-[#c9a96e] hover:underline">Atiringni top →</a>
        </motion.div>
      </motion.div>

      <motion.a href="#collection" aria-label="Pastga" style={{ opacity: fade }} className="absolute bottom-6 right-6 z-10 hidden size-12 place-items-center rounded-full border border-[#c9a96e]/40 text-[#c9a96e] md:grid">
        <ArrowDown className="size-5 animate-bounce" />
      </motion.a>
    </section>
  );
}
