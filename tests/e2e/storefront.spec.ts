import { test, expect } from "@playwright/test";

test("home elements emerge from empty space on scroll and respect reduced motion", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const shape = page.locator(".home-morph-shape");
  const firstCardArt = page.locator(".product-art").first();
  await expect(shape).toHaveCSS("opacity", "0");
  await expect(firstCardArt).toHaveCSS("opacity", "0");
  const initialWidth = (await shape.boundingBox())!.width;
  await page.screenshot({ path: testInfo.outputPath("home-before-scroll.png") });
  await page.evaluate(() => window.scrollTo({ top: 350, behavior: "instant" }));
  await expect.poll(async () => Number(await shape.evaluate((node) => getComputedStyle(node).opacity))).toBeGreaterThan(0.1);
  expect(Number(await shape.evaluate((node) => getComputedStyle(node).opacity))).toBeLessThan(0.9);
  await page.evaluate(() =>
    window.scrollTo({
      top: document.querySelector(".home-morph")!.getBoundingClientRect().top + window.scrollY,
      behavior: "instant",
    }),
  );
  await expect.poll(async () => (await shape.boundingBox())!.width).toBeGreaterThan(initialWidth + 100);
  await expect(shape).toHaveCSS("opacity", "1");
  await expect(firstCardArt).toHaveCSS("opacity", "1");
  await page.screenshot({ path: testInfo.outputPath("home-after-scroll.png") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(shape).toHaveCSS("animation-name", "none");
});

test("one desktop wheel gesture advances one home section while mobile keeps long sections scrollable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-home-scroll-ready", "true");
  await expect(page.locator("html")).toHaveCSS("scrollbar-width", "none");
  await expect(page.locator(".site-header")).toHaveCSS("backdrop-filter", "none");

  await page.mouse.wheel(0, 120);
  await page.mouse.wheel(0, 120);
  for (let step = 0; step < 8; step++) {
    await page.waitForTimeout(100);
    await page.mouse.wheel(0, 40);
  }
  await expect.poll(async () =>
    Math.round((await page.locator("#collection").boundingBox())!.y),
  ).toBe(89);
  expect((await page.locator("#how-it-works").boundingBox())!.y).toBeGreaterThan(800);

  await page.waitForTimeout(750);
  await page.mouse.wheel(0, 120);
  await expect.poll(async () =>
    Math.round((await page.locator("#how-it-works").boundingBox())!.y),
  ).toBe(89);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const collectionTop = await page.locator("#collection").evaluate((node) => (node as HTMLElement).offsetTop);
  await page.evaluate((top) => window.scrollTo({ top: top + 500, behavior: "instant" }), collectionTop);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(collectionTop + 300);
});

