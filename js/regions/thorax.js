// Thorax: heart and pericardium, lungs and pleura, trachea and main bronchi, thoracic oesophagus,
// thymus, the great vessels, coronary arteries, the vagus nerves and the thoracic autonomic system.
// Coordinates: [lateral, superior, anterior] in schematic cm, same body frame as the back module
// (x > 0 is the body's right; the viewer mirrors x). Unlike the limbs, the thoracic organs are
// asymmetric, so both sides are modelled: negative x is the body's left.
//
// Organs carry `nerves` ({ n, seg, kind }: kind is sympathetic, parasympathetic or sensory),
// `arteries`, `veins` and an optional `partOf`. Veins name the vessel or chamber they drain into
// as `parents`. The vagus carries the token 'CN X' in place of spinal segments.

const r2 = x => Math.round(x * 100) / 100;
const round = p => p.map(r2);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const scale = (a, f) => a.map(x => x * f);
const norm = a => scale(a, 1 / Math.hypot(...a));
const mirror = p => [-p[0], p[1], p[2]];

const SEGMENTS = [['C', 8], ['T', 12], ['L', 5], ['S', 5]].flatMap(([p, n]) => range(1, n).map(i => p + i));
const segs = (from, to) => SEGMENTS.slice(SEGMENTS.indexOf(from), SEGMENTS.indexOf(to) + 1);
const VAGUS = 'CN X';

// Vertebral heights and column depth (same values as back.js).
const Y = {};
range(1, 12).forEach(n => { Y['T' + n] = -1 - (n - 1) * 2.38; });
range(1, 2).forEach(n => { Y['L' + n] = -30.2 - (n - 1) * 3.1; });
const COLUMN_Z = [[14, -3.4], [8, -2.9], [3, -3.2], [0, -3.9], [-4, -5.2], [-10, -6.8], [-16, -7.4], [-22, -7.1], [-27, -6.5], [-31, -5.8], [-36, -5.3]];
function bodyZ(y) {
  if (y >= COLUMN_Z[0][0]) return COLUMN_Z[0][1];
  for (let i = 1; i < COLUMN_Z.length; i++) {
    const [y0, z0] = COLUMN_Z[i - 1], [y1, z1] = COLUMN_Z[i];
    if (y >= y1) return z0 + (z1 - z0) * (y0 - y) / (y0 - y1);
  }
  return COLUMN_Z[COLUMN_Z.length - 1][1];
}
const sternumZ = y => y > -4.6 ? 2.2 + (-y / 4.6) * 1.2 : 3.4 + ((-4.6 - y) / 12.2) * 1.4;

// ------------------------------------------------------------ ellipsoid helpers
// An ellipsoid is [centre, half-sizes, axis?]; the axis is where its local y axis points
// (the viewer applies the same shortest rotation from +y to the axis).
function toLocal(p, [c, s, axis]) {
  let d = sub(p, c);
  if (axis) {
    const a = norm(axis), k0 = [a[2], 0, -a[0]], kl = Math.hypot(...k0);
    if (kl > 1e-6) {
      const k = scale(k0, 1 / kl), cos = a[1], sin = -kl; // rotate by minus the angle
      const kxd = [k[1] * d[2] - k[2] * d[1], k[2] * d[0] - k[0] * d[2], k[0] * d[1] - k[1] * d[0]];
      const kd = k[0] * d[0] + k[1] * d[1] + k[2] * d[2];
      d = d.map((x, i) => x * cos + kxd[i] * sin + k[i] * kd * (1 - cos));
    }
  }
  return d.map((x, i) => x / s[i]);
}
const inside = (p, ells) => ells.some(e => toLocal(p, e).reduce((t, x) => t + x * x, 0) < 1);
// Push a point outwards from `centre` until it leaves all ellipsoids, plus a small offset.
function onSurface(ells, centre, p, offset = 0.15) {
  const dir = norm(sub(p, centre));
  let t = 0;
  while (t < 20 && inside(add(centre, scale(dir, t)), ells)) t += 0.04;
  return round(add(centre, scale(dir, t + offset)));
}
// Lateral surface of a lung at height y and depth z (side +1 right, -1 left).
function lungSide(ells, side, y, z) {
  let best = null;
  for (const e of ells) {
    const [c, s] = e;
    const q = 1 - ((y - c[1]) / s[1]) ** 2 - ((z - c[2]) / s[2]) ** 2;
    if (q <= 0) continue;
    const x = c[0] + side * s[0] * Math.sqrt(q) * 1.01;
    if (best === null || side * x > side * best) best = x;
  }
  return round([best, y, z]);
}

// ------------------------------------------------------------ heart geometry
// Chambers: the right ventricle forms most of the anterior surface, the left ventricle the apex
// and left border, the right atrium the right border and the left atrium the posterior base.
const APEX_AXIS = [-0.62, -0.62, 0.49];
const CHAMBERS = {
  right_atrium: [[2.6, -11.6, 0.4], [1.8, 2.6, 2.0]],
  right_ventricle: [[-0.6, -14.2, 1.8], [2.2, 3.6, 1.5], [-0.6, -0.7, 0.4]],
  left_atrium: [[-0.4, -11.4, -2.4], [2.4, 1.6, 1.4]],
  left_ventricle: [[-2.8, -14, 0.2], [2.4, 4.2, 2.4], APEX_AXIS]
};
const HEART_ELLS = Object.values(CHAMBERS);
const HEART_C = [-0.8, -13, 0.4];
const onHeart = pts => pts.map(p => onSurface(HEART_ELLS, HEART_C, p));
const AORTIC_VALVE = [0.2, -11.4, 0.4], PULMONARY_VALVE = [-0.8, -10.8, 2.2];

// ------------------------------------------------------------ lung geometry
const LUNG_R = [[[6.2, -4.4, -2], [4, 7, 5]], [[7.2, -11, -2.6], [4.2, 6.2, 5.4]]];
const LUNG_L = [[[-6.4, -4.6, -2], [4, 7, 5]], [[-7.6, -11.4, -3], [3.8, 6, 5]]];
const LINGULA = [[-4.8, -13.4, 2.2], [1.6, 2.4, 1.1]];
const fissure = (ells, side, yz) => yz.map(([y, z]) => lungSide(ells, side, y, z));

// Parietal pleura: anterior and inferior reflection lines (left side swings out at the cardiac notch).
const behindSternum = (x, y) => round([x, y, sternumZ(y) - 0.9]);
const PLEURA_R = [[3.2, 3, -0.4], behindSternum(0.5, -4.6), behindSternum(0.3, -10), behindSternum(0.5, -15),
  [2.6, -17.4, 3.6], [7, -19.6, 2.4], [11.6, -21.6, -2], [9, -24, -6], [3, -25.6, -7.2]];
const PLEURA_L = [[-3.2, 3, -0.4], behindSternum(-0.5, -4.6), behindSternum(-0.7, -9.6), [-3, -11, 3.6], [-3.6, -16, 3.4],
  [-7, -19.6, 2.4], [-11.6, -21.6, -2], [-9, -24, -6], [-3, -25.6, -7.2]];

// ------------------------------------------------------------ autonomic geometry
const trunkPt = (side, y) => round([side * 2.6, y, bodyZ(y) - 0.3]);
const trunkPath = side => [4, 1, -3, -7, -11, -15, -19, -23, -27, -30].map(y => trunkPt(side, y));
function splanchnic(side, levels, end) {
  const roots = levels.map(l => [trunkPt(side, Y[l]), round([side * 2, Y[l] - 1.6, bodyZ(Y[l] - 1.6) + 0.9])]);
  const main = [...levels.map(l => round([side * 2, Y[l] - 1.6, bodyZ(Y[l] - 1.6) + 0.9])), round([side * end[0], end[1], end[2]])];
  return [...roots, main];
}

// ------------------------------------------------------------ organs
const O = (id, group, name, info, nerves, arteries, veins, lesion, shape, extra) => ({
  id, type: 'organ', group, name, info, nerves: nerves.map(([n, kind, seg]) => ({ n, kind, seg })), arteries, veins, lesion, shape, ...extra
});
const HEART_NERVES = [['n_cardiac_plexus', 'sympathetic', segs('T1', 'T4')], ['n_cardiac_plexus', 'parasympathetic', [VAGUS]]];

