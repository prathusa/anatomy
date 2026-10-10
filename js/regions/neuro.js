// Neuroanatomy: cerebral lobes and cortical areas, basal ganglia, diencephalon, brainstem with the
// cranial nerve nuclei, cerebellum, spinal cord, ventricles and CSF flow, the long tracts, and the
// arteries of the brain with their territories.
// Coordinates: [lateral, superior, anterior] in schematic cm, same body frame as the other regions
// (x > 0 is the body's right; the viewer mirrors x). The brain sits inside the skull vault of the
// head and neck region; the cord follows the vertebral canal of the back region.
//
// Three types are specific to this region:
//   brain     a CNS structure (lobe, nucleus, cord level, ventricle), drawn like an organ (`shape`),
//             optionally `partOf` another, with the cranial nerves its nucleus gives fibres to
//             (`nerves`) and, for the CSF spaces, where the CSF flows on (`drains`).
//   tract     a pathway (`path`/`paths`, `r`), continuous with its `parents`, running `through`
//             brain structures, so a lesion of a structure cuts the tracts that pass it.
//   function  what a pathway serves (movement of the arm, pain from the leg, the upper temporal visual
//             field...), drawn as a small sphere at its cortical or nuclear representation. `via` lists
//             the links that serve it, each with the side on which the deficit appears relative to a
//             one-sided lesion of that link ('ipsi', 'contra', 'both'); see js/lesion.js.
// Arteries list the structures they supply in `territory`.
// Paired brain structures are drawn on both sides. Tracts are drawn for one side of the body:
// every pathway is drawn as it serves the LEFT half of the body (and the left visual field), so it
// ends in the RIGHT hemisphere, where the function spheres sit. Language sits in the left (dominant)
// hemisphere. Motor pathways orange, the dorsal column pathway green, the spinothalamic pathway
// teal, the visual pathway magenta, the spinocerebellar tracts brown.
//
// Cranial nerves, the vertebral and internal carotid arteries, the dural sinuses, the eye, the skull
// base, cervical vertebrae and spinal nerves belong to the back and head and neck regions and are
// linked by id.

const r2 = x => Math.round(x * 100) / 100;
const round = p => p.map(r2);
const mirror = p => [-p[0], p[1], p[2]];
const both = path => [path, path.map(mirror)];
// Paired solids: [centre, ...] entries for ellipsoids and spheres, [points, r] for tubes.
const pair = list => list.flatMap(([c, ...rest]) => [[c, ...rest], [mirror(c), ...rest]]);
const pairTubes = list => list.flatMap(([pts, r]) => [[pts, r], [pts.map(mirror), r]]);

// Cortex: a point on the skull vault ellipsoid (see head-neck.js), `off` cm inside it.
// Longitude from anterior (0°) towards the right (90°), latitude from the equator up to the vertex.
const VAULT_C = [0, 21.4, -1.9], VAULT_R = [6, 7.2, 7.4];
const cortex = (lon, lat, off = -0.9) => {
  const l = lon * Math.PI / 180, b = lat * Math.PI / 180;
  return round([(VAULT_R[0] + off) * Math.cos(b) * Math.sin(l), VAULT_C[1] + (VAULT_R[1] + off) * Math.sin(b), VAULT_C[2] + (VAULT_R[2] + off) * Math.cos(b) * Math.cos(l)]);
};
// The central sulcus runs from just behind the vertex down and forwards to the lateral sulcus.
const central = lat => 74 + 25 * lat / 90;
const precentral = (lat, off) => cortex(central(lat) - 7, lat, off);
const postcentral = (lat, off) => cortex(central(lat) + 7, lat, off);
const GYRUS_LATS = [88, 75, 60, 45, 30, 15, 2];

// Spinal cord: centre of the vertebral canal (back.js vertebral bodies, arch behind them).
const CORD = [[14.4, -4.7], [12.6, -4.4], [8, -4.3], [3, -4.6], [0, -5.5], [-4, -7.1], [-10, -8.7], [-16, -9.3], [-22, -9], [-27, -8.5], [-31.5, -7.9]];
const cordZ = y => {
  for (let i = 1; i < CORD.length; i++) {
    const [y0, z0] = CORD[i - 1], [y1, z1] = CORD[i];
    if (y <= y0 && y >= y1) return z0 + (z1 - z0) * (y - y0) / (y1 - y0);
  }
  return y > CORD[0][0] ? CORD[0][1] : CORD.at(-1)[1];
};
// A path down (or up) the cord from y0 to y1, x cm from the midline and dz cm anterior to its centre.
const cord = (x, y0, y1, dz = 0) => {
  const ys = [y0, ...CORD.map(([y]) => y).filter(y => (y - y0) * (y - y1) < 0), y1];
  if (y0 < y1) ys.sort((a, b) => a - b); else ys.sort((a, b) => b - a);
  return ys.map(y => round([x, y, cordZ(y) + dz]));
};

const B = (id, group, name, info, shape, extra = {}) => ({ id, type: 'brain', group, name, info, shape, ...extra });
const T = (id, group, name, info, paths, r, parents, through, extra = {}) =>
  ({ id, type: 'tract', group, name, info, paths, r, parents, through, ...extra });
const F = (id, group, name, info, at, partOf, self, via, extra = {}) =>
  ({ id, type: 'function', group, name, info, shape: { spheres: [[at, extra.size || 0.26]], opacity: 1 }, partOf, self, via, ...extra });
const A = (id, name, info, paths, r, parents, territory, extra = {}) =>
  ({ id, type: 'artery', name, info, paths, r, parents, territory, ...extra });

const LOBE = 0xd8b4ac, GREY = 0x9c8f92, WHITE = 0xece5d3, CSF = 0x55b3e8, STEM = 0xc9a59c, CORD_C = 0xd9c7a8;
const MOTOR = 0xe8743b, DCML = 0x2e9e5b, STT = 0x1f9fb0, VISUAL = 0xd94f9a, CEREB = 0x8a6d3b, SYMP = 0x6a8f2a;

const LOBE_OPACITY = 0.13;

