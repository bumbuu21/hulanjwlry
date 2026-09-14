import { NextResponse } from "next/server";
import { orderSchema } from "@/lib/domain";
import { createOrder } from "@/lib/orders";
import { apiError, assertOrigin, paymentSettings, readJSON } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const payment = paymentSettings();
    if (!payment.configured && !payment.preview) throw new Error("Захиалга түр нээгдээгүй байна.");
    const input = orderSchema.parse(await readJSON(request));
    const order = await createOrder(input);
    return NextResponse.json({ token: order.token }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