test("DIY starts empty and catalog filters can build a bracelet", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/design");
  await expect(page.getByText("Таны бүтээл энд эхэлнэ")).toBeVisible();
  await expect(page.getByRole("button", { name: "Энэ загвараар захиалах" })).toBeDisabled();
  await page.getByRole("button", { name: "Ягаан", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ягаан кварц нэмэх" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ногоон авентурин нэмэх" })).toHaveCount(0);
  await page.getByRole("button", { name: "Бүгд", exact: true }).click();
  await page.getByRole("textbox", { name: "Чулуу хайх" }).fill("moon");
  await expect(page.getByRole("button", { name: "Саран чулуу нэмэх" })).toBeVisible();
  await page.getByRole("textbox", { name: "Чулуу хайх" }).fill("");
  await page.getByRole("button", { name: "Ягаан кварц нэмэх" }).click();
  await page.getByRole("button", { name: "Ягаан кварц нэмэх" }).click();
  const secondPosition = await page
    .getByRole("button", { name: "2. Ягаан кварц" })
    .getAttribute("transform");
  await page.getByRole("button", { name: "Ягаан кварц нэмэх" }).click();
  await expect(page.getByRole("button", { name: "2. Ягаан кварц" })).toHaveAttribute(
    "transform",
    secondPosition!,
  );
  await page.getByRole("button", { name: "Ягаан кварц чулуугаар бүхэлд нь бөглөх" }).click();
  await expect(page.getByRole("progressbar", { name: "Чулууны тоо" })).toHaveAttribute(
    "aria-valuenow",
    "24",
  );
  await expect(page.getByRole("button", { name: "Энэ загвараар захиалах" })).toBeEnabled();
  await page.screenshot({
    path: testInfo.outputPath("diy-three-column-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("diy-mobile.png"), fullPage: true });
});

test("touch dragging swaps bracelet positions without scrolling the canvas", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto("/design?preset=morning");
    const source = await page.getByRole("button", { name: /^2\. / }).boundingBox();
    const destination = await page.getByRole("button", { name: /^8\. / }).boundingBox();
    expect(source && destination).toBeTruthy();
    const from = { x: source!.x + source!.width / 2, y: source!.y + source!.height / 2 };
    const to = {
      x: destination!.x + destination!.width / 2,
      y: destination!.y + destination!.height / 2,
    };
    const startScroll = await page.evaluate(() => window.scrollY);
    const session = await context.newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
    for (let step = 1; step <= 12; step++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: from.x + ((to.x - from.x) * step) / 12, y: from.y + ((to.y - from.y) * step) / 12 },
        ],
      });
      await page.waitForTimeout(15);
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByRole("button", { name: "8. Ногоон авентурин" })).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(startScroll);
  } finally {
    await context.close();
  }
});

