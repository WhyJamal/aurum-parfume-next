import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/aurum/header";
import { CartDrawer } from "@/components/aurum/cart-drawer";
import { FlyLayer } from "@/components/aurum/fly-layer";
import { SmoothScroll } from "@/components/aurum/smooth-scroll";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "AURUM | Магазин премиальной парфюмерии",
  description:
    "AURUM: коллекция премиальных ароматов. Уд, роза, амбра и морской бриз. Быстрая доставка по Ташкенту.",
  openGraph: {
    title: "AURUM | Премиальные ароматы",
    description: "Аромат, память и роскошь. Найдите свой аромат и закажите онлайн.",
    images: ["/video/hero-bg.jpg"],
  },
};

export const viewport: Viewport = { themeColor: "#0a0908" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={cn("dark antialiased", inter.variable, cormorant.variable, "font-sans")}>
      <body className="grain min-h-full bg-[#0a0908] text-[#f5efe6]">
        <SmoothScroll />
        <Header />
        {children}
        <CartDrawer />
        <FlyLayer />
      </body>
    </html>
  );
}
