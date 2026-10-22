import { chromium, devices } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base=process.env.LUME_CHECK_URL || "http://localhost:3015/lume-candles";
const output=process.env.LUME_CHECK_FOLDER || "docs/client-redesign/pages-preview";
const resultFile=process.env.LUME_CHECK_RESULT || "docs/client-redesign/pages-checks.json";
const browser=await chromium.launch({channel:"msedge"});
const results=[];
try{for(const [name,device] of [["desktop",{viewport:{width:1440,height:960}}],["tablet",{viewport:{width:768,height:1024}}],["mobile",devices["iPhone 13"]]]){
 const context=await browser.newContext({...device,reducedMotion:"reduce"});const page=await context.newPage();const errors=[];
 page.on("pageerror",error=>errors.push(error.message));page.on("response",response=>{if(response.url().startsWith(base)&&response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
 const folder=`${output}/${name}`;await fs.mkdir(folder,{recursive:true});
 async function shot(route,file){await page.goto(base+route);await page.locator("h1").waitFor();for(const image of await page.locator("main img:visible").all()){await image.scrollIntoViewIfNeeded();await image.evaluate(image=>image.decode());}await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo({top:0,behavior:"instant"});});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),"overflow: "+route);assert(!/демонстрац|тестов|референс|исходн|параметры не подтверждены|визуальная подборка/i.test(await page.locator("main").innerText()),"development copy: "+route);await page.screenshot({path:`${folder}/${file}.png`,fullPage:true});}
 await shot("/","home");assert(!(await page.locator('meta[property="og:image"]').getAttribute("content")).includes("/lume-candles/lume-candles/"),"duplicated OG path");await page.screenshot({path:`${folder}/hero.png`});
 await page.getByRole("link",{name:"Рассмотреть коллекцию",exact:true}).first().click();await page.waitForURL(/catalog/);await page.locator(".product-card").first().waitFor();assert.equal(await page.locator(".product-card").count(),40);
 await shot("/catalog/","catalog");
 await page.getByRole("button",{name:"Ботанические",exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll(".product-card").length===6);assert.equal(await page.locator(".product-card").count(),6);
 await page.goto(base+"/catalog/?category="+encodeURIComponent("Десертные"));await page.getByRole("button",{name:"Десертные",exact:true}).waitFor();await page.waitForFunction(()=>document.querySelectorAll(".product-card").length===15);
 await shot("/catalog/embrace/","product");
 await page.getByLabel("20-34 см").check();await page.getByLabel("Кокосовый воск").check();await page.getByLabel("Аромат",{exact:true}).selectOption("vanilla");await page.getByLabel("Дополнительный декор").check();await page.getByLabel("Количество",{exact:true}).fill("2");assert.match(await page.locator(".price").innerText(),/6\s400/);
 await page.getByRole("button",{name:"Добавить в корзину"}).click();await page.getByRole("link",{name:"Перейти в корзину",exact:true}).click();assert.match(await page.locator(".summary-total").innerText(),/6\s400/);await page.screenshot({path:`${folder}/cart.png`,fullPage:true});
 await page.getByRole("link",{name:"Оформить заказ"}).click();await page.getByLabel("Состав заказа для отправки").waitFor();assert.match(await page.getByLabel("Состав заказа для отправки").inputValue(),/Ваниль[\s\S]*6\s400/);await page.screenshot({path:`${folder}/checkout.png`,fullPage:true});
 await page.reload();assert.match(await page.getByLabel("Состав заказа для отправки").inputValue(),/6\s400/);
 for(const route of ["/about/","/delivery/","/payment/","/contacts/","/privacy/","/terms/"])await shot(route,route.replaceAll("/",""));
 assert.deepEqual(errors,[]);results.push({url:base,viewport:name,passed:true,products:40,configurationTotal:6400});await context.close();
}}finally{await browser.close();await fs.writeFile(resultFile,JSON.stringify(results,null,2));}
console.log(JSON.stringify(results,null,2));
