import app from "vinext/server/app-router-entry";
import { adminAuthorized } from "../app/security";
import type { Runtime } from "../app/server";
const worker = {
  async fetch(request: Request, env: Runtime, ctx: ExecutionContext) {
    const path = new URL(request.url).pathname;
    const admin =
      path === "/admin" ||
      path.startsWith("/admin/") ||
      path.startsWith("/api/admin/");
    if (admin && !(await adminAuthorized(request.headers, env.ADMIN_PASSWORD)))
      return new Response("Owner authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="GLOBAL owner", charset="UTF-8"',
          "Cache-Control": "no-store",
        },
      });
    const response = await app.fetch(request, env, ctx);
    const result = new Response(response.body, response);
    if (admin || path.startsWith("/api/"))
      result.headers.set("Cache-Control", "no-store");
    result.headers.set("X-Content-Type-Options", "nosniff");
    result.headers.set("Referrer-Policy", "same-origin");
    return result;
  },
};
export default worker;
