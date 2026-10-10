// Back and trunk wall: vertebral column, ribs, sternum, spinal nerves and their rami,
// segmental arteries, intrinsic back muscles, thoracic wall, diaphragm and abdominal wall.
// Coordinates: [lateral, superior, anterior] for the right side, in schematic cm (same body
// frame as the limbs; the viewer mirrors x). Bilateral midline bones are modelled whole,
// everything else on the right side only.

const r2 = x => Math.round(x * 100) / 100;
const round = p => p.map(r2);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const add = (a, b) => a.map((x, i) => x + b[i]);
const lerp = (a, b, f) => a.map((x, i) => x + (b[i] - x) * f);

// Spinal segments in craniocaudal order.
const SEGMENTS = [['C', 8], ['T', 12], ['L', 5], ['S', 5]].flatMap(([p, n]) => range(1, n).map(i => p + i));
const segs = (from, to) => SEGMENTS.slice(SEGMENTS.indexOf(from), SEGMENTS.indexOf(to) + 1);

// Height of each vertebral body centre, and the depth of the column (it follows the curves:
// cervical lordosis, thoracic kyphosis, lumbar lordosis).
const Y = {};
[12.6, 10.4, 8.4, 6.6, 4.8, 3, 1.2].forEach((y, i) => { Y['C' + (i + 1)] = y; });
range(1, 12).forEach(n => { Y['T' + n] = -1 - (n - 1) * 2.38; });
range(1, 5).forEach(n => { Y['L' + n] = -30.2 - (n - 1) * 3.1; });
const COLUMN_Z = [[14, -3.4], [8, -2.9], [3, -3.2], [0, -3.9], [-4, -5.2], [-10, -6.8], [-16, -7.4], [-22, -7.1], [-27, -6.5], [-31, -5.8], [-36, -5.3], [-40, -5.7], [-43, -6.6]];
function bodyZ(y) {
  if (y >= COLUMN_Z[0][0]) return COLUMN_Z[0][1];
  for (let i = 1; i < COLUMN_Z.length; i++) {
    const [y0, z0] = COLUMN_Z[i - 1], [y1, z1] = COLUMN_Z[i];
    if (y >= y1) return z0 + (z1 - z0) * (y0 - y) / (y0 - y1);
  }
  return COLUMN_Z[COLUMN_Z.length - 1][1];
}

// Vertebral body half-sizes, transverse process reach and spinous process [drop, length].
const DIMS = {
  C: { body: [1.3, 0.7, 1.1], tx: 2.5, spine: [0.6, 2.2] },
  T: { body: [1.5, 1, 1.3], tx: 3.2, spine: [2, 2] },
  L: { body: [2.1, 1.35, 1.7], tx: 4.2, spine: [0.4, 2.6] }
};
function vert(level) {
  const k = level[0], D = DIMS[k], y = Y[level], z = bodyZ(y);
  const back = z - D.body[2] - 1; // back of the vertebral arch
  const [drop, len] = D.spine;
  const length = level === 'C7' ? 3.4 : level === 'C2' ? 2.6 : len;
  const tz = k === 'C' ? z - 0.4 : k === 'T' ? z - D.body[2] - 0.8 : z - D.body[2] + 0.4;
  return { y, z, body: D.body, back, tip: round([0, y - drop, back - length]), tx: D.tx, tz };
}
// A point along the spinous process (f = 0 at the arch, 1 at the tip).
const spinous = (level, f, x = 0) => { const v = vert(level); return round(add(lerp([0, v.y, v.back], v.tip, f), [x, 0, 0])); };

function vertebrae(levels) {
  const ellipsoids = [], tubes = [];
  for (const l of levels) {
    if (l === 'C1') continue; // the atlas is a ring, added separately
    const v = vert(l);
    ellipsoids.push([round([0, v.y, v.z]), v.body]);
    tubes.push([round([-v.tx, v.y, v.tz]), round([0, v.y, v.back]), round([v.tx, v.y, v.tz])], [round([0, v.y, v.back]), v.tip]);
  }
  return { ellipsoids, tubes };
}

// Ribs. Rib 7 is the template: head, tubercle, angle, lateral, anterolateral, anterior end.
// Each rib is scaled to its width and depth and drops by RIB_DROP from head to front.
const RIB_TEMPLATE = [[6, -10.6, 0.1], [10.2, -8.4, 0.25], [12.6, -3.2, 0.5], [11, 2.6, 0.78], [7.4, 4.4, 1]]; // [x, z, share of drop]
const RIB_W = [6.6, 9, 10.6, 11.6, 12.2, 12.5, 12.6, 12.6, 12.4, 12, 11.2, 10];
const RIB_SZ = [0.62, 0.8, 0.9, 0.96, 1, 1, 1, 1, 0.98, 0.96, 0.92, 0.9];
const RIB_DROP = [1.6, 4.4, 5.8, 6.8, 7.6, 8.2, 8.6, 8.8, 8.8, 8.4, 7, 4.6];
const RIB_LAST = [6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 4, 3]; // floating and lower ribs end earlier
function ribPoints(k) {
  const yH = Y['T' + k] + 0.6, zH = bodyZ(yH);
  const sx = (RIB_W[k - 1] - 3.2) / 9.4, sz = RIB_SZ[k - 1], last = RIB_LAST[k - 1];
  const tLast = RIB_TEMPLATE[last - 2][2];
  const pts = [[1.4, yH, zH - 0.4], [3.2, yH - 0.2, zH - 2.1]];
  for (let i = 2; i <= last; i++) {
    const [x, z, t] = RIB_TEMPLATE[i - 2];
    pts.push([3.2 + (x - 3.2) * sx, yH - RIB_DROP[k - 1] * t / tLast, -3.2 + (z + 3.2) * sz]);
  }
  return pts.map(round);
}
const RIBS = range(1, 12).map(ribPoints);
// Point at fractional index u along a polyline; null beyond its end.
function along(pts, u) {
  if (u < 0 || u > pts.length - 1) return null;
  const i = Math.min(Math.floor(u), pts.length - 2);
  return lerp(pts[i], pts[i + 1], u - i);
}
const ribPoint = (k, u) => along(RIBS[k - 1], u);
// Scale a point towards (f < 1) or away from (f > 1) the long axis of the trunk.
const radial = (p, f) => round([p[0] * f, p[1], -3.2 + (p[2] + 3.2) * f]);

const STERNUM_Y = [-1.4, -4.6, -7, -9.4, -11.8, -14.2, -16.4]; // where cartilages 1-7 meet it
const sternumZ = y => y > -4.6 ? 2.2 + (-y / 4.6) * 1.2 : 3.4 + ((-4.6 - y) / 12.2) * 1.4;
const CARTILAGES = [];
for (let k = 1; k <= 7; k++) {
  const end = RIBS[k - 1][6], y = STERNUM_Y[k - 1];
  const st = [k === 7 ? 1.2 : 1.6, y, sternumZ(y) - 0.5];
  CARTILAGES.push([end, add(lerp(end, st, 0.5), [0, k >= 5 ? -0.6 : 0, 0.4]), st].map(round));
}
for (let k = 8; k <= 10; k++) {
  const end = RIBS[k - 1][RIBS[k - 1].length - 1], join = along(CARTILAGES[k - 2], 0.8);
  CARTILAGES.push([end, add(lerp(end, join, 0.5), [0, -0.8, 0.6]), join].map(round));
}

// Spinal nerves: where each forms in its intervertebral foramen, and where its rami start.
function exitY(seg) {
  const p = seg[0], n = +seg.slice(1);
  if (p === 'S') return [-46, -48.6, -51.2, -53.6, -56][n - 1];
  if (p === 'C') {
    if (n === 1) return 13.8;
    if (n === 8) return (Y.C7 + Y.T1) / 2;
    return (Y['C' + (n - 1)] + Y['C' + n]) / 2;
  }
  if (p === 'T') return (Y['T' + n] + (n === 12 ? Y.L1 : Y['T' + (n + 1)])) / 2;
  return n === 5 ? -44.2 : (Y['L' + n] + Y['L' + (n + 1)]) / 2;
}
function nerveStart(seg) {
  const y = exitY(seg);
  if (seg[0] === 'S') return round([1.2, y, -8.4]);
  return round([1.4, y, bodyZ(y) - { C: 1.1, T: 1.5, L: 1.8 }[seg[0]]]);
}
const spinalEnd = s => round(add(nerveStart(s), s[0] === 'S' ? [0.8, 0, -0.4] : [1.3, 0, -0.2]));
const dorsalEnd = s => round(add(spinalEnd(s), s[0] === 'S' ? [0.4, -0.3, -1.4] : [0.2, -0.3, -1.8]));

// Intercostal nerve k along the lower border of its rib.
function intercostalPath(k) {
  const pts = [spinalEnd('T' + k)];
  const last = RIBS[k - 1].length - 1;
  for (let u = 1.3; u <= last; u += 1) pts.push(radial(add(ribPoint(k, u), [0, -0.6, 0]), 0.97));
  return pts;
}
const ANTERIOR_END = {
  7: [[3, -22, 5.8]], 8: [[8.4, -26.6, 5.6], [3.4, -27, 6.4]], 9: [[9, -30, 5.2], [3.6, -31.5, 6.8]],
  10: [[9.6, -34, 4.6], [3.6, -37, 7.2]], 11: [[10.4, -37, 3.4], [3.6, -41.6, 7.4]]
};

// ---------------------------------------------------------------- bones
const atlasRing = range(0, 8).map(i => { const a = i * Math.PI / 4; return round([2.1 * Math.cos(a), 12.6, -4 + 2.4 * Math.sin(a)]); });
const cervical = vertebrae(segs('C1', 'C7'));
cervical.tubes.push(atlasRing, [[2.1, 12.6, -4], [3.8, 12.6, -4.2]], [[-2.1, 12.6, -4], [-3.8, 12.6, -4.2]], [[0, 10.4, -2.5], [0, 13.2, -2.4]]);
const thoracic = vertebrae(segs('T1', 'T12'));
const lumbar = vertebrae(segs('L1', 'L5'));

const STERNUM_OUTLINE = [[0, 0, 2], [1.6, 0.2, 2.1], [2.8, -1.2, 2.5], [2.2, -4.4, 3.3], [1.9, -6, 3.6], [2.2, -12, 4.4], [1.6, -16.6, 4.8], [0.7, -17.4, 4.8], [0.5, -19.8, 4.3]];

