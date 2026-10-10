// Schematic 3D model built procedurally from the coordinates in the region data (js/regions/).
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { structures, byId, regionById } from './data.js';

const COLORS = {
  bone: 0xe9dfc9, muscle: 0xc0675a, nerve: 0xf5cc3a, artery: 0xd61f2c, organ: 0xd98c8c, vein: 0x2f5fbf,
  paralysed: 0xe0182d, weakened: 0xff9a1f, healthyDim: 0x8c8c8c, lesionNerve: 0x7a2cff, quiz: 0x19b5ff
};

// Selection glow in the structure's own colour, so it never looks like the lesion purple.
const glow = hex => new THREE.Color(hex).multiplyScalar(0.55).getHex();

// data coords are [lateral, up, anterior] of the right limb; viewer faces the subject.
const v = p => new THREE.Vector3(-p[0], p[1], p[2]);

// Tube whose radius follows profile(t) (0..1 along the curve).
function profiledTube(points, radius, profile, tubular = 40, radial = 12) {
  const curve = new THREE.CatmullRomCurve3(points.map(v), false, 'centripetal');
  const geo = new THREE.TubeGeometry(curve, tubular, 1, radial, false);
  const pos = geo.attributes.position;
  const p = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, c);
    const r = radius * profile(t);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      p.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(k, p.x, p.y, p.z);
    }
  }
  geo.computeVertexNormals();
  return { geo, curve };
}

const constant = () => 1;

// Muscles of the forearm and leg that insert this far distally get a long thin tendon.
const DISTAL_BONES = new Set(['phalanges', 'metacarpals', 'carpals', 'toe_phalanges', 'metatarsals', 'tarsals']);

function muscleProfile(len, longTendon) {
  // belly in the middle, or proximal belly with a long thin tendon for forearm muscles
  const b = longTendon ? 0.26 : 0.5;
  const w = longTendon ? 0.3 : 0.5;
  return t => {
    const bump = t < b ? Math.pow(Math.sin((Math.PI / 2) * (t / b)), 0.6)
      : Math.pow(Math.max(0, Math.cos((Math.PI / 2) * Math.min(1, (t - b) / w))), 0.8);
    return 0.16 + 0.84 * bump;
  };
}

