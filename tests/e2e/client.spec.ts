import { test,expect } from "@playwright/test";
test("all sources, aromas and studio gallery are accessible",async({page})=>{
 await page.goto("/catalog");await expect(page.locator(".product-card")).toHaveCount(40);
 await expect(page.locator("main")).not.toContainText(/демонстрац|тестов|референс|исходн|параметры не подтверждены|визуальная подборка/i);
 await page.goto("/catalog/embrace");
 await expect(page.getByLabel("Аромат",{exact:true}).locator("option")).toHaveCount(11);
 await page.getByLabel("Аромат",{exact:true}).selectOption("vanilla");await expect(page.locator(".price")).toContainText("1 700");
 await expect(page.getByRole("button",{name:"Другой вид",exact:true})).toHaveCount(0);
 await expect(page.locator(".gallery-thumbs")).toHaveCount(0);
 await expect(page.locator(".detail-image-frame img")).toHaveAttribute("src",/MEDIA-21-studio-\d+\.webp/);
});
test("handoff copies full basket and gracefully handles clipboard denial",async({page})=>{
 await page.goto("/catalog/embrace");await page.getByLabel("Аромат",{exact:true}).selectOption("rose");await expect(page.locator(".price")).toContainText("1 700");await page.getByRole("button",{name:"Добавить в корзину"}).click();await page.goto("/checkout");
 await page.getByLabel("Пожелания к заказу").fill("В подарок");
 await expect(page.getByLabel("Состав заказа для отправки")).toHaveValue(/Роза[\s\S]*В подарок/);
 // Intercept only the external handoff; never open a real Telegram chat in tests.
 await page.context().route("https://t.me/**",route=>route.fulfill({body:"Telegram handoff captured"}));
 const handoff=page.getByRole("link",{name:"Перейти к заказу в Telegram"});
 const draft=new URL((await handoff.getAttribute("href"))!);
 expect(draft.pathname).toBe("/share/url");
 expect(draft.searchParams.get("text")).toBe(await page.getByLabel("Состав заказа для отправки").inputValue());
 await expect(page.getByRole("link",{name:"Приглашение в группу мастерской"})).toHaveAttribute("href","https://t.me/+qQX5YNnktWlkOTIy");
 await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:()=>Promise.reject(new Error("denied"))}}));
 const deniedPopup=page.waitForEvent("popup");await handoff.click();const first=await deniedPopup;await expect(first).toHaveURL(draft.href);await first.close();await expect(page.getByRole("status")).toContainText("Состав заказа передан в ссылке Telegram");
 await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:(value:string)=>{(window as unknown as {copied:string}).copied=value;return Promise.resolve();}}}));
 const copiedPopup=page.waitForEvent("popup");await handoff.click();const second=await copiedPopup;await expect(second).toHaveURL(draft.href);await second.close();await expect(page.getByRole("status")).toContainText("Состав заказа скопирован");
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
