import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adminAuthorized,
  limitedJson,
  validateLead,
  csvCell,
} from "../app/security";
const valid = {
  name: "Akmal",
  phone: "+998 90 123 45 67",
  program: "Высшее образование",
  consent: "on",
  website: "",
  turnstile: "challenge",
  requestId: crypto.randomUUID(),
};
test("authentication ignores forged hosting headers and fails closed", async () => {
  const h = new Headers({
    "oai-authenticated-user-email": "avaziknabijonov@gmail.com",
  });
  assert.equal(await adminAuthorized(h, "x".repeat(32)), false);
  h.set("authorization", "Basic " + btoa("owner:" + "x".repeat(32)));
  assert.equal(await adminAuthorized(h), false);
  assert.equal(await adminAuthorized(h, "y".repeat(32)), false);
  assert.equal(await adminAuthorized(h, "x".repeat(32)), true);
});
test("stream size is enforced without Content-Length and with a false header", async () => {
  for (const headers of [
    { "Content-Type": "application/json" },
    { "Content-Type": "application/json", "Content-Length": "1" },
  ]) {
    await assert.rejects(
      limitedJson(
        new Request("https://example.test", {
          method: "POST",
          headers: headers as Record<string, string>,
          body: JSON.stringify({ x: "й".repeat(3000) }),
        }),
      ),
      /size/,
    );
  }
  assert.deepEqual(
    await limitedJson(
      new Request("https://example.test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"x":1}',
      }),
    ),
    { x: 1 },
  );
});
test("strict types, enum, consent, controls and honeypot", () => {
  assert.equal(validateLead(valid).name, "Akmal");
  for (const bad of [
    { name: {} },
    { phone: "123" },
    { program: "arbitrary" },
    { consent: true },
    { name: "ab\ncd" },
    { website: "spam" },
    { extra: "data" },
    { requestId: "123" },
  ])
    assert.throws(() => validateLead({ ...valid, ...bad }));
});
test("CSV neutralizes spreadsheet formulas and quotes", () => {
  assert.equal(csvCell("+998901234567"), '"\'+998901234567"');
  assert.equal(csvCell('a"b'), '"a""b"');
});
