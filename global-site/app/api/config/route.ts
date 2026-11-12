import { runtime } from "../../server";
export function GET() {
  return Response.json(
    { turnstileSiteKey: runtime().TURNSTILE_SITE_KEY || null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
