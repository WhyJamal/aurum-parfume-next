export type Perfume = {
  slug: string;
  name: string;
  tagline: string;
  price: number; // so'm
  size: string;
  image: string;
  notes: { top: string; heart: string; base: string };
  accent: string;
};

export const SITE = {
  name: "Aurum Parfum",
  short: "AURUM",
};

export const PERFUMES: Perfume[] = [
  {
    slug: "oud-royal",
    name: "Oud Royal",
    tagline: "Qora shisha, oltin qalpoq",
    price: 890000,
    size: "50 ml",
    image: "/materials/oud-royal.jpg",
    notes: { top: "Za'faron", heart: "Oud", base: "Mushk" },
    accent: "#d9b46a",
  },
  {
    slug: "velvet",
    name: "Velvet",
    tagline: "Kristall kabi tiniq iliqlik",
    price: 760000,
    size: "50 ml",
    image: "/materials/Velvet.jpg",
    notes: { top: "Bergamot", heart: "Iris", base: "Amber" },
    accent: "#e0a35a",
  },
  {
    slug: "amber-vanille",
    name: "Amber Vanille",
    tagline: "Yog'och va vanil sokinligi",
    price: 690000,
    size: "50 ml",
    image: "/materials/amber-vanille.jpg",
    notes: { top: "Doljin", heart: "Vanil", base: "Sandal" },
    accent: "#c27a3a",
  },
  {
    slug: "blue-meridian",
    name: "Blue Meridian",
    tagline: "Dengiz shamoli, salqin tong",
    price: 640000,
    size: "50 ml",
    image: "/materials/blue-meridian.jpg",
    notes: { top: "Limon", heart: "Dengiz tuzi", base: "Sedr" },
    accent: "#6f8fd9",
  },
  {
    slug: "rose-eclat",
    name: "Rose Éclat",
    tagline: "Nozik atirgul, yengil nur",
    price: 720000,
    size: "50 ml",
    image: "/materials/rose-eclat.jpg",
    notes: { top: "Malina", heart: "Atirgul", base: "Oq mushk" },
    accent: "#e58fa8",
  },
];

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(n).replace(/\u00a0/g, " ") + " so'm";
