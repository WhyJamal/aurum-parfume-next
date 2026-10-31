export type Gender = "men" | "women" | "unisex";
export type Volume = 50 | 100;

export interface Product {
  slug: string;
  name: string;
  gender: Gender;
  tagline: string;
  description: string;
  image: string;
  /** glow color behind the bottle */
  accent: string;
  prices: Record<Volume, number>;
  notes: { top: string[]; heart: string[]; base: string[] };
}

export const genderLabel: Record<Gender, string> = {
  men: "Мужской",
  women: "Женский",
  unisex: "Унисекс",
};

export const products: Product[] = [
  {
    slug: "oud-royal",
    name: "Oud Royal",
    gender: "men",
    tagline: "Тёмный лес, золотая тень",
    description:
      "Глубокий, серьёзный и запоминающийся аромат. Тепло уда и кожи создано для вечерних встреч.",
    image: "/bottles/oud-royal.png",
    accent: "#c9a96e",
    prices: { 50: 650000, 100: 1100000 },
    notes: {
      top: ["Шафран", "Бергамот"],
      heart: ["Уд", "Чёрная роза"],
      base: ["Кожа", "Амбра", "Пачули"],
    },
  },
  {
    slug: "rose-eclat",
    name: "Rose Éclat",
    gender: "women",
    tagline: "Роза на утренней росе",
    description:
      "Лёгкий, изящный и романтичный. Свежераспустившаяся роза и пион сохраняют весеннее настроение на весь день.",
    image: "/bottles/rose-eclat.png",
    accent: "#f0a5b8",
    prices: { 50: 520000, 100: 890000 },
    notes: {
      top: ["Личи", "Розовый перец"],
      heart: ["Дамасская роза", "Пион"],
      base: ["Белый мускус", "Сандал"],
    },
  },
  {
    slug: "blue-meridian",
    name: "Blue Meridian",
    gender: "men",
    tagline: "Открытое море, чистый воздух",
    description:
      "Прохладный, энергичный и чистый. Самый удобный вариант на каждый день: для работы или учёбы.",
    image: "/bottles/blue-meridian.png",
    accent: "#5b8def",
    prices: { 50: 480000, 100: 820000 },
    notes: {
      top: ["Лимон", "Мята"],
      heart: ["Лаванда", "Морской бриз"],
      base: ["Ветивер", "Кедр"],
    },
  },
  {
    slug: "amber-vanille",
    name: "Amber Vanille",
    gender: "unisex",
    tagline: "Тёплое плечо осенним вечером",
    description:
      "Сладкий, тёплый и обволакивающий. Ваниль и амбра дарят особый уют в холодные дни.",
    image: "/bottles/amber-vanille.png",
    accent: "#d98324",
    prices: { 50: 590000, 100: 990000 },
    notes: {
      top: ["Корица", "Мандарин"],
      heart: ["Ванильная орхидея", "Тонка"],
      base: ["Амбра", "Мёд", "Ореховое дерево"],
    },
  },
  {
    slug: "velvet-crystal",
    name: "Velvet Crystal",
    gender: "unisex",
    tagline: "Жидкое золото в хрустале",
    description:
      "Праздничный аромат коллекции. Насыщенный, бархатистый и роскошный: для особых дней и подарков.",
    image: "/bottles/velvet.png",
    accent: "#e8b25a",
    prices: { 50: 720000, 100: 1250000 },
    notes: {
      top: ["Груша", "Розовый перец"],
      heart: ["Жасмин", "Ирис"],
      base: ["Амброксан", "Ваниль", "Мускус"],
    },
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const FREE_DELIVERY_FROM = 1_000_000;
export const DELIVERY_FEE = 25_000;
