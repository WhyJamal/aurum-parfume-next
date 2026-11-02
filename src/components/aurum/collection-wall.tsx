"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { ArrowLeft, ArrowRight, Check, ShoppingBag, X } from "lucide-react";
import { products, genderLabel, type Product, type Volume } from "@/lib/products";
import { useCart, useUI } from "@/lib/store";
import { cn, formatPrice } from "@/lib/utils";
import { AnimatedPrice } from "./animated-number";

type Bez = [number, number, number, number];
const EASE: Bez = [0.76, 0, 0.24, 1]; // expo in-out: the "expensive" slow-fast-slow feel
const OUT: Bez = [0.22, 1, 0.36, 1];
const AR = 640 / 1099; // niche image aspect (w / h)

/* ------------------------------------------------------------------ */
/* Geometry. Every niche is rendered ONCE at its "open" size and only  */
/* moved with transform (x, y, scale) -> GPU only, no layout thrash.    */
/* ------------------------------------------------------------------ */
interface Rect { x: number; y: number; w: number; h: number; s: number }
interface Geo { mobile: boolean; ow: number; oh: number; ox: number; oy: number; gap: number; closed: Rect[] }

function getGeo(W: number, H: number, n: number): Geo {
  const mobile = W < 768;
  const top = mobile ? 72 : 96;

  // open (expanded) niche
  const oh = mobile ? Math.min((H - top) * 0.44, (W * 0.74) / AR) : Math.min(H - top - 36, (W * 0.34) / AR);
  const ow = oh * AR;
  const ox = (mobile ? W / 2 : W * 0.6) - ow / 2;
  const oy = mobile ? top : top + (H - top - 36 - oh) / 2;

  // closed (the wall)
  const closed: Rect[] = [];
  if (mobile) {
    // rows of 2 then 3, ALL niches the same size
    const counts = [Math.min(2, n), Math.max(0, n - 2)];
    const avail = H - top - 150;
    let w = W * 0.28;
    let h = w / AR;
    const k = Math.min(1, avail / (h * 2 + 46));
    w *= k; h *= k;
    const startY = top + Math.max(0, (avail - (h * 2 + 46)) / 2);
    const pitch = W * 0.32;
    let i = 0;
    counts.forEach((cnt, r) => {
      const y = startY + r * (h + 46);
      for (let j = 0; j < cnt; j++, i++) {
        const cx = W / 2 + (j - (cnt - 1) / 2) * pitch;
        closed.push({ x: cx - w / 2, y, w, h, s: h / oh });
      }
    });
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

/* ------------------------------------------------------------------ */
/* Realistic polished-marble floor: veins, perspective tile seams,    */
/* wall reflection, contact shadow and light pools under each niche.  */
/* ------------------------------------------------------------------ */
const svgUri = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const veinTable = (peak: number) => Array.from({ length: 41 }, (_, i) => (i === 20 ? peak : i === 19 || i === 21 ? peak * 0.3 : 0)).join(" ");
const marbleSvg = (seed: number, fx: string, peak: number) =>
  `<svg xmlns='http://www.w3.org/2000/svg' width='1400' height='800'><filter id='f' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='${fx}' numOctaves='5' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 0'/><feComponentTransfer><feFuncA type='table' tableValues='${veinTable(peak)}'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>`;
const grainSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>`;
const VEINS_A = svgUri(marbleSvg(7, ".0022 .0085", 0.75));
const VEINS_B = svgUri(marbleSvg(31, ".006 .02", 0.45));
const GRAIN = svgUri(grainSvg);

function Floor({ world, geo }: { world: { W: number; H: number; minX: number; maxX: number; maxY: number; floorTop: number }; geo: Geo }) {
  const w = world.maxX - world.minX;
  const h = world.maxY - world.floorTop;
  const cx = world.W / 2 - world.minX;

  // perspective tile seams: a vanishing point above the floor, depth spacing shrinks toward the wall
  const seams = useMemo(() => {
    const V = world.H * 0.38;                 // horizon height above the wall/floor line
    const zf = 1, step = 0.085;
    const horiz: number[] = [];
    for (let z = zf; z > 0.14; z -= step) horiz.push(V * zf / z - V);
    const tileW = Math.max(150, world.W * 0.17);
    const verts: number[] = [];
    const n = Math.ceil(w / tileW) + 8;
    for (let k = -n; k <= n; k++) verts.push(cx + k * tileW * (1 + h / V) * 0.62);
    return { V, horiz, verts };
  }, [world.H, world.W, w, h, cx]);

  const h0 = h;
  return (
    <div aria-hidden className="absolute overflow-hidden" style={{
      left: world.minX, width: w, top: world.floorTop, height: h,
      background: `linear-gradient(to bottom, #1d1d22 0px, #101014 ${h0 * 0.12}px, #08080b ${h0 * 0.4}px, #030304 ${h0}px)`,
    }}>
      {/* marble veins (fade with distance: crisper near the viewer) */}
      <div className="absolute inset-0 mix-blend-screen opacity-[.16]" style={{
        backgroundImage: VEINS_A, backgroundSize: "1400px 800px",
        maskImage: "linear-gradient(to bottom, rgba(0,0,0,.25), black 55%)", WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,.25), black 55%)",
      }} />
      <div className="absolute inset-0 mix-blend-screen opacity-[.09]" style={{ backgroundImage: VEINS_B, backgroundSize: "900px 520px", backgroundPosition: "180px 90px" }} />
      {/* polished-stone micro grain */}
      <div className="absolute inset-0 mix-blend-overlay opacity-[.10]" style={{ backgroundImage: GRAIN, backgroundSize: "400px 400px" }} />

      {/* tile seams in perspective (dark groove + thin light edge) */}
      <svg className="absolute inset-0" width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <g stroke="rgba(0,0,0,.65)" strokeWidth="2.2" fill="none">
          {seams.horiz.map((y, i) => <line key={`h${i}`} x1="0" x2={w} y1={y} y2={y} />)}
          {seams.verts.map((bx, i) => <line key={`v${i}`} x1={cx} y1={-seams.V} x2={cx + (bx - cx) * (1 + h / seams.V)} y2={h} />)}
        </g>
        <g stroke="rgba(255,255,255,.07)" strokeWidth="1" fill="none">
          {seams.horiz.map((y, i) => <line key={`hl${i}`} x1="0" x2={w} y1={y + 2} y2={y + 2} />)}
          {seams.verts.map((bx, i) => <line key={`vl${i}`} x1={cx + 2} y1={-seams.V} x2={cx + (bx - cx) * (1 + h / seams.V) + 2} y2={h} />)}
        </g>
      </svg>

      {/* soft pools of lamp light on the polished stone, under every niche */}
      {geo.closed.map((c, i) => {
        const pw = c.w * 1.9, ph = Math.max(60, c.h * 0.42);
        return (
          <div key={i} className="absolute mix-blend-screen" style={{
            left: c.x + c.w / 2 - world.minX - pw / 2, top: -ph * 0.12, width: pw, height: ph,
            background: "radial-gradient(ellipse at 50% 22%, rgba(255,226,180,.20), rgba(255,226,180,.07) 42%, transparent 70%)",
          }} />
        );
      })}

      {/* broad glossy sheen, strongest on the vertical axis of the room */}
      <div className="absolute inset-0 mix-blend-screen" style={{ background: `radial-gradient(ellipse ${0.75 * world.W}px ${0.6 * h0}px at ${cx}px 0px, rgba(255,255,255,.11), transparent 70%)` }} />
      <div className="absolute inset-0 mix-blend-soft-light" style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.16) 46%, transparent 58%)" }} />

      {/* wall / floor junction: bright skirting reflection, then a contact shadow */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/35" />
      <div className="absolute inset-x-0 top-px h-14 bg-linear-to-b from-white/[.10] via-white/[.03] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-3 bg-linear-to-b from-black/60 to-transparent" />
      {/* near edge falls into darkness */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/70 to-transparent" />
    </div>
  );
}

