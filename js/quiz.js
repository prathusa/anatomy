// Question generators. Each returns { ask, detail?, options: [{id, label}], answer, highlight? }.
import { structures, byId, regionById } from './data.js';
import { computeLesion } from './lesion.js';
import { UI } from './i18n.js';

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (arr, n, exclude = new Set()) => shuffle(arr.filter(x => !exclude.has(x.id))).slice(0, n);

// Questions stay within the current body region.
const PLEXUS_PARTS = new Set(['root', 'trunk', 'cord', 'spinal']);
const pools = {};
function poolsFor(region) {
  if (!pools[region]) {
    const all = structures.filter(s => s.region === region);
    const nerves = all.filter(s => s.type === 'nerve');
    pools[region] = {
      all,
      nerves,
      muscles: all.filter(s => s.type === 'muscle'),
      organs: all.filter(s => s.type === 'organ'),
      branchNerves: nerves.filter(n => !PLEXUS_PARTS.has(n.group))
    };
  }
  return pools[region];
}

const nameLabel = (s, lang) => `${s.name[lang]} <span class="la">${s.name.la}</span>`;

// Prefer distractors of the same type and, when possible, the same region.
function distractors(answer, pool, n = 3) {
  const same = pool.filter(s => s.id !== answer.id && s.group === answer.group);
  const rest = pool.filter(s => s.id !== answer.id && s.group !== answer.group);
  const a = shuffle(same), b = shuffle(rest);
  return [...a.slice(0, 2), ...b, ...a.slice(2)].slice(0, n);
}

export const QUIZ_TYPES = ['name', 'nerve', 'lesion', 'translate', 'function', 'supply'];

// Question types that make sense for a region: muscle questions need muscles, supply questions need organs.
export function quizTypesFor(region) {
  const { muscles, organs } = poolsFor(region);
  return QUIZ_TYPES.filter(q => ['nerve', 'lesion', 'function'].includes(q) ? muscles.length > 0
    : q === 'supply' ? organs.length > 0 : true);
}

// Everything up- or downstream of an artery or nerve, which would also count as "supplying" the organ.
function lineage(id) {
  const out = new Set([id]);
  const up = x => { for (const p of byId[x]?.parents || []) if (!out.has(p)) { out.add(p); up(p); } };
  const down = x => { for (const s of structures) if (s.parents?.includes(x) && !out.has(s.id)) { out.add(s.id); down(s.id); } };
  up(id); down(id);
  return out;
}

export function makeQuestion(type, lang, region) {
  const t = UI[lang];
  const { all, nerves, muscles, organs, branchNerves } = poolsFor(region);
  if (!quizTypesFor(region).includes(type)) type = quizTypesFor(region)[0];
  switch (type) {
    case 'supply': {
      for (let tries = 0; tries < 50; tries++) {
        const o = pick(organs);
        const askArtery = Math.random() < 0.5;
        const ctx = new Set(regionById[region]?.context || []);
        const local = id => byId[id]?.region === region || ctx.has(id);
        const all = askArtery ? o.arteries : o.nerves.map(x => x.n);
        // Answers come from the region (and its context); every listed supplier is excluded from the distractors.
        const listed = all.filter(local);
        if (!listed.length) continue;
        const kind = askArtery ? 'artery' : 'nerve';
        const exclude = new Set(all.flatMap(id => [...lineage(id)]));
        const candidates = structures.filter(s => s.type === kind && !exclude.has(s.id) && local(s.id));
        if (candidates.length < 3) continue;
        const ans = byId[pick(listed)];
        const opts = shuffle([ans, ...shuffle(candidates).slice(0, 3)]);
        return {
          ask: askArtery ? t.qSupplyArteryAsk(o.name[lang]) : t.qSupplyNerveAsk(o.name[lang]),
          options: opts.map(s => ({ id: s.id, label: nameLabel(s, lang) })), answer: ans.id, highlight: o.id
        };
      }
      return makeQuestion('name', lang, region);
    }
    case 'name': {
      const pool = all.filter(s => ['muscle', 'bone', 'organ', 'vein', 'artery'].includes(s.type)).concat(branchNerves);
      const ans = pick(pool);
      const opts = shuffle([ans, ...distractors(ans, pool.filter(s => s.type === ans.type))]);
      return { ask: t.qNameAsk, options: opts.map(s => ({ id: s.id, label: nameLabel(s, lang) })), answer: ans.id, highlight: ans.id };
    }
    case 'nerve': {
      const m = pick(muscles);
      const ans = byId[m.nerves[0].n];
      const own = new Set(m.nerves.map(x => x.n));
      const opts = shuffle([ans, ...sample(branchNerves, 3, own)]);
      return { ask: t.qNerveAsk(m.name[lang]), options: opts.map(s => ({ id: s.id, label: nameLabel(s, lang) })), answer: ans.id, highlight: m.id };
    }
    case 'lesion': {
      for (let tries = 0; tries < 50; tries++) {
        const n = pick(nerves);
        const res = computeLesion(n.id);
        const paralysed = res.muscles.filter(x => x.status === 'paralysed').map(x => byId[x.id]).filter(x => x.region === region);
        const affected = new Set(res.muscles.map(x => x.id));
        const spared = muscles.filter(x => !affected.has(x.id));
        if (!paralysed.length || spared.length < 3) continue;
        const ans = pick(paralysed);
        const opts = shuffle([ans, ...shuffle(spared).slice(0, 3)]);
        return { ask: t.qLesionAsk(n.name[lang]), options: opts.map(s => ({ id: s.id, label: nameLabel(s, lang) })), answer: ans.id, highlight: n.id, lesion: n.id };
      }
      return makeQuestion('nerve', lang, region);
    }
    case 'translate': {
      const ans = pick(all);
      const toGerman = Math.random() < 0.5;
      const from = toGerman ? 'en' : 'de', to = toGerman ? 'de' : 'en';
      const pool = all.filter(s => s.type === ans.type);
      const opts = shuffle([ans, ...distractors(ans, pool)]);
      return {
        ask: toGerman ? t.qTranslateAskDe(ans.name[from]) : t.qTranslateAskEn(ans.name[from]),
        // No Latin hint here: it is often near-identical to the answer.
        options: opts.map(s => ({ id: s.id, label: s.name[to] })),
        answer: ans.id, highlight: ans.id
      };
    }
    case 'function':
    default: {
      const ans = pick(muscles);
      const detail = ans.action[lang];
      const opts = shuffle([ans, ...distractors(ans, muscles)]);
      return { ask: t.qFunctionAsk, detail, options: opts.map(s => ({ id: s.id, label: nameLabel(s, lang) })), answer: ans.id };
    }
  }
}