const organs = [
  O('heart', 'heart', { en: 'Heart', de: 'Herz', la: 'Cor' },
    { en: 'A muscular double pump in the middle mediastinum, inside the pericardium. The right heart pumps venous blood to the lungs, the left heart oxygenated blood into the aorta. Its long axis runs from the base (back, right, up) to the apex (front, left, down; 5th intercostal space in the midclavicular line). Sympathetic fibres raise rate and force, the vagus slows the rate and AV conduction. Pain fibres run with the sympathetic nerves to T1–T4, so heart pain is referred to the chest and the inner left arm.',
      de: 'Muskuläre Doppelpumpe im mittleren Mediastinum, im Herzbeutel. Das rechte Herz pumpt venöses Blut in die Lunge, das linke Herz sauerstoffreiches Blut in die Aorta. Die Herzachse läuft von der Basis (hinten, rechts, oben) zur Spitze (vorn, links, unten; 5. ICR in der Medioklavikularlinie). Der Sympathikus steigert Frequenz und Kraft, der Vagus senkt die Frequenz und verlangsamt die AV-Überleitung. Schmerzfasern laufen mit dem Sympathikus nach Th1–Th4: Herzschmerz strahlt in Brust und linken Arm (Innenseite) aus.' },
    HEART_NERVES, ['a_rca', 'a_lca'], ['v_coronary_sinus'],
    { en: 'Angina and myocardial infarction: the pain is referred along T1–T4 (chest, inner left arm, sometimes jaw). After a heart transplant the heart is denervated: it beats at the intrinsic SA-node rate (about 100/min) and speeds up only slowly, through circulating catecholamines.',
      de: 'Angina pectoris und Herzinfarkt: Der Schmerz projiziert in die Dermatome Th1–Th4 (Brust, Innenseite des linken Arms, teils Unterkiefer). Nach einer Herztransplantation ist das Herz denerviert: Es schlägt mit der Eigenfrequenz des Sinusknotens (etwa 100/min) und beschleunigt nur langsam über zirkulierende Katecholamine.' },
    { ellipsoids: HEART_ELLS.map(([c, s, a]) => a ? [c, s.map(x => r2(x * 1.07)), a] : [c, s.map(x => r2(x * 1.07))]), opacity: 0.16 },
    { color: 0xb0414b }),
  O('right_atrium', 'heart', { en: 'Right atrium', de: 'Rechter Vorhof', la: 'Atrium dextrum' },
    { en: 'Forms the right border of the heart. Receives the superior and inferior venae cavae and the coronary sinus, and passes blood through the tricuspid valve into the right ventricle. The sinoatrial node lies in its wall at the opening of the superior vena cava; the right auricle overlaps the root of the aorta.',
      de: 'Bildet den rechten Herzrand. Nimmt obere und untere Hohlvene und den Sinus coronarius auf und gibt das Blut über die Trikuspidalklappe in die rechte Kammer weiter. Der Sinusknoten liegt in seiner Wand an der Mündung der V. cava superior; das rechte Herzohr legt sich an die Aortenwurzel.' },
    [], ['a_rca'], [],
    { en: 'An atrial septal defect lets blood shunt from left to right; a patent foramen ovale can let a venous clot cross into the systemic circulation (paradoxical embolism, stroke).',
      de: 'Bei einem Vorhofseptumdefekt fließt Blut von links nach rechts; über ein offenes Foramen ovale kann ein venöser Thrombus in den Körperkreislauf gelangen (paradoxe Embolie, Schlaganfall).' },
    { ellipsoids: [CHAMBERS.right_atrium], opacity: 0.4 }, { partOf: 'heart', color: 0xc95f66 }),
  O('right_ventricle', 'heart', { en: 'Right ventricle', de: 'Rechte Kammer', la: 'Ventriculus dexter' },
    { en: 'Forms most of the anterior (sternocostal) surface. Pumps blood through the pulmonary valve into the pulmonary trunk at low pressure, so its wall is thin (3–5 mm). The septomarginal trabecula (moderator band) carries the right bundle branch to the anterior papillary muscle.',
      de: 'Bildet den größten Teil der Vorderfläche (Facies sternocostalis). Pumpt das Blut über die Pulmonalklappe in den Truncus pulmonalis, mit niedrigem Druck, daher ist die Wand dünn (3–5 mm). Die Trabecula septomarginalis (Moderatorband) führt den rechten Tawara-Schenkel zum vorderen Papillarmuskel.' },
    [], ['a_rca', 'a_lad'], [],
    { en: 'Pulmonary embolism or chronic lung disease overloads the right ventricle (cor pulmonale): jugular venous distension, liver congestion and peripheral oedema.',
      de: 'Lungenembolie oder chronische Lungenkrankheit überlasten die rechte Kammer (Cor pulmonale): Halsvenenstauung, Leberstauung und periphere Ödeme.' },
    { ellipsoids: [CHAMBERS.right_ventricle], opacity: 0.4 }, { partOf: 'heart', color: 0xa8323c }),
  O('left_atrium', 'heart', { en: 'Left atrium', de: 'Linker Vorhof', la: 'Atrium sinistrum' },
    { en: 'Forms most of the base (posterior surface) of the heart. Receives the four pulmonary veins and passes oxygenated blood through the mitral valve into the left ventricle. It lies directly in front of the oesophagus.',
      de: 'Bildet den größten Teil der Herzbasis (Hinterfläche). Nimmt die vier Lungenvenen auf und gibt das sauerstoffreiche Blut über die Mitralklappe in die linke Kammer weiter. Liegt direkt vor dem Ösophagus.' },
    [], ['a_lcx'], [],
    { en: 'An enlarged left atrium (mitral stenosis) indents the oesophagus on a barium swallow and can cause difficulty swallowing. Transoesophageal echocardiography uses this contact to image the atrium; atrial fibrillation favours thrombi in the left auricle.',
      de: 'Ein vergrößerter linker Vorhof (Mitralstenose) pelottiert den Ösophagus im Breischluck und kann Schluckbeschwerden machen (Dysphagia megalatrica). Die transösophageale Echokardiographie nutzt diese Nachbarschaft; bei Vorhofflimmern entstehen Thromben bevorzugt im linken Herzohr.' },
    { ellipsoids: [CHAMBERS.left_atrium], opacity: 0.4 }, { partOf: 'heart', color: 0xc95f66 }),
  O('left_ventricle', 'heart', { en: 'Left ventricle', de: 'Linke Kammer', la: 'Ventriculus sinister' },
    { en: 'Forms the apex and the left border of the heart. Pumps blood through the aortic valve into the systemic circulation at high pressure, so its wall is about three times as thick as the right (10–15 mm). Two papillary muscles anchor the mitral valve cusps through the chordae tendineae.',
      de: 'Bildet die Herzspitze und den linken Herzrand. Pumpt das Blut über die Aortenklappe mit hohem Druck in den Körperkreislauf, daher ist die Wand etwa dreimal so dick wie rechts (10–15 mm). Zwei Papillarmuskeln halten die Mitralsegel über die Chordae tendineae.' },
    [], ['a_lad', 'a_lcx', 'a_rca'], [],
    { en: 'An LAD occlusion causes an anterior wall infarct (ST elevation in V1–V4) with risk of pump failure, ventricular arrhythmia and, days later, rupture of the wall or of the septum. In right-dominant hearts the RCA supplies the inferior wall (ST elevation in II, III, aVF).',
      de: 'Ein Verschluss des RIVA führt zum Vorderwandinfarkt (ST-Hebung in V1–V4) mit Gefahr von Pumpversagen, Kammerflimmern und, Tage später, Ruptur von Wand oder Septum. Beim Rechtsversorgungstyp versorgt die RCA die Hinterwand (ST-Hebung in II, III, aVF).' },
    { ellipsoids: [CHAMBERS.left_ventricle], opacity: 0.4 }, { partOf: 'heart', color: 0xa8323c }),
  O('heart_valves', 'heart', { en: 'Heart valves', de: 'Herzklappen', la: 'Valvae cordis' },
    { en: 'Four valves in the fibrous skeleton of the heart. Atrioventricular (sail) valves: tricuspid (right) and mitral (bicuspid, left), held by chordae tendineae and papillary muscles. Semilunar (pocket) valves: pulmonary and aortic; the coronary arteries arise from the right and left aortic sinuses. Auscultation points: aortic 2nd right ICS, pulmonary 2nd left ICS, tricuspid 4th–5th left ICS at the sternum, mitral at the apex (5th left ICS, midclavicular line).',
      de: 'Vier Klappen im Herzskelett. Segelklappen: Trikuspidalklappe (rechts) und Mitralklappe (Bikuspidalklappe, links), gehalten von Chordae tendineae und Papillarmuskeln. Taschenklappen: Pulmonal- und Aortenklappe; aus dem rechten und linken Aortensinus entspringen die Koronararterien. Auskultationspunkte: Aorta 2. ICR rechts, Pulmonalis 2. ICR links, Trikuspidalis 4.–5. ICR links parasternal, Mitralis an der Herzspitze (5. ICR links, Medioklavikularlinie).' },
    [], [], [],
    { en: 'Aortic stenosis (calcified, often bicuspid valve): systolic murmur radiating to the carotids, angina, syncope. Mitral regurgitation after rupture of a papillary muscle (infarct) causes acute pulmonary oedema.',
      de: 'Aortenstenose (verkalkte, oft bikuspide Klappe): Systolikum mit Fortleitung in die Karotiden, Angina pectoris, Synkopen. Eine Mitralinsuffizienz nach Papillarmuskelabriss (Infarkt) führt zum akuten Lungenödem.' },
    { rings: [[PULMONARY_VALVE, 0.75, [-0.3, 0.8, -0.5]], [AORTIC_VALVE, 0.8, [0.3, 0.9, 0.2]], [[-1.4, -12.4, -1], 1, [0.62, 0.62, -0.49]], [[1, -13, 1], 1.1, [0.62, 0.62, -0.49]]], ringR: 0.16, opacity: 0.95 },
    { partOf: 'heart', color: 0xf2efe6 }),
  O('conducting_system', 'heart', { en: 'Conducting system of the heart', de: 'Erregungsleitungssystem', la: 'Systema conducente cordis' },
    { en: 'Specialised cardiac muscle that starts and spreads each beat: sinoatrial (SA) node at the opening of the superior vena cava (pacemaker, 60–80/min) → atrial muscle → atrioventricular (AV) node in the interatrial septum (delays conduction) → bundle of His through the fibrous skeleton → right and left bundle branches → Purkinje fibres. The right vagus acts mainly on the SA node, the left vagus on the AV node.',
      de: 'Spezialisierte Herzmuskulatur, die jeden Schlag auslöst und weiterleitet: Sinusknoten an der Mündung der V. cava superior (Schrittmacher, 60–80/min) → Vorhofmuskulatur → AV-Knoten im Vorhofseptum (verzögert die Überleitung) → His-Bündel durch das Herzskelett → rechter und linker Tawara-Schenkel → Purkinje-Fasern. Der rechte Vagus wirkt vor allem auf den Sinusknoten, der linke auf den AV-Knoten.' },
    HEART_NERVES, ['a_rca'], [],
    { en: 'The SA-nodal and AV-nodal arteries usually come from the RCA, so an inferior infarct often causes bradycardia or AV block. Strong vagal stimulation (carotid sinus massage) slows the heart.',
      de: 'Sinusknoten- und AV-Knoten-Arterie stammen meist aus der RCA: Ein Hinterwandinfarkt verursacht daher oft Bradykardie oder AV-Block. Starke Vagusreizung (Karotissinusmassage) verlangsamt den Herzschlag.' },
    { spheres: [[[2.9, -9.8, 1], 0.42], [[0.8, -12.6, -0.2], 0.38]],
      tubes: [[[[2.9, -9.8, 1], [1.8, -11.2, 0.6], [0.8, -12.6, -0.2]], 0.14], [[[0.8, -12.6, -0.2], [-0.2, -13.2, 0.2], [-0.6, -13.6, 0.4]], 0.2],
        [[[-0.6, -13.6, 0.4], [-0.8, -14.8, 1.6], [-1.8, -16.2, 2.2]], 0.16], [[[-0.6, -13.6, 0.4], [-1.6, -14.4, -0.2], [-3.2, -15.8, 0.6], [-4.4, -16.8, 1.4]], 0.16]], opacity: 0.95 },
    { partOf: 'heart', color: 0x9b59b6 }),
  O('pericardium', 'mediastinum', { en: 'Pericardium', de: 'Herzbeutel', la: 'Pericardium' },
    { en: 'A double sac around the heart: the tough fibrous pericardium, fused below with the central tendon of the diaphragm and above with the great vessels, and the serous pericardium (parietal and visceral layer = epicardium) with the pericardial cavity between them. The fibrous and parietal layers are sensory-innervated by the phrenic nerves (C3–C5); the visceral layer is insensitive.',
      de: 'Doppelter Sack um das Herz: außen das derbe Pericardium fibrosum, unten mit dem Centrum tendineum des Zwerchfells und oben mit den großen Gefäßen verwachsen, innen das Pericardium serosum (Lamina parietalis und visceralis = Epikard) mit der Perikardhöhle dazwischen. Fibröses und parietales Blatt werden sensibel vom N. phrenicus (C3–C5) versorgt; das viszerale Blatt ist schmerzunempfindlich.' },
    [['n_phrenic', 'sensory', ['C3', 'C4', 'C5']]], ['a_pericardiacophrenic'], ['v_brachiocephalic_left', 'v_brachiocephalic_right'],
    { en: 'Cardiac tamponade: blood or fluid in the pericardial cavity compresses the heart (Beck triad: low blood pressure, distended neck veins, muffled heart sounds); treated by pericardiocentesis below the xiphoid. Pericarditis pain is referred to the shoulder (C4) through the phrenic nerve.',
      de: 'Herzbeuteltamponade: Blut oder Erguss in der Perikardhöhle drückt das Herz ab (Beck-Trias: Hypotonie, gestaute Halsvenen, leise Herztöne); Entlastung durch Perikardpunktion unterhalb des Xiphoids. Der Schmerz bei Perikarditis projiziert über den N. phrenicus in die Schulter (C4).' },
    { ellipsoids: [[[-1, -12.6, 0.3], [4.8, 6.4, 4.4], [-0.55, -0.75, 0.3]]], opacity: 0.12 }, { color: 0xe0c48a }),
  O('lung_right', 'lungs', { en: 'Right lung', de: 'Rechte Lunge', la: 'Pulmo dexter' },
    { en: 'Three lobes (upper, middle, lower), separated by the oblique and horizontal fissures; ten bronchopulmonary segments. Shorter and wider than the left lung because the right dome of the diaphragm sits higher over the liver. At the hilum the bronchus lies above the artery (eparterial bronchus); the azygos vein arches over the root. Gas exchange is fed by the pulmonary arteries; the bronchial arteries nourish the lung tissue itself. Vagal fibres constrict the bronchi and increase secretion, sympathetic fibres dilate them.',
      de: 'Drei Lappen (Ober-, Mittel-, Unterlappen), getrennt durch die Fissura obliqua und die Fissura horizontalis; zehn Segmente. Kürzer und breiter als die linke Lunge, weil die rechte Zwerchfellkuppel über der Leber höher steht. Im Hilum liegt der Bronchus über der Arterie (eparterieller Bronchus); die V. azygos zieht bogenförmig über die Lungenwurzel. Die Aa. pulmonales bringen das Blut zum Gasaustausch (Vasa publica), die Rr. bronchiales ernähren das Lungengewebe (Vasa privata). Der Vagus verengt die Bronchien und steigert die Sekretion, der Sympathikus erweitert sie.' },
    [['n_pulmonary_plexus', 'sympathetic', segs('T2', 'T5')], ['n_pulmonary_plexus', 'parasympathetic', [VAGUS]]],
    ['a_pulmonary_right', 'a_bronchial'], ['v_pulmonary_right', 'v_azygos'],
    { en: 'Aspirated material usually goes to the right lung (the right main bronchus is wider and steeper): in an upright person to the lower lobe, lying on the back to the posterior segment of the upper lobe and the superior segment of the lower lobe.',
      de: 'Aspiriertes Material gelangt meist in die rechte Lunge (der rechte Hauptbronchus ist weiter und steiler): im Stehen in den Unterlappen, in Rückenlage in das hintere Oberlappensegment und das obere Unterlappensegment.' },
    { ellipsoids: LUNG_R, tubes: [[fissure(LUNG_R, 1, [[-5.6, -5.8], [-8.6, -3.6], [-11.6, -0.8], [-14.4, 1.4]]), 0.09], [fissure(LUNG_R, 1, [[-9.4, -2.8], [-9.6, -0.5], [-9.8, 1.4]]), 0.09]], opacity: 0.3 },
    { color: 0xe6a0a6 }),
  O('lung_left', 'lungs', { en: 'Left lung', de: 'Linke Lunge', la: 'Pulmo sinister' },
    { en: 'Two lobes (upper and lower), separated by the oblique fissure; the lingula is the tongue-shaped lower part of the upper lobe below the cardiac notch (it corresponds to the right middle lobe). Eight to ten segments. The left pulmonary artery arches over the left main bronchus at the hilum, and the aortic arch and descending aorta groove its medial surface.',
      de: 'Zwei Lappen (Ober- und Unterlappen), getrennt durch die Fissura obliqua; die Lingula ist der zungenförmige untere Teil des Oberlappens unter der Incisura cardiaca (entspricht dem rechten Mittellappen). Acht bis zehn Segmente. Im Hilum zieht die linke A. pulmonalis über den linken Hauptbronchus (hyparterieller Bronchus); Aortenbogen und absteigende Aorta hinterlassen Furchen an der medialen Fläche.' },
    [['n_pulmonary_plexus', 'sympathetic', segs('T2', 'T5')], ['n_pulmonary_plexus', 'parasympathetic', [VAGUS]]],
    ['a_pulmonary_left', 'a_bronchial'], ['v_pulmonary_left', 'v_hemiazygos'],
    { en: 'A Pancoast tumour at the lung apex can invade the sympathetic trunk (Horner syndrome: ptosis, miosis, anhidrosis), the lower trunk of the brachial plexus (C8–T1: small hand muscles) and the left recurrent laryngeal nerve (hoarseness).',
      de: 'Ein Pancoast-Tumor in der Lungenspitze kann den Grenzstrang (Horner-Syndrom: Ptosis, Miosis, Anhidrose), den unteren Primärstrang des Plexus brachialis (C8–Th1: kleine Handmuskeln) und den linken N. laryngeus recurrens (Heiserkeit) infiltrieren.' },
    { ellipsoids: [...LUNG_L, LINGULA], tubes: [[fissure(LUNG_L, -1, [[-5.2, -5.8], [-8.6, -3.6], [-11.6, -0.6], [-14.2, 1.2]]), 0.09]], opacity: 0.3 },
    { color: 0xe6a0a6 }),
  O('pleura', 'lungs', { en: 'Pleura', de: 'Pleura (Brustfell)', la: 'Pleura' },
    { en: 'Serous membrane of each lung: the visceral pleura covers the lung, the parietal pleura (costal, mediastinal, diaphragmatic and cervical parts) lines the chest wall; the pleural cavity between them holds a film of fluid and a negative pressure that keeps the lung expanded. The parietal pleura is pain-sensitive: costal part and periphery of the diaphragm through the intercostal nerves, mediastinal and central diaphragmatic part through the phrenic nerve. The shown lines are the pleural reflections; they reach two ribs lower than the lung (costodiaphragmatic recess).',
      de: 'Seröse Haut jeder Lunge: Die Pleura visceralis überzieht die Lunge, die Pleura parietalis (Pars costalis, mediastinalis, diaphragmatica und Cupula) kleidet die Brustwand aus; im Pleuraspalt dazwischen sorgen ein Flüssigkeitsfilm und Unterdruck dafür, dass die Lunge entfaltet bleibt. Die Pleura parietalis ist schmerzempfindlich: Pars costalis und Zwerchfellperipherie über die Interkostalnerven, Pars mediastinalis und zentrale Pars diaphragmatica über den N. phrenicus. Gezeigt sind die Pleuragrenzen; sie reichen zwei Rippen tiefer als die Lunge (Recessus costodiaphragmaticus).' },
    [['n_intercostal_upper', 'sensory', segs('T1', 'T6')], ['n_thoracoabdominal', 'sensory', segs('T7', 'T11')], ['n_phrenic', 'sensory', ['C3', 'C4', 'C5']]],
    ['a_post_intercostal', 'a_internal_thoracic', 'a_pericardiacophrenic'], ['v_azygos', 'v_hemiazygos'],
    { en: 'Tension pneumothorax: a valve-like leak lets air into the pleural cavity with every breath but not out. The lung collapses, the mediastinum shifts to the other side and kinks the venae cavae: severe breathlessness, absent breath sounds, hyper-resonant percussion, distended neck veins, falling blood pressure, tracheal deviation. Immediate needle decompression (2nd intercostal space, midclavicular line, or 4th–5th space in the anterior axillary line), then a chest drain — always at the upper border of the rib to spare the intercostal vessels and nerve.',
      de: 'Spannungspneumothorax: Ein Ventilmechanismus lässt bei jedem Atemzug Luft in den Pleuraspalt, aber nicht hinaus. Die Lunge kollabiert, das Mediastinum verlagert sich zur Gegenseite und knickt die Hohlvenen ab: schwere Atemnot, fehlendes Atemgeräusch, hypersonorer Klopfschall, gestaute Halsvenen, Blutdruckabfall, Trachealverlagerung. Sofortige Nadeldekompression (2. ICR Medioklavikularlinie oder 4.–5. ICR vordere Axillarlinie), dann Thoraxdrainage — immer am Oberrand der Rippe, um Interkostalgefäße und -nerv zu schonen.' },
    { tubes: [[PLEURA_R, 0.13], [PLEURA_L, 0.13]], opacity: 0.85 }, { color: 0x6fa8d6 }),
  O('trachea', 'lungs', { en: 'Trachea', de: 'Luftröhre', la: 'Trachea' },
    { en: 'Runs from the cricoid cartilage (C6) to its bifurcation (carina) at the level of the sternal angle (T4/T5). 16–20 C-shaped cartilages keep it open; the open back (paries membranaceus, trachealis muscle) lies against the oesophagus. The aortic arch passes in front of and to the left of its lower end.',
      de: 'Reicht vom Ringknorpel (C6) bis zur Bifurcatio tracheae (Carina) in Höhe des Angulus sterni (Th4/Th5). 16–20 hufeisenförmige Knorpelspangen halten sie offen; die offene Hinterwand (Paries membranaceus, M. trachealis) liegt dem Ösophagus an. Der Aortenbogen zieht vor und links über ihr unteres Ende.' },
    [['n_recurrent_laryngeal_left', 'parasympathetic', [VAGUS]], ['n_recurrent_laryngeal_right', 'parasympathetic', [VAGUS]], ['n_sympathetic_trunk', 'sympathetic', segs('T1', 'T4')]],
    ['a_bronchial'], ['v_brachiocephalic_left'],
    { en: 'An aortic arch aneurysm can compress the trachea (tracheal tug: the trachea is pulled down with each heartbeat). Widening of the carina on bronchoscopy suggests enlarged subcarinal lymph nodes (e.g. bronchial carcinoma).',
      de: 'Ein Aortenbogenaneurysma kann die Trachea einengen (Oliver-Cardarelli-Zeichen: pulssynchroner Zug am Kehlkopf). Eine verbreiterte Carina in der Bronchoskopie spricht für vergrößerte Bifurkationslymphknoten (z. B. Bronchialkarzinom).' },
    { tubes: [[[[0, 5, -0.2], [0, 3, -0.4], [0, -2, -1.6], [0, -7, -2.6]], 0.85]], opacity: 0.75 }, { color: 0xd8dccf }),
  O('main_bronchi', 'lungs', { en: 'Main bronchi', de: 'Hauptbronchien', la: 'Bronchi principales' },
    { en: 'The right main bronchus is shorter, wider and steeper (about 25° from the vertical) and gives the upper lobe bronchus before entering the hilum. The left main bronchus is longer and more horizontal (about 45°), runs below the aortic arch and in front of the oesophagus and descending aorta, and passes under the left pulmonary artery.',
      de: 'Der rechte Hauptbronchus ist kürzer, weiter und steiler (etwa 25° zur Senkrechten) und gibt schon vor dem Hilum den Oberlappenbronchus ab. Der linke Hauptbronchus ist länger und flacher (etwa 45°), zieht unter dem Aortenbogen, vor Ösophagus und Aorta descendens und unter der linken A. pulmonalis hindurch.' },
    [['n_pulmonary_plexus', 'sympathetic', segs('T2', 'T5')], ['n_pulmonary_plexus', 'parasympathetic', [VAGUS]]],
    ['a_bronchial'], ['v_azygos'],
    { en: 'Inhaled foreign bodies lodge more often in the right main bronchus. In asthma, vagal tone and inflammation narrow the bronchi; β2-agonists act on the sympathetic receptors to dilate them.',
      de: 'Aspirierte Fremdkörper bleiben häufiger im rechten Hauptbronchus stecken. Beim Asthma verengen Vagustonus und Entzündung die Bronchien; β2-Sympathomimetika erweitern sie über die sympathischen Rezeptoren.' },
    { tubes: [[[[0, -7, -2.6], [2.4, -8.2, -2.6], [4.2, -9.2, -2.4]], 0.62], [[[0, -7, -2.6], [-2.4, -7.8, -2.8], [-4.8, -8.9, -2.6]], 0.52]], opacity: 0.75 },
    { color: 0xd8dccf }),
  O('oesophagus_thoracic', 'mediastinum', { en: 'Oesophagus (thoracic part)', de: 'Ösophagus (Pars thoracica)', la: 'Oesophagus, pars thoracica' },
    { en: 'Muscular tube from the pharynx (C6) to the stomach (T11), behind the trachea and the left atrium in the posterior mediastinum. It passes through the oesophageal hiatus of the diaphragm at T10. Narrowings: at the cricoid cartilage, where the aortic arch and left main bronchus cross it, and at the diaphragm. The two vagi form the oesophageal plexus on its surface and leave as the anterior (mainly left vagus) and posterior (mainly right vagus) vagal trunks.',
      de: 'Muskelschlauch vom Pharynx (C6) zum Magen (Th11), hinter Trachea und linkem Vorhof im hinteren Mediastinum. Tritt in Höhe Th10 durch den Hiatus oesophageus des Zwerchfells. Engen: am Ringknorpel, an der Kreuzung mit Aortenbogen und linkem Hauptbronchus und im Zwerchfell. Die beiden Vagi bilden auf ihm den Plexus oesophageus und verlassen ihn als Truncus vagalis anterior (v. a. linker Vagus) und posterior (v. a. rechter Vagus).' },
    [['n_oesophageal_plexus', 'parasympathetic', [VAGUS]], ['n_recurrent_laryngeal_left', 'parasympathetic', [VAGUS]], ['n_recurrent_laryngeal_right', 'parasympathetic', [VAGUS]], ['n_oesophageal_plexus', 'sympathetic', segs('T4', 'T6')]],
    ['a_oesophageal'], ['v_azygos', 'v_hemiazygos'],
    { en: 'Swallowed foreign bodies stick at the three narrowings. Oesophageal varices form where the azygos tributaries meet the portal system at the lower end (portal hypertension).',
      de: 'Verschluckte Fremdkörper bleiben an den drei Engen hängen. Ösophagusvarizen entstehen am unteren Ende, wo Zuflüsse der V. azygos auf das Pfortadersystem treffen (portale Hypertension).' },
    { tubes: [[[[0.3, 3, -1.6], [0.4, 0, -2], [0.3, -4, -3.3], [0.1, -8, -4.3], [-0.1, -12, -4.9], [-0.6, -16, -4.4], [-1.6, -18.6, -3], [-2.4, -20.2, -2]], 0.55]], opacity: 0.7 },
    { color: 0xc9826b }),
  O('thymus', 'mediastinum', { en: 'Thymus', de: 'Thymus (Bries)', la: 'Thymus' },
    { en: 'Primary lymphoid organ in the anterior (superior) mediastinum behind the manubrium, in front of the great vessels and pericardium. T lymphocytes mature here. Large in childhood, it is largely replaced by fat after puberty (thymic fat body).',
      de: 'Primäres lymphatisches Organ im vorderen (oberen) Mediastinum hinter dem Manubrium, vor den großen Gefäßen und dem Herzbeutel. Hier reifen die T-Lymphozyten. Im Kindesalter groß, nach der Pubertät weitgehend durch Fett ersetzt (Corpus adiposum retrosternale).' },
    [['n_vagus', 'parasympathetic', [VAGUS]], ['n_sympathetic_trunk', 'sympathetic', segs('T1', 'T4')]],
    ['a_internal_thoracic'], ['v_brachiocephalic_left'],
    { en: 'Thymomas and thymic hyperplasia are associated with myasthenia gravis; removing the thymus (thymectomy through a median sternotomy) often improves it.',
      de: 'Thymome und Thymushyperplasie sind mit der Myasthenia gravis assoziiert; die Thymektomie (über eine mediane Sternotomie) bessert sie oft.' },
    { ellipsoids: [[[0.9, -3.2, 1.6], [0.9, 2.6, 0.55]], [[-0.9, -3.4, 1.6], [1, 2.8, 0.55]]], opacity: 0.55 },
    { color: 0xe8c07a })
];

