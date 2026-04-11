"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Container } from "@/components/ui/Container";
import { Gamepad2, ShoppingCart, Users, Zap, ChevronRight, LayoutDashboard } from "lucide-react";

interface Stats {
  games: number;
  activeGames: number;
  purchases: number;
  users: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ games: 0, activeGames: 0, purchases: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [gamesSnap, activeGamesSnap, purchasesSnap, usersSnap] = await Promise.all([
          getCountFromServer(collection(db, "games")),
          getCountFromServer(query(collection(db, "games"), where("active", "==", true))),
          getCountFromServer(collection(db, "purchases")),
          getCountFromServer(collection(db, "users")),
        ]);
        setStats({
          games: gamesSnap.data().count,
          activeGames: activeGamesSnap.data().count,
          purchases: purchasesSnap.data().count,
          users: usersSnap.data().count,
        });
      } catch (e) {
        console.error("Stats load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { label: "Összes játék", value: stats.games, icon: Gamepad2, color: "var(--cyan)" },
    { label: "Aktív játékok", value: stats.activeGames, icon: Zap, color: "var(--orange)" },
    { label: "Vásárlások", value: stats.purchases, icon: ShoppingCart, color: "var(--cyan)" },
    { label: "Felhasználók", value: stats.users, icon: Users, color: "var(--orange)" },
  ];

  const navCards = [
    { href: "/admin/games", label: "Játékok kezelése", desc: "Hozzáadás, szerkesztés, törlés", icon: Gamepad2, color: "var(--cyan)" },
    { href: "/admin/purchases", label: "Vásárlások", desc: "Listázás, visszaállítás", icon: ShoppingCart, color: "var(--orange)" },
    { href: "/admin/users", label: "Felhasználók", desc: "Listázás, admin jogok", icon: Users, color: "var(--cyan)" },
  ];

  return (
    <main className="min-h-screen pb-20" style={{ background: "var(--bg-base)" }}>
      <Container className="py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard size={16} style={{ color: "var(--cyan)" }} />
            <p className="text-xs font-semibold tracking-[0.3em] uppercase" style={{ color: "var(--cyan)" }}>
              Admin Panel
            </p>
          </div>
          <h1
            className="text-3xl font-black"
            style={{ fontFamily: "var(--font-cinzel), Cinzel, serif", color: "var(--text-primary)" }}
          >
            Dashboard
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="glass p-5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{card.label}</p>
                  <Icon size={16} style={{ color: card.color }} />
                </div>
                <p
                  className="text-3xl font-black"
                  style={{ color: card.color, fontFamily: "var(--font-cinzel), Cinzel, serif" }}
                >
                  {loading ? "—" : card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Navigation cards */}
        <h2
          className="text-lg font-bold mb-4"
          style={{ fontFamily: "var(--font-cinzel), Cinzel, serif", color: "var(--text-primary)" }}
        >
          Kezelőfelületek
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {navCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="glass group flex items-center gap-4 p-6 transition-all hover:border-[var(--border-glow)]"
                style={{ textDecoration: "none" }}
              >
                <div
                  className="flex-shrink-0 rounded-xl p-3"
                  style={{ background: `color-mix(in srgb, ${card.color} 12%, transparent)` }}
                >
                  <Icon size={24} style={{ color: card.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{card.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{card.desc}</p>
                </div>
                <ChevronRight size={16} style={{ color: "var(--text-muted)" }} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
