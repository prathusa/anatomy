// Abdomen: stomach and intestine, liver and biliary tract, pancreas, spleen, kidneys, ureters and
// suprarenal glands, peritoneum, the visceral branches of the abdominal aorta, the portal system
// and the abdominal autonomic nerves.
// Coordinates: [lateral, superior, anterior] in schematic cm, same body frame as the back and thorax
// modules (x > 0 is the body's right; the viewer mirrors x). Negative x is the body's left.
//
// Organs carry `nerves` ({ n, seg, kind }), `arteries`, `veins` and an optional `partOf`, as in the
// thorax. Veins name the vessel or organ they drain into as `parents` (the portal vein drains into
// the liver). The parasympathetic supply of the descending and sigmoid colon comes from the pelvic
// splanchnic nerves (S2–S4), which belong to the pelvis module.

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
range(1, 5).forEach(n => { Y['L' + n] = -30.2 - (n - 1) * 3.1; });
const COLUMN_Z = [[14, -3.4], [8, -2.9], [3, -3.2], [0, -3.9], [-4, -5.2], [-10, -6.8], [-16, -7.4], [-22, -7.1], [-27, -6.5], [-31, -5.8], [-36, -5.3]];
function bodyZ(y) {
  if (y >= COLUMN_Z[0][0]) return COLUMN_Z[0][1];
  for (let i = 1; i < COLUMN_Z.length; i++) {
    const [y0, z0] = COLUMN_Z[i - 1], [y1, z1] = COLUMN_Z[i];
    if (y >= y1) return z0 + (z1 - z0) * (y0 - y) / (y0 - y1);
  }
  return COLUMN_Z[COLUMN_Z.length - 1][1];
}

// ------------------------------------------------------------ ellipsoid helpers
// An ellipsoid is [centre, half-sizes, axis?]; the axis is where its local y axis points.
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

// ------------------------------------------------------------ organ geometry
const LIVER = [[[5, -22.4, -0.4], [5.2, 4, 4.8]], [[-1.6, -20.6, 2.2], [4.2, 1.8, 2.6]]];
const LIVER_C = [3, -22, 0];
const onLiver = pts => pts.map(p => onSurface(LIVER, LIVER_C, p, 0.08));
// Cantlie line (gallbladder fossa to IVC: right and left liver) and the falciform ligament line
// (left medial segment IV versus left lateral segments II/III).
const CANTLIE = onLiver([[5, -24.8, 3], [4.4, -23, 3.4], [3.6, -20.6, 2.4], [2.8, -19, 0.2], [2.4, -18.8, -1.4]]);
const FALCIFORM = onLiver([[0.6, -23.2, 3.4], [0.6, -21.4, 3.6], [0.6, -19.6, 2.4], [0.6, -19, 0.4]]);

const STOMACH = [[[-5.4, -20.4, -1.2], [2.6, 2.4, 2.4]], [[-5, -24.4, 0.6], [2.9, 3.6, 2.6], [0.25, -1, 0.15]], [[-1.4, -28.2, 1.8], [1.8, 3.2, 1.9], [1, 0.35, 0]]];
const PYLORUS = [2.4, -28.8, 1.6];
const DUODENUM = [PYLORUS, [3.8, -28.8, 0.6], [4.6, -29.6, -0.6], [5, -31.6, -1.2], [4.8, -33.6, -1.4], [3.6, -34.6, -1.6], [1, -35.2, -1.6], [-1.6, -34.6, -1.6], [-2.8, -33.4, -1.4], [-3, -31.6, -0.8]];
const JEJUNUM = [[-3, -31.6, -0.8], [-5, -32.2, 0.8], [-7.2, -33.6, 1], [-6.4, -35.4, 2.6], [-3.4, -35.4, 2.8], [-2.4, -37, 2.4], [-4.6, -38, 2.8], [-7.4, -37.6, 1.8], [-7.6, -40, 2.2], [-4.4, -40.6, 3]];
const ILEUM = [[-4.4, -40.6, 3], [-1.6, -40.8, 3], [0.6, -39.8, 2.6], [3, -40.2, 2.6], [1.6, -42.4, 3], [-1.6, -43, 3], [-2.4, -45, 2], [0.6, -46, 2.4], [3.4, -45.4, 2.6], [5.4, -44.6, 1.2], [6.2, -44.4, 0.4]];
const URETER_R = [[4, -33.6, -4.2], [3.6, -36, -3.8], [3.8, -40, -3.6], [4.4, -44, -3.4], [4.2, -46.4, -1.8], [4.4, -49.6, -1.2]];
const URETER_L = [[-4, -32.4, -4.2], [-3.6, -35, -3.8], [-3.8, -40, -3.6], [-4.4, -44, -3.4], [-4.2, -46.4, -1.8], [-4.4, -49.6, -1.2]];

// ------------------------------------------------------------ organs
const O = (id, group, name, info, nerves, arteries, veins, lesion, shape, extra) => ({
  id, type: 'organ', group, name, info, nerves: nerves.map(([n, kind, seg]) => ({ n, kind, seg })), arteries, veins, lesion, shape, ...extra
});
const COELIAC = ['n_coeliac_plexus', 'sympathetic', segs('T6', 'T9')];
const FOREGUT_VAGUS = ['n_coeliac_plexus', 'parasympathetic', [VAGUS]];
const MIDGUT_VAGUS = ['n_superior_mesenteric_plexus', 'parasympathetic', [VAGUS]];
const PHRENIC_SENSORY = ['n_phrenic', 'sensory', ['C3', 'C4', 'C5']];

