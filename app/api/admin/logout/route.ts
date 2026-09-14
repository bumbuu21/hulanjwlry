import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { apiError, assertOrigin } from "@/lib/http";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch (e) {
    return apiError(e);
  }
}
