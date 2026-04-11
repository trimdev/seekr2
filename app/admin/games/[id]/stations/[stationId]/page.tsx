"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Container } from "@/components/ui/Container";
import type { Station } from "@/types";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

type Lang = "hu" | "en" | "de";
const LANGS: Lang[] = ["hu", "en", "de"];
const LANG_LABEL: Record<Lang, string> = { hu: "Magyar", en: "English", de: "Deutsch" };

type I18nObj = { hu: string; en: string; de: string };
type StationType = "text" | "lock" | "puzzle_order" | "puzzle_match" | "qr";

const STATION_TYPES: StationType[] = ["text", "lock", "puzzle_order", "puzzle_match", "qr"];

function toI18nObj(val: unknown): I18nObj {
  if (!val) return { hu: "", en: "", de: "" };
  if (typeof val === "string") return { hu: val, en: val, de: val };
  const v = val as Partial<I18nObj>;
  return { hu: v.hu ?? "", en: v.en ?? "", de: v.de ?? "" };
}

interface FormData {
  title: I18nObj;
  subtitle: I18nObj;
  riddle: I18nObj;
  task: I18nObj;
  hint: I18nObj;
  nextHint: I18nObj;
  solution: I18nObj;
  story: I18nObj;
  type: StationType;
  active: boolean;
  order: number;
  image: string;
}

export default function AdminStationEditorPage() {
  const { id: gameId, stationId } = useParams<{ id: string; stationId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lang, setLang] = useState<Lang>("hu");
  const [form, setForm] = useState<FormData>({
    title: { hu: "", en: "", de: "" },
    subtitle: { hu: "", en: "", de: "" },
    riddle: { hu: "", en: "", de: "" },
    task: { hu: "", en: "", de: "" },
    hint: { hu: "", en: "", de: "" },
    nextHint: { hu: "", en: "", de: "" },
    solution: { hu: "", en: "", de: "" },
    story: { hu: "", en: "", de: "" },
    type: "text",
    active: true,
    order: 1,
    image: "",
  });

  useEffect(() => {
    if (!gameId || !stationId) return;
    async function loadStation() {
      const snap = await getDoc(doc(db, "games", gameId, "stations", stationId));
      if (!snap.exists()) { setLoading(false); return; }
      const d = snap.data() as Partial<Station>;
      setForm({
        title: toI18nObj(d.title),
        subtitle: toI18nObj(d.subtitle),
        riddle: toI18nObj(d.riddle),
        task: toI18nObj(d.task),
        hint: toI18nObj(d.hint),
        nextHint: toI18nObj(d.nextHint),
        solution: toI18nObj(d.solution),
        story: toI18nObj(d.story),
        type: (d.type as StationType) ?? "text",
        active: d.active ?? true,
        order: d.order ?? 1,
        image: d.image ?? "",
      });
      setLoading(false);
    }
    loadStation();
  }, [gameId, stationId]);

  type I18nFieldKey = "title" | "subtitle" | "riddle" | "task" | "hint" | "nextHint" | "solution" | "story";

  function setI18n(field: I18nFieldKey, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateDoc(doc(db, "games", gameId, "stations", stationId), {
        title: form.title,
        subtitle: form.subtitle,
        riddle: form.riddle,
        task: form.task,
        hint: form.hint,
        nextHint: form.nextHint,
        solution: form.solution,
        story: form.story,
        type: form.type,
        active: form.active,
        order: form.order,
        image: form.image,
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

  const i18nFields: { key: I18nFieldKey; label: string; multiline?: boolean }[] = [
    { key: "title", label: "Cím" },
    { key: "subtitle", label: "Alcím" },
    { key: "riddle", label: "Rejtvény", multiline: true },
    { key: "task", label: "Feladat", multiline: true },
    { key: "story", label: "Történet", multiline: true },
    { key: "hint", label: "Tipp" },
    { key: "nextHint", label: "Következő tipp", multiline: true },
    { key: "solution", label: "Megoldás" },
  ];

  return (
    <main className="min-h-screen pb-20" style={{ background: "var(--bg-base)" }}>
      <Container className="py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/admin/games/${gameId}/stations`} className="btn-ghost text-sm px-3 py-2 min-h-0">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase" style={{ color: "var(--cyan)" }}>
              Admin / Állomás szerkesztése
            </p>
            <h1
              className="text-2xl font-black"
              style={{ fontFamily: "var(--font-cinzel), Cinzel, serif", color: "var(--text-primary)" }}
            >
              {form.title.hu || `Állomás #${form.order}`}
            </h1>
          </div>
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
            {i18nFields.map(({ key, label, multiline }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                {multiline ? (
                  <textarea
                    style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                    value={form[key][lang]}
                    onChange={(e) => setI18n(key, e.target.value)}
                    placeholder={`${label} (${lang})`}
                    onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-dim)")}
                  />
                ) : (
                  <input
                    style={inputStyle}
                    value={form[key][lang]}
                    onChange={(e) => setI18n(key, e.target.value)}
                    placeholder={`${label} (${lang})`}
                    onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-dim)")}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Settings */}
          <div className="glass p-6 space-y-5">
            <h2 className="text-sm font-bold" style={{ color: "var(--orange)", fontFamily: "var(--font-cinzel), Cinzel, serif" }}>
              Beállítások
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label style={labelStyle}>Típus</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as StationType }))}
                  onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-dim)")}
                >
                  {STATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Sorrend</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.order}
                  onChange={(e) => setForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
                  min={1}
                  onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-dim)")}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Kép URL</label>
              <input
                style={inputStyle}
                value={form.image}
                onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                placeholder="https://..."
                onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-dim)")}
              />
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
                <span className="font-semibold text-sm">{form.active ? "Aktív" : "Inaktív"}</span>
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
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
