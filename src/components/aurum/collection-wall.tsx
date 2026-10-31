"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, ShoppingBag, X } from "lucide-react";
import { products, genderLabel, type Product, type Volume } from "@/lib/products";
import { useCart, useUI } from "@/lib/store";
import { cn, formatPrice } from "@/lib/utils";
import { AnimatedPrice } from "./animated-number";

type Bez = [number, number, number, number];
const EASE: Bez = [0.76, 0, 0.24, 1]; // expo in-out: the "expensive" slow-fast-slow feel
const OUT: Bez = [0.22, 1, 0.36, 1];
const AR = 640 / 1181; // niche image aspect (w / h)

/* ------------------------------------------------------------------ */
/* Geometry. Every niche is rendered ONCE at its "open" size and only  */
/* moved with transform (x, y, scale) -> GPU only, no layout thrash.    */
/* ------------------------------------------------------------------ */
interface Rect { x: number; y: number; w: number; h: number; s: number }
interface Geo { mobile: boolean; ow: number; oh: number; ox: number; oy: number; gap: number; closed: Rect[] }

function getGeo(W: number, H: number, n: number): Geo {
  const mobile = W < 768;
  const top = mobile ? 76 : 96;

  // open (expanded) niche
  const oh = mobile ? Math.min((H - top) * 0.46, (W * 0.74) / AR) : Math.min(H - top - 36, (W * 0.34) / AR);
  const ow = oh * AR;
  const ox = (mobile ? W / 2 : W * 0.6) - ow / 2;
  const oy = mobile ? top : top + (H - top - 36 - oh) / 2;

  // closed (the wall)
  const closed: Rect[] = [];
  if (mobile) {
    const rows = Math.ceil(n / 2);
    const rowH = (H - top - 120) / rows;
    const h = Math.min(rowH - 40, (W * 0.4) / AR);
    const w = h * AR;
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 2);
      const alone = row === rows - 1 && n % 2 === 1;
      const cx = alone ? W / 2 : i % 2 === 0 ? W * 0.3 : W * 0.7;
      closed.push({ x: cx - w / 2, y: top + row * rowH + 6, w, h, s: h / oh });
    }
  } else {
    const h = Math.min(H * 0.46, (W * 0.17) / AR);
    const w = h * AR;
    const pitch = Math.min((W * 0.9) / n, w * 1.55);
    const y = top + Math.max(0, (H - top - 170 - h) / 2) + 8;
    for (let i = 0; i < n; i++) {
      const cx = W / 2 + (i - (n - 1) / 2) * pitch;
      closed.push({ x: cx - w / 2, y, w, h, s: h / oh });
    }
  }
  return { mobile, ow, oh, ox, oy, gap: W * 0.18, closed };
}