const BRAIN = [
  // ---------------------------------------------------------------- cerebrum
  B('frontal_lobe', 'cerebrum', { en: 'Frontal lobe', de: 'Frontallappen', la: 'Lobus frontalis' },
    { en: 'In front of the central sulcus and above the lateral sulcus. Holds the primary motor cortex (precentral gyrus), the premotor and prefrontal cortex (planning, personality, working memory) and, on the dominant side, Broca\'s area. Supplied laterally by the MCA, medially by the ACA.',
      de: 'Vor dem Sulcus centralis und über dem Sulcus lateralis. Enthält den primär-motorischen Kortex (Gyrus praecentralis), den prämotorischen und präfrontalen Kortex (Planung, Persönlichkeit, Arbeitsgedächtnis) und auf der dominanten Seite das Broca-Areal. Lateral von der A. cerebri media, medial von der A. cerebri anterior versorgt.' },
    { ellipsoids: pair([[[2.5, 23.8, 1.2], [2.4, 3.2, 3.4]]]), opacity: LOBE_OPACITY }, { color: LOBE }),
  B('parietal_lobe', 'cerebrum', { en: 'Parietal lobe', de: 'Parietallappen', la: 'Lobus parietalis' },
    { en: 'Behind the central sulcus. The postcentral gyrus is the primary somatosensory cortex; the posterior parietal cortex integrates space and attention (non-dominant lesions: hemineglect). The upper optic radiation runs deep in it.',
      de: 'Hinter dem Sulcus centralis. Der Gyrus postcentralis ist der primär-somatosensible Kortex; der hintere Parietalkortex verarbeitet Raum und Aufmerksamkeit (Läsion der nicht-dominanten Seite: Neglect). In der Tiefe verläuft der obere Teil der Sehstrahlung.' },
    { ellipsoids: pair([[[2.5, 25, -3.6], [2.4, 2.6, 2.9]]]), opacity: LOBE_OPACITY }, { color: LOBE }),
  B('temporal_lobe', 'cerebrum', { en: 'Temporal lobe', de: 'Temporallappen', la: 'Lobus temporalis' },
    { en: 'Below the lateral sulcus, in the middle cranial fossa. Holds the primary auditory cortex (Heschl\'s gyri), Wernicke\'s area on the dominant side, and medially the hippocampus and amygdala (memory, emotion). Meyer\'s loop of the optic radiation sweeps forward through it.',
      de: 'Unter dem Sulcus lateralis, in der mittleren Schädelgrube. Enthält die primäre Hörrinde (Heschl-Querwindungen), auf der dominanten Seite das Wernicke-Areal und medial Hippocampus und Amygdala (Gedächtnis, Emotion). Die Meyer-Schleife der Sehstrahlung zieht nach vorn durch ihn.' },
    { ellipsoids: pair([[[4.2, 19.8, -1.4], [1.3, 1.8, 3.2]]]), opacity: LOBE_OPACITY }, { color: LOBE }),
  B('occipital_lobe', 'cerebrum', { en: 'Occipital lobe', de: 'Okzipitallappen', la: 'Lobus occipitalis' },
    { en: 'The back of the hemisphere, above the tentorium. The primary visual cortex lines the calcarine sulcus on its medial surface; the visual association cortex surrounds it. Supplied by the posterior cerebral artery.',
      de: 'Hinterer Pol der Hemisphäre, über dem Tentorium. Die primäre Sehrinde liegt medial am Sulcus calcarinus, umgeben von der visuellen Assoziationsrinde. Versorgt von der A. cerebri posterior.' },
    { ellipsoids: pair([[[2.2, 22.2, -7], [2, 2.4, 1.7]]]), opacity: LOBE_OPACITY }, { color: LOBE }),
  B('insula', 'cerebrum', { en: 'Insula', de: 'Insel', la: 'Insula' },
    { en: 'Cortex hidden deep in the lateral sulcus, covered by the opercula of the frontal, parietal and temporal lobes. Taste, visceral sensation and interoception. The MCA runs over it before fanning out.',
      de: 'In der Tiefe des Sulcus lateralis verborgene Rinde, bedeckt von den Opercula des Frontal-, Parietal- und Temporallappens. Geschmack, viszerale Sensibilität, Interozeption. Die A. cerebri media zieht über sie hinweg.' },
    { ellipsoids: pair([[[3.5, 21.2, -0.8], [0.35, 1, 1.4]]]), opacity: 0.35 }, { color: GREY }),
  B('precentral_gyrus', 'cerebrum', { en: 'Precentral gyrus (primary motor cortex)', de: 'Gyrus praecentralis (primär-motorischer Kortex)', la: 'Gyrus praecentralis' },
    { en: 'Brodmann area 4, origin of the corticospinal and corticobulbar tracts. Arranged as the motor homunculus: leg and foot on the medial surface (ACA territory), trunk, arm and hand on the convexity, face, tongue and larynx lowest, near the lateral sulcus (MCA territory). Each side controls the opposite half of the body.',
      de: 'Brodmann-Area 4, Ursprung der Pyramidenbahn und der kortikonukleären Bahn. Gegliedert als motorischer Homunkulus: Bein und Fuß an der Mantelkante/medial (Stromgebiet der A. cerebri anterior), Rumpf, Arm und Hand an der Konvexität, Gesicht, Zunge und Kehlkopf ganz unten am Sulcus lateralis (A. cerebri media). Jede Seite steuert die Gegenseite.' },
    { tubes: pairTubes([[GYRUS_LATS.map(l => precentral(l)), 0.33]]), opacity: 0.4 }, { color: 0xc98476, partOf: 'frontal_lobe' }),
  B('postcentral_gyrus', 'cerebrum', { en: 'Postcentral gyrus (primary somatosensory cortex)', de: 'Gyrus postcentralis (primär-somatosensibler Kortex)', la: 'Gyrus postcentralis' },
    { en: 'Brodmann areas 3, 1 and 2. Receives touch, position sense, pain and temperature from the opposite half of the body via the thalamus (VPL for the body, VPM for the face), arranged as the sensory homunculus like the motor cortex in front of it.',
      de: 'Brodmann-Areae 3, 1 und 2. Erhält Berührung, Lagesinn, Schmerz und Temperatur der Gegenseite über den Thalamus (VPL für den Körper, VPM für das Gesicht), gegliedert als sensibler Homunkulus wie der motorische Kortex davor.' },
    { tubes: pairTubes([[GYRUS_LATS.map(l => postcentral(l)), 0.33]]), opacity: 0.4 }, { color: 0x7fb29a, partOf: 'parietal_lobe' }),
  B('broca_area', 'cerebrum', { en: 'Broca\'s area', de: 'Broca-Areal (motorisches Sprachzentrum)', la: 'Area Broca (gyrus frontalis inferior, pars opercularis et triangularis)' },
    { en: 'Brodmann areas 44 and 45 in the inferior frontal gyrus of the dominant (usually left) hemisphere: speech production and grammar. Connected to Wernicke\'s area by the arcuate fasciculus. Supplied by the superior division of the MCA.',
      de: 'Brodmann-Areae 44 und 45 im Gyrus frontalis inferior der dominanten (meist linken) Hemisphäre: Sprachproduktion und Grammatik. Über den Fasciculus arcuatus mit dem Wernicke-Areal verbunden. Versorgt vom oberen Hauptast der A. cerebri media.' },
    { ellipsoids: [[[-4.6, 21.8, 1.6], [0.45, 0.7, 0.8]]], opacity: 0.55 }, { color: 0xb07cc6, partOf: 'frontal_lobe',
      lesion: { en: 'Broca (motor, non-fluent) aphasia: effortful, telegraphic speech with good comprehension; patients are aware of the deficit. Often with right face and arm weakness (neighbouring motor cortex).',
        de: 'Broca-Aphasie (motorisch, nicht flüssig): mühsame, agrammatische Telegrammsprache bei gutem Sprachverständnis; die Patienten bemerken den Fehler. Oft mit rechtsseitiger Gesichts- und Armparese (benachbarter Motorkortex).' } }),
  B('wernicke_area', 'cerebrum', { en: 'Wernicke\'s area', de: 'Wernicke-Areal (sensorisches Sprachzentrum)', la: 'Area Wernicke (gyrus temporalis superior, pars posterior)' },
    { en: 'Posterior part of the superior temporal gyrus (Brodmann 22) of the dominant hemisphere: language comprehension. Supplied by the inferior division of the MCA.',
      de: 'Hinterer Teil des Gyrus temporalis superior (Brodmann 22) der dominanten Hemisphäre: Sprachverständnis. Versorgt vom unteren Hauptast der A. cerebri media.' },
    { ellipsoids: [[[-4.9, 21.1, -3.4], [0.45, 0.65, 0.85]]], opacity: 0.55 }, { color: 0xb07cc6, partOf: 'temporal_lobe',
      lesion: { en: 'Wernicke (sensory, fluent) aphasia: fluent but empty speech with paraphasias and neologisms, poor comprehension, often unaware of the deficit. Often with a contralateral upper quadrantanopia (Meyer\'s loop nearby).',
        de: 'Wernicke-Aphasie (sensorisch, flüssig): flüssige, aber inhaltsarme Sprache mit Paraphasien und Neologismen, schlechtes Sprachverständnis, oft fehlende Krankheitseinsicht. Oft mit Quadrantenanopsie nach oben zur Gegenseite (Meyer-Schleife).' } }),
  B('primary_visual_cortex', 'cerebrum', { en: 'Primary visual cortex (V1)', de: 'Primäre Sehrinde (V1, Area striata)', la: 'Area striata (cortex visualis primarius)' },
    { en: 'Brodmann area 17 on both banks of the calcarine sulcus. Each side receives the opposite visual field: the upper field below the sulcus (lingual gyrus, via Meyer\'s loop), the lower field above it (cuneus). The macula is represented at the occipital pole, which the MCA often also supplies.',
      de: 'Brodmann-Area 17 an beiden Lippen des Sulcus calcarinus. Jede Seite erhält das gegenseitige Gesichtsfeld: das obere unterhalb des Sulcus (Gyrus lingualis, über die Meyer-Schleife), das untere oberhalb (Cuneus). Die Makula liegt am Okzipitalpol, den oft auch die A. cerebri media mitversorgt.' },
    { ellipsoids: pair([[[0.7, 22.05, -8], [0.35, 0.95, 0.7]]]), opacity: 0.45 }, { color: 0xc77aa5, partOf: 'occipital_lobe',
      lesion: { en: 'Contralateral homonymous hemianopia, typically with macular sparing after PCA occlusion (the occipital pole also receives MCA blood).',
        de: 'Homonyme Hemianopsie zur Gegenseite, nach Verschluss der A. cerebri posterior typischerweise mit Aussparung der Makula (der Okzipitalpol erhält auch Blut aus der A. cerebri media).' } }),
  B('corpus_callosum', 'cerebrum', { en: 'Corpus callosum', de: 'Balken', la: 'Corpus callosum' },
    { en: 'The largest commissure, about 200 million axons linking corresponding cortical areas of the two hemispheres. Rostrum, genu, trunk and splenium; forms the roof of the lateral ventricles. Supplied by the ACA (pericallosal artery) and, at the splenium, the PCA.',
      de: 'Größte Kommissur, rund 200 Millionen Axone zwischen entsprechenden Rindenfeldern beider Hemisphären. Rostrum, Genu, Truncus und Splenium; bildet das Dach der Seitenventrikel. Versorgt von der A. cerebri anterior (A. pericallosa), am Splenium von der A. cerebri posterior.' },
    { tubes: [[[[0, 21.8, 1.4], [0, 23.2, 0.8], [0, 23.6, -1.2], [0, 23.5, -3.4], [0, 22.7, -5]], 0.32]], opacity: 0.45 }, { color: WHITE, midline: true }),

  // ---------------------------------------------------------------- basal ganglia and internal capsule
  B('caudate_nucleus', 'basal', { en: 'Caudate nucleus', de: 'Nucleus caudatus', la: 'Nucleus caudatus' },
    { en: 'C-shaped nucleus following the lateral ventricle: head in the wall of the anterior horn, body and tail curving back into the temporal lobe. With the putamen it forms the striatum, the input stage of the basal ganglia loop. Atrophies early in Huntington disease.',
      de: 'C-förmiger Kern entlang des Seitenventrikels: Kopf in der Wand des Vorderhorns, Körper und Schwanz biegen nach hinten in den Temporallappen. Bildet mit dem Putamen das Striatum, die Eingangsstation der Basalganglienschleife. Atrophiert früh bei Chorea Huntington.' },
    { ellipsoids: pair([[[1.3, 21.9, 0.4], [0.55, 0.75, 0.8]]]),
      tubes: pairTubes([[[[1.3, 22.4, 0.2], [1.4, 22.8, -1.2], [1.5, 22.6, -3], [2, 21.8, -4.4], [2.6, 20.6, -4.6], [3.1, 19.8, -3.4]], 0.24]]), opacity: 0.5 }, { color: GREY }),
  B('putamen', 'basal', { en: 'Putamen', de: 'Putamen', la: 'Putamen' },
    { en: 'Lateral part of the lentiform nucleus, lateral to the globus pallidus and the internal capsule. Part of the striatum: receives cortical input and dopamine from the substantia nigra. Supplied by the lenticulostriate arteries; a common site of hypertensive haemorrhage.',
      de: 'Lateraler Teil des Nucleus lentiformis, seitlich von Globus pallidus und Capsula interna. Teil des Striatums: erhält kortikale Afferenzen und Dopamin aus der Substantia nigra. Versorgt von den Aa. centrales anterolaterales (lentikulostriatale Arterien); häufiger Ort hypertensiver Blutungen.' },
    { ellipsoids: pair([[[2.75, 21, -1.1], [0.45, 0.85, 1.5]]]), opacity: 0.5 }, { color: GREY }),
  B('globus_pallidus', 'basal', { en: 'Globus pallidus', de: 'Globus pallidus (Pallidum)', la: 'Globus pallidus' },
    { en: 'Medial part of the lentiform nucleus. Its internal segment is the main output of the basal ganglia, inhibiting the motor thalamus; the external segment is part of the indirect pathway with the subthalamic nucleus.',
      de: 'Medialer Teil des Nucleus lentiformis. Das innere Segment ist der Hauptausgang der Basalganglien und hemmt den motorischen Thalamus; das äußere Segment gehört mit dem Nucleus subthalamicus zum indirekten Weg.' },
    { ellipsoids: pair([[[2.15, 20.9, -1.4], [0.25, 0.6, 0.85]]]), opacity: 0.5 }, { color: 0xb0a6a8 }),
  B('subthalamic_nucleus', 'basal', { en: 'Subthalamic nucleus', de: 'Nucleus subthalamicus', la: 'Nucleus subthalamicus' },
    { en: 'Small lens-shaped nucleus below the thalamus, the excitatory relay of the indirect pathway. Target of deep brain stimulation in Parkinson disease.',
      de: 'Kleiner linsenförmiger Kern unter dem Thalamus, die erregende Station des indirekten Wegs. Zielpunkt der tiefen Hirnstimulation bei Morbus Parkinson.' },
    { ellipsoids: pair([[[1.05, 19.7, -2.6], [0.28, 0.16, 0.32]]]), opacity: 0.6 }, { color: GREY,
      lesion: { en: 'Contralateral hemiballism: violent flinging movements of the arm and leg, classically after a small lacunar infarct.',
        de: 'Hemiballismus der Gegenseite: heftige Schleuderbewegungen von Arm und Bein, klassisch nach einem kleinen lakunären Infarkt.' } }),
  B('substantia_nigra', 'basal', { en: 'Substantia nigra', de: 'Substantia nigra', la: 'Substantia nigra' },
    { en: 'Pigmented nucleus in the midbrain behind the cerebral peduncle. The pars compacta sends dopamine to the striatum; the pars reticulata is a second output of the basal ganglia. Loss of its dopaminergic neurons causes Parkinson disease.',
      de: 'Pigmentierter Kern im Mittelhirn hinter dem Crus cerebri. Die Pars compacta liefert Dopamin an das Striatum; die Pars reticulata ist ein zweiter Ausgang der Basalganglien. Der Untergang ihrer dopaminergen Neurone verursacht den Morbus Parkinson.' },
    { tubes: pairTubes([[[[1, 19.3, -3], [0.6, 18.6, -3]], 0.14]]), opacity: 0.85 }, { color: 0x3b3236, partOf: 'midbrain',
      lesion: { en: 'Parkinsonism on the opposite side: bradykinesia, rigidity and resting tremor (in Parkinson disease the loss is bilateral and asymmetric).',
        de: 'Parkinson-Syndrom der Gegenseite: Bradykinese, Rigor und Ruhetremor (beim Morbus Parkinson beidseitig, asymmetrisch).' } }),
  B('internal_capsule', 'basal', { en: 'Internal capsule', de: 'Capsula interna', la: 'Capsula interna' },
    { en: 'V-shaped band of white matter between the caudate and thalamus medially and the lentiform nucleus laterally. Anterior limb, genu (corticobulbar fibres) and posterior limb (corticospinal fibres for arm and leg, thalamocortical sensory radiation). Supplied by the lenticulostriate branches of the MCA and the anterior choroidal artery.',
      de: 'V-förmiges Marklager zwischen Nucleus caudatus und Thalamus medial und Nucleus lentiformis lateral. Crus anterius, Genu (kortikonukleäre Fasern) und Crus posterius (Pyramidenbahn für Arm und Bein, thalamokortikale sensible Strahlung). Versorgt von den lentikulostriatalen Ästen der A. cerebri media und der A. choroidea anterior.' },
    { tubes: pairTubes([[[[1.5, 21.3, -1.5], [1.9, 21.7, -0.4], [2.1, 21.9, 0.5]], 0.28], [[[1.5, 21.3, -1.5], [1.9, 21.1, -2.6], [2.2, 20.9, -3.7]], 0.28]]), opacity: 0.55 },
    { color: WHITE,
      lesion: { en: 'Capsular (lacunar) stroke: so many fibres are packed together that a small infarct gives a dense contralateral hemiplegia of face (lower half), arm and leg, often with hemisensory loss, but no aphasia or visual field loss.',
        de: 'Kapsulärer (lakunärer) Infarkt: auf engem Raum gebündelte Fasern, daher schon bei kleinem Infarkt eine dichte Hemiparese der Gegenseite an Gesicht (untere Hälfte), Arm und Bein, oft mit Hemihypästhesie, aber ohne Aphasie oder Gesichtsfeldausfall.' } }),

  // ---------------------------------------------------------------- diencephalon
  B('thalamus', 'diencephalon', { en: 'Thalamus', de: 'Thalamus', la: 'Thalamus' },
    { en: 'Paired egg-shaped relay beside the third ventricle, the gateway to the cortex. VPL relays the dorsal column and spinothalamic pathways from the body, VPM the trigeminal pathways from the face, the lateral geniculate body vision, VL and VA the cerebellar and basal ganglia loops.',
      de: 'Paariges eiförmiges Umschaltzentrum neben dem dritten Ventrikel, das Tor zur Rinde. VPL schaltet Hinterstrang- und Vorderseitenstrangbahn vom Körper um, VPM die Trigeminusbahnen vom Gesicht, das Corpus geniculatum laterale die Sehbahn, VL und VA die Kleinhirn- und Basalganglienschleifen.' },
    { ellipsoids: pair([[[0.85, 20.6, -3], [0.65, 0.7, 1.3]]]), opacity: 0.45 }, { color: GREY,
      lesion: { en: 'Thalamic stroke (PCA branches): contralateral hemisensory loss of all qualities, sometimes followed by thalamic pain (Dejerine–Roussy).',
        de: 'Thalamusinfarkt (Äste der A. cerebri posterior): Hemihypästhesie der Gegenseite für alle Qualitäten, gelegentlich mit nachfolgendem Thalamusschmerz (Dejerine-Roussy).' } }),
  B('lateral_geniculate_body', 'diencephalon', { en: 'Lateral geniculate body', de: 'Corpus geniculatum laterale', la: 'Corpus geniculatum laterale' },
    { en: 'Thalamic relay of the visual pathway. Six layers: fibres from the contralateral nasal retina end in layers 1, 4 and 6, from the ipsilateral temporal retina in layers 2, 3 and 5. Projects through the optic radiation to V1.',
      de: 'Thalamische Umschaltstation der Sehbahn. Sechs Schichten: Fasern der gegenseitigen nasalen Netzhaut enden in den Schichten 1, 4 und 6, der gleichseitigen temporalen in 2, 3 und 5. Projiziert über die Sehstrahlung zur Area striata.' },
    { spheres: pair([[[1.55, 19.85, -4], 0.27]]), opacity: 0.7 }, { color: 0xc77aa5, partOf: 'thalamus' }),
  B('hypothalamus', 'diencephalon', { en: 'Hypothalamus', de: 'Hypothalamus', la: 'Hypothalamus' },
    { en: 'Floor and lower walls of the third ventricle, above the optic chiasm and pituitary. Controls the autonomic nervous system, temperature, hunger, thirst, circadian rhythm and the pituitary. The central sympathetic pathway to the eye and face starts here.',
      de: 'Boden und untere Wände des dritten Ventrikels, über Chiasma opticum und Hypophyse. Steuert das vegetative Nervensystem, Temperatur, Hunger, Durst, den zirkadianen Rhythmus und die Hypophyse. Hier beginnt die zentrale Sympathikusbahn zu Auge und Gesicht.' },
    { ellipsoids: pair([[[0.3, 19.75, -1.5], [0.3, 0.4, 0.55]]]), opacity: 0.5 }, { color: GREY }),

  // ---------------------------------------------------------------- brainstem
  B('midbrain', 'brainstem', { en: 'Midbrain', de: 'Mittelhirn', la: 'Mesencephalon' },
    { en: 'Upper brainstem, through the tentorial notch. Ventrally the cerebral peduncles (corticospinal and corticobulbar fibres) and substantia nigra, in the tegmentum the red nucleus, medial lemniscus and the nuclei of CN III and IV, dorsally the tectum (colliculi). The cerebral aqueduct runs through it.',
      de: 'Oberer Hirnstamm im Tentoriumschlitz. Ventral die Hirnschenkel (Pyramidenbahn und kortikonukleäre Fasern) und die Substantia nigra, im Tegmentum Nucleus ruber, Lemniscus medialis und die Kerne von N. III und IV, dorsal das Tectum (Colliculi). Der Aquaeductus mesencephali zieht hindurch.' },
    { ellipsoids: [[[0, 18.85, -3.3], [0.9, 0.75, 0.85]]], opacity: 0.3 }, { color: STEM }),
  B('cerebral_peduncle', 'brainstem', { en: 'Cerebral peduncle (crus cerebri)', de: 'Hirnschenkel (Crus cerebri)', la: 'Crus cerebri' },
    { en: 'Ventral part of the midbrain carrying the corticospinal and corticobulbar fibres down from the internal capsule. The oculomotor nerve leaves through the interpeduncular fossa between the two crura.',
      de: 'Ventraler Teil des Mittelhirns mit den aus der Capsula interna kommenden kortikospinalen und kortikonukleären Fasern. Der N. oculomotorius tritt zwischen beiden Crura aus der Fossa interpeduncularis aus.' },
    { tubes: pairTubes([[[[1.2, 19.6, -2.6], [0.8, 19, -2.7], [0.5, 18.3, -2.8]], 0.3]]), opacity: 0.5 }, { color: WHITE, partOf: 'midbrain',
      lesion: { en: 'Weber syndrome (paramedian branches of the PCA): ipsilateral oculomotor palsy (eye down and out, ptosis, dilated pupil) with contralateral hemiparesis including the lower face.',
        de: 'Weber-Syndrom (paramediane Äste der A. cerebri posterior): Okulomotoriusparese auf der Seite der Läsion (Bulbus nach unten außen, Ptosis, weite Pupille) mit Hemiparese der Gegenseite einschließlich des unteren Gesichts.' } }),
  B('oculomotor_nucleus', 'brainstem', { en: 'Oculomotor nucleus', de: 'Nucleus nervi oculomotorii', la: 'Nucleus nervi oculomotorii' },
    { en: 'Midbrain nucleus at the level of the superior colliculus, in front of the aqueduct, with the Edinger–Westphal nucleus (parasympathetic, pupil and accommodation). Supplies all extra-ocular muscles except the lateral rectus and superior oblique.',
      de: 'Kern im Mittelhirn auf Höhe der Colliculi superiores, vor dem Aquädukt, mit dem Nucleus Edinger-Westphal (parasympathisch, Pupille und Akkommodation). Versorgt alle äußeren Augenmuskeln außer M. rectus lateralis und M. obliquus superior.' },
    { spheres: pair([[[0.2, 19, -3.55], 0.17]]), opacity: 0.8 }, { color: 0xe0b63a, partOf: 'midbrain', nerves: ['n_oculomotor'] }),
  B('trochlear_nucleus', 'brainstem', { en: 'Trochlear nucleus', de: 'Nucleus nervi trochlearis', la: 'Nucleus nervi trochlearis' },
    { en: 'Midbrain nucleus at the level of the inferior colliculus. Its fibres cross dorsally and leave the back of the brainstem, so a nuclear lesion weakens the superior oblique of the opposite eye.',
      de: 'Kern im Mittelhirn auf Höhe der Colliculi inferiores. Seine Fasern kreuzen dorsal und verlassen den Hirnstamm hinten; eine Kernläsion schwächt daher den M. obliquus superior des gegenseitigen Auges.' },
    { spheres: pair([[[0.2, 18.45, -3.65], 0.13]]), opacity: 0.8 }, { color: 0xe0b63a, partOf: 'midbrain', nerves: ['n_trochlear'] }),
  B('pons', 'brainstem', { en: 'Pons', de: 'Brücke', la: 'Pons' },
    { en: 'Middle brainstem. The ventral (basilar) part holds the descending corticospinal and corticobulbar fibres among the pontine nuclei, which project to the cerebellum; the dorsal tegmentum holds the medial lemniscus, the spinothalamic tract and the nuclei of CN V–VIII. Supplied by paramedian and circumferential branches of the basilar artery.',
      de: 'Mittlerer Hirnstamm. Der ventrale (basale) Teil enthält die absteigenden kortikospinalen und kortikonukleären Fasern zwischen den Brückenkernen, die zum Kleinhirn projizieren; das dorsale Tegmentum Lemniscus medialis, Tractus spinothalamicus und die Kerne der Hirnnerven V–VIII. Versorgt von paramedianen und zirkumferenten Ästen der A. basilaris.' },
    { ellipsoids: [[[0, 17.25, -3.4], [1.1, 0.85, 0.95]]], opacity: 0.3 }, { color: STEM,
      lesion: { en: 'A lesion of one half of the pons combines ipsilateral cranial nerve signs (abducens, facial, trigeminal) with contralateral hemiparesis and sensory loss: an alternating (crossed) brainstem syndrome such as Millard–Gubler.',
        de: 'Eine Läsion einer Brückenhälfte kombiniert Hirnnervenausfälle auf der Seite der Läsion (Abducens, Facialis, Trigeminus) mit Hemiparese und Sensibilitätsstörung der Gegenseite: ein alternierendes (gekreuztes) Hirnstammsyndrom wie Millard-Gubler.' } }),
  B('principal_trigeminal_nucleus', 'brainstem', { en: 'Principal sensory nucleus of the trigeminal nerve', de: 'Nucleus principalis nervi trigemini', la: 'Nucleus principalis nervi trigemini' },
    { en: 'Mid-pontine nucleus for touch and pressure from the face. Its second-order fibres cross and ascend with the medial lemniscus to the VPM of the thalamus.',
      de: 'Kern in der mittleren Brücke für Berührung und Druck aus dem Gesicht. Die Fasern des zweiten Neurons kreuzen und steigen mit dem Lemniscus medialis zum VPM des Thalamus auf.' },
    { spheres: pair([[[0.7, 17.4, -3.8], 0.2]]), opacity: 0.8 }, { color: 0xe0b63a, partOf: 'pons', nerves: ['n_trigeminal'] }),
  B('abducens_nucleus', 'brainstem', { en: 'Abducens nucleus', de: 'Nucleus nervi abducentis', la: 'Nucleus nervi abducentis' },
    { en: 'Lower pontine nucleus under the facial colliculus in the floor of the fourth ventricle; the facial nerve fibres loop around it. Supplies the lateral rectus and, via the medial longitudinal fasciculus, drives the opposite medial rectus: the centre for horizontal gaze.',
      de: 'Kern in der unteren Brücke unter dem Colliculus facialis im Boden des vierten Ventrikels; das innere Fazialisknie zieht um ihn herum. Versorgt den M. rectus lateralis und über den Fasciculus longitudinalis medialis den gegenseitigen M. rectus medialis: Zentrum der horizontalen Blickwendung.' },
    { spheres: pair([[[0.25, 16.85, -3.95], 0.15]]), opacity: 0.8 }, { color: 0xe0b63a, partOf: 'pons', nerves: ['n_abducens'] }),
  B('facial_nucleus', 'brainstem', { en: 'Facial motor nucleus', de: 'Nucleus nervi facialis', la: 'Nucleus nervi facialis' },
    { en: 'Lower pontine nucleus for the muscles of facial expression. The part for the upper face receives corticobulbar fibres from both hemispheres, the part for the lower face only from the opposite one: hence the forehead-sparing central facial palsy.',
      de: 'Kern in der unteren Brücke für die mimische Muskulatur. Der Kernteil für das obere Gesicht erhält kortikonukleäre Fasern aus beiden Hemisphären, der für das untere Gesicht nur aus der Gegenseite: daher die Stirnaussparung bei der zentralen Fazialisparese.' },
    { spheres: pair([[[0.65, 16.65, -3.55], 0.17]]), opacity: 0.8 }, { color: 0xe0b63a, partOf: 'pons', nerves: ['n_facial'] }),
  B('vestibular_nuclei', 'brainstem', { en: 'Vestibular nuclei', de: 'Nuclei vestibulares', la: 'Nuclei vestibulares' },
    { en: 'Four nuclei (superior, lateral, medial, inferior) in the floor of the fourth ventricle at the pontomedullary junction. Receive the vestibular nerve and project to the eye muscle nuclei (vestibulo-ocular reflex), the spinal cord and the cerebellum.',
      de: 'Vier Kerne (superior, lateralis, medialis, inferior) im Boden des vierten Ventrikels am pontomedullären Übergang. Erhalten den N. vestibularis und projizieren zu den Augenmuskelkernen (vestibulo-okulärer Reflex), zum Rückenmark und zum Kleinhirn.' },
    { ellipsoids: pair([[[0.75, 16.3, -4.25], [0.3, 0.35, 0.22]]]), opacity: 0.8 }, { color: 0xe0b63a, partOf: 'medulla_oblongata', nerves: ['n_vestibulocochlear'] }),
  B('cochlear_nuclei', 'brainstem', { en: 'Cochlear nuclei', de: 'Nuclei cochleares', la: 'Nuclei cochleares' },
    { en: 'Dorsal and ventral cochlear nuclei on the inferior cerebellar peduncle. From here the auditory pathway ascends in both lateral lemnisci, so a central lesion above the nuclei never causes deafness in one ear.',
      de: 'Nucleus cochlearis dorsalis und ventralis am unteren Kleinhirnstiel. Von hier steigt die Hörbahn in beiden Lemnisci laterales auf; eine zentrale Läsion oberhalb der Kerne macht daher nie einseitig taub.' },
    { spheres: pair([[[1.05, 16.1, -4.1], 0.15]]), opacity: 0.8 }, { color: 0xe0b63a, partOf: 'medulla_oblongata', nerves: ['n_vestibulocochlear'] }),
  B('medulla_oblongata', 'brainstem', { en: 'Medulla oblongata', de: 'Verlängertes Mark', la: 'Medulla oblongata' },
    { en: 'Lowest part of the brainstem, from the pons to the foramen magnum. Ventrally the pyramids (corticospinal tract, crossing at its lower end), beside them the olives; medially the medial lemniscus and hypoglossal nucleus; laterally the spinothalamic tract, spinal trigeminal nucleus, nucleus ambiguus and inferior cerebellar peduncle. Holds the cardiorespiratory centres.',
      de: 'Unterster Hirnstammabschnitt zwischen Brücke und Foramen magnum. Ventral die Pyramiden (Pyramidenbahn, am unteren Ende kreuzend), daneben die Oliven; medial Lemniscus medialis und Hypoglossuskern; lateral Tractus spinothalamicus, Nucleus spinalis nervi trigemini, Nucleus ambiguus und unterer Kleinhirnstiel. Enthält die Kreislauf- und Atemzentren.' },
    { tubes: [[[[0, 16.2, -3.6], [0, 15.3, -4.1], [0, 14.4, -4.7]], 0.7]], opacity: 0.3 }, { color: STEM }),
  B('pyramid', 'brainstem', { en: 'Pyramid', de: 'Pyramide', la: 'Pyramis medullae oblongatae' },
    { en: 'Ridge on the front of the medulla formed by the corticospinal tract. At its lower end about 85 % of the fibres cross (decussation of the pyramids) to form the lateral corticospinal tract.',
      de: 'Wulst an der Vorderseite der Medulla oblongata, gebildet von der Pyramidenbahn. An ihrem unteren Ende kreuzen etwa 85 % der Fasern (Decussatio pyramidum) und bilden den Tractus corticospinalis lateralis.' },
    { tubes: pairTubes([[[[0.3, 16.1, -3.1], [0.3, 15.3, -3.6], [0.2, 14.7, -4.1]], 0.22]]), opacity: 0.55 }, { color: WHITE, partOf: 'medulla_oblongata',
      lesion: { en: 'Medial medullary syndrome (anterior spinal or vertebral branches): contralateral hemiparesis sparing the face, contralateral loss of touch and position sense (medial lemniscus) and ipsilateral tongue palsy (hypoglossal).',
        de: 'Mediales Medulla-oblongata-Syndrom (Äste der A. spinalis anterior oder A. vertebralis): Hemiparese der Gegenseite ohne Gesicht, Verlust von Berührungs- und Lagesinn der Gegenseite (Lemniscus medialis) und Zungenparese auf der Seite der Läsion (Hypoglossus).' } }),
  B('spinal_trigeminal_nucleus', 'brainstem', { en: 'Spinal nucleus of the trigeminal nerve', de: 'Nucleus spinalis nervi trigemini', la: 'Nucleus spinalis nervi trigemini' },
    { en: 'Long nucleus from the pons down into the upper cervical cord, with the spinal trigeminal tract on its outer side: pain and temperature from the face, of the same side. Second-order fibres cross to the opposite trigeminothalamic tract.',
      de: 'Langer Kern von der Brücke bis ins obere Halsmark, außen begleitet vom Tractus spinalis nervi trigemini: Schmerz und Temperatur aus dem gleichseitigen Gesicht. Die Fasern des zweiten Neurons kreuzen in den gegenseitigen Tractus trigeminothalamicus.' },
    { tubes: pairTubes([[[[0.8, 16.6, -4], [0.8, 15.5, -4.5], [0.7, 14.5, -4.9]], 0.12]]), opacity: 0.8 }, { color: 0xe0b63a, partOf: 'medulla_oblongata', nerves: ['n_trigeminal'] }),
  B('nucleus_ambiguus', 'brainstem', { en: 'Nucleus ambiguus', de: 'Nucleus ambiguus', la: 'Nucleus ambiguus' },
    { en: 'Motor nucleus in the lateral medulla for the muscles of the palate, pharynx and larynx (branchial motor fibres of CN IX and X). Lesion: dysphagia, hoarseness, uvula deviating to the healthy side.',
      de: 'Motorischer Kern in der lateralen Medulla oblongata für die Muskulatur von Gaumen, Rachen und Kehlkopf (branchiomotorische Fasern von N. IX und X). Läsion: Dysphagie, Heiserkeit, Abweichen der Uvula zur gesunden Seite.' },
    { tubes: pairTubes([[[[0.5, 15.9, -4], [0.55, 15, -4.45]], 0.09]]), opacity: 0.8 }, { color: 0xe0b63a, partOf: 'medulla_oblongata', nerves: ['n_glossopharyngeal', 'n_vagus'] }),
  B('hypoglossal_nucleus', 'brainstem', { en: 'Hypoglossal nucleus', de: 'Nucleus nervi hypoglossi', la: 'Nucleus nervi hypoglossi' },
    { en: 'Paramedian nucleus in the floor of the fourth ventricle (hypoglossal trigone) for the muscles of the tongue. Receives corticobulbar fibres mainly from the opposite hemisphere.',
      de: 'Paramedianer Kern im Boden des vierten Ventrikels (Trigonum nervi hypoglossi) für die Zungenmuskulatur. Erhält kortikonukleäre Fasern überwiegend aus der Gegenseite.' },
    { tubes: pairTubes([[[[0.15, 15.95, -4.35], [0.15, 15.1, -4.8]], 0.09]]), opacity: 0.8 }, { color: 0xe0b63a, partOf: 'medulla_oblongata', nerves: ['n_hypoglossal'] }),
  B('nucleus_gracilis', 'brainstem', { en: 'Gracile nucleus', de: 'Nucleus gracilis', la: 'Nucleus gracilis' },
    { en: 'Relay of the fasciculus gracilis (leg and lower trunk) in the lower dorsal medulla. Second-order fibres cross as internal arcuate fibres (sensory decussation) and ascend as the medial lemniscus.',
      de: 'Umschaltkern des Fasciculus gracilis (Bein und unterer Rumpf) in der unteren dorsalen Medulla oblongata. Die Fasern des zweiten Neurons kreuzen als Fibrae arcuatae internae (Decussatio lemniscorum) und steigen als Lemniscus medialis auf.' },
    { spheres: pair([[[0.18, 14.95, -5.2], 0.14]]), opacity: 0.8 }, { color: DCML, partOf: 'medulla_oblongata' }),
  B('nucleus_cuneatus', 'brainstem', { en: 'Cuneate nucleus', de: 'Nucleus cuneatus', la: 'Nucleus cuneatus' },
    { en: 'Relay of the fasciculus cuneatus (arm, upper trunk and neck) lateral to the gracile nucleus; its fibres cross with those of the gracile nucleus into the medial lemniscus.',
      de: 'Umschaltkern des Fasciculus cuneatus (Arm, oberer Rumpf und Hals) lateral vom Nucleus gracilis; seine Fasern kreuzen mit denen des Nucleus gracilis in den Lemniscus medialis.' },
    { spheres: pair([[[0.42, 15.05, -5.1], 0.14]]), opacity: 0.8 }, { color: DCML, partOf: 'medulla_oblongata' }),
  B('inferior_cerebellar_peduncle', 'brainstem', { en: 'Inferior cerebellar peduncle', de: 'Unterer Kleinhirnstiel', la: 'Pedunculus cerebellaris inferior' },
    { en: 'Connects the medulla with the cerebellum. Carries the dorsal spinocerebellar tract, olivocerebellar and vestibulocerebellar fibres. Lies in the lateral medulla, the territory of PICA.',
      de: 'Verbindet Medulla oblongata und Kleinhirn. Führt Tractus spinocerebellaris posterior, olivozerebelläre und vestibulozerebelläre Fasern. Liegt in der lateralen Medulla, im Stromgebiet der PICA.' },
    { tubes: pairTubes([[[[0.6, 15.3, -4.7], [0.9, 16.1, -5], [1.3, 16.5, -5.4]], 0.2]]), opacity: 0.55 }, { color: WHITE, partOf: 'medulla_oblongata' }),

  // ---------------------------------------------------------------- cerebellum
  B('cerebellum', 'cerebellum', { en: 'Cerebellum', de: 'Kleinhirn', la: 'Cerebellum' },
    { en: 'In the posterior cranial fossa under the tentorium, attached to the brainstem by three peduncles. Coordinates movement, posture and eye movements by comparing intended with actual movement. Each hemisphere controls the same side of the body (its pathways cross twice). Supplied by PICA, AICA and the superior cerebellar artery.',
      de: 'In der hinteren Schädelgrube unter dem Tentorium, über drei Stiele mit dem Hirnstamm verbunden. Koordiniert Bewegung, Haltung und Augenbewegungen durch den Vergleich von geplanter und tatsächlicher Bewegung. Jede Hemisphäre steuert die gleiche Körperseite (ihre Bahnen kreuzen zweimal). Versorgt von PICA, AICA und A. superior cerebelli.' },
    { ellipsoids: [...pair([[[1.9, 16.6, -6.2], [1.8, 1.25, 1.6]]]), [[0, 16.7, -6], [0.6, 1.15, 1.5]]], opacity: 0.22 }, { color: 0xc49a8e,
      lesion: { en: 'A lesion of one cerebellar hemisphere gives ipsilateral ataxia: intention tremor, dysmetria, dysdiadochokinesia, hypotonia, often nystagmus and scanning speech. Vermis lesions give truncal and gait ataxia.',
        de: 'Eine Läsion einer Kleinhirnhemisphäre verursacht eine Ataxie auf derselben Seite: Intentionstremor, Dysmetrie, Dysdiadochokinese, Hypotonie, oft Nystagmus und skandierende Sprache. Läsionen des Wurms verursachen Rumpf- und Gangataxie.' } }),

  // ---------------------------------------------------------------- spinal cord
  B('spinal_cord_cervical', 'cord', { en: 'Cervical spinal cord (C1–C8)', de: 'Halsmark (C1–C8)', la: 'Pars cervicalis medullae spinalis' },
    { en: 'From the foramen magnum to about the C7 vertebra, with the cervical enlargement (C5–T1) for the arms. In cross-section: grey matter butterfly with dorsal and ventral horns, the dorsal columns behind (fasciculus gracilis medially, cuneatus laterally), the lateral corticospinal and spinothalamic tracts in the lateral and anterolateral columns.',
      de: 'Vom Foramen magnum bis etwa zum 7. Halswirbel, mit der Intumescentia cervicalis (C5–Th1) für die Arme. Im Querschnitt: graue Substanz in Schmetterlingsform mit Hinter- und Vorderhorn, dahinter die Hinterstränge (Fasciculus gracilis medial, cuneatus lateral), Pyramidenseitenstrang und Tractus spinothalamicus im Seiten- und Vorderseitenstrang.' },
    { tubes: [[cord(0, 14.4, 0), 0.5]], opacity: 0.32 }, { color: CORD_C, nerves: ['sn_cervical'],
      lesion: { en: 'Hemisection at C5: below the lesion, ipsilateral spastic paralysis of the arm and leg and ipsilateral loss of touch and position sense; contralateral loss of pain and temperature; ipsilateral Horner syndrome (central sympathetic fibres).',
        de: 'Halbseitenläsion bei C5: unterhalb der Läsion spastische Lähmung von Arm und Bein und Verlust von Berührungs- und Lagesinn auf derselben Seite, Verlust von Schmerz- und Temperaturempfinden auf der Gegenseite, Horner-Syndrom auf derselben Seite (zentrale Sympathikusfasern).' } }),
  B('spinal_cord_thoracic', 'cord', { en: 'Thoracic spinal cord (T1–T12)', de: 'Brustmark (Th1–Th12)', la: 'Pars thoracica medullae spinalis' },
    { en: 'Thin middle part of the cord, from about the T1 to the T9 vertebra. The lateral horn (T1–L2) holds the preganglionic sympathetic neurons, Clarke\'s nucleus (T1–L2) relays the dorsal spinocerebellar tract. Above the lumbar segments it carries the long tracts for the legs only.',
      de: 'Dünner mittlerer Abschnitt, etwa vom 1. bis 9. Brustwirbel. Das Seitenhorn (Th1–L2) enthält die präganglionären sympathischen Neurone, der Nucleus thoracicus (Clarke-Säule, Th1–L2) ist Umschaltstation des Tractus spinocerebellaris posterior. Er führt die langen Bahnen nur noch für die Beine.' },
    { tubes: [[cord(0, 0, -22), 0.4]], opacity: 0.32 }, { color: CORD_C, nerves: ['sn_thoracic'],
      lesion: { en: 'Brown-Séquard syndrome (hemisection, e.g. a stab wound at T10): below the lesion, ipsilateral spastic paralysis of the leg (lateral corticospinal tract) and ipsilateral loss of touch, vibration and position sense (dorsal columns, still uncrossed), with contralateral loss of pain and temperature (spinothalamic tract, crossed at the segment), starting one or two segments lower.',
        de: 'Brown-Séquard-Syndrom (Halbseitenläsion, z. B. Stichverletzung bei Th10): unterhalb der Läsion spastische Beinparese (Pyramidenseitenstrang) und Verlust von Berührung, Vibration und Lagesinn (Hinterstränge, noch ungekreuzt) auf derselben Seite, Verlust von Schmerz und Temperatur (Tractus spinothalamicus, auf Segmenthöhe gekreuzt) auf der Gegenseite, ein bis zwei Segmente tiefer beginnend.' } }),
  B('spinal_cord_lumbosacral', 'cord', { en: 'Lumbosacral spinal cord and conus medullaris', de: 'Lenden- und Sakralmark mit Conus medullaris', la: 'Partes lumbalis et sacralis medullae spinalis, conus medullaris' },
    { en: 'The lumbosacral enlargement (L1–S3) for the legs and the conus medullaris (S3–Co), ending at about the L1/L2 disc in adults. Below it the cauda equina fills the dural sac. The sacral segments hold the centres for bladder, bowel and sexual function.',
      de: 'Intumescentia lumbosacralis (L1–S3) für die Beine und Conus medullaris (S3–Co), beim Erwachsenen etwa in Höhe der Bandscheibe L1/L2 endend. Darunter füllt die Cauda equina den Duralsack. Die Sakralsegmente enthalten die Zentren für Blase, Darm und Sexualfunktion.' },
    { tubes: [[cord(0, -22, -31.5), 0.45]], spheres: [[[0, -31.6, r2(cordZ(-31.5))], 0.3]], opacity: 0.32 }, { color: CORD_C, nerves: ['sn_lumbar', 'sn_sacral'] }),

  // ---------------------------------------------------------------- ventricles and CSF
  B('choroid_plexus', 'csf', { en: 'Choroid plexus', de: 'Plexus choroideus', la: 'Plexus choroideus' },
    { en: 'Tufts of capillaries covered by ependyma in the lateral, third and fourth ventricles. Produces about 500 ml of CSF a day; about 150 ml circulate at any time.',
      de: 'Kapillarbüschel mit Ependymüberzug in den Seitenventrikeln sowie im dritten und vierten Ventrikel. Bildet etwa 500 ml Liquor am Tag; zirkulierend sind etwa 150 ml.' },
    { tubes: pairTubes([[[[0.85, 22.65, -1], [0.95, 22.6, -3], [1.4, 21.9, -4.8]], 0.1]]), opacity: 0.85 }, { color: 0xc4475a, drains: ['lateral_ventricles'] }),
  B('lateral_ventricles', 'csf', { en: 'Lateral ventricles', de: 'Seitenventrikel', la: 'Ventriculi laterales' },
    { en: 'C-shaped cavity in each hemisphere: anterior horn (frontal lobe), body, atrium, posterior horn (occipital lobe) and inferior horn (temporal lobe). Drain through the interventricular foramen of Monro into the third ventricle.',
      de: 'C-förmiger Hohlraum in jeder Hemisphäre: Vorderhorn (Frontallappen), Pars centralis, Atrium, Hinterhorn (Okzipitallappen) und Unterhorn (Temporallappen). Abfluss durch das Foramen interventriculare (Monro) in den dritten Ventrikel.' },
    { tubes: pairTubes([[[[0.7, 22.3, 1], [0.8, 22.9, -0.8], [0.9, 22.9, -3], [1.4, 22.1, -4.8], [1, 21.6, -6.4]], 0.28],
      [[[1.4, 22.1, -4.8], [2.4, 20.8, -5], [3, 19.8, -3.6], [3.2, 19.5, -2.2]], 0.24]]), opacity: 0.5 }, { color: CSF, drains: ['third_ventricle'] }),
  B('third_ventricle', 'csf', { en: 'Third ventricle', de: 'Dritter Ventrikel', la: 'Ventriculus tertius' },
    { en: 'Narrow midline slit between the two thalami, with the hypothalamus in its floor. Drains through the cerebral aqueduct.',
      de: 'Schmaler Spalt in der Mittellinie zwischen beiden Thalami, mit dem Hypothalamus im Boden. Abfluss durch den Aquädukt.' },
    { ellipsoids: [[[0, 20.5, -2.4], [0.13, 0.7, 1.2]]], opacity: 0.6 }, { color: CSF, midline: true, drains: ['cerebral_aqueduct'] }),
  B('cerebral_aqueduct', 'csf', { en: 'Cerebral aqueduct', de: 'Aquädukt', la: 'Aquaeductus mesencephali' },
    { en: 'Narrow canal through the midbrain between the third and fourth ventricles, the narrowest point of CSF flow.',
      de: 'Enger Kanal durch das Mittelhirn zwischen drittem und viertem Ventrikel, die engste Stelle des Liquorflusses.' },
    { tubes: [[[[0, 19.6, -3.5], [0, 19, -3.85], [0, 18.3, -4.1]], 0.09]], opacity: 0.85 }, { color: CSF, midline: true, drains: ['fourth_ventricle'],
      lesion: { en: 'Aqueductal stenosis: non-communicating (obstructive) hydrocephalus with enlarged lateral and third ventricles and a normal fourth ventricle.',
        de: 'Aquäduktstenose: Hydrocephalus occlusus mit erweiterten Seitenventrikeln und drittem Ventrikel bei normal weitem viertem Ventrikel.' } }),
  B('fourth_ventricle', 'csf', { en: 'Fourth ventricle', de: 'Vierter Ventrikel', la: 'Ventriculus quartus' },
    { en: 'Tent-shaped cavity between the pons and medulla in front and the cerebellum behind; its floor is the rhomboid fossa with the cranial nerve nuclei. Opens through the median aperture (Magendie) and two lateral apertures (Luschka) into the subarachnoid space.',
      de: 'Zeltförmiger Raum zwischen Brücke und Medulla vorn und Kleinhirn hinten; sein Boden ist die Rautengrube mit den Hirnnervenkernen. Öffnet sich über die Apertura mediana (Magendie) und zwei Aperturae laterales (Luschka) in den Subarachnoidalraum.' },
    { ellipsoids: [[[0, 16.8, -4.6], [0.8, 0.9, 0.3]]], opacity: 0.6 }, { color: CSF, midline: true, drains: ['cisterna_magna'] }),
  B('cisterna_magna', 'csf', { en: 'Cisterna magna (subarachnoid space)', de: 'Cisterna cerebellomedullaris (Subarachnoidalraum)', la: 'Cisterna cerebellomedullaris posterior' },
    { en: 'Largest subarachnoid cistern, between cerebellum and medulla, receiving CSF from the fourth ventricle. From here CSF spreads over the brain and down around the spinal cord.',
      de: 'Größte Zisterne des Subarachnoidalraums zwischen Kleinhirn und Medulla, nimmt den Liquor aus dem vierten Ventrikel auf. Von hier verteilt er sich über das Gehirn und um das Rückenmark.' },
    { ellipsoids: [[[0, 15.3, -6], [0.9, 0.6, 0.7]]], opacity: 0.4 }, { color: CSF, midline: true, drains: ['arachnoid_granulations'] }),
  B('arachnoid_granulations', 'csf', { en: 'Arachnoid granulations', de: 'Arachnoidalzotten (Pacchioni-Granulationen)', la: 'Granulationes arachnoideae' },
    { en: 'Outpouchings of the arachnoid into the dural venous sinuses, mainly the superior sagittal sinus, where CSF is absorbed into the venous blood.',
      de: 'Ausstülpungen der Arachnoidea in die Sinus durae matris, vor allem den Sinus sagittalis superior, über die der Liquor ins venöse Blut resorbiert wird.' },
    { spheres: pair([[[0.5, 28.1, -0.4], 0.18], [[0.5, 28.2, -2.4], 0.18], [[0.5, 27.8, -4.6], 0.18]]), opacity: 0.7 }, { color: CSF, drains: ['v_dural_sinuses'],
      lesion: { en: 'Impaired absorption (after meningitis or subarachnoid haemorrhage): communicating hydrocephalus with all four ventricles enlarged.',
        de: 'Gestörte Resorption (nach Meningitis oder Subarachnoidalblutung): Hydrocephalus communicans (aresorptivus) mit Erweiterung aller vier Ventrikel.' } })
];

