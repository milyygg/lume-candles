export const brand = {
  name: "LUMÉ",
  descriptor: "CANDLES",
  title: "LUMÉ CANDLES",
  description:
    "Декоративные свечи ручной работы. Выберите форму и соберите свою свечу.",
};
export const pricing = {
  base: 1500,
  sizes: {
    small: { label: "6-9 см", extra: 0 },
    medium: { label: "9-20 см", extra: 500 },
    large: { label: "20-34 см", extra: 1000 },
  },
  materials: {
    palm: { label: "Пальмовый воск", extra: 0 },
    soy: { label: "Соевый воск", extra: 100 },
    coconut: { label: "Кокосовый воск", extra: 200 },
  },
  aromaExtra: 200,
  decorExtra: 300,
  maxQuantity: 20,
  maxLines: 20,
  materialsProvisional: false,
} as const;
export const money = (amount: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
export type Size = keyof typeof pricing.sizes;
export type Material = keyof typeof pricing.materials;
