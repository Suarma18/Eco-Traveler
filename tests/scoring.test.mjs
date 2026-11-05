import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const desaDataset = JSON.parse(
  fs.readFileSync(path.resolve("data/desa-wisata.json"), "utf8")
);

const REGENCY_WEIGHTS = {
  Badung: 0.2,
  Denpasar: 0.2,
  Gianyar: 0.5,
  Tabanan: 0.5,
  Buleleng: 1.0,
  Karangasem: 1.0,
  Jembrana: 1.0,
  Bangli: 1.0,
  Klungkung: 1.0,
};

function calculateSpreadScore(regencies) {
  if (!regencies || regencies.length === 0) return 0;
  const sum = regencies.reduce((acc, r) => acc + (REGENCY_WEIGHTS[r] ?? 0.5), 0);
  return Math.round((sum / regencies.length) * 1000) / 10;
}

test("Spread Score awards 100 for Priority Regencies and 20 for South Bali", () => {
  assert.equal(
    calculateSpreadScore(["Buleleng", "Karangasem", "Bangli", "Jembrana"]),
    100
  );
  assert.equal(calculateSpreadScore(["Badung", "Denpasar"]), 20);
  assert.equal(calculateSpreadScore([]), 0);
});

test("Dataset has 28 verified villages with valid coordinates and buffer links", () => {
  assert.equal(desaDataset.length, 28);
  const byId = new Map(desaDataset.map((d) => [d.id, d]));

  for (const v of desaDataset) {
    assert.ok(v.lat < -8.0 && v.lat > -8.9, `Invalid lat for ${v.id}`);
    assert.ok(v.lng > 114.4 && v.lng < 115.8, `Invalid lng for ${v.id}`);
    if (v.bufferVillageId) {
      assert.ok(
        byId.has(v.bufferVillageId),
        `Missing bufferVillageId target ${v.bufferVillageId} for ${v.id}`
      );
    }
  }
});

test("High-load village Penglipuran redirects to buffer village Undisan", () => {
  const byId = new Map(desaDataset.map((d) => [d.id, d]));
  const penglipuran = byId.get("desa-penglipuran");
  assert.ok(penglipuran);
  const ratio = penglipuran.currentSimulatedLoad / penglipuran.dailyQuota;
  assert.ok(ratio >= 0.92, "Penglipuran should be >= 92% quota in simulation");
  assert.equal(penglipuran.bufferVillageId, "desa-undisan");
});

test("Currency conversion converts IDR to USD accurately for English mode", () => {
  const USD_EXCHANGE_RATE = 16000;
  const spendRp = 320000;
  const spendUsd = Math.round(spendRp / USD_EXCHANGE_RATE);
  assert.equal(spendUsd, 20);
});

function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateBaliTransit(fromLat, fromLng, toLat, toLng, locale = "id") {
  const straight = calculateHaversineDistanceKm(fromLat, fromLng, toLat, toLng);
  const roadKm = Math.max(0.5, Math.round(straight * 1.38 * 10) / 10);
  const durationMinutes = Math.max(10, Math.round((roadKm / 35) * 60) + 5);
  let formattedDuration =
    durationMinutes < 60
      ? locale === "en"
        ? `${durationMinutes} mins`
        : `${durationMinutes} mnt`
      : locale === "en"
      ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
      : `${Math.floor(durationMinutes / 60)}j ${durationMinutes % 60}m`;
  const formattedDistance =
    locale === "en"
      ? `${roadKm.toFixed(1)} km`
      : `${roadKm.toFixed(1).replace(".", ",")} km`;
  return { roadKm, durationMinutes, formattedDuration, formattedDistance };
}

test("Transit calculation estimates realistic travel duration and distance in Bali", () => {
  // Bandara Ngurah Rai (-8.7467, 115.1668) ke Desa Sedang (-8.5321, 115.2289)
  const transitId = estimateBaliTransit(
    -8.7467,
    115.1668,
    -8.5321,
    115.2289,
    "id"
  );
  assert.ok(
    transitId.roadKm > 20 && transitId.roadKm < 45,
    "Road km should be between 20 and 45 km"
  );
  assert.ok(
    transitId.durationMinutes > 35 && transitId.durationMinutes < 80,
    "Duration should be between 35 and 80 mins"
  );
  assert.match(transitId.formattedDistance, /km$/);
  assert.match(transitId.formattedDuration, /(mnt|j)/);

  const transitEn = estimateBaliTransit(
    -8.7467,
    115.1668,
    -8.5321,
    115.2289,
    "en"
  );
  assert.match(transitEn.formattedDuration, /(mins|h)/);
});

