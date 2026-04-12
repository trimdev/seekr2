"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown, MapPin, Users, Clock } from "lucide-react";

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 8.5) % 90}%`,
  top: `${10 + (i * 13) % 80}%`,
  dur: `${5 + (i % 4) * 1.5}s`,
  delay: `${(i % 5) * 0.8}s`,
}));

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onTimeUpdate = () => {
      if (vid.duration && vid.currentTime >= vid.duration - 0.15) {
        vid.currentTime = 0;
      }
    };
    vid.addEventListener("timeupdate", onTimeUpdate);
    vid.play().catch(() => {});
    return () => vid.removeEventListener("timeupdate", onTimeUpdate);
  }, [isMobile]);

  return (
    <section style={{ position: "relative", height: "100svh", minHeight: 600, overflow: "hidden" }}>

      {/* Video — heronew.mp4 on mobile, hero.mp4 on desktop */}
      <video
        ref={videoRef}
        key={isMobile ? "mobile" : "desktop"}
        src={isMobile ? "/heronew.mp4" : "/hero.mp4"}
        autoPlay muted loop playsInline preload="auto"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          objectPosition: "center 30%",
          filter: "brightness(0.45) saturate(1.1)",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      />

      {/* Bottom fade */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(10,14,26,0.1) 0%, transparent 35%, transparent 55%, rgba(10,14,26,1) 100%)",
      }} />

      {/* Particles */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {PARTICLES.map((p) => (
          <span key={p.id} className="particle" style={{
            left: p.left, top: p.top,
            ["--dur" as string]: p.dur,
            ["--delay" as string]: p.delay,
          }} />
        ))}
      </div>

      {/* ── All content — stacked absolutely to avoid flex clipping ── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", zIndex: 10 }}>

        {/* Centre content */}
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center",
          padding: "0 16px 80px",
        }}>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{ width: "100%" }}
          >
            <p style={{
              fontSize: 11, fontWeight: 700,
              letterSpacing: "0.3em", textTransform: "uppercase",
              color: "var(--cyan)", marginBottom: 12,
            }}>
              Outdoor Escape Room
            </p>

            <h1 style={{
              fontFamily: "var(--font-cinzel), serif",
              fontSize: "clamp(36px, 10vw, 72px)",
              fontWeight: 900, lineHeight: 1.1,
              color: "#ffffff",
              textShadow: "0 2px 20px rgba(0,0,0,0.9)",
              margin: "0 0 16px",
            }}>
              Fedezd fel
              <br />
              <span style={{
                color: "var(--cyan)",
                textShadow: "0 0 28px rgba(0,212,255,0.8), 0 2px 12px rgba(0,0,0,0.9)",
              }}>
                a város titkait
              </span>
            </h1>

            <p style={{
              fontSize: 15, lineHeight: 1.6,
              color: "rgba(232,240,254,0.8)",
              textShadow: "0 1px 6px rgba(0,0,0,0.8)",
              maxWidth: 300, margin: "0 auto 28px",
            }}>
              Rejtvények, valós helyszínek, csapatkaland a szabadban.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            style={{ display: "flex", gap: 32, marginBottom: 28 }}
          >
            {[
              { Icon: MapPin, label: "Balaton-part" },
              { Icon: Users,  label: "2–6 fő" },
              { Icon: Clock,  label: "90–120 perc" },
            ].map(({ Icon, label }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <Icon size={17} style={{ color: "var(--cyan)" }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(232,240,254,0.7)", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                  {label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.75 }}
            style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}
          >
            <Link href="/games" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
              Játékok böngészése
            </Link>
            <Link href="/login" className="btn-ghost" style={{ textAlign: "center", textDecoration: "none" }}>
              Csatlakozás kóddal
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          color: "rgba(136,153,187,0.6)",
        }}
      >
        <span style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase" }}>Görgets</span>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          <ChevronDown size={13} />
        </motion.div>
      </motion.div>
    </section>
  );
}
