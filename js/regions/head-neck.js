// Head and neck: skull, muscles of facial expression and mastication, the hyoid muscles, tongue,
// pharynx, larynx and eye muscles, the cranial nerves with their main branches, the cervical plexus
// and ansa cervicalis, the carotid arteries and their branches, the jugular veins and dural venous
// sinuses, and the glands and organs of the neck.
// Coordinates: [lateral, superior, anterior] in schematic cm, same body frame as the other regions
// (x > 0 is the body's right; the viewer mirrors x). Paired bones are drawn on both sides; muscles,
// nerves and vessels are drawn on the right side only, except where both sides matter
// (recurrent laryngeal nerves, central facial palsy, dural sinuses).
//
// The occipital bone, cervical vertebrae, vertebral and occipital arteries and cervical spinal
// nerves belong to the back; the vagus, recurrent laryngeal nerves, common carotids, trachea and
// brachiocephalic veins to the thorax; the clavicle, trapezius and the old cervical plexus card to
// the upper limb. The accessory nerve moved here from the upper limb.
// Cranial nerve "segments" are tokens such as 'CN VII' (and 'CN V1'–'CN V3' for the trigeminal
// divisions), so the lesion model follows fibre components exactly as it does for spinal segments.

const r2 = x => Math.round(x * 100) / 100;
const round = p => p.map(r2);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const mirror = p => [-p[0], p[1], p[2]];
const both = path => [path, path.map(mirror)];
const bothFibers = fibers => [...fibers, ...fibers.map(f => f.map(mirror))];

const SEGMENTS = [['C', 8], ['T', 12], ['L', 5], ['S', 5]].flatMap(([p, n]) => range(1, n).map(i => p + i));
const segs = (from, to) => SEGMENTS.slice(SEGMENTS.indexOf(from), SEGMENTS.indexOf(to) + 1);

// The skull vault is an ellipsoid; the frontal, parietal, temporal squama and greater wings of the
// sphenoid are patches of it (longitude from anterior towards the right, latitude up from the
// equator). `vault()` gives a point on it, `off` cm outside (negative: inside, for the dura).
const VAULT_C = [0, 21.4, -1.9], VAULT_R = [6, 7.2, 7.4];
const shell = (lon, lat) => [VAULT_C, VAULT_R, lon, lat];
const bothShells = (lon, lat) => [shell(lon, lat), shell([-lon[1], -lon[0]], lat)];
const vault = (lon, lat, off = 0) => {
  const l = lon * Math.PI / 180, b = lat * Math.PI / 180;
  return round([(VAULT_R[0] + off) * Math.cos(b) * Math.sin(l), VAULT_C[1] + (VAULT_R[1] + off) * Math.sin(b), VAULT_C[2] + (VAULT_R[2] + off) * Math.cos(b) * Math.cos(l)]);
};
// A ring of points in a frontal (x–y) plane, for the orbicularis muscles.
const ringXY = (c, rx, ry, n = 14, dz = 0) => range(0, n).map(i => {
  const t = 2 * Math.PI * i / n;
  return round([c[0] + rx * Math.cos(t), c[1] + ry * Math.sin(t), c[2] - dz * Math.cos(t) ** 2]);
});
// Constrictor fibres: half rings around the pharynx (centre z `cz`) from the side to the posterior
// midline raphe, rising from y0 to y1.
const constrictor = (y0, y1, cz, R, from = 70) => range(0, 6).map(i => {
  const t = (from + (180 - from) * i / 6) * Math.PI / 180;
  return round([R * Math.sin(t), y0 + (y1 - y0) * i / 6, cz + R * Math.cos(t)]);
});

// Landmarks (right side)
const EYE = [2.4, 19.6, 4.0], EYE_R = 1.05;
const APEX = [1.4, 19.5, 0.9];            // orbital apex, common tendinous ring
const TROCHLEA = [1.6, 20.5, 4.4];
const STYLOMASTOID = [4.3, 15.2, -3.1];
const PAROTID_PLEXUS = [5.2, 15.0, -0.8];
const GENICULATE = [3.9, 17.4, -2.0];
const TRIGEMINAL_GANGLION = [2.3, 17.6, -1.5];
const V3_TRUNK = [2.9, 16.0, -0.6];       // below the foramen ovale, infratemporal fossa
const JUGULAR_FORAMEN = [2.6, 15.6, -3.4];
const CCA_BIFURCATION = [2.4, 7.4, -0.8]; // upper border of the thyroid cartilage (C4)
const ECA_END = [4.5, 15.8, -2.0];        // behind the neck of the mandible, in the parotid
const ERB = [5.0, 9.2, -1.2];             // punctum nervosum, behind the middle of SCM
const SUP_LARYNGEAL_SPLIT = [1.8, 9.4, -0.6];
const ANSA = [2.9, 5.6, 0.6];
const C1_XII = [3.3, 11.3, -1.0];         // C1 fibres riding on the hypoglossal nerve
const TRUNK_TOP = [2.6, 4, -3.44];        // top of the thoracic sympathetic trunk

// ------------------------------------------------------------ bones
const bones = [
  {
    id: 'frontal_bone', type: 'bone',
    name: { en: 'Frontal bone', de: 'Stirnbein', la: 'Os frontale' },
    info: {
      en: 'Forms the forehead (squama), the roofs of the orbits and the anterior cranial fossa. The supraorbital margin carries the supraorbital notch or foramen for the supraorbital nerve (V1) and vessels; the frontal sinus lies behind the superciliary arches. It meets the parietal bones at the coronal suture (bregma at the junction with the sagittal suture, the anterior fontanelle in the newborn).',
      de: 'Bildet die Stirn (Squama), die Dächer der Augenhöhlen und die vordere Schädelgrube. Der Margo supraorbitalis trägt die Incisura bzw. das Foramen supraorbitale für N. (V1) und Vasa supraorbitalia; hinter den Arcus superciliares liegt der Sinus frontalis. Mit den Scheitelbeinen bildet es die Sutura coronalis (Bregma am Treffpunkt mit der Sutura sagittalis, beim Neugeborenen die große Fontanelle).'
    },
    shape: {
      shells: [shell([-55, 55], [-5, 60])],
      tubes: [[[-3.9, 20.8, 4.0], [-2.4, 21.1, 5.2], [0, 21.3, 5.6], [2.4, 21.1, 5.2], [3.9, 20.8, 4.0]]],
      ellipsoids: [[[0, 20.8, 2.0], [3.2, 0.25, 1.8]]],
      r: 0.3, opacity: 0.4
    }
  },
  {
    id: 'parietal_bone', type: 'bone',
    name: { en: 'Parietal bones', de: 'Scheitelbeine', la: 'Ossa parietalia' },
    info: {
      en: 'The paired parietal bones form the roof and sides of the vault, meeting each other at the sagittal suture, the frontal bone at the coronal suture, the occipital bone at the lambdoid suture (lambda, the posterior fontanelle in the newborn) and the temporal squama at the squamous suture. Their inner surface is grooved by the middle meningeal vessels; pterion, where the frontal, parietal, temporal and sphenoid bones meet, is the thinnest part of the side of the skull.',
      de: 'Die paarigen Scheitelbeine bilden Dach und Seitenwände des Schädels und grenzen an der Sutura sagittalis aneinander, an der Sutura coronalis an das Stirnbein, an der Sutura lambdoidea an das Hinterhauptsbein (Lambda, beim Neugeborenen die kleine Fontanelle) und an der Sutura squamosa an die Schläfenbeinschuppe. Ihre Innenfläche trägt die Furchen der Vasa meningea media; das Pterion, wo Stirn-, Scheitel-, Schläfen- und Keilbein zusammentreffen, ist die dünnste Stelle der seitlichen Schädelwand.'
    },
    shape: { shells: [...bothShells([55, 165], [12, 90]), ...bothShells([0, 55], [60, 90])], opacity: 0.4 }
  },
  {
    id: 'temporal_bone', type: 'bone',
    name: { en: 'Temporal bones', de: 'Schläfenbeine', la: 'Ossa temporalia' },
    info: {
      en: 'Each temporal bone has a squamous part (side of the vault, the zygomatic process and the mandibular fossa of the jaw joint), a tympanic part (external acoustic meatus), the mastoid process and the petrous part, which houses the middle and inner ear and is crossed by the facial canal (CN VII from the internal acoustic meatus to the stylomastoid foramen) and the carotid canal. The styloid process gives origin to stylohyoid, styloglossus and stylopharyngeus. The jugular foramen (CN IX, X, XI, internal jugular vein) lies between the petrous part and the occipital bone.',
      de: 'Jedes Schläfenbein hat eine Pars squamosa (Seitenwand des Schädels, Processus zygomaticus und Fossa mandibularis des Kiefergelenks), eine Pars tympanica (äußerer Gehörgang), den Processus mastoideus und die Pars petrosa (Felsenbein), die Mittel- und Innenohr enthält und vom Canalis nervi facialis (N. VII vom Meatus acusticus internus zum Foramen stylomastoideum) und vom Canalis caroticus durchzogen wird. Am Processus styloideus entspringen Mm. stylohyoideus, styloglossus und stylopharyngeus. Das Foramen jugulare (N. IX, X, XI, V. jugularis interna) liegt zwischen Felsenbein und Hinterhauptsbein.'
    },
    shape: {
      shells: bothShells([75, 140], [-22, 12]),
      spheres: [[[4.6, 15.4, -3.9], 0.9], [[-4.6, 15.4, -3.9], 0.9]],
      tubes: [
        ...both([[5.5, 17.5, 0.8], [5.6, 17.4, -0.6], [5.2, 17.1, -1.6]]),
        ...both([[3.9, 15.0, -2.6], [3.3, 13.3, -1.6]]),
        ...both([[4.8, 16.9, -3.1], [3.4, 17.2, -2.4], [1.9, 17.4, -1.4]])
      ],
      r: 0.35, opacity: 0.5
    }
  },
  {
    id: 'sphenoid_bone', type: 'bone',
    name: { en: 'Sphenoid bone', de: 'Keilbein', la: 'Os sphenoidale' },
    info: {
      en: 'Keystone of the skull base. The body contains the sphenoid sinus and carries the sella turcica with the pituitary gland, flanked by the cavernous sinuses. The lesser wings carry the optic canal (CN II, ophthalmic artery); between lesser and greater wings the superior orbital fissure passes CN III, IV, V1 and VI and the ophthalmic veins. In the greater wing lie the foramen rotundum (V2), foramen ovale (V3) and foramen spinosum (middle meningeal artery). The pterygoid processes give origin to the pterygoid muscles.',
      de: 'Schlussstein der Schädelbasis. Der Körper enthält den Sinus sphenoidalis und trägt die Sella turcica mit der Hypophyse, flankiert von den Sinus cavernosi. Die Alae minores tragen den Canalis opticus (N. II, A. ophthalmica); zwischen kleinem und großem Flügel tritt die Fissura orbitalis superior für N. III, IV, V1, VI und die Vv. ophthalmicae. In der Ala major liegen Foramen rotundum (V2), Foramen ovale (V3) und Foramen spinosum (A. meningea media). An den Processus pterygoidei entspringen die Mm. pterygoidei.'
    },
    shape: {
      shells: bothShells([52, 76], [-20, 10]),
      ellipsoids: [[[0, 18.2, -0.6], [1.4, 1.0, 1.4]], [[2.8, 17.8, -0.4], [1.4, 0.35, 1.4]], [[-2.8, 17.8, -0.4], [1.4, 0.35, 1.4]]],
      tubes: [
        [[3.2, 19.6, 0.8], [0.8, 19.4, 0.2], [-0.8, 19.4, 0.2], [-3.2, 19.6, 0.8]],
        ...both([[1.3, 17.4, 0.2], [1.5, 15.0, 0.4]])
      ],
      r: 0.3, opacity: 0.55
    }
  },
  {
    id: 'ethmoid_bone', type: 'bone',
    name: { en: 'Ethmoid bone', de: 'Siebbein', la: 'Os ethmoidale' },
    info: {
      en: 'Light bone between the orbits: the cribriform plate in the floor of the anterior cranial fossa (with the crista galli) lets the olfactory fila (CN I) through; the perpendicular plate forms the upper nasal septum; the labyrinths with the ethmoidal air cells form the medial orbital walls (lamina papyracea) and carry the superior and middle nasal conchae.',
      de: 'Leichter Knochen zwischen den Augenhöhlen: Die Lamina cribrosa im Boden der vorderen Schädelgrube (mit der Crista galli) lässt die Fila olfactoria (N. I) durch; die Lamina perpendicularis bildet den oberen Teil der Nasenscheidewand; die Labyrinthe mit den Cellulae ethmoidales bilden die medialen Orbitawände (Lamina papyracea) und tragen die obere und mittlere Nasenmuschel.'
    },
    shape: { ellipsoids: [[[0, 19.4, 2.8], [0.9, 1.4, 1.6]], [[0, 20.5, 2.4], [0.7, 0.15, 1.3]]] }
  },
  {
    id: 'nasal_bone', type: 'bone',
    name: { en: 'Nasal bones', de: 'Nasenbeine', la: 'Ossa nasalia' },
    info: {
      en: 'Two small oblong bones forming the bridge of the nose; they articulate with the frontal bone above and the frontal processes of the maxillae at the sides. The most frequently fractured facial bones.',
      de: 'Zwei kleine längliche Knochen, die den Nasenrücken bilden; sie artikulieren oben mit dem Stirnbein und seitlich mit den Processus frontales der Oberkiefer. Die am häufigsten gebrochenen Gesichtsknochen.'
    },
    shape: { tubes: both([[0.35, 20.6, 5.6], [0.45, 18.8, 6.5]]), r: 0.3 }
  },
  {
    id: 'maxilla', type: 'bone',
    name: { en: 'Maxillae', de: 'Oberkiefer', la: 'Maxillae' },
    info: {
      en: 'The paired maxillae form the upper jaw (alveolar process with the upper teeth), most of the hard palate (palatine processes), the floor of the orbit and the lateral wall of the nasal cavity. The body holds the maxillary sinus; the infraorbital nerve (V2) runs in the orbital floor and leaves through the infraorbital foramen.',
      de: 'Die paarigen Oberkiefer bilden den Oberkiefer im engeren Sinn (Processus alveolaris mit den oberen Zähnen), den größten Teil des harten Gaumens (Processus palatini), den Boden der Augenhöhle und die seitliche Nasenwand. Der Körper enthält die Kieferhöhle (Sinus maxillaris); der N. infraorbitalis (V2) verläuft im Orbitaboden und tritt durch das Foramen infraorbitale aus.'
    },
    shape: {
      ellipsoids: [[[1.9, 16.0, 3.8], [1.8, 2.2, 1.9]], [[-1.9, 16.0, 3.8], [1.8, 2.2, 1.9]], [[0, 14.2, 2.6], [1.6, 0.25, 2.2]]],
      tubes: [[[3.4, 13.7, 1.4], [2.7, 13.6, 3.9], [0, 13.5, 5.4], [-2.7, 13.6, 3.9], [-3.4, 13.7, 1.4]]],
      r: 0.45
    }
  },
  {
    id: 'zygomatic_bone', type: 'bone',
    name: { en: 'Zygomatic bones', de: 'Jochbeine', la: 'Ossa zygomatica' },
    info: {
      en: 'The cheek bones form the prominence of the cheek and the lateral orbital wall and rim; their temporal process joins the zygomatic process of the temporal bone in the zygomatic arch, from which masseter arises. The temporalis tendon passes deep to the arch to the coronoid process.',
      de: 'Die Jochbeine bilden den Wangenvorsprung sowie die seitliche Orbitawand und den seitlichen Orbitarand; ihr Processus temporalis bildet mit dem Processus zygomaticus des Schläfenbeins den Jochbogen (Arcus zygomaticus), an dem der M. masseter entspringt. Die Temporalissehne zieht unter dem Jochbogen zum Processus coronoideus.'
    },
    shape: {
      ellipsoids: [[[4.3, 17.9, 3.0], [0.9, 1.3, 0.9]], [[-4.3, 17.9, 3.0], [0.9, 1.3, 0.9]]],
      tubes: both([[4.6, 17.6, 2.4], [5.5, 17.5, 0.8]]),
      r: 0.35
    }
  },
  {
    id: 'mandible', type: 'bone',
    name: { en: 'Mandible', de: 'Unterkiefer', la: 'Mandibula' },
    info: {
      en: 'The lower jaw: a horseshoe-shaped body with the lower teeth and two rami. Each ramus ends in the coronoid process (temporalis) and the condylar process, whose head forms the temporomandibular joint with the mandibular fossa of the temporal bone. The inferior alveolar nerve (V3) enters the mandibular foramen on the inner side of the ramus and leaves as the mental nerve; mylohyoid and the genial muscles arise from the inner surface, masseter and medial pterygoid insert at the angle.',
      de: 'Der Unterkiefer: hufeisenförmiger Körper mit den unteren Zähnen und zwei Äste (Rami). Jeder Ast endet im Processus coronoideus (M. temporalis) und im Processus condylaris, dessen Kopf mit der Fossa mandibularis des Schläfenbeins das Kiefergelenk bildet. Der N. alveolaris inferior (V3) tritt innen am Ramus durch das Foramen mandibulae ein und als N. mentalis aus; an der Innenfläche entspringen Mm. mylohyoideus, genioglossus und geniohyoideus, am Kieferwinkel setzen Masseter und Pterygoideus medialis an.'
    },
    shape: {
      tubes: [
        [[4.6, 12.0, -0.6], [4.0, 11.4, 1.8], [2.6, 10.9, 4.0], [0, 10.6, 5.0], [-2.6, 10.9, 4.0], [-4.0, 11.4, 1.8], [-4.6, 12.0, -0.6]],
        ...both([[4.6, 12.0, -0.6], [4.7, 14.2, -0.9], [4.6, 16.4, -1.1]]),
        ...both([[4.6, 13.6, -0.4], [4.4, 15.0, 0.4], [4.2, 16.1, 0.9]])
      ],
      r: 0.45
    }
  },
  {
    id: 'hyoid_bone', type: 'bone',
    name: { en: 'Hyoid bone', de: 'Zungenbein', la: 'Os hyoideum' },
    info: {
      en: 'U-shaped bone at the level of C3 that articulates with no other bone: a body and greater and lesser horns. It anchors the tongue and the supra- and infrahyoid muscles, which raise and lower it with the larynx in swallowing and speech; the thyrohyoid membrane hangs the larynx from it. A fractured hyoid suggests strangulation.',
      de: 'U-förmiger Knochen in Höhe C3 ohne gelenkige Verbindung zu anderen Knochen: Körper sowie große und kleine Hörner. Er verankert die Zunge und die supra- und infrahyoidale Muskulatur, die ihn mit dem Kehlkopf beim Schlucken und Sprechen heben und senken; an ihm hängt über die Membrana thyrohyoidea der Kehlkopf. Eine Zungenbeinfraktur spricht für Erdrosseln oder Erwürgen.'
    },
    shape: { tubes: [[[2.0, 9.2, -0.2], [1.5, 8.8, 1.4], [0, 8.7, 2.0], [-1.5, 8.8, 1.4], [-2.0, 9.2, -0.2]]], r: 0.25 }
  }
];

// ------------------------------------------------------------ muscles
const M = (id, group, name, o, i, action, nerveList, arteryList, oBones, iBones, shape) => ({
  id, type: 'muscle', group, name,
  origin: o, insertion: i, action,
  nerves: nerveList.map(([n, seg, note]) => ({ n, seg, note })),
  arteries: arteryList, originBones: oBones, insertionBones: iBones, shape
});
const VII = ['CN VII'], V3 = ['CN V3'], X = ['CN X'], XII = ['CN XII'], III = ['CN III'];
const ANSA_SEGS = segs('C1', 'C3');

