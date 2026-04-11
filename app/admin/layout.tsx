"use client";

import Link from "next/link";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Container } from "@/components/ui/Container";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" size={36} style={{ color: "var(--cyan)" }} />
          <p style={{ color: "var(--text-muted)" }}>Ellenőrzés...</p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <Container>
          <div className="glass flex flex-col items-center gap-6 p-10 text-center max-w-sm mx-auto">
            <ShieldAlert size={48} style={{ color: "var(--orange)" }} />
            <h1
              className="text-2xl font-black tracking-wide"
              style={{ fontFamily: "var(--font-cinzel), Cinzel, serif", color: "var(--text-primary)" }}
            >
              Nincs hozzáférés
            </h1>
            <p style={{ color: "var(--text-muted)" }}>
              Ez az oldal csak adminisztrátorok számára érhető el.
            </p>
            <Link href="/" className="btn-ghost text-sm">
              ← Vissza a főoldalra
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  return <>{children}</>;
}
