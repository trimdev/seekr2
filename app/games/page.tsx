import { GameGrid } from "@/components/landing/GameGrid";
import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "Játékok — Seekr",
  description: "Böngészd a Seekr outdoor kalandjátékait a Balaton partján.",
};

export default function GamesPage() {
  return (
      <main className="pb-20">
        <Container className="py-10">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: "var(--cyan)" }}>
            Kalandjátékok
          </p>
          <h1 className="text-3xl font-black mb-1" style={{ fontFamily: "var(--font-cinzel), serif" }}>
            Válassz helyszínt
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Minden játék egy igazi szabadtéri kaland.
          </p>
        </Container>
        <GameGrid />
      </main>
  );
}