const bones = [
  { id: 'occipital_bone', type: 'bone', name: { en: 'Occipital bone', de: 'Hinterhauptsbein', la: 'Os occipitale' },
    info: { en: 'Forms the back and base of the skull around the foramen magnum, where the medulla oblongata continues into the spinal cord. Its condyles articulate with the atlas (atlanto-occipital joint: nodding). The external occipital protuberance and the superior and inferior nuchal lines anchor trapezius, semispinalis capitis and the suboccipital muscles.',
      de: 'Bildet Hinterhaupt und Teil der Schädelbasis um das Foramen magnum, an dem die Medulla oblongata in das Rückenmark übergeht. Seine Kondylen artikulieren mit dem Atlas (oberes Kopfgelenk: Nicken). Protuberantia occipitalis externa sowie Linea nuchalis superior und inferior dienen M. trapezius, M. semispinalis capitis und den kurzen Nackenmuskeln als Ansatz.' },
    shape: { ellipsoids: [[[0, 19.8, -6.2], [5.2, 5.8, 3]]], spheres: [[[0, 19.6, -9.2], 0.5]], tubes: [[[-4.4, 18.4, -7.7], [0, 19.4, -9.3], [4.4, 18.4, -7.7]], [[-3.6, 16.6, -7.75], [0, 17, -8.9], [3.6, 16.6, -7.75]]], r: 0.2 } },
  { id: 'cervical_vertebrae', type: 'bone', name: { en: 'Cervical vertebrae (C1–C7)', de: 'Halswirbel (C1–C7)', la: 'Vertebrae cervicales' },
    info: { en: 'Small bodies, a transverse foramen in each transverse process for the vertebral artery (C6–C1) and split spinous processes. The atlas (C1) is a ring without a body; the axis (C2) carries the dens, around which the atlas turns (head rotation). C7 (vertebra prominens) has the longest spinous process, the first one you feel at the base of the neck. Cervical nerves C1–C7 leave above the vertebra of the same number, C8 below C7.',
      de: 'Kleine Wirbelkörper, ein Foramen transversarium in jedem Querfortsatz für die A. vertebralis (C6–C1) und gespaltene Dornfortsätze. Der Atlas (C1) ist ein Ring ohne Wirbelkörper; der Axis (C2) trägt den Dens, um den sich der Atlas dreht (Kopfdrehung). C7 (Vertebra prominens) hat den längsten Dornfortsatz, den ersten, den man am Nackenansatz tastet. Die Halsnerven C1–C7 treten oberhalb des gleichnamigen Wirbels aus, C8 unterhalb von C7.' },
    shape: { ...cervical, r: 0.32 } },
  { id: 'thoracic_vertebrae', type: 'bone', name: { en: 'Thoracic vertebrae (T1–T12)', de: 'Brustwirbel (Th1–Th12)', la: 'Vertebrae thoracicae' },
    info: { en: 'Articulate with the ribs at facets on their bodies and transverse processes. The long spinous processes point steeply down and overlap like roof tiles, so each tip lies at the level of the vertebral body below. The thoracic spine is the least mobile part of the column (the rib cage stiffens it) and the commonest site of osteoporotic compression fractures.',
      de: 'Artikulieren über Gelenkflächen an Wirbelkörpern und Querfortsätzen mit den Rippen. Die langen Dornfortsätze zeigen steil nach unten und überlappen dachziegelartig, jede Spitze liegt daher auf Höhe des nächsttieferen Wirbelkörpers. Die Brustwirbelsäule ist der am wenigsten bewegliche Abschnitt (der Brustkorb versteift sie) und der häufigste Ort osteoporotischer Wirbelkörperfrakturen.' },
    shape: { ...thoracic, r: 0.36 } },
  { id: 'lumbar_vertebrae', type: 'bone', name: { en: 'Lumbar vertebrae (L1–L5)', de: 'Lendenwirbel (L1–L5)', la: 'Vertebrae lumbales' },
    info: { en: 'The largest vertebral bodies, carrying the weight of the upper body. The spinal cord ends at about L1/L2 (conus medullaris); below it the cauda equina floats in cerebrospinal fluid, so lumbar puncture is done at L3/L4 or L4/L5 (the line between the iliac crests crosses L4). The discs L4/L5 and L5/S1 herniate most often; a lumbar disc usually presses on the root that exits one level lower (L4/L5 → L5).',
      de: 'Die größten Wirbelkörper, sie tragen das Gewicht des Oberkörpers. Das Rückenmark endet etwa bei L1/L2 (Conus medullaris); darunter schwimmt die Cauda equina im Liquor, daher punktiert man bei L3/L4 oder L4/L5 (die Verbindungslinie der Beckenkämme kreuzt L4). Die Bandscheiben L4/L5 und L5/S1 fallen am häufigsten vor; ein lumbaler Vorfall drückt meist auf die Wurzel, die ein Segment tiefer austritt (L4/L5 → L5).' },
    shape: { ...lumbar, r: 0.42 } },
  { id: 'ribs', type: 'bone', name: { en: 'Ribs and costal cartilages', de: 'Rippen und Rippenknorpel', la: 'Costae et cartilagines costales' },
    info: { en: 'Twelve pairs. Ribs 1–7 reach the sternum with their own cartilage (true ribs); the cartilages of 8–10 join the one above and form the costal margin; 11 and 12 end free in the flank (floating ribs). Each rib articulates with the spine at its head and tubercle. The intercostal vein, artery and nerve (VAN, top to bottom) run in the groove on the lower border, so a pleural tap or chest drain goes in just above a rib.',
      de: 'Zwölf Paare. Die Rippen 1–7 erreichen das Sternum mit eigenem Knorpel (echte Rippen); die Knorpel von 8–10 schließen sich dem darüberliegenden an und bilden den Rippenbogen; 11 und 12 enden frei in der Flanke. Jede Rippe artikuliert über Kopf und Tuberculum mit der Wirbelsäule. Interkostalvene, -arterie und -nerv (VAN, von oben nach unten) verlaufen im Sulcus costae am Unterrand, daher sticht man bei Pleurapunktion oder Thoraxdrainage am Oberrand einer Rippe ein.' },
    shape: { tubes: [...RIBS, ...CARTILAGES], r: 0.4 } },
  { id: 'sternum', type: 'bone', name: { en: 'Sternum', de: 'Brustbein', la: 'Sternum' },
    info: { en: 'Manubrium, body and xiphoid process. The sternal angle between manubrium and body is palpable and marks the second rib, the usual starting point for counting ribs. Chest compressions in CPR press on its lower half; it is also a site for bone marrow aspiration.',
      de: 'Manubrium, Corpus und Processus xiphoideus. Der tastbare Angulus sterni (Louis-Winkel) zwischen Manubrium und Corpus markiert die 2. Rippe, den üblichen Ausgangspunkt zum Abzählen der Rippen. Bei der Herzdruckmassage drückt man auf seine untere Hälfte; es ist auch ein Ort für die Knochenmarkpunktion.' },
    shape: {
      plate: [...STERNUM_OUTLINE, ...STERNUM_OUTLINE.slice(1, -1).reverse().map(([x, y, z]) => [-x, y, z])],
      tubes: [[[0, -0.6, 2.3], [0, -4.6, 3.3], [0, -16.8, 4.6], [0, -19.4, 4.2]]], r: 0.5
    } }
];

// ---------------------------------------------------------------- nerves
const N = (id, group, segList, parents, name, info, extra) => ({ id, type: 'nerve', group, segs: segList, parents, name, info, ...extra });
const stubs = (list, f) => list.map(f);