export function CollectionWall() {
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [intro, setIntro] = useState(true);
  const ref = useRef<HTMLElement>(null);
  const bottles = useRef<Record<string, HTMLDivElement | null>>({});
  const touched = useRef(false);

  const navigate = (slug: string | null) => { setHovered(null); setActive(slug); };

  const idx = active ? products.findIndex((p) => p.slug === active) : -1;
  const expanded = active !== null;
  const go = (d: number) => navigate(products[(idx + d + products.length) % products.length].slug);
  const geo = useMemo(() => (size.w ? getGeo(size.w, size.h, products.length) : null), [size]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 2400);
    return () => clearTimeout(t);
  }, []);

  // open a niche straight from a link like /collection#oud-royal
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (products.some((p) => p.slug === h)) setActive(h);
  }, []);

  useEffect(() => {
    if (active) { touched.current = true; window.history.replaceState(null, "", `#${active}`); }
    else if (touched.current) { window.history.replaceState(null, "", window.location.pathname); setHovered(null); }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, idx]);

  const mobile = geo?.mobile ?? false;

  // The camera: wall + niches are scaled together toward the chosen niche (the niche never moves relative to the wall).
  const cam = (() => {
    if (!geo || idx < 0) return { x: 0, y: 0, scale: 1 };
    const c = geo.closed[idx];
    const k = geo.oh / c.h;
    return { x: geo.ox - k * c.x, y: geo.oy - k * c.y, scale: k };
  })();

  return (
    <section ref={ref} className="relative h-svh min-h-[600px] select-none overflow-hidden bg-[#040405]">
      {/* the "camera": wall + niches zoom together toward the chosen niche; the niche itself stays put */}
      <motion.div className="absolute inset-0" style={{ transformOrigin: "0 0" }} initial={false} animate={cam} transition={{ duration: 1.3, ease: EASE }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img aria-hidden src="/collection/wall.jpg" alt="" draggable={false}
          className="absolute inset-0 size-full object-cover opacity-70 brightness-[.7] contrast-110" />
        {/* glossy floor */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img aria-hidden src="/collection/floor.jpg" alt="" draggable={false}
          className="absolute inset-x-0 bottom-0 h-[34%] w-full object-cover [mask-image:linear-gradient(to_bottom,transparent,black_60%)]"
          animate={{ opacity: expanded ? 0 : 0.5 }} transition={{ duration: 0.6 }} />
        {geo && (
          <>
            {products.map((p, i) => (
              <Niche
                key={p.slug} p={p} i={i} geo={geo} active={active} hovered={hovered} intro={intro}
                setBottle={(el) => { bottles.current[p.slug] = el; }}
                onOpen={() => navigate(p.slug)} onHover={(on) => setHovered(on ? p.slug : null)}
              />
            ))}
            {products.map((p, i) => <Label key={p.slug} p={p} i={i} geo={geo} expanded={expanded} hovered={hovered} />)}
          </>
        )}
      </motion.div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000_105%)]" />
      {/* when a niche opens the left side goes black (room for the text) */}
      <motion.div aria-hidden className={cn("pointer-events-none absolute inset-0", mobile ? "bg-gradient-to-b from-black/40 to-black/80" : "bg-gradient-to-r from-black via-black/85 to-transparent [mask-image:linear-gradient(to_right,black_30%,transparent_62%)]")}
        animate={{ opacity: expanded ? 1 : 0 }} transition={{ duration: 0.9, delay: expanded ? 0.3 : 0 }} />

      {/* bottom-left title (wall view) */}
      <motion.div
        animate={{ opacity: expanded ? 0 : 1, y: expanded ? 20 : 0 }} transition={{ duration: 0.5, delay: expanded ? 0 : 0.5 }}
        className="pointer-events-none absolute bottom-6 left-5 right-5 z-10 flex items-end justify-between md:left-10 md:right-10"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.45em] text-[#c9a96e]">AURUM · Коллекция №1</p>
          <h1 className="font-display mt-2 text-4xl font-light md:text-6xl">Коллекция <span className="italic text-[#c9a96e]">ароматов</span></h1>
        </div>
        <p className="hidden max-w-[220px] text-right text-xs leading-relaxed text-[#f5efe6]/50 md:block">Наведите на нишу и нажмите, чтобы раскрыть аромат</p>
      </motion.div>

      {/* product view */}
      <AnimatePresence mode="wait">
        {active && geo && (
          <InfoPanel
            key={active} product={products[idx]} mobile={mobile}
            getRect={() => bottles.current[active]?.getBoundingClientRect()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <motion.div key="ctrl" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1 } }} exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className={cn("absolute z-30", mobile ? "right-4 top-24 flex flex-col gap-2" : "bottom-10 left-[5vw] flex items-center gap-8")}>
            {mobile ? (
              <>
                <RoundBtn label="Предыдущий" onClick={() => go(-1)}><ArrowLeft className="size-4" /></RoundBtn>
                <RoundBtn label="Следующий" onClick={() => go(1)}><ArrowRight className="size-4" /></RoundBtn>
                <RoundBtn label="Все ароматы" onClick={() => navigate(null)}><X className="size-4" /></RoundBtn>
              </>
            ) : (
              <>
                <button onClick={() => navigate(null)} className="group flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-[#f5efe6]/70 transition-colors hover:text-[#c9a96e]">
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Все ароматы
                </button>
                <div className="flex items-center gap-3 text-[11px] tracking-[0.25em] text-[#f5efe6]/60">
                  <RoundBtn small label="Предыдущий" onClick={() => go(-1)}><ArrowLeft className="size-3.5" /></RoundBtn>
                  <span className="tabular-nums">{String(idx + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}</span>
                  <RoundBtn small label="Следующий" onClick={() => go(1)}><ArrowRight className="size-3.5" /></RoundBtn>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Niche({ p, i, geo, active, hovered, intro, setBottle, onOpen, onHover }: {
  p: Product; i: number; geo: Geo; active: string | null; hovered: string | null; intro: boolean;
  setBottle: (el: HTMLDivElement | null) => void; onOpen: () => void; onHover: (on: boolean) => void;
}) {
  const expanded = active !== null;
  const isActive = active === p.slug;
  const hov = hovered === p.slug && !expanded;
  const c = geo.closed[i];

  const delay = intro ? 0.15 + i * 0.12 : 0;
  // wall brightness: hovered one lights up, the rest sink into the dark
  const wallB = isActive ? 1.05 : hov ? 1.3 : hovered && !expanded ? 0.4 : 0.8;
  const bottleB = isActive || hov ? 1.05 : hovered && !expanded ? 0.5 : 0.85;

  return (
    <motion.div
      className="absolute"
      style={{ left: c.x, top: c.y, width: c.w, height: c.h, zIndex: isActive ? 10 : 1 }}
      initial={{ y: 70, opacity: 0 }}
      animate={{ y: 0, opacity: expanded && !isActive ? 0 : 1 }}
      transition={{ y: { duration: 1.1, ease: OUT, delay }, opacity: { duration: expanded ? 0.5 : 0.7, delay: intro ? delay : expanded ? 0 : 0.5 } }}
    >
      {/* the niche itself */}
      <motion.div
        className="absolute inset-0 overflow-hidden bg-black"
        initial={{ filter: "brightness(0.12)" }}
        animate={{ filter: `brightness(${wallB})` }}
        transition={{ duration: 0.6, delay: intro ? 0.5 + i * 0.12 : 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* <img src={`/collection/niche-${p.slug}.jpg`} alt="" draggable={false} className="absolute inset-0 size-full object-cover" /> */}
        <img src={`/collection/niche.jpg`} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
        {/* soft colour of the bottle inside the niche */}
        <motion.div aria-hidden className="absolute bottom-[8%] left-1/2 h-[62%] w-[95%] -translate-x-1/2 mix-blend-screen"
          style={{ background: `radial-gradient(ellipse at 50% 60%, ${p.accent}, transparent 68%)` }}
          animate={{ opacity: isActive ? 0.3 : hov ? 0.22 : 0 }} transition={{ duration: 0.6 }} />
        {/* lamp glow */}
        <motion.div aria-hidden className="absolute inset-0 mix-blend-screen bg-[radial-gradient(ellipse_at_50%_12%,rgba(255,236,205,.6),transparent_58%)]"
          animate={{ opacity: isActive ? 0.55 : hov ? 1 : 0 }} transition={{ duration: 0.5 }} />
        {/* light cone falling from the lamp */}
        <motion.div aria-hidden className="absolute inset-x-[4%] top-[8%] h-[80%] mix-blend-screen blur-[6px]"
          style={{ background: "linear-gradient(to bottom, rgba(255,240,215,.5), rgba(255,240,215,0) 92%)", clipPath: "polygon(41% 0, 59% 0, 100% 100%, 0 100%)" }}
          animate={{ opacity: isActive ? 0.6 : hov ? 1 : 0 }} transition={{ duration: 0.6 }} />
        {/* coloured rim light on the left edge */}
        {/* <motion.div aria-hidden className="absolute inset-y-0 left-0 w-[6%] mix-blend-screen blur-[3px]"
          style={{ background: `linear-gradient(to bottom, ${p.accent}, ${p.accent}55)` }}
          animate={{ opacity: isActive ? 0.8 : hov ? 0.75 : 0 }} transition={{ duration: 0.6 }} /> */}
        <div aria-hidden className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,.6)]" />
      </motion.div>

      {/* floor reflection (niche + bottle, mirrored) */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 top-full h-[40%] overflow-hidden blur-[1.5px]"
        style={{ maskImage: "linear-gradient(to bottom, rgba(0,0,0,.4), transparent 85%)", WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,.4), transparent 85%)" }}
        animate={{ opacity: expanded ? 0 : hovered && !hov ? 0.4 : 1 }} transition={{ duration: 0.5 }}>
        <div className="absolute inset-x-0 top-0 h-[250%]" style={{ transform: "scaleY(-1)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/collection/niche.jpg`} alt="" draggable={false} className="absolute inset-0 size-full object-cover brightness-75" />
          {/* <img src={`/collection/niche-${p.slug}.jpg`} alt="" draggable={false} className="absolute inset-0 size-full object-cover brightness-75" /> */}
          <div className="absolute bottom-[8%] left-[10%] h-[56%] w-[80%]">
            <Image src={p.image} alt="" fill sizes="20vw" draggable={false} className="object-contain object-bottom" />
          </div>
        </div>
      </motion.div>

      {/* the bottle */}
      <motion.div className="absolute bottom-[8%] left-[10%] h-[56%] w-[80%]" animate={{ filter: `brightness(${bottleB})` }} transition={{ duration: 0.5 }}>
        <div aria-hidden className="absolute -bottom-[1%] left-1/2 h-[5%] w-[70%] -translate-x-1/2 rounded-full bg-black/80 blur-md" />
        <motion.div
          ref={setBottle} className="absolute inset-0"
          animate={isActive ? { y: [0, -10, 0], scale: 1 } : { y: hov ? -12 : 0, scale: hov ? 1.04 : 1 }}
          transition={isActive ? { y: { duration: 6, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.5 } } : { duration: 0.6, ease: OUT }}
        >
          <Image src={p.image} alt={p.name} fill sizes="(min-width:768px) 28vw, 60vw" priority={i < 3} draggable={false}
            className="object-contain object-bottom drop-shadow-[0_18px_22px_rgba(0,0,0,.65)]" />
          {/* light sheen sweeping over the glass (clipped to the bottle's silhouette) */}
          {isActive && (
            <motion.div aria-hidden className="absolute inset-0 mix-blend-overlay"
              style={{
                background: "linear-gradient(110deg, transparent 38%, rgba(255,255,255,.9) 50%, transparent 62%)", backgroundSize: "250% 100%",
                maskImage: `url(${p.image})`, WebkitMaskImage: `url(${p.image})`,
                maskSize: "contain", WebkitMaskSize: "contain", maskPosition: "50% 100%", WebkitMaskPosition: "50% 100%",
                maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat",
              }}
              initial={{ backgroundPosition: "150% 0" }}
              animate={{ backgroundPosition: ["150% 0", "-50% 0"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut", delay: 1.4 }}
            />
          )}
        </motion.div>
      </motion.div>

      {!expanded && (
        <button aria-label={`Открыть ${p.name}`} onClick={onOpen} onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}
          onFocus={() => onHover(true)} onBlur={() => onHover(false)}
          className="absolute inset-0 z-20 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c9a96e]" />
      )}
    </motion.div>
  );
}

/** name + price under the niche (kept outside the scaled box so text stays sharp) */
function Label({ p, i, geo, expanded, hovered }: { p: Product; i: number; geo: Geo; expanded: boolean; hovered: string | null }) {
  const c = geo.closed[i];
  const on = !expanded && (geo.mobile || hovered === p.slug);
  return (
    <motion.div
      className="pointer-events-none absolute z-10 text-center"
      style={{ left: c.x - 24, top: c.y + c.h + 14, width: c.w + 48 }}
      animate={{ opacity: on ? 1 : 0, y: on ? 0 : 8 }} transition={{ duration: 0.45, delay: expanded ? 0 : 0.1 }}
    >
      <p className="font-display text-base leading-tight text-[#f5efe6] md:text-2xl">{p.name}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-[0.25em] text-[#c9a96e] md:text-[11px]">N°{String(i + 1).padStart(2, "0")} · {formatPrice(p.prices[50])}</p>
    </motion.div>
  );
}

function RoundBtn({ children, label, onClick, small }: { children: React.ReactNode; label: string; onClick: () => void; small?: boolean }) {
  return (
    <button aria-label={label} title={label} onClick={onClick}
      className={cn("grid place-items-center rounded-full border border-[#c9a96e]/35 bg-black/50 text-[#f5efe6] backdrop-blur transition hover:border-[#c9a96e] hover:bg-[#c9a96e]/15", small ? "size-9" : "size-11")}>
      {children}
    </button>
  );
}

const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: OUT } } };

function InfoPanel({ product: p, mobile, getRect }: { product: Product; mobile: boolean; getRect: () => DOMRect | undefined }) {
  const [volume, setVolume] = useState<Volume>(50);
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);
  const { fly, setCartOpen } = useUI();
  const [first, ...rest] = p.name.split(" ");

  const onAdd = () => {
    add(p.slug, volume);
    const from = getRect();
    const to = document.getElementById("cart-button")?.getBoundingClientRect();
    if (from && to) fly({ src: p.image, from: { x: from.left + from.width * 0.3, y: from.top, w: from.width * 0.4, h: from.height * 0.85 }, to: { x: to.left + to.width / 2 - 11, y: to.top + to.height / 2 - 15 } });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <motion.div
      initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.2 } }}
      variants={{ hidden: {}, show: { transition: { delayChildren: 0.95, staggerChildren: 0.09 } } }}
      className={cn("absolute z-30", mobile ? "inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-5 pb-6 pt-16" : "left-[5vw] top-1/2 w-[min(30vw,420px)] -translate-y-1/2")}
    >
      <motion.p variants={item} className="text-[11px] uppercase tracking-[0.4em] text-[#c9a96e]">AURUM · {genderLabel[p.gender]}</motion.p>
      <h2 className="font-display mt-2 overflow-hidden pb-2 text-5xl font-light leading-[1.05] md:text-7xl">
        <motion.span className="block" variants={{ hidden: { y: "110%" }, show: { y: 0, transition: { duration: 1, ease: OUT } } }}>
          {first} <span className="italic" style={{ color: p.accent }}>{rest.join(" ")}</span>
        </motion.span>
      </h2>
      <motion.p variants={item} className="mt-1 text-sm italic text-[#c9a96e]/80">{p.tagline}</motion.p>
      <motion.p variants={item} className="mt-3 text-sm leading-relaxed text-[#f5efe6]/70 md:mt-4">{p.description}</motion.p>

      <dl className="mt-4 hidden space-y-2 text-sm md:block">
        {([["Верхние", p.notes.top], ["Сердце", p.notes.heart], ["База", p.notes.base]] as const).map(([k, v]) => (
          <motion.div variants={item} key={k} className="flex gap-4 border-b border-white/10 pb-2">
            <dt className="w-20 shrink-0 text-[11px] uppercase tracking-widest text-[#a89c8a]">{k}</dt>
            <dd className="text-[#f5efe6]">{v.join(" · ")}</dd>
          </motion.div>
        ))}
      </dl>

      <motion.div variants={item} className="mt-4 flex gap-2 md:mt-5">
        {([50, 100] as Volume[]).map((v) => (
          <button key={v} onClick={() => setVolume(v)} className={cn("relative rounded-full border px-5 py-2 text-sm transition-colors", volume === v ? "border-[#c9a96e] text-[#0a0908]" : "border-[#c9a96e]/30 text-[#f5efe6]/80 hover:border-[#c9a96e]/70")}>
            {volume === v && <motion.span layoutId="vol-pill" className="absolute inset-0 rounded-full bg-[#c9a96e]" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
            <span className="relative font-medium">{v} мл</span>
          </button>
        ))}
      </motion.div>

      <motion.div variants={item} className="mt-5 flex flex-wrap items-center justify-between gap-3 md:mt-6">
        <div className="font-display text-3xl text-[#f5efe6] md:text-4xl"><AnimatedPrice value={p.prices[volume]} /></div>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onAdd} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#c9a96e] to-[#e9c98a] px-6 py-3 text-sm font-semibold text-[#0a0908] shadow-[0_0_30px_rgba(201,169,110,.35)]">
          {added ? <><Check className="size-4" /> Добавлено</> : <><ShoppingBag className="size-4" /> В корзину</>}
        </motion.button>
      </motion.div>
      {added && <button onClick={() => setCartOpen(true)} className="mt-3 text-sm text-[#c9a96e] underline underline-offset-4">Открыть корзину →</button>}
    </motion.div>
  );
}