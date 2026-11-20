export async function equalSecret(a: string, b: string) {
  const hash = async (s: string) =>
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    );
  const [x, y] = await Promise.all([hash(a), hash(b)]);
  let v = 0;
  for (let i = 0; i < x.length; i++) v |= x[i] ^ y[i];
  return v === 0;
}
export async function adminAuthorized(h: Headers, password?: string) {
  if (!password || password.length < 32) return false;
  const auth = h.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(auth.slice(6));
    return (
      decoded.startsWith("owner:") &&
      (await equalSecret(decoded.slice(6), password))
    );
  } catch {
    return false;
  }
}
export async function limitedJson(req: Request, max = 4096): Promise<unknown> {
  if (
    !req.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new Error("media");
  const reader = req.body?.getReader();
  if (!reader) throw new Error("body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new Error("size");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
export const programs = [
  "Программа для 11 класса",
  "Высшее образование",
  "Подготовка к поступлению",
  "Обучение для взрослых",
  "Нужна помощь с выбором",
] as const;
export function validateLead(b: unknown) {
  if (!b || typeof b !== "object" || Array.isArray(b)) throw Error("fields");
  const x = b as Record<string, unknown>;
  if (
    Object.keys(x).some(
      (k) =>
        ![
          "name",
          "phone",
          "program",
          "consent",
          "website",
          "turnstile",
          "requestId",
        ].includes(k),
    )
  )
    throw Error("fields");
  if (
    typeof x.name !== "string" ||
    typeof x.phone !== "string" ||
    typeof x.program !== "string" ||
    typeof x.turnstile !== "string" ||
    typeof x.requestId !== "string"
  )
    throw Error("fields");
  const name = x.name.trim(),
    phone = x.phone.trim();
  if (
    name.length < 2 ||
    name.length > 80 ||
    /[\p{Cc}\p{Cf}]/u.test(name) ||
    !/^\+?[0-9 ()-]{9,22}$/.test(phone) ||
    !/^\d{9,15}$/.test(phone.replace(/\D/g, "")) ||
    !programs.includes(x.program as (typeof programs)[number]) ||
    x.consent !== "on" ||
    x.website !== "" ||
    !x.turnstile ||
    x.turnstile.length > 2048 ||
    !/^[-a-f0-9]{36}$/.test(x.requestId)
  )
    throw Error("fields");
  return {
    name,
    phone,
    program: x.program,
    requestId: x.requestId,
    turnstile: x.turnstile,
  };
}
export function csvCell(value: string) {
  return (
    '"' +
    (/^[=+\-@\t\r\n]/.test(value) ? "'" : "") +
    value.replaceAll('"', '""') +
    '"'
  );
}