// ------------------------------------------------------------ arteries
const A = (id, parents, name, info, extra) => ({ id, type: 'artery', parents, name, info, ...extra });
const ARCH = [[1.1, -6.6, 0.8], [0.9, -5, 0.6], [0, -4.2, 0], [-1.2, -4.3, -1], [-2.1, -4.9, -2.4], [-1.6, -6, -3.6]];

const arteries = [
  A('a_ascending_aorta', [], { en: 'Ascending aorta', de: 'Aorta ascendens', la: 'Pars ascendens aortae' },
    { en: 'Begins at the aortic valve of the left ventricle, inside the pericardium, and rises behind the sternum to the sternal angle. Its only branches are the right and left coronary arteries from the aortic sinuses.',
      de: 'Beginnt an der Aortenklappe der linken Kammer, noch im Herzbeutel, und steigt hinter dem Sternum bis zum Angulus sterni auf. Einzige Äste sind die rechte und linke Koronararterie aus den Aortensinus.' },
    { path: [AORTIC_VALVE, [0.7, -9, 0.9], ARCH[0]], r: 1.05 }),
  A('a_aortic_arch', ['a_ascending_aorta'], { en: 'Aortic arch', de: 'Aortenbogen', la: 'Arcus aortae' },
    { en: 'Arches backwards and to the left over the right pulmonary artery and the left main bronchus, from the sternal angle back to T4, and continues as the descending (thoracic) aorta. Branches from right to left: brachiocephalic trunk, left common carotid and left subclavian arteries. The ligamentum arteriosum (remnant of the ductus arteriosus) joins its underside to the left pulmonary artery; the left recurrent laryngeal nerve hooks round the arch just lateral to it.',
      de: 'Zieht bogenförmig nach hinten links über die rechte A. pulmonalis und den linken Hauptbronchus, vom Angulus sterni bis Th4, und setzt sich als Aorta descendens (thoracica) fort. Äste von rechts nach links: Truncus brachiocephalicus, A. carotis communis sinistra und A. subclavia sinistra. Das Lig. arteriosum (Rest des Ductus arteriosus Botalli) verbindet seine Unterseite mit der linken A. pulmonalis; der linke N. laryngeus recurrens schlingt sich direkt lateral davon um den Bogen.' },
    { path: ARCH, r: 0.95,
      lesion: { en: 'An aortic arch aneurysm (atherosclerosis, syphilis in the past) stretches the left recurrent laryngeal nerve where it hooks under the arch: hoarseness from left vocal fold palsy can be the first sign (Ortner syndrome is the same palsy from an enlarged left atrium). Coarctation of the aorta near the ligamentum arteriosum causes hypertension in the arms with weak femoral pulses and rib notching from collateral intercostal arteries.',
        de: 'Ein Aortenbogenaneurysma (Arteriosklerose, früher Syphilis) dehnt den linken N. laryngeus recurrens dort, wo er sich unter dem Bogen hindurchschlingt: Heiserkeit durch linksseitige Stimmlippenlähmung kann das erste Zeichen sein (beim Ortner-Syndrom verursacht ein vergrößerter linker Vorhof dieselbe Lähmung). Eine Aortenisthmusstenose am Lig. arteriosum führt zu Hypertonie in den Armen, schwachen Leistenpulsen und Rippenusuren durch Kollateralen über die Interkostalarterien.' } }),
  A('a_brachiocephalic', ['a_aortic_arch'], { en: 'Brachiocephalic trunk', de: 'Truncus brachiocephalicus', la: 'Truncus brachiocephalicus' },
    { en: 'First and largest branch of the arch. It runs up and to the right behind the manubrium, in front of the trachea, and divides behind the right sternoclavicular joint into the right common carotid and right subclavian arteries. There is no brachiocephalic trunk on the left.',
      de: 'Erster und größter Ast des Bogens. Zieht hinter dem Manubrium vor der Trachea nach rechts oben und teilt sich hinter dem rechten Sternoklavikulargelenk in A. carotis communis dextra und A. subclavia dextra. Links gibt es keinen Truncus brachiocephalicus.' },
    { path: [[0.6, -4.6, 0.4], [1, -3.2, 0.8], [1.5, -2, 1]], r: 0.65 }),
  A('a_common_carotid_right', ['a_brachiocephalic'], { en: 'Right common carotid artery', de: 'Rechte A. carotis communis', la: 'Arteria carotis communis dextra' },
    { en: 'Arises from the brachiocephalic trunk behind the right sternoclavicular joint and ascends in the carotid sheath with the internal jugular vein and the vagus nerve; it divides at the upper border of the thyroid cartilage (C4).',
      de: 'Entspringt hinter dem rechten Sternoklavikulargelenk aus dem Truncus brachiocephalicus und steigt in der Karotisscheide mit V. jugularis interna und N. vagus auf; teilt sich in Höhe des Oberrands des Schildknorpels (C4).' },
    { path: [[1.5, -2, 1], [1.9, 1, 0.2], [2.2, 5, -0.6]], r: 0.5 }),
  A('a_common_carotid_left', ['a_aortic_arch'], { en: 'Left common carotid artery', de: 'Linke A. carotis communis', la: 'Arteria carotis communis sinistra' },
    { en: 'Second branch of the arch, arising directly from it; it ascends to the left of the trachea into the neck. Its thoracic part is therefore longer than on the right.',
      de: 'Zweiter Ast, direkt aus dem Aortenbogen; steigt links neben der Trachea in den Hals auf. Ihr thorakaler Abschnitt ist daher länger als rechts.' },
    { path: [[-0.4, -4.2, -0.3], [-1, -1, -0.4], [-1.8, 5, -0.6]], r: 0.5 }),
  A('a_subclavian_left', ['a_aortic_arch'], { en: 'Left subclavian artery', de: 'Linke A. subclavia', la: 'Arteria subclavia sinistra' },
    { en: 'Third branch of the arch. It rises to the left of the trachea, arches over the cervical pleura and the apex of the left lung and becomes the axillary artery at the outer border of the first rib. Branches as on the right: vertebral, internal thoracic, thyrocervical and costocervical arteries.',
      de: 'Dritter Ast des Aortenbogens. Steigt links neben der Trachea auf, zieht über Pleurakuppel und linke Lungenspitze und wird am Außenrand der 1. Rippe zur A. axillaris. Äste wie rechts: A. vertebralis, A. thoracica interna, Truncus thyrocervicalis und Truncus costocervicalis.' },
    { path: [[-1.3, -4.4, -1.3], [-2, -1.6, -0.8], [-4.5, 2.6, 0.2], [-7.5, 1.6, -0.6], [-10, -1.2, -0.2]], r: 0.55,
      lesion: { en: 'Subclavian steal: if it is blocked before the vertebral artery, arm exercise draws blood backwards out of the vertebral artery (dizziness, arm claudication).',
        de: 'Subclavian-Steal-Syndrom: Bei einem Verschluss vor dem Abgang der A. vertebralis saugt Armarbeit Blut rückwärts aus der A. vertebralis (Schwindel, Armclaudicatio).' } }),
  A('a_rca', ['a_ascending_aorta'], { en: 'Right coronary artery (RCA)', de: 'Rechte Koronararterie (RCA)', la: 'Arteria coronaria dextra' },
    { en: 'From the right aortic sinus it runs in the right atrioventricular groove (coronary sulcus) to the back of the heart. Branches: SA-nodal artery (about 60%), right marginal artery, AV-nodal artery and, in right-dominant hearts (about 70%), the posterior interventricular artery. Supplies the right atrium and ventricle, the inferior wall of the left ventricle, the posterior third of the septum and usually both nodes.',
      de: 'Entspringt aus dem rechten Aortensinus und zieht im Sulcus coronarius (rechte AV-Furche) zur Hinterseite des Herzens. Äste: R. nodi sinuatrialis (etwa 60 %), R. marginalis dexter, R. nodi atrioventricularis und beim Rechtsversorgungstyp (etwa 70 %) der R. interventricularis posterior. Versorgt rechten Vorhof und rechte Kammer, die Hinterwand der linken Kammer, das hintere Septumdrittel und meist beide Knoten.' },
    { path: [[0.6, -11.2, 1.3], ...onHeart([[1.8, -12, 2.6], [3, -13.4, 2.4], [3.8, -15, 0.8], [3, -16, -1.4], [1, -15.8, -2.6], [-0.6, -16.6, -2]])], r: 0.24,
      lesion: { en: 'RCA occlusion: inferior wall infarct (ST elevation in II, III, aVF), often with bradycardia or AV block because the nodal arteries are lost.',
        de: 'RCA-Verschluss: Hinterwandinfarkt (ST-Hebung in II, III, aVF), oft mit Bradykardie oder AV-Block durch Ausfall der Knotenarterien.' } }),
  A('a_lca', ['a_ascending_aorta'], { en: 'Left coronary artery (LCA)', de: 'Linke Koronararterie (LCA)', la: 'Arteria coronaria sinistra' },
    { en: 'A short main stem (about 1 cm) from the left aortic sinus, passing between the pulmonary trunk and the left auricle; it divides into the anterior interventricular (LAD) and circumflex branches. Together they supply most of the left ventricle and the anterior two thirds of the septum.',
      de: 'Kurzer Hauptstamm (etwa 1 cm) aus dem linken Aortensinus, zwischen Truncus pulmonalis und linkem Herzohr; teilt sich in R. interventricularis anterior (RIVA) und R. circumflexus (RCX). Beide zusammen versorgen den größten Teil der linken Kammer und die vorderen zwei Drittel des Septums.' },
    { path: [[-0.2, -11.4, 0.2], [-1.4, -11.4, 0.6]], r: 0.3,
      lesion: { en: 'A left main stem stenosis endangers most of the left ventricle ("widow-maker"); it is treated by bypass surgery or stenting.',
        de: 'Eine Hauptstammstenose gefährdet fast die ganze linke Kammer; Behandlung durch Bypass-Operation oder Stent.' } }),
  A('a_lad', ['a_lca'], { en: 'Anterior interventricular branch (LAD)', de: 'R. interventricularis anterior (RIVA)', la: 'Ramus interventricularis anterior' },
    { en: 'Runs down the anterior interventricular groove to the apex, often around it. Diagonal branches supply the anterior wall of the left ventricle, septal branches the anterior two thirds of the septum (including the bundle branches).',
      de: 'Zieht im Sulcus interventricularis anterior zur Herzspitze, oft um sie herum. Diagonaläste versorgen die Vorderwand der linken Kammer, Septaläste die vorderen zwei Drittel des Septums (mit den Tawara-Schenkeln).' },
    { path: [[-1.4, -11.4, 0.6], ...onHeart([[-1.6, -12.4, 2.6], [-2.4, -14, 3.2], [-3.8, -15.8, 3], [-5, -17.2, 2]])], r: 0.24,
      lesion: { en: 'LAD occlusion causes an anterior wall infarct: ST elevation in V1–V4, crushing chest pain referred along T1–T4 to the left arm. A large anterior infarct leads to pump failure (cardiogenic shock), arrhythmia and later a ventricular aneurysm or septal rupture. Bundle branch block appears when the septal branches are lost.',
        de: 'Der RIVA-Verschluss verursacht einen Vorderwandinfarkt: ST-Hebung in V1–V4, Vernichtungsschmerz mit Ausstrahlung über Th1–Th4 in den linken Arm. Ein großer Vorderwandinfarkt führt zu Pumpversagen (kardiogener Schock), Rhythmusstörungen und später zu Ventrikelaneurysma oder Septumruptur. Fallen die Septaläste aus, entsteht ein Schenkelblock.' } }),
  A('a_lcx', ['a_lca'], { en: 'Circumflex branch (LCx)', de: 'R. circumflexus (RCX)', la: 'Ramus circumflexus' },
    { en: 'Runs to the left in the left atrioventricular groove round the left border of the heart to its back. Gives the left marginal branch and supplies the left atrium and the lateral and posterior wall of the left ventricle (in left-dominant hearts also the posterior interventricular artery).',
      de: 'Zieht im linken Sulcus coronarius um den linken Herzrand zur Hinterseite. Gibt den R. marginalis sinister ab und versorgt linken Vorhof sowie Seiten- und Hinterwand der linken Kammer (beim Linksversorgungstyp auch den R. interventricularis posterior).' },
    { path: [[-1.4, -11.4, 0.6], ...onHeart([[-2.8, -11.8, -0.2], [-4, -12.8, -1.4], [-3.6, -13.8, -3], [-2, -14.6, -3.6]])], r: 0.22 }),
  A('a_pulmonary_trunk', [], { en: 'Pulmonary trunk', de: 'Truncus pulmonalis', la: 'Truncus pulmonalis' },
    { en: 'Leaves the right ventricle through the pulmonary valve in front of and to the left of the ascending aorta, winds round it and divides in the concavity of the aortic arch, in front of the left main bronchus, into the right and left pulmonary arteries. It carries deoxygenated blood, which is why atlases colour it blue.',
      de: 'Verlässt die rechte Kammer über die Pulmonalklappe vor und links der Aorta ascendens, windet sich um sie und teilt sich unter dem Aortenbogen vor dem linken Hauptbronchus in rechte und linke A. pulmonalis. Führt sauerstoffarmes Blut und wird deshalb in Atlanten blau gezeichnet.' },
    { path: [PULMONARY_VALVE, [-1.4, -9.2, 1.8], [-1.4, -7.4, 0.2]], r: 0.95, color: 0x3d6fd6,
      lesion: { en: 'A large pulmonary embolism lodging at the bifurcation (saddle embolus) blocks both lungs: acute right heart failure and sudden death.',
        de: 'Eine große Lungenembolie an der Bifurkation (reitender Embolus) verlegt beide Lungen: akutes Rechtsherzversagen und plötzlicher Tod.' } }),
  A('a_pulmonary_right', ['a_pulmonary_trunk'], { en: 'Right pulmonary artery', de: 'Rechte A. pulmonalis', la: 'Arteria pulmonalis dextra' },
    { en: 'Longer than the left; runs horizontally under the aortic arch, behind the ascending aorta and the superior vena cava and in front of the right main bronchus to the hilum of the right lung.',
      de: 'Länger als die linke; zieht horizontal unter dem Aortenbogen, hinter Aorta ascendens und V. cava superior und vor dem rechten Hauptbronchus zum rechten Lungenhilum.' },
    { path: [[-1.4, -7.4, 0.2], [0.2, -7.8, -1.2], [2.8, -8.4, -1.4], [4.4, -8.8, -1.6]], r: 0.65, color: 0x3d6fd6 }),
  A('a_pulmonary_left', ['a_pulmonary_trunk'], { en: 'Left pulmonary artery', de: 'Linke A. pulmonalis', la: 'Arteria pulmonalis sinistra' },
    { en: 'Shorter; runs to the left in front of the descending aorta and arches over the left main bronchus into the hilum. The ligamentum arteriosum connects it to the aortic arch.',
      de: 'Kürzer; zieht vor der Aorta descendens nach links und über den linken Hauptbronchus in den Hilum. Das Lig. arteriosum verbindet sie mit dem Aortenbogen.' },
    { path: [[-1.4, -7.4, 0.2], [-2.8, -7.2, -0.8], [-4.6, -7.6, -1.6]], r: 0.6, color: 0x3d6fd6 }),
  A('a_bronchial', ['a_thoracic_aorta'], { en: 'Bronchial arteries', de: 'Rr. bronchiales', la: 'Rami bronchiales' },
    { en: 'Usually two left bronchial arteries from the thoracic aorta and one right from the third posterior intercostal artery. They follow the bronchi and nourish the bronchial tree, the visceral pleura and the lung tissue (vasa privata), unlike the pulmonary arteries that bring blood for gas exchange (vasa publica).',
      de: 'Meist zwei linke Äste aus der Aorta thoracica und ein rechter aus der 3. hinteren Interkostalarterie. Sie folgen den Bronchien und ernähren Bronchialbaum, Pleura visceralis und Lungengewebe (Vasa privata), im Gegensatz zu den Aa. pulmonales für den Gasaustausch (Vasa publica).' },
    { paths: [[[-1.4, -8, -4.2], [-2.6, -8.8, -3.2], [-4.4, -9.4, -2.9]], [[-1.4, -8, -4.2], [0, -8.6, -3.4], [2.6, -9, -3.1], [4, -9.6, -2.9]]], r: 0.16 }),
  A('a_oesophageal', ['a_thoracic_aorta'], { en: 'Oesophageal branches', de: 'Rr. oesophageales', la: 'Rami oesophageales' },
    { en: 'Four or five small branches from the front of the thoracic aorta to the middle third of the oesophagus. The upper third is supplied from the inferior thyroid artery, the lower third from the left gastric artery.',
      de: 'Vier bis fünf kleine Äste aus der Vorderseite der Aorta thoracica zum mittleren Drittel des Ösophagus. Das obere Drittel versorgt die A. thyroidea inferior, das untere die A. gastrica sinistra.' },
    { paths: [-11, -13.5, -16].map(y => [[-1.7, y, -4.6], [-0.9, y + 0.3, -4.6], [-0.4, y + 0.6, -4.7]]), r: 0.14 }),
  A('a_pericardiacophrenic', ['a_internal_thoracic'], { en: 'Pericardiacophrenic artery', de: 'A. pericardiacophrenica', la: 'Arteria pericardiacophrenica' },
    { en: 'A long thin branch of the internal thoracic artery that accompanies the phrenic nerve between the pericardium and the mediastinal pleura to the diaphragm, supplying all three.',
      de: 'Langer dünner Ast der A. thoracica interna, der den N. phrenicus zwischen Herzbeutel und Pleura mediastinalis zum Zwerchfell begleitet und alle drei versorgt.' },
    { paths: [[[2.4, -1.4, 1.6], [3.4, -2, 0.6], [3.8, -6, 0.2], [4.8, -12, 0.4], [5.2, -16.2, -0.4]], [[-2.4, -1.4, 1.6], [-3.4, -2, 0], [-3.8, -7.2, 0.4], [-5.8, -10, 1.2], [-6.6, -14, 1.2], [-6.6, -17, 0.2]]], r: 0.12 })
];

