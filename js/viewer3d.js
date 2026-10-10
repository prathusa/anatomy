// Schematic 3D model built procedurally from the coordinates in the region data (js/regions/).
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { structures, byId, regionById } from './data.js';
import { surfaceMaps } from './surfaces.js';

const COLORS = {
  bone: 0xe5d6b5, muscle: 0xa74e45, nerve: 0xf5d16e, artery: 0xc73c4d, organ: 0xc58080, vein: 0x537fc5,
  brain: 0xd8b4ac, tract: 0x2e9e5b, function: 0x22c3a6,
  paralysed: 0xe0182d, weakened: 0xff9a1f, healthyDim: 0x8c8c8c, lesionNerve: 0x7a2cff, quiz: 0x19b5ff
};

// Selection glow in the structure's own colour, so it never looks like the lesion purple.
// Translucent solids built from ellipsoids, spheres and tubes: organs, CNS structures, function nodes.
const SOLID = new Set(['organ', 'brain', 'function']);
const SHELL = new Set(['organ', 'brain']);

const glow = hex => new THREE.Color(hex).multiplyScalar(0.55).getHex();

// data coords are [lateral, up, anterior] of the right limb; viewer faces the subject.
const v = p => new THREE.Vector3(-p[0], p[1], p[2]);

// Tube whose radius follows profile(t) (0..1 along the curve).
function profiledTube(points, radius, profile, tubular = 56, radial = 20, ridges = false) {
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
      p.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r * (ridges ? 1 + .012 * Math.cos(j / radial * Math.PI * 36) * Math.sin(t * Math.PI) : 1)).add(c);
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