const nerves = [
  N('sn_cervical', 'spinal', segs('C1', 'C8'), [], { en: 'Cervical spinal nerves (C1–C8)', de: 'Zervikale Spinalnerven (C1–C8)', la: 'Nervi spinales cervicales' },
    { en: 'Eight pairs, although there are only seven cervical vertebrae: C1 leaves above the atlas, C8 below C7. Each spinal nerve is only about 1 cm long: it forms from the dorsal (sensory) and ventral (motor) roots in the intervertebral foramen and divides at once into a dorsal and a ventral ramus. Ventral rami C1–C4 form the cervical plexus, C5–T1 the brachial plexus.',
      de: 'Acht Paare, obwohl es nur sieben Halswirbel gibt: C1 tritt oberhalb des Atlas aus, C8 unterhalb von C7. Jeder Spinalnerv ist nur etwa 1 cm lang: Er entsteht im Foramen intervertebrale aus Hinter- (sensibel) und Vorderwurzel (motorisch) und teilt sich sofort in einen Ramus posterior und einen Ramus anterior. Die Rami anteriores C1–C4 bilden den Plexus cervicalis, C5–Th1 den Plexus brachialis.' },
    { lesion: { en: 'A cervical disc herniation (most often C5/C6 or C6/C7) presses on the root that exits at that level (C6 or C7): neck and arm pain in its dermatome, weak key muscles, reduced reflex (biceps C5/C6, triceps C7).',
      de: 'Ein zervikaler Bandscheibenvorfall (meist C5/C6 oder C6/C7) drückt auf die dort austretende Wurzel (C6 bzw. C7): Nacken- und Armschmerz im Dermatom, Schwäche der Kennmuskeln, abgeschwächter Reflex (Bizeps C5/C6, Trizeps C7).' },
      paths: stubs(segs('C1', 'C8'), s => [nerveStart(s), spinalEnd(s)]), r: 0.3 }),
  N('sn_thoracic', 'spinal', segs('T1', 'T12'), [], { en: 'Thoracic spinal nerves (T1–T12)', de: 'Thorakale Spinalnerven (Th1–Th12)', la: 'Nervi spinales thoracici' },
    { en: 'Twelve pairs, each leaving below the vertebra of the same number. They form no plexus: each ventral ramus runs on its own as an intercostal nerve, so the trunk keeps its segmental band pattern of dermatomes (T4 at the nipple, T10 at the umbilicus).',
      de: 'Zwölf Paare, jedes tritt unterhalb des gleichnamigen Wirbels aus. Sie bilden keinen Plexus: Jeder Ramus anterior verläuft einzeln als Interkostalnerv, daher bleibt am Rumpf die gürtelförmige Anordnung der Dermatome erhalten (Th4 Mamille, Th10 Nabel).' },
    { lesion: { en: 'Herpes zoster (shingles): varicella virus dormant in a spinal ganglion reactivates and causes a painful band of blisters in one dermatome that stops at the midline. A thoracic root is affected most often.',
      de: 'Herpes zoster (Gürtelrose): Das in einem Spinalganglion ruhende Varizellavirus wird reaktiviert und verursacht ein schmerzhaftes Bläschenband in einem Dermatom, das an der Mittellinie endet. Am häufigsten ist eine thorakale Wurzel betroffen.' },
      paths: stubs(segs('T1', 'T12'), s => [nerveStart(s), spinalEnd(s)]), r: 0.3 }),
  N('sn_lumbar', 'spinal', segs('L1', 'L5'), [], { en: 'Lumbar spinal nerves (L1–L5)', de: 'Lumbale Spinalnerven (L1–L5)', la: 'Nervi spinales lumbales' },
    { en: 'Five pairs. Their roots run down as the cauda equina from the end of the spinal cord (about L1/L2) to their foramina. The ventral rami form the lumbar plexus (see Lower limb); the dorsal rami supply the lower back.',
      de: 'Fünf Paare. Ihre Wurzeln ziehen als Cauda equina vom Ende des Rückenmarks (etwa L1/L2) zu ihren Foramina. Die Rami anteriores bilden den Plexus lumbalis (siehe Untere Extremität); die Rami posteriores versorgen den unteren Rücken.' },
    { lesion: { en: 'Cauda equina syndrome (e.g. a large central disc herniation): pain and weakness in both legs, saddle anaesthesia, bladder and bowel dysfunction. A surgical emergency.',
      de: 'Kauda-equina-Syndrom (z. B. großer medialer Bandscheibenvorfall): Schmerzen und Schwäche in beiden Beinen, Reithosenanästhesie, Blasen- und Mastdarmstörung. Ein chirurgischer Notfall.' },
      paths: stubs(segs('L1', 'L5'), s => [nerveStart(s), spinalEnd(s)]), r: 0.32 }),
  N('sn_sacral', 'spinal', segs('S1', 'S5'), [], { en: 'Sacral spinal nerves (S1–S5)', de: 'Sakrale Spinalnerven (S1–S5)', la: 'Nervi spinales sacrales' },
    { en: 'Divide inside the sacral canal: the ventral rami leave through the anterior sacral foramina (sacral plexus), the dorsal rami through the posterior foramina to the skin over the sacrum and buttock.',
      de: 'Teilen sich im Canalis sacralis: Die Rami anteriores verlassen ihn durch die Foramina sacralia anteriora (Plexus sacralis), die Rami posteriores durch die Foramina sacralia posteriora zur Haut über Kreuzbein und Gesäß.' },
    { paths: stubs(segs('S1', 'S5'), s => [nerveStart(s), spinalEnd(s)]), r: 0.26 }),

  N('dr_cervical', 'dorsal', segs('C1', 'C8'), ['sn_cervical'], { en: 'Dorsal rami of the cervical nerves', de: 'Rami posteriores der Zervikalnerven', la: 'Rami posteriores nervorum cervicalium' },
    { en: 'Run backwards around the articular processes to the deep neck muscles and the skin of the back of the neck and head. C1 (suboccipital nerve) is purely motor; C2 forms the greater occipital nerve, C3 the third occipital nerve.',
      de: 'Ziehen um die Gelenkfortsätze nach hinten zu den tiefen Nackenmuskeln und zur Haut von Nacken und Hinterkopf. C1 (N. suboccipitalis) ist rein motorisch; aus C2 entsteht der N. occipitalis major, aus C3 der N. occipitalis tertius.' },
    { paths: stubs(segs('C1', 'C8'), s => [spinalEnd(s), dorsalEnd(s)]), r: 0.2 }),
  N('dr_thoracic', 'dorsal', segs('T1', 'T12'), ['sn_thoracic'], { en: 'Dorsal rami of the thoracic nerves', de: 'Rami posteriores der Thorakalnerven', la: 'Rami posteriores nervorum thoracicorum' },
    { en: 'Each divides into a medial and a lateral branch to the intrinsic back muscles and a strip of back skin. On the back their dermatomes lie lower than the vertebra they come from.',
      de: 'Jeder teilt sich in einen Ramus medialis und lateralis zu den autochthonen Rückenmuskeln und einem Hautstreifen des Rückens. Am Rücken liegen ihre Dermatome tiefer als der zugehörige Wirbel.' },
    { paths: stubs(segs('T1', 'T12'), s => [spinalEnd(s), dorsalEnd(s)]), r: 0.2 }),
  N('dr_lumbar', 'dorsal', segs('L1', 'L5'), ['sn_lumbar'], { en: 'Dorsal rami of the lumbar nerves', de: 'Rami posteriores der Lumbalnerven', la: 'Rami posteriores nervorum lumbalium' },
    { en: 'Supply the lumbar part of the erector spinae and multifidus. The lateral branches of L1–L3 cross the iliac crest as the superior cluneal nerves.',
      de: 'Versorgen den lumbalen Anteil des M. erector spinae und den M. multifidus. Die Rami laterales von L1–L3 ziehen als Nn. clunium superiores über den Beckenkamm.' },
    { paths: stubs(segs('L1', 'L5'), s => [spinalEnd(s), dorsalEnd(s)]), r: 0.22 }),
  N('dr_sacral', 'dorsal', segs('S1', 'S5'), ['sn_sacral'], { en: 'Dorsal rami of the sacral nerves', de: 'Rami posteriores der Sakralnerven', la: 'Rami posteriores nervorum sacralium' },
    { en: 'Leave through the posterior sacral foramina. They supply the lowest multifidus fibres and, as the middle cluneal nerves, the skin over the sacrum and medial buttock.',
      de: 'Treten durch die Foramina sacralia posteriora aus. Sie versorgen die untersten Fasern des M. multifidus und als Nn. clunium medii die Haut über Kreuzbein und medialem Gesäß.' },
    { paths: stubs(segs('S1', 'S5'), s => [spinalEnd(s), dorsalEnd(s)]), r: 0.18 }),
  N('n_suboccipital', 'dorsal', ['C1'], ['dr_cervical'], { en: 'Suboccipital nerve', de: 'Nervus suboccipitalis', la: 'Nervus suboccipitalis' },
    { en: 'Dorsal ramus of C1. Leaves between the occipital bone and the atlas, above the vertebral artery, into the suboccipital triangle. Purely motor: C1 has no dermatome.',
      de: 'Ramus posterior von C1. Tritt zwischen Hinterhauptsbein und Atlas oberhalb der A. vertebralis in das Trigonum suboccipitale. Rein motorisch: C1 hat kein Dermatom.' },
    { path: [[1.6, 13.6, -4.6], [2.2, 13.8, -6], [2.6, 13.6, -7.2]], r: 0.16 }),
  N('n_greater_occipital', 'dorsal', ['C2'], ['dr_cervical'], { en: 'Greater occipital nerve', de: 'Nervus occipitalis major', la: 'Nervus occipitalis major' },
    { en: 'Medial branch of the dorsal ramus of C2. Winds around the lower border of obliquus capitis inferior, pierces semispinalis capitis and the trapezius tendon 2–3 cm from the midline and supplies the skin of the back of the head up to the vertex.',
      de: 'Ramus medialis des Ramus posterior von C2. Windet sich um den Unterrand des M. obliquus capitis inferior, durchbohrt M. semispinalis capitis und Trapeziussehne 2–3 cm neben der Mittellinie und versorgt die Haut des Hinterkopfs bis zum Scheitel.' },
    { lesion: { en: 'Occipital neuralgia: shooting pain from the neck over the back of the head and tenderness where the nerve pierces the fascia; treated with a nerve block at that point.',
      de: 'Okzipitalneuralgie: einschießende Schmerzen vom Nacken über den Hinterkopf und Druckschmerz am Nervenaustrittspunkt; Behandlung mit einer Nervenblockade an dieser Stelle.' },
      path: [[2.2, 11.4, -5.4], [2.6, 11, -7.4], [2.2, 13, -8.6], [2.2, 16, -9.2], [2.8, 20, -9.8], [3.2, 25, -9.2]], r: 0.16 }),
  N('n_medial_branches', 'dorsal', segs('C2', 'S3'), ['dr_cervical', 'dr_thoracic', 'dr_lumbar', 'dr_sacral'], { en: 'Medial branches of the dorsal rami', de: 'Rami mediales der Rami posteriores', la: 'Rami mediales ramorum posteriorum' },
    { en: 'Supply the medial tract of the intrinsic back muscles (spinalis, semispinalis, multifidus, rotatores, interspinales) and the facet joints, two joints per branch.',
      de: 'Versorgen den medialen Trakt der autochthonen Rückenmuskeln (Mm. spinales, semispinales, multifidi, rotatores, interspinales) und die Wirbelbogengelenke (Facettengelenke), je zwei Gelenke pro Ast.' },
    { lesion: { en: 'Facet joint pain is treated by numbing or heating these branches (radiofrequency denervation). Losing several neighbouring levels weakens the segmental stabilisers, above all multifidus.',
      de: 'Facettengelenkschmerzen werden durch Betäubung oder Verödung dieser Äste behandelt (Radiofrequenz-Denervation). Fallen mehrere benachbarte Segmente aus, sind die segmentalen Stabilisatoren geschwächt, vor allem der M. multifidus.' },
      paths: stubs(segs('C2', 'S3'), s => [dorsalEnd(s), round(add(dorsalEnd(s), [-1.3, -1.1, -1.1]))]), r: 0.12 }),
  N('n_lateral_branches', 'dorsal', segs('C2', 'S3'), ['dr_cervical', 'dr_thoracic', 'dr_lumbar', 'dr_sacral'], { en: 'Lateral branches of the dorsal rami', de: 'Rami laterales der Rami posteriores', la: 'Rami laterales ramorum posteriorum' },
    { en: 'Supply the lateral tract of the intrinsic back muscles (iliocostalis, longissimus, splenius, levatores costarum) and, in the lower trunk, the skin of the back. The lumbar and sacral ones continue as the cluneal nerves to the buttock.',
      de: 'Versorgen den lateralen Trakt der autochthonen Rückenmuskeln (Mm. iliocostalis, longissimus, splenius, levatores costarum) und in der unteren Rumpfhälfte die Rückenhaut. Die lumbalen und sakralen setzen sich als Nn. clunium zum Gesäß fort.' },
    { paths: stubs(segs('C2', 'S3'), s => [dorsalEnd(s), round(add(dorsalEnd(s), s[0] === 'C' ? [0.6, -1, -1.6] : [1.8, -1.5, -1.6]))]), r: 0.12 }),
  N('n_superior_cluneal', 'dorsal', segs('L1', 'L3'), ['n_lateral_branches'], { en: 'Superior cluneal nerves', de: 'Nervi clunium superiores', la: 'Nervi clunium superiores' },
    { en: 'Lateral branches of the dorsal rami of L1–L3. Cross the iliac crest about 7 cm from the midline to the skin of the upper buttock.',
      de: 'Rami laterales der Rami posteriores von L1–L3. Überqueren den Beckenkamm etwa 7 cm neben der Mittellinie zur Haut des oberen Gesäßes.' },
    { lesion: { en: 'Can be trapped where they pierce the fascia over the iliac crest: low back and buttock pain that imitates a disc problem. At risk when bone is harvested from the posterior iliac crest.',
      de: 'Können beim Durchtritt durch die Faszie über dem Beckenkamm eingeklemmt werden: Kreuz- und Gesäßschmerz, der einen Bandscheibenvorfall nachahmt. Gefährdet bei Knochenentnahme am hinteren Beckenkamm.' },
      paths: segs('L1', 'L3').map((s, i) => { const d = add(dorsalEnd(s), [1.8, -1.5, -1.6]); return [round(d), [5.6 + i * 0.6, -38 - i, -11.4], [6.8 + i * 0.8, -42 - i, -11], [7.6 + i, -47 - i, -11.6]]; }), r: 0.12 }),
  N('n_middle_cluneal', 'dorsal', segs('S1', 'S3'), ['n_lateral_branches'], { en: 'Middle cluneal nerves', de: 'Nervi clunium medii', la: 'Nervi clunium medii' },
    { en: 'Lateral branches of the dorsal rami of S1–S3. Leave the posterior sacral foramina to the skin over the sacrum and medial buttock. (The inferior cluneal nerves come from the posterior femoral cutaneous nerve of the sacral plexus.)',
      de: 'Rami laterales der Rami posteriores von S1–S3. Ziehen aus den Foramina sacralia posteriora zur Haut über Kreuzbein und medialem Gesäß. (Die Nn. clunium inferiores stammen aus dem N. cutaneus femoris posterior des Plexus sacralis.)' },
    { paths: segs('S1', 'S3').map(s => { const d = add(dorsalEnd(s), [1.8, -1.5, -1.6]); return [round(d), round(add(d, [2.2, -1.4, -0.6])), round(add(d, [4.4, -2.2, -0.8]))]; }), r: 0.12 }),

  N('n_phrenic', 'ventral', ['C3', 'C4', 'C5'], ['sn_cervical'], { en: 'Phrenic nerve', de: 'Nervus phrenicus', la: 'Nervus phrenicus' },
    { en: 'From the cervical plexus (C3–C5, mainly C4). Runs down on scalenus anterior, enters the thorax behind the subclavian vein and passes in front of the lung root on the pericardium to the diaphragm. The only motor nerve of the diaphragm; also sensory to the pericardium, the mediastinal and diaphragmatic pleura and the peritoneum under the diaphragm. "C3, 4, 5 keeps the diaphragm alive."',
      de: 'Aus dem Plexus cervicalis (C3–C5, vor allem C4). Zieht auf dem M. scalenus anterior abwärts, tritt hinter der V. subclavia in den Thorax und verläuft vor der Lungenwurzel auf dem Perikard zum Zwerchfell. Einziger motorischer Nerv des Zwerchfells; sensibel für Perikard, mediastinale und diaphragmale Pleura und das Peritoneum unter dem Zwerchfell.' },
    { lesion: { en: 'The paralysed half of the diaphragm rises on the chest X-ray and moves paradoxically upwards on sniffing; breathless when lying flat. A spinal cord injury above C3 stops breathing. Irritation of the diaphragm (gallbladder, spleen, blood) is felt as shoulder-tip pain, because C4 also supplies the skin over the shoulder.',
      de: 'Die gelähmte Zwerchfellhälfte steht im Röntgenbild hoch und bewegt sich beim Schnupfversuch paradox nach oben; Atemnot im Liegen. Eine Rückenmarksverletzung oberhalb von C3 führt zum Atemstillstand. Eine Reizung des Zwerchfells (Gallenblase, Milz, Blut) wird als Schulterschmerz empfunden, weil C4 auch die Haut über der Schulter versorgt.' },
      // Right and left nerve; the left one curves around the apex of the heart on the pericardium.
      paths: [
        [spinalEnd('C4'), [3.4, 4, -2], [3.2, 0, -0.6], [3.6, -6, 0], [4.6, -12, 0.2], [5.2, -16.6, -0.8]],
        [[-spinalEnd('C4')[0], ...spinalEnd('C4').slice(1)], [-3.4, 4, -2], [-3.0, 0, -0.4], [-3.2, -4, 0], [-3.6, -7.4, 0.2], [-5.6, -10, 1.0], [-6.4, -14, 1.0], [-6.4, -17.4, 0]]
      ], r: 0.2 }),
  N('n_intercostal_upper', 'ventral', segs('T1', 'T6'), ['sn_thoracic'], { en: 'Intercostal nerves 1–6', de: 'Nervi intercostales 1–6', la: 'Nervi intercostales I–VI' },
    { en: 'Ventral rami of T1–T6. Each runs in the groove below its rib, between the internal and innermost intercostal muscles, below the vein and artery. Lateral cutaneous branches come out in the midaxillary line, anterior cutaneous branches beside the sternum. They supply the intercostal muscles and the skin of the chest (T4 at the nipple). The second also gives the intercostobrachial nerve to the medial upper arm.',
      de: 'Rami anteriores von Th1–Th6. Jeder verläuft im Sulcus costae unter seiner Rippe zwischen Mm. intercostales interni und intimi, unterhalb von Vene und Arterie. Rami cutanei laterales treten in der mittleren Axillarlinie aus, Rami cutanei anteriores neben dem Sternum. Sie versorgen die Interkostalmuskeln und die Haut der Brust (Th4 an der Mamille). Der 2. gibt zudem den N. intercostobrachialis zur Innenseite des Oberarms ab.' },
    { lesion: { en: 'Intercostal neuralgia after a rib fracture, thoracotomy or herpes zoster: band-like pain around the chest. Intercostal nerve blocks are placed under the lower border of the rib.',
      de: 'Interkostalneuralgie nach Rippenfraktur, Thorakotomie oder Herpes zoster: gürtelförmiger Schmerz um den Brustkorb. Interkostalblockaden setzt man am Unterrand der Rippe.' },
      paths: range(1, 6).map(k => [...intercostalPath(k), round([2.4, STERNUM_Y[k - 1] - 0.6, sternumZ(STERNUM_Y[k - 1] - 0.6) + 0.1])]), r: 0.17 }),
  N('n_thoracoabdominal', 'ventral', segs('T7', 'T11'), ['sn_thoracic'], { en: 'Thoracoabdominal nerves (intercostal nerves 7–11)', de: 'Nervi thoracoabdominales (Interkostalnerven 7–11)', la: 'Nervi intercostales VII–XI' },
    { en: 'Ventral rami of T7–T11. Leave their intercostal spaces at the costal margin and run forwards between internal oblique and transversus abdominis into the rectus sheath. They supply the abdominal wall muscles and skin (T7 at the xiphoid, T10 at the umbilicus) and carry pain from the parietal peritoneum.',
      de: 'Rami anteriores von Th7–Th11. Verlassen ihren Interkostalraum am Rippenbogen und ziehen zwischen M. obliquus internus und M. transversus abdominis nach vorn in die Rektusscheide. Sie versorgen Bauchwandmuskeln und Bauchhaut (Th7 am Xiphoid, Th10 am Nabel) und leiten Schmerz vom parietalen Peritoneum.' },
    { lesion: { en: 'Because they run obliquely, a long vertical incision lateral to the rectus cuts several of them: the denervated part of rectus abdominis wastes and an incisional hernia can follow. Midline and transverse incisions spare them. The abdominal skin reflexes (T8–T12) test these segments.',
      de: 'Da sie schräg verlaufen, durchtrennt ein langer vertikaler Schnitt lateral des M. rectus mehrere von ihnen: Der denervierte Teil des M. rectus abdominis atrophiert, eine Narbenhernie kann folgen. Mediane und quere Schnitte schonen sie. Die Bauchhautreflexe (Th8–Th12) prüfen diese Segmente.' },
      paths: range(7, 11).map(k => [...intercostalPath(k), ...ANTERIOR_END[k]]), r: 0.17 }),
  N('n_subcostal', 'ventral', ['T12'], ['sn_thoracic'], { en: 'Subcostal nerve', de: 'Nervus subcostalis', la: 'Nervus subcostalis' },
    { en: 'Ventral ramus of T12, below the 12th rib. Runs behind the kidney across quadratus lumborum, then forwards in the abdominal wall to the skin above the pubis; its lateral cutaneous branch crosses the iliac crest to the hip.',
      de: 'Ramus anterior von Th12 unterhalb der 12. Rippe. Zieht hinter der Niere über den M. quadratus lumborum und dann in der Bauchwand nach vorn zur Haut oberhalb der Symphyse; sein Ramus cutaneus lateralis zieht über den Beckenkamm zur Hüfte.' },
    { path: [...intercostalPath(12).slice(0, 3), [10.6, -34.6, -3.6], [11.6, -39, 1.4], [7.6, -44, 6.6], [3.8, -46, 7.4]], r: 0.17 })
];