// ------------------------------------------------------------ veins
const V = (id, parents, name, info, extra) => ({ id, type: 'vein', parents, name, info, ...extra });
const SVC_TOP = [2.4, -1.8, 1.2];

const veins = [
  V('v_brachiocephalic_left', ['v_svc'], { en: 'Left brachiocephalic vein', de: 'Linke V. brachiocephalica', la: 'Vena brachiocephalica sinistra' },
    { en: 'Formed behind the left sternoclavicular joint by the internal jugular and subclavian veins (venous angle, where the thoracic duct enters). About twice as long as the right, it crosses obliquely behind the manubrium, in front of the arch branches, to join the right one. Receives the thymic, inferior thyroid, left superior intercostal and pericardiacophrenic veins.',
      de: 'Entsteht hinter dem linken Sternoklavikulargelenk aus V. jugularis interna und V. subclavia (Venenwinkel, Mündung des Ductus thoracicus). Etwa doppelt so lang wie die rechte, zieht schräg hinter dem Manubrium vor den Ästen des Aortenbogens zur rechten Seite. Nimmt Vv. thymicae, thyroidea inferior, intercostalis superior sinistra und pericardiacophrenicae auf.' },
    { path: [[-4.4, 1.4, 1], [-2.4, 0.6, 1.6], [0, -0.6, 1.8], SVC_TOP], r: 0.55 }),
  V('v_brachiocephalic_right', ['v_svc'], { en: 'Right brachiocephalic vein', de: 'Rechte V. brachiocephalica', la: 'Vena brachiocephalica dextra' },
    { en: 'Short and almost vertical; formed behind the right sternoclavicular joint and joined by the left vein behind the first right costal cartilage to form the superior vena cava.',
      de: 'Kurz und fast senkrecht; entsteht hinter dem rechten Sternoklavikulargelenk und vereinigt sich hinter dem 1. rechten Rippenknorpel mit der linken zur V. cava superior.' },
    { path: [[4.4, 1.4, 1], [3.4, 0, 1.2], SVC_TOP], r: 0.55 }),
  V('v_svc', ['right_atrium'], { en: 'Superior vena cava', de: 'Obere Hohlvene', la: 'Vena cava superior' },
    { en: 'Drains everything above the diaphragm except the lungs and heart. Formed behind the first right costal cartilage by the two brachiocephalic veins, it descends to the right of the ascending aorta and enters the right atrium at the level of the third costal cartilage; the azygos vein joins it from behind just before it enters the pericardium. It has no valves.',
      de: 'Sammelt das Blut von allem oberhalb des Zwerchfells außer Lunge und Herz. Entsteht hinter dem 1. rechten Rippenknorpel aus den beiden Vv. brachiocephalicae, zieht rechts der Aorta ascendens abwärts und mündet in Höhe des 3. Rippenknorpels in den rechten Vorhof; kurz vor dem Herzbeutel nimmt sie von hinten die V. azygos auf. Sie hat keine Klappen.' },
    { path: [SVC_TOP, [2.8, -5, 0.8], [2.9, -9.2, 0.6]], r: 0.75,
      lesion: { en: 'Superior vena cava syndrome: compression by a bronchial carcinoma or lymphoma swells the face, neck and arms, distends the neck veins and opens collaterals over the chest wall.',
        de: 'Vena-cava-superior-Syndrom: Kompression durch Bronchialkarzinom oder Lymphom führt zu Schwellung von Gesicht, Hals und Armen, gestauten Halsvenen und Kollateralen über der Brustwand.' } }),
  V('v_ivc', ['right_atrium'], { en: 'Inferior vena cava (thoracic part)', de: 'Untere Hohlvene (Pars thoracica)', la: 'Vena cava inferior' },
    { en: 'Drains the lower body. It passes through the caval opening in the central tendon of the diaphragm at T8 and, after a course of only 1–2 cm in the thorax, enters the lower part of the right atrium; the valve of the inferior vena cava guarded the stream to the foramen ovale before birth.',
      de: 'Sammelt das Blut der unteren Körperhälfte. Tritt in Höhe Th8 durch das Foramen venae cavae im Centrum tendineum und mündet nach nur 1–2 cm Verlauf im Thorax unten in den rechten Vorhof; die Valvula venae cavae inferioris lenkte vor der Geburt den Blutstrom zum Foramen ovale.' },
    { path: [[2.2, -21, -2.4], [2.4, -18.6, -1.2], [2.6, -14.4, -0.2]], r: 0.9 }),
  V('v_azygos', ['v_svc'], { en: 'Azygos vein', de: 'V. azygos', la: 'Vena azygos' },
    { en: 'Ascends on the right side of the vertebral bodies in the posterior mediastinum, from the ascending lumbar vein through the right crus, and arches forwards over the root of the right lung at T4 into the superior vena cava. Receives the right posterior intercostal veins, the hemiazygos and accessory hemiazygos veins, and bronchial and oesophageal veins. It connects the inferior and superior venae cavae (cavo-caval anastomosis).',
      de: 'Steigt rechts neben den Wirbelkörpern im hinteren Mediastinum auf, aus der V. lumbalis ascendens durch den rechten Zwerchfellschenkel, und mündet in Höhe Th4 im Bogen über die rechte Lungenwurzel in die V. cava superior. Nimmt die rechten Vv. intercostales posteriores, die Vv. hemiazygos und hemiazygos accessoria sowie Bronchial- und Ösophagusvenen auf. Verbindet obere und untere Hohlvene (kavokavale Anastomose).' },
    { path: [[1.4, -26, -5], [1.6, -20, -5.8], [1.7, -14, -6], [1.7, -9, -5.6], [2.4, -6.6, -4.6], [3.1, -6, -2.6], [3.2, -6.2, -0.6], [2.95, -6.6, 0.3]], r: 0.42,
      lesion: { en: 'When the inferior vena cava is blocked, blood returns to the heart through the azygos system. The arch of the azygos is a landmark at mediastinoscopy and on chest X-ray (right tracheobronchial angle).',
        de: 'Bei Verschluss der V. cava inferior fließt das Blut über das Azygos-System zum Herzen zurück. Der Azygosbogen ist ein Orientierungspunkt bei der Mediastinoskopie und im Röntgenbild (rechter Tracheobronchialwinkel).' } }),
  V('v_hemiazygos', ['v_azygos'], { en: 'Hemiazygos vein', de: 'V. hemiazygos', la: 'Vena hemiazygos' },
    { en: 'The left counterpart of the lower azygos: it ascends on the left of the vertebral bodies, receives the lower left posterior intercostal veins (9–11) and crosses behind the aorta, oesophagus and thoracic duct at about T8–T9 to the azygos vein. The accessory hemiazygos vein drains the middle left intercostal spaces in the same way.',
      de: 'Linkes Gegenstück der unteren V. azygos: Steigt links neben den Wirbelkörpern auf, nimmt die unteren linken Vv. intercostales posteriores (9–11) auf und zieht in Höhe Th8–Th9 hinter Aorta, Ösophagus und Ductus thoracicus zur V. azygos. Die V. hemiazygos accessoria drainiert die mittleren linken Interkostalräume auf dieselbe Weise.' },
    { path: [[-2.4, -26, -5.2], [-2.6, -22, -5.9], [-2.4, -19.4, -6.4], [-0.6, -18.6, -6.6], [1.65, -18.2, -6]], r: 0.32 }),
  V('v_pulmonary_right', ['left_atrium'], { en: 'Right pulmonary veins', de: 'Rechte Vv. pulmonales', la: 'Venae pulmonales dextrae' },
    { en: 'Superior and inferior right pulmonary veins (the superior also drains the middle lobe). They carry oxygenated blood from the right lung, lie lowest and most anterior at the hilum, and enter the left atrium behind the superior vena cava and right atrium.',
      de: 'Obere und untere rechte Lungenvene (die obere drainiert auch den Mittellappen). Sie führen sauerstoffreiches Blut aus der rechten Lunge, liegen im Hilum am weitesten unten und vorn und münden hinter V. cava superior und rechtem Vorhof in den linken Vorhof.' },
    { paths: [[[4.4, -9.8, -1.4], [3, -10.4, -1.7], [1.8, -10.8, -1.9]], [[4.2, -12.4, -2.8], [3, -12.2, -2.6], [1.8, -12, -2.5]]], r: 0.38, color: 0xc8343f }),
  V('v_pulmonary_left', ['left_atrium'], { en: 'Left pulmonary veins', de: 'Linke Vv. pulmonales', la: 'Venae pulmonales sinistrae' },
    { en: 'Superior and inferior left pulmonary veins carrying oxygenated blood from the left lung into the left atrium. Atlases colour them red.',
      de: 'Obere und untere linke Lungenvene; sie führen sauerstoffreiches Blut aus der linken Lunge in den linken Vorhof. In Atlanten rot gezeichnet.' },
    { paths: [[[-4.4, -9.6, -1.6], [-3.4, -10.2, -1.9], [-2.4, -10.6, -2]], [[-4.2, -12.2, -2.8], [-3.2, -12, -2.7], [-2.4, -11.8, -2.6]]], r: 0.38, color: 0xc8343f,
      lesion: { en: 'Ectopic beats from the muscle sleeves of the pulmonary veins trigger atrial fibrillation; catheter ablation isolates the vein openings electrically.',
        de: 'Extrasystolen aus den Muskelmanschetten der Lungenvenen lösen Vorhofflimmern aus; die Katheterablation isoliert die Venenmündungen elektrisch (Pulmonalvenenisolation).' } }),
  V('v_coronary_sinus', ['right_atrium'], { en: 'Coronary sinus', de: 'Sinus coronarius', la: 'Sinus coronarius' },
    { en: 'The main vein of the heart, in the posterior atrioventricular groove. It collects the great, middle and small cardiac veins and opens into the right atrium between the opening of the inferior vena cava and the tricuspid valve.',
      de: 'Hauptvene des Herzens im hinteren Sulcus coronarius. Sammelt V. cardiaca magna, media und parva und mündet zwischen der Mündung der V. cava inferior und der Trikuspidalklappe in den rechten Vorhof.' },
    { path: onHeart([[-3.4, -13.2, -2.6], [-1.6, -13.6, -3.2], [0.4, -13.8, -2.6], [1.6, -13.6, -1.4]]), r: 0.3 })
];