const organs = [
  O('stomach', 'foregut', { en: 'Stomach', de: 'Magen', la: 'Gaster (Ventriculus)' },
    { en: 'J-shaped sac in the left upper quadrant between the oesophagus (cardia, T11) and the duodenum (pylorus, L1, transpyloric plane). Parts: cardia, fundus (under the left dome of the diaphragm, holds the air bubble), body and pyloric part (antrum, canal, sphincter). The lesser curvature faces up and right and carries the lesser omentum; the greater curvature carries the greater omentum. All arteries come from the coeliac trunk: left and right gastric arteries along the lesser curvature, left and right gastro-omental arteries along the greater curvature, short gastric arteries to the fundus. The vagal trunks drive acid secretion and emptying; the sympathetic fibres (T6–T9) slow it and carry pain to the epigastrium.',
      de: 'J-förmiger Sack im linken Oberbauch zwischen Ösophagus (Kardia, Th11) und Duodenum (Pylorus, L1, Transpylorusebene). Abschnitte: Kardia, Fundus (unter der linken Zwerchfellkuppel, enthält die Magenblase), Corpus und Pars pylorica (Antrum, Canalis, Sphinkter). Die kleine Kurvatur zeigt nach rechts oben und trägt das kleine Netz, die große Kurvatur das große Netz. Alle Arterien stammen aus dem Truncus coeliacus: Aa. gastricae sinistra und dextra an der kleinen, Aa. gastroomentales sinistra und dextra an der großen Kurvatur, Aa. gastricae breves zum Fundus. Die Trunci vagales steigern Säuresekretion und Entleerung; der Sympathikus (Th6–Th9) hemmt sie und leitet Schmerz ins Epigastrium.' },
    [['n_vagal_trunk_anterior', 'parasympathetic', [VAGUS]], ['n_vagal_trunk_posterior', 'parasympathetic', [VAGUS]], COELIAC],
    ['a_left_gastric', 'a_right_gastric', 'a_left_gastroomental', 'a_right_gastroomental', 'a_short_gastric'], ['v_left_gastric', 'v_portal', 'v_splenic', 'v_smv'],
    { en: 'A peptic ulcer on the posterior wall can perforate into the lesser sac or erode the splenic artery; one on the lesser curvature can erode the left gastric artery. Ulcer pain is felt in the epigastrium (T6–T9). Vagotomy reduces acid secretion but delays gastric emptying unless a pyloroplasty is added.',
      de: 'Ein Ulkus der Hinterwand kann in die Bursa omentalis perforieren oder die A. splenica arrodieren, eines an der kleinen Kurvatur die A. gastrica sinistra. Ulkusschmerz wird im Epigastrium empfunden (Th6–Th9). Die Vagotomie senkt die Säuresekretion, verzögert aber die Magenentleerung, wenn keine Pyloroplastik dazukommt.' },
    { ellipsoids: STOMACH, tubes: [[[[0.8, -28.4, 1.8], PYLORUS], 0.8]], opacity: 0.45 },
    { color: 0xd98a78 }),
  O('duodenum', 'foregut', { en: 'Duodenum', de: 'Zwölffingerdarm', la: 'Duodenum' },
    { en: 'The first, C-shaped part of the small intestine (about 25 cm) around the head of the pancreas, mostly retroperitoneal. Superior part (L1, the mobile "duodenal cap"), descending part (L1–L3, with the major papilla where the common bile duct and the pancreatic duct open, sphincter of Oddi), horizontal part (L3, crossing between the aorta behind and the superior mesenteric vessels in front) and ascending part to the duodenojejunal flexure (suspensory muscle, ligament of Treitz). It marks the border of foregut and midgut: above the papilla it is supplied from the coeliac trunk, below it from the superior mesenteric artery.',
      de: 'Erster, C-förmiger Abschnitt des Dünndarms (etwa 25 cm) um den Pankreaskopf, überwiegend retroperitoneal. Pars superior (L1, der bewegliche "Bulbus duodeni"), Pars descendens (L1–L3, mit der Papilla duodeni major, an der Ductus choledochus und Ductus pancreaticus münden, Sphincter Oddi), Pars horizontalis (L3, zwischen Aorta hinten und Mesenterialgefäßen vorn) und Pars ascendens bis zur Flexura duodenojejunalis (M. suspensorius duodeni, Treitz-Band). Hier liegt die Grenze von Vorder- und Mitteldarm: Oberhalb der Papille versorgt der Truncus coeliacus, unterhalb die A. mesenterica superior.' },
    [COELIAC, FOREGUT_VAGUS, ['n_superior_mesenteric_plexus', 'sympathetic', segs('T8', 'T10')]],
    ['a_gastroduodenal', 'a_pancreaticoduodenal'], ['v_smv', 'v_portal'],
    { en: 'Most peptic ulcers lie in the duodenal cap. A posterior duodenal ulcer can erode the gastroduodenal artery and cause massive bleeding; an anterior one perforates into the peritoneal cavity (free air under the diaphragm). The horizontal part can be compressed between aorta and superior mesenteric artery after rapid weight loss (SMA syndrome).',
      de: 'Die meisten peptischen Ulzera liegen im Bulbus duodeni. Ein Ulkus der Hinterwand kann die A. gastroduodenalis arrodieren und massiv bluten; ein Vorderwandulkus perforiert in die Bauchhöhle (freie Luft unter dem Zwerchfell). Die Pars horizontalis kann nach starkem Gewichtsverlust zwischen Aorta und A. mesenterica superior eingeklemmt werden (Wilkie-Syndrom).' },
    { tubes: [[DUODENUM, 0.85]], opacity: 0.55 },
    { color: 0xe0a184 }),
  O('jejunum', 'intestine', { en: 'Jejunum', de: 'Leerdarm', la: 'Jejunum' },
    { en: 'The upper two fifths of the mesenteric small intestine, mainly in the left upper abdomen. Compared with the ileum it is wider, thicker-walled and redder, with tall circular folds, few long vasa recta and only one or two rows of arterial arcades. It hangs on the mesentery and is supplied by the jejunal arteries from the superior mesenteric artery.',
      de: 'Die oberen zwei Fünftel des mesenterialen Dünndarms, überwiegend im linken Oberbauch. Im Vergleich zum Ileum weiter, dickwandiger und röter, mit hohen Kerckring-Falten, wenigen langen Vasa recta und nur ein bis zwei Reihen Arterienarkaden. Er hängt am Mesenterium und wird über die Aa. jejunales aus der A. mesenterica superior versorgt.' },
    [['n_superior_mesenteric_plexus', 'sympathetic', segs('T8', 'T10')], MIDGUT_VAGUS],
    ['a_jejunal_ileal'], ['v_smv'],
    { en: 'Midgut pain (small intestine to the proximal two thirds of the transverse colon) is referred to the periumbilical region (T10). Acute occlusion of the superior mesenteric artery causes mesenteric ischaemia: severe pain out of proportion to the findings.',
      de: 'Schmerz aus dem Mitteldarm (Dünndarm bis zu den proximalen zwei Dritteln des Querkolons) projiziert in die Nabelregion (Th10). Ein akuter Verschluss der A. mesenterica superior verursacht eine Mesenterialischämie: heftiger Schmerz bei anfangs geringem Befund.' },
    { tubes: [[JEJUNUM, 0.8]], opacity: 0.55 },
    { color: 0xe9a38a }),
  O('ileum', 'intestine', { en: 'Ileum', de: 'Krummdarm', la: 'Ileum' },
    { en: 'The lower three fifths of the mesenteric small intestine, mainly in the right lower abdomen and pelvis, ending at the ileocaecal valve. Narrower and thinner-walled than the jejunum, with low folds, short vasa recta, many rows of arcades and Peyer patches (lymphoid follicles). It absorbs vitamin B12 and bile acids.',
      de: 'Die unteren drei Fünftel des mesenterialen Dünndarms, vor allem im rechten Unterbauch und Becken, bis zur Ileozäkalklappe (Bauhin-Klappe). Enger und dünnwandiger als das Jejunum, mit niedrigen Falten, kurzen Vasa recta, vielen Arkadenreihen und Peyer-Plaques. Resorbiert Vitamin B12 und Gallensäuren.' },
    [['n_superior_mesenteric_plexus', 'sympathetic', segs('T8', 'T10')], MIDGUT_VAGUS],
    ['a_jejunal_ileal', 'a_ileocolic'], ['v_smv'],
    { en: 'Meckel diverticulum (remnant of the vitelline duct) lies on the antimesenteric border about 60 cm from the ileocaecal valve and can bleed or mimic appendicitis. The terminal ileum is the commonest site of Crohn disease; its resection causes vitamin B12 deficiency and bile acid diarrhoea.',
      de: 'Das Meckel-Divertikel (Rest des Ductus omphaloentericus) liegt antimesenterial etwa 60 cm vor der Ileozäkalklappe und kann bluten oder eine Appendizitis vortäuschen. Das terminale Ileum ist der häufigste Sitz des Morbus Crohn; seine Resektion führt zu Vitamin-B12-Mangel und chologener Diarrhö.' },
    { tubes: [[ILEUM, 0.75]], opacity: 0.55 },
    { color: 0xe7b08f }),
  O('caecum', 'intestine', { en: 'Caecum', de: 'Blinddarm', la: 'Caecum' },
    { en: 'The blind pouch of the large intestine in the right iliac fossa, below the ileocaecal valve. Like the rest of the colon it has taeniae coli, haustra and epiploic appendices; the three taeniae converge on the base of the appendix. It is usually intraperitoneal but has no mesentery of its own.',
      de: 'Der blinde Anfangsteil des Dickdarms in der rechten Fossa iliaca, unterhalb der Ileozäkalklappe. Wie das übrige Kolon hat es Tänien, Haustren und Appendices epiploicae; die drei Tänien laufen an der Basis des Wurmfortsatzes zusammen. Meist intraperitoneal, aber ohne eigenes Mesenterium.' },
    [['n_superior_mesenteric_plexus', 'sympathetic', segs('T10', 'T11')], MIDGUT_VAGUS],
    ['a_ileocolic'], ['v_smv'],
    { en: 'The caecum is the widest part of the colon, so it is the first to perforate in a distal large-bowel obstruction with a competent ileocaecal valve (Laplace law). Caecal carcinoma often presents late, with iron deficiency anaemia.',
      de: 'Das Zäkum ist der weiteste Kolonabschnitt und perforiert bei einem distalen Dickdarmverschluss mit schlussfähiger Bauhin-Klappe zuerst (Laplace-Gesetz). Zäkumkarzinome fallen oft spät durch eine Eisenmangelanämie auf.' },
    { ellipsoids: [[[7.4, -45.4, 0.4], [1.8, 2.2, 1.8]]], opacity: 0.5 },
    { color: 0xc99a72 }),
  O('appendix', 'intestine', { en: 'Vermiform appendix', de: 'Wurmfortsatz', la: 'Appendix vermiformis' },
    { en: 'A narrow blind tube (about 8 cm) from the posteromedial wall of the caecum, where the taeniae meet. Its position varies: retrocaecal (most common), pelvic, subcaecal, pre- or postileal. It has its own mesentery (mesoappendix) with the appendicular artery, an end artery from the ileocolic artery. The base projects onto McBurney point, one third of the way from the anterior superior iliac spine to the umbilicus.',
      de: 'Enger Blindschlauch (etwa 8 cm) an der posteromedialen Zäkumwand, wo die Tänien zusammenlaufen. Seine Lage variiert: retrozäkal (am häufigsten), pelvin, subzäkal, prä- oder retroileal. Er hat ein eigenes Mesenteriolum mit der A. appendicularis, einer Endarterie aus der A. ileocolica. Die Basis projiziert auf den McBurney-Punkt, ein Drittel der Strecke von der Spina iliaca anterior superior zum Nabel.' },
    [['n_superior_mesenteric_plexus', 'sympathetic', ['T10']], MIDGUT_VAGUS],
    ['a_appendicular'], ['v_smv'],
    { en: 'Appendicitis: the early, dull pain is visceral. It travels with sympathetic fibres through the superior mesenteric plexus and the lesser splanchnic nerve to T10 and is felt around the umbilicus (T10 dermatome). Once the inflamed appendix irritates the parietal peritoneum (somatic nerves T11–L1), the pain shifts to the right iliac fossa and becomes sharp and localised over McBurney point, with guarding and rebound tenderness. A retrocaecal appendix irritates the psoas (pain on hip extension), a pelvic one the obturator internus. The appendicular artery is an end artery: thrombosis leads to gangrene and perforation.',
      de: 'Appendizitis: Der frühe, dumpfe Schmerz ist viszeral. Er läuft mit sympathischen Fasern über den Plexus mesentericus superior und den N. splanchnicus minor nach Th10 und wird um den Nabel empfunden (Dermatom Th10). Sobald der entzündete Wurmfortsatz das parietale Peritoneum reizt (somatische Nerven Th11–L1), wandert der Schmerz in den rechten Unterbauch und wird scharf und umschrieben über dem McBurney-Punkt, mit Abwehrspannung und Loslassschmerz (Blumberg-Zeichen). Ein retrozäkaler Wurmfortsatz reizt den M. psoas (Psoaszeichen), ein pelviner den M. obturatorius internus. Die A. appendicularis ist eine Endarterie: Ihre Thrombose führt zu Gangrän und Perforation.' },
    { tubes: [[[[6.6, -47.2, -0.2], [5.8, -48.4, -0.6], [4.8, -49.2, 0.2]], 0.3]], opacity: 0.8 },
    { color: 0xd98f6a }),
  O('ascending_colon', 'intestine', { en: 'Ascending colon', de: 'Aufsteigender Dickdarm', la: 'Colon ascendens' },
    { en: 'Ascends retroperitoneally on the right posterior abdominal wall (on quadratus lumborum and the right kidney) from the caecum to the right colic (hepatic) flexure under the liver. Supplied by the ileocolic and right colic arteries from the superior mesenteric artery.',
      de: 'Steigt sekundär retroperitoneal an der rechten hinteren Bauchwand (auf M. quadratus lumborum und rechter Niere) vom Zäkum zur Flexura coli dextra unter der Leber auf. Versorgt von A. ileocolica und A. colica dextra aus der A. mesenterica superior.' },
    [['n_superior_mesenteric_plexus', 'sympathetic', segs('T10', 'T11')], MIDGUT_VAGUS],
    ['a_ileocolic', 'a_right_colic'], ['v_smv'],
    { en: 'In a right hemicolectomy the ileocolic, right colic and right branch of the middle colic arteries are divided at their origin together with the lymph nodes.',
      de: 'Bei der Hemikolektomie rechts werden A. ileocolica, A. colica dextra und der rechte Ast der A. colica media mitsamt den Lymphknoten am Ursprung abgesetzt.' },
    { tubes: [[[[7.6, -43.4, 0], [8.4, -38, -1.4], [8.6, -33, -1.8], [8.2, -29.6, -1]], 1.3]], opacity: 0.5 },
    { color: 0xc99a72 }),
  O('transverse_colon', 'intestine', { en: 'Transverse colon', de: 'Querkolon', la: 'Colon transversum' },
    { en: 'Hangs on the transverse mesocolon from the right (hepatic) to the left (splenic) colic flexure, often sagging towards the pelvis; the greater omentum is fused to its front. Its proximal two thirds are midgut (middle colic artery from the SMA, vagus), its distal third hindgut (left colic artery from the IMA, pelvic splanchnic nerves). The left colic flexure is higher and more acute and is fixed to the diaphragm by the phrenicocolic ligament.',
      de: 'Hängt am Mesocolon transversum zwischen rechter (hepatischer) und linker (lienaler) Kolonflexur, oft bis ins Becken durch; das große Netz ist mit seiner Vorderseite verwachsen. Die proximalen zwei Drittel gehören zum Mitteldarm (A. colica media aus der AMS, Vagus), das distale Drittel zum Enddarm (A. colica sinistra aus der AMI, Nn. splanchnici pelvici). Die linke Flexur liegt höher, ist spitzer und durch das Lig. phrenicocolicum am Zwerchfell fixiert.' },
    [['n_superior_mesenteric_plexus', 'sympathetic', segs('T10', 'T11')], MIDGUT_VAGUS, ['n_inferior_mesenteric_plexus', 'sympathetic', ['L1', 'L2']], ['n_pelvic_splanchnic', 'parasympathetic', ['S2', 'S3', 'S4']]],
    ['a_middle_colic', 'a_marginal', 'a_left_colic'], ['v_smv', 'v_imv'],
    { en: 'Watershed at the splenic flexure: here the territories of the SMA (middle colic) and IMA (left colic) meet, linked only by the marginal artery, which can be thin or interrupted (Griffiths point). In low-flow states (shock, heart surgery, after aortic repair with IMA ligation) ischaemic colitis appears first at the splenic flexure.',
      de: 'Wasserscheide an der linken Flexur: Hier treffen die Stromgebiete der AMS (A. colica media) und der AMI (A. colica sinistra) aufeinander, verbunden nur durch die Marginalarterie, die dünn oder unterbrochen sein kann (Griffiths-Punkt). Bei Minderperfusion (Schock, Herzoperation, nach Aortenersatz mit Ligatur der AMI) tritt die ischämische Kolitis zuerst an der linken Flexur auf.' },
    { tubes: [[[[8, -29.2, -0.2], [4.6, -32.6, 3], [0, -34.4, 3], [-4.4, -32.4, 3], [-7.6, -27.2, 0.8], [-8.6, -25.6, -1.4]], 1.2]], opacity: 0.5 },
    { color: 0xc99a72 }),
  O('descending_colon', 'intestine', { en: 'Descending colon', de: 'Absteigender Dickdarm', la: 'Colon descendens' },
    { en: 'Descends retroperitoneally on the left posterior abdominal wall from the left colic (splenic) flexure to the iliac crest, where it becomes the sigmoid colon. Hindgut: left colic artery from the IMA, sympathetic fibres from L1–L2 via the inferior mesenteric plexus, parasympathetic fibres from the pelvic splanchnic nerves (S2–S4) that ascend retroperitoneally.',
      de: 'Steigt sekundär retroperitoneal an der linken hinteren Bauchwand von der linken Flexur bis zum Beckenkamm ab und geht dort ins Sigma über. Enddarm: A. colica sinistra aus der AMI, sympathische Fasern aus L1–L2 über den Plexus mesentericus inferior, parasympathische Fasern aus den Nn. splanchnici pelvici (S2–S4), die retroperitoneal aufsteigen.' },
    [['n_inferior_mesenteric_plexus', 'sympathetic', ['L1', 'L2']], ['n_pelvic_splanchnic', 'parasympathetic', ['S2', 'S3', 'S4']]],
    ['a_left_colic', 'a_marginal'], ['v_imv'],
    { en: 'Hindgut pain is referred to the hypogastrium (below the umbilicus, L1). The splenic flexure, where the descending colon begins, is the watershed between the SMA and IMA and the typical site of ischaemic colitis.',
      de: 'Schmerz aus dem Enddarm projiziert ins Hypogastrium (unterhalb des Nabels, L1). Die linke Flexur am Beginn des Colon descendens ist die Wasserscheide zwischen AMS und AMI und typischer Ort der ischämischen Kolitis.' },
    { tubes: [[[[-8.6, -25.6, -1.6], [-9.2, -30, -2.6], [-9.4, -36, -2.8], [-9, -42.4, -1.8]], 1.1]], opacity: 0.5 },
    { color: 0xc99a72 }),
  O('sigmoid_colon', 'intestine', { en: 'Sigmoid colon', de: 'Sigma', la: 'Colon sigmoideum' },
    { en: 'S-shaped loop from the left iliac fossa to the rectum (S3), on its own mesentery (sigmoid mesocolon), so it is mobile. Supplied by the sigmoid arteries of the IMA; the left ureter and the left common iliac vessels lie behind the root of its mesocolon.',
      de: 'S-förmige Schlinge von der linken Fossa iliaca bis zum Rektum (S3) an einem eigenen Mesocolon sigmoideum und daher beweglich. Versorgt von den Aa. sigmoideae der AMI; hinter der Wurzel des Mesosigmas liegen linker Ureter und linke Iliakalgefäße.' },
    [['n_inferior_mesenteric_plexus', 'sympathetic', ['L1', 'L2']], ['n_pelvic_splanchnic', 'parasympathetic', ['S2', 'S3', 'S4']]],
    ['a_sigmoid'], ['v_imv'],
    { en: 'Diverticula form where the vasa recta pierce the wall, most often in the sigmoid colon (diverticulitis: "left-sided appendicitis"). A long sigmoid mesocolon allows volvulus (coffee-bean sign on X-ray).',
      de: 'Divertikel entstehen an den Durchtrittsstellen der Vasa recta, am häufigsten im Sigma (Divertikulitis: "Linksappendizitis"). Ein langes Mesosigma begünstigt einen Volvulus (Kaffeebohnenzeichen im Röntgenbild).' },
    { tubes: [[[[-9, -42.4, -1.8], [-7.6, -45.4, 0.6], [-4.6, -47.4, 2], [-2, -46.2, 1.4], [-1, -48.4, -1.4], [-0.6, -49.6, -4]], 1]], opacity: 0.5 },
    { color: 0xc99a72 }),
  O('liver', 'hepatobiliary', { en: 'Liver', de: 'Leber', la: 'Hepar' },
    { en: 'The largest gland, in the right upper quadrant under the diaphragm, protected by the ribs. Anatomically a large right and a small left lobe, divided by the falciform ligament, plus the quadrate and caudate lobes; functionally a right and a left liver divided by the Cantlie line (see the segments card). At the porta hepatis the portal vein (75% of the blood, rich in nutrients) and the proper hepatic artery (25%, oxygen) enter and the hepatic ducts leave; the hepatic veins drain directly into the inferior vena cava. Glisson capsule is sensitive (phrenic nerve, intercostal nerves); the parenchyma is not.',
      de: 'Größte Drüse, im rechten Oberbauch unter dem Zwerchfell, von den Rippen geschützt. Anatomisch ein großer rechter und ein kleiner linker Lappen, getrennt durch das Lig. falciforme, dazu Lobus quadratus und Lobus caudatus; funktionell eine rechte und eine linke Leber, getrennt durch die Cantlie-Linie (siehe Segmentkarte). An der Leberpforte treten V. portae (75 % des Blutes, nährstoffreich) und A. hepatica propria (25 %, Sauerstoff) ein und die Ductus hepatici aus; die Lebervenen münden direkt in die V. cava inferior. Die Glisson-Kapsel ist schmerzempfindlich (N. phrenicus, Interkostalnerven), das Parenchym nicht.' },
    [COELIAC, ['n_vagal_trunk_anterior', 'parasympathetic', [VAGUS]], PHRENIC_SENSORY],
    ['a_proper_hepatic'], ['v_hepatic'],
    { en: 'Stretching of the capsule (congestion in right heart failure, hepatitis, tumour) causes a dull ache in the right upper quadrant, sometimes referred to the right shoulder via the phrenic nerve (C3–C5). Cirrhosis raises the resistance to portal flow and leads to portal hypertension.',
      de: 'Kapselspannung (Stauungsleber bei Rechtsherzinsuffizienz, Hepatitis, Tumor) verursacht dumpfen Schmerz im rechten Oberbauch, über den N. phrenicus (C3–C5) manchmal in die rechte Schulter projiziert. Eine Zirrhose erhöht den Widerstand im Pfortaderkreislauf und führt zur portalen Hypertension.' },
    { ellipsoids: LIVER, opacity: 0.32 },
    { color: 0x8b3a2f }),
  O('liver_segments', 'hepatobiliary', { en: 'Liver segments (Couinaud)', de: 'Lebersegmente (Couinaud)', la: 'Segmenta hepatis' },
    { en: 'Couinaud divides the liver into eight segments, each with its own portal triad branch (portal vein, hepatic artery, bile duct) and drained at its border by the hepatic veins. The Cantlie line (gallbladder fossa to IVC, middle hepatic vein) separates the right liver (V–VIII) from the left liver (II–IV); the falciform ligament separates segment IV (quadrate lobe) from the left lateral segments II and III. Segment I is the caudate lobe, which drains directly into the IVC. The segments are numbered clockwise from the caudate lobe as seen from the front: II and III left lateral, IV left medial, V and VIII right anterior, VI and VII right posterior.',
      de: 'Couinaud teilt die Leber in acht Segmente mit je eigenem Ast der Glisson-Trias (V. portae, A. hepatica, Gallengang); die Lebervenen verlaufen zwischen den Segmenten. Die Cantlie-Linie (Gallenblasenbett bis V. cava inferior, mittlere Lebervene) trennt die rechte (V–VIII) von der linken Leber (II–IV); das Lig. falciforme trennt Segment IV (Lobus quadratus) von den links-lateralen Segmenten II und III. Segment I ist der Lobus caudatus, der direkt in die V. cava inferior drainiert. Die Nummerierung läuft von vorn gesehen im Uhrzeigersinn: II und III links lateral, IV links medial, V und VIII rechts anterior, VI und VII rechts posterior.' },
    [], [], [],
    { en: 'Because each segment has its own inflow and outflow, a tumour can be removed segment by segment (segmentectomy, right or left hemihepatectomy along the Cantlie line) without bleeding from the rest of the liver. In Budd-Chiari syndrome (hepatic vein thrombosis) the caudate lobe enlarges because it drains directly into the IVC.',
      de: 'Da jedes Segment eigenen Zu- und Abfluss hat, lässt sich ein Tumor segmentweise entfernen (Segmentresektion, Hemihepatektomie rechts oder links entlang der Cantlie-Linie), ohne dass die übrige Leber blutet. Beim Budd-Chiari-Syndrom (Lebervenenthrombose) vergrößert sich der Lobus caudatus, weil er direkt in die V. cava inferior drainiert.' },
    { tubes: [[CANTLIE, 0.1], [FALCIFORM, 0.1]], opacity: 0.9 },
    { partOf: 'liver', color: 0xf2d16b }),
  O('gallbladder', 'hepatobiliary', { en: 'Gallbladder', de: 'Gallenblase', la: 'Vesica biliaris (fellea)' },
    { en: 'Pear-shaped sac (30–50 ml) in a fossa on the visceral surface of the liver. Fundus, body and neck; the fundus touches the anterior abdominal wall at the tip of the ninth costal cartilage, where the lateral edge of the rectus sheath meets the costal margin. It stores and concentrates bile and empties through the cystic duct when cholecystokinin is released after a fatty meal. Its artery, the cystic artery, usually arises from the right hepatic artery in the Calot triangle (cystic duct, common hepatic duct, liver).',
      de: 'Birnenförmiger Sack (30–50 ml) in einer Grube an der Unterfläche der Leber. Fundus, Corpus und Collum; der Fundus berührt die vordere Bauchwand an der Spitze des 9. Rippenknorpels, wo der Rektusrand den Rippenbogen kreuzt. Sie speichert und konzentriert die Galle und entleert sich über den Ductus cysticus, wenn nach einer fetten Mahlzeit Cholezystokinin ausgeschüttet wird. Die A. cystica entspringt meist im Calot-Dreieck (Ductus cysticus, Ductus hepaticus communis, Leber) aus der rechten Leberarterie.' },
    [COELIAC, ['n_vagal_trunk_anterior', 'parasympathetic', [VAGUS]], PHRENIC_SENSORY],
    ['a_cystic'], ['v_portal'],
    { en: 'Referred pain from the gallbladder: biliary colic first causes visceral pain in the epigastrium and right upper quadrant (sympathetic afferents via the coeliac plexus and greater splanchnic nerves to T6–T9). When the inflamed gallbladder irritates the diaphragmatic peritoneum, which is supplied by the phrenic nerve (C3–C5, mainly C4), the pain is referred to the right shoulder tip and over the scapula, because the C4 dermatome (supraclavicular nerves) covers the shoulder. Murphy sign: inspiration stops when the examiner presses under the right costal margin. In cholecystectomy the cystic artery and duct are clipped in the Calot triangle; injuring the common bile duct is the feared complication.',
      de: 'Übertragener Schmerz der Gallenblase: Die Gallenkolik verursacht zunächst viszeralen Schmerz im Epigastrium und rechten Oberbauch (sympathische Afferenzen über Plexus coeliacus und N. splanchnicus major nach Th6–Th9). Reizt die entzündete Gallenblase das Zwerchfellperitoneum, das vom N. phrenicus (C3–C5, vor allem C4) versorgt wird, strahlt der Schmerz in die rechte Schulter und über das Schulterblatt aus, weil das Dermatom C4 (Nn. supraclaviculares) die Schulter bedeckt. Murphy-Zeichen: Die Einatmung stockt, wenn der Untersucher unter den rechten Rippenbogen drückt. Bei der Cholezystektomie werden A. und Ductus cysticus im Calot-Dreieck geclippt; gefürchtet ist die Verletzung des Ductus choledochus.' },
    { ellipsoids: [[[5.2, -25.8, 2.4], [0.95, 2, 0.95], [0.25, -0.8, 0.55]]], opacity: 0.65 },
    { color: 0x5f8f3e }),
  O('bile_ducts', 'hepatobiliary', { en: 'Bile ducts', de: 'Gallenwege', la: 'Ductus biliares' },
    { en: 'The right and left hepatic ducts join at the porta hepatis to form the common hepatic duct; the cystic duct from the gallbladder joins it to form the common bile duct (ductus choledochus, about 7 cm). This runs in the free edge of the lesser omentum (hepatoduodenal ligament) to the right of the proper hepatic artery and in front of the portal vein, behind the first part of the duodenum and through the head of the pancreas, and opens with the pancreatic duct at the major duodenal papilla (ampulla of Vater, sphincter of Oddi).',
      de: 'Ductus hepaticus dexter und sinister vereinigen sich an der Leberpforte zum Ductus hepaticus communis; mit dem Ductus cysticus aus der Gallenblase entsteht der Ductus choledochus (etwa 7 cm). Er verläuft im freien Rand des kleinen Netzes (Lig. hepatoduodenale) rechts der A. hepatica propria und vor der V. portae, hinter der Pars superior duodeni und durch den Pankreaskopf und mündet mit dem Ductus pancreaticus an der Papilla duodeni major (Ampulla hepatopancreatica, Sphincter Oddi).' },
    [COELIAC, ['n_vagal_trunk_anterior', 'parasympathetic', [VAGUS]]],
    ['a_proper_hepatic', 'a_gastroduodenal'], ['v_portal'],
    { en: 'A gallstone in the common bile duct causes colic and obstructive jaundice (pale stools, dark urine); one impacted at the ampulla can also block the pancreatic duct (biliary pancreatitis). A carcinoma of the pancreatic head compresses the duct slowly: painless jaundice with a palpable gallbladder (Courvoisier sign). The Pringle manoeuvre compresses the hepatoduodenal ligament between finger and thumb to control bleeding from the liver.',
      de: 'Ein Stein im Ductus choledochus verursacht Koliken und einen Verschlussikterus (acholischer Stuhl, dunkler Urin); ein Stein an der Papille kann auch den Pankreasgang verlegen (biliäre Pankreatitis). Ein Pankreaskopfkarzinom engt den Gang langsam ein: schmerzloser Ikterus mit tastbarer Gallenblase (Courvoisier-Zeichen). Beim Pringle-Manöver wird das Lig. hepatoduodenale zwischen Daumen und Fingern komprimiert, um eine Leberblutung zu stillen.' },
    { tubes: [[[[4.6, -22.8, -0.2], [3.8, -23.4, 0]], 0.22], [[[2.4, -22.6, 0.2], [3.6, -23.4, 0]], 0.22], [[[3.7, -23.4, 0], [3.8, -24.8, 0.1]], 0.24],
      [[[4.6, -24.6, 1.2], [4.2, -25, 0.6], [3.8, -24.8, 0.1]], 0.18], [[[3.8, -24.8, 0.1], [3.9, -27, -0.4], [4, -29, -1.2], [4.2, -31, -1.6], [4.5, -31.8, -1.3]], 0.24]], opacity: 0.9 },
    { color: 0x7fae4a }),
  O('pancreas', 'hepatobiliary', { en: 'Pancreas', de: 'Bauchspeicheldrüse', la: 'Pancreas' },
    { en: 'Retroperitoneal gland lying across the posterior abdominal wall at L1–L2, behind the stomach and the lesser sac. The head sits in the C of the duodenum (with the uncinate process behind the superior mesenteric vessels), the neck lies in front of the portal vein, the body crosses the aorta and the left kidney, and the tail reaches the splenic hilum in the splenorenal ligament. Exocrine part: digestive enzymes through the pancreatic duct (Wirsung) to the major papilla; endocrine part: islets of Langerhans (insulin, glucagon). Arteries: pancreaticoduodenal arcades (coeliac and SMA) and branches of the splenic artery.',
      de: 'Retroperitoneale Drüse quer über der hinteren Bauchwand in Höhe L1–L2, hinter Magen und Bursa omentalis. Der Kopf liegt im C des Duodenums (der Proc. uncinatus hinter den Mesenterialgefäßen), der Hals vor der V. portae, der Körper zieht über Aorta und linke Niere, der Schwanz reicht im Lig. splenorenale bis zum Milzhilum. Exokriner Teil: Verdauungsenzyme über den Ductus pancreaticus (Wirsung) zur Papilla major; endokriner Teil: Langerhans-Inseln (Insulin, Glukagon). Arterien: Pankreatikoduodenalarkaden (Truncus coeliacus und AMS) und Äste der A. splenica.' },
    [COELIAC, FOREGUT_VAGUS],
    ['a_splenic', 'a_pancreaticoduodenal'], ['v_splenic', 'v_smv'],
    { en: 'Acute pancreatitis (gallstones, alcohol) causes severe epigastric pain radiating straight through to the back, because the gland lies on the posterior wall. Pancreatic cancer pain is treated with a coeliac plexus block. A tumour of the head blocks the common bile duct (jaundice); one of the body can compress the splenic vein (left-sided portal hypertension, gastric varices).',
      de: 'Die akute Pankreatitis (Gallensteine, Alkohol) verursacht heftigen Oberbauchschmerz, der gürtelförmig in den Rücken zieht, weil die Drüse an der Hinterwand liegt. Schmerzen beim Pankreaskarzinom werden mit einer Zöliakusblockade behandelt. Ein Kopftumor verlegt den Ductus choledochus (Ikterus), ein Korpustumor kann die V. splenica einengen (linksseitige portale Hypertension, Fundusvarizen).' },
    { ellipsoids: [[[3.2, -31.6, -1.2], [1.4, 1.8, 1.1]]], tubes: [[[[2.6, -30.8, -1], [0.6, -30, -0.9], [-1.8, -29.6, -1.4], [-4.4, -28.6, -2.2], [-6.8, -26.6, -2.8]], 0.85]], opacity: 0.6 },
    { color: 0xe6c27a }),
  O('spleen', 'hepatobiliary', { en: 'Spleen', de: 'Milz', la: 'Splen (Lien)' },
    { en: 'Secondary lymphoid organ in the left upper quadrant, under ribs 9–11, its long axis along the 10th rib. Intraperitoneal; the gastrosplenic ligament carries the short gastric and left gastro-omental vessels, the splenorenal ligament the splenic vessels and the tail of the pancreas. It filters the blood (red pulp removes old red cells) and mounts immune responses (white pulp). Normally it is not palpable.',
      de: 'Sekundäres lymphatisches Organ im linken Oberbauch unter der 9.–11. Rippe, die Längsachse entlang der 10. Rippe. Intraperitoneal; das Lig. gastrosplenicum führt die Aa. gastricae breves und die A. gastroomentalis sinistra, das Lig. splenorenale die Milzgefäße und den Pankreasschwanz. Sie filtert das Blut (die rote Pulpa baut alte Erythrozyten ab) und dient der Immunabwehr (weiße Pulpa). Normal ist sie nicht tastbar.' },
    [COELIAC],
    ['a_splenic'], ['v_splenic'],
    { en: 'The spleen is the organ most often injured in blunt abdominal trauma, especially with fractures of the left lower ribs; a two-stage rupture can bleed days later. Left shoulder pain from blood under the diaphragm (Kehr sign) is phrenic referred pain. After splenectomy patients are vaccinated against encapsulated bacteria (overwhelming post-splenectomy infection).',
      de: 'Die Milz ist das bei stumpfem Bauchtrauma am häufigsten verletzte Organ, vor allem bei Frakturen der unteren linken Rippen; eine zweizeitige Ruptur kann Tage später bluten. Schmerz in der linken Schulter durch Blut unter dem Zwerchfell (Kehr-Zeichen) ist ein über den N. phrenicus übertragener Schmerz. Nach Splenektomie wird gegen bekapselte Bakterien geimpft (OPSI-Syndrom).' },
    { ellipsoids: [[[-8.8, -23.8, -4.2], [1.5, 3.2, 2.2], [-0.2, 1, -0.6]]], opacity: 0.55 },
    { color: 0x7a2f45 }),
  O('kidneys', 'urinary', { en: 'Kidneys', de: 'Nieren', la: 'Renes' },
    { en: 'Retroperitoneal, on the posterior abdominal wall (psoas, quadratus lumborum, diaphragm) between T12 and L3; the right kidney lies lower because of the liver. Each sits in perirenal fat inside the renal fascia (Gerota). At the hilum, from front to back: renal vein, renal artery, renal pelvis. They filter about 180 litres of plasma a day. Sympathetic fibres (T10–L1) constrict the renal vessels and stimulate renin release; pain fibres return to T10–L1.',
      de: 'Retroperitoneal an der hinteren Bauchwand (M. psoas, M. quadratus lumborum, Zwerchfell) zwischen Th12 und L3; die rechte Niere steht wegen der Leber tiefer. Jede liegt in der Fettkapsel innerhalb der Fascia renalis (Gerota). Am Hilum von vorn nach hinten: V. renalis, A. renalis, Nierenbecken. Sie filtern täglich etwa 180 Liter Plasma. Sympathische Fasern (Th10–L1) verengen die Nierengefäße und fördern die Reninfreisetzung; Schmerzfasern laufen nach Th10–L1 zurück.' },
    [['n_renal_plexus', 'sympathetic', segs('T10', 'L1')]],
    ['a_renal'], ['v_renal'],
    { en: 'Renal pain (pyelonephritis, obstruction) is felt in the flank and the costovertebral angle (T10–L1). Renal artery stenosis activates renin (renovascular hypertension). A transplanted kidney is denervated but works normally because its function does not depend on nerves.',
      de: 'Nierenschmerz (Pyelonephritis, Abflussstörung) wird in der Flanke und im Nierenlager empfunden (Th10–L1, Klopfschmerz). Eine Nierenarterienstenose aktiviert das Renin-Angiotensin-System (renovaskuläre Hypertonie). Eine transplantierte Niere ist denerviert, arbeitet aber normal, weil ihre Funktion nicht von Nerven abhängt.' },
    { ellipsoids: [[[-5, -31.2, -5], [1.8, 3.6, 1.6], [0.25, 1, -0.15]], [[5, -32.8, -5], [1.8, 3.6, 1.6], [-0.25, 1, -0.15]]], opacity: 0.55 },
    { color: 0x9a4638 }),
  O('ureters', 'urinary', { en: 'Ureters', de: 'Harnleiter', la: 'Ureteres' },
    { en: 'Muscular tubes (about 25 cm) from the renal pelvis to the bladder. They descend retroperitoneally on psoas, roughly along the tips of the lumbar transverse processes, are crossed in front by the gonadal vessels, cross the common or external iliac vessels at the pelvic brim and enter the bladder obliquely. Narrowings: pelviureteric junction, pelvic brim, entry into the bladder. Blood supply comes from many sources along the way (renal, gonadal, aortic and iliac branches).',
      de: 'Muskelschläuche (etwa 25 cm) vom Nierenbecken zur Harnblase. Sie steigen retroperitoneal auf dem M. psoas ab, etwa in Höhe der Spitzen der Lendenwirbelquerfortsätze, werden vorn von den Gonadengefäßen gekreuzt, überkreuzen an der Linea terminalis die Iliakalgefäße und treten schräg in die Blase ein. Engen: Abgang aus dem Nierenbecken, Kreuzung der Iliakalgefäße, Eintritt in die Blase. Die Blutversorgung kommt segmental aus vielen Quellen (A. renalis, A. testicularis/ovarica, Aorta, Iliakaläste).' },
    [['n_renal_plexus', 'sympathetic', ['T11', 'T12', 'L1']], ['n_inferior_mesenteric_plexus', 'sympathetic', ['L1', 'L2']]],
    ['a_renal', 'a_gonadal'], ['v_renal', 'v_gonadal'],
    { en: 'A ureteric stone lodges at one of the three narrowings and causes colic radiating from loin to groin (T11–L2), and in men into the scrotum (genitofemoral nerve, L1–L2). The ureter can be injured where it passes under the uterine artery during hysterectomy ("water under the bridge").',
      de: 'Ein Harnleiterstein bleibt an einer der drei Engen stecken und verursacht eine Kolik, die von der Flanke in die Leiste ausstrahlt (Th11–L2), beim Mann bis in den Hoden (N. genitofemoralis, L1–L2). Bei der Hysterektomie kann der Ureter dort verletzt werden, wo er unter der A. uterina hindurchzieht ("Wasser unter der Brücke").' },
    { tubes: [[URETER_R, 0.2], [URETER_L, 0.2]], opacity: 0.85 },
    { color: 0xd9c27a }),
  O('suprarenal_glands', 'urinary', { en: 'Suprarenal glands', de: 'Nebennieren', la: 'Glandulae suprarenales' },
    { en: 'Endocrine glands capping the upper poles of the kidneys inside the renal fascia: the right one pyramidal, behind the IVC; the left one crescent-shaped, along the medial border of the left kidney. The cortex produces aldosterone, cortisol and androgens; the medulla releases adrenaline and noradrenaline. The medulla is a modified sympathetic ganglion: preganglionic fibres from the splanchnic nerves (T10–L1) end directly on its chromaffin cells. Three arteries (from the inferior phrenic artery, the aorta and the renal artery) but one vein (the right into the IVC, the left into the left renal vein).',
      de: 'Endokrine Drüsen auf den oberen Nierenpolen innerhalb der Fascia renalis: die rechte pyramidenförmig hinter der V. cava inferior, die linke halbmondförmig am medialen Rand der linken Niere. Die Rinde bildet Aldosteron, Cortisol und Androgene, das Mark Adrenalin und Noradrenalin. Das Mark ist ein umgewandeltes sympathisches Ganglion: Präganglionäre Fasern der Nn. splanchnici (Th10–L1) enden direkt an seinen chromaffinen Zellen. Drei Arterien (aus A. phrenica inferior, Aorta und A. renalis), aber nur eine Vene (rechts in die V. cava inferior, links in die linke V. renalis).' },
    [['n_renal_plexus', 'sympathetic', segs('T10', 'L1')]],
    ['a_suprarenal'], ['v_renal', 'v_ivc_abdominal'],
    { en: 'A phaeochromocytoma of the medulla releases catecholamines in bursts: headache, sweating, palpitations and paroxysmal hypertension. The short right suprarenal vein, draining straight into the IVC, is the dangerous step in a right adrenalectomy.',
      de: 'Ein Phäochromozytom des Marks schüttet anfallsweise Katecholamine aus: Kopfschmerz, Schwitzen, Herzrasen und krisenhafte Hypertonie. Die kurze rechte Nebennierenvene, die direkt in die V. cava inferior mündet, ist der heikle Schritt der rechtsseitigen Adrenalektomie.' },
    { ellipsoids: [[[3.8, -28.4, -4.6], [1.1, 1, 0.45]], [[-4, -27.8, -4.4], [0.8, 1.4, 0.45], [0.4, 1, 0]]], opacity: 0.75 },
    { color: 0xe3a73e }),
  O('peritoneum', 'peritoneum', { en: 'Peritoneum', de: 'Bauchfell', la: 'Peritoneum' },
    { en: 'Serous membrane of the abdominal cavity. The parietal peritoneum lines the walls and is supplied by somatic nerves (phrenic nerve under the diaphragm centrally, lower intercostal, subcostal and L1 nerves on the abdominal wall), so pain from it is sharp and well localised. The visceral peritoneum covers the organs and is only sensitive to stretch, through autonomic afferents. Intraperitoneal organs hang on mesenteries (stomach, jejunum, ileum, transverse and sigmoid colon, liver, spleen); retroperitoneal ones lie behind it (kidneys, ureters, aorta, IVC) or became secondarily retroperitoneal (duodenum, pancreas, ascending and descending colon). The lesser sac (omental bursa) behind the stomach opens through the omental (epiploic) foramen of Winslow.',
      de: 'Seröse Haut der Bauchhöhle. Das Peritoneum parietale kleidet die Wände aus und wird von somatischen Nerven versorgt (N. phrenicus zentral unter dem Zwerchfell, untere Interkostalnerven, N. subcostalis und L1-Nerven an der Bauchwand), daher ist sein Schmerz scharf und gut lokalisierbar. Das Peritoneum viscerale überzieht die Organe und ist nur dehnungsempfindlich, über vegetative Afferenzen. Intraperitoneale Organe hängen an Mesenterien (Magen, Jejunum, Ileum, Colon transversum und sigmoideum, Leber, Milz); retroperitoneale liegen dahinter (Nieren, Ureteren, Aorta, V. cava inferior) oder sind sekundär retroperitoneal (Duodenum, Pankreas, Colon ascendens und descendens). Die Bursa omentalis hinter dem Magen öffnet sich über das Foramen omentale (Winslow).' },
    [PHRENIC_SENSORY, ['n_thoracoabdominal', 'sensory', segs('T7', 'T11')], ['n_subcostal', 'sensory', ['T12']], ['n_iliohypogastric', 'sensory', ['L1']]],
    ['a_lumbar', 'a_inf_phrenic', 'a_inf_epigastric'], ['v_ivc_abdominal'],
    { en: 'Peritonitis (perforated ulcer, appendicitis, diverticulitis) irritates the parietal peritoneum: sharp localised pain, reflex rigidity of the abdominal muscles (same segmental nerves), rebound tenderness and a silent abdomen. Irritation of the diaphragmatic peritoneum is felt in the shoulder (C4).',
      de: 'Eine Peritonitis (perforiertes Ulkus, Appendizitis, Divertikulitis) reizt das Peritoneum parietale: scharfer, umschriebener Schmerz, reflektorische Abwehrspannung der Bauchmuskeln (gleiche Segmentnerven), Loslassschmerz und "Totenstille" im Bauch. Reizung des Zwerchfellperitoneums wird in der Schulter empfunden (C4).' },
    { ellipsoids: [[[0, -35, -0.4], [10.4, 15.6, 6.4]]], opacity: 0.05 },
    { color: 0x9ec3d6 }),
  O('greater_omentum', 'peritoneum', { en: 'Greater omentum', de: 'Großes Netz', la: 'Omentum majus' },
    { en: 'A four-layered apron of peritoneum and fat hanging from the greater curvature of the stomach in front of the intestine and folding back up to the transverse colon (gastrocolic ligament). It contains the gastro-omental arcade and lymphoid "milky spots".',
      de: 'Vierblättrige Schürze aus Peritoneum und Fett, die von der großen Kurvatur vor dem Darm herabhängt und zum Querkolon zurückschlägt (Lig. gastrocolicum). Sie enthält die Arkade der Aa. gastroomentales und lymphatische "Milchflecken".' },
    [], ['a_left_gastroomental', 'a_right_gastroomental'], ['v_splenic', 'v_smv'],
    { en: 'The "abdominal policeman": it migrates to and walls off inflamed organs (e.g. an inflamed appendix), limiting peritonitis. It is a common site of peritoneal metastases (omental cake in ovarian cancer).',
      de: 'Der "Polizist des Bauchraums": Es wandert zu entzündeten Organen (z. B. dem Wurmfortsatz) und kapselt sie ab, sodass die Peritonitis begrenzt bleibt. Häufiger Sitz von Peritonealmetastasen ("omental cake" beim Ovarialkarzinom).' },
    { ellipsoids: [[[0.4, -37.4, 4.4], [7.4, 6.6, 0.3]]], opacity: 0.12 },
    { partOf: 'peritoneum', color: 0xf0d58c }),
  O('lesser_omentum', 'peritoneum', { en: 'Lesser omentum', de: 'Kleines Netz', la: 'Omentum minus' },
    { en: 'A double layer of peritoneum from the lesser curvature of the stomach and the first part of the duodenum to the liver: the hepatogastric and hepatoduodenal ligaments. The free right edge (hepatoduodenal ligament) contains the portal triad: common bile duct (right), proper hepatic artery (left) and portal vein (behind). Behind it lies the lesser sac.',
      de: 'Peritonealduplikatur von der kleinen Kurvatur und der Pars superior duodeni zur Leber: Lig. hepatogastricum und Lig. hepatoduodenale. Der freie rechte Rand (Lig. hepatoduodenale) enthält die Glisson-Trias: Ductus choledochus (rechts), A. hepatica propria (links) und V. portae (hinten). Dahinter liegt die Bursa omentalis.' },
    [], ['a_left_gastric', 'a_right_gastric'], ['v_left_gastric'],
    { en: 'The omental foramen behind the free edge of the lesser omentum is the only natural entrance to the lesser sac; internal hernias can pass through it.',
      de: 'Das Foramen omentale hinter dem freien Rand des kleinen Netzes ist der einzige natürliche Zugang zur Bursa omentalis; innere Hernien können hindurchtreten.' },
    { ellipsoids: [[[0.8, -25.4, 0.4], [2.2, 2, 0.2]]], opacity: 0.2 },
    { partOf: 'peritoneum', color: 0xf0d58c }),
  O('mesentery', 'peritoneum', { en: 'Mesentery (of the small intestine)', de: 'Dünndarmgekröse', la: 'Mesenterium' },
    { en: 'The fan-shaped fold that suspends the jejunum and ileum. Its root (about 15 cm) runs obliquely from the duodenojejunal flexure (left of L2) to the right iliac fossa, crossing the horizontal duodenum, aorta, IVC, right ureter and psoas; its intestinal border is about 6 m long. Between its layers run the superior mesenteric vessels, their jejunal and ileal branches, lymph nodes and nerves.',
      de: 'Die fächerförmige Falte, an der Jejunum und Ileum hängen. Die Radix mesenterii (etwa 15 cm) zieht schräg von der Flexura duodenojejunalis (links von L2) zur rechten Fossa iliaca über Pars horizontalis duodeni, Aorta, V. cava inferior, rechten Ureter und M. psoas; der Darmansatz ist etwa 6 m lang. Zwischen den Blättern verlaufen die Vasa mesenterica superiora mit den Jejunal- und Ilealästen, Lymphknoten und Nerven.' },
    [], ['a_sma', 'a_jejunal_ileal'], ['v_smv'],
    { en: 'Malrotation of the midgut leaves a narrow mesenteric root, which predisposes to midgut volvulus in newborns (bilious vomiting): a surgical emergency, because the twisted SMA is occluded.',
      de: 'Bei einer Malrotation des Mitteldarms bleibt die Mesenterialwurzel schmal; das begünstigt beim Neugeborenen einen Volvulus des Mitteldarms (galliges Erbrechen): ein chirurgischer Notfall, weil die verdrehte AMS verschlossen wird.' },
    { ellipsoids: [[[0.4, -38.4, 1.2], [0.25, 8, 2.2], [0.55, -0.83, 0.05]]], opacity: 0.15 },
    { partOf: 'peritoneum', color: 0xf0d58c })
];