// ------------------------------------------------------------------ tracts
// Decussation of the pyramids at the cervicomedullary junction.
const DECUSS = [0.15, 14.9, -4.4];
const legM1 = precentral(78, -1.1), armM1 = precentral(48, -1.1), faceM1 = precentral(22, -1.1);
const legS1 = postcentral(78, -1.1), armS1 = postcentral(48, -1.1), faceS1 = postcentral(22, -1.1);
const VPL = [1.1, 20.4, -3.2], LGN = [1.6, 19.85, -4.05];

const TRACTS = [
  T('t_corticospinal', 'motor', { en: 'Corticospinal tract (pyramidal tract)', de: 'Pyramidenbahn', la: 'Tractus corticospinalis' },
    { en: 'Upper motor neurons from the precentral gyrus (and premotor and parietal cortex) through the corona radiata, the posterior limb of the internal capsule, the cerebral peduncle, the basilar pons and the medullary pyramid. Uncrossed above the pyramidal decussation: a lesion here weakens the opposite side of the body. Spastic paralysis with brisk reflexes and a Babinski sign.',
      de: 'Erstes Motoneuron aus dem Gyrus praecentralis (und prämotorischem und parietalem Kortex) über Corona radiata, Crus posterius der Capsula interna, Crus cerebri, Brückenfuß und Pyramide. Oberhalb der Pyramidenkreuzung ungekreuzt: eine Läsion hier schwächt die Gegenseite. Spastische Lähmung mit gesteigerten Reflexen und Babinski-Zeichen.' },
    [[legM1, [1.6, 25.4, -1.9], [1.9, 23.2, -2], [1.85, 21.2, -2.3], [1.1, 19.9, -2.5], [0.7, 19, -2.7], [0.5, 17.3, -2.8], [0.3, 15.6, -3.7], DECUSS],
      [armM1, [3.2, 24, -1.4], [1.9, 23.2, -2]]], 0.13, [], ['internal_capsule', 'cerebral_peduncle', 'pons', 'pyramid'], { color: MOTOR }),
  T('t_lateral_cst_cervical', 'motor', { en: 'Lateral corticospinal tract, cervical part', de: 'Tractus corticospinalis lateralis, zervikaler Abschnitt', la: 'Tractus corticospinalis lateralis (pars cervicalis)' },
    { en: 'After crossing in the pyramidal decussation the fibres descend in the lateral column of the opposite half of the cord. In the cervical cord they still carry the fibres for arm and leg: a lesion here paralyses the arm and leg of the same side.',
      de: 'Nach der Kreuzung in der Decussatio pyramidum steigen die Fasern im Seitenstrang der gegenüberliegenden Rückenmarkshälfte ab. Im Halsmark führen sie noch die Fasern für Arm und Bein: eine Läsion hier lähmt Arm und Bein derselben Seite.' },
    [[DECUSS, [-0.15, 14.6, -4.6], [-0.32, 14.2, r2(cordZ(14.2) - 0.1)], ...cord(-0.32, 12.6, 0, -0.1)]], 0.11, ['t_corticospinal'], ['spinal_cord_cervical'], { color: MOTOR, decussation: true }),
  T('t_lateral_cst_lumbar', 'motor', { en: 'Lateral corticospinal tract, thoracolumbar part', de: 'Tractus corticospinalis lateralis, thorakolumbaler Abschnitt', la: 'Tractus corticospinalis lateralis (pars thoracolumbalis)' },
    { en: 'Below the cervical enlargement the lateral corticospinal tract carries only the fibres for the trunk and leg, ending on the motor neurons of the lumbosacral enlargement.',
      de: 'Unterhalb der Intumescentia cervicalis führt der Pyramidenseitenstrang nur noch die Fasern für Rumpf und Bein und endet an den Motoneuronen der Intumescentia lumbosacralis.' },
    [cord(-0.32, 0, -30, -0.1)], 0.1, ['t_lateral_cst_cervical'], ['spinal_cord_thoracic', 'spinal_cord_lumbosacral'], { color: MOTOR }),
  T('t_anterior_cst', 'motor', { en: 'Anterior corticospinal tract', de: 'Tractus corticospinalis anterior (Pyramidenvorderstrang)', la: 'Tractus corticospinalis anterior' },
    { en: 'The roughly 15 % of corticospinal fibres that do not cross in the pyramids. They descend in the anterior column of the same side and cross at segmental level, mainly to the neck and trunk muscles, which are therefore controlled from both hemispheres.',
      de: 'Die etwa 15 % der Pyramidenbahnfasern, die in der Pyramide nicht kreuzen. Sie steigen im Vorderstrang derselben Seite ab und kreuzen erst auf Segmenthöhe, vor allem zur Hals- und Rumpfmuskulatur, die deshalb von beiden Hemisphären versorgt wird.' },
    [[DECUSS, [0.15, 14.4, r2(cordZ(14.4) + 0.35)], ...cord(0.13, 12.6, -16, 0.33)]], 0.07, ['t_corticospinal'], ['spinal_cord_cervical', 'spinal_cord_thoracic'], { color: MOTOR }),
  T('t_corticobulbar', 'motor', { en: 'Corticobulbar (corticonuclear) tract', de: 'Tractus corticonuclearis', la: 'Tractus corticonuclearis' },
    { en: 'Upper motor neurons from the face area of the precentral gyrus through the genu of the internal capsule and the cerebral peduncle to the motor cranial nerve nuclei. Most nuclei receive fibres from both hemispheres; the lower facial nucleus and largely the hypoglossal nucleus only from the opposite side. Bilateral lesions cause pseudobulbar palsy.',
      de: 'Erstes Motoneuron aus der Gesichtsregion des Gyrus praecentralis über das Genu der Capsula interna und das Crus cerebri zu den motorischen Hirnnervenkernen. Die meisten Kerne erhalten Fasern aus beiden Hemisphären, der Kernteil für das untere Gesicht und weitgehend der Hypoglossuskern nur von der Gegenseite. Beidseitige Läsionen verursachen eine Pseudobulbärparalyse.' },
    [[faceM1, [3.6, 22.6, -0.8], [1.6, 21.3, -1.5], [1.1, 20, -2.4], [0.75, 19, -2.6], [0.55, 17.6, -2.9], [0.2, 17, -3.3], [-0.6, 16.7, -3.55]],
      [[0.55, 17.6, -2.9], [0.4, 16.4, -3.4], [0.05, 15.8, -4], [-0.15, 15.5, -4.5]]], 0.09, [], ['internal_capsule', 'cerebral_peduncle', 'pons', 'medulla_oblongata'], { color: MOTOR }),

  T('t_fasciculus_gracilis', 'sensory', { en: 'Fasciculus gracilis', de: 'Fasciculus gracilis (Goll-Strang)', la: 'Fasciculus gracilis' },
    { en: 'Medial part of the dorsal column: fine touch, vibration and position sense from the leg and lower trunk (below T6). First-order axons ascend uncrossed to the gracile nucleus, so a cord lesion causes loss on the same side.',
      de: 'Medialer Teil des Hinterstrangs: feine Berührung, Vibration und Lagesinn von Bein und unterem Rumpf (unterhalb Th6). Die Axone des ersten Neurons steigen ungekreuzt zum Nucleus gracilis auf; eine Rückenmarksläsion verursacht daher Ausfälle auf derselben Seite.' },
    [[...cord(-0.12, -30, 14.2, -0.38), [-0.18, 14.95, -5.2]]], 0.09, [], ['spinal_cord_lumbosacral', 'spinal_cord_thoracic', 'spinal_cord_cervical'], { color: DCML }),
  T('t_fasciculus_cuneatus', 'sensory', { en: 'Fasciculus cuneatus', de: 'Fasciculus cuneatus (Burdach-Strang)', la: 'Fasciculus cuneatus' },
    { en: 'Lateral part of the dorsal column, present from T6 upwards: fine touch, vibration and position sense from the arm, upper trunk and neck, ascending uncrossed to the cuneate nucleus.',
      de: 'Lateraler Teil des Hinterstrangs, ab Th6 aufwärts: feine Berührung, Vibration und Lagesinn von Arm, oberem Rumpf und Hals, ungekreuzt zum Nucleus cuneatus.' },
    [[...cord(-0.3, 0, 14.2, -0.33), [-0.42, 15.05, -5.1]]], 0.09, [], ['spinal_cord_cervical'], { color: DCML }),
  T('t_medial_lemniscus', 'sensory', { en: 'Medial lemniscus', de: 'Lemniscus medialis', la: 'Lemniscus medialis' },
    { en: 'Second-order fibres from the gracile and cuneate nuclei, which cross in the lower medulla (sensory decussation) and ascend through the medial medulla, pons and midbrain to the VPL of the thalamus. A lesion here causes loss of touch and position sense on the opposite side.',
      de: 'Fasern des zweiten Neurons aus Nucleus gracilis und cuneatus, die in der unteren Medulla kreuzen (Decussatio lemniscorum) und durch die mediale Medulla, Brücke und Mittelhirn zum VPL des Thalamus aufsteigen. Eine Läsion hier verursacht Ausfälle von Berührung und Lagesinn auf der Gegenseite.' },
    [[[-0.3, 15, -5.15], [0.15, 15.3, -4.5], [0.22, 16, -4.1], [0.45, 17.3, -3.65], [0.7, 18.9, -3.4], VPL]], 0.1, ['t_fasciculus_gracilis', 't_fasciculus_cuneatus'], ['medulla_oblongata', 'pons', 'midbrain'], { color: DCML, decussation: true }),
  T('t_spinothalamic_lumbar', 'sensory', { en: 'Spinothalamic tract, thoracolumbar part', de: 'Tractus spinothalamicus, thorakolumbaler Abschnitt', la: 'Tractus spinothalamicus (pars thoracolumbalis)' },
    { en: 'Pain and temperature from the leg and trunk. First-order fibres synapse in the dorsal horn; the second-order fibres cross in the anterior white commissure within one or two segments and ascend in the opposite anterolateral column. A cord lesion therefore causes loss on the opposite side, starting a little below the lesion.',
      de: 'Schmerz und Temperatur von Bein und Rumpf. Das erste Neuron endet im Hinterhorn; die Fasern des zweiten Neurons kreuzen innerhalb von ein bis zwei Segmenten in der Commissura alba anterior und steigen im gegenseitigen Vorderseitenstrang auf. Eine Rückenmarksläsion verursacht daher Ausfälle auf der Gegenseite, etwas unterhalb der Läsion beginnend.' },
    [[[-0.35, -30, r2(cordZ(-30) - 0.2)], [0, -29.6, r2(cordZ(-29.6) + 0.1)], ...cord(0.38, -29, 0, 0.12)]], 0.09, [], ['spinal_cord_lumbosacral', 'spinal_cord_thoracic'], { color: STT, decussation: true }),
  T('t_spinothalamic_cervical', 'sensory', { en: 'Spinothalamic tract, cervical part', de: 'Tractus spinothalamicus, zervikaler Abschnitt', la: 'Tractus spinothalamicus (pars cervicalis)' },
    { en: 'In the cervical cord the anterolateral column carries pain and temperature from the whole opposite half of the body below the neck; the fibres from the arm join it at the cervical enlargement.',
      de: 'Im Halsmark führt der Vorderseitenstrang Schmerz und Temperatur der gesamten gegenseitigen Körperhälfte unterhalb des Halses; die Fasern vom Arm schließen sich in der Intumescentia cervicalis an.' },
    [cord(0.38, 0, 14.4, 0.12), [[-0.35, 5, r2(cordZ(5) - 0.2)], [0, 5.4, r2(cordZ(5.4) + 0.1)], [0.38, 6, r2(cordZ(6) + 0.12)]]], 0.09, ['t_spinothalamic_lumbar'], ['spinal_cord_cervical'], { color: STT }),
  T('t_spinothalamic', 'sensory', { en: 'Spinothalamic tract (spinal lemniscus) in the brainstem', de: 'Tractus spinothalamicus (Lemniscus spinalis) im Hirnstamm', la: 'Lemniscus spinalis (tractus spinothalamicus)' },
    { en: 'The already crossed pain and temperature pathway from the body runs through the lateral medulla (PICA territory), the pons and midbrain to the VPL of the thalamus.',
      de: 'Die bereits gekreuzte Schmerz- und Temperaturbahn vom Körper zieht durch die laterale Medulla (Stromgebiet der PICA), Brücke und Mittelhirn zum VPL des Thalamus.' },
    [[[0.38, 14.4, r2(cordZ(14.4) + 0.12)], [0.62, 15.6, -4.3], [0.75, 17.3, -3.7], [0.85, 18.9, -3.6], [1.15, 20.2, -3.3]]], 0.09, ['t_spinothalamic_cervical'], ['medulla_oblongata', 'pons', 'midbrain'], { color: STT }),
  T('t_trigeminothalamic', 'sensory', { en: 'Trigeminothalamic tract (trigeminal lemniscus)', de: 'Tractus trigeminothalamicus (Lemniscus trigeminalis)', la: 'Tractus trigeminothalamicus' },
    { en: 'Second-order fibres from the principal and spinal trigeminal nuclei that cross the midline and ascend to the VPM of the thalamus: touch, pain and temperature from the opposite half of the face.',
      de: 'Fasern des zweiten Neurons aus dem Nucleus principalis und spinalis nervi trigemini, die die Mittellinie kreuzen und zum VPM des Thalamus aufsteigen: Berührung, Schmerz und Temperatur der gegenseitigen Gesichtshälfte.' },
    [[[-0.7, 17.4, -3.8], [0.3, 17.6, -3.75], [0.6, 18.9, -3.5], [1, 20.3, -3.1]], [[-0.8, 15.5, -4.5], [0.1, 15.9, -4.3], [0.35, 17, -3.8]]], 0.08, [], ['pons', 'midbrain'], { color: STT, decussation: true }),
  T('t_thalamocortical', 'sensory', { en: 'Thalamocortical (somatosensory) radiation', de: 'Thalamokortikale (somatosensible) Bahn', la: 'Radiatio thalami centralis' },
    { en: 'Third-order neurons from the VPL and VPM of the thalamus through the posterior limb of the internal capsule and the corona radiata to the postcentral gyrus of the same hemisphere, serving the opposite half of the body and face.',
      de: 'Drittes Neuron aus VPL und VPM des Thalamus über das Crus posterius der Capsula interna und die Corona radiata zum Gyrus postcentralis derselben Hemisphäre, zuständig für die gegenseitige Körper- und Gesichtshälfte.' },
    [[VPL, [1.9, 21.2, -2.9], [2.3, 23.2, -2.8], legS1], [[2.3, 23.2, -2.8], armS1], [[1.9, 21.2, -2.9], [3.6, 22, -1.9], faceS1]], 0.09,
    ['t_medial_lemniscus', 't_spinothalamic', 't_trigeminothalamic'], ['internal_capsule'], { color: DCML }),

  T('t_optic_chiasm', 'visual', { en: 'Optic chiasm', de: 'Chiasma opticum', la: 'Chiasma opticum' },
    { en: 'Where the two optic nerves meet above the pituitary. Fibres from the nasal half of each retina (temporal visual field) cross; fibres from the temporal half stay on the same side.',
      de: 'Treffpunkt beider Sehnerven über der Hypophyse. Die Fasern der nasalen Netzhauthälften (temporale Gesichtsfelder) kreuzen; die der temporalen Hälften bleiben auf derselben Seite.' },
    both([[0.6, 19.4, -0.2], [0, 19.4, -0.5], [-0.6, 19.4, -0.8]]), 0.14, ['n_optic'], [], { color: VISUAL, midline: true, decussation: true,
      lesion: { en: 'Bitemporal hemianopia, classically from a pituitary adenoma pressing from below (upper fields first).',
        de: 'Bitemporale Hemianopsie, klassisch durch ein Hypophysenadenom, das von unten drückt (zuerst die oberen Quadranten).' } }),
  T('t_optic_tract', 'visual', { en: 'Optic tract', de: 'Tractus opticus', la: 'Tractus opticus' },
    { en: 'From the chiasm around the cerebral peduncle to the lateral geniculate body. Carries the temporal fibres of the same eye and the nasal fibres of the other eye, i.e. the whole opposite visual field.',
      de: 'Vom Chiasma um das Crus cerebri zum Corpus geniculatum laterale. Führt die temporalen Fasern des gleichseitigen und die nasalen Fasern des anderen Auges, also das gesamte gegenseitige Gesichtsfeld.' },
    [[[0.55, 19.4, -0.8], [1, 19.15, -1.8], [1.5, 19.3, -3], LGN]], 0.12, ['t_optic_chiasm'], [], { color: VISUAL,
      lesion: { en: 'Contralateral homonymous hemianopia (often incongruous).', de: 'Homonyme Hemianopsie zur Gegenseite (oft inkongruent).' } }),
  T('t_optic_radiation_meyer', 'visual', { en: 'Optic radiation, lower fibres (Meyer\'s loop)', de: 'Sehstrahlung, untere Fasern (Meyer-Schleife)', la: 'Radiatio optica (ansa Meyeri)' },
    { en: 'Fibres from the lower retina (upper visual field) loop forward around the inferior horn of the lateral ventricle through the temporal lobe before running back to the lower bank of the calcarine sulcus.',
      de: 'Fasern der unteren Netzhauthälfte (oberes Gesichtsfeld) ziehen in einer Schleife nach vorn um das Unterhorn des Seitenventrikels durch den Temporallappen und dann zur unteren Lippe des Sulcus calcarinus.' },
    [[LGN, [2.6, 19.4, -3], [3.2, 19.5, -1.6], [3.5, 20.1, -3.8], [2.6, 21, -6.6], [0.9, 21.6, -8]]], 0.09, ['t_optic_tract'], ['temporal_lobe'], { color: VISUAL,
      lesion: { en: 'Temporal lobe lesion: contralateral homonymous upper quadrantanopia ("pie in the sky").', de: 'Temporallappenläsion: homonyme obere Quadrantenanopsie zur Gegenseite.' } }),
  T('t_optic_radiation_parietal', 'visual', { en: 'Optic radiation, upper fibres', de: 'Sehstrahlung, obere Fasern', la: 'Radiatio optica (pars parietalis)' },
    { en: 'Fibres from the upper retina (lower visual field) run straight back through the deep parietal lobe to the upper bank of the calcarine sulcus.',
      de: 'Fasern der oberen Netzhauthälfte (unteres Gesichtsfeld) ziehen direkt nach hinten durch das tiefe Parietalmark zur oberen Lippe des Sulcus calcarinus.' },
    [[LGN, [2.4, 20.8, -4.6], [2.4, 22.1, -6.4], [0.9, 22.5, -8]]], 0.09, ['t_optic_tract'], ['parietal_lobe'], { color: VISUAL,
      lesion: { en: 'Parietal lobe lesion: contralateral homonymous lower quadrantanopia ("pie on the floor").', de: 'Parietallappenläsion: homonyme untere Quadrantenanopsie zur Gegenseite.' } }),

  T('t_dorsal_spinocerebellar', 'cerebellar', { en: 'Posterior (dorsal) spinocerebellar tract', de: 'Tractus spinocerebellaris posterior (Flechsig)', la: 'Tractus spinocerebellaris posterior' },
    { en: 'Unconscious proprioception from the leg and lower trunk. Relays in Clarke\'s nucleus (T1–L2), ascends uncrossed at the back of the lateral column and enters the cerebellum through the inferior cerebellar peduncle, serving the same side.',
      de: 'Unbewusste Tiefensensibilität von Bein und unterem Rumpf. Umschaltung in der Clarke-Säule (Th1–L2), ungekreuzter Aufstieg am hinteren Rand des Seitenstrangs und Eintritt ins Kleinhirn über den unteren Kleinhirnstiel, für dieselbe Seite.' },
    [[...cord(0.44, -22, 14.4, -0.15), [0.6, 15.3, -4.7], [0.9, 16.1, -5], [1.8, 16.6, -6]]], 0.07, [], ['spinal_cord_lumbosacral', 'spinal_cord_thoracic', 'spinal_cord_cervical', 'inferior_cerebellar_peduncle'], { color: CEREB }),
  T('t_ventral_spinocerebellar', 'cerebellar', { en: 'Anterior (ventral) spinocerebellar tract', de: 'Tractus spinocerebellaris anterior (Gowers)', la: 'Tractus spinocerebellaris anterior' },
    { en: 'Proprioception and spinal interneuron activity from the leg. Crosses in the cord, ascends at the front of the lateral column and crosses back in the superior cerebellar peduncle, so it too serves the same side.',
      de: 'Tiefensensibilität und Aktivität spinaler Interneurone vom Bein. Kreuzt im Rückenmark, steigt am vorderen Rand des Seitenstrangs auf und kreuzt im oberen Kleinhirnstiel zurück, versorgt also ebenfalls dieselbe Seite.' },
    [[[-0.3, -26, r2(cordZ(-26))], [0.1, -25.5, r2(cordZ(-25.5) + 0.2)], ...cord(0.45, -25, 14.4, 0.05), [0.75, 16, -3.9], [0.8, 17.6, -4], [0.9, 18, -4.8], [1.6, 17.2, -5.6]]], 0.06, [],
    ['spinal_cord_lumbosacral', 'spinal_cord_thoracic', 'spinal_cord_cervical', 'medulla_oblongata', 'pons'], { color: CEREB }),
  T('t_central_sympathetic', 'autonomic', { en: 'Central sympathetic pathway (hypothalamospinal tract)', de: 'Zentrale Sympathikusbahn (Tractus hypothalamospinalis)', la: 'Tractus hypothalamospinalis' },
    { en: 'First neuron of the sympathetic supply to the eye and face: from the hypothalamus uncrossed through the lateral brainstem (lateral medulla) and cervical cord to the ciliospinal centre (C8–T2). A lesion anywhere along it gives an ipsilateral central Horner syndrome.',
      de: 'Erstes Neuron der sympathischen Versorgung von Auge und Gesicht: vom Hypothalamus ungekreuzt durch den lateralen Hirnstamm (laterale Medulla) und das Halsmark zum Centrum ciliospinale (C8–Th2). Eine Läsion an beliebiger Stelle verursacht ein zentrales Horner-Syndrom auf derselben Seite.' },
    [[[0.35, 19.8, -1.6], [0.6, 18.9, -3.3], [0.75, 17.2, -3.85], [0.6, 15.6, -4.45], [0.32, 14.4, r2(cordZ(14.4) - 0.05)], ...cord(0.32, 12.6, -1.5, -0.05)]], 0.06, [],
    ['midbrain', 'pons', 'medulla_oblongata', 'spinal_cord_cervical'], { color: SYMP })
];

