import { TileBoard } from "@/components/tile-board";
import { TILES } from "@/lib/tiles-data";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <TileBoard tiles={TILES} />
    </main>
  );
}
