import { structures, byId, relations, BODY_REGIONS, regionById, formatSegs } from './data.js';
import { UI, sideText } from './i18n.js';
import { computeLesion, ancestors, isLesionable, lesionHits } from './lesion.js';
import { makeQuestion, quizTypesFor } from './quiz.js';
import { Viewer } from './viewer3d.js';
import { Graph } from './graph.js';

const $ = sel => document.querySelector(sel);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const state = {
  lang: localStorage.getItem('lang') || ((navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en'),
  mode: 'explore',
  region: null,
  selected: null,
  lesion: null,
  graphMode: 'neighbourhood',
  search: '',
  quiz: { type: 'name', q: null, picked: null, score: 0, total: 0 }
};

const other = () => (state.lang === 'en' ? 'de' : 'en');
const t = () => UI[state.lang];
const region = () => regionById[state.region];
const firstRegion = BODY_REGIONS.find(r => r.available).id;
const link = id => {
  const s = byId[id];
  return `<a href="#" data-id="${id}">${esc(s.name[state.lang])}</a>`;
};
const segs = list => `<span class="seg">${formatSegs(list)}</span>`;
// Structures of the current region, plus the other regions' bones it shows for orientation.
const inRegion = id => byId[id]?.region === state.region || !!region()?.context?.includes(id);
const regionHas = type => structures.some(s => s.type === type && inRegion(s.id));
const kindLabel = kind => t().kinds[kind] || kind;

// ------------------------------------------------------------------ 3D + graph
const viewer = new Viewer($('#viewer'), {
  onPick: id => {
    if (!id) return;
    if (state.mode === 'lesion') { if (isLesionable(id)) setLesion(id); else select(id, { keepMode: true }); }
    else if (state.mode === 'explore') select(id);
  },
  onHover: (id, e) => {
    const tip = $('#tooltip');
    if (!id || state.mode === 'quiz') { tip.hidden = true; return; }
    const s = byId[id];
    const rect = $('#stage').getBoundingClientRect();
    tip.innerHTML = `${esc(s.name[state.lang])}<br><span class="la">${esc(s.name.la)}</span>`;
    tip.style.left = `${e.clientX - rect.left + 14}px`;
    tip.style.top = `${e.clientY - rect.top + 14}px`;
    tip.hidden = false;
  }
});

const graph = new Graph($('#graph'), {
  onPick: id => {
    if (state.mode === 'lesion' && isLesionable(id)) setLesion(id);
    else if (state.mode !== 'quiz') select(id, { keepGraph: true });
  }
});
graph.lang = state.lang;

// ------------------------------------------------------------------ static text
function applyStaticText() {
  document.documentElement.lang = state.lang;
  document.body.dataset.mode = state.mode;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t()[el.dataset.i18n]; });
  $('#search').placeholder = t().search;
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === state.lang));
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === state.mode));
  document.querySelectorAll('[data-graph]').forEach(b => b.classList.toggle('active', b.dataset.graph === state.graphMode));
  if (state.region) {
    $('[data-graph="plexus"]').textContent = region().plexus[state.lang];
    if (region().plexusTargets) $('[data-graph="plexusMuscles"]').textContent = region().plexusTargets[state.lang];
    // Muscle, organ, vein and CNS toggles only where the region has them.
    for (const type of ['muscle', 'organ', 'vein', 'brain', 'tract', 'function']) $(`[data-layer="${type}"]`).closest('label').hidden = !regionHas(type);
  }
  renderRegions();
  renderLegend();
}

// Regions without data are listed as "coming soon" so the roadmap is visible.
function renderRegions() {
  $('#region').innerHTML = BODY_REGIONS.map(r =>
    `<option value="${r.id}" ${r.available ? '' : 'disabled'}>${esc(r.name[state.lang])}${r.available ? '' : ` (${esc(t().comingSoon)})`}</option>`
  ).join('');
  if (state.region) $('#region').value = state.region;
}

