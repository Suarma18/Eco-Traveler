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
  assert.equal(res1.status, "matched");
  assert.ok(res1.parsed?.focus, "Must detect focus");
  assert.ok(res1.parsed.focus.includes("Wellness"), "Must map relaxaced to Wellness");
  assert.equal(res1.detectedIntents.pace, "relaxed");
  assert.match(res1.parsed.explanation, /wellness|relaxed|pace/i);

  // Exact user case 2: "tambah kuliner tedekat" (typo of terdekat)
  const res2 = parsePreferencesSemantically("tambah kuliner tedekat", "id");
  assert.equal(res2.status, "matched");
  assert.ok(res2.parsed?.focus, "Must detect focus");
  assert.ok(res2.parsed.focus.includes("Culinary"), "Must map kuliner tedekat to Culinary");
  assert.match(res2.parsed.explanation, /kuliner/i);

  // Compound multi-parameter prompt: "3 hari santai dari gilimanuk budget murah"
  const res3 = parsePreferencesSemantically(
    "3 hari santai dari gilimanuk budget murah",
    "id"
  );
  assert.equal(res3.status, "matched");
  assert.equal(res3.parsed?.days, 3, "Must extract 3 days");
  assert.equal(res3.parsed?.arrival, "GilimanukPort", "Must extract GilimanukPort");
  assert.ok(res3.parsed?.focus?.includes("Wellness"), "Must extract Wellness");
  assert.equal(res3.parsed?.stay, "Backpacker", "Must extract Backpacker stay");

  // English 4-day nature & subak
  const res4 = parsePreferencesSemantically(
    "4 days nature and subak rice terrace",
    "en"
  );
  assert.equal(res4.status, "matched");
  assert.equal(res4.parsed?.days, 4);
  assert.ok(res4.parsed?.focus?.includes("Nature"));
  assert.ok(res4.parsed?.focus?.includes("Agriculture"));
});

test("Master Task Adversarial: Negation and exclusion handling", () => {
  // Indonesian: "tambah kuliner tapi jangan ada pantai"
  const res1 = parsePreferencesSemantically(
    "tambah kuliner tapi jangan ada pantai",
    "id"
  );
  assert.equal(res1.status, "matched");
  assert.deepEqual(res1.detectedIntents.focuses, ["Culinary"]);
  assert.deepEqual(res1.detectedIntents.excludedFocuses, ["Nature"]);
  assert.ok(res1.parsed?.focus?.includes("Culinary"));
  assert.ok(!res1.parsed?.focus?.includes("Nature"));

  // English: "no temples, nature only"
  const res2 = parsePreferencesSemantically("no temples, nature only", "en");
  assert.equal(res2.status, "matched");
  assert.deepEqual(res2.detectedIntents.focuses, ["Nature"]);
  assert.deepEqual(res2.detectedIntents.excludedFocuses, ["Culture"]);
  assert.ok(res2.parsed?.focus?.includes("Nature"));
  assert.ok(!res2.parsed?.focus?.includes("Culture"));

  // Arrival negation: "bukan dari gilimanuk"
  const res3 = parsePreferencesSemantically("bukan dari gilimanuk", "id");
  assert.equal(res3.status, "matched");
  assert.equal(res3.parsed?.arrival, "NgurahRaiAirport");

  // Double exclusion: "tanpa kuliner dan tanpa pura"
  const res4 = parsePreferencesSemantically("tanpa kuliner dan tanpa pura", "id");
  assert.equal(res4.status, "matched");
  assert.ok(res4.detectedIntents.excludedFocuses?.includes("Culinary"));
  assert.ok(res4.detectedIntents.excludedFocuses?.includes("Culture"));
});

test("Master Task Adversarial: Conflicting constraints and out-of-bounds inputs", () => {
  // Conflicting durations: "awalnya 1 hari tapi tolong ganti jadi 3 hari"
  const res1 = parsePreferencesSemantically(
    "awalnya 1 hari tapi tolong ganti jadi 3 hari",
    "id"
  );
  assert.equal(res1.status, "matched");
  assert.equal(res1.parsed?.days, 3, "Latest duration instruction must supersede earlier");
  assert.ok(res1.conflictNotes && res1.conflictNotes.length > 0);

  // Out of bounds duration: "10 hari keliling bali"
  const res2 = parsePreferencesSemantically("10 hari keliling bali", "id");
  assert.equal(res2.status, "clarification_needed");
  assert.equal(res2.parsed, null);
  assert.match(res2.clarificationPrompt || "", /1.*4\s*hari/);

  // Out of bounds duration: "0 hari"
  const res3 = parsePreferencesSemantically("0 hari", "id");
  assert.equal(res3.status, "clarification_needed");
  assert.equal(res3.parsed, null);
});

test("Master Task Adversarial: Unrecognized and ambiguous inputs reject false success", () => {
  // Pure gibberish
  const res1 = parsePreferencesSemantically("asdfghjkl", "id");
  assert.equal(res1.status, "unrecognized");
  assert.equal(res1.confidence, "none");
  assert.equal(res1.parsed, null);

  // Unrelated conversational sentence
  const res2 = parsePreferencesSemantically("halo selamat pagi apa kabar", "id");
  assert.equal(res2.status, "unrecognized");
  assert.equal(res2.parsed, null);

  // Ambiguous travel sentiment without actionable parameters
  const res3 = parsePreferencesSemantically("mau liburan seru bareng teman", "id");
  assert.equal(res3.status, "clarification_needed");
  assert.equal(res3.confidence, "low");
  assert.equal(res3.parsed, null);
  assert.ok(res3.clarificationPrompt?.length > 10);
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
    i18nCode.includes("Dinas Pariwisata Provinsi Bali") &&
      i18nCode.includes("BPS"),
    "i18n must provide honest Disparda and BPS reference"
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
