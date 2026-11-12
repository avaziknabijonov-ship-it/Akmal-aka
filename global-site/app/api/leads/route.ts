import {rateLimitSql} from "../../../db/queries";
import { runtime } from "../../server";
import { limitedJson, validateLead } from "../../security";
import { deliverTelegram } from "../../telegram";
const reply = (error: string, status: number) =>
  Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
export async function POST(req: Request) {
  const e = runtime();
  if (
    !e.PUBLIC_ORIGIN ||
    !e.TURNSTILE_SECRET_KEY ||
    !e.RATE_LIMIT_SALT ||
    !e.PRIVACY_CONTROLLER ||
    !e.PRIVACY_CONTACT ||
    !e.PRIVACY_RETENTION
  )
    return reply("Приём заявок временно недоступен. Позвоните нам.", 503);
  if (req.headers.get("origin") !== e.PUBLIC_ORIGIN)
    return reply("Недопустимый источник запроса", 403);
  let b: ReturnType<typeof validateLead>;
  try {
    b = validateLead(await limitedJson(req));
  } catch (err) {
    return reply(
      "Проверьте поля заявки.",
      err instanceof Error && err.message === "size" ? 413 : 400,
    );
  }
  try {
    // Cloudflare supplies CF-Connecting-IP; no client-supplied forwarding headers are used.
    const ip = req.headers.get("cf-connecting-ip");
    if (!ip) return reply("Проверка недоступна", 503);
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(e.RATE_LIMIT_SALT + ip),
    );
    const key = Array.from(new Uint8Array(digest), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join("");
    const now = Math.floor(Date.now() / 1000);
    const rate = await e.DB.prepare(rateLimitSql)
      .bind(key, now + 600, now, now)
      .first<{ count: number }>();
    if (!rate || rate.count > 5)
      return reply("Слишком много запросов. Попробуйте через 10 минут.", 429);
    await e.DB.prepare("DELETE FROM rate_limits WHERE expires_at<?")
      .bind(now)
      .run();
    const verify = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: e.TURNSTILE_SECRET_KEY,
          response: b.turnstile,
          remoteip: ip,
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    const challenge = (await verify.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
    };
    if (
      !challenge.success ||
      challenge.hostname !== new URL(e.PUBLIC_ORIGIN).hostname ||
      challenge.action !== "lead"
    )
      return reply("Подтвердите проверку формы.", 400);
    const id = crypto.randomUUID();
    await e.DB.prepare(
      "INSERT INTO leads(id,name,phone,program,created_at,request_id) VALUES (?,?,?,?,?,?) ON CONFLICT(request_id) DO NOTHING",
    )
      .bind(
        id,
        b.name,
        b.phone,
        b.program,
        new Date().toISOString(),
        b.requestId,
      )
      .run();
    const row = await e.DB.prepare("SELECT id FROM leads WHERE request_id=?")
      .bind(b.requestId)
      .first<{ id: string }>();
    if (row) {
      try {
        await deliverTelegram(e, row.id);
      } catch {
        /* Saved lead remains durable even if notification state update fails. */
      }
    }
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return reply(
      "Не удалось обработать заявку. Повторите попытку с тем же запросом.",
      503,
    );
  }
}