function renderLegend() {
  const L = t();
  const item = (cls, label) => `<span><span class="dot ${cls}"></span>${esc(label)}</span>`;
  const organs = state.region && regionHas('organ');
  const cns = state.region && regionHas('function');
  $('#legend').innerHTML = state.mode === 'lesion'
    ? item('lesion', L.lesion) + (cns
      ? item('paralysed', L.fnLost) + item('weakened', L.fnPartial)
      : organs
        ? item('paralysed', `${L.paralysed} / ${L.denervated}`) + item('weakened', `${L.weakened} / ${L.partial}`)
        : item('paralysed', L.paralysed) + item('weakened', L.weakened)) + item('spared', L.unaffected)
    : ['organ', 'brain', 'tract', 'function', 'bone', 'muscle', 'nerve', 'artery', 'vein']
      .filter(k => (!cns && ['bone', 'muscle', 'nerve', 'artery'].includes(k)) || (state.region && regionHas(k)))
      .map(k => item(k, L[k])).join('');
}

// ------------------------------------------------------------------ list
function matches(s) {
  if (!state.search) return true;
  const q = state.search.toLowerCase();
  return [s.name.en, s.name.de, s.name.la].some(n => n.toLowerCase().includes(q));
}

// Groups for one region. While searching, the other available regions are listed too,
// with the region name in their headers, so a search finds everything.
function regionGroups(r, prefix) {
  const L = t(), groups = [];
  const of = (type, g) => structures.filter(s => s.region === r.id && s.type === type && (g === undefined || s.group === g));
  // Context structures from other regions join the group of their type (not while searching:
  // there they are listed under their own region).
  const ctxOf = type => (prefix ? [] : r.context || []).map(id => byId[id]).filter(s => s.type === type);
  for (const [g, label] of r.nerveGroups) {
    groups.push([label[state.lang], structures.filter(s => s.region === r.id && s.type === 'nerve' && s.group === g)]);
  }
  groups.push([`${L.nerve}: ${L.fromOtherRegions}`, ctxOf('nerve')]);
  // Neuroanatomy: brain structures, tracts and functions. In lesion mode only what interrupts a
  // mapped function is listed (plus the arteries), ahead of the cranial and spinal nerves.
  const cns = [];
  const keep = list => state.mode === 'lesion' ? list.filter(s => isLesionable(s.id)) : list;
  for (const [key, label] of r.brainGroups || []) cns.push([label[state.lang], keep(of('brain', key))]);
  for (const [key, label] of r.tractGroups || []) cns.push([`${L.tract}: ${label[state.lang]}`, keep(of('tract', key))]);
  if (state.mode === 'lesion' && r.functionGroups) {
    cns.push([L.artery, keep([...of('artery'), ...ctxOf('artery')])]);
    groups.unshift(...cns);
  }
  if (state.mode !== 'lesion') {
    const nerveCount = groups.length;
    for (const [key, label] of r.organGroups || []) groups.push([`${L.organ}: ${label[state.lang]}`, of('organ', key)]);
    groups.push(...cns);
    for (const [key, label] of r.functionGroups || []) groups.push([`${L.function}: ${label[state.lang]}`, of('function', key)]);
    for (const [key, label] of Object.entries(r.muscleGroups)) groups.push([`${L.muscle}: ${label[state.lang]}`, of('muscle', key)]);
    groups.push([`${L.muscle}: ${L.fromOtherRegions}`, ctxOf('muscle')]);
    groups.push([L.bone, [...of('bone'), ...ctxOf('bone')]]);
    groups.push([L.artery, [...of('artery'), ...ctxOf('artery')]]);
    groups.push([L.vein, of('vein')]);
    // organs, muscles and bones first in explore mode
    groups.push(...groups.splice(0, nerveCount));
  }
  return prefix ? groups.map(([title, items]) => [`${r.name[state.lang]} · ${title}`, items]) : groups;
}

function renderList() {
  const groups = regionGroups(region(), false);
  if (state.search) {
    for (const r of BODY_REGIONS) if (r.available && r.id !== state.region) groups.push(...regionGroups(r, true));
  }
  const active = state.mode === 'lesion' ? state.lesion : state.selected;
  $('#list').innerHTML = groups.map(([title, items]) => {
    const visible = items.filter(matches);
    if (!visible.length) return '';
    return `<h3>${esc(title)}</h3>` + visible.map(s =>
      `<button data-id="${s.id}" class="${s.id === active ? 'active' : ''}">${esc(s.name[state.lang])}<small>${esc(s.name[other()])} · <i>${esc(s.name.la)}</i></small></button>`
    ).join('');
  }).join('');
}

