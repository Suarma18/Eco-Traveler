import test from "node:test";
import assert from "node:assert/strict";

// Helper logic mimicking schema validation from src/lib/anthropic.ts
function cleanJsonOutput(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return cleaned;
}

function validateNarrativeResponse(rawJson, expectedStopIds) {
  const parsed = JSON.parse(cleanJsonOutput(rawJson));
  if (!parsed || typeof parsed.summary !== "string" || !Array.isArray(parsed.stops)) {
    throw new Error("Missing summary or stops array");
  }

  const validIds = new Set(expectedStopIds);
  const validatedStops = parsed.stops.filter(
    (s) => s && typeof s.id === "string" && typeof s.narrative === "string" && validIds.has(s.id)
  );

  if (validatedStops.length === 0) {
    throw new Error("No matching stop IDs found in AI response");
  }

  return {
    summary: parsed.summary.trim(),
    stops: validatedStops,
  };
}

const ALLOWED_ARRIVALS = ["NgurahRaiAirport", "GilimanukPort"];
const ALLOWED_FOCUSES = ["Culture", "Nature", "Adventure", "Culinary", "Craft"];
const ALLOWED_STAYS = ["Backpacker", "Moderate", "Comfort"];

function validateParsedPreferences(rawJson) {
  const parsed = JSON.parse(cleanJsonOutput(rawJson));
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Not an object");
  }

  let days = null;
  if ([1, 2, 3, 4].includes(parsed.days)) days = parsed.days;

  let arrival = null;
  if (ALLOWED_ARRIVALS.includes(parsed.arrival)) arrival = parsed.arrival;

  let focus = null;
  if (Array.isArray(parsed.focus)) {
    const valid = parsed.focus.filter((f) => ALLOWED_FOCUSES.includes(f));
    if (valid.length > 0) focus = valid;
  }

  let stay = null;
  if (ALLOWED_STAYS.includes(parsed.stay)) stay = parsed.stay;

  return {
    days,
    arrival,
    focus,
    stay,
    explanation: typeof parsed.explanation === "string" ? parsed.explanation.trim() : "",
  };
}

test("cleanJsonOutput correctly strips markdown code fences", () => {
  const withMarkdown = "```json\n{\"summary\": \"Test route\", \"stops\": []}\n```";
  assert.equal(cleanJsonOutput(withMarkdown), '{"summary": "Test route", "stops": []}');

  const bare = '{"summary": "Plain"}';
  assert.equal(cleanJsonOutput(bare), '{"summary": "Plain"}');
});

test("validateNarrativeResponse strips foreign stop IDs and preserves valid ones", () => {
  const aiOutput = JSON.stringify({
    summary: "Rute berkeadilan ke Bali Timur dan Utara.",
    stops: [
      { id: "sidemen", narrative: "Desa Sidemen nan permai." },
      { id: "kuta-foreign-id", narrative: "Ini bukan stop terdaftar." },
      { id: "undisan", narrative: "Desa Undisan tenang." },
    ],
  });

  const validated = validateNarrativeResponse(aiOutput, ["sidemen", "undisan"]);
  assert.equal(validated.summary, "Rute berkeadilan ke Bali Timur dan Utara.");
  assert.equal(validated.stops.length, 2);
  assert.equal(validated.stops[0].id, "sidemen");
  assert.equal(validated.stops[1].id, "undisan");
});

test("validateNarrativeResponse throws if no valid IDs remain", () => {
  const aiOutput = JSON.stringify({
    summary: "Rute.",
    stops: [{ id: "unknown-place", narrative: "Invalid stop." }],
  });

  assert.throws(() => {
    validateNarrativeResponse(aiOutput, ["sidemen", "undisan"]);
  }, /No matching stop IDs/);
});

test("validateParsedPreferences rejects disallowed field values safely", () => {
  const aiOutput = JSON.stringify({
    days: 5, // invalid, max is 4
    arrival: "SingaporeChangi", // invalid arrival
    focus: ["Culture", "Nightlife", "Gambling"], // Nightlife and Gambling invalid
    stay: "LuxuryVilla", // invalid stay
    explanation: "Adjusted to cultural stops.",
  });

  const validated = validateParsedPreferences(aiOutput);
  assert.equal(validated.days, null); // rejected 5
  assert.equal(validated.arrival, null); // rejected invalid arrival
  assert.deepEqual(validated.focus, ["Culture"]); // only allowed focus kept
  assert.equal(validated.stay, null); // rejected invalid stay
  assert.equal(validated.explanation, "Adjusted to cultural stops.");
});

test("validateParsedPreferences accepts valid parameters", () => {
  const aiOutput = JSON.stringify({
    days: 4,
    arrival: "GilimanukPort",
    focus: ["Nature", "Culinary"],
    stay: "Backpacker",
    explanation: "Fokus alam dan kuliner dari Gilimanuk selama 4 hari.",
  });

  const validated = validateParsedPreferences(aiOutput);
  assert.equal(validated.days, 4);
  assert.equal(validated.arrival, "GilimanukPort");
  assert.deepEqual(validated.focus, ["Nature", "Culinary"]);
  assert.equal(validated.stay, "Backpacker");
  assert.equal(validated.explanation, "Fokus alam dan kuliner dari Gilimanuk selama 4 hari.");
});
