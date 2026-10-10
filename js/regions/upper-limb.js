// Upper limb region: structures with English / German / Latin names and their connections.
// Registered in ../data.js.
// Coordinates are schematic, in cm, as [lateral, superior, anterior] for the RIGHT upper limb
// in anatomical position (palm facing forward). The 3D viewer mirrors "lateral" so the limb
// appears on the viewer's left, as when facing a person.
//
// Segment values (C5–T1) follow common textbook values (Moore, Prometheus, Schünke).
// Textbooks differ by about one segment for several muscles; this is a learning aid,
// always check against your course atlas.

export const SEGMENTS = ['C5', 'C6', 'C7', 'C8', 'T1'];

// Region settings used by the app: start structure, plexus name, nerve list groups
// (by the nerves' `group` field) and the home camera (viewer coordinates).
export const meta = {
  start: 'biceps_brachii',
  plexus: { en: 'Brachial plexus', de: 'Plexus brachialis' },
  nerveGroups: [
    ['root', { en: 'Roots', de: 'Wurzeln' }],
    ['trunk', { en: 'Trunks', de: 'Primärstränge' }],
    ['cord', { en: 'Cords', de: 'Faszikel' }],
    [undefined, { en: 'Nerves', de: 'Nerven' }],
    ['cranial', { en: 'Other nerves', de: 'Weitere Nerven' }]
  ],
  context: ['cervical_vertebrae', 'thoracic_vertebrae', 'ribs', 'sternum', 'n_accessory'],
  camera: { target: [-15, -37, -2], position: [-24, -30, 152] }
};

// ---------------------------------------------------------------- bones
const bones = [
  {
    id: 'clavicle', type: 'bone',
    name: { en: 'Clavicle', de: 'Schlüsselbein', la: 'Clavicula' },
    info: {
      en: 'S-shaped strut between sternum and acromion. Holds the shoulder away from the trunk and transmits force from the arm to the axial skeleton. The only bony connection of the upper limb to the trunk.',
      de: 'S-förmige Strebe zwischen Brustbein und Akromion. Hält die Schulter vom Rumpf ab und überträgt Kräfte vom Arm auf das Achsenskelett. Einzige knöcherne Verbindung der oberen Extremität mit dem Rumpf.'
    },
    shape: { tubes: [[[2, 0, 2], [7, 0.5, 3.2], [12, 1, 1.2], [16.5, 1.2, -2]]], r: 0.7 }
  },
  {
    id: 'scapula', type: 'bone',
    name: { en: 'Scapula', de: 'Schulterblatt', la: 'Scapula' },
    info: {
      en: 'Flat triangular bone gliding on the posterior thorax. Its glenoid cavity forms the shoulder joint with the humerus; 17 muscles attach to it, so its position sets the range of arm movement.',
      de: 'Flacher, dreieckiger Knochen, der auf dem hinteren Thorax gleitet. Die Cavitas glenoidalis bildet mit dem Humerus das Schultergelenk; 17 Muskeln setzen an, daher bestimmt seine Stellung den Bewegungsumfang des Arms.'
    },
    shape: {
      plate: [[8, -0.5, -9.6], [12.5, -1, -8.6], [15, -2.5, -5.5], [15.4, -4.5, -5], [13, -10, -7.5], [10.5, -18, -8.6], [7.2, -4, -10.2]],
      tubes: [
        [[7.5, -4, -10.6], [12, -3, -10], [16, -1, -7.2], [18.3, 0.8, -4]], // spine + acromion
        [[13, -1.5, -6], [13.5, -1, -2.5], [14, -2, 1.5]]                 // coracoid process
      ],
      r: 0.55
    }
  },
  {
    id: 'humerus', type: 'bone',
    name: { en: 'Humerus', de: 'Oberarmknochen', la: 'Humerus' },
    info: {
      en: 'Long bone of the arm. Head articulates with the glenoid (shoulder joint); trochlea and capitulum articulate with ulna and radius (elbow). The radial nerve runs in its spiral groove and the axillary nerve winds around its surgical neck, so fractures here injure those nerves.',
      de: 'Röhrenknochen des Oberarms. Der Kopf artikuliert mit der Cavitas glenoidalis (Schultergelenk), Trochlea und Capitulum mit Ulna und Radius (Ellenbogengelenk). Im Sulcus nervi radialis verläuft der N. radialis, um das Collum chirurgicum der N. axillaris. Frakturen dort schädigen diese Nerven.'
    },
    shape: {
      spheres: [[[17.6, -3, -3], 2.2]],
      tubes: [[[18, -4, -2.6], [18.5, -18, -2.6], [19, -30, -2.5]], [[15.6, -33, -2.8], [19, -32.4, -2.2], [22.4, -33, -2]]],
      r: 1.0
    }
  },
  {
    id: 'radius', type: 'bone',
    name: { en: 'Radius', de: 'Speiche', la: 'Radius' },
    info: {
      en: 'Lateral (thumb-side) forearm bone. Its head rotates against the ulna during pronation and supination; distally it carries most of the wrist joint.',
      de: 'Lateraler (daumenseitiger) Unterarmknochen. Der Radiuskopf dreht sich bei Pro- und Supination gegen die Ulna; distal trägt er den Großteil des Handgelenks.'
    },
    shape: { tubes: [[[21.2, -34, -1], [21.4, -37, -0.5], [22.6, -46, 0], [24, -58, 0]]], r: 0.7 }
  },
  {
    id: 'ulna', type: 'bone',
    name: { en: 'Ulna', de: 'Elle', la: 'Ulna' },
    info: {
      en: 'Medial (little-finger-side) forearm bone. The olecranon and trochlear notch form the hinge of the elbow with the humerus.',
      de: 'Medialer (kleinfingerseitiger) Unterarmknochen. Olecranon und Incisura trochlearis bilden mit dem Humerus das Scharnier des Ellenbogens.'
    },
    shape: { tubes: [[[17.4, -31, -4.6], [17.6, -34, -2.6], [18.2, -44, -1], [19, -58, -1]]], r: 0.75 }
  },
  {
    id: 'carpals', type: 'bone',
    name: { en: 'Carpal bones', de: 'Handwurzelknochen', la: 'Ossa carpi' },
    info: {
      en: 'Eight small bones in two rows. With the flexor retinaculum they form the carpal tunnel, through which the median nerve and the long flexor tendons pass.',
      de: 'Acht kleine Knochen in zwei Reihen. Mit dem Retinaculum musculorum flexorum bilden sie den Karpaltunnel, durch den der N. medianus und die langen Beugesehnen ziehen.'
    },
    shape: { ellipsoids: [[[21, -60, 0], [3.2, 1.7, 1.1]]] }
  },
  {
    id: 'metacarpals', type: 'bone',
    name: { en: 'Metacarpal bones', de: 'Mittelhandknochen', la: 'Ossa metacarpi' },
    info: {
      en: 'Five bones of the palm (I = thumb to V = little finger). The first metacarpal sits on a saddle joint that allows opposition.',
      de: 'Fünf Knochen der Mittelhand (I = Daumen bis V = Kleinfinger). Der erste sitzt in einem Sattelgelenk, das die Opposition ermöglicht.'
    },
    shape: {
      tubes: [
        [[23.4, -60.6, 0.4], [25.6, -65, 0.8]],
        [[22, -61.4, 0], [22.5, -68, 0]],
        [[20.8, -61.6, 0], [21, -68.6, 0]],
        [[19.6, -61.4, 0], [19.6, -68, 0]],
        [[18.6, -60.8, 0], [18, -67, 0]]
      ],
      r: 0.42
    }
  },
  {
    id: 'phalanges', type: 'bone',
    name: { en: 'Phalanges', de: 'Fingerknochen', la: 'Phalanges' },
    info: {
      en: 'Finger bones: two in the thumb, three in each other finger (proximal, middle, distal).',
      de: 'Fingerglieder: zwei im Daumen, drei in jedem anderen Finger (Grund-, Mittel-, Endglied).'
    },
    shape: {
      tubes: [
        [[25.8, -65.4, 0.8], [27.2, -70.5, 1]],
        [[22.5, -68.4, 0], [23, -77, 0]],
        [[21, -69, 0], [21, -79, 0]],
        [[19.6, -68.4, 0], [19.4, -78, 0]],
        [[18, -67.4, 0], [17.4, -74, 0]]
      ],
      r: 0.34
    }
  }
];