const muscles = [
  // ----- muscles of facial expression (CN VII)
  M('frontalis', 'facial',
    { en: 'Frontalis (occipitofrontalis, frontal belly)', de: 'M. frontalis (Venter frontalis des M. occipitofrontalis)', la: 'Venter frontalis musculi occipitofrontalis' },
    { en: 'Epicranial aponeurosis (galea aponeurotica)', de: 'Galea aponeurotica' },
    { en: 'Skin of the eyebrows and forehead', de: 'Haut der Augenbrauen und der Stirn' },
    { en: 'Raises the eyebrows and wrinkles the forehead horizontally (surprise). Because its motor neurons in the facial nucleus receive corticonuclear fibres from both hemispheres, forehead wrinkling is preserved in a central (supranuclear) facial palsy but lost in a peripheral one.', de: 'Hebt die Augenbrauen und legt die Stirn in Querfalten (Überraschung). Da seine Motoneurone im Nucleus nervi facialis kortikonukleäre Fasern aus beiden Hemisphären erhalten, bleibt das Stirnrunzeln bei der zentralen (supranukleären) Fazialisparese erhalten, bei der peripheren fällt es aus.' },
    [['n_facial_temporal', VII]],
    ['a_superficial_temporal', 'a_ophthalmic'], [], [],
    { fibers: bothFibers([10, 30].map(lon => [vault(lon, 70, 0.3), vault(lon, 40, 0.3), vault(lon, 8, 0.3)])), r: 0.3 }),
  M('orbicularis_oculi', 'facial',
    { en: 'Orbicularis oculi', de: 'Ringmuskel des Auges', la: 'Musculus orbicularis oculi' },
    { en: 'Medial orbital margin, medial palpebral ligament and lacrimal bone', de: 'Medialer Orbitarand, Lig. palpebrale mediale und Os lacrimale' },
    { en: 'Encircles the orbit (orbital part) and lies in the eyelids (palpebral part) to the lateral palpebral raphe', de: 'Umgibt die Orbita (Pars orbitalis) und liegt in den Lidern (Pars palpebralis) bis zur Raphe palpebralis lateralis' },
    { en: 'Closes the eyelids: the palpebral part gently (blinking, sleep), the orbital part tightly (squeezing); the lacrimal part helps drain tears. In a peripheral facial palsy the eye cannot be closed (lagophthalmos) and the eyeball turns up on attempted closure (Bell\'s phenomenon); the cornea dries out.', de: 'Schließt die Lider: Pars palpebralis sanft (Lidschlag, Schlaf), Pars orbitalis kräftig (Zukneifen); die Pars lacrimalis unterstützt den Tränenabfluss. Bei peripherer Fazialisparese kann das Auge nicht geschlossen werden (Lagophthalmus), beim Versuch dreht sich der Bulbus nach oben (Bell-Phänomen); die Hornhaut trocknet aus.' },
    [['n_facial_temporal', VII], ['n_facial_zygomatic', VII]],
    ['a_ophthalmic', 'a_facial', 'a_superficial_temporal'], ['maxilla', 'frontal_bone'], [],
    { fibers: bothFibers([ringXY([2.4, 19.6, 5.3], 1.6, 1.4), ringXY([2.4, 19.6, 5.5], 0.95, 0.75)]), r: 0.22 }),
  M('zygomaticus_major', 'facial',
    { en: 'Zygomaticus major', de: 'Großer Jochbeinmuskel', la: 'Musculus zygomaticus major' },
    { en: 'Lateral surface of the zygomatic bone', de: 'Außenfläche des Jochbeins' },
    { en: 'Angle of the mouth (modiolus)', de: 'Mundwinkel (Modiolus anguli oris)' },
    { en: 'Pulls the angle of the mouth upwards and laterally: the muscle of smiling. A drooping corner of the mouth is the first sign of facial weakness in both central and peripheral palsies.', de: 'Zieht den Mundwinkel nach oben und lateral: der Lachmuskel. Ein hängender Mundwinkel ist das erste Zeichen einer Fazialisschwäche, bei zentraler wie peripherer Parese.' },
    [['n_facial_zygomatic', VII], ['n_facial_buccal', VII]],
    ['a_facial'], ['zygomatic_bone'], [],
    { fibers: bothFibers([[[4.4, 17.4, 3.6], [3.6, 15.2, 4.9], [2.2, 13.4, 5.9]]]), r: 0.3 }),
  M('orbicularis_oris', 'facial',
    { en: 'Orbicularis oris', de: 'Ringmuskel des Mundes', la: 'Musculus orbicularis oris' },
    { en: 'Fibres of the other facial muscles converging on the angle of the mouth (modiolus), and the maxilla and mandible near the midline', de: 'Fasern der übrigen mimischen Muskeln, die am Mundwinkel (Modiolus) zusammenlaufen, sowie Maxilla und Mandibula nahe der Mittellinie' },
    { en: 'Skin and mucosa of the lips', de: 'Haut und Schleimhaut der Lippen' },
    { en: 'Closes and purses the lips (whistling, kissing, sucking) and keeps food in the mouth together with buccinator. Weakness lets saliva and drinks dribble from the corner of the mouth and makes whistling impossible.', de: 'Schließt und spitzt die Lippen (Pfeifen, Küssen, Saugen) und hält mit dem M. buccinator die Nahrung im Mund. Bei Schwäche laufen Speichel und Getränke aus dem Mundwinkel, Pfeifen ist unmöglich.' },
    [['n_facial_buccal', VII], ['n_facial_marginal', VII]],
    ['a_facial'], ['maxilla', 'mandible'], [],
    { fibers: [ringXY([0, 13.1, 6.1], 2.0, 0.8, 16, 0.5), ringXY([0, 13.1, 6.25], 1.6, 0.5, 16, 0.4)], r: 0.25 }),
  M('buccinator', 'facial',
    { en: 'Buccinator', de: 'Wangenmuskel (Trompetermuskel)', la: 'Musculus buccinator' },
    { en: 'Alveolar processes of the maxilla and mandible opposite the molars and the pterygomandibular raphe', de: 'Processus alveolares von Maxilla und Mandibula gegenüber den Molaren und Raphe pterygomandibularis' },
    { en: 'Angle of the mouth, blending with orbicularis oris', de: 'Mundwinkel, strahlt in den M. orbicularis oris ein' },
    { en: 'Presses the cheek against the teeth, so food is pushed back between the molars and does not collect in the vestibule; blows air out (trumpeting). The parotid duct pierces it opposite the second upper molar. Despite chewing, it is a facial muscle (CN VII), not a masticatory one; the buccal nerve of V3 that pierces it is purely sensory.', de: 'Drückt die Wange gegen die Zähne, sodass Speisen zwischen die Molaren geschoben werden und sich nicht im Vestibulum sammeln; bläst Luft aus (Trompeten). Der Ductus parotideus durchbohrt ihn gegenüber dem 2. oberen Molaren. Trotz seiner Rolle beim Kauen ist er ein mimischer Muskel (N. VII), kein Kaumuskel; der ihn durchbohrende N. buccalis aus V3 ist rein sensibel.' },
    [['n_facial_buccal', VII]],
    ['a_facial', 'a_maxillary'], ['maxilla', 'mandible'], [],
    { fibers: bothFibers([[[3.6, 13.8, 1.2], [3.6, 13.3, 3.2], [2.2, 13.2, 5.6]], [[3.6, 12.6, 1.2], [3.5, 12.8, 3.2], [2.2, 13.1, 5.6]]]), r: 0.3 }),
  M('depressor_anguli_oris', 'facial',
    { en: 'Depressor anguli oris', de: 'Mundwinkelherabzieher', la: 'Musculus depressor anguli oris' },
    { en: 'Oblique line of the mandible', de: 'Linea obliqua der Mandibula' },
    { en: 'Angle of the mouth (modiolus)', de: 'Mundwinkel (Modiolus)' },
    { en: 'Pulls the angle of the mouth downwards and laterally (sadness). It is supplied by the marginal mandibular branch, which can be cut in operations below the jaw (submandibular gland, neck dissection), leaving an asymmetric smile.', de: 'Zieht den Mundwinkel nach unten und lateral (Trauer). Er wird vom R. marginalis mandibulae versorgt, der bei Operationen unterhalb des Kiefers (Glandula submandibularis, Neck dissection) verletzt werden kann; die Folge ist ein asymmetrisches Lächeln.' },
    [['n_facial_marginal', VII]],
    ['a_facial'], ['mandible'], [],
    { fibers: bothFibers([[[2.1, 12.9, 5.9], [2.7, 11.8, 5.3], [3.1, 11.0, 4.4]]]), r: 0.28 }),
  M('platysma', 'facial',
    { en: 'Platysma', de: 'Halshautmuskel', la: 'Platysma' },
    { en: 'Fascia over the upper pectoralis major and deltoid', de: 'Faszie über dem oberen M. pectoralis major und dem M. deltoideus' },
    { en: 'Lower border of the mandible, skin of the lower face and the angle of the mouth', de: 'Unterrand der Mandibula, Haut des unteren Gesichts und Mundwinkel' },
    { en: 'Thin sheet in the superficial fascia of the neck that tenses the skin of the neck and pulls the corners of the mouth down (fright, strain). It is the first layer cut in neck operations; the external jugular vein and the cervical plexus cutaneous nerves lie deep to it.', de: 'Dünne Muskelplatte in der oberflächlichen Halsfaszie, die die Halshaut spannt und die Mundwinkel nach unten zieht (Schreck, Anstrengung). Sie ist die erste Schicht, die bei Halsoperationen durchtrennt wird; V. jugularis externa und die Hautäste des Plexus cervicalis liegen unter ihr.' },
    [['n_facial_cervical', VII]],
    ['a_facial', 'a_suprascapular'], ['mandible'], ['mandible'],
    { fibers: bothFibers([[[2.4, 10.8, 4.2], [3.0, 7.0, 2.4], [3.6, 2.0, 2.4], [4.2, -1.0, 3.4]], [[4.0, 11.4, 2.0], [5.0, 7.0, 0.4], [6.0, 2.0, 0.8], [7.0, -1.0, 2.0]]]), r: 0.22 }),
  M('stapedius', 'facial',
    { en: 'Stapedius', de: 'Steigbügelmuskel', la: 'Musculus stapedius' },
    { en: 'Pyramidal eminence on the posterior wall of the middle ear', de: 'Eminentia pyramidalis an der Hinterwand der Paukenhöhle' },
    { en: 'Neck of the stapes', de: 'Hals des Steigbügels (Stapes)' },
    { en: 'The smallest skeletal muscle: it damps the movement of the stapes in response to loud sounds (stapedius reflex). If the facial nerve is damaged above the branch to stapedius, normal sounds seem painfully loud (hyperacusis) – a clue to the level of the lesion in the facial canal.', de: 'Der kleinste Skelettmuskel: Er dämpft bei lauten Geräuschen die Bewegung des Stapes (Stapediusreflex). Ist der N. facialis oberhalb des Abgangs des N. stapedius geschädigt, erscheinen normale Geräusche schmerzhaft laut (Hyperakusis) – ein Hinweis auf die Höhe der Läsion im Fazialiskanal.' },
    [['n_to_stapedius', VII]],
    ['a_posterior_auricular'], ['temporal_bone'], [],
    { fibers: [[[4.5, 16.8, -2.6], [4.7, 16.9, -2.2]]], r: 0.12 }),

  // ----- muscles of mastication (V3)
  M('masseter', 'mastication',
    { en: 'Masseter', de: 'Kaumuskel (Masseter)', la: 'Musculus masseter' },
    { en: 'Lower border and inner surface of the zygomatic arch', de: 'Unterrand und Innenfläche des Jochbogens' },
    { en: 'Lateral surface of the ramus and angle of the mandible (masseteric tuberosity)', de: 'Außenfläche von Ramus und Angulus mandibulae (Tuberositas masseterica)' },
    { en: 'Elevates the mandible and clenches the teeth with great force; superficial fibres also protrude it. Palpable when clenching. A unilateral V3 lesion leaves a hollow over the ramus when the teeth are clenched.', de: 'Hebt den Unterkiefer und presst die Zähne mit großer Kraft aufeinander; oberflächliche Fasern schieben ihn auch vor. Beim Zusammenbeißen tastbar. Bei einseitiger V3-Läsion bleibt beim Zubeißen eine Mulde über dem Ramus.' },
    [['n_masseteric', V3]],
    ['a_maxillary', 'a_facial'], ['zygomatic_bone', 'temporal_bone'], ['mandible'],
    { fibers: bothFibers([[[4.9, 17.1, 1.8], [5.3, 14.6, 0.9], [5.1, 12.2, -0.1]], [[5.2, 17.0, -0.2], [5.35, 14.8, -0.2], [5.0, 12.6, -0.6]]]), r: 0.55 }),
  M('temporalis', 'mastication',
    { en: 'Temporalis', de: 'Schläfenmuskel', la: 'Musculus temporalis' },
    { en: 'Floor of the temporal fossa and the temporal fascia', de: 'Boden der Fossa temporalis und Fascia temporalis' },
    { en: 'Coronoid process and anterior border of the ramus of the mandible, passing deep to the zygomatic arch', de: 'Processus coronoideus und Vorderrand des Ramus mandibulae, unter dem Jochbogen hindurch' },
    { en: 'Elevates the mandible (anterior fibres) and retracts it (posterior, nearly horizontal fibres); it keeps the mandible in the rest position. Wasting of temporalis and masseter after a V3 lesion hollows the temple.', de: 'Hebt den Unterkiefer (vordere Fasern) und zieht ihn zurück (hintere, fast waagerechte Fasern); hält den Unterkiefer in Ruhelage. Atrophie von Temporalis und Masseter nach V3-Läsion lässt die Schläfe einsinken.' },
    [['n_deep_temporal', V3]],
    ['a_maxillary', 'a_superficial_temporal'], ['temporal_bone', 'parietal_bone', 'frontal_bone', 'sphenoid_bone'], ['mandible'],
    { fibers: bothFibers([
      [vault(60, 25, 0.3), vault(62, 0, 0.3), [4.9, 17.6, 0.9], [4.25, 16.1, 0.9]],
      [vault(85, 28, 0.3), vault(80, 0, 0.3), [5.0, 17.6, 0.3], [4.3, 16.2, 0.7]],
      [vault(110, 20, 0.3), vault(100, -5, 0.3), [5.0, 17.8, -0.4], [4.35, 16.3, 0.5]]]), r: 0.4 }),
  M('medial_pterygoid', 'mastication',
    { en: 'Medial pterygoid', de: 'Innerer Flügelmuskel', la: 'Musculus pterygoideus medialis' },
    { en: 'Medial surface of the lateral pterygoid plate (pterygoid fossa) and the maxillary tuberosity', de: 'Innenfläche der Lamina lateralis des Processus pterygoideus (Fossa pterygoidea) und Tuber maxillae' },
    { en: 'Inner surface of the angle of the mandible (pterygoid tuberosity)', de: 'Innenfläche des Kieferwinkels (Tuberositas pterygoidea)' },
    { en: 'Elevates the mandible; with the masseter it forms a sling around the angle. Acting with the lateral pterygoid of the same side it swings the jaw to the opposite side (grinding).', de: 'Hebt den Unterkiefer; bildet mit dem Masseter eine Muskelschlinge um den Kieferwinkel. Zusammen mit dem gleichseitigen Pterygoideus lateralis schiebt er den Kiefer zur Gegenseite (Mahlbewegung).' },
    [['n_pterygoid', V3]],
    ['a_maxillary'], ['sphenoid_bone', 'maxilla'], ['mandible'],
    { fibers: bothFibers([[[1.6, 16.0, 0.2], [3.0, 14.4, 0.0], [4.2, 12.5, -0.4]], [[1.9, 16.4, 0.6], [3.2, 14.6, 0.3], [4.3, 12.8, -0.2]]]), r: 0.4 }),
  M('lateral_pterygoid', 'mastication',
    { en: 'Lateral pterygoid', de: 'Äußerer Flügelmuskel', la: 'Musculus pterygoideus lateralis' },
    { en: 'Upper head: infratemporal surface of the greater wing of the sphenoid; lower head: lateral surface of the lateral pterygoid plate', de: 'Oberer Kopf: Facies infratemporalis der Ala major; unterer Kopf: Außenfläche der Lamina lateralis des Processus pterygoideus' },
    { en: 'Neck of the mandibular condyle (pterygoid fovea) and the articular disc of the temporomandibular joint', de: 'Collum mandibulae (Fovea pterygoidea) und Discus articularis des Kiefergelenks' },
    { en: 'The only muscle that opens the mouth actively: it pulls the condyle and disc forwards onto the articular tubercle (protrusion), which is needed for wide opening; acting alone it moves the jaw to the opposite side. In a V3 lesion the opened jaw deviates towards the paralysed side.', de: 'Der einzige Kaumuskel, der den Mund aktiv öffnet: Er zieht Kondylus und Diskus nach vorn auf das Tuberculum articulare (Protrusion), was für die weite Mundöffnung nötig ist; einseitig schiebt er den Kiefer zur Gegenseite. Bei V3-Läsion weicht der geöffnete Kiefer zur gelähmten Seite ab.' },
    [['n_pterygoid', V3]],
    ['a_maxillary'], ['sphenoid_bone'], ['mandible'],
    { fibers: bothFibers([[[1.8, 16.0, 0.4], [3.2, 16.0, -0.2], [4.4, 16.0, -0.9]], [[2.6, 17.2, 0.2], [3.6, 16.8, -0.4], [4.5, 16.4, -1.0]]]), r: 0.35 }),

  // ----- suprahyoid muscles
  M('digastric', 'suprahyoid',
    { en: 'Digastric', de: 'Zweibäuchiger Muskel', la: 'Musculus digastricus' },
    { en: 'Posterior belly: mastoid notch of the temporal bone; anterior belly: digastric fossa of the mandible', de: 'Venter posterior: Incisura mastoidea des Schläfenbeins; Venter anterior: Fossa digastrica der Mandibula' },
    { en: 'Intermediate tendon, held to the body and greater horn of the hyoid by a fibrous loop', de: 'Zwischensehne, die durch eine Bindegewebsschlinge am Zungenbeinkörper und großen Horn befestigt ist' },
    { en: 'Opens the mouth (depresses the mandible) when the hyoid is fixed by the infrahyoid muscles, and raises the hyoid in swallowing. Its two bellies come from different pharyngeal arches and so have different nerves: anterior belly from the 1st arch (nerve to mylohyoid, V3), posterior belly from the 2nd arch (facial nerve).', de: 'Öffnet den Mund (senkt den Unterkiefer), wenn das Zungenbein durch die infrahyoidale Muskulatur fixiert ist, und hebt das Zungenbein beim Schlucken. Seine beiden Bäuche stammen aus verschiedenen Schlundbögen und haben daher verschiedene Nerven: Venter anterior aus dem 1. Bogen (N. mylohyoideus, V3), Venter posterior aus dem 2. Bogen (N. facialis).' },
    [['n_mylohyoid', V3, { en: 'anterior belly', de: 'Venter anterior' }], ['n_facial_digastric', VII, { en: 'posterior belly', de: 'Venter posterior' }]],
    ['a_facial', 'a_occipital', 'a_posterior_auricular'], ['temporal_bone', 'mandible'], ['hyoid_bone'],
    { fibers: bothFibers([[[4.3, 14.8, -3.5], [3.2, 11.6, -0.6], [1.8, 9.3, 0.8]], [[1.8, 9.3, 0.8], [1.4, 10.0, 3.4], [0.7, 10.7, 4.8]]]), r: 0.25 }),
  M('stylohyoid', 'suprahyoid',
    { en: 'Stylohyoid', de: 'Griffel-Zungenbein-Muskel', la: 'Musculus stylohyoideus' },
    { en: 'Styloid process of the temporal bone', de: 'Processus styloideus des Schläfenbeins' },
    { en: 'Body of the hyoid, splitting around the intermediate tendon of the digastric', de: 'Zungenbeinkörper; umfasst gespalten die Zwischensehne des M. digastricus' },
    { en: 'Pulls the hyoid upwards and backwards in swallowing. Like the posterior belly of the digastric and stapedius it is a 2nd-arch muscle supplied by the facial nerve, but by a branch given off below the stylomastoid foramen.', de: 'Zieht das Zungenbein beim Schlucken nach oben hinten. Wie der hintere Digastricusbauch und der M. stapedius ein Muskel des 2. Schlundbogens mit Versorgung durch den N. facialis, aber über einen Ast unterhalb des Foramen stylomastoideum.' },
    [['n_facial_digastric', VII]],
    ['a_facial', 'a_occipital'], ['temporal_bone'], ['hyoid_bone'],
    { fibers: bothFibers([[[3.6, 14.0, -2.0], [2.5, 11.4, -0.2], [1.9, 9.1, 0.3]]]), r: 0.18 }),
  M('mylohyoid', 'suprahyoid',
    { en: 'Mylohyoid', de: 'Mundbodenmuskel', la: 'Musculus mylohyoideus' },
    { en: 'Mylohyoid line on the inner surface of the mandible', de: 'Linea mylohyoidea an der Innenfläche der Mandibula' },
    { en: 'Midline raphe (joining the muscle of the other side) and the body of the hyoid', de: 'Raphe in der Mittellinie (Verbindung mit der Gegenseite) und Zungenbeinkörper' },
    { en: 'Forms the muscular floor of the mouth (diaphragma oris), raising it and the tongue in the first phase of swallowing; it also raises the hyoid or depresses the mandible. The submandibular gland wraps around its free posterior border.', de: 'Bildet den muskulären Mundboden (Diaphragma oris) und hebt ihn mit der Zunge in der ersten Schluckphase; hebt außerdem das Zungenbein bzw. senkt den Unterkiefer. Die Glandula submandibularis umgreift seinen freien Hinterrand.' },
    [['n_mylohyoid', V3]],
    ['a_facial', 'a_maxillary'], ['mandible'], ['hyoid_bone'],
    { fibers: bothFibers([[[3.4, 11.6, 2.0], [1.8, 10.4, 2.6], [0, 10.1, 3.0]], [[3.4, 11.8, 0.8], [1.8, 9.6, 1.4], [1.2, 8.9, 1.6]]]), r: 0.25 }),
  M('geniohyoid', 'suprahyoid',
    { en: 'Geniohyoid', de: 'Kinn-Zungenbein-Muskel', la: 'Musculus geniohyoideus' },
    { en: 'Inferior mental spine of the mandible', de: 'Spina mentalis inferior der Mandibula' },
    { en: 'Body of the hyoid', de: 'Zungenbeinkörper' },
    { en: 'Pulls the hyoid forwards and upwards (widening the pharynx in swallowing) or depresses the mandible. It is supplied by C1 fibres that run with the hypoglossal nerve, so a hypoglossal lesion spares it.', de: 'Zieht das Zungenbein nach vorn oben (erweitert beim Schlucken den Rachen) bzw. senkt den Unterkiefer. Versorgt von C1-Fasern, die mit dem N. hypoglossus verlaufen; eine Hypoglossusläsion verschont ihn daher.' },
    [['n_c1_hypoglossal', ['C1']]],
    ['a_lingual'], ['mandible'], ['hyoid_bone'],
    { fibers: bothFibers([[[0.5, 10.9, 4.2], [0.6, 9.9, 3.2], [0.6, 8.9, 2.1]]]), r: 0.25 }),

  // ----- infrahyoid ("strap") muscles
  M('sternohyoid', 'infrahyoid',
    { en: 'Sternohyoid', de: 'Brustbein-Zungenbein-Muskel', la: 'Musculus sternohyoideus' },
    { en: 'Back of the manubrium and the medial end of the clavicle', de: 'Rückfläche des Manubrium sterni und mediales Ende der Clavicula' },
    { en: 'Body of the hyoid', de: 'Zungenbeinkörper' },
    { en: 'Depresses the hyoid after swallowing and fixes it so the suprahyoid muscles can open the mouth. The strap muscles are retracted laterally (or divided high up, to preserve their nerve supply from the ansa below) to reach the thyroid gland.', de: 'Senkt das Zungenbein nach dem Schlucken und fixiert es, damit die suprahyoidalen Muskeln den Mund öffnen können. Bei Schilddrüsenoperationen werden die geraden Halsmuskeln zur Seite gehalten (oder hoch durchtrennt, um ihre von unten kommende Innervation aus der Ansa zu schonen).' },
    [['n_ansa_cervicalis', ANSA_SEGS]],
    ['a_superior_thyroid'], ['sternum', 'clavicle'], ['hyoid_bone'],
    { fibers: bothFibers([[[0.8, 0.2, 1.8], [0.9, 3.4, 1.5], [1.0, 6.0, 2.1], [0.9, 8.6, 2.2]]]), r: 0.3 }),
  M('sternothyroid', 'infrahyoid',
    { en: 'Sternothyroid', de: 'Brustbein-Schildknorpel-Muskel', la: 'Musculus sternothyroideus' },
    { en: 'Back of the manubrium, below the sternohyoid', de: 'Rückfläche des Manubrium sterni, unterhalb des M. sternohyoideus' },
    { en: 'Oblique line of the thyroid cartilage', de: 'Linea obliqua des Schildknorpels' },
    { en: 'Pulls the larynx down after swallowing and in deep inspiration. It lies directly on the thyroid gland, whose upward enlargement it limits.', de: 'Zieht den Kehlkopf nach dem Schlucken und bei tiefer Einatmung nach unten. Liegt der Schilddrüse direkt auf und begrenzt ihre Vergrößerung nach oben.' },
    [['n_ansa_cervicalis', ANSA_SEGS]],
    ['a_superior_thyroid'], ['sternum'], ['larynx'],
    { fibers: bothFibers([[[1.0, 0, 1.4], [1.4, 3.4, 0.8], [1.6, 6.0, 1.0]]]), r: 0.3 }),
  M('omohyoid', 'infrahyoid',
    { en: 'Omohyoid', de: 'Schulterblatt-Zungenbein-Muskel', la: 'Musculus omohyoideus' },
    { en: 'Inferior belly: upper border of the scapula near the suprascapular notch', de: 'Venter inferior: Margo superior der Scapula nahe der Incisura scapulae' },
    { en: 'Superior belly: body of the hyoid; the intermediate tendon is held to the clavicle by a fascial sling', de: 'Venter superior: Zungenbeinkörper; die Zwischensehne wird durch eine Faszienschlinge an der Clavicula gehalten' },
    { en: 'Depresses the hyoid and tenses the pretracheal (middle cervical) fascia, keeping the internal jugular vein, which it crosses, open. It divides the posterior triangle of the neck into occipital and omoclavicular (supraclavicular) triangles.', de: 'Senkt das Zungenbein und spannt die mittlere Halsfaszie (Lamina pretrachealis), wodurch die von ihm überkreuzte V. jugularis interna offen gehalten wird. Teilt das seitliche Halsdreieck in ein Trigonum omotrapezoideum und omoclaviculare.' },
    [['n_ansa_cervicalis', ANSA_SEGS]],
    ['a_superior_thyroid', 'a_suprascapular'], ['scapula'], ['hyoid_bone'],
    { fibers: bothFibers([[[1.2, 8.8, 1.6], [2.4, 6.6, 1.0], [3.4, 4.4, 1.0], [5.8, 2.6, -1.4], [8.4, 1.6, -4.2], [10.4, 1.0, -6.4]]]), r: 0.22 }),
  M('thyrohyoid', 'infrahyoid',
    { en: 'Thyrohyoid', de: 'Schildknorpel-Zungenbein-Muskel', la: 'Musculus thyrohyoideus' },
    { en: 'Oblique line of the thyroid cartilage', de: 'Linea obliqua des Schildknorpels' },
    { en: 'Body and greater horn of the hyoid', de: 'Körper und großes Horn des Zungenbeins' },
    { en: 'Depresses the hyoid, or raises the larynx towards the hyoid when the hyoid is fixed (closing the laryngeal inlet in swallowing). Unlike the other strap muscles it is supplied by C1 fibres travelling with the hypoglossal nerve, not by the ansa.', de: 'Senkt das Zungenbein oder hebt bei fixiertem Zungenbein den Kehlkopf zu ihm hin (Verschluss des Kehlkopfeingangs beim Schlucken). Anders als die übrigen geraden Halsmuskeln wird er von C1-Fasern versorgt, die mit dem N. hypoglossus ziehen, nicht von der Ansa.' },
    [['n_c1_hypoglossal', ['C1']]],
    ['a_superior_thyroid'], ['larynx'], ['hyoid_bone'],
    { fibers: bothFibers([[[1.6, 6.2, 1.1], [1.7, 7.5, 1.3], [1.6, 8.8, 1.2]]]), r: 0.25 }),

  // ----- lateral neck muscles
  M('sternocleidomastoid', 'neck',
    { en: 'Sternocleidomastoid', de: 'Kopfwender', la: 'Musculus sternocleidomastoideus' },
    { en: 'Sternal head: front of the manubrium; clavicular head: medial third of the clavicle', de: 'Caput sternale: Vorderfläche des Manubrium; Caput claviculare: mediales Drittel der Clavicula' },
    { en: 'Mastoid process and lateral part of the superior nuchal line', de: 'Processus mastoideus und lateraler Teil der Linea nuchalis superior' },
    { en: 'One side tilts the head to the same side and turns the face to the opposite side; both together flex the neck and extend the head, and act as accessory muscles of inspiration. It divides the neck into anterior and posterior triangles; the carotid sheath lies under its anterior border, and the cervical plexus cutaneous nerves emerge at Erb\'s point behind its middle. A short muscle from birth injury causes torticollis. Its motor supply is the accessory nerve (CN XI); C2–C3 bring proprioceptive fibres.', de: 'Einseitig neigt er den Kopf zur gleichen Seite und dreht das Gesicht zur Gegenseite; beidseitig beugt er die Halswirbelsäule, streckt den Kopf und wirkt als Atemhilfsmuskel. Er teilt den Hals in vorderes und seitliches Halsdreieck; unter seinem Vorderrand liegt die Gefäß-Nerven-Scheide (Vagina carotica), hinter seiner Mitte treten am Punctum nervosum (Erb-Punkt) die Hautäste des Plexus cervicalis aus. Eine Verkürzung, z. B. nach Geburtsverletzung, führt zum Schiefhals (Torticollis). Motorisch versorgt ihn der N. accessorius (N. XI); C2–C3 führen propriozeptive Fasern.' },
    [['n_accessory', ['CN XI']]],
    ['a_occipital', 'a_superior_thyroid'], ['sternum', 'clavicle'], ['temporal_bone', 'occipital_bone'],
    { fibers: bothFibers([[[0.9, 0.4, 2.6], [2.6, 4.6, 2.0], [4.0, 9.0, 0.6], [4.9, 12.8, -1.6], [4.7, 15.0, -3.6]], [[3.4, 0.8, 3.0], [4.0, 4.6, 1.6], [4.6, 9.0, 0], [5.0, 12.8, -1.9], [4.8, 15.0, -3.9]]]), r: 0.55 }),
  M('scalenus_anterior', 'neck',
    { en: 'Scalenus anterior', de: 'Vorderer Treppenmuskel', la: 'Musculus scalenus anterior' },
    { en: 'Anterior tubercles of the transverse processes C3–C6', de: 'Tubercula anteriora der Querfortsätze C3–C6' },
    { en: 'Scalene tubercle of the 1st rib', de: 'Tuberculum musculi scaleni anterioris der 1. Rippe' },
    { en: 'Raises the 1st rib (inspiration) and bends the neck to the same side. Key landmark: the phrenic nerve runs down on its front, the subclavian vein passes in front of it, and the subclavian artery and brachial plexus pass behind it through the scalene gap between it and scalenus medius – where they can be compressed (thoracic outlet syndrome, cervical rib).', de: 'Hebt die 1. Rippe (Einatmung) und neigt den Hals zur gleichen Seite. Wichtige Landmarke: Der N. phrenicus zieht auf seiner Vorderfläche abwärts, die V. subclavia vor ihm vorbei, A. subclavia und Plexus brachialis hinter ihm durch die Skalenuslücke zwischen ihm und dem M. scalenus medius – wo sie eingeengt werden können (Thoracic-outlet-Syndrom, Halsrippe).' },
    [['n_cervical_ventral_rami', segs('C4', 'C6')]],
    ['a_thyrocervical_trunk', 'a_vertebral'], ['cervical_vertebrae'], ['ribs'],
    { fibers: bothFibers([[[2.5, 8.0, -3.0], [3.0, 6.0, -2.2], [3.7, 3.6, -0.9], [4.3, 1.0, 0.9]]]), r: 0.4 }),
  M('scalenus_medius', 'neck',
    { en: 'Scalenus medius', de: 'Mittlerer Treppenmuskel', la: 'Musculus scalenus medius' },
    { en: 'Posterior tubercles of the transverse processes C2–C7', de: 'Tubercula posteriora der Querfortsätze C2–C7' },
    { en: 'Upper surface of the 1st rib behind the groove for the subclavian artery', de: 'Oberfläche der 1. Rippe hinter dem Sulcus arteriae subclaviae' },
    { en: 'Raises the 1st rib and bends the neck sideways. It forms the posterior boundary of the scalene gap; the dorsal scapular and long thoracic nerves pierce it.', de: 'Hebt die 1. Rippe und neigt den Hals zur Seite. Bildet die hintere Begrenzung der Skalenuslücke; N. dorsalis scapulae und N. thoracicus longus durchbohren ihn.' },
    [['n_cervical_ventral_rami', segs('C3', 'C8')]],
    ['a_thyrocervical_trunk', 'a_vertebral'], ['cervical_vertebrae'], ['ribs'],
    { fibers: bothFibers([[[2.6, 10.2, -3.8], [3.6, 6, -3.4], [4.8, 2.6, -2.2], [5.4, 0.6, -1.0]]]), r: 0.45 }),
  M('scalenus_posterior', 'neck',
    { en: 'Scalenus posterior', de: 'Hinterer Treppenmuskel', la: 'Musculus scalenus posterior' },
    { en: 'Posterior tubercles of the transverse processes C5–C7', de: 'Tubercula posteriora der Querfortsätze C5–C7' },
    { en: 'Outer surface of the 2nd rib', de: 'Außenfläche der 2. Rippe' },
    { en: 'Raises the 2nd rib and bends the neck to the same side; an accessory muscle of inspiration.', de: 'Hebt die 2. Rippe und neigt den Hals zur gleichen Seite; Atemhilfsmuskel.' },
    [['n_cervical_ventral_rami', segs('C6', 'C8')]],
    ['a_thyrocervical_trunk'], ['cervical_vertebrae'], ['ribs'],
    { fibers: bothFibers([[[2.8, 4.8, -4.2], [4.4, 2.0, -4.0], [5.6, -0.6, -3.6]]]), r: 0.35 }),

  // ----- tongue (CN XII, except palatoglossus)
  M('genioglossus', 'tongue',
    { en: 'Genioglossus', de: 'Kinn-Zungen-Muskel', la: 'Musculus genioglossus' },
    { en: 'Superior mental spine on the inner surface of the mandible', de: 'Spina mentalis superior an der Innenfläche der Mandibula' },
    { en: 'Fans out into the whole underside of the tongue from tip to root, and the body of the hyoid', de: 'Strahlt fächerförmig von der Spitze bis zur Wurzel in die gesamte Unterfläche der Zunge und in den Zungenbeinkörper ein' },
    { en: 'Protrudes the tongue (posterior fibres pull the root forwards) and keeps it from falling back against the posterior pharyngeal wall – which is why the airway obstructs in unconsciousness, when it relaxes. In a hypoglossal lesion the intact genioglossus of the healthy side pushes the protruded tongue towards the paralysed side.', de: 'Streckt die Zunge heraus (hintere Fasern ziehen die Zungenwurzel nach vorn) und verhindert, dass sie gegen die Rachenhinterwand zurückfällt – deshalb verlegt die erschlaffte Zunge beim Bewusstlosen die Atemwege. Bei Hypoglossusläsion schiebt der intakte Genioglossus der gesunden Seite die herausgestreckte Zunge zur gelähmten Seite.' },
    [['n_hypoglossal', XII]],
    ['a_lingual'], ['mandible'], ['hyoid_bone'],
    { fibers: bothFibers([[0.4, 13.5, 3.6], [0.4, 13.6, 2.0], [0.4, 12.8, 0.6], [0.4, 9.1, 1.9]].map(end => [[0.4, 11.1, 4.2], [0.4, (11.1 + end[1]) / 2 + 0.3, (4.2 + end[2]) / 2], end])), r: 0.25 }),
  M('hyoglossus', 'tongue',
    { en: 'Hyoglossus', de: 'Zungenbein-Zungen-Muskel', la: 'Musculus hyoglossus' },
    { en: 'Body and greater horn of the hyoid', de: 'Körper und großes Horn des Zungenbeins' },
    { en: 'Side and underside of the tongue', de: 'Seitenrand und Unterfläche der Zunge' },
    { en: 'Depresses and retracts the tongue. A landmark of the floor of the mouth: the hypoglossal nerve, the submandibular duct and the lingual nerve lie on its outer surface, while the lingual artery runs deep to it.', de: 'Senkt die Zunge und zieht sie zurück. Landmarke des Mundbodens: N. hypoglossus, Ductus submandibularis und N. lingualis liegen auf seiner Außenfläche, die A. lingualis verläuft medial von ihm.' },
    [['n_hypoglossal', XII]],
    ['a_lingual'], ['hyoid_bone'], [],
    { fibers: bothFibers([[[1.6, 9.2, 0.6], [1.4, 10.8, 1.2], [1.2, 12.2, 1.6]], [[1.2, 9.0, 1.2], [1.2, 10.8, 1.8], [1.1, 12.4, 2.4]]]), r: 0.25 }),
  M('styloglossus', 'tongue',
    { en: 'Styloglossus', de: 'Griffel-Zungen-Muskel', la: 'Musculus styloglossus' },
    { en: 'Styloid process of the temporal bone and the stylomandibular ligament', de: 'Processus styloideus des Schläfenbeins und Lig. stylomandibulare' },
    { en: 'Side of the tongue, blending with hyoglossus and the longitudinal muscles', de: 'Seitenrand der Zunge, verflochten mit M. hyoglossus und den Längsmuskeln' },
    { en: 'Pulls the tongue upwards and backwards, pressing it against the soft palate to push a bolus into the pharynx.', de: 'Zieht die Zunge nach oben hinten und drückt sie gegen den weichen Gaumen, um den Bissen in den Rachen zu schieben.' },
    [['n_hypoglossal', XII]],
    ['a_lingual'], ['temporal_bone'], [],
    { fibers: bothFibers([[[3.4, 13.6, -1.8], [2.6, 12.6, 0], [1.4, 12.5, 1.6], [1.0, 12.6, 3.4]]]), r: 0.22 }),
  M('intrinsic_tongue', 'tongue',
    { en: 'Intrinsic muscles of the tongue', de: 'Binnenmuskeln der Zunge', la: 'Musculi linguae intrinseci (longitudinalis superior et inferior, transversus, verticalis)' },
    { en: 'Within the tongue: the median septum and the submucous connective tissue', de: 'Innerhalb der Zunge: Septum linguae und submuköses Bindegewebe (Aponeurosis linguae)' },
    { en: 'Mucosa and connective tissue of the tongue', de: 'Schleimhaut und Bindegewebe der Zunge' },
    { en: 'Longitudinal, transverse and vertical fibres change the shape of the tongue (shorten, curl, narrow, flatten) for speech, chewing and swallowing, while the extrinsic muscles move it as a whole. After a hypoglossal lesion the paralysed half wastes and shows fasciculations (lower motor neuron sign).', de: 'Längs-, Quer- und Senkrechtfasern verändern die Form der Zunge (verkürzen, einrollen, verschmälern, abflachen) beim Sprechen, Kauen und Schlucken, während die Außenmuskeln die ganze Zunge bewegen. Nach einer Hypoglossusläsion atrophiert die gelähmte Hälfte und zeigt Faszikulationen (Zeichen des peripheren Motoneurons).' },
    [['n_hypoglossal', XII]],
    ['a_lingual'], [], [],
    { fibers: [
      ...bothFibers([[[0.6, 13.4, 4.4], [0.6, 13.5, 2.6], [0.6, 13.2, 0.8]], [[0.6, 12.4, 4.2], [0.6, 12.3, 2.6], [0.6, 12.2, 1.0]]]),
      [[-1.2, 12.8, 3.4], [0, 12.9, 3.4], [1.2, 12.8, 3.4]], [[-1.2, 12.8, 2.0], [0, 12.9, 2.0], [1.2, 12.8, 2.0]],
      [[0, 13.5, 3.2], [0, 12.2, 3.2]], [[0, 13.5, 1.6], [0, 12.2, 1.6]]], r: 0.18 }),
  M('palatoglossus', 'tongue',
    { en: 'Palatoglossus', de: 'Gaumen-Zungen-Muskel', la: 'Musculus palatoglossus' },
    { en: 'Palatine aponeurosis of the soft palate', de: 'Aponeurosis palatina des weichen Gaumens' },
    { en: 'Side of the tongue', de: 'Seitenrand der Zunge' },
    { en: 'Raises the back of the tongue and narrows the oropharyngeal isthmus (it forms the palatoglossal arch, in front of the tonsil). The only tongue muscle not supplied by the hypoglossal nerve: as a palatal muscle it comes from the pharyngeal plexus (CN X).', de: 'Hebt den Zungenrücken und verengt den Isthmus faucium (bildet den Arcus palatoglossus vor der Tonsille). Der einzige Zungenmuskel ohne Versorgung durch den N. hypoglossus: Als Gaumenmuskel wird er über den Plexus pharyngeus (N. X) innerviert.' },
    [['n_pharyngeal_plexus', X]],
    ['a_ascending_pharyngeal', 'a_facial'], [], [],
    { fibers: bothFibers([[[0.6, 14.2, 0.4], [1.0, 13.4, 0.6], [1.2, 12.8, 1.2]]]), r: 0.18 }),

  // ----- pharynx and soft palate
  M('superior_constrictor', 'pharynx',
    { en: 'Superior pharyngeal constrictor', de: 'Oberer Schlundschnürer', la: 'Musculus constrictor pharyngis superior' },
    { en: 'Medial pterygoid plate (hamulus), pterygomandibular raphe, mylohyoid line of the mandible and side of the tongue', de: 'Lamina medialis des Processus pterygoideus (Hamulus), Raphe pterygomandibularis, Linea mylohyoidea und Zungenrand' },
    { en: 'Pharyngeal raphe and pharyngeal tubercle of the occipital bone', de: 'Raphe pharyngis und Tuberculum pharyngeum des Hinterhauptsbeins' },
    { en: 'Constricts the upper pharynx in swallowing and, with the soft palate, closes off the nasopharynx (Passavant\'s ridge).', de: 'Verengt beim Schlucken den oberen Rachen und schließt mit dem Gaumensegel den Nasenrachen ab (Passavant-Ringwulst).' },
    [['n_pharyngeal_plexus', X]],
    ['a_ascending_pharyngeal', 'a_facial'], ['sphenoid_bone', 'mandible'], ['occipital_bone'],
    { fibers: bothFibers([constrictor(14.2, 14.8, -1.0, 1.1), constrictor(13.4, 14.0, -1.1, 1.15)]), r: 0.2 }),
  M('middle_constrictor', 'pharynx',
    { en: 'Middle pharyngeal constrictor', de: 'Mittlerer Schlundschnürer', la: 'Musculus constrictor pharyngis medius' },
    { en: 'Greater and lesser horns of the hyoid and the stylohyoid ligament', de: 'Großes und kleines Zungenbeinhorn und Lig. stylohyoideum' },
    { en: 'Pharyngeal raphe', de: 'Raphe pharyngis' },
    { en: 'Constricts the oropharynx, propelling the bolus downwards.', de: 'Verengt den Mundrachen und treibt den Bissen abwärts.' },
    [['n_pharyngeal_plexus', X]],
    ['a_ascending_pharyngeal', 'a_facial'], ['hyoid_bone'], [],
    { fibers: bothFibers([constrictor(9.4, 11.6, -1.2, 1.4), constrictor(9.6, 12.4, -1.2, 1.35)]), r: 0.22 }),
  M('inferior_constrictor', 'pharynx',
    { en: 'Inferior pharyngeal constrictor', de: 'Unterer Schlundschnürer', la: 'Musculus constrictor pharyngis inferior' },
    { en: 'Thyropharyngeal part: oblique line of the thyroid cartilage; cricopharyngeal part: side of the cricoid cartilage', de: 'Pars thyropharyngea: Linea obliqua des Schildknorpels; Pars cricopharyngea: Seitenfläche des Ringknorpels' },
    { en: 'Pharyngeal raphe; the cricopharyngeal fibres form a ring around the start of the oesophagus', de: 'Raphe pharyngis; die Fasern der Pars cricopharyngea bilden einen Ring um den Anfang des Ösophagus' },
    { en: 'The thyropharyngeal part propels the bolus; the cricopharyngeal part is the upper oesophageal sphincter, closed at rest and relaxing in swallowing. Between the two parts lies a weak triangle (Killian\'s) through which a Zenker diverticulum bulges. The cricopharyngeal part is supplied by the recurrent (inferior) laryngeal nerve, the rest by the pharyngeal plexus and the external laryngeal nerve.', de: 'Die Pars thyropharyngea treibt den Bissen weiter; die Pars cricopharyngea ist der obere Ösophagussphinkter, in Ruhe geschlossen und beim Schlucken erschlafft. Zwischen beiden Teilen liegt eine Schwachstelle (Killian-Dreieck), durch die sich ein Zenker-Divertikel vorwölbt. Die Pars cricopharyngea wird vom N. laryngeus recurrens (inferior), der Rest vom Plexus pharyngeus und dem R. externus des N. laryngeus superior versorgt.' },
    [['n_pharyngeal_plexus', X], ['n_external_laryngeal', X], ['n_inferior_laryngeal', X, { en: 'cricopharyngeal part', de: 'Pars cricopharyngea' }]],
    ['a_superior_thyroid', 'a_inferior_thyroid'], ['larynx'], [],
    { fibers: bothFibers([constrictor(6.2, 8.6, -1.4, 1.2), constrictor(6.8, 9.2, -1.3, 1.25), [[0.85, 5.2, -0.9], [0.7, 5.2, -1.6], [0.3, 5.2, -2.2], [0, 5.2, -2.3]]]), r: 0.22 }),
  M('stylopharyngeus', 'pharynx',
    { en: 'Stylopharyngeus', de: 'Griffel-Schlund-Muskel', la: 'Musculus stylopharyngeus' },
    { en: 'Medial side of the styloid process', de: 'Innenseite des Processus styloideus' },
    { en: 'Posterior border of the thyroid cartilage and the pharyngeal wall, passing between the superior and middle constrictors', de: 'Hinterrand des Schildknorpels und Rachenwand; tritt zwischen oberem und mittlerem Schlundschnürer hindurch' },
    { en: 'Raises and widens the pharynx and larynx in swallowing and speech. It is the only muscle supplied by the glossopharyngeal nerve (CN IX), the nerve of the 3rd pharyngeal arch, which winds around it.', de: 'Hebt und erweitert Rachen und Kehlkopf beim Schlucken und Sprechen. Der einzige Muskel, den der N. glossopharyngeus (N. IX) versorgt – der Nerv des 3. Schlundbogens, der sich um ihn herumwindet.' },
    [['n_glossopharyngeal', ['CN IX']]],
    ['a_ascending_pharyngeal'], ['temporal_bone'], ['larynx'],
    { fibers: bothFibers([[[3.4, 13.8, -2.0], [2.0, 11.0, -1.0], [1.0, 8.2, -1.0]]]), r: 0.2 }),
  M('levator_veli_palatini', 'pharynx',
    { en: 'Levator veli palatini', de: 'Gaumensegelheber', la: 'Musculus levator veli palatini' },
    { en: 'Petrous part of the temporal bone and the cartilage of the auditory (Eustachian) tube', de: 'Unterfläche der Felsenbeinpyramide und Knorpel der Ohrtrompete (Tuba auditiva)' },
    { en: 'Palatine aponeurosis of the soft palate, meeting the muscle of the other side', de: 'Aponeurosis palatina des weichen Gaumens, vereinigt mit der Gegenseite' },
    { en: 'Raises the soft palate to close the nasopharynx when swallowing and speaking ("ah"). In a vagus lesion the palate does not rise on the affected side and the uvula is pulled towards the healthy side; speech becomes nasal and fluids regurgitate through the nose.', de: 'Hebt das Gaumensegel und verschließt so beim Schlucken und Sprechen den Nasenrachen ("Ah"). Bei Vagusläsion hebt sich das Gaumensegel auf der betroffenen Seite nicht, die Uvula wird zur gesunden Seite gezogen ("Kulissenphänomen"); die Sprache wird näselnd, Flüssigkeit tritt durch die Nase aus.' },
    [['n_pharyngeal_plexus', X]],
    ['a_ascending_pharyngeal', 'a_facial'], ['temporal_bone'], [],
    { fibers: bothFibers([[[1.9, 16.6, -1.6], [1.2, 15.4, -0.4], [0.4, 14.3, 0]]]), r: 0.22 }),

  // ----- larynx (CN X)
  M('cricothyroid', 'larynx',
    { en: 'Cricothyroid', de: 'Ring-Schildknorpel-Muskel (Anticus)', la: 'Musculus cricothyroideus' },
    { en: 'Anterolateral surface of the arch of the cricoid cartilage', de: 'Vorderseitenfläche des Ringknorpelbogens' },
    { en: 'Inferior border and inferior horn of the thyroid cartilage', de: 'Unterrand und Cornu inferius des Schildknorpels' },
    { en: 'Tilts the thyroid cartilage forwards on the cricoid, lengthening and tensing the vocal folds (raising pitch). The only laryngeal muscle on the outside of the larynx and the only one supplied by the external laryngeal nerve; this nerve runs with the superior thyroid artery and is at risk when the artery is ligated (a weak, monotonous voice that cannot reach high notes).', de: 'Kippt den Schildknorpel auf dem Ringknorpel nach vorn und verlängert und spannt so die Stimmlippen (höhere Tonlage). Der einzige außen am Kehlkopf liegende Kehlkopfmuskel und der einzige, den der R. externus des N. laryngeus superior versorgt; dieser verläuft mit der A. thyroidea superior und ist bei deren Unterbindung gefährdet (schwache, monotone Stimme ohne hohe Töne).' },
    [['n_external_laryngeal', X]],
    ['a_superior_thyroid'], ['larynx'], ['larynx'],
    { fibers: bothFibers([[[0.4, 5.3, 0.75], [1.0, 5.8, 0.8], [1.4, 6.2, 0.4]], [[0.6, 5.2, 0.6], [1.2, 5.6, 0.5], [1.5, 5.9, 0.1]]]), r: 0.2 }),
  M('posterior_cricoarytenoid', 'larynx',
    { en: 'Posterior cricoarytenoid', de: 'Hinterer Ring-Stellknorpel-Muskel (Postikus)', la: 'Musculus cricoarytenoideus posterior' },
    { en: 'Posterior surface of the lamina of the cricoid cartilage', de: 'Hinterfläche der Ringknorpelplatte' },
    { en: 'Muscular process of the arytenoid cartilage', de: 'Processus muscularis des Stellknorpels' },
    { en: 'The only muscle that opens the glottis (abducts the vocal folds) – essential for breathing. A bilateral recurrent laryngeal nerve palsy (after thyroid surgery) leaves both vocal folds near the midline with inspiratory stridor and shortness of breath, which may need a tracheotomy; a unilateral palsy causes hoarseness.', de: 'Der einzige Muskel, der die Stimmritze öffnet (die Stimmlippen abduziert) – lebenswichtig für die Atmung. Bei beidseitiger Rekurrensparese (nach Schilddrüsenoperation) stehen beide Stimmlippen nahe der Mittellinie: inspiratorischer Stridor und Atemnot, ggf. Tracheotomie; eine einseitige Parese verursacht Heiserkeit.' },
    [['n_inferior_laryngeal', X]],
    ['a_superior_thyroid', 'a_inferior_thyroid'], ['larynx'], ['larynx'],
    { fibers: bothFibers([[[0.3, 5.6, -0.9], [0.7, 6.1, -0.8], [0.9, 6.6, -0.5]]]), r: 0.18 }),
  M('lateral_cricoarytenoid', 'larynx',
    { en: 'Lateral cricoarytenoid', de: 'Seitlicher Ring-Stellknorpel-Muskel (Lateralis)', la: 'Musculus cricoarytenoideus lateralis' },
    { en: 'Upper border of the arch of the cricoid cartilage', de: 'Oberrand des Ringknorpelbogens' },
    { en: 'Muscular process of the arytenoid cartilage', de: 'Processus muscularis des Stellknorpels' },
    { en: 'Rotates the arytenoid inwards and adducts the vocal folds (closing the glottis for speech), together with the transverse and oblique arytenoids; it is the antagonist of the posterior cricoarytenoid.', de: 'Dreht den Stellknorpel nach innen und adduziert die Stimmlippen (Schluss der Stimmritze zur Phonation), zusammen mit den Mm. arytenoidei transversus und obliquus; Gegenspieler des M. cricoarytenoideus posterior.' },
    [['n_inferior_laryngeal', X]],
    ['a_superior_thyroid', 'a_inferior_thyroid'], ['larynx'], ['larynx'],
    { fibers: bothFibers([[[1.0, 5.5, 0.3], [0.9, 6.2, -0.2], [0.8, 6.6, -0.5]]]), r: 0.16 }),
  M('vocalis', 'larynx',
    { en: 'Vocalis (thyroarytenoid)', de: 'Stimmmuskel (M. vocalis, M. thyroarytenoideus)', la: 'Musculus vocalis (pars musculi thyroarytenoidei)' },
    { en: 'Inner surface of the thyroid cartilage near the midline', de: 'Innenfläche des Schildknorpels nahe der Mittellinie' },
    { en: 'Vocal process of the arytenoid cartilage, lying in the vocal fold beside the vocal ligament', de: 'Processus vocalis des Stellknorpels; liegt in der Stimmlippe neben dem Lig. vocale' },
    { en: 'Fine-tunes the tension and thickness of the vocal folds, controlling pitch and voice quality. With all other intrinsic laryngeal muscles except cricothyroid it is supplied by the recurrent (inferior) laryngeal nerve.', de: 'Regelt Spannung und Dicke der Stimmlippen fein und steuert so Tonhöhe und Stimmqualität. Wie alle inneren Kehlkopfmuskeln außer dem M. cricothyroideus wird er vom N. laryngeus recurrens (inferior) versorgt.' },
    [['n_inferior_laryngeal', X]],
    ['a_superior_thyroid', 'a_inferior_thyroid'], ['larynx'], ['larynx'],
    { fibers: bothFibers([[[0.15, 6.6, 1.4], [0.35, 6.6, 0.5], [0.5, 6.6, -0.3]]]), r: 0.15 }),

  // ----- extraocular muscles
  M('superior_rectus', 'eye',
    { en: 'Superior rectus', de: 'Oberer gerader Augenmuskel', la: 'Musculus rectus superior' },
    { en: 'Common tendinous ring (anulus of Zinn) at the orbital apex', de: 'Anulus tendineus communis (Zinn-Sehnenring) an der Orbitaspitze' },
    { en: 'Sclera, above and in front of the equator', de: 'Sklera, oben vor dem Äquator' },
    { en: 'Elevates the eye (best when it is abducted), with some adduction and intorsion. Clinically tested by asking the patient to look up and out.', de: 'Hebt das Auge (am stärksten in Abduktion), daneben Adduktion und Innenrollung. Klinisch geprüft durch Blick nach oben außen.' },
    [['n_oculomotor', III]],
    ['a_ophthalmic'], ['sphenoid_bone'], [],
    { fibers: bothFibers([[[1.4, 19.8, 0.9], [2.0, 20.5, 2.6], [2.4, 20.62, 4.3]]]), r: 0.18 }),
  M('inferior_rectus', 'eye',
    { en: 'Inferior rectus', de: 'Unterer gerader Augenmuskel', la: 'Musculus rectus inferior' },
    { en: 'Common tendinous ring', de: 'Anulus tendineus communis' },
    { en: 'Sclera, below and in front of the equator', de: 'Sklera, unten vor dem Äquator' },
    { en: 'Depresses the eye (best in abduction), with adduction and extorsion. Can be trapped in a blow-out fracture of the orbital floor, so the eye cannot look up (double vision).', de: 'Senkt das Auge (am stärksten in Abduktion), daneben Adduktion und Außenrollung. Kann bei einer Blow-out-Fraktur des Orbitabodens eingeklemmt werden, sodass der Blick nach oben unmöglich ist (Doppelbilder).' },
    [['n_oculomotor', III]],
    ['a_ophthalmic'], ['sphenoid_bone'], [],
    { fibers: bothFibers([[[1.4, 19.2, 0.9], [2.0, 18.7, 2.6], [2.4, 18.58, 4.3]]]), r: 0.18 }),
  M('medial_rectus', 'eye',
    { en: 'Medial rectus', de: 'Innerer gerader Augenmuskel', la: 'Musculus rectus medialis' },
    { en: 'Common tendinous ring', de: 'Anulus tendineus communis' },
    { en: 'Sclera, medial side in front of the equator', de: 'Sklera, medial vor dem Äquator' },
    { en: 'Adducts the eye (turns it towards the nose); both medial recti converge for near vision.', de: 'Adduziert das Auge (dreht es zur Nase); beide Mm. recti mediales konvergieren beim Nahsehen.' },
    [['n_oculomotor', III]],
    ['a_ophthalmic'], ['sphenoid_bone'], [],
    { fibers: bothFibers([[[1.2, 19.5, 0.9], [1.4, 19.5, 2.6], [1.38, 19.6, 4.35]]]), r: 0.18 }),
  M('lateral_rectus', 'eye',
    { en: 'Lateral rectus', de: 'Äußerer gerader Augenmuskel', la: 'Musculus rectus lateralis' },
    { en: 'Common tendinous ring, bridging the superior orbital fissure', de: 'Anulus tendineus communis, über die Fissura orbitalis superior hinweg' },
    { en: 'Sclera, lateral side in front of the equator', de: 'Sklera, lateral vor dem Äquator' },
    { en: 'Abducts the eye. It is the only muscle supplied by the abducens nerve (CN VI) – "LR6 SO4, the rest 3". In an abducens palsy the eye turns inwards (convergent squint) and the patient sees double side by side, worse when looking to the affected side.', de: 'Abduziert das Auge. Der einzige Muskel des N. abducens (N. VI) – Merkspruch "LR6 SO4, Rest 3". Bei Abduzensparese steht das Auge nach innen (Einwärtsschielen), es entstehen nebeneinanderliegende Doppelbilder, die beim Blick zur kranken Seite zunehmen.' },
    [['n_abducens', ['CN VI']]],
    ['a_ophthalmic'], ['sphenoid_bone'], [],
    { fibers: bothFibers([[[1.6, 19.5, 0.9], [2.9, 19.5, 2.4], [3.43, 19.6, 4.25]]]), r: 0.18 }),
  M('levator_palpebrae', 'eye',
    { en: 'Levator palpebrae superioris', de: 'Oberlidheber', la: 'Musculus levator palpebrae superioris' },
    { en: 'Lesser wing of the sphenoid above the optic canal', de: 'Ala minor des Keilbeins oberhalb des Canalis opticus' },
    { en: 'Skin and tarsal plate of the upper eyelid', de: 'Haut und Tarsus des Oberlids' },
    { en: 'Raises the upper eyelid. Paralysis in an oculomotor palsy causes a complete ptosis; the smooth superior tarsal muscle on its underside (sympathetic) only adds 1–2 mm, so Horner syndrome gives a mild ptosis.', de: 'Hebt das Oberlid. Bei Okulomotoriusparese entsteht eine vollständige Ptosis; der glatte M. tarsalis superior an seiner Unterseite (sympathisch) trägt nur 1–2 mm bei, daher ist die Ptosis beim Horner-Syndrom gering.' },
    [['n_oculomotor', III]],
    ['a_ophthalmic'], ['sphenoid_bone'], [],
    { fibers: bothFibers([[[1.4, 20.0, 1.0], [2.2, 20.85, 2.8], [2.4, 20.75, 4.6], [2.4, 20.4, 5.2]]]), r: 0.15 }),
  M('superior_oblique', 'eye',
    { en: 'Superior oblique', de: 'Oberer schräger Augenmuskel', la: 'Musculus obliquus superior' },
    { en: 'Body of the sphenoid above the common tendinous ring; its tendon runs through the trochlea, a fibrocartilaginous pulley at the upper medial orbital margin', de: 'Keilbeinkörper oberhalb des Anulus tendineus; die Sehne läuft durch die Trochlea, eine faserknorpelige Rolle am oberen medialen Orbitarand' },
    { en: 'Sclera, behind the equator in the upper lateral quadrant', de: 'Sklera, hinter dem Äquator im oberen äußeren Quadranten' },
    { en: 'Depresses the eye (best when it is adducted, e.g. looking down to read or walk downstairs), abducts and intorts it. The only muscle of the trochlear nerve (CN IV): in a trochlear palsy patients have vertical double vision going downstairs and tilt the head to the healthy side.', de: 'Senkt das Auge (am stärksten in Adduktion, z. B. beim Lesen oder Treppabgehen), abduziert und rollt es nach innen. Einziger Muskel des N. trochlearis (N. IV): Bei Trochlearisparese entstehen beim Treppabgehen übereinanderliegende Doppelbilder, der Kopf wird zur gesunden Seite geneigt.' },
    [['n_trochlear', ['CN IV']]],
    ['a_ophthalmic'], ['sphenoid_bone'], [],
    { fibers: bothFibers([[[1.2, 19.9, 1.0], [1.4, 20.4, 3.4], TROCHLEA, [2.7, 20.45, 3.4]]]), r: 0.15 }),
  M('inferior_oblique', 'eye',
    { en: 'Inferior oblique', de: 'Unterer schräger Augenmuskel', la: 'Musculus obliquus inferior' },
    { en: 'Floor of the orbit near the medial margin (orbital surface of the maxilla) – the only extraocular muscle not arising at the apex', de: 'Orbitaboden nahe dem medialen Rand (Facies orbitalis der Maxilla) – der einzige äußere Augenmuskel, der nicht an der Orbitaspitze entspringt' },
    { en: 'Sclera, behind the equator in the lower lateral quadrant', de: 'Sklera, hinter dem Äquator im unteren äußeren Quadranten' },
    { en: 'Elevates the eye (best in adduction), abducts and extorts it.', de: 'Hebt das Auge (am stärksten in Adduktion), abduziert und rollt es nach außen.' },
    [['n_oculomotor', III]],
    ['a_ophthalmic'], ['maxilla'], [],
    { fibers: bothFibers([[[1.4, 18.7, 4.8], [2.4, 18.5, 3.9], [3.1, 18.9, 3.4]]]), r: 0.15 }),
  M('superior_tarsal', 'eye',
    { en: 'Superior tarsal muscle (Müller\'s muscle)', de: 'Oberer Lidplattenmuskel (Müller-Muskel)', la: 'Musculus tarsalis superior' },
    { en: 'Underside of the levator palpebrae superioris', de: 'Unterseite des M. levator palpebrae superioris' },
    { en: 'Upper border of the superior tarsal plate', de: 'Oberrand des Tarsus superior' },
    { en: 'Smooth muscle that keeps the upper lid raised by 1–2 mm, more so in alertness and fright. Its sympathetic supply comes from T1 via the cervical sympathetic trunk and the plexus around the internal carotid artery; interruption anywhere (Pancoast tumour, carotid dissection, cervical trunk injury) causes Horner syndrome: mild ptosis, a small pupil (miosis) and, if the lesion is proximal, loss of facial sweating.', de: 'Glatter Muskel, der das Oberlid um 1–2 mm zusätzlich anhebt, besonders bei Aufmerksamkeit und Schreck. Seine sympathische Versorgung kommt aus Th1 über den Halsgrenzstrang und das Geflecht um die A. carotis interna; eine Unterbrechung an beliebiger Stelle (Pancoast-Tumor, Karotisdissektion, Verletzung des Halsgrenzstrangs) verursacht ein Horner-Syndrom: leichte Ptosis, enge Pupille (Miosis) und bei proximaler Läsion fehlendes Schwitzen im Gesicht.' },
    [['n_cervical_sympathetic', ['T1']]],
    ['a_ophthalmic'], [], [],
    { fibers: bothFibers([[[2.4, 20.75, 4.6], [2.4, 20.5, 5.15]]]), r: 0.12 })
];

