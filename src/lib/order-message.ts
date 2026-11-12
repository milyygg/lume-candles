import { findProduct } from "@/data/products";
import { money, pricing } from "./config";
import { cartTotal, unitPrice, validateSelection, type Selection } from "./cart";
import { englishLabels } from "./english-labels";
export function orderMessage(items:Selection[],comment="",language="ru") {
 const valid = items.map(validateSelection);
 if(language==="en") {
  const label=(value:string)=>englishLabels[value] || value.replace(/см/g,"cm");
  return ["Hello! I'd like to order LUMÉ candles.",...valid.map((item,i)=>{
   const p=findProduct(item.productId)!;
   const aroma=item.aroma==="none"?"Unscented":label(p.aromas.find(a=>a.id===item.aroma)!.label);
   return `${i+1}. ${label(p.name)}\n${label(pricing.sizes[item.size].label)}, ${label(pricing.materials[item.material].label)}, ${aroma}${item.decor?", extra decoration":""}\n${item.quantity} pcs × ${money(unitPrice(item))} = ${money(unitPrice(item)*item.quantity)}`;
  }),`Total: ${money(cartTotal(valid))}, excluding delivery.`,comment.trim()?`Preferences: ${comment.trim().slice(0,500)}`:"","Please confirm the details and delivery."].filter(Boolean).join("\n\n");
 }
 return ["Здравствуйте! Хочу заказать свечи LUMÉ.","",...valid.map((item,i)=>{
 const p=findProduct(item.productId)!;
 const aroma=item.aroma==="none"?"Без аромата":p.aromas.find(a=>a.id===item.aroma)!.label;
 return `${i+1}. ${p.name}\n${pricing.sizes[item.size].label}, ${pricing.materials[item.material].label}, ${aroma}${item.decor?", дополнительный декор":""}\n${item.quantity} шт. × ${money(unitPrice(item))} = ${money(unitPrice(item)*item.quantity)}`;
 }),"",`Итого: ${money(cartTotal(valid))}, без доставки.`,comment.trim()?`Пожелания: ${comment.trim().slice(0,500)}`:"","Прошу согласовать детали и доставку."].filter(Boolean).join("\n\n");
}

/** Keep each copied Telegram message comfortably below the message size limit. */
export function orderMessageParts(text:string):string[]{
 const parts:string[]=[];let current="";
 for(const paragraph of text.split("\n\n")){
  if(current && current.length+paragraph.length+2>3500){parts.push(current);current="";}
  current+=(current?"\n\n":"")+paragraph;
 }
 if(current)parts.push(current);return parts;
}