// ---------------------------------------------------------------- nerves
// parents = the structure(s) this nerve branches from (for the plexus tree).
// segs = spinal segments carried. lesion = clinical picture if this nerve is cut.
const nerves = [
  ...['C5', 'C6', 'C7', 'C8', 'T1'].map((s, i) => ({
    id: 'root_' + s, type: 'nerve', group: 'root', segs: [s], parents: [],
    name: { en: `${s} spinal nerve (ventral ramus)`, de: `Spinalnerv ${s} (Ramus anterior)`, la: `Ramus anterior nervi spinalis ${s}` },
    info: {
      en: `Root of the brachial plexus. Myotome / dermatome: ${({ C5: 'shoulder abduction, elbow flexion; skin over lateral shoulder. Biceps reflex', C6: 'elbow flexion, wrist extension; skin of lateral forearm and thumb. Brachioradialis reflex', C7: 'elbow and wrist extension, finger extension; skin of middle finger. Triceps reflex', C8: 'finger flexion; skin of little finger and medial hand', T1: 'intrinsic hand muscles (finger spreading); skin of medial forearm' })[s]}.`,
      de: `Wurzel des Plexus brachialis. Myotom / Dermatom: ${({ C5: 'Abduktion der Schulter, Beugung im Ellenbogen; Haut der lateralen Schulter. Bizepssehnenreflex', C6: 'Beugung im Ellenbogen, Streckung im Handgelenk; Haut des lateralen Unterarms und Daumens. Brachioradialisreflex', C7: 'Streckung in Ellenbogen, Handgelenk und Fingern; Haut des Mittelfingers. Trizepssehnenreflex', C8: 'Fingerbeugung; Haut des Kleinfingers und der ulnaren Hand', T1: 'kleine Handmuskeln (Fingerspreizen); Haut des medialen Unterarms' })[s]}.`
    },
    path: [[2.5, 6 - i * 2, -4.2], [5, 4.6 - i * 2.1, -3.2]], r: 0.32
  })),
  {
    id: 'trunk_sup', type: 'nerve', group: 'trunk', segs: ['C5', 'C6'], parents: ['root_C5', 'root_C6'],
    name: { en: 'Superior trunk', de: 'Oberer Primärstrang', la: 'Truncus superior' },
    info: { en: 'Formed by C5 and C6. Gives off the suprascapular nerve and the nerve to subclavius.', de: 'Aus C5 und C6. Gibt den N. suprascapularis und den N. subclavius ab.' },
    lesion: {
      en: 'Erb–Duchenne (upper plexus) palsy, e.g. from a difficult birth or a fall onto the shoulder. The arm hangs adducted and internally rotated with the elbow extended and the forearm pronated ("waiter\'s tip"). Lost: shoulder abduction and external rotation, elbow flexion, supination.',
      de: 'Obere Plexuslähmung (Erb-Duchenne), z. B. bei schwerer Geburt oder Sturz auf die Schulter. Der Arm hängt adduziert und innenrotiert, der Ellenbogen gestreckt, der Unterarm proniert („Waiter\'s tip“). Ausfall: Abduktion und Außenrotation der Schulter, Beugung im Ellenbogen, Supination.'
    },
    path: [[5, 4.6, -3.2], [8, 2.2, -2.2]], r: 0.42
  },
  {
    id: 'trunk_mid', type: 'nerve', group: 'trunk', segs: ['C7'], parents: ['root_C7'],
    name: { en: 'Middle trunk', de: 'Mittlerer Primärstrang', la: 'Truncus medius' },
    info: { en: 'Continuation of C7 alone.', de: 'Fortsetzung von C7 allein.' },
    path: [[5, 0.4, -3.2], [8.5, -0.5, -2.2]], r: 0.4
  },
  {
    id: 'trunk_inf', type: 'nerve', group: 'trunk', segs: ['C8', 'T1'], parents: ['root_C8', 'root_T1'],
    name: { en: 'Inferior trunk', de: 'Unterer Primärstrang', la: 'Truncus inferior' },
    info: { en: 'Formed by C8 and T1. Lies on the first rib behind the subclavian artery.', de: 'Aus C8 und T1. Liegt auf der ersten Rippe hinter der A. subclavia.' },
    lesion: {
      en: 'Klumpke (lower plexus) palsy, e.g. from pulling the arm upwards at birth, a cervical rib or a Pancoast tumour. All intrinsic hand muscles fail, giving a claw hand. Sensory loss on the medial forearm and hand. Horner syndrome if the T1 sympathetic fibres are also hit.',
      de: 'Untere Plexuslähmung (Klumpke), z. B. durch Zug am hochgeschlagenen Arm bei der Geburt, eine Halsrippe oder einen Pancoast-Tumor. Alle kleinen Handmuskeln fallen aus (Krallenhand). Sensibilitätsausfall am ulnaren Unterarm und an der Hand. Horner-Syndrom, wenn auch der Sympathikus bei T1 betroffen ist.'
    },
    path: [[5, -3.8, -3.2], [9, -3.4, -2]], r: 0.42
  },
  {
    id: 'cord_lat', type: 'nerve', group: 'cord', segs: ['C5', 'C6', 'C7'], parents: ['trunk_sup', 'trunk_mid'],
    name: { en: 'Lateral cord', de: 'Lateraler Faszikel', la: 'Fasciculus lateralis' },
    info: { en: 'Formed by the anterior divisions of the superior and middle trunks. Lies lateral to the axillary artery. Gives the lateral pectoral nerve, the musculocutaneous nerve and the lateral root of the median nerve.', de: 'Aus den vorderen Anteilen (Divisiones anteriores) des oberen und mittleren Primärstrangs. Liegt lateral der A. axillaris. Gibt N. pectoralis lateralis, N. musculocutaneus und die laterale Medianuswurzel ab.' },
    lesion: { en: 'Weak elbow flexion and supination (musculocutaneous) and weak pronation and wrist flexion (lateral root of median). Sensory loss over the lateral forearm.', de: 'Schwache Beugung im Ellenbogen und Supination (N. musculocutaneus) sowie schwache Pronation und Handgelenksbeugung (laterale Medianuswurzel). Sensibilitätsausfall am lateralen Unterarm.' },
    path: [[8, 2.2, -2.2], [11, -2.5, 0.6], [13, -6, 0.9]], r: 0.4
  },
  {
    id: 'cord_post', type: 'nerve', group: 'cord', segs: ['C5', 'C6', 'C7', 'C8', 'T1'], parents: ['trunk_sup', 'trunk_mid', 'trunk_inf'],
    name: { en: 'Posterior cord', de: 'Hinterer Faszikel', la: 'Fasciculus posterior' },
    info: { en: 'Formed by the posterior divisions of all three trunks. Lies behind the axillary artery. Supplies the extensor (posterior) side: subscapular nerves, thoracodorsal, axillary and radial nerves.', de: 'Aus den hinteren Anteilen (Divisiones posteriores) aller drei Primärstränge. Liegt hinter der A. axillaris. Versorgt die Streckseite: Nn. subscapulares, N. thoracodorsalis, N. axillaris und N. radialis.' },
    lesion: { en: 'Combined axillary and radial palsy: no shoulder abduction and wrist drop, with weak shoulder internal rotation and adduction.', de: 'Kombinierte Axillaris- und Radialislähmung: keine Abduktion in der Schulter, Fallhand, dazu schwache Innenrotation und Adduktion der Schulter.' },
    path: [[8.5, -0.5, -2.2], [11, -3.5, -1.8], [13, -6.5, -1.6]], r: 0.44
  },
  {
    id: 'cord_med', type: 'nerve', group: 'cord', segs: ['C8', 'T1'], parents: ['trunk_inf'],
    name: { en: 'Medial cord', de: 'Medialer Faszikel', la: 'Fasciculus medialis' },
    info: { en: 'Continuation of the anterior division of the inferior trunk. Lies medial to the axillary artery. Gives the medial pectoral nerve, the ulnar nerve, the medial root of the median nerve and cutaneous nerves of arm and forearm.', de: 'Fortsetzung der Divisio anterior des unteren Primärstrangs. Liegt medial der A. axillaris. Gibt N. pectoralis medialis, N. ulnaris, die mediale Medianuswurzel und Hautnerven für Ober- und Unterarm ab.' },
    lesion: { en: 'Like a combined ulnar and distal median lesion: claw hand and loss of all fine hand movements. Sensory loss on the medial arm, forearm and hand.', de: 'Wie eine kombinierte Ulnaris- und distale Medianusläsion: Krallenhand und Verlust der Feinmotorik. Sensibilitätsausfall an ulnarem Ober-, Unterarm und Hand.' },
    path: [[9, -3.4, -2], [11.5, -5.5, -0.4], [13, -7, -0.4]], r: 0.4
  },

  // --- branches from roots and trunks (supraclavicular part)
  {
    id: 'n_dorsal_scapular', type: 'nerve', segs: ['C5'], parents: ['root_C5'],
    name: { en: 'Dorsal scapular nerve', de: 'Dorsaler Schulterblattnerv', la: 'Nervus dorsalis scapulae' },
    info: { en: 'From the C5 root (with some C4). Pierces the scalenus medius and runs along the medial border of the scapula.', de: 'Aus der Wurzel C5 (mit Anteil aus C4). Durchbohrt den M. scalenus medius und verläuft am Margo medialis der Scapula.' },
    lesion: { en: 'Weak rhomboids. The medial border of the scapula drifts laterally and away from the thorax at rest.', de: 'Schwäche der Mm. rhomboidei. Der Margo medialis der Scapula weicht in Ruhe nach lateral und vom Thorax ab.' },
    path: [[4, 5.5, -4.6], [6, 2, -8], [7, -2, -9.4], [7.6, -10, -9.6]], r: 0.22
  },
  {
    id: 'n_long_thoracic', type: 'nerve', segs: ['C5', 'C6', 'C7'], parents: ['root_C5', 'root_C6', 'root_C7'],
    name: { en: 'Long thoracic nerve', de: 'Langer Brustkorbnerv', la: 'Nervus thoracicus longus' },
    info: { en: 'Runs down the lateral chest wall on the serratus anterior, superficial and easily injured (e.g. axillary lymph node surgery, heavy backpacks).', de: 'Verläuft oberflächlich auf dem M. serratus anterior an der seitlichen Brustwand und ist leicht verletzlich (z. B. Axilla-Lymphknotenchirurgie, schwere Rucksäcke).' },
    lesion: { en: 'Winged scapula: the medial border lifts off the chest, especially when pushing against a wall. Arm elevation above the horizontal is weak.', de: 'Scapula alata: der Margo medialis hebt sich vom Thorax ab, besonders beim Abstützen gegen eine Wand. Elevation des Arms über die Horizontale ist geschwächt.' },
    path: [[4, 3, -4], [8, -4, -4], [10.5, -10, -2.6], [11.5, -18, -1]], r: 0.22
  },
  {
    id: 'n_suprascapular', type: 'nerve', segs: ['C5', 'C6'], parents: ['trunk_sup'],
    name: { en: 'Suprascapular nerve', de: 'Oberschulterblattnerv', la: 'Nervus suprascapularis' },
    info: { en: 'From the superior trunk. Passes through the suprascapular notch (beneath the ligament) to supraspinatus, then around the spinoglenoid notch to infraspinatus.', de: 'Aus dem oberen Primärstrang. Zieht durch die Incisura scapulae (unter dem Ligament) zum M. supraspinatus und um die Incisura spinoglenoidalis zum M. infraspinatus.' },
    lesion: { en: 'Weak initiation of abduction and weak external rotation; wasting above and below the scapular spine.', de: 'Schwacher Beginn der Abduktion und schwache Außenrotation; Atrophie ober- und unterhalb der Spina scapulae.' },
    path: [[7.5, 2.4, -2.4], [11, 0, -6.4], [12.5, -1.2, -8.6], [14.8, -4, -8.4], [13, -9, -9]], r: 0.24
  },
  {
    id: 'n_subclavius', type: 'nerve', segs: ['C5', 'C6'], parents: ['trunk_sup'],
    name: { en: 'Nerve to subclavius', de: 'Nerv zum M. subclavius', la: 'Nervus subclavius' },
    info: { en: 'Small branch of the superior trunk. Sometimes gives an accessory phrenic nerve.', de: 'Kleiner Ast des oberen Primärstrangs. Gibt manchmal einen N. phrenicus accessorius ab.' },
    lesion: { en: 'No noticeable deficit.', de: 'Kein relevanter Ausfall.' },
    path: [[7.5, 2.2, -2], [8.5, 0.5, 0.8]], r: 0.16
  },

  // --- lateral cord branches
  {
    id: 'n_lat_pectoral', type: 'nerve', segs: ['C5', 'C6', 'C7'], parents: ['cord_lat'],
    name: { en: 'Lateral pectoral nerve', de: 'Lateraler Brustmuskelnerv', la: 'Nervus pectoralis lateralis' },
    info: { en: 'Named after its cord of origin, not its position. Supplies the clavicular and upper sternal parts of pectoralis major.', de: 'Benannt nach dem Ursprungsfaszikel, nicht nach der Lage. Versorgt die Pars clavicularis und den oberen Teil der Pars sternocostalis des M. pectoralis major.' },
    lesion: { en: 'Weak adduction and internal rotation of the arm, flexion of the shoulder from the clavicular head.', de: 'Schwache Adduktion und Innenrotation; geschwächte Anteversion durch die Pars clavicularis.' },
    path: [[10.6, -1.8, 0.5], [10, -3, 3.4]], r: 0.18
  },
  {
    id: 'n_musculocutaneous', type: 'nerve', segs: ['C5', 'C6', 'C7'], parents: ['cord_lat'],
    name: { en: 'Musculocutaneous nerve', de: 'Muskel-Haut-Nerv', la: 'Nervus musculocutaneus' },
    info: { en: 'Pierces coracobrachialis, runs between biceps and brachialis (supplying all three: the anterior arm flexors), and continues as the lateral cutaneous nerve of the forearm.', de: 'Durchbohrt den M. coracobrachialis, verläuft zwischen M. biceps brachii und M. brachialis (versorgt alle drei Beuger des Oberarms) und endet als N. cutaneus antebrachii lateralis.' },
    lesion: { en: 'Weak elbow flexion (brachioradialis and part of brachialis compensate) and weak supination; reduced biceps reflex; numbness on the lateral forearm.', de: 'Schwache Beugung im Ellenbogen (M. brachioradialis und Teil des M. brachialis kompensieren) und schwache Supination; abgeschwächter Bizepssehnenreflex; Taubheit am lateralen Unterarm.' },
    path: [[13, -6, 1], [14.6, -9, 2.2], [17, -18, 2], [19.8, -30, 1.6], [22, -40, 1.6]], r: 0.24
  },
  {
    id: 'n_median', type: 'nerve', segs: ['C6', 'C7', 'C8', 'T1'], parents: ['cord_lat', 'cord_med'],
    name: { en: 'Median nerve', de: 'Mittelarmnerv', la: 'Nervus medianus' },
    info: { en: 'Formed by lateral and medial roots (the "median fork" in front of the axillary artery). No branches in the arm. In the forearm it supplies most flexors and the pronators; through the carpal tunnel it supplies the thenar muscles, lumbricals 1–2 and the skin of the palmar thumb, index, middle and half of the ring finger.', de: 'Aus lateraler und medialer Wurzel (die „Medianusgabel“ vor der A. axillaris). Am Oberarm keine Äste. Am Unterarm versorgt er die meisten Beuger und die Pronatoren; durch den Karpaltunnel die Thenarmuskeln, die Mm. lumbricales I–II und die Haut palmar an Daumen, Zeige-, Mittel- und halbem Ringfinger.' },
    lesion: {
      en: 'High lesion (elbow): "hand of benediction" when trying to make a fist (index and middle finger stay straight), loss of pronation, thenar wasting. Low lesion (carpal tunnel syndrome): thenar weakness and wasting ("ape hand"), lost opposition, pins and needles in thumb to ring finger, worse at night.',
      de: 'Proximale Läsion (Ellenbogen): „Schwurhand“ beim Faustschluss (Zeige- und Mittelfinger bleiben gestreckt), Pronation fällt aus, Thenaratrophie. Distale Läsion (Karpaltunnelsyndrom): Thenarschwäche und -atrophie („Affenhand“), Opposition fällt aus, Kribbeln in Daumen bis Ringfinger, nachts schlimmer.'
    },
    path: [[13, -6.6, 0.6], [15.2, -12, 0.4], [16.6, -22, 0.6], [18.6, -33, 1.4], [19.8, -44, 0.8], [20.6, -58, 1.3], [21, -62.5, 1.7]], r: 0.3
  },

  // --- medial cord branches
  {
    id: 'n_med_pectoral', type: 'nerve', segs: ['C8', 'T1'], parents: ['cord_med'],
    name: { en: 'Medial pectoral nerve', de: 'Medialer Brustmuskelnerv', la: 'Nervus pectoralis medialis' },
    info: { en: 'Pierces pectoralis minor (supplying it) and continues to the lower sternocostal part of pectoralis major.', de: 'Durchbohrt den M. pectoralis minor (und versorgt ihn) und zieht zum unteren Teil der Pars sternocostalis des M. pectoralis major.' },
    lesion: { en: 'Weak adduction and internal rotation; pectoralis minor weakness (little functional effect).', de: 'Schwache Adduktion und Innenrotation; Schwäche des M. pectoralis minor (funktionell gering).' },
    path: [[12, -6, -0.2], [11.4, -9, 2.8], [10, -12, 3.6]], r: 0.18
  },
  {
    id: 'n_ulnar', type: 'nerve', segs: ['C8', 'T1'], parents: ['cord_med'],
    name: { en: 'Ulnar nerve', de: 'Ellennerv', la: 'Nervus ulnaris' },
    info: { en: 'Runs down the medial arm, behind the medial epicondyle (the "funny bone"), into the forearm under flexor carpi ulnaris, then through Guyon\'s canal at the wrist. Supplies FCU, the medial half of FDP and most small hand muscles; skin of little finger and half of ring finger.', de: 'Verläuft am medialen Oberarm, hinter dem Epicondylus medialis („Musikantenknochen“), unter dem M. flexor carpi ulnaris zum Handgelenk und durch die Loge de Guyon. Versorgt M. flexor carpi ulnaris, die ulnare Hälfte des M. flexor digitorum profundus und die meisten kleinen Handmuskeln; Haut von Kleinfinger und halbem Ringfinger.' },
    lesion: {
      en: 'Claw hand (ring and little finger hyperextended at MCP and flexed at IP joints), wasting of interossei, positive Froment sign (thumb IP flexes when pinching paper because adductor pollicis is weak). "Ulnar paradox": a lesion at the elbow causes less clawing than one at the wrist, because the medial FDP is lost too.',
      de: 'Krallenhand (Ring- und Kleinfinger im Grundgelenk überstreckt, in den Interphalangealgelenken gebeugt), Atrophie der Mm. interossei, positives Froment-Zeichen (beim Festhalten eines Papiers beugt sich das Daumenendglied, weil der M. adductor pollicis schwach ist). „Ulnaris-Paradoxon“: eine Läsion am Ellenbogen gibt weniger Krallenstellung als eine am Handgelenk, weil auch der ulnare M. flexor digitorum profundus ausfällt.'
    },
    path: [[13, -7.2, -0.6], [15, -14, -1.2], [15.6, -26, -2.6], [15.6, -33, -3.8], [17.2, -42, -0.4], [18.4, -58, 0.6], [18.8, -61, 1]], r: 0.3
  },

  // --- posterior cord branches
  {
    id: 'n_upper_subscapular', type: 'nerve', segs: ['C5', 'C6'], parents: ['cord_post'],
    name: { en: 'Upper subscapular nerve', de: 'Oberer Unterschulterblattnerv', la: 'Nervus subscapularis superior' },
    info: { en: 'Supplies the upper part of subscapularis.', de: 'Versorgt den oberen Teil des M. subscapularis.' },
    lesion: { en: 'Mildly weak internal rotation.', de: 'Leicht geschwächte Innenrotation.' },
    path: [[11.6, -4.2, -1.9], [11.6, -6, -5.2]], r: 0.16
  },
  {
    id: 'n_thoracodorsal', type: 'nerve', segs: ['C6', 'C7', 'C8'], parents: ['cord_post'],
    name: { en: 'Thoracodorsal nerve', de: 'Brust-Rücken-Nerv', la: 'Nervus thoracodorsalis' },
    info: { en: 'Runs down the posterior axillary wall with the thoracodorsal artery to latissimus dorsi. Important for surgeons using latissimus as a flap.', de: 'Zieht mit der A. thoracodorsalis an der hinteren Achselwand zum M. latissimus dorsi. Wichtig bei der Latissimus-Lappenplastik.' },
    lesion: { en: 'Weak adduction, extension and internal rotation of the arm: difficulty climbing, rowing or pushing up from a chair.', de: 'Schwache Adduktion, Retroversion und Innenrotation: Schwierigkeiten beim Klettern, Rudern oder Hochstemmen aus dem Stuhl.' },
    path: [[12.2, -5.6, -1.8], [13.4, -10, -4.4], [13.6, -18, -5.4]], r: 0.18
  },
  {
    id: 'n_lower_subscapular', type: 'nerve', segs: ['C5', 'C6'], parents: ['cord_post'],
    name: { en: 'Lower subscapular nerve', de: 'Unterer Unterschulterblattnerv', la: 'Nervus subscapularis inferior' },
    info: { en: 'Supplies the lower part of subscapularis and teres major.', de: 'Versorgt den unteren Teil des M. subscapularis und den M. teres major.' },
    lesion: { en: 'Weak internal rotation.', de: 'Geschwächte Innenrotation.' },
    path: [[12.6, -6.2, -1.8], [13.2, -9.6, -5.2], [13.4, -13, -6.4]], r: 0.16
  },
  {
    id: 'n_axillary', type: 'nerve', segs: ['C5', 'C6'], parents: ['cord_post'],
    name: { en: 'Axillary nerve', de: 'Achselnerv', la: 'Nervus axillaris' },
    info: { en: 'Passes backwards through the quadrangular space with the posterior circumflex humeral artery and winds around the surgical neck of the humerus. Supplies deltoid and teres minor and the skin over the lower deltoid ("regimental badge" area).', de: 'Zieht mit der A. circumflexa humeri posterior durch die laterale Achsellücke nach hinten und windet sich um das Collum chirurgicum. Versorgt M. deltoideus und M. teres minor sowie die Haut über dem unteren Deltamuskel.' },
    lesion: { en: 'After shoulder dislocation or surgical-neck fracture: weak abduction (15–90°) and a flattened shoulder contour from deltoid wasting; numb patch over the lateral shoulder.', de: 'Nach Schulterluxation oder Fraktur des Collum chirurgicum: schwache Abduktion (15–90°) und abgeflachte Schulterkontur durch Deltaatrophie; Taubheit über der lateralen Schulter.' },
    path: [[13, -6.4, -1.8], [15.4, -8, -4.8], [18.4, -8.4, -4.6], [20.4, -7.6, -2]], r: 0.26
  },
  {
    id: 'n_radial', type: 'nerve', segs: ['C5', 'C6', 'C7', 'C8', 'T1'], parents: ['cord_post'],
    name: { en: 'Radial nerve', de: 'Speichennerv', la: 'Nervus radialis' },
    info: { en: 'Largest branch of the plexus: the nerve of all extensors. Gives the triceps branches in the axilla and upper arm, then spirals around the back of the humerus in the radial groove with the deep brachial artery. In front of the lateral epicondyle it supplies brachioradialis and ECRL, then splits into deep (motor) and superficial (sensory) branches.', de: 'Größter Ast des Plexus, der Nerv aller Strecker. Gibt in Achsel und Oberarm die Trizepsäste ab, windet sich dann mit der A. profunda brachii im Sulcus nervi radialis um die Rückseite des Humerus. Vor dem Epicondylus lateralis versorgt er M. brachioradialis und M. extensor carpi radialis longus und teilt sich in einen tiefen (motorischen) und einen oberflächlichen (sensiblen) Ast.' },
    lesion: {
      en: 'Midshaft humerus fracture (radial groove): wrist drop, no finger or thumb extension, numbness over the dorsal first web space. Triceps is usually spared because its branches arise higher. Lesion in the axilla ("crutch palsy", "Saturday night palsy") also weakens triceps.',
      de: 'Humerusschaftfraktur (Sulcus nervi radialis): Fallhand, keine Streckung von Fingern und Daumen, Taubheit dorsal im ersten Zwischenfingerraum. Der M. triceps bleibt meist intakt, weil seine Äste höher abgehen. Eine Läsion in der Achsel („Krückenlähmung“, „Parkbanklähmung“) schwächt zusätzlich den Trizeps.'
    },
    path: [[13, -6.8, -1.6], [15.6, -11, -4], [18.6, -17, -4.8], [21, -24, -2.6], [21.8, -30, -0.4], [21.8, -33, 0]], r: 0.32
  },
  {
    id: 'n_radial_deep', type: 'nerve', segs: ['C6', 'C7', 'C8'], parents: ['n_radial'],
    name: { en: 'Deep branch of radial nerve / posterior interosseous nerve', de: 'Tiefer Ast des Speichennervs / N. interosseus posterior', la: 'Ramus profundus nervi radialis / Nervus interosseus antebrachii posterior' },
    info: { en: 'Motor branch. Supplies ECRB and supinator, passes through the supinator (arcade of Frohse) and continues as the posterior interosseous nerve to all remaining forearm extensors.', de: 'Motorischer Ast. Versorgt M. extensor carpi radialis brevis und M. supinator, zieht durch den Supinator (Frohse-Arkade) und setzt sich als N. interosseus posterior zu allen übrigen Unterarmstreckern fort.' },
    lesion: { en: 'Supinator syndrome: "finger drop" without wrist drop (ECRL is spared, so the wrist extends with radial deviation). No sensory loss.', de: 'Supinatorlogensyndrom: Fingerstreckerlähmung ohne Fallhand (M. extensor carpi radialis longus intakt, das Handgelenk streckt mit Radialabweichung). Keine Sensibilitätsstörung.' },
    path: [[21.8, -33, 0], [21.6, -36, -1.6], [20.8, -40, -2.6], [20.2, -48, -2.6], [20.8, -56, -2]], r: 0.22
  },
  {
    id: 'n_radial_superficial', type: 'nerve', segs: ['C6', 'C7', 'C8'], parents: ['n_radial'],
    name: { en: 'Superficial branch of radial nerve', de: 'Oberflächlicher Ast des Speichennervs', la: 'Ramus superficialis nervi radialis' },
    info: { en: 'Purely sensory. Runs under brachioradialis and becomes subcutaneous above the wrist to supply the radial dorsum of the hand.', de: 'Rein sensibel. Verläuft unter dem M. brachioradialis und wird oberhalb des Handgelenks subkutan; versorgt den radialen Handrücken.' },
    lesion: { en: 'Numbness or tingling over the dorsal first web space (e.g. tight watch strap or handcuffs: "cheiralgia paraesthetica"). No weakness.', de: 'Taubheit oder Kribbeln dorsal im ersten Zwischenfingerraum (z. B. enges Uhrarmband, Handschellen: „Cheiralgia paraesthetica“). Keine Lähmung.' },
    path: [[21.8, -33, 0], [23.2, -42, 0.6], [24, -52, 0.4], [24.2, -59, -0.4], [23.6, -63, -0.6]], r: 0.18
  },
  {
    id: 'n_ain', type: 'nerve', segs: ['C8', 'T1'], parents: ['n_median'],
    name: { en: 'Anterior interosseous nerve', de: 'Vorderer Zwischenknochennerv', la: 'Nervus interosseus antebrachii anterior' },
    info: { en: 'Motor branch of the median nerve on the interosseous membrane. Supplies the deep flexors: FPL, lateral half of FDP and pronator quadratus.', de: 'Motorischer Ast des N. medianus auf der Membrana interossea. Versorgt die tiefen Beuger: M. flexor pollicis longus, radiale Hälfte des M. flexor digitorum profundus und M. pronator quadratus.' },
    lesion: { en: 'Cannot make an "OK" sign: the tip pinch of thumb and index collapses into a pad pinch. No sensory loss.', de: 'Kein „O-Zeichen“ möglich: der Spitzgriff von Daumen und Zeigefinger kollabiert zum Pulpagriff. Keine Sensibilitätsstörung.' },
    path: [[19, -36, 1], [20.2, -44, 0.1], [20.6, -54, 0.1]], r: 0.18
  },
  {
    id: 'n_median_recurrent', type: 'nerve', segs: ['C8', 'T1'], parents: ['n_median'],
    name: { en: 'Recurrent (thenar) branch of median nerve', de: 'Thenarast des Mittelarmnervs', la: 'Ramus thenaris nervi mediani' },
    info: { en: 'Curves back from the median nerve just after the carpal tunnel into the thenar muscles. Superficial; at risk from cuts to the thenar eminence ("million-dollar nerve").', de: 'Biegt kurz nach dem Karpaltunnel vom N. medianus rückläufig in die Thenarmuskeln ab. Oberflächlich und durch Schnittverletzungen am Daumenballen gefährdet.' },
    lesion: { en: 'Loss of thumb opposition and abduction; thenar wasting. Sensation preserved.', de: 'Verlust von Opposition und Abduktion des Daumens; Thenaratrophie. Sensibilität erhalten.' },
    path: [[21, -62.4, 1.8], [22.4, -61.6, 2.2], [23.6, -62.4, 2]], r: 0.15
  },
  {
    id: 'n_ulnar_deep', type: 'nerve', segs: ['C8', 'T1'], parents: ['n_ulnar'],
    name: { en: 'Deep branch of ulnar nerve', de: 'Tiefer Ast des Ellennervs', la: 'Ramus profundus nervi ulnaris' },
    info: { en: 'Motor branch from Guyon\'s canal. Arches across the deep palm with the deep palmar arch to hypothenar muscles, all interossei, lumbricals 3–4, adductor pollicis and the deep head of flexor pollicis brevis.', de: 'Motorischer Ast aus der Loge de Guyon. Zieht mit dem Arcus palmaris profundus bogenförmig durch die tiefe Hohlhand zu Hypothenar, allen Mm. interossei, Mm. lumbricales III–IV, M. adductor pollicis und dem Caput profundum des M. flexor pollicis brevis.' },
    lesion: { en: 'Weakness of the small hand muscles (finger spreading, pinch) with clawing, but normal sensation (e.g. cyclists pressing on the handlebar).', de: 'Schwäche der kleinen Handmuskeln (Fingerspreizen, Pinzettengriff) mit Krallenstellung, aber normaler Sensibilität (z. B. bei Radfahrern durch Druck auf den Lenker).' },
    path: [[18.8, -61, 1], [19.6, -63.6, 0.5], [21.6, -64.4, 0.4], [23.6, -63.4, 0.4]], r: 0.16
  },

  // --- non-plexus nerves for the shoulder girdle (the accessory nerve lives in the head and neck region)
  {
    id: 'n_cervical_plexus', type: 'nerve', group: 'cranial', segs: ['C3', 'C4'], parents: ['n_plexus_cervical'],
    name: { en: 'Cervical plexus branches (C3–C4)', de: 'Äste des Halsgeflechts (C3–C4)', la: 'Rami plexus cervicalis (C3–C4)' },
    info: { en: 'Direct branches of C3–C4 to levator scapulae (and proprioceptive fibres to trapezius). Shown so that levator scapulae\'s double supply is visible.', de: 'Direkte Äste aus C3–C4 zum M. levator scapulae (und propriozeptive Fasern zum M. trapezius). Dargestellt, um die Doppelversorgung des M. levator scapulae zu zeigen.' },
    lesion: { en: 'Partial levator scapulae weakness.', de: 'Teilweise Schwäche des M. levator scapulae.' },
    path: [[2.6, 10, -3.4], [4.6, 8, -5]], r: 0.16
  }
];

