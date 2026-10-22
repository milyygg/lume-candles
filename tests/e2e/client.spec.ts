import { test,expect } from "@playwright/test";
test("all sources, aromas and studio gallery are accessible",async({page})=>{
 await page.goto("/catalog");await expect(page.locator(".product-card")).toHaveCount(40);
 await expect(page.locator("main")).not.toContainText(/демонстрац|тестов|референс|исходн|параметры не подтверждены|визуальная подборка/i);
 await page.goto("/catalog/embrace");
 await expect(page.getByLabel("Аромат",{exact:true}).locator("option")).toHaveCount(11);
 await page.getByLabel("Аромат",{exact:true}).selectOption("vanilla");await expect(page.locator(".price")).toContainText("1 700");
 await page.getByRole("button",{name:"Другой вид",exact:true}).click();await expect(page.locator(".detail-image-frame img")).toHaveAttribute("src",/\/photography\/optimized\/MEDIA-21-original-\d+\.webp/);
 await page.getByRole("button",{name:"Светлый фон",exact:true}).click();await expect(page.locator(".detail-image-frame img")).toHaveAttribute("src",/studio/);
});
test("handoff copies full basket and gracefully handles clipboard denial",async({page})=>{
 await page.goto("/catalog/embrace");await page.getByLabel("Аромат",{exact:true}).selectOption("rose");await expect(page.locator(".price")).toContainText("1 700");await page.getByRole("button",{name:"Добавить в корзину"}).click();await page.goto("/checkout");
 await page.getByLabel("Пожелания к заказу").fill("В подарок");
 await expect(page.getByLabel("Состав заказа для отправки")).toHaveValue(/Роза[\s\S]*В подарок/);
 await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:()=>Promise.reject(new Error("denied"))}}));
 await page.getByRole("button",{name:"Скопировать состав заказа"}).click();await expect(page.getByRole("status")).toContainText("вручную");
 await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:(value:string)=>{(window as unknown as {copied:string}).copied=value;return Promise.resolve();}}}));
 await page.getByRole("button",{name:"Скопировать состав заказа"}).click();await expect(page.getByRole("status")).toContainText("вставьте сообщение");
 expect(await page.evaluate(()=>(window as unknown as {copied:string}).copied)).toContain("Роза");
 await expect(page.locator(".cart-link")).toContainText("1");
});
test("motion, reduced motion and mobile menu remain functional",async({page},info)=>{
 await page.emulateMedia({reducedMotion:"no-preference"});await page.goto("/");
 expect(await page.locator(".hero-editorial h1").evaluate(el=>getComputedStyle(el).animationName)).not.toBe("none");
 await page.locator(".why-points").scrollIntoViewIfNeeded();await expect(page.locator(".why-points [data-reveal]").first()).toHaveClass(/seen/);
 await page.emulateMedia({reducedMotion:"reduce"});expect(await page.locator(".hero-editorial h1").evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
 if(info.project.name==="mobile"){
 await page.evaluate(()=>window.scrollTo(0,0));await page.getByRole("button",{name:"Меню",exact:true}).click();await expect(page.getByRole("navigation",{name:"Основная навигация"})).toBeVisible();await page.getByRole("navigation",{name:"Основная навигация"}).getByRole("link").first().focus();await page.keyboard.press("Escape");await expect(page.getByRole("button",{name:"Меню",exact:true})).toBeFocused();await expect(page.getByRole("navigation",{name:"Основная навигация"})).not.toBeVisible();
 }
});
