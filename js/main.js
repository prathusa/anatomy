import { structures, byId, relations, BODY_REGIONS, regionById, formatSegs } from './data.js';
import { UI } from './i18n.js';
import { computeLesion, ancestors } from './lesion.js';
import { makeQuestion, QUIZ_TYPES } from './quiz.js';
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

// ------------------------------------------------------------------ 3D + graph
const viewer = new Viewer($('#viewer'), {
  onPick: id => {
    if (!id) return;
    if (state.mode === 'lesion') { if (byId[id].type === 'nerve') setLesion(id); else select(id, { keepMode: true }); }
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
    if (state.mode === 'lesion' && byId[id].type === 'nerve') setLesion(id);
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
  if (state.region) $('[data-graph="plexus"]').textContent = region().plexus[state.lang];
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
  $('#legend').innerHTML = state.mode === 'lesion'
    ? item('lesion', L.lesion) + item('paralysed', L.paralysed) + item('weakened', L.weakened) + item('spared', L.unaffected)
    : item('bone', L.bone) + item('muscle', L.muscle) + item('nerve', L.nerve) + item('artery', L.artery);
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
  for (const [g, label] of r.nerveGroups) {
    groups.push([label[state.lang], structures.filter(s => s.region === r.id && s.type === 'nerve' && s.group === g)]);
  }
  if (state.mode !== 'lesion') {
    const nerveCount = groups.length;
    for (const [key, label] of Object.entries(r.muscleGroups)) groups.push([`${L.muscle}: ${label[state.lang]}`, of('muscle', key)]);
    groups.push([L.bone, [...of('bone'), ...(prefix ? [] : r.context || []).map(id => byId[id])]]);
    groups.push([L.artery, of('artery')]);
    // muscles and bones first in explore mode
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
  if (s.type === 'nerve' || s.type === 'artery') for (const a of ancestors(id)) out.add(a);
  if (s.type === 'muscle') for (const inn of s.nerves) for (const a of ancestors(inn.n)) out.add(a);
  out.delete(id);
  return [...out];
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
  } else {
    body += `<p>${esc(s.info[lang])}</p><dl>`;
    if (s.type === 'nerve' || s.type === 'artery') {
      if (s.type === 'nerve') body += `<dt>${L.segments}</dt><dd>${segs(s.segs)}</dd>`;
      if (s.parents.length) body += `<dt>${L.branchOf}</dt><dd>${s.parents.map(link).join(', ')}</dd>`;
      const kids = structures.filter(x => x.parents?.includes(s.id));
      if (kids.length) body += `<dt>${L.branches}</dt><dd>${kids.map(k => link(k.id)).join(', ')}</dd>`;
    }
    if (s.type === 'nerve') {
      const inn = relations.filter(r => r.type === 'innervates' && r.from === s.id);
      if (inn.length) body += `<dt>${L.innervates}</dt><dd><ul>${inn.map(r => `<li>${link(r.to)} ${segs(r.seg)}</li>`).join('')}</ul></dd>`;
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
  if (s.type === 'nerve') actions.push(`<button class="primary" data-action="simulate">${L.lesion} ✂</button>`);
  $('#card').innerHTML = header + body + `<div class="actions">${actions.join('')}</div>`;
}

// ------------------------------------------------------------------ lesion card
function renderLesionCard() {
  const L = t(), lang = state.lang;
  if (!state.lesion) { $('#card').innerHTML = `<p>${esc(L.lesionIntro)}</p>`; return; }
  const n = byId[state.lesion];
  const res = computeLesion(n.id);
  const list = status => res.muscles.filter(m => m.status === status).map(m => {
    const via = m.details.filter(d => d.lost.length).map(d => `${L.via} ${esc(byId[d.nerve].name[lang])}: ${segs(d.lost)} ${L.lost}`).join('; ');
    return `<li><a href="#" data-id="${m.id}" class="${status}">${esc(byId[m.id].name[lang])}</a> <span class="note">${via}</span></li>`;
  }).join('');
  const paralysed = list('paralysed'), weakened = list('weakened');
  $('#card').innerHTML = `<span class="badge nerve">${esc(L.lesion)} ✂</span>
    <h2>${esc(n.name[lang])}</h2>
    <div class="names">${esc(n.name[other()])} · <span class="la">${esc(n.name.la)}</span> · ${segs(n.segs)}</div>
    ${n.lesion ? `<div class="clinical"><strong>${L.clinical}:</strong> ${esc(n.lesion[lang])}</div>` : `<p>${esc(n.info[lang])}</p>`}
    <dl class="status-list">
      ${paralysed ? `<dt>${L.paralysed}</dt><dd><ul>${paralysed}</ul></dd>` : ''}
      ${weakened ? `<dt>${L.weakened}</dt><dd><ul>${weakened}</ul></dd>` : ''}
      ${!paralysed && !weakened ? `<p>${L.noMuscles}</p>` : ''}
    </dl>`;
}

// ------------------------------------------------------------------ quiz card
function newQuestion() {
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
  const labels = { name: L.qName, nerve: L.qNerve, lesion: L.qLesion, translate: L.qTranslate, function: L.qFunction };
  const types = QUIZ_TYPES.map(k => `<button data-quiz="${k}" class="${k === z.type ? 'active' : ''}">${esc(labels[k])}</button>`).join('');
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
  if (byId[state.lesion]?.region !== id) state.lesion = null;
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
  if (id && byId[id].region !== state.region) setRegion(byId[id].region);
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
  setRegion(id ? byId[id].region : regionById[key]?.available ? key : state.region || firstRegion);
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
    if (state.mode === 'lesion' && byId[d.id].type === 'nerve' && !el.closest('#card')) setLesion(d.id);
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
