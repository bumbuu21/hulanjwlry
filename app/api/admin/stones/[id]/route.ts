import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { withDB } from "@/lib/db";
import { apiError, assertOrigin, readJSON } from "@/lib/http";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertOrigin(request);
    if (!(await isAdmin()))
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    const { id } = await params;
    const { price, stock, active } = z
      .object({
        price: z.number().int().min(100).max(1000000),
        stock: z.number().int().min(0).max(1000000),
        active: z.number().int().min(0).max(1),
      })
      .parse(await readJSON(request));
    const rows = await withDB((db) =>
      db.query("UPDATE stones SET price = ?, stock = ?, active = ? WHERE id = ? RETURNING id", [
        price,
        stock,
        active,
        id,
      ]),
    );
    if (!rows.length) throw new Error("Чулуу олдсонгүй.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
