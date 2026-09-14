import { z } from "zod";
import { DELIVERY_FEE, LABOR_FEE, type Stone, type OrderStatus } from "./catalog";

export const designSchema = z.object({
  beads: z.array(z.string().min(1).max(30)).min(16).max(32),
  wrist: z.number().int().min(13).max(22),
  name: z.string().trim().min(1).max(60),
});
export const orderSchema = z.object({
  design: designSchema,
  customer: z.object({
    name: z.string().trim().min(2, "Нэрээ оруулна уу").max(80),
    phone: z.string().regex(/^[6-9]\d{7}$/, "8 оронтой утасны дугаар оруулна уу"),
    address: z.string().trim().min(8, "Хүргэлтийн хаягаа дэлгэрэнгүй оруулна уу").max(400),
    note: z.string().trim().max(500).default(""),
  }),
  idempotencyKey: z.uuid(),
});
export type Design = z.infer<typeof designSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export function countBeads(beads: string[]) {
  return beads.reduce<Record<string, number>>((counts, id) => {
    counts[id] = (counts[id] ?? 0) + 1;
    return counts;
  }, {});
}
// Estimate inner circumference of an 8 mm bead ring. Production calibration is still required.
export function innerCircumference(count: number) {
  return Math.round(((count * 8 - Math.PI * 8) / 10) * 10) / 10;
}
export function recommendedCount(wrist: number) {
  return Math.round(((wrist + 0.7) * 10 + Math.PI * 8) / 8);
}
export function quoteDesign(design: Design, stones: Stone[]) {
  const counts = countBeads(design.beads);
  let material = 0;
  for (const [id, quantity] of Object.entries(counts)) {
    const stone = stones.find((s) => s.id === id && s.active);
    if (!stone) throw new Error("Сонгосон материал одоогоор худалдаанд байхгүй байна.");
    if (stone.stock < quantity) throw new Error(`${stone.name}: үлдэгдэл хүрэлцэхгүй байна.`);
    material += stone.price * quantity;
  }
  if (Math.abs(design.beads.length - recommendedCount(design.wrist)) > 1) {
    throw new Error("Бугуйн хэмжээндээ тохируулж чулууны тоогоо өөрчилнө үү.");
  }
  return {
    material,
    labor: LABOR_FEE,
    delivery: DELIVERY_FEE,
    total: material + LABOR_FEE + DELIVERY_FEE,
  };
}
export function validTransition(from: OrderStatus, to: OrderStatus) {
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    pending: ["preparing", "cancelled"],
    preparing: ["shipped", "cancelled"],
    shipped: ["completed"],
    completed: [],
    cancelled: [],
  };
  return allowed[from].includes(to);
}
