"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Globe, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";

export default function RegisterPage() {
  const { signInWithGoogle, registerEmail } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 8) { setError("A jelszónak legalább 8 karakter hosszúnak kell lennie."); return; }
    setLoading(true);
    setError("");
    try {
      await registerEmail(email, password, name);
    } catch (err: unknown) {
      const msg = (err as { code?: string }).code;
      if (msg === "auth/email-already-in-use") {
        setError("Ez az e-mail cím már foglalt.");
      } else {
        setError("Regisztráció sikertelen. Próbáld újra.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try { await signInWithGoogle(); } catch { setError("Google bejelentkezés sikertelen."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col py-8" style={{ background: "var(--bg-base)" }}>
    <Container>
      <button
        onClick={() => router.back()}
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-8"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-dim)" }}
      >
        <ArrowLeft size={18} />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col justify-center w-full"
      >
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: "var(--cyan)" }}>
            Regisztráció
          </p>
          <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-cinzel), serif" }}>
            Csatlakozz a kalandhoz
          </h1>
        </div>

        <button onClick={handleGoogle} disabled={loading} className="btn-ghost w-full flex items-center justify-center gap-2 mb-6">
          <Globe size={18} /> Google-lel regisztráció
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: "var(--border-dim)" }} />
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>vagy e-maillel</span>
          <div className="flex-1 h-px" style={{ background: "var(--border-dim)" }} />
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Teljes neved" className="input-seekr pl-11" required />
          </div>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail cím" className="input-seekr pl-11" autoComplete="email" required />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
            <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Jelszó (min. 8 karakter)" className="input-seekr pl-11 pr-11" autoComplete="new-password" required />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Regisztráció…</> : "Fiók létrehozása"}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: "var(--text-muted)" }}>
          Van már fiókod?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "var(--cyan)" }}>Belépés</Link>
        </p>
      </motion.div>
    </Container>
    </div>
  );
}
