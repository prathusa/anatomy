// Connection graph (Cytoscape). Shows the neighbourhood of the selection or the whole plexus.
import cytoscape from '../vendor/cytoscape.esm.min.mjs';
import { structures, byId, relations, formatSegs, regionById } from './data.js';
import { ancestors } from './lesion.js';

const TYPE_COLOR = { bone: '#dccca8', muscle: '#ad5148', nerve: '#d7ad32', artery: '#cf3e4f', organ: '#d98c8c', vein: '#2f5fbf',
  brain: '#c99a90', tract: '#2e9e5b', function: '#22c3a6' };
const EDGE_COLOR = { innervates: '#c9a200', supplies: '#d61f2c', branch: '#555', origin: '#8a8a8a', insertion: '#8a8a8a', drains: '#2f5fbf', part: '#8a8a8a',
  serves: '#22c3a6', passes: '#9a7fd1', fibres: '#e6b800' };
// Organ innervation edges are coloured by fibre kind.
const KIND_COLOR = { sympathetic: '#e67e22', parasympathetic: '#2e7d32', sensory: '#c9a200' };
const KIND_SHORT = { en: { sympathetic: 'symp.', parasympathetic: 'parasymp.', sensory: 'sens.' }, de: { sympathetic: 'sympath.', parasympathetic: 'parasympath.', sensory: 'sens.' } };
const LESION_CLASS = { paralysed: 'paralysed', weakened: 'weakened', denervated: 'paralysed', partial: 'weakened' };
// Central functions: lost / partly lost, labelled with the side of the deficit relative to the lesion.
const FN_CLASS = { lost: 'paralysed', partial: 'weakened' };
const SIDE_SHORT = { en: { ipsi: 'ipsi', contra: 'contra', both: 'both', dominant: 'dom.', partial: 'part.' },
  de: { ipsi: 'ipsi', contra: 'kontra', both: 'beids.', dominant: 'dom.', partial: 'teilw.' } };

export class Graph {
  constructor(container, { onPick }) {
    this.onPick = onPick;
    this.lang = 'en';
    this.cy = cytoscape({
      container,
      minZoom: 0.2, maxZoom: 3,
      style: [
        {
          selector: 'node', style: {
            'background-color': 'data(color)', label: 'data(label)', 'font-size': 10, color: '#23352e',
            'text-wrap': 'wrap', 'text-max-width': 110, 'text-valign': 'bottom', 'text-margin-y': 3,
            width: 18, height: 18, 'border-width': 1, 'border-color': '#fff',
            'text-background-color': '#fffefa', 'text-background-opacity': 0.75, 'text-background-padding': 1,
            'min-zoomed-font-size': 7
          }
        },
        { selector: 'node[type="nerve"]', style: { shape: 'round-rectangle' } },
        { selector: 'node[type="bone"]', style: { shape: 'hexagon' } },
        { selector: 'node[type="artery"]', style: { shape: 'diamond' } },
        { selector: 'node[type="organ"]', style: { shape: 'barrel', width: 22, height: 22 } },
        { selector: 'node[type="vein"]', style: { shape: 'round-diamond' } },
        { selector: 'node[type="brain"]', style: { shape: 'ellipse', width: 22, height: 22 } },
        { selector: 'node[type="tract"]', style: { shape: 'round-tag' } },
        { selector: 'node[type="function"]', style: { shape: 'star', width: 22, height: 22 } },
        { selector: 'node.focus', style: { width: 30, height: 30, 'border-width': 3, 'border-color': '#326952', 'font-weight': 'bold', 'font-size': 12 } },
        { selector: 'node.paralysed', style: { 'background-color': '#e0182d' } },
        { selector: 'node.weakened', style: { 'background-color': '#ff9a1f' } },
        { selector: 'node.lesion', style: { 'background-color': '#7a2cff', 'border-color': '#3a0090', 'border-width': 3 } },
        { selector: 'node.cut', style: { opacity: 0.55 } },
        { selector: 'node.spared', style: { 'background-color': '#bdbdbd' } },
        {
          selector: 'edge', style: {
            width: 1.6, 'line-color': 'data(color)', 'target-arrow-color': 'data(color)', 'target-arrow-shape': 'triangle',
            'arrow-scale': 0.8, 'curve-style': 'bezier', label: 'data(label)', 'font-size': 8, color: '#6b5600',
            'text-rotation': 'autorotate', 'text-background-color': '#fffefa', 'text-background-opacity': 0.8,
            'min-zoomed-font-size': 7
          }
        },
        { selector: 'edge[type="origin"], edge[type="insertion"], edge[type="part"]', style: { 'line-style': 'dashed', 'target-arrow-shape': 'none' } }
      ]
    });
    this.cy.on('tap', 'node', e => this.onPick?.(e.target.id()));
    this.mode = 'neighbourhood';
    this.focusId = null;
    this.lesion = null;
  }