// ---------------------------------------------------------------- arteries
const arteries = [
  {
    id: 'a_subclavian', type: 'artery', parents: ['a_brachiocephalic'],
    name: { en: 'Subclavian artery', de: 'Schlüsselbeinarterie', la: 'Arteria subclavia' },
    info: { en: 'On the right from the brachiocephalic trunk. Arches over the first rib behind scalenus anterior (together with the plexus trunks, in the scalene gap) and becomes the axillary artery at the lateral border of the first rib. Gives the thyrocervical trunk (suprascapular artery).', de: 'Rechts aus dem Truncus brachiocephalicus. Zieht hinter dem M. scalenus anterior (mit den Primärsträngen durch die Skalenuslücke) über die erste Rippe und wird am Außenrand der ersten Rippe zur A. axillaris. Gibt den Truncus thyrocervicalis (A. suprascapularis) ab.' },
    path: [[1.5, -2, 1], [4.5, 2.6, 0.2], [7.5, 1.6, -0.6], [10, -1.2, -0.2]], r: 0.55
  },
  {
    id: 'a_suprascapular', type: 'artery', parents: ['a_subclavian'],
    name: { en: 'Suprascapular artery', de: 'Obere Schulterblattarterie', la: 'Arteria suprascapularis' },
    info: { en: 'From the thyrocervical trunk. Passes above the transverse scapular ligament (the nerve passes below: "the army goes over the bridge, the navy goes under"). Part of the scapular anastomosis.', de: 'Aus dem Truncus thyrocervicalis. Zieht über das Lig. transversum scapulae superius (der Nerv darunter). Teil der Skapula-Anastomose.' },
    path: [[4.8, 2.4, 0.2], [8, 1.6, -3.6], [11.4, 0.4, -7], [13.6, -2, -8.8], [14.6, -5, -8.6]], r: 0.2
  },
  {
    id: 'a_dorsal_scapular', type: 'artery', parents: ['a_subclavian'],
    name: { en: 'Dorsal scapular artery', de: 'Dorsale Schulterblattarterie', la: 'Arteria dorsalis scapulae' },
    info: { en: 'From the subclavian artery (or as the deep branch of the transverse cervical artery). Runs with the dorsal scapular nerve along the medial border of the scapula to the rhomboids and levator scapulae; part of the scapular anastomosis.', de: 'Aus der A. subclavia (oder als R. profundus der A. transversa cervicis). Verläuft mit dem N. dorsalis scapulae am Margo medialis der Scapula zu den Mm. rhomboidei und zum M. levator scapulae; Teil der Skapula-Anastomose.' },
    path: [[6, 2.2, -0.4], [6.6, 0, -6], [7.2, -3, -9.8], [8, -12, -9.8]], r: 0.18
  },
  {
    id: 'a_axillary', type: 'artery', parents: ['a_subclavian'],
    name: { en: 'Axillary artery', de: 'Achselarterie', la: 'Arteria axillaris' },
    info: { en: 'From the first rib to the lower border of teres major. Divided into three parts by pectoralis minor; the plexus cords are named for their position around its second part.', de: 'Von der ersten Rippe bis zum Unterrand des M. teres major. Der M. pectoralis minor teilt sie in drei Abschnitte; die Faszikel sind nach ihrer Lage um den zweiten Abschnitt benannt.' },
    path: [[10, -1.2, -0.2], [12.4, -5, 0.1], [14.6, -9, 0.2], [15.4, -11, 0.4]], r: 0.5
  },
  {
    id: 'a_thoracoacromial', type: 'artery', parents: ['a_axillary'],
    name: { en: 'Thoracoacromial artery', de: 'Brust-Schulterhöhen-Arterie', la: 'Arteria thoracoacromialis' },
    info: { en: 'Short trunk piercing the clavipectoral fascia; its pectoral branches supply both pectoral muscles, other branches reach the deltoid and acromion.', de: 'Kurzer Stamm durch die Fascia clavipectoralis; seine Rr. pectorales versorgen beide Brustmuskeln, weitere Äste Deltamuskel und Akromion.' },
    path: [[11.4, -3, 0], [11.6, -3, 2.8], [10, -5, 4]], r: 0.2
  },
  {
    id: 'a_lat_thoracic', type: 'artery', parents: ['a_axillary'],
    name: { en: 'Lateral thoracic artery', de: 'Seitliche Brustkorbarterie', la: 'Arteria thoracica lateralis' },
    info: { en: 'Runs down the lateral chest wall with the long thoracic nerve; supplies serratus anterior and the lateral breast.', de: 'Verläuft mit dem N. thoracicus longus an der seitlichen Brustwand; versorgt M. serratus anterior und die laterale Brustdrüse.' },
    path: [[12.4, -5, 0.2], [12, -10, 1], [11.6, -17, 0.6]], r: 0.18
  },
  {
    id: 'a_subscapular', type: 'artery', parents: ['a_axillary'],
    name: { en: 'Subscapular artery', de: 'Unterschulterblattarterie', la: 'Arteria subscapularis' },
    info: { en: 'Largest branch of the axillary artery. Splits into the circumflex scapular artery (to the back of the scapula, scapular anastomosis) and the thoracodorsal artery (to latissimus dorsi).', de: 'Größter Ast der A. axillaris. Teilt sich in A. circumflexa scapulae (zur Rückseite der Scapula, Skapula-Anastomose) und A. thoracodorsalis (zum M. latissimus dorsi).' },
    path: [[13.6, -7, -0.2], [13.6, -9, -2.6], [13.2, -10.6, -4.4]], r: 0.25
  },
  {
    id: 'a_circ_scapular', type: 'artery', parents: ['a_subscapular'],
    name: { en: 'Circumflex scapular artery', de: 'Umfassende Schulterblattarterie', la: 'Arteria circumflexa scapulae' },
    info: { en: 'Passes through the medial (triangular) axillary space to the infraspinous fossa and joins the scapular anastomosis, a collateral route if the axillary artery is blocked.', de: 'Zieht durch die mediale Achsellücke in die Fossa infraspinata und bildet die Skapula-Anastomose, einen Kollateralkreislauf bei Verschluss der A. axillaris.' },
    path: [[13.2, -10.6, -4.4], [14, -11, -7.6], [12, -11, -9.4]], r: 0.16
  },
  {
    id: 'a_thoracodorsal', type: 'artery', parents: ['a_subscapular'],
    name: { en: 'Thoracodorsal artery', de: 'Brust-Rücken-Arterie', la: 'Arteria thoracodorsalis' },
    info: { en: 'Accompanies the thoracodorsal nerve to latissimus dorsi (pedicle of the latissimus flap).', de: 'Begleitet den N. thoracodorsalis zum M. latissimus dorsi (Gefäßstiel des Latissimus-Lappens).' },
    path: [[13.2, -10.6, -4.4], [13.8, -16, -5.4], [13.8, -21, -5.4]], r: 0.16
  },
  {
    id: 'a_ant_circ_humeral', type: 'artery', parents: ['a_axillary'],
    name: { en: 'Anterior circumflex humeral artery', de: 'Vordere umfassende Oberarmarterie', la: 'Arteria circumflexa humeri anterior' },
    info: { en: 'Small vessel around the front of the surgical neck; anastomoses with the posterior circumflex humeral artery.', de: 'Kleines Gefäß um die Vorderseite des Collum chirurgicum; anastomosiert mit der A. circumflexa humeri posterior.' },
    path: [[14.6, -8.4, 0.4], [17, -7.8, 0.6], [19.6, -7.4, -0.6]], r: 0.15
  },
  {
    id: 'a_post_circ_humeral', type: 'artery', parents: ['a_axillary'],
    name: { en: 'Posterior circumflex humeral artery', de: 'Hintere umfassende Oberarmarterie', la: 'Arteria circumflexa humeri posterior' },
    info: { en: 'Runs with the axillary nerve through the quadrangular (lateral axillary) space around the surgical neck; main supply of the deltoid.', de: 'Zieht mit dem N. axillaris durch die laterale Achsellücke um das Collum chirurgicum; Hauptversorgung des M. deltoideus.' },
    path: [[14.6, -8.6, 0], [15.8, -8.6, -4.6], [18.6, -8.8, -4.6], [20.6, -8, -2.4]], r: 0.2
  },
  {
    id: 'a_brachial', type: 'artery', parents: ['a_axillary'],
    name: { en: 'Brachial artery', de: 'Oberarmarterie', la: 'Arteria brachialis' },
    info: { en: 'Continues the axillary artery down the medial arm with the median nerve (felt in the medial bicipital groove; used for blood-pressure measurement). Ends in the cubital fossa, medial to the biceps tendon, by dividing into radial and ulnar arteries.', de: 'Setzt die A. axillaris im Sulcus bicipitalis medialis mit dem N. medianus fort (dort tastbar; Blutdruckmessung). Endet in der Ellenbeuge medial der Bizepssehne mit der Teilung in A. radialis und A. ulnaris.' },
    path: [[15.4, -11, 0.4], [16.2, -20, 0.6], [17.6, -28, 1], [18.8, -34.4, 1.4]], r: 0.42
  },
  {
    id: 'a_deep_brachial', type: 'artery', parents: ['a_brachial'],
    name: { en: 'Deep brachial artery', de: 'Tiefe Oberarmarterie', la: 'Arteria profunda brachii' },
    info: { en: 'Follows the radial nerve in the radial groove behind the humerus; supplies triceps and joins the anastomosis around the elbow.', de: 'Begleitet den N. radialis im Sulcus nervi radialis hinter dem Humerus; versorgt den M. triceps und speist das Rete articulare cubiti.' },
    path: [[15.6, -12.6, 0.2], [16.6, -14.6, -3.6], [18.8, -18, -4.6], [21, -25, -2.8]], r: 0.22
  },
  {
    id: 'a_radial', type: 'artery', parents: ['a_brachial'],
    name: { en: 'Radial artery', de: 'Speichenarterie', la: 'Arteria radialis' },
    info: { en: 'Runs under brachioradialis to the wrist, where the radial pulse is felt lateral to the FCR tendon. Passes through the anatomical snuffbox and forms most of the deep palmar arch.', de: 'Verläuft unter dem M. brachioradialis zum Handgelenk, wo lateral der Sehne des M. flexor carpi radialis der Radialispuls tastbar ist. Zieht durch die Tabatière und bildet den größten Teil des Arcus palmaris profundus.' },
    path: [[18.8, -34.4, 1.4], [21, -40, 1.4], [22.6, -50, 1.2], [23.6, -57, 0.8], [24.2, -60, -0.4]], r: 0.3
  },
  {
    id: 'a_ulnar', type: 'artery', parents: ['a_brachial'],
    name: { en: 'Ulnar artery', de: 'Ellenarterie', la: 'Arteria ulnaris' },
    info: { en: 'Runs deep to the superficial flexors, then alongside the ulnar nerve under FCU, through Guyon\'s canal, and forms most of the superficial palmar arch. Gives the common interosseous artery.', de: 'Verläuft unter den oberflächlichen Beugern, dann mit dem N. ulnaris unter dem M. flexor carpi ulnaris durch die Loge de Guyon und bildet den größten Teil des Arcus palmaris superficialis. Gibt die A. interossea communis ab.' },
    path: [[18.8, -34.4, 1.4], [18.4, -38, 0.6], [17.8, -46, 0.6], [18.4, -57, 0.9], [18.8, -60.4, 1.4]], r: 0.3
  },
  {
    id: 'a_common_interosseous', type: 'artery', parents: ['a_ulnar'],
    name: { en: 'Common interosseous artery', de: 'Gemeinsame Zwischenknochenarterie', la: 'Arteria interossea communis' },
    info: { en: 'Short trunk that splits into anterior and posterior interosseous arteries on either side of the interosseous membrane.', de: 'Kurzer Stamm, der sich beiderseits der Membrana interossea in A. interossea anterior und posterior teilt.' },
    path: [[18.4, -37.6, 0.6], [19.4, -38.6, 0]], r: 0.2
  },
  {
    id: 'a_ant_interosseous', type: 'artery', parents: ['a_common_interosseous'],
    name: { en: 'Anterior interosseous artery', de: 'Vordere Zwischenknochenarterie', la: 'Arteria interossea anterior' },
    info: { en: 'Runs with the anterior interosseous nerve on the front of the interosseous membrane; supplies the deep flexors.', de: 'Verläuft mit dem N. interosseus anterior auf der Vorderseite der Membrana interossea; versorgt die tiefen Beuger.' },
    path: [[19.4, -38.6, 0], [20, -46, -0.3], [20.4, -54, -0.3]], r: 0.15
  },
  {
    id: 'a_post_interosseous', type: 'artery', parents: ['a_common_interosseous'],
    name: { en: 'Posterior interosseous artery', de: 'Hintere Zwischenknochenarterie', la: 'Arteria interossea posterior' },
    info: { en: 'Passes above the interosseous membrane to the back of the forearm with the posterior interosseous nerve; supplies the extensors.', de: 'Zieht oberhalb der Membrana interossea mit dem N. interosseus posterior auf die Streckseite; versorgt die Strecker.' },
    path: [[19.4, -38.6, 0], [19.8, -40, -2.2], [20, -48, -3], [20.6, -55, -2.4]], r: 0.15
  },
  {
    id: 'a_superficial_palmar_arch', type: 'artery', parents: ['a_ulnar'],
    name: { en: 'Superficial palmar arch', de: 'Oberflächlicher Hohlhandbogen', la: 'Arcus palmaris superficialis' },
    info: { en: 'Mainly from the ulnar artery; lies just under the palmar aponeurosis at the level of the outstretched thumb. Gives the common palmar digital arteries. The Allen test checks that both arches fill.', de: 'Hauptsächlich aus der A. ulnaris; liegt direkt unter der Palmaraponeurose auf Höhe des abgespreizten Daumens. Gibt die Aa. digitales palmares communes ab. Der Allen-Test prüft die Füllung beider Bögen.' },
    path: [[18.8, -60.4, 1.4], [19.4, -64.6, 1.9], [21.4, -65.6, 2], [23.4, -63.6, 1.9]], r: 0.18
  },
  {
    id: 'a_deep_palmar_arch', type: 'artery', parents: ['a_radial'],
    name: { en: 'Deep palmar arch', de: 'Tiefer Hohlhandbogen', la: 'Arcus palmaris profundus' },
    info: { en: 'Mainly from the radial artery; lies on the bases of the metacarpals with the deep branch of the ulnar nerve, about 1 cm closer to the wrist than the superficial arch.', de: 'Hauptsächlich aus der A. radialis; liegt mit dem R. profundus n. ulnaris auf den Basen der Mittelhandknochen, etwa 1 cm proximal des oberflächlichen Bogens.' },
    path: [[24.2, -60, -0.4], [23, -62.4, 0.2], [21, -63.2, 0.2], [19.2, -62.4, 0.4]], r: 0.16
  }
];