// Give flat bones a shallow curved face, a back and a closed rim.
function plateGeometry(outline) {
  const pts = outline.map(v), n = pts.length;
  const centre = pts.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(1 / n);
  const normal = new THREE.Vector3().crossVectors(pts[1].clone().sub(pts[0]), pts[2].clone().sub(pts[0])).normalize();
  const thickness = .28, verts = [], idx = [], uv = [];
  for (const sign of [1, -1]) {
    verts.push(...centre.clone().addScaledVector(normal, sign * .55).toArray()); uv.push(.5, .5);
    for (let i = 0; i < n; i++) {
      verts.push(...pts[i].clone().addScaledVector(normal, sign * thickness).toArray());
      uv.push(.5 + .5 * Math.cos(i / n * Math.PI * 2), .5 + .5 * Math.sin(i / n * Math.PI * 2));
    }
  }
  const back = n + 1;
  for (let i = 0; i < n; i++) {
    const a = i + 1, b = (i + 1) % n + 1;
    idx.push(0, a, b, back, back + b, back + a, a, back + a, b, b, back + a, back + b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}

// Retain each region's layout while adding the flared ends and uneven cross-section of a shaft.
function boneProfile(id, length) {
  if (length < 5 || !['humerus', 'radius', 'ulna', 'femur', 'tibia', 'fibula', 'metacarpals', 'metatarsals', 'phalanges', 'toe_phalanges'].includes(id)) return constant;
  return t => .84 + .33 * Math.exp(-Math.pow(t / .14, 2)) + .42 * Math.exp(-Math.pow((1 - t) / .16, 2)) + .03 * Math.sin(t * Math.PI * 3);
}

// Broad muscles form continuous sheets between their supplied fibre paths. This
// preserves their fan arrangement instead of drawing separated sausage shapes.
const BROAD_MUSCLES = new Set(['pectoralis_major', 'trapezius', 'latissimus_dorsi', 'deltoid',
  'subscapularis', 'supraspinatus', 'infraspinatus', 'gluteus_maximus', 'gluteus_medius',
  'gluteus_minimus', 'external_oblique', 'internal_oblique', 'transversus_abdominis']);
function muscleSheet(fibers, radius) {
  const curves = fibers.map(f => new THREE.CatmullRomCurve3(f.map(v), false, 'centripetal'));
  const nt = 64, nu = (curves.length - 1) * 8, pos = [], uv = [], idx = [];
  const stride = nu + 1, layer = (nt + 1) * stride;
  for (const sign of [1, -1]) for (let i = 0; i <= nt; i++) for (let j = 0; j <= nu; j++) {
    const t = i / nt, u = j / nu * (curves.length - 1), k = Math.min(curves.length - 2, Math.floor(u)), f = u - k;
    const p = curves[k].getPointAt(t), q = curves[k + 1].getPointAt(t);
    const tangent = curves[k].getTangentAt(t).lerp(curves[k + 1].getTangentAt(t), f).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, q.clone().sub(p)).normalize();
    const thickness = radius * (.1 + .52 * Math.pow(Math.sin(t * Math.PI), .7))
      * (.75 + .25 * Math.sin(j / nu * Math.PI));
    p.lerp(q, f).addScaledVector(normal, sign * thickness);
    pos.push(...p.toArray()); uv.push(t, j / nu);
  }
  for (let i = 0; i < nt; i++) for (let j = 0; j < nu; j++) {
    const a = i * stride + j, b = a + stride;
    idx.push(a, b, a + 1, a + 1, b, b + 1,
      layer + a, layer + a + 1, layer + b, layer + a + 1, layer + b + 1, layer + b);
  }
  // Join the side edges and both tapered attachment borders.
  const edge = (a, b) => idx.push(a, layer + a, b, b, layer + a, layer + b);
  for (let i = 0; i < nt; i++) { edge(i * stride, (i + 1) * stride); edge((i + 1) * stride + nu, i * stride + nu); }
  for (let j = 0; j < nu; j++) { edge(j + 1, j); edge(nt * stride + j, nt * stride + j + 1); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}

// A patch of an ellipsoid surface (skull vault bones). Longitude runs from anterior (0°) towards
// the body's right (90°), latitude from the equator (0°) up to the vertex (90°).
function shellGeometry(c, radii, [lon0, lon1], [lat0, lat1]) {
  const nu = Math.max(4, Math.ceil(Math.abs(lon1 - lon0) / 6)), nv = Math.max(3, Math.ceil(Math.abs(lat1 - lat0) / 6));
  const rad = Math.PI / 180, pos = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const b = (lat0 + (lat1 - lat0) * j / nv) * rad;
    for (let i = 0; i <= nu; i++) {
      const l = (lon0 + (lon1 - lon0) * i / nu) * rad;
      pos.push(...v([c[0] + radii[0] * Math.cos(b) * Math.sin(l), c[1] + radii[1] * Math.sin(b), c[2] + radii[2] * Math.cos(b) * Math.cos(l)]).toArray());
    }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + nu + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export class Viewer {
  constructor(container, { onPick, onHover }) {
    this.container = container;
    this.onPick = onPick;
    this.onHover = onHover;
    this.objects = new Map(); // id -> { group, mat, type, region, centre, base, opacity, size }
    this.visibleTypes = { bone: true, muscle: true, nerve: true, artery: true, organ: true, vein: true, brain: true, tract: true, function: true };
    this.state = { selected: null, related: new Set(), lesion: null, quizTarget: null };
    this.region = null;
    this.context = new Set(); // structures of other regions shown for orientation
    this.home = null;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;
    this.camera = new THREE.PerspectiveCamera(38, 1, 1, 2000);
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;

    scene.add(new THREE.HemisphereLight(0xfff5df, 0x688c80, 1.65));
    const key = new THREE.DirectionalLight(0xfff0dd, 2.5);
    key.position.set(-60, 80, 120);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc2d8eb, 1.5);
    rim.position.set(80, 20, -120);
    scene.add(rim);

    this.addGhost();
    const fill = new THREE.DirectionalLight(0xffffff, .6);
    fill.position.set(60, -30, 100); scene.add(fill);

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
    // Only build the current region and its context. Dispose old geometry on switching;
    // texture maps are shared, so navigating all eight regions does not grow GPU memory.
    const needed = new Set(structures.filter(s => s.region === id || this.context.has(s.id)).map(s => s.id));
    for (const [key, o] of this.objects) if (!needed.has(key)) {
      this.scene.remove(o.group);
      for (const mesh of o.group.children) mesh.geometry.dispose();
      for (const material of o.materials) material.dispose();
      this.objects.delete(key);
    }
    for (const s of structures) if (needed.has(s.id) && !this.objects.has(s.id)) this.addStructure(s);
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

  orient(side) {
    if (!this.home) return;
    const distance = this.home.position.distanceTo(this.home.target);
    this.animateTo(this.home.target, this.home.target.clone().add(new THREE.Vector3(0, 3, side === 'back' ? -distance : distance)));
  }

  zoom(scale) {
    const delta = this.camera.position.clone().sub(this.controls.target);
    delta.setLength(THREE.MathUtils.clamp(delta.length() * scale, 12, 500));
    this.animateTo(this.controls.target.clone(), this.controls.target.clone().add(delta));
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.anim = null; this.controls.target.copy(target); this.camera.position.copy(position); return;
    }
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
    const mat = new THREE.MeshStandardMaterial({ color: 0xb5c7bb, transparent: true, opacity: 0.045, depthWrite: false, roughness: 1 });
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
    // A body outline also includes the opposite arm for spatial orientation.
    for (const side of [1, -1]) {
      const arm = [[side * 17.5, -4, -2], [side * 19, -28, -2], [side * 21, -51, 0], [side * 21, -64, 0]];
      ghost.add(new THREE.Mesh(profiledTube(arm, 1, t => 4.5 - 2.5 * t, 40, 16).geo, mat));
    }
    this.ghost = ghost;
    ghost.renderOrder = -1;
    this.scene.add(ghost);
  }

  addStructure(s) {
    const group = new THREE.Group();
    group.userData.id = s.id;
    const base = s.color ?? COLORS[s.type];
    const surface = ['bone', 'muscle', 'brain'].includes(s.type) ? surfaceMaps(s.type) : {};
    const mat = new THREE.MeshPhysicalMaterial({
      ...surface, color: base, roughness: s.type === 'bone' ? .72 : s.type === 'muscle' ? .58 : .45,
      metalness: 0, clearcoat: s.type === 'muscle' ? .14 : .05, clearcoatRoughness: .65,
      transparent: true, opacity: 1, side: s.shape?.plate || s.shape?.shells || SHELL.has(s.type) ? THREE.DoubleSide : THREE.FrontSide
    });
    const materials = [mat];
    const add = (geo, material = mat) => { const m = new THREE.Mesh(geo, material); m.userData.id = s.id; group.add(m); };

    if (SOLID.has(s.type)) {
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
        const length = tube.reduce((sum, p, i) => i ? sum + v(p).distanceTo(v(tube[i - 1])) : 0, 0);
        // Finger and toe rays are split into two or three distinct phalanges.
        const segments = s.id === 'phalanges' || s.id === 'toe_phalanges' ? (tube === sh.tubes[0] ? 2 : 3) : 1;
        const curve = new THREE.CatmullRomCurve3(tube.map(v));
        for (let part = 0; part < segments; part++) {
          const pts = segments === 1 ? tube : Array.from({ length: 5 }, (_, j) => {
            const p = curve.getPointAt((part + .035 + j / 4 * .93) / segments); return [-p.x, p.y, p.z];
          });
          add(profiledTube(pts, sh.r, boneProfile(s.id, length / segments), 56, 20).geo);
        }
        for (const end of [tube[0], tube[tube.length - 1]]) {
          const ball = new THREE.SphereGeometry(sh.r * 1.08, 20, 14);
          ball.translate(...v(end).toArray());
          add(ball);
        }
      }
      for (const [c, r] of sh.spheres || []) { const g = new THREE.SphereGeometry(r, 24, 16); g.translate(...v(c).toArray()); add(g); }
      for (const [c, sc] of sh.ellipsoids || []) {
        // The carpus is a pair of rows, rather than a single oval slab.
        if (s.id === 'carpals') {
          for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
            const g = new THREE.SphereGeometry(1, 20, 14);
            g.scale(sc[0] / 4 * .9, sc[1] / 2 * .84, sc[2] * .9);
            g.translate(...v([c[0] + (col - 1.5) * sc[0] / 2, c[1] + (row - .5) * sc[1], c[2] + .15 * Math.sin(col)]).toArray()); add(g);
          }
        } else {
          const g = new THREE.SphereGeometry(1, 32, 22); g.scale(...sc); g.translate(...v(c).toArray()); add(g);
        }
      }
      if (sh.plate) add(plateGeometry(sh.plate));
      for (const [c, radii, lon, lat] of sh.shells || []) add(shellGeometry(c, radii, lon, lat));
    } else if (s.type === 'muscle') {
      const longTendon = /forearm|hand|leg|foot/.test(s.group) && s.insertionBones.some(b => DISTAL_BONES.has(b));
      const tendon = new THREE.MeshPhysicalMaterial({ ...surfaceMaps('tendon'), color: 0xe8ddc5, roughness: .67, transparent: true });
      tendon.userData.tendon = true; materials.push(tendon);
      if (BROAD_MUSCLES.has(s.id) && s.shape.fibers.length > 1) {
        add(muscleSheet(s.shape.fibers, s.shape.r));
      } else for (const f of s.shape.fibers) {
        let len = 0;
        for (let i = 1; i < f.length; i++) len += v(f[i]).distanceTo(v(f[i - 1]));
        const profile = muscleProfile(len, longTendon && len > 14), tubular = 64, radial = 24;
        const { geo } = profiledTube(f, s.shape.r, profile, tubular, radial, true);
        // Each ring has the same topology: retain white attachment ends and the long
        // distal tendon while applying lesion/quiz colours to the entire structure.
        geo.clearGroups();
        let groupStart = 0, materialIndex = profile(.5 / tubular) < .29 ? 1 : 0;
        for (let i = 1; i <= tubular; i++) {
          const nextMaterial = i === tubular ? -1 : profile((i + .5) / tubular) < .29 ? 1 : 0;
          if (nextMaterial !== materialIndex) {
            geo.addGroup(groupStart * radial * 6, (i - groupStart) * radial * 6, materialIndex);
            groupStart = i; materialIndex = nextMaterial;
          }
        }
        add(geo, [mat, tendon]);
      }
    } else {
      // `paths` holds several separate segmental branches drawn as one structure.
      for (const p of s.paths || [s.path]) {
        add(profiledTube(p, s.r, s.type === 'artery' ? (t => 1 - 0.25 * t) : constant, Math.max(12, p.length * 10), 8).geo);
      }
    }

    const box = new THREE.Box3().setFromObject(group);
    this.objects.set(s.id, {
      group, mat, materials, type: s.type, region: s.region, base, centre: box.getCenter(new THREE.Vector3()),
      opacity: SOLID.has(s.type) ? s.shape.opacity ?? 0.45 : s.shape?.opacity ?? 1, size: box.getSize(new THREE.Vector3()).length()
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
    // Central lesions: structures hit by the lesion and the functions it removes.
    const lesionHit = new Set(lesion?.hits || []);
    const lesionFn = lesion ? Object.fromEntries((lesion.functions || []).map(f => [f.id, f.status])) : null;
    const contextOpacity = regionById[this.region]?.contextOpacity ?? 1;

    for (const [id, o] of this.objects) {
      const base = o.base;
      // Organs are translucent; structures borrowed from another region can be faded so they
      // do not hide the region's own structures (e.g. the sternum in front of the heart).
      // Bones may set their own opacity too (the skull vault, so the cranial nerves show through).
      const shell = SHELL.has(o.type);
      const own = SOLID.has(o.type) ? o.opacity
        : o.region === this.region ? o.opacity : o.type === 'bone' ? Math.min(contextOpacity, o.opacity) : o.type === 'muscle' ? Math.min(contextOpacity, 0.3) : 1;
      let color = base, opacity = own, emissive = 0x000000, visible = this.visibleTypes[o.type];

      if (quizTarget) {
        if (id === quizTarget) { color = COLORS.quiz; emissive = 0x0b4f8a; visible = true; opacity = shell ? 0.65 : 1; }
        else opacity = Math.min(own, o.type === 'bone' ? 0.55 : shell ? 0.08 : 0.18);
      } else if (lesion) {
        if (o.type === 'muscle' || o.type === 'organ') {
          const st = lesionStatus[id];
          color = st === 'paralysed' || st === 'denervated' ? COLORS.paralysed
            : st === 'weakened' || st === 'partial' ? COLORS.weakened : COLORS.healthyDim;
          opacity = o.type === 'organ' ? (st ? Math.max(own, 0.5) : 0.12) : st ? 1 : Math.min(own, 0.35);
        } else if (o.type === 'function') {
          const st = lesionFn[id];
          color = st === 'lost' ? COLORS.paralysed : st === 'partial' ? COLORS.weakened : COLORS.healthyDim;
          if (st) visible = true; else opacity = 0.35;
        } else if (o.type === 'brain') {
          if (id === lesion.nerve || lesionHit.has(id)) { color = COLORS.lesionNerve; emissive = 0x2a0070; visible = true; opacity = Math.max(own, 0.55); }
          else if (lesionNerves.has(id)) { color = 0x555555; visible = true; opacity = Math.max(own, 0.45); }
          else opacity = Math.min(own, 0.12);
        } else if (o.type === 'nerve' || o.type === 'tract') {
          if (id === lesion.nerve || lesionHit.has(id)) { color = COLORS.lesionNerve; emissive = 0x3a0090; visible = true; opacity = 1; }
          else if (lesionNerves.has(id)) { color = 0x555555; visible = true; opacity = 1; }
          else opacity = Math.min(own, o.type === 'tract' ? 0.25 : 0.6);
        } else if (o.type === 'artery' && id === lesion.nerve) { color = COLORS.lesionNerve; emissive = 0x3a0090; visible = true; opacity = 1; }
        else if (o.type === 'artery' || o.type === 'vein') opacity = 0.25;
      } else if (selected) {
        if (id === selected) { emissive = glow(base); visible = true; opacity = shell ? Math.min(0.75, own + 0.25) : 1; }
        else if (related.has(id)) {
          visible = true;
          // Muscles wrap bones, so keep a selected bone visible through its attachments.
          if (this.objects.get(selected)?.type === 'bone' && o.type === 'muscle') opacity = 0.4;
        } else opacity = Math.min(own, o.type === 'bone' ? 0.45 : shell ? 0.06 : 0.12);
      }

      o.group.visible = visible && (o.region === this.region || this.context.has(id));
      for (const material of o.materials) {
        const naturalTendon = material.userData.tendon && !lesion && !quizTarget;
        material.color.setHex(naturalTendon ? 0xe8ddc5 : color);
        material.emissive.setHex(naturalTendon ? 0x000000 : emissive);
        material.opacity = opacity;
        material.depthWrite = opacity > 0.5;
      }
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
    const opacity = h => {
      const material = Array.isArray(h.object.material) ? h.object.material[h.face.materialIndex] : h.object.material;
      return material.opacity;
    };
    const solid = hits.find(h => opacity(h) > 0.5);
    const span = new Map(); // organ id -> [entry, exit] distance along the ray
    for (const h of hits) {
      const id = h.object.userData.id;
      if (!SHELL.has(this.objects.get(id).type) || opacity(h) < 0.1) continue;
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
