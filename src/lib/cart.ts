import { z } from "zod";
import { findProduct } from "@/data/products";
import { pricing } from "./config";
export const selectionSchema = z
  .object({
    productId: z.string().max(80),
    size: z.enum(["small", "medium", "large"]),
    material: z.enum(["palm", "soy", "coconut"]),
    aroma: z.string().max(80),
    decor: z.boolean(),
    quantity: z.number().int().min(1).max(pricing.maxQuantity),
  })
  .strict();
export type Selection = z.infer<typeof selectionSchema>;
export function validateSelection(input: unknown): Selection {
  const selection = selectionSchema.parse(input);
  const product = findProduct(selection.productId);
  if (
    !product ||
    !product.sizes.includes(selection.size) ||
    !product.materials.includes(selection.material) ||
    (selection.aroma !== "none" &&
      !product.aromas.some((a) => a.id === selection.aroma)) ||
    (selection.decor && !product.allowDecor)
  )
    throw new Error("Недоступная конфигурация изделия");
  return selection;
}
export function unitPrice(input: Selection) {
  const s = validateSelection(input);
  return (
    findProduct(s.productId)!.basePrice +
    pricing.sizes[s.size].extra +
    pricing.materials[s.material].extra +
    (s.aroma === "none" ? 0 : pricing.aromaExtra) +
    (s.decor ? pricing.decorExtra : 0)
  );
}
export function lineKey(s: Selection) {
  return [
    s.productId,
    s.size,
    s.material,
    s.aroma,
    s.decor ? "decor" : "plain",
  ].join(":");
}
export function addToCart(cart: Selection[], input: Selection): Selection[] {
  const s = validateSelection(input),
    key = lineKey(s),
    exists = cart.find((l) => lineKey(l) === key);
  if (exists)
    return cart.map((l) =>
      lineKey(l) === key
        ? {
            ...l,
            quantity: Math.min(pricing.maxQuantity, l.quantity + s.quantity),
          }
        : l,
    );
  if (cart.length >= pricing.maxLines)
    throw new Error("В корзине может быть не более 20 конфигураций");
  return [...cart, s];
}
export const cartTotal = (cart: Selection[]) =>
  cart.reduce((sum, l) => sum + unitPrice(l) * l.quantity, 0);
export function restoreCart(raw: string | null): Selection[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed) || parsed.length > pricing.maxLines) return [];
    return parsed.reduce<Selection[]>((result, item) => {
      try {
        return addToCart(result, validateSelection(item));
      } catch {
        return result;
      }
    }, []);
  } catch {
    return [];
  }
}