// ------------------------------------------------------------ nerves
const N = (id, group, segList, parents, name, info, extra) => ({ id, type: 'nerve', group, segs: segList, parents, name, info, ...extra });
const VAGUS_R = [[2.4, 6, -0.6], [2.6, 2.4, 0.4], [2.4, -0.2, 1.6], [1.6, -3, -0.9], [1.4, -6, -2.8], [1.6, -9, -4], [0.8, -12, -5.2], [0.2, -16, -4.9], [-0.8, -18.8, -3.6]];
const VAGUS_L = [[-1.8, 6, -0.8], [-2, 0, -0.4], [-2.6, -4.6, -1.4], [-2.4, -8, -3.8], [-0.6, -12, -3.9], [-0.8, -16, -3.6], [-1.6, -18.6, -2.3]];
const CARDIAC_HUB = [-0.6, -6.4, -1];

const nerves = [
  N('n_vagus', 'parasympathetic', [VAGUS], [], { en: 'Vagus nerve (CN X)', de: 'N. vagus (X. Hirnnerv)', la: 'Nervus vagus' },
    { en: 'Tenth cranial nerve and the main parasympathetic nerve of the thoracic and abdominal organs. The right vagus crosses in front of the right subclavian artery, the left in front of the aortic arch; both pass behind the lung roots (pulmonary plexus) and form the oesophageal plexus. Branches in the thorax: recurrent laryngeal nerves, cardiac branches (slow the heart), pulmonary branches (bronchoconstriction, secretion), oesophageal branches (peristalsis). Its fibres continue as the vagal trunks to the abdomen.',
      de: 'X. Hirnnerv und wichtigster parasympathischer Nerv der Brust- und Bauchorgane. Der rechte Vagus kreuzt vor der rechten A. subclavia, der linke vor dem Aortenbogen; beide ziehen hinter den Lungenwurzeln vorbei (Plexus pulmonalis) und bilden den Plexus oesophageus. Äste im Thorax: Nn. laryngei recurrentes, Rr. cardiaci (senken die Herzfrequenz), Rr. bronchiales (Bronchokonstriktion, Sekretion), Rr. oesophagei (Peristaltik). Seine Fasern ziehen als Trunci vagales in den Bauchraum weiter.' },
    { paths: [VAGUS_R, VAGUS_L], r: 0.22,
      lesion: { en: 'A high vagus lesion (e.g. at the skull base) causes hoarseness and difficulty swallowing; the uvula deviates to the healthy side. Loss of cardiac vagal fibres gives a resting tachycardia; vagal overactivity (vasovagal syncope) slows the heart and drops the blood pressure.',
        de: 'Eine hohe Vagusläsion (z. B. an der Schädelbasis) verursacht Heiserkeit und Schluckstörungen; das Zäpfchen weicht zur gesunden Seite ab. Fehlen die kardialen Vagusfasern, entsteht eine Ruhetachykardie; eine Übererregung (vasovagale Synkope) senkt Herzfrequenz und Blutdruck.' } }),
  N('n_recurrent_laryngeal_left', 'parasympathetic', [VAGUS], ['n_vagus'], { en: 'Left recurrent laryngeal nerve', de: 'Linker N. laryngeus recurrens', la: 'Nervus laryngeus recurrens sinister' },
    { en: 'Leaves the left vagus in front of the aortic arch, hooks under the arch just lateral to the ligamentum arteriosum and ascends in the groove between trachea and oesophagus to the larynx. It supplies all intrinsic laryngeal muscles except cricothyroid, the mucosa below the vocal folds, and gives tracheal and oesophageal branches. Its long thoracic course makes it more vulnerable than the right.',
      de: 'Verlässt den linken Vagus vor dem Aortenbogen, schlingt sich direkt lateral des Lig. arteriosum unter dem Bogen hindurch und steigt in der Rinne zwischen Trachea und Ösophagus zum Kehlkopf auf. Versorgt alle inneren Kehlkopfmuskeln außer dem M. cricothyroideus, die Schleimhaut unterhalb der Stimmlippen und gibt Rr. tracheales und oesophagei ab. Durch den langen thorakalen Verlauf ist er gefährdeter als der rechte.' },
    { path: [[-2.6, -4.6, -1.4], [-2.5, -6.1, -1.8], [-1.7, -6.6, -2.8], [-0.9, -5.4, -3.2], [-0.8, -2, -2.5], [-0.8, 2, -1.6], [-0.8, 6, -1.1]], r: 0.15,
      lesion: { en: 'Recurrent laryngeal nerve palsy: hoarseness after an aortic arch aneurysm, a left hilar or mediastinal tumour, an enlarged left atrium (Ortner syndrome) or thyroid surgery. The left vocal fold stays in the paramedian position; if both nerves are cut the folds close the airway (stridor, tracheotomy).',
        de: 'Rekurrensparese: Heiserkeit nach Aortenbogenaneurysma, linkshilärem oder mediastinalem Tumor, vergrößertem linkem Vorhof (Ortner-Syndrom) oder Schilddrüsenoperation. Die linke Stimmlippe steht paramedian; bei beidseitiger Parese verschließen die Stimmlippen die Atemwege (Stridor, Tracheotomie).' } }),
  N('n_recurrent_laryngeal_right', 'parasympathetic', [VAGUS], ['n_vagus'], { en: 'Right recurrent laryngeal nerve', de: 'Rechter N. laryngeus recurrens', la: 'Nervus laryngeus recurrens dexter' },
    { en: 'Leaves the right vagus in front of the right subclavian artery, hooks below and behind it and ascends in the tracheo-oesophageal groove to the larynx. It does not enter the thorax proper, so its course is shorter than on the left.',
      de: 'Verlässt den rechten Vagus vor der rechten A. subclavia, schlingt sich unter und hinter ihr hindurch und steigt in der Rinne zwischen Trachea und Ösophagus zum Kehlkopf. Er reicht nicht in den eigentlichen Thorax, sein Verlauf ist daher kürzer als links.' },
    { path: [[2.4, -0.2, 1.6], [2.9, -1.2, 0.6], [2.7, -0.8, -0.4], [1.6, 1, -1], [0.9, 4, -1.2], [0.9, 6, -1.2]], r: 0.15,
      lesion: { en: 'Can be injured in thyroid surgery or by a tumour of the right lung apex: hoarseness from right vocal fold palsy.',
        de: 'Kann bei Schilddrüsenoperationen oder durch einen Tumor der rechten Lungenspitze verletzt werden: Heiserkeit durch rechtsseitige Stimmlippenlähmung.' } }),
  N('n_sympathetic_trunk', 'sympathetic', segs('T1', 'L2'), [], { en: 'Sympathetic trunk', de: 'Truncus sympathicus (Grenzstrang)', la: 'Truncus sympathicus' },
    { en: 'A chain of ganglia on each side of the vertebral column, in the thorax on the heads of the ribs. Preganglionic fibres leave the spinal cord only at T1–L2 (thoracolumbar outflow) through white rami communicantes; grey rami return postganglionic fibres to every spinal nerve. The cervicothoracic (stellate) ganglion at T1 supplies the head and arm; cardiac and pulmonary branches arise from the cervical and upper thoracic ganglia; the splanchnic nerves pass through the ganglia to the abdomen.',
      de: 'Ganglienkette beiderseits der Wirbelsäule, im Thorax auf den Rippenköpfchen. Präganglionäre Fasern verlassen das Rückenmark nur in Th1–L2 (thorakolumbales System) über Rr. communicantes albi; Rr. communicantes grisei führen postganglionäre Fasern zu jedem Spinalnerv zurück. Das Ganglion cervicothoracicum (stellatum) in Höhe Th1 versorgt Kopf und Arm; Herz- und Lungenäste stammen aus den Hals- und oberen Brustganglien; die Nn. splanchnici ziehen durch die Ganglien zu den Bauchorganen.' },
    { paths: [trunkPath(1), trunkPath(-1)], r: 0.2,
      lesion: { en: 'Horner syndrome from a lesion of the cervicothoracic (stellate) ganglion or the trunk above it, e.g. by a Pancoast tumour: ptosis, miosis and anhidrosis of the face on the same side. Thoracic sympathectomy (T2–T3) is used for severe hand sweating.',
        de: 'Horner-Syndrom bei Läsion des Ganglion stellatum oder des Grenzstrangs darüber, z. B. durch einen Pancoast-Tumor: Ptosis, Miosis und Anhidrose der gleichen Gesichtsseite. Die thorakale Sympathektomie (Th2–Th3) wird bei schwerem Handschweiß eingesetzt.' } }),
  N('n_greater_splanchnic', 'sympathetic', segs('T5', 'T9'), ['n_sympathetic_trunk'], { en: 'Greater splanchnic nerve', de: 'N. splanchnicus major', la: 'Nervus splanchnicus major' },
    { en: 'Preganglionic sympathetic fibres from T5–T9 that pass through the thoracic ganglia without synapsing, run down on the vertebral bodies, pierce the crus of the diaphragm and end in the coeliac ganglion (foregut organs: stomach, liver, pancreas, spleen). They also carry the visceral pain fibres of these organs.',
      de: 'Präganglionäre sympathische Fasern aus Th5–Th9, die ohne Umschaltung durch die Brustganglien ziehen, auf den Wirbelkörpern absteigen, den Zwerchfellschenkel durchbohren und im Ganglion coeliacum enden (Vorderdarmorgane: Magen, Leber, Pankreas, Milz). Sie führen auch deren viszerale Schmerzfasern.' },
    { paths: [...splanchnic(1, ['T5', 'T6', 'T7', 'T8', 'T9'], [1.6, -28.6, -4.6]), ...splanchnic(-1, ['T5', 'T6', 'T7', 'T8', 'T9'], [1.6, -28.6, -4.6])], r: 0.13,
      lesion: { en: 'Pain from the stomach, gallbladder or pancreas travels with these fibres and is felt in the epigastrium (T5–T9 dermatomes). A coeliac plexus block for pancreatic cancer pain interrupts them.',
        de: 'Schmerzen aus Magen, Gallenblase oder Pankreas laufen mit diesen Fasern und werden im Epigastrium empfunden (Dermatome Th5–Th9). Eine Zöliakusblockade bei Pankreaskarzinomschmerz unterbricht sie.' } }),
  N('n_lesser_splanchnic', 'sympathetic', segs('T10', 'T11'), ['n_sympathetic_trunk'], { en: 'Lesser splanchnic nerve', de: 'N. splanchnicus minor', la: 'Nervus splanchnicus minor' },
    { en: 'Preganglionic sympathetic fibres from T10–T11 that pierce the crus of the diaphragm and end in the aorticorenal ganglion (midgut organs and kidneys). The least splanchnic nerve (T12) goes to the renal plexus.',
      de: 'Präganglionäre sympathische Fasern aus Th10–Th11, die den Zwerchfellschenkel durchbohren und im Ganglion aorticorenale enden (Mitteldarmorgane und Nieren). Der N. splanchnicus imus (Th12) zieht zum Plexus renalis.' },
    { paths: [...splanchnic(1, ['T10', 'T11'], [2, -29.6, -4.4]), ...splanchnic(-1, ['T10', 'T11'], [2, -29.6, -4.4])], r: 0.12 }),
  N('n_cardiac_plexus', 'plexus', [...segs('T1', 'T4'), VAGUS], ['n_vagus', 'n_sympathetic_trunk'], { en: 'Cardiac plexus', de: 'Plexus cardiacus', la: 'Plexus cardiacus' },
    { en: 'Network between the aortic arch and the tracheal bifurcation, formed by cardiac branches of both vagi (parasympathetic: slower rate and AV conduction) and cardiac nerves from the cervical and upper thoracic sympathetic ganglia T1–T4 (faster rate, stronger contraction, coronary dilatation). Visceral pain fibres return with the sympathetic nerves.',
      de: 'Geflecht zwischen Aortenbogen und Trachealbifurkation aus den Herzästen beider Vagi (parasympathisch: senken Frequenz und AV-Überleitung) und den Nn. cardiaci der Hals- und oberen Brustganglien Th1–Th4 (sympathisch: steigern Frequenz und Kontraktionskraft, erweitern die Koronarien). Viszerale Schmerzfasern laufen mit dem Sympathikus zurück.' },
    { paths: [[[1.4, -4, -1.2], [0.4, -5.8, -1.6], CARDIAC_HUB], [[-2.4, -4.4, -1.2], [-1.4, -5.8, -1.4], CARDIAC_HUB], [[2.6, 1, -4], [1.8, -3, -2.6], [0.2, -6, -1.8], CARDIAC_HUB],
      [[-2.6, 1, -4], [-1.8, -3, -2.6], [-0.8, -6, -1.8], CARDIAC_HUB], [CARDIAC_HUB, [-0.4, -8.6, 0.2], [0.2, -10.4, 0.8]], [CARDIAC_HUB, [-1.2, -8.8, -0.6], [-1.6, -10.8, -0.4]]], r: 0.12,
      lesion: { en: 'Cutting all cardiac nerves (as in a heart transplant) leaves the heart beating at its intrinsic rate, without angina pain: transplanted hearts have "silent" ischaemia.',
        de: 'Werden alle Herznerven durchtrennt (wie bei einer Herztransplantation), schlägt das Herz mit seiner Eigenfrequenz und ohne Angina-Schmerz: Transplantierte Herzen haben "stumme" Ischämien.' } }),
  N('n_pulmonary_plexus', 'plexus', [...segs('T2', 'T5'), VAGUS], ['n_vagus', 'n_sympathetic_trunk'], { en: 'Pulmonary plexus', de: 'Plexus pulmonalis', la: 'Plexus pulmonalis' },
    { en: 'Network at the root of each lung, in front of and mainly behind the hilum, continuous with the cardiac plexus. Vagal fibres constrict the bronchi, increase mucus secretion and carry the cough reflex; sympathetic fibres (T2–T5) dilate the bronchi and constrict the pulmonary vessels.',
      de: 'Geflecht an jeder Lungenwurzel, vor und vor allem hinter dem Hilum, in Verbindung mit dem Plexus cardiacus. Vagusfasern verengen die Bronchien, steigern die Schleimsekretion und leiten den Hustenreflex; sympathische Fasern (Th2–Th5) erweitern die Bronchien und verengen die Lungengefäße.' },
    { paths: [[[1.6, -8.6, -3.8], [2.6, -8.8, -3.2], [3.8, -9.2, -2.9]], [[1.6, -8.6, -3.8], [2.8, -9.8, -3.2], [3.8, -10.2, -2.9]],
      [[-2.4, -8, -3.8], [-3.2, -8.6, -3.4], [-4.4, -9.2, -3.1]], [[-2.4, -8, -3.8], [-3.2, -9.6, -3.4], [-4.2, -10.2, -3.1]], [CARDIAC_HUB, [0.4, -7.6, -1.8], [1.6, -8.6, -3.8]]], r: 0.11 }),
  N('n_oesophageal_plexus', 'plexus', [...segs('T4', 'T6'), VAGUS], ['n_vagus', 'n_sympathetic_trunk'], { en: 'Oesophageal plexus', de: 'Plexus oesophageus', la: 'Plexus oesophageus' },
    { en: 'Network of both vagi on the lower thoracic oesophagus, joined by sympathetic fibres. Fibres of the left vagus come to lie mostly in front (anterior vagal trunk) and those of the right vagus behind (posterior vagal trunk), following the rotation of the stomach; both pass through the oesophageal hiatus.',
      de: 'Geflecht beider Vagi auf dem unteren Brustteil des Ösophagus, ergänzt durch sympathische Fasern. Die Fasern des linken Vagus kommen überwiegend vorn (Truncus vagalis anterior), die des rechten hinten zu liegen (Truncus vagalis posterior), entsprechend der Magendrehung; beide ziehen durch den Hiatus oesophageus.' },
    { paths: [[[0.8, -12, -5.2], [-0.6, -13, -3.9]], [[-0.6, -12, -3.9], [0.6, -13.6, -5.3]], [[0.6, -13.6, -5.3], [-0.8, -14.8, -3.8]], [[-0.7, -14.4, -3.8], [0.4, -15.6, -5]], [[-1.6, -18.6, -2.3], [-2.4, -20.2, -1.4]], [[-0.8, -18.8, -3.6], [-2, -20.2, -2.6]]], r: 0.11 })
];

