"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Container } from "@/components/ui/Container";
import { getText } from "@/lib/utils";
import type { Station } from "@/types";
import { ArrowLeft, Plus, Pencil, Trash2, MapPin, Loader2 } from "lucide-react";

export default function AdminStationsPage() {
  const { id: gameId } = useParams<{ id: string }>();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadStations() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "games", gameId, "stations"), orderBy("order", "asc"))
      );
      setStations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Station)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStations(); }, [gameId]);

  async function handleCreate() {
    setCreating(true);
    const maxOrder = stations.reduce((max, s) => Math.max(max, s.order ?? 0), 0);
    try {
      await addDoc(collection(db, "games", gameId, "stations"), {
        order: maxOrder + 1,
        title: { hu: "", en: "", de: "" },
        riddle: { hu: "", en: "", de: "" },
        task: { hu: "", en: "", de: "" },
        hint: { hu: "", en: "", de: "" },
        solution: { hu: "", en: "", de: "" },
        type: "text",
        active: true,
        createdAt: serverTimestamp(),
      });
      await loadStations();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(stationId: string, title: string) {
    if (!confirm(`Biztosan törlöd ezt az állomást?\n"${title}"\n\nEz a művelet nem visszavonható.`)) return;
    try {
      await deleteDoc(doc(db, "games", gameId, "stations", stationId));
      setStations((prev) => prev.filter((s) => s.id !== stationId));
    } catch (e) {
      console.error(e);
      alert("Törlési hiba.");
    }
  }

  const TYPE_COLORS: Record<string, string> = {
    text: "var(--cyan)",
    lock: "var(--orange)",
    puzzle_order: "#a855f7",
    puzzle_match: "#22d3ee",
    qr: "#f59e0b",
  };

  return (
    <main className="min-h-screen pb-20" style={{ background: "var(--bg-base)" }}>
      <Container className="py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/admin/games/${gameId}`} className="btn-ghost text-sm px-3 py-2 min-h-0">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase" style={{ color: "var(--cyan)" }}>
              Admin / Játékok / Állomások
            </p>
            <h1
              className="text-2xl font-black"
              style={{ fontFamily: "var(--font-cinzel), Cinzel, serif", color: "var(--text-primary)" }}
            >
              Állomások
            </h1>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary text-sm"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {creating ? "Létrehozás..." : "Új állomás"}
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="glass p-8 text-center">
            <Loader2 className="animate-spin mx-auto" size={28} style={{ color: "var(--cyan)" }} />
          </div>
        ) : stations.length === 0 ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <MapPin size={32} className="mx-auto mb-3 opacity-40" />
            <p>Még nincs állomás. Hozz létre egyet!</p>
          </div>
        ) : (
          <div className="glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-dim)" }}>
                    <th className="px-4 py-3 text-left font-semibold w-12" style={{ color: "var(--text-muted)" }}>#</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Cím (HU)</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Típus</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Aktív</th>
                    <th className="px-4 py-3 text-right font-semibold" style={{ color: "var(--text-muted)" }}>Műveletek</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((station) => {
                    const title = getText(station.title, "hu") || "(névtelen)";
                    const type = station.type ?? "text";
                    return (
                      <tr
                        key={station.id}
                        style={{ borderBottom: "1px solid var(--border-dim)" }}
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3 font-mono" style={{ color: "var(--text-muted)" }}>
                          {station.order}
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                          {title}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-mono"
                            style={{
                              background: `color-mix(in srgb, ${TYPE_COLORS[type] ?? "var(--cyan)"} 12%, transparent)`,
                              color: TYPE_COLORS[type] ?? "var(--cyan)",
                              border: `1px solid color-mix(in srgb, ${TYPE_COLORS[type] ?? "var(--cyan)"} 25%, transparent)`,
                            }}
                          >
                            {type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs"
                            style={{ color: station.active ? "var(--cyan)" : "var(--text-faint)" }}
                          >
                            {station.active ? "igen" : "nem"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/games/${gameId}/stations/${station.id}`}
                              className="btn-ghost text-xs px-3 py-1.5 min-h-0"
                            >
                              <Pencil size={13} />
                              Szerkeszt
                            </Link>
                            <button
                              onClick={() => handleDelete(station.id!, title)}
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
