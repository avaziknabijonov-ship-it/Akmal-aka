import { runtime } from "../../../server";
import { adminAuthorized, csvCell } from "../../../security";
export async function GET(req: Request) {
  const e = runtime();
  if (!(await adminAuthorized(req.headers, e.ADMIN_PASSWORD)))
    return new Response("Unauthorized", { status: 401 });
  const page =
    Math.max(
      1,
      Math.min(100000, Number(new URL(req.url).searchParams.get("page")) || 1),
    ) | 0;
  const rows = await e.DB.prepare(
    "SELECT id,created_at,name,phone,program,telegram_status FROM leads ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET ?",
  )
    .bind((page - 1) * 50)
    .all<Record<string, string>>();
  const keys = [
    "id",
    "created_at",
    "name",
    "phone",
    "program",
    "telegram_status",
  ];
  return new Response(
    "\uFEFF" +
      [
        keys.join(","),
        ...rows.results.map((r) =>
          keys.map((k) => csvCell(r[k] || "")).join(","),
        ),
      ].join("\r\n"),
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${page}.csv"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
