// Script to generate missing endPoint (and startPoint) coordinates for Seekr games
// Uses Firestore REST API + Gemini API

const FIRESTORE_KEY = "AIzaSyAlQUeGIrXy2vjmeJjMVroK7W2x9azmhB8";
const GEMINI_KEY = "AIzaSyB1sA5Vi1Zz0RTb-Id49S3bYuAuJaGsQvc";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/balaton-kod/databases/(default)/documents`;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStringField(fields, key) {
  return fields?.[key]?.stringValue ?? null;
}

function getI18nText(fields, key) {
  const field = fields?.[key];
  if (!field) return null;
  if (field.stringValue) return field.stringValue;
  if (field.mapValue?.fields) {
    const f = field.mapValue.fields;
    return f.hu?.stringValue ?? f.en?.stringValue ?? null;
  }
  return null;
}

function getMapField(fields, key) {
  return fields?.[key]?.mapValue?.fields ?? null;
}

function hasValidPoint(fields, key) {
  const mapFields = getMapField(fields, key);
  if (!mapFields) return false;
  const lat = mapFields.lat?.doubleValue ?? mapFields.lat?.integerValue;
  const lng = mapFields.lng?.doubleValue ?? mapFields.lng?.integerValue;
  return lat != null && lng != null;
}

async function callGemini(prompt) {
  const resp = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  // Extract JSON from the response (may have markdown code fences)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON found in Gemini response: ${rawText}`);
  return JSON.parse(jsonMatch[0]);
}

async function patchEndPoint(gameId, endPoint) {
  const url = `${FIRESTORE_BASE}/games/${gameId}?updateMask.fieldPaths=endPoint&key=${FIRESTORE_KEY}`;
  const body = {
    fields: {
      endPoint: {
        mapValue: {
          fields: {
            lat: { doubleValue: endPoint.lat },
            lng: { doubleValue: endPoint.lng },
            name: { stringValue: endPoint.name ?? "" },
          },
        },
      },
    },
  };
  const resp = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Firestore PATCH endPoint error ${resp.status}: ${text}`);
  }
  return await resp.json();
}

async function patchStartAndEndPoint(gameId, startPoint, endPoint) {
  const url = `${FIRESTORE_BASE}/games/${gameId}?updateMask.fieldPaths=startPoint&updateMask.fieldPaths=endPoint&key=${FIRESTORE_KEY}`;
  const body = {
    fields: {
      startPoint: {
        mapValue: {
          fields: {
            lat: { doubleValue: startPoint.lat },
            lng: { doubleValue: startPoint.lng },
            name: { stringValue: startPoint.name ?? "" },
          },
        },
      },
      endPoint: {
        mapValue: {
          fields: {
            lat: { doubleValue: endPoint.lat },
            lng: { doubleValue: endPoint.lng },
            name: { stringValue: endPoint.name ?? "" },
          },
        },
      },
    },
  };
  const resp = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Firestore PATCH start+end error ${resp.status}: ${text}`);
  }
  return await resp.json();
}

async function fetchAllGames() {
  const url = `${FIRESTORE_BASE}/games?key=${FIRESTORE_KEY}&pageSize=100`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Firestore fetch error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  return data.documents ?? [];
}

async function main() {
  console.log("Fetching all games from Firestore...");
  const documents = await fetchAllGames();
  console.log(`Found ${documents.length} games.`);

  for (const doc of documents) {
    const pathParts = doc.name.split("/");
    const gameId = pathParts[pathParts.length - 1];
    const fields = doc.fields ?? {};

    const titleHu = getI18nText(fields, "title");
    const city = getI18nText(fields, "city");
    const startName = getI18nText(fields, "startName");
    const theme = getStringField(fields, "theme");

    const hasStart = hasValidPoint(fields, "startPoint");
    const hasEnd = hasValidPoint(fields, "endPoint");

    // Special case: siofok_konnyu missing both
    if (gameId === "siofok_konnyu" && !hasStart) {
      console.log(`\n[${gameId}] Missing startPoint AND endPoint — generating both...`);

      const startPrompt = `Give me GPS coordinates (latitude, longitude) for a realistic start point for this outdoor escape room game in Hungary. The game is called '${titleHu ?? gameId}', is in Siófok near the waterfront. Use Siófoki strand as the start location. Reply with ONLY a JSON object like: {"lat": 47.1234, "lng": 19.5678, "name": "Location Name"}`;

      let startCoords;
      try {
        startCoords = await callGemini(startPrompt);
        console.log(`  Start: ${JSON.stringify(startCoords)}`);
      } catch (err) {
        console.error(`  ERROR generating start for ${gameId}:`, err.message);
        await sleep(2000);
        continue;
      }
      await sleep(2000);

      const endPrompt = `Give me GPS coordinates (latitude, longitude) for a realistic end point for this outdoor escape room game in Hungary. The game is called '${titleHu ?? gameId}', starts at 'Siófoki strand' in Siófok. The end point should be a real, notable location 500m–2km from the start point that fits the game theme. Reply with ONLY a JSON object like: {"lat": 47.1234, "lng": 19.5678, "name": "Location Name"}`;

      let endCoords;
      try {
        endCoords = await callGemini(endPrompt);
        console.log(`  End: ${JSON.stringify(endCoords)}`);
      } catch (err) {
        console.error(`  ERROR generating end for ${gameId}:`, err.message);
        await sleep(2000);
        continue;
      }

      try {
        await patchStartAndEndPoint(gameId, startCoords, endCoords);
        console.log(`  ✓ Patched startPoint + endPoint for ${gameId}`);
      } catch (err) {
        console.error(`  ERROR patching ${gameId}:`, err.message);
      }
      await sleep(2000);
      continue;
    }

    if (hasEnd) {
      console.log(`[${gameId}] Already has endPoint — skipping.`);
      continue;
    }

    if (!hasStart) {
      console.log(`[${gameId}] Missing startPoint (not siofok_konnyu) — skipping.`);
      continue;
    }

    console.log(`\n[${gameId}] Generating endPoint...`);
    const prompt = `Give me GPS coordinates (latitude, longitude) for a realistic end point for this outdoor escape room game in Hungary. The game is called '${titleHu ?? gameId}', starts at '${startName ?? "unknown"}' in ${city ?? "Hungary"}. The end point should be a real, notable location 500m–2km from the start point that fits the game theme. Reply with ONLY a JSON object like: {"lat": 47.1234, "lng": 19.5678, "name": "Location Name"}`;

    let coords;
    try {
      coords = await callGemini(prompt);
      console.log(`  Gemini response: ${JSON.stringify(coords)}`);
    } catch (err) {
      console.error(`  ERROR calling Gemini for ${gameId}:`, err.message);
      await sleep(2000);
      continue;
    }

    try {
      await patchEndPoint(gameId, coords);
      console.log(`  ✓ Patched endPoint for ${gameId}`);
    } catch (err) {
      console.error(`  ERROR patching ${gameId}:`, err.message);
    }

    await sleep(2000);
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
