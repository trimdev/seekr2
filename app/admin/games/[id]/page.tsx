"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Container } from "@/components/ui/Container";
import type { Game } from "@/types";
import { ArrowLeft, Save, List, Loader2 } from "lucide-react";

type Lang = "hu" | "en" | "de";
const LANGS: Lang[] = ["hu", "en", "de"];
const LANG_LABEL: Record<Lang, string> = { hu: "Magyar", en: "English", de: "Deutsch" };

type I18nObj = { hu: string; en: string; de: string };

function toI18nObj(val: unknown): I18nObj {
  if (!val) return { hu: "", en: "", de: "" };
  if (typeof val === "string") return { hu: val, en: val, de: val };
  const v = val as Partial<I18nObj>;
  return { hu: v.hu ?? "", en: v.en ?? "", de: v.de ?? "" };
}

interface FormData {
  title: I18nObj;
  shortdesc: I18nObj;
  desc: I18nObj;
  story_intro: I18nObj;
  mission: I18nObj;
  city: I18nObj;
  price: number;
  active: boolean;
  category: "outdoor" | "pub";
}

export default function AdminGameEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lang, setLang] = useState<Lang>("hu");
  const [form, setForm] = useState<FormData>({
    title: { hu: "", en: "", de: "" },
    shortdesc: { hu: "", en: "", de: "" },
    desc: { hu: "", en: "", de: "" },
    story_intro: { hu: "", en: "", de: "" },
    mission: { hu: "", en: "", de: "" },
    city: { hu: "", en: "", de: "" },
    price: 0,
    active: false,
    category: "outdoor",
  });

  useEffect(() => {
    if (!id) return;
    async function loadGame() {
      const snap = await getDoc(doc(db, "games", id));
      if (!snap.exists()) { setLoading(false); return; }
      const d = snap.data() as Partial<Game>;
      setForm({
        title: toI18nObj(d.title),
        shortdesc: toI18nObj(d.shortdesc),
        desc: toI18nObj(d.desc),
        story_intro: toI18nObj(d.story_intro),
        mission: toI18nObj(d.mission),
        city: toI18nObj(d.city),
        price: d.price ?? 0,
        active: d.active ?? false,
        category: d.category ?? "outdoor",
      });
      setLoading(false);
    }
    loadGame();
  }, [id]);

  function setI18n(field: keyof Pick<FormData, "title" | "shortdesc" | "desc" | "story_intro" | "mission" | "city">, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateDoc(doc(db, "games", id), {
        title: form.title,
        shortdesc: form.shortdesc,
        desc: form.desc,
        story_intro: form.story_intro,
        mission: form.mission,
        city: form.city,
        price: form.price,
        active: form.active,
        category: form.category,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
      alert("Mentési hiba.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <Loader2 className="animate-spin" size={32} style={{ color: "var(--cyan)" }} />
      </main>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--border-dim)",
    borderRadius: "10px",
    color: "var(--text-primary)",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: "6px",
  };

  return (
    <main className="min-h-screen pb-20" style={{ background: "var(--bg-base)" }}>
      <Container className="py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin/games" className="btn-ghost text-sm px-3 py-2 min-h-0">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase" style={{ color: "var(--cyan)" }}>
              Admin / Játékok / Szerkesztés
            </p>
            <h1
              className="text-2xl font-black"
              style={{ fontFamily: "var(--font-cinzel), Cinzel, serif", color: "var(--text-primary)" }}
            >
              {form.title.hu || "(névtelen játék)"}
            </h1>
          </div>
          <Link
            href={`/admin/games/${id}/stations`}
            className="btn-ghost text-sm"
          >
            <List size={16} />
            Állomások
          </Link>
        </div>

        <div className="space-y-6">
          {/* Language tabs */}
          <div className="flex gap-2">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: lang === l ? "var(--cyan-dim)" : "transparent",
                  color: lang === l ? "var(--cyan)" : "var(--text-muted)",
                  border: `1px solid ${lang === l ? "var(--border-glow)" : "var(--border-dim)"}`,
                }}
              >
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>

          {/* I18n fields */}
          <div className="glass p-6 space-y-5">
            <h2 className="text-sm font-bold" style={{ color: "var(--cyan)", fontFamily: "var(--font-cinzel), Cinzel, serif" }}>
              Szövegek — {LANG_LABEL[lang]}
            </h2>

            <div>
              <label style={labelStyle}>Cím</label>
              <input
                style={inputStyle}
                value={form.title[lang]}
                onChange={(e) => setI18n("title", e.target.value)}
                placeholder={`Cím (${lang})`}
                onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-dim)")}
              />
            </div>

            <div>
              <label style={labelStyle}>Rövid leírás</label>
              <input
                style={inputStyle}
                value={form.shortdesc[lang]}
                onChange={(e) => setI18n("shortdesc", e.target.value)}
                placeholder={`Rövid leírás (${lang})`}
                onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-dim)")}
              />
            </div>

            <div>
              <label style={labelStyle}>Leírás</label>
              <textarea
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                value={form.desc[lang]}
                onChange={(e) => setI18n("desc", e.target.value)}
                placeholder={`Leírás (${lang})`}
                onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-dim)")}
              />
            </div>

            <div>
              <label style={labelStyle}>Történet bevezető</label>
              <textarea
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                value={form.story_intro[lang]}
                onChange={(e) => setI18n("story_intro", e.target.value)}
                placeholder={`Történet bevezető (${lang})`}
                onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-dim)")}
              />
            </div>

            <div>
              <label style={labelStyle}>Küldetés</label>
              <input
                style={inputStyle}
                value={form.mission[lang]}
                onChange={(e) => setI18n("mission", e.target.value)}
                placeholder={`Küldetés (${lang})`}
                onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-dim)")}
              />
            </div>

            <div>
              <label style={labelStyle}>Helyszín / Város</label>
              <input
                style={inputStyle}
                value={form.city[lang]}
                onChange={(e) => setI18n("city", e.target.value)}
                placeholder={`Helyszín (${lang})`}
                onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-dim)")}
              />
            </div>
          </div>

          {/* Non-i18n fields */}
          <div className="glass p-6 space-y-5">
            <h2 className="text-sm font-bold" style={{ color: "var(--orange)", fontFamily: "var(--font-cinzel), Cinzel, serif" }}>
              Általános beállítások
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label style={labelStyle}>Ár (Ft)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  min={0}
                  onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-dim)")}
                />
              </div>

              <div>
                <label style={labelStyle}>Kategória</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as "outdoor" | "pub" }))}
                  onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-dim)")}
                >
                  <option value="outdoor">outdoor</option>
                  <option value="pub">pub</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Státusz</label>
              <button
                onClick={() => setForm((prev) => ({ ...prev, active: !prev.active }))}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: form.active ? "var(--cyan-dim)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${form.active ? "var(--border-glow)" : "var(--border-dim)"}`,
                  color: form.active ? "var(--cyan)" : "var(--text-muted)",
                }}
              >
                <div
                  className="w-10 h-5 rounded-full relative transition-colors"
                  style={{ background: form.active ? "var(--cyan)" : "var(--border-dim)" }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ left: form.active ? "calc(100% - 18px)" : "2px" }}
                  />
                </div>
                <span className="font-semibold text-sm">{form.active ? "Aktív (megjelenik a listában)" : "Inaktív (rejtve)"}</span>
              </button>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Mentés...</>
              ) : saved ? (
                <><Save size={16} /> Mentve!</>
              ) : (
                <><Save size={16} /> Mentés</>
              )}
            </button>
          </div>
        </div>
      </Container>
    </main>
  );
}
