import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Container } from "@/components/ui/Container";
import Link from "next/link";

export const metadata = {
  title: "Seekr — Outdoor Escape Room a Balatonnál",
  description: "Rejtvények, valós helyszínek, csapatkaland a szabadban. Fedezd fel a Balaton titkait!",
};

export default function HomePage() {
  return (
    <main>
      <HeroSection />

      {/* Game type cards */}
      <Container className="py-10">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: "var(--cyan)" }}>
          Játéktípusok
        </p>
        <h2 className="text-2xl font-black mb-6" style={{ fontFamily: "var(--font-cinzel), serif" }}>
          Válassz kalandot
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            {
              label: "Kültéri",
              badge: "OUTDOOR",
              desc: "Valódi helyszíneken, a szabadban",
              color: "rgba(0,200,100,0.15)",
              border: "rgba(0,200,100,0.3)",
              accent: "#00c864",
            },
            {
              label: "Kocsmatúra",
              badge: "PUB TOUR",
              desc: "Városnézés helyi kocsmákon át",
              color: "rgba(180,50,30,0.15)",
              border: "rgba(255,100,50,0.3)",
              accent: "#ff6b35",
            },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-2xl p-4 flex flex-col gap-2"
              style={{ background: t.color, border: `1px solid ${t.border}` }}
            >
              <span
                className="text-xs font-black px-2 py-0.5 rounded-full self-start"
                style={{ background: `${t.accent}22`, color: t.accent, border: `1px solid ${t.accent}55`, fontSize: 10, letterSpacing: "0.06em" }}
              >
                {t.badge}
              </span>
              <p className="font-black text-sm" style={{ color: "var(--text-primary)" }}>{t.label}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)", lineHeight: 1.4 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </Container>

      <HowItWorks />

      {/* Why us */}
      <Container className="py-10">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: "var(--cyan)" }}>
          Miért Seekr?
        </p>
        <h2 className="text-2xl font-black mb-6" style={{ fontFamily: "var(--font-cinzel), serif" }}>
          Nem csak játék
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: "Valódi helyszínek", desc: "Nem virtuális — minden rejtvény egy igazi helyen vár" },
            { title: "Csapatélmény", desc: "2–6 fővel, közösen kell megoldani a titkokat" },
            { title: "Bármikor játszható", desc: "Nincs időbeli korlát, haladj a saját tempódban" },
            { title: "Magyar fejlesztés", desc: "Helyi történetek, épített örökség, Balaton-feeling" },
            { title: "App nélkül is", desc: "Kód alapú belépés, nincs telepítés szükséges" },
            { title: "Ingyenes opciók", desc: "Több játék teljesen ingyenesen is elérhető" },
          ].map((f) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-4"
            >
              <p className="font-black text-sm mb-1" style={{ color: "var(--text-primary)" }}>{f.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* CTA */}
      <Container className="py-10 pb-20">
        <div
          className="rounded-3xl p-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(255,107,53,0.06) 100%)",
            border: "1px solid rgba(0,212,255,0.15)",
          }}
        >
          <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "var(--font-cinzel), serif" }}>
            Készen állsz?
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Válassz helyszínt, hívd a csapatod, és kezdődjön a kaland.
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link href="/games" className="btn-primary text-center">
              Játékok böngészése
            </Link>
            <Link href="/login" className="btn-ghost text-center">
              Csatlakozás kóddal
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