// ------------------------------------------------------------------ functions
// Cortical representation in the right hemisphere (serving the left half of the body).
const fM = lat => precentral(lat, -0.65), fS = lat => postcentral(lat, -0.65);
const CST_LEG = [['t_corticospinal', 'contra'], ['t_lateral_cst_cervical', 'ipsi'], ['t_lateral_cst_lumbar', 'ipsi']];
const THAL = [['t_thalamocortical', 'contra'], ['thalamus', 'contra']];

const FUNCTIONS = [
  F('f_motor_leg', 'motor', { en: 'Voluntary movement of the leg', de: 'Willkürmotorik des Beins', la: 'Motus voluntarius membri inferioris' },
    { en: 'Leg area of the motor cortex on the medial surface (ACA territory), corticospinal tract crossing in the pyramids, lateral corticospinal tract down to the lumbosacral cord.',
      de: 'Beinregion des Motorkortex an der Medianfläche (Stromgebiet der A. cerebri anterior), Pyramidenbahn mit Kreuzung in der Pyramide, Pyramidenseitenstrang bis ins Lumbosakralmark.' },
    fM(76), 'precentral_gyrus', 'contra', CST_LEG),
  F('f_motor_arm', 'motor', { en: 'Voluntary movement of the arm and hand', de: 'Willkürmotorik von Arm und Hand', la: 'Motus voluntarius membri superioris' },
    { en: 'Arm and hand area on the lateral convexity of the motor cortex (MCA territory), corticospinal tract, lateral corticospinal tract to the cervical enlargement.',
      de: 'Arm- und Handregion an der lateralen Konvexität des Motorkortex (Stromgebiet der A. cerebri media), Pyramidenbahn, Pyramidenseitenstrang bis zur Intumescentia cervicalis.' },
    fM(48), 'precentral_gyrus', 'contra', [['t_corticospinal', 'contra'], ['t_lateral_cst_cervical', 'ipsi']]),
  F('f_motor_lower_face', 'motor', { en: 'Movement of the lower face (mouth)', de: 'Mimik der unteren Gesichtshälfte (Mund)', la: 'Motus musculorum faciei inferioris' },
    { en: 'Face area of the motor cortex, corticobulbar fibres to the opposite facial nucleus only, facial nerve. A central (upper motor neuron) lesion therefore drops the opposite corner of the mouth but spares the forehead.',
      de: 'Gesichtsregion des Motorkortex, kortikonukleäre Fasern nur zum gegenseitigen Fazialiskern, N. facialis. Eine zentrale Läsion lässt daher den gegenseitigen Mundwinkel hängen, spart aber die Stirn aus.' },
    fM(22), 'precentral_gyrus', 'contra', [['t_corticobulbar', 'contra'], ['n_corticonuclear_facial', 'contra'], ['facial_nucleus', 'ipsi'], ['n_facial', 'ipsi']]),
  F('f_motor_upper_face', 'motor', { en: 'Movement of the upper face (forehead, eye closure)', de: 'Mimik der oberen Gesichtshälfte (Stirn, Lidschluss)', la: 'Motus musculorum faciei superioris' },
    { en: 'The forehead part of the facial nucleus receives corticobulbar fibres from both hemispheres, so a one-sided central lesion leaves forehead wrinkling intact. A lesion of the nucleus or the facial nerve (peripheral palsy) paralyses the whole half of the face.',
      de: 'Der Stirnanteil des Fazialiskerns erhält kortikonukleäre Fasern aus beiden Hemisphären; eine einseitige zentrale Läsion lässt das Stirnrunzeln daher intakt. Eine Läsion des Kerns oder des Nervs (periphere Parese) lähmt die ganze Gesichtshälfte.' },
    fM(29), 'precentral_gyrus', 'contra', [['t_corticobulbar', 'contra', 'partial'], ['facial_nucleus', 'ipsi'], ['n_facial', 'ipsi']], { selfPartial: true }),
  F('f_motor_tongue', 'motor', { en: 'Movement of the tongue', de: 'Zungenmotorik', la: 'Motus linguae' },
    { en: 'Corticobulbar fibres, mainly from the opposite hemisphere, to the hypoglossal nucleus. A central lesion deviates the tongue away from the lesion; a nuclear or nerve lesion deviates it towards the lesion, with atrophy.',
      de: 'Kortikonukleäre Fasern, überwiegend aus der Gegenseite, zum Hypoglossuskern. Bei zentraler Läsion weicht die Zunge zur Gegenseite der Läsion ab, bei Kern- oder Nervenläsion zur Seite der Läsion, mit Atrophie.' },
    fM(14), 'precentral_gyrus', 'contra', [['t_corticobulbar', 'contra'], ['hypoglossal_nucleus', 'ipsi'], ['n_hypoglossal', 'ipsi']]),
  F('f_swallowing', 'motor', { en: 'Swallowing and phonation (palate, pharynx, larynx)', de: 'Schlucken und Stimmbildung (Gaumen, Rachen, Kehlkopf)', la: 'Deglutitio et phonatio' },
    { en: 'Nucleus ambiguus with CN IX and X. It receives corticobulbar fibres from both hemispheres, so one-sided central lesions cause at most mild, transient dysphagia; a lesion of the nucleus (lateral medulla) or the vagus causes dysphagia and hoarseness.',
      de: 'Nucleus ambiguus mit N. IX und X. Er erhält kortikonukleäre Fasern aus beiden Hemisphären; einseitige zentrale Läsionen verursachen daher höchstens eine leichte, vorübergehende Dysphagie, eine Kernläsion (laterale Medulla) oder Vagusläsion Dysphagie und Heiserkeit.' },
    fM(6), 'precentral_gyrus', 'contra', [['t_corticobulbar', 'contra', 'partial'], ['nucleus_ambiguus', 'ipsi'], ['n_vagus', 'ipsi'], ['n_glossopharyngeal', 'ipsi', 'partial']], { selfPartial: true }),

  F('f_touch_leg', 'sensory', { en: 'Touch, vibration and position sense of the leg', de: 'Berührung, Vibration und Lagesinn des Beins', la: 'Sensibilitas epicritica membri inferioris' },
    { en: 'Dorsal column–medial lemniscus pathway: fasciculus gracilis (uncrossed), gracile nucleus, sensory decussation in the medulla, medial lemniscus, VPL, postcentral gyrus.',
      de: 'Hinterstrang-Lemniscus-medialis-Bahn: Fasciculus gracilis (ungekreuzt), Nucleus gracilis, Kreuzung in der Medulla, Lemniscus medialis, VPL, Gyrus postcentralis.' },
    fS(78), 'postcentral_gyrus', 'contra', [...THAL, ['t_medial_lemniscus', 'contra'], ['nucleus_gracilis', 'ipsi'], ['t_fasciculus_gracilis', 'ipsi']], { size: 0.22 }),
  F('f_touch_arm', 'sensory', { en: 'Touch, vibration and position sense of the arm', de: 'Berührung, Vibration und Lagesinn des Arms', la: 'Sensibilitas epicritica membri superioris' },
    { en: 'Fasciculus cuneatus (uncrossed), cuneate nucleus, sensory decussation, medial lemniscus, VPL, postcentral gyrus.',
      de: 'Fasciculus cuneatus (ungekreuzt), Nucleus cuneatus, Decussatio lemniscorum, Lemniscus medialis, VPL, Gyrus postcentralis.' },
    fS(52), 'postcentral_gyrus', 'contra', [...THAL, ['t_medial_lemniscus', 'contra'], ['nucleus_cuneatus', 'ipsi'], ['t_fasciculus_cuneatus', 'ipsi']], { size: 0.22 }),
  F('f_pain_leg', 'sensory', { en: 'Pain and temperature of the leg', de: 'Schmerz- und Temperaturempfinden des Beins', la: 'Sensibilitas protopathica membri inferioris' },
    { en: 'Spinothalamic (anterolateral) pathway: dorsal horn, crossing within one or two segments, anterolateral column of the opposite side, lateral brainstem, VPL, postcentral gyrus.',
      de: 'Vorderseitenstrangbahn: Hinterhorn, Kreuzung innerhalb von ein bis zwei Segmenten, Vorderseitenstrang der Gegenseite, lateraler Hirnstamm, VPL, Gyrus postcentralis.' },
    fS(71), 'postcentral_gyrus', 'contra', [...THAL, ['t_spinothalamic', 'contra'], ['t_spinothalamic_cervical', 'contra'], ['t_spinothalamic_lumbar', 'contra']], { size: 0.22 }),
  F('f_pain_arm', 'sensory', { en: 'Pain and temperature of the arm', de: 'Schmerz- und Temperaturempfinden des Arms', la: 'Sensibilitas protopathica membri superioris' },
    { en: 'Spinothalamic pathway from the cervical enlargement: crossing at the segment, anterolateral column, lateral brainstem, VPL, postcentral gyrus.',
      de: 'Vorderseitenstrangbahn aus der Intumescentia cervicalis: Kreuzung auf Segmenthöhe, Vorderseitenstrang, lateraler Hirnstamm, VPL, Gyrus postcentralis.' },
    fS(45), 'postcentral_gyrus', 'contra', [...THAL, ['t_spinothalamic', 'contra'], ['t_spinothalamic_cervical', 'contra']], { size: 0.22 }),
  F('f_face_touch', 'sensory', { en: 'Touch of the face', de: 'Berührungsempfinden des Gesichts', la: 'Sensibilitas epicritica faciei' },
    { en: 'Trigeminal nerve, principal sensory nucleus in the pons, crossing trigeminothalamic fibres, VPM, face area of the postcentral gyrus.',
      de: 'N. trigeminus, Nucleus principalis in der Brücke, kreuzende trigeminothalamische Fasern, VPM, Gesichtsregion des Gyrus postcentralis.' },
    fS(26), 'postcentral_gyrus', 'contra', [...THAL, ['t_trigeminothalamic', 'contra'], ['principal_trigeminal_nucleus', 'ipsi'], ['n_trigeminal', 'ipsi']], { size: 0.22 }),
  F('f_face_pain', 'sensory', { en: 'Pain and temperature of the face', de: 'Schmerz- und Temperaturempfinden des Gesichts', la: 'Sensibilitas protopathica faciei' },
    { en: 'Trigeminal nerve, spinal trigeminal tract and nucleus in the lateral medulla (same side), crossing trigeminothalamic fibres, VPM, postcentral gyrus. Hence the crossed sensory loss of Wallenberg syndrome: face on the side of the lesion, body on the other.',
      de: 'N. trigeminus, Tractus und Nucleus spinalis nervi trigemini in der lateralen Medulla (gleiche Seite), kreuzende trigeminothalamische Fasern, VPM, Gyrus postcentralis. Daher die gekreuzte Sensibilitätsstörung beim Wallenberg-Syndrom: Gesicht auf der Seite der Läsion, Körper auf der Gegenseite.' },
    fS(19), 'postcentral_gyrus', 'contra', [...THAL, ['t_trigeminothalamic', 'contra'], ['spinal_trigeminal_nucleus', 'ipsi'], ['n_trigeminal', 'ipsi']], { size: 0.22 }),

  F('f_vision_temporal_upper', 'vision', { en: 'Upper temporal visual field', de: 'Oberes temporales Gesichtsfeld', la: 'Campus visualis temporalis superior' },
    { en: 'Seen by the lower nasal retina. Its fibres cross in the chiasm, run in the opposite optic tract and through Meyer\'s loop to the lower bank of the calcarine sulcus.',
      de: 'Wird von der unteren nasalen Netzhaut gesehen. Ihre Fasern kreuzen im Chiasma, ziehen im gegenseitigen Tractus opticus und durch die Meyer-Schleife zur unteren Lippe des Sulcus calcarinus.' },
    [0.45, 21.55, -8.25], 'primary_visual_cortex', 'contra',
    [['n_optic', 'ipsi'], ['t_optic_chiasm', 'both'], ['t_optic_tract', 'contra'], ['lateral_geniculate_body', 'contra'], ['t_optic_radiation_meyer', 'contra']], { sideOf: 'eye', size: 0.2 }),
  F('f_vision_temporal_lower', 'vision', { en: 'Lower temporal visual field', de: 'Unteres temporales Gesichtsfeld', la: 'Campus visualis temporalis inferior' },
    { en: 'Seen by the upper nasal retina. Crosses in the chiasm, opposite optic tract, upper optic radiation through the parietal lobe, upper bank of the calcarine sulcus.',
      de: 'Wird von der oberen nasalen Netzhaut gesehen. Kreuzt im Chiasma, gegenseitiger Tractus opticus, obere Sehstrahlung durch den Parietallappen, obere Lippe des Sulcus calcarinus.' },
    [0.45, 22.55, -8.25], 'primary_visual_cortex', 'contra',
    [['n_optic', 'ipsi'], ['t_optic_chiasm', 'both'], ['t_optic_tract', 'contra'], ['lateral_geniculate_body', 'contra'], ['t_optic_radiation_parietal', 'contra']], { sideOf: 'eye', size: 0.2 }),
  F('f_vision_nasal_upper', 'vision', { en: 'Upper nasal visual field', de: 'Oberes nasales Gesichtsfeld', la: 'Campus visualis nasalis superior' },
    { en: 'Seen by the lower temporal retina. Its fibres stay uncrossed in the chiasm and run in the optic tract and Meyer\'s loop of the same side.',
      de: 'Wird von der unteren temporalen Netzhaut gesehen. Ihre Fasern bleiben im Chiasma ungekreuzt und ziehen im gleichseitigen Tractus opticus und der Meyer-Schleife.' },
    [1.05, 21.45, -7.85], 'primary_visual_cortex', 'ipsi',
    [['n_optic', 'ipsi'], ['t_optic_tract', 'ipsi'], ['lateral_geniculate_body', 'ipsi'], ['t_optic_radiation_meyer', 'ipsi']], { sideOf: 'eye', size: 0.2 }),
  F('f_vision_nasal_lower', 'vision', { en: 'Lower nasal visual field', de: 'Unteres nasales Gesichtsfeld', la: 'Campus visualis nasalis inferior' },
    { en: 'Seen by the upper temporal retina: uncrossed, optic tract and parietal optic radiation of the same side.',
      de: 'Wird von der oberen temporalen Netzhaut gesehen: ungekreuzt, gleichseitiger Tractus opticus und parietale Sehstrahlung.' },
    [1.05, 22.65, -7.85], 'primary_visual_cortex', 'ipsi',
    [['n_optic', 'ipsi'], ['t_optic_tract', 'ipsi'], ['lateral_geniculate_body', 'ipsi'], ['t_optic_radiation_parietal', 'ipsi']], { sideOf: 'eye', size: 0.2 }),

  F('f_language_expressive', 'language', { en: 'Speech production (expressive language)', de: 'Sprachproduktion (expressive Sprache)', la: 'Productio sermonis' },
    { en: 'Broca\'s area of the dominant hemisphere (left in about 95 % of right-handers and most left-handers).',
      de: 'Broca-Areal der dominanten Hemisphäre (links bei etwa 95 % der Rechtshänder und den meisten Linkshändern).' },
    [-5.05, 21.8, 1.7], 'broca_area', 'dominant', []),
  F('f_language_receptive', 'language', { en: 'Language comprehension', de: 'Sprachverständnis', la: 'Comprehensio sermonis' },
    { en: 'Wernicke\'s area of the dominant hemisphere.', de: 'Wernicke-Areal der dominanten Hemisphäre.' },
    [-5.3, 21.1, -3.4], 'wernicke_area', 'dominant', []),

  F('f_hearing', 'other', { en: 'Hearing', de: 'Hören', la: 'Auditus' },
    { en: 'Cochlear nerve and nuclei, then bilateral ascent (superior olive, lateral lemniscus, inferior colliculus, medial geniculate body) to Heschl\'s gyri. Only a lesion of the ear, nerve or cochlear nuclei causes deafness in one ear; central lesions barely affect hearing.',
      de: 'N. cochlearis und Nuclei cochleares, dann beidseitiger Aufstieg (obere Olive, Lemniscus lateralis, Colliculus inferior, Corpus geniculatum mediale) zu den Heschl-Querwindungen. Nur eine Läsion von Ohr, Nerv oder Cochleariskernen macht einseitig taub; zentrale Läsionen beeinträchtigen das Hören kaum.' },
    [4.4, 21, -2.2], 'temporal_lobe', 'contra', [['cochlear_nuclei', 'ipsi'], ['n_vestibulocochlear', 'ipsi']], { selfPartial: true }),
  F('f_balance', 'other', { en: 'Balance and gaze stabilisation (vestibular)', de: 'Gleichgewicht und Blickstabilisierung (vestibulär)', la: 'Aequilibrium' },
    { en: 'Vestibular nerve and nuclei. A one-sided lesion causes vertigo, nausea, nystagmus (fast phase away from the lesion) and falling towards the side of the lesion.',
      de: 'N. vestibularis und Vestibulariskerne. Eine einseitige Läsion verursacht Drehschwindel, Übelkeit, Nystagmus (schnelle Phase von der Läsion weg) und Fallneigung zur Seite der Läsion.' },
    [0.95, 16.35, -4.45], 'vestibular_nuclei', 'ipsi', [['n_vestibulocochlear', 'ipsi']], { size: 0.16 }),
  F('f_coordination', 'other', { en: 'Coordination of limb movement', de: 'Koordination der Extremitätenbewegung', la: 'Coordinatio motuum' },
    { en: 'Cerebellar hemisphere of the same side, fed by the spinocerebellar tracts through the inferior and superior cerebellar peduncles. Losing one input tract alone causes only mild ataxia, because others take over.',
      de: 'Kleinhirnhemisphäre derselben Seite, gespeist von den spinozerebellären Bahnen über den unteren und oberen Kleinhirnstiel. Der Ausfall einer einzelnen Zuflussbahn verursacht nur eine leichte Ataxie, weil andere einspringen.' },
    [2.5, 16.6, -6.7], 'cerebellum', 'ipsi',
    [['inferior_cerebellar_peduncle', 'ipsi', 'partial'], ['t_dorsal_spinocerebellar', 'ipsi', 'partial'], ['t_ventral_spinocerebellar', 'ipsi', 'partial']]),
  F('f_sympathetic_head', 'other', { en: 'Sympathetic supply of the eye and face (pupil, lid, sweating)', de: 'Sympathische Versorgung von Auge und Gesicht (Pupille, Lid, Schwitzen)', la: 'Innervatio sympathica oculi et faciei' },
    { en: 'Three neurons: hypothalamus → ciliospinal centre (C8–T2) → superior cervical ganglion → along the carotid to the dilator pupillae, superior tarsal muscle and sweat glands. Loss gives Horner syndrome: miosis, ptosis and (with lesions before the carotid bifurcation) anhidrosis on the same side.',
      de: 'Drei Neurone: Hypothalamus → Centrum ciliospinale (C8–Th2) → Ganglion cervicale superius → entlang der Karotis zu M. dilatator pupillae, M. tarsalis superior und Schweißdrüsen. Ausfall: Horner-Syndrom mit Miosis, Ptosis und (bei Läsionen vor der Karotisgabel) Anhidrose auf derselben Seite.' },
    [0.5, 19.95, -1.15], 'hypothalamus', 'ipsi', [['t_central_sympathetic', 'ipsi'], ['n_cervical_sympathetic', 'ipsi']], { size: 0.18 }),
  F('f_eye_oculomotor', 'other', { en: 'Elevation, depression and adduction of the eye; pupil constriction', de: 'Hebung, Senkung und Adduktion des Auges; Pupillenverengung', la: 'Motus oculi (n. oculomotorius)' },
    { en: 'Oculomotor nucleus and nerve, whose fascicles pass through the cerebral peduncle. Loss: eye down and out, ptosis, dilated pupil on the same side.',
      de: 'Okulomotoriuskern und -nerv, dessen Faszikel durch das Crus cerebri ziehen. Ausfall: Bulbus nach unten außen, Ptosis, weite Pupille auf derselben Seite.' },
    [0.3, 19.15, -3.75], 'oculomotor_nucleus', 'ipsi', [['cerebral_peduncle', 'ipsi'], ['n_oculomotor', 'ipsi']], { size: 0.14 }),
  F('f_eye_trochlear', 'other', { en: 'Depression of the adducted eye (superior oblique)', de: 'Senkung des adduzierten Auges (M. obliquus superior)', la: 'Motus oculi (n. trochlearis)' },
    { en: 'The trochlear nerve crosses before it leaves the back of the midbrain, so a nuclear lesion affects the opposite eye and a nerve lesion the same eye. Vertical double vision, worse on looking down (stairs), head tilted away.',
      de: 'Der N. trochlearis kreuzt, bevor er das Mittelhirn dorsal verlässt: eine Kernläsion betrifft daher das gegenseitige, eine Nervenläsion das gleichseitige Auge. Vertikale Doppelbilder, verstärkt beim Blick nach unten (Treppe), Kopfneigung zur Gegenseite.' },
    [0.3, 18.45, -3.85], 'trochlear_nucleus', 'contra', [['n_trochlear', 'ipsi']], { size: 0.13 }),
  F('f_eye_abduction', 'other', { en: 'Abduction of the eye (horizontal gaze)', de: 'Abduktion des Auges (horizontale Blickwendung)', la: 'Abductio oculi' },
    { en: 'Abducens nucleus and nerve. A nuclear lesion gives a gaze palsy to the side of the lesion (both eyes), a nerve lesion only weakens abduction of that eye.',
      de: 'Abducenskern und -nerv. Eine Kernläsion verursacht eine Blickparese zur Seite der Läsion (beide Augen), eine Nervenläsion nur eine Abduktionsschwäche dieses Auges.' },
    [0.35, 16.85, -4.15], 'abducens_nucleus', 'ipsi', [['n_abducens', 'ipsi']], { size: 0.14 }),
  F('f_movement_initiation', 'other', { en: 'Initiation and scaling of movement (basal ganglia loop)', de: 'Bewegungsinitiierung und -ausmaß (Basalganglienschleife)', la: 'Initiatio motuum' },
    { en: 'Cortex → striatum → globus pallidus → thalamus → cortex, modulated by dopamine from the substantia nigra. Loss of nigral dopamine gives bradykinesia, rigidity and tremor on the opposite side.',
      de: 'Kortex → Striatum → Globus pallidus → Thalamus → Kortex, moduliert durch Dopamin aus der Substantia nigra. Verlust des nigralen Dopamins verursacht Bradykinese, Rigor und Tremor auf der Gegenseite.' },
    [2.95, 21.2, -1], undefined, 'contra',
    [['substantia_nigra', 'contra'], ['putamen', 'contra', 'partial'], ['globus_pallidus', 'contra', 'partial']], { size: 0.2 }),
  F('f_movement_suppression', 'other', { en: 'Suppression of involuntary movement', de: 'Unterdrückung unwillkürlicher Bewegungen', la: 'Suppressio motuum involuntariorum' },
    { en: 'The indirect pathway through the subthalamic nucleus brakes unwanted movement. A subthalamic lesion releases violent flinging movements of the opposite limbs (hemiballism).',
      de: 'Der indirekte Weg über den Nucleus subthalamicus bremst ungewollte Bewegungen. Eine Läsion des Nucleus subthalamicus enthemmt heftige Schleuderbewegungen der gegenseitigen Extremitäten (Hemiballismus).' },
    [1.2, 19.75, -2.6], undefined, 'contra', [['subthalamic_nucleus', 'contra']], { size: 0.13 })
];

