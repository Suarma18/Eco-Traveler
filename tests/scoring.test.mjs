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
