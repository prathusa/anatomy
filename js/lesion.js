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

export function computeLesion(nerveId) {
  const lesioned = byId[nerveId];
  if (!lesioned || lesioned.type !== 'nerve') return null;
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

  return { nerve: nerveId, muscles, organs, nerves };
}
