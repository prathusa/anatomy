// Lesion model: which muscles lose which spinal segments when a nerve, cord, trunk or root is cut.
//
// Each innervation edge carries the segments that reach the muscle through that nerve.
// A lesion at node N affects an innervation through nerve X when X is N or lies downstream of N.
//   X === N            -> every segment of that innervation is lost
//   N upstream of X    -> only segments that N actually carries are lost
// A muscle is "paralysed" when every innervation loses all its segments, "weakened" when some are lost.
// Organs work the same way ("denervated" / "partial"); the vagus carries the token 'CN X'.

import { structures, byId } from './data.js';

const ancestorCache = new Map();

// All nerves upstream of id (including id itself).
export function ancestors(id) {
  if (ancestorCache.has(id)) return ancestorCache.get(id);
  const out = new Set([id]);
  for (const p of byId[id]?.parents || []) for (const a of ancestors(p)) out.add(a);
  ancestorCache.set(id, out);
  return out;
}

export const lesionableNerves = structures.filter(s => s.type === 'nerve');

// Central nervous system (neuroanatomy). A `function` (e.g. voluntary movement of the leg) lists the
// chain that serves it in `via: [[id, side, 'partial'?]]`: tracts, nuclei, cranial nerves. `side` is
// where the deficit appears relative to a one-sided lesion of that link: 'ipsi', 'contra' or 'both';
// 'partial' marks links whose loss is compensated (bilateral cortical supply, parallel pathways).
// The function node itself is its cortical (or nuclear) representation, with side `self`.
// A lesion hits:
//   tract     -> the tract
//   brain     -> the structure, its parts (partOf, recursively) and every tract running `through` them
//   artery    -> its `territory` (each entry expanded as above) and that of its branches, except
//                branches with a `collateral` supply (e.g. the basilar artery from both vertebrals)
//   nerve     -> the nerve (plus the peripheral model above)
// A lesion of a midline structure (optic chiasm, basilar artery) gives deficits on both sides.
const functionNodes = structures.filter(s => s.type === 'function');
const kidsOf = {};
for (const s of structures) {
  if (s.partOf) (kidsOf[s.partOf] ||= []).push(s.id);
  for (const t of s.through || []) (kidsOf['through:' + t] ||= []).push(s.id);
  if (s.type === 'artery') for (const p of s.parents) (kidsOf['branch:' + p] ||= []).push(s.id);
}

export function lesionHits(id) {
  const out = new Set();
  const site = x => {
    if (out.has(x)) return;
    out.add(x);
    for (const k of kidsOf[x] || []) site(k);
    for (const t of kidsOf['through:' + x] || []) out.add(t);
  };
  const artery = (a, seen = new Set()) => {
    if (seen.has(a)) return;
    seen.add(a);
    for (const t of byId[a].territory || []) site(t);
    for (const b of kidsOf['branch:' + a] || []) if (!byId[b].collateral) artery(b, seen);
  };
  const s = byId[id];
  if (s.type === 'artery') artery(id);
  else if (s.type === 'brain' || s.type === 'function') site(id);
  else out.add(id);
  return out;
}

// Structures a lesion can be simulated on: every nerve, plus tracts, brain structures and arteries
// whose lesion interrupts at least one mapped function.
const servesCache = new Map();
export function isLesionable(id) {
  const s = byId[id];
  if (!s) return false;
  if (s.type === 'nerve') return true;
  if (!['tract', 'brain', 'artery'].includes(s.type)) return false;
  if (!servesCache.has(id)) servesCache.set(id, centralDeficits(id).functions.length > 0);
  return servesCache.get(id);
}

function centralDeficits(id) {
  const hits = lesionHits(id);
  const midline = !!byId[id].midline;
  const functions = [];
  for (const f of functionNodes) {
    const links = [[f.id, f.self, f.selfPartial ? 'partial' : undefined], ...f.via].filter(([x]) => hits.has(x));
    if (!links.length) continue;
    const sides = new Set(links.map(([, side]) => midline ? 'both' : side));
    functions.push({
      id: f.id,
      status: links.some(([, , p]) => p !== 'partial') ? 'lost' : 'partial',
      side: sides.size > 1 ? 'both' : [...sides][0],
      via: links.map(([x]) => x)
    });
  }
  // The rest of each interrupted pathway (tracts, nuclei, nerves), shown as cut.
  const chain = new Set();
  for (const d of functions) for (const [x] of byId[d.id].via) if (!hits.has(x)) chain.add(x);
  return { hits: [...hits], functions, chain: [...chain] };
}

export function computeLesion(nerveId) {
  const lesioned = byId[nerveId];
  if (!lesioned || !isLesionable(nerveId)) return null;
  const central = centralDeficits(nerveId);
  if (lesioned.type !== 'nerve') return { nerve: nerveId, muscles: [], organs: [], nerves: central.chain, ...central };
  const segN = new Set(lesioned.segs);

  const lostOf = inn => inn.n === nerveId ? [...inn.seg]
    : ancestors(inn.n).has(nerveId) ? inn.seg.filter(s => segN.has(s)) : [];

  const muscles = [];
  // Organs follow the same rule per innervation entry, and additionally per fibre kind
  // (sympathetic, parasympathetic, sensory): a kind is "lost" when all its entries are fully lost.
  const organs = [];
  for (const m of structures) {
    if (m.type !== 'muscle' && m.type !== 'organ') continue;
    if (m.type === 'organ' && !m.nerves.length) continue;
    let lostAny = false;
    let allLost = true;
    const details = m.nerves.map(inn => {
      const lost = lostOf(inn);
      if (lost.length) lostAny = true;
      if (lost.length < inn.seg.length) allLost = false;
      return { nerve: inn.n, seg: inn.seg, kind: inn.kind, lost };
    });
    if (!lostAny) continue;
    if (m.type === 'muscle') { muscles.push({ id: m.id, status: allLost ? 'paralysed' : 'weakened', details }); continue; }
    const kinds = {};
    for (const kind of new Set(details.map(d => d.kind))) {
      const of = details.filter(d => d.kind === kind);
      if (of.every(d => d.lost.length === d.seg.length)) kinds[kind] = 'lost';
      else if (of.some(d => d.lost.length)) kinds[kind] = 'reduced';
    }
    organs.push({ id: m.id, status: allLost ? 'denervated' : 'partial', kinds, details });
  }

  // Downstream nerves that carry at least one lesioned segment.
  const nerves = lesionableNerves
    .filter(n => n.id === nerveId || (ancestors(n.id).has(nerveId) && n.segs.some(s => segN.has(s))))
    .map(n => n.id);

  return { nerve: nerveId, muscles, organs, nerves: [...nerves, ...central.chain], hits: central.hits, functions: central.functions };
}
