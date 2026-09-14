import { createHmac, timingSafeEqual, createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { withDB } from "./db";
export const SESSION_COOKIE = "hulan_admin";
const digest = (value: string) => createHash("sha256").update(value).digest();
function secret() {
  return process.env.SESSION_SECRET || "";
}
export function sessionToken() {
  if (secret().length < 32) throw new Error("SESSION_SECRET тохируулах шаардлагатай.");
  const payload = Buffer.from(
    JSON.stringify({ role: "admin", expires: Date.now() + 8 * 60 * 60 * 1000 }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("hex")}`;
}
export async function isAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || secret().length < 32) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  if (!timingSafeEqual(digest(signature), digest(expected))) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    return decoded.role === "admin" && decoded.expires > Date.now();
  } catch {
    return false;
  }
}
export async function checkPassword(password: string) {
  if (!process.env.ADMIN_PASSWORD || secret().length < 32)
    throw new Error("Админ нэвтрэх тохиргоо хийгдээгүй байна.");
  const allowed = await withDB(async (db) => {
    await db.query("DELETE FROM login_attempts WHERE created_at < ?", [
      new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    ]);
    const rows = await db.query("SELECT COUNT(*) AS total FROM login_attempts");
    if (Number(rows[0].total) >= 10) return false;
    await db.query("INSERT INTO login_attempts (id,created_at) VALUES (?,?)", [
      randomUUID(),
      new Date().toISOString(),
    ]);
    return true;
  });
  if (!allowed) throw new Error("Олон удаа оролдсон байна. 15 минутын дараа дахин оролдоно уу.");
  return timingSafeEqual(digest(password), digest(process.env.ADMIN_PASSWORD));
}
