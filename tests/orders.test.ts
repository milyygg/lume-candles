import { describe, it, expect, beforeAll, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  assertConfigured,
  calculateOrder,
  createOrder,
  issueToken,
  notifyOrder,
  orderSchema,
  rateLimit,
  retryNotifications,
  verifyToken,
  type OrderInput,
  type OrderRecord,
} from "../src/server/orders";
import { db } from "../src/server/db";
import { products } from "../src/data/products";
beforeAll(() => {
  process.env.ORDER_MODE = "test";
  process.env.SQLITE_PATH = path.join(
    tmpdir(),
    `lume-test-${randomUUID()}.sqlite`,
  );
});
const input = (): OrderInput => ({
  items: [
    {
      productId: products[0].id,
      size: "small",
      material: "palm",
      aroma: "none",
      decor: false,
      quantity: 2,
    },
  ],
  name: "Тест",
  contactType: "telegram",
  contact: "@test_user",
  comment: "Проверка",
  consent: true,
  website: "",
  token: issueToken(Date.now() - 3000),
  idempotencyKey: randomUUID(),
});
describe("order validation", () => {
  it("accepts explicit consent and valid contact", () =>
    expect(orderSchema.safeParse(input()).success).toBe(true));
  it("rejects no consent", () =>
    expect(orderSchema.safeParse({ ...input(), consent: false }).success).toBe(
      false,
    ));
  it("rejects malformed telegram", () =>
    expect(
      orderSchema.safeParse({ ...input(), contact: "https://t.me/+invite" })
        .success,
    ).toBe(false));
  it("rejects honeypot", () =>
    expect(orderSchema.safeParse({ ...input(), website: "spam" }).success).toBe(
      false,
    ));
  it("rejects duplicate configurations", () => {
    const data = input();
    expect(() => calculateOrder([...data.items, ...data.items])).toThrow(
      "DUPLICATE_LINE",
    );
  });
  it("rejects real orders for unapproved products", () =>
    expect(() => calculateOrder(input().items, true)).toThrow(
      "CATALOG_UNAPPROVED",
    ));
  it("verifies age and HMAC", () => {
    expect(verifyToken(issueToken(Date.now() - 3000))).toBe(true);
    expect(verifyToken(issueToken())).toBe(false);
    expect(verifyToken(issueToken(Date.now() - 4000000))).toBe(false);
    expect(verifyToken("123.fake.bad")).toBe(false);
  });
  it("fails closed when real mode is not configured", () => {
    process.env.ORDER_MODE = "real";
    try {
      expect(assertConfigured).toThrow("CONFIG_INCOMPLETE");
    } finally {
      process.env.ORDER_MODE = "test";
    }
  });
});
describe("durable orders, idempotency and outbox", () => {
  it("delivers full large baskets in bounded messages", async () => {
    const data = input();
    data.items = [
      ...products.map(p => ({...data.items[0],productId:p.id})),
      ...products.slice(0,8).map(p => ({...data.items[0],productId:p.id,size:'medium' as const}))
    ];
    const originalName=products[0].name;
    let order:OrderRecord;
    try {
      products[0].name='Тестовое длинное название формы '.repeat(30);
      order=await createOrder(data);
    } finally { products[0].name=originalName; }
    const connection=await db();
    await connection.query("UPDATE orders SET mode='real',notification='pending' WHERE id=?",[order.id]);
    process.env.TELEGRAM_BOT_TOKEN='test-only'; process.env.TELEGRAM_CHAT_ID='test-chat';
    const messages:string[]=[];
    const mock=vi.fn().mockImplementation(async (_url,options) => {
      messages.push(JSON.parse(options.body).text);
      return new Response(JSON.stringify({ok:true}),{status:200});
    });
    try {
      await notifyOrder(order.id,mock);
      expect(messages.length).toBeGreaterThan(1);
      expect(messages.every(message=>message.length<4096)).toBe(true);
      expect(messages.join('')).toContain('20.');
      expect(messages.join('')).toContain('@test_user');
      const [stored]=await connection.query<OrderRecord>('SELECT * FROM orders WHERE id=?',[order.id]);
      expect(stored.notification).toBe('sent');
    } finally {delete process.env.TELEGRAM_BOT_TOKEN;delete process.env.TELEGRAM_CHAT_ID;}
  });
  it("saves a test order with server-calculated total", async () => {
    const order = await createOrder(input());
    expect(order.total).toBe(3000);
    expect(order.notification).toBe("test");
    const rows = await (
      await db()
    ).query("SELECT id FROM orders WHERE id=?", [order.id]);
    expect(rows).toHaveLength(1);
  });
  it("same idempotency key never creates duplicate order", async () => {
    const data = input();
    const [a, b] = await Promise.all([createOrder(data), createOrder(data)]);
    expect(a.id).toBe(b.id);
  });
  it("rejects changed payload under the same key", async () => {
    const data = input();
    await createOrder(data);
    await expect(createOrder({ ...data, name: "Другое имя" })).rejects.toThrow(
      "IDEMPOTENCY_CONFLICT",
    );
  });
  it("test order never sends Telegram", async () => {
    const order = await createOrder(input());
    const mock = vi.fn();
    await notifyOrder(order.id, mock);
    expect(mock).not.toHaveBeenCalled();
  });
  it("keeps pending order and retries after Telegram failure", async () => {
    const order = await createOrder(input()),
      connection = await db();
    await connection.query(
      "UPDATE orders SET mode='real',notification='pending' WHERE id=?",
      [order.id],
    );
    process.env.TELEGRAM_BOT_TOKEN = "test-only";
    process.env.TELEGRAM_CHAT_ID = "test-chat";
    const failed = vi.fn().mockRejectedValue(new Error("offline"));
    await notifyOrder(order.id, failed);
    const [stored] = await connection.query<OrderRecord>(
      "SELECT * FROM orders WHERE id=?",
      [order.id],
    );
    expect(stored.notification).toBe("pending");
    expect(stored.attempts).toBe(1);
    expect(stored.payload).toContain("@test_user");
    await connection.query("UPDATE orders SET next_attempt=0 WHERE id=?", [
      order.id,
    ]);
    const succeeded = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    await notifyOrder(order.id, succeeded);
    const [sent] = await connection.query<OrderRecord>(
      "SELECT * FROM orders WHERE id=?",
      [order.id],
    );
    expect(sent.notification).toBe("sent");
    await notifyOrder(order.id, succeeded);
    expect(succeeded).toHaveBeenCalledTimes(1);
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
  });
  it("respects Telegram retry_after", async () => {
    const order = await createOrder(input()),
      connection = await db();
    await connection.query(
      "UPDATE orders SET mode='real',notification='pending' WHERE id=?",
      [order.id],
    );
    process.env.TELEGRAM_BOT_TOKEN = "test-only";
    process.env.TELEGRAM_CHAT_ID = "test-chat";
    await notifyOrder(
      order.id,
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ ok: false, parameters: { retry_after: 120 } }),
            { status: 429 },
          ),
        ),
    );
    const [row] = await connection.query<OrderRecord>(
      "SELECT * FROM orders WHERE id=?",
      [order.id],
    );
    expect(Number(row.next_attempt)).toBeGreaterThan(Date.now() + 110000);
    expect(row.notification).toBe("pending");
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
  });
  it("bounds rate by durable shared bucket", async () => {
    const request = new Request("http://localhost");
    expect(await rateLimit(request, "test", 2)).toBe(true);
    expect(await rateLimit(request, "test", 2)).toBe(true);
    expect(await rateLimit(request, "test", 2)).toBe(false);
  });
  it("retry skips deferred notification", async () =>
    expect(await retryNotifications()).toBe(0));
});
