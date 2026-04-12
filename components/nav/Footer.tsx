"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Mail, Globe } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [newsletterMsg, setNewsletterMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (pathname?.includes("/play")) {
    return null;
  }

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes("@")) {
      setNewsletterMsg("Kérlek adj meg érvényes e-mail címet.");
      return;
    }
    setSubmitting(true);
    try {
      await setDoc(doc(db, "newsletter_subscribers", normalized), {
        email: normalized,
        source: "footer",
        createdAt: serverTimestamp(),
      });
      setNewsletterMsg("Sikeres feliratkozás!");
      setEmail("");
    } catch {
      setNewsletterMsg("Nem sikerült a feliratkozás. Próbáld újra.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer
      style={{
        borderTop: "1px solid rgba(0,212,255,0.08)",
        background: "rgba(5,8,18,0.95)",
        color: "var(--text-primary)",
      }}
    >
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-5 py-12 md:grid-cols-3">
        {/* Left – Newsletter */}
        <div>
          <h3
            className="text-base font-bold mb-2 tracking-wide"
            style={{
              fontFamily: "var(--font-cinzel), serif",
              color: "var(--cyan)",
            }}
          >
            Legyen részed a kalandban
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Értesülj elsőként az új játékokról és helyszínekről.
          </p>
          <form onSubmit={handleNewsletter} className="flex items-center gap-2">
            <input
              type="email"
              placeholder="E-mail címed"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-xl px-3 py-2.5 text-sm"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-dim)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm px-4 py-2.5 rounded-xl whitespace-nowrap"
            >
              Feliratkozás
            </button>
          </form>
          {newsletterMsg && (
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              {newsletterMsg}
            </p>
          )}
        </div>

        {/* Center – Links */}
        <div className="md:text-center">
          <h3
            className="text-base font-bold mb-2 tracking-wide"
            style={{
              fontFamily: "var(--font-cinzel), serif",
              color: "var(--cyan)",
            }}
          >
            Hasznos linkek
          </h3>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/games", label: "Játékok" },
              { href: "/howitworks", label: "Hogyan működik" },
              { href: "/about", label: "Rólunk" },
              { href: "/aszf", label: "ÁSZF" },
              { href: "/adatvedelem", label: "Adatkezelés" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.color = "var(--cyan)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)")
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right – Contact + Social */}
        <div>
          <h3
            className="text-base font-bold mb-2 tracking-wide"
            style={{
              fontFamily: "var(--font-cinzel), serif",
              color: "var(--cyan)",
            }}
          >
            Kapcsolat
          </h3>
          <ul className="space-y-3 text-sm" style={{ color: "var(--text-muted)" }}>
            <li className="flex items-center gap-2">
              <Mail size={15} style={{ color: "var(--cyan)", flexShrink: 0 }} />
              <a
                href="mailto:hello@seekr.city"
                className="transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "var(--cyan)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)")
                }
              >
                hello@seekr.city
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Globe size={15} style={{ color: "var(--cyan)", flexShrink: 0 }} />
              <a
                href="https://www.instagram.com/seekr.city"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "var(--cyan)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)")
                }
              >
                @seekr.city
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Globe size={15} style={{ color: "var(--cyan)", flexShrink: 0 }} />
              <a
                href="https://www.facebook.com/share/1Gcx1rGBSc/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "var(--cyan)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)")
                }
              >
                Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div
        className="max-w-5xl mx-auto px-5"
        style={{ borderTop: "1px solid var(--border-dim)" }}
      />

      {/* Bottom bar */}
      <div className="max-w-5xl mx-auto px-5 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span>© 2025 Seekr. Minden jog fenntartva.</span>
          <div className="flex gap-3">
            <Link
              href="/aszf"
              className="transition-colors hover:text-white"
              style={{ color: "var(--text-muted)" }}
            >
              ÁSZF
            </Link>
            <span style={{ color: "var(--border-dim)" }}>|</span>
            <Link
              href="/adatvedelem"
              className="transition-colors hover:text-white"
              style={{ color: "var(--text-muted)" }}
            >
              Adatkezelés
            </Link>
          </div>
        </div>

        {/* Payment pills */}
        <div className="flex items-center gap-2">
          {["VISA", "Mastercard", "Apple Pay", "Stripe"].map((label) => (
            <span
              key={label}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 4,
                padding: "2px 6px",
                fontSize: 10,
                color: "rgba(255,255,255,0.5)",
                whiteSpace: "nowrap" as const,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
