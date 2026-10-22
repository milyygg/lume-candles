"use client";
import { useState } from "react";
import { Photograph } from "./photograph";
import { hasStudioPhoto } from "@/lib/photography";
import type { Product } from "@/data/products";
export function ProductGallery({product}:{product:Product}) {
 const [original,setOriginal] = useState(false);
 const studio = hasStudioPhoto(product.image);
 return <figure className="detail-image">
  <div className="detail-image-frame" key={String(original)}><Photograph source={product.image} original={original} alt={product.name} priority /></div>
  {studio && <div className="gallery-thumbs" aria-label="Фотографии изделия">
   {[false,true].map(value=><button type="button" key={String(value)} aria-label={value?"Другой вид":"Светлый фон"} aria-pressed={original===value} onClick={()=>setOriginal(value)}>
    <Photograph source={product.image} original={value} alt={value?"Другой вид изделия":"На светлом фоне"}/>
    <span>{value?"Другой вид":"Светлый фон"}</span>
   </button>)}
  </div>}
  <figcaption>{studio?"Рассмотрите силуэт и фактуру изделия.":"Оттенок и детали оформления можно обсудить при заказе."}</figcaption>
 </figure>;
}