// ------------------------------------------------------------ arteries
const A = (id, parents, name, info, extra) => ({ id, type: 'artery', parents, name, info, ...extra });
const COELIAC_END = [-0.4, -28.6, -2.4];

const arteries = [
  A('a_coeliac_trunk', ['a_abdominal_aorta'], { en: 'Coeliac trunk', de: 'Truncus coeliacus', la: 'Truncus coeliacus' },
    { en: 'First unpaired branch of the abdominal aorta, just below the aortic hiatus at T12, about 1 cm long. It divides at once into the left gastric, splenic and common hepatic arteries (Haller tripod) and supplies the foregut: lower oesophagus, stomach, duodenum to the papilla, liver, gallbladder, pancreas and spleen. The coeliac plexus surrounds it.',
      de: 'Erster unpaarer Ast der Bauchaorta direkt unterhalb des Hiatus aorticus in Höhe Th12, etwa 1 cm lang. Teilt sich sofort in A. gastrica sinistra, A. splenica und A. hepatica communis (Tripus Halleri) und versorgt den Vorderdarm: unteren Ösophagus, Magen, Duodenum bis zur Papille, Leber, Gallenblase, Pankreas und Milz. Der Plexus coeliacus umgibt ihn.' },
    { path: [[-0.6, -28.2, -3.6], [-0.5, -28.4, -3], COELIAC_END], r: 0.45,
      lesion: { en: 'Because the pancreaticoduodenal arcades connect it with the SMA, a slowly developing coeliac stenosis is usually silent. Compression by the median arcuate ligament of the diaphragm causes postprandial pain (Dunbar syndrome).',
        de: 'Weil die Pankreatikoduodenalarkaden ihn mit der AMS verbinden, bleibt eine langsam entstehende Stenose meist stumm. Eine Kompression durch das Lig. arcuatum medianum des Zwerchfells verursacht Schmerzen nach dem Essen (Dunbar-Syndrom).' } }),
  A('a_left_gastric', ['a_coeliac_trunk'], { en: 'Left gastric artery', de: 'A. gastrica sinistra', la: 'Arteria gastrica sinistra' },
    { en: 'Smallest branch of the coeliac trunk. It rises to the cardia, gives oesophageal branches to the lower oesophagus, then runs down and to the right along the lesser curvature in the lesser omentum to anastomose with the right gastric artery.',
      de: 'Kleinster Ast des Truncus coeliacus. Steigt zur Kardia auf, gibt Rr. oesophageales zum unteren Ösophagus ab und zieht dann im kleinen Netz an der kleinen Kurvatur nach rechts unten, wo sie mit der A. gastrica dextra anastomosiert.' },
    { paths: [[COELIAC_END, [-1.2, -27, -2.2], [-2.2, -23.8, -1.6], [-2.4, -22, -0.8], [-2.2, -22.4, -0.4], [-1.8, -24.6, 0.8], [-1.2, -26.4, 1.6]]], r: 0.22,
      lesion: { en: 'A lesser-curvature ulcer can erode it (haematemesis). It is embolised in upper gastrointestinal bleeding that cannot be stopped endoscopically.',
        de: 'Ein Ulkus der kleinen Kurvatur kann sie arrodieren (Hämatemesis). Bei endoskopisch nicht stillbarer oberer GI-Blutung wird sie embolisiert.' } }),
  A('a_splenic', ['a_coeliac_trunk'], { en: 'Splenic artery', de: 'A. splenica (lienalis)', la: 'Arteria splenica' },
    { en: 'Largest branch of the coeliac trunk. It runs a tortuous course to the left along the upper border of the pancreas, behind the stomach, and through the splenorenal ligament to the splenic hilum. Branches: pancreatic branches (including the great pancreatic artery), short gastric arteries, the left gastro-omental artery and the splenic branches.',
      de: 'Größter Ast des Truncus coeliacus. Zieht stark geschlängelt am Oberrand des Pankreas hinter dem Magen nach links und durch das Lig. splenorenale zum Milzhilum. Äste: Rr. pancreatici (u. a. A. pancreatica magna), Aa. gastricae breves, A. gastroomentalis sinistra und Rr. splenici.' },
    { path: [COELIAC_END, [-1.8, -28.4, -2.8], [-3, -27.8, -2.2], [-4.2, -27.6, -3], [-5.6, -26.6, -2.6], [-6.8, -25.4, -3.2], [-7.6, -24.6, -3]], r: 0.3,
      lesion: { en: 'A posterior gastric ulcer can erode it. Splenic artery aneurysms are the commonest visceral aneurysms and may rupture in pregnancy. The splenic branches are end arteries, so their occlusion causes wedge-shaped splenic infarcts.',
        de: 'Ein Ulkus der Magenhinterwand kann sie arrodieren. Aneurysmen der A. splenica sind die häufigsten viszeralen Aneurysmen und können in der Schwangerschaft rupturieren. Die Milzäste sind Endarterien; ihr Verschluss verursacht keilförmige Milzinfarkte.' } }),
  A('a_short_gastric', ['a_splenic'], { en: 'Short gastric arteries', de: 'Aa. gastricae breves', la: 'Arteriae gastricae breves' },
    { en: 'Four or five small branches from the end of the splenic artery that pass in the gastrosplenic ligament to the fundus of the stomach.',
      de: 'Vier bis fünf kleine Äste vom Ende der A. splenica, die im Lig. gastrosplenicum zum Magenfundus ziehen.' },
    { path: [[-7.4, -24.6, -3], [-8.4, -22.6, -2.6], [-8.2, -20.2, -1.6]], r: 0.12 }),
  A('a_left_gastroomental', ['a_splenic'], { en: 'Left gastro-omental artery', de: 'A. gastroomentalis sinistra', la: 'Arteria gastroomentalis sinistra' },
    { en: 'From the splenic artery near the hilum, through the gastrosplenic ligament and along the greater curvature to the right, anastomosing with the right gastro-omental artery. It sends omental branches down into the greater omentum.',
      de: 'Aus der A. splenica nahe dem Hilum, durch das Lig. gastrosplenicum und entlang der großen Kurvatur nach rechts, wo sie mit der A. gastroomentalis dextra anastomosiert. Gibt Rr. omentales ins große Netz ab.' },
    { path: [[-6.8, -25, -2.8], [-7.6, -26.6, 0], [-6.6, -29, 1.8], [-3.4, -30.6, 3]], r: 0.15 }),
  A('a_common_hepatic', ['a_coeliac_trunk'], { en: 'Common hepatic artery', de: 'A. hepatica communis', la: 'Arteria hepatica communis' },
    { en: 'Runs to the right along the upper border of the pancreas and divides into the proper hepatic and gastroduodenal arteries.',
      de: 'Zieht am Oberrand des Pankreas nach rechts und teilt sich in A. hepatica propria und A. gastroduodenalis.' },
    { path: [COELIAC_END, [1, -28.6, -1.8], [2.2, -28.2, -1.2]], r: 0.3 }),
  A('a_proper_hepatic', ['a_common_hepatic'], { en: 'Proper hepatic artery', de: 'A. hepatica propria', la: 'Arteria hepatica propria' },
    { en: 'Ascends in the hepatoduodenal ligament to the left of the common bile duct and in front of the portal vein, gives the right gastric artery and divides at the porta hepatis into right and left hepatic arteries. The right hepatic artery gives the cystic artery.',
      de: 'Steigt im Lig. hepatoduodenale links vom Ductus choledochus und vor der V. portae auf, gibt die A. gastrica dextra ab und teilt sich an der Leberpforte in R. dexter und R. sinister. Der rechte Ast gibt die A. cystica ab.' },
    { paths: [[[2.2, -28.2, -1.2], [2.8, -26.2, -0.6], [3, -24.2, -0.4]], [[3, -24.2, -0.4], [4.4, -23.6, -0.6], [6, -23, -1]], [[3, -24.2, -0.4], [1.6, -23.6, 0], [-0.4, -22.4, 0.6]]], r: 0.22,
      lesion: { en: 'Variants are common: a replaced right hepatic artery from the SMA (about 15%) or a left hepatic artery from the left gastric artery; surgeons must know them before liver or pancreatic surgery. Ligation is usually survived because the portal vein brings most of the blood and oxygen.',
        de: 'Varianten sind häufig: eine ersetzende rechte Leberarterie aus der AMS (etwa 15 %) oder eine linke aus der A. gastrica sinistra; vor Leber- und Pankreaschirurgie muss man sie kennen. Eine Ligatur wird meist überlebt, weil die V. portae den größten Teil des Blutes und Sauerstoffs bringt.' } }),
  A('a_cystic', ['a_proper_hepatic'], { en: 'Cystic artery', de: 'A. cystica', la: 'Arteria cystica' },
    { en: 'Usually from the right hepatic artery in the hepatocystic (Calot) triangle, bounded by the cystic duct, the common hepatic duct and the liver; it divides on the gallbladder neck into superficial and deep branches.',
      de: 'Meist aus dem R. dexter der A. hepatica propria im Calot-Dreieck, das von Ductus cysticus, Ductus hepaticus communis und Leber begrenzt wird; teilt sich am Gallenblasenhals in einen oberflächlichen und einen tiefen Ast.' },
    { path: [[4.4, -23.6, -0.6], [4.6, -24.2, 0.6], [5, -24.6, 1.6]], r: 0.12,
      lesion: { en: 'It is clipped in cholecystectomy after the "critical view of safety" has shown that only two structures (cystic duct and artery) enter the gallbladder.',
        de: 'Bei der Cholezystektomie wird sie geclippt, nachdem der "Critical View of Safety" gezeigt hat, dass nur zwei Strukturen (Ductus und A. cystica) zur Gallenblase ziehen.' } }),
  A('a_right_gastric', ['a_proper_hepatic'], { en: 'Right gastric artery', de: 'A. gastrica dextra', la: 'Arteria gastrica dextra' },
    { en: 'A small branch of the proper (sometimes the common) hepatic artery that runs to the left along the lesser curvature to meet the left gastric artery.',
      de: 'Kleiner Ast der A. hepatica propria (manchmal communis), der an der kleinen Kurvatur nach links zieht und mit der A. gastrica sinistra anastomosiert.' },
    { path: [[2.6, -27.4, -0.8], [2, -27.6, 1], [0.4, -27, 1.8], [-0.8, -26.2, 1.8]], r: 0.13 }),
  A('a_gastroduodenal', ['a_common_hepatic'], { en: 'Gastroduodenal artery', de: 'A. gastroduodenalis', la: 'Arteria gastroduodenalis' },
    { en: 'Descends behind the first part of the duodenum and divides into the right gastro-omental and superior pancreaticoduodenal arteries.',
      de: 'Zieht hinter der Pars superior duodeni abwärts und teilt sich in A. gastroomentalis dextra und Aa. pancreaticoduodenales superiores.' },
    { path: [[2.2, -28.2, -1.2], [2.8, -29.2, -0.4], [3, -30.4, 0.4]], r: 0.2,
      lesion: { en: 'A posterior duodenal ulcer can erode it: massive upper gastrointestinal bleeding (haematemesis, melaena), treated endoscopically or by under-running the vessel.',
        de: 'Ein Ulkus der Bulbushinterwand kann sie arrodieren: massive obere GI-Blutung (Hämatemesis, Meläna), die endoskopisch oder durch Umstechung gestillt wird.' } }),
  A('a_right_gastroomental', ['a_gastroduodenal'], { en: 'Right gastro-omental artery', de: 'A. gastroomentalis dextra', la: 'Arteria gastroomentalis dextra' },
    { en: 'Runs to the left along the greater curvature inside the greater omentum and anastomoses with the left gastro-omental artery.',
      de: 'Zieht im großen Netz an der großen Kurvatur nach links und anastomosiert mit der A. gastroomentalis sinistra.' },
    { path: [[3, -30.4, 0.4], [1.6, -30.6, 2.4], [-1, -31.2, 3], [-3.4, -30.6, 3]], r: 0.15 }),
  A('a_pancreaticoduodenal', ['a_gastroduodenal', 'a_sma'], { en: 'Pancreaticoduodenal arteries', de: 'Aa. pancreaticoduodenales', la: 'Arteriae pancreaticoduodenales' },
    { en: 'Superior (from the gastroduodenal artery) and inferior (from the SMA) pancreaticoduodenal arteries form anterior and posterior arcades around the head of the pancreas and the duodenum. They join the coeliac and superior mesenteric territories: the foregut–midgut border.',
      de: 'Die Aa. pancreaticoduodenales superiores (aus der A. gastroduodenalis) und inferiores (aus der AMS) bilden vordere und hintere Arkaden um Pankreaskopf und Duodenum. Sie verbinden die Stromgebiete von Truncus coeliacus und AMS: die Grenze zwischen Vorder- und Mitteldarm.' },
    { paths: [[[3, -30.4, 0.4], [4.2, -31, -0.2], [4.2, -33, -0.6], [2.4, -33.8, -0.8], [0, -33, -0.6]], [[2.8, -29.4, -0.6], [4, -30.4, -2.2], [4, -33, -2.2], [2.2, -33.6, -1.6], [-0.2, -32.6, -0.8]]], r: 0.12,
      lesion: { en: 'These arcades are the main collateral between coeliac trunk and SMA, so a slow occlusion of either is compensated. In a Whipple operation (pancreatoduodenectomy) both arcades are divided with the head of the pancreas and the duodenum.',
        de: 'Diese Arkaden sind die wichtigste Kollaterale zwischen Truncus coeliacus und AMS, sodass ein langsamer Verschluss eines der beiden kompensiert wird. Bei der Whipple-Operation (Pankreatoduodenektomie) werden beide Arkaden mit Pankreaskopf und Duodenum entfernt.' } }),
  A('a_sma', ['a_abdominal_aorta'], { en: 'Superior mesenteric artery (SMA)', de: 'A. mesenterica superior (AMS)', la: 'Arteria mesenterica superior' },
    { en: 'Second unpaired branch of the aorta at L1, about 1 cm below the coeliac trunk. It passes behind the neck of the pancreas and in front of the left renal vein and the horizontal duodenum into the root of the mesentery, with the superior mesenteric vein on its right. It supplies the midgut, from the duodenal papilla to the junction of the middle and left thirds of the transverse colon: inferior pancreaticoduodenal, middle colic, right colic, ileocolic and 15–18 jejunal and ileal arteries.',
      de: 'Zweiter unpaarer Ast der Aorta in Höhe L1, etwa 1 cm unter dem Truncus coeliacus. Zieht hinter dem Pankreashals und vor linker V. renalis und Pars horizontalis duodeni in die Mesenterialwurzel, die V. mesenterica superior rechts neben sich. Versorgt den Mitteldarm von der Duodenalpapille bis zur Grenze vom mittleren zum linken Drittel des Querkolons: Aa. pancreaticoduodenales inferiores, A. colica media, A. colica dextra, A. ileocolica und 15–18 Aa. jejunales und ileales.' },
    { path: [[-0.6, -30.8, -3], [-0.4, -31.4, -1.2], [-0.2, -33, -0.4], [0.2, -35.4, 0.2], [0, -38.6, 0.8], [0.6, -41.6, 0.6]], r: 0.4,
      lesion: { en: 'Acute embolic occlusion (often from atrial fibrillation) causes acute mesenteric ischaemia: severe periumbilical pain, then bowel necrosis and peritonitis, with high mortality. The narrow angle between SMA and aorta can trap the left renal vein (nutcracker syndrome) or the horizontal duodenum (SMA syndrome).',
        de: 'Ein akuter embolischer Verschluss (oft bei Vorhofflimmern) verursacht eine akute Mesenterialischämie: heftiger periumbilikaler Schmerz, dann Darmnekrose und Peritonitis, mit hoher Letalität. Im engen Winkel zwischen AMS und Aorta können die linke V. renalis (Nussknacker-Syndrom) oder die Pars horizontalis duodeni (Wilkie-Syndrom) eingeklemmt werden.' } }),
  A('a_jejunal_ileal', ['a_sma'], { en: 'Jejunal and ileal arteries', de: 'Aa. jejunales et ileales', la: 'Arteriae jejunales et ileales' },
    { en: '15–18 branches from the left side of the SMA that run in the mesentery and form arcades; from the last arcade straight vessels (vasa recta) enter the gut wall. The jejunum has one or two rows of arcades and long vasa recta, the ileum many rows and short vasa recta.',
      de: '15–18 Äste von der linken Seite der AMS, die im Mesenterium Arkaden bilden; aus der letzten Arkade ziehen gerade Gefäße (Vasa recta) in die Darmwand. Das Jejunum hat ein bis zwei Arkadenreihen und lange Vasa recta, das Ileum viele Reihen und kurze Vasa recta.' },
    { paths: [[[-0.3, -33.4, -0.3], [-2.6, -33.8, 1], [-4.8, -33.6, 1.6]], [[0, -34.6, 0], [-2.6, -36.2, 1.6], [-5.6, -37.2, 2]], [[0.1, -36.6, 0.4], [-2, -39.2, 1.8], [-5.4, -40.2, 2.4]],
      [[0.2, -38.4, 0.8], [-0.6, -41, 2], [-1.8, -43, 2.4]], [[0.6, -41.4, 0.6], [1.6, -43.4, 1.8], [3.2, -44.6, 2]]], r: 0.13 }),
  A('a_middle_colic', ['a_sma'], { en: 'Middle colic artery', de: 'A. colica media', la: 'Arteria colica media' },
    { en: 'Leaves the SMA just below the pancreas and runs in the transverse mesocolon; its right and left branches supply the proximal two thirds of the transverse colon and join the marginal artery.',
      de: 'Verlässt die AMS direkt unterhalb des Pankreas und zieht im Mesocolon transversum; ihr rechter und linker Ast versorgen die proximalen zwei Drittel des Querkolons und gehen in die Marginalarterie über.' },
    { paths: [[[-0.3, -32, -1], [0.4, -32.6, 1], [1.6, -33.4, 2.4]], [[1.6, -33.4, 2.4], [4, -32, 2.8]], [[1.6, -33.4, 2.4], [-2.6, -33.6, 2.8]]], r: 0.16 }),
  A('a_right_colic', ['a_sma'], { en: 'Right colic artery', de: 'A. colica dextra', la: 'Arteria colica dextra' },
    { en: 'Runs retroperitoneally to the right to the ascending colon; often arises together with the middle colic or ileocolic artery, or is absent.',
      de: 'Zieht retroperitoneal nach rechts zum Colon ascendens; entspringt oft gemeinsam mit der A. colica media oder ileocolica oder fehlt.' },
    { path: [[-0.2, -33.6, -0.4], [3, -34.4, -0.4], [6.6, -35, -1]], r: 0.15 }),
  A('a_ileocolic', ['a_sma'], { en: 'Ileocolic artery', de: 'A. ileocolica', la: 'Arteria ileocolica' },
    { en: 'Terminal branch of the SMA to the right iliac fossa. It supplies the terminal ileum, caecum and the beginning of the ascending colon and gives the appendicular artery.',
      de: 'Endast der AMS zur rechten Fossa iliaca. Versorgt terminales Ileum, Zäkum und den Anfang des Colon ascendens und gibt die A. appendicularis ab.' },
    { path: [[0.1, -35.8, 0.3], [3, -39, 0], [5.6, -42.6, 0], [6.6, -44.2, 0]], r: 0.17 }),
  A('a_appendicular', ['a_ileocolic'], { en: 'Appendicular artery', de: 'A. appendicularis', la: 'Arteria appendicularis' },
    { en: 'Passes behind the terminal ileum into the mesoappendix and runs along its free edge to the tip of the appendix. It is an end artery.',
      de: 'Zieht hinter dem terminalen Ileum ins Mesenteriolum und an dessen freiem Rand bis zur Spitze des Wurmfortsatzes. Sie ist eine Endarterie.' },
    { path: [[5.6, -42.6, 0], [6, -45, -0.8], [6.2, -47.2, -0.8], [5.4, -48.6, -0.4]], r: 0.1,
      lesion: { en: 'Being an end artery, its thrombosis in appendicitis causes gangrene and perforation of the appendix. It is ligated in appendicectomy.',
        de: 'Als Endarterie führt ihre Thrombose bei der Appendizitis zu Gangrän und Perforation. Bei der Appendektomie wird sie ligiert.' } }),
  A('a_ima', ['a_abdominal_aorta'], { en: 'Inferior mesenteric artery (IMA)', de: 'A. mesenterica inferior (AMI)', la: 'Arteria mesenterica inferior' },
    { en: 'Third unpaired branch of the aorta at L3, behind the horizontal duodenum. It runs down and to the left retroperitoneally and supplies the hindgut, from the left third of the transverse colon to the upper rectum, through the left colic artery, two to four sigmoid arteries and its terminal superior rectal artery.',
      de: 'Dritter unpaarer Ast der Aorta in Höhe L3, hinter der Pars horizontalis duodeni. Zieht retroperitoneal nach links unten und versorgt den Enddarm vom linken Drittel des Querkolons bis zum oberen Rektum über die A. colica sinistra, zwei bis vier Aa. sigmoideae und ihren Endast, die A. rectalis superior.' },
    { path: [[-0.4, -37, -2.4], [-1.4, -37.8, -1.8], [-2.4, -39.4, -1.8], [-2.6, -41.4, -2]], r: 0.25,
      lesion: { en: 'It can be ligated (aortic aneurysm repair, colorectal cancer surgery) because the marginal artery from the SMA and the middle and inferior rectal arteries take over. If these collaterals are poor, ischaemic colitis follows, first at the splenic flexure and in the sigmoid colon (Sudeck point).',
        de: 'Sie kann ligiert werden (Aortenaneurysma-Operation, Rektum- und Sigmakarzinom), weil die Marginalarterie aus der AMS und die Aa. rectales media und inferior einspringen. Sind diese Kollateralen schwach, folgt eine ischämische Kolitis, zuerst an der linken Flexur und im Sigma (Sudeck-Punkt).' } }),
  A('a_left_colic', ['a_ima'], { en: 'Left colic artery', de: 'A. colica sinistra', la: 'Arteria colica sinistra' },
    { en: 'Runs to the left behind the peritoneum and divides into an ascending branch to the left colic flexure and distal transverse colon and a descending branch to the descending colon; both join the marginal artery.',
      de: 'Zieht retroperitoneal nach links und teilt sich in einen aufsteigenden Ast zur linken Flexur und zum distalen Querkolon und einen absteigenden Ast zum Colon descendens; beide speisen die Marginalarterie.' },
    { paths: [[[-1.4, -37.8, -1.8], [-4.4, -36.8, -2], [-7.8, -36, -2.4]], [[-4.4, -36.8, -2], [-6.4, -31, -2], [-8.2, -26.8, -1.4]]], r: 0.15 }),
  A('a_sigmoid', ['a_ima'], { en: 'Sigmoid arteries', de: 'Aa. sigmoideae', la: 'Arteriae sigmoideae' },
    { en: 'Two to four branches that run in the sigmoid mesocolon to the sigmoid colon and join the marginal artery.',
      de: 'Zwei bis vier Äste, die im Mesosigma zum Sigma ziehen und in die Marginalarterie übergehen.' },
    { paths: [[[-2.4, -39.4, -1.8], [-5.4, -42, -0.8], [-7.2, -44.2, 0.2]], [[-2.4, -40.4, -1.8], [-3.6, -44.4, 0.6], [-4.4, -46.6, 1.4]]], r: 0.13 }),
  A('a_superior_rectal', ['a_ima'], { en: 'Superior rectal artery', de: 'A. rectalis superior', la: 'Arteria rectalis superior' },
    { en: 'The continuation of the IMA. It crosses the left common iliac vessels into the root of the sigmoid mesocolon and descends to the upper rectum, where it anastomoses with the middle and inferior rectal arteries.',
      de: 'Fortsetzung der AMI. Kreuzt die linken Iliakalgefäße, zieht in die Wurzel des Mesosigmas und zum oberen Rektum, wo sie mit den Aa. rectales media und inferior anastomosiert.' },
    { path: [[-2.6, -41.4, -2], [-2, -44.6, -2.6], [-1, -47.4, -3.8], [-0.6, -49.6, -5]], r: 0.15 }),
  A('a_marginal', ['a_sma', 'a_ima'], { en: 'Marginal artery (of Drummond)', de: 'Marginalarterie (Drummond)', la: 'Arteria marginalis coli' },
    { en: 'A continuous arterial channel along the inner border of the colon, from the ileocolic artery to the sigmoid arteries, formed by the colic branches of the SMA and IMA. The vasa recta to the colon wall arise from it. Between the middle and left colic arteries it is often thin or interrupted (Griffiths point at the splenic flexure); the Riolan arc is a more central connection between the two.',
      de: 'Durchgehender Arterienbogen am mesenterialen Rand des Kolons von der A. ileocolica bis zu den Aa. sigmoideae, gebildet von den Kolonästen der AMS und AMI. Aus ihm ziehen die Vasa recta zur Darmwand. Zwischen A. colica media und sinistra ist er oft dünn oder unterbrochen (Griffiths-Punkt an der linken Flexur); die Riolan-Anastomose ist eine weiter zentral gelegene Verbindung der beiden.' },
    { path: [[6.6, -44.2, 0], [7.4, -38, -0.6], [7.2, -31, -0.2], [5, -31.6, 2], [0, -33.2, 2.4], [-4.4, -31.6, 2], [-7.2, -26.6, 0], [-8, -30, -1.6], [-8.2, -36, -2], [-7.8, -42, -1.2]], r: 0.1,
      lesion: { en: 'Splenic flexure watershed: the splenic flexure is the border zone between the SMA and IMA, linked only by this vessel. When the blood pressure falls (shock, cardiac surgery, dialysis) or after IMA ligation, this zone is perfused last: ischaemic colitis with left-sided abdominal pain and bloody diarrhoea. A second watershed lies at the rectosigmoid junction (Sudeck point).',
        de: 'Wasserscheide an der linken Flexur: Die Flexura coli sinistra ist die Grenzzone zwischen AMS und AMI, die nur über dieses Gefäß verbunden sind. Fällt der Blutdruck (Schock, Herzoperation, Dialyse) oder wurde die AMI ligiert, wird diese Zone zuletzt durchblutet: ischämische Kolitis mit linksseitigem Bauchschmerz und blutigem Durchfall. Eine zweite Wasserscheide liegt am rektosigmoidalen Übergang (Sudeck-Punkt).' } }),
  A('a_renal', ['a_abdominal_aorta'], { en: 'Renal arteries', de: 'Aa. renales', la: 'Arteriae renales' },
    { en: 'Paired branches of the aorta at L1–L2, just below the SMA. The right is longer and passes behind the IVC. Each gives the inferior suprarenal artery and branches to the ureter, then divides at the hilum into segmental arteries, which are end arteries. Accessory renal arteries are common.',
      de: 'Paarige Äste der Aorta in Höhe L1–L2, knapp unter der AMS. Die rechte ist länger und zieht hinter der V. cava inferior vorbei. Jede gibt die A. suprarenalis inferior und Ureteräste ab und teilt sich am Hilum in Segmentarterien, die Endarterien sind. Akzessorische Nierenarterien sind häufig.' },
    { paths: [[[-0.6, -32, -3.4], [0.8, -32.2, -4.4], [2.2, -32.4, -5.2], [3.4, -32.6, -4.9]], [[-0.6, -31.6, -3.5], [-2, -31.6, -4.2], [-3.4, -31.4, -4.6]]], r: 0.3,
      lesion: { en: 'Renal artery stenosis (atherosclerosis, fibromuscular dysplasia in young women) lowers the pressure in the kidney, activates renin and causes renovascular hypertension; an abdominal bruit may be heard. Because the segmental arteries are end arteries, an embolus causes a wedge-shaped infarct.',
        de: 'Eine Nierenarterienstenose (Arteriosklerose, fibromuskuläre Dysplasie bei jungen Frauen) senkt den Druck in der Niere, aktiviert Renin und verursacht eine renovaskuläre Hypertonie; oft ist ein Strömungsgeräusch zu hören. Da die Segmentarterien Endarterien sind, verursacht ein Embolus einen keilförmigen Infarkt.' } }),
  A('a_suprarenal', ['a_abdominal_aorta', 'a_renal', 'a_inf_phrenic'], { en: 'Suprarenal arteries', de: 'Aa. suprarenales', la: 'Arteriae suprarenales' },
    { en: 'Each suprarenal gland has three arteries: superior (from the inferior phrenic artery), middle (from the aorta) and inferior (from the renal artery).',
      de: 'Jede Nebenniere hat drei Arterien: A. suprarenalis superior (aus der A. phrenica inferior), media (aus der Aorta) und inferior (aus der A. renalis).' },
    { paths: [[[-0.6, -29.8, -3.8], [1.6, -29.2, -4.4], [3.2, -28.6, -4.6]], [[-0.6, -29.6, -3.8], [-2.4, -28.8, -4.2], [-3.8, -28, -4.4]], [[2.6, -32.4, -5.1], [3, -30.4, -4.8], [3.6, -29.2, -4.6]], [[-2.6, -31.6, -4.4], [-3.4, -30, -4.4], [-3.8, -28.8, -4.4]]], r: 0.09 }),
  A('a_gonadal', ['a_abdominal_aorta'], { en: 'Testicular / ovarian arteries', de: 'Aa. testiculares / ovaricae', la: 'Arteriae testiculares / ovaricae' },
    { en: 'Long thin paired arteries from the front of the aorta at L2, reflecting the lumbar origin of the gonads. They descend on psoas, cross in front of the ureters and reach the deep inguinal ring (testicular artery, into the spermatic cord) or the pelvic brim (ovarian artery, in the suspensory ligament of the ovary).',
      de: 'Lange, dünne paarige Arterien von der Vorderseite der Aorta in Höhe L2, Zeichen des lumbalen Ursprungs der Gonaden. Sie steigen auf dem M. psoas ab, kreuzen vor den Ureteren und erreichen den inneren Leistenring (A. testicularis, in den Samenstrang) oder die Linea terminalis (A. ovarica, im Lig. suspensorium ovarii).' },
    { paths: [[[-0.4, -33.6, -2.8], [1, -34.4, -2.4], [3, -37, -2.6], [4.6, -41, -2.6], [6, -45, -1], [7, -47.2, 1.6]], [[-0.8, -33.6, -2.8], [-2.6, -35, -2.6], [-4, -38, -2.8], [-5.4, -42, -2.6], [-6.4, -45, -1], [-7, -47.2, 1.6]]], r: 0.09 })
];

