import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initialStones, initialMaterials, makePreset } from "../lib/catalog";
import { quoteDesign, recommendedCount, orderSchema, validTransition } from "../lib/domain";
import { createOrder, getOrder, getStones, getMaterials, transitionOrder } from "../lib/orders";
import { withDB } from "../lib/db";

process.env.SQLITE_PATH = join(tmpdir(), `hulan-test-${randomUUID()}.sqlite`);
const design = { name: "Test bracelet", wrist: 16, beads: makePreset() };
const input = () => ({
  design,
  customer: { name: "Тест", phone: "99112233", address: "Зөвхөн туршилтын хаяг", note: "" },
  idempotencyKey: randomUUID(),
});

test("quote derives material and all fees from the server catalogue", () => {
  const quote = quoteDesign(design, initialStones);
  assert.equal(quote.material, 15 * 1600 + 9 * 2200);
  assert.equal(quote.total, quote.material + 12000 + 6000);
  const forged = orderSchema.parse({ ...input(), total: 1, status: "preparing" });
  assert.equal("total" in forged, false);
  assert.equal("status" in forged, false);
});
test("charms are priced as distinct materials and tracked through payment and cancellation", async () => {
  const mixedDesign = { ...design, beads: [...design.beads] };
  mixedDesign.beads[0] = "charm-moon";
  const quote = quoteDesign(mixedDesign, initialMaterials);
  assert.equal(quote.material, quoteDesign(design, initialStones).material - 1600 + 5500);
  const before = (await getMaterials()).find((material) => material.id === "charm-moon")!.stock;
  const order = await createOrder({ ...input(), design: mixedDesign });
  assert.equal(
    order.materials.find((material) => material.id === "charm-moon")?.name,
    "Сарны унжлага",
  );
  await transitionOrder(order.id, "preparing", "CHARM-BANK-001");
  assert.equal(
    (await getMaterials()).find((material) => material.id === "charm-moon")!.stock,
    before - 1,
  );
  await transitionOrder(order.id, "cancelled", "Manual refund logged");
  assert.equal(
    (await getMaterials()).find((material) => material.id === "charm-moon")!.stock,
    before,
  );
});
test("all supported wrists have a valid recommended bead count", () => {
  for (let wrist = 13; wrist <= 22; wrist++) {
    const beads = Array(recommendedCount(wrist)).fill("rose");
    assert.ok(beads.length >= 16 && beads.length <= 32);
    assert.doesNotThrow(() => quoteDesign({ ...design, wrist, beads }, initialStones));
  }
});
test("unknown stones, insufficient stock and unsuitable fit are rejected", () => {
  assert.throws(() => quoteDesign({ ...design, beads: Array(24).fill("fake") }, initialStones));
  assert.throws(() =>
    quoteDesign(
      design,
      initialStones.map((stone) => ({ ...stone, stock: 0 })),
    ),
  );
  assert.throws(() => quoteDesign({ ...design, wrist: 22 }, initialStones));
  assert.throws(() =>
    orderSchema.parse({ ...input(), customer: { ...input().customer, phone: "123" } }),
  );
});
test("payment and fulfilment cannot skip or repeat stages", () => {
  assert.equal(validTransition("pending", "shipped"), false);
  assert.equal(validTransition("pending", "preparing"), true);
  assert.equal(validTransition("preparing", "preparing"), false);
  assert.equal(validTransition("completed", "cancelled"), false);
  assert.equal(validTransition("cancelled", "preparing"), false);
});
test("duplicate concurrent submissions return one persisted order", async () => {
  const payload = input();
  const [first, second] = await Promise.all([createOrder(payload), createOrder(payload)]);
  assert.equal(first.id, second.id);
  assert.equal(first.token, second.token);
  const loaded = await getOrder(first.token);
  assert.equal(loaded?.events.length, 1);
  assert.equal(loaded?.customer.phone, payload.customer.phone);
  await assert.rejects(
    createOrder({ ...payload, customer: { ...payload.customer, name: "Өөр нэр" } }),
  );
});
test("concurrent payment confirmation deducts stock only once; cancellation restores once", async () => {
  const before = await getStones();
  const order = await createOrder(input());
  const result = await Promise.allSettled([
    transitionOrder(order.id, "preparing", "BANK-001"),
    transitionOrder(order.id, "preparing", "BANK-001"),
  ]);
  assert.equal(result.filter((r) => r.status === "fulfilled").length, 1);
  const after = await getStones();
  assert.equal(
    after.find((s) => s.id === "sage")!.stock,
    before.find((s) => s.id === "sage")!.stock - 15,
  );
  await transitionOrder(order.id, "cancelled", "Refund handled manually");
  await assert.rejects(transitionOrder(order.id, "cancelled", "Again"));
  assert.equal(
    (await getStones()).find((s) => s.id === "sage")!.stock,
    before.find((s) => s.id === "sage")!.stock,
  );
  const loaded = await getOrder(order.token);
  assert.deepEqual(
    loaded?.events.map((e) => e.status),
    ["pending", "preparing", "cancelled"],
  );
});
test("insufficient material rolls back every stock change and leaves order pending", async () => {
  const order = await createOrder(input());
  const before = await getStones();
  await withDB((db) => db.query("UPDATE stones SET stock = 0 WHERE id = ?", ["moon"]));
  await assert.rejects(transitionOrder(order.id, "preparing", "BANK-002"));
  const after = await getStones();
  assert.equal(
    after.find((s) => s.id === "sage")!.stock,
    before.find((s) => s.id === "sage")!.stock,
  );
  assert.equal((await getOrder(order.token))?.status, "pending");
  await withDB((db) =>
    db.query("UPDATE stones SET stock = ? WHERE id = ?", [
      before.find((s) => s.id === "moon")!.stock,
      "moon",
    ]),
  );
});
