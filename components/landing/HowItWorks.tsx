"use client";

import { motion } from "framer-motion";
import { QrCode, Users, Trophy } from "lucide-react";
import { Container } from "@/components/ui/Container";

const STEPS = [
  {
    icon: QrCode,
    num: "01",
    title: "Válassz játékot",
    desc: "Böngészd a kalandjátékainkat és válassz helyszínt a Balaton partján.",
    color: "var(--cyan)",
  },
  {
    icon: Users,
    num: "02",
    title: "Hívd a csapatod",
    desc: "Hozz létre szobát, oszd meg a kódot — barátaid valós időben csatlakoznak.",
    color: "var(--orange)",
  },
  {
    icon: Trophy,
    num: "03",
    title: "Fejts meg, nyerj!",
    desc: "A csapatvezető beadja a megfejtéseket, mindenki együtt halad — keresd a titkot!",
    color: "#a855f7",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16">
      <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-3"
          style={{ color: "var(--cyan)" }}>
          Hogyan működik?
        </p>
        <h2
          className="text-3xl font-black"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          Három lépés a kalandig
        </h2>
      </motion.div>
      <div className="flex flex-col gap-4">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className="glass rounded-2xl p-5 flex gap-4 items-start"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${step.color}18`, border: `1px solid ${step.color}33` }}
            >
              <step.icon size={22} style={{ color: step.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-mono font-bold opacity-30">{step.num}</span>
                <h3 className="font-bold text-base">{step.title}</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {step.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      </Container>
    </section>

  );
}