export function CollectionWall() {
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [intro, setIntro] = useState(true);
  const ref = useRef<HTMLElement>(null);
  const bottles = useRef<Record<string, HTMLDivElement | null>>({});
  const touched = useRef(false);

  const navigate = (slug: string | null) => {
    setHovered(null);
    setSelected(null);
    setActive(slug);
  };

  const idx = active ? products.findIndex((p) => p.slug === active) : -1;
  const expanded = active !== null;
  const go = (d: number) => navigate(products[(idx + d + products.length) % products.length].slug);
  const geo = useMemo(() => (size.w ? getGeo(size.w, size.h, products.length) : null), [size]);

  // Devor/pol kamera ISTALGAN nishaga borganda ham ekranni to'ldirishi uchun "dunyo" qanchaga cho'zilishi kerak
  const world = useMemo(() => {
    if (!geo) return null;
    const { w: W, h: H } = size;
    let minX = 0, minY = 0, maxX = W, maxY = H;
    for (const c of geo.closed) {
      const k = geo.oh / c.h;
      const tx = geo.ox - k * c.x;
      const ty = geo.oy - k * c.y;
      minX = Math.min(minX, -tx / k);
      maxX = Math.max(maxX, (W - tx) / k);
      minY = Math.min(minY, -ty / k);
      maxY = Math.max(maxY, (H - ty) / k);
    }
    const m = 40;
    minX -= m; minY -= m; maxX += m; maxY += m;
    const floorTop = Math.max(...geo.closed.map((c) => c.y + c.h)) + (geo.mobile ? 34 : 16);
    // devor rasmi mirror (oynadek) qilib yoyiladi, shuning uchun chokda chiziq bo'lmaydi
    const x0 = Math.floor(minX / W), x1 = Math.ceil(maxX / W);
    const y0 = Math.floor(minY / H), y1 = Math.ceil(maxY / H);
    const tiles: { ix: number; iy: number }[] = [];
    for (let iy = y0; iy < y1; iy++) for (let ix = x0; ix < x1; ix++) tiles.push({ ix, iy });
    return { W, H, minX, maxX, maxY, floorTop, tiles };
  }, [geo, size]);

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
    <section ref={ref} className="relative h-svh min-h-150 select-none overflow-hidden bg-[#040405]">
      {/* the "camera": wall + niches zoom together toward the chosen niche; the niche itself stays put */}

      <motion.div className="absolute inset-0" style={{ transformOrigin: "0 0" }} initial={false} animate={cam} transition={{ duration: 1.3, ease: EASE }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {world && world.tiles.map(({ ix, iy }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`${ix}:${iy}`} aria-hidden src="/collection/wall.jpg" alt="" draggable={false}
            className="absolute object-cover opacity-90 brightness-[.8] contrast-110"
            style={{
              left: ix * world.W, top: iy * world.H, width: world.W + 1, height: world.H + 1,
              transform: `scale(${ix % 2 ? -1 : 1}, ${iy % 2 ? -1 : 1})`,
            }} />
        ))}

        {/* realistik sayqallangan marmar pol */}
        {world && geo && <Floor world={world} geo={geo} />}
        {geo && (
          <>
            {products.map((p, i) => (
              <Niche
                key={p.slug}
                p={p}
                i={i}
                geo={geo}
                active={active}
                hovered={hovered}
                selected={selected}
                intro={intro}
                setBottle={(el) => {
                  bottles.current[p.slug] = el;
                }}
                onOpen={() => navigate(p.slug)}
                onHover={(on) => {
                  if (!geo.mobile) {
                    setHovered(on ? p.slug : null);
                  }
                }}
                onSelect={() =>
                  setSelected((prev) => (prev === p.slug ? null : p.slug))
                }
              />
            ))}
            {products.map((p, i) => <Label key={p.slug} p={p} i={i} geo={geo} expanded={expanded} hovered={hovered} selected={selected} />)}
          </>
        )}
      </motion.div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000_105%)]" />
      {/* when a niche opens the left side goes black (room for the text) */}
      <motion.div aria-hidden className={cn("pointer-events-none absolute inset-0", mobile ? "bg-linear-to-b from-transparent via-transparent to-black/35" : "bg-linear-to-r from-black via-black/85 to-transparent mask-[linear-gradient(to_right,black_30%,transparent_62%)]")}
        animate={{ opacity: expanded ? 1 : 0 }} transition={{ duration: 0.9, delay: expanded ? 0.3 : 0 }} />
      {/* bottom-left title (wall view): small and quiet, like a boutique */}
      <motion.div
        animate={{ opacity: expanded ? 0 : 1, y: expanded ? 20 : 0 }} transition={{ duration: 0.5, delay: expanded ? 0 : 0.5 }}
        className="pointer-events-none absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between md:bottom-7 md:left-10 md:right-10"
      >
        <div>
          <p className="text-[8px] uppercase tracking-[0.35em] text-[#f5efe6]/55 md:text-[9px]">Maison de parfum · Коллекция №1</p>
          <h1 className="font-display mt-1.5 text-[26px] font-light leading-none md:text-[38px]">Ночная <span className="italic text-[#c9a96e]">коллекция</span></h1>
          <p className="mt-1.5 text-[9px] text-[#f5efe6]/45 md:text-[10px]">Тонкие ароматы, малыми партиями.</p>
        </div>
        {/* <p className="hidden text-right text-[9px] uppercase tracking-[0.3em] text-[#f5efe6]/45 md:block">Нажмите на нишу, чтобы подойти ближе</p> */}
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
            className={cn("absolute z-30", mobile ? "right-3 top-20 flex flex-col gap-2" : "bottom-8 left-[5vw] flex items-center gap-7")}>
            {mobile ? (
              <>
                <RoundBtn small label="Предыдущий" onClick={() => go(-1)}><ArrowLeft className="size-3.5" /></RoundBtn>
                <RoundBtn small label="Следующий" onClick={() => go(1)}><ArrowRight className="size-3.5" /></RoundBtn>
                <RoundBtn small label="Все ароматы" onClick={() => navigate(null)}><X className="size-3.5" /></RoundBtn>
              </>
            ) : (
              <>
                <button onClick={() => navigate(null)} className="group flex items-center gap-2.5 text-[9px] uppercase tracking-[0.3em] text-[#f5efe6]/65 transition-colors hover:text-[#c9a96e]">
                  <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" /> Все ароматы
                </button>
                <div className="flex items-center gap-3 text-[9px] tracking-[0.25em] text-[#f5efe6]/55">
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

function Niche({ p, i, geo, active, hovered, selected, intro, setBottle, onOpen, onHover, onSelect }: {
  p: Product; i: number; geo: Geo; active: string | null; hovered: string | null; intro: boolean;
  selected: string | null; onSelect: () => void;
  setBottle: (el: HTMLDivElement | null) => void; onOpen: () => void; onHover: (on: boolean) => void;
}) {
  const expanded = active !== null;
  const isActive = active === p.slug;
  const hov = geo.mobile
    ? selected === p.slug && !expanded
    : hovered === p.slug && !expanded;
  const c = geo.closed[i];

  const floorTop = Math.max(...geo.closed.map((x) => x.y + x.h)) + (geo.mobile ? 34 : 16);
  const bottom = c.y + c.h;
  const onFloor = bottom >= floorTop - (geo.mobile ? 34 : 16) - 1;
  const reflectDrop = geo.mobile ? 14 : 22; // soya nisha tagidan shuncha pastroqdan boshlanadi
  const reflectGap = floorTop - bottom + reflectDrop;

  const delay = intro ? 0.15 + i * 0.12 : 0;
  // wall brightness: hovered one lights up, the rest sink into the dark
  // the opened niche lights up exactly like a hovered one, but only AFTER the camera has slid to it
  const lit = isActive || hov;
  const wallB = lit ? 1.25 : expanded ? 0.3 : hovered ? 0.4 : 0.8;
  const bottleB = lit ? 1.05 : expanded ? 0.35 : hovered ? 0.5 : 0.85;
  const lightT = { duration: 0.7, delay: isActive ? 0.75 : 0 };

  const bottleY = useMotionValue(0);
  useEffect(() => {
    const ctrl = isActive
      ? animate(bottleY, [null, -10, 0], { duration: 6, ease: "easeInOut", repeat: Infinity })
      : animate(bottleY, hov ? -12 : 0, { duration: 0.6, ease: OUT });
    return () => ctrl.stop();
  }, [isActive, hov, bottleY]);

  const EDGE = { side: 2, top: 2, bottom: 2 };
  const edgeMask =
    `linear-gradient(to right, transparent, black ${EDGE.side}%, black ${100 - EDGE.side}%, transparent),` +
    `linear-gradient(to bottom, transparent, black ${EDGE.top}%, black ${100 - EDGE.bottom}%, transparent)`;

  useEffect(() => {
    if (!isActive) {
      const c = animate(bottleY, hov ? -12 : 0, { duration: 0.6, ease: OUT });
      return () => c.stop();
    }
    // avval 0 ga silliq tushadi, keyin sof suzish sikli (sakrash yo'q)
    let loop: ReturnType<typeof animate> | undefined;
    const settle = animate(bottleY, 0, {
      duration: 0.6,
      ease: OUT,
      onComplete: () => {
        loop = animate(bottleY, [0, -10, 0], { duration: 6, ease: "easeInOut", repeat: Infinity });
      },
    });
    return () => { settle.stop(); loop?.stop(); };
  }, [isActive, hov, bottleY]);

  return (
    <motion.div
      className="absolute"
      style={{ left: c.x, top: c.y, width: c.w, height: c.h, zIndex: isActive ? 10 : 1 }}
      initial={{ y: 70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ y: { duration: 1.1, ease: OUT, delay }, opacity: { duration: 0.7, delay: intro ? delay : 0 } }}
    >
      {/* the niche itself */}
      <motion.div
        className="absolute inset-0 overflow-hidden"   // bg-black ni olib tashlang
        style={{
          maskImage: edgeMask,
          WebkitMaskImage: edgeMask,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
        initial={{ filter: "brightness(0.12)" }}
        animate={{ filter: `brightness(${wallB})` }}
        transition={intro ? { duration: 0.6, delay: 0.5 + i * 0.12 } : lightT}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/collection/niche.jpg`} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
        {/* soft colour of the bottle inside the niche */}
        <motion.div aria-hidden className="absolute bottom-[8%] left-1/2 h-[62%] w-[95%] -translate-x-1/2 mix-blend-screen"
          style={{ background: `radial-gradient(ellipse at 50% 60%, ${p.accent}, transparent 68%)` }}
          animate={{ opacity: lit ? 0.3 : 0 }} transition={lightT} />
        {/* lamp glow */}
        <motion.div aria-hidden className="absolute inset-0 mix-blend-screen bg-[radial-gradient(ellipse_at_50%_12%,rgba(255,236,205,.6),transparent_58%)]"
          animate={{ opacity: lit ? 1 : 0 }} transition={lightT} />
        {/* light cone falling from the lamp */}
        <motion.div aria-hidden className="absolute inset-x-[4%] top-[8%] h-[80%] mix-blend-screen blur-[6px]"
          style={{ background: "linear-gradient(to bottom, rgba(255,240,215,.5), rgba(255,240,215,0) 92%)", clipPath: "polygon(41% 0, 59% 0, 100% 100%, 0 100%)" }}
          animate={{ opacity: lit ? 1 : 0 }} transition={lightT} />
        {/* coloured side light, always softly on, stronger on hover */}
        {/* <motion.div aria-hidden className="absolute inset-y-0 left-0 w-[11%] mix-blend-screen blur-[3px]"
          style={{ background: `linear-gradient(to right, ${p.accent}, transparent)` }}
          animate={{ opacity: lit ? 0.9 : expanded ? 0.15 : 0.5 }} transition={lightT} />
        <motion.div aria-hidden className="absolute inset-y-0 right-0 w-[8%] mix-blend-screen blur-[3px]"
          style={{ background: `linear-gradient(to left, ${p.accent}, transparent)` }}
          animate={{ opacity: lit ? 0.5 : expanded ? 0.08 : 0.2 }} transition={lightT} /> */}
        <div aria-hidden className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,.55)]" />
      </motion.div>

      {/* floor reflection (niche + bottle, mirrored) */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 h-[40%] overflow-hidden blur-[1.5px]"
        style={{ top: `calc(100% + ${reflectGap}px)`, maskImage: "linear-gradient(to bottom, rgba(0,0,0,.55), transparent 85%)", WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,.55), transparent 85%)" }}
        animate={{ opacity: !onFloor ? 0 : expanded ? (isActive ? 1 : 0.3) : hovered && !hov ? 0.4 : 1 }} transition={{ duration: 0.5 }}>
        <div className="absolute inset-x-0 top-0 h-[250%]" style={{ transform: "scaleY(-1)" }}>
          {/* niche image + hover light, mirrored: the reflection lights up together with the niche */}
          <motion.div className="absolute inset-0 overflow-hidden"
            initial={{ filter: "brightness(0.09)" }}
            animate={{ filter: `brightness(${wallB * 0.75})` }}
            transition={intro ? { duration: 0.6, delay: 0.5 + i * 0.12 } : lightT}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/collection/niche.jpg`} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
            <motion.div aria-hidden className="absolute bottom-[8%] left-1/2 h-[62%] w-[95%] -translate-x-1/2 mix-blend-screen"
              style={{ background: `radial-gradient(ellipse at 50% 60%, ${p.accent}, transparent 68%)` }}
              animate={{ opacity: lit ? 0.45 : 0 }} transition={lightT} />
            <motion.div aria-hidden className="absolute inset-0 mix-blend-screen bg-[radial-gradient(ellipse_at_50%_12%,rgba(255,236,205,.6),transparent_58%)]"
              animate={{ opacity: lit ? 1 : 0 }} transition={lightT} />
            <motion.div aria-hidden className="absolute inset-x-[4%] top-[8%] h-[80%] mix-blend-screen blur-[6px]"
              style={{ background: "linear-gradient(to bottom, rgba(255,240,215,.5), rgba(255,240,215,0) 92%)", clipPath: "polygon(41% 0, 59% 0, 100% 100%, 0 100%)" }}
              animate={{ opacity: lit ? 1 : 0 }} transition={lightT} />
          </motion.div>
          <motion.div
            className="absolute bottom-[8%] left-[10%] h-[56%] w-[80%]"
            style={{ y: bottleY }}
            animate={{ opacity: hov ? 0.9 : 1, scaleX: hov ? 0.92 : 1, filter: `brightness(${bottleB})` }}
            transition={{ duration: 0.6, ease: OUT }}
          >
            <Image
              src={p.image}
              alt=""
              fill
              sizes="20vw"
              draggable={false}
              className="object-contain object-bottom"
            />
          </motion.div>
        </div>
      </motion.div>

      {/* the bottle */}
      <motion.div
        className="absolute bottom-[8%] left-[10%] h-[56%] w-[80%]"
        animate={{ filter: `brightness(${bottleB})` }}
        transition={lightT}
      >
        <motion.div
          ref={setBottle}
          className="absolute inset-0"
          style={{ y: bottleY }}
          animate={{ scale: hov ? 1.04 : 1 }}
          transition={{ duration: 0.6, ease: OUT }}
        >
          {/* bottle shadow */}
          <motion.div
            aria-hidden
            className="absolute bottom-[-1%] left-1/2 h-[5%] w-[70%] -translate-x-1/2 rounded-full bg-black/80 blur-md"
            animate={{
              scaleX: hov ? 0.72 : 1,
              opacity: hov ? 0.45 : 0.8,
            }}
            transition={{ duration: 0.6, ease: OUT }}
          />

          <Image
            src={p.image}
            alt={p.name}
            fill
            sizes="(min-width:768px) 28vw, 60vw"
            priority={i < 3}
            draggable={false}
            className="object-contain object-bottom drop-shadow-[0_18px_22px_rgba(0,0,0,.65)]"
          />

          {isActive && (
            <motion.div
              aria-hidden
              className="absolute inset-0 mix-blend-overlay"
              style={{
                background:
                  "linear-gradient(110deg, transparent 38%, rgba(255,255,255,.9) 50%, transparent 62%)",
                backgroundSize: "250% 100%",
                maskImage: `url(${p.image})`,
                WebkitMaskImage: `url(${p.image})`,
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskPosition: "50% 100%",
                WebkitMaskPosition: "50% 100%",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
              }}
              initial={{ backgroundPosition: "150% 0" }}
              animate={{ backgroundPosition: ["150% 0", "-50% 0"] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2.5,
                ease: "easeInOut",
                delay: 1.4,
              }}
            />
          )}
        </motion.div>
      </motion.div>

      {!expanded && (
        <button
          aria-label={`Открыть ${p.name}`}
          onClick={() => {
            if (geo.mobile) {
              if (selected === p.slug) onOpen();
              else onSelect();
            } else {
              onOpen();
            }
          }}
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
          onFocus={() => onHover(true)}
          onBlur={() => onHover(false)}
          className="absolute inset-0 z-20 cursor-pointer touch-manipulation focus-visible:outline focus-visible:outline-[#c9a96e]"
        />
        // focus-visible:outline-2
      )}
    </motion.div>
  );
}

/** name + price under the niche (kept outside the scaled box so text stays sharp) */
function Label({
  p,
  i,
  geo,
  expanded,
  hovered,
  selected,
}: {
  p: Product;
  i: number;
  geo: Geo;
  expanded: boolean;
  hovered: string | null;
  selected: string | null;
}) {
  const c = geo.closed[i];

  const on = !expanded && (
    geo.mobile
      ? selected === p.slug
      : hovered === p.slug
  );

  return (
    <motion.div
      className="pointer-events-none absolute z-10 text-center"
      style={{
        left: c.x - 24,
        top: c.y + c.h + 10,
        width: c.w + 48,
      }}
      animate={{
        opacity: on ? 1 : 0,
        y: on ? 0 : 6,
      }}
      transition={{ duration: 0.45 }}
    >
      <p className="font-display text-[13px] leading-tight text-[#f5efe6] md:text-lg">
        {p.name}
      </p>

      <p className="mt-0.5 text-[7px] uppercase tracking-[0.22em] text-[#f5efe6]/50 md:text-[8px]">
        N°{String(i + 1).padStart(2, "0")} · {formatPrice(p.prices[50])}
      </p>
    </motion.div>
  );
}

function RoundBtn({ children, label, onClick, small }: { children: React.ReactNode; label: string; onClick: () => void; small?: boolean }) {
  return (
    <button aria-label={label} title={label} onClick={onClick}
      className={cn("grid place-items-center rounded-full border border-[#c9a96e]/35 bg-black/50 text-[#f5efe6] backdrop-blur transition hover:border-[#c9a96e] hover:bg-[#c9a96e]/15", small ? "size-8" : "size-11")}>
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
      className={cn("absolute z-30", mobile ? "inset-x-0 bottom-0 bg-linear-to-t from-black via-black/90 to-transparent px-5 pb-5 pt-14" : "left-[5vw] top-1/2 w-[min(24vw,320px)] -translate-y-1/2")}
    >
      <motion.p variants={item} className="text-[8px] uppercase tracking-[0.35em] text-[#f5efe6]/55 md:text-[9px]">N°{String(products.findIndex((x) => x.slug === p.slug) + 1).padStart(2, "0")} · {genderLabel[p.gender]}</motion.p>
      <h2 className="font-display mt-1.5 overflow-hidden pb-1 text-[34px] font-light leading-[1.05] md:text-[48px]">
        <motion.span className="block" variants={{ hidden: { y: "110%" }, show: { y: 0, transition: { duration: 1, ease: OUT } } }}>
          {first} <span className="italic" style={{ color: p.accent }}>{rest.join(" ")}</span>
        </motion.span>
      </h2>
      <motion.p variants={item} className="text-[11px] italic text-[#c9a96e]/80">{p.tagline}</motion.p>
      <motion.p variants={item} className="mt-2 text-[11px] leading-relaxed text-[#f5efe6]/60 md:mt-3">{p.description}</motion.p>

      <dl className="mt-3 hidden space-y-1.5 text-[11px] md:block">
        {([["Верхние", p.notes.top], ["Сердце", p.notes.heart], ["База", p.notes.base]] as const).map(([k, v]) => (
          <motion.div variants={item} key={k} className="flex gap-3 border-b border-white/10 pb-1.5">
            <dt className="w-14 shrink-0 text-[8px] uppercase tracking-widest text-[#a89c8a]">{k}</dt>
            <dd className="text-[#f5efe6]/90">{v.join(" · ")}</dd>
          </motion.div>
        ))}
      </dl>

      <motion.div variants={item} className="mt-3 flex gap-1.5 md:mt-4">
        {([50, 100] as Volume[]).map((v) => (
          <button key={v} onClick={() => setVolume(v)} className={cn("relative rounded-full border px-4 py-1.5 text-[11px] transition-colors", volume === v ? "border-[#c9a96e] text-[#0a0908]" : "border-[#c9a96e]/30 text-[#f5efe6]/75 hover:border-[#c9a96e]/70")}>
            {volume === v && <motion.span layoutId="vol-pill" className="absolute inset-0 rounded-full bg-[#c9a96e]" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
            <span className="relative font-medium">{v} мл</span>
          </button>
        ))}
      </motion.div>

      <motion.div variants={item} className="mt-4 flex items-center justify-between gap-3 md:mt-5">
        <div className="font-display text-2xl text-[#f5efe6]"><AnimatedPrice value={p.prices[volume]} /></div>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onAdd} className="group inline-flex items-center gap-2 border-b border-[#c9a96e] pb-0.5 text-[10px] font-medium uppercase tracking-[0.25em] text-[#f5efe6] transition-colors hover:text-[#c9a96e]">
          {added ? <><Check className="size-3.5" /> Добавлено</> : <><ShoppingBag className="size-3.5" /> В корзину <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></>}
        </motion.button>
      </motion.div>
      {added && <button onClick={() => setCartOpen(true)} className="mt-2 text-[11px] text-[#c9a96e] underline underline-offset-4">Открыть корзину →</button>}
    </motion.div>
  );
}