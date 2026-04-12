"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User, Menu, X, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Container } from "@/components/ui/Container";

const NAV_LINKS = [
  { href: "/games",       label: "Játékok" },
  { href: "/howitworks",  label: "Hogyan működik" },
  { href: "/about",       label: "Rólunk" },
];

export function TopNav() {
  const { user, logout } = useAuth();
  const { isAdmin } = useIsAdmin();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(10,14,26,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-dim)",
      }}
    >
      <Container className="py-0">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-black tracking-widest flex-shrink-0"
            style={{
              fontFamily: "var(--font-cinzel), serif",
              color: "var(--cyan)",
              textShadow: "0 0 20px rgba(0,212,255,0.5)",
            }}
          >
            SEEKR
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  color: pathname === l.href ? "var(--cyan)" : "var(--text-muted)",
                  background: pathname === l.href ? "rgba(0,212,255,0.08)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ml-1"
                style={{
                  background: pathname.startsWith("/admin")
                    ? "rgba(255,107,53,0.18)"
                    : "rgba(255,107,53,0.10)",
                  border: "1px solid rgba(255,107,53,0.35)",
                  color: "var(--orange)",
                }}
              >
                <ShieldCheck size={13} />
                Admin
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-colors"
                  style={{
                    background: pathname === "/profile" ? "rgba(0,212,255,0.1)" : "transparent",
                    border: "1px solid var(--border-dim)",
                    color: pathname === "/profile" ? "var(--cyan)" : "var(--text-muted)",
                  }}
                >
                  {/* Avatar circle */}
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: "var(--cyan)", color: "#000" }}
                  >
                    {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate max-w-[90px]">
                    {user.displayName || user.email}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-dim)" }}
                  aria-label="Kilépés"
                >
                  <LogOut size={15} style={{ color: "var(--text-muted)" }} />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium flex-shrink-0"
                style={{
                  background: "rgba(0,212,255,0.1)",
                  border: "1px solid rgba(0,212,255,0.25)",
                  color: "var(--cyan)",
                }}
              >
                <User size={14} />
                Belépés
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-dim)" }}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menü"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            className="sm:hidden flex flex-col pb-3 gap-1"
            style={{ borderTop: "1px solid var(--border-dim)" }}
          >
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-bold"
                style={{ color: "var(--orange)" }}
              >
                <ShieldCheck size={16} />
                Admin panel
              </Link>
            )}
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-3 rounded-xl text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-3 rounded-xl text-sm font-medium"
                style={{ color: "var(--cyan)" }}
              >
                Profilom
              </Link>
            )}
          </div>
        )}
      </Container>
    </header>
  );
}