// ------------------------------------------------------------------ arteries
const MCA_END = [3.4, 20.2, -0.6], ICA_END = [0.9, 19, -1.6];
const ARTERIES = [
  A('a_mca', { en: 'Middle cerebral artery (M1 segment)', de: 'A. cerebri media (M1-Segment)', la: 'Arteria cerebri media (pars sphenoidalis)' },
    { en: 'Largest terminal branch of the internal carotid. Its stem runs laterally in the lateral sulcus, giving the lenticulostriate arteries to the internal capsule and lentiform nucleus, then divides over the insula into the cortical branches.',
      de: 'Größter Endast der A. carotis interna. Ihr Stamm zieht im Sulcus lateralis nach lateral, gibt die lentikulostriatalen Arterien zu Capsula interna und Nucleus lentiformis ab und teilt sich über der Insel in die kortikalen Äste.' },
    both([ICA_END, [2.2, 19.4, -1], MCA_END]), 0.16, ['a_internal_carotid'], ['insula'],
    { lesion: { en: 'Occlusion of the stem (cortical branches plus lenticulostriate arteries): contralateral hemiplegia and hemisensory loss including the leg (capsule), contralateral lower facial palsy, gaze deviation towards the lesion, homonymous hemianopia, and aphasia (dominant side) or neglect (non-dominant).',
      de: 'Verschluss des Stamms (kortikale Äste und lentikulostriatale Arterien): Hemiplegie und Hemihypästhesie der Gegenseite einschließlich des Beins (Kapsel), zentrale Fazialisparese der Gegenseite, Blickwendung zur Seite der Läsion, homonyme Hemianopsie sowie Aphasie (dominante Seite) oder Neglect (nicht-dominante Seite).' } }),
  A('a_mca_cortical', { en: 'Cortical branches of the middle cerebral artery', de: 'Kortikale Äste der A. cerebri media', la: 'Rami corticales arteriae cerebri mediae' },
    { en: 'Superior division (frontal and parietal convexity: motor and sensory cortex for face and arm, Broca\'s area) and inferior division (temporal lobe: Wernicke\'s area, auditory cortex, Meyer\'s loop).',
      de: 'Oberer Hauptast (frontale und parietale Konvexität: motorische und sensible Rinde für Gesicht und Arm, Broca-Areal) und unterer Hauptast (Temporallappen: Wernicke-Areal, Hörrinde, Meyer-Schleife).' },
    [[MCA_END, [4.6, 21.6, 0.6], [4.4, 24, 1.4]], [MCA_END, [5, 22.4, -1.4], [4.6, 25, -2.4]], [MCA_END, [5, 20.6, -3], [4, 21.8, -5.6]]].flatMap(both), 0.09,
    ['a_mca'], ['f_motor_arm', 'f_motor_lower_face', 'f_motor_upper_face', 'f_motor_tongue', 'f_touch_arm', 'f_pain_arm', 'f_face_touch', 'f_face_pain', 'broca_area', 'wernicke_area', 'f_hearing'],
    { lesion: { en: 'Cortical MCA infarct: contralateral weakness and sensory loss of the face and arm more than the leg (the leg area is ACA territory), and aphasia if the dominant hemisphere is affected.',
      de: 'Kortikaler Mediainfarkt: brachiofazial betonte Parese und Sensibilitätsstörung der Gegenseite (das Bein liegt im Stromgebiet der A. cerebri anterior) und Aphasie, wenn die dominante Hemisphäre betroffen ist.' } }),
  A('a_lenticulostriate', { en: 'Lenticulostriate arteries', de: 'Lentikulostriatale Arterien (Aa. centrales anterolaterales)', la: 'Arteriae centrales anterolaterales' },
    { en: 'Thin end arteries rising at right angles from the MCA stem into the lentiform nucleus, caudate and internal capsule. Prone to hypertensive damage: lacunar infarcts and intracerebral haemorrhage.',
      de: 'Dünne Endarterien, die rechtwinklig aus dem Mediastamm in Nucleus lentiformis, Nucleus caudatus und Capsula interna aufsteigen. Anfällig für hypertensive Schäden: lakunäre Infarkte und intrazerebrale Blutungen.' },
    [[[1.8, 19.3, -1.25], [2, 20.4, -1.3], [2.1, 21.2, -1.7]], [[2.4, 19.45, -1.05], [2.6, 20.6, -0.9]]].flatMap(both), 0.05,
    ['a_mca'], ['internal_capsule', 'putamen', 'globus_pallidus'],
    { lesion: { en: 'Lacunar infarct of the internal capsule: pure motor (or sensorimotor) hemiparesis of the opposite face, arm and leg without aphasia or field defect.',
      de: 'Lakunärer Infarkt der Capsula interna: rein motorische (oder sensomotorische) Hemiparese der Gegenseite an Gesicht, Arm und Bein ohne Aphasie oder Gesichtsfeldausfall.' } }),
  A('a_aca', { en: 'Anterior cerebral artery', de: 'A. cerebri anterior', la: 'Arteria cerebri anterior' },
    { en: 'The medial terminal branch of the internal carotid. Runs forward to the anterior communicating artery, then in the interhemispheric fissure around the genu of the corpus callosum and back along it, supplying the medial frontal and parietal lobes, including the leg area of the motor and sensory cortex.',
      de: 'Medialer Endast der A. carotis interna. Zieht nach vorn zur A. communicans anterior, dann im Interhemisphärenspalt um das Balkenknie und den Balken entlang nach hinten und versorgt die mediale Fläche von Frontal- und Parietallappen, einschließlich der Beinregion von motorischem und sensiblem Kortex.' },
    both([ICA_END, [0.3, 19.8, -0.4], [0.25, 20.8, 1], [0.25, 22.8, 1.4], [0.25, 24.6, 0], [0.3, 25.6, -2.4], [0.3, 25.4, -4.6]]), 0.12,
    ['a_internal_carotid'], ['f_motor_leg', 'f_touch_leg', 'f_pain_leg'],
    { collateral: true, lesion: { en: 'Contralateral weakness and sensory loss of the leg more than the arm, with the face spared; with bilateral or extensive infarcts abulia and urinary incontinence. Often compensated through the anterior communicating artery if the occlusion lies before it.',
      de: 'Beinbetonte Parese und Sensibilitätsstörung der Gegenseite, Gesicht ausgespart; bei beidseitigen oder ausgedehnten Infarkten Antriebsminderung und Harninkontinenz. Liegt der Verschluss vor der A. communicans anterior, wird er oft über diese kompensiert.' } }),
  A('a_acom', { en: 'Anterior communicating artery', de: 'A. communicans anterior', la: 'Arteria communicans anterior' },
    { en: 'Short link between the two anterior cerebral arteries, closing the circle of Willis in front. The most common site of berry aneurysms.',
      de: 'Kurze Verbindung beider Aa. cerebri anteriores, schließt den Circulus arteriosus Willisii vorn. Häufigster Ort sackförmiger (Beeren-)Aneurysmen.' },
    [[[-0.3, 19.8, -0.4], [0.3, 19.8, -0.4]]], 0.06, ['a_aca'], [], { collateral: true }),
  A('a_pcom', { en: 'Posterior communicating artery', de: 'A. communicans posterior', la: 'Arteria communicans posterior' },
    { en: 'Links the internal carotid with the posterior cerebral artery on each side, joining the carotid and vertebrobasilar systems in the circle of Willis. An aneurysm here can compress the oculomotor nerve (pupil first).',
      de: 'Verbindet auf jeder Seite die A. carotis interna mit der A. cerebri posterior und damit Karotis- und vertebrobasiläres System im Circulus arteriosus Willisii. Ein Aneurysma hier kann den N. oculomotorius komprimieren (zuerst die Pupille).' },
    both([ICA_END, [0.85, 19.05, -2.4]]), 0.06, ['a_internal_carotid'], [], { collateral: true }),
  A('a_basilar', { en: 'Basilar artery', de: 'A. basilaris', la: 'Arteria basilaris' },
    { en: 'Formed by the two vertebral arteries at the lower border of the pons, runs up its front and divides into the two posterior cerebral arteries. Gives paramedian and circumferential pontine branches, AICA and the superior cerebellar arteries.',
      de: 'Entsteht am Unterrand der Brücke aus beiden Aa. vertebrales, zieht an ihrer Vorderseite nach oben und teilt sich in die beiden Aa. cerebri posteriores. Gibt paramediane und zirkumferente Brückenäste, die AICA und die Aa. superiores cerebelli ab.' },
    [...both([[0.4, 14.2, -4.4], [0.5, 15, -3.65], [0.15, 16, -2.85]]), [[0, 16, -2.8], [0, 17.2, -2.45], [0, 18.4, -2.4], [0, 18.9, -2.3]]], 0.2,
    ['a_vertebral'], ['pons'],
    { collateral: true, midline: true, lesion: { en: 'Basilar thrombosis: bilateral destruction of the basilar pons gives the locked-in syndrome (tetraplegia, anarthria, horizontal gaze palsy; consciousness and vertical eye movements preserved) or coma.',
      de: 'Basilaristhrombose: die beidseitige Zerstörung des Brückenfußes führt zum Locked-in-Syndrom (Tetraplegie, Anarthrie, horizontale Blickparese; Bewusstsein und vertikale Augenbewegungen erhalten) oder zum Koma.' } }),
  A('a_pica', { en: 'Posterior inferior cerebellar artery (PICA)', de: 'A. inferior posterior cerebelli (PICA)', la: 'Arteria inferior posterior cerebelli' },
    { en: 'Largest branch of the vertebral artery. Loops around the medulla to the underside of the cerebellum, supplying the lateral medulla and the inferior cerebellum.',
      de: 'Größter Ast der A. vertebralis. Zieht in einer Schleife um die Medulla oblongata zur Kleinhirnunterfläche und versorgt die laterale Medulla und das untere Kleinhirn.' },
    both([[0.5, 15, -3.7], [1, 15, -4.6], [0.9, 15.6, -5.2], [0.5, 15.2, -5.6], [1.2, 15.5, -6.6], [2.2, 15.7, -6.9]]), 0.08,
    ['a_vertebral'], ['spinal_trigeminal_nucleus', 'nucleus_ambiguus', 'vestibular_nuclei', 'inferior_cerebellar_peduncle', 't_spinothalamic', 't_central_sympathetic'],
    { lesion: { en: 'Wallenberg (lateral medullary) syndrome, usually from vertebral artery occlusion: on the side of the lesion loss of pain and temperature of the face, Horner syndrome, ataxia, dysphagia and hoarseness, vertigo and nystagmus; on the opposite side loss of pain and temperature of the body. No weakness (the pyramids are medial).',
      de: 'Wallenberg-Syndrom (dorsolaterales Medulla-oblongata-Syndrom), meist durch Verschluss der A. vertebralis: auf der Seite der Läsion Ausfall von Schmerz- und Temperaturempfinden im Gesicht, Horner-Syndrom, Ataxie, Dysphagie und Heiserkeit, Schwindel und Nystagmus; auf der Gegenseite Ausfall von Schmerz und Temperatur am Körper. Keine Parese (die Pyramiden liegen medial).' } }),
  A('a_aica', { en: 'Anterior inferior cerebellar artery (AICA)', de: 'A. inferior anterior cerebelli (AICA)', la: 'Arteria inferior anterior cerebelli' },
    { en: 'From the lower basilar artery to the lateral lower pons, the middle cerebellar peduncle and the front of the cerebellum; usually gives the labyrinthine artery to the inner ear.',
      de: 'Aus der unteren A. basilaris zur lateralen unteren Brücke, zum mittleren Kleinhirnstiel und zur Vorderfläche des Kleinhirns; gibt meist die A. labyrinthi zum Innenohr ab.' },
    both([[0.05, 16.4, -2.75], [1, 16.5, -3], [1.6, 16.6, -3.8], [2.4, 16.4, -4.8]]), 0.08,
    ['a_basilar'], ['facial_nucleus', 'vestibular_nuclei', 'cochlear_nuclei', 'spinal_trigeminal_nucleus', 't_spinothalamic', 't_central_sympathetic'],
    { lesion: { en: 'Lateral pontine syndrome: like Wallenberg, but with a peripheral facial palsy and hearing loss on the side of the lesion and no dysphagia.',
      de: 'Laterales Brückensyndrom: ähnlich dem Wallenberg-Syndrom, aber mit peripherer Fazialisparese und Hörverlust auf der Seite der Läsion und ohne Dysphagie.' } }),
  A('a_sca', { en: 'Superior cerebellar artery', de: 'A. superior cerebelli', la: 'Arteria superior cerebelli' },
    { en: 'From the top of the basilar artery around the midbrain to the upper surface of the cerebellum. The oculomotor nerve passes between it and the posterior cerebral artery.',
      de: 'Aus dem oberen Ende der A. basilaris um das Mittelhirn zur Oberfläche des Kleinhirns. Zwischen ihr und der A. cerebri posterior verläuft der N. oculomotorius.' },
    both([[0.05, 18.7, -2.35], [1, 18.6, -2.8], [1.5, 18.3, -4.2], [1.8, 17.6, -5.6]]), 0.08, ['a_basilar'], ['cerebellum']),
  A('a_pca', { en: 'Posterior cerebral artery', de: 'A. cerebri posterior', la: 'Arteria cerebri posterior' },
    { en: 'Terminal branch of the basilar artery. Runs around the midbrain to the occipital lobe and the underside of the temporal lobe; small branches supply the thalamus and midbrain. Connected to the internal carotid by the posterior communicating artery.',
      de: 'Endast der A. basilaris. Zieht um das Mittelhirn zum Okzipitallappen und zur Unterfläche des Temporallappens; kleine Äste versorgen Thalamus und Mittelhirn. Über die A. communicans posterior mit der A. carotis interna verbunden.' },
    both([[0, 18.9, -2.3], [0.8, 19.1, -2.4], [1.6, 19, -3.6], [1.4, 19.8, -6], [0.8, 21, -7.8]]), 0.12, ['a_basilar'], ['occipital_lobe'],
    { collateral: true, lesion: { en: 'Contralateral homonymous hemianopia with macular sparing; with the dominant side also alexia without agraphia.',
      de: 'Homonyme Hemianopsie zur Gegenseite mit Makulaaussparung; bei der dominanten Seite zusätzlich Alexie ohne Agraphie.' } }),
  A('a_anterior_spinal', { en: 'Anterior spinal artery', de: 'A. spinalis anterior', la: 'Arteria spinalis anterior' },
    { en: 'Formed by a branch of each vertebral artery and running down the anterior median fissure, reinforced by segmental radicular arteries (largest: the artery of Adamkiewicz, around T9–L2). Supplies the anterior two thirds of the cord; the dorsal columns are supplied by the posterior spinal arteries.',
      de: 'Entsteht aus je einem Ast beider Aa. vertebrales und zieht in der Fissura mediana anterior nach unten, verstärkt durch segmentale Radikulararterien (größte: A. radicularis magna Adamkiewicz, etwa Th9–L2). Versorgt die vorderen zwei Drittel des Rückenmarks; die Hinterstränge versorgen die Aa. spinales posteriores.' },
    [[[0.4, 14.6, -4.05], [0, 14.1, r2(cordZ(14.1) + 0.55)]], [[-0.4, 14.6, -4.05], [0, 14.1, r2(cordZ(14.1) + 0.55)]], cord(0, 14.1, -31, 0.55)], 0.06,
    ['a_vertebral'], ['t_lateral_cst_lumbar', 't_spinothalamic_lumbar', 't_anterior_cst'],
    { collateral: true, midline: true, lesion: { en: 'Anterior spinal artery syndrome (e.g. after aortic surgery, at the thoracic level): paraplegia and loss of pain and temperature below the lesion on both sides, bladder dysfunction, with touch, vibration and position sense preserved (dorsal columns).',
      de: 'Spinalis-anterior-Syndrom (z. B. nach Aortenoperationen, auf Thorakalhöhe): beidseitige Paraplegie und dissoziierte Sensibilitätsstörung (Ausfall von Schmerz und Temperatur) unterhalb der Läsion, Blasenstörung, bei erhaltener Berührungs-, Vibrations- und Lageempfindung (Hinterstränge).' } })
];

