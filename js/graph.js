// Connection graph (Cytoscape). Shows the neighbourhood of the selection or the whole plexus.
import cytoscape from '../vendor/cytoscape.esm.min.mjs';
import { structures, byId, relations } from './data.js';
import { ancestors } from './lesion.js';

const TYPE_COLOR = { bone: '#d9cdb2', muscle: '#c0675a', nerve: '#e6b800', artery: '#d61f2c' };
const EDGE_COLOR = { innervates: '#c9a200', supplies: '#d61f2c', branch: '#555', origin: '#8a8a8a', insertion: '#8a8a8a' };

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
            'background-color': 'data(color)', label: 'data(label)', 'font-size': 10, color: '#1d2433',
            'text-wrap': 'wrap', 'text-max-width': 110, 'text-valign': 'bottom', 'text-margin-y': 3,
            width: 18, height: 18, 'border-width': 1, 'border-color': '#fff',
            'text-background-color': '#fff', 'text-background-opacity': 0.75, 'text-background-padding': 1,
            'min-zoomed-font-size': 7
          }
        },
        { selector: 'node[type="nerve"]', style: { shape: 'round-rectangle' } },
        { selector: 'node[type="bone"]', style: { shape: 'hexagon' } },
        { selector: 'node[type="artery"]', style: { shape: 'diamond' } },
        { selector: 'node.focus', style: { width: 30, height: 30, 'border-width': 3, 'border-color': '#1f4fbf', 'font-weight': 'bold', 'font-size': 12 } },
        { selector: 'node.paralysed', style: { 'background-color': '#e0182d' } },
        { selector: 'node.weakened', style: { 'background-color': '#ff9a1f' } },
        { selector: 'node.lesion', style: { 'background-color': '#7a2cff', 'border-color': '#3a0090', 'border-width': 3 } },
        { selector: 'node.cut', style: { opacity: 0.55 } },
        { selector: 'node.spared', style: { 'background-color': '#bdbdbd' } },
        {
          selector: 'edge', style: {
            width: 1.6, 'line-color': 'data(color)', 'target-arrow-color': 'data(color)', 'target-arrow-shape': 'triangle',
            'arrow-scale': 0.8, 'curve-style': 'bezier', label: 'data(label)', 'font-size': 8, color: '#6b5600',
            'text-rotation': 'autorotate', 'text-background-color': '#fff', 'text-background-opacity': 0.8,
            'min-zoomed-font-size': 7
          }
        },
        { selector: 'edge[type="origin"], edge[type="insertion"]', style: { 'line-style': 'dashed', 'target-arrow-shape': 'none' } }
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
      ? { origin: 'Ursprung', insertion: 'Ansatz', supplies: '', branch: '' }
      : { origin: 'origin', insertion: 'insertion', supplies: '', branch: '' };
    const label = this.mode !== 'neighbourhood' ? '' : r.type === 'innervates' ? r.seg.join(',') : typeLabel[r.type];
    return { group: 'edges', data: { id: `${r.type}:${r.from}>${r.to}`, source: r.from, target: r.to, type: r.type, color: EDGE_COLOR[r.type], label } };
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
      const key = s.type === 'muscle' ? 'muscle' : s.group || 'branch';
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
    } else {
      // With a lesion, "plexus -> muscles" shrinks to the injured pathway so it stays readable.
      const lesionOnly = this.lesion && this.mode === 'plexusMuscles';
      const keepNerve = lesionOnly
        ? new Set([...ancestors(this.lesion.nerve), ...this.lesion.nerves])
        : null;
      const keepMuscle = lesionOnly ? new Set(this.lesion.muscles.map(m => m.id)) : null;
      structures.filter(s => s.type === 'nerve' && s.region === this.region && (!keepNerve || keepNerve.has(s.id))).forEach(addNode);
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
        const st = Object.fromEntries(this.lesion.muscles.map(m => [m.id, m.status]));
        const cut = new Set(this.lesion.nerves);
        cy.nodes().forEach(n => {
          const id = n.id();
          if (id === this.lesion.nerve) n.addClass('lesion');
          else if (cut.has(id)) n.addClass('cut');
          else if (st[id]) n.addClass(st[id]);
          else if (n.data('type') === 'muscle') n.addClass('spared');
        });
      }
    });

    const layout = this.mode === 'neighbourhood'
      ? { name: 'concentric', concentric: n => (n.id() === this.focusId ? 10 : 1), levelWidth: () => 1, minNodeSpacing: 48, animate: false }
      : {
        name: 'breadthfirst', directed: true, animate: false, spacingFactor: 1,
        roots: cy.nodes().filter(n => byId[n.id()].type === 'nerve' && byId[n.id()].parents.length === 0),
        // Lay out on a canvas wide enough for readable labels; fit() then zooms out and the user zooms in.
        boundingBox: this.plexusBox()
      };
    cy.layout(layout).run();
    cy.fit(undefined, 20);
  }
}
