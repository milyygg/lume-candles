import { describe,it,expect } from "vitest";
import { products } from "../src/data/products";
import { aromas } from "../src/data/aromas";
import { pricing } from "../src/lib/config";
import { unitPrice, type Selection } from "../src/lib/cart";
import { orderMessage, orderMessageParts } from "../src/lib/order-message";
import fs from "node:fs";
import crypto from "node:crypto";
const item:Selection={productId:"lume-embrace",size:"small",material:"palm",aroma:"none",decor:false,quantity:1};
describe("client catalogue and handoff",()=>{
 it("uses all 40 distinct source photos on product pages",()=>{
 const sources=new Set(products.flatMap(p=>p.photos).map(p=>p.match(/MEDIA-\d+/)![0]));
 expect(sources.size).toBe(40);for(let i=1;i<=40;i++)expect(sources.has(`MEDIA-${String(i).padStart(2,"0")}`)).toBe(true);
 });
 it("preserves original file hashes",()=>{
 const before=JSON.parse(fs.readFileSync("tests/fixtures/original-hashes.json","utf8"));
 for(const [file,hash]of Object.entries(before))if(file.startsWith("public/photography/"))expect(crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")).toBe(hash);
 });
 it("keeps public single click shortcut identical",()=>{
 const before=JSON.parse(fs.readFileSync("tests/fixtures/original-hashes.json","utf8"));
 expect(crypto.createHash("sha256").update(fs.readFileSync("Открыть сайт.url")).digest("hex")).toBe(before["Открыть сайт.url"]);
 });
 it("has the three approved size labels",()=>expect(Object.values(pricing.sizes).map(s=>s.label)).toEqual(["6-9 см","9-20 см","20-34 см"]));
 it.each(aromas)("charges exactly 200 for $label",a=>expect(unitPrice({...item,aroma:a.id})).toBe(1700));
 it("includes exact configuration and full total in handoff",()=>{
 const text=orderMessage([{...item,size:"large",material:"coconut",aroma:"vanilla",decor:true,quantity:2}],"Подарок");
 expect(text).toContain("Ваниль");expect(text).toContain("20-34 см");expect(text).toContain("6 400");expect(text).toContain("Подарок");
 });
 it("validates data before preparing a message",()=>expect(()=>orderMessage([{...item,aroma:"unknown"}])).toThrow());
});

it("keeps all valid cart lines when preparing multiple Telegram messages",()=>{
 const items=products.slice(0,20).map(p=>({...item,productId:p.id,aroma:"sandalwood",size:"large" as const,material:"coconut" as const,decor:true,quantity:20}));
 const text=orderMessage(items,"Пожелания ".repeat(60));const parts=orderMessageParts(text);
 expect(parts.join("\n\n")).toBe(text);expect(parts.every(p=>p.length<=3500)).toBe(true);
 for(const product of products.slice(0,20))expect(text).toContain(product.name);
});
