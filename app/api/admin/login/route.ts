import { NextResponse } from "next/server";
import { z } from "zod";
import { checkPassword, SESSION_COOKIE, sessionToken } from "@/lib/auth";
import { apiError, assertOrigin, readJSON } from "@/lib/http";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const { password } = z
      .object({ password: z.string().min(1).max(200) })
      .parse(await readJSON(request));
    if (!(await checkPassword(password)))
      return NextResponse.json({ error: "Нууц үг буруу байна." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, sessionToken(), {
      httpOnly: true,
      sameSite: "strict",
      secure: request.headers.get("origin")?.startsWith("https:") ?? false,
      path: "/",
      maxAge: 28800,
    });
    return response;
  } catch (e) {
    return apiError(e);
  }
}
