import { createHash, randomBytes, randomUUID } from "node:crypto";
import { withDB, type Row } from "./db";
import { isCharm, type Stone, type OrderStatus } from "./catalog";
import { countBeads, quoteDesign, validTransition, type OrderInput, type Design } from "./domain";

export type Order = {
  id: string;
  token: string;
  code: string;
  status: OrderStatus;
  design: Design;
  customer: OrderInput["customer"];
  quote: ReturnType<typeof quoteDesign>;
  materials: Stone[];
  created_at: string;
  updated_at: string;
};
export type OrderEvent = {
  id: string;
  status: OrderStatus;
  actor: string;
  note: string;
  created_at: string;
};
function parseOrder(row: Row): Order {
  return {
    id: String(row.id),
    token: String(row.token),
    code: String(row.code),
    status: row.status as OrderStatus,
    design: JSON.parse(String(row.design)),
    customer: JSON.parse(String(row.customer)),
    quote: JSON.parse(String(row.quote)),
    materials: JSON.parse(String(row.materials)),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}
export async function getStones(): Promise<Stone[]> {
  return (await getMaterials()).filter((material) => !isCharm(material));
}
export async function getMaterials(): Promise<Stone[]> {
  return withDB(
    async (db) => (await db.query("SELECT * FROM stones ORDER BY id")) as unknown as Stone[],
  );
}
export async function createOrder(input: OrderInput) {
  const payloadHash = createHash("sha256")
    .update(JSON.stringify({ design: input.design, customer: input.customer }))
    .digest("hex");
  return withDB(async (db) => {
    const existing = await db.query("SELECT * FROM orders WHERE idempotency_key = ?", [
      input.idempotencyKey,
    ]);
    if (existing.length) {
      if (existing[0].payload_hash !== payloadHash)
        throw new Error("Захиалгын мэдээлэл өөрчлөгдсөн байна. Хуудсаа шинэчилнэ үү.");
      return parseOrder(existing[0]);
    }
    const stones = (await db.query("SELECT * FROM stones")) as unknown as Stone[];
    const quote = quoteDesign(input.design, stones);
    const id = randomUUID(),
      token = randomBytes(32).toString("hex"),
      now = new Date().toISOString();
    const code = `HJ-${randomBytes(5).toString("hex").toUpperCase()}`;
    const materials = stones.filter((s) => input.design.beads.includes(s.id));
    await db.query(
      "INSERT INTO orders (id,token,idempotency_key,payload_hash,code,status,design,customer,quote,materials,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        id,
        token,
        input.idempotencyKey,
        payloadHash,
        code,
        "pending",
        JSON.stringify(input.design),
        JSON.stringify(input.customer),
        JSON.stringify(quote),
        JSON.stringify(materials),
        now,
        now,
      ],
    );
    await db.query(
      "INSERT INTO order_events (id,order_id,status,actor,note,created_at) VALUES (?,?,?,?,?,?)",
      [randomUUID(), id, "pending", "customer", "Захиалга үүсгэсэн", now],
    );
    return {
      id,
      token,
      code,
      status: "pending" as const,
      design: input.design,
      customer: input.customer,
      quote,
      materials,
      created_at: now,
      updated_at: now,
    };
  });
}
export async function getOrder(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return withDB(async (db) => {
    const rows = await db.query("SELECT * FROM orders WHERE token = ?", [token]);
    if (!rows[0]) return null;
    const order = parseOrder(rows[0]);
    const events = (await db.query(
      "SELECT id,status,actor,note,created_at FROM order_events WHERE order_id = ? ORDER BY created_at",
      [order.id],
    )) as unknown as OrderEvent[];
    return { ...order, events };
  });
}
export async function listOrders() {
  return withDB(async (db) =>
    (await db.query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200")).map(parseOrder),
  );
}
export async function transitionOrder(id: string, status: OrderStatus, note: string) {
  return withDB(async (db) => {
    const rows = await db.query("SELECT * FROM orders WHERE id = ?", [id]);
    if (!rows.length) throw new Error("Захиалга олдсонгүй.");
    const order = parseOrder(rows[0]);
    if (!validTransition(order.status, status))
      throw new Error("Захиалгын төлөв өөрчлөгдсөн байна. Дахин ачаална уу.");
    if (status === "preparing") {
      if (!note.trim()) throw new Error("Тулгасан гүйлгээний лавлагааг оруулна уу.");
      for (const [stone, count] of Object.entries(countBeads(order.design.beads))) {
        const changed = await db.query(
          "UPDATE stones SET stock = stock - ? WHERE id = ? AND stock >= ? RETURNING id",
          [count, stone, count],
        );
        if (!changed.length)
          throw new Error("Материалын үлдэгдэл хүрэлцэхгүй байна. Үлдэгдлээ шалгана уу.");
      }
    }
    if (order.status === "preparing" && status === "cancelled") {
      if (!note.trim()) throw new Error("Буцаалт болон цуцлалтын тайлбар оруулна уу.");
      for (const [stone, count] of Object.entries(countBeads(order.design.beads)))
        await db.query("UPDATE stones SET stock = stock + ? WHERE id = ?", [count, stone]);
    }
    const now = new Date().toISOString();
    await db.query("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", [status, now, id]);
    await db.query(
      "INSERT INTO order_events (id,order_id,status,actor,note,created_at) VALUES (?,?,?,?,?,?)",
      [randomUUID(), id, status, "admin", note, now],
    );
    return { ...order, status, updated_at: now };
  });
}
