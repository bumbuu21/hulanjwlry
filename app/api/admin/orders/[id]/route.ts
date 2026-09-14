import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { transitionOrder } from "@/lib/orders";
import { apiError, assertOrigin, readJSON } from "@/lib/http";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertOrigin(request);
    if (!(await isAdmin()))
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    const { id } = await params;
    const { status, note } = z
      .object({
        status: z.enum(["preparing", "shipped", "completed", "cancelled"]),
        note: z.string().trim().max(500).default(""),
      })
      .parse(await readJSON(request));
    await transitionOrder(id, status, note);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
