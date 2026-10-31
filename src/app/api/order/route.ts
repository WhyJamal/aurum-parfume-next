import { getProduct } from "@/lib/products";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const payLabel = { cash: "Наличные (при получении)", click: "Click", payme: "Payme" } as const;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "Неверный запрос" }, { status: 400 }); }

  const name = String(body.name ?? "").trim().slice(0, 80);
  const phone = String(body.phone ?? "").trim().slice(0, 30);
  const address = String(body.address ?? "").trim().slice(0, 200);
  const comment = String(body.comment ?? "").trim().slice(0, 300);
  const pay = (["cash", "click", "payme"].includes(String(body.pay)) ? body.pay : "cash") as keyof typeof payLabel;
  const rawLines = Array.isArray(body.lines) ? body.lines : [];

  // prices are always recalculated on the server, never trusted from the browser
  let total = 0;
  const items: string[] = [];
  for (const l of rawLines.slice(0, 30)) {
    const p = getProduct(String((l as { slug?: unknown }).slug));
    const volume = Number((l as { volume?: unknown }).volume);
    const qty = Math.min(Math.max(Number((l as { qty?: unknown }).qty) || 0, 0), 20);
    if (!p || (volume !== 50 && volume !== 100) || qty < 1) continue;
    total += p.prices[volume] * qty;
    items.push(`• ${esc(p.name)} ${volume}ml × ${qty} = ${(p.prices[volume] * qty).toLocaleString("en-US").replace(/,/g, " ")}`);
  }
  if (!name || phone.replace(/\D/g, "").length !== 12 || !address || items.length === 0) {
    return Response.json({ ok: false, error: "Данные заполнены не полностью" }, { status: 400 });
  }

  const orderId = `A${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const text = [
    `🛍 <b>Новый заказ ${orderId}</b>`, "",
    ...items, "",
    `💰 Товары: <b>${total.toLocaleString("en-US").replace(/,/g, " ")} сум</b> (доставка считается отдельно)`,
    `💳 Оплата: ${payLabel[pay]}`, "",
    `👤 ${esc(name)}`, `📞 ${esc(phone)}`, `📍 ${esc(address)}`,
    comment ? `💬 ${esc(comment)}` : "",
  ].filter((x) => x !== "").join("\n");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    // demo mode until the Telegram bot is connected
    console.log("[AURUM order, Telegram not configured]\n" + text);
    return Response.json({ ok: true, orderId, demo: true });
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML" }),
    });
    if (!res.ok) throw new Error(`telegram ${res.status}`);
    return Response.json({ ok: true, orderId });
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false, error: "Не удалось отправить в Telegram" }, { status: 502 });
  }
}