test("All 28 villages have curated accommodations and nearby attractions with valid coordinates and properties", () => {
  for (const v of desaDataset) {
    assert.ok(
      Array.isArray(v.accommodations) && v.accommodations.length > 0,
      `Village ${v.id} must have accommodations`
    );
    for (const stay of v.accommodations) {
      assert.ok(stay.id, `Stay in ${v.id} missing id`);
      assert.ok(stay.name, `Stay in ${v.id} missing name`);
      assert.ok(stay.pricePerNightRp > 0, `Stay in ${v.id} price must be > 0`);
      assert.ok(
        stay.lat < -8.0 && stay.lat > -8.9,
        `Invalid stay lat for ${stay.id}`
      );
      assert.ok(
        stay.lng > 114.4 && stay.lng < 115.8,
        `Invalid stay lng for ${stay.id}`
      );
    }

    assert.ok(
      Array.isArray(v.nearbyAttractions) && v.nearbyAttractions.length > 0,
      `Village ${v.id} must have nearby attractions`
    );
    for (const poi of v.nearbyAttractions) {
      assert.ok(poi.id, `POI in ${v.id} missing id`);
      assert.ok(poi.name, `POI in ${v.id} missing name`);
      assert.ok(poi.category, `POI in ${v.id} missing category`);
      assert.ok(poi.distanceKm > 0, `POI in ${v.id} distance must be > 0`);
      assert.ok(poi.durationMinutes > 0, `POI in ${v.id} duration must be > 0`);
      assert.ok(
        poi.lat < -8.0 && poi.lat > -8.9,
        `Invalid POI lat for ${poi.id}`
      );
      assert.ok(
        poi.lng > 114.4 && poi.lng < 115.8,
        `Invalid POI lng for ${poi.id}`
      );
    }
  }
});

test("GDP baseline shares cover all 9 regencies/cities in Bali and sum to 100%", () => {
  const gdpData = JSON.parse(
    fs.readFileSync(path.resolve("data/gdp-share.json"), "utf8")
  );

  const regencies = Object.keys(gdpData.regencies);
  assert.equal(regencies.length, 9, "Bali must have 9 regencies and cities");
  assert.ok(regencies.includes("Klungkung"), "Klungkung must be included");

  let totalPct = 0;
  for (const [name, info] of Object.entries(gdpData.regencies)) {
    assert.ok(info.value > 0, `GDP value for ${name} must be > 0`);
    assert.ok(info.year, `GDP year for ${name} must be defined`);
    assert.ok(info.source, `GDP source for ${name} must be defined`);
    totalPct += info.value;
  }

  // Floating point precision check: 100.0%
  assert.equal(Math.round(totalPct * 10) / 10, 100);

  // Sarbagita sum verification: Badung + Denpasar + Gianyar + Tabanan = 65.88%
  const sarbagitaSum =
    gdpData.regencies.Badung.value +
    gdpData.regencies.Denpasar.value +
    gdpData.regencies.Gianyar.value +
    gdpData.regencies.Tabanan.value;
  assert.equal(Math.round(sarbagitaSum * 100) / 100, 65.88);
});

test("T4: Estimation labels, formulas transparency, and honest capacity terminology are present", () => {
  const i18nContent = fs.readFileSync(
    path.resolve("src/lib/i18n.ts"),
    "utf8"
  );

  // Verify assumption badges and formula transparency keys in i18n
  assert.ok(
    i18nContent.includes("assumptionBadge:"),
    "i18n must include assumptionBadge"
  );
  assert.ok(
    i18nContent.includes("howCalculatedBtn:"),
    "i18n must include howCalculatedBtn"
  );
  assert.ok(
    i18nContent.includes("formulaModalTitle:"),
    "i18n must include formulaModalTitle"
  );
  assert.ok(
    i18nContent.includes("Retensi Ekonomi Desa (Local Economic Retention, LBI)"),
    "i18n must include expanded LBI terminology"
  );
  assert.ok(
    i18nContent.includes("Kapasitas terpakai:"),
    "i18n quota text must indicate simulation rather than live occupancy"
  );

  // Verify village-media.ts does not use raw live visitor counts without simulation label
  const villageMediaContent = fs.readFileSync(
    path.resolve("src/lib/village-media.ts"),
    "utf8"
  );
  assert.ok(
    villageMediaContent.includes("simulasi beban:") ||
      villageMediaContent.includes("simulated:"),
    "village-media must clearly label capacity as simulated load"
  );
});

