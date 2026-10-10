// Lesion model: which muscles lose which spinal segments when a nerve, cord, trunk or root is cut.
//
// Each innervation edge carries the segments that reach the muscle through that nerve.
// A lesion at node N affects an innervation through nerve X when X is N or lies downstream of N.
//   X === N            -> every segment of that innervation is lost
//   N upstream of X    -> only segments that N actually carries are lost
// A muscle is "paralysed" when every innervation loses all its segments, "weakened" when some are lost.

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

  const muscles = [];
  for (const m of structures) {
    if (m.type !== 'muscle') continue;
    let lostAny = false;
    let allLost = true;
    const details = m.nerves.map(inn => {
      let lost = [];
      if (inn.n === nerveId) lost = [...inn.seg];
      else if (ancestors(inn.n).has(nerveId)) lost = inn.seg.filter(s => segN.has(s));
      if (lost.length) lostAny = true;
      if (lost.length < inn.seg.length) allLost = false;
      return { nerve: inn.n, seg: inn.seg, lost };
    });
    if (lostAny) muscles.push({ id: m.id, status: allLost ? 'paralysed' : 'weakened', details });
  }

  // Downstream nerves that carry at least one lesioned segment.
  const nerves = lesionableNerves
    .filter(n => n.id === nerveId || (ancestors(n.id).has(nerveId) && n.segs.some(s => segN.has(s))))
    .map(n => n.id);

  return { nerve: nerveId, muscles, nerves };
}
