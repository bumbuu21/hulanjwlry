import { NextResponse } from "next/server";
import { ZodError } from "zod";
export function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const expected =
    process.env.APP_ORIGIN || `${url.protocol}//${request.headers.get("host") || url.host}`;
  if (!origin || origin !== expected) throw new Error("Хүсэлтийн эх сурвалж зөвшөөрөгдөөгүй.");
}
export async function readJSON(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 16384)
    throw new Error("Хүсэлт хэт том байна.");
  const body = await request.text();
  if (body.length > 16384) throw new Error("Хүсэлт хэт том байна.");
  return JSON.parse(body);
}
export function apiError(error: unknown, status = 400) {
  const message =
    error instanceof ZodError
      ? error.issues[0]?.message
      : error instanceof Error
        ? error.message
        : "Алдаа гарлаа. Дахин оролдоно уу.";
  // Do not expose raw database messages or credentials.
  const safe =
    message && /[А-Яа-яӨөҮү]/.test(message)
      ? message
      : "Алдаа гарлаа. Мэдээллээ шалгаад дахин оролдоно уу.";
  return NextResponse.json({ error: safe }, { status });
}
export function paymentSettings() {
  const bank = process.env.BANK_NAME || "",
    account = process.env.BANK_ACCOUNT || "",
    holder = process.env.BANK_HOLDER || "";
  return {
    bank,
    account,
    holder,
    configured: Boolean(bank && account && holder),
    preview: process.env.ALLOW_PREVIEW_ORDERS === "true",
  };
}
