"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, X, Trash2, ArrowLeft, Check } from "lucide-react";
import { useCart, useUI, cartTotals } from "@/lib/store";
import { getProduct, FREE_DELIVERY_FROM } from "@/lib/products";
import { formatPrice, cn } from "@/lib/utils";
import { useMounted } from "@/lib/hooks";
import { AnimatedPrice } from "./animated-number";

type Step = "cart" | "form" | "done";
type Pay = "cash" | "click" | "payme";

function formatPhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  d = d.slice(0, 9);
  const [a, b, c, e] = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)];
  if (!d) return "";
  let out = `+998 (${a}`;
  if (a.length === 2) out += ")";
  if (b) out += ` ${b}`;
  if (c) out += `-${c}`;
  if (e) out += `-${e}`;
  return out;
}

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI();
  const { lines, setQty, remove, clear } = useCart();
  const mounted = useMounted();
  const [step, setStep] = useState<Step>("cart");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [pay, setPay] = useState<Pay>("cash");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  const safeLines = mounted ? lines : [];
  const { subtotal, delivery, total } = cartTotals(safeLines);
  const progress = Math.min(subtotal / FREE_DELIVERY_FROM, 1);

  useEffect(() => {
    document.documentElement.style.overflow = cartOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, setCartOpen]);

  const close = () => {
    setCartOpen(false);
    setTimeout(() => step === "done" && setStep("cart"), 400);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Введите имя");
    if (phone.replace(/\D/g, "").length !== 12) return setError("Введите номер телефона полностью");
    if (address.trim().length < 5) return setError("Введите адрес");
    setSending(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address, comment, pay, lines }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Ошибка");
      setOrderId(data.orderId);
      clear();
      setStep("done");
    } catch {
      setError("Не удалось отправить. Попробуйте ещё раз или позвоните нам.");
    } finally {
      setSending(false);
    }
  };

  const input = "w-full rounded-xl border border-[#c9a96e]/25 bg-[#0a0908] px-4 py-3 text-sm text-[#f5efe6] outline-none transition placeholder:text-[#a89c8a]/60 focus:border-[#c9a96e] focus:shadow-[0_0_0_3px_rgba(201,169,110,.15)]";

  return (
    <AnimatePresence>
      {cartOpen && (
        <motion.div className="fixed inset-0 z-[85]" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.aside
            data-lenis-prevent role="dialog" aria-modal="true" aria-label="Корзина"
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[#c9a96e]/25 bg-[#0f0c0a]"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-[#c9a96e]/15 p-5">
              {step === "form" ? (
                <button onClick={() => setStep("cart")} className="flex items-center gap-2 text-sm text-[#c9a96e]"><ArrowLeft className="size-4" /> Назад в корзину</button>
              ) : (
                <h2 className="font-display text-3xl">{step === "done" ? "Спасибо!" : "Корзина"}</h2>
              )}
              <button onClick={close} aria-label="Закрыть" className="grid size-10 place-items-center rounded-full border border-[#c9a96e]/30"><X className="size-5" /></button>
            </div>

            {step === "cart" && (
              <>
                <div className="px-5 pt-5">
                  <p className="text-sm text-[#f5efe6]/80">
                    {subtotal >= FREE_DELIVERY_FROM ? "Бесплатная доставка ваша! 🎉" : <>До бесплатной доставки ещё <b className="text-[#c9a96e]">{formatPrice(FREE_DELIVERY_FROM - subtotal)}</b></>}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#c9a96e]/15">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-[#c9a96e] to-[#f3dca6]" animate={{ width: `${progress * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                  </div>
                </div>

                <ul className="flex-1 space-y-3 p-5">
                  <AnimatePresence initial={false}>
                    {safeLines.map((l) => {
                      const p = getProduct(l.slug);
                      if (!p) return null;
                      return (
                        <motion.li layout key={`${l.slug}-${l.volume}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }}
                          className="flex gap-4 rounded-2xl border border-[#c9a96e]/15 bg-[#c9a96e]/[0.03] p-3">
                          <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-[#0a0908]"><Image src={p.image} alt={p.name} width={60} height={80} className="h-16 w-auto object-contain" /></div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <div><p className="font-display text-xl leading-tight">{p.name}</p><p className="text-xs text-[#a89c8a]">{l.volume} ml</p></div>
                              <button onClick={() => remove(l.slug, l.volume)} aria-label="Удалить" className="text-[#a89c8a] hover:text-red-400"><Trash2 className="size-4" /></button>
                            </div>
                            <div className="mt-auto flex items-center justify-between pt-2">
                              <div className="flex items-center gap-1 rounded-full border border-[#c9a96e]/25">
                                <button onClick={() => setQty(l.slug, l.volume, l.qty - 1)} aria-label="Уменьшить" className="grid size-8 place-items-center"><Minus className="size-3.5" /></button>
                                <span className="w-5 text-center text-sm">{l.qty}</span>
                                <button onClick={() => setQty(l.slug, l.volume, l.qty + 1)} aria-label="Увеличить" className="grid size-8 place-items-center"><Plus className="size-3.5" /></button>
                              </div>
                              <span className="text-sm">{formatPrice(p.prices[l.volume] * l.qty)}</span>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                  {safeLines.length === 0 && (
                    <div className="grid place-items-center py-20 text-center">
                      <p className="font-display text-3xl text-[#f5efe6]/80">Корзина пуста</p>
                      <p className="mt-2 text-sm text-[#a89c8a]">Выберите подходящий аромат в коллекции</p>
                      <Link href="/collection" onClick={close} className="mt-6 rounded-full border border-[#c9a96e]/50 px-6 py-3 text-sm text-[#c9a96e]">Перейти в коллекцию</Link>
                    </div>
                  )}
                </ul>

                {safeLines.length > 0 && (
                  <div className="space-y-2 border-t border-[#c9a96e]/15 p-5">
                    <Row label="Товары" value={formatPrice(subtotal)} />
                    <Row label="Доставка" value={delivery === 0 ? "Бесплатно" : formatPrice(delivery)} />
                    <div className="flex items-baseline justify-between pt-2"><span className="text-[#a89c8a]">Итого</span><span className="font-display text-3xl text-[#c9a96e]"><AnimatedPrice value={total} /></span></div>
                    <button onClick={() => setStep("form")} className="mt-3 w-full rounded-full bg-gradient-to-r from-[#c9a96e] to-[#e9c98a] py-4 text-sm font-semibold text-[#0a0908] shadow-[0_0_30px_rgba(201,169,110,.3)]">Оформить заказ</button>
                  </div>
                )}
              </>
            )}

            {step === "form" && (
              <form onSubmit={submit} className="flex flex-1 flex-col gap-4 p-5">
                <h2 className="font-display text-3xl">Доставка</h2>
                <input className={input} placeholder="Ваше имя" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                <input className={input} placeholder="+998 (90) 123-45-67" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
                <input className={input} placeholder="Адрес (город, улица, дом)" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
                <textarea className={cn(input, "min-h-20 resize-none")} placeholder="Комментарий (необязательно)" value={comment} onChange={(e) => setComment(e.target.value)} />
                <fieldset>
                  <legend className="mb-2 text-xs uppercase tracking-widest text-[#a89c8a]">Способ оплаты</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {([["cash", "Наличные"], ["click", "Click"], ["payme", "Payme"]] as const).map(([id, label]) => (
                      <button type="button" key={id} onClick={() => setPay(id)} className={cn("rounded-xl border py-3 text-sm transition", pay === id ? "border-[#c9a96e] bg-[#c9a96e] font-semibold text-[#0a0908]" : "border-[#c9a96e]/25 text-[#f5efe6]/80")}>{label}</button>
                    ))}
                  </div>
                  {pay !== "cash" && <p className="mt-2 text-xs text-[#a89c8a]">После заказа оператор отправит ссылку для оплаты.</p>}
                </fieldset>
                {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                <div className="mt-auto space-y-3 pt-4">
                  <div className="flex items-baseline justify-between"><span className="text-[#a89c8a]">Итого</span><span className="font-display text-3xl text-[#c9a96e]">{formatPrice(total)}</span></div>
                  <button disabled={sending} className="w-full rounded-full bg-gradient-to-r from-[#c9a96e] to-[#e9c98a] py-4 text-sm font-semibold text-[#0a0908] disabled:opacity-60">{sending ? "Отправляем..." : "Подтвердить заказ"}</button>
                </div>
              </form>
            )}

            {step === "done" && <Success orderId={orderId} onClose={close} />}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-sm"><span className="text-[#a89c8a]">{label}</span><span>{value}</span></div>;
}

const burst = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2;
  const r = 90 + (i % 4) * 40;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, s: 3 + (i % 3) * 2 };
});

function Success({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center">
      <div>
        <div className="relative mx-auto grid size-28 place-items-center">
          {burst.map((b, i) => (
            <motion.span key={i} className="absolute rounded-full bg-[#e9c98a]" style={{ width: b.s, height: b.s, boxShadow: "0 0 10px #e9c98a" }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: b.x, y: b.y, opacity: 0, scale: 0.3 }} transition={{ duration: 1.4, delay: 0.15, ease: "easeOut" }} />
          ))}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="grid size-24 place-items-center rounded-full bg-gradient-to-br from-[#c9a96e] to-[#f3dca6] text-[#0a0908]"><Check className="size-12" strokeWidth={3} /></motion.div>
        </div>
        <h3 className="font-display mt-8 text-4xl">Заказ принят</h3>
        <p className="mt-2 text-[#c9a96e]">№ {orderId}</p>
        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-[#f5efe6]/70">Наш оператор скоро свяжется с вами и подтвердит заказ.</p>
        <button onClick={onClose} className="mt-8 rounded-full border border-[#c9a96e]/50 px-8 py-3 text-sm text-[#c9a96e]">Закрыть</button>
      </div>
    </div>
  );
}