export const structures = [...BRAIN, ...TRACTS, ...FUNCTIONS, ...ARTERIES];

export const muscleGroups = {};

export const meta = {
  start: 'internal_capsule',
  plexus: { en: 'Pathways', de: 'Bahnen' },
  plexusTargets: { en: 'Pathways → functions', de: 'Bahnen → Funktionen' },
  nerveGroups: [],
  brainGroups: [
    ['cerebrum', { en: 'Cerebrum: lobes and cortical areas', de: 'Großhirn: Lappen und Rindenfelder' }],
    ['basal', { en: 'Basal ganglia and internal capsule', de: 'Basalganglien und Capsula interna' }],
    ['diencephalon', { en: 'Diencephalon', de: 'Zwischenhirn' }],
    ['brainstem', { en: 'Brainstem and cranial nerve nuclei', de: 'Hirnstamm und Hirnnervenkerne' }],
    ['cerebellum', { en: 'Cerebellum', de: 'Kleinhirn' }],
    ['cord', { en: 'Spinal cord', de: 'Rückenmark' }],
    ['csf', { en: 'Ventricles and CSF flow', de: 'Ventrikel und Liquorfluss' }]
  ],
  tractGroups: [
    ['motor', { en: 'Motor pathways', de: 'Motorische Bahnen' }],
    ['sensory', { en: 'Somatosensory pathways', de: 'Somatosensible Bahnen' }],
    ['visual', { en: 'Visual pathway', de: 'Sehbahn' }],
    ['cerebellar', { en: 'Spinocerebellar tracts', de: 'Kleinhirnseitenstrangbahnen' }],
    ['autonomic', { en: 'Central autonomic pathway', de: 'Zentrale vegetative Bahn' }]
  ],
  functionGroups: [
    ['motor', { en: 'Motor', de: 'Motorik' }],
    ['sensory', { en: 'Sensation', de: 'Sensibilität' }],
    ['vision', { en: 'Visual fields', de: 'Gesichtsfelder' }],
    ['language', { en: 'Language', de: 'Sprache' }],
    ['other', { en: 'Cranial nerves, cerebellum, basal ganglia, autonomic', de: 'Hirnnerven, Kleinhirn, Basalganglien, vegetativ' }]
  ],
  // Cranial nerves, vessels, the eye and the skull base from the head and neck; vertebral artery,
  // occiput, cervical spine and spinal nerves from the back; the vagus and sympathetic trunk.
  context: ['n_olfactory', 'n_optic', 'n_oculomotor', 'n_trochlear', 'n_trigeminal', 'n_abducens', 'n_facial', 'n_corticonuclear_facial',
    'n_vestibulocochlear', 'n_glossopharyngeal', 'n_vagus', 'n_accessory', 'n_hypoglossal', 'n_cervical_sympathetic',
    'sn_cervical', 'sn_thoracic', 'sn_lumbar', 'sn_sacral',
    'a_vertebral', 'a_internal_carotid', 'a_ophthalmic', 'v_dural_sinuses', 'eye',
    'occipital_bone', 'sphenoid_bone', 'temporal_bone', 'cervical_vertebrae'],
  contextOpacity: 0.25,
  camera: { target: [0, 18, -3], position: [26, 24, 34] }
};
