import Link from "next/link";
import { headers } from "next/headers";
import { adminAuthorized } from "../security";
import { runtime } from "../server";
export const dynamic = "force-dynamic";
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const e = runtime();
  if (!(await adminAuthorized(await headers(), e.ADMIN_PASSWORD)))
    return <main>Доступ ограничен</main>;
  const p = await searchParams;
  const page = Math.max(1, Math.min(100000, Number(p.page) || 1)) | 0;
  const rows = await e.DB.prepare(
    "SELECT * FROM leads ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET ?",
  )
    .bind((page - 1) * 50)
    .all<Record<string, string>>();
  return (
    <main style={{ padding: "40px 5%" }}>
      <Link href="/">GLOBAL</Link>
      <h1>Заявки · {page}</h1>
      <p>Данные доступны владельцу. Экспорт: текущая страница (50 записей).</p>
      <a href={"/api/admin/export?page=" + page}>Скачать CSV</a>
      <form action="/api/admin/retry" method="post">
        <button>Повторить pending / failed (до 10)</button>
      </form>
      <p>
        unknown / sending: проверьте Telegram по ID заявки; автоматический
        повтор отключён, чтобы избежать дубликатов.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              {[
                "ID",
                "Дата",
                "Имя",
                "Телефон",
                "Программа",
                "Telegram",
                "Ошибка",
                "Попытки",
              ].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.results.slice(0, 50).map((r) => (
              <tr key={r.id}>
                {[
                  "id",
                  "created_at",
                  "name",
                  "phone",
                  "program",
                  "telegram_status",
                  "telegram_error",
                  "telegram_attempts",
                ].map((k) => (
                  <td style={{ padding: 12 }} key={k}>
                    {r[k]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page > 1 && <a href={"?page=" + (page - 1)}>← Назад </a>}
      {rows.results.length > 50 && <a href={"?page=" + (page + 1)}>Далее →</a>}
    </main>
  );
}
