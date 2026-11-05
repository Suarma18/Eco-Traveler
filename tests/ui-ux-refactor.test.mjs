import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();

test('UI/UX Refactor 1: GovernmentBar filters $0 regencies and adds excluded note', () => {
  const govBar = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/GovernmentBar.tsx'), 'utf8');
  assert.ok(
    govBar.includes('activeRegencies = orderedRegencies.filter'),
    'GovernmentBar must filter active regencies with spend > 0'
  );
  assert.ok(
    govBar.includes('tidak masuk dalam rute redistribusi ini'),
    'GovernmentBar must display notice for excluded regencies'
  );
  assert.ok(
    govBar.includes('text-xs text-stone-500 dark:text-stone-400 mt-4 italic'),
    'Notice must be styled with text-xs text-stone-500 mt-4 italic'
  );
});

test('UI/UX Refactor 2: TelemetryCards removes repetitive badges and places single neat disclaimer', () => {
  const telemetry = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/TelemetryCards.tsx'), 'utf8');
  assert.ok(
    !telemetry.includes('{t.assumptionBadge}'),
    'TelemetryCards must not repeat assumption badge inside individual metric cells'
  );
  assert.ok(
    telemetry.includes('text-xs text-stone-400 dark:text-stone-500 border-t border-stone-100'),
    'TelemetryCards must have single neat disclaimer at the bottom with border-t border-stone-100'
  );
});

test('UI/UX Refactor 3: Soft & Earthy Card styling and relaxed activity descriptions', () => {
  const timeline = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/ItineraryTimeline.tsx'), 'utf8');
  assert.ok(
    timeline.includes('border border-stone-200/80 dark:border-emerald-900/40 rounded-xl shadow-sm p-4'),
    'ItineraryTimeline cards must use soft earthy border-stone-200/80 rounded-xl shadow-sm p-4'
  );
  assert.ok(
    timeline.includes('text-sm text-stone-600 dark:text-stone-300 leading-relaxed'),
    'Activity descriptions must use relaxed text-sm text-stone-600 leading-relaxed font styling'
  );
});

