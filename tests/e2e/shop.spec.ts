import { test, expect } from "@playwright/test";
test("catalog, constructor, persistent cart and Telegram handoff", async ({
  page,
}) => {
  await page.goto("/catalog");
  await page.getByPlaceholder("Например, медведь").fill("несуществующая");
  await expect(page.getByText("Пока нет совпадений")).toBeVisible();
  await page.getByRole("button", { name: "Показать все формы" }).click();
  await expect(page.getByText("Найдено форм: 40")).toBeVisible();
  await page.getByRole("button", { name: "Ботанические", exact: true }).click();
  await expect(page.getByText("Найдено форм: 6")).toBeVisible();
  await page.getByRole("button", { name: "Сбросить фильтры" }).click();
  await page.goto("/catalog/embrace");
  await page.getByLabel("20-34 см").check();
  await page.getByLabel("Кокосовый воск").check();
  await page.getByLabel("Дополнительный декор").check();
  await page.getByLabel("Количество", { exact: true }).fill("2");
  await expect(page.locator(".price")).toContainText("6 000");
  await page.getByRole("button", { name: "Добавить в корзину" }).click();
  await page.getByLabel("6-9 см", { exact: false }).check();
  await page.getByRole("button", { name: "Добавить в корзину" }).click();
  await page.goto("/cart");
  await expect(page.locator(".cart-item")).toHaveCount(2);
  await page.reload();
  await expect(page.locator(".cart-item")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Изменить параметры" })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Сохранить параметры" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Сохранить параметры" }).click();
  await page
    .getByRole("button", { name: "Удалить", exact: true })
    .last()
    .click();
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await page.getByRole("link", { name: "Оформить заказ" }).click();
  await expect(page.getByLabel("Состав заказа для отправки")).toHaveValue(/4\s000/);
  await expect(page.getByRole("link", {name:"Перейти к заказу в Telegram"})).toHaveAttribute("href", /https:\/\/t\.me\/share\/url\?/);
  await expect(page.locator(".cart-link")).toContainText("2");

});
test("responsive pages do not overflow; menu and navigation work", async ({
  page,
}, testInfo) => {
  for (const route of [
    "/",
    "/catalog",
    "/about",
    "/delivery",
    "/payment",
    "/contacts",
    "/privacy",
    "/terms",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Меню", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Основная навигация" })
      .getByRole("link", { name: "Коллекция" })
      .click();
    await expect(page).toHaveURL(/catalog/);
  }
  await page.goto("/");
  await page.screenshot({
    path: `test-results/screenshots/${testInfo.project.name}-home.png`,
    fullPage: true,
  });
});
test("endpoint rejects spoofed price, bad origin and unauthenticated retry", async ({
  request,
}) => {
  const origin = await request.post("/api/orders", {
    data: {},
    headers: { origin: "https://wrong.example" },
  });
  expect(origin.status()).toBe(403);
  const invalid = await request.post("/api/orders", {
    data: { price: 1 },
    headers: { origin: "http://localhost:3014" },
  });
  expect(invalid.status()).toBe(400);
  const retry = await request.post("/api/internal/retry");
  expect(retry.status()).toBe(401);
});
