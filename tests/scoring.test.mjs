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