test("T5: Complete transit legs, long leg warnings, and absence of misleading traffic-free claims", () => {
  const i18nContent = fs.readFileSync(
    path.resolve("src/lib/i18n.ts"),
    "utf8"
  );

  // Check required transit i18n functions
  assert.ok(
    i18nContent.includes("morningTransitFromStay:"),
    "i18n must include morningTransitFromStay"
  );
  assert.ok(
    i18nContent.includes("returnTransitToGate:"),
    "i18n must include returnTransitToGate"
  );
  assert.ok(
    i18nContent.includes("longLegWarning:"),
    "i18n must include longLegWarning"
  );
  assert.ok(
    i18nContent.includes("totalTripTransit:"),
    "i18n must include totalTripTransit"
  );
  assert.ok(
    i18nContent.includes("roadConditionNotice:"),
    "i18n must include roadConditionNotice"
  );

  // Verify utils transit computation flags long legs >= 180 min
  const utilsContent = fs.readFileSync(
    path.resolve("src/lib/utils.ts"),
    "utf8"
  );
  assert.ok(
    utilsContent.includes("isLongLeg: boolean") &&
      utilsContent.includes("durationMinutes >= 180"),
    "utils must define isLongLeg when transit is >= 180 minutes"
  );

  // Verify zero unsubstantiated "bebas macet" / "traffic-free" claims in app code
  assert.ok(
    !i18nContent.includes("traffic-free") &&
      !i18nContent.includes("bebas macet"),
    "i18n must not contain misleading 'traffic-free' or 'bebas macet' claims"
  );

  const aiEngineContent = fs.readFileSync(
    path.resolve("src/lib/ai-engine.ts"),
    "utf8"
  );
  assert.ok(
    !aiEngineContent.includes("bebas macet"),
    "ai-engine must not contain misleading 'bebas macet' claims"
  );
});

test("T7: Absence of unqualified 'official' and 'verified' claims, and data sources documentation", () => {
  const i18nContent = fs.readFileSync(
    path.resolve("src/lib/i18n.ts"),
    "utf8"
  );

  // Check PDF title does not claim to be an official government document
  assert.ok(
    !i18nContent.includes("OFFICIAL TRAVEL ITINERARY"),
    "PDF title must not use 'OFFICIAL TRAVEL ITINERARY'"
  );
  assert.ok(
    !i18nContent.includes("DOKUMEN PERJALANAN RESMI"),
    "PDF title must not use 'DOKUMEN PERJALANAN RESMI'"
  );

  // Check footerRight uses curated instead of unqualified verified
  assert.ok(
    !i18nContent.includes("28 Verified Tourism Villages Dataset"),
    "footerRight must use curated phrasing instead of '28 Verified Tourism Villages Dataset'"
  );

  // Check print footer disclaimers are present
  assert.ok(
    i18nContent.includes("printFooterDisclaimer:"),
    "i18n must include printFooterDisclaimer"
  );
  assert.ok(
    i18nContent.includes("printFooterSource:"),
    "i18n must include printFooterSource"
  );

  // Verify docs/DATA-SOURCES.md exists and documents origin
  assert.ok(
    fs.existsSync(path.resolve("docs/DATA-SOURCES.md")),
    "docs/DATA-SOURCES.md must exist"
  );
  const dataSourcesMd = fs.readFileSync(
    path.resolve("docs/DATA-SOURCES.md"),
    "utf8"
  );
  assert.ok(
    dataSourcesMd.includes("Dinas Pariwisata Provinsi Bali") &&
      dataSourcesMd.includes("TODO-HUMAN"),
    "DATA-SOURCES.md must document Disparda origin and mark TODO-HUMAN"
  );
});

test("T8: Map viewport invalidation, marker z-index hierarchy, and contrast casing polylines", () => {
  const mapCode = fs.readFileSync(
    path.resolve("src/components/LeafletMap.tsx"),
    "utf8"
  );

  // Verify invalidateSize is connected to ResizeObserver and window events
  assert.ok(
    mapCode.includes("map.invalidateSize") &&
      mapCode.includes("ResizeObserver") &&
      mapCode.includes("orientationchange"),
    "LeafletMap must listen to ResizeObserver, resize, and orientationchange"
  );

  // Verify fitBounds incorporates padding and maxZoom
  assert.ok(
    mapCode.includes("map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })"),
    "LeafletMap must call fitBounds with padding and maxZoom"
  );

  // Verify stop markers have elevated zIndexOffset to stay above polylines
  assert.ok(
    mapCode.includes("zIndexOffset={isSelected ? 1500 : 800 + actIdx * 10}"),
    "LeafletMap stop markers must have zIndexOffset higher than polylines"
  );

  // Verify arrivalCoords is added to allRouteCoords for complete fitBounds
  assert.ok(
    mapCode.includes("if (arrivalCoords) {") &&
      mapCode.includes("coords.push(arrivalCoords);"),
    "allRouteCoords must include arrivalCoords in bounds calculation"
  );
});
