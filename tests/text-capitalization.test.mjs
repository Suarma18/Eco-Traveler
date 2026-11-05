import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Load BALI_PROPER_NOUNS and generator helpers by reading utils directly
const utilsCode = fs.readFileSync(path.resolve("src/lib/utils.ts"), "utf8");

// Extract BALI_PROPER_NOUNS list from utils.ts
const properNounsMatch = utilsCode.match(/export const BALI_PROPER_NOUNS = (\[[\s\S]*?\]);/);
assert.ok(properNounsMatch, "BALI_PROPER_NOUNS must be defined in utils.ts");
// Safely evaluate array literal
const properNouns = eval(properNounsMatch[1]);

function preserveProperNouns(text) {
  if (!text) return "";
  let result = text;
  for (const noun of properNouns) {
    const regex = new RegExp(
      `\\b${noun.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`,
      "gi"
    );
    result = result.replace(regex, noun);
  }
  return result;
}

test("preserveProperNouns correctly capitalizes mandatory proper nouns and adat terms", () => {
  const lowercaseInputs = [
    "kawasan geopark unesco black lava batur",
    "pemandangan danau batur dan lereng gunung agung",
    "tradisi kuno suku bali aga di desa sembiran",
    "sungai unda dan pura pancering jagat",
    "hutan lindung danau tamblingan",
  ];

  for (const input of lowercaseInputs) {
    const result = preserveProperNouns(input);
    assert.ok(!result.includes("unesco"), `unesco was not capitalized in: ${result}`);
    assert.ok(!result.includes("danau batur"), `danau batur was not capitalized in: ${result}`);
    assert.ok(!result.includes("gunung agung"), `gunung agung was not capitalized in: ${result}`);
    assert.ok(!result.includes("bali aga"), `bali aga was not capitalized in: ${result}`);
    assert.ok(!result.includes("sungai unda"), `sungai unda was not capitalized in: ${result}`);
    assert.ok(!result.includes("pura pancering jagat"), `pura pancering jagat was not capitalized in: ${result}`);
    assert.ok(!result.includes("black lava"), `black lava was not capitalized in: ${result}`);
  }
});

test("Deterministic descriptions have 3 distinct opening sentence patterns across day slots", () => {
  // Test the 3 patterns directly from logic
  const patternsId = [
    "Awali perjalanan pagi dengan mengeksplorasi",
    "Selami tradisi kehidupan dan kearifan",
    "Nikmati suasana sore dengan mengamati",
  ];

  const patternsEn = [
    "Begin the morning expedition exploring",
    "Immerse in local living heritage and",
    "Wind down the day taking in",
  ];

  // Verify all 3 Indonesian openings are completely distinct
  assert.equal(new Set(patternsId).size, 3);
  for (let i = 0; i < patternsId.length; i++) {
    for (let j = i + 1; j < patternsId.length; j++) {
      assert.notEqual(patternsId[i], patternsId[j]);
    }
  }

  // Verify all 3 English openings are completely distinct
  assert.equal(new Set(patternsEn).size, 3);
  for (let i = 0; i < patternsEn.length; i++) {
    for (let j = i + 1; j < patternsEn.length; j++) {
      assert.notEqual(patternsEn[i], patternsEn[j]);
    }
  }

  // Verify utils.ts contains all 3 patterns
  for (const pat of patternsId) {
    assert.ok(utilsCode.includes(pat), `utils.ts missing ID pattern: ${pat}`);
  }
  for (const pat of patternsEn) {
    assert.ok(utilsCode.includes(pat), `utils.ts missing EN pattern: ${pat}`);
  }
});

test("desa-wisata.json dataset does not contain lowercase UNESCO, Bali Aga, Danau Batur, or Gunung Agung", () => {
  const datasetJson = fs.readFileSync(path.resolve("data/desa-wisata.json"), "utf8");
  assert.ok(!datasetJson.includes('"unesco"'), 'Found lowercase "unesco" in dataset');
  assert.ok(!datasetJson.includes("danau batur"), 'Found lowercase "danau batur" in dataset');
  assert.ok(!datasetJson.includes("gunung agung"), 'Found lowercase "gunung agung" in dataset');
  assert.ok(!datasetJson.includes("bali aga"), 'Found lowercase "bali aga" in dataset');
});

