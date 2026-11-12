import type { Runtime } from "./server";
// Claim before network I/O: concurrent retries can never send the same pending row.
export async function deliverTelegram(e: Runtime, id: string) {
  if (!e.TELEGRAM_BOT_TOKEN || !e.TELEGRAM_CHAT_ID) return;
  const row = await e.DB.prepare(
    "UPDATE leads SET telegram_status='sending',telegram_attempts=telegram_attempts+1,telegram_error=NULL,telegram_updated_at=? WHERE id=? AND telegram_status IN ('pending','failed') RETURNING *",
  )
    .bind(new Date().toISOString(), id)
    .first<Record<string, string>>();
  if (!row) return;
  let status = "unknown",
    error = "transport_uncertain",
    messageId: string | null = null;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${e.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: e.TELEGRAM_CHAT_ID,
          text: `GLOBAL · ${id}\n${row.name}\n${row.phone}\n${row.program}`,
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const body = (await res.json()) as {
      ok?: boolean;
      error_code?: number;
      result?: { message_id: number };
    };
    if (body.ok && body.result) {
      status = "sent";
      error = "";
      messageId = String(body.result.message_id);
    } else if (body.ok === false && body.error_code && body.error_code < 500) {
      status = "failed";
      error = `telegram_${body.error_code}`;
    }
  } catch {
    /* Do not log fetch errors: their URLs can contain the bot token. */
  }
  await e.DB.prepare(
    "UPDATE leads SET telegram_status=?,telegram_error=?,telegram_message_id=?,telegram_updated_at=? WHERE id=? AND telegram_status='sending'",
  )
    .bind(status, error || null, messageId, new Date().toISOString(), id)
    .run();
}
export async function retryPending(e: Runtime) {
  const rows = await e.DB.prepare(
    "SELECT id FROM leads WHERE telegram_status IN ('pending','failed') ORDER BY created_at LIMIT 10",
  ).all<{ id: string }>();
  for (const r of rows.results) await deliverTelegram(e, r.id);
}
