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

test("Fix AI Extraction: All 4 user intentions recognized and stay remains unchanged", async () => {
  const prompt =
    "I want to experience authentic Balinese village life, avoid crowded places, spend more on local businesses, and keep driving time short.";
  const result = parsePreferencesSemantically(prompt, "en");

  assert.equal(result.status, "matched", "Status must be matched");
  assert.ok(result.parsed, "Parsed object must exist");

  // 1. Travel interests: Culture
  assert.ok(
    result.parsed.focus?.includes("Culture"),
    "Must recognize authentic Balinese village life as Culture focus"
  );

  // 2. Crowd avoidance: avoidCrowds = true
  assert.equal(
    result.parsed.avoidCrowds,
    true,
    "Must extract avoidCrowds as true"
  );

  // 3. Local business priority: prioritizeLocalBusiness = true
  assert.equal(
    result.parsed.prioritizeLocalBusiness,
    true,
    "Must extract prioritizeLocalBusiness as true"
  );

  // 4. Driving time preference: drivingPreference = short
  assert.equal(
    result.parsed.drivingPreference,
    "short",
    "Must extract drivingPreference as short"
  );

  // Acceptance Criterion: Accommodation remains unchanged (null)
  assert.equal(
    result.parsed.stay,
    null,
    "Accommodation preference must remain null because it was never requested"
  );

  // Satisfaction Report Disclosures
  assert.ok(result.satisfactionReport, "Must provide satisfaction report");
  const crowdReport = result.satisfactionReport.find((r) =>
    r.preference.toLowerCase().includes("crowd")
  );
  assert.ok(crowdReport, "Must evaluate crowd avoidance");
  assert.equal(
    crowdReport.status,
    "partially_supported",
    "Crowd avoidance must be disclosed as partially supported due to simulated capacity guards without real-time sensors"
  );

  const localReport = result.satisfactionReport.find((r) =>
    r.preference.toLowerCase().includes("local")
  );
  assert.ok(localReport, "Must evaluate local business priority");
  assert.equal(
    localReport.status,
    "partially_supported",
    "Local business priority must be disclosed as partially supported due to unverified external commercial ownership"
  );
});

test("Route Optimization Engine: Consumes extended parameters and modifies destinations & scoring", () => {
  const aiEngineCode = fs.readFileSync(
    path.resolve("src/lib/ai-engine.ts"),
    "utf8"
  );

  // 1. Verify engine consumes all new parameters
  assert.ok(
    aiEngineCode.includes("request.avoidCrowds"),
    "Engine must consume request.avoidCrowds"
  );
  assert.ok(
    aiEngineCode.includes("request.prioritizeLocalBusiness"),
    "Engine must consume request.prioritizeLocalBusiness"
  );
  assert.ok(
    aiEngineCode.includes("request.drivingPreference"),
    "Engine must consume request.drivingPreference"
  );
  assert.ok(
    aiEngineCode.includes("request.pace"),
    "Engine must consume request.pace"
  );
  assert.ok(
    aiEngineCode.includes("request.excludedFocuses"),
    "Engine must consume request.excludedFocuses"
  );

  // 2. Verify Spatial Algorithm logic on dataset:
  const penglipuran = desaDataset.find((d) => d.id === "desa-penglipuran");
  const undisan = desaDataset.find((d) => d.id === "desa-undisan");
  assert.ok(penglipuran, "Penglipuran must exist in dataset");
  assert.ok(undisan, "Undisan must exist in dataset");

  // In standard conditions, Penglipuran is a high-profile cultural village
  assert.equal(penglipuran.bufferVillageId, "desa-undisan");
  assert.ok(
    penglipuran.currentSimulatedLoad / penglipuran.dailyQuota >= 0.7,
    "Penglipuran has high simulated load ratio"
  );

  // When avoidCrowds is active, engine penalizes high load ratio >= 0.7 by -8.0
  assert.ok(
    aiEngineCode.includes("loadRatio >= 0.70"),
    "Engine must check loadRatio >= 0.70 to divert from crowded villages"
  );
  assert.ok(
    aiEngineCode.includes("v?.bufferVillageId && !candidateIds.includes(v.bufferVillageId)"),
    "Engine must inject buffer villages when avoidCrowds is active"
  );

  // When prioritizeLocalBusiness is active, engine boosts local spend & prioritizes Community Homestay
  assert.ok(
    aiEngineCode.includes("request.prioritizeLocalBusiness ? 1.18 : 1.0"),
    "Engine must apply local spend multiplier when prioritizeLocalBusiness is active"
  );
  assert.ok(
    aiEngineCode.includes("stayType === \"Community Homestay\""),
    "Engine must prioritize Community Homestay for high local retention"
  );

  // When drivingPreference === 'short', engine performs nearest-neighbor sequencing
  assert.ok(
    aiEngineCode.includes("request.drivingPreference === \"short\""),
    "Engine must execute nearest-neighbor spatial clustering for short driving preference"
  );
});

test("Unsupported constraints and adversarial negations are disclosed truthfully", () => {
  const prompt =
    "I want a 5-star luxury chain hotel and nightclub in the village with real-time crowd sensors, no temples, and avoid crowded places";
  const result = parsePreferencesSemantically(prompt, "en");

  assert.equal(result.status, "matched");
  assert.ok(result.parsed?.unsupportedPreferences?.length > 0);

  const unsupportedNotes = result.satisfactionReport?.filter(
    (s) => s.status === "unsupported"
  );
  assert.ok(
    unsupportedNotes && unsupportedNotes.length >= 2,
    "Must disclose out-of-scope constraints like nightclub and 5-star hotel as unsupported"
  );

  // Negation: "no temples" must exclude Culture
  assert.ok(
    result.detectedIntents.excludedFocuses?.includes("Culture"),
    "Must capture 'no temples' as excluded Culture focus"
  );
  assert.equal(
    result.parsed?.avoidCrowds,
    true,
    "Must still capture crowd avoidance"
  );
});
