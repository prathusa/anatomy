// Question generators. Each returns { ask, detail?, options: [{id, label}], answer, highlight? }.
import { structures, byId } from './data.js';
import { computeLesion } from './lesion.js';
import { UI } from './i18n.js';

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (arr, n, exclude = new Set()) => shuffle(arr.filter(x => !exclude.has(x.id))).slice(0, n);

// Questions stay within the current body region.
const PLEXUS_PARTS = new Set(['root', 'trunk', 'cord']);
const pools = {};
function poolsFor(region) {
  if (!pools[region]) {
    const all = structures.filter(s => s.region === region);
    const nerves = all.filter(s => s.type === 'nerve');
    pools[region] = {
      all,
      nerves,
      muscles: all.filter(s => s.type === 'muscle'),
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

export const QUIZ_TYPES = ['name', 'nerve', 'lesion', 'translate', 'function'];

export function makeQuestion(type, lang, region) {
  const t = UI[lang];
  const { all, nerves, muscles, branchNerves } = poolsFor(region);
  switch (type) {
    case 'name': {
      const pool = all.filter(s => s.type === 'muscle' || s.type === 'bone').concat(branchNerves);
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
        const paralysed = res.muscles.filter(x => x.status === 'paralysed').map(x => byId[x.id]);
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