// ------------------------------------------------------------------ explore card
function relatedIds(id) {
  const out = new Set();
  for (const r of relations) {
    if (r.from === id) out.add(r.to);
    if (r.to === id) out.add(r.from);
  }
  const s = byId[id];
  if (['nerve', 'artery', 'vein', 'tract'].includes(s.type)) for (const a of ancestors(id)) out.add(a);
  if (s.type === 'muscle' || s.type === 'organ') for (const inn of s.nerves) for (const a of ancestors(inn.n)) out.add(a);
  if (s.type === 'organ') for (const art of s.arteries) for (const a of ancestors(art)) out.add(a);
  out.delete(id);
  return [...out];
}

// Arteries whose own territory (not that of their branches) covers a CNS structure.
const territoryCache = new Map();
function suppliedBy(id) {
  return structures.filter(a => a.type === 'artery' && a.territory?.length).filter(a => {
    if (!territoryCache.has(a.id)) territoryCache.set(a.id, new Set(a.territory.flatMap(x => [...lesionHits(x)])));
    return territoryCache.get(a.id).has(id);
  }).map(a => a.id);
}

// Rows for brain structures, tracts and functions: the pathway links and the side of the deficit.
function cnsRows(s) {
  const L = t();
  const row = (label, ids) => ids.length ? `<dt>${label}</dt><dd>${ids.map(link).join(', ')}</dd>` : '';
  const sideItem = (id, f, side, partial) =>
    `<li>${link(id)} <span class="note">(${esc(sideText(L, f, side))}${partial ? `, ${esc(L.partly)}` : ''})</span></li>`;
  const sideList = (label, items) => items.length ? `<dt>${label}</dt><dd><ul>${items.join('')}</ul></dd>` : '';
  const from = type => relations.filter(r => r.type === type && r.to === s.id).map(r => r.from);
  if (s.type === 'function') {
    return sideList(L.pathway, [...(s.partOf ? [[s.partOf, s.self, s.selfPartial]] : []), ...s.via].map(([x, side, p]) => sideItem(x, s, side, p)))
      + row(L.suppliedBy, suppliedBy(s.id));
  }
  // Functions served: pathway links, and the cortical or nuclear representation for brain structures.
  const serves = [
    ...structures.filter(f => f.type === 'function' && f.partOf === s.id).map(f => sideItem(f.id, f, f.self, f.selfPartial)),
    ...relations.filter(r => r.type === 'serves' && r.from === s.id).map(r => sideItem(r.to, byId[r.to], r.side, r.partial))
  ];
  if (s.type === 'tract') {
    return row(L.branchOf, s.parents)
      + row(L.continuesAs, structures.filter(x => x.type === 'tract' && x.parents.includes(s.id)).map(x => x.id))
      + row(L.runsThrough, s.through)
      + row(L.suppliedBy, suppliedBy(s.id))
      + sideList(L.serves, serves);
  }
  return (s.partOf ? row(L.partOf, [s.partOf]) : '')
    + row(L.parts, structures.filter(x => x.type === 'brain' && x.partOf === s.id).map(x => x.id))
    + row(L.carries, from('passes'))
    + row(L.fibresTo, s.nerves || [])
    + row(L.drainsInto, s.drains || [])
    + row(L.tributaries, from('drains'))
    + row(L.suppliedBy, suppliedBy(s.id))
    + sideList(L.serves, serves);
}

