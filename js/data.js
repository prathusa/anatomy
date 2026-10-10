// Region registry. Each body region lives in its own module under ./regions/ and is
// merged here, so the rest of the app sees one combined set of structures.
//
// To add a region: create ./regions/<name>.js exporting `structures`, `muscleGroups` and
// `meta` (start structure, plexus name, nerve list groups, camera, optional `context`
// structures from other regions to show for orientation), import it below, and set its entry in
// BODY_REGIONS to available. Structure ids must be unique across all regions;
// test/validate.mjs checks this.
import * as upperLimb from './regions/upper-limb.js';
import * as lowerLimb from './regions/lower-limb.js';
import * as back from './regions/back.js';
import * as thorax from './regions/thorax.js';
import * as abdomen from './regions/abdomen.js';

// The whole body, in the planned build order. Only `available` regions have data yet.
export const BODY_REGIONS = [
  { id: 'upper_limb', available: true, name: { en: 'Upper limb', de: 'Obere Extremität' } },
  { id: 'lower_limb', available: true, name: { en: 'Lower limb', de: 'Untere Extremität' } },
  { id: 'back', available: true, name: { en: 'Back and trunk wall', de: 'Rücken und Rumpfwand' } },
  { id: 'thorax', available: true, name: { en: 'Thorax', de: 'Thorax' } },
  { id: 'abdomen', available: true, name: { en: 'Abdomen', de: 'Abdomen / Bauchsitus' } },
  { id: 'pelvis', name: { en: 'Pelvis', de: 'Becken' } },
  { id: 'head_neck', name: { en: 'Head and neck', de: 'Kopf und Hals' } },
  { id: 'neuro', name: { en: 'Neuroanatomy', de: 'Neuroanatomie' } }
];
export const regionById = Object.fromEntries(BODY_REGIONS.map(r => [r.id, r]));

const modules = { upper_limb: upperLimb, lower_limb: lowerLimb, back, thorax, abdomen };

export const structures = [];
for (const [region, mod] of Object.entries(modules)) {
  for (const s of mod.structures) structures.push({ ...s, region });
  Object.assign(regionById[region], mod.meta, { muscleGroups: mod.muscleGroups });
}
export const byId = Object.fromEntries(structures.map(s => [s.id, s]));

// "T1, T2, T3, T4" -> "T1–T4"; non-consecutive segments stay separate.
// Tokens that are not spinal segments (the vagus carries 'CN X') are appended unchanged.
const SEG_ORDER = [['C', 8], ['T', 12], ['L', 5], ['S', 5]].flatMap(([p, n]) => Array.from({ length: n }, (_, i) => p + (i + 1)));
export function formatSegs(all) {
  const list = all.filter(s => SEG_ORDER.includes(s));
  const other = all.filter(s => !SEG_ORDER.includes(s));
  const idx = list.map(s => SEG_ORDER.indexOf(s));
  const out = [];
  for (let i = 0; i < list.length;) {
    let j = i;
    while (j + 1 < list.length && idx[j + 1] === idx[j] + 1) j++;
    if (j - i >= 2) out.push(`${list[i]}–${list[j]}`); else out.push(...list.slice(i, j + 1));
    i = j + 1;
  }
  return [...out, ...other].join(', ');
}

// Build a flat edge list from the structure fields.
export const relations = [];
for (const s of structures) {
  if (s.type === 'nerve' || s.type === 'artery') {
    for (const p of s.parents) relations.push({ from: p, to: s.id, type: 'branch' });
  }
  if (s.type === 'muscle') {
    for (const inn of s.nerves) relations.push({ from: inn.n, to: s.id, type: 'innervates', seg: inn.seg, note: inn.note });
    for (const a of s.arteries) relations.push({ from: a, to: s.id, type: 'supplies' });
    for (const b of s.originBones) relations.push({ from: s.id, to: b, type: 'origin' });
    for (const b of s.insertionBones) relations.push({ from: s.id, to: b, type: 'insertion' });
  }
  if (s.type === 'organ') {
    for (const inn of s.nerves) relations.push({ from: inn.n, to: s.id, type: 'innervates', seg: inn.seg, kind: inn.kind });
    for (const a of s.arteries) relations.push({ from: a, to: s.id, type: 'supplies' });
    for (const v of s.veins) relations.push({ from: s.id, to: v, type: 'drains' });
    if (s.partOf) relations.push({ from: s.id, to: s.partOf, type: 'part' });
  }
  // A vein drains into its parents (another vein or a heart chamber).
  if (s.type === 'vein') for (const p of s.parents) relations.push({ from: s.id, to: p, type: 'drains' });
}