export const structures = [...organs, ...arteries, ...veins, ...nerves];
export const muscleGroups = {};

export const meta = {
  start: 'heart',
  plexus: { en: 'Autonomic nerves', de: 'Vegetative Nerven' },
  plexusTargets: { en: 'Autonomic nerves → organs', de: 'Vegetative Nerven → Organe' },
  nerveGroups: [
    ['parasympathetic', { en: 'Parasympathetic: vagus nerve', de: 'Parasympathikus: N. vagus' }],
    ['sympathetic', { en: 'Sympathetic trunk and splanchnic nerves', de: 'Grenzstrang und Nn. splanchnici' }],
    ['plexus', { en: 'Autonomic plexuses', de: 'Vegetative Plexus' }]
  ],
  organGroups: [
    ['heart', { en: 'Heart', de: 'Herz' }],
    ['lungs', { en: 'Lungs and airways', de: 'Lunge und Atemwege' }],
    ['mediastinum', { en: 'Pericardium and mediastinum', de: 'Herzbeutel und Mediastinum' }]
  ],
  // Thoracic wall, diaphragm and the vessels and nerves shared with the back and upper limb.
  context: ['ribs', 'sternum', 'thoracic_vertebrae', 'diaphragm', 'external_intercostals', 'internal_intercostals',
    'n_phrenic', 'a_thoracic_aorta', 'a_subclavian', 'a_internal_thoracic'],
  contextOpacity: 0.35, // fade the borrowed chest wall so the organs stay visible
  camera: { target: [0, -10, -1], position: [14, -2, 66] }
};
