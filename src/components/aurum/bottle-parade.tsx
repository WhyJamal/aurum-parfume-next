"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight } from "lucide-react";
import { products, type Product } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { MovingBorderButton } from "@/components/aceternity/moving-border";

const depth = [70, -30, 110, -70, 50]; // every bottle moves at its own speed

export function BottleParade() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bigX = useTransform(scrollYProgress, [0, 1], ["8%", "-45%"]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#0a0908] py-28 md:py-40">
      {/* giant outlined word sliding behind the bottles */}
      <motion.div
        aria-hidden
        style={{ x: reduce ? 0 : bigX, WebkitTextStroke: "1px rgba(201,169,110,.2)" }}
        className="font-display pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-[34vw] font-light leading-none text-transparent"
      >
        AURUM · AURUM · AURUM
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs uppercase tracking-[0.5em] text-[#c9a96e]">Коллекция</motion.p>
        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="font-display mt-4 max-w-3xl text-5xl font-light leading-[1] md:text-7xl">
          Пять историй. <span className="italic text-[#c9a96e]">Один бренд.</span>
        </motion.h2>
        <p className="mt-5 max-w-md text-[#f5efe6]/65">Каждый флакон хранит свой характер. Нажмите на любой, чтобы открыть его в коллекции.</p>

        <div className="mt-20 flex flex-wrap justify-center gap-y-16 md:mt-28">
          {products.map((p, i) => <Bottle key={p.slug} product={p} index={i} progress={scrollYProgress} reduce={!!reduce} />)}
        </div>

        <div className="mt-20 flex justify-center">
          <MovingBorderButton as={Link} href="/collection">Открыть коллекцию <ArrowRight className="size-4" /></MovingBorderButton>
        </div>
      </div>
    </section>
  );
}

function Bottle({ product, index, progress, reduce }: { product: Product; index: number; progress: MotionValue<number>; reduce: boolean }) {
  const d = depth[index % depth.length];
  const y = useTransform(progress, [0, 1], [d, -d]);
  const rotate = useTransform(progress, [0, 1], [index % 2 ? -6 : 6, index % 2 ? 6 : -6]);
  return (
    <motion.div style={{ y: reduce ? 0 : y, rotate: reduce ? 0 : rotate }} className="w-1/2 sm:w-1/3 md:w-1/5">
      <Link href={`/collection#${product.slug}`} className="group relative flex flex-col items-center">
        <div aria-hidden className="absolute top-[38%] size-3/4 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-70" style={{ background: product.accent }} />
        <Image src={product.image} alt={product.name} width={300} height={400} className="relative h-[190px] w-auto object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,.65)] transition-transform duration-500 group-hover:-translate-y-4 group-hover:scale-110 md:h-[300px]" />
        <p className="font-display relative mt-5 text-2xl text-[#f5efe6]">{product.name}</p>
        <p className="relative text-xs text-[#c9a96e]">от {formatPrice(product.prices[50])}</p>
      </Link>
    </motion.div>
  );
}