// ---------------------------------------------------------------- arteries
const A = (id, parents, name, info, extra) => ({ id, type: 'artery', parents, name, info, ...extra });
const segmentalStart = y => { const z = bodyZ(y); return [[-1.4, y - 0.4, z + 1.8], [0.6, y - 0.2, z + 1.5], [1.9, y, z + 0.2], [2.5, y, z - 1.5]].map(round); };
const DORSAL_LEVELS = [...range(3, 12).map(k => exitY('T' + k) + 0.2), ...range(1, 4).map(k => Y['L' + k])];

const arteries = [
  A('a_thoracic_aorta', ['a_aortic_arch'], { en: 'Thoracic aorta (descending)', de: 'Brustaorta (Pars descendens)', la: 'Aorta thoracica' },
    { en: 'Continues the aortic arch from T4 down the left side of the vertebral bodies in the posterior mediastinum and passes through the aortic hiatus of the diaphragm at T12. Gives the posterior intercostal arteries 3–11, the subcostal and superior phrenic arteries, and branches to the bronchi and oesophagus.',
      de: 'Setzt den Aortenbogen ab Th4 links an den Wirbelkörpern im hinteren Mediastinum fort und tritt bei Th12 durch den Hiatus aorticus des Zwerchfells. Gibt die Aa. intercostales posteriores 3–11, die A. subcostalis und die Aa. phrenicae superiores sowie Äste zu Bronchien und Ösophagus ab.' },
    { path: [[-1.6, -6, -3.6], [-1.9, -10, -4.7], [-1.9, -16, -5.3], [-1.4, -22, -5], [-0.6, -27.4, -4.2]], r: 0.85 }),
  A('a_abdominal_aorta', ['a_thoracic_aorta'], { en: 'Abdominal aorta', de: 'Bauchaorta', la: 'Aorta abdominalis' },
    { en: 'From the aortic hiatus (T12) down the front of the lumbar spine to its division into the common iliac arteries at L4, about at the level of the umbilicus. Its paired wall branches are the inferior phrenic and lumbar arteries; its gut and kidney branches belong to the abdomen. An aneurysm is felt as a pulsating mass above the umbilicus.',
      de: 'Vom Hiatus aorticus (Th12) vor der Lendenwirbelsäule bis zur Teilung in die Aa. iliacae communes bei L4, etwa auf Nabelhöhe. Ihre paarigen Wandäste sind die Aa. phrenicae inferiores und Aa. lumbales; ihre Äste zu Darm und Nieren gehören zum Abdomen. Ein Aneurysma tastet man als pulsierende Masse oberhalb des Nabels.' },
    { path: [[-0.6, -27.4, -4.2], [-0.6, -32, -3.4], [-0.4, -37, -3], [0, -40.6, -2.6], [0.8, -41, -2.4]], r: 0.8 }),
  A('a_post_intercostal', ['a_thoracic_aorta'], { en: 'Posterior intercostal arteries', de: 'Hintere Zwischenrippenarterien', la: 'Arteriae intercostales posteriores' },
    { en: 'Branches of the thoracic aorta to intercostal spaces 3–11 (spaces 1–2 are supplied from the costocervical trunk). The right ones cross in front of the vertebral bodies, because the aorta lies on the left. Each runs in the costal groove between vein and nerve and joins the anterior intercostal branches of the internal thoracic artery. In coarctation of the aorta they enlarge as a bypass and notch the lower borders of the ribs on the X-ray.',
      de: 'Äste der Aorta thoracica zu den Interkostalräumen 3–11 (1–2 aus dem Truncus costocervicalis). Die rechten kreuzen vor den Wirbelkörpern, weil die Aorta links liegt. Jede verläuft im Sulcus costae zwischen Vene und Nerv und anastomosiert mit den Rr. intercostales anteriores der A. thoracica interna. Bei einer Aortenisthmusstenose erweitern sie sich als Umgehungskreislauf und erzeugen Rippenusuren im Röntgenbild.' },
    { paths: range(3, 11).map(k => [...segmentalStart(exitY('T' + k) + 0.2), ...[1.3, 2.3, 3.3, 4.3].filter(u => u <= RIBS[k - 1].length - 1).map(u => radial(add(ribPoint(k, u), [0, -0.3, 0]), 0.95))]), r: 0.17 }),
  A('a_subcostal', ['a_thoracic_aorta'], { en: 'Subcostal artery', de: 'Unterrippenarterie', la: 'Arteria subcostalis' },
    { en: 'The last segmental branch of the thoracic aorta, below the 12th rib with the subcostal nerve, to the posterior and lateral abdominal wall.',
      de: 'Letzter segmentaler Ast der Aorta thoracica, unter der 12. Rippe mit dem N. subcostalis zur hinteren und seitlichen Bauchwand.' },
    { path: [...segmentalStart(exitY('T12') + 0.2), radial(add(ribPoint(12, 1.3), [0, -0.8, 0]), 0.95), radial(add(ribPoint(12, 2.3), [0, -0.8, 0]), 0.95), [10.6, -35, -3]], r: 0.17 }),
  A('a_lumbar', ['a_abdominal_aorta'], { en: 'Lumbar arteries', de: 'Lendenarterien', la: 'Arteriae lumbales' },
    { en: 'Four pairs from the back of the abdominal aorta. They wind around the bodies of L1–L4 behind psoas and quadratus lumborum and supply the posterior abdominal wall, the back muscles and the cauda equina.',
      de: 'Vier Paare von der Hinterwand der Aorta abdominalis. Sie ziehen um die Wirbelkörper L1–L4 hinter M. psoas und M. quadratus lumborum und versorgen hintere Bauchwand, Rückenmuskeln und Cauda equina.' },
    { paths: range(1, 4).map(k => { const y = Y['L' + k], z = bodyZ(y); return [[-0.4, y, z + 1.6], [1.6, y, z + 1.4], [2.6, y, z], [3, y - 0.2, z - 1.6], [5.2, y - 0.6, z - 2.6]].map(round); }), r: 0.17 }),
  A('a_dorsal_branches', ['a_post_intercostal', 'a_subcostal', 'a_lumbar'], { en: 'Dorsal branches of the segmental arteries', de: 'Rami dorsales der Segmentarterien', la: 'Rami dorsales arteriarum intercostalium posteriorum et lumbalium' },
    { en: 'Pass backwards beside the vertebral bodies to the intrinsic back muscles and skin. Their spinal branches enter the intervertebral foramina and feed the spinal cord; one large one, usually on the left between T9 and L2 (artery of Adamkiewicz), supplies the lower two thirds of the cord, and its injury in aortic surgery can cause paraplegia.',
      de: 'Ziehen neben den Wirbelkörpern nach hinten zur autochthonen Rückenmuskulatur und Haut. Ihre Rr. spinales treten durch die Foramina intervertebralia und versorgen das Rückenmark; ein großer, meist links zwischen Th9 und L2 (A. radicularis magna, Adamkiewicz-Arterie), versorgt die unteren zwei Drittel des Rückenmarks, seine Verletzung bei Aortenoperationen kann eine Querschnittslähmung verursachen.' },
    { paths: DORSAL_LEVELS.map(y => { const z = bodyZ(y); return [[2.5, y, z - 1.5], [3, y - 0.2, z - 3.2], [2.4, y - 0.5, z - 4.6]].map(round); }), r: 0.12 }),
  A('a_sup_phrenic', ['a_thoracic_aorta'], { en: 'Superior phrenic arteries', de: 'Obere Zwerchfellarterien', la: 'Arteriae phrenicae superiores' },
    { en: 'Small branches of the lower thoracic aorta to the upper surface of the back of the diaphragm.',
      de: 'Kleine Äste der unteren Brustaorta zur Oberseite des hinteren Zwerchfells.' },
    { path: [[-1.6, -24, -5], [0.8, -23, -5.6], [3.6, -21.6, -5.4], [5.6, -20, -4.4]], r: 0.12 }),
  A('a_inf_phrenic', ['a_abdominal_aorta'], { en: 'Inferior phrenic artery', de: 'Untere Zwerchfellarterie', la: 'Arteria phrenica inferior' },
    { en: 'The first branch of the abdominal aorta (sometimes from the coeliac trunk), to the underside of the diaphragm; gives the superior suprarenal arteries.',
      de: 'Erster Ast der Aorta abdominalis (manchmal aus dem Truncus coeliacus) zur Unterseite des Zwerchfells; gibt die Aa. suprarenales superiores ab.' },
    { path: [[-0.4, -28, -3.8], [1.4, -27.4, -3], [3.6, -24.6, -2.6], [6, -21, -2.4]], r: 0.13 }),
  A('a_internal_thoracic', ['a_subclavian'], { en: 'Internal thoracic artery', de: 'Innere Brustkorbarterie', la: 'Arteria thoracica interna' },
    { en: 'From the subclavian artery; runs down about 1 cm beside the sternum behind the costal cartilages, giving anterior intercostal branches to each space and perforating branches to the breast. At the sixth space it divides into the musculophrenic and superior epigastric arteries. The preferred graft for coronary bypass surgery (LIMA/RIMA).',
      de: 'Aus der A. subclavia; zieht etwa 1 cm neben dem Sternum hinter den Rippenknorpeln abwärts und gibt Rr. intercostales anteriores in jeden Interkostalraum sowie Rr. perforantes zur Brustdrüse ab. Im 6. Interkostalraum teilt sie sich in A. musculophrenica und A. epigastrica superior. Bevorzugtes Gefäß für die koronare Bypassoperation (LIMA/RIMA).' },
    { path: [[3.6, 1.4, 0.6], [3.2, -1.4, 1.4], [2.8, -6, 2.6], [2.8, -12, 3.4], [3, -16.4, 3.6]], r: 0.2 }),
  A('a_musculophrenic', ['a_internal_thoracic'], { en: 'Musculophrenic artery', de: 'Muskel-Zwerchfell-Arterie', la: 'Arteria musculophrenica' },
    { en: 'Follows the costal margin, supplying the lower intercostal spaces (7–9), the diaphragm and the upper abdominal wall.',
      de: 'Folgt dem Rippenbogen und versorgt die unteren Interkostalräume (7–9), das Zwerchfell und die obere Bauchwand.' },
    { path: [[3, -16.4, 3.6], [6, -21.4, 3.6], [9.4, -26.4, 1.8], [10.8, -29, -1.2]], r: 0.13 }),
  A('a_sup_epigastric', ['a_internal_thoracic'], { en: 'Superior epigastric artery', de: 'Obere epigastrische Arterie', la: 'Arteria epigastrica superior' },
    { en: 'Continues the internal thoracic artery into the rectus sheath behind rectus abdominis and joins the inferior epigastric artery around the umbilicus: a bypass between the subclavian and external iliac arteries (for example in coarctation of the aorta).',
      de: 'Setzt die A. thoracica interna in die Rektusscheide hinter dem M. rectus abdominis fort und anastomosiert um den Nabel mit der A. epigastrica inferior: eine Umgehung zwischen A. subclavia und A. iliaca externa (z. B. bei Aortenisthmusstenose).' },
    { path: [[3, -16.4, 3.6], [3.2, -21, 4.6], [3.4, -28, 5.4], [3.4, -36, 6]], r: 0.15 }),
  A('a_inf_epigastric', ['a_external_iliac'], { en: 'Inferior epigastric artery', de: 'Untere epigastrische Arterie', la: 'Arteria epigastrica inferior' },
    { en: 'From the external iliac artery just above the inguinal ligament; climbs behind rectus abdominis. It raises the lateral umbilical fold and separates direct inguinal hernias (medial to it) from indirect ones (lateral to it). Laparoscopic ports can injure it, causing a rectus sheath haematoma.',
      de: 'Aus der A. iliaca externa direkt oberhalb des Leistenbands; steigt hinter dem M. rectus abdominis auf. Sie wirft die Plica umbilicalis lateralis auf und trennt direkte Leistenhernien (medial davon) von indirekten (lateral davon). Laparoskopie-Trokare können sie verletzen: Rektusscheidenhämatom.' },
    { path: [[7, -52, 4.2], [5, -50, 5.4], [3.8, -46, 6], [3.4, -40, 6.2], [3.4, -36, 6]], r: 0.15 }),
  A('a_deep_circumflex_iliac', ['a_external_iliac'], { en: 'Deep circumflex iliac artery', de: 'Tiefe Kranzarterie der Hüfte', la: 'Arteria circumflexa ilium profunda' },
    { en: 'From the external iliac artery; runs along the inner side of the iliac crest to the lower lateral abdominal wall (internal oblique, transversus). Used for vascularised iliac bone grafts.',
      de: 'Aus der A. iliaca externa; verläuft an der Innenseite des Beckenkamms zur unteren seitlichen Bauchwand (M. obliquus internus, M. transversus). Wird für gefäßgestielte Beckenkammtransplantate genutzt.' },
    { path: [[7.2, -52.2, 4.4], [9.6, -48, 4.2], [11.4, -44, 3.2], [11.8, -41, 0.6], [10.8, -39.6, -3]], r: 0.13 }),
  A('a_vertebral', ['a_subclavian'], { en: 'Vertebral artery', de: 'Wirbelarterie', la: 'Arteria vertebralis' },
    { en: 'First branch of the subclavian artery. Climbs through the transverse foramina of C6–C1, winds behind the lateral mass of the atlas across the floor of the suboccipital triangle and enters the skull through the foramen magnum, where the two vertebral arteries join to form the basilar artery (brainstem, cerebellum, occipital lobes). On the way it supplies the deep neck muscles and the cervical spinal cord. It can tear (dissection) after neck trauma or manipulation.',
      de: 'Erster Ast der A. subclavia. Steigt durch die Foramina transversaria von C6–C1 auf, windet sich hinter der Massa lateralis des Atlas über den Boden des Trigonum suboccipitale und tritt durch das Foramen magnum in den Schädel, wo sich beide Aa. vertebrales zur A. basilaris vereinigen (Hirnstamm, Kleinhirn, Okzipitallappen). Unterwegs versorgt sie die tiefen Nackenmuskeln und das Halsmark. Nach Halstrauma oder Manipulation kann sie einreißen (Dissektion).' },
    { path: [[3.4, 1.6, 0.6], [2.6, 2.6, -2], [2.1, 4, -3], [2.1, 8, -2.9], [2.2, 11, -3.2], [2.8, 12.6, -3.8], [2.4, 13.2, -5.6], [1, 13.4, -5.8], [0.4, 14.2, -4.4]], r: 0.24 }),
  A('a_occipital', [], { en: 'Occipital artery', de: 'Hinterhauptsarterie', la: 'Arteria occipitalis' },
    { en: 'Branch of the external carotid artery (head and neck, a later region). Runs back below the mastoid and pierces the trapezius attachment with the greater occipital nerve to reach the scalp; supplies the upper neck muscles.',
      de: 'Ast der A. carotis externa (Kopf und Hals, eine spätere Region). Zieht unter dem Mastoid nach hinten und durchbricht mit dem N. occipitalis major den Trapeziusansatz zur Kopfhaut; versorgt die oberen Nackenmuskeln.' },
    { path: [[3.6, 12, -1], [5, 14.6, -4], [4, 16.4, -7.6], [3, 20, -10], [3.4, 25, -9.4]], r: 0.17 })
];

