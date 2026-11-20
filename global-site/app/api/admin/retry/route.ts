import { runtime } from "../../../server";
import { adminAuthorized } from "../../../security";
import { retryPending } from "../../../telegram";
export async function POST(req: Request) {
  const e = runtime();
  if (!(await adminAuthorized(req.headers, e.ADMIN_PASSWORD)))
    return new Response("Unauthorized", { status: 401 });
  if (req.headers.get("origin") !== e.PUBLIC_ORIGIN)
    return new Response("Forbidden", { status: 403 });
  await retryPending(e);
  return new Response(null, {
    status: 303,
    headers: { Location: "/admin", "Cache-Control": "no-store" },
  });
}
