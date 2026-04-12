"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Globe, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";

function LoginForm() {
  const { signInWithGoogle, signInEmail, resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      await signInEmail(email, password, redirectTo);
    } catch {
      setError("Hibás e-mail cím vagy jelszó.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) { setError("Add meg az e-mail címed a jelszó-visszaállításhoz."); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      setError("");
    } catch {
      setError("Nem sikerült elküldeni a visszaállító e-mailt.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle(redirectTo);
    } catch {
      setError("Google bejelentkezés sikertelen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col py-8"
      style={{ background: "var(--bg-base)" }}
    >
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
            Bejelentkezés
          </p>
          <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-cinzel), serif" }}>
            Üdvözlünk vissza
          </h1>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="btn-ghost w-full flex items-center justify-center gap-2 mb-6"
        >
          <Globe size={18} /> Google-lel belépés
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: "var(--border-dim)" }} />
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>vagy e-maillel</span>
          <div className="flex-1 h-px" style={{ background: "var(--border-dim)" }} />
        </div>

        <form onSubmit={handleEmail} className="flex flex-col gap-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail cím"
              className="input-seekr pl-11"
              autoComplete="email"
              required
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Jelszó"
              className="input-seekr pl-11 pr-11"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-faint)" }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
          {resetSent && (
            <p className="text-xs" style={{ color: "var(--cyan)" }}>
              Visszaállító e-mail elküldve!
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Bejelentkezés…</> : "Belépés"}
          </button>
        </form>

        <button
          onClick={handleReset}
          disabled={loading}
          className="text-xs mt-4 text-center"
          style={{ color: "var(--text-muted)" }}
        >
          Elfelejtett jelszó?
        </button>

        <p className="text-sm text-center mt-6" style={{ color: "var(--text-muted)" }}>
          Még nincs fiókod?{" "}
          <Link href="/register" className="font-semibold" style={{ color: "var(--cyan)" }}>
            Regisztrálj
          </Link>
        </p>
      </motion.div>
    </Container>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--cyan)" }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
