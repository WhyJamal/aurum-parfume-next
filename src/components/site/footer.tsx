/* eslint-disable react/no-unescaped-entities */
import { SITE } from "@/data/perfumes";

export function Footer() {
  return (
    <footer id="aloqa" className="border-t border-white/10 bg-black py-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-3">
        <div>
          <div className="font-(family-name:--font-cormorant) text-2xl tracking-[0.35em] text-[#e8c987]">{SITE.short}</div>
          <p className="mt-4 max-w-xs text-sm text-white/50">
            Qo'lda tanlangan hidlar. Har bir shisha — alohida hikoya.
          </p>
        </div>
        <div className="text-sm text-white/60">
          <div className="mb-3 text-xs uppercase tracking-[0.3em] text-white/35">Aloqa</div>
          <p>Telefon: +998 00 000 00 00</p>
          <p className="mt-1">Telegram: @aurumparfum</p>
          <p className="mt-1">Toshkent, O'zbekiston</p>
        </div>
        <div className="text-sm text-white/60">
          <div className="mb-3 text-xs uppercase tracking-[0.3em] text-white/35">Ish vaqti</div>
          <p>Har kuni 10:00 — 21:00</p>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl px-5 text-xs text-white/30">
        © {SITE.name}. Barcha huquqlar himoyalangan.
      </div>
    </footer>
  );
}
