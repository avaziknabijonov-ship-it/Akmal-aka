import { test } from "node:test";
import assert from "node:assert/strict";
import { deliverTelegram } from "../app/telegram";
import type { Runtime } from "../app/server";
function fixture() {
  let state = "pending";
  let attempts = 0;
  const DB = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async first() {
              if (!["pending", "failed"].includes(state)) return null;
              state = "sending";
              attempts++;
              return { name: "Test", phone: "123", program: "Test" };
            },
            async run() {
              if (sql.startsWith("UPDATE")) state = String(args[0]);
              return {};
            },
          };
        },
      };
    },
  };
  return {
    env: {
      DB,
      TELEGRAM_BOT_TOKEN: "test",
      TELEGRAM_CHAT_ID: "test",
    } as unknown as Runtime,
    state: () => state,
    attempts: () => attempts,
  };
}
test("concurrent delivery claims once; delivered rows are not resent", async () => {
  const f = fixture();
  let calls = 0;
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ ok: true, result: { message_id: 1 } });
  };
  try {
    await Promise.all([
      deliverTelegram(f.env, "id"),
      deliverTelegram(f.env, "id"),
    ]);
    await deliverTelegram(f.env, "id");
    assert.equal(calls, 1);
    assert.equal(f.state(), "sent");
    assert.equal(f.attempts(), 1);
  } finally {
    globalThis.fetch = original;
  }
});
test("uncertain transport is never retried automatically", async () => {
  const f = fixture();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("timeout");
  };
  try {
    await deliverTelegram(f.env, "id");
    await deliverTelegram(f.env, "id");
    assert.equal(f.state(), "unknown");
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
  }
});
test("explicit rejection can retry; missing configuration preserves pending", async () => {
  const f = fixture();
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ ok: false, error_code: 429 });
  try {
    await deliverTelegram({ ...f.env, TELEGRAM_BOT_TOKEN: undefined }, "id");
    assert.equal(f.state(), "pending");
    await deliverTelegram(f.env, "id");
    assert.equal(f.state(), "failed");
    globalThis.fetch = async () =>
      Response.json({ ok: true, result: { message_id: 2 } });
    await deliverTelegram(f.env, "id");
    assert.equal(f.state(), "sent");
  } finally {
    globalThis.fetch = original;
  }
});
