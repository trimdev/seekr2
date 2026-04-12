"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

// Purely CSS-animated particles — zero JS loop, performance-safe
const PARTICLES = [
  { id: 0, left: "9%",  size: 3, dur: "7s",   delay: "0s" },
  { id: 1, left: "23%", size: 2, dur: "9.5s",  delay: "1.3s" },
  { id: 2, left: "40%", size: 4, dur: "6.5s",  delay: "0.5s" },
  { id: 3, left: "57%", size: 2, dur: "11s",   delay: "2.1s" },
  { id: 4, left: "71%", size: 3, dur: "8s",    delay: "0.9s" },
  { id: 5, left: "84%", size: 2, dur: "7.5s",  delay: "1.7s" },
  { id: 6, left: "93%", size: 3, dur: "10s",   delay: "0.3s" },
];

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Mobile/desktop video source
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Play on src change
  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, [isMobile]);

  // One-way scroll reveal — fires once at 60px, never rehides
  useEffect(() => {
    if (revealed) return;
    const onScroll = () => {
      if (window.scrollY >= 60) {
        setRevealed(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealed]);

  return (
    <section
      style={{
        position: "relative",
        height: "100svh",
        minHeight: 600,
        overflow: "hidden",
        margin: 0,
        padding: 0,
        display: "block",
      }}
    >
      {/* ── Looping video ──────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        key={isMobile ? "m" : "d"}
        src={isMobile ? "/heronew.mp4" : "/hero.mp4"}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          filter: "brightness(0.48) saturate(1.2)",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      />

      {/* ── Cinematic gradient: transparent → near-black at bottom ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(10,14,26,0.35) 55%, rgba(10,14,26,0.72) 80%, rgba(10,14,26,0.94) 100%)",
        }}
      />

      {/* ── Radial vignette on edges ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 120% 100% at 50% 50%, transparent 40%, rgba(10,14,26,0.55) 100%)",
        }}
      />

      {/* ── Floating particles (appear after reveal) ── */}
      {revealed && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {PARTICLES.map((p) => (
            <span
              key={p.id}
              style={{
                position: "absolute",
                left: p.left,
                bottom: "38%",
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                background: "var(--cyan)",
                opacity: 0,
                animation: `hpf ${p.dur} ${p.delay} ease-in-out infinite`,
                boxShadow: `0 0 ${p.size * 3}px rgba(0,212,255,0.8)`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Scroll hint — vanishes on reveal ── */}
      {!revealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          style={{
            position: "absolute",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            color: "rgba(232,240,254,0.4)",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.45em",
              textTransform: "uppercase",
            }}
          >
            Görgets
          </span>
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ repeat: Infinity, duration: 1.9, ease: "easeInOut" }}
          >
            <ChevronDown size={14} />
          </motion.div>
        </motion.div>
      )}

      {/* ── Revealed content: lower 40% ── */}
      {revealed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: "clamp(32px, 8vh, 72px)",
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          {/* Glass card */}
          <motion.div
            initial={{ opacity: 0, y: 56 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "rgba(8, 12, 24, 0.62)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 26,
              padding: "30px 22px 26px",
              textAlign: "center",
              boxShadow:
                "0 12px 50px rgba(0,0,0,0.7), 0 2px 0 rgba(255,255,255,0.04) inset, 0 -1px 0 rgba(0,212,255,0.08) inset",
            }}
          >
            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5, ease: "easeOut" }}
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                color: "var(--cyan)",
                marginBottom: 16,
                opacity: 0.85,
              }}
            >
              Outdoor Escape Room
            </motion.p>

            {/* Main title */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0, duration: 0.6, ease: "easeOut" }}
              style={{
                fontFamily: "var(--font-cinzel), serif",
                fontSize: "clamp(30px, 9vw, 54px)",
                fontWeight: 900,
                lineHeight: 1.18,
                color: "#ffffff",
                margin: "0 0 14px",
                letterSpacing: "-0.01em",
                textShadow:
                  "0 0 48px rgba(0,212,255,0.25), 0 0 90px rgba(255,107,53,0.12), 0 2px 18px rgba(0,0,0,0.95)",
              }}
            >
              Fedezd fel
              <br />
              <span
                style={{
                  color: "var(--cyan)",
                  textShadow:
                    "0 0 20px rgba(0,212,255,1), 0 0 45px rgba(0,212,255,0.55), 0 0 80px rgba(255,107,53,0.18)",
                }}
              >
                a város titkait
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.6, ease: "easeOut" }}
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "rgba(232,240,254,0.72)",
                margin: "0 auto 26px",
                maxWidth: 290,
                letterSpacing: "0.012em",
              }}
            >
              Rejtvények, valós helyszínek,{" "}
              <br />
              csapatkaland a szabadban.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.6, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              {/* Primary */}
              <motion.div whileTap={{ scale: 0.955 }} style={{ width: "100%" }}>
                <Link
                  href="/games"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minHeight: 56,
                    borderRadius: 9999,
                    background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
                    color: "#020812",
                    fontWeight: 800,
                    fontSize: 15,
                    letterSpacing: "0.025em",
                    textDecoration: "none",
                    boxShadow:
                      "0 0 28px rgba(0,212,255,0.55), 0 0 60px rgba(0,212,255,0.18), 0 4px 18px rgba(0,0,0,0.45)",
                  }}
                >
                  Játékok böngészése
                </Link>
              </motion.div>

              {/* Secondary / glassmorphic */}
              <motion.div whileTap={{ scale: 0.955 }} style={{ width: "100%" }}>
                <Link
                  href="/join"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minHeight: 56,
                    borderRadius: 9999,
                    background: "rgba(255,255,255,0.055)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.16)",
                    color: "rgba(232,240,254,0.92)",
                    fontWeight: 700,
                    fontSize: 15,
                    letterSpacing: "0.025em",
                    textDecoration: "none",
                  }}
                >
                  Csatlakozás kóddal
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* ── Particle keyframes injected inline ── */}
      <style>{`
        @keyframes hpf {
          0%   { transform: translateY(0)    scale(1);   opacity: 0;    }
          15%  { opacity: 0.45; }
          50%  { transform: translateY(-28px) scale(1.4); opacity: 0.6; }
          85%  { opacity: 0.3; }
          100% { transform: translateY(0)    scale(1);   opacity: 0;    }
        }
      `}</style>
    </section>
  );
}
