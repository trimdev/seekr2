import { Container } from "@/components/ui/Container";
import Link from "next/link";
import { MapPin, Mail, Globe } from "lucide-react";

export const metadata = {
  title: "Rólunk — Seekr",
  description: "A Seekr csapata és a Balaton Kód projekt háttere.",
};

export default function AboutPage() {
  return (
      <main className="pb-20">
        <Container className="py-10">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: "var(--cyan)" }}>
            Rólunk
          </p>
          <h1 className="text-3xl font-black mb-6" style={{ fontFamily: "var(--font-cinzel), serif" }}>
            A Seekr csapata
          </h1>

          <div
            className="glass rounded-2xl p-6 mb-6"
            style={{ borderLeft: "3px solid var(--cyan)" }}
          >
            <p className="text-sm leading-relaxed italic" style={{ color: "var(--text-muted)" }}>
              "Szerettük volna, ha a városnézés több, mint séta. A Seekr-rel minden sarkon rejtély vár —
              a Balaton partján és Magyarország városaiban egyaránt."
            </p>
          </div>

          <div className="flex flex-col gap-5 mb-10">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              A Seekr egy magyar startup, amely kültéri, mobilon játszható nyomozós kalandjátékokat fejleszt.
              Játékaink valódi helyszíneken játszódnak — Siófokos, Balatonfüredi és budapesti utcákon,
              ahol a történet és a rejtvények az épített örökséghez kapcsolódnak.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Csapatunk szenvedélyesen hisz abban, hogy a legjobb élmény az, amelyikhez
              ténylegesen ki kell mozdulni — és egy csapattal megélni valamit.
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-10">
            {[
              { icon: MapPin, label: "Magyarország — Balaton régió" },
              { icon: Mail, label: "hello@seekr.city" },
              { icon: Globe, label: "@seekr.city" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-dim)" }}
                >
                  <Icon size={16} style={{ color: "var(--cyan)" }} />
                </div>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(255,107,53,0.05) 100%)", border: "1px solid rgba(0,212,255,0.12)" }}
          >
            <h2 className="font-black text-xl mb-2" style={{ fontFamily: "var(--font-cinzel), serif" }}>
              Készen állsz?
            </h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              Válassz helyszínt, hívd a csapatod, és kezdődjön a kaland.
            </p>
            <Link href="/games" className="btn-primary inline-block">
              Játékok böngészése
            </Link>
          </div>
        </Container>
      </main>
  );
}
