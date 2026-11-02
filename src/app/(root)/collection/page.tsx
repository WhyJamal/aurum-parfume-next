import type { Metadata } from "next";
import { CollectionWall } from "@/components/aurum/collection-wall";

export const metadata: Metadata = {
  title: "Коллекция | AURUM",
  description: "Коллекция премиальных ароматов AURUM: уд, роза, амбра и морской бриз. Выберите аромат и закажите онлайн.",
};

export default function CollectionPage() {
  return <CollectionWall />;
}
