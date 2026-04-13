"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Hash, ArrowRight } from "lucide-react";
import Link from "next/link";

const CODE_LENGTH = 6;

export default function JoinPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");
  const complete = code.length === CODE_LENGTH && digits.every((d) => d !== "");

  const handleChange = (i: number, val: string) => {
    const char = val.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    if (char && i < CODE_LENGTH - 1) {
      inputs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
    if (e.key === "Enter" && complete) {
      router.push(`/join/${code}`);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, CODE_LENGTH);
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "var(--bg-base)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Icon + heading */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}
          >
            <Hash size={28} style={{ color: "var(--cyan)" }} />
          </div>
          <h1
            className="text-2xl font-black text-center mb-2"
            style={{ fontFamily: "var(--font-cinzel), serif", color: "var(--text-primary)" }}
          >
            Csatlakozás kóddal
          </h1>
          <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
            Add meg a 6 jegyű kódot, amit a csapatvezető osztott meg veled.
          </p>
        </div>

        {/* 6-box code input */}
        <div className="flex gap-2 justify-center mb-6">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="text"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              style={{
                width: 44,
                height: 54,
                textAlign: "center",
                fontSize: 22,
                fontWeight: 800,
                fontFamily: "var(--font-cinzel), serif",
                letterSpacing: "0.05em",
                background: d ? "rgba(0,212,255,0.08)" : "var(--bg-surface)",
                border: `1.5px solid ${d ? "rgba(0,212,255,0.5)" : "var(--border-dim)"}`,
                borderRadius: 12,
                color: d ? "var(--cyan)" : "var(--text-muted)",
                outline: "none",
                transition: "all 0.15s",
                caretColor: "var(--cyan)",
              }}
            />
          ))}
        </div>

        {/* Join button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => complete && router.push(`/join/${code}`)}
          disabled={!complete}
          className="btn-primary w-full flex items-center justify-center gap-2"
          style={{
            minHeight: 52,
            opacity: complete ? 1 : 0.45,
            cursor: complete ? "pointer" : "not-allowed",
            transition: "opacity 0.2s",
          }}
        >
          Belépés a szobába
          <ArrowRight size={17} />
        </motion.button>

        <p className="text-xs text-center mt-5" style={{ color: "var(--text-faint)" }}>
          Nincs kódod?{" "}
          <Link href="/games" style={{ color: "var(--cyan)", textDecoration: "underline" }}>
            Böngészd a játékokat
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