// ------------------------------------------------------------ organs
const O = (id, group, name, info, nerves, arteries, veins, lesion, shape, extra) => ({
  id, type: 'organ', group, name, info, nerves: nerves.map(([n, kind, seg]) => ({ n, kind, seg })), arteries, veins, lesion, shape, ...extra
});
const SYMP = ['n_cervical_sympathetic', 'sympathetic', ['T1', 'T2']];

const organs = [
  O('thyroid_gland', 'glands', { en: 'Thyroid gland', de: 'Schilddrüse', la: 'Glandula thyroidea' },
    { en: 'Two lobes on either side of the larynx and upper trachea, joined by an isthmus over the 2nd–4th tracheal rings, inside the pretracheal fascia (so it moves up with swallowing). It makes thyroxine (T4) and triiodothyronine (T3) and, in its C cells, calcitonin. Blood comes from the superior thyroid (external carotid) and inferior thyroid (thyrocervical trunk) arteries. The recurrent laryngeal nerve runs up in the groove between trachea and oesophagus right behind the lobe, close to the inferior thyroid artery; the external laryngeal nerve runs with the superior thyroid artery.',
      de: 'Zwei Lappen beiderseits von Kehlkopf und oberer Trachea, verbunden durch den Isthmus über der 2.–4. Trachealspange, innerhalb der Lamina pretrachealis (daher bewegt sie sich beim Schlucken mit). Sie bildet Thyroxin (T4) und Trijodthyronin (T3) und in den C-Zellen Calcitonin. Das Blut kommt aus der A. thyroidea superior (A. carotis externa) und der A. thyroidea inferior (Truncus thyrocervicalis). Der N. laryngeus recurrens steigt in der Rinne zwischen Trachea und Ösophagus direkt hinter dem Lappen auf, nahe der A. thyroidea inferior; der R. externus des N. laryngeus superior begleitet die A. thyroidea superior.' },
    [SYMP, ['n_superior_laryngeal', 'parasympathetic', ['CN X']], ['n_recurrent_laryngeal_right', 'sensory', ['CN X']]],
    ['a_superior_thyroid', 'a_inferior_thyroid'], ['v_thyroid', 'v_internal_jugular'],
    { en: 'Thyroid surgery puts three structures at risk: the recurrent laryngeal nerve (hoarseness; bilateral injury causes inspiratory stridor and may need a tracheotomy), the external laryngeal nerve (weak voice without high notes) and the parathyroid glands (hypocalcaemia with tingling and tetany). Hormone production itself is regulated by TSH, not by nerves.',
      de: 'Bei Schilddrüsenoperationen sind drei Strukturen gefährdet: der N. laryngeus recurrens (Heiserkeit; beidseitige Verletzung führt zu inspiratorischem Stridor und ggf. Tracheotomie), der R. externus des N. laryngeus superior (schwache Stimme ohne hohe Töne) und die Nebenschilddrüsen (Hypokalzämie mit Kribbeln und Tetanie). Die Hormonbildung selbst wird über TSH gesteuert, nicht über Nerven.' },
    { ellipsoids: [[[1.55, 4.0, -0.1], [0.65, 1.5, 0.65]], [[-1.55, 4.0, -0.1], [0.65, 1.5, 0.65]], [[0, 3.4, 0.75], [0.9, 0.4, 0.3]]], opacity: 0.6 },
    { color: 0xc8605a }),
  O('parathyroid_glands', 'glands', { en: 'Parathyroid glands', de: 'Nebenschilddrüsen (Epithelkörperchen)', la: 'Glandulae parathyroideae' },
    { en: 'Usually four lentil-sized glands on the back of the thyroid lobes, two superior (from the 4th pharyngeal pouch, fairly constant) and two inferior (from the 3rd pouch together with the thymus, so they may lie low, even in the mediastinum). They make parathyroid hormone, which raises blood calcium. They are supplied mainly by the inferior thyroid artery.',
      de: 'Meist vier linsengroße Drüsen an der Rückseite der Schilddrüsenlappen: zwei obere (aus der 4. Schlundtasche, recht konstant) und zwei untere (aus der 3. Schlundtasche zusammen mit dem Thymus, daher oft tiefer gelegen, bis ins Mediastinum). Sie bilden Parathormon, das den Blutcalciumspiegel erhöht. Versorgt werden sie vor allem von der A. thyroidea inferior.' },
    [SYMP],
    ['a_inferior_thyroid'], ['v_thyroid'],
    { en: 'Their secretion is controlled by the blood calcium level, not by nerves. Accidental removal or devascularisation during thyroidectomy causes hypoparathyroidism: low calcium with perioral tingling, positive Chvostek and Trousseau signs and tetany.',
      de: 'Ihre Sekretion wird über den Calciumspiegel gesteuert, nicht über Nerven. Versehentliche Entfernung oder Devaskularisierung bei der Thyreoidektomie führt zum Hypoparathyreoidismus: Hypokalzämie mit perioralem Kribbeln, positivem Chvostek- und Trousseau-Zeichen und Tetanie.' },
    { spheres: [[1.7, 4.9, -0.65], [1.6, 3.1, -0.6], [-1.7, 4.9, -0.65], [-1.6, 3.1, -0.6]].map(c => [c, 0.22]), opacity: 0.9 },
    { color: 0xd9a05b }),
  O('larynx', 'viscera', { en: 'Larynx', de: 'Kehlkopf', la: 'Larynx' },
    { en: 'Cartilaginous skeleton at C3–C6 between the hyoid and the trachea: thyroid cartilage (laryngeal prominence, "Adam\'s apple"), cricoid cartilage (the only complete ring), the paired arytenoids that carry the vocal folds, and the epiglottis. It protects the airway in swallowing and produces the voice. Sensation above the vocal folds comes from the internal laryngeal nerve (cough reflex), below them from the recurrent (inferior) laryngeal nerve. All intrinsic muscles are supplied by the recurrent laryngeal nerve except the cricothyroid (external laryngeal nerve). An emergency airway can be made through the cricothyroid membrane (coniotomy).',
      de: 'Knorpelgerüst in Höhe C3–C6 zwischen Zungenbein und Trachea: Schildknorpel (Prominentia laryngea, "Adamsapfel"), Ringknorpel (der einzige geschlossene Ring), die paarigen Stellknorpel (Aryknorpel), an denen die Stimmlippen ansetzen, und die Epiglottis. Er schützt beim Schlucken die Atemwege und bildet die Stimme. Die Sensibilität oberhalb der Stimmlippen kommt vom R. internus des N. laryngeus superior (Hustenreflex), unterhalb vom N. laryngeus recurrens (inferior). Alle inneren Kehlkopfmuskeln werden vom N. laryngeus recurrens versorgt, außer dem M. cricothyroideus (R. externus). Ein Notfallzugang ist durch das Lig. cricothyroideum möglich (Koniotomie).' },
    [['n_internal_laryngeal', 'sensory', ['CN X']], ['n_inferior_laryngeal', 'sensory', ['CN X']], SYMP],
    ['a_superior_thyroid', 'a_inferior_thyroid'], ['v_thyroid'],
    { en: 'A recurrent laryngeal nerve lesion (thyroid surgery, aortic aneurysm or lung cancer on the left, apical tumours on the right) paralyses the vocal fold of that side in a paramedian position: hoarseness and a weak cough. The left nerve is affected more often because of its long course around the aortic arch.',
      de: 'Eine Läsion des N. laryngeus recurrens (Schilddrüsenoperation, links Aortenaneurysma oder Bronchialkarzinom, rechts Pleurakuppeltumoren) lähmt die Stimmlippe dieser Seite in Paramedianstellung: Heiserkeit und schwacher Hustenstoß. Der linke Nerv ist wegen seines langen Verlaufs um den Aortenbogen häufiger betroffen.' },
    { ellipsoids: [[[0, 6.5, 0.3], [1.15, 1.1, 1.1]]], rings: [[[0, 5.3, -0.05], 0.85, [0, 1, 0]]], ringR: 0.22, tubes: [[[[0, 7.6, -0.2], [0, 8.7, -0.4], [0, 9.6, -0.6]], 0.35]], opacity: 0.5 },
    { color: 0xb9c7d6 }),
  O('pharynx', 'viscera', { en: 'Pharynx', de: 'Rachen (Schlund)', la: 'Pharynx' },
    { en: 'Muscular tube from the skull base to the cricoid cartilage (C6), where it continues into the oesophagus. Three parts: nasopharynx (opening of the auditory tube, pharyngeal tonsil), oropharynx (palatine tonsils, root of the tongue) and laryngopharynx (piriform recesses beside the larynx). Its wall has three overlapping constrictors and longitudinal muscles (stylopharyngeus). Motor and sensory supply comes from the pharyngeal plexus (CN IX sensory, CN X motor); the nasopharynx is also supplied by V2.',
      de: 'Muskelschlauch von der Schädelbasis bis zum Ringknorpel (C6), wo er in den Ösophagus übergeht. Drei Etagen: Epipharynx (Tubenöffnung, Rachenmandel), Mesopharynx (Gaumenmandeln, Zungengrund) und Hypopharynx (Recessus piriformes neben dem Kehlkopf). Die Wand besteht aus drei sich überlappenden Schlundschnürern und Längsmuskeln (M. stylopharyngeus). Motorik und Sensibilität kommen aus dem Plexus pharyngeus (N. IX sensibel, N. X motorisch); der Epipharynx wird auch von V2 versorgt.' },
    [['n_pharyngeal_plexus', 'sensory', ['CN IX', 'CN X']], ['n_maxillary', 'sensory', ['CN V2']], SYMP],
    ['a_ascending_pharyngeal', 'a_facial', 'a_inferior_thyroid'], ['v_internal_jugular'],
    { en: 'A glossopharyngeal lesion abolishes the gag reflex on that side (afferent limb); a vagus lesion paralyses the constrictors and soft palate (efferent limb): dysphagia, nasal regurgitation and aspiration. Bilateral lower cranial nerve palsies (bulbar palsy, e.g. ALS or brainstem stroke) make swallowing unsafe.',
      de: 'Eine Glossopharyngeusläsion hebt den Würgreflex auf dieser Seite auf (afferenter Schenkel); eine Vagusläsion lähmt Schlundschnürer und Gaumensegel (efferenter Schenkel): Schluckstörung, nasale Regurgitation und Aspiration. Beidseitige Lähmungen der kaudalen Hirnnerven (Bulbärparalyse, z. B. ALS oder Hirnstamminfarkt) machen das Schlucken unsicher.' },
    { tubes: [[[[0, 16.6, -0.8], [0, 14.8, -1.2], [0, 12, -1.2], [0, 9.5, -1.2], [0.1, 7, -1.5], [0.3, 4.2, -1.7], [0.3, 3, -1.6]], 0.9]], opacity: 0.35 },
    { color: 0xd98c8c }),
  O('tongue', 'viscera', { en: 'Tongue', de: 'Zunge', la: 'Lingua' },
    { en: 'Muscular organ divided by the V-shaped terminal sulcus into an anterior two-thirds (body, from the 1st pharyngeal arch) and a posterior third (root, from the 3rd/4th arches). Nerve supply follows this origin: general sensation of the anterior two-thirds comes from the lingual nerve (V3) and taste from the chorda tympani (VII) running with it; the posterior third has both from the glossopharyngeal nerve (IX); the vallecula region near the epiglottis is supplied by the internal laryngeal nerve (X). All muscles are supplied by the hypoglossal nerve (XII) except palatoglossus (X).',
      de: 'Muskulöses Organ, durch den V-förmigen Sulcus terminalis in die vorderen zwei Drittel (Corpus, aus dem 1. Schlundbogen) und das hintere Drittel (Radix, aus dem 3./4. Bogen) geteilt. Die Innervation folgt dieser Herkunft: Die allgemeine Sensibilität der vorderen zwei Drittel kommt vom N. lingualis (V3), der Geschmack von der mit ihm ziehenden Chorda tympani (VII); das hintere Drittel erhält beides vom N. glossopharyngeus (IX); die Valleculae nahe der Epiglottis versorgt der R. internus des N. laryngeus superior (X). Alle Muskeln werden vom N. hypoglossus (XII) versorgt, außer dem M. palatoglossus (X).' },
    [['n_lingual', 'sensory', ['CN V3', 'CN VII']], ['n_glossopharyngeal', 'sensory', ['CN IX']], ['n_internal_laryngeal', 'sensory', ['CN X']]],
    ['a_lingual'], ['v_internal_jugular'],
    { en: 'Hypoglossal nerve lesion: on protrusion the tongue deviates towards the side of the lesion, and that half wastes and fasciculates. A lingual nerve injury (wisdom tooth removal) leaves the anterior two-thirds numb and, because the chorda tympani runs with it, without taste; a facial nerve lesion above the chorda tympani branch removes taste only.',
      de: 'Hypoglossusläsion: Beim Herausstrecken weicht die Zunge zur Seite der Läsion ab, diese Hälfte atrophiert und zeigt Faszikulationen. Eine Verletzung des N. lingualis (Weisheitszahnentfernung) macht die vorderen zwei Drittel taub und, da die Chorda tympani mit ihm zieht, geschmacklos; eine Fazialisläsion oberhalb des Chorda-Abgangs nimmt nur den Geschmack.' },
    { ellipsoids: [[[0, 12.9, 2.6], [1.5, 0.8, 2.1]], [[0, 11.6, 0.8], [1.2, 1.0, 0.9]]], opacity: 0.5 },
    { color: 0xd47a7a }),
  O('parotid_gland', 'salivary', { en: 'Parotid gland', de: 'Ohrspeicheldrüse', la: 'Glandula parotidea' },
    { en: 'The largest salivary gland (purely serous) in front of the ear, wrapped around the ramus of the mandible in a tight fascial capsule. Its duct (Stensen\'s duct) crosses the masseter, pierces buccinator and opens opposite the upper second molar. Within the gland the facial nerve divides into its branches (parotid plexus), superficial to the retromandibular vein and external carotid artery. Secretomotor fibres come from CN IX: tympanic nerve → lesser petrosal nerve → otic ganglion → auriculotemporal nerve.',
      de: 'Größte Speicheldrüse (rein serös) vor dem Ohr, um den Ramus mandibulae gelegt und von einer straffen Faszienkapsel umgeben. Ihr Ausführungsgang (Ductus parotideus, Stensen-Gang) zieht über den Masseter, durchbohrt den M. buccinator und mündet gegenüber dem 2. oberen Molaren. In der Drüse teilt sich der N. facialis in seine Äste (Plexus intraparotideus), oberflächlich der V. retromandibularis und der A. carotis externa. Die sekretorischen Fasern stammen aus N. IX: N. tympanicus → N. petrosus minor → Ganglion oticum → N. auriculotemporalis.' },
    [['n_auriculotemporal', 'parasympathetic', ['CN IX']], ['n_auriculotemporal', 'sensory', ['CN V3']], ['n_great_auricular', 'sensory', ['C2', 'C3']], SYMP],
    ['a_external_carotid', 'a_superficial_temporal'], ['v_external_jugular'],
    { en: 'Parotid tumours and parotidectomy endanger the facial nerve branches (peripheral facial palsy of the involved branches). Mumps swells the gland painfully inside its tight capsule. After parotid surgery, regenerating parasympathetic fibres can grow into sweat glands: sweating and flushing of the cheek when eating (Frey syndrome).',
      de: 'Parotistumoren und Parotidektomie gefährden die Fazialisäste (periphere Parese der betroffenen Äste). Mumps lässt die Drüse in ihrer straffen Kapsel schmerzhaft anschwellen. Nach Parotisoperationen können aussprossende parasympathische Fasern Schweißdrüsen erreichen: Schwitzen und Rötung der Wange beim Essen (Frey-Syndrom).' },
    { ellipsoids: [[[4.9, 14.6, -1.4], [0.8, 1.6, 1.1]]], tubes: [[[[5.6, 15.4, -0.2], [6.0, 15.3, 1.2], [5.4, 15.2, 2.6], [3.9, 14.8, 3.4]], 0.12]], opacity: 0.45 },
    { color: 0xe3c35a }),
  O('submandibular_gland', 'salivary', { en: 'Submandibular gland', de: 'Unterkieferspeicheldrüse', la: 'Glandula submandibularis' },
    { en: 'Mixed (mainly serous) salivary gland in the submandibular triangle, wrapped around the posterior border of mylohyoid. Its duct (Wharton\'s duct) runs forwards in the floor of the mouth, crossed by the lingual nerve, and opens on the sublingual papilla beside the frenulum. Secretomotor fibres come from CN VII: chorda tympani → lingual nerve → submandibular ganglion. It produces most of the resting saliva; its viscous secretion makes it the commonest site of salivary stones.',
      de: 'Gemischte (überwiegend seröse) Speicheldrüse im Trigonum submandibulare, um den Hinterrand des M. mylohyoideus gelegt. Ihr Ausführungsgang (Ductus submandibularis, Wharton-Gang) zieht im Mundboden nach vorn, wird vom N. lingualis unterkreuzt und mündet auf der Caruncula sublingualis neben dem Zungenbändchen. Die sekretorischen Fasern stammen aus N. VII: Chorda tympani → N. lingualis → Ganglion submandibulare. Sie bildet den Großteil des Ruhespeichels; wegen des zähen Sekrets ist sie der häufigste Ort von Speichelsteinen.' },
    [['n_lingual', 'parasympathetic', ['CN VII']], SYMP],
    ['a_facial'], ['v_facial'],
    { en: 'A facial nerve lesion proximal to the chorda tympani reduces submandibular and sublingual salivation (and taste on the anterior two-thirds of the tongue). Removing the gland endangers the marginal mandibular branch of VII, the lingual nerve and the hypoglossal nerve.',
      de: 'Eine Fazialisläsion proximal der Chorda tympani vermindert die Speichelsekretion der Gll. submandibularis und sublingualis (und den Geschmack der vorderen zwei Zungendrittel). Bei ihrer Entfernung sind der R. marginalis mandibulae des N. VII, der N. lingualis und der N. hypoglossus gefährdet.' },
    { ellipsoids: [[[2.9, 10.4, 1.4], [0.8, 0.6, 1.1]], [[-2.9, 10.4, 1.4], [0.8, 0.6, 1.1]]], opacity: 0.5 },
    { color: 0xe3c35a }),
  O('lacrimal_gland', 'eye', { en: 'Lacrimal gland', de: 'Tränendrüse', la: 'Glandula lacrimalis' },
    { en: 'Lies in the upper lateral corner of the orbit and makes tears, which drain from the lacrimal puncta at the medial angle through the canaliculi and lacrimal sac into the nasolacrimal duct (inferior meatus of the nose). Secretomotor fibres come from CN VII: greater petrosal nerve → nerve of the pterygoid canal → pterygopalatine ganglion → zygomatic nerve (V2) → lacrimal nerve (V1).',
      de: 'Liegt im oberen äußeren Winkel der Orbita und bildet die Tränenflüssigkeit, die über die Tränenpünktchen am medialen Lidwinkel, die Canaliculi und den Tränensack in den Ductus nasolacrimalis (unterer Nasengang) abfließt. Sekretorische Fasern aus N. VII: N. petrosus major → N. canalis pterygoidei → Ganglion pterygopalatinum → N. zygomaticus (V2) → N. lacrimalis (V1).' },
    [['n_greater_petrosal', 'parasympathetic', ['CN VII']], ['n_ophthalmic', 'sensory', ['CN V1']], SYMP],
    ['a_ophthalmic'], ['v_dural_sinuses'],
    { en: 'A facial nerve lesion at or above the geniculate ganglion (e.g. a petrous bone fracture or acoustic neuroma) adds a dry eye to the facial palsy; a lesion at the stylomastoid foramen (Bell\'s palsy at its usual site) spares tear secretion. The level of a facial nerve lesion can be worked out this way (Schirmer test).',
      de: 'Eine Fazialisläsion am oder oberhalb des Ganglion geniculi (z. B. Felsenbeinfraktur, Akustikusneurinom) fügt der Gesichtslähmung ein trockenes Auge hinzu; eine Läsion am Foramen stylomastoideum spart die Tränensekretion aus. So lässt sich die Höhe einer Fazialisläsion bestimmen (Schirmer-Test).' },
    { ellipsoids: [[[3.3, 20.4, 3.6], [0.5, 0.3, 0.6]], [[-3.3, 20.4, 3.6], [0.5, 0.3, 0.6]]], opacity: 0.6 },
    { color: 0xe3c35a }),
  O('eye', 'eye', { en: 'Eye (eyeball)', de: 'Auge (Augapfel)', la: 'Bulbus oculi' },
    { en: 'The eyeball (about 24 mm) sits in the front of the orbit, moved by six extraocular muscles ("LR6 SO4, the rest 3"). The optic nerve (CN II) carries vision from the retina; the cornea is supplied by V1 (afferent limb of the corneal reflex, efferent limb VII). Pupil size is set by two smooth muscles: the sphincter pupillae (parasympathetic, CN III via the ciliary ganglion; also accommodation via the ciliary muscle) and the dilator pupillae (sympathetic, T1 via the superior cervical ganglion and the carotid plexus). The pupillary light reflex tests II (afferent) and III (efferent).',
      de: 'Der Augapfel (etwa 24 mm) liegt im vorderen Teil der Orbita und wird von sechs äußeren Augenmuskeln bewegt (Merkspruch "LR6 SO4, Rest 3"). Der N. opticus (N. II) leitet das Sehen von der Netzhaut; die Hornhaut wird von V1 versorgt (afferenter Schenkel des Kornealreflexes, efferent N. VII). Die Pupillenweite regeln zwei glatte Muskeln: M. sphincter pupillae (parasympathisch, N. III über das Ganglion ciliare; über den M. ciliaris auch die Akkommodation) und M. dilatator pupillae (sympathisch, Th1 über das Ganglion cervicale superius und den Plexus caroticus). Der Pupillenlichtreflex prüft N. II (afferent) und N. III (efferent).' },
    [['n_optic', 'sensory', ['CN II']], ['n_ophthalmic', 'sensory', ['CN V1']], ['n_oculomotor', 'parasympathetic', ['CN III']], SYMP],
    ['a_ophthalmic'], ['v_dural_sinuses'],
    { en: 'Oculomotor palsy: the eye is "down and out" (unopposed lateral rectus and superior oblique), with complete ptosis and a fixed, dilated pupil; a compressive lesion (posterior communicating artery aneurysm, uncal herniation) affects the pupil early because the parasympathetic fibres lie superficially. Horner syndrome (sympathetic lesion): small pupil, mild ptosis, sometimes anhidrosis. An optic nerve lesion causes blindness of that eye with a relative afferent pupillary defect.',
      de: 'Okulomotoriusparese: Das Auge steht "unten außen" (ungehemmter M. rectus lateralis und M. obliquus superior), mit vollständiger Ptosis und weiter, lichtstarrer Pupille; bei Kompression (Aneurysma der A. communicans posterior, Unkusherniation) ist die Pupille früh betroffen, weil die parasympathischen Fasern außen liegen. Horner-Syndrom (Sympathikusläsion): enge Pupille, leichte Ptosis, ggf. Anhidrose. Eine Optikusläsion führt zur Erblindung dieses Auges mit relativem afferentem Pupillendefekt.' },
    { spheres: [[EYE, EYE_R], [mirror(EYE), EYE_R]], rings: [[[2.4, 19.6, 4.95], 0.45, [0, 0, 1]], [[-2.4, 19.6, 4.95], 0.45, [0, 0, 1]]], ringR: 0.08, opacity: 0.55 },
    { color: 0xe8eef2 })
];

