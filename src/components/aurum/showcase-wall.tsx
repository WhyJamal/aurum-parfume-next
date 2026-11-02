"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
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
interface Geo {
  mobile: boolean; W: number; ow: number; oh: number; ox: number; oy: number; gap: number; closed: Rect[];
  /** silindr: nishalar orasidagi burchak (rad), markazdagi nishalar orasi (px), proyeksiya koeffitsiyenti */
  delta: number; pitch: number; F: number;
  /** pol bilan devor tutashuvi chetlarda shuncha px pastga tushadi (silindr egriligi) */
  sag: number;
}

/* ------------------------------------------------------------------ */
/* Cylinder carousel. Tomoshabin silindr ichida turibdi: nishalar      */
/* aylana bo'ylab turadi, aylantirganda cheksiz davom etadi.           */
/* Slotlar soni atirlar sonining karrasi, shuning uchun aylanish        */
/* chokida sakrash yo'q.                                                */
/* ------------------------------------------------------------------ */
const D2R = 180 / Math.PI;
const slotCount = (n: number) => n * Math.ceil(8 / n);
/** slot farqini [-S/2, S/2) oralig'iga o'raydi */
const wrapSlot = (d: number, S: number) => ((((d + S / 2) % S) + S) % S) - S / 2;
/** berilgan atirning hozirgi burchakka eng yaqin slotini topadi */
function nearestSlot(i: number, r: number, n: number, S: number) {
  let best = i, bd = Infinity;
  for (let k = i; k < S; k += n) {
    const d = Math.abs(wrapSlot(k - r, S));
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}

/** devor/pol tutashuvi ekran x ga qarab qanchaga pastga tushadi (markazda 0, chetlarda ko'proq: ∩ shakl) */
const sagAt = (X: number, F: number, sag: number) => {
  const th = Math.min(2 * Math.atan(Math.abs(X) / F), 2.1);
  return sag * (2 / (1 + Math.cos(th)) - 1);
};

function getGeo(W: number, H: number, n: number): Geo {
  const mobile = W < 768;
  const top = mobile ? 72 : 96;

  // open (expanded) niche
  const oh = mobile ? Math.min((H - top) * 0.44, (W * 0.74) / AR) : Math.min(H - top - 36, (W * 0.34) / AR);
  const ow = oh * AR;
  const ox = (mobile ? W / 2 : W * 0.6) - ow / 2;
  const oy = mobile ? top : top + (H - top - 36 - oh) / 2;

  // markazdagi (yopiq) nisha; qolgan slotlar shu o'lchamdan silindrga proyeksiya qilinadi
  let h: number, y: number;
  if (mobile) {
    const avail = H - top - 150;
    h = Math.min(avail * 0.82, (W * 0.36) / AR);
    y = top + Math.max(0, (avail - h) / 2) + 8;
  } else {
    h = Math.min(H * 0.46, (W * 0.17) / AR);
    y = top + Math.max(0, (H - top - 170 - h) / 2) + 8;
  }
  const w = h * AR;
  const pitch = w * 1.12;
  const delta = 0.4538; // ~26 daraja: desktopda 5 ta atir ko'rinadi
  const F = (2 * pitch) / delta;
  const c: Rect = { x: W / 2 - w / 2, y, w, h, s: h / oh };
  return { mobile, W, ow, oh, ox, oy, gap: W * 0.18, closed: Array.from({ length: n }, () => c), delta, pitch, F, sag: h * 0.38 };
}

/** Har bir slotning silindrdagi o'rni: ekrandagi x, o'lcham, burilish, xiralik (barchasi MotionValue, React rerender yo'q) */
function useSlot(rot: MotionValue<number>, slot: number, gref: { current: Geo | null }, S: number) {
  const off = useTransform(rot, (r) => wrapSlot(slot - r, S));
  const th = useTransform(off, (o) => o * (gref.current?.delta ?? 0.45));
  // kamera o'qdan R masofa orqada: x = F·tan(θ/2), o'lcham = 2/(1+cosθ) -> chetlari biroz kattaroq, devor "o'rab olgandek"
  const x = useTransform(th, (t) => (gref.current?.F ?? 0) * Math.tan(t / 2));
  const scale = useTransform(th, (t) => 2 / (1 + Math.cos(t)));
  // chetdagi nishalar polning egriligi bo'ylab pastroq turadi
  const y = useTransform(th, (t) => (gref.current?.sag ?? 0) * (2 / (1 + Math.cos(Math.min(Math.abs(t), 2.1))) - 1));
  const rotateY = useTransform(th, (t) => -t * D2R * 0.3);
  const filter = useTransform(th, (t) => `brightness(${1 - Math.min(1, (Math.abs(t) * D2R) / 60) * 0.42})`);
  const zIndex = useTransform(th, (t) => Math.max(1, 10 - Math.round((Math.abs(t) * D2R) / 8)));
  // niche hech qachon so'nmaydi: u ekran chetidan tashqarida "kutib turadi" va aylanganda ichkariga kirib keladi
  const pointerEvents = useTransform(th, (t) => (Math.abs(t) * D2R > 80 ? ("none" as const) : ("auto" as const)));
  return { x, y, scale, rotateY, filter, zIndex, pointerEvents };
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

function VSeam({ k, u, cx, V, h, shift }: { k: number; u: number; cx: number; V: number; h: number; shift: MotionValue<number> }) {
  const x2 = useTransform(shift, (s) => cx + k * u + s);
  const x2b = useTransform(x2, (v) => v + 2);
  return (
    <>
      <motion.line x1={cx} y1={-V} x2={x2} y2={h} stroke="rgba(0,0,0,.65)" strokeWidth={2.2} />
      <motion.line x1={cx + 2} y1={-V} x2={x2b} y2={h} stroke="rgba(255,255,255,.07)" strokeWidth={1} />
    </>
  );
}

function Floor({ world, geo, rot }: { world: { W: number; H: number; minX: number; maxX: number; maxY: number; floorTop: number }; geo: Geo; rot: MotionValue<number> }) {
  const w = world.maxX - world.minX;
  const h = world.maxY - world.floorTop;
  const cx = world.W / 2 - world.minX;
  const pitchRef = useRef(geo.pitch);
  useLayoutEffect(() => {
    pitchRef.current = geo.pitch;
    rot.set(rot.get() + 1e-9); // transformlarni yangi o'lchamga qayta hisoblatadi
  }, [geo.pitch, rot]);

  // perspective tile seams: a vanishing point above the floor, depth spacing shrinks toward the wall
  const seams = useMemo(() => {
    const V = world.H * 0.38;                 // horizon height above the wall/floor line
    const zf = 1, step = 0.085;
    const horiz: number[] = [];
    for (let z = zf; z > 0.14; z -= step) horiz.push((V * zf) / z - V);
    const u = Math.max(260, world.W * 0.34);  // vertikal chok oralig'i (pastki chetda)
    const nV = Math.ceil(w / u) + 3;
    return { V, horiz, u, nV };
  }, [world.H, world.W, w]);

  // pol silindr bilan birga aylanadi: choklar va tomirlar rot ga ergashadi
  const shift = useTransform(rot, (r) => ((((-r * pitchRef.current * 1.1) % seams.u) + seams.u) % seams.u));
  const veinA = useTransform(rot, (r) => `${-r * pitchRef.current * 1.1}px`);
  const veinB = useTransform(rot, (r) => `${180 - r * pitchRef.current * 0.9}px`);

  // devor/pol tutashuvi egri chiziq (chetlarda pastroq, o'rtada balandroq)
  const curve = useMemo(() => {
    const step = 48;
    const pts: { x: number; s: number }[] = [];
    for (let x = 0; x <= w + step; x += step) pts.push({ x, s: sagAt(x + world.minX - world.W / 2, geo.F, geo.sag) });
    return pts;
  }, [w, world.minX, world.W, geo.F, geo.sag]);
  const pathAt = (off: number) => `M ${curve.map((p) => `${p.x} ${p.s + off}`).join(" L ")}`;
  const clip = `polygon(${curve.map((p) => `${p.x}px ${p.s}px`).join(",")},${w}px ${h}px,0px ${h}px)`;

  const h0 = h;
  return (
    <div aria-hidden className="absolute overflow-hidden" style={{
      left: world.minX, width: w, top: world.floorTop, height: h, clipPath: clip,
      background: `linear-gradient(to bottom, #1d1d22 0px, #101014 ${h0 * 0.12}px, #08080b ${h0 * 0.4}px, #030304 ${h0}px)`,
    }}>
      {/* marble veins (fade with distance: crisper near the viewer) */}
      <motion.div className="absolute inset-0 mix-blend-screen opacity-[.16]" style={{
        backgroundImage: VEINS_A, backgroundSize: "1400px 800px", backgroundPositionX: veinA,
        maskImage: "linear-gradient(to bottom, rgba(0,0,0,.25), black 55%)", WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,.25), black 55%)",
      }} />
      <motion.div className="absolute inset-0 mix-blend-screen opacity-[.09]" style={{ backgroundImage: VEINS_B, backgroundSize: "900px 520px", backgroundPositionX: veinB, backgroundPositionY: "90px" }} />
      {/* polished-stone micro grain */}
      <div className="absolute inset-0 mix-blend-overlay opacity-[.10]" style={{ backgroundImage: GRAIN, backgroundSize: "400px 400px" }} />

      {/* tile seams in perspective (dark groove + thin light edge) */}
      <svg className="absolute inset-0" width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <g stroke="rgba(0,0,0,.65)" strokeWidth="2.2" fill="none">
          {seams.horiz.map((y, i) => <path key={`h${i}`} d={pathAt(y)} />)}
        </g>
        <g stroke="rgba(255,255,255,.07)" strokeWidth="1" fill="none">
          {seams.horiz.map((y, i) => <path key={`hl${i}`} d={pathAt(y + 2)} />)}
        </g>
        {Array.from({ length: seams.nV * 2 + 1 }, (_, j) => j - seams.nV).map((k) => (
          <VSeam key={`v${k}`} k={k} u={seams.u} cx={cx} V={seams.V} h={h} shift={shift} />
        ))}
      </svg>

      {/* broad glossy sheen, strongest on the vertical axis of the room */}
      <div className="absolute inset-0 mix-blend-screen" style={{ background: `radial-gradient(ellipse ${0.75 * world.W}px ${0.6 * h0}px at ${cx}px 0px, rgba(255,255,255,.11), transparent 70%)` }} />
      <div className="absolute inset-0 mix-blend-soft-light" style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.16) 46%, transparent 58%)" }} />

      {/* wall / floor junction (egri): yorqin plinth aksi, ostida esa kontakt soya */}
      <svg className="absolute inset-0" width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" fill="none">
        {Array.from({ length: 14 }, (_, j) => (
          <path key={`g${j}`} d={pathAt(3 + j * 4)} stroke={`rgba(255,255,255,${(0.1 * (1 - j / 14)).toFixed(3)})`} strokeWidth="4.5" />
        ))}
        {Array.from({ length: 4 }, (_, j) => (
          <path key={`d${j}`} d={pathAt(j * 3)} stroke={`rgba(0,0,0,${(0.6 * (1 - j / 4)).toFixed(3)})`} strokeWidth="3.5" />
        ))}
        <path d={pathAt(0)} stroke="rgba(255,255,255,.35)" strokeWidth="1" />
      </svg>
      {/* near edge falls into darkness */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/70 to-transparent" />
    </div>
  );
}