function renderExploreCard() {
  const L = t(), lang = state.lang;
  const s = byId[state.selected];
  if (!s) { $('#card').innerHTML = `<p>${esc(L.pickSomething)}</p>`; return; }
  let body = '';
  const header = `<span class="badge ${s.type}">${esc(L.types[s.type])}</span>
    <h2>${esc(s.name[lang])}</h2>
    <div class="names">${esc(s.name[other()])} · <span class="la">${esc(s.name.la)}</span></div>`;

  if (s.type === 'muscle') {
    body += `<dl>
      <dt>${L.origin}</dt><dd>${esc(s.origin[lang])}</dd>
      <dt>${L.insertion}</dt><dd>${esc(s.insertion[lang])}</dd>
      <dt>${L.action}</dt><dd>${esc(s.action[lang])}</dd>
      <dt>${L.innervation}</dt><dd><ul>${s.nerves.map(inn => `<li>${link(inn.n)} ${segs(inn.seg)}${inn.note ? ` <span class="note">(${esc(inn.note[lang])})</span>` : ''}</li>`).join('')}</ul></dd>
      <dt>${L.supply}</dt><dd>${s.arteries.map(link).join(', ')}</dd>
    </dl>`;
  } else if (s.type === 'organ') {
    // Innervation grouped by fibre kind: sympathetic, parasympathetic, sensory.
    const kinds = [...new Set(s.nerves.map(inn => inn.kind))];
    const parts = structures.filter(x => x.partOf === s.id);
    const receives = relations.filter(r => r.type === 'drains' && r.to === s.id).map(r => r.from);
    body += `<dl>
      <dt>${L.organFunction}</dt><dd>${esc(s.info[lang])}</dd>
      ${s.partOf ? `<dt>${L.partOf}</dt><dd>${link(s.partOf)}</dd>` : ''}
      ${parts.length ? `<dt>${L.parts}</dt><dd>${parts.map(p => link(p.id)).join(', ')}</dd>` : ''}
      ${kinds.length ? `<dt>${L.innervation}</dt><dd><ul>${kinds.map(k => `<li><b>${esc(kindLabel(k))}:</b> ${s.nerves.filter(inn => inn.kind === k).map(inn => `${link(inn.n)} ${segs(inn.seg)}`).join('; ')}</li>`).join('')}</ul></dd>` : ''}
      ${s.arteries.length ? `<dt>${L.supply}</dt><dd>${s.arteries.map(link).join(', ')}</dd>` : ''}
      ${s.veins.length ? `<dt>${L.drainsInto}</dt><dd>${s.veins.map(link).join(', ')}</dd>` : ''}
      ${receives.length ? `<dt>${L.tributaries}</dt><dd>${receives.map(link).join(', ')}</dd>` : ''}
    </dl>`;
    if (s.lesion) body += `<div class="clinical"><strong>${L.clinical}:</strong> ${esc(s.lesion[lang])}</div>`;
  } else if (s.type === 'vein') {
    const receives = relations.filter(r => r.type === 'drains' && r.to === s.id).map(r => r.from);
    body += `<p>${esc(s.info[lang])}</p><dl>
      <dt>${L.drainsInto}</dt><dd>${s.parents.map(link).join(', ')}</dd>
      ${receives.length ? `<dt>${L.tributaries}</dt><dd>${receives.map(link).join(', ')}</dd>` : ''}
    </dl>`;
    if (s.lesion) body += `<div class="clinical"><strong>${L.clinical}:</strong> ${esc(s.lesion[lang])}</div>`;
  } else if (s.type === 'brain' || s.type === 'tract' || s.type === 'function') {
    body += `<p>${esc(s.info[lang])}</p><dl>${cnsRows(s)}</dl>`;
    if (s.lesion) body += `<div class="clinical"><strong>${L.ifInjured}:</strong> ${esc(s.lesion[lang])}</div>`;
  } else {
    body += `<p>${esc(s.info[lang])}</p><dl>`;
    if (s.type === 'nerve' || s.type === 'artery') {
      if (s.type === 'nerve') body += `<dt>${L.segments}</dt><dd>${segs(s.segs)}</dd>`;
      if (s.parents.length) body += `<dt>${L.branchOf}</dt><dd>${s.parents.map(link).join(', ')}</dd>`;
      const kids = structures.filter(x => x.type === s.type && x.parents?.includes(s.id));
      if (kids.length) body += `<dt>${L.branches}</dt><dd>${kids.map(k => link(k.id)).join(', ')}</dd>`;
    }
    if (s.type === 'nerve') {
      const inn = relations.filter(r => r.type === 'innervates' && r.from === s.id);
      if (inn.length) body += `<dt>${L.innervates}</dt><dd><ul>${inn.map(r => `<li>${link(r.to)} ${r.kind ? `<span class="note">(${esc(kindLabel(r.kind))})</span> ` : ''}${segs(r.seg)}</li>`).join('')}</ul></dd>`;
    }
    if (s.type === 'artery') {
      const sup = relations.filter(r => r.type === 'supplies' && r.from === s.id);
      if (sup.length) body += `<dt>${L.supplies}</dt><dd>${sup.map(r => link(r.to)).join(', ')}</dd>`;
    }
    if (s.type === 'bone') {
      const att = relations.filter(r => (r.type === 'origin' || r.type === 'insertion') && r.to === s.id);
      if (att.length) body += `<dt>${L.attached}</dt><dd><ul>${att.map(r => `<li>${link(r.from)} <span class="note">(${r.type === 'origin' ? L.originOf : L.insertionOf})</span></li>`).join('')}</ul></dd>`;
    }
    body += '</dl>';
    if (s.lesion) body += `<div class="clinical"><strong>${L.ifInjured}:</strong> ${esc(s.lesion[lang])}</div>`;
  }

  const actions = [`<button data-action="focus">${L.focus}</button>`];
  if (isLesionable(s.id)) actions.push(`<button class="primary" data-action="simulate">${L.lesion} ✂</button>`);
  $('#card').innerHTML = header + body + `<div class="actions">${actions.join('')}</div>`;
}