// ------------------------------------------------------------ veins
const V = (id, parents, name, info, extra) => ({ id, type: 'vein', parents, name, info, ...extra });
const PORTAL = 0x7a55b8; // the portal system is drawn violet, as in many German atlases
const PORTAL_START = [1.2, -30.4, -2.4], PORTA_HEPATIS = [3.6, -23.8, -1.2];

const veins = [
  V('v_ivc_abdominal', ['v_ivc'], { en: 'Inferior vena cava (abdominal part)', de: 'Untere Hohlvene (Pars abdominalis)', la: 'Vena cava inferior, pars abdominalis' },
    { en: 'Formed at L5 by the two common iliac veins, it ascends on the right of the aorta, behind the duodenum, the head of the pancreas and the portal vein, in a groove on the back of the liver, and leaves through the caval opening of the diaphragm at T8. Tributaries: lumbar, right gonadal, renal, right suprarenal, inferior phrenic and hepatic veins. Unlike the aorta it has no branches to the gut: the gut drains through the portal vein and the liver.',
      de: 'Entsteht in Höhe L5 aus den beiden Vv. iliacae communes, steigt rechts der Aorta hinter Duodenum, Pankreaskopf und V. portae in einer Rinne an der Leberhinterfläche auf und verlässt den Bauchraum in Höhe Th8 durch das Foramen venae cavae. Zuflüsse: Vv. lumbales, rechte V. testicularis/ovarica, Vv. renales, rechte V. suprarenalis, Vv. phrenicae inferiores und Vv. hepaticae. Anders als die Aorta hat sie keine Darmzuflüsse: Der Darm drainiert über die V. portae und die Leber.' },
    { path: [[1.8, -42.6, -3.4], [2, -38, -3.6], [2.2, -33, -3.8], [2.6, -29, -3.6], [2.6, -25, -3], [2.2, -21, -2.4]], r: 0.85,
      lesion: { en: 'Obstruction of the IVC (thrombosis, tumour) opens cavo-caval collaterals: the azygos and lumbar veins and the superficial epigastric–thoracoepigastric veins of the abdominal wall, which then flow upwards (unlike caput medusae, where they flow away from the umbilicus). In late pregnancy the uterus compresses it in the supine position (supine hypotension).',
        de: 'Ein Verschluss der V. cava inferior (Thrombose, Tumor) öffnet kavokavale Umgehungskreisläufe: Azygos- und Lumbalvenen sowie die oberflächlichen Vv. epigastricae und thoracoepigastricae der Bauchwand, die dann nach oben fließen (anders als beim Caput medusae, wo sie vom Nabel weg fließen). In der Spätschwangerschaft drückt der Uterus sie in Rückenlage ab (Vena-cava-Kompressionssyndrom).' } }),
  V('v_hepatic', ['v_ivc_abdominal'], { en: 'Hepatic veins', de: 'Lebervenen', la: 'Venae hepaticae' },
    { en: 'Three main hepatic veins (right, middle and left) run between the liver segments and drain straight into the IVC just below the diaphragm; the middle vein lies in the Cantlie line. Small direct veins drain the caudate lobe. They are the only outflow of the liver.',
      de: 'Drei Hauptlebervenen (rechte, mittlere und linke) verlaufen zwischen den Lebersegmenten und münden direkt unterhalb des Zwerchfells in die V. cava inferior; die mittlere liegt in der Cantlie-Linie. Kleine direkte Venen drainieren den Lobus caudatus. Sie sind der einzige Abfluss der Leber.' },
    { paths: [[[6.6, -21.6, 0.6], [4.4, -21.4, -1.4], [2.4, -21.4, -2.4]], [[3, -20.4, 1.6], [2.6, -21, -0.6], [2.3, -21.4, -2.2]], [[-1.6, -20.4, 1.4], [0.6, -20.8, -0.8], [2, -21.4, -2.2]]], r: 0.35,
      lesion: { en: 'Budd-Chiari syndrome: thrombosis of the hepatic veins causes painful hepatomegaly, ascites and post-sinusoidal portal hypertension; the caudate lobe, with its own veins, enlarges.',
        de: 'Budd-Chiari-Syndrom: Die Thrombose der Lebervenen verursacht schmerzhafte Hepatomegalie, Aszites und eine posthepatische portale Hypertension; der Lobus caudatus mit eigenen Venen vergrößert sich.' } }),
  V('v_renal', ['v_ivc_abdominal'], { en: 'Renal veins', de: 'Vv. renales', la: 'Venae renales' },
    { en: 'Lie in front of the renal arteries at the hilum. The right is short; the left is three times longer, crosses in front of the aorta just below the SMA and receives the left gonadal, left suprarenal and left inferior phrenic veins.',
      de: 'Liegen am Hilum vor den Nierenarterien. Die rechte ist kurz; die linke ist dreimal so lang, kreuzt direkt unterhalb der AMS vor der Aorta und nimmt linke V. testicularis/ovarica, linke V. suprarenalis und linke V. phrenica inferior auf.' },
    { paths: [[[3.4, -32.8, -4.2], [2.2, -32.8, -3.8]], [[-3.4, -31.6, -3.8], [-1.8, -31.8, -2.8], [-0.6, -32, -2], [1.4, -32.2, -3.2]]], r: 0.35,
      lesion: { en: 'Nutcracker syndrome: the left renal vein is compressed between the SMA and the aorta, causing haematuria, flank pain and a left varicocele. A left renal tumour growing into the vein can block the left testicular vein and cause a new varicocele in an older man.',
        de: 'Nussknacker-Syndrom: Die linke V. renalis wird zwischen AMS und Aorta eingeklemmt: Hämaturie, Flankenschmerz und linksseitige Varikozele. Ein linker Nierentumor, der in die Vene einwächst, kann die linke V. testicularis verlegen und beim älteren Mann eine neue Varikozele verursachen.' } }),
  V('v_gonadal', ['v_ivc_abdominal', 'v_renal'], { en: 'Testicular / ovarian veins', de: 'Vv. testiculares / ovaricae', la: 'Venae testiculares / ovaricae' },
    { en: 'Arise from the pampiniform plexus (testis) or the ovary and ascend on psoas beside the arteries. The right drains obliquely into the IVC, the left at a right angle into the left renal vein.',
      de: 'Entstehen aus dem Plexus pampiniformis (Hoden) bzw. am Ovar und steigen neben den Arterien auf dem M. psoas auf. Die rechte mündet spitzwinklig in die V. cava inferior, die linke rechtwinklig in die linke V. renalis.' },
    { paths: [[[7, -47.2, 1.8], [6.2, -45, -0.8], [4.8, -41, -2.2], [3.4, -37, -2.4], [2.6, -34.6, -3.2]], [[-7, -47.2, 1.8], [-6.2, -45, -0.8], [-5, -41, -2.2], [-3.8, -36, -2.6], [-3, -31.8, -3.4]]], r: 0.12,
      lesion: { en: 'About 90% of varicoceles are left-sided, because the left testicular vein is longer, enters the renal vein at a right angle and often lacks a valve.',
        de: 'Etwa 90 % der Varikozelen sind linksseitig, weil die linke V. testicularis länger ist, rechtwinklig in die V. renalis mündet und oft keine Klappe hat.' } }),
  V('v_portal', ['liver'], { en: 'Portal vein', de: 'Pfortader', la: 'Vena portae hepatis' },
    { en: 'Formed behind the neck of the pancreas (L2) by the superior mesenteric and splenic veins. It ascends behind the first part of the duodenum and in the free edge of the lesser omentum, behind the common bile duct and hepatic artery, to the porta hepatis, where it divides into right and left branches. It brings about 75% of the blood flow of the liver: nutrient-rich blood from the gut, spleen, pancreas and gallbladder, which is processed before it reaches the systemic circulation. It has no valves.',
      de: 'Entsteht hinter dem Pankreashals (L2) aus V. mesenterica superior und V. splenica. Steigt hinter der Pars superior duodeni und im freien Rand des kleinen Netzes, hinter Ductus choledochus und A. hepatica, zur Leberpforte auf und teilt sich in einen rechten und linken Ast. Bringt etwa 75 % der Leberdurchblutung: nährstoffreiches Blut aus Darm, Milz, Pankreas und Gallenblase, das verarbeitet wird, bevor es den Körperkreislauf erreicht. Sie hat keine Klappen.' },
    { paths: [[PORTAL_START, [2, -28.4, -2.4], [3, -26, -1.8], PORTA_HEPATIS], [PORTA_HEPATIS, [5.4, -23.2, -1.4], [7, -22.8, -1.2]], [PORTA_HEPATIS, [1.8, -23.2, -0.6], [-0.4, -22.2, 0.4]]], r: 0.55, color: PORTAL,
      lesion: { en: 'Portal hypertension (portal pressure above about 10 mmHg; mostly from liver cirrhosis, also portal vein thrombosis or Budd-Chiari syndrome). Because the portal system has no valves, blood is diverted through portocaval anastomoses into the caval veins: (1) oesophageal: left gastric vein to oesophageal and azygos veins, forming oesophageal varices that can bleed massively (haematemesis); (2) rectal: superior rectal vein to middle and inferior rectal veins, forming anorectal varices; (3) paraumbilical: paraumbilical veins in the ligamentum teres to the epigastric veins of the abdominal wall, forming caput medusae around the umbilicus; (4) retroperitoneal veins of the colon to lumbar veins. Also splenomegaly (hypersplenism) and ascites. A TIPS (transjugular intrahepatic portosystemic shunt) lowers the pressure.',
        de: 'Portale Hypertension (Pfortaderdruck über etwa 10 mmHg; meist durch Leberzirrhose, auch Pfortaderthrombose oder Budd-Chiari-Syndrom). Da das Pfortadersystem keine Klappen hat, weicht das Blut über portokavale Anastomosen in die Hohlvenen aus: (1) ösophageal: V. gastrica sinistra zu Ösophagus- und Azygosvenen, es entstehen Ösophagusvarizen, die massiv bluten können (Hämatemesis); (2) rektal: V. rectalis superior zu Vv. rectales mediae und inferiores, es entstehen anorektale Varizen; (3) paraumbilikal: Vv. paraumbilicales im Lig. teres hepatis zu den epigastrischen Venen der Bauchwand, es entsteht ein Caput medusae um den Nabel; (4) retroperitoneale Kolonvenen zu Lumbalvenen. Dazu Splenomegalie (Hypersplenismus) und Aszites. Ein TIPS (transjugulärer intrahepatischer portosystemischer Shunt) senkt den Druck.' } }),
  V('v_splenic', ['v_portal'], { en: 'Splenic vein', de: 'V. splenica (lienalis)', la: 'Vena splenica' },
    { en: 'Leaves the splenic hilum and runs to the right behind the body of the pancreas, below the splenic artery and straighter than it, to join the superior mesenteric vein behind the pancreatic neck. Receives the short gastric, left gastro-omental, pancreatic and usually the inferior mesenteric vein.',
      de: 'Verlässt den Milzhilum und zieht hinter dem Pankreaskörper, unterhalb der A. splenica und gestreckter als sie, nach rechts, wo sie sich hinter dem Pankreashals mit der V. mesenterica superior vereinigt. Nimmt Vv. gastricae breves, V. gastroomentalis sinistra, Vv. pancreaticae und meist die V. mesenterica inferior auf.' },
    { path: [[-7.4, -24.4, -3.2], [-6.2, -25.8, -3.4], [-4.4, -27.8, -3.2], [-2, -29.4, -2.8], [0, -30.1, -2.3], PORTAL_START], r: 0.4, color: PORTAL,
      lesion: { en: 'Splenic vein thrombosis (pancreatitis, pancreatic cancer) causes left-sided (sinistral) portal hypertension: isolated gastric fundus varices through the short gastric veins, with normal liver function. Splenectomy cures it.',
        de: 'Eine Milzvenenthrombose (Pankreatitis, Pankreaskarzinom) verursacht eine linksseitige portale Hypertension: isolierte Fundusvarizen über die Vv. gastricae breves bei normaler Leberfunktion. Die Splenektomie heilt sie.' } }),
  V('v_smv', ['v_portal'], { en: 'Superior mesenteric vein', de: 'V. mesenterica superior', la: 'Vena mesenterica superior' },
    { en: 'Accompanies the SMA on its right side in the root of the mesentery and drains the midgut (jejunal, ileal, ileocolic, right and middle colic veins) as well as the gastro-omental and pancreaticoduodenal veins. It joins the splenic vein behind the pancreatic neck to form the portal vein.',
      de: 'Begleitet die AMS auf ihrer rechten Seite in der Mesenterialwurzel und drainiert den Mitteldarm (Vv. jejunales, ileales, ileocolica, colicae dextra und media) sowie die V. gastroomentalis dextra und die Pankreatikoduodenalvenen. Vereinigt sich hinter dem Pankreashals mit der V. splenica zur V. portae.' },
    { path: [[5.2, -43, 0.6], [3.2, -40, 1], [1.8, -36.4, 0.8], [1.6, -34, -0.2], [1.4, -31.6, -1.8], [1.2, -30.4, -2.2]], r: 0.4, color: PORTAL }),
  V('v_imv', ['v_splenic'], { en: 'Inferior mesenteric vein', de: 'V. mesenterica inferior', la: 'Vena mesenterica inferior' },
    { en: 'Begins as the continuation of the superior rectal vein, ascends retroperitoneally to the left of the IMA and the duodenojejunal flexure (not with the artery) and usually ends in the splenic vein behind the pancreas. Drains the hindgut through the sigmoid and left colic veins.',
      de: 'Beginnt als Fortsetzung der V. rectalis superior, steigt retroperitoneal links der AMI und der Flexura duodenojejunalis auf (nicht mit der Arterie) und mündet meist hinter dem Pankreas in die V. splenica. Drainiert den Enddarm über die Vv. sigmoideae und die V. colica sinistra.' },
    { paths: [[[-2.8, -42, -1.8], [-3.4, -38.6, -2.2], [-3.6, -35, -2.2], [-3.2, -32.4, -2.4], [-2.6, -29.6, -2.9]], [[-8.6, -36, -2.4], [-6, -35.6, -2.4], [-3.6, -35, -2.2]], [[-7.4, -44, -0.2], [-5, -42.6, -1], [-2.8, -42, -1.8]]], r: 0.25, color: PORTAL }),
  V('v_left_gastric', ['v_portal'], { en: 'Left gastric (coronary) vein', de: 'V. gastrica sinistra', la: 'Vena gastrica sinistra' },
    { en: 'Runs along the lesser curvature with the left gastric artery to the cardia, where it receives oesophageal veins, then turns down and to the right behind the lesser sac to the portal vein.',
      de: 'Verläuft mit der A. gastrica sinistra an der kleinen Kurvatur zur Kardia, nimmt dort Ösophagusvenen auf und zieht dann hinter der Bursa omentalis nach rechts unten zur V. portae.' },
    { path: [[-2.4, -21.8, -0.4], [-1.6, -24, 0.6], [-0.6, -26.6, -1], [2, -28.4, -2.4]], r: 0.2, color: PORTAL }),
  V('v_oesophageal', ['v_left_gastric', 'v_azygos'], { en: 'Oesophageal veins (portocaval anastomosis)', de: 'Vv. oesophageales (portokavale Anastomose)', la: 'Venae oesophageales' },
    { en: 'A submucosal venous plexus at the lower end of the oesophagus that drains both downwards into the left gastric vein (portal system) and upwards into the azygos and hemiazygos veins (caval system). It is the most important portocaval anastomosis.',
      de: 'Submuköses Venengeflecht am unteren Ösophagusende, das sowohl abwärts in die V. gastrica sinistra (Pfortadersystem) als auch aufwärts in Vv. azygos und hemiazygos (Hohlvenensystem) drainiert. Die wichtigste portokavale Anastomose.' },
    { paths: [[[-2.4, -21.6, -0.8], [-2.6, -20.2, -1.4], [-1.6, -18.6, -2.4], [-0.4, -17, -3.8], [0.8, -16.4, -5], [1.65, -16.6, -5.9]], [[-2.2, -21.2, -2.4], [-1.4, -19.4, -3.6], [0, -18.8, -5], [1.6, -19, -5.85]]], r: 0.12,
      lesion: { en: 'Oesophageal varices in portal hypertension: the dilated submucosal veins can rupture and cause life-threatening haematemesis. Treatment: endoscopic band ligation, vasoactive drugs (terlipressin), balloon tamponade and TIPS.',
        de: 'Ösophagusvarizen bei portaler Hypertension: Die erweiterten submukösen Venen können rupturieren und eine lebensbedrohliche Hämatemesis verursachen. Therapie: endoskopische Gummibandligatur, vasoaktive Medikamente (Terlipressin), Ballontamponade und TIPS.' } }),
  V('v_superior_rectal', ['v_imv'], { en: 'Superior rectal vein (portocaval anastomosis)', de: 'V. rectalis superior (portokavale Anastomose)', la: 'Vena rectalis superior' },
    { en: 'Drains the upper rectum into the inferior mesenteric vein (portal system). In the wall of the anal canal it anastomoses with the middle and inferior rectal veins, which drain through the internal iliac vein into the IVC: the rectal portocaval anastomosis.',
      de: 'Drainiert das obere Rektum in die V. mesenterica inferior (Pfortadersystem). In der Wand des Analkanals anastomosiert sie mit den Vv. rectales mediae und inferiores, die über die V. iliaca interna in die V. cava inferior abfließen: die rektale portokavale Anastomose.' },
    { path: [[-0.6, -49.6, -4.6], [-1, -47.4, -3.4], [-2, -44.6, -2.2], [-2.8, -42, -1.8]], r: 0.16, color: PORTAL,
      lesion: { en: 'In portal hypertension blood flows through this anastomosis and forms anorectal varices, which can bleed. They are distinct from ordinary haemorrhoids, which are cushions of the arterial corpus cavernosum recti and are not caused by portal hypertension.',
        de: 'Bei portaler Hypertension fließt Blut über diese Anastomose und bildet anorektale Varizen, die bluten können. Sie sind von gewöhnlichen Hämorrhoiden zu unterscheiden, die Polster des arteriell gespeisten Corpus cavernosum recti sind und nicht durch portale Hypertension entstehen.' } }),
  V('v_paraumbilical', ['v_portal'], { en: 'Paraumbilical veins (portocaval anastomosis)', de: 'Vv. paraumbilicales (portokavale Anastomose)', la: 'Venae paraumbilicales' },
    { en: 'Small veins in the ligamentum teres (round ligament of the liver, the obliterated umbilical vein) and the falciform ligament that connect the left branch of the portal vein with the veins around the umbilicus (superficial and inferior epigastric veins), which drain to the caval system.',
      de: 'Kleine Venen im Lig. teres hepatis (der verödeten V. umbilicalis) und im Lig. falciforme, die den linken Pfortaderast mit den Venen um den Nabel verbinden (Vv. epigastricae superficiales und inferiores), die ins Hohlvenensystem abfließen.' },
    { path: [[0, -38.4, 5.4], [0.4, -33, 4.8], [0.6, -28, 3.8], [0.2, -25, 2.2], [-0.4, -22.4, 0.6]], r: 0.1, color: PORTAL,
      lesion: { en: 'Caput medusae: in portal hypertension portal blood flows out through these veins into the abdominal wall veins, which become dilated and tortuous and radiate away from the umbilicus.',
        de: 'Caput medusae: Bei portaler Hypertension fließt Pfortaderblut über diese Venen in die Bauchwandvenen ab, die sich erweitern, schlängeln und strahlenförmig vom Nabel weg ziehen.' } })
];

