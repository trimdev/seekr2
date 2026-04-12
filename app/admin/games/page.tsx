"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Container } from "@/components/ui/Container";
import { getText } from "@/lib/utils";
import type { Game } from "@/types";
import { Plus, Pencil, Trash2, ArrowLeft, Gamepad2, CheckCircle, XCircle } from "lucide-react";

export default function AdminGamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [bulkPricing, setBulkPricing] = useState(false);

  async function handleSetAllPrices() {
    if (!confirm("Minden játék árát 8900 Ft-ra állítod. Folytatod?")) return;
    setBulkPricing(true);
    try {
      const snap = await getDocs(collection(db, "games"));
      await Promise.all(snap.docs.map((d) => updateDoc(doc(db, "games", d.id), { price: 8900 })));
      await loadGames();
      alert(`✓ ${snap.docs.length} játék ára 8900 Ft-ra frissítve.`);
    } catch (e) {
      console.error(e);
      alert("Hiba az árak frissítésekor.");
    } finally {
      setBulkPricing(false);
    }
  }

  async function loadGames() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "games"), orderBy("title")));
      setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Game)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadGames(); }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const ref = await addDoc(collection(db, "games"), {
        title: { hu: "", en: "", de: "" },
        shortdesc: { hu: "", en: "", de: "" },
        desc: { hu: "", en: "", de: "" },
        city: { hu: "", en: "", de: "" },
        active: false,
        price: 0,
        category: "outdoor",
        createdAt: serverTimestamp(),
      });
      router.push(`/admin/games/${ref.id}`);
    } catch (e) {
      console.error(e);
      setCreating(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Biztosan törlöd ezt a játékot?\n"${title}"\n\nEz a művelet nem visszavonható.`)) return;
    try {
      await deleteDoc(doc(db, "games", id));
      setGames((prev) => prev.filter((g) => g.id !== id));
    } catch (e) {
      console.error(e);
      alert("Törlési hiba.");
    }
  }

  return (
    <main className="min-h-screen pb-20" style={{ background: "var(--bg-base)" }}>
      <Container className="py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="btn-ghost text-sm px-3 py-2 min-h-0">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase" style={{ color: "var(--cyan)" }}>
              Admin / Játékok
            </p>
            <h1
              className="text-2xl font-black"
              style={{ fontFamily: "var(--font-cinzel), Cinzel, serif", color: "var(--text-primary)" }}
            >
              Játékok kezelése
            </h1>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <button
            onClick={handleSetAllPrices}
            disabled={bulkPricing}
            className="btn-ghost text-sm"
            style={{ borderColor: "rgba(255,107,53,0.4)", color: "var(--orange)" }}
          >
            {bulkPricing ? "Frissítés..." : "Összes ár → 8900 Ft"}
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary text-sm"
          >
            <Plus size={16} />
            {creating ? "Létrehozás..." : "Új játék"}
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-muted)" }}>
            Betöltés...
          </div>
        ) : games.length === 0 ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <Gamepad2 size={32} className="mx-auto mb-3 opacity-40" />
            <p>Még nincs játék. Hozz létre egyet!</p>
          </div>
        ) : (
          <div className="glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-dim)" }}>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Cím (HU)</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Helyszín</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Ár</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Kategória</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Aktív</th>
                    <th className="px-4 py-3 text-right font-semibold" style={{ color: "var(--text-muted)" }}>Műveletek</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => {
                    const title = getText(game.title, "hu") || "(névtelen)";
                    const city = getText(game.city, "hu") || "—";
                    return (
                      <tr
                        key={game.id}
                        style={{ borderBottom: "1px solid var(--border-dim)" }}
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                          {title}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{city}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                          {game.price != null ? `${game.price} Ft` : "—"}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: game.category === "pub" ? "var(--orange-dim)" : "var(--cyan-dim)",
                              color: game.category === "pub" ? "var(--orange)" : "var(--cyan)",
                            }}
                          >
                            {game.category ?? "outdoor"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {game.active ? (
                            <CheckCircle size={16} style={{ color: "var(--cyan)" }} />
                          ) : (
                            <XCircle size={16} style={{ color: "var(--text-faint)" }} />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/games/${game.id}`}
                              className="btn-ghost text-xs px-3 py-1.5 min-h-0"
                            >
                              <Pencil size={13} />
                              Szerkeszt
                            </Link>
                            <button
                              onClick={() => handleDelete(game.id, title)}
                              className="btn-ghost text-xs px-3 py-1.5 min-h-0"
                              style={{ color: "var(--orange)", borderColor: "rgba(255,107,53,0.2)" }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