// ------------------------------------------------------------------ lesion card
function renderLesionCard() {
  const L = t(), lang = state.lang;
  const organRegion = regionHas('organ') && !regionHas('muscle');
  const cnsRegion = regionHas('function');
  if (!state.lesion) { $('#card').innerHTML = `<p>${esc(cnsRegion ? L.lesionIntroCNS : organRegion ? L.lesionIntroOrgans : L.lesionIntro)}</p>`; return; }
  const n = byId[state.lesion];
  const res = computeLesion(n.id);
  const via = details => details.filter(d => d.lost.length).map(d => `${L.via} ${esc(byId[d.nerve].name[lang])}: ${segs(d.lost)} ${L.lost}`).join('; ');
  const list = status => res.muscles.filter(m => m.status === status).map(m =>
    `<li><a href="#" data-id="${m.id}" class="${status}">${esc(byId[m.id].name[lang])}</a> <span class="note">${via(m.details)}</span></li>`
  ).join('');
  // Organs: which fibre kinds are lost or reduced, and through which nerve.
  const organList = status => res.organs.filter(o => o.status === status).map(o => {
    const kinds = Object.entries(o.kinds).map(([k, v]) => `${esc(kindLabel(k))} ${v === 'lost' ? L.lost : L.reduced}`).join(', ');
    return `<li><a href="#" data-id="${o.id}" class="${status === 'denervated' ? 'paralysed' : 'weakened'}">${esc(byId[o.id].name[lang])}</a> <b>${kinds}</b> <span class="note">${via(o.details)}</span></li>`;
  }).join('');
  // Central functions: side relative to the lesion, and the links of the pathway that were hit.
  const fnList = status => res.functions.filter(f => f.status === status).map(f => {
    const fn = byId[f.id];
    const hit = f.via.map(x => esc((x === f.id ? byId[fn.partOf] || fn : byId[x]).name[lang])).join(', ');
    return `<li><a href="#" data-id="${f.id}" class="${status === 'lost' ? 'paralysed' : 'weakened'}">${esc(fn.name[lang])}</a> <b>${esc(sideText(L, fn, f.side))}</b> <span class="note">${L.via} ${hit}</span></li>`;
  }).join('');
  const paralysed = list('paralysed'), weakened = list('weakened');
  const denervated = organList('denervated'), partial = organList('partial');
  const fnLost = fnList('lost'), fnPartial = fnList('partial');
  const none = cnsRegion ? L.noFunctions : organRegion ? L.noOrgans : L.noMuscles;
  $('#card').innerHTML = `<span class="badge ${n.type}">${esc(L.lesion)} ✂</span>
    <h2>${esc(n.name[lang])}</h2>
    <div class="names">${esc(n.name[other()])} · <span class="la">${esc(n.name.la)}</span>${n.segs ? ` · ${segs(n.segs)}` : ''}</div>
    ${n.lesion ? `<div class="clinical"><strong>${L.clinical}:</strong> ${esc(n.lesion[lang])}</div>` : `<p>${esc(n.info[lang])}</p>`}
    <dl class="status-list">
      ${fnLost ? `<dt>${L.lostFunctions}</dt><dd><ul>${fnLost}</ul></dd>` : ''}
      ${fnPartial ? `<dt>${L.partialFunctions}</dt><dd><ul>${fnPartial}</ul></dd>` : ''}
      ${paralysed ? `<dt>${L.paralysed}</dt><dd><ul>${paralysed}</ul></dd>` : ''}
      ${weakened ? `<dt>${L.weakened}</dt><dd><ul>${weakened}</ul></dd>` : ''}
      ${denervated ? `<dt>${L.denervated}</dt><dd><ul>${denervated}</ul></dd>` : ''}
      ${partial ? `<dt>${L.partial}</dt><dd><ul>${partial}</ul></dd>` : ''}
      ${!paralysed && !weakened && !denervated && !partial && !fnLost && !fnPartial ? `<p>${none}</p>` : ''}
    </dl>
    ${fnLost || fnPartial ? `<p class="note">${esc(L.sideNote)}</p>` : ''}`;
}