// ------------------------------------------------------------ nerves
const N = (id, group, segList, parents, name, info, extra) => ({ id, type: 'nerve', group, segs: segList, parents, name, info, ...extra });
const trunkPt = (side, y) => round([side * 2.6, y, bodyZ(y) - 0.3]);
const both = path => [path, path.map(mirror)];
const COELIAC_GANGLION = [1.6, -29, -3.4];

const nerves = [
  N('n_vagal_trunk_anterior', 'parasympathetic', [VAGUS], ['n_oesophageal_plexus'], { en: 'Anterior vagal trunk', de: 'Truncus vagalis anterior', la: 'Truncus vagalis anterior' },
    { en: 'Formed in the oesophageal plexus mainly from fibres of the left vagus; it passes through the oesophageal hiatus on the front of the oesophagus. It gives hepatic branches in the lesser omentum (liver, gallbladder, bile ducts, pylorus) and anterior gastric branches along the lesser curvature (the nerve of Latarjet), which stimulate acid secretion and gastric motility.',
      de: 'Entsteht im Plexus oesophageus überwiegend aus Fasern des linken Vagus und tritt vorn auf dem Ösophagus durch den Hiatus oesophageus. Gibt Rr. hepatici im kleinen Netz ab (Leber, Gallenblase, Gallenwege, Pylorus) und Rr. gastrici anteriores entlang der kleinen Kurvatur (Latarjet-Nerv), die Säuresekretion und Magenmotorik anregen.' },
    { paths: [[[-2.4, -20.2, -1.4], [-2.2, -21.4, -0.4], [-1.4, -23.2, 1], [-0.4, -25.2, 1.9], [0.6, -26.8, 2.2]], [[-2.2, -21.4, -0.4], [-0.4, -22, 0.2], [1.6, -22.8, 0]]], r: 0.13,
      lesion: { en: 'Vagotomy (formerly for peptic ulcer) cuts the vagal trunks: acid secretion falls, but the pylorus no longer relaxes, so gastric emptying is delayed unless a pyloroplasty is added. Highly selective vagotomy spares the pyloric branches.',
        de: 'Die Vagotomie (früher bei Ulkuskrankheit) durchtrennt die Trunci vagales: Die Säuresekretion sinkt, aber der Pylorus erschlafft nicht mehr, sodass sich die Magenentleerung verzögert, wenn keine Pyloroplastik dazukommt. Die selektiv-proximale Vagotomie schont die Pylorusäste.' } }),
  N('n_vagal_trunk_posterior', 'parasympathetic', [VAGUS], ['n_oesophageal_plexus'], { en: 'Posterior vagal trunk', de: 'Truncus vagalis posterior', la: 'Truncus vagalis posterior' },
    { en: 'Formed mainly from fibres of the right vagus; it passes through the hiatus behind the oesophagus, gives posterior gastric branches and sends its largest branch, the coeliac branch, to the coeliac plexus. Through it vagal fibres reach the whole midgut, as far as the left third of the transverse colon.',
      de: 'Entsteht überwiegend aus Fasern des rechten Vagus, tritt hinter dem Ösophagus durch den Hiatus, gibt Rr. gastrici posteriores ab und schickt seinen größten Ast, den R. coeliacus, zum Plexus coeliacus. Über ihn erreichen Vagusfasern den ganzen Mitteldarm bis zum linken Drittel des Querkolons (Cannon-Böhm-Punkt).' },
    { path: [[-2, -20.2, -2.6], [-1.6, -22.6, -3.4], [-0.8, -26, -3.6], [-0.4, -28.2, -3.2]], r: 0.13 }),
  N('n_least_splanchnic', 'sympathetic', ['T12'], ['n_sympathetic_trunk'], { en: 'Least splanchnic nerve', de: 'N. splanchnicus imus', la: 'Nervus splanchnicus imus' },
    { en: 'Preganglionic sympathetic fibres from T12 that pierce the crus of the diaphragm with the sympathetic trunk and end in the renal plexus.',
      de: 'Präganglionäre sympathische Fasern aus Th12, die mit dem Grenzstrang den Zwerchfellschenkel durchbohren und im Plexus renalis enden.' },
    { paths: both([trunkPt(1, Y.T12), [2.4, -29.4, -5.4], [2.2, -31.2, -4.2]]), r: 0.1 }),
  N('n_lumbar_splanchnic', 'sympathetic', ['L1', 'L2'], ['n_sympathetic_trunk'], { en: 'Lumbar splanchnic nerves', de: 'Nn. splanchnici lumbales', la: 'Nervi splanchnici lumbales' },
    { en: 'Preganglionic sympathetic fibres from L1–L2 that leave the lumbar sympathetic ganglia and run forwards to the inferior mesenteric plexus and the superior hypogastric plexus (hindgut, ureter, pelvic organs; ejaculation).',
      de: 'Präganglionäre sympathische Fasern aus L1–L2, die die lumbalen Grenzstrangganglien verlassen und nach vorn zum Plexus mesentericus inferior und Plexus hypogastricus superior ziehen (Enddarm, Ureter, Beckenorgane; Ejakulation).' },
    { paths: both([trunkPt(1, -30.6), [1.8, -33.4, -3.8], [1.2, -36.4, -2.8]]), r: 0.1,
      lesion: { en: 'They are at risk in retroperitoneal lymph node dissection (testicular cancer) and aortic surgery: loss of emission and ejaculation (retrograde ejaculation).',
        de: 'Sie sind bei retroperitonealer Lymphadenektomie (Hodenkarzinom) und Aortenchirurgie gefährdet: Verlust von Emission und Ejakulation (retrograde Ejakulation).' } }),
  N('n_coeliac_plexus', 'plexus', [...segs('T5', 'T9'), VAGUS], ['n_greater_splanchnic', 'n_vagal_trunk_posterior'], { en: 'Coeliac ganglia and plexus', de: 'Ganglia coeliaca und Plexus coeliacus', la: 'Ganglia coeliaca et plexus coeliacus' },
    { en: 'The largest prevertebral plexus ("solar plexus"), around the coeliac trunk at T12–L1, with two large coeliac ganglia. Preganglionic fibres of the greater splanchnic nerves (T5–T9) synapse here; vagal fibres (coeliac branch of the posterior trunk) pass through without synapsing. Postganglionic fibres follow the branches of the coeliac trunk to the foregut organs (stomach, duodenum, liver, gallbladder, pancreas, spleen). Visceral pain fibres of these organs return through it to T6–T9 (epigastric pain).',
      de: 'Größtes prävertebrales Geflecht ("Sonnengeflecht") um den Truncus coeliacus in Höhe Th12–L1 mit zwei großen Ganglia coeliaca. Hier werden die präganglionären Fasern der Nn. splanchnici majores (Th5–Th9) umgeschaltet; Vagusfasern (R. coeliacus des hinteren Trunkus) ziehen ohne Umschaltung hindurch. Postganglionäre Fasern folgen den Ästen des Truncus coeliacus zu den Vorderdarmorganen (Magen, Duodenum, Leber, Gallenblase, Pankreas, Milz). Viszerale Schmerzfasern dieser Organe laufen über ihn nach Th6–Th9 zurück (epigastrischer Schmerz).' },
    { paths: [[[1.6, -28.6, -4.6], COELIAC_GANGLION, [0.6, -28.4, -2.6], [-0.6, -28.4, -2.6], mirror(COELIAC_GANGLION), [-1.6, -28.6, -4.6]],
      [[0.6, -28.4, -2.6], [2, -28, -1.4], [3, -25, -0.6]], [[-0.6, -28.4, -2.6], [-2.4, -28, -2.8], [-5, -27, -2.8]], [[-0.4, -28.6, -2.6], [-1.4, -26.6, -2], [-2.2, -24, -1.4]]], r: 0.15,
      lesion: { en: 'Coeliac plexus block (neurolysis with alcohol, under CT or endoscopic ultrasound guidance) relieves the severe pain of pancreatic cancer and chronic pancreatitis, because the visceral pain fibres from the upper abdominal organs pass through it. A side effect is diarrhoea and orthostatic hypotension (loss of sympathetic tone). A blow to the "solar plexus" knocks the wind out of a boxer.',
        de: 'Die Zöliakusblockade (Neurolyse mit Alkohol unter CT- oder Endosonographiekontrolle) lindert die schweren Schmerzen bei Pankreaskarzinom und chronischer Pankreatitis, weil die viszeralen Schmerzfasern der Oberbauchorgane durch den Plexus ziehen. Nebenwirkungen sind Durchfall und orthostatische Hypotonie (Wegfall des Sympathikotonus). Ein Schlag auf den "Solarplexus" raubt dem Boxer die Luft.' } }),
  N('n_superior_mesenteric_plexus', 'plexus', [...segs('T8', 'T11'), VAGUS], ['n_coeliac_plexus', 'n_lesser_splanchnic'], { en: 'Superior mesenteric ganglion and plexus', de: 'Ganglion und Plexus mesentericus superior', la: 'Ganglion et plexus mesentericus superior' },
    { en: 'Continuation of the coeliac plexus around the origin of the SMA, with the superior mesenteric ganglion. It receives fibres of the lesser splanchnic nerves (T10–T11) and the lower greater splanchnic roots, plus vagal fibres, and follows the branches of the SMA to the midgut: duodenum below the papilla, jejunum, ileum, caecum, appendix, ascending colon and the proximal two thirds of the transverse colon. Midgut pain is referred to the umbilical region (T10).',
      de: 'Fortsetzung des Plexus coeliacus um den Abgang der AMS mit dem Ganglion mesentericum superius. Erhält Fasern der Nn. splanchnici minores (Th10–Th11) und der unteren Wurzeln des N. splanchnicus major sowie Vagusfasern und folgt den Ästen der AMS zum Mitteldarm: Duodenum unterhalb der Papille, Jejunum, Ileum, Zäkum, Appendix, Colon ascendens und proximale zwei Drittel des Querkolons. Schmerz aus dem Mitteldarm projiziert in die Nabelregion (Th10).' },
    { paths: [[COELIAC_GANGLION, [0.2, -30.8, -2.6], [-0.2, -31.6, -1.4]], [mirror(COELIAC_GANGLION), [-0.8, -30.8, -2.6], [-0.6, -31.6, -1.4]], [[2, -29.6, -4.4], [1.2, -30.6, -3]], [[-2, -29.6, -4.4], [-1.2, -30.6, -3]],
      [[-0.4, -31.6, -1.4], [-0.8, -33.4, -0.4], [-0.4, -36, 0.4], [-0.6, -39, 1]]], r: 0.13,
      lesion: { en: 'Referred pain from the appendix: distension of the inflamed appendix stimulates visceral afferents that run back through this plexus and the lesser splanchnic nerve to T10. The brain projects the pain onto the T10 dermatome, around the umbilicus. Only later, when the parietal peritoneum is involved, does the pain move to McBurney point.',
        de: 'Übertragener Schmerz der Appendix: Die Dehnung des entzündeten Wurmfortsatzes erregt viszerale Afferenzen, die über diesen Plexus und den N. splanchnicus minor nach Th10 zurücklaufen. Das Gehirn projiziert den Schmerz auf das Dermatom Th10 um den Nabel. Erst später, wenn das parietale Peritoneum beteiligt ist, wandert der Schmerz zum McBurney-Punkt.' } }),
  N('n_renal_plexus', 'plexus', [...segs('T10', 'T12'), 'L1'], ['n_lesser_splanchnic', 'n_least_splanchnic', 'n_lumbar_splanchnic'], { en: 'Aorticorenal ganglia and renal plexus', de: 'Ganglia aorticorenalia und Plexus renalis', la: 'Ganglia aorticorenalia et plexus renalis' },
    { en: 'Ganglia at the origin of the renal arteries and the plexus that follows them into the kidney. Fibres from the lesser, least and first lumbar splanchnic nerves (T10–L1) supply the renal vessels (vasoconstriction, renin release), the upper ureter and the suprarenal medulla (preganglionic fibres ending on chromaffin cells).',
      de: 'Ganglien am Abgang der Nierenarterien und das Geflecht, das ihnen in die Niere folgt. Fasern der Nn. splanchnici minor, imus und lumbalis I (Th10–L1) versorgen die Nierengefäße (Vasokonstriktion, Reninfreisetzung), den oberen Ureter und das Nebennierenmark (präganglionäre Fasern enden an den chromaffinen Zellen).' },
    { paths: [[[2, -29.6, -4.4], [1.4, -31.8, -3.6], [2.6, -32.2, -4.6], [3.6, -32.6, -4.6]], [[-2, -29.6, -4.4], [-1.4, -31.4, -3.8], [-2.4, -31.4, -4.4], [-3.6, -31.4, -4.6]],
      [[2.2, -31.2, -4.2], [1.4, -31.8, -3.6]], [[-2.2, -31.2, -4.2], [-1.4, -31.4, -3.8]], [[1.4, -31.8, -3.6], [2.6, -30, -4.4], [3.4, -28.8, -4.6]], [[-1.4, -31.4, -3.8], [-2.8, -29.6, -4.2], [-3.6, -28.4, -4.4]]], r: 0.11,
      lesion: { en: 'Renal denervation (catheter ablation of the renal plexus) has been tried for resistant hypertension. Kidney and upper ureter pain is felt in the flank and loin (T10–L1).',
        de: 'Die renale Denervierung (Katheterablation des Plexus renalis) wurde bei therapieresistenter Hypertonie erprobt. Schmerz aus Niere und oberem Ureter wird in Flanke und Lende empfunden (Th10–L1).' } }),
  N('n_inferior_mesenteric_plexus', 'plexus', ['L1', 'L2'], ['n_lumbar_splanchnic'], { en: 'Inferior mesenteric ganglion and plexus', de: 'Ganglion und Plexus mesentericus inferior', la: 'Ganglion et plexus mesentericus inferior' },
    { en: 'Plexus around the origin of the IMA, fed by the intermesenteric plexus on the aorta and the lumbar splanchnic nerves (L1–L2). It follows the IMA to the hindgut: left third of the transverse colon, descending and sigmoid colon, upper rectum. Below it continues as the superior hypogastric plexus in front of L5 into the pelvis. The parasympathetic supply of the hindgut (pelvic splanchnic nerves, S2–S4) ascends through it.',
      de: 'Geflecht um den Abgang der AMI, gespeist vom Plexus intermesentericus auf der Aorta und den Nn. splanchnici lumbales (L1–L2). Folgt der AMI zum Enddarm: linkes Drittel des Querkolons, Colon descendens und sigmoideum, oberes Rektum. Nach unten setzt es sich als Plexus hypogastricus superior vor L5 ins Becken fort. Die parasympathische Versorgung des Enddarms (Nn. splanchnici pelvici, S2–S4) steigt durch ihn auf.' },
    { paths: [[[1.2, -36.4, -2.8], [0.2, -37, -2.4], [-0.8, -37.4, -2], [-1.4, -38.2, -1.6]], [[-1.2, -36.4, -2.8], [-0.8, -37.4, -2]], [[-1.8, -37.6, -1.5], [-2.8, -39.4, -1.4], [-3, -41.4, -1.6]],
      [[0.4, -37.6, -2.6], [0.6, -40, -2.2], [0.8, -42.2, -2], [0.6, -44, -3]], [[0.6, -44, -3], [2.6, -46, -3.8]], [[0.6, -44, -3], [-1.6, -46, -3.8]]], r: 0.12,
      lesion: { en: 'Hindgut pain (descending and sigmoid colon) is referred to the hypogastrium. Injury to the superior hypogastric plexus during rectal or aortic surgery causes ejaculatory dysfunction.',
        de: 'Schmerz aus dem Enddarm (Colon descendens und sigmoideum) projiziert ins Hypogastrium. Eine Verletzung des Plexus hypogastricus superior bei Rektum- oder Aortenoperationen führt zu Ejakulationsstörungen.' } })
];

