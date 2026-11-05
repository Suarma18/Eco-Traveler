import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();

test('T9: Clean A4 vector print styles and no-print classes', () => {
  const globalsCss = fs.readFileSync(path.join(PROJECT_ROOT, 'src/app/globals.css'), 'utf8');
  assert.ok(globalsCss.includes('@media print'), 'globals.css must contain @media print');
  assert.ok(globalsCss.includes('size: A4 portrait'), 'Print style must specify A4 portrait');
  assert.ok(globalsCss.includes('.no-print'), 'globals.css must hide .no-print elements');
  assert.ok(globalsCss.includes('break-inside: avoid'), 'Print style must prevent page breaks inside cards');

  const page = fs.readFileSync(path.join(PROJECT_ROOT, 'src/app/page.tsx'), 'utf8');
  assert.ok(page.includes('printHeaderTitle'), 'PDF header in page.tsx must render printHeaderTitle');
  assert.ok(page.includes('no-print'), 'Interactive elements in page must have no-print class');

  const i18n = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/i18n.ts'), 'utf8');
  assert.ok(i18n.includes('ECO TRAVELER') && i18n.includes('EQUITABLE TRAVEL ITINERARY'), 'i18n must define equitable travel print title');
});

test('T10: Readability, contrast, and unclipped critical texts', () => {
  const briefing = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/CulturalBriefing.tsx'), 'utf8');
  assert.ok(!briefing.includes('line-clamp-2'), 'CulturalBriefing must not clamp sacred days or dress rules');
  assert.ok(!briefing.includes('truncate'), 'CulturalBriefing must not truncate sacred days or dress rules');

  const telemetry = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/TelemetryCards.tsx'), 'utf8');
  assert.ok(telemetry.includes('hidden sm:flex items-center h-2 w-20 rounded-full overflow-hidden'), 'TelemetryCards must render a mini stacked bar for regional distribution');
  assert.ok(telemetry.includes('text-xs text-slate-600 dark:text-slate-300 leading-normal'), 'LBI subtext must be at least text-xs and accessible');

  const timeline = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/ItineraryTimeline.tsx'), 'utf8');
  assert.ok(timeline.includes('t.activityAllocLabel'), 'Timeline must render activity allocation label');
  assert.ok(timeline.includes('text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block'), 'Activity allocation label must be text-xs font-semibold');

  const map = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/LeafletMap.tsx'), 'utf8');
  assert.ok(map.includes('Zona Padat Pariwisata Bali Selatan'), 'LeafletMap must provide tooltip for South Hotspot zone');
  assert.ok(map.includes('OpenStreetMap (OSM) / Carto'), 'LeafletMap must provide tooltip for OSM switch');

  const page = fs.readFileSync(path.join(PROJECT_ROOT, 'src/app/page.tsx'), 'utf8');
  assert.ok(page.includes('Subak Atelier:'), 'page.tsx must provide Subak Atelier tooltip');
});

test('T11: Customary Awig-Awig verification fields and labels', () => {
  const desaData = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'data/desa-wisata.json'), 'utf8'));
  for (const village of desaData) {
    assert.ok('adatVerifiedBy' in village, `Village ${village.id} must contain adatVerifiedBy`);
    assert.ok('adatVerifiedAt' in village, `Village ${village.id} must contain adatVerifiedAt`);
  }

  const i18n = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/i18n.ts'), 'utf8');
  assert.ok(i18n.includes('adatVerifiedLabel'), 'i18n must define adatVerifiedLabel');
  assert.ok(i18n.includes('adatPendingVerification'), 'i18n must define adatPendingVerification');
  assert.ok(i18n.includes('adatQuotaMore'), 'i18n must define adatQuotaMore');
  assert.ok(i18n.includes('adatQuotaLess'), 'i18n must define adatQuotaLess');

  const timeline = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/ItineraryTimeline.tsx'), 'utf8');
  assert.ok(timeline.includes('t.adatPendingVerification'), 'Timeline must show pending verification notice when unverified');
});

test('T12: Bilingual map loading placeholder and competition metadata', () => {
  const page = fs.readFileSync(path.join(PROJECT_ROOT, 'src/app/page.tsx'), 'utf8');
  assert.ok(page.includes('MapLoadingPlaceholder'), 'page.tsx must have MapLoadingPlaceholder');
  assert.ok(page.includes('Preparing Bali Spatial Atlas…'), 'Map loading placeholder must support English');
  assert.ok(page.includes('Menyiapkan Atlas Spasial Bali…'), 'Map loading placeholder must support Indonesian');

  const layout = fs.readFileSync(path.join(PROJECT_ROOT, 'src/app/layout.tsx'), 'utf8');
  assert.ok(layout.includes('Baligivation 2026'), 'Metadata must include Baligivation 2026');
  assert.ok(layout.includes('AI Web Innovation Challenge'), 'Metadata must include AI Web Innovation Challenge');
  assert.ok(layout.includes('TODO-HUMAN: Konfirmasi nama resmi'), 'Metadata must tag competition name verification with TODO-HUMAN');
  assert.ok(layout.includes('AI-assisted community-first travel route planner'), 'Metadata description must mention AI capabilities');
});