// ------------------------------------------------------------ arteries
const A = (id, parents, name, info, extra) => ({ id, type: 'artery', parents, name, info, ...extra });

const ECA = [[2.4, 7.4, -0.8], [2.3, 9.4, -0.4], [3.0, 11.8, -0.6], [3.9, 13.8, -1.4], ECA_END];
const ICA = [[2.4, 7.4, -0.8], [2.7, 9.6, -1.4], [2.6, 12.6, -2.0], [2.6, 14.8, -2.3], [2.2, 16.2, -1.8], [1.6, 16.8, -1.4],
  [1.2, 17.6, -1.2], [1.2, 18.3, -0.4], [1.0, 18.9, -0.6], [0.9, 19.0, -1.6]];
const STA = vault(98, 8, 0.35);

const arteries = [
  A('a_external_carotid', ['a_common_carotid_right', 'a_common_carotid_left'], { en: 'External carotid artery', de: 'Äußere Halsschlagader', la: 'Arteria carotis externa' },
    { en: 'Supplies the neck, face, scalp and dura. It begins at the carotid bifurcation (upper border of the thyroid cartilage, C4), first lying medial to the internal carotid, and ends in the parotid gland behind the neck of the mandible by dividing into the maxillary and superficial temporal arteries. Branches (front to back): superior thyroid, lingual, facial; ascending pharyngeal (medial); occipital and posterior auricular (posterior); maxillary and superficial temporal (terminal).',
      de: 'Versorgt Hals, Gesicht, Kopfhaut und Dura. Sie beginnt an der Karotisgabel (Oberrand des Schildknorpels, C4), liegt zunächst medial der A. carotis interna und endet in der Parotis hinter dem Collum mandibulae mit der Teilung in A. maxillaris und A. temporalis superficialis. Äste (von vorn nach hinten): A. thyroidea superior, A. lingualis, A. facialis; A. pharyngea ascendens (medial); A. occipitalis und A. auricularis posterior (hinten); A. maxillaris und A. temporalis superficialis (Endäste).' },
    { paths: both(ECA), r: 0.3,
      lesion: { en: 'It can be ligated (e.g. for uncontrollable bleeding from the face or nose) because its branches anastomose freely with those of the other side and with the internal carotid via the orbit.',
        de: 'Sie kann unterbunden werden (z. B. bei unstillbarer Blutung aus Gesicht oder Nase), weil ihre Äste reichlich mit denen der Gegenseite und über die Orbita mit der A. carotis interna anastomosieren.' } }),
  A('a_internal_carotid', ['a_common_carotid_right', 'a_common_carotid_left'], { en: 'Internal carotid artery', de: 'Innere Halsschlagader', la: 'Arteria carotis interna' },
    { en: 'Gives no branches in the neck. It begins with the carotid sinus (baroreceptors, CN IX), rises in the carotid sheath with the internal jugular vein and the vagus nerve, enters the skull through the carotid canal, makes an S-bend through the cavernous sinus (carotid siphon) and ends beside the optic chiasm by dividing into the anterior and middle cerebral arteries. Its first intracranial branch is the ophthalmic artery. It carries about 80 % of the blood to the brain.',
      de: 'Gibt am Hals keine Äste ab. Sie beginnt mit dem Sinus caroticus (Barorezeptoren, N. IX), steigt in der Karotisscheide mit V. jugularis interna und N. vagus auf, tritt durch den Canalis caroticus in den Schädel, zieht in S-förmiger Krümmung durch den Sinus cavernosus (Karotissiphon) und teilt sich neben dem Chiasma opticum in die Aa. cerebri anterior und media. Ihr erster intrakranieller Ast ist die A. ophthalmica. Sie führt etwa 80 % des Hirnblutes.' },
    { paths: both(ICA), r: 0.3,
      lesion: { en: 'Atherosclerosis at the bifurcation (carotid stenosis) sends emboli: transient monocular blindness (amaurosis fugax, via the ophthalmic artery) or a stroke in the middle cerebral territory (contralateral face and arm weakness, aphasia when on the dominant side). A dissection causes neck pain with Horner syndrome, because the sympathetic fibres to the eye run on its wall.',
        de: 'Arteriosklerose an der Gabel (Karotisstenose) streut Emboli: flüchtige einseitige Erblindung (Amaurosis fugax, über die A. ophthalmica) oder ein Schlaganfall im Mediastromgebiet (kontralaterale Gesichts- und Armparese, bei dominanter Seite Aphasie). Eine Dissektion verursacht Halsschmerz mit Horner-Syndrom, da die sympathischen Fasern zum Auge auf ihrer Wand verlaufen.' } }),
  A('a_ophthalmic', ['a_internal_carotid'], { en: 'Ophthalmic artery', de: 'Augenarterie', la: 'Arteria ophthalmica' },
    { en: 'First branch of the internal carotid, beside the anterior clinoid process. It enters the orbit through the optic canal below the optic nerve and supplies the eye (central retinal artery, ciliary arteries), extraocular muscles, lacrimal gland, eyelids and forehead (supraorbital and supratrochlear arteries), anastomosing with branches of the external carotid on the face.',
      de: 'Erster Ast der A. carotis interna neben dem Proc. clinoideus anterior. Sie zieht durch den Canalis opticus unterhalb des N. opticus in die Orbita und versorgt das Auge (A. centralis retinae, Aa. ciliares), die Augenmuskeln, die Tränendrüse, die Lider und die Stirn (Aa. supraorbitalis und supratrochlearis), die im Gesicht mit Ästen der A. carotis externa anastomosieren.' },
    { paths: both([[1.0, 18.9, -0.6], [1.1, 19.3, 0.6], [1.8, 19.9, 2.0], [1.6, 20.4, 3.6], [1.2, 20.8, 5.0]]), r: 0.12,
      lesion: { en: 'Occlusion of its central retinal artery causes sudden painless blindness with a pale retina and a "cherry-red spot" at the macula.',
        de: 'Ein Verschluss der A. centralis retinae verursacht plötzliche schmerzlose Erblindung mit blasser Netzhaut und "kirschrotem Fleck" an der Makula.' } }),
  A('a_superior_thyroid', ['a_external_carotid'], { en: 'Superior thyroid artery', de: 'Obere Schilddrüsenarterie', la: 'Arteria thyroidea superior' },
    { en: 'First branch of the external carotid; runs down to the upper pole of the thyroid together with the external laryngeal nerve and gives the superior laryngeal artery (with the internal laryngeal nerve through the thyrohyoid membrane) and a branch to the sternocleidomastoid.',
      de: 'Erster Ast der A. carotis externa; zieht zusammen mit dem R. externus des N. laryngeus superior zum oberen Schilddrüsenpol und gibt die A. laryngea superior (mit dem R. internus durch die Membrana thyrohyoidea) sowie einen Ast zum M. sternocleidomastoideus ab.' },
    { paths: both([[2.35, 8.0, -0.6], [2.0, 7.6, 0.6], [1.8, 6.0, 0.8], [1.6, 4.8, 0.4]]), r: 0.13,
      lesion: { en: 'Ligate it close to the gland during thyroidectomy: the external laryngeal nerve lies right beside it higher up.',
        de: 'Bei der Thyreoidektomie drüsennah unterbinden: Weiter oben liegt der R. externus des N. laryngeus superior direkt daneben.' } }),
  A('a_lingual', ['a_external_carotid'], { en: 'Lingual artery', de: 'Zungenarterie', la: 'Arteria lingualis' },
    { en: 'Arises at the level of the greater horn of the hyoid, loops upwards and runs forwards deep to hyoglossus (the hypoglossal nerve lies superficial to that muscle) to the tongue as the deep lingual artery; it also supplies the floor of the mouth and the sublingual gland.',
      de: 'Entspringt in Höhe des großen Zungenbeinhorns, bildet eine Schleife nach oben und zieht unter dem M. hyoglossus (der N. hypoglossus liegt außen auf diesem Muskel) als A. profunda linguae zur Zunge; sie versorgt auch Mundboden und Gl. sublingualis.' },
    { paths: both([[2.3, 9.2, -0.4], [2.0, 9.6, 0.6], [1.4, 10.0, 1.2], [1.0, 11.4, 2.0], [0.6, 12.2, 3.6]]), r: 0.12 }),
  A('a_facial', ['a_external_carotid'], { en: 'Facial artery', de: 'Gesichtsarterie', la: 'Arteria facialis' },
    { en: 'Loops through the submandibular gland, crosses the lower border of the mandible at the front edge of masseter (pulse palpable there) and winds tortuously past the angle of the mouth (labial arteries) and the side of the nose to the medial angle of the eye (angular artery). Its tortuous course lets it follow mouth movements.',
      de: 'Zieht in einer Schleife durch die Gl. submandibularis, kreuzt den Unterkieferrand am Vorderrand des Masseters (dort tastbarer Puls) und verläuft geschlängelt am Mundwinkel (Aa. labiales) und an der Nase vorbei zum medialen Augenwinkel (A. angularis). Die Schlängelung erlaubt ihr, den Mundbewegungen zu folgen.' },
    { paths: both([[2.4, 9.8, -0.4], [2.7, 10.8, 0.6], [3.4, 10.4, 1.8], [4.5, 11.0, 2.2], [3.6, 12.6, 4.4], [2.5, 13.6, 5.9], [1.7, 16.2, 5.6], [1.2, 18.6, 4.9]]), r: 0.12 }),
  A('a_ascending_pharyngeal', ['a_external_carotid'], { en: 'Ascending pharyngeal artery', de: 'Aufsteigende Rachenarterie', la: 'Arteria pharyngea ascendens' },
    { en: 'Small branch from the medial side of the external carotid near its origin; rises on the pharynx to the skull base and supplies the pharynx, soft palate, tonsil, middle ear and part of the dura.',
      de: 'Kleiner Ast von der medialen Seite der A. carotis externa nahe ihrem Ursprung; steigt auf dem Pharynx zur Schädelbasis auf und versorgt Pharynx, Gaumensegel, Tonsille, Mittelohr und einen Teil der Dura.' },
    { paths: both([[2.4, 7.8, -0.9], [2.1, 10, -1.6], [1.6, 13, -2.0], [1.4, 15, -1.8]]), r: 0.08 }),
  A('a_posterior_auricular', ['a_external_carotid'], { en: 'Posterior auricular artery', de: 'Hintere Ohrarterie', la: 'Arteria auricularis posterior' },
    { en: 'Runs back along the upper border of the posterior belly of digastric to the groove between the ear and the mastoid process, supplying the auricle, the scalp behind it and, via the stylomastoid artery, the facial nerve canal and middle ear.',
      de: 'Zieht am Oberrand des hinteren Digastricusbauchs nach hinten in die Rinne zwischen Ohrmuschel und Warzenfortsatz und versorgt die Ohrmuschel, die Kopfhaut dahinter und über die A. stylomastoidea den Fazialiskanal und das Mittelohr.' },
    { paths: both([[3.7, 13.4, -1.3], [4.6, 14.0, -2.4], [5.6, 15.6, -2.8], [5.6, 17.4, -3.6]]), r: 0.08 }),
  A('a_maxillary', ['a_external_carotid'], { en: 'Maxillary artery', de: 'Oberkieferarterie', la: 'Arteria maxillaris' },
    { en: 'Larger terminal branch of the external carotid. It runs forwards behind the neck of the mandible, across the lateral pterygoid, into the pterygopalatine fossa. Its about 15 branches supply the teeth (inferior and superior alveolar), muscles of mastication, dura (middle meningeal), palate and nasal cavity (sphenopalatine artery, the main source of posterior nosebleeds).',
      de: 'Stärkerer Endast der A. carotis externa. Sie zieht hinter dem Collum mandibulae nach vorn, über den M. pterygoideus lateralis in die Fossa pterygopalatina. Ihre etwa 15 Äste versorgen die Zähne (Aa. alveolares inferior und superiores), die Kaumuskeln, die Dura (A. meningea media), den Gaumen und die Nasenhöhle (A. sphenopalatina, Hauptquelle hinterer Nasenblutungen).' },
    { paths: both([ECA_END, [4.0, 15.6, -0.8], [3.2, 15.9, 0], [2.4, 16.6, 0.6], [2.0, 17.4, 1.1]]), r: 0.15 }),
  A('a_middle_meningeal', ['a_maxillary'], { en: 'Middle meningeal artery', de: 'Mittlere Hirnhautarterie', la: 'Arteria meningea media' },
    { en: 'Enters the skull through the foramen spinosum and runs in the outer layer of the dura, grooving the inner surface of the skull. Its frontal branch crosses the pterion, where the frontal, parietal, temporal and sphenoid bones meet and the skull is thinnest.',
      de: 'Tritt durch das Foramen spinosum in den Schädel und verläuft im äußeren Durablatt, wobei sie Furchen in die Innenfläche des Schädels gräbt. Ihr R. frontalis kreuzt das Pterion, wo Os frontale, parietale, temporale und sphenoidale zusammentreffen und der Schädel am dünnsten ist.' },
    { paths: both([[4.0, 15.6, -0.8], [3.4, 16.4, -1.0], [3.0, 17.0, -1.4], vault(70, -15, -0.35), vault(80, 5, -0.35), vault(95, 30, -0.35)]), r: 0.1,
      lesion: { en: 'A blow to the side of the head that fractures the pterion tears it: arterial bleeding between skull and dura (epidural haematoma), classically with a lucid interval followed by rapid deterioration and an ipsilateral dilated pupil from uncal herniation compressing CN III. A neurosurgical emergency.',
        de: 'Ein Schlag gegen die Schläfe mit Fraktur am Pterion reißt sie ein: arterielle Blutung zwischen Schädel und Dura (Epiduralhämatom), klassisch mit freiem Intervall, dann rascher Verschlechterung und ipsilateral weiter Pupille durch Unkusherniation mit Kompression des N. III. Ein neurochirurgischer Notfall.' } }),
  A('a_superficial_temporal', ['a_external_carotid'], { en: 'Superficial temporal artery', de: 'Oberflächliche Schläfenarterie', la: 'Arteria temporalis superficialis' },
    { en: 'Smaller terminal branch of the external carotid; rises from the parotid gland in front of the ear (pulse palpable over the zygomatic arch) with the auriculotemporal nerve and divides into frontal and parietal branches to the scalp.',
      de: 'Schwächerer Endast der A. carotis externa; steigt aus der Parotis vor dem Ohr auf (Puls über dem Jochbogen tastbar), begleitet vom N. auriculotemporalis, und teilt sich in einen R. frontalis und einen R. parietalis für die Kopfhaut.' },
    { paths: [[ECA_END, [5.2, 16.8, -2.2], [5.9, 18.0, -2.0], STA], [STA, vault(75, 25, 0.35), vault(45, 40, 0.35)], [STA, vault(105, 40, 0.35)]].flatMap(both), r: 0.1,
      lesion: { en: 'Giant cell (temporal) arteritis in older people: a thickened, tender artery with headache and jaw claudication; untreated it can blind by involving the ophthalmic artery, so steroids are started at once and a biopsy is taken from this artery.',
        de: 'Riesenzellarteriitis (Arteriitis temporalis) bei älteren Menschen: verdickte, druckschmerzhafte Arterie mit Kopfschmerz und Kauclaudicatio; unbehandelt kann sie über die A. ophthalmica zur Erblindung führen, daher sofort Steroide und Biopsie aus dieser Arterie.' } }),
  A('a_thyrocervical_trunk', ['a_subclavian'], { en: 'Thyrocervical trunk', de: 'Truncus thyrocervicalis', la: 'Truncus thyrocervicalis' },
    { en: 'Short trunk from the first part of the subclavian artery at the medial border of scalenus anterior. It gives the inferior thyroid, suprascapular and transverse cervical arteries.',
      de: 'Kurzer Stamm aus dem ersten Abschnitt der A. subclavia am Innenrand des M. scalenus anterior. Er gibt die Aa. thyroidea inferior, suprascapularis und transversa cervicis ab.' },
    { paths: both([[3.9, 2.0, 0.4], [3.8, 3.4, 0.2]]), r: 0.16 }),
  A('a_inferior_thyroid', ['a_thyrocervical_trunk'], { en: 'Inferior thyroid artery', de: 'Untere Schilddrüsenarterie', la: 'Arteria thyroidea inferior' },
    { en: 'Rises in front of scalenus anterior, then loops medially behind the carotid sheath to the back of the thyroid lobe, supplying the thyroid, the parathyroid glands, larynx (inferior laryngeal artery), trachea and oesophagus. Near the gland it crosses the recurrent laryngeal nerve.',
      de: 'Steigt vor dem M. scalenus anterior auf und biegt dann hinter der Karotisscheide nach medial zur Rückseite des Schilddrüsenlappens; sie versorgt Schilddrüse, Nebenschilddrüsen, Kehlkopf (A. laryngea inferior), Trachea und Ösophagus. Nahe der Drüse kreuzt sie den N. laryngeus recurrens.' },
    { paths: both([[3.8, 3.4, 0.2], [3.4, 5.2, -1.2], [2.4, 4.6, -1.4], [1.8, 3.8, -0.6]]), r: 0.12,
      lesion: { en: 'Ligate it away from the gland, lateral to the recurrent laryngeal nerve, which passes between or behind its branches.',
        de: 'Drüsenfern und lateral des N. laryngeus recurrens unterbinden, der zwischen oder hinter ihren Ästen verläuft.' } })
];

