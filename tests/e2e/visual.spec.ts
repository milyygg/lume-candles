import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";

test("redesign screenshots, original photos, fonts and reduced motion", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const folder = `docs/redesign/screenshots/${testInfo.project.name}`;
  await fs.mkdir(folder, { recursive: true });
  for (const [route, name] of [
    ["/", "home"],
    ["/catalog", "catalog"],
    ["/catalog/embrace", "product"],
  ]) {
    await page.goto(route);
    // Load lazy pictures by scrolling, as a visitor would, without mutating SSR attributes.
    for (const image of await page.locator("main img:visible").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty("complete", true);
    }
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(() =>
        [...document.images].every((image) => image.naturalWidth > 0),
      ),
    ).toBe(true);
    await expect(page.locator(".skip")).not.toBeInViewport();
    expect(
      await page.evaluate(() =>
        document.fonts.check("500 16px Manrope", "Свечи"),
      ),
    ).toBe(true);
    expect(
      await page.evaluate(() =>
        document.fonts.check('500 48px "Cormorant Garamond"', "Форма"),
      ),
    ).toBe(true);
    await page.screenshot({ path: `${folder}/${name}.png`, fullPage: true });
    if (name === "catalog") {
      await page
        .locator(".product-card")
        .first()
        .screenshot({ path: `${folder}/card.png` });
      await expect(page.locator(".product-photo img").first()).toHaveAttribute(
        "src",
        /\/photography\/MEDIA-/,
      );
      expect(
        await page
          .locator(".product-photo img")
          .first()
          .evaluate((image) => getComputedStyle(image).objectFit),
      ).toBe("contain");
    }
  }
  await page.getByLabel("Более 9 до 20 см").check();
  await page.getByLabel("Соевый воск").check();
  await page.getByLabel("Дополнительный декор").check();
  await page.getByRole("button", { name: "Увеличить количество" }).click();
  await expect(page.locator(".price")).toContainText("4 800");
  await expect(page.locator(".skip")).not.toBeInViewport();
  await page
    .locator(".configurator")
    .screenshot({ path: `${folder}/constructor.png` });
  await page.getByRole("button", { name: "Добавить в корзину" }).click();
  await page.goto("/cart");
  await expect(page.locator(".summary-total")).toContainText("4 800");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: `${folder}/cart.png`, fullPage: true });
  await page.getByRole("link", { name: "Оформить заказ" }).click();
  await expect(page.getByRole("heading", { name: "Почти ваша" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: `${folder}/checkout.png`, fullPage: true });
  expect(errors).toEqual([]);
  await page.goto("/catalog/embrace");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip")).toBeFocused();
  await expect(page.locator(".skip")).toBeInViewport();
  await page.keyboard.press("Tab");
  await expect(page.locator(".logo")).toBeFocused();
});