test("desktop storefront and mobile layout have working navigation and no overflow", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat/i.test(message.text())) errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Таны мэдрэмж");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({ path: testInfo.outputPath("desktop-home.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("mobile-home.png"), fullPage: true });
  await page.getByRole("button", { name: "Цэс нээх" }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Байгалийн чулуу" }).click();
  await expect(page).toHaveURL(/#stones$/);
  await expect(page.getByRole("button", { name: "Цэс нээх" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("design, save, checkout, manual payment and fulfilment work end to end", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/design?preset=morning");
  await page.getByRole("button", { name: /^1\. / }).click();
  await page.getByRole("button", { name: "Ягаан кварц солих", exact: true }).click();
  await expect(page.getByRole("button", { name: "1. Ягаан кварц", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Чулууг баруун тийш шилжүүлэх" }).click();
  await expect(page.getByRole("button", { name: "2. Ягаан кварц", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Өмнөх үйлдлийг буцаах" }).click();
  await expect(page.getByRole("button", { name: "1. Ягаан кварц", exact: true })).toBeVisible();
  const name = `E2E ${Date.now()}`;
  await page.getByLabel("Загварын нэр").fill(name);
  await page.getByRole("button", { name: "Хадгалах", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("хадгалагдлаа");
  await page.reload();
  await page.getByRole("button", { name: "Хадгалсан загвар", exact: true }).click();
  await expect(page.getByLabel("Загварын нэр")).toHaveValue(name);
  await page.getByRole("button", { name: /^2\. / }).click();
  await page.getByRole("button", { name: "Charms", exact: true }).click();
  await page
    .getByRole("group", { name: "Charm төрлөөр шүүх" })
    .getByRole("button", { name: "Унжлага" })
    .click();
  await page.getByRole("button", { name: "Сарны унжлага солих" }).click();
  await expect(page.getByRole("button", { name: "2. Сарны унжлага" })).toBeVisible();
  const start = await page.getByRole("button", { name: "2. Сарны унжлага" }).boundingBox();
  const drop = await page.getByRole("button", { name: /^8\. / }).boundingBox();
  expect(start && drop).toBeTruthy();
  await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2);
  await page.mouse.down();
  await page.mouse.move(drop!.x + drop!.width / 2, drop!.y + drop!.height / 2, { steps: 14 });
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "8. Сарны унжлага" })).toBeVisible();
  await page.getByRole("button", { name: "Өмнөх үйлдлийг буцаах" }).click();
  await expect(page.getByRole("button", { name: "2. Сарны унжлага" })).toBeVisible();
  const returnStart = await page.getByRole("button", { name: "2. Сарны унжлага" }).boundingBox();
  const returnDrop = await page.getByRole("button", { name: /^8\. / }).boundingBox();
  await page.mouse.move(
    returnStart!.x + returnStart!.width / 2,
    returnStart!.y + returnStart!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    returnDrop!.x + returnDrop!.width / 2,
    returnDrop!.y + returnDrop!.height / 2,
    { steps: 14 },
  );
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "8. Сарны унжлага" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("charms-designer.png"), fullPage: true });
  await page.screenshot({ path: testInfo.outputPath("desktop-designer.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("mobile-designer.png"), fullPage: true });
  await page.getByRole("button", { name: "Энэ загвараар захиалах" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByRole("link", { name: "Дизайнер руу буцах", exact: true }).click();
  await expect(page.getByLabel("Загварын нэр")).toHaveValue(name);
  await page.getByRole("button", { name: "Энэ загвараар захиалах" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByLabel("Таны нэр", { exact: true }).fill("Туршилтын хэрэглэгч");
  await page.getByLabel("Утасны дугаар").fill("99112233");
  await page.getByLabel("Хүргэлтийн хаяг").fill("Улаанбаатар, туршилтын хаяг 123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Захиалга үүсгэх", exact: true }).click();
  await expect(page).toHaveURL(/\/order\/[a-f0-9]{64}$/);
  const orderUrl = page.url();
  const code = (await page.locator(".order-code > span").innerText()).trim();
  await expect(page.getByText("TEST-ACCOUNT-DO-NOT-PAY")).toBeVisible();
  await expect(page.locator(".order-summary .status-badge")).toHaveText("Төлбөр хүлээж байна");
  await page.goto("/admin");
  await page.getByLabel("Админы нууц үг").fill("local-e2e-password-only");
  await page.getByRole("button", { name: "Нэвтрэх", exact: true }).click();
  await page.getByRole("textbox", { name: "Захиалга хайх" }).fill(code);
  await page.getByRole("button", { name: "Нээх", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Сарны унжлага × 1")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Төлбөр баталгаажуулах", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Гүйлгээний лавлагаа / тайлбар").fill("TEST-BANK-001");
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page.getByRole("button", { name: "Төлбөр баталгаажуулах", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator("tbody .status-badge")).toHaveText("Бэлтгэж байна");
  await page.getByRole("button", { name: "Нээх", exact: true }).click();
  await page.getByRole("button", { name: "Хүргэлтэд гаргах", exact: true }).click();
  await expect(page.locator("tbody .status-badge")).toHaveText("Хүргэлтэд гарсан");
  await page.getByRole("button", { name: "Нээх", exact: true }).click();
  await page.getByRole("button", { name: "Дуусгах", exact: true }).click();
  await expect(page.locator("tbody .status-badge")).toHaveText("Дууссан");
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({ path: testInfo.outputPath("admin-dashboard.png"), fullPage: true });
  await page.goto(orderUrl);
  await expect(page.locator(".order-summary .status-badge")).toHaveText("Дууссан");
  await expect(page.locator(".order-events > p")).toHaveCount(4);
});

test("private admin mutations reject anonymous and cross-origin requests", async ({ request }) => {
  const origin = "http://127.0.0.1:3100";
  const unauthorized = await request.patch("/api/admin/stones/rose", {
    headers: { origin },
    data: { price: 1, stock: 999, active: 1 },
  });
  expect(unauthorized.status()).toBe(401);
  const crossOrigin = await request.post("/api/orders", {
    headers: { origin: "https://untrusted.example" },
    data: {},
  });
  expect(crossOrigin.status()).toBe(400);
  const malformed = await request.post("/api/orders", {
    headers: { origin },
    data: { design: { beads: ["fake"] }, total: 1 },
  });
  expect(malformed.status()).toBe(400);
  const unknown = await request.get(`/order/${"a".repeat(64)}`);
  expect(unknown.status()).toBe(404);
});