  label(s) {
    if (s.group === 'root') return s.segs[0];
    const primary = s.name[this.lang];
    return primary.length > 42 ? primary.slice(0, 40) + '…' : primary;
  }

  node(s) {
    return { group: 'nodes', data: { id: s.id, label: this.label(s), type: s.type, color: TYPE_COLOR[s.type] } };
  }

  edge(r) {
    const typeLabel = this.lang === 'de'
      ? { origin: 'Ursprung', insertion: 'Ansatz', supplies: '', branch: '', drains: '', part: 'Teil', passes: '', fibres: '' }
      : { origin: 'origin', insertion: 'insertion', supplies: '', branch: '', drains: '', part: 'part', passes: '', fibres: '' };
    const segLabel = r.kind ? `${KIND_SHORT[this.lang][r.kind]} ${formatSegs(r.seg)}` : r.seg && formatSegs(r.seg);
    const short = SIDE_SHORT[this.lang];
    const sideLabel = r.type === 'serves' ? short[r.side] + (r.partial ? ` (${short.partial})` : '') : '';
    const label = this.mode !== 'neighbourhood' ? '' : r.type === 'innervates' ? segLabel : r.type === 'serves' ? sideLabel : typeLabel[r.type] || '';
    const color = r.kind ? KIND_COLOR[r.kind] : EDGE_COLOR[r.type];
    // The kind is part of the id: one nerve can reach an organ with sympathetic and parasympathetic fibres.
    return { group: 'edges', data: { id: `${r.type}:${r.from}>${r.to}${r.kind ? ':' + r.kind : ''}`, source: r.from, target: r.to, type: r.type, color, label } };
  }

  setLanguage(lang) { this.lang = lang; this.render(); }
  setRegion(id) { this.region = id; this.render(); }
  showNeighbourhood(id) { this.mode = 'neighbourhood'; this.focusId = id; this.render(); }
  showPlexus(withMuscles) { this.mode = withMuscles ? 'plexusMuscles' : 'plexus'; this.render(); }
  setLesion(result) { this.lesion = result; this.render(); }
  resize() { this.cy.resize(); this.render(); }

  plexusBox() {
    const levels = new Map();
    this.cy.nodes().forEach(n => {
      const s = byId[n.id()];
      const key = s.type === 'muscle' || s.type === 'organ' || s.type === 'function' ? 'target' : s.group || 'branch';
      levels.set(key, (levels.get(key) || 0) + 1);
    });
    const widest = Math.max(...levels.values());
    const w = Math.max(this.cy.width(), widest * 120);
    const h = Math.max(this.cy.height(), (levels.size + 1) * 110);
    return { x1: 0, y1: 0, w, h };
  }

