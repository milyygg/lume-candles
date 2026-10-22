import { pricing, type Size, type Material } from "@/lib/config";
export type Product = {
  id: string;
  slug: string;
  name: string;
  image: string;
  photos: string[];
  short: string;
  description: string;
  category: "Скульптурные" | "Ботанические" | "Фактурные" | "Десертные";
  candleTypes: ("aromatic" | "massage" | "wood-wick")[];
  technology: "molded" | "gel" | null;
  decorKinds: ("botanical" | "relief" | "texture" | "filled" | "painted")[];
  sizes: Size[];
  materials: Material[];
  aromas: { id: string; label: string }[];
  allowDecor: boolean;
  basePrice: number;
  published: boolean;
  approved: boolean;
  optionsStatus: "test" | "confirmed";
};
// Visual names only. All commercial characteristics and image rights await owner approval.
const references: [number, string, string, Product["category"], string][] = [
  [
    21,
    "embrace",
    "Свеча в форме объятия",
    "Скульптурные",
    "Мягкие линии двух фигур в одной композиции.",
  ],
  [
    22,
    "teddy",
    "Свеча в форме медведя",
    "Фактурные",
    "Фигурка медведя с выразительной фактурой.",
  ],
  [
    38,
    "swan",
    "Свеча в форме лебедя",
    "Скульптурные",
    "Изящный силуэт птицы с рельефными крыльями.",
  ],
  [
    39,
    "bust",
    "Свеча в форме бюста",
    "Скульптурные",
    "Классический силуэт с проработанными деталями.",
  ],
  [
    23,
    "textured-ball",
    "Фактурная круглая свеча",
    "Фактурные",
    "Округлая форма с рельефной поверхностью.",
  ],
  [
    18,
    "balloon-dog",
    "Свеча в форме собаки",
    "Скульптурные",
    "Знакомый силуэт фигурки из воздушных шаров.",
  ],
  [
    36,
    "lemon",
    "Свеча в форме лимона",
    "Ботанические",
    "Цитрусовая форма с фактурной поверхностью.",
  ],
  [
    32,
    "fig",
    "Свеча в форме инжира",
    "Ботанические",
    "Плод инжира как маленький предмет для интерьера.",
  ],
  [
    25,
    "ice-cream",
    "Свеча в форме мороженого",
    "Десертные",
    "Десертная форма в вафельном стаканчике.",
  ],
  [
    33,
    "wood",
    "Свеча с фактурой дерева",
    "Фактурные",
    "Цилиндрическая форма с рельефом коры.",
  ],
  [
    34,
    "corn",
    "Свеча в форме кукурузы",
    "Ботанические",
    "Початок с повторяющимся рельефом зёрен.",
  ],
  [
    37,
    "egg",
    "Свеча в форме яйца",
    "Скульптурные",
    "Лаконичная округлая форма для композиции.",
  ],
];
export const products: Product[] = references.map(
  ([photo, slug, name, category, short]) => ({
    id: `lume-${slug}`,
    slug,
    name,
    image: `/media/MEDIA-${String(photo).padStart(2, "0")}.webp`,
    photos: [`/media/MEDIA-${String(photo).padStart(2, "0")}.webp`],
    short,
    category,
    description: `${short} Название описывает форму на предоставленном изображении. Размер, состав, оттенок и возможность изготовления уточняются индивидуально. Фотография служит референсом, а не подтверждением наличия.`,
    candleTypes: [],
    technology: null,
    decorKinds: [],
    sizes: ["small", "medium", "large"],
    materials: ["palm", "soy", "coconut"],
    aromas: [],
    allowDecor: true,
    basePrice: pricing.base,
    published: true,
    approved: false,
    optionsStatus: "test",
  }),
);
export const visibleProducts = products.filter((p) => p.published);
export const findProduct = (id: string) =>
  products.find((p) => p.id === id && p.published);
