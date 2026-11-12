import {rateLimitSql} from "../db/queries";
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
test("migrations retain existing leads and enforce idempotent insertion", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync("drizzle/0000_wooden_epoch.sql", "utf8"));
  db.exec(
    "INSERT INTO leads VALUES('old','Name','123456789','Program','2026')",
  );
  db.exec(readFileSync("drizzle/0001_flaky_colossus.sql", "utf8"));
  assert.equal(
    db.prepare("SELECT telegram_status FROM leads").get()?.telegram_status,
    "pending",
  );
  const insert = db.prepare(
    "INSERT INTO leads(id,name,phone,program,created_at,request_id) VALUES (?,?,?,?,?,?) ON CONFLICT(request_id) DO NOTHING",
  );
  insert.run("one", "Name", "123456789", "Program", "2026", "same");
  insert.run("two", "Name", "123456789", "Program", "2026", "same");
  assert.equal(db.prepare("SELECT COUNT(*) as n FROM leads").get()?.n, 2);
  db.close();
});
test("database rate limit increments atomically and resets after expiry", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync("drizzle/0000_wooden_epoch.sql", "utf8"));
  db.exec(readFileSync("drizzle/0001_flaky_colossus.sql", "utf8"));
  const statement = db.prepare(rateLimitSql);
  for (let i = 1; i <= 6; i++)
    assert.equal(statement.get("key", 700, 100, 100)?.count, i);
  assert.equal(statement.get("key", 1400, 800, 800)?.count, 1);
  db.close();
});