// ------------------------------------------------------------ veins
const V = (id, parents, name, info, extra) => ({ id, type: 'vein', parents, name, info, ...extra });

const CONFLUENCE = vault(180, -12, -0.35);
const SINUS_SAGITTAL = [20, 45, 70, 89.9].map(b => vault(0, b, -0.35)).concat([70, 45, 20, 0].map(b => vault(180, b, -0.35)), [CONFLUENCE]);
const SINUS_TRANSVERSE = [CONFLUENCE, vault(150, -12, -0.35), vault(120, -12, -0.35), [4.6, 18.4, -4.6], [3.8, 16.6, -4.2], JUGULAR_FORAMEN];

const veins = [
  V('v_internal_jugular', ['v_brachiocephalic_right', 'v_brachiocephalic_left'], { en: 'Internal jugular vein', de: 'Innere Drosselvene', la: 'Vena jugularis interna' },
    { en: 'Continues the sigmoid sinus at the jugular foramen and drains the brain, face and neck. It runs down in the carotid sheath lateral to the internal and common carotid arteries, with the vagus nerve between and behind them, under cover of the sternocleidomastoid, and joins the subclavian vein behind the sternoclavicular joint to form the brachiocephalic vein. Tributaries include the facial, lingual, pharyngeal and superior and middle thyroid veins. The deep cervical lymph nodes lie along it.',
      de: 'Setzt am Foramen jugulare den Sinus sigmoideus fort und drainiert Gehirn, Gesicht und Hals. Sie zieht in der Karotisscheide lateral der Aa. carotis interna und communis nach unten, mit dem N. vagus dahinter zwischen beiden, bedeckt vom M. sternocleidomastoideus, und vereinigt sich hinter dem Sternoklavikulargelenk mit der V. subclavia zur V. brachiocephalica. Zuflüsse sind u. a. Vv. facialis, lingualis, pharyngeae und Vv. thyroideae superior und media. Entlang ihr liegen die tiefen Halslymphknoten.' },
    { paths: both([JUGULAR_FORAMEN, [3.0, 14.0, -2.4], [3.3, 11.6, -1.2], [3.3, 9, -0.5], [3.5, 6, 0], [3.9, 3.2, 0.6], [4.4, 1.4, 1.0]]), r: 0.45,
      lesion: { en: 'The usual route for a central venous catheter (between the two heads of the sternocleidomastoid, lateral to the carotid pulse, ultrasound-guided). Its pulsation reflects right atrial pressure (jugular venous pressure).',
        de: 'Üblicher Zugang für den zentralen Venenkatheter (zwischen den beiden Köpfen des M. sternocleidomastoideus, lateral des Karotispulses, ultraschallgesteuert). Ihre Pulsation spiegelt den Druck im rechten Vorhof wider (Jugularvenendruck).' } }),
  V('v_subclavian', ['v_brachiocephalic_right', 'v_brachiocephalic_left'], { en: 'Subclavian vein', de: 'Schlüsselbeinvene', la: 'Vena subclavia' },
    { en: 'Continues the axillary vein at the outer border of the first rib and runs in front of scalenus anterior (the subclavian artery runs behind it) beneath the clavicle, joining the internal jugular to form the brachiocephalic vein. The thoracic duct (left) and right lymphatic duct open into this junction (venous angle).',
      de: 'Setzt am Außenrand der 1. Rippe die V. axillaris fort und zieht vor dem M. scalenus anterior (die A. subclavia liegt dahinter) unter der Klavikula zur Vereinigung mit der V. jugularis interna zur V. brachiocephalica. In diesen Venenwinkel münden der Ductus thoracicus (links) und der Ductus lymphaticus dexter.' },
    { paths: both([[9.4, 0.2, 0.4], [7, 1.0, 1.2], [5.4, 1.2, 1.4], [4.4, 1.4, 1.0]]), r: 0.4,
      lesion: { en: 'Used for central lines below the clavicle; the apex of the lung lies just behind, so a pneumothorax is the typical complication.',
        de: 'Zugang für zentrale Katheter unterhalb der Klavikula; dahinter liegt die Lungenspitze, daher ist der Pneumothorax die typische Komplikation.' } }),
  V('v_external_jugular', ['v_subclavian'], { en: 'External jugular vein', de: 'Äußere Drosselvene', la: 'Vena jugularis externa' },
    { en: 'Formed behind the angle of the mandible from the posterior auricular vein and the posterior division of the retromandibular vein. It runs down superficially across the sternocleidomastoid under the platysma, pierces the deep fascia above the clavicle and ends in the subclavian vein. Drains scalp and face.',
      de: 'Entsteht hinter dem Kieferwinkel aus V. auricularis posterior und hinterem Ast der V. retromandibularis. Sie zieht oberflächlich unter dem Platysma über den M. sternocleidomastoideus nach unten, durchbricht oberhalb der Klavikula die Halsfaszie und mündet in die V. subclavia. Drainiert Kopfhaut und Gesicht.' },
    { paths: both([[5.2, 15, -2.0], [5.4, 11.6, -1.0], [5.4, 8.0, -0.6], [5.6, 3.6, -0.2], [5.4, 1.8, 0.2]]), r: 0.25,
      lesion: { en: 'Visibly distended when venous pressure is raised (right heart failure, tension pneumothorax). If cut where it pierces the fascia, its wall is held open and air can be sucked in (air embolism).',
        de: 'Bei erhöhtem Venendruck sichtbar gestaut (Rechtsherzinsuffizienz, Spannungspneumothorax). Wird sie an der Durchtrittsstelle durch die Faszie verletzt, bleibt ihre Wand offen und es kann Luft angesaugt werden (Luftembolie).' } }),
  V('v_facial', ['v_internal_jugular'], { en: 'Facial vein', de: 'Gesichtsvene', la: 'Vena facialis' },
    { en: 'Begins at the medial angle of the eye as the angular vein, runs down behind the facial artery, less tortuous, across the mandible and joins the internal jugular vein at the level of the hyoid. At the eye it connects via the ophthalmic veins with the cavernous sinus.',
      de: 'Beginnt am medialen Augenwinkel als V. angularis, zieht hinter der A. facialis, weniger geschlängelt, über die Mandibula nach unten und mündet in Höhe des Zungenbeins in die V. jugularis interna. Am Auge steht sie über die Vv. ophthalmicae mit dem Sinus cavernosus in Verbindung.' },
    { paths: both([[1.3, 18.8, 5.0], [1.8, 16.2, 5.8], [2.6, 13.6, 6.0], [3.8, 12.4, 3.6], [4.6, 11.0, 2.2], [3.6, 10.2, 0.6], [3.3, 9.6, -0.4]]), r: 0.14,
      lesion: { en: '"Danger triangle" of the face (nose and upper lip): an infection there (e.g. a squeezed boil) can spread through the valveless angular and ophthalmic veins into the cavernous sinus (septic cavernous sinus thrombosis with palsies of III, IV, V1, V2 and VI).',
        de: '"Gefahrendreieck" des Gesichts (Nase und Oberlippe): Eine Infektion dort (z. B. ein ausgedrückter Furunkel) kann über die klappenlosen Vv. angularis und ophthalmicae in den Sinus cavernosus gelangen (septische Sinus-cavernosus-Thrombose mit Ausfall von III, IV, V1, V2 und VI).' } }),
  V('v_thyroid', ['v_internal_jugular', 'v_brachiocephalic_left'], { en: 'Thyroid veins', de: 'Schilddrüsenvenen', la: 'Venae thyroideae' },
    { en: 'A venous plexus on the gland drains through the superior and middle thyroid veins into the internal jugular vein and through the inferior thyroid veins, in front of the trachea, into the brachiocephalic veins (mostly the left).',
      de: 'Ein Venengeflecht auf der Drüse drainiert über die Vv. thyroideae superior und media in die V. jugularis interna und über die Vv. thyroideae inferiores vor der Trachea in die Vv. brachiocephalicae (meist die linke).' },
    { paths: [...both([[1.5, 5.2, 0.2], [2.6, 5.8, 0.2], [3.4, 6.2, 0]]), [[0.6, 2.6, 0.6], [0.3, 1.0, 1.4], [0.2, 0, 1.7]]], r: 0.1,
      lesion: { en: 'The inferior thyroid veins lie in front of the trachea and bleed during a low tracheotomy.',
        de: 'Die Vv. thyroideae inferiores liegen vor der Trachea und bluten bei der unteren Tracheotomie.' } }),
  V('v_dural_sinuses', ['v_internal_jugular'], { en: 'Dural venous sinuses', de: 'Hirnblutleiter (Sinus durae matris)', la: 'Sinus durae matris' },
    { en: 'Valveless channels between the two layers of the dura that collect the blood of the brain, the orbit and the skull bones. The superior sagittal sinus runs in the attached edge of the falx to the confluence of sinuses at the internal occipital protuberance; from there the transverse sinuses run forwards and become the S-shaped sigmoid sinuses, which leave through the jugular foramina as the internal jugular veins. The cavernous sinus beside the sella turcica contains the internal carotid artery and CN VI, with III, IV, V1 and V2 in its lateral wall; it receives the ophthalmic veins. Arachnoid granulations return cerebrospinal fluid into the superior sagittal sinus.',
      de: 'Klappenlose Kanäle zwischen den beiden Durablättern, die das Blut von Gehirn, Orbita und Schädelknochen sammeln. Der Sinus sagittalis superior verläuft am Ansatz der Falx zum Confluens sinuum an der Protuberantia occipitalis interna; von dort ziehen die Sinus transversi nach vorn und gehen in die S-förmigen Sinus sigmoidei über, die durch die Foramina jugularia als Vv. jugulares internae austreten. Der Sinus cavernosus neben der Sella turcica enthält die A. carotis interna und den N. VI, in seiner Seitenwand liegen III, IV, V1 und V2; er nimmt die Vv. ophthalmicae auf. Über die Granulationes arachnoideae gelangt Liquor in den Sinus sagittalis superior.' },
    { paths: [SINUS_SAGITTAL, ...both(SINUS_TRANSVERSE), ...both([[1.4, 18.6, 0.6], [1.3, 17.6, -0.4], [1.3, 17.4, -1.6], [2.0, 17.0, -2.6], [3.4, 16.6, -3.8]])], r: 0.22,
      lesion: { en: 'Cavernous sinus thrombosis or a carotid–cavernous fistula causes proptosis, chemosis and ophthalmoplegia; CN VI, lying free in the sinus, is usually affected first. Sinus venous thrombosis (e.g. superior sagittal) causes headache, seizures and venous infarcts with haemorrhage.',
        de: 'Eine Sinus-cavernosus-Thrombose oder eine Karotis-Sinus-cavernosus-Fistel verursacht Exophthalmus, Chemosis und Ophthalmoplegie; der frei im Sinus liegende N. VI ist meist zuerst betroffen. Eine Sinusvenenthrombose (z. B. des Sinus sagittalis superior) verursacht Kopfschmerz, Krampfanfälle und Stauungsinfarkte mit Einblutung.' } })
];

