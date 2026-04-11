// scripts/generate-images.mjs
// Run: node scripts/generate-images.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = 'balaton-kod';
const FIREBASE_KEY = 'AIzaSyAlQUeGIrXy2vjmeJjMVroK7W2x9azmhB8';
const GEMINI_KEY = 'AIzaSyB1sA5Vi1Zz0RTb-Id49S3bYuAuJaGsQvc';
const OUT_DIR = path.join(__dirname, '../public/game-images');

// ── Firestore REST helper ─────────────────────────────────────────────────────

function firestoreValue(v) {
  if (!v) return undefined;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.mapValue) {
    const obj = {};
    for (const [k, val] of Object.entries(v.mapValue.fields ?? {})) {
      obj[k] = firestoreValue(val);
    }
    return obj;
  }
  if (v.arrayValue) return (v.arrayValue.values ?? []).map(firestoreValue);
  return undefined;
}

function parseDoc(doc) {
  const id = doc.name.split('/').pop();
  const fields = {};
  for (const [k, v] of Object.entries(doc.fields ?? {})) {
    fields[k] = firestoreValue(v);
  }
  return { id, ...fields };
}

async function getGames() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/games?key=${FIREBASE_KEY}&pageSize=100`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Firestore error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return (json.documents ?? [])
    .map(parseDoc)
    .filter((g) => g.active !== false);
}

// ── Gemini image generation ───────────────────────────────────────────────────

async function geminiImage(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${text.slice(0, 400)}`);

  const json = JSON.parse(text);
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imgPart) {
    const textPart = parts.find((p) => p.text)?.text ?? '';
    throw new Error(`No image returned. Model said: "${textPart.slice(0, 200)}"`);
  }
  return imgPart.inlineData; // { mimeType, data }
}

// ── i18n helper ───────────────────────────────────────────────────────────────

function t(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.hu || val.en || val.de || '';
  return '';
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔥 Fetching games from Firestore…');
  let games;
  try {
    games = await getGames();
  } catch (e) {
    console.error('❌ Could not fetch games:', e.message);
    process.exit(1);
  }

  console.log(`   Found ${games.length} active games\n`);
  if (!games.length) {
    console.log('No games found. Check Firestore rules / active field.');
    process.exit(0);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const game of games) {
    const title = t(game.title) || 'Seekr Adventure';
    const city = t(game.city) || 'Hungary';
    const desc = t(game.desc) || t(game.shortdesc) || '';
    const isPub = game.category === 'pub';

    const prompt = [
      `Professional cinematic game cover photograph for "${title}", an escape room adventure in ${city}, Hungary.`,
      desc ? `Atmosphere: ${desc.substring(0, 160)}.` : '',
      isPub
        ? 'Setting: atmospheric Hungarian pub, dim warm amber lighting, wooden interiors, mystery notes on tables.'
        : 'Setting: dramatic outdoor urban scene, Hungarian baroque architecture, cobblestone streets, dramatic sky.',
      'Lighting: deep cinematic shadows, strong cyan/teal accent rim lights, moody night atmosphere.',
      'Style: high-contrast thriller photography, slightly desaturated, professional game art quality.',
      'No text, no people, no logos. Horizontal 16:9 format.',
    ].filter(Boolean).join(' ');

    // Check if already generated
    const jpgPath = path.join(OUT_DIR, `${game.id}.jpg`);
    const pngPath = path.join(OUT_DIR, `${game.id}.png`);
    const alreadyExists =
      await fs.access(jpgPath).then(() => true).catch(() => false) ||
      await fs.access(pngPath).then(() => true).catch(() => false);

    if (alreadyExists) {
      console.log(`⏭  ${title} — already exists, skipping`);
      continue;
    }

    process.stdout.write(`🎨 ${title} (${city})… `);
    try {
      const img = await geminiImage(prompt);
      const ext = img.mimeType === 'image/png' ? 'png' : 'jpg';
      const outPath = path.join(OUT_DIR, `${game.id}.${ext}`);
      await fs.writeFile(outPath, Buffer.from(img.data, 'base64'));
      console.log(`✓ saved ${game.id}.${ext}`);
    } catch (err) {
      console.log(`✗ FAILED — ${err.message}`);
    }

    // Respect rate limits
    await new Promise((r) => setTimeout(r, 3500));
  }

  console.log('\n✅ Done! Images saved to public/game-images/');
  process.exit(0);
}

main();