// ------------------------------------------------------------------ quiz card
function newQuestion() {
  if (!quizTypesFor(state.region).includes(state.quiz.type)) state.quiz.type = 'name';
  state.quiz.q = makeQuestion(state.quiz.type, state.lang, state.region);
  state.quiz.picked = null;
  const q = state.quiz.q;
  // Lesion questions show only the cut nerve; the paralysis pattern is revealed after answering.
  viewer.setLesion(null);
  viewer.setQuizTarget(q.highlight || null);
  if (q.lesion) viewer.resetView();
  else if (q.highlight) viewer.focus(q.highlight);
  renderQuizCard();
}

function renderQuizCard() {
  const L = t(), z = state.quiz, q = z.q;
  const labels = { name: L.qName, nerve: L.qNerve, lesion: L.qLesion, translate: L.qTranslate, function: L.qFunction, supply: L.qSupply, cns: L.qCns };
  const types = quizTypesFor(state.region).map(k => `<button data-quiz="${k}" class="${k === z.type ? 'active' : ''}">${esc(labels[k])}</button>`).join('');
  const answered = z.picked !== null;
  const opts = q.options.map(o => {
    let cls = '';
    if (answered && o.id === q.answer) cls = 'right';
    else if (answered && o.id === z.picked) cls = 'wrongpick';
    return `<button data-answer="${o.id}" class="${cls}" ${answered ? 'disabled' : ''}>${o.label}</button>`;
  }).join('');
  let feedback = '';
  if (answered) {
    const right = z.picked === q.answer;
    const ans = byId[q.answer];
    feedback = `<div class="quiz-feedback">${right ? '✅ ' + L.correct : `❌ ${L.wrong} ${esc(ans.name[state.lang])}`}</div>
      <p class="note">${esc(ans.name[other()])} · <i>${esc(ans.name.la)}</i></p>
      <div class="actions"><button class="primary" data-action="next">${L.next} →</button><a href="#" data-id="${ans.id}" data-explore="1">${L.explore}: ${esc(ans.name[state.lang])}</a></div>`;
  }
  $('#card').innerHTML = `<span class="score">${L.score}: ${z.score} / ${z.total}</span>
    <p class="note">${esc(L.quizIntro)}</p>
    <div class="quiz-types">${types}</div>
    <p class="quiz-q">${q.ask}</p>
    ${q.detail ? `<div class="quiz-detail">${esc(q.detail)}</div>` : ''}
    <div class="quiz-opts">${opts}</div>${feedback}`;
}

// ------------------------------------------------------------------ actions
// Switch the body region. Keeps the selection and lesion only if they belong to it.
function setRegion(id) {
  if (!regionById[id]?.available || id === state.region) return;
  state.region = id;
  viewer.setRegion(id);
  graph.setRegion(id);
  if (!inRegion(state.selected)) state.selected = region().start;
  if (!inRegion(state.lesion)) state.lesion = null;
}

function select(id, { keepGraph = false, keepMode = false } = {}) {
  if (id && !inRegion(id)) setRegion(byId[id].region);
  if (!keepMode && state.mode !== 'explore') setMode('explore', false);
  state.selected = id;
  viewer.setSelection(id, id ? relatedIds(id) : []);
  if (!keepGraph || state.graphMode === 'neighbourhood') { state.graphMode = 'neighbourhood'; graph.showNeighbourhood(id); }
  if (state.mode === 'explore') renderExploreCard();
  renderList();
  applyStaticText();
  writeHash();
}

function setLesion(id) {
  if (id && !inRegion(id)) setRegion(byId[id].region);
  state.lesion = id;
  const res = id ? computeLesion(id) : null;
  viewer.setSelection(null);
  viewer.setLesion(res);
  graph.setLesion(res);
  if (state.graphMode === 'neighbourhood') { state.graphMode = 'plexusMuscles'; graph.showPlexus(true); }
  renderLesionCard();
  renderList();
  applyStaticText();
  writeHash();
}

