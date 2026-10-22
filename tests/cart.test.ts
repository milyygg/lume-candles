import { describe, it, expect } from "vitest";
import {
  addToCart,
  cartTotal,
  lineKey,
  restoreCart,
  unitPrice,
  validateSelection,
  type Selection,
} from "../src/lib/cart";
import { products } from "../src/data/products";
const item: Selection = {
  productId: products[0].id,
  size: "small",
  material: "palm",
  aroma: "none",
  decor: false,
  quantity: 1,
};
describe("integer pricing and allowed configurations", () => {
  it("uses base 1500", () => expect(unitPrice(item)).toBe(1500));
  it.each([
    ["small", 0],
    ["medium", 500],
    ["large", 1000],
  ] as const)("size %s", (size, extra) =>
    expect(unitPrice({ ...item, size })).toBe(1500 + extra),
  );
  it.each([
    ["palm", 0],
    ["soy", 100],
    ["coconut", 200],
  ] as const)("material %s", (material, extra) =>
    expect(unitPrice({ ...item, material })).toBe(1500 + extra),
  );
  it("calculates maximum unit and line totals", () =>
    expect(
      cartTotal([
        {
          ...item,
          size: "large",
          material: "coconut",
          decor: true,
          quantity: 2,
        },
      ]),
    ).toBe(6000));
  it("charges available aromas only", () => {
    products[0].aromas.push({ id: "test-aroma", label: "Тестовый аромат" });
    try {
      expect(unitPrice({ ...item, aroma: "test-aroma" })).toBe(1700);
    } finally {
      products[0].aromas = [];
    }
  });
  it("rejects unknown aroma", () =>
    expect(() => unitPrice({ ...item, aroma: "invented" })).toThrow());
  it("rejects unavailable size", () => {
    const sizes = products[0].sizes;
    products[0].sizes = ["small"];
    try {
      expect(() => validateSelection({ ...item, size: "large" })).toThrow();
    } finally {
      products[0].sizes = sizes;
    }
  });
  it("rejects unavailable decor", () => {
    products[0].allowDecor = false;
    try {
      expect(() => validateSelection({ ...item, decor: true })).toThrow();
    } finally {
      products[0].allowDecor = true;
    }
  });
  it.each([0, -1, 1.5, 21, Infinity])("rejects quantity %s", (quantity) =>
    expect(() => validateSelection({ ...item, quantity })).toThrow(),
  );
  it("rejects price injection", () =>
    expect(() => validateSelection({ ...item, price: 1 })).toThrow());
});
describe("cart identity and persistence", () => {
  it("merges matching configurations", () =>
    expect(addToCart([item], { ...item, quantity: 2 })).toEqual([
      { ...item, quantity: 3 },
    ]));
  it("keeps different configurations separate", () =>
    expect(addToCart([item], { ...item, decor: true })).toHaveLength(2));
  it("caps merged quantities", () =>
    expect(
      addToCart([{ ...item, quantity: 19 }], { ...item, quantity: 4 })[0]
        .quantity,
    ).toBe(20));
  it("does not include quantity in configuration key", () =>
    expect(lineKey(item)).toBe(lineKey({ ...item, quantity: 2 })));
  it("restores valid state", () =>
    expect(restoreCart(JSON.stringify([item]))).toEqual([item]));
  it("drops invalid stored items", () =>
    expect(
      restoreCart(JSON.stringify([item, { ...item, productId: "gone" }])),
    ).toEqual([item]));
  it.each(["oops", "{}", "null", "[null]"])(
    "survives corrupted storage %s",
    (raw) => expect(restoreCart(raw)).toEqual([]),
  );
});
