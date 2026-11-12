import type { MetadataRoute } from "next";
import { visibleProducts } from "@/data/products";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3014";
  return [
    "",
    "/catalog",
    "/about",
    "/delivery",
    "/payment",
    "/contacts",
    ...visibleProducts.map((p) => `/catalog/${p.slug}`),
  ].map((url) => ({
    url: base + url,
    changeFrequency: "monthly",
    priority: url === "" ? 1 : 0.7,
  }));
}