// ---------------------------------------------------------------- muscles
// nerves: [nerveId, segments carried to this muscle, optional note]
const M = (id, region, name, o, i, action, nerveList, arteryList, oBones, iBones, shape) => ({
  id, type: 'muscle', group: region, name,
  origin: o, insertion: i, action,
  nerves: nerveList.map(([n, seg, note]) => ({ n, seg, note })),
  arteries: arteryList, originBones: oBones, insertionBones: iBones, shape
});

const muscles = [
  // ----- shoulder girdle (axioappendicular)
  M('trapezius', 'shoulder',
    { en: 'Trapezius', de: 'Trapezmuskel (Kapuzenmuskel)', la: 'Musculus trapezius' },
    { en: 'Occipital bone, nuchal ligament, spinous processes C7–T12', de: 'Os occipitale, Lig. nuchae, Dornfortsätze C7–T12' },
    { en: 'Lateral third of clavicle, acromion, spine of scapula', de: 'Laterales Drittel der Clavicula, Akromion, Spina scapulae' },
    { en: 'Upper fibres elevate the scapula (shrug); middle fibres retract it; lower fibres depress it. Upper and lower fibres together rotate the scapula upwards so the arm can be raised above 90°.', de: 'Pars descendens hebt die Scapula (Schulterzucken), Pars transversa zieht sie zur Wirbelsäule, Pars ascendens senkt sie. Pars descendens und ascendens drehen die Scapula gemeinsam nach oben, damit der Arm über 90° gehoben werden kann.' },
    [['n_accessory', ['CN XI']]], ['a_suprascapular'], ['clavicle'], ['clavicle', 'scapula'],
    { fibers: [[[0.8, 10, -6.4], [6, 6, -8], [12.5, 1.6, -4.2]], [[0.8, 4, -11.2], [9, 2, -11], [16.6, 0.8, -6]], [[0.8, -6, -11.6], [7, -4, -11.4], [13.6, -3.4, -10.6]], [[0.8, -17, -10.6], [5, -10, -11.4], [8.4, -5, -11.2]]], r: 1.2 }),
  M('levator_scapulae', 'shoulder',
    { en: 'Levator scapulae', de: 'Schulterblattheber', la: 'Musculus levator scapulae' },
    { en: 'Transverse processes C1–C4', de: 'Querfortsätze C1–C4' },
    { en: 'Superior angle and upper medial border of scapula', de: 'Angulus superior und oberer Margo medialis der Scapula' },
    { en: 'Elevates the scapula and rotates the glenoid downwards.', de: 'Hebt die Scapula und dreht die Cavitas glenoidalis nach unten.' },
    [['n_dorsal_scapular', ['C5']], ['n_cervical_plexus', ['C3', 'C4'], { en: 'direct C3–C4 branches', de: 'direkte Äste aus C3–C4' }]], ['a_dorsal_scapular'], [], ['scapula'],
    { fibers: [[[2.8, 13, -4.4], [5.6, 6, -7.4], [7.8, -0.8, -9.4]]], r: 0.9 }),
  M('rhomboid_minor', 'shoulder',
    { en: 'Rhomboid minor', de: 'Kleiner Rautenmuskel', la: 'Musculus rhomboideus minor' },
    { en: 'Spinous processes C6–C7', de: 'Dornfortsätze C6–C7' },
    { en: 'Medial border of scapula at the root of the spine', de: 'Margo medialis der Scapula auf Höhe der Spina' },
    { en: 'Retracts the scapula and rotates the glenoid downwards; holds the scapula against the thorax.', de: 'Zieht die Scapula zur Wirbelsäule, dreht die Cavitas glenoidalis nach unten und fixiert die Scapula am Thorax.' },
    [['n_dorsal_scapular', ['C5']]], ['a_dorsal_scapular'], [], ['scapula'],
    { fibers: [[[0.8, 3.4, -10.6], [7.2, -2.2, -10]]], r: 0.7 }),
  M('rhomboid_major', 'shoulder',
    { en: 'Rhomboid major', de: 'Großer Rautenmuskel', la: 'Musculus rhomboideus major' },
    { en: 'Spinous processes T1–T4', de: 'Dornfortsätze T1–T4' },
    { en: 'Medial border of scapula below the spine', de: 'Margo medialis der Scapula unterhalb der Spina' },
    { en: 'Retracts the scapula and rotates the glenoid downwards; holds the scapula against the thorax.', de: 'Zieht die Scapula zur Wirbelsäule, dreht die Cavitas glenoidalis nach unten und fixiert die Scapula am Thorax.' },
    [['n_dorsal_scapular', ['C5']]], ['a_dorsal_scapular'], [], ['scapula'],
    { fibers: [[[0.8, -1, -10.8], [7.6, -6, -10]], [[0.8, -7, -10.8], [8.8, -13, -9.4]]], r: 0.8 }),
  M('serratus_anterior', 'shoulder',
    { en: 'Serratus anterior', de: 'Vorderer Sägezahnmuskel', la: 'Musculus serratus anterior' },
    { en: 'Outer surfaces of ribs 1–8 (9)', de: 'Außenflächen der 1.–8. (9.) Rippe' },
    { en: 'Anterior surface of the medial border of scapula', de: 'Vorderfläche des Margo medialis der Scapula' },
    { en: 'Pulls the scapula forwards around the thorax (protraction, punching) and, with trapezius, rotates it upwards. Keeps the scapula flat against the chest.', de: 'Zieht die Scapula um den Thorax nach vorn (Protraktion, Boxerstoß) und dreht sie mit dem M. trapezius nach oben. Hält die Scapula am Thorax.' },
    [['n_long_thoracic', ['C5', 'C6', 'C7']]], ['a_lat_thoracic', 'a_thoracodorsal'], [], ['scapula'],
    { fibers: [[[11.6, -8, 3], [13, -6, -3], [8.2, -2.6, -8.6]], [[12.4, -13, 2.4], [13.6, -11, -3.4], [8.8, -8, -8.8]], [[12.4, -18, 1], [13.6, -16, -4], [9.6, -13, -8.6]], [[11.6, -23, -0.4], [12.8, -20, -5], [10.2, -17, -8.4]]], r: 0.9 }),
  M('pectoralis_major', 'shoulder',
    { en: 'Pectoralis major', de: 'Großer Brustmuskel', la: 'Musculus pectoralis major' },
    { en: 'Medial half of clavicle, sternum, costal cartilages 1–6, aponeurosis of external oblique', de: 'Mediale Hälfte der Clavicula, Sternum, Rippenknorpel 1–6, Rektusscheide' },
    { en: 'Crest of the greater tubercle (lateral lip of intertubercular groove) of humerus', de: 'Crista tuberculi majoris des Humerus' },
    { en: 'Adducts and internally rotates the arm. The clavicular head flexes the shoulder; the sternocostal head extends it from a flexed position. Accessory muscle of inspiration when the arm is fixed.', de: 'Adduziert und innenrotiert den Arm. Die Pars clavicularis führt die Anteversion aus, die Pars sternocostalis die Retroversion aus Anteversion. Atemhilfsmuskel bei aufgestütztem Arm.' },
    [['n_lat_pectoral', ['C5', 'C6', 'C7'], { en: 'clavicular and upper sternal part', de: 'Pars clavicularis und oberer Teil' }], ['n_med_pectoral', ['C8', 'T1'], { en: 'lower sternocostal part', de: 'unterer Teil der Pars sternocostalis' }]], ['a_thoracoacromial'], ['clavicle'], ['humerus'],
    { fibers: [[[5.8, 0.6, 3.8], [12, -2.6, 3.4], [18.4, -8, 0.8]], [[1.8, -4, 5], [11, -6, 4.6], [18.4, -8.6, 0.8]], [[1.8, -10, 5.2], [11, -9, 4.6], [18.4, -9.2, 0.8]], [[4, -16, 4.6], [11.6, -12, 4], [18.4, -9.8, 0.6]]], r: 1.1 }),
  M('pectoralis_minor', 'shoulder',
    { en: 'Pectoralis minor', de: 'Kleiner Brustmuskel', la: 'Musculus pectoralis minor' },
    { en: 'Ribs 3–5 near their cartilages', de: '3.–5. Rippe nahe den Rippenknorpeln' },
    { en: 'Coracoid process of scapula', de: 'Processus coracoideus der Scapula' },
    { en: 'Pulls the scapula forwards and downwards; lifts the ribs when the scapula is fixed. Landmark dividing the axillary artery into three parts.', de: 'Zieht die Scapula nach vorn unten; hebt die Rippen bei fixierter Scapula. Landmarke, die die A. axillaris in drei Abschnitte teilt.' },
    [['n_med_pectoral', ['C8', 'T1']]], ['a_thoracoacromial'], [], ['scapula'],
    { fibers: [[[7.6, -9, 4.4], [12.4, -4, 2.8], [14, -2, 1.6]], [[8.6, -13, 4], [12.8, -6, 2.6], [14, -2.2, 1.4]], [[9.6, -16.4, 3.4], [13, -8, 2.4], [14, -2.4, 1.2]]], r: 0.7 }),
  M('subclavius', 'shoulder',
    { en: 'Subclavius', de: 'Unterschlüsselbeinmuskel', la: 'Musculus subclavius' },
    { en: 'First rib and its cartilage', de: '1. Rippe und Rippenknorpel' },
    { en: 'Inferior surface of middle third of clavicle', de: 'Unterfläche des mittleren Clavicula-Drittels' },
    { en: 'Anchors and depresses the clavicle; cushions the subclavian vessels in clavicle fractures.', de: 'Verankert und senkt die Clavicula; polstert die Vasa subclavia bei Claviculafrakturen.' },
    [['n_subclavius', ['C5', 'C6']]], ['a_thoracoacromial'], [], ['clavicle'],
    { fibers: [[[4.4, -1.2, 2.2], [8, -0.4, 2], [11.2, 0.2, 0.6]]], r: 0.5 }),
  M('latissimus_dorsi', 'shoulder',
    { en: 'Latissimus dorsi', de: 'Breiter Rückenmuskel', la: 'Musculus latissimus dorsi' },
    { en: 'Spinous processes T7–L5, thoracolumbar fascia, iliac crest, lower 3–4 ribs, inferior angle of scapula', de: 'Dornfortsätze T7–L5, Fascia thoracolumbalis, Crista iliaca, untere 3–4 Rippen, Angulus inferior scapulae' },
    { en: 'Floor of the intertubercular groove of humerus', de: 'Crista tuberculi minoris (Boden des Sulcus intertubercularis) des Humerus' },
    { en: 'Extends, adducts and internally rotates the arm; pulls the body up when climbing; helps forced expiration (coughing).', de: 'Retroversion, Adduktion und Innenrotation des Arms; zieht beim Klettern den Rumpf hoch; unterstützt die forcierte Exspiration (Husten).' },
    [['n_thoracodorsal', ['C6', 'C7', 'C8']]], ['a_thoracodorsal'], [], ['humerus'],
    { fibers: [[[0.8, -18, -10.6], [9, -16, -10], [14.6, -12, -5.4], [17.4, -7.6, -0.6]], [[0.8, -28, -9.6], [10, -24, -8.8], [15, -14, -5], [17.4, -8, -0.6]], [[6, -36, -7.6], [12.6, -26, -6], [15.4, -15, -4.2], [17.4, -8.4, -0.6]], [[12, -31, -4], [14.4, -22, -4], [15.6, -15, -3.6], [17.4, -8.8, -0.6]]], r: 1.1 }),

  // ----- scapulohumeral
  M('deltoid', 'shoulder',
    { en: 'Deltoid', de: 'Deltamuskel', la: 'Musculus deltoideus' },
    { en: 'Lateral third of clavicle, acromion, spine of scapula', de: 'Laterales Drittel der Clavicula, Akromion, Spina scapulae' },
    { en: 'Deltoid tuberosity of humerus', de: 'Tuberositas deltoidea des Humerus' },
    { en: 'Acromial part: abducts the arm from about 15° to 90° (after supraspinatus starts it). Clavicular part: flexion and internal rotation. Spinal part: extension and external rotation.', de: 'Pars acromialis: Abduktion von etwa 15° bis 90° (nachdem der M. supraspinatus sie eingeleitet hat). Pars clavicularis: Anteversion und Innenrotation. Pars spinalis: Retroversion und Außenrotation.' },
    [['n_axillary', ['C5', 'C6']]], ['a_post_circ_humeral', 'a_thoracoacromial'], ['clavicle', 'scapula'], ['humerus'],
    { fibers: [[[14, 1.2, 0.2], [19.4, -4, 1.6], [20.8, -15, -1.2]], [[18.4, 1.2, -3], [21.6, -5, -2.6], [20.8, -15, -1.6]], [[15, -1, -8], [20, -5, -6.4], [20.6, -15, -2]]], r: 1.4 }),
  M('supraspinatus', 'shoulder',
    { en: 'Supraspinatus', de: 'Obergrätenmuskel', la: 'Musculus supraspinatus' },
    { en: 'Supraspinous fossa of scapula', de: 'Fossa supraspinata der Scapula' },
    { en: 'Superior facet of the greater tubercle of humerus', de: 'Obere Facette des Tuberculum majus' },
    { en: 'Initiates abduction (first 15°) and holds the humeral head in the glenoid. Rotator cuff muscle; its tendon passes under the acromion and is the most commonly torn or impinged.', de: 'Leitet die Abduktion ein (erste 15°) und zentriert den Humeruskopf in der Pfanne. Muskel der Rotatorenmanschette; seine Sehne zieht unter dem Akromion durch und ist am häufigsten von Ruptur oder Impingement betroffen.' },
    [['n_suprascapular', ['C5', 'C6']]], ['a_suprascapular'], ['scapula'], ['humerus'],
    { fibers: [[[9.6, -1.6, -9.4], [14.6, -0.8, -7], [19.6, -2.4, -2.6]]], r: 0.9 }),
  M('infraspinatus', 'shoulder',
    { en: 'Infraspinatus', de: 'Untergrätenmuskel', la: 'Musculus infraspinatus' },
    { en: 'Infraspinous fossa of scapula', de: 'Fossa infraspinata der Scapula' },
    { en: 'Middle facet of the greater tubercle of humerus', de: 'Mittlere Facette des Tuberculum majus' },
    { en: 'Main external rotator of the arm; rotator cuff muscle stabilising the shoulder.', de: 'Hauptaußenrotator des Arms; Muskel der Rotatorenmanschette, stabilisiert die Schulter.' },
    [['n_suprascapular', ['C5', 'C6']]], ['a_suprascapular', 'a_circ_scapular'], ['scapula'], ['humerus'],
    { fibers: [[[9.6, -9, -10], [15.6, -6.4, -8], [19.8, -3.8, -4]], [[11, -13.4, -9.6], [16, -8, -7.6], [19.8, -4.2, -4]]], r: 1.0 }),
  M('teres_minor', 'shoulder',
    { en: 'Teres minor', de: 'Kleiner Rundmuskel', la: 'Musculus teres minor' },
    { en: 'Upper two-thirds of the lateral border of scapula', de: 'Obere zwei Drittel des Margo lateralis der Scapula' },
    { en: 'Inferior facet of the greater tubercle of humerus', de: 'Untere Facette des Tuberculum majus' },
    { en: 'External rotation; rotator cuff muscle.', de: 'Außenrotation; Muskel der Rotatorenmanschette.' },
    [['n_axillary', ['C5', 'C6']]], ['a_circ_scapular', 'a_post_circ_humeral'], ['scapula'], ['humerus'],
    { fibers: [[[13.6, -11, -8.2], [17, -8, -6.4], [19.4, -5.6, -4.4]]], r: 0.7 }),
  M('teres_major', 'shoulder',
    { en: 'Teres major', de: 'Großer Rundmuskel', la: 'Musculus teres major' },
    { en: 'Inferior angle of scapula', de: 'Angulus inferior der Scapula' },
    { en: 'Medial lip of the intertubercular groove of humerus', de: 'Crista tuberculi minoris des Humerus' },
    { en: 'Adducts, extends and internally rotates the arm ("little helper of latissimus").', de: 'Adduktion, Retroversion und Innenrotation („kleiner Helfer des Latissimus“).' },
    [['n_lower_subscapular', ['C5', 'C6']]], ['a_circ_scapular', 'a_thoracodorsal'], ['scapula'], ['humerus'],
    { fibers: [[[11, -16.6, -8.6], [14.6, -12, -6.4], [17.2, -9, -1.4]]], r: 0.9 }),
  M('subscapularis', 'shoulder',
    { en: 'Subscapularis', de: 'Unterschulterblattmuskel', la: 'Musculus subscapularis' },
    { en: 'Subscapular fossa (anterior surface of scapula)', de: 'Fossa subscapularis (Vorderfläche der Scapula)' },
    { en: 'Lesser tubercle of humerus', de: 'Tuberculum minus des Humerus' },
    { en: 'Main internal rotator; rotator cuff muscle holding the humeral head forwards in the glenoid.', de: 'Hauptinnenrotator; Muskel der Rotatorenmanschette, sichert den Humeruskopf nach vorn.' },
    [['n_upper_subscapular', ['C5', 'C6'], { en: 'upper part', de: 'oberer Teil' }], ['n_lower_subscapular', ['C5', 'C6'], { en: 'lower part', de: 'unterer Teil' }]], ['a_subscapular'], ['scapula'], ['humerus'],
    { fibers: [[[9.6, -6, -7.6], [14, -5, -4.2], [17.4, -4.2, -0.4]], [[10.6, -12, -7.4], [14.4, -7, -4], [17.4, -4.8, -0.4]]], r: 0.9 }),

  // ----- arm
  M('coracobrachialis', 'arm',
    { en: 'Coracobrachialis', de: 'Rabenschnabel-Oberarmmuskel', la: 'Musculus coracobrachialis' },
    { en: 'Tip of coracoid process', de: 'Spitze des Processus coracoideus' },
    { en: 'Middle of the medial humeral shaft', de: 'Mitte der medialen Humerusfläche' },
    { en: 'Flexes and adducts the arm. Pierced by the musculocutaneous nerve.', de: 'Anteversion und Adduktion. Wird vom N. musculocutaneus durchbohrt.' },
    [['n_musculocutaneous', ['C6', 'C7']]], ['a_axillary', 'a_brachial'], ['scapula'], ['humerus'],
    { fibers: [[[14, -2.2, 1.6], [15.6, -9, 1.2], [17, -16, -1]]], r: 0.7 }),
  M('biceps_brachii', 'arm',
    { en: 'Biceps brachii', de: 'Zweiköpfiger Oberarmmuskel', la: 'Musculus biceps brachii' },
    { en: 'Long head: supraglenoid tubercle (tendon runs through the shoulder joint and the intertubercular groove). Short head: tip of coracoid process', de: 'Caput longum: Tuberculum supraglenoidale (Sehne läuft durch das Schultergelenk und den Sulcus intertubercularis). Caput breve: Spitze des Processus coracoideus' },
    { en: 'Radial tuberosity; bicipital aponeurosis into forearm fascia', de: 'Tuberositas radii; Aponeurosis bicipitalis in die Unterarmfaszie' },
    { en: 'Strongest supinator of the forearm (screwdriver movement), flexes the elbow (strongest when supinated) and weakly flexes the shoulder.', de: 'Stärkster Supinator des Unterarms (Schraubendreherbewegung), beugt im Ellenbogen (am stärksten in Supination), schwache Anteversion.' },
    [['n_musculocutaneous', ['C5', 'C6']]], ['a_brachial'], ['scapula'], ['radius'],
    { fibers: [[[16.2, -2.4, -2], [18.6, -5, 0.8], [18.8, -14, 3.4], [19.4, -26, 2.8], [20.6, -36.4, 0.4]], [[14, -2.2, 1.8], [16.4, -8, 2.8], [17.6, -16, 3.6], [19, -26, 3], [20.6, -36.4, 0.4]]], r: 1.15 }),
  M('brachialis', 'arm',
    { en: 'Brachialis', de: 'Oberarmmuskel', la: 'Musculus brachialis' },
    { en: 'Distal half of the anterior humerus', de: 'Distale Hälfte der Humerusvorderfläche' },
    { en: 'Coronoid process and tuberosity of ulna', de: 'Processus coronoideus und Tuberositas ulnae' },
    { en: 'Pure and most powerful elbow flexor in every forearm position ("workhorse of elbow flexion").', de: 'Reiner und kräftigster Beuger im Ellenbogen in jeder Unterarmstellung („Arbeitspferd der Beugung“).' },
    [['n_musculocutaneous', ['C5', 'C6']], ['n_radial', ['C7'], { en: 'small lateral part', de: 'kleiner lateraler Anteil' }]], ['a_brachial'], ['humerus'], ['ulna'],
    { fibers: [[[18.6, -17, 0.4], [18.8, -27, 1.4], [18.2, -35.6, 0.4]]], r: 1.25 }),
  M('triceps_brachii', 'arm',
    { en: 'Triceps brachii', de: 'Dreiköpfiger Oberarmmuskel', la: 'Musculus triceps brachii' },
    { en: 'Long head: infraglenoid tubercle of scapula. Lateral head: posterior humerus above the radial groove. Medial head: posterior humerus below the radial groove', de: 'Caput longum: Tuberculum infraglenoidale. Caput laterale: Hinterfläche des Humerus oberhalb des Sulcus nervi radialis. Caput mediale: unterhalb des Sulcus' },
    { en: 'Olecranon of ulna', de: 'Olecranon der Ulna' },
    { en: 'Main extensor of the elbow; the long head also extends and adducts the shoulder.', de: 'Hauptstrecker im Ellenbogen; das Caput longum führt zusätzlich Retroversion und Adduktion im Schultergelenk aus.' },
    [['n_radial', ['C6', 'C7', 'C8']]], ['a_deep_brachial'], ['scapula', 'humerus'], ['ulna'],
    { fibers: [[[16, -5, -4.4], [17, -14, -6.4], [17.6, -25, -5.8], [17.4, -31.4, -4.8]], [[19.6, -9, -4.4], [19.4, -17, -6], [18.4, -26, -6], [17.4, -31.4, -4.8]], [[18.2, -19, -4], [18, -26, -5], [17.4, -31.4, -4.8]]], r: 1.2 }),
  M('anconeus', 'arm',
    { en: 'Anconeus', de: 'Ellenbogenmuskel (Knorrenmuskel)', la: 'Musculus anconeus' },
    { en: 'Posterior surface of the lateral epicondyle', de: 'Hinterfläche des Epicondylus lateralis' },
    { en: 'Lateral olecranon and upper posterior ulna', de: 'Laterales Olecranon und obere Hinterfläche der Ulna' },
    { en: 'Assists triceps in extending the elbow; tenses the joint capsule.', de: 'Unterstützt den M. triceps bei der Streckung; spannt die Gelenkkapsel.' },
    [['n_radial', ['C7', 'C8']]], ['a_deep_brachial'], ['humerus'], ['ulna'],
    { fibers: [[[21.6, -33, -2.6], [19.8, -34.6, -3.6], [18.2, -37, -3]]], r: 0.6 }),

  // ----- anterior forearm (flexor-pronator group)
  M('pronator_teres', 'forearm_anterior',
    { en: 'Pronator teres', de: 'Runder Einwärtsdreher', la: 'Musculus pronator teres' },
    { en: 'Medial epicondyle (common flexor origin) and coronoid process of ulna', de: 'Epicondylus medialis (gemeinsamer Beugerursprung) und Processus coronoideus ulnae' },
    { en: 'Middle of the lateral surface of radius', de: 'Mitte der Lateralfläche des Radius' },
    { en: 'Pronates the forearm and assists elbow flexion. The median nerve passes between its two heads (pronator syndrome).', de: 'Proniert den Unterarm und unterstützt die Beugung im Ellenbogen. Der N. medianus zieht zwischen seinen beiden Köpfen hindurch (Pronator-teres-Syndrom).' },
    [['n_median', ['C6', 'C7']]], ['a_ulnar', 'a_radial'], ['humerus', 'ulna'], ['radius'],
    { fibers: [[[16.4, -33, -1.4], [19, -38, 1.6], [22.2, -44, 0.6]]], r: 0.75 }),
  M('flexor_carpi_radialis', 'forearm_anterior',
    { en: 'Flexor carpi radialis', de: 'Speichenseitiger Handbeuger', la: 'Musculus flexor carpi radialis' },
    { en: 'Medial epicondyle (common flexor origin)', de: 'Epicondylus medialis (gemeinsamer Beugerursprung)' },
    { en: 'Bases of metacarpals II and III', de: 'Basen der Ossa metacarpi II und III' },
    { en: 'Flexes the wrist and deviates it radially (abduction). Its tendon is the landmark for feeling the radial pulse.', de: 'Beugt das Handgelenk und abduziert es nach radial. Seine Sehne ist Leitstruktur zum Tasten des Radialispulses.' },
    [['n_median', ['C6', 'C7']]], ['a_radial'], ['humerus'], ['metacarpals'],
    { fibers: [[[16.4, -33.4, -1], [18.8, -42, 2.2], [21.4, -56, 1.6], [22, -61.6, 1]]], r: 0.65 }),
  M('palmaris_longus', 'forearm_anterior',
    { en: 'Palmaris longus', de: 'Langer Hohlhandmuskel', la: 'Musculus palmaris longus' },
    { en: 'Medial epicondyle (common flexor origin)', de: 'Epicondylus medialis (gemeinsamer Beugerursprung)' },
    { en: 'Flexor retinaculum and palmar aponeurosis', de: 'Retinaculum musculorum flexorum und Aponeurosis palmaris' },
    { en: 'Weak wrist flexor; tenses the palmar aponeurosis. Absent in about 15% of people; used as a tendon graft.', de: 'Schwacher Handgelenksbeuger; spannt die Palmaraponeurose. Fehlt bei etwa 15 % der Menschen; wird als Sehnentransplantat verwendet.' },
    [['n_median', ['C7', 'C8']]], ['a_ulnar'], ['humerus'], ['carpals'],
    { fibers: [[[16.2, -33.6, -0.8], [18.2, -42, 2.6], [20.4, -56, 2], [20.6, -61.4, 2]]], r: 0.5 }),
  M('flexor_carpi_ulnaris', 'forearm_anterior',
    { en: 'Flexor carpi ulnaris', de: 'Ellenseitiger Handbeuger', la: 'Musculus flexor carpi ulnaris' },
    { en: 'Medial epicondyle and olecranon / posterior border of ulna', de: 'Epicondylus medialis sowie Olecranon und Hinterrand der Ulna' },
    { en: 'Pisiform, hook of hamate, base of metacarpal V', de: 'Os pisiforme, Hamulus ossis hamati, Basis des Os metacarpi V' },
    { en: 'Flexes the wrist and deviates it to the ulnar side (adduction). The ulnar nerve enters the forearm between its two heads (cubital tunnel).', de: 'Beugt das Handgelenk und adduziert es nach ulnar. Der N. ulnaris tritt zwischen seinen beiden Köpfen in den Unterarm (Kubitaltunnel).' },
    [['n_ulnar', ['C8', 'T1']]], ['a_ulnar'], ['humerus', 'ulna'], ['carpals'],
    { fibers: [[[15.8, -33.6, -2.6], [16.4, -42, 0.4], [17.8, -55, 1], [18.6, -59.6, 1]]], r: 0.75 }),
  M('flexor_digitorum_superficialis', 'forearm_anterior',
    { en: 'Flexor digitorum superficialis', de: 'Oberflächlicher Fingerbeuger', la: 'Musculus flexor digitorum superficialis' },
    { en: 'Medial epicondyle, coronoid process of ulna, anterior radius', de: 'Epicondylus medialis, Processus coronoideus ulnae, Vorderfläche des Radius' },
    { en: 'Middle phalanges of fingers 2–5 (tendons split to let the FDP tendons through)', de: 'Mittelphalangen der Finger 2–5 (die Sehnen spalten sich, um die Profundussehnen durchzulassen)' },
    { en: 'Flexes the proximal interphalangeal joints (and MCP and wrist). Each finger can be tested on its own.', de: 'Beugt die proximalen Interphalangealgelenke (sowie Grund- und Handgelenk). Jeder Finger einzeln prüfbar.' },
    [['n_median', ['C7', 'C8', 'T1']]], ['a_ulnar', 'a_radial'], ['humerus', 'ulna', 'radius'], ['phalanges'],
    { fibers: [[[16.8, -34, -0.2], [19, -44, 1.6], [20.2, -57, 1.6], [21, -66, 1.4], [21.2, -71, 1]], [[17.2, -35, -0.4], [18.6, -46, 1.4], [19.8, -57, 1.4], [19.6, -66, 1.4], [19.6, -71, 1]]], r: 0.75 }),
  M('flexor_digitorum_profundus', 'forearm_anterior',
    { en: 'Flexor digitorum profundus', de: 'Tiefer Fingerbeuger', la: 'Musculus flexor digitorum profundus' },
    { en: 'Anterior and medial ulna and interosseous membrane', de: 'Vorder- und Medialfläche der Ulna und Membrana interossea' },
    { en: 'Distal phalanges of fingers 2–5', de: 'Endphalangen der Finger 2–5' },
    { en: 'Only muscle that flexes the distal interphalangeal joints; also flexes the other finger joints and the wrist. Origin of the lumbricals.', de: 'Einziger Beuger der distalen Interphalangealgelenke; beugt auch die übrigen Fingergelenke und das Handgelenk. Ursprung der Mm. lumbricales.' },
    [['n_ain', ['C8', 'T1'], { en: 'lateral half (index and middle finger)', de: 'radiale Hälfte (Zeige- und Mittelfinger)' }], ['n_ulnar', ['C8', 'T1'], { en: 'medial half (ring and little finger)', de: 'ulnare Hälfte (Ring- und Kleinfinger)' }]], ['a_ant_interosseous', 'a_ulnar'], ['ulna'], ['phalanges'],
    { fibers: [[[18, -37, -0.6], [19.4, -47, 0.6], [20.4, -58, 1.1], [21.6, -68, 0.6], [22.6, -75, 0.4]], [[17.8, -39, -0.6], [18.6, -48, 0.6], [19.6, -58, 1.1], [19.6, -68, 0.6], [19.4, -76, 0.4]]], r: 0.8 }),
  M('flexor_pollicis_longus', 'forearm_anterior',
    { en: 'Flexor pollicis longus', de: 'Langer Daumenbeuger', la: 'Musculus flexor pollicis longus' },
    { en: 'Anterior surface of radius and interosseous membrane', de: 'Vorderfläche des Radius und Membrana interossea' },
    { en: 'Base of distal phalanx of thumb', de: 'Basis der Endphalanx des Daumens' },
    { en: 'Flexes the thumb, the only flexor of its interphalangeal joint.', de: 'Beugt den Daumen; einziger Beuger seines Interphalangealgelenks.' },
    [['n_ain', ['C8', 'T1']]], ['a_ant_interosseous'], ['radius'], ['phalanges'],
    { fibers: [[[21.4, -41, 0.2], [22, -50, 0.6], [22.6, -58, 1], [25, -64, 1.4], [26.8, -69.6, 1.4]]], r: 0.65 }),
  M('pronator_quadratus', 'forearm_anterior',
    { en: 'Pronator quadratus', de: 'Quadratischer Einwärtsdreher', la: 'Musculus pronator quadratus' },
    { en: 'Distal quarter of anterior ulna', de: 'Distales Viertel der Vorderfläche der Ulna' },
    { en: 'Distal quarter of anterior radius', de: 'Distales Viertel der Vorderfläche des Radius' },
    { en: 'Main pronator (starts every pronation); holds radius and ulna together.', de: 'Hauptpronator (leitet jede Pronation ein); hält Radius und Ulna zusammen.' },
    [['n_ain', ['C8', 'T1']]], ['a_ant_interosseous'], ['ulna'], ['radius'],
    { fibers: [[[18.6, -54, 0.2], [20.8, -54.4, 0.8], [23.2, -54, 0.4]]], r: 0.6 }),

  // ----- posterior forearm (extensor group)
  M('brachioradialis', 'forearm_posterior',
    { en: 'Brachioradialis', de: 'Oberarmspeichenmuskel', la: 'Musculus brachioradialis' },
    { en: 'Upper lateral supracondylar ridge of humerus', de: 'Obere Crista supracondylaris lateralis des Humerus' },
    { en: 'Lateral distal radius just above the styloid process', de: 'Distaler lateraler Radius oberhalb des Processus styloideus' },
    { en: 'Flexes the elbow, strongest in mid-pronation (beer-glass position). Supplied by the radial nerve although it is a flexor. Brachioradialis reflex: C6.', de: 'Beugt im Ellenbogen, am stärksten in Mittelstellung („Bierglasmuskel“). Wird vom N. radialis versorgt, obwohl er ein Beuger ist. Brachioradialisreflex: C6.' },
    [['n_radial', ['C5', 'C6']]], ['a_radial'], ['humerus'], ['radius'],
    { fibers: [[[21.6, -24, -1], [22.8, -34, 1], [23.6, -44, 1.2], [24, -56.6, 0.6]]], r: 0.95 }),
  M('extensor_carpi_radialis_longus', 'forearm_posterior',
    { en: 'Extensor carpi radialis longus', de: 'Langer speichenseitiger Handstrecker', la: 'Musculus extensor carpi radialis longus' },
    { en: 'Lower lateral supracondylar ridge of humerus', de: 'Untere Crista supracondylaris lateralis des Humerus' },
    { en: 'Base of metacarpal II (dorsal)', de: 'Dorsale Basis des Os metacarpi II' },
    { en: 'Extends and radially deviates the wrist; needed for a strong fist.', de: 'Streckt das Handgelenk und abduziert es nach radial; wichtig für den kräftigen Faustschluss.' },
    [['n_radial', ['C6', 'C7']]], ['a_radial'], ['humerus'], ['metacarpals'],
    { fibers: [[[22, -28.6, -1], [23.2, -38, -0.4], [23.2, -50, -0.4], [22.2, -61.4, -0.7]]], r: 0.75 }),
  M('extensor_carpi_radialis_brevis', 'forearm_posterior',
    { en: 'Extensor carpi radialis brevis', de: 'Kurzer speichenseitiger Handstrecker', la: 'Musculus extensor carpi radialis brevis' },
    { en: 'Lateral epicondyle (common extensor origin)', de: 'Epicondylus lateralis (gemeinsamer Streckerursprung)' },
    { en: 'Base of metacarpal III (dorsal)', de: 'Dorsale Basis des Os metacarpi III' },
    { en: 'Extends the wrist. Its origin is the usual site of "tennis elbow" (lateral epicondylitis).', de: 'Streckt das Handgelenk. Sein Ursprung ist typischer Ort des „Tennisellenbogens“ (Epicondylitis lateralis).' },
    [['n_radial_deep', ['C7', 'C8']]], ['a_radial'], ['humerus'], ['metacarpals'],
    { fibers: [[[22.2, -33, -1.4], [22.6, -42, -1.4], [22.2, -52, -1.2], [21, -61.6, -0.8]]], r: 0.7 }),
  M('extensor_digitorum', 'forearm_posterior',
    { en: 'Extensor digitorum', de: 'Fingerstrecker', la: 'Musculus extensor digitorum' },
    { en: 'Lateral epicondyle (common extensor origin)', de: 'Epicondylus lateralis (gemeinsamer Streckerursprung)' },
    { en: 'Extensor expansions (dorsal aponeuroses) of fingers 2–5', de: 'Dorsalaponeurosen der Finger 2–5' },
    { en: 'Extends the fingers at the MCP joints (and IP joints together with the intrinsics) and the wrist.', de: 'Streckt die Finger in den Grundgelenken (in den Interphalangealgelenken zusammen mit den kleinen Handmuskeln) und das Handgelenk.' },
    [['n_radial_deep', ['C7', 'C8']]], ['a_post_interosseous'], ['humerus'], ['phalanges'],
    { fibers: [[[21.6, -33.4, -2], [21.4, -44, -2.8], [21, -57, -2], [21.6, -66, -0.8], [22.4, -73, -0.6]], [[21.4, -34, -2.2], [20.6, -45, -2.8], [20.2, -57, -2], [19.8, -66, -0.8], [19.6, -73, -0.6]]], r: 0.75 }),
  M('extensor_digiti_minimi', 'forearm_posterior',
    { en: 'Extensor digiti minimi', de: 'Kleinfingerstrecker', la: 'Musculus extensor digiti minimi' },
    { en: 'Lateral epicondyle (common extensor origin)', de: 'Epicondylus lateralis (gemeinsamer Streckerursprung)' },
    { en: 'Extensor expansion of little finger', de: 'Dorsalaponeurose des Kleinfingers' },
    { en: 'Extends the little finger on its own.', de: 'Streckt den Kleinfinger unabhängig.' },
    [['n_radial_deep', ['C7', 'C8']]], ['a_post_interosseous'], ['humerus'], ['phalanges'],
    { fibers: [[[21, -34, -2.6], [19.8, -46, -3], [19, -57, -2], [18.2, -66, -0.8], [17.8, -71, -0.6]]], r: 0.5 }),
  M('extensor_carpi_ulnaris', 'forearm_posterior',
    { en: 'Extensor carpi ulnaris', de: 'Ellenseitiger Handstrecker', la: 'Musculus extensor carpi ulnaris' },
    { en: 'Lateral epicondyle and posterior border of ulna', de: 'Epicondylus lateralis und Hinterrand der Ulna' },
    { en: 'Base of metacarpal V', de: 'Basis des Os metacarpi V' },
    { en: 'Extends and ulnar-deviates the wrist.', de: 'Streckt das Handgelenk und adduziert es nach ulnar.' },
    [['n_radial_deep', ['C7', 'C8']]], ['a_post_interosseous'], ['humerus', 'ulna'], ['metacarpals'],
    { fibers: [[[20.6, -34, -3], [18.6, -44, -2.8], [18.4, -55, -2], [18.4, -61.2, -0.8]]], r: 0.65 }),
  M('supinator', 'forearm_posterior',
    { en: 'Supinator', de: 'Auswärtsdreher', la: 'Musculus supinator' },
    { en: 'Lateral epicondyle, radial collateral and annular ligaments, supinator crest of ulna', de: 'Epicondylus lateralis, Lig. collaterale radiale und Lig. anulare radii, Crista musculi supinatoris der Ulna' },
    { en: 'Lateral, posterior and anterior surfaces of the proximal third of radius', de: 'Laterale, hintere und vordere Fläche des proximalen Radiusdrittels' },
    { en: 'Supinates the forearm (on its own when the elbow is extended, slowly). The deep branch of the radial nerve runs through it.', de: 'Supiniert den Unterarm (bei gestrecktem Ellenbogen allein, langsam). Der R. profundus n. radialis zieht durch ihn hindurch.' },
    [['n_radial_deep', ['C6', 'C7']]], ['a_post_interosseous', 'a_radial'], ['humerus', 'ulna'], ['radius'],
    { fibers: [[[19, -35.6, -2.6], [21, -37, -2], [22.2, -39, -0.2], [21.6, -41, 1]]], r: 0.7 }),
  M('abductor_pollicis_longus', 'forearm_posterior',
    { en: 'Abductor pollicis longus', de: 'Langer Daumenabspreizer', la: 'Musculus abductor pollicis longus' },
    { en: 'Posterior surfaces of ulna, radius and interosseous membrane', de: 'Hinterflächen von Ulna, Radius und Membrana interossea' },
    { en: 'Base of metacarpal I', de: 'Basis des Os metacarpi I' },
    { en: 'Abducts and extends the thumb at the carpometacarpal joint. With EPB, inflamed in De Quervain tenosynovitis (first extensor compartment).', de: 'Abduziert und streckt den Daumen im Sattelgelenk. Mit dem M. extensor pollicis brevis bei der Tendovaginitis de Quervain (1. Strecksehnenfach) entzündet.' },
    [['n_radial_deep', ['C7', 'C8']]], ['a_post_interosseous'], ['ulna', 'radius'], ['metacarpals'],
    { fibers: [[[19.6, -42, -2.6], [21.6, -48, -1.8], [23.6, -55, -0.4], [24.2, -60.6, 0.4]]], r: 0.55 }),
  M('extensor_pollicis_brevis', 'forearm_posterior',
    { en: 'Extensor pollicis brevis', de: 'Kurzer Daumenstrecker', la: 'Musculus extensor pollicis brevis' },
    { en: 'Posterior radius and interosseous membrane', de: 'Hinterfläche des Radius und Membrana interossea' },
    { en: 'Base of proximal phalanx of thumb', de: 'Basis der Grundphalanx des Daumens' },
    { en: 'Extends the thumb at the MCP joint. Forms the radial border of the anatomical snuffbox.', de: 'Streckt den Daumen im Grundgelenk. Bildet die radiale Begrenzung der Tabatière.' },
    [['n_radial_deep', ['C7', 'C8']]], ['a_post_interosseous'], ['radius'], ['phalanges'],
    { fibers: [[[20.6, -46, -2.2], [22.6, -52, -1.4], [24, -58, -0.2], [25.4, -63, 0.2], [26, -66, 0.4]]], r: 0.45 }),
  M('extensor_pollicis_longus', 'forearm_posterior',
    { en: 'Extensor pollicis longus', de: 'Langer Daumenstrecker', la: 'Musculus extensor pollicis longus' },
    { en: 'Posterior ulna and interosseous membrane', de: 'Hinterfläche der Ulna und Membrana interossea' },
    { en: 'Base of distal phalanx of thumb', de: 'Basis der Endphalanx des Daumens' },
    { en: 'Extends all thumb joints. Hooks around Lister\'s tubercle; can rupture after a distal radius fracture. Ulnar border of the anatomical snuffbox.', de: 'Streckt alle Daumengelenke. Zieht um das Tuberculum dorsale (Lister); kann nach distaler Radiusfraktur reißen. Ulnare Begrenzung der Tabatière.' },
    [['n_radial_deep', ['C7', 'C8']]], ['a_post_interosseous'], ['ulna'], ['phalanges'],
    { fibers: [[[19.8, -44, -2.8], [21, -52, -2.4], [21.8, -57.4, -1.8], [24.6, -63, -0.2], [27, -70, 0.4]]], r: 0.45 }),
  M('extensor_indicis', 'forearm_posterior',
    { en: 'Extensor indicis', de: 'Zeigefingerstrecker', la: 'Musculus extensor indicis' },
    { en: 'Posterior ulna and interosseous membrane (distal)', de: 'Distale Hinterfläche der Ulna und Membrana interossea' },
    { en: 'Extensor expansion of index finger', de: 'Dorsalaponeurose des Zeigefingers' },
    { en: 'Extends the index finger on its own (pointing).', de: 'Streckt den Zeigefinger unabhängig (Zeigen).' },
    [['n_radial_deep', ['C7', 'C8']]], ['a_post_interosseous'], ['ulna'], ['phalanges'],
    { fibers: [[[19.6, -50, -2.4], [20.8, -57, -1.8], [22.2, -66, -0.8], [22.8, -73, -0.6]]], r: 0.4 }),

  // ----- hand
  M('thenar', 'hand',
    { en: 'Thenar muscles (abductor pollicis brevis, flexor pollicis brevis, opponens pollicis)', de: 'Daumenballenmuskeln (Thenarmuskulatur)', la: 'Musculi thenaris: M. abductor pollicis brevis, M. flexor pollicis brevis, M. opponens pollicis' },
    { en: 'Flexor retinaculum, scaphoid and trapezium', de: 'Retinaculum musculorum flexorum, Os scaphoideum und Os trapezium' },
    { en: 'Metacarpal I (opponens) and base of the proximal phalanx of thumb', de: 'Os metacarpi I (Opponens) und Basis der Grundphalanx des Daumens' },
    { en: 'Abduct, flex and oppose the thumb: bring the thumb pad onto the finger pads (precision grip).', de: 'Abduktion, Flexion und Opposition des Daumens: führen die Daumenkuppe an die Fingerkuppen (Präzisionsgriff).' },
    [['n_median_recurrent', ['C8', 'T1']], ['n_ulnar_deep', ['C8', 'T1'], { en: 'deep head of flexor pollicis brevis only', de: 'nur Caput profundum des M. flexor pollicis brevis' }]], ['a_superficial_palmar_arch', 'a_radial'], ['carpals'], ['metacarpals', 'phalanges'],
    { fibers: [[[21.6, -60.2, 1.8], [24, -62.4, 2.2], [25.8, -65.4, 1.6]], [[21.8, -61, 1.4], [23.8, -63.4, 1.6], [25.8, -65.8, 1.2]], [[21.6, -60.8, 1], [23.2, -62.4, 1], [25, -64.2, 0.8]]], r: 0.75 }),
  M('adductor_pollicis', 'hand',
    { en: 'Adductor pollicis', de: 'Daumenanzieher', la: 'Musculus adductor pollicis' },
    { en: 'Oblique head: capitate and bases of metacarpals II–III. Transverse head: shaft of metacarpal III', de: 'Caput obliquum: Os capitatum und Basen der Ossa metacarpi II–III. Caput transversum: Schaft des Os metacarpi III' },
    { en: 'Base of proximal phalanx of thumb (ulnar side)', de: 'Ulnare Basis der Grundphalanx des Daumens' },
    { en: 'Adducts the thumb, essential for a strong key or paper pinch (tested by the Froment sign).', de: 'Adduziert den Daumen; wichtig für den kräftigen Schlüssel- oder Papiergriff (Froment-Zeichen).' },
    [['n_ulnar_deep', ['C8', 'T1']]], ['a_deep_palmar_arch'], ['carpals', 'metacarpals'], ['phalanges'],
    { fibers: [[[20.8, -61.8, 0.6], [23.4, -63.4, 0.8], [25.6, -65.4, 0.6]], [[20.8, -66, 0.6], [23.4, -65.6, 0.8], [25.6, -65.6, 0.6]]], r: 0.55 }),
  M('hypothenar', 'hand',
    { en: 'Hypothenar muscles (abductor, flexor and opponens digiti minimi)', de: 'Kleinfingerballenmuskeln (Hypothenarmuskulatur)', la: 'Musculi hypothenaris: M. abductor digiti minimi, M. flexor digiti minimi brevis, M. opponens digiti minimi' },
    { en: 'Pisiform, hook of hamate, flexor retinaculum', de: 'Os pisiforme, Hamulus ossis hamati, Retinaculum musculorum flexorum' },
    { en: 'Metacarpal V and base of the proximal phalanx of little finger', de: 'Os metacarpi V und Basis der Grundphalanx des Kleinfingers' },
    { en: 'Abduct, flex and slightly oppose the little finger; cup the palm.', de: 'Abduktion, Flexion und leichte Opposition des Kleinfingers; wölben die Hohlhand.' },
    [['n_ulnar_deep', ['C8', 'T1']]], ['a_ulnar'], ['carpals'], ['metacarpals', 'phalanges'],
    { fibers: [[[18.6, -60.2, 1.4], [17.6, -64, 1.2], [17.6, -68, 0.6]], [[18.8, -61, 1], [18, -64.4, 0.8], [17.8, -67.4, 0.4]]], r: 0.65 }),
  M('interossei', 'hand',
    { en: 'Interossei (palmar and dorsal)', de: 'Zwischenknochenmuskeln', la: 'Musculi interossei palmares et dorsales' },
    { en: 'Sides of metacarpals (dorsal: two heads each)', de: 'Seitenflächen der Ossa metacarpi (dorsale: zweiköpfig)' },
    { en: 'Bases of proximal phalanges and extensor expansions', de: 'Basen der Grundphalangen und Dorsalaponeurosen' },
    { en: 'Dorsal interossei abduct (DAB), palmar interossei adduct (PAD) the fingers. Together they flex the MCP joints and extend the IP joints, the opposite of a claw.', de: 'Mm. interossei dorsales spreizen, Mm. interossei palmares schließen die Finger. Gemeinsam beugen sie die Grundgelenke und strecken die Interphalangealgelenke, das Gegenteil der Krallenstellung.' },
    [['n_ulnar_deep', ['C8', 'T1']]], ['a_deep_palmar_arch'], ['metacarpals'], ['phalanges'],
    { fibers: [[[21.4, -62, -0.2], [21.6, -65.4, -0.2], [21.8, -68.6, 0]], [[20.2, -62, -0.2], [20.2, -65.4, -0.2], [20.2, -68.6, 0]], [[19, -62, -0.2], [18.8, -65, -0.2], [18.6, -68, 0]]], r: 0.4 }),
  M('lumbricals_1_2', 'hand',
    { en: 'Lumbricals 1–2', de: 'Spulmuskeln I–II', la: 'Musculi lumbricales I–II' },
    { en: 'Radial sides of the FDP tendons to index and middle finger', de: 'Radiale Seiten der Profundussehnen zu Zeige- und Mittelfinger' },
    { en: 'Extensor expansions of index and middle finger (radial side)', de: 'Dorsalaponeurosen von Zeige- und Mittelfinger (radial)' },
    { en: 'Flex the MCP joints and extend the IP joints (the "tray-holding" position).', de: 'Beugen die Grundgelenke und strecken die Interphalangealgelenke („Tablett-Haltung“).' },
    [['n_median', ['C8', 'T1']]], ['a_superficial_palmar_arch'], [], ['phalanges'],
    { fibers: [[[21.4, -63, 1.2], [22, -66, 1], [22.4, -69, 0.6]], [[20.4, -63, 1.2], [20.6, -66, 1], [20.8, -69.4, 0.6]]], r: 0.3 }),
  M('lumbricals_3_4', 'hand',
    { en: 'Lumbricals 3–4', de: 'Spulmuskeln III–IV', la: 'Musculi lumbricales III–IV' },
    { en: 'Adjacent sides of the FDP tendons to middle, ring and little finger', de: 'Einander zugewandte Seiten der Profundussehnen zu Mittel-, Ring- und Kleinfinger' },
    { en: 'Extensor expansions of ring and little finger (radial side)', de: 'Dorsalaponeurosen von Ring- und Kleinfinger (radial)' },
    { en: 'Flex the MCP joints and extend the IP joints. Their loss (ulnar nerve) causes clawing of the ring and little fingers.', de: 'Beugen die Grundgelenke und strecken die Interphalangealgelenke. Ihr Ausfall (N. ulnaris) erzeugt die Krallenstellung von Ring- und Kleinfinger.' },
    [['n_ulnar_deep', ['C8', 'T1']]], ['a_superficial_palmar_arch'], [], ['phalanges'],
    { fibers: [[[19.6, -63, 1.2], [19.6, -66, 1], [19.6, -68.8, 0.6]], [[18.8, -63, 1.2], [18.4, -65.6, 1], [18, -67.8, 0.6]]], r: 0.3 })
];

export const structures = [...bones, ...nerves, ...arteries, ...muscles];

// Muscle groups, used to group the structure list.
export const muscleGroups = {
  shoulder: { en: 'Shoulder', de: 'Schulter' },
  arm: { en: 'Arm', de: 'Oberarm' },
  forearm_anterior: { en: 'Forearm: flexors', de: 'Unterarm: Beuger' },
  forearm_posterior: { en: 'Forearm: extensors', de: 'Unterarm: Strecker' },
  hand: { en: 'Hand', de: 'Hand' }
};
