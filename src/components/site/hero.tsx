/* eslint-disable react/no-unescaped-entities */
import { TextGenerateEffect } from "@/components/aceternity/text-generate-effect";
import { SITE } from "@/data/perfumes";

export function Hero() {
  return (
    <section id="hero" className="relative isolate flex min-h-svh items-center overflow-hidden bg-black">
      <video
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        src="/materials/hero-video.mp4.mp4"
        poster="/materials/hero-bg.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-black to-transparent" />

      <div className="mx-auto w-full max-w-7xl px-5">
        <p className="mb-5 text-xs uppercase tracking-[0.5em] text-[#e8c987]/80">{SITE.name}</p>
        <TextGenerateEffect
          words="Hid — so'zsiz aytiladigan eng chiroyli gap"
          className="max-w-3xl font-[family-name:var(--font-cormorant)] text-5xl leading-[1.05] text-white md:text-7xl"
          delay={0.3}
        />
        <p className="mt-6 max-w-md text-base text-white/65">
          Qo'lda tanlangan xomashyo, sekin pishgan hidlar. Har bir shisha — bitta alohida kayfiyat.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href="#kolleksiya"
            className="rounded-full bg-[#e8c987] px-7 py-3 text-sm font-medium text-black transition hover:bg-[#f3dca4]"
          >
            Kolleksiyani ko'rish
          </a>
          <a
            href="#hikoya"
            className="rounded-full border border-white/25 px-7 py-3 text-sm text-white/90 transition hover:border-[#e8c987]/70 hover:text-[#e8c987]"
          >
            Hikoyamiz
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-white/40">
        Pastga suring
      </div>
    </section>
  );
}