// ------------------------------------------------------------ nerves
const N = (id, group, segList, parents, name, info, extra) => ({ id, type: 'nerve', group, segs: segList, parents, name, info, ...extra });

const OCULOMOTOR_SPLIT = [1.5, 19.2, 0.8];
const nervesCranial = [
  N('n_olfactory', 'cranial', ['CN I'], [], { en: 'Olfactory nerve (CN I)', de: 'Riechnerv (I. Hirnnerv)', la: 'Nervus olfactorius' },
    { en: 'About 20 bundles of olfactory fibres pass from the roof of the nasal cavity through the cribriform plate of the ethmoid to the olfactory bulb, which continues back as the olfactory tract. Purely sensory (smell).',
      de: 'Etwa 20 Bündel Riechfäden ziehen vom Dach der Nasenhöhle durch die Lamina cribrosa des Siebbeins zum Bulbus olfactorius, der sich als Tractus olfactorius nach hinten fortsetzt. Rein sensorisch (Riechen).' },
    { paths: both([[0.5, 18.6, 2.6], [0.5, 20.3, 2.4], [0.55, 20.6, 1.6], [0.8, 20.4, -0.6]]), r: 0.18,
      lesion: { en: 'A fracture of the cribriform plate tears the fibres: loss of smell (anosmia), often with CSF leaking from the nose. Loss of smell is also an early sign of Parkinson\'s disease and a common symptom of viral infections.',
        de: 'Eine Fraktur der Lamina cribrosa zerreißt die Fasern: Riechverlust (Anosmie), oft mit Liquorrhö aus der Nase. Riechverlust ist auch ein Frühzeichen der Parkinson-Krankheit und häufig bei Virusinfekten.' } }),
  N('n_optic', 'cranial', ['CN II'], [], { en: 'Optic nerve (CN II)', de: 'Sehnerv (II. Hirnnerv)', la: 'Nervus opticus' },
    { en: 'Really a tract of the brain wrapped in meninges. It leaves the back of the eyeball, runs through the orbit inside the cone of the rectus muscles and through the optic canal to the optic chiasm, where the fibres from the nasal halves of both retinas cross. Afferent limb of the pupillary light reflex.',
      de: 'Eigentlich eine Hirnbahn, von Hirnhäuten umhüllt. Er verlässt den Augapfel hinten, zieht im Muskeltrichter der geraden Augenmuskeln durch die Orbita und durch den Canalis opticus zum Chiasma opticum, wo die Fasern der nasalen Netzhauthälften kreuzen. Afferenter Schenkel des Pupillenlichtreflexes.' },
    { paths: both([[2.4, 19.6, 2.95], [1.6, 19.5, 1.6], [1.0, 19.5, 0.8], [0.3, 19.4, -0.4], [0.9, 19.0, -1.6]]), r: 0.2,
      lesion: { en: 'A lesion of one optic nerve blinds that eye; the pupil does not constrict when light shines into it, but does when light shines into the other eye (relative afferent pupillary defect). Compression of the chiasm by a pituitary tumour causes bitemporal hemianopia.',
        de: 'Eine Läsion eines N. opticus macht dieses Auge blind; die Pupille verengt sich nicht bei Belichtung dieses Auges, wohl aber bei Belichtung des anderen (relativer afferenter Pupillendefekt). Kompression des Chiasmas durch einen Hypophysentumor verursacht eine bitemporale Hemianopsie.' } }),
  N('n_oculomotor', 'cranial', ['CN III'], [], { en: 'Oculomotor nerve (CN III)', de: 'Augenbewegungsnerv (III. Hirnnerv)', la: 'Nervus oculomotorius' },
    { en: 'Leaves the midbrain between the cerebral peduncles, passes between the posterior cerebral and superior cerebellar arteries, close to the posterior communicating artery, runs in the lateral wall of the cavernous sinus and enters the orbit through the superior orbital fissure. Its superior division supplies superior rectus and levator palpebrae; its inferior division supplies medial rectus, inferior rectus and inferior oblique and carries the parasympathetic fibres to the ciliary ganglion (sphincter pupillae, ciliary muscle).',
      de: 'Verlässt das Mittelhirn zwischen den Hirnschenkeln, zieht zwischen A. cerebri posterior und A. superior cerebelli, nahe der A. communicans posterior, in der Seitenwand des Sinus cavernosus und durch die Fissura orbitalis superior in die Orbita. Sein R. superior versorgt M. rectus superior und M. levator palpebrae; sein R. inferior versorgt Mm. rectus medialis, rectus inferior und obliquus inferior und führt die parasympathischen Fasern zum Ganglion ciliare (M. sphincter pupillae, M. ciliaris).' },
    { paths: [[[0.4, 18.8, -2.6], [1.0, 18.8, -1.6], [1.4, 18.6, -0.8], OCULOMOTOR_SPLIT], [OCULOMOTOR_SPLIT, [1.7, 20.0, 1.8]], [OCULOMOTOR_SPLIT, [1.6, 18.9, 2.0], [2.2, 18.6, 3.0]]].flatMap(both), r: 0.15,
      lesion: { en: 'Complete palsy: the eye looks "down and out" (lateral rectus and superior oblique act unopposed), the lid droops completely (ptosis) and the pupil is dilated and fixed, with no accommodation. A painful palsy with a dilated pupil suggests compression by a posterior communicating artery aneurysm; a diabetic (ischaemic) palsy usually spares the pupil.',
        de: 'Vollständige Lähmung: Das Auge blickt "nach unten außen" (M. rectus lateralis und M. obliquus superior wirken ungehemmt), das Lid hängt vollständig (Ptosis), die Pupille ist weit und lichtstarr, die Akkommodation fehlt. Eine schmerzhafte Parese mit weiter Pupille spricht für die Kompression durch ein Aneurysma der A. communicans posterior; eine diabetische (ischämische) Parese spart die Pupille meist aus.' } }),
  N('n_trochlear', 'cranial', ['CN IV'], [], { en: 'Trochlear nerve (CN IV)', de: 'Rollnerv (IV. Hirnnerv)', la: 'Nervus trochlearis' },
    { en: 'The thinnest cranial nerve and the only one to leave the back of the brainstem (below the inferior colliculi) and to cross completely. It winds around the midbrain, runs in the lateral wall of the cavernous sinus and enters the orbit through the superior orbital fissure, outside the tendinous ring, to supply the superior oblique.',
      de: 'Der dünnste Hirnnerv und der einzige, der dorsal aus dem Hirnstamm austritt (unterhalb der Colliculi inferiores) und vollständig kreuzt. Er windet sich um das Mittelhirn, zieht in der Seitenwand des Sinus cavernosus und durch die Fissura orbitalis superior außerhalb des Anulus tendineus in die Orbita zum M. obliquus superior.' },
    { paths: both([[0.3, 19.0, -4.0], [1.6, 18.8, -2.6], [1.5, 18.8, -0.9], [1.4, 19.6, 0.9], [1.3, 20.0, 1.6]]), r: 0.1,
      lesion: { en: 'Vertical double vision, worst when looking down and in (reading, walking downstairs); the affected eye is slightly higher. Patients tilt the head towards the healthy side to compensate. Its long intracranial course makes it vulnerable in head injury.',
        de: 'Vertikale Doppelbilder, am stärksten beim Blick nach unten innen (Lesen, Treppabgehen); das betroffene Auge steht etwas höher. Die Patienten neigen den Kopf zur gesunden Seite. Durch den langen intrakraniellen Verlauf ist er beim Schädel-Hirn-Trauma gefährdet.' } }),
  N('n_trigeminal', 'cranial', ['CN V1', 'CN V2', 'CN V3'], [], { en: 'Trigeminal nerve (CN V)', de: 'Drillingsnerv (V. Hirnnerv)', la: 'Nervus trigeminus' },
    { en: 'Largest cranial nerve and the sensory nerve of the face, eye, nose, mouth, teeth and most of the dura. A large sensory root and a small motor root leave the side of the pons; the sensory root swells into the trigeminal ganglion in a dural pocket on the petrous apex, which divides into V1 (ophthalmic, superior orbital fissure), V2 (maxillary, foramen rotundum) and V3 (mandibular, foramen ovale). The motor root joins V3 and supplies the muscles of mastication.',
      de: 'Größter Hirnnerv und sensibler Nerv von Gesicht, Auge, Nase, Mund, Zähnen und dem Großteil der Dura. Eine große sensible und eine kleine motorische Wurzel verlassen seitlich die Brücke; die sensible Wurzel schwillt in einer Duratasche auf der Felsenbeinspitze zum Ganglion trigeminale an, das sich in V1 (N. ophthalmicus, Fissura orbitalis superior), V2 (N. maxillaris, Foramen rotundum) und V3 (N. mandibularis, Foramen ovale) teilt. Die motorische Wurzel schließt sich V3 an und versorgt die Kaumuskeln.' },
    { paths: both([[0.9, 17.2, -2.8], TRIGEMINAL_GANGLION]), r: 0.35,
      lesion: { en: 'Trigeminal neuralgia: brief, lightning-like attacks of pain in one division (usually V2 or V3), triggered by touch, chewing or speaking, often from a vessel compressing the root. A complete lesion numbs one half of the face, abolishes the corneal reflex and weakens chewing; the jaw deviates towards the side of the lesion.',
        de: 'Trigeminusneuralgie: kurze, blitzartige Schmerzattacken in einem Ast (meist V2 oder V3), ausgelöst durch Berührung, Kauen oder Sprechen, oft durch ein Gefäß, das die Wurzel komprimiert. Eine vollständige Läsion macht eine Gesichtshälfte taub, hebt den Kornealreflex auf und schwächt das Kauen; der Unterkiefer weicht zur Seite der Läsion ab.' } }),
  N('n_ophthalmic', 'trigeminal', ['CN V1'], ['n_trigeminal'], { en: 'Ophthalmic nerve (V1)', de: 'Augennerv (V1)', la: 'Nervus ophthalmicus' },
    { en: 'Purely sensory first division. It runs in the lateral wall of the cavernous sinus and divides before the superior orbital fissure into the frontal (supraorbital and supratrochlear nerves to the forehead and scalp), lacrimal and nasociliary nerves (cornea via the long ciliary nerves, tip of the nose). It carries the postganglionic parasympathetic fibres to the lacrimal gland on its last stretch.',
      de: 'Rein sensibler erster Ast. Er zieht in der Seitenwand des Sinus cavernosus und teilt sich vor der Fissura orbitalis superior in N. frontalis (Nn. supraorbitalis und supratrochlearis zu Stirn und Kopfhaut), N. lacrimalis und N. nasociliaris (Hornhaut über die Nn. ciliares longi, Nasenspitze). Auf seinem letzten Stück führt er die postganglionären parasympathischen Fasern zur Tränendrüse.' },
    { paths: [[[2.2, 17.7, -1.4], [1.7, 18.4, -0.6], [1.6, 19.3, 0.8], [2.0, 20.4, 2.6], [2.3, 21.1, 4.9], [2.4, 22.6, 5.4]],
      [[1.6, 19.3, 0.8], [1.4, 19.9, 2.6], [1.0, 20.0, 3.6]], [[1.6, 19.3, 0.8], [2.6, 20.2, 2.4], [3.3, 20.4, 3.6]]].flatMap(both), r: 0.12,
      lesion: { en: 'Loss of the corneal reflex on that side (the afferent limb is lost; the other eye still blinks when the healthy cornea is touched). Herpes zoster ophthalmicus: blisters on the forehead and, when the tip of the nose is involved (nasociliary nerve, Hutchinson sign), a high risk of eye involvement.',
        de: 'Ausfall des Kornealreflexes auf dieser Seite (afferenter Schenkel fehlt; bei Berührung der gesunden Hornhaut blinzeln beide Augen). Zoster ophthalmicus: Bläschen auf der Stirn und, wenn die Nasenspitze befallen ist (N. nasociliaris, Hutchinson-Zeichen), hohes Risiko einer Augenbeteiligung.' } }),
  N('n_maxillary', 'trigeminal', ['CN V2'], ['n_trigeminal'], { en: 'Maxillary nerve (V2)', de: 'Oberkiefernerv (V2)', la: 'Nervus maxillaris' },
    { en: 'Purely sensory second division. It leaves the skull through the foramen rotundum into the pterygopalatine fossa (where the pterygopalatine ganglion hangs from it), runs through the orbit floor as the infraorbital nerve and emerges below the eye. It supplies the cheek, upper lip, lower eyelid, side of the nose, upper teeth, palate, nasal cavity, nasopharynx and maxillary sinus.',
      de: 'Rein sensibler zweiter Ast. Er verlässt den Schädel durch das Foramen rotundum in die Fossa pterygopalatina (dort hängt das Ganglion pterygopalatinum an ihm), zieht als N. infraorbitalis durch den Orbitaboden und tritt unter dem Auge aus. Er versorgt Wange, Oberlippe, Unterlid, Nasenflügel, obere Zähne, Gaumen, Nasenhöhle, Nasopharynx und Kieferhöhle.' },
    { paths: both([[2.3, 17.5, -1.2], [1.7, 17.9, 0.2], [2.0, 17.6, 1.2], [2.4, 18.3, 3.0], [2.5, 18.0, 5.2], [2.6, 17.0, 5.6]]), r: 0.14,
      lesion: { en: 'A fracture of the orbit floor (blow-out) or of the maxilla injures the infraorbital nerve: numb cheek, upper lip and upper teeth. Blocked at the infraorbital foramen for dental work on the upper front teeth.',
        de: 'Eine Orbitabodenfraktur (Blow-out) oder Oberkieferfraktur schädigt den N. infraorbitalis: taube Wange, Oberlippe und obere Zähne. Für Zahnbehandlungen an den oberen Frontzähnen wird er am Foramen infraorbitale betäubt.' } }),
  N('n_mandibular', 'trigeminal', ['CN V3'], ['n_trigeminal'], { en: 'Mandibular nerve (V3)', de: 'Unterkiefernerv (V3)', la: 'Nervus mandibularis' },
    { en: 'Third division, the only mixed one (it carries the whole motor root). It leaves the skull through the foramen ovale into the infratemporal fossa and divides into a mainly motor anterior trunk (masseteric, deep temporal and pterygoid nerves, buccal nerve) and a mainly sensory posterior trunk (auriculotemporal, lingual and inferior alveolar nerves; the latter gives the nerve to mylohyoid). The otic ganglion lies on its medial side.',
      de: 'Dritter Ast und der einzige gemischte (er führt die gesamte motorische Wurzel). Er verlässt den Schädel durch das Foramen ovale in die Fossa infratemporalis und teilt sich in einen überwiegend motorischen vorderen Stamm (Nn. massetericus, temporales profundi, pterygoidei, N. buccalis) und einen überwiegend sensiblen hinteren Stamm (Nn. auriculotemporalis, lingualis und alveolaris inferior; letzterer gibt den N. mylohyoideus ab). Medial liegt ihm das Ganglion oticum an.' },
    { paths: both([[2.6, 17.3, -1.4], [2.4, 16.9, -0.8], V3_TRUNK]), r: 0.3,
      lesion: { en: 'Paralysis of the muscles of mastication: on opening, the jaw deviates towards the side of the lesion (the healthy lateral pterygoid pushes it over); chewing is weak and the temporal fossa wastes. Numbness of the lower face, lower teeth and anterior tongue; the jaw jerk is lost.',
        de: 'Lähmung der Kaumuskeln: Beim Öffnen weicht der Unterkiefer zur Seite der Läsion ab (der gesunde M. pterygoideus lateralis schiebt ihn hinüber); das Kauen ist schwach, die Schläfengrube atrophiert. Taubheit der unteren Gesichtshälfte, der unteren Zähne und der vorderen Zunge; der Masseterreflex fehlt.' } }),
  N('n_masseteric', 'trigeminal', ['CN V3'], ['n_mandibular'], { en: 'Masseteric nerve', de: 'N. massetericus', la: 'Nervus massetericus' },
    { en: 'Passes laterally through the mandibular notch, above the lateral pterygoid, to enter the deep surface of masseter; it also gives a branch to the temporomandibular joint.',
      de: 'Zieht oberhalb des M. pterygoideus lateralis nach lateral durch die Incisura mandibulae zur Innenfläche des M. masseter; er gibt auch einen Ast zum Kiefergelenk ab.' },
    { paths: both([V3_TRUNK, [4.0, 16.6, -0.3], [4.6, 16.0, 0], [5.2, 15.2, 0.4]]), r: 0.08 }),
  N('n_deep_temporal', 'trigeminal', ['CN V3'], ['n_mandibular'], { en: 'Deep temporal nerves', de: 'Nn. temporales profundi', la: 'Nervi temporales profundi' },
    { en: 'Usually two nerves that rise above the lateral pterygoid into the deep surface of temporalis.',
      de: 'Meist zwei Nerven, die oberhalb des M. pterygoideus lateralis zur Innenfläche des M. temporalis aufsteigen.' },
    { paths: both([V3_TRUNK, [3.8, 17, 0.2], [4.8, 18.8, 0.6], [5.5, 20.4, 0.4]]), r: 0.08 }),
  N('n_pterygoid', 'trigeminal', ['CN V3'], ['n_mandibular'], { en: 'Pterygoid nerves', de: 'Nn. pterygoidei', la: 'Nervi pterygoidei medialis et lateralis' },
    { en: 'Short branches to the medial and lateral pterygoid; the nerve to medial pterygoid also supplies tensor tympani and tensor veli palatini through the otic ganglion.',
      de: 'Kurze Äste zu den Mm. pterygoidei medialis und lateralis; der N. pterygoideus medialis versorgt über das Ganglion oticum auch die Mm. tensor tympani und tensor veli palatini.' },
    { paths: [[V3_TRUNK, [2.6, 15.6, 0], [2.8, 14.8, 0]], [V3_TRUNK, [3.4, 16.4, 0.2], [3.6, 16.6, 0.8]]].flatMap(both), r: 0.07 }),
  N('n_lingual', 'trigeminal', ['CN V3', 'CN VII'], ['n_mandibular', 'n_chorda_tympani'], { en: 'Lingual nerve', de: 'Zungennerv', la: 'Nervus lingualis' },
    { en: 'Runs down between the pterygoids, where the chorda tympani (VII) joins it, then forwards just below the third molar against the inner surface of the mandible, loops under the submandibular duct and enters the tongue. It carries general sensation of the anterior two-thirds of the tongue and floor of the mouth (V3), taste from the same area and parasympathetic fibres to the submandibular ganglion (both VII).',
      de: 'Zieht zwischen den Mm. pterygoidei nach unten, wo sich ihm die Chorda tympani (VII) anschließt, dann direkt unter dem 3. Molaren an der Innenseite der Mandibula nach vorn, unterkreuzt den Ductus submandibularis und tritt in die Zunge ein. Er führt die allgemeine Sensibilität der vorderen zwei Zungendrittel und des Mundbodens (V3), den Geschmack desselben Gebiets und parasympathische Fasern zum Ganglion submandibulare (beide VII).' },
    { paths: both([V3_TRUNK, [3.2, 14.6, -0.2], [3.4, 12.6, 0.8], [2.6, 12.0, 2.0], [1.6, 12.2, 3.4], [1.0, 12.8, 4.0]]), r: 0.1,
      lesion: { en: 'Injured during removal of a lower wisdom tooth (it lies against the bone just medial to it): numbness and loss of taste on the anterior two-thirds of the tongue on that side, with reduced submandibular salivation.',
        de: 'Gefährdet bei der Entfernung unterer Weisheitszähne (er liegt dem Knochen direkt medial davon an): Taubheit und Geschmacksverlust der vorderen zwei Zungendrittel dieser Seite, verminderte Speichelsekretion der Gl. submandibularis.' } }),
  N('n_inferior_alveolar', 'trigeminal', ['CN V3'], ['n_mandibular'], { en: 'Inferior alveolar nerve', de: 'N. alveolaris inferior', la: 'Nervus alveolaris inferior' },
    { en: 'Enters the mandibular foramen on the inner surface of the ramus, runs in the mandibular canal below the teeth, which it supplies, and leaves through the mental foramen as the mental nerve (skin of the chin and lower lip). Before entering the canal it gives the nerve to mylohyoid.',
      de: 'Tritt an der Innenfläche des Ramus durch das Foramen mandibulae in den Canalis mandibulae, zieht unter den Zähnen, die er versorgt, nach vorn und verlässt den Kanal durch das Foramen mentale als N. mentalis (Haut von Kinn und Unterlippe). Vor dem Kanal gibt er den N. mylohyoideus ab.' },
    { paths: both([V3_TRUNK, [3.8, 14.8, -0.4], [4.3, 13.8, 0], [4.1, 11.8, 1.6], [2.9, 11.2, 4.0], [2.4, 11.4, 4.8]]), r: 0.1,
      lesion: { en: 'Blocked at the mandibular foramen for dental work on the lower teeth (the lingual nerve is usually numbed too). Injury in mandible fractures or wisdom tooth surgery numbs the lower lip and chin.',
        de: 'Wird für Zahnbehandlungen im Unterkiefer am Foramen mandibulae betäubt (der N. lingualis meist mit). Eine Verletzung bei Unterkieferfrakturen oder Weisheitszahnoperationen macht Unterlippe und Kinn taub.' } }),
  N('n_mylohyoid', 'trigeminal', ['CN V3'], ['n_inferior_alveolar'], { en: 'Nerve to mylohyoid', de: 'N. mylohyoideus', la: 'Nervus mylohyoideus' },
    { en: 'Leaves the inferior alveolar nerve just before the mandibular foramen and runs in a groove on the inner mandible to the lower surface of mylohyoid, supplying it and the anterior belly of digastric.',
      de: 'Zweigt kurz vor dem Foramen mandibulae vom N. alveolaris inferior ab und zieht in einer Rinne an der Innenseite der Mandibula zur Unterfläche des M. mylohyoideus; er versorgt ihn und den vorderen Bauch des M. digastricus.' },
    { paths: both([[4.1, 14.0, -0.2], [3.8, 12.0, 0.6], [2.6, 10.6, 2.0], [1.6, 10.3, 3.4]]), r: 0.07 }),
  N('n_auriculotemporal', 'trigeminal', ['CN V3', 'CN IX'], ['n_mandibular', 'n_lesser_petrosal'], { en: 'Auriculotemporal nerve', de: 'N. auriculotemporalis', la: 'Nervus auriculotemporalis' },
    { en: 'Usually splits around the middle meningeal artery, runs back behind the neck of the mandible through the parotid gland and rises in front of the ear with the superficial temporal artery. Sensory to the temple, the front of the ear and the temporomandibular joint; it carries the parasympathetic fibres from the otic ganglion (IX) to the parotid gland.',
      de: 'Umfasst meist mit zwei Wurzeln die A. meningea media, zieht hinter dem Collum mandibulae durch die Parotis nach hinten und steigt mit der A. temporalis superficialis vor dem Ohr auf. Sensibel für Schläfe, vordere Ohrmuschel und Kiefergelenk; er führt die parasympathischen Fasern aus dem Ganglion oticum (IX) zur Parotis.' },
    { paths: both([V3_TRUNK, [3.8, 16.0, -1.6], [4.8, 16.0, -2.0], [5.6, 17.0, -2.2], [5.8, 18.4, -2.0]]), r: 0.08 }),
  N('n_abducens', 'cranial', ['CN VI'], [], { en: 'Abducens nerve (CN VI)', de: 'Augenabziehnerv (VI. Hirnnerv)', la: 'Nervus abducens' },
    { en: 'Leaves the brainstem at the junction of pons and medulla, climbs steeply over the petrous apex (Dorello\'s canal), runs freely through the cavernous sinus beside the internal carotid artery and enters the orbit through the superior orbital fissure to supply the lateral rectus.',
      de: 'Tritt an der Grenze von Brücke und Medulla aus, steigt steil über die Felsenbeinspitze (Dorello-Kanal), zieht frei durch den Sinus cavernosus neben der A. carotis interna und durch die Fissura orbitalis superior zum M. rectus lateralis.' },
    { paths: both([[0.4, 16.4, -3.4], [0.8, 17.6, -2.2], [1.2, 18.2, -0.8], [1.7, 19.3, 0.9], [2.6, 19.5, 2.2]]), r: 0.1,
      lesion: { en: 'The eye cannot look outwards and is turned in (convergent squint) with horizontal double vision, worst looking towards the side of the lesion. Because of its long course over the petrous apex, raised intracranial pressure can cause a palsy on either side ("false localising sign").',
        de: 'Das Auge kann nicht nach außen blicken und steht nach innen (Einwärtsschielen), mit horizontalen Doppelbildern, am stärksten beim Blick zur Seite der Läsion. Wegen des langen Verlaufs über die Felsenbeinspitze kann erhöhter Hirndruck eine Parese auf beiden Seiten verursachen ("falsch lokalisierendes Zeichen").' } })
];

