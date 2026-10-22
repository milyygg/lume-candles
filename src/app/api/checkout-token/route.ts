import { assertConfigured, issueToken, mode, rateLimit } from "@/server/orders";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    assertConfigured();
    if (!(await rateLimit(request, "token", 60)))
      return Response.json(
        { error: "Слишком много запросов. Попробуйте позже." },
        { status: 429 },
      );
    return Response.json(
      { token: issueToken(), mode: mode() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Приём заявок ещё не настроен." },
      { status: 503 },
    );
  }
}