// ---------------------------------------------------------------- muscles
const M = (id, group, name, o, i, action, nerveList, arteryList, oBones, iBones, shape) => ({
  id, type: 'muscle', group, name, origin: o, insertion: i, action,
  nerves: nerveList.map(([n, seg, note]) => ({ n, seg, note })), arteries: arteryList, originBones: oBones, insertionBones: iBones, shape
});

// Segment-by-segment fibres for the deep back muscles.
const SPINE = segs('C2', 'S3');
function multifidusOrigin(l) {
  if (l[0] === 'S') return [1.8, exitY(l) + 1, -9.6];
  const v = vert(l);
  if (l[0] === 'C') return round([1.6, v.y, v.z - 1.6]);
  if (l[0] === 'T') return round([2.4, v.y, v.tz - 0.2]);
  return round([1.8, v.y, v.back + 0.4]);
}
const multifidusFibres = SPINE.map((l, i) => i >= 4 && l !== 'C8' && SPINE[i - 4] !== 'C8' ? [multifidusOrigin(l), spinous(SPINE[i - 4], 0.6, 0.5)] : null).filter(Boolean);
const rotatoresFibres = range(1, 11).map(k => { const lo = vert('T' + (k + 1)), up = vert('T' + k); return [round([2.2, lo.y, lo.tz - 0.2]), round([0.7, up.y - 0.6, up.back - 0.2])]; });
const INTERSPINAL_PAIRS = [['C3', 'C2'], ['C4', 'C3'], ['C5', 'C4'], ['C6', 'C5'], ['C7', 'C6'], ['T1', 'C7'], ['L2', 'L1'], ['L3', 'L2'], ['L4', 'L3'], ['L5', 'L4']];
const interspinalesFibres = INTERSPINAL_PAIRS.map(([lo, up]) => [spinous(lo, 0.5, 0.4), spinous(up, 0.75, 0.4)]);
const levatoresFibres = range(1, 12).map(k => { const v = vert(k === 1 ? 'C7' : 'T' + (k - 1)); return [round([v.tx * 0.9, v.y, v.tz - 0.2]), round(add(ribPoint(k, 1.6), [0, 0, -0.4]))]; });
const serratusPosterior = (levels, ribs) => levels.map((l, i) => { const tip = add(vert(l).tip, [0.4, 0, 0.2]), ins = add(ribPoint(ribs[i], 2.3), [0, 0, -0.6]); return [round(tip), round(add(lerp(tip, ins, 0.5), [0, 0, -1.2])), round(ins)]; });
const externalIntercostals = range(1, 11).flatMap(k => [1.5, 2.5, 3.5, 4.5, 5.4].map(u => {
  const a = ribPoint(k, u), b = ribPoint(k + 1, u + 0.4);
  return a && b ? [radial(add(a, [0, -0.3, 0]), 1.02), radial(add(b, [0, 0.3, 0]), 1.02)] : null;
})).filter(Boolean);
const internalIntercostals = range(1, 11).flatMap(k => [2.5, 3.5, 4.5, 5.4].map(u => {
  const a = ribPoint(k, u + 0.4), b = ribPoint(k + 1, u);
  return a && b ? [radial(add(a, [0, -0.3, 0]), 0.96), radial(add(b, [0, 0.3, 0]), 0.96)] : null;
})).filter(Boolean);
const transversusThoracis = range(2, 6).map(k => { const y = [-13.6, -14.4, -15.2, -16, -17.2][k - 2]; return [round([0.6, y, sternumZ(y) - 1.2]), round(add(along(CARTILAGES[k - 1], 1.1), [0, 0, -0.9]))]; });
// Diaphragm: from its rim (sternum, costal margin, ribs, arcuate ligaments) up to the dome.
const DOME = [5.4, -17.2, -1.4], TENDON = [1.6, -18.4, -0.6];
const diaphragmRim = [
  radial(along(CARTILAGES[6], 1.4), 0.9), radial(RIBS[7][5], 0.92), radial(RIBS[8][5], 0.92), radial(RIBS[9][5], 0.92),
  radial(ribPoint(11, 3.6), 0.92), radial(ribPoint(12, 2.6), 0.92), [4.6, -29.6, -7.2], [2.8, -29.4, -6.4]
];
const diaphragmFibres = [
  [[0.4, -19.6, 3.6], [0.8, -18.8, 2.2], TENDON],
  ...diaphragmRim.map((p, i) => { const apex = lerp(TENDON, DOME, Math.min(1, 0.4 + i * 0.15)); return [p, round([p[0] * 0.92, apex[1] - 2.2, -3.2 + (p[2] + 3.2) * 0.92]), round(apex)]; }),
  [[1, -36, -3.6], [1.4, -28, -4], [1.8, -21, -4.4], TENDON]
];
const EXTERNAL_OBLIQUE = { 5: [4.8, [6.6, -22, 5.6]], 6: [4.6, [6.8, -27, 6.2]], 7: [4.4, [7, -32, 6.6]], 8: [4.2, [7.2, -37, 6.9]], 9: [4.2, [8, -43, 6.8]], 10: [4.1, [11.4, -43.6, 5.2]], 11: [3.9, [12.8, -40.6, 2.6]], 12: [2.9, [12.6, -38.8, -1.4]] };
const externalObliqueFibres = Object.entries(EXTERNAL_OBLIQUE).map(([k, [u, end]]) => {
  const start = radial(ribPoint(+k, u), 1.06), mid = lerp(start, end, 0.5);
  return [start, round([mid[0] + 0.6, mid[1], mid[2] + 1]), end];
});