const FACIAL_BRANCH = ['n_parotid_plexus', 'n_corticonuclear_facial'];
const nervesFacial = [
  N('n_facial', 'cranial', ['CN VII'], [], { en: 'Facial nerve (CN VII)', de: 'Gesichtsnerv (VII. Hirnnerv)', la: 'Nervus facialis' },
    { en: 'Leaves the brainstem at the cerebellopontine angle with CN VIII and enters the internal acoustic meatus. In the facial canal of the temporal bone it bends sharply at the geniculate ganglion (greater petrosal nerve: tears, nasal and palatal glands), runs down behind the middle ear (nerve to stapedius, chorda tympani: taste of the anterior two-thirds of the tongue and submandibular and sublingual salivation) and leaves through the stylomastoid foramen. It then supplies the posterior belly of digastric and stylohyoid and divides in the parotid gland into the branches for the muscles of facial expression.',
      de: 'Tritt im Kleinhirnbrückenwinkel mit dem N. VIII aus dem Hirnstamm und zieht in den Meatus acusticus internus. Im Canalis facialis des Felsenbeins biegt er am Ganglion geniculi scharf um (N. petrosus major: Tränen-, Nasen- und Gaumendrüsen), zieht hinter dem Mittelohr nach unten (N. stapedius, Chorda tympani: Geschmack der vorderen zwei Zungendrittel sowie Speichel der Gll. submandibularis und sublingualis) und verlässt den Schädel durch das Foramen stylomastoideum. Dann versorgt er den hinteren Digastricusbauch und den M. stylohyoideus und teilt sich in der Parotis in die Äste für die mimische Muskulatur.' },
    { paths: both([[1.0, 16.6, -3.2], [3.0, 17.0, -2.6], GENICULATE, [4.4, 17.0, -2.8], [4.4, 16.0, -3.2], STYLOMASTOID]), r: 0.16,
      lesion: { en: 'Peripheral (lower motor neuron) facial palsy, e.g. Bell\'s palsy: the whole half of the face is paralysed including the forehead, the eye cannot close (Bell phenomenon: the eyeball rolls up), the corner of the mouth droops. Depending on the level there is also loss of tears (above the geniculate ganglion), hyperacusis (stapedius) and loss of taste with reduced salivation (chorda tympani).',
        de: 'Periphere Fazialisparese, z. B. idiopathisch (Bell-Lähmung): Die ganze Gesichtshälfte einschließlich der Stirn ist gelähmt, das Auge schließt nicht (Bell-Phänomen: der Bulbus rollt nach oben), der Mundwinkel hängt. Je nach Höhe kommen fehlende Tränensekretion (oberhalb des Ganglion geniculi), Hyperakusis (M. stapedius) und Geschmacksverlust mit verminderter Speichelsekretion (Chorda tympani) hinzu.' } }),
  N('n_greater_petrosal', 'facial', ['CN VII'], ['n_facial'], { en: 'Greater petrosal nerve', de: 'N. petrosus major', la: 'Nervus petrosus major' },
    { en: 'Leaves the geniculate ganglion, runs forwards on the petrous bone and, joined by sympathetic fibres (deep petrosal nerve), forms the nerve of the pterygoid canal to the pterygopalatine ganglion. Its parasympathetic fibres supply the lacrimal gland and the glands of the nose and palate.',
      de: 'Verlässt das Ganglion geniculi, zieht auf der Felsenbeinvorderfläche nach vorn und bildet mit sympathischen Fasern (N. petrosus profundus) den N. canalis pterygoidei zum Ganglion pterygopalatinum. Seine parasympathischen Fasern versorgen Tränendrüse sowie Nasen- und Gaumendrüsen.' },
    { paths: both([GENICULATE, [3.0, 17.3, -1.2], [1.8, 16.8, -0.2], [2.0, 17.4, 1.1], [3.3, 20.3, 3.5]]), r: 0.06 }),
  N('n_to_stapedius', 'facial', ['CN VII'], ['n_facial'], { en: 'Nerve to stapedius', de: 'N. stapedius', la: 'Nervus stapedius' },
    { en: 'Tiny branch in the facial canal to the stapedius, which damps the movement of the stapes in response to loud sound (acoustic reflex).',
      de: 'Feiner Ast im Fazialiskanal zum M. stapedius, der bei lauten Geräuschen die Bewegung des Steigbügels dämpft (Stapediusreflex).' },
    { paths: both([[4.4, 16.6, -3.0], [4.6, 16.8, -2.5]]), r: 0.05 }),
  N('n_chorda_tympani', 'facial', ['CN VII'], ['n_facial'], { en: 'Chorda tympani', de: 'Paukensaite', la: 'Chorda tympani' },
    { en: 'Leaves the facial nerve just above the stylomastoid foramen, crosses the middle ear between the malleus and incus under the mucosa, exits through the petrotympanic fissure and joins the lingual nerve. It carries taste from the anterior two-thirds of the tongue and parasympathetic fibres to the submandibular ganglion (submandibular and sublingual glands).',
      de: 'Verlässt den N. facialis kurz oberhalb des Foramen stylomastoideum, zieht unter der Schleimhaut zwischen Hammer und Amboss durch die Paukenhöhle, tritt durch die Fissura petrotympanica aus und schließt sich dem N. lingualis an. Sie führt den Geschmack der vorderen zwei Zungendrittel und parasympathische Fasern zum Ganglion submandibulare (Gll. submandibularis und sublingualis).' },
    { paths: both([[4.4, 15.8, -3.2], [4.6, 16.8, -2.4], [3.9, 16.3, -1.2], [3.2, 14.6, -0.2]]), r: 0.05,
      lesion: { en: 'Can be damaged in middle ear disease or surgery: altered taste on the front of the tongue on that side.',
        de: 'Kann bei Mittelohrerkrankungen oder -operationen geschädigt werden: veränderter Geschmack vorn auf der Zunge dieser Seite.' } }),
  N('n_facial_digastric', 'facial', ['CN VII'], ['n_facial'], { en: 'Digastric and stylohyoid branches of the facial nerve', de: 'R. digastricus und R. stylohyoideus des N. facialis', la: 'Rami digastricus et stylohyoideus nervi facialis' },
    { en: 'Given off just below the stylomastoid foramen to the posterior belly of digastric and to stylohyoid (2nd pharyngeal arch muscles).',
      de: 'Gehen direkt unterhalb des Foramen stylomastoideum zum hinteren Bauch des M. digastricus und zum M. stylohyoideus ab (Muskeln des 2. Schlundbogens).' },
    { paths: both([STYLOMASTOID, [4.0, 14.6, -3.0], [3.8, 13.8, -2.4]]), r: 0.06 }),
  N('n_parotid_plexus', 'facial', ['CN VII'], ['n_facial'], { en: 'Parotid plexus of the facial nerve', de: 'Plexus intraparotideus', la: 'Plexus intraparotideus nervi facialis' },
    { en: 'Within the parotid gland the facial nerve divides into an upper (temporofacial) and a lower (cervicofacial) trunk, which branch and reunite into a plexus ("pes anserinus") and give the five terminal branches: temporal, zygomatic, buccal, marginal mandibular and cervical.',
      de: 'In der Parotis teilt sich der N. facialis in einen oberen (temporofazialen) und einen unteren (zervikofazialen) Stamm, die sich verzweigen und wieder verbinden ("Pes anserinus") und die fünf Endäste abgeben: Rr. temporales, zygomatici, buccales, R. marginalis mandibulae und R. colli.' },
    { paths: both([STYLOMASTOID, [4.8, 15.0, -1.8], PAROTID_PLEXUS]), r: 0.12,
      lesion: { en: 'A parotid tumour or parotid surgery: peripheral facial palsy of the involved branches, but tears, taste, salivation and the stapedius reflex are preserved because their fibres left the nerve earlier.',
        de: 'Parotistumor oder Parotisoperation: periphere Lähmung der betroffenen Äste, Tränen, Geschmack, Speichel und Stapediusreflex bleiben erhalten, weil ihre Fasern den Nerv vorher verlassen haben.' } }),
  N('n_facial_temporal', 'facial', ['CN VII'], ['n_parotid_plexus'], { en: 'Temporal branches of the facial nerve', de: 'Rr. temporales des N. facialis', la: 'Rami temporales nervi facialis' },
    { en: 'Cross the zygomatic arch to frontalis and the upper orbicularis oculi. Their motor neurons in the facial nucleus receive cortical input from both hemispheres, which is why the forehead is spared in a central facial palsy.',
      de: 'Ziehen über den Jochbogen zum M. frontalis und zum oberen M. orbicularis oculi. Ihre Motoneurone im Fazialiskern erhalten Zuflüsse aus beiden Hemisphären; deshalb bleibt die Stirn bei der zentralen Fazialisparese verschont.' },
    { paths: both([PAROTID_PLEXUS, [5.6, 16.4, 0], [6.0, 17.6, 0.6], [5.5, 19.8, 2.6], [4.5, 21.4, 3.7]]), r: 0.06,
      lesion: { en: 'Lie superficially over the zygomatic arch and are at risk in facelift and temple surgery: the eyebrow droops and the forehead cannot be wrinkled on that side.',
        de: 'Liegen über dem Jochbogen oberflächlich und sind bei Facelift und Schläfenoperationen gefährdet: Die Braue hängt, die Stirn lässt sich auf dieser Seite nicht runzeln.' } }),
  N('n_facial_zygomatic', 'facial', ['CN VII'], FACIAL_BRANCH, { en: 'Zygomatic branches of the facial nerve', de: 'Rr. zygomatici des N. facialis', la: 'Rami zygomatici nervi facialis' },
    { en: 'Run across the zygomatic bone to orbicularis oculi (mainly its lower part) and zygomaticus major; essential for eye closure.',
      de: 'Ziehen über das Jochbein zum M. orbicularis oculi (vor allem dessen unterem Teil) und zum M. zygomaticus major; wichtig für den Lidschluss.' },
    { paths: both([PAROTID_PLEXUS, [6.0, 16.0, 0.8], [5.5, 16.8, 2.6], [4.0, 18.6, 4.6]]), r: 0.06 }),
  N('n_facial_buccal', 'facial', ['CN VII'], FACIAL_BRANCH, { en: 'Buccal branches of the facial nerve', de: 'Rr. buccales des N. facialis', la: 'Rami buccales nervi facialis' },
    { en: 'Run forwards over masseter, alongside the parotid duct, to buccinator, orbicularis oris and the muscles of the upper lip and nose.',
      de: 'Ziehen über den M. masseter, entlang dem Ductus parotideus, nach vorn zum M. buccinator, M. orbicularis oris und zu den Muskeln von Oberlippe und Nase.' },
    { paths: both([PAROTID_PLEXUS, [5.9, 14.8, 1.0], [4.6, 14.2, 3.8], [2.8, 13.6, 5.4]]), r: 0.06 }),
  N('n_facial_marginal', 'facial', ['CN VII'], FACIAL_BRANCH, { en: 'Marginal mandibular branch of the facial nerve', de: 'R. marginalis mandibulae des N. facialis', la: 'Ramus marginalis mandibulae nervi facialis' },
    { en: 'Runs along (and often dips below) the lower border of the mandible, crossing the facial artery and vein, to the muscles of the lower lip and chin (depressor anguli oris, depressor labii inferioris, mentalis).',
      de: 'Zieht am (oft etwas unterhalb des) Unterkieferrand nach vorn, kreuzt A. und V. facialis und versorgt die Muskeln von Unterlippe und Kinn (Mm. depressor anguli oris, depressor labii inferioris, mentalis).' },
    { paths: both([PAROTID_PLEXUS, [5.7, 12.4, -0.1], [4.6, 11.2, 2.2], [3.0, 11.6, 4.8]]), r: 0.06,
      lesion: { en: 'At risk with incisions in the upper neck (submandibular gland surgery): the lower lip on that side cannot be pulled down, giving an asymmetric smile. Incisions are therefore placed two finger-breadths below the mandible.',
        de: 'Gefährdet bei Schnitten am oberen Hals (Submandibularis-Chirurgie): Die Unterlippe dieser Seite kann nicht nach unten gezogen werden, das Lächeln wird asymmetrisch. Schnitte liegen deshalb zwei Querfinger unterhalb der Mandibula.' } }),
  N('n_facial_cervical', 'facial', ['CN VII'], FACIAL_BRANCH, { en: 'Cervical branch of the facial nerve', de: 'R. colli des N. facialis', la: 'Ramus colli nervi facialis' },
    { en: 'Leaves the lower pole of the parotid gland and runs down into the neck to supply platysma.',
      de: 'Verlässt den unteren Parotispol und zieht zum Hals, wo er das Platysma versorgt.' },
    { paths: both([PAROTID_PLEXUS, [5.0, 12.0, -0.8], [5.2, 10.2, 0.8], [4.8, 7.6, 1.8]]), r: 0.06 }),
  N('n_corticonuclear_facial', 'central', ['CN VII'], [], { en: 'Corticonuclear fibres to the facial nucleus', de: 'Kortikonukleäre Fasern zum Fazialiskern', la: 'Fibrae corticonucleares ad nucleum nervi facialis' },
    { en: 'Upper motor neurons from the face area of the motor cortex descend through the genu of the internal capsule to the facial nucleus in the pons. The part of the nucleus for the lower face receives fibres almost only from the opposite hemisphere; the part for the forehead (and partly the upper orbicularis oculi) receives fibres from both. Shown here as a single crossing pathway.',
      de: 'Erste Motoneurone aus dem Gesichtsfeld der motorischen Rinde ziehen durch das Knie der Capsula interna zum Fazialiskern in der Brücke. Der Kernanteil für das untere Gesicht erhält Fasern fast nur aus der Gegenseite; der Anteil für die Stirn (und teilweise den oberen M. orbicularis oculi) aus beiden Hemisphären. Hier als eine kreuzende Bahn dargestellt.' },
    { paths: both([[-4.0, 25.5, -1.0], [-2.6, 23.0, -1.4], [-1.2, 20.0, -2.4], [-0.4, 18.0, -3.2], [0.3, 17.0, -3.5], [0.6, 16.6, -3.6]]), r: 0.08,
      lesion: { en: 'Central (upper motor neuron) facial palsy, e.g. a stroke: the lower face on the opposite side is paralysed but the forehead is spared and the eye can be closed (weakly), because the forehead motor neurons still receive input from the other hemisphere. Emotional smiling may be preserved. Usually with a hemiparesis on the same side as the facial weakness.',
        de: 'Zentrale Fazialisparese, z. B. beim Schlaganfall: Das untere Gesicht der Gegenseite ist gelähmt, die Stirn bleibt verschont und das Auge kann (schwach) geschlossen werden, weil die Motoneurone der Stirn noch Zuflüsse aus der anderen Hemisphäre erhalten. Das emotionale Lächeln kann erhalten sein. Meist mit Hemiparese auf der Seite der Gesichtslähmung.' } }),
  N('n_vestibulocochlear', 'cranial', ['CN VIII'], [], { en: 'Vestibulocochlear nerve (CN VIII)', de: 'Hör- und Gleichgewichtsnerv (VIII. Hirnnerv)', la: 'Nervus vestibulocochlearis' },
    { en: 'Sensory nerve of hearing (cochlear part) and balance (vestibular part). It runs with the facial nerve through the internal acoustic meatus to the inner ear in the petrous bone.',
      de: 'Sensorischer Nerv für Hören (Pars cochlearis) und Gleichgewicht (Pars vestibularis). Er zieht mit dem N. facialis durch den Meatus acusticus internus zum Innenohr im Felsenbein.' },
    { paths: both([[0.9, 16.3, -3.5], [3.0, 16.8, -2.9], [4.0, 16.7, -3.0]]), r: 0.14,
      lesion: { en: 'A vestibular schwannoma (acoustic neuroma) in the internal acoustic meatus causes one-sided hearing loss and tinnitus, later vertigo; as it grows into the cerebellopontine angle it can compress V (lost corneal reflex) and VII.',
        de: 'Ein Vestibularisschwannom (Akustikusneurinom) im Meatus acusticus internus verursacht einseitige Hörminderung und Tinnitus, später Schwindel; wächst es in den Kleinhirnbrückenwinkel, kann es V (Kornealreflex fehlt) und VII komprimieren.' } })
];

