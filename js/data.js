// Region registry. Each body region lives in its own module under ./regions/ and is
// merged here, so the rest of the app sees one combined set of structures.
//
// To add a region: create ./regions/<name>.js exporting `structures`, `muscleGroups` and
// `meta` (start structure, plexus name, nerve list groups, camera), import it below, and
// set its entry in BODY_REGIONS to available. Structure ids must be unique across all
// regions; test/validate.mjs checks this.
import * as upperLimb from './regions/upper-limb.js';
import * as lowerLimb from './regions/lower-limb.js';

// The whole body, in the planned build order. Only `available` regions have data yet.
export const BODY_REGIONS = [
  { id: 'upper_limb', available: true, name: { en: 'Upper limb', de: 'Obere Extremität' } },
  { id: 'lower_limb', available: true, name: { en: 'Lower limb', de: 'Untere Extremität' } },
  { id: 'back', name: { en: 'Back and trunk wall', de: 'Rücken und Rumpfwand' } },
  { id: 'thorax', name: { en: 'Thorax', de: 'Thorax' } },
  { id: 'abdomen', name: { en: 'Abdomen', de: 'Abdomen' } },
  { id: 'pelvis', name: { en: 'Pelvis', de: 'Becken' } },
  { id: 'head_neck', name: { en: 'Head and neck', de: 'Kopf und Hals' } },
  { id: 'neuro', name: { en: 'Neuroanatomy', de: 'Neuroanatomie' } }
];
export const regionById = Object.fromEntries(BODY_REGIONS.map(r => [r.id, r]));

const modules = { upper_limb: upperLimb, lower_limb: lowerLimb };

export const structures = [];
for (const [region, mod] of Object.entries(modules)) {
  for (const s of mod.structures) structures.push({ ...s, region });
  Object.assign(regionById[region], mod.meta, { muscleGroups: mod.muscleGroups });
}
export const byId = Object.fromEntries(structures.map(s => [s.id, s]));

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
}
