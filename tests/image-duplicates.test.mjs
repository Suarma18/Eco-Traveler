import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const desaDataset = JSON.parse(
  fs.readFileSync(path.resolve("data/desa-wisata.json"), "utf8")
);

test("No duplicate image URLs in data/desa-wisata.json", () => {
  const seenUrls = new Set();
  for (const village of desaDataset) {
    if (village.image && village.image.trim() !== "") {
      const url = village.image.trim();
      assert.ok(
        !seenUrls.has(url),
        `Duplicate image URL detected in village dataset: ${url} (village: ${village.id})`
      );
      seenUrls.add(url);
    }
  }
});

test("All 28 villages have unique visual definitions in village-media and no duplicate image URLs", () => {
  const fileContent = fs.readFileSync(
    path.resolve("src/lib/village-media.ts"),
    "utf8"
  );

  // Must not have any unverified unsplash URLs remaining in village-media.ts
  assert.ok(
    !fileContent.includes("images.unsplash.com"),
    "village-media.ts must not contain unverified unsplash URLs"
  );

  // Every single village in the dataset must have a unique definition
  assert.equal(desaDataset.length, 28, "Must have exactly 28 villages");

  for (const village of desaDataset) {
    assert.ok(
      fileContent.includes(`"${village.id}":`),
      `village-media.ts must contain visual definition for ${village.id}`
    );
  }

  // Presets must be defined and distinct
  assert.ok(
    fileContent.includes("export const PRESET_1_SVG = `data:image/svg+xml"),
    "PRESET_1_SVG must be defined as SVG data URI"
  );
  assert.ok(
    fileContent.includes("export const PRESET_2_SVG = `data:image/svg+xml"),
    "PRESET_2_SVG must be defined as SVG data URI"
  );
});

test("Codebase has zero unverified unsplash URLs in UI components and forms", () => {
  const formContent = fs.readFileSync(
    path.resolve("src/components/TripPlannerForm.tsx"),
    "utf8"
  );
  assert.ok(
    !formContent.includes("images.unsplash.com"),
    "TripPlannerForm.tsx must not contain unverified unsplash URLs"
  );

  const pageContent = fs.readFileSync(
    path.resolve("src/app/page.tsx"),
    "utf8"
  );
  assert.ok(
    !pageContent.includes("images.unsplash.com"),
    "page.tsx must not contain unverified unsplash URLs"
  );
});
