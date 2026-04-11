import { Container } from "@/components/ui/Container";
import Link from "next/link";
import { QrCode, Users, MapPin, Smartphone, Trophy, Clock } from "lucide-react";

export const metadata = {
  title: "Hogyan működik — Seekr",
  description: "Ismerd meg a Seekr outdoor kalandjáték működését — lépésről lépésre.",
};

const DETAILS = [
  {
    icon: Smartphone,
    color: "var(--cyan)",
    title: "Nincs appletöltés",
    desc: "Az egész játék a böngészőben fut — telefon, semmi más nem kell. iOS és Android egyaránt.",
  },
  {
    icon: Users,
    color: "var(--orange)",
    title: "2–6 fős csapat",
    desc: "Egy csapatvezető vezeti a szobát, a többiek valós időben követik a haladást.",
  },
  {
    icon: MapPin,
    color: "#a855f7",
    title: "Igazi helyszínek",
    desc: "Minden állomás egy valódi, fizikailag megkeresendő pont a városban.",
  },
  {
    icon: Clock,
    color: "#22d3ee",
    title: "90–120 perc",
    desc: "Egy átlagos játék 1,5–2 óra alatt teljesíthető, tempótól függően.",
  },
  {
    icon: QrCode,
    color: "#f59e0b",
    title: "QR-kódok és rejtvények",
    desc: "A nyomok között QR-kódok, számzárak, logikai feladatok és fotófeladatok váltakoznak.",
  },
  {
    icon: Trophy,
    color: "#10b981",
    title: "Verseny mód",
    desc: "Hamarosan — versenyek és ranglisták városok között.",
  },
];

export default function HowItWorksPage() {
  return (
      <main className="pb-20">
        <Container className="py-10">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: "var(--cyan)" }}>
            Útmutató
          </p>
          <h1 className="text-3xl font-black mb-2" style={{ fontFamily: "var(--font-cinzel), serif" }}>
            Hogyan működik?
          </h1>
          <p className="text-sm mb-10" style={{ color: "var(--text-muted)" }}>
            Minden, amit a Seekr játékról tudni kell — egy percben.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {DETAILS.map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="glass rounded-2xl p-4"
                style={{ border: "1px solid var(--border-dim)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${color}18`, border: `1px solid ${color}33` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <h3 className="font-bold text-sm mb-1">{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center flex flex-col gap-3">
            <Link href="/games" className="btn-primary w-full">Játékok böngészése</Link>
            <Link href="/register" className="btn-ghost w-full">Fiók létrehozása</Link>
          </div>
        </Container>
      </main>
  );
}
