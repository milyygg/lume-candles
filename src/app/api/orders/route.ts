import { after } from "next/server";
import { db } from "@/server/db";
import {
  assertConfigured,
  createOrder,
  mode,
  notifyOrder,
  orderSchema,
  rateLimit,
  verifyToken,
  type OrderRecord,
} from "@/server/orders";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertConfigured();
    const expected = new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3014",
    ).origin;
    const allowedOrigins =
      !process.env.NEXT_PUBLIC_SITE_URL && mode() === "test"
        ? new Set([expected, "http://127.0.0.1:3014"])
        : new Set([expected]);
    if (!allowedOrigins.has(request.headers.get("origin") || ""))
      return Response.json(
        { error: "Недопустимый источник запроса." },
        { status: 403 },
      );
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return Response.json({ error: "Ожидается JSON." }, { status: 415 });
    const reader = request.body?.getReader();
    if (!reader)
      return Response.json({ error: "Пустая заявка." }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 16000) {
        await reader.cancel();
        return Response.json(
          { error: "Заявка слишком большая." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    let input: unknown;
    try {
      input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return Response.json({ error: "Некорректные данные." }, { status: 400 });
    }
    const parsed = orderSchema.safeParse(input);
    if (!parsed.success)
      return Response.json(
        { error: "Проверьте поля и согласие на обработку данных." },
        { status: 400 },
      );
    if (!verifyToken(parsed.data.token))
      return Response.json(
        { error: "Обновите форму и попробуйте ещё раз." },
        { status: 400 },
      );
    if (!(await rateLimit(request)))
      return Response.json(
        { error: "Слишком много заявок. Попробуйте через 10 минут." },
        { status: 429 },
      );
    const order = await createOrder(parsed.data);
    if (order.mode === "real" && order.notification === "pending")
      after(async () => {
        await notifyOrder(order.id);
      });
    // Success only follows durable storage. Pending does not imply Telegram delivery.
    const [current] = await (
      await db()
    ).query<OrderRecord>("SELECT notification FROM orders WHERE id=?", [
      order.id,
    ]);
    return Response.json(
      {
        id: order.id,
        total: order.total,
        mode: mode(),
        notification: current.notification,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "IDEMPOTENCY_CONFLICT")
      return Response.json(
        {
          error:
            "Эта отправка уже связана с другим составом заявки. Откройте форму заново.",
        },
        { status: 409 },
      );
    if (code === "CATALOG_UNAPPROVED" || code.startsWith("CONFIG_"))
      return Response.json(
        { error: "Приём реальных заявок ещё не настроен." },
        { status: 503 },
      );
    if (
      code === "DUPLICATE_LINE" ||
      code === "Недоступная конфигурация изделия"
    )
      return Response.json(
        { error: "Конфигурация недоступна. Обновите корзину." },
        { status: 400 },
      );
    console.error("order_creation_failed");
    return Response.json(
      { error: "Заявка не подтверждена. Повторите отправку с этой же формы." },
      { status: 500 },
    );
  }
}
