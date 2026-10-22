import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import {
  selectionSchema,
  validateSelection,
  unitPrice,
  lineKey,
} from "@/lib/cart";
import { findProduct } from "@/data/products";
import { money, pricing } from "@/lib/config";
export const orderSchema = z
  .object({
    items: z.array(selectionSchema).min(1).max(pricing.maxLines),
    name: z.string().trim().min(2).max(80),
    contactType: z.enum(["telegram", "phone", "email"]),
    contact: z.string().trim().min(5).max(120),
    comment: z.string().trim().max(500),
    consent: z.literal(true),
    website: z.literal(""),
    token: z.string().max(300),
    idempotencyKey: z.uuid(),
  })
  .strict()
  .superRefine((v, ctx) => {
    const valid =
      v.contactType === "telegram"
        ? /^@[a-zA-Z0-9_]{5,32}$/.test(v.contact)
        : v.contactType === "email"
          ? z.email().safeParse(v.contact).success
          : /^\+?[\d ()-]{10,24}$/.test(v.contact);
    if (!valid)
      ctx.addIssue({
        code: "custom",
        path: ["contact"],
        message: "Проверьте контакт для связи",
      });
  });
export type OrderInput = z.infer<typeof orderSchema>;
export type OrderRecord = {
  id: string;
  idempotency_key: string;
  request_hash: string;
  created_at: number;
  mode: string;
  payload: string;
  total: number;
  notification: string;
  attempts: number;
  next_attempt: number;
  lease_until: number;
};
const localSecret = randomUUID() + randomUUID();
export function mode() {
  return process.env.ORDER_MODE === "real" ? "real" : "test";
}
export function assertConfigured() {
  if (
    mode() === "real" &&
    (!process.env.DATABASE_URL ||
      !process.env.TELEGRAM_BOT_TOKEN ||
      !process.env.TELEGRAM_CHAT_ID ||
      (process.env.ORDER_SIGNING_SECRET?.length ?? 0) < 32 ||
      (process.env.CRON_SECRET?.length ?? 0) < 32 ||
      (process.env.IP_HASH_SECRET?.length ?? 0) < 32 ||
      process.env.CATALOG_APPROVED !== "true" ||
      process.env.LEGAL_APPROVED !== "true")
  )
    throw new Error("CONFIG_INCOMPLETE");
}
function sign(value: string) {
  return createHmac("sha256", process.env.ORDER_SIGNING_SECRET || localSecret)
    .update(value)
    .digest("hex");
}
export function issueToken(now = Date.now()) {
  const value = `${now}.${randomUUID()}`;
  return `${value}.${sign(value)}`;
}
export function verifyToken(token: string, now = Date.now()) {
  const [timestamp, nonce, signature] = token.split("."),
    value = `${timestamp}.${nonce}`;
  const expected = sign(value);
  return (
    !!signature &&
    /^[a-f0-9]{64}$/.test(signature) &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) &&
    Number.isFinite(Number(timestamp)) &&
    now - Number(timestamp) >= 2000 &&
    now - Number(timestamp) < 3600000
  );
}
export async function rateLimit(request: Request, scope = "order", max = 5) {
  const connection = await db(),
    now = Date.now(),
    window = 10 * 60 * 1000;
  // Only use a header installed and overwritten by the configured trusted proxy.
  const address =
    process.env.TRUST_PROXY === "true"
      ? request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown"
      : "shared-local";
  const hash = createHmac("sha256", process.env.IP_HASH_SECRET || localSecret)
    .update(address)
    .digest("hex");
  const bucket = `${scope}:${hash}:${Math.floor(now / window)}`;
  const rows = await connection.query<{ count: number }>(
    "INSERT INTO rate_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=rate_limits.count+1 RETURNING count",
    [bucket, now + window],
  );
  await connection.query("DELETE FROM rate_limits WHERE expires_at < ?", [
    now - window,
  ]);
  return rows[0].count <= max;
}
export function calculateOrder(items: OrderInput["items"], real = false) {
  const keys = new Set<string>();
  return items.map((item) => {
    const selection = validateSelection(item),
      product = findProduct(selection.productId)!;
    if (real && (!product.approved || product.optionsStatus !== "confirmed"))
      throw new Error("CATALOG_UNAPPROVED");
    if (keys.has(lineKey(selection))) throw new Error("DUPLICATE_LINE");
    keys.add(lineKey(selection));
    return {
      ...selection,
      name: product.name,
      unitPrice: unitPrice(selection),
      lineTotal: unitPrice(selection) * selection.quantity,
    };
  });
}
export async function createOrder(input: OrderInput) {
  assertConfigured();
  const items = calculateOrder(input.items, mode() === "real");
  const payload = {
    items,
    name: input.name,
    contactType: input.contactType,
    contact: input.contact,
    comment: input.comment,
    consentVersion: "draft-2026-10-22",
  };
  const requestHash = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  const total = items.reduce((sum, l) => sum + l.lineTotal, 0),
    connection = await db();
  const id = `LUME-${randomUUID()}`;
  await connection.query(
    "INSERT INTO orders(id,idempotency_key,request_hash,created_at,mode,payload,total,notification) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(idempotency_key) DO NOTHING",
    [
      id,
      input.idempotencyKey,
      requestHash,
      Date.now(),
      mode(),
      JSON.stringify(payload),
      total,
      mode() === "test" ? "test" : "pending",
    ],
  );
  const [order] = await connection.query<OrderRecord>(
    "SELECT * FROM orders WHERE idempotency_key=?",
    [input.idempotencyKey],
  );
  if (order.request_hash !== requestHash)
    throw new Error("IDEMPOTENCY_CONFLICT");
  return order;
}
export async function notifyOrder(id: string, fetcher: typeof fetch = fetch) {
  const connection = await db(),
    now = Date.now();
  const [order] = await connection.query<OrderRecord>(
    "UPDATE orders SET lease_until=? WHERE id=? AND notification='pending' AND mode='real' AND lease_until<? AND next_attempt<=? RETURNING *",
    [now + 60000, id, now, now],
  );
  if (!order) return;
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID)
      throw new Error("CONFIG_TELEGRAM");
    const payload = JSON.parse(order.payload) as {
      items: ReturnType<typeof calculateOrder>;
      name: string;
      contactType: string;
      contact: string;
      comment: string;
    };
    const lines = payload.items.map((i, index) => {
      const product = findProduct(i.productId);
      const aroma =
        i.aroma === "none"
          ? "Без аромата"
          : product?.aromas.find((a) => a.id === i.aroma)?.label || i.aroma;
      return `${index + 1}. ${i.name}\n${pricing.sizes[i.size].label}; ${pricing.materials[i.material].label}; ${aroma}; ${i.decor ? "декор согласовать" : "без дополнительного декора"}\n${i.quantity} × ${money(i.unitPrice)} = ${money(i.lineTotal)}`;
    });
    const details = lines.join("\n\n");
    const text = `Новая заявка ${order.id}\n\n${details}\n\nПредварительно: ${money(order.total)}. Без доставки.\nИмя: ${payload.name}\nСвязь (${payload.contactType}): ${payload.contact}\nКомментарий: ${payload.comment || "нет"}\nИтог и доставку согласовать лично.`;
    // No truncated basket. Large orders use several messages carrying the same order ID.
    const chunks = text.match(/[\s\S]{1,3400}/gu) || [];
    for (let i = 0; i < chunks.length; i++) {
      const message =
        chunks.length > 1
          ? `${order.id} · ${i + 1}/${chunks.length}\n${chunks[i]}`
          : chunks[i];
      const response = await fetcher(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      const body = (await response.json()) as {
        ok?: boolean;
        parameters?: { retry_after?: number };
      };
      if (!response.ok || !body.ok) {
        const delay = Math.max(
          60,
          Math.min(86400, Number(body.parameters?.retry_after) || 60),
        );
        await connection.query(
          "UPDATE orders SET attempts=attempts+1,next_attempt=?,lease_until=0 WHERE id=?",
          [now + delay * 1000, id],
        );
        console.error("telegram_delivery_failed", response.status);
        return;
      }
    }
    await connection.query(
      "UPDATE orders SET notification='sent',lease_until=0 WHERE id=?",
      [id],
    );
  } catch {
    await connection.query(
      "UPDATE orders SET attempts=attempts+1,next_attempt=?,lease_until=0 WHERE id=?",
      [now + Math.min(3600000, 60000 * 2 ** Math.min(order.attempts, 6)), id],
    );
    console.error("telegram_delivery_unavailable");
  }
}
export async function retryNotifications() {
  const connection = await db();
  const orders = await connection.query<{ id: string }>(
    "SELECT id FROM orders WHERE notification='pending' AND mode='real' AND next_attempt<=? AND lease_until<? ORDER BY created_at LIMIT 10",
    [Date.now(), Date.now()],
  );
  for (const order of orders) await notifyOrder(order.id);
  return orders.length;
}
