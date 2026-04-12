"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown, MapPin, Users, Clock } from "lucide-react";

const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${8 + (i * 11.5) % 84}%`,
  dur: `${6 + (i % 4) * 1.5}s`,
  delay: `${(i % 5) * 0.7}s`,
}));

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, [isMobile]);

  // Lock scroll until reveal, then unlock after animation
  useEffect(() => {
    if (revealed) return;

    document.body.style.overflow = "hidden";

    let fired = false;
    let touchStartY = 0;

    const triggerReveal = () => {
      if (fired) return;
      fired = true;
      setRevealed(true);
      // Unlock after the animation completes (~750ms)
      setTimeout(() => {
        document.body.style.overflow = "";
      }, 750);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) triggerReveal();
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchStartY - e.touches[0].clientY > 8) triggerReveal();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      document.body.style.overflow = "";
    };
  }, [revealed]);

  return (
    <section style={{ position: "relative", height: "100svh", minHeight: 600, overflow: "hidden", margin: 0, padding: 0 }}>

      {/* Video */}
      <video
        ref={videoRef}
        key={isMobile ? "m" : "d"}
        src={isMobile ? "/heronew.mp4" : "/hero.mp4"}
        autoPlay muted loop playsInline preload="auto"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          filter: "brightness(0.72) saturate(1.1)",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      />

      {/* Gradient overlay */}
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(10,14,26,0.1) 0%, transparent 35%, transparent 55%, rgba(10,14,26,1) 100%)",
      }} />

      {/* Particles — shown after reveal */}
      {revealed && (
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 2 }}>
          {PARTICLES.map((p) => (
            <span key={p.id} style={{
              position: "absolute",
              left: p.left,
              bottom: "42%",
              width: 3, height: 3,
              borderRadius: "50%",
              background: "var(--cyan)",
              opacity: 0,
              animation: `hpf ${p.dur} ${p.delay} ease-in-out infinite`,
            }} />
          ))}
        </div>
      )}

      {/* Content — centered, appears on scroll */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center",
        padding: "0 16px 80px",
        zIndex: 10,
        pointerEvents: revealed ? "auto" : "none",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
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
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ delay: 0.12, duration: 0.55, ease: "easeOut" }}
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
          initial={{ opacity: 0, y: 14 }}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ delay: 0.22, duration: 0.55, ease: "easeOut" }}
          style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}
        >
          <motion.div whileTap={{ scale: 0.96 }}>
            <Link href="/games" className="btn-primary" style={{ textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 52 }}>
              Játékok böngészése
            </Link>
          </motion.div>
          <motion.div whileTap={{ scale: 0.96 }}>
            <Link href="/join" className="btn-ghost" style={{ textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 52 }}>
              Csatlakozás kóddal
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll hint — hidden after reveal */}
      {!revealed && (
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
      )}

      <style>{`
        @keyframes hpf {
          0%   { transform: translateY(0px)   scale(1);   opacity: 0;    }
          20%  { opacity: 0.4; }
          50%  { transform: translateY(-24px) scale(1.3); opacity: 0.55; }
          80%  { opacity: 0.3; }
          100% { transform: translateY(0px)   scale(1);   opacity: 0;    }
        }
      `}</style>
    </section>
  );
}