const LATERAL = 'n_lateral_branches', MEDIAL = 'n_medial_branches';
const muscles = [
  // Lateral tract (dorsal rami, lateral branches)
  M('iliocostalis', 'back_lateral', { en: 'Iliocostalis', de: 'Darmbein-Rippen-Muskel', la: 'Musculus iliocostalis' },
    { en: 'Iliac crest, sacrum and thoracolumbar fascia (lumborum); angles of ribs 7–12 (thoracis); angles of ribs 3–6 (cervicis)', de: 'Crista iliaca, Os sacrum und Fascia thoracolumbalis (lumborum); Anguli costarum 7–12 (thoracis); Anguli costarum 3–6 (cervicis)' },
    { en: 'Angles of the higher ribs and transverse processes of C4–C6', de: 'Anguli costarum der höheren Rippen und Querfortsätze C4–C6' },
    { en: 'Most lateral column of the erector spinae. Both sides extend the spine (standing up straight, lifting from a stoop); one side bends the trunk to the same side. Helps lower the ribs in forced expiration.', de: 'Lateralste Säule des M. erector spinae. Beidseitig Streckung der Wirbelsäule (Aufrichten, Heben aus der gebückten Haltung); einseitig Seitneigung zur gleichen Seite. Senkt die Rippen bei forcierter Exspiration.' },
    [[LATERAL, segs('C8', 'L1')]], ['a_dorsal_branches'], ['sacrum', 'hip_bone', 'ribs'], ['ribs', 'cervical_vertebrae'],
    { fibers: [[[5.4, -44, -9.8], [6, -38, -10.4], [6.4, -30, -11], [6.4, -22, -11.6], [6.2, -14, -11.6]], [[6.6, -26, -11.4], [6.4, -17, -11.8], [5.8, -8, -11], [4.8, -1, -9.2]], [[5.8, -10, -11.2], [4.6, -2, -9.4], [3.4, 3, -7], [2.8, 5.6, -5.2]]], r: 0.85 }),
  M('longissimus', 'back_lateral', { en: 'Longissimus', de: 'Längster Rückenmuskel', la: 'Musculus longissimus' },
    { en: 'Sacrum and lumbar spinous processes (thoracis); transverse processes of the upper thoracic vertebrae (cervicis, capitis)', de: 'Os sacrum und Dornfortsätze der Lendenwirbel (thoracis); Querfortsätze der oberen Brustwirbel (cervicis, capitis)' },
    { en: 'Ribs 2–12 and lumbar costal processes (thoracis); transverse processes of C2–C5 (cervicis); mastoid process (capitis)', de: 'Rippen 2–12 und Processus costales der Lendenwirbel (thoracis); Querfortsätze C2–C5 (cervicis); Processus mastoideus (capitis)' },
    { en: 'Middle and longest column of the erector spinae. Extends the spine and, acting on one side, bends it sideways; the capitis part extends the head and turns it to the same side.', de: 'Mittlere und längste Säule des M. erector spinae. Streckt die Wirbelsäule und neigt sie einseitig zur Seite; die Pars capitis streckt den Kopf und dreht ihn zur gleichen Seite.' },
    [[LATERAL, segs('C2', 'L5')]], ['a_dorsal_branches', 'a_occipital'], ['sacrum', 'lumbar_vertebrae', 'thoracic_vertebrae'], ['ribs', 'cervical_vertebrae', 'lumbar_vertebrae'],
    { fibers: [[[3.2, -48, -10.2], [3.6, -40, -10.2], [3.8, -30, -10.4], [3.8, -20, -10.8], [3.4, -10, -10.4], [3, -3, -8.6]], [[3.2, -8, -10], [2.9, -1, -8.2], [3, 5, -6.4], [3.8, 10.6, -5.4], [4.6, 15.2, -4.2]]], r: 0.9 }),
  M('splenius', 'back_lateral', { en: 'Splenius capitis and cervicis', de: 'Riemenmuskel (Splenius)', la: 'Musculi splenius capitis et cervicis' },
    { en: 'Nuchal ligament and spinous processes of C3–T6', de: 'Lig. nuchae und Dornfortsätze C3–Th6' },
    { en: 'Mastoid process and lateral superior nuchal line (capitis); transverse processes of C1–C2 (cervicis)', de: 'Processus mastoideus und laterale Linea nuchalis superior (capitis); Querfortsätze C1–C2 (cervicis)' },
    { en: 'Both sides extend the head and neck; one side turns the head to the same side, together with the opposite sternocleidomastoid. Part of the lateral tract, although it lies superficially under trapezius.', de: 'Beidseitig Streckung von Kopf und Hals; einseitig Drehung des Kopfes zur gleichen Seite, zusammen mit dem gegenseitigen M. sternocleidomastoideus. Gehört zum lateralen Trakt, obwohl er oberflächlich unter dem M. trapezius liegt.' },
    [[LATERAL, segs('C2', 'C6')]], ['a_dorsal_branches', 'a_occipital'], ['cervical_vertebrae', 'thoracic_vertebrae'], ['cervical_vertebrae'],
    { fibers: [[[0.7, -6, -10.8], [1.2, -1, -10], [2.4, 4, -8.8], [3.8, 10, -7.6], [4.8, 14.6, -5.8]], [[0.8, -10, -11.2], [1.8, -4, -10.4], [2.8, 2, -8.2], [2.8, 8, -5.8], [2.8, 11.6, -4.4]]], r: 0.6 }),
  M('levatores_costarum', 'back_lateral', { en: 'Levatores costarum', de: 'Rippenheber', la: 'Musculi levatores costarum' },
    { en: 'Transverse processes of C7–T11', de: 'Querfortsätze C7–Th11' },
    { en: 'The rib below (breves) or two below (longi), between tubercle and angle', de: 'Nächsttiefere (breves) oder übernächste Rippe (longi) zwischen Tuberculum und Angulus' },
    { en: 'Extend, rotate and side-bend the thoracic spine; their lifting effect on the ribs is small.', de: 'Strecken, drehen und neigen die Brustwirbelsäule zur Seite; die Rippen heben sie nur wenig.' },
    [[LATERAL, segs('C8', 'T11')]], ['a_dorsal_branches'], ['cervical_vertebrae', 'thoracic_vertebrae'], ['ribs'],
    { fibers: levatoresFibres, r: 0.28 }),

  // Medial tract (dorsal rami, medial branches)
  M('spinalis', 'back_medial', { en: 'Spinalis', de: 'Dornmuskel', la: 'Musculus spinalis' },
    { en: 'Spinous processes of T10–L3 (thoracis) and C5–T2 (cervicis)', de: 'Dornfortsätze Th10–L3 (thoracis) und C5–Th2 (cervicis)' },
    { en: 'Spinous processes of T2–T8 (thoracis) and C2–C4 (cervicis)', de: 'Dornfortsätze Th2–Th8 (thoracis) und C2–C4 (cervicis)' },
    { en: 'Runs from spinous process to spinous process and extends the thoracic and cervical spine. Usually counted with the erector spinae, but its course and nerve make it part of the medial tract.', de: 'Zieht von Dornfortsatz zu Dornfortsatz und streckt Brust- und Halswirbelsäule. Wird oft zum M. erector spinae gezählt, gehört nach Verlauf und Innervation aber zum medialen Trakt.' },
    [[MEDIAL, segs('C2', 'T10')]], ['a_dorsal_branches'], ['thoracic_vertebrae', 'lumbar_vertebrae', 'cervical_vertebrae'], ['thoracic_vertebrae', 'cervical_vertebrae'],
    { fibers: [[[1.1, -33, -10.6], [1.2, -26, -11.4], [1.2, -18, -11.8], [1.1, -10, -11.4], [1, -3, -9.8]], [[0.9, -2, -9.4], [0.8, 3, -8.2], [0.6, 8.6, -7.4]]], r: 0.5 }),
  M('semispinalis', 'back_medial', { en: 'Semispinalis', de: 'Halbdornmuskel', la: 'Musculus semispinalis' },
    { en: 'Transverse processes of C4–T12', de: 'Querfortsätze C4–Th12' },
    { en: 'Spinous processes 4–6 vertebrae higher (thoracis, cervicis); occipital bone between the nuchal lines (capitis)', de: 'Dornfortsätze 4–6 Wirbel höher (thoracis, cervicis); Os occipitale zwischen den Lineae nuchales (capitis)' },
    { en: 'Extends the thoracic and cervical spine and the head; one side turns them to the opposite side. Semispinalis capitis forms the thick vertical bulge on either side of the nuchal groove.', de: 'Streckt Brust-, Halswirbelsäule und Kopf; einseitig Drehung zur Gegenseite. Der M. semispinalis capitis bildet den dicken Längswulst beiderseits der Nackenrinne.' },
    [[MEDIAL, segs('C2', 'T6')]], ['a_dorsal_branches', 'a_occipital'], ['cervical_vertebrae', 'thoracic_vertebrae'], ['thoracic_vertebrae', 'cervical_vertebrae', 'occipital_bone'],
    { fibers: [[[2.8, -24, -10.2], [2.2, -16, -10.6], [1.2, -6, -10.4]], [[2.6, -10, -9.8], [2.2, -4, -9.4], [1.6, 2, -7.6], [0.8, 8.6, -6.8]], [[2.4, -6.5, -9.2], [2.6, 0, -8.2], [2.6, 6, -7.6], [2.4, 12, -7.8], [2.2, 17, -8.4]]], r: 0.6 }),
  M('multifidus', 'back_medial', { en: 'Multifidus', de: 'Vielgespaltener Muskel', la: 'Musculi multifidi' },
    { en: 'Sacrum, mamillary processes of the lumbar vertebrae, thoracic transverse processes, articular processes of C4–C7', de: 'Os sacrum, Processus mamillares der Lendenwirbel, Querfortsätze der Brustwirbel, Gelenkfortsätze C4–C7' },
    { en: 'Spinous processes 2–4 vertebrae higher, up to C2', de: 'Dornfortsätze 2–4 Wirbel höher, bis C2' },
    { en: 'Strongest in the lumbar region. Stabilises each vertebra on the next (segmental control) and extends and rotates the spine. It wastes quickly on the side of a painful lumbar segment, which is why low back pain rehabilitation trains it.', de: 'Im Lendenbereich am kräftigsten. Stabilisiert jeden Wirbel gegen den nächsten (segmentale Kontrolle), streckt und dreht die Wirbelsäule. Bei Rückenschmerz atrophiert er schnell auf der betroffenen Seite, deshalb trainiert man ihn gezielt in der Reha.' },
    [[MEDIAL, segs('C3', 'S3')]], ['a_dorsal_branches'], ['sacrum', 'lumbar_vertebrae', 'thoracic_vertebrae', 'cervical_vertebrae'], ['lumbar_vertebrae', 'thoracic_vertebrae', 'cervical_vertebrae'],
    { fibers: multifidusFibres, r: 0.42 }),
  M('rotatores', 'back_medial', { en: 'Rotatores', de: 'Drehmuskeln', la: 'Musculi rotatores' },
    { en: 'Transverse processes of the thoracic vertebrae', de: 'Querfortsätze der Brustwirbel' },
    { en: 'Base of the spinous process one (breves) or two (longi) vertebrae higher', de: 'Basis des Dornfortsatzes des nächst- (breves) oder übernächsthöheren Wirbels (longi)' },
    { en: 'The deepest layer, best developed in the thoracic spine. Rotate the spine to the opposite side and act as position sensors (rich in muscle spindles).', de: 'Tiefste Schicht, am besten in der Brustwirbelsäule ausgebildet. Drehen die Wirbelsäule zur Gegenseite und dienen als Lagesensoren (reich an Muskelspindeln).' },
    [[MEDIAL, segs('T1', 'T11')]], ['a_dorsal_branches'], ['thoracic_vertebrae'], ['thoracic_vertebrae'],
    { fibers: rotatoresFibres, r: 0.22 }),
  M('interspinales', 'back_medial', { en: 'Interspinales', de: 'Zwischendornmuskeln', la: 'Musculi interspinales' },
    { en: 'Spinous process of the vertebra below (cervical and lumbar spine; mostly absent in the thoracic spine)', de: 'Dornfortsatz des nächsttieferen Wirbels (Hals- und Lendenwirbelsäule; in der Brustwirbelsäule meist fehlend)' },
    { en: 'Spinous process of the vertebra above', de: 'Dornfortsatz des nächsthöheren Wirbels' },
    { en: 'Extend the cervical and lumbar spine segment by segment.', de: 'Strecken Hals- und Lendenwirbelsäule Segment für Segment.' },
    [[MEDIAL, [...segs('C3', 'C8'), ...segs('L1', 'L5')]]], ['a_dorsal_branches'], ['cervical_vertebrae', 'thoracic_vertebrae', 'lumbar_vertebrae'], ['cervical_vertebrae', 'lumbar_vertebrae'],
    { fibers: interspinalesFibres, r: 0.24 }),

  // Short neck muscles (suboccipital nerve)
  M('rectus_capitis_posterior_major', 'suboccipital', { en: 'Rectus capitis posterior major', de: 'Großer hinterer gerader Kopfmuskel', la: 'Musculus rectus capitis posterior major' },
    { en: 'Spinous process of the axis (C2)', de: 'Dornfortsatz des Axis (C2)' },
    { en: 'Middle part of the inferior nuchal line', de: 'Mittlerer Teil der Linea nuchalis inferior' },
    { en: 'Extends the head and turns it to the same side (atlanto-axial joint). Medial border of the suboccipital triangle.', de: 'Streckt den Kopf und dreht ihn zur gleichen Seite (unteres Kopfgelenk). Mediale Begrenzung des Trigonum suboccipitale.' },
    [['n_suboccipital', ['C1']]], ['a_vertebral', 'a_occipital'], ['cervical_vertebrae'], ['occipital_bone'],
    { fibers: [[[0.5, 9.9, -7.6], [2, 13, -7.8], [3.4, 15.8, -7.4]]], r: 0.45 }),
  M('rectus_capitis_posterior_minor', 'suboccipital', { en: 'Rectus capitis posterior minor', de: 'Kleiner hinterer gerader Kopfmuskel', la: 'Musculus rectus capitis posterior minor' },
    { en: 'Posterior tubercle of the atlas (C1)', de: 'Tuberculum posterius des Atlas (C1)' },
    { en: 'Medial part of the inferior nuchal line', de: 'Medialer Teil der Linea nuchalis inferior' },
    { en: 'Extends the head at the atlanto-occipital joint and fine-tunes head posture. A connective tissue bridge links it to the dura mater.', de: 'Streckt den Kopf im oberen Kopfgelenk und regelt die Feineinstellung der Kopfhaltung. Eine Bindegewebsbrücke verbindet ihn mit der Dura mater.' },
    [['n_suboccipital', ['C1']]], ['a_vertebral', 'a_occipital'], ['cervical_vertebrae'], ['occipital_bone'],
    { fibers: [[[0.3, 12.6, -6.6], [0.8, 14.4, -7.8], [1.2, 16.2, -8.4]]], r: 0.4 }),
  M('obliquus_capitis_inferior', 'suboccipital', { en: 'Obliquus capitis inferior', de: 'Unterer schräger Kopfmuskel', la: 'Musculus obliquus capitis inferior' },
    { en: 'Spinous process of the axis', de: 'Dornfortsatz des Axis' },
    { en: 'Transverse process of the atlas', de: 'Querfortsatz des Atlas' },
    { en: 'Turns the atlas, and with it the head, to the same side (atlanto-axial joint). Lower border of the suboccipital triangle; the greater occipital nerve winds around its lower edge.', de: 'Dreht den Atlas und damit den Kopf zur gleichen Seite (unteres Kopfgelenk). Untere Begrenzung des Trigonum suboccipitale; der N. occipitalis major windet sich um seinen Unterrand.' },
    [['n_suboccipital', ['C1']]], ['a_vertebral', 'a_occipital'], ['cervical_vertebrae'], ['cervical_vertebrae'],
    { fibers: [[[0.6, 9.9, -7.4], [2.4, 11.4, -6.4], [3.6, 12.6, -4.4]]], r: 0.45 }),
  M('obliquus_capitis_superior', 'suboccipital', { en: 'Obliquus capitis superior', de: 'Oberer schräger Kopfmuskel', la: 'Musculus obliquus capitis superior' },
    { en: 'Transverse process of the atlas', de: 'Querfortsatz des Atlas' },
    { en: 'Occipital bone above the inferior nuchal line', de: 'Os occipitale oberhalb der Linea nuchalis inferior' },
    { en: 'Extends the head and tilts it to the same side. Lateral border of the suboccipital triangle, in whose floor lie the vertebral artery and the suboccipital nerve.', de: 'Streckt den Kopf und neigt ihn zur gleichen Seite. Laterale Begrenzung des Trigonum suboccipitale, in dessen Boden A. vertebralis und N. suboccipitalis liegen.' },
    [['n_suboccipital', ['C1']]], ['a_vertebral', 'a_occipital'], ['cervical_vertebrae'], ['occipital_bone'],
    { fibers: [[[3.6, 12.8, -4.4], [4.2, 14.6, -5.4], [4.2, 16.6, -6.6]]], r: 0.4 }),

  // Thoracic wall and diaphragm (ventral rami)
  M('serratus_posterior_superior', 'thoracic_wall', { en: 'Serratus posterior superior', de: 'Oberer hinterer Sägemuskel', la: 'Musculus serratus posterior superior' },
    { en: 'Nuchal ligament and spinous processes of C6–T2', de: 'Lig. nuchae und Dornfortsätze C6–Th2' },
    { en: 'Ribs 2–5, lateral to their angles', de: 'Rippen 2–5, lateral der Anguli' },
    { en: 'Raises the upper ribs (a weak accessory muscle of inspiration). It lies on the back muscles but migrated there from the trunk wall, so it is supplied by ventral rami (intercostal nerves), not dorsal rami.', de: 'Hebt die oberen Rippen (schwacher Atemhilfsmuskel). Liegt auf den Rückenmuskeln, ist aber aus der Rumpfwand eingewandert und wird daher von Rami anteriores (Interkostalnerven) versorgt, nicht von Rami posteriores.' },
    [['n_intercostal_upper', segs('T2', 'T5')]], ['a_post_intercostal'], ['cervical_vertebrae', 'thoracic_vertebrae'], ['ribs'],
    { fibers: serratusPosterior(['C6', 'C7', 'T1', 'T2'], [2, 3, 4, 5]), r: 0.35 }),
  M('serratus_posterior_inferior', 'thoracic_wall', { en: 'Serratus posterior inferior', de: 'Unterer hinterer Sägemuskel', la: 'Musculus serratus posterior inferior' },
    { en: 'Thoracolumbar fascia over the spinous processes of T11–L2', de: 'Fascia thoracolumbalis über den Dornfortsätzen Th11–L2' },
    { en: 'Lower borders of ribs 9–12', de: 'Unterränder der Rippen 9–12' },
    { en: 'Pulls the lower ribs down and back, holding them against the pull of the diaphragm. A migrated muscle supplied by ventral rami.', de: 'Zieht die unteren Rippen nach unten und hinten und hält sie gegen den Zug des Zwerchfells. Ein eingewanderter Muskel, versorgt von Rami anteriores.' },
    [['n_thoracoabdominal', segs('T9', 'T11')], ['n_subcostal', ['T12']]], ['a_post_intercostal', 'a_lumbar'], ['thoracic_vertebrae', 'lumbar_vertebrae'], ['ribs'],
    { fibers: serratusPosterior(['T11', 'T12', 'L1', 'L2'], [9, 10, 11, 12]), r: 0.38 }),
  M('external_intercostals', 'thoracic_wall', { en: 'External intercostal muscles', de: 'Äußere Zwischenrippenmuskeln', la: 'Musculi intercostales externi' },
    { en: 'Lower border of each rib', de: 'Unterrand jeder Rippe' },
    { en: 'Upper border of the rib below; the fibres run down and forwards (hands in your front pockets), from the tubercles to the costochondral junctions', de: 'Oberrand der nächsttieferen Rippe; die Fasern ziehen nach vorn unten (Hände in den Jackentaschen), von den Tubercula bis zur Knorpel-Knochen-Grenze' },
    { en: 'Raise the ribs and widen the chest: inspiration. They also keep the intercostal spaces from being sucked in while breathing.', de: 'Heben die Rippen und erweitern den Brustkorb: Inspiration. Sie verhindern auch, dass die Interkostalräume beim Atmen eingezogen werden.' },
    [['n_intercostal_upper', segs('T1', 'T6')], ['n_thoracoabdominal', segs('T7', 'T11')]], ['a_post_intercostal', 'a_internal_thoracic'], ['ribs'], ['ribs'],
    { fibers: externalIntercostals, r: 0.3 }),
  M('internal_intercostals', 'thoracic_wall', { en: 'Internal intercostal muscles', de: 'Innere Zwischenrippenmuskeln', la: 'Musculi intercostales interni' },
    { en: 'Upper border of each rib and costal cartilage', de: 'Oberrand jeder Rippe und jedes Rippenknorpels' },
    { en: 'Lower border of the rib above; the fibres run down and backwards, at right angles to the external layer, from the sternum to the rib angles', de: 'Unterrand der nächsthöheren Rippe; die Fasern ziehen nach hinten unten, rechtwinklig zur äußeren Schicht, vom Sternum bis zu den Anguli costarum' },
    { en: 'Lower the ribs: forced expiration (coughing, blowing). The parasternal part between the cartilages helps inspiration. The innermost layer (intercostales intimi) is separated from them by the intercostal vessels and nerve.', de: 'Senken die Rippen: forcierte Exspiration (Husten, Pusten). Der parasternale Anteil zwischen den Knorpeln unterstützt die Inspiration. Die innerste Schicht (Mm. intercostales intimi) ist durch Interkostalgefäße und -nerv von ihnen getrennt.' },
    [['n_intercostal_upper', segs('T1', 'T6')], ['n_thoracoabdominal', segs('T7', 'T11')]], ['a_post_intercostal', 'a_internal_thoracic'], ['ribs'], ['ribs'],
    { fibers: internalIntercostals, r: 0.3 }),
  M('transversus_thoracis', 'thoracic_wall', { en: 'Transversus thoracis', de: 'Querer Brustkorbmuskel', la: 'Musculus transversus thoracis' },
    { en: 'Inner surface of the lower sternum and xiphoid process', de: 'Innenfläche des unteren Sternums und des Processus xiphoideus' },
    { en: 'Inner surfaces of costal cartilages 2–6', de: 'Innenflächen der Rippenknorpel 2–6' },
    { en: 'Pulls the costal cartilages down: weak expiration. Lies behind the internal thoracic vessels and separates them from the pleura.', de: 'Zieht die Rippenknorpel nach unten: schwache Exspiration. Liegt hinter den Vasa thoracica interna und trennt sie von der Pleura.' },
    [['n_intercostal_upper', segs('T2', 'T6')]], ['a_internal_thoracic'], ['sternum'], ['ribs'],
    { fibers: transversusThoracis, r: 0.3 }),
  M('diaphragm', 'thoracic_wall', { en: 'Diaphragm', de: 'Zwerchfell', la: 'Diaphragma' },
    { en: 'Xiphoid process (sternal part); inner surfaces of costal cartilages 7–12 (costal part); bodies of L1–L3 via the crura and arcuate ligaments over psoas and quadratus lumborum (lumbar part)', de: 'Processus xiphoideus (Pars sternalis); Innenflächen der Rippenknorpel 7–12 (Pars costalis); Wirbelkörper L1–L3 über die Crura sowie Ligg. arcuata über M. psoas und M. quadratus lumborum (Pars lumbalis)' },
    { en: 'Central tendon', de: 'Centrum tendineum' },
    { en: 'The main muscle of inspiration: as it contracts the domes flatten and the chest enlarges downwards; quiet breathing is mostly diaphragmatic. It also raises abdominal pressure (coughing, defecation, childbirth) and helps venous return. Openings: vena cava at T8, oesophagus at T10, aorta at T12.', de: 'Wichtigster Inspirationsmuskel: Bei Kontraktion flachen die Kuppeln ab und der Brustraum erweitert sich nach unten; die Ruheatmung ist überwiegend Zwerchfellatmung. Erhöht außerdem den Bauchdruck (Husten, Defäkation, Geburt) und fördert den venösen Rückstrom. Durchtritte: V. cava bei Th8, Ösophagus bei Th10, Aorta bei Th12.' },
    [['n_phrenic', ['C3', 'C4', 'C5'], { en: 'the only motor supply; lower intercostal nerves carry sensation from its rim', de: 'einzige motorische Versorgung; die unteren Interkostalnerven leiten die Sensibilität vom Rand' }]],
    ['a_sup_phrenic', 'a_inf_phrenic', 'a_musculophrenic'], ['sternum', 'ribs', 'lumbar_vertebrae'], [],
    { fibers: diaphragmFibres, r: 0.55 }),

  // Abdominal wall
  M('rectus_abdominis', 'abdominal_wall', { en: 'Rectus abdominis', de: 'Gerader Bauchmuskel', la: 'Musculus rectus abdominis' },
    { en: 'Pubic crest and symphysis', de: 'Crista pubica und Symphyse' },
    { en: 'Costal cartilages 5–7 and xiphoid process', de: 'Rippenknorpel 5–7 und Processus xiphoideus' },
    { en: 'Flexes the trunk (sitting up), tilts the pelvis back and raises abdominal pressure. Three or four tendinous intersections make the "six-pack"; it lies in the rectus sheath. Each segment has its own nerve (T7–T12), so it can be partly denervated.', de: 'Beugt den Rumpf (Aufrichten aus dem Liegen), kippt das Becken nach hinten und erhöht den Bauchdruck. Drei bis vier Intersectiones tendineae bilden das „Sixpack“; er liegt in der Rektusscheide. Jedes Segment hat einen eigenen Nerv (Th7–Th12), er kann daher teilweise denerviert werden.' },
    [['n_thoracoabdominal', segs('T7', 'T11')], ['n_subcostal', ['T12']]], ['a_sup_epigastric', 'a_inf_epigastric'], ['hip_bone'], ['ribs', 'sternum'],
    { fibers: [[[5.4, -18, 5], [5.2, -26, 6.4], [4.4, -36, 7.2], [3, -47, 7.2], [1.8, -55.4, 6.2]], [[2, -19.2, 5.2], [2.2, -27, 6.6], [2.2, -37, 7.4], [1.8, -47, 7.4], [1.1, -55.8, 6.2]]], r: 0.95 }),
  M('external_oblique', 'abdominal_wall', { en: 'External oblique', de: 'Äußerer schräger Bauchmuskel', la: 'Musculus obliquus externus abdominis' },
    { en: 'Outer surfaces of ribs 5–12', de: 'Außenflächen der Rippen 5–12' },
    { en: 'Front half of the iliac crest, inguinal ligament and, through its aponeurosis, the linea alba', de: 'Vordere Hälfte der Crista iliaca, Leistenband und über seine Aponeurose die Linea alba' },
    { en: 'Fibres run down and forwards, like the external intercostals. Both sides flex the trunk and compress the abdomen; one side bends the trunk to the same side and turns it to the opposite side. Its aponeurosis forms the inguinal ligament and the superficial inguinal ring.', de: 'Die Fasern ziehen wie die Mm. intercostales externi nach vorn unten. Beidseitig Rumpfbeugung und Bauchpresse; einseitig Seitneigung zur gleichen und Drehung zur Gegenseite. Seine Aponeurose bildet das Leistenband und den äußeren Leistenring.' },
    [['n_intercostal_upper', ['T5', 'T6']], ['n_thoracoabdominal', segs('T7', 'T11')], ['n_subcostal', ['T12']]], ['a_post_intercostal', 'a_subcostal', 'a_deep_circumflex_iliac'], ['ribs'], ['hip_bone'],
    { fibers: externalObliqueFibres, r: 0.75 }),
  M('internal_oblique', 'abdominal_wall', { en: 'Internal oblique', de: 'Innerer schräger Bauchmuskel', la: 'Musculus obliquus internus abdominis' },
    { en: 'Thoracolumbar fascia, iliac crest and lateral inguinal ligament', de: 'Fascia thoracolumbalis, Crista iliaca und laterales Leistenband' },
    { en: 'Lower borders of ribs 10–12, linea alba through its aponeurosis, pubic crest (conjoint tendon with transversus)', de: 'Unterränder der Rippen 10–12, über seine Aponeurose die Linea alba, Crista pubica (Falx inguinalis mit dem M. transversus)' },
    { en: 'Fibres fan up and forwards, at right angles to the external oblique. Flexes the trunk and compresses the abdomen; one side turns the trunk to the same side, working with the opposite external oblique. Its lowest fibres form the cremaster around the spermatic cord.', de: 'Die Fasern fächern nach vorn oben, rechtwinklig zum M. obliquus externus. Rumpfbeugung und Bauchpresse; einseitig Drehung zur gleichen Seite, zusammen mit dem gegenseitigen M. obliquus externus. Seine untersten Fasern bilden den M. cremaster um den Samenstrang.' },
    [['n_thoracoabdominal', segs('T8', 'T11')], ['n_subcostal', ['T12']], ['n_iliohypogastric', ['L1']], ['n_ilioinguinal', ['L1']]], ['a_deep_circumflex_iliac', 'a_inf_epigastric', 'a_subcostal'], ['hip_bone'], ['ribs', 'hip_bone'],
    { fibers: [[[9.8, -39.8, -5.6], [10.4, -36, -6], [8.6, -31.6, -7.4]], [[12.4, -39.6, -2], [12.2, -35.4, -3], [11, -31.4, -3.4]], [[12.6, -41.2, 2.4], [11.6, -35.6, 3.4], [10, -29.4, 2.2]], [[11.6, -44, 5.4], [9.6, -40, 6], [6.8, -36, 6.4]], [[9.4, -48.4, 5.4], [7.8, -46.6, 6.4], [6.4, -45, 6.8]]], r: 0.7 }),
  M('transversus_abdominis', 'abdominal_wall', { en: 'Transversus abdominis', de: 'Querer Bauchmuskel', la: 'Musculus transversus abdominis' },
    { en: 'Inner surfaces of costal cartilages 7–12, thoracolumbar fascia, iliac crest, lateral inguinal ligament', de: 'Innenflächen der Rippenknorpel 7–12, Fascia thoracolumbalis, Crista iliaca, laterales Leistenband' },
    { en: 'Linea alba through its aponeurosis, pubic crest', de: 'Über seine Aponeurose die Linea alba, Crista pubica' },
    { en: 'The deepest layer, with horizontal fibres like a corset: compresses the abdomen (breathing out, coughing, straining) and tightens the thoracolumbar fascia, stabilising the lumbar spine before movement.', de: 'Tiefste Schicht mit queren Fasern wie ein Korsett: komprimiert den Bauch (Ausatmen, Husten, Pressen) und spannt die Fascia thoracolumbalis, stabilisiert so die Lendenwirbelsäule vor Bewegungen.' },
    [['n_thoracoabdominal', segs('T7', 'T11')], ['n_subcostal', ['T12']], ['n_iliohypogastric', ['L1']], ['n_ilioinguinal', ['L1']]], ['a_deep_circumflex_iliac', 'a_inf_epigastric', 'a_musculophrenic'], ['ribs', 'hip_bone'], ['hip_bone'],
    { fibers: [[[10.4, -25, 0.4], [8.6, -25.4, 4], [6.2, -25.6, 5.4]], ...[-30, -34, -38].map(y => [[7.4, y, -7.2], [10.6, y, -4.6], [11.6, y, 0], [9.6, y, 4.4], [6.2, y, 6.2]]), [[11.4, -41.6, 1.6], [9.6, -42, 5.2], [6.2, -42.4, 6.6]], [[10, -46.6, 4.4], [7.6, -46.6, 6.2], [5.4, -46.4, 6.8]]], r: 0.55 }),
  M('quadratus_lumborum', 'abdominal_wall', { en: 'Quadratus lumborum', de: 'Quadratischer Lendenmuskel', la: 'Musculus quadratus lumborum' },
    { en: 'Back of the iliac crest and iliolumbar ligament', de: 'Hinterer Beckenkamm und Lig. iliolumbale' },
    { en: '12th rib and costal processes of L1–L4', de: '12. Rippe und Processus costales L1–L4' },
    { en: 'Posterior abdominal wall. One side bends the trunk sideways or hitches the hip up; both sides hold the 12th rib down during inspiration. A common source of one-sided low back pain.', de: 'Hintere Bauchwand. Einseitig Seitneigung des Rumpfes oder Anheben des Beckens; beidseitig fixiert er die 12. Rippe bei der Inspiration. Häufige Ursache einseitiger Kreuzschmerzen.' },
    [['n_subcostal', ['T12']], ['n_lumbar_direct', ['L1', 'L2', 'L3']]], ['a_lumbar', 'a_subcostal', 'a_iliolumbar'], ['hip_bone'], ['ribs', 'lumbar_vertebrae'],
    { fibers: [[[7.4, -40.4, -7.4], [6.8, -35, -7.4], [6.4, -30.2, -7.8]], [[6, -41.4, -8], [5.2, -36, -7.4], [4.4, -31.4, -7.2]]], r: 0.85 })
];

export const structures = [...bones, ...nerves, ...arteries, ...muscles];

export const muscleGroups = {
  back_lateral: { en: 'Back: lateral tract', de: 'Rücken: lateraler Trakt' },
  back_medial: { en: 'Back: medial tract', de: 'Rücken: medialer Trakt' },
  suboccipital: { en: 'Suboccipital muscles', de: 'Kurze Nackenmuskeln' },
  thoracic_wall: { en: 'Thoracic wall and diaphragm', de: 'Brustwand und Zwerchfell' },
  abdominal_wall: { en: 'Abdominal wall', de: 'Bauchwand' }
};

export const meta = {
  start: 'longissimus',
  plexus: { en: 'Spinal nerves', de: 'Spinalnerven' },
  nerveGroups: [
    ['spinal', { en: 'Spinal nerves', de: 'Spinalnerven' }],
    ['dorsal', { en: 'Dorsal rami', de: 'Rami posteriores' }],
    ['ventral', { en: 'Ventral rami', de: 'Rami anteriores' }]
  ],
  // Bones from neighbouring regions shown for orientation.
  context: ['hip_bone', 'sacrum'],
  camera: { target: [-2, -18, -4], position: [-95, -4, -125] }
};
