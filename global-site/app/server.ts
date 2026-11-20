import { env } from "cloudflare:workers";
export type Runtime = {
  DB: D1Database;
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
  ADMIN_PASSWORD?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  PUBLIC_ORIGIN?: string;
  RATE_LIMIT_SALT?: string;
  PRIVACY_CONTROLLER?: string;
  PRIVACY_CONTACT?: string;
  PRIVACY_RETENTION?: string;
};
export const runtime = () => env as unknown as Runtime;
