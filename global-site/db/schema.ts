import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
export const leads = sqliteTable(
  "leads",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    program: text("program").notNull(),
    createdAt: text("created_at").notNull(),
    requestId: text("request_id"),
    telegramStatus: text("telegram_status").notNull().default("pending"),
    telegramAttempts: integer("telegram_attempts").notNull().default(0),
    telegramError: text("telegram_error"),
    telegramMessageId: text("telegram_message_id"),
    telegramUpdatedAt: text("telegram_updated_at"),
  },
  (t) => [uniqueIndex("leads_request_id").on(t.requestId)],
);
export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: integer("expires_at").notNull(),
});
