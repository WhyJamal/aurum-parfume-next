"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { Phone, Send, Camera, MapPin, ArrowRight } from "lucide-react";
import { Sparkles } from "@/components/aceternity/sparkles";
import { MovingBorderButton } from "@/components/aceternity/moving-border";

/** Last section of the home page: contacts on top of the looping hero video */
export function Footer() {
  const video = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();

  // play only while the section is on screen (saves battery and bandwidth)
  useEffect(() => {
    const el = video.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.play().catch(() => {}); else el.pause(); }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <footer id="contact" className="relative flex min-h-[100svh] scroll-mt-0 flex-col justify-between overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/video/hero-bg.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-60" />
      {!reduce && <video ref={video} className="absolute inset-0 size-full object-cover" src="/video/hero.mp4" poster="/video/hero-poster.jpg" muted loop playsInline preload="metadata" />}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0908] via-[#0a0908]/40 to-[#0a0908]/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0908]/80 via-transparent to-transparent" />
      <Sparkles count={26} />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-32 md:px-8">
        <p className="text-xs uppercase tracking-[0.5em] text-[#c9a96e]">Контакты</p>
        <h2 className="font-display mt-4 max-w-3xl text-5xl font-light leading-[1] md:text-8xl">
          Найдите свой <span className="italic text-gold-shimmer">аромат</span>
        </h2>
        <p className="mt-5 max-w-md text-[#f5efe6]/70">Напишите нам, и мы поможем с выбором, подарком и доставкой.</p>
        <div className="mt-8">
          <MovingBorderButton as={Link} href="/collection">Открыть коллекцию <ArrowRight className="size-4" /></MovingBorderButton>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-10 pt-20 md:px-8">
        <div className="grid gap-10 border-t border-[#c9a96e]/20 pt-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="font-display text-4xl tracking-[0.35em]">AURUM</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#f5efe6]/60">Магазин премиальной парфюмерии. В каждом флаконе своя история. Оригинальная продукция и быстрая доставка.</p>
          </div>
          <ul className="space-y-3 text-sm text-[#f5efe6]/85">
            <li className="flex items-center gap-3"><Phone className="size-4 text-[#c9a96e]" /><a href="tel:+998900000000">+998 90 000 00 00</a></li>
            <li className="flex items-center gap-3"><Send className="size-4 text-[#c9a96e]" /><a href="https://t.me/aurum_parfum" target="_blank" rel="noreferrer">@aurum_parfum</a></li>
            <li className="flex items-center gap-3"><Camera className="size-4 text-[#c9a96e]" /><a href="https://instagram.com/aurum.parfum" target="_blank" rel="noreferrer">@aurum.parfum</a></li>
            <li className="flex items-center gap-3"><MapPin className="size-4 text-[#c9a96e]" /> Ташкент</li>
          </ul>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#c9a96e]">Доставка и оплата</p>
            <ul className="mt-4 space-y-2 text-sm text-[#f5efe6]/80">
              <li>Бесплатно от 1 000 000 сум</li>
              <li>По Ташкенту 1–2 дня</li>
              <li>Наличные, Click, Payme</li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-[#f5efe6]/40">© AURUM. Все права защищены.</p>
      </div>
    </footer>
  );
}
