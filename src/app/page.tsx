import { ScrollStory } from "@/components/aurum/scroll-story";
import { BottleParade } from "@/components/aurum/bottle-parade";
import { Footer } from "@/components/aurum/footer";

export default function Home() {
  return (
    <>
      <main>
        <ScrollStory />
        <BottleParade />
      </main>
      <Footer />
    </>
  );
}
