import { Photograph } from "./photograph";
import type { Product } from "@/data/products";
export function ProductGallery({product}:{product:Product}) {
 return <figure className="detail-image">
  <div className="detail-image-frame"><Photograph source={product.image} alt={product.name} priority sizes="(max-width: 600px) 90vw, 45vw" /></div>
  <figcaption>Рассмотрите силуэт и фактуру изделия.</figcaption>
 </figure>;
}