function setMode(mode, rerender = true) {
  state.mode = mode;
  viewer.setQuizTarget(null);
  viewer.setLesion(null);
  graph.setLesion(null);
  if (mode === 'explore') {
    viewer.setSelection(state.selected, state.selected ? relatedIds(state.selected) : []);
    state.graphMode = 'neighbourhood';
    graph.showNeighbourhood(state.selected);
    if (rerender) renderExploreCard();
  } else if (mode === 'lesion') {
    state.graphMode = 'plexusMuscles';
    graph.showPlexus(true);
    if (state.lesion) setLesion(state.lesion); else { viewer.setSelection(null); renderLesionCard(); }
  } else if (mode === 'quiz') {
    viewer.setSelection(null);
    state.graphMode = 'plexus';
    graph.showPlexus(false);
    newQuestion();
  }
  renderList();
  applyStaticText();
  writeHash();
}

function setGraphMode(m) {
  state.graphMode = m;
  if (m === 'neighbourhood') graph.showNeighbourhood(state.selected || state.lesion);
  else graph.showPlexus(m === 'plexusMuscles');
  applyStaticText();
}

function setLang(lang) {
  state.lang = lang;
  localStorage.setItem('lang', lang);
  graph.setLanguage(lang);
  applyStaticText();
  renderList();
  if (state.mode === 'explore') renderExploreCard();
  else if (state.mode === 'lesion') renderLesionCard();
  else newQuestion();
}

// ------------------------------------------------------------------ URL hash
// #explore/<id>, #lesion/<id>, or #<mode>/<region> when nothing is picked (e.g. #quiz/lower_limb).
function writeHash() {
  const id = state.mode === 'explore' ? state.selected : state.mode === 'lesion' ? state.lesion : null;
  const h = '#' + state.mode + '/' + (id || state.region);
  if (location.hash !== h) history.replaceState(null, '', h);
}

function readHash() {
  const [mode, key] = location.hash.slice(1).split('/');
  const id = byId[key] ? key : null;
  setRegion(id ? (inRegion(id) ? state.region : byId[id].region) : regionById[key]?.available ? key : state.region || firstRegion);
  if (mode === 'lesion') { setMode('lesion'); if (id) setLesion(id); }
  else if (mode === 'quiz') setMode('quiz');
  else { setMode('explore'); select(id || state.selected || region().start); }
}

// ------------------------------------------------------------------ events
document.addEventListener('click', e => {
  const el = e.target.closest('[data-id], [data-mode], [data-lang], [data-graph], [data-action], [data-quiz], [data-answer]');
  if (!el) return;
  if (el.tagName === 'A') e.preventDefault();
  const d = el.dataset;
  if (d.mode) setMode(d.mode);
  else if (d.lang) setLang(d.lang);
  else if (d.graph) setGraphMode(d.graph);
  else if (d.quiz) { state.quiz.type = d.quiz; newQuestion(); }
  else if (d.answer) {
    if (state.quiz.picked !== null) return;
    state.quiz.picked = d.answer;
    state.quiz.total++;
    if (d.answer === state.quiz.q.answer) state.quiz.score++;
    if (state.quiz.q.lesion) { viewer.setQuizTarget(null); viewer.setLesion(computeLesion(state.quiz.q.lesion)); }
    renderQuizCard();
  } else if (d.action === 'next') newQuestion();
  else if (d.action === 'graph-max') { document.body.classList.toggle('graph-max'); graph.resize(); }
  else if (d.action === 'focus') viewer.focus(state.selected);
  else if (d.action === 'simulate') { setMode('lesion'); setLesion(state.selected); }
  else if (d.id) {
    if (state.mode === 'lesion' && isLesionable(d.id) && !el.closest('#card')) setLesion(d.id);
    else if (state.mode === 'lesion' && el.closest('#card')) select(d.id, { keepMode: false });
    else select(d.id);
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('graph-max')) { document.body.classList.remove('graph-max'); graph.resize(); }
});
$('#search').addEventListener('input', e => { state.search = e.target.value.trim(); renderList(); });
document.querySelectorAll('[data-layer]').forEach(cb => cb.addEventListener('change', () => {
  const types = {};
  document.querySelectorAll('[data-layer]').forEach(c => { types[c.dataset.layer] = c.checked; });
  viewer.setVisibleTypes(types);
}));
$('#reset-view').addEventListener('click', () => viewer.resetView());
$('#region').addEventListener('change', e => { setRegion(e.target.value); setMode(state.mode); });
new ResizeObserver(() => graph.resize()).observe($('#graph'));

window.addEventListener('hashchange', readHash);

applyStaticText();
readHash();