  render() {
    const cy = this.cy;
    const els = [];
    const ids = new Set();
    const addNode = s => { if (!ids.has(s.id)) { ids.add(s.id); els.push(this.node(s)); } };

    if (this.mode === 'neighbourhood') {
      const s = byId[this.focusId];
      if (!s) { cy.elements().remove(); return; }
      addNode(s);
      for (const r of relations) {
        if (r.from === s.id || r.to === s.id) {
          addNode(byId[r.from]); addNode(byId[r.to]);
          els.push(this.edge(r));
        }
      }
    } else if (regionById[this.region]?.functionGroups) {
      // Neuroanatomy: "pathways" are the region's tracts; "pathways -> functions" adds every link that
      // serves a function (tracts, nuclei, cranial nerves). A lesion shrinks it to the hit pathways.
      const fns = structures.filter(f => f.type === 'function' && f.region === this.region);
      const affected = new Set((this.lesion?.functions || []).map(f => f.id));
      const keep = this.lesion && this.mode === 'plexusMuscles'
        ? new Set([...this.lesion.hits, ...this.lesion.nerves, ...affected]) : null;
      const ok = id => !keep || keep.has(id);
      structures.filter(x => x.type === 'tract' && x.region === this.region && ok(x.id)).forEach(addNode);
      if (this.mode === 'plexusMuscles') {
        for (const f of fns) {
          if (!ok(f.id)) continue;
          for (const r of relations) if (r.type === 'serves' && r.to === f.id && ok(r.from)) { addNode(byId[r.from]); addNode(f); els.push(this.edge(r)); }
        }
      }
      for (const r of relations) {
        if (r.type === 'branch' && ids.has(r.from) && ids.has(r.to)) els.push(this.edge(r));
      }
    } else {
      // With a lesion, "plexus -> muscles" shrinks to the injured pathway so it stays readable.
      const lesionOnly = this.lesion && this.mode === 'plexusMuscles';
      const keepNerve = lesionOnly
        ? new Set([...ancestors(this.lesion.nerve), ...this.lesion.nerves])
        : null;
      const keepMuscle = lesionOnly ? new Set([...this.lesion.muscles, ...this.lesion.organs].map(m => m.id)) : null;
      // The region's nerves plus context nerves it borrows from other regions (the phrenic nerve in the thorax).
      const context = new Set(regionById[this.region]?.context || []);
      structures.filter(s => s.type === 'nerve' && (s.region === this.region || context.has(s.id)) && (!keepNerve || keepNerve.has(s.id))).forEach(addNode);
      for (const r of relations) {
        if (r.type === 'branch' && ids.has(r.from) && ids.has(r.to)) els.push(this.edge(r));
      }
      if (this.mode === 'plexusMuscles') {
        for (const r of relations) {
          if (r.type !== 'innervates' || !ids.has(r.from)) continue;
          if (keepMuscle && !keepMuscle.has(r.to)) continue;
          addNode(byId[r.to]);
          els.push(this.edge(r));
        }
      }
    }

    cy.batch(() => {
      cy.elements().remove();
      cy.add(els);
      if (this.focusId && cy.getElementById(this.focusId).nonempty()) cy.getElementById(this.focusId).addClass('focus');
      if (this.lesion) {
        const st = Object.fromEntries([
          ...[...this.lesion.muscles, ...this.lesion.organs].map(m => [m.id, LESION_CLASS[m.status]]),
          ...(this.lesion.functions || []).map(f => [f.id, FN_CLASS[f.status]])
        ]);
        const cut = new Set(this.lesion.nerves);
        const hit = new Set(this.lesion.hits || []);
        cy.nodes().forEach(n => {
          const id = n.id();
          if (st[id]) n.addClass(st[id]);
          else if (id === this.lesion.nerve || hit.has(id)) n.addClass('lesion');
          else if (cut.has(id)) n.addClass('cut');
          else if (['muscle', 'organ', 'function'].includes(n.data('type'))) n.addClass('spared');
        });
      }
    });

    const layout = this.mode === 'neighbourhood'
      ? { name: 'concentric', concentric: n => (n.id() === this.focusId ? 10 : 1), levelWidth: () => 1, minNodeSpacing: 48, animate: false }
      : {
        name: 'breadthfirst', directed: true, animate: false, spacingFactor: 1,
        // Roots are nerves whose parents are not drawn (a context nerve's parents live in another region);
        // in the CNS graph every node without an incoming edge.
        roots: regionById[this.region]?.functionGroups
          ? cy.nodes().filter(n => n.indegree(false) === 0)
          : cy.nodes().filter(n => byId[n.id()].type === 'nerve' && byId[n.id()].parents.every(p => !ids.has(p))),
        // Lay out on a canvas wide enough for readable labels; fit() then zooms out and the user zooms in.
        boundingBox: this.plexusBox()
      };
    cy.layout(layout).run();
    // Organs hang off nerves at different depths (trachea straight from the vagus, heart via the cardiac plexus);
    // put every target on the bottom row so they do not sit among the nerves.
    const targets = cy.nodes().filter(n => ['muscle', 'organ', 'function'].includes(n.data('type')));
    if (this.mode === 'plexusMuscles' && targets.some(n => n.data('type') !== 'muscle')) {
      const box = this.plexusBox(), y = Math.max(...targets.map(n => n.position('y')));
      const row = targets.sort((a, b) => a.position('x') - b.position('x'));
      row.forEach((n, i) => n.position({ x: box.x1 + box.w * (i + 0.5) / row.length, y }));
    }
    cy.fit(undefined, 20);
  }
}