const SUPERIOR_LARYNGEAL = [[2.9, 14.4, -2.6], [2.2, 12, -1.6], SUP_LARYNGEAL_SPLIT];
const nervesLower = [
  N('n_glossopharyngeal', 'cranial', ['CN IX'], [], { en: 'Glossopharyngeal nerve (CN IX)', de: 'Zungen-Rachen-Nerv (IX. Hirnnerv)', la: 'Nervus glossopharyngeus' },
    { en: 'Leaves the medulla and the skull through the jugular foramen with X and XI, runs down between the internal and external carotid arteries, winds around stylopharyngeus (its only muscle) and enters the pharynx under hyoglossus. Sensory to the posterior third of the tongue (including taste), the tonsils and pharynx (afferent limb of the gag reflex), the middle ear (tympanic nerve, which continues as the lesser petrosal nerve to the parotid gland) and the carotid sinus and body.',
      de: 'Verlässt Medulla und Schädel durch das Foramen jugulare zusammen mit X und XI, zieht zwischen A. carotis interna und externa nach unten, windet sich um den M. stylopharyngeus (seinen einzigen Muskel) und tritt unter dem M. hyoglossus in den Rachen. Sensibel für das hintere Zungendrittel (einschließlich Geschmack), Tonsillen und Rachen (afferenter Schenkel des Würgreflexes), Mittelohr (N. tympanicus, der sich als N. petrosus minor zur Parotis fortsetzt) sowie Sinus und Glomus caroticum.' },
    { paths: both([[0.8, 15.6, -4.0], [2.6, 15.6, -3.3], [3.2, 14.4, -2.2], [2.8, 12.4, -0.8], [1.4, 11.8, 0.6]]), r: 0.12,
      lesion: { en: 'Rarely affected alone (usually with X and XI in a jugular foramen syndrome). The gag reflex is lost when the affected side of the pharynx is touched, taste and sensation on the back of the tongue are lost, and parotid secretion falls.',
        de: 'Selten isoliert betroffen (meist mit X und XI beim Foramen-jugulare-Syndrom). Der Würgreflex fehlt bei Berührung der betroffenen Rachenseite, Geschmack und Sensibilität des Zungengrunds fallen aus, die Parotissekretion sinkt.' } }),
  N('n_lesser_petrosal', 'vagus', ['CN IX'], ['n_glossopharyngeal'], { en: 'Tympanic and lesser petrosal nerves', de: 'N. tympanicus und N. petrosus minor', la: 'Nervus tympanicus et nervus petrosus minor' },
    { en: 'The tympanic nerve leaves IX below the jugular foramen, forms the tympanic plexus on the promontory of the middle ear (sensory to the middle ear and auditory tube) and continues as the lesser petrosal nerve through the foramen ovale to the otic ganglion, whose fibres reach the parotid gland via the auriculotemporal nerve.',
      de: 'Der N. tympanicus verlässt den N. IX unterhalb des Foramen jugulare, bildet auf dem Promontorium den Plexus tympanicus (sensibel für Mittelohr und Tube) und setzt sich als N. petrosus minor durch das Foramen ovale zum Ganglion oticum fort, dessen Fasern über den N. auriculotemporalis die Parotis erreichen.' },
    { paths: both([[2.8, 15.6, -3.2], [4.2, 16.4, -2.6], [3.0, 17.0, -1.2], [2.5, 16.6, -0.7], [3.6, 16.0, -1.6]]), r: 0.05 }),
  N('n_pharyngeal_plexus', 'vagus', ['CN IX', 'CN X'], ['n_glossopharyngeal', 'n_vagus'], { en: 'Pharyngeal plexus', de: 'Plexus pharyngeus', la: 'Plexus pharyngeus' },
    { en: 'Network on the middle constrictor formed by the pharyngeal branches of IX (sensory) and X (motor, carrying fibres from the nucleus ambiguus), with sympathetic fibres. It supplies all pharyngeal muscles except stylopharyngeus and all palatal muscles except tensor veli palatini, plus palatoglossus.',
      de: 'Geflecht auf dem M. constrictor medius aus den Rr. pharyngei von IX (sensibel) und X (motorisch, Fasern aus dem Nucleus ambiguus) sowie sympathischen Fasern. Es versorgt alle Rachenmuskeln außer dem M. stylopharyngeus, alle Gaumenmuskeln außer dem M. tensor veli palatini und den M. palatoglossus.' },
    { paths: [[[2.9, 13.4, -3.0], [2.0, 12.6, -2.4], [1.0, 12.0, -2.2], [1.2, 10.4, -2.2]], [[3.1, 13.6, -1.8], [1.8, 12.8, -2.2]]].flatMap(both), r: 0.07,
      lesion: { en: 'A unilateral vagal lesion paralyses the palate on that side: the uvula deviates towards the healthy side on saying "ah", and the pharyngeal wall is pulled towards the healthy side ("curtain sign").',
        de: 'Eine einseitige Vagusläsion lähmt das Gaumensegel dieser Seite: Beim "Ah"-Sagen weicht die Uvula zur gesunden Seite ab, die Rachenhinterwand wird zur gesunden Seite gezogen ("Kulissenphänomen").' } }),
  N('n_superior_laryngeal', 'vagus', ['CN X'], ['n_vagus'], { en: 'Superior laryngeal nerve', de: 'N. laryngeus superior', la: 'Nervus laryngeus superior' },
    { en: 'Leaves the vagus at its inferior ganglion and runs down behind the internal carotid artery; at the level of the hyoid it divides into the internal and external laryngeal nerves.',
      de: 'Verlässt den N. vagus am Ganglion inferius und zieht hinter der A. carotis interna nach unten; in Höhe des Zungenbeins teilt er sich in R. internus und R. externus.' },
    { paths: both(SUPERIOR_LARYNGEAL), r: 0.08 }),
  N('n_internal_laryngeal', 'vagus', ['CN X'], ['n_superior_laryngeal'], { en: 'Internal laryngeal nerve', de: 'R. internus des N. laryngeus superior', la: 'Ramus internus nervi laryngei superioris' },
    { en: 'Pierces the thyrohyoid membrane with the superior laryngeal artery. Sensory to the larynx above the vocal folds, the piriform recess and the base of the tongue around the epiglottis: the afferent limb of the cough reflex.',
      de: 'Durchbohrt mit der A. laryngea superior die Membrana thyrohyoidea. Sensibel für den Kehlkopf oberhalb der Stimmlippen, den Recessus piriformis und den Zungengrund um die Epiglottis: afferenter Schenkel des Hustenreflexes.' },
    { paths: both([SUP_LARYNGEAL_SPLIT, [1.4, 8.6, 0.2], [0.8, 7.8, 0.2]]), r: 0.06,
      lesion: { en: 'Loss of sensation above the vocal folds: food and fluid enter the larynx without triggering a cough (silent aspiration). A fish bone in the piriform recess can injure it.',
        de: 'Ausfall der Sensibilität oberhalb der Stimmlippen: Nahrung und Flüssigkeit gelangen in den Kehlkopf, ohne Husten auszulösen (stille Aspiration). Eine Fischgräte im Recessus piriformis kann ihn verletzen.' } }),
  N('n_external_laryngeal', 'vagus', ['CN X'], ['n_superior_laryngeal'], { en: 'External laryngeal nerve', de: 'R. externus des N. laryngeus superior', la: 'Ramus externus nervi laryngei superioris' },
    { en: 'Thin motor branch running down on the inferior constrictor alongside the superior thyroid artery to supply cricothyroid, the muscle that tenses the vocal folds (pitch).',
      de: 'Dünner motorischer Ast, der auf dem M. constrictor inferior entlang der A. thyroidea superior nach unten zieht und den M. cricothyroideus versorgt, der die Stimmlippen spannt (Tonhöhe).' },
    { paths: both([SUP_LARYNGEAL_SPLIT, [1.9, 7.4, 0.4], [1.6, 6.0, 0.6], [1.2, 5.8, 0.7]]), r: 0.05,
      lesion: { en: 'Injured when the superior thyroid vessels are ligated too far from the gland: the voice is weak and tires quickly, and high notes are lost (a problem for singers).',
        de: 'Gefährdet, wenn die oberen Schilddrüsengefäße zu weit von der Drüse entfernt unterbunden werden: Die Stimme ist schwach, ermüdet rasch, hohe Töne fehlen (ein Problem für Sänger).' } }),
  N('n_inferior_laryngeal', 'vagus', ['CN X'], ['n_recurrent_laryngeal_right', 'n_recurrent_laryngeal_left'], { en: 'Inferior laryngeal nerve', de: 'N. laryngeus inferior', la: 'Nervus laryngeus inferior' },
    { en: 'The terminal part of the recurrent laryngeal nerve after it passes under the lower border of the inferior constrictor behind the cricothyroid joint. It supplies all intrinsic laryngeal muscles except cricothyroid (including posterior cricoarytenoid, the only abductor of the vocal folds) and the mucosa below the vocal folds.',
      de: 'Endabschnitt des N. laryngeus recurrens, nachdem er unter dem Unterrand des M. constrictor inferior hinter dem Krikothyroidgelenk in den Kehlkopf eingetreten ist. Er versorgt alle inneren Kehlkopfmuskeln außer dem M. cricothyroideus (einschließlich des M. cricoarytenoideus posterior, des einzigen Stimmritzenöffners) sowie die Schleimhaut unterhalb der Stimmlippen.' },
    { paths: [[[0.9, 6, -1.2], [0.85, 6.6, -0.9], [0.7, 7.0, -0.4]], [[-0.8, 6, -1.1], [-0.85, 6.6, -0.9], [-0.7, 7.0, -0.4]]], r: 0.06 }),
  N('n_accessory', 'cranial', ['CN XI'], [], { en: 'Accessory nerve (CN XI)', de: 'Beinerv (XI. Hirnnerv)', la: 'Nervus accessorius' },
    { en: 'Its spinal root arises from the upper cervical cord (C1–C5), ascends through the foramen magnum and leaves the skull again through the jugular foramen. It supplies the sternocleidomastoid from its deep surface, then crosses the posterior triangle of the neck superficially, on levator scapulae, to the trapezius.',
      de: 'Seine spinale Wurzel entspringt im oberen Halsmark (C1–C5), steigt durch das Foramen magnum auf und verlässt den Schädel wieder durch das Foramen jugulare. Er versorgt den M. sternocleidomastoideus von innen und zieht dann oberflächlich, auf dem M. levator scapulae, durch das seitliche Halsdreieck zum M. trapezius.' },
    { paths: both([[1.0, 13.2, -4.4], [1.2, 14.8, -4.4], [2.6, 15.5, -3.4], [3.6, 14.4, -2.9], [4.6, 12, -2.6], [5.4, 8.4, -3.6], [7, 6, -6.4], [8, 1, -9.8], [6, -8, -10.6]]), r: 0.1,
      lesion: { en: 'Most often injured in the posterior triangle (lymph node biopsy): the trapezius is paralysed (shoulder droops, abduction above 90° is weak, lateral winging of the scapula) while the sternocleidomastoid is spared. A lesion near the skull base also weakens turning the head to the opposite side.',
        de: 'Am häufigsten im seitlichen Halsdreieck verletzt (Lymphknotenbiopsie): Der M. trapezius ist gelähmt (Schulter hängt, Abduktion über 90° schwach, laterales Abstehen der Skapula), der M. sternocleidomastoideus bleibt verschont. Eine Läsion nahe der Schädelbasis schwächt zusätzlich das Drehen des Kopfes zur Gegenseite.' } }),
  N('n_hypoglossal', 'cranial', ['CN XII'], [], { en: 'Hypoglossal nerve (CN XII)', de: 'Unterzungennerv (XII. Hirnnerv)', la: 'Nervus hypoglossus' },
    { en: 'Leaves the medulla between the pyramid and olive and the skull through the hypoglossal canal, runs down between the internal carotid artery and internal jugular vein, loops forwards across both carotids and the loop of the lingual artery and runs on hyoglossus into the tongue. It supplies all tongue muscles except palatoglossus. C1 fibres hitch a ride with it to geniohyoid and thyrohyoid and leave it again as the superior root of the ansa cervicalis.',
      de: 'Verlässt die Medulla zwischen Pyramide und Olive und den Schädel durch den Canalis nervi hypoglossi, zieht zwischen A. carotis interna und V. jugularis interna nach unten, bogenförmig über beide Karotiden und die Schlinge der A. lingualis nach vorn und auf dem M. hyoglossus in die Zunge. Er versorgt alle Zungenmuskeln außer dem M. palatoglossus. C1-Fasern begleiten ihn zu den Mm. geniohyoideus und thyrohyoideus und verlassen ihn als Radix superior der Ansa cervicalis.' },
    { paths: both([[0.6, 15.0, -4.4], [1.6, 14.8, -4.2], [2.8, 14.0, -3.0], C1_XII, [3.0, 9.8, 0.4], [2.0, 10.4, 1.4], [1.2, 11.6, 2.4]]), r: 0.11,
      lesion: { en: 'The tongue deviates towards the side of the lesion when protruded (the healthy genioglossus pushes it over), and that half wastes and fasciculates. Speech and swallowing are only mildly affected by a one-sided lesion.',
        de: 'Die herausgestreckte Zunge weicht zur Seite der Läsion ab (der gesunde M. genioglossus schiebt sie hinüber), diese Hälfte atrophiert und zeigt Faszikulationen. Sprechen und Schlucken sind bei einseitiger Läsion nur leicht gestört.' } })
];

const CERVICAL_LOOP = [[2.7, 13.8, -4.6], [3.2, 12.6, -4.0], [3.3, 11.5, -4.0], [3.4, 9.4, -3.8], [3.4, 7.5, -3.6]];
const nervesCervical = [
  N('n_plexus_cervical', 'cervical', segs('C1', 'C4'), ['sn_cervical'], { en: 'Cervical plexus (C1–C4)', de: 'Halsgeflecht (Plexus cervicalis, C1–C4)', la: 'Plexus cervicalis' },
    { en: 'Loops between the ventral rami of C1–C4, deep to the sternocleidomastoid on scalenus medius and levator scapulae. Its motor branches form the ansa cervicalis (infrahyoid muscles), the phrenic nerve (C3–C5, diaphragm) and twigs to the prevertebral muscles, levator scapulae and scalenes; its sensory branches emerge at the middle of the posterior border of the sternocleidomastoid (Erb\'s point) and fan out to the skin of the neck, ear and shoulder.',
      de: 'Schlingen zwischen den Rami anteriores von C1–C4 unter dem M. sternocleidomastoideus auf dem M. scalenus medius und M. levator scapulae. Seine motorischen Äste bilden die Ansa cervicalis (infrahyale Muskeln), den N. phrenicus (C3–C5, Zwerchfell) und Zweige zu den prävertebralen Muskeln, zum M. levator scapulae und zu den Skalenen; seine sensiblen Äste treten in der Mitte des Hinterrands des M. sternocleidomastoideus aus (Punctum nervosum, Erb-Punkt) und ziehen fächerförmig zur Haut von Hals, Ohr und Schulter.' },
    { paths: both(CERVICAL_LOOP), r: 0.15,
      lesion: { en: 'A cervical plexus block at Erb\'s point numbs the skin of the neck for surgery (e.g. carotid endarterectomy). A lesion of the roots above C5 can paralyse the diaphragm on that side via the phrenic nerve.',
        de: 'Eine Zervikalplexusblockade am Erb-Punkt betäubt die Halshaut für Operationen (z. B. Karotis-Thrombendarteriektomie). Eine Läsion der Wurzeln oberhalb C5 kann über den N. phrenicus das Zwerchfell dieser Seite lähmen.' } }),
  N('n_c1_hypoglossal', 'cervical', ['C1'], ['n_plexus_cervical'], { en: 'C1 fibres travelling with the hypoglossal nerve', de: 'C1-Fasern mit dem N. hypoglossus', la: 'Fibrae C1 cum nervo hypoglosso' },
    { en: 'Fibres from the ventral ramus of C1 that join the hypoglossal nerve below the skull. Some leave it to supply geniohyoid and thyrohyoid; the rest leave as the superior root of the ansa cervicalis. They are not part of CN XII, so a hypoglossal nerve lesion near the skull base spares these muscles.',
      de: 'Fasern aus dem Ramus anterior von C1, die sich unterhalb des Schädels dem N. hypoglossus anschließen. Ein Teil verlässt ihn zu den Mm. geniohyoideus und thyrohyoideus, der Rest als Radix superior der Ansa cervicalis. Sie gehören nicht zum N. XII; eine Hypoglossusläsion an der Schädelbasis verschont diese Muskeln daher.' },
    { paths: [[[2.7, 13.8, -4.6], [2.9, 13.6, -3.4], [3.1, 12.6, -1.8], C1_XII], [[3.0, 9.8, 0.4], [2.2, 9.6, 1.6], [1.4, 10.0, 2.6]], [[3.0, 9.8, 0.4], [2.2, 8.4, 0.9]]].flatMap(both), r: 0.06 }),
  N('n_ansa_superior', 'cervical', ['C1'], ['n_c1_hypoglossal'], { en: 'Superior root of the ansa cervicalis', de: 'Radix superior der Ansa cervicalis', la: 'Radix superior ansae cervicalis' },
    { en: 'C1 fibres leaving the hypoglossal nerve where it hooks around the occipital artery; they run down on the carotid sheath to meet the inferior root.',
      de: 'C1-Fasern, die den N. hypoglossus dort verlassen, wo er sich um die A. occipitalis biegt; sie ziehen auf der Karotisscheide nach unten zur Radix inferior.' },
    { paths: both([C1_XII, [3.0, 8.6, 0.2], ANSA]), r: 0.06 }),
  N('n_ansa_inferior', 'cervical', ['C2', 'C3'], ['n_plexus_cervical'], { en: 'Inferior root of the ansa cervicalis', de: 'Radix inferior der Ansa cervicalis', la: 'Radix inferior ansae cervicalis' },
    { en: 'Fibres from C2 and C3 that wind around the internal jugular vein to join the superior root in front of the carotid sheath.',
      de: 'Fasern aus C2 und C3, die sich um die V. jugularis interna winden und sich vor der Karotisscheide mit der Radix superior vereinigen.' },
    { paths: both([[3.4, 9.4, -3.8], [3.9, 8.4, -2.0], [3.9, 6.8, -0.4], [3.4, 5.8, 0.5], ANSA]), r: 0.06 }),
  N('n_ansa_cervicalis', 'cervical', segs('C1', 'C3'), ['n_ansa_superior', 'n_ansa_inferior'], { en: 'Ansa cervicalis', de: 'Halsschlinge (Ansa cervicalis)', la: 'Ansa cervicalis' },
    { en: 'Loop of C1–C3 fibres on the front of the carotid sheath that supplies sternohyoid, sternothyroid and omohyoid (thyrohyoid gets its C1 fibres directly from the hypoglossal nerve). It depresses the larynx and hyoid after swallowing and in speaking.',
      de: 'Schlinge aus C1–C3-Fasern auf der Vorderseite der Karotisscheide, die die Mm. sternohyoideus, sternothyroideus und omohyoideus versorgt (der M. thyrohyoideus erhält seine C1-Fasern direkt über den N. hypoglossus). Sie senkt Kehlkopf und Zungenbein nach dem Schlucken und beim Sprechen.' },
    { paths: [[ANSA, [2.0, 4.6, 1.2], [1.1, 3.4, 1.6]], [ANSA, [3.2, 4.6, 0.9]], [[3.0, 8.0, 0.3], [2.3, 7.4, 1.1]]].flatMap(both), r: 0.06,
      lesion: { en: 'Injury (e.g. in neck dissection) weakens the strap muscles with little functional loss; the nerve is often used to reinnervate a paralysed vocal fold or the tongue.',
        de: 'Eine Verletzung (z. B. bei der Neck Dissection) schwächt die infrahyale Muskulatur mit geringem funktionellem Verlust; der Nerv wird oft zur Reinnervation einer gelähmten Stimmlippe oder der Zunge verwendet.' } }),
  N('n_lesser_occipital', 'cervical', ['C2'], ['n_plexus_cervical'], { en: 'Lesser occipital nerve', de: 'N. occipitalis minor', la: 'Nervus occipitalis minor' },
    { en: 'Hooks around the accessory nerve and rises along the posterior border of the sternocleidomastoid to the skin of the scalp behind the ear.',
      de: 'Biegt um den N. accessorius und steigt am Hinterrand des M. sternocleidomastoideus zur Kopfhaut hinter dem Ohr auf.' },
    { paths: both([[3.3, 11.5, -4.0], [4.6, 10.0, -2.0], ERB, [5.6, 12.0, -2.6], [5.8, 14.6, -3.8], [5.4, 17.0, -4.8]]), r: 0.05 }),
  N('n_great_auricular', 'cervical', ['C2', 'C3'], ['n_plexus_cervical'], { en: 'Great auricular nerve', de: 'N. auricularis magnus', la: 'Nervus auricularis magnus' },
    { en: 'The largest sensory branch; it climbs across the sternocleidomastoid towards the ear lobe and supplies the skin over the parotid gland, the angle of the mandible and both surfaces of the lower auricle.',
      de: 'Größter sensibler Ast; er steigt über den M. sternocleidomastoideus zum Ohrläppchen und versorgt die Haut über der Parotis, am Kieferwinkel und beidseits der unteren Ohrmuschel.' },
    { paths: both([[3.4, 9.4, -3.8], [4.6, 9.4, -2.2], ERB, [5.8, 11.6, -0.8], [5.8, 14.0, -1.4], [5.8, 15.4, -2.0]]), r: 0.06,
      lesion: { en: 'Often cut in parotid surgery: numbness of the ear lobe (a problem with earrings).',
        de: 'Wird bei Parotisoperationen oft durchtrennt: taubes Ohrläppchen.' } }),
  N('n_transverse_cervical', 'cervical', ['C2', 'C3'], ['n_plexus_cervical'], { en: 'Transverse cervical nerve', de: 'N. transversus colli', la: 'Nervus transversus colli' },
    { en: 'Runs forwards across the middle of the sternocleidomastoid under the platysma and supplies the skin of the front of the neck.',
      de: 'Zieht unter dem Platysma quer über die Mitte des M. sternocleidomastoideus nach vorn und versorgt die Haut der vorderen Halsregion.' },
    { paths: both([[3.4, 9.4, -3.8], ERB, [5.2, 8.6, 0.2], [3.6, 8.2, 1.8], [1.6, 8.0, 2.0]]), r: 0.05 }),
  N('n_supraclavicular', 'cervical', ['C3', 'C4'], ['n_plexus_cervical'], { en: 'Supraclavicular nerves', de: 'Nn. supraclaviculares', la: 'Nervi supraclaviculares' },
    { en: 'Medial, intermediate and lateral branches that fan down over the clavicle to the skin of the upper chest and shoulder. Pain from the diaphragm (phrenic nerve, C4) is referred to this area.',
      de: 'Mediale, intermediäre und laterale Äste, die fächerförmig über die Klavikula zur Haut der oberen Brust und der Schulter ziehen. Schmerz vom Zwerchfell (N. phrenicus, C4) wird in dieses Gebiet projiziert.' },
    { paths: [[[3.4, 7.5, -3.6], ERB, [5.6, 6.0, 0], [6.0, 3.0, 1.0], [6.4, 1.4, 1.8]], [[5.6, 6.0, 0], [4.2, 2.4, 1.6], [3.4, 1.0, 2.2]], [[5.6, 6.0, 0], [7.8, 3.0, -0.4], [9.4, 1.8, -0.6]]].flatMap(both), r: 0.05,
      lesion: { en: 'Shoulder-tip pain from irritation of the diaphragm (e.g. blood under the diaphragm after a ruptured spleen, Kehr sign) is felt here because both share the C4 segment.',
        de: 'Schulterschmerz bei Reizung des Zwerchfells (z. B. Blut unter dem Zwerchfell nach Milzruptur, Kehr-Zeichen) wird hier empfunden, weil beide das Segment C4 teilen.' } }),
  N('n_cervical_ventral_rami', 'cervical', segs('C3', 'C8'), ['sn_cervical'], { en: 'Direct branches of the cervical ventral rami', de: 'Direkte Äste der zervikalen Rami anteriores', la: 'Rami musculares rami anterioris nervorum cervicalium' },
    { en: 'Short twigs from the ventral rami of C3–C8 as they pass between the scalenes, supplying the three scalene muscles and longus colli.',
      de: 'Kurze Zweige aus den Rami anteriores von C3–C8 auf ihrem Weg zwischen den Skalenen, die die drei Skalenusmuskeln und den M. longus colli versorgen.' },
    { paths: [9.4, 7.5, 5.7, 3.9, 2.1, 0.1].map(y => [[2.7, y, -3.8], [3.6, y - 0.6, -2.8]]).flatMap(both), r: 0.05 }),
  N('n_cervical_sympathetic', 'autonomic', ['T1', 'T2'], ['n_sympathetic_trunk'], { en: 'Cervical sympathetic trunk and carotid plexus', de: 'Halssympathikus und Plexus caroticus', la: 'Pars cervicalis trunci sympathici et plexus caroticus internus' },
    { en: 'The sympathetic trunk continues up the neck behind the carotid sheath with three ganglia (superior at C2, middle at C6, cervicothoracic or stellate at the first rib). Its preganglionic fibres come from T1–T2 and synapse in the superior cervical ganglion; postganglionic fibres form plexuses on the carotid arteries and their branches and reach the dilator pupillae, superior tarsal muscle, sweat glands and blood vessels of the face, and the glands of the head.',
      de: 'Der Grenzstrang setzt sich hinter der Karotisscheide am Hals nach oben fort, mit drei Ganglien (Ganglion cervicale superius bei C2, medium bei C6, cervicothoracicum oder stellatum an der 1. Rippe). Seine präganglionären Fasern stammen aus Th1–Th2 und werden im Ganglion cervicale superius umgeschaltet; postganglionäre Fasern bilden Geflechte um die Karotiden und ihre Äste und erreichen M. dilatator pupillae, M. tarsalis superior, Schweißdrüsen und Gefäße des Gesichts sowie die Drüsen des Kopfes.' },
    { paths: both([TRUNK_TOP, [2.6, 6, -3.4], [2.7, 9, -3.3], [2.7, 12.6, -3.2], [2.6, 14.6, -2.6], [2.2, 16.2, -2.0], [1.6, 16.9, -1.6], [1.4, 18.6, -0.4], [1.6, 19.2, 0.8], [2.0, 19.4, 2.4]]), r: 0.08,
      lesion: { en: 'Horner syndrome on the same side: small pupil (miosis), mild drooping of the upper lid (ptosis, superior tarsal muscle) and, if the lesion is below the carotid bifurcation, loss of facial sweating (anhidrosis). Causes include a Pancoast tumour at the lung apex, carotid dissection and a stellate ganglion block.',
        de: 'Horner-Syndrom auf derselben Seite: enge Pupille (Miosis), leicht hängendes Oberlid (Ptosis, M. tarsalis superior) und, bei einer Läsion unterhalb der Karotisgabel, fehlendes Schwitzen im Gesicht (Anhidrose). Ursachen sind u. a. ein Pancoast-Tumor der Lungenspitze, eine Karotisdissektion und eine Stellatumblockade.' } })
];

const nerves = [...nervesCranial, ...nervesFacial, ...nervesLower, ...nervesCervical];

export const structures = [...bones, ...muscles, ...organs, ...arteries, ...veins, ...nerves];

export const muscleGroups = {
  facial: { en: 'Muscles of facial expression', de: 'Mimische Muskulatur' },
  mastication: { en: 'Muscles of mastication', de: 'Kaumuskulatur' },
  suprahyoid: { en: 'Suprahyoid muscles', de: 'Suprahyale Muskulatur' },
  infrahyoid: { en: 'Infrahyoid (strap) muscles', de: 'Infrahyale Muskulatur' },
  neck: { en: 'Sternocleidomastoid and scalenes', de: 'M. sternocleidomastoideus und Skalenusmuskeln' },
  tongue: { en: 'Tongue muscles', de: 'Zungenmuskulatur' },
  pharynx: { en: 'Pharynx and soft palate', de: 'Rachen und Gaumensegel' },
  larynx: { en: 'Laryngeal muscles', de: 'Kehlkopfmuskulatur' },
  eye: { en: 'Extraocular muscles and eyelid', de: 'Äußere Augenmuskeln und Lidmuskeln' }
};

export const meta = {
  start: 'n_facial',
  plexus: { en: 'Cranial nerves', de: 'Hirnnerven' },
  plexusTargets: { en: 'Cranial nerves → muscles and organs', de: 'Hirnnerven → Muskeln und Organe' },
  nerveGroups: [
    ['cranial', { en: 'Cranial nerves I–XII', de: 'Hirnnerven I–XII' }],
    ['trigeminal', { en: 'Trigeminal divisions and branches', de: 'Trigeminusäste' }],
    ['facial', { en: 'Facial nerve branches', de: 'Äste des N. facialis' }],
    ['vagus', { en: 'Glossopharyngeal and vagus branches', de: 'Äste von IX und X' }],
    ['cervical', { en: 'Cervical plexus and ansa cervicalis', de: 'Plexus cervicalis und Ansa cervicalis' }],
    ['autonomic', { en: 'Cervical sympathetic trunk', de: 'Halssympathikus' }],
    ['central', { en: 'Central pathway (upper motor neuron)', de: 'Zentrale Bahn (erstes Motoneuron)' }]
  ],
  organGroups: [
    ['glands', { en: 'Thyroid and parathyroid glands', de: 'Schilddrüse und Nebenschilddrüsen' }],
    ['viscera', { en: 'Larynx, pharynx and tongue', de: 'Kehlkopf, Rachen und Zunge' }],
    ['salivary', { en: 'Salivary glands', de: 'Speicheldrüsen' }],
    ['eye', { en: 'Eye and lacrimal gland', de: 'Auge und Tränendrüse' }]
  ],
  // Occiput, spine, chest wall and shoulder girdle from the other regions, the vagus and its recurrent
  // laryngeal nerves, the cervical spinal nerves and the great vessels at the root of the neck.
  context: ['occipital_bone', 'cervical_vertebrae', 'ribs', 'sternum', 'clavicle', 'scapula', 'trapezius', 'levator_scapulae',
    'n_vagus', 'n_recurrent_laryngeal_left', 'n_recurrent_laryngeal_right', 'sn_cervical', 'n_phrenic', 'n_cervical_plexus', 'n_sympathetic_trunk',
    'a_common_carotid_right', 'a_common_carotid_left', 'a_subclavian', 'a_vertebral', 'a_occipital', 'a_suprascapular',
    'v_brachiocephalic_right', 'v_brachiocephalic_left', 'trachea', 'diaphragm'],
  contextOpacity: 0.4,
  camera: { target: [0, 14, 0], position: [22, 19, 50] }
};