export function ShowcaseWall() {
  const n = products.length;
  const S = slotCount(n);
  const [active, setActive] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [intro, setIntro] = useState(true);
  const ref = useRef<HTMLElement>(null);
  const bottles = useRef<Record<number, HTMLDivElement | null>>({});
  const touched = useRef(false);

  // silindrning burchagi: butun son = bitta nisha aniq markazda. Cheksiz (manfiy ham bo'ladi).
  const rot = useMotionValue(0);
  const spin = useRef<ReturnType<typeof animate> | null>(null);
  const drag = useRef({ moved: 0, lastX: 0, lastT: 0, v: 0 });
  const wheelT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const idx = active ? products.findIndex((p) => p.slug === active) : -1;
  const expanded = active !== null;
  const geo = useMemo(() => (size.w ? getGeo(size.w, size.h, n) : null), [size, n]);
  const gref = useRef<Geo | null>(null);
  useLayoutEffect(() => {
    gref.current = geo;
    rot.set(rot.get() + 1e-9); // slot transformlarini yangi geometriya bilan qayta hisoblatadi
  }, [geo, rot]);

  const spinTo = (target: number, kind: "spring" | "slow" = "spring") => {
    spin.current?.stop();
    spin.current = animate(rot, target, kind === "spring"
      ? { type: "spring", stiffness: 70, damping: 18, mass: 0.9 }
      : { duration: 1.3, ease: EASE });
  };

  const navigate = (slug: string | null, slot?: number) => {
    setHovered(null);
    setSelected(null);
    setActive(slug);
    if (!slug) { setActiveSlot(null); return; }
    const i = products.findIndex((p) => p.slug === slug);
    const r = rot.get();
    const s = slot ?? nearestSlot(i, r, n, S);
    setActiveSlot(s);
    // tanlangan atir aynan markazga kelguncha silindr aylanadi (eng qisqa yo'l bilan)
    spinTo(r + wrapSlot(s - r, S), "slow");
  };

  const go = (d: number) => {
    const next = products[(idx + d + n) % n].slug;
    navigate(next, ((activeSlot ?? 0) + d + S * 4) % S);
  };

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
    // devor rasmi mirror (oynadek) qilib yoyiladi, shuning uchun chokda chiziq bo'lmaydi.
    // Aylanishda devor suriladi, shuning uchun o'ng tomonga 2 ta qo'shimcha plitka qo'shilgan.
    const x0 = Math.floor(minX / W), x1 = Math.ceil(maxX / W) + 2;
    const y0 = Math.floor(minY / H), y1 = Math.ceil(maxY / H);
    const tiles: { ix: number; iy: number }[] = [];
    for (let iy = y0; iy < y1; iy++) for (let ix = x0; ix < x1; ix++) tiles.push({ ix, iy });
    return { W, H, minX, maxX, maxY, floorTop, tiles };
  }, [geo, size]);

  // devor silindr bilan birga suriladi (mirror davri = 2 ta plitka)
  const wallX = useTransform(rot, (r) => {
    const g = gref.current;
    if (!g) return 0;
    const m = 2 * g.W;
    return -((((r * g.pitch) % m) + m) % m);
  });

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
    const i = products.findIndex((p) => p.slug === h);
    if (i < 0) return;
    const s = nearestSlot(i, 0, n, S);
    setActive(h);
    setActiveSlot(s);
    rot.set(wrapSlot(s, S));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (active) { touched.current = true; window.history.replaceState(null, "", `#${active}`); }
    else if (touched.current) { window.history.replaceState(null, "", window.location.pathname); setHovered(null); }
  }, [active]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (active) {
        if (e.key === "Escape") navigate(null);
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      } else {
        if (e.key === "ArrowRight") spinTo(Math.round(rot.get()) + 1);
        if (e.key === "ArrowLeft") spinTo(Math.round(rot.get()) - 1);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, idx, activeSlot]);

  // sichqoncha / barmoq bilan aylantirish (cheksiz), qo'yib yuborganda eng yaqin nishaga "yopishadi"
  const onPointerDown = (e: React.PointerEvent) => {
    if (expanded || !geo) return;
    spin.current?.stop();
    const d = drag.current;
    d.moved = 0; d.lastX = e.clientX; d.lastT = performance.now(); d.v = 0;
    const pitch = geo.pitch;
    const move = (ev: PointerEvent) => {
      const now = performance.now();
      const dx = ev.clientX - d.lastX;
      const dt = Math.max(1, now - d.lastT);
      d.moved += Math.abs(dx);
      rot.set(rot.get() - dx / pitch);
      d.v = d.v * 0.7 + (dx / dt) * 0.3;
      d.lastX = ev.clientX; d.lastT = now;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (d.moved > 0) {
        const extra = Math.max(-4, Math.min(4, (d.v * 260) / pitch));
        spinTo(Math.round(rot.get() - extra));
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const onWheel = (e: React.WheelEvent) => {
    if (expanded || !geo) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    spin.current?.stop();
    rot.set(rot.get() + d / (geo.pitch * 1.4));
    if (wheelT.current) clearTimeout(wheelT.current);
    wheelT.current = setTimeout(() => spinTo(Math.round(rot.get())), 140);
  };

  const mobile = geo?.mobile ?? false;

  // The camera: wall + niches are scaled together toward the chosen niche (the niche never moves relative to the wall).
  // Tanlangan nisha doim markazga aylantirib keltiriladi, shuning uchun kamera nishoni qo'zg'almas.
  const cam = (() => {
    if (!geo || idx < 0) return { x: 0, y: 0, scale: 1 };
    const c = geo.closed[idx];
    const k = geo.oh / c.h;
    return { x: geo.ox - k * c.x, y: geo.oy - k * c.y, scale: k };
  })();

  return (
    <section ref={ref} onPointerDown={onPointerDown} onWheel={onWheel}
      className={cn("relative h-svh min-h-150 select-none overflow-hidden bg-[#040405] touch-pan-y", !expanded && "cursor-grab active:cursor-grabbing")}>
      {/* the "camera": wall + niches zoom together toward the chosen niche; the niche itself stays put */}

      <motion.div className="absolute inset-0" style={{ transformOrigin: "0 0" }} initial={false} animate={cam} transition={{ duration: 1.3, ease: EASE }}>
        {/* devor: silindr aylanganda yon tomonga suriladi */}
        <motion.div aria-hidden className="absolute inset-0" style={{ x: wallX }}>
          {world && world.tiles.map(({ ix, iy }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${ix}:${iy}`} aria-hidden src="/collection/wall.jpg" alt="" draggable={false}
              className="absolute object-cover opacity-90 brightness-[.8] contrast-110"
              style={{
                left: ix * world.W, top: iy * world.H, width: world.W + 1, height: world.H + 1,
                transform: `scale(${ix % 2 ? -1 : 1}, ${iy % 2 ? -1 : 1})`,
              }} />
          ))}
        </motion.div>

        {/* realistik sayqallangan marmar pol */}
        {world && geo && <Floor world={world} geo={geo} rot={rot} />}
        {geo && (
          <>
            {Array.from({ length: S }, (_, k) => {
              const i = k % n;
              const p = products[i];
              return (
                <Niche
                  key={k}
                  p={p}
                  i={i}
                  slot={k}
                  S={S}
                  rot={rot}
                  gref={gref}
                  geo={geo}
                  active={active}
                  activeSlot={activeSlot}
                  hovered={hovered}
                  selected={selected}
                  intro={intro}
                  canOpen={() => drag.current.moved <= 6}
                  setBottle={(el) => {
                    bottles.current[k] = el;
                  }}
                  onOpen={() => navigate(p.slug, k)}
                  onHover={(on) => {
                    if (!geo.mobile) {
                      setHovered(on ? k : null);
                    }
                  }}
                  onSelect={() =>
                    setSelected((prev) => (prev === k ? null : k))
                  }
                />
              );
            })}
            {Array.from({ length: S }, (_, k) => (
              <Label key={k} p={products[k % n]} i={k % n} slot={k} S={S} rot={rot} gref={gref} geo={geo} expanded={expanded} hovered={hovered} selected={selected} />
            ))}
          </>
        )}
      </motion.div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000_105%)]" />
      {/* silindr chetlari: yon tomonlar qorong'iga cho'kadi */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,.7),transparent_16%,transparent_84%,rgba(0,0,0,.7))]" />
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
      </motion.div>

      {/* silindrni aylantirish tugmalari (wall view) */}
      <motion.div
        animate={{ opacity: expanded ? 0 : 1 }} transition={{ duration: 0.4 }}
        className={cn("absolute z-20 flex items-center gap-3", expanded && "pointer-events-none", mobile ? "bottom-5 right-5" : "bottom-8 right-10")}
      >
        <RoundBtn label="Назад" onClick={() => spinTo(Math.round(rot.get()) - 1)}><ArrowLeft className="size-4" /></RoundBtn>
        <RoundBtn label="Вперёд" onClick={() => spinTo(Math.round(rot.get()) + 1)}><ArrowRight className="size-4" /></RoundBtn>
      </motion.div>

      {/* product view */}
      <AnimatePresence mode="wait">
        {active && geo && (
          <InfoPanel
            key={active} product={products[idx]} mobile={mobile}
            getRect={() => bottles.current[activeSlot ?? -1]?.getBoundingClientRect()}
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

function Niche({ p, i, slot, S, rot, gref, geo, active, activeSlot, hovered, selected, intro, canOpen, setBottle, onOpen, onHover, onSelect }: {
  p: Product; i: number; slot: number; S: number; rot: MotionValue<number>; gref: { current: Geo | null };
  geo: Geo; active: string | null; activeSlot: number | null; hovered: number | null; intro: boolean;
  selected: number | null; onSelect: () => void; canOpen: () => boolean;
  setBottle: (el: HTMLDivElement | null) => void; onOpen: () => void; onHover: (on: boolean) => void;
}) {
  const expanded = active !== null;
  const isActive = activeSlot === slot;
  const hov = geo.mobile
    ? selected === slot && !expanded
    : hovered === slot && !expanded;
  const c = geo.closed[i];
  const m = useSlot(rot, slot, gref, S);

  const floorTop = Math.max(...geo.closed.map((x) => x.y + x.h)) + (geo.mobile ? 34 : 16);
  const bottom = c.y + c.h;
  const onFloor = bottom >= floorTop - (geo.mobile ? 34 : 16) - 1;
  const reflectDrop = geo.mobile ? 14 : 22; // soya nisha tagidan shuncha pastroqdan boshlanadi
  const reflectGap = floorTop - bottom + reflectDrop;

  const delay = intro ? 0.15 + i * 0.12 : 0;
  // wall brightness: hovered one lights up, the rest sink into the dark
  // the opened niche lights up exactly like a hovered one, but only AFTER the camera has slid to it
  const lit = isActive || hov;
  const wallB = lit ? 1.25 : expanded ? 0.3 : hovered !== null ? 0.4 : 0.8;
  const bottleB = lit ? 1.05 : expanded ? 0.35 : hovered !== null ? 0.5 : 0.85;
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
      style={{
        left: c.x, top: c.y, width: c.w, height: c.h, transformOrigin: "50% 100%", transformPerspective: 1100,
        x: m.x, y: m.y, scale: m.scale, rotateY: m.rotateY, filter: m.filter,
        zIndex: isActive ? 30 : m.zIndex, pointerEvents: m.pointerEvents,
      }}
    >
    <motion.div
      className="absolute inset-0"
      initial={{ y: 70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ y: { duration: 1.1, ease: OUT, delay }, opacity: { duration: 0.7, delay: intro ? delay : 0 } }}
    >
      {/* polda nisha yorug'ligi dog'i (nisha bilan birga aylanadi) */}
      <motion.div aria-hidden className="pointer-events-none absolute"
        style={{ left: "-40%", width: "180%", height: Math.max(70, c.h * 0.22), top: `calc(100% + ${floorTop - bottom - 6}px)`, background: "radial-gradient(ellipse at 50% 20%, rgba(255,226,180,.26), rgba(255,226,180,.08) 45%, transparent 70%)" }}
        animate={{ opacity: lit ? 1 : 0.45 }} transition={lightT} />

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
        animate={{ opacity: !onFloor ? 0 : expanded ? (isActive ? 1 : 0.3) : hovered !== null && !hov ? 0.4 : 1 }} transition={{ duration: 0.5 }}>
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
            if (!canOpen()) return;
            if (geo.mobile) {
              if (selected === slot) onOpen();
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
    </motion.div>
  );
}

/** name + price under the niche (kept outside the scaled box so text stays sharp) */
function Label({
  p,
  i,
  slot,
  S,
  rot,
  gref,
  geo,
  expanded,
  hovered,
  selected,
}: {
  p: Product;
  i: number;
  slot: number;
  S: number;
  rot: MotionValue<number>;
  gref: { current: Geo | null };
  geo: Geo;
  expanded: boolean;
  hovered: number | null;
  selected: number | null;
}) {
  const c = geo.closed[i];
  const m = useSlot(rot, slot, gref, S);

  const on = !expanded && (
    geo.mobile
      ? selected === slot
      : hovered === slot
  );

  return (
    <motion.div
      className="pointer-events-none absolute z-10"
      style={{ left: c.x - 24, top: c.y + c.h + 10, width: c.w + 48, x: m.x, y: m.y }}
    >
      <motion.div
        className="text-center"
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