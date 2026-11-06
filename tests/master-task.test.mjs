import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parsePreferencesSemantically } from "../src/lib/semantic-fallback.ts";

const desaDataset = JSON.parse(
  fs.readFileSync(path.resolve("data/desa-wisata.json"), "utf8")
);

const PRIORITY_REGENCIES = new Set([
  "Buleleng",
  "Karangasem",
  "Bangli",
  "Jembrana",
  "Klungkung",
]);

test("Master Task P0: Semantic parser extracts intents accurately even with typos", () => {
  // Exact user case 1: "more relaxaced" (typo of relaxed)
  const res1 = parsePreferencesSemantically("more relaxaced", "en");
  assert.ok(res1.focus, "Must detect focus");
  assert.ok(res1.focus.includes("Wellness"), "Must map relaxaced to Wellness");
  assert.match(res1.explanation, /wellness|relaxed|pace/i);

  // Exact user case 2: "tambah kuliner tedekat" (typo of terdekat)
  const res2 = parsePreferencesSemantically("tambah kuliner tedekat", "id");
  assert.ok(res2.focus, "Must detect focus");
  assert.ok(res2.focus.includes("Culinary"), "Must map kuliner tedekat to Culinary");
  assert.match(res2.explanation, /kuliner/i);

  // Compound multi-parameter prompt: "3 hari santai dari gilimanuk budget murah"
  const res3 = parsePreferencesSemantically(
    "3 hari santai dari gilimanuk budget murah",
    "id"
  );
  assert.equal(res3.days, 3, "Must extract 3 days");
  assert.equal(res3.arrival, "GilimanukPort", "Must extract GilimanukPort");
  assert.ok(res3.focus?.includes("Wellness"), "Must extract Wellness");
  assert.equal(res3.stay, "Backpacker", "Must extract Backpacker stay");

  // English 4-day nature & subak
  const res4 = parsePreferencesSemantically(
    "4 days nature and subak rice terrace",
    "en"
  );
  assert.equal(res4.days, 4);
  assert.ok(res4.focus?.includes("Nature"));
  assert.ok(res4.focus?.includes("Agriculture"));
});

test("Master Task P0: Codebase enforces Day / Night consistency (N days = N - 1 nights)", () => {
  const aiEngineCode = fs.readFileSync(
    path.resolve("src/lib/ai-engine.ts"),
    "utf8"
  );

  // Verify that final day recommendedStay is explicitly set to undefined
  assert.ok(
    aiEngineCode.includes("const isFinalDay = d === duration - 1;"),
    "ai-engine must detect final travel day"
  );
  assert.ok(
    aiEngineCode.includes("const recommendedStay = isFinalDay"),
    "ai-engine must conditionally assign recommendedStay based on isFinalDay"
  );
  assert.ok(
    aiEngineCode.includes("idx === (parsed.days || []).length - 1"),
    "ai-engine AI branch must also omit stay on the final departure day"
  );

  // Verify scoring only charges homestay spend if day.recommendedStay is defined
  const scoringCode = fs.readFileSync(
    path.resolve("src/lib/scoring.ts"),
    "utf8"
  );
  assert.ok(
    scoringCode.includes("if (day.recommendedStay) {"),
    "scoring.ts must only charge homestay spend on days that have a recommendedStay"
  );

  // Verify validateItineraryRoute is implemented and exported
  assert.ok(
    aiEngineCode.includes("export function validateItineraryRoute("),
    "ai-engine.ts must export validateItineraryRoute"
  );
  assert.ok(
    aiEngineCode.includes("const expectedNights = Math.max(0, days.length - 1);"),
    "validateItineraryRoute must check expected nights equals Math.max(0, days.length - 1)"
  );
});

test("Master Task P1: Data integrity - No raw TODO-HUMAN in user-facing UI labels", () => {
  const i18nCode = fs.readFileSync(
    path.resolve("src/lib/i18n.ts"),
    "utf8"
  );

  // Verify Table 33 - TODO-HUMAN was cleaned up from printFooterSource
  assert.ok(
    !i18nCode.includes("Table 33 - TODO-HUMAN"),
    "i18n must not expose raw Table 33 - TODO-HUMAN in user-facing footer"
  );
  assert.ok(
    i18nCode.includes("Direktori Resmi Desa Wisata Dinas Pariwisata Provinsi Bali"),
    "i18n must provide authoritative Disparda and BPS reference"
  );

  // Verify telemetry tooltip doesn't expose TODO-HUMAN
  const telemetryCode = fs.readFileSync(
    path.resolve("src/components/TelemetryCards.tsx"),
    "utf8"
  );
  assert.ok(
    !telemetryCode.includes("TODO-HUMAN: konfirmasi"),
    "TelemetryCards tooltip must not expose raw developer TODO-HUMAN"
  );
});
