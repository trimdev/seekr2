"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Container } from "@/components/ui/Container";
import { ArrowLeft, Trash2, ShoppingCart, Loader2 } from "lucide-react";

interface Purchase {
  id: string;
  userId?: string;
  gameId?: string;
  confirmedBy?: string;
  amount?: number;
  createdAt?: Timestamp | null;
}

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function loadPurchases() {
      try {
        const snap = await getDocs(
          query(collection(db, "purchases"), orderBy("createdAt", "desc"), limit(100))
        );
        setPurchases(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Purchase)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadPurchases();
  }, []);

  async function handleDelete(purchase: Purchase) {
    if (!purchase.userId || !purchase.gameId) {
      if (!confirm(`Biztosan törlöd ezt a vásárlást? (ID: ${purchase.id})`)) return;
    } else {
      if (
        !confirm(
          `Biztosan törlöd ezt a vásárlást?\n\nFelhasználó: ${purchase.userId}\nJáték: ${purchase.gameId}\n\nEz törli a vásárlást, a játék tulajdonjogát és a haladást is.`
        )
      ) return;
    }

    setDeleting(purchase.id);
    try {
      await deleteDoc(doc(db, "purchases", purchase.id));
      if (purchase.userId && purchase.gameId) {
        await Promise.allSettled([
          deleteDoc(doc(db, "users", purchase.userId, "owned_games", purchase.gameId)),
          deleteDoc(doc(db, "users", purchase.userId, "progress", purchase.gameId)),
        ]);
      }
      setPurchases((prev) => prev.filter((p) => p.id !== purchase.id));
    } catch (e) {
      console.error(e);
      alert("Törlési hiba.");
    } finally {
      setDeleting(null);
    }
  }

  function formatDate(ts: Timestamp | null | undefined): string {
    if (!ts) return "—";
    try {
      return ts.toDate().toLocaleString("hu-HU", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return "—";
    }
  }

  return (
    <main className="min-h-screen pb-20" style={{ background: "var(--bg-base)" }}>
      <Container className="py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="btn-ghost text-sm px-3 py-2 min-h-0">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase" style={{ color: "var(--cyan)" }}>
              Admin / Vásárlások
            </p>
            <h1
              className="text-2xl font-black"
              style={{ fontFamily: "var(--font-cinzel), Cinzel, serif", color: "var(--text-primary)" }}
            >
              Vásárlások
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="glass p-8 text-center">
            <Loader2 className="animate-spin mx-auto" size={28} style={{ color: "var(--cyan)" }} />
          </div>
        ) : purchases.length === 0 ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <ShoppingCart size={32} className="mx-auto mb-3 opacity-40" />
            <p>Nincsenek vásárlások.</p>
          </div>
        ) : (
          <div className="glass overflow-hidden">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-dim)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Utolsó {purchases.length} vásárlás megjelenítve
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-dim)" }}>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Felhasználó (UID)</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Játék (ID)</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Jóváhagyta</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Összeg</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Dátum</th>
                    <th className="px-4 py-3 text-right font-semibold" style={{ color: "var(--text-muted)" }}>Törlés</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid var(--border-dim)" }}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                          {p.userId ? `${p.userId.slice(0, 10)}…` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs" style={{ color: "var(--cyan)" }}>
                          {p.gameId ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        {p.confirmedBy ?? "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                        {p.amount != null ? `${p.amount} Ft` : "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        <span className="text-xs">{formatDate(p.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deleting === p.id}
                          className="btn-ghost text-xs px-3 py-1.5 min-h-0"
                          style={{ color: "var(--orange)", borderColor: "rgba(255,107,53,0.2)" }}
                        >
                          {deleting === p.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
