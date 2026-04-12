// Manually curated endPoint coordinates for all Seekr games
// Based on startPoint locations, city geography, and game themes
// Uses gcloud auth token for authenticated Firestore writes

import { execSync } from "child_process";

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/balaton-kod/databases/(default)/documents`;

// Curated end points: 500m–2km from start, real notable locations
const ENDPOINTS = {
  // Budapest games
  budapest_alagut_konspiracio: {
    lat: 47.5012, lng: 19.034, name: "Batthyány tér",
  },
  budapest_alkonyi_atadas: {
    lat: 47.5016, lng: 19.0572, name: "Magyar Parlament – Kossuth tér",
  },
  budapest_arany_hid: {
    lat: 47.5038, lng: 19.036, name: "Bécsi kapu tér, Várnegyed",
  },
  budapest_deak: {
    lat: 47.5006, lng: 19.0606, name: "Vörösmarty tér",
  },
  budapest_duna_kod: {
    lat: 47.5007, lng: 19.037, name: "Széchenyi Lánchíd – budai hídfő",
  },
  budapest_fekete_dosszie: {
    lat: 47.4946, lng: 19.0556, name: "Fővárosi Nagycirkusz – Városliget bejárat",
  },
  budapest_fekete_vonal: {
    lat: 47.4953, lng: 19.0627, name: "Keleti pályaudvar körüli lépcsőzet",
  },
  budapest_gellert_feny: {
    lat: 47.4921, lng: 19.0469, name: "Gellért-hegy csúcs – Citadella",
  },
  budapest_otos: {
    lat: 47.5014, lng: 19.0541, name: "Erzsébet tér – Deak téri aluljáró kijárat",
  },
  budapest_rejtett_palya: {
    lat: 47.4962, lng: 19.0452, name: "Fővám tér – Vásárcsarnok",
  },
  budapest_varkapu: {
    lat: 47.4966, lng: 19.0398, name: "Mátyás-templom – Halászbástya",
  },
  elfeledett_kiralysag: {
    lat: 47.5302, lng: 19.0488, name: "Aquincum Múzeum, Római Katonai Amfiteátrum",
  },
  // Siófok games
  siofok_alattomos_hullam: {
    lat: 46.9042, lng: 18.0612, name: "Ezüstpart – hajókikötő",
  },
  siofok_banya: {
    lat: 46.9026, lng: 18.0592, name: "Siófoki Strand főbejárat",
  },
  siofok_ejszakai_csere: {
    lat: 46.9077, lng: 18.0636, name: "Siófoki Vitorláskikötő (Marina)",
  },
  siofok_hangarnyek: {
    lat: 46.9066, lng: 18.0428, name: "Siófoki repülőtér – hangár terület",
  },
  siofok_holtviz: {
    lat: 46.9033, lng: 18.0573, name: "Siófoki Strand déli területe",
  },
  siofok_jelzavar: {
    lat: 46.9098, lng: 18.0472, name: "Siófoki kikötő – révkalauz állomás",
  },
  siofok_kekfeny: {
    lat: 46.9044, lng: 18.0514, name: "Siófoki Nagystrand sétánya",
  },
  siofok_kodoltszel: {
    lat: 46.9052, lng: 18.0554, name: "Siófoki Városi Strand",
  },
  siofok_nocturne: {
    lat: 46.9077, lng: 18.0636, name: "Siófoki Vitorláskikötő",
  },
  siofok_thriller: {
    lat: 46.9033, lng: 18.0455, name: "Siófoki Kálvária-domb",
  },
  siofok_viztorony_kulcs: {
    lat: 46.9053, lng: 18.0486, name: "Kálmán Imre Emlékmúzeum",
  },
};

// Special case: siofok_konnyu needs startPoint too
const SIOFOK_KONNYU_START = {
  lat: 46.9044,
  lng: 18.0514,
  name: "Siófoki Nagystrand – főbejárat",
};
const SIOFOK_KONNYU_END = {
  lat: 46.9077,
  lng: 18.0636,
  name: "Siófoki Vitorláskikötő (Marina)",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getToken() {
  return execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();
}

async function patchEndPoint(gameId, endPoint, token) {
  const url = `${FIRESTORE_BASE}/games/${gameId}?updateMask.fieldPaths=endPoint`;
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
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Firestore PATCH error ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function patchStartAndEnd(gameId, startPoint, endPoint, token) {
  const url = `${FIRESTORE_BASE}/games/${gameId}?updateMask.fieldPaths=startPoint&updateMask.fieldPaths=endPoint`;
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
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Firestore PATCH error ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function main() {
  let token;
  try {
    token = getToken();
    console.log("Got gcloud auth token.");
  } catch (err) {
    console.error("Failed to get gcloud token:", err.message);
    process.exit(1);
  }

  // Patch siofok_konnyu with both start and end
  console.log("Patching siofok_konnyu (start + end)...");
  try {
    await patchStartAndEnd("siofok_konnyu", SIOFOK_KONNYU_START, SIOFOK_KONNYU_END, token);
    console.log("  ✓ siofok_konnyu patched");
  } catch (err) {
    console.error("  ✗ Error:", err.message);
  }
  await sleep(100);

  // Patch all others with just endPoint
  for (const [gameId, coords] of Object.entries(ENDPOINTS)) {
    console.log(`Patching ${gameId}...`);
    try {
      await patchEndPoint(gameId, coords, token);
      console.log(`  ✓ endPoint: ${coords.name}`);
    } catch (err) {
      console.error(`  ✗ Error for ${gameId}:`, err.message);
    }
    await sleep(100);
  }

  console.log("\nAll done!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