export const structures = [...organs, ...arteries, ...veins, ...nerves];
export const muscleGroups = {};

export const meta = {
  start: 'stomach',
  plexus: { en: 'Autonomic nerves', de: 'Vegetative Nerven' },
  plexusTargets: { en: 'Autonomic nerves → organs', de: 'Vegetative Nerven → Organe' },
  nerveGroups: [
    ['parasympathetic', { en: 'Parasympathetic: vagal trunks', de: 'Parasympathikus: Trunci vagales' }],
    ['sympathetic', { en: 'Splanchnic nerves', de: 'Nn. splanchnici' }],
    ['plexus', { en: 'Prevertebral plexuses and ganglia', de: 'Prävertebrale Plexus und Ganglien' }]
  ],
  organGroups: [
    ['foregut', { en: 'Stomach and duodenum', de: 'Magen und Duodenum' }],
    ['intestine', { en: 'Small and large intestine', de: 'Dünn- und Dickdarm' }],
    ['hepatobiliary', { en: 'Liver, biliary tract, pancreas and spleen', de: 'Leber, Gallenwege, Pankreas und Milz' }],
    ['urinary', { en: 'Kidneys, ureters and suprarenal glands', de: 'Nieren, Ureteren und Nebennieren' }],
    ['peritoneum', { en: 'Peritoneum and omenta', de: 'Peritoneum und Netze' }]
  ],
  // Abdominal wall, skeleton and the vessels and nerves shared with the back, lower limb and thorax.
  context: ['lumbar_vertebrae', 'ribs', 'hip_bone', 'diaphragm', 'rectus_abdominis', 'external_oblique', 'internal_oblique',
    'transversus_abdominis', 'quadratus_lumborum', 'a_abdominal_aorta', 'a_common_iliac', 'a_inf_phrenic', 'a_lumbar',
    'a_inf_epigastric', 'v_ivc', 'v_azygos', 'n_vagus', 'n_oesophageal_plexus', 'n_sympathetic_trunk', 'n_greater_splanchnic',
    'n_lesser_splanchnic', 'n_phrenic', 'n_thoracoabdominal', 'n_subcostal', 'n_iliohypogastric', 'oesophagus_thoracic', 'n_pelvic_splanchnic'],
  contextOpacity: 0.3, // fade the abdominal wall so the organs stay visible
  camera: { target: [0, -35, 0], position: [12, -28, 70] }
};
