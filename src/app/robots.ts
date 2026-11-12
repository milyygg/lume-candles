import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3014";
  return {
    rules: {
      userAgent: "*",
      allow: process.env.ORDER_MODE === "real" ? "/" : undefined,
      disallow:
        process.env.ORDER_MODE === "real"
          ? ["/api/", "/cart", "/checkout", "/media-library"]
          : ["/"],
    },
    sitemap: base + "/sitemap.xml",
  };
}