function plateGeometry(outline) {
  const pts = outline.map(v);
  const centre = pts.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(1 / pts.length);
  const verts = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    verts.push(centre.x, centre.y, centre.z, a.x, a.y, a.z, b.x, b.y, b.z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}

export class Viewer {
  constructor(container, { onPick, onHover }) {
    this.container = container;
    this.onPick = onPick;
    this.onHover = onHover;
    this.objects = new Map(); // id -> { group, mat, type, region, centre, base, opacity, size }
    this.visibleTypes = { bone: true, muscle: true, nerve: true, artery: true, organ: true, vein: true };
    this.state = { selected: null, related: new Set(), lesion: null, quizTarget: null };
    this.region = null;
    this.context = new Set(); // structures of other regions shown for orientation
    this.home = null;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;
    this.camera = new THREE.PerspectiveCamera(38, 1, 1, 2000);
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-60, 80, 120);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.7);
    rim.position.set(80, 20, -120);
    scene.add(rim);

    this.addGhost();
    for (const s of structures) this.addStructure(s);
    this.applyStyles();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.bindPointer();

    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    const loop = () => {
      this.controls.update();
      renderer.render(scene, this.camera);
      requestAnimationFrame(loop);
    };
    loop();
  }

  // Show only the structures of one body region and move to its home camera.
  setRegion(id) {
    const first = !this.region;
    const cam = regionById[id].camera;
    this.region = id;
    this.context = new Set(regionById[id].context || []);
    this.home = { target: new THREE.Vector3(...cam.target), position: new THREE.Vector3(...cam.position) };
    this.applyStyles();
    this.resetView(first);
  }

  resetView(immediate = false) {
    if (!this.home) return;
    if (immediate) {
      this.anim = null;
      this.controls.target.copy(this.home.target);
      this.camera.position.copy(this.home.position);
    } else this.animateTo(this.home.target, this.home.position);
  }

  focus(id) {
    const o = this.objects.get(id);
    if (!o) return;
    const box = new THREE.Box3().setFromObject(o.group);
    const centre = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    const dist = Math.max(36, size * 1.9);
    this.animateTo(centre, centre.clone().add(dir.multiplyScalar(dist)));
  }

  animateTo(target, position) {
    const t0 = performance.now(), token = this.anim = {};
    const fromT = this.controls.target.clone(), fromP = this.camera.position.clone();
    const step = now => {
      if (this.anim !== token) return; // superseded by a newer camera move
      const k = Math.min(1, (now - t0) / 600);
      const e = k * k * (3 - 2 * k);
      this.controls.target.lerpVectors(fromT, target, e);
      this.camera.position.lerpVectors(fromP, position, e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  addGhost() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x9fb4c8, transparent: true, opacity: 0.07, depthWrite: false, roughness: 1 });
    const thorax = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), mat);
    thorax.scale.set(12.5, 18, 8.6);
    thorax.position.set(0, -14, -3);
    const head = new THREE.Mesh(new THREE.SphereGeometry(7.5, 24, 18), mat);
    head.position.set(0, 22, -2);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.4, 12, 20), mat);
    neck.position.set(0, 9, -3.5);
    const waist = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), mat);
    waist.scale.set(12.4, 10, 8.2);
    waist.position.set(0, -29, -1.8);
    const abdomen = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), mat);
    abdomen.scale.set(12.5, 15, 9);
    abdomen.position.set(0, -44, -1.8);
    // The vertebral column is real geometry now (back region), so no ghost spine.
    const ghost = new THREE.Group();
    ghost.add(thorax, head, neck, waist, abdomen);
    // Legs: thigh tapering to the knee, calf bulge, then the ankle; a flat ellipsoid for the foot.
    const legProfile = t => t < 0.5 ? 8.4 - 3.4 * (t / 0.5) : 5 - 1.8 * ((t - 0.5) / 0.5) + 1.1 * Math.sin(Math.PI * (t - 0.5) / 0.5);
    for (const side of [1, -1]) {
      const leg = [[10, -50, 0], [11, -70, 0.5], [9.6, -94, 0], [9, -115, -0.8], [8.5, -132, -0.6]].map(([x, y, z]) => [side * x, y, z]);
      ghost.add(new THREE.Mesh(profiledTube(leg, 1, legProfile, 40, 16).geo, mat));
      const foot = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mat);
      foot.scale.set(3.2, 2, 7);
      foot.position.copy(v([side * 8.8, -136, 2.5]));
      ghost.add(foot);
    }
    ghost.renderOrder = -1;
    this.scene.add(ghost);
  }

  addStructure(s) {
    const group = new THREE.Group();
    group.userData.id = s.id;
    const base = s.color ?? COLORS[s.type];
    const mat = new THREE.MeshStandardMaterial({
      color: base, roughness: s.type === 'bone' ? 0.75 : 0.5, metalness: 0.02,
      transparent: true, opacity: 1, side: s.shape?.plate || s.type === 'organ' ? THREE.DoubleSide : THREE.FrontSide
    });
    const add = geo => { const m = new THREE.Mesh(geo, mat); m.userData.id = s.id; group.add(m); };

    if (s.type === 'organ') {
      // Translucent solids: ellipsoids (optionally tilted so their y axis follows `axis`),
      // spheres, tubes and rings (valve annuli, given by centre, radius and normal).
      const sh = s.shape;
      const Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
      for (const [c, sc, axis] of sh.ellipsoids || []) {
        const g = new THREE.SphereGeometry(1, 32, 22); g.scale(...sc);
        if (axis) g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, v(axis).normalize()));
        g.translate(...v(c).toArray()); add(g);
      }
      for (const [c, r] of sh.spheres || []) { const g = new THREE.SphereGeometry(r, 20, 14); g.translate(...v(c).toArray()); add(g); }
      for (const [pts, r] of sh.tubes || []) add(profiledTube(pts, r, constant, Math.max(16, pts.length * 10), 10).geo);
      for (const [c, r, normal] of sh.rings || []) {
        const g = new THREE.TorusGeometry(r, sh.ringR || 0.15, 10, 36);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Z, v(normal).normalize()));
        g.translate(...v(c).toArray()); add(g);
      }
    } else if (s.type === 'bone') {
      const sh = s.shape;
      for (const tube of sh.tubes || []) {
        add(profiledTube(tube, sh.r, constant, 32, 12).geo);
        for (const end of [tube[0], tube[tube.length - 1]]) {
          const ball = new THREE.SphereGeometry(sh.r * 1.25, 14, 10);
          ball.translate(...v(end).toArray());
          add(ball);
        }
      }
      for (const [c, r] of sh.spheres || []) { const g = new THREE.SphereGeometry(r, 24, 16); g.translate(...v(c).toArray()); add(g); }
      for (const [c, sc] of sh.ellipsoids || []) {
        const g = new THREE.SphereGeometry(1, 20, 14); g.scale(...sc); g.translate(...v(c).toArray()); add(g);
      }
      if (sh.plate) add(plateGeometry(sh.plate));
    } else if (s.type === 'muscle') {
      const longTendon = /forearm|hand|leg|foot/.test(s.group) && s.insertionBones.some(b => DISTAL_BONES.has(b));
      for (const f of s.shape.fibers) {
        let len = 0;
        for (let i = 1; i < f.length; i++) len += v(f[i]).distanceTo(v(f[i - 1]));
        add(profiledTube(f, s.shape.r, muscleProfile(len, longTendon && len > 14), 40, 12).geo);
      }
    } else {
      // `paths` holds several separate segmental branches drawn as one structure.
      for (const p of s.paths || [s.path]) {
        add(profiledTube(p, s.r, s.type === 'artery' ? (t => 1 - 0.25 * t) : constant, Math.max(12, p.length * 10), 8).geo);
      }
    }

    const box = new THREE.Box3().setFromObject(group);
    this.objects.set(s.id, {
      group, mat, type: s.type, region: s.region, base, centre: box.getCenter(new THREE.Vector3()),
      opacity: s.type === 'organ' ? s.shape.opacity ?? 0.45 : 1, size: box.getSize(new THREE.Vector3()).length()
    });
    this.scene.add(group);
  }

  setVisibleTypes(types) { this.visibleTypes = { ...types }; this.applyStyles(); }
  setSelection(id, related = []) { this.state.selected = id; this.state.related = new Set(related); this.applyStyles(); }
  setLesion(result) { this.state.lesion = result; this.applyStyles(); }
  setQuizTarget(id) { this.state.quizTarget = id; this.applyStyles(); }

  applyStyles() {
    const { selected, related, lesion, quizTarget } = this.state;
    const lesionStatus = lesion ? Object.fromEntries([...lesion.muscles, ...(lesion.organs || [])].map(m => [m.id, m.status])) : null;
    const lesionNerves = lesion ? new Set(lesion.nerves) : null;
    const contextOpacity = regionById[this.region]?.contextOpacity ?? 1;

    for (const [id, o] of this.objects) {
      const base = o.base;
      // Organs are translucent; structures borrowed from another region can be faded so they
      // do not hide the region's own structures (e.g. the sternum in front of the heart).
      const own = o.type === 'organ' ? o.opacity
        : o.region === this.region ? 1 : o.type === 'bone' ? contextOpacity : o.type === 'muscle' ? Math.min(contextOpacity, 0.3) : 1;
      let color = base, opacity = own, emissive = 0x000000, visible = this.visibleTypes[o.type];

      if (quizTarget) {
        if (id === quizTarget) { color = COLORS.quiz; emissive = 0x0b4f8a; visible = true; opacity = o.type === 'organ' ? 0.65 : 1; }
        else opacity = Math.min(own, o.type === 'bone' ? 0.55 : o.type === 'organ' ? 0.08 : 0.18);
      } else if (lesion) {
        if (o.type === 'muscle' || o.type === 'organ') {
          const st = lesionStatus[id];
          color = st === 'paralysed' || st === 'denervated' ? COLORS.paralysed
            : st === 'weakened' || st === 'partial' ? COLORS.weakened : COLORS.healthyDim;
          opacity = o.type === 'organ' ? (st ? Math.max(own, 0.5) : 0.12) : st ? 1 : Math.min(own, 0.35);
        } else if (o.type === 'nerve') {
          if (id === lesion.nerve) { color = COLORS.lesionNerve; emissive = 0x3a0090; visible = true; opacity = 1; }
          else if (lesionNerves.has(id)) { color = 0x555555; visible = true; opacity = 1; }
          else opacity = Math.min(own, 0.6);
        } else if (o.type === 'artery' || o.type === 'vein') opacity = 0.25;
      } else if (selected) {
        if (id === selected) { emissive = glow(base); visible = true; opacity = o.type === 'organ' ? Math.min(0.75, own + 0.25) : 1; }
        else if (related.has(id)) {
          visible = true;
          // Muscles wrap bones, so keep a selected bone visible through its attachments.
          if (this.objects.get(selected)?.type === 'bone' && o.type === 'muscle') opacity = 0.4;
        } else opacity = Math.min(own, o.type === 'bone' ? 0.45 : o.type === 'organ' ? 0.06 : 0.12);
      }

      o.group.visible = visible && (o.region === this.region || this.context.has(id));
      o.mat.color.setHex(color);
      o.mat.emissive.setHex(emissive);
      o.mat.opacity = opacity;
      o.mat.depthWrite = opacity > 0.5;
      o.group.renderOrder = opacity > 0.5 ? 0 : 1;
    }
  }

  pick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = [];
    for (const o of this.objects.values()) if (o.group.visible) o.group.children.forEach(m => meshes.push(m));
    const hits = this.raycaster.intersectObjects(meshes, false);
    // Prefer opaque (focused) structures over faded ones. Organs are translucent shells: of
    // nested organs hit along the ray (pericardium > heart > chamber) take the innermost, and
    // take a solid structure over an organ only if it lies inside or in front of that organ.
    const solid = hits.find(h => h.object.material.opacity > 0.5);
    const span = new Map(); // organ id -> [entry, exit] distance along the ray
    for (const h of hits) {
      const id = h.object.userData.id;
      if (this.objects.get(id).type !== 'organ' || h.object.material.opacity < 0.1) continue;
      const s = span.get(id);
      if (s) s[1] = h.distance; else span.set(id, [h.distance, h.distance]);
    }
    let organ = null;
    for (const [id, [entry, exit]] of span) {
      if (!organ) { organ = { id, exit }; continue; }
      if (entry < organ.exit && this.objects.get(id).size < this.objects.get(organ.id).size) organ = { id, exit };
    }
    if (solid && (!organ || solid.distance < span.get(organ.id)[1])) return solid.object.userData.id;
    return organ?.id || hits[0]?.object.userData.id || null;
  }

  bindPointer() {
    const el = this.renderer.domElement;
    let down = null;
    el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointerup', e => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved < 5) this.onPick?.(this.pick(e));
    });
    let pending = false;
    el.addEventListener('pointermove', e => {
      if (pending || e.buttons) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; this.onHover?.(this.pick(e), e); });
    });
    el.addEventListener('pointerleave', () => this.onHover?.(null));
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}

export { byId };
