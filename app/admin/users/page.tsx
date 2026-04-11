"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Container } from "@/components/ui/Container";
import { ArrowLeft, Users, ShieldCheck, ShieldOff, Loader2 } from "lucide-react";

interface UserRecord {
  id: string;
  name?: string;
  email?: string;
  roles?: { admin?: boolean };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const snap = await getDocs(collection(db, "users"));
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserRecord)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  async function handleToggleAdmin(user: UserRecord) {
    const current = user.roles?.admin === true;
    const action = current ? "elveszi az admin jogát" : "admin jogot ad";
    if (!confirm(`Biztosan ${action} ennek a felhasználónak?\n${user.email ?? user.id}`)) return;

    setToggling(user.id);
    try {
      await updateDoc(doc(db, "users", user.id), {
        "roles.admin": !current,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, roles: { ...u.roles, admin: !current } }
            : u
        )
      );
    } catch (e) {
      console.error(e);
      alert("Hiba az admin jog módosítása közben.");
    } finally {
      setToggling(null);
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
              Admin / Felhasználók
            </p>
            <h1
              className="text-2xl font-black"
              style={{ fontFamily: "var(--font-cinzel), Cinzel, serif", color: "var(--text-primary)" }}
            >
              Felhasználók
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="glass p-8 text-center">
            <Loader2 className="animate-spin mx-auto" size={28} style={{ color: "var(--cyan)" }} />
          </div>
        ) : users.length === 0 ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p>Nincsenek felhasználók.</p>
          </div>
        ) : (
          <div className="glass overflow-hidden">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-dim)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {users.length} felhasználó
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-dim)" }}>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Név</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Email</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>UID</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Admin</th>
                    <th className="px-4 py-3 text-right font-semibold" style={{ color: "var(--text-muted)" }}>Jogosultság</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isAdmin = user.roles?.admin === true;
                    return (
                      <tr
                        key={user.id}
                        style={{ borderBottom: "1px solid var(--border-dim)" }}
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                          {user.name ?? "—"}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                          {user.email ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs" style={{ color: "var(--text-faint)" }}>
                            {user.id.slice(0, 12)}…
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isAdmin ? (
                            <span
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid var(--border-glow)" }}
                            >
                              <ShieldCheck size={11} />
                              Admin
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--text-faint)" }}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggleAdmin(user)}
                            disabled={toggling === user.id}
                            className="btn-ghost text-xs px-3 py-1.5 min-h-0"
                            style={
                              isAdmin
                                ? { color: "var(--orange)", borderColor: "rgba(255,107,53,0.2)" }
                                : { color: "var(--cyan)", borderColor: "rgba(0,212,255,0.2)" }
                            }
                          >
                            {toggling === user.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : isAdmin ? (
                              <><ShieldOff size={13} /> Admin elvesz</>
                            ) : (
                              <><ShieldCheck size={13} /> Admin ad</>
                            )}
                          </button>
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
