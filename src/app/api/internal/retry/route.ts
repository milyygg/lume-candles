import { timingSafeEqual } from "node:crypto";
import { assertConfigured, retryNotifications } from "@/server/orders";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (
    !secret ||
    secret.length < 32 ||
    Buffer.byteLength(header) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  )
    return new Response(null, { status: 401 });
  try {
    assertConfigured();
    return Response.json({ processed: await retryNotifications() });
  } catch {
    console.error("retry_failed");
    return Response.json({ error: "Retry unavailable" }, { status: 503 });
  }
}
