// Lower limb region: structures with English / German / Latin names and their connections.
// Registered in ../data.js.
// Coordinates use the same body frame as the upper limb (schematic cm, origin near the
// sternal notch) as [lateral, superior, anterior] for the RIGHT lower limb in anatomical
// position. Hip joint ≈ y −53, knee ≈ y −95, ankle ≈ y −133, sole ≈ y −140.
//
// Segment values (L1–S3) follow common textbook values (Moore, Prometheus, Schünke).
// Textbooks differ by about one segment for several muscles; this is a learning aid,
// always check against your course atlas. S4 and the pudendal nerve belong to the pelvis.

// Region settings used by the app. camera is in viewer coordinates (lateral mirrored).
export const meta = {
  start: 'gluteus_medius',
  plexus: { en: 'Lumbosacral plexus', de: 'Plexus lumbosacralis' },
  nerveGroups: [
    ['root', { en: 'Roots', de: 'Wurzeln' }],
    ['trunk', { en: 'Lumbosacral trunk', de: 'Truncus lumbosacralis' }],
    ['lumbar', { en: 'Lumbar plexus', de: 'Plexus lumbalis' }],
    ['sacral', { en: 'Sacral plexus', de: 'Plexus sacralis' }]
  ],
  context: ['lumbar_vertebrae'],
  camera: { target: [-9, -88, 0], position: [-34, -80, 190] }
};

// ---------------------------------------------------------------- bones
const bones = [
  {
    id: 'hip_bone', type: 'bone',
    name: { en: 'Hip bone', de: 'Hüftbein', la: 'Os coxae' },
    info: {
      en: 'Formed by ilium, ischium and pubis, which fuse in the acetabulum (Y-shaped growth plate until about age 16). Carries the weight of the trunk to the femur; both hip bones and the sacrum form the pelvic ring. Landmarks: anterior superior iliac spine (ASIS), iliac crest (bone marrow biopsy at the posterior crest), ischial tuberosity (the bone you sit on).',
      de: 'Aus Os ilium, Os ischii und Os pubis, die in der Hüftpfanne (Acetabulum) verschmelzen (Y-Fuge bis etwa zum 16. Lebensjahr). Überträgt das Rumpfgewicht auf den Femur; beide Hüftbeine und das Kreuzbein bilden den Beckenring. Landmarken: Spina iliaca anterior superior, Crista iliaca (Knochenmarkbiopsie am hinteren Beckenkamm), Tuber ischiadicum (Sitzbeinhöcker).'
    },
    shape: {
      plate: [[4.6, -44.5, -9.6], [8.6, -39.6, -6.6], [12.6, -38.6, -1.6], [12.6, -41.4, 3.6], [11.6, -44.4, 6], [10.6, -48, 5], [9.4, -51.4, 3.6], [8, -53, 0], [7, -51, -5.4], [5.6, -48, -8.6]],
      tubes: [
        [[4.6, -44.5, -9.6], [8.6, -39.6, -6.6], [12.6, -38.6, -1.6], [12.6, -41.4, 3.6], [11.6, -44.4, 6]], // iliac crest
        [[8.6, -52.4, 3], [5, -54.6, 5.2], [1.3, -56, 6]],     // superior pubic ramus
        [[1.3, -57.6, 5.4], [3.6, -60.4, 2.6], [6.4, -62.4, -2.4]], // inferior pubic + ischial ramus
        [[8.2, -54.4, -2], [7.4, -58.6, -3.6], [6.4, -62.4, -2.4]]  // body of ischium
      ],
      r: 0.75
    }
  },
  {
    id: 'sacrum', type: 'bone',
    name: { en: 'Sacrum and coccyx', de: 'Kreuzbein und Steißbein', la: 'Os sacrum et os coccygis' },
    info: {
      en: 'Five fused vertebrae wedged between the hip bones at the sacroiliac joints, plus the small coccyx. The sacral nerves leave through its anterior foramina and form the sacral plexus on the piriformis muscle.',
      de: 'Fünf verschmolzene Wirbel, die an den Iliosakralgelenken zwischen den Hüftbeinen verkeilt sind, dazu das kleine Steißbein. Die Sakralnerven treten durch die Foramina sacralia anteriora aus und bilden auf dem M. piriformis den Plexus sacralis.'
    },
    shape: {
      plate: [[5, -43.6, -7], [4.6, -48.6, -9], [2.6, -54.6, -9.6], [0.8, -58, -8.6], [-0.8, -58, -8.6], [-2.6, -54.6, -9.6], [-4.6, -48.6, -9], [-5, -43.6, -7]],
      tubes: [[[0, -43.6, -8], [0, -50, -10], [0, -56, -10], [0, -60, -8]]],
      r: 0.7
    }
  },
  {
    id: 'femur', type: 'bone',
    name: { en: 'Femur', de: 'Oberschenkelknochen', la: 'Femur' },
    info: {
      en: 'Longest and strongest bone. The head sits in the acetabulum; the neck meets the shaft at about 125°. The head is supplied mainly by the medial circumflex femoral artery, so a displaced femoral neck fracture can cause avascular necrosis. Distally the condyles form the knee joint with tibia and patella.',
      de: 'Längster und kräftigster Knochen. Der Kopf sitzt in der Hüftpfanne; Hals und Schaft bilden einen Winkel von etwa 125°. Der Kopf wird vor allem von der A. circumflexa femoris medialis versorgt, daher droht bei dislozierter Schenkelhalsfraktur eine Hüftkopfnekrose. Distal bilden die Kondylen mit Tibia und Patella das Kniegelenk.'
    },
    shape: {
      spheres: [[[9.6, -53.4, 1.2], 2.3], [[14.4, -55.4, -1.2], 1.7], [[11.8, -59.6, -1.4], 0.9]],
      tubes: [[[9.6, -53.4, 1.2], [12.4, -55.6, 0], [13.8, -57.6, -0.4]], [[13.8, -57.6, -0.2], [12.8, -70, 0.8], [11, -84, 0.4], [9.6, -92, -0.2]]],
      ellipsoids: [[[9.4, -94, -0.6], [3.6, 1.8, 2.6]]],
      r: 1.25
    }
  },
  {
    id: 'patella', type: 'bone',
    name: { en: 'Patella', de: 'Kniescheibe', la: 'Patella' },
    info: {
      en: 'Largest sesamoid bone, embedded in the quadriceps tendon. Lengthens the lever arm of the quadriceps. It tends to dislocate laterally, which the lowest fibres of vastus medialis resist.',
      de: 'Größtes Sesambein, eingebettet in die Quadrizepssehne. Verlängert den Hebelarm des M. quadriceps. Neigt zur Luxation nach lateral, der die untersten Fasern des M. vastus medialis entgegenwirken.'
    },
    shape: { ellipsoids: [[[9.4, -92.4, 3.6], [2, 2.4, 0.9]]] }
  },
  {
    id: 'tibia', type: 'bone',
    name: { en: 'Tibia', de: 'Schienbein', la: 'Tibia' },
    info: {
      en: 'Weight-bearing bone of the leg. Its plateau carries the menisci; the anterior border and medial surface lie directly under the skin, so open fractures are common. The medial malleolus forms the inner side of the ankle mortise.',
      de: 'Tragender Knochen des Unterschenkels. Das Tibiaplateau trägt die Menisken; Vorderkante und Medialfläche liegen direkt unter der Haut, daher sind offene Frakturen häufig. Der Innenknöchel bildet die mediale Wand der Malleolengabel.'
    },
    shape: {
      ellipsoids: [[[9.2, -96.6, -0.4], [3.6, 1, 2.6]]],
      tubes: [[[9.2, -97, -0.2], [9.4, -101, 0.6], [8.8, -116, 0.4], [8.2, -131, 0]]],
      spheres: [[[9.6, -99.4, 2], 0.8], [[6.9, -133, 0], 1]],
      r: 1.3
    }
  },
  {
    id: 'fibula', type: 'bone',
    name: { en: 'Fibula', de: 'Wadenbein', la: 'Fibula' },
    info: {
      en: 'Thin lateral bone of the leg. Carries little weight but anchors muscles and forms the lateral malleolus of the ankle. The common fibular nerve winds around its neck, so fractures or pressure there cause foot drop.',
      de: 'Dünner lateraler Unterschenkelknochen. Trägt kaum Gewicht, dient aber als Muskelursprung und bildet den Außenknöchel. Der N. fibularis communis windet sich um das Collum fibulae; Frakturen oder Druck dort verursachen einen Fallfuß.'
    },
    shape: {
      tubes: [[[12, -98.4, -1.6], [11.8, -110, -1.4], [11.3, -124, -1], [11, -133.6, -1]]],
      spheres: [[[12, -98.2, -1.6], 1.1], [[11, -134, -1], 0.95]],
      r: 0.6
    }
  },
  {
    id: 'tarsals', type: 'bone',
    name: { en: 'Tarsal bones', de: 'Fußwurzelknochen', la: 'Ossa tarsi' },
    info: {
      en: 'Seven bones: talus, calcaneus, navicular, cuboid and three cuneiforms. The talus forms the ankle joint; below it the subtalar joint allows inversion and eversion. The calcaneus forms the heel and receives the Achilles tendon.',
      de: 'Sieben Knochen: Talus, Calcaneus, Os naviculare, Os cuboideum und drei Ossa cuneiformia. Der Talus bildet das obere Sprunggelenk; darunter erlaubt das untere Sprunggelenk Supination und Pronation. Der Calcaneus bildet die Ferse, an ihm setzt die Achillessehne an.'
    },
    shape: { ellipsoids: [[[8.6, -134.8, 0.2], [1.8, 1.3, 2]], [[9, -137.6, -2.6], [1.6, 1.8, 3]], [[8.8, -137.2, 3.8], [2.6, 1.2, 2.4]]] }
  },
  {
    id: 'metatarsals', type: 'bone',
    name: { en: 'Metatarsal bones', de: 'Mittelfußknochen', la: 'Ossa metatarsi' },
    info: {
      en: 'Five long bones (I = great toe to V = little toe) that form the arches of the foot with the tarsals. The base of the fifth receives fibularis brevis (avulsion fracture in ankle sprains); the second is the classic site of stress ("march") fractures.',
      de: 'Fünf Röhrenknochen (I = Großzehe bis V = Kleinzehe), die mit der Fußwurzel die Fußgewölbe bilden. An der Basis des fünften setzt der M. fibularis brevis an (Abrissfraktur beim Umknicken); der zweite ist typischer Ort von Ermüdungsbrüchen („Marschfraktur“).'
    },
    shape: {
      tubes: [
        [[7.2, -137.6, 5.8], [6.6, -139.2, 12.6]],
        [[8.2, -137.6, 6], [8.2, -139.2, 12.8]],
        [[9.2, -137.8, 5.8], [9.6, -139.2, 12.4]],
        [[10.2, -138, 5.4], [10.9, -139.3, 11.8]],
        [[11.2, -138.2, 4.6], [12, -139.4, 10.8]]
      ],
      r: 0.42
    }
  },
  {
    id: 'toe_phalanges', type: 'bone',
    name: { en: 'Phalanges of the foot', de: 'Zehenknochen', la: 'Phalanges pedis' },
    info: {
      en: 'Toe bones: two in the great toe (hallux), three in each other toe.',
      de: 'Zehenglieder: zwei in der Großzehe (Hallux), drei in jeder anderen Zehe.'
    },
    shape: {
      tubes: [
        [[6.6, -139.4, 13], [6.4, -139.6, 16.6]],
        [[8.2, -139.4, 13.2], [8.2, -139.6, 15.6]],
        [[9.6, -139.4, 12.8], [9.8, -139.6, 15]],
        [[10.9, -139.4, 12.2], [11.2, -139.6, 14.2]],
        [[12, -139.5, 11.2], [12.4, -139.6, 13]]
      ],
      r: 0.38
    }
  }
];

// ---------------------------------------------------------------- nerves
// parents = the structure(s) this nerve branches from (for the plexus tree).
// segs = spinal segments carried. lesion = clinical picture if this nerve is cut.
const ROOT_TEXT = {
  L1: ['hip flexion (with L2); skin of the groin. Receives a contribution from T12', 'Hüftbeugung (mit L2); Haut der Leiste. Erhält einen Zufluss aus T12'],
  L2: ['hip flexion and adduction; skin of the upper anterior thigh. Cremaster reflex (L1–L2)', 'Hüftbeugung und Adduktion; Haut des oberen vorderen Oberschenkels. Kremasterreflex (L1–L2)'],
  L3: ['knee extension, hip adduction; skin of the lower anterior thigh and medial knee. Patellar reflex (L3–L4)', 'Kniestreckung, Hüftadduktion; Haut des unteren vorderen Oberschenkels und medialen Knies. Patellarsehnenreflex (L3–L4)'],
  L4: ['knee extension, lifting and inverting the foot (tibialis anterior); skin of the medial leg and medial malleolus. Patellar reflex', 'Kniestreckung, Heben und Supination des Fußes (M. tibialis anterior); Haut des medialen Unterschenkels und Innenknöchels. Patellarsehnenreflex'],
  L5: ['great-toe extension, hip abduction, lifting the foot; skin of the lateral leg, dorsum of the foot and great toe', 'Großzehenhebung, Hüftabduktion, Fußhebung; Haut des lateralen Unterschenkels, Fußrückens und der Großzehe'],
  S1: ['plantar flexion, eversion, hip extension; skin of the lateral foot, little toe and sole. Achilles reflex', 'Plantarflexion, Pronation, Hüftstreckung; Haut des lateralen Fußrands, der Kleinzehe und Fußsohle. Achillessehnenreflex'],
  S2: ['toe flexion, small foot muscles; skin of the posterior thigh and popliteal fossa', 'Zehenbeugung, kleine Fußmuskeln; Haut der Oberschenkelrückseite und Kniekehle'],
  S3: ['small foot muscles, pelvic floor; skin of the buttock and around the anus ("saddle" area, with S4–S5)', 'kleine Fußmuskeln, Beckenboden; Haut des Gesäßes und um den Anus („Reithosen“-Areal, mit S4–S5)']
};
const ROOT_LESION = {
  L4: {
    en: 'Disc herniation L3/L4: pain from the front of the thigh to the medial leg, weak knee extension and foot lifting, reduced patellar reflex.',
    de: 'Bandscheibenvorfall L3/L4: Schmerz vom vorderen Oberschenkel bis zum medialen Unterschenkel, schwache Kniestreckung und Fußhebung, abgeschwächter Patellarsehnenreflex.'
  },
  L5: {
    en: 'The most common root lesion (disc herniation L4/L5): pain from the buttock down the lateral leg to the great toe, weak great-toe extension and heel walking, weak hip abduction. Reflexes are usually normal. Unlike a common fibular nerve lesion, inversion (tibialis posterior) and hip abduction are also weak.',
    de: 'Häufigste Wurzelläsion (Bandscheibenvorfall L4/L5): Schmerz vom Gesäß über den lateralen Unterschenkel bis zur Großzehe, schwache Großzehenhebung und Fersengang, schwache Hüftabduktion. Reflexe meist normal. Anders als bei einer Läsion des N. fibularis communis sind auch Supination (M. tibialis posterior) und Hüftabduktion geschwächt.'
  },
  S1: {
    en: 'Disc herniation L5/S1: pain down the back of the leg to the lateral foot, weak plantar flexion (tiptoe walking), absent Achilles reflex.',
    de: 'Bandscheibenvorfall L5/S1: Schmerz über die Beinrückseite bis zum lateralen Fußrand, schwache Plantarflexion (Zehengang), Achillessehnenreflex ausgefallen.'
  }
};

const nerves = [
  ...['L1', 'L2', 'L3', 'L4', 'L5', 'S1', 'S2', 'S3'].map((s, i) => {
    const y = i < 5 ? -31 - i * 3.5 : -48 - (i - 5) * 2.5;
    return {
      id: 'root_' + s, type: 'nerve', group: 'root', segs: [s], parents: [],
      name: { en: `${s} spinal nerve (ventral ramus)`, de: `Spinalnerv ${s} (Ramus anterior)`, la: `Ramus anterior nervi spinalis ${s}` },
      info: {
        en: `Root of the lumbosacral plexus. Myotome / dermatome: ${ROOT_TEXT[s][0]}.`,
        de: `Wurzel des Plexus lumbosacralis. Myotom / Dermatom: ${ROOT_TEXT[s][1]}.`
      },
      ...(ROOT_LESION[s] && { lesion: ROOT_LESION[s] }),
      path: i < 5 ? [[1.8, y, -7.6], [3.8, y - 2.6, -6.2]] : [[1.8, y, -7.8], [4.2, y - 1.2, -7.6]],
      r: 0.32
    };
  }),
  {
    id: 'trunk_lumbosacral', type: 'nerve', group: 'trunk', segs: ['L4', 'L5'], parents: ['root_L4', 'root_L5'],
    name: { en: 'Lumbosacral trunk', de: 'Truncus lumbosacralis', la: 'Truncus lumbosacralis' },
    info: {
      en: 'Part of L4 joins all of L5 and descends over the ala of the sacrum to join S1. It links the lumbar and sacral plexus.',
      de: 'Ein Teil von L4 vereinigt sich mit L5 und zieht über die Ala ossis sacri zu S1. Verbindet Plexus lumbalis und Plexus sacralis.'
    },
    lesion: {
      en: 'Can be pressed against the sacral ala by the fetal head during labour or injured in pelvic fractures: foot drop and weak hip abduction, similar to an L5 lesion.',
      de: 'Kann unter der Geburt durch den kindlichen Kopf gegen die Ala ossis sacri gedrückt oder bei Beckenfrakturen verletzt werden: Fallfuß und schwache Hüftabduktion, ähnlich einer L5-Läsion.'
    },
    path: [[3.8, -46.4, -6.2], [4.8, -48.8, -7.2], [5.6, -50.6, -7.9]], r: 0.42
  },

  // ----- lumbar plexus
  {
    id: 'n_lumbar_direct', type: 'nerve', group: 'lumbar', segs: ['L1', 'L2', 'L3'], parents: ['root_L1', 'root_L2', 'root_L3'],
    name: { en: 'Direct muscular branches of the lumbar plexus', de: 'Direkte Muskeläste des Plexus lumbalis', la: 'Rami musculares plexus lumbalis' },
    info: {
      en: 'Short branches straight from the roots to psoas major and quadratus lumborum.',
      de: 'Kurze Äste direkt aus den Wurzeln zum M. psoas major und M. quadratus lumborum.'
    },
    path: [[3.8, -37, -6.2], [3.4, -40, -5.2]], r: 0.2
  },
  {
    id: 'n_iliohypogastric', type: 'nerve', group: 'lumbar', segs: ['L1'], parents: ['root_L1'],
    name: { en: 'Iliohypogastric nerve', de: 'Nervus iliohypogastricus', la: 'Nervus iliohypogastricus' },
    info: {
      en: 'Runs around the trunk above the iliac crest between the abdominal wall muscles (T12–L1). Supplies the lower internal oblique and transversus abdominis and the skin above the pubis and over the lateral buttock.',
      de: 'Zieht oberhalb des Beckenkamms zwischen den Bauchwandmuskeln um den Rumpf (T12–L1). Versorgt den unteren M. obliquus internus und M. transversus abdominis sowie die Haut oberhalb der Symphyse und über dem lateralen Gesäß.'
    },
    lesion: {
      en: 'Injured by lower abdominal incisions (e.g. appendectomy, hernia repair): numbness above the pubis and a weak spot in the lower abdominal wall. No leg muscles are affected.',
      de: 'Verletzung bei Unterbauchschnitten (z. B. Appendektomie, Hernienoperation): Taubheit oberhalb der Symphyse und eine schwache Stelle der unteren Bauchwand. Keine Beinmuskeln betroffen.'
    },
    path: [[3.8, -33.6, -6.2], [8, -36, -6], [11.6, -37.6, -3], [12.6, -42.4, 3.6], [9, -49, 7.6], [5, -52, 7.4]], r: 0.16
  },
  {
    id: 'n_ilioinguinal', type: 'nerve', group: 'lumbar', segs: ['L1'], parents: ['root_L1'],
    name: { en: 'Ilioinguinal nerve', de: 'Nervus ilioinguinalis', la: 'Nervus ilioinguinalis' },
    info: {
      en: 'Runs through the inguinal canal with the spermatic cord or round ligament. Skin of the upper medial thigh, the root of the penis and anterior scrotum or the mons pubis and labia majora.',
      de: 'Zieht mit dem Samenstrang bzw. Lig. teres uteri durch den Leistenkanal. Haut des oberen medialen Oberschenkels, der Peniswurzel und des vorderen Skrotums bzw. des Mons pubis und der großen Schamlippen.'
    },
    lesion: {
      en: 'Trapped or cut during inguinal hernia repair: chronic burning groin pain and numbness of the upper medial thigh and anterior scrotum or labia. No leg muscles are affected.',
      de: 'Bei Leistenhernienoperationen eingeklemmt oder durchtrennt: chronischer brennender Leistenschmerz und Taubheit am oberen medialen Oberschenkel und vorderen Skrotum bzw. an den Labien. Keine Beinmuskeln betroffen.'
    },
    path: [[3.8, -33.8, -6], [8, -38.4, -5], [11, -42, 1.6], [9.4, -48, 6.6], [6.4, -52, 6.8], [3.4, -55.4, 6.4]], r: 0.16
  },
  {
    id: 'n_genitofemoral', type: 'nerve', group: 'lumbar', segs: ['L1', 'L2'], parents: ['root_L1', 'root_L2'],
    name: { en: 'Genitofemoral nerve', de: 'Nervus genitofemoralis', la: 'Nervus genitofemoralis' },
    info: {
      en: 'Runs down the front of psoas. The genital branch supplies cremaster and the scrotal or labial skin; the femoral branch supplies the skin over the femoral triangle. Stroking the inner thigh raises the testis: the cremaster reflex (afferent femoral branch, efferent genital branch, L1–L2).',
      de: 'Läuft auf der Vorderfläche des M. psoas nach unten. Der R. genitalis versorgt den M. cremaster und die Haut von Skrotum bzw. Labien, der R. femoralis die Haut über dem Trigonum femorale. Bestreichen der Oberschenkelinnenseite hebt den Hoden: Kremasterreflex (afferent R. femoralis, efferent R. genitalis, L1–L2).'
    },
    lesion: {
      en: 'Rare; possible after hernia or pelvic surgery: absent cremaster reflex and groin numbness. No leg muscles are affected.',
      de: 'Selten, z. B. nach Hernien- oder Beckenoperationen: Kremasterreflex ausgefallen, Taubheit in der Leiste. Keine Beinmuskeln betroffen.'
    },
    path: [[3.8, -36, -6.2], [4.4, -42, -3.4], [5.6, -48, 0.6], [6.6, -52, 4.8], [6.8, -54, 6]], r: 0.16
  },
  {
    id: 'n_lat_fem_cutaneous', type: 'nerve', group: 'lumbar', segs: ['L2', 'L3'], parents: ['root_L2', 'root_L3'],
    name: { en: 'Lateral femoral cutaneous nerve', de: 'Nervus cutaneus femoris lateralis', la: 'Nervus cutaneus femoris lateralis' },
    info: {
      en: 'Purely sensory. Crosses the iliacus and leaves the pelvis under or through the inguinal ligament just medial to the ASIS. Supplies the skin of the anterolateral thigh.',
      de: 'Rein sensibel. Zieht über den M. iliacus und verlässt das Becken unter oder durch das Leistenband direkt medial der Spina iliaca anterior superior. Versorgt die Haut des anterolateralen Oberschenkels.'
    },
    lesion: {
      en: 'Meralgia paraesthetica: compressed at the ASIS by tight belts or trousers, obesity, pregnancy or lying prone during surgery. Burning pain and numbness of the anterolateral thigh. No weakness and normal reflexes.',
      de: 'Meralgia paraesthetica: Kompression an der Spina iliaca anterior superior durch enge Gürtel oder Hosen, Adipositas, Schwangerschaft oder Bauchlage bei Operationen. Brennende Schmerzen und Taubheit am anterolateralen Oberschenkel. Keine Lähmung, Reflexe normal.'
    },
    path: [[3.8, -39, -6.2], [7, -41.4, -4.4], [10.4, -43, 1.4], [11.4, -45.4, 5.8], [13, -54, 6.2], [14.6, -66, 4.6]], r: 0.16
  },
  {
    id: 'n_femoral', type: 'nerve', group: 'lumbar', segs: ['L2', 'L3', 'L4'], parents: ['root_L2', 'root_L3', 'root_L4'],
    name: { en: 'Femoral nerve', de: 'Nervus femoralis', la: 'Nervus femoralis' },
    info: {
      en: 'Largest branch of the lumbar plexus. Runs in the groove between psoas and iliacus and enters the thigh under the inguinal ligament, lateral to the femoral artery. In the femoral triangle it fans out to iliacus, pectineus, sartorius and quadriceps and to the skin of the anterior thigh; its saphenous branch continues to the medial leg.',
      de: 'Größter Ast des Plexus lumbalis. Verläuft in der Rinne zwischen M. psoas und M. iliacus und tritt lateral der A. femoralis unter dem Leistenband in den Oberschenkel. Im Trigonum femorale fächert er sich zu M. iliacus, M. pectineus, M. sartorius und M. quadriceps und zur Haut des vorderen Oberschenkels auf; sein Endast N. saphenus zieht zum medialen Unterschenkel.'
    },
    lesion: {
      en: 'Femoral nerve palsy, e.g. from a retroperitoneal haematoma under anticoagulation, a psoas abscess, hip surgery or a femoral catheter. Knee extension is lost, so the knee buckles, especially on stairs; hip flexion is weak; the patellar reflex is absent; the anterior thigh and medial leg are numb.',
      de: 'Femoralisparese, z. B. durch retroperitoneales Hämatom unter Antikoagulation, Psoasabszess, Hüftoperation oder Leistenkatheter. Die Kniestreckung fällt aus, das Knie knickt vor allem auf Treppen ein; die Hüftbeugung ist schwach; der Patellarsehnenreflex fehlt; vorderer Oberschenkel und medialer Unterschenkel sind taub.'
    },
    path: [[3.8, -42, -6.2], [5.8, -46.4, -2.8], [7.6, -50.4, 1.6], [8.6, -52.6, 4.8], [9.2, -56, 5.6], [9.8, -59, 4.8]], r: 0.42
  },
  {
    id: 'n_saphenous', type: 'nerve', group: 'lumbar', segs: ['L3', 'L4'], parents: ['n_femoral'],
    name: { en: 'Saphenous nerve', de: 'Nervus saphenus', la: 'Nervus saphenus' },
    info: {
      en: 'Longest sensory branch of the femoral nerve. Runs with the femoral artery through the adductor canal, then down the medial leg with the great saphenous vein to the medial foot. Its infrapatellar branch supplies the skin below the knee.',
      de: 'Längster sensibler Ast des N. femoralis. Zieht mit der A. femoralis durch den Adduktorenkanal, dann mit der V. saphena magna am medialen Unterschenkel bis zum medialen Fußrand. Sein R. infrapatellaris versorgt die Haut unterhalb des Knies.'
    },
    lesion: {
      en: 'Injured in varicose vein surgery or knee arthroscopy: numbness of the medial leg and foot (or below the knee if only the infrapatellar branch is hit). No muscles are affected.',
      de: 'Verletzung bei Varizenoperationen oder Kniearthroskopie: Taubheit am medialen Unterschenkel und Fuß (bzw. unterhalb des Knies, wenn nur der R. infrapatellaris betroffen ist). Keine Muskeln betroffen.'
    },
    path: [[9.6, -58, 5], [8.8, -66, 4.4], [7.8, -76, 2.6], [6.8, -86, 0.2], [6.2, -96, -0.6], [6.6, -110, 0.4], [6.8, -124, 1], [6.6, -132, 1.6], [6.8, -136, 4]], r: 0.18
  },
  {
    id: 'n_obturator', type: 'nerve', group: 'lumbar', segs: ['L2', 'L3', 'L4'], parents: ['root_L2', 'root_L3', 'root_L4'],
    name: { en: 'Obturator nerve', de: 'Nervus obturatorius', la: 'Nervus obturatorius' },
    info: {
      en: 'Leaves psoas on its medial side, runs along the lateral pelvic wall and through the obturator canal into the medial thigh. Splits around adductor brevis into anterior and posterior branches. Supplies the adductors and gracilis and a patch of skin on the medial thigh.',
      de: 'Tritt medial aus dem M. psoas, zieht an der seitlichen Beckenwand entlang und durch den Canalis obturatorius in den medialen Oberschenkel. Teilt sich um den M. adductor brevis in einen R. anterior und R. posterior. Versorgt die Adduktoren und den M. gracilis sowie ein Hautareal am medialen Oberschenkel.'
    },
    lesion: {
      en: 'After pelvic surgery or tumours, obturator hernia or a difficult birth: weak adduction, so the leg swings outwards when walking (circumduction), and numbness of the medial thigh. Pain radiating to the inner knee (Howship–Romberg sign) suggests an obturator hernia.',
      de: 'Nach Beckenoperationen oder -tumoren, bei Hernia obturatoria oder schwerer Geburt: schwache Adduktion, das Bein schwingt beim Gehen nach außen (Zirkumduktion), Taubheit am medialen Oberschenkel. Schmerzen bis zur Knieinnenseite (Howship-Romberg-Zeichen) sprechen für eine Hernia obturatoria.'
    },
    path: [[3.4, -42, -6.6], [4, -47, -4.8], [5.8, -52, -1.4], [6.2, -55.6, 2.4], [6.4, -58.6, 3.8], [6, -64, 3.2]], r: 0.34
  },

  // ----- sacral plexus
  {
    id: 'n_sup_gluteal', type: 'nerve', group: 'sacral', segs: ['L4', 'L5', 'S1'], parents: ['trunk_lumbosacral', 'root_S1'],
    name: { en: 'Superior gluteal nerve', de: 'Nervus gluteus superior', la: 'Nervus gluteus superior' },
    info: {
      en: 'Leaves the pelvis above piriformis (suprapiriform foramen) with the superior gluteal vessels and runs between gluteus medius and minimus to tensor fasciae latae. No skin branches.',
      de: 'Verlässt das Becken oberhalb des M. piriformis (Foramen suprapiriforme) mit den oberen Gesäßgefäßen und zieht zwischen M. gluteus medius und minimus zum M. tensor fasciae latae. Keine Hautäste.'
    },
    lesion: {
      en: 'From a misplaced intramuscular injection into the buttock or hip surgery. Trendelenburg sign: standing on the affected leg, the pelvis drops on the opposite side. Duchenne limp: the patient leans the trunk over the affected side with each step. Gluteal injections therefore go into the ventrogluteal area (Hochstetter).',
      de: 'Durch fehlerhafte intramuskuläre Injektion ins Gesäß oder Hüftoperationen. Trendelenburg-Zeichen: Beim Stand auf dem betroffenen Bein sinkt das Becken zur Gegenseite ab. Duchenne-Hinken: Der Rumpf wird bei jedem Schritt über das betroffene Bein geneigt. Deshalb wird ventroglutäal nach Hochstetter injiziert.'
    },
    path: [[5.6, -50.6, -7.9], [7, -50.4, -9.6], [9, -48.8, -10.2], [11.8, -46.4, -7.4], [12.8, -45, -2], [12.4, -45.6, 3.4]], r: 0.26
  },
  {
    id: 'n_inf_gluteal', type: 'nerve', group: 'sacral', segs: ['L5', 'S1', 'S2'], parents: ['trunk_lumbosacral', 'root_S1', 'root_S2'],
    name: { en: 'Inferior gluteal nerve', de: 'Nervus gluteus inferior', la: 'Nervus gluteus inferior' },
    info: {
      en: 'Leaves the pelvis below piriformis (infrapiriform foramen) and enters the deep surface of gluteus maximus, its only muscle.',
      de: 'Verlässt das Becken unterhalb des M. piriformis (Foramen infrapiriforme) und tritt von innen in den M. gluteus maximus, seinen einzigen Muskel.'
    },
    lesion: {
      en: 'Weak hip extension: walking on the flat is almost normal, but climbing stairs, standing up from a chair and jumping are difficult. The patient may lean back to keep the hip extended (gluteus maximus gait).',
      de: 'Schwache Hüftstreckung: Gehen in der Ebene fast normal, aber Treppensteigen, Aufstehen vom Stuhl und Springen sind erschwert. Der Rumpf wird evtl. nach hinten verlagert, um die Hüfte gestreckt zu halten.'
    },
    path: [[5.8, -52.4, -8.2], [7.4, -55.6, -10.2], [9.4, -58, -11.6], [11, -60, -10.4]], r: 0.26
  },
  {
    id: 'n_piriformis', type: 'nerve', group: 'sacral', segs: ['S1', 'S2'], parents: ['root_S1', 'root_S2'],
    name: { en: 'Nerve to piriformis', de: 'Nervus musculi piriformis', la: 'Nervus musculi piriformis' },
    info: { en: 'Short branches from S1–S2 straight into piriformis.', de: 'Kurze Äste aus S1–S2 direkt in den M. piriformis.' },
    path: [[4.2, -49.4, -7.6], [5, -51, -8.4]], r: 0.16
  },
  {
    id: 'n_obturator_internus', type: 'nerve', group: 'sacral', segs: ['L5', 'S1', 'S2'], parents: ['trunk_lumbosacral', 'root_S1', 'root_S2'],
    name: { en: 'Nerve to obturator internus', de: 'Nervus musculi obturatorii interni', la: 'Nervus musculi obturatorii interni' },
    info: {
      en: 'Leaves through the infrapiriform foramen, hooks around the ischial spine and re-enters through the lesser sciatic foramen to obturator internus; also supplies superior gemellus.',
      de: 'Verlässt das Becken durch das Foramen infrapiriforme, zieht um die Spina ischiadica und durch das Foramen ischiadicum minus zum M. obturatorius internus; versorgt auch den M. gemellus superior.'
    },
    path: [[5.8, -53, -8], [6.6, -56, -8.6], [6.4, -58, -6.2], [5.8, -58.6, -3]], r: 0.16
  },
  {
    id: 'n_quadratus_femoris', type: 'nerve', group: 'sacral', segs: ['L4', 'L5', 'S1'], parents: ['trunk_lumbosacral', 'root_S1'],
    name: { en: 'Nerve to quadratus femoris', de: 'Nervus musculi quadrati femoris', la: 'Nervus musculi quadrati femoris' },
    info: {
      en: 'Leaves through the infrapiriform foramen deep to the sciatic nerve; supplies quadratus femoris, inferior gemellus and the hip joint.',
      de: 'Verlässt das Becken durch das Foramen infrapiriforme unter dem N. ischiadicus; versorgt M. quadratus femoris, M. gemellus inferior und das Hüftgelenk.'
    },
    path: [[6, -53, -7.6], [7.6, -56.6, -6.2], [9, -59.4, -4.6]], r: 0.16
  },
  {
    id: 'n_post_fem_cutaneous', type: 'nerve', group: 'sacral', segs: ['S1', 'S2', 'S3'], parents: ['root_S1', 'root_S2', 'root_S3'],
    name: { en: 'Posterior femoral cutaneous nerve', de: 'Nervus cutaneus femoris posterior', la: 'Nervus cutaneus femoris posterior' },
    info: {
      en: 'Purely sensory. Leaves through the infrapiriform foramen and runs under the fascia down the back of the thigh. Skin of the lower buttock, posterior thigh, popliteal fossa and part of the perineum.',
      de: 'Rein sensibel. Verlässt das Becken durch das Foramen infrapiriforme und zieht unter der Faszie an der Oberschenkelrückseite nach unten. Haut des unteren Gesäßes, der Oberschenkelrückseite, der Kniekehle und eines Teils des Damms.'
    },
    lesion: {
      en: 'Numbness of the posterior thigh, e.g. from prolonged sitting on a hard edge or gluteal injections. No muscles are affected.',
      de: 'Taubheit der Oberschenkelrückseite, z. B. durch langes Sitzen auf einer harten Kante oder Gesäßinjektionen. Keine Muskeln betroffen.'
    },
    path: [[5.4, -53.6, -8.6], [8, -57, -10.4], [9.2, -62, -7.6], [9.6, -75, -7.4], [9.4, -90, -5.6]], r: 0.16
  },
  {
    id: 'n_sciatic', type: 'nerve', group: 'sacral', segs: ['L4', 'L5', 'S1', 'S2', 'S3'], parents: ['trunk_lumbosacral', 'root_S1', 'root_S2', 'root_S3'],
    name: { en: 'Sciatic nerve', de: 'Nervus ischiadicus', la: 'Nervus ischiadicus' },
    info: {
      en: 'Thickest nerve of the body: the tibial and common fibular nerves in one sheath. Leaves through the infrapiriform foramen, passes midway between greater trochanter and ischial tuberosity, and runs down the back of the thigh under the long head of biceps. Supplies the hamstrings (tibial part) and short head of biceps (fibular part) and usually divides above the popliteal fossa. A high division, with the fibular part passing through piriformis, is a common variant.',
      de: 'Dickster Nerv des Körpers: N. tibialis und N. fibularis communis in einer gemeinsamen Hülle. Verlässt das Becken durch das Foramen infrapiriforme, zieht in der Mitte zwischen Trochanter major und Tuber ischiadicum und an der Oberschenkelrückseite unter dem Caput longum des M. biceps femoris nach unten. Versorgt die ischiokruralen Muskeln (Tibialisanteil) und das Caput breve des M. biceps (Fibularisanteil) und teilt sich meist oberhalb der Kniekehle. Eine hohe Teilung, bei der der Fibularisanteil durch den M. piriformis zieht, ist eine häufige Variante.'
    },
    lesion: {
      en: 'E.g. posterior hip dislocation, hip replacement or a misplaced gluteal injection. Weak knee flexion and all muscles below the knee paralysed (flail foot with foot drop). Numbness of the leg and foot except the medial side (saphenous nerve). Knee extension and hip adduction are intact. The fibular part is more often affected than the tibial part.',
      de: 'Z. B. bei hinterer Hüftluxation, Hüftendoprothese oder fehlerhafter Gesäßinjektion. Schwache Kniebeugung und Lähmung aller Muskeln unterhalb des Knies (schlaffer Fuß mit Fallfuß). Taubheit an Unterschenkel und Fuß außer der Innenseite (N. saphenus). Kniestreckung und Hüftadduktion bleiben erhalten. Der Fibularisanteil ist häufiger betroffen als der Tibialisanteil.'
    },
    path: [[5.6, -51.8, -8], [7.4, -55, -9.4], [9.6, -59, -7.2], [10.2, -66, -5], [10.2, -76, -4.4], [10, -86, -4.4]], r: 0.55
  },
  {
    id: 'n_tibial', type: 'nerve', group: 'sacral', segs: ['L4', 'L5', 'S1', 'S2', 'S3'], parents: ['n_sciatic'],
    name: { en: 'Tibial nerve', de: 'Nervus tibialis', la: 'Nervus tibialis' },
    info: {
      en: 'Runs straight down the middle of the popliteal fossa (the most superficial structure of the neurovascular bundle there), then deep to soleus with the posterior tibial vessels. Passes behind the medial malleolus through the tarsal tunnel (order from front: tibialis posterior, flexor digitorum longus, artery, nerve, flexor hallucis longus: "Tom, Dick And Nervous Harry") and divides into the medial and lateral plantar nerves.',
      de: 'Zieht mitten durch die Kniekehle (dort die oberflächlichste Struktur der Leitungsbahnen), dann mit den Vasa tibialia posteriora unter dem M. soleus. Läuft hinter dem Innenknöchel durch den Tarsaltunnel (von vorn: M. tibialis posterior, M. flexor digitorum longus, Arterie, Nerv, M. flexor hallucis longus) und teilt sich in N. plantaris medialis und lateralis.'
    },
    lesion: {
      en: 'Popliteal fossa trauma or knee dislocation. Cannot stand on tiptoe: weak plantar flexion, inversion and toe flexion; the Achilles reflex is absent; the sole is numb. Without its opponents, the foot is pulled into dorsiflexion and eversion (calcaneus foot). Compression at the ankle is tarsal tunnel syndrome.',
      de: 'Trauma der Kniekehle oder Knieluxation. Zehenstand unmöglich: schwache Plantarflexion, Supination und Zehenbeugung; Achillessehnenreflex fehlt; Fußsohle taub. Ohne Gegenspieler wird der Fuß in Dorsalextension und Pronation gezogen (Hackenfuß). Eine Kompression am Innenknöchel ist das Tarsaltunnelsyndrom.'
    },
    path: [[10, -86, -4.4], [9.4, -92, -5.2], [9.2, -98, -4.8], [9.2, -106, -3.6], [8.4, -118, -3.4], [7.4, -130, -2.2], [6.6, -134, -1.6], [7, -136.6, -0.2]], r: 0.42
  },
  {
    id: 'n_sural', type: 'nerve', group: 'sacral', segs: ['S1', 'S2'], parents: ['n_tibial'],
    name: { en: 'Sural nerve', de: 'Nervus suralis', la: 'Nervus suralis' },
    info: {
      en: 'Purely sensory. Formed from a tibial branch joined by a communicating branch of the common fibular nerve; runs between the heads of gastrocnemius and behind the lateral malleolus. Supplies the skin of the lateral ankle and lateral foot. Used for nerve biopsies and as a nerve graft.',
      de: 'Rein sensibel. Aus einem Ast des N. tibialis und einem R. communicans des N. fibularis communis; zieht zwischen den Gastrocnemiusköpfen und hinter dem Außenknöchel. Versorgt die Haut des lateralen Knöchels und Fußrands. Wird für Nervenbiopsien und als Nerventransplantat genutzt.'
    },
    lesion: {
      en: 'Numbness of the lateral foot, e.g. after biopsy, ankle surgery or tight boots. No muscles are affected.',
      de: 'Taubheit am lateralen Fußrand, z. B. nach Biopsie, Sprunggelenksoperation oder durch enge Stiefel. Keine Muskeln betroffen.'
    },
    path: [[9.2, -95, -5.2], [9, -106, -6.4], [9.6, -120, -4.6], [10.8, -132, -2.8], [11.6, -136, -1], [12, -138.4, 3]], r: 0.16
  },
  {
    id: 'n_medial_plantar', type: 'nerve', group: 'sacral', segs: ['L4', 'L5', 'S1', 'S2'], parents: ['n_tibial'],
    name: { en: 'Medial plantar nerve', de: 'Nervus plantaris medialis', la: 'Nervus plantaris medialis' },
    info: {
      en: 'Larger terminal branch of the tibial nerve, comparable to the median nerve in the hand. Supplies abductor hallucis, flexor digitorum brevis, flexor hallucis brevis and the first lumbrical, and the skin of the medial sole and medial 3½ toes.',
      de: 'Größerer Endast des N. tibialis, vergleichbar dem N. medianus der Hand. Versorgt M. abductor hallucis, M. flexor digitorum brevis, M. flexor hallucis brevis und den ersten M. lumbricalis sowie die Haut der medialen Fußsohle und der medialen 3½ Zehen.'
    },
    lesion: {
      en: 'Tarsal tunnel syndrome or "jogger\'s foot" (compression at the medial arch): burning pain and numbness of the medial sole, weak flexion and abduction of the great toe.',
      de: 'Tarsaltunnelsyndrom oder „Jogger\'s foot“ (Kompression am medialen Fußgewölbe): brennende Schmerzen und Taubheit der medialen Fußsohle, schwache Beugung und Abduktion der Großzehe.'
    },
    path: [[7, -136.6, -0.2], [7.2, -138.6, 3], [7.4, -139.2, 8], [7.2, -139.4, 11]], r: 0.2
  },
  {
    id: 'n_lateral_plantar', type: 'nerve', group: 'sacral', segs: ['S1', 'S2', 'S3'], parents: ['n_tibial'],
    name: { en: 'Lateral plantar nerve', de: 'Nervus plantaris lateralis', la: 'Nervus plantaris lateralis' },
    info: {
      en: 'Smaller terminal branch of the tibial nerve, comparable to the ulnar nerve in the hand. Supplies most small muscles of the sole: quadratus plantae, abductor digiti minimi, adductor hallucis, the interossei and lumbricals 2–4, and the skin of the lateral sole and lateral 1½ toes.',
      de: 'Kleinerer Endast des N. tibialis, vergleichbar dem N. ulnaris der Hand. Versorgt die meisten kleinen Fußsohlenmuskeln: M. quadratus plantae, M. abductor digiti minimi, M. adductor hallucis, die Mm. interossei und Mm. lumbricales II–IV, sowie die Haut der lateralen Fußsohle und der lateralen 1½ Zehen.'
    },
    lesion: {
      en: 'Weak toe spreading and clawing of the lateral toes; numbness of the lateral sole.',
      de: 'Schwaches Zehenspreizen und Krallenstellung der lateralen Zehen; Taubheit der lateralen Fußsohle.'
    },
    path: [[7, -136.6, -0.2], [8.6, -139, 3.4], [10.6, -139.2, 7], [10.2, -139.4, 10.4]], r: 0.2
  },
  {
    id: 'n_common_fibular', type: 'nerve', group: 'sacral', segs: ['L4', 'L5', 'S1', 'S2'], parents: ['n_sciatic'],
    name: { en: 'Common fibular (peroneal) nerve', de: 'Nervus fibularis (peroneus) communis', la: 'Nervus fibularis communis' },
    info: {
      en: 'Runs along the lateral side of the popliteal fossa behind biceps femoris, then winds around the neck of the fibula just under the skin, where it divides into the deep and superficial fibular nerves.',
      de: 'Zieht am lateralen Rand der Kniekehle hinter dem M. biceps femoris, dann direkt unter der Haut um das Collum fibulae, wo er sich in den N. fibularis profundus und superficialis teilt.'
    },
    lesion: {
      en: 'The most commonly injured nerve of the leg: fibular neck fracture, tight plaster cast, crossed legs, long squatting or rapid weight loss. Foot drop: cannot lift the foot or toes or evert; steppage gait (knee lifted high, foot slaps down); numbness of the lateral leg and dorsum of the foot. Inversion and the Achilles reflex are preserved, unlike an L5 root lesion or sciatic lesion.',
      de: 'Am häufigsten verletzter Nerv des Beins: Fibulaköpfchenfraktur, enger Gips, übereinandergeschlagene Beine, langes Hocken oder starker Gewichtsverlust. Fallfuß: Fuß und Zehen können nicht gehoben, der Fuß nicht proniert werden; Steppergang (Knie wird hoch gehoben, Fuß klatscht auf); Taubheit am lateralen Unterschenkel und Fußrücken. Supination und Achillessehnenreflex bleiben erhalten, anders als bei L5-Wurzel- oder Ischiadicusläsion.'
    },
    path: [[10, -86, -4.4], [11.4, -92, -3.8], [12.4, -96.6, -2.8], [13, -99.4, -1.4], [12.6, -100.8, 0.4]], r: 0.36
  },
  {
    id: 'n_deep_fibular', type: 'nerve', group: 'sacral', segs: ['L4', 'L5', 'S1'], parents: ['n_common_fibular'],
    name: { en: 'Deep fibular (peroneal) nerve', de: 'Nervus fibularis (peroneus) profundus', la: 'Nervus fibularis profundus' },
    info: {
      en: 'Runs with the anterior tibial artery down the anterior compartment. Supplies the extensors (tibialis anterior, extensor hallucis longus, extensor digitorum longus) and extensor digitorum brevis, and the skin of the first web space only.',
      de: 'Zieht mit der A. tibialis anterior durch die Extensorenloge. Versorgt die Extensoren (M. tibialis anterior, M. extensor hallucis longus, M. extensor digitorum longus) und den M. extensor digitorum brevis sowie nur die Haut zwischen erster und zweiter Zehe.'
    },
    lesion: {
      en: 'E.g. anterior compartment syndrome: foot drop with loss of foot and toe extension, but eversion is preserved. Numbness only in the first web space.',
      de: 'Z. B. Tibialis-anterior-Logensyndrom: Fallfuß mit Ausfall der Fuß- und Zehenhebung, Pronation bleibt erhalten. Taubheit nur zwischen erster und zweiter Zehe.'
    },
    path: [[12.6, -100.8, 0.4], [11.2, -103, 1.4], [10.8, -112, 1.4], [9.8, -126, 1.8], [9, -133, 2.8], [8.4, -136, 4.8], [7.6, -137.4, 9]], r: 0.24
  },
  {
    id: 'n_superficial_fibular', type: 'nerve', group: 'sacral', segs: ['L5', 'S1'], parents: ['n_common_fibular'],
    name: { en: 'Superficial fibular (peroneal) nerve', de: 'Nervus fibularis (peroneus) superficialis', la: 'Nervus fibularis superficialis' },
    info: {
      en: 'Runs in the lateral compartment and supplies fibularis longus and brevis; pierces the fascia in the lower third of the leg and supplies most of the skin of the dorsum of the foot.',
      de: 'Verläuft in der Fibularisloge und versorgt M. fibularis longus und brevis; durchbricht im unteren Drittel des Unterschenkels die Faszie und versorgt den Großteil der Haut des Fußrückens.'
    },
    lesion: {
      en: 'Weak eversion, which makes ankle sprains more likely, and numbness of the dorsum of the foot except the first web space. The foot can still be lifted.',
      de: 'Schwache Pronation mit erhöhter Neigung zum Umknicken und Taubheit des Fußrückens außer zwischen erster und zweiter Zehe. Der Fuß kann weiter gehoben werden.'
    },
    path: [[12.6, -100.8, 0.4], [13.2, -106, 0], [12.8, -118, 0.2], [11.8, -128, 1.2], [10.8, -134, 3], [9.8, -136.4, 7]], r: 0.22
  }
];

// ---------------------------------------------------------------- arteries
const arteries = [
  {
    id: 'a_common_iliac', type: 'artery', parents: ['a_abdominal_aorta'],
    name: { en: 'Common iliac artery', de: 'Gemeinsame Beckenarterie', la: 'Arteria iliaca communis' },
    info: {
      en: 'Arises at the aortic bifurcation (level of L4, about at the navel) and divides in front of the sacroiliac joint into the external and internal iliac arteries.',
      de: 'Entspringt an der Aortenbifurkation (Höhe L4, etwa am Nabel) und teilt sich vor dem Iliosakralgelenk in A. iliaca externa und interna.'
    },
    paths: [[[0.8, -41, -2.4], [3, -45.6, -2.8], [4.6, -48.6, -3]], [[0.8, -41, -2.4], [-1.4, -45.6, -2.8], [-3.6, -48.6, -3]]], r: 0.6
  },
  {
    id: 'a_internal_iliac', type: 'artery', parents: ['a_common_iliac'],
    name: { en: 'Internal iliac artery', de: 'Innere Beckenarterie', la: 'Arteria iliaca interna' },
    info: {
      en: 'Supplies the pelvic organs, perineum and gluteal region. Its branches to the lower limb are the superior and inferior gluteal and obturator arteries.',
      de: 'Versorgt Beckenorgane, Damm und Gesäßregion. Ihre Äste zum Bein sind die Aa. gluteae superior und inferior und die A. obturatoria.'
    },
    paths: [[[4.6, -48.6, -3], [5, -51, -5.6], [5.4, -52.6, -6.4]], [[-3.6, -48.6, -3], [-4.6, -50.6, -5.4], [-5.2, -51.8, -6.1], [-5.4, -52.6, -6.4]]], r: 0.45
  },
  {
    id: 'a_iliolumbar', type: 'artery', parents: ['a_internal_iliac'],
    name: { en: 'Iliolumbar artery', de: 'Lenden-Darmbein-Arterie', la: 'Arteria iliolumbalis' },
    info: {
      en: 'Small branch of the internal iliac artery to psoas, iliacus and quadratus lumborum.',
      de: 'Kleiner Ast der A. iliaca interna zu M. psoas, M. iliacus und M. quadratus lumborum.'
    },
    path: [[4.8, -49.6, -3.8], [4.8, -46, -5.4], [7, -44, -4.8], [9.6, -43, -2.8]], r: 0.2
  },
  {
    id: 'a_sup_gluteal', type: 'artery', parents: ['a_internal_iliac'],
    name: { en: 'Superior gluteal artery', de: 'Obere Gesäßarterie', la: 'Arteria glutea superior' },
    info: {
      en: 'Largest branch of the internal iliac artery. Leaves the pelvis above piriformis (suprapiriform foramen) with the superior gluteal nerve and supplies the gluteal muscles.',
      de: 'Größter Ast der A. iliaca interna. Verlässt das Becken oberhalb des M. piriformis (Foramen suprapiriforme) mit dem N. gluteus superior und versorgt die Gesäßmuskeln.'
    },
    path: [[5.2, -51.6, -6], [7, -50.8, -9.2], [9, -49.4, -10.6], [12, -47.2, -8]], r: 0.32
  },
  {
    id: 'a_inf_gluteal', type: 'artery', parents: ['a_internal_iliac'],
    name: { en: 'Inferior gluteal artery', de: 'Untere Gesäßarterie', la: 'Arteria glutea inferior' },
    info: {
      en: 'Leaves the pelvis below piriformis (infrapiriform foramen) with the inferior gluteal and sciatic nerves; supplies gluteus maximus and the upper hamstrings and sends a small artery along the sciatic nerve.',
      de: 'Verlässt das Becken unterhalb des M. piriformis (Foramen infrapiriforme) mit N. gluteus inferior und N. ischiadicus; versorgt den M. gluteus maximus und die oberen ischiokruralen Muskeln und gibt eine kleine Arterie zum N. ischiadicus ab.'
    },
    path: [[5.4, -52.6, -6.4], [7, -56.2, -9.2], [9, -58.6, -10.8], [11, -60.6, -10.2]], r: 0.3
  },
  {
    id: 'a_obturator', type: 'artery', parents: ['a_internal_iliac'],
    name: { en: 'Obturator artery', de: 'Hüftlocharterie', la: 'Arteria obturatoria' },
    info: {
      en: 'Runs with the obturator nerve through the obturator canal to the adductors. Sends a small branch to the femoral head in the ligament of the head of the femur (important in children). An abnormal origin from the external iliac artery ("corona mortis") can bleed in hernia surgery.',
      de: 'Zieht mit dem N. obturatorius durch den Canalis obturatorius zu den Adduktoren. Gibt im Lig. capitis femoris einen kleinen Ast zum Femurkopf ab (wichtig bei Kindern). Ein abnormer Ursprung aus der A. iliaca externa („Corona mortis“) kann bei Hernienoperationen bluten.'
    },
    path: [[5, -51, -5], [6.2, -53.4, -1.2], [6.6, -56, 2.2], [7, -59.4, 3.4], [8, -63, 2.8]], r: 0.24
  },
  {
    id: 'a_external_iliac', type: 'artery', parents: ['a_common_iliac'],
    name: { en: 'External iliac artery', de: 'Äußere Beckenarterie', la: 'Arteria iliaca externa' },
    info: {
      en: 'Runs along the pelvic brim on psoas and becomes the femoral artery as it passes under the inguinal ligament.',
      de: 'Verläuft am Beckenrand auf dem M. psoas und wird unter dem Leistenband zur A. femoralis.'
    },
    path: [[4.6, -48.6, -3], [6, -50.6, 0.4], [7.4, -52.6, 5]], r: 0.5
  },
  {
    id: 'a_femoral', type: 'artery', parents: ['a_external_iliac'],
    name: { en: 'Femoral artery', de: 'Oberschenkelarterie', la: 'Arteria femoralis' },
    info: {
      en: 'Enters the thigh under the midpoint of the inguinal ligament, where the femoral pulse is felt and catheters are inserted (from lateral to medial: nerve, artery, vein). Runs through the femoral triangle and adductor canal, then through the adductor hiatus, where it becomes the popliteal artery.',
      de: 'Tritt in der Mitte unter dem Leistenband in den Oberschenkel, wo der Femoralispuls tastbar ist und Katheter gelegt werden (von medial nach lateral „IVAN“: innen Vene, Arterie, Nerv). Zieht durch das Trigonum femorale und den Adduktorenkanal und durch den Hiatus adductorius, wo sie zur A. poplitea wird.'
    },
    path: [[7.4, -52.6, 5], [8, -58, 4.8], [8.4, -66, 3.8], [8, -76, 2], [7.4, -84, -0.6], [8.2, -87, -3]], r: 0.48
  },
  {
    id: 'a_deep_femoral', type: 'artery', parents: ['a_femoral'],
    name: { en: 'Deep femoral artery (profunda femoris)', de: 'Tiefe Oberschenkelarterie', la: 'Arteria profunda femoris' },
    info: {
      en: 'Main blood supply of the thigh. Arises 3–5 cm below the inguinal ligament and gives off the circumflex femoral arteries and three to four perforating arteries, which wind backwards through the adductors to the hamstrings.',
      de: 'Hauptversorgung des Oberschenkels. Entspringt 3–5 cm unterhalb des Leistenbands und gibt die Aa. circumflexae femoris und drei bis vier Aa. perforantes ab, die durch die Adduktoren nach hinten zu den ischiokruralen Muskeln ziehen.'
    },
    path: [[8.2, -57, 4.6], [9.8, -60, 2.6], [10.6, -66, 0.8], [10.8, -76, -0.6], [10.6, -84, -1.8]], r: 0.38
  },
  {
    id: 'a_med_circ_femoral', type: 'artery', parents: ['a_deep_femoral'],
    name: { en: 'Medial circumflex femoral artery', de: 'Innere umfassende Oberschenkelarterie', la: 'Arteria circumflexa femoris medialis' },
    info: {
      en: 'Winds backwards around the femoral neck. Main blood supply of the femoral head in adults, so displaced femoral neck fractures risk avascular necrosis.',
      de: 'Zieht nach hinten um den Schenkelhals. Hauptversorgung des Femurkopfs beim Erwachsenen; bei dislozierten Schenkelhalsfrakturen droht deshalb eine Hüftkopfnekrose.'
    },
    path: [[8.9, -58.4, 3.8], [9.2, -58.4, 1], [10.8, -57.6, -1.8], [12.6, -56.4, -2.4]], r: 0.24
  },
  {
    id: 'a_lat_circ_femoral', type: 'artery', parents: ['a_deep_femoral'],
    name: { en: 'Lateral circumflex femoral artery', de: 'Äußere umfassende Oberschenkelarterie', la: 'Arteria circumflexa femoris lateralis' },
    info: {
      en: 'Runs laterally under sartorius and rectus femoris; its descending branch supplies the quadriceps and is the pedicle of the anterolateral thigh (ALT) flap.',
      de: 'Zieht unter M. sartorius und M. rectus femoris nach lateral; ihr R. descendens versorgt den M. quadriceps und ist der Gefäßstiel des ALT-Lappens (anterolateraler Oberschenkellappen).'
    },
    path: [[9.8, -60, 2.6], [11.8, -60, 3.6], [13.6, -61, 2.8], [14.2, -70, 2.4]], r: 0.24
  },
  {
    id: 'a_popliteal', type: 'artery', parents: ['a_femoral'],
    name: { en: 'Popliteal artery', de: 'Kniekehlenarterie', la: 'Arteria poplitea' },
    info: {
      en: 'Deepest structure of the popliteal fossa, lying directly on the femur and knee capsule, so it is at risk in knee dislocations and supracondylar fractures. Gives off the genicular arteries and divides at the lower border of popliteus into the anterior and posterior tibial arteries.',
      de: 'Tiefste Struktur der Kniekehle, direkt auf Femur und Kniegelenkkapsel; deshalb bei Knieluxation und suprakondylärer Fraktur gefährdet. Gibt die Aa. genus ab und teilt sich am Unterrand des M. popliteus in A. tibialis anterior und posterior.'
    },
    path: [[8.2, -87, -3], [8.8, -92, -4], [9.2, -97, -3.8], [9.4, -100.6, -2.6]], r: 0.42
  },
  {
    id: 'a_anterior_tibial', type: 'artery', parents: ['a_popliteal'],
    name: { en: 'Anterior tibial artery', de: 'Vordere Schienbeinarterie', la: 'Arteria tibialis anterior' },
    info: {
      en: 'Passes forwards above the interosseous membrane and runs down the anterior compartment with the deep fibular nerve; becomes the dorsalis pedis artery at the ankle.',
      de: 'Zieht oberhalb der Membrana interossea nach vorn und mit dem N. fibularis profundus durch die Extensorenloge; wird am Sprunggelenk zur A. dorsalis pedis.'
    },
    path: [[9.4, -100.6, -2.6], [10.6, -101.4, -0.8], [10.4, -104, 0.8], [10, -115, 1], [9.4, -128, 1.6], [8.8, -133, 2.6]], r: 0.3
  },
  {
    id: 'a_dorsalis_pedis', type: 'artery', parents: ['a_anterior_tibial'],
    name: { en: 'Dorsalis pedis artery', de: 'Fußrückenarterie', la: 'Arteria dorsalis pedis' },
    info: {
      en: 'Its pulse is felt on the dorsum of the foot lateral to the extensor hallucis longus tendon and is checked in peripheral arterial disease.',
      de: 'Ihr Puls ist auf dem Fußrücken lateral der Sehne des M. extensor hallucis longus tastbar und wird bei pAVK geprüft.'
    },
    path: [[8.8, -133, 2.6], [8.4, -135.4, 4.6], [8, -137, 7.6]], r: 0.22
  },
  {
    id: 'a_posterior_tibial', type: 'artery', parents: ['a_popliteal'],
    name: { en: 'Posterior tibial artery', de: 'Hintere Schienbeinarterie', la: 'Arteria tibialis posterior' },
    info: {
      en: 'Runs deep to soleus with the tibial nerve; its pulse is felt behind the medial malleolus. Divides in the tarsal tunnel into the plantar arteries.',
      de: 'Verläuft mit dem N. tibialis unter dem M. soleus; ihr Puls ist hinter dem Innenknöchel tastbar. Teilt sich im Tarsaltunnel in die Plantararterien.'
    },
    path: [[9.4, -100.6, -2.6], [8.8, -106, -2.8], [8, -118, -2.4], [7.2, -130, -1.4], [6.4, -134, -0.6], [7.2, -137.4, 0.6]], r: 0.32
  },
  {
    id: 'a_fibular', type: 'artery', parents: ['a_posterior_tibial'],
    name: { en: 'Fibular (peroneal) artery', de: 'Wadenbeinarterie', la: 'Arteria fibularis' },
    info: {
      en: 'Largest branch of the posterior tibial artery; runs close to the fibula and supplies the lateral and posterior compartments. Because it also supplies the bone, the fibula can be used as a free vascularised flap.',
      de: 'Größter Ast der A. tibialis posterior; verläuft nahe der Fibula und versorgt Fibularis- und Flexorenloge. Da sie auch den Knochen versorgt, kann die Fibula als freier gefäßgestielter Lappen verwendet werden.'
    },
    path: [[8.9, -104, -2.8], [10.2, -108, -2.8], [10.8, -120, -2.4], [10.6, -131, -2]], r: 0.24
  },
  {
    id: 'a_plantar', type: 'artery', parents: ['a_posterior_tibial'],
    name: { en: 'Medial and lateral plantar arteries', de: 'Fußsohlenarterien', la: 'Arteriae plantares medialis et lateralis' },
    info: {
      en: 'Terminal branches of the posterior tibial artery. The lateral plantar artery forms the deep plantar arch with the dorsalis pedis artery.',
      de: 'Endäste der A. tibialis posterior. Die A. plantaris lateralis bildet mit der A. dorsalis pedis den Arcus plantaris profundus.'
    },
    path: [[7.2, -137.4, 0.6], [8.6, -139, 3.6], [10.4, -139.2, 7], [8.4, -139.2, 10]], r: 0.18
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

const TIBIAL_PART = { en: 'tibial part', de: 'Tibialisanteil' };

const muscles = [
  // ----- hip and gluteal region
  M('iliopsoas', 'hip',
    { en: 'Iliopsoas (psoas major and iliacus)', de: 'Lenden-Darmbein-Muskel', la: 'Musculus iliopsoas (M. psoas major, M. iliacus)' },
    { en: 'Psoas major: bodies and transverse processes of T12–L4. Iliacus: iliac fossa', de: 'M. psoas major: Wirbelkörper und Querfortsätze T12–L4. M. iliacus: Fossa iliaca' },
    { en: 'Lesser trochanter of femur', de: 'Trochanter minor des Femur' },
    { en: 'Strongest hip flexor (lifting the leg, sitting up from lying). Psoas also bends the lumbar spine sideways. A psoas abscess or haematoma can irritate the femoral nerve, which runs in the groove between psoas and iliacus.', de: 'Stärkster Hüftbeuger (Bein anheben, Aufrichten aus dem Liegen). Der M. psoas neigt zusätzlich die Lendenwirbelsäule zur Seite. Ein Psoasabszess oder -hämatom kann den N. femoralis reizen, der in der Rinne zwischen M. psoas und M. iliacus verläuft.' },
    [['n_lumbar_direct', ['L1', 'L2', 'L3'], { en: 'psoas major', de: 'M. psoas major' }], ['n_femoral', ['L2', 'L3'], { en: 'iliacus', de: 'M. iliacus' }]], ['a_iliolumbar'], ['hip_bone'], ['femur'],
    { fibers: [[[2.4, -29, -6], [3.6, -40, -4.8], [6, -49, 0.8], [9.6, -55, 3], [11.6, -59.4, -0.6]], [[10.4, -41, -1.8], [10, -47, 1.2], [9.4, -52, 4.4], [10.8, -57, 2.2], [11.6, -59.4, -0.6]]], r: 1.3 }),
  M('gluteus_maximus', 'hip',
    { en: 'Gluteus maximus', de: 'Großer Gesäßmuskel', la: 'Musculus gluteus maximus' },
    { en: 'Posterior ilium behind the posterior gluteal line, dorsal sacrum and coccyx, sacrotuberous ligament, thoracolumbar fascia', de: 'Os ilium hinter der Linea glutea posterior, Rückfläche von Kreuz- und Steißbein, Lig. sacrotuberale, Fascia thoracolumbalis' },
    { en: 'Gluteal tuberosity of femur and iliotibial tract', de: 'Tuberositas glutea des Femur und Tractus iliotibialis' },
    { en: 'Most powerful hip extensor: climbing stairs, standing up from sitting, running. Also rotates the thigh outwards and, through the iliotibial tract, stabilises the extended knee. Hardly needed for walking on the flat.', de: 'Kräftigster Strecker im Hüftgelenk: Treppensteigen, Aufstehen aus dem Sitzen, Laufen. Rotiert den Oberschenkel außerdem nach außen und stabilisiert über den Tractus iliotibialis das gestreckte Knie. Beim Gehen in der Ebene kaum nötig.' },
    [['n_inf_gluteal', ['L5', 'S1', 'S2']]], ['a_inf_gluteal', 'a_sup_gluteal'], ['hip_bone', 'sacrum'], ['femur'],
    { fibers: [[[5, -42, -11], [9, -50, -12.6], [14, -58, -6], [15, -64, -1.6]], [[2, -50, -11], [7, -56, -12.6], [12.6, -61, -6], [14, -65, -2]], [[1.8, -56, -10.4], [6, -61, -11.2], [11, -64.6, -6], [13.4, -66, -2]]], r: 1.6 }),
  M('gluteus_medius', 'hip',
    { en: 'Gluteus medius', de: 'Mittlerer Gesäßmuskel', la: 'Musculus gluteus medius' },
    { en: 'Outer surface of ilium between the anterior and posterior gluteal lines', de: 'Außenfläche des Os ilium zwischen Linea glutea anterior und posterior' },
    { en: 'Lateral surface of the greater trochanter', de: 'Lateralfläche des Trochanter major' },
    { en: 'Main abductor of the hip. Above all it keeps the pelvis level when standing on one leg, so it works with every step. Anterior fibres rotate the thigh inwards, posterior fibres outwards.', de: 'Hauptabduktor im Hüftgelenk. Vor allem hält er beim Einbeinstand das Becken waagerecht und arbeitet deshalb bei jedem Schritt. Vordere Anteile innenrotieren, hintere außenrotieren.' },
    [['n_sup_gluteal', ['L4', 'L5', 'S1']]], ['a_sup_gluteal'], ['hip_bone'], ['femur'],
    { fibers: [[[12.8, -39.6, -2], [14.4, -47, -2.4], [14.8, -54, -1]], [[8, -41, -8.4], [12, -48, -6.6], [14.4, -54, -2]], [[13, -41, 3], [14.4, -47, 1.6], [14.8, -54, 0]]], r: 1.2 }),
  M('gluteus_minimus', 'hip',
    { en: 'Gluteus minimus', de: 'Kleiner Gesäßmuskel', la: 'Musculus gluteus minimus' },
    { en: 'Outer surface of ilium between the anterior and inferior gluteal lines', de: 'Außenfläche des Os ilium zwischen Linea glutea anterior und inferior' },
    { en: 'Anterior surface of the greater trochanter', de: 'Vorderfläche des Trochanter major' },
    { en: 'Abducts the thigh and rotates it inwards; helps gluteus medius keep the pelvis level.', de: 'Abduziert und innenrotiert den Oberschenkel; hilft dem M. gluteus medius, das Becken waagerecht zu halten.' },
    [['n_sup_gluteal', ['L4', 'L5', 'S1']]], ['a_sup_gluteal'], ['hip_bone'], ['femur'],
    { fibers: [[[12, -42, -1], [13.2, -48, 0.4], [14, -54.4, 0.6]]], r: 0.9 }),
  M('tensor_fasciae_latae', 'hip',
    { en: 'Tensor fasciae latae', de: 'Schenkelbindenspanner', la: 'Musculus tensor fasciae latae' },
    { en: 'Anterior superior iliac spine (ASIS)', de: 'Spina iliaca anterior superior' },
    { en: 'Iliotibial tract, which inserts on the lateral tibial condyle (Gerdy\'s tubercle)', de: 'Tractus iliotibialis, der am Condylus lateralis tibiae (Tuberculum Gerdy) ansetzt' },
    { en: 'Tightens the iliotibial tract; flexes, abducts and internally rotates the hip; stabilises the extended knee.', de: 'Spannt den Tractus iliotibialis; Beugung, Abduktion und Innenrotation im Hüftgelenk; stabilisiert das gestreckte Knie.' },
    [['n_sup_gluteal', ['L4', 'L5']]], ['a_sup_gluteal', 'a_lat_circ_femoral'], ['hip_bone'], ['tibia'],
    { fibers: [[[12, -44, 5.6], [13.6, -50, 3.8], [15, -58, 1.8]]], r: 0.85 }),
  M('piriformis', 'hip',
    { en: 'Piriformis', de: 'Birnenförmiger Muskel', la: 'Musculus piriformis' },
    { en: 'Anterior (pelvic) surface of the sacrum', de: 'Facies pelvica des Kreuzbeins' },
    { en: 'Tip of the greater trochanter', de: 'Spitze des Trochanter major' },
    { en: 'Rotates the extended thigh outwards and abducts the flexed thigh. Key landmark: it divides the greater sciatic foramen into the suprapiriform foramen (superior gluteal vessels and nerve) and the infrapiriform foramen (sciatic nerve, inferior gluteal vessels and nerve, and others). In piriformis syndrome it can compress the sciatic nerve.', de: 'Außenrotation des gestreckten und Abduktion des gebeugten Oberschenkels. Wichtige Leitstruktur: teilt das Foramen ischiadicum majus in das Foramen suprapiriforme (obere Gesäßgefäße und -nerv) und das Foramen infrapiriforme (N. ischiadicus, untere Gesäßgefäße und -nerv u. a.). Beim Piriformis-Syndrom kann er den N. ischiadicus einengen.' },
    [['n_piriformis', ['S1', 'S2']]], ['a_sup_gluteal', 'a_inf_gluteal'], ['sacrum'], ['femur'],
    { fibers: [[[2, -49, -8.4], [6, -52, -9.4], [10, -53.6, -6], [14, -55, -2]]], r: 0.9 }),
  M('obturator_internus', 'hip',
    { en: 'Obturator internus and superior gemellus', de: 'Innerer Hüftlochmuskel und oberer Zwillingsmuskel', la: 'Musculus obturatorius internus et musculus gemellus superior' },
    { en: 'Inner surface of the obturator membrane and surrounding bone (gemellus: ischial spine)', de: 'Innenfläche der Membrana obturatoria und des umgebenden Knochens (Gemellus: Spina ischiadica)' },
    { en: 'Medial surface of the greater trochanter (trochanteric fossa)', de: 'Medialfläche des Trochanter major (Fossa trochanterica)' },
    { en: 'Rotate the thigh outwards and hold the femoral head in the acetabulum. The tendon turns 90° around the lesser sciatic notch.', de: 'Außenrotation des Oberschenkels; halten den Femurkopf in der Hüftpfanne. Die Sehne biegt um die Incisura ischiadica minor um 90° um.' },
    [['n_obturator_internus', ['L5', 'S1']]], ['a_inf_gluteal', 'a_obturator'], ['hip_bone'], ['femur'],
    { fibers: [[[5, -58, 0], [5.6, -59, -5.6], [9, -58, -7.4], [13.6, -56.4, -2.6]]], r: 0.7 }),
  M('quadratus_femoris', 'hip',
    { en: 'Quadratus femoris and inferior gemellus', de: 'Viereckiger Schenkelmuskel und unterer Zwillingsmuskel', la: 'Musculus quadratus femoris et musculus gemellus inferior' },
    { en: 'Lateral border of the ischial tuberosity', de: 'Lateralrand des Tuber ischiadicum' },
    { en: 'Intertrochanteric crest (quadrate tubercle)', de: 'Crista intertrochanterica (Tuberculum quadratum)' },
    { en: 'Rotates the thigh outwards and adducts it.', de: 'Außenrotation und Adduktion des Oberschenkels.' },
    [['n_quadratus_femoris', ['L5', 'S1']]], ['a_med_circ_femoral'], ['hip_bone'], ['femur'],
    { fibers: [[[7, -61, -3.6], [10.6, -60, -3.6], [13.2, -59, -2.4]]], r: 0.75 }),

  // ----- thigh: anterior (extensor) compartment
  M('sartorius', 'thigh_anterior',
    { en: 'Sartorius', de: 'Schneidermuskel', la: 'Musculus sartorius' },
    { en: 'Anterior superior iliac spine (ASIS)', de: 'Spina iliaca anterior superior' },
    { en: 'Upper medial surface of tibia (pes anserinus, with gracilis and semitendinosus)', de: 'Obere mediale Fläche der Tibia (Pes anserinus superficialis, mit M. gracilis und M. semitendinosus)' },
    { en: 'Longest muscle of the body. Flexes, abducts and externally rotates the hip and flexes the knee: the cross-legged "tailor\'s" position. Lateral border of the femoral triangle and roof of the adductor canal.', de: 'Längster Muskel des Körpers. Beugt, abduziert und außenrotiert im Hüftgelenk und beugt im Knie: der Schneidersitz. Laterale Begrenzung des Trigonum femorale und Dach des Adduktorenkanals.' },
    [['n_femoral', ['L2', 'L3']]], ['a_femoral'], ['hip_bone'], ['tibia'],
    { fibers: [[[11.6, -44.6, 6.2], [11, -56, 6.4], [8, -70, 5.2], [6, -84, 1.6], [6.4, -96, -0.6], [7.8, -100, 1]]], r: 0.6 }),
  M('rectus_femoris', 'thigh_anterior',
    { en: 'Rectus femoris', de: 'Gerader Schenkelmuskel', la: 'Musculus rectus femoris' },
    { en: 'Anterior inferior iliac spine (AIIS) and the ilium above the acetabulum', de: 'Spina iliaca anterior inferior und Os ilium oberhalb des Acetabulums' },
    { en: 'Patella and, via the patellar ligament, the tibial tuberosity', de: 'Patella und über das Lig. patellae die Tuberositas tibiae' },
    { en: 'The only head of quadriceps that crosses the hip: extends the knee and flexes the hip (kicking a ball).', de: 'Einziger Kopf des M. quadriceps, der über das Hüftgelenk zieht: streckt im Knie und beugt in der Hüfte (Ballschuss).' },
    [['n_femoral', ['L2', 'L3', 'L4']]], ['a_lat_circ_femoral'], ['hip_bone'], ['patella', 'tibia'],
    { fibers: [[[10.6, -48, 5], [11.4, -60, 6.2], [10.8, -76, 5.6], [9.6, -90, 4.4]]], r: 1.3 }),
  M('vastus_lateralis', 'thigh_anterior',
    { en: 'Vastus lateralis', de: 'Äußerer Schenkelmuskel', la: 'Musculus vastus lateralis' },
    { en: 'Greater trochanter and lateral lip of the linea aspera', de: 'Trochanter major und Labium laterale der Linea aspera' },
    { en: 'Patella and, via the patellar ligament, the tibial tuberosity', de: 'Patella und über das Lig. patellae die Tuberositas tibiae' },
    { en: 'Largest part of quadriceps; extends the knee. A common site for intramuscular injections in infants.', de: 'Größter Teil des M. quadriceps; streckt im Kniegelenk. Bei Säuglingen typischer Ort für intramuskuläre Injektionen.' },
    [['n_femoral', ['L3', 'L4']]], ['a_lat_circ_femoral', 'a_deep_femoral'], ['femur'], ['patella', 'tibia'],
    { fibers: [[[14.4, -58, 0.6], [15.4, -70, 1.6], [14, -84, 2], [11.4, -91, 3.2]]], r: 1.4 }),
  M('vastus_medialis', 'thigh_anterior',
    { en: 'Vastus medialis', de: 'Innerer Schenkelmuskel', la: 'Musculus vastus medialis' },
    { en: 'Intertrochanteric line and medial lip of the linea aspera', de: 'Linea intertrochanterica und Labium mediale der Linea aspera' },
    { en: 'Patella and, via the patellar ligament, the tibial tuberosity', de: 'Patella und über das Lig. patellae die Tuberositas tibiae' },
    { en: 'Extends the knee. Its lowest fibres (vastus medialis obliquus) pull the patella medially and stop it dislocating laterally. It is the first part of quadriceps to waste after a knee injury.', de: 'Streckt im Kniegelenk. Seine untersten Fasern (Vastus medialis obliquus) ziehen die Patella nach medial und verhindern ihre Luxation nach lateral. Atrophiert nach Knieverletzungen als erster Teil des M. quadriceps.' },
    [['n_femoral', ['L3', 'L4']]], ['a_femoral'], ['femur'], ['patella', 'tibia'],
    { fibers: [[[11, -62, 1.8], [9, -74, 2.6], [7, -86, 2], [8, -91, 3.2]]], r: 1.3 }),
  M('vastus_intermedius', 'thigh_anterior',
    { en: 'Vastus intermedius', de: 'Mittlerer Schenkelmuskel', la: 'Musculus vastus intermedius' },
    { en: 'Anterior and lateral surfaces of the femoral shaft', de: 'Vorder- und Lateralfläche des Femurschafts' },
    { en: 'Patella and, via the patellar ligament, the tibial tuberosity', de: 'Patella und über das Lig. patellae die Tuberositas tibiae' },
    { en: 'Extends the knee. Lies deep to rectus femoris; a few deep fibres (articularis genus) pull the suprapatellar bursa up during extension.', de: 'Streckt im Kniegelenk. Liegt unter dem M. rectus femoris; einige tiefe Fasern (M. articularis genus) ziehen bei der Streckung den Recessus suprapatellaris nach oben.' },
    [['n_femoral', ['L3', 'L4']]], ['a_lat_circ_femoral'], ['femur'], ['patella', 'tibia'],
    { fibers: [[[12.8, -62, 2.4], [12.4, -74, 3.2], [10.4, -87, 3]]], r: 1 }),

  // ----- thigh: medial (adductor) compartment
  M('pectineus', 'thigh_medial',
    { en: 'Pectineus', de: 'Kammmuskel', la: 'Musculus pectineus' },
    { en: 'Pecten of the pubis (superior pubic ramus)', de: 'Pecten ossis pubis (Ramus superior ossis pubis)' },
    { en: 'Pectineal line of the femur, below the lesser trochanter', de: 'Linea pectinea des Femur unterhalb des Trochanter minor' },
    { en: 'Adducts and flexes the hip. Part of the floor of the femoral triangle; often supplied by both the femoral and obturator nerves.', de: 'Adduktion und Beugung im Hüftgelenk. Teil des Bodens des Trigonum femorale; oft doppelt vom N. femoralis und N. obturatorius versorgt.' },
    [['n_femoral', ['L2', 'L3']], ['n_obturator', ['L3'], { en: 'inconstant', de: 'inkonstant' }]], ['a_med_circ_femoral', 'a_obturator'], ['hip_bone'], ['femur'],
    { fibers: [[[5, -53.6, 4.6], [8.6, -57, 3.6], [11.2, -60, 1]]], r: 0.9 }),
  M('adductor_longus', 'thigh_medial',
    { en: 'Adductor longus', de: 'Langer Schenkelanzieher', la: 'Musculus adductor longus' },
    { en: 'Body of the pubis below the pubic tubercle', de: 'Corpus ossis pubis unterhalb des Tuberculum pubicum' },
    { en: 'Middle third of the linea aspera', de: 'Mittleres Drittel der Linea aspera' },
    { en: 'Adducts and flexes the hip. Its medial border bounds the femoral triangle. Groin strains in footballers usually affect this muscle.', de: 'Adduktion und Beugung im Hüftgelenk. Sein medialer Rand begrenzt das Trigonum femorale. Leistenzerrungen bei Fußballern betreffen meist diesen Muskel.' },
    [['n_obturator', ['L2', 'L3', 'L4']]], ['a_deep_femoral', 'a_obturator'], ['hip_bone'], ['femur'],
    { fibers: [[[3.4, -56.6, 5.4], [7, -64, 4], [11, -72, 1]]], r: 1 }),
  M('adductor_brevis', 'thigh_medial',
    { en: 'Adductor brevis', de: 'Kurzer Schenkelanzieher', la: 'Musculus adductor brevis' },
    { en: 'Body and inferior ramus of the pubis', de: 'Corpus und Ramus inferior ossis pubis' },
    { en: 'Upper third of the linea aspera', de: 'Oberes Drittel der Linea aspera' },
    { en: 'Adducts the hip. The obturator nerve splits around it into anterior and posterior branches.', de: 'Adduktion im Hüftgelenk. Der N. obturatorius teilt sich um ihn herum in einen R. anterior und R. posterior.' },
    [['n_obturator', ['L2', 'L3']]], ['a_deep_femoral', 'a_obturator'], ['hip_bone'], ['femur'],
    { fibers: [[[3.6, -58.6, 3.6], [8, -62, 1.4], [11.6, -66, 0.4]]], r: 0.9 }),
  M('adductor_magnus', 'thigh_medial',
    { en: 'Adductor magnus', de: 'Großer Schenkelanzieher', la: 'Musculus adductor magnus' },
    { en: 'Adductor part: inferior pubic ramus and ischial ramus. Hamstring part: ischial tuberosity', de: 'Adduktorenanteil: Ramus inferior ossis pubis und Ramus ossis ischii. Ischiokruraler Anteil: Tuber ischiadicum' },
    { en: 'Linea aspera and adductor tubercle of the femur', de: 'Linea aspera und Tuberculum adductorium des Femur' },
    { en: 'Strongest adductor. The adductor part also flexes the hip, the hamstring part extends it. The gap between its two insertions (adductor hiatus) lets the femoral vessels pass into the popliteal fossa.', de: 'Kräftigster Adduktor. Der Adduktorenanteil beugt zusätzlich im Hüftgelenk, der ischiokrurale Anteil streckt. Durch die Lücke zwischen beiden Ansätzen (Hiatus adductorius) ziehen die Femoralgefäße in die Kniekehle.' },
    [['n_obturator', ['L2', 'L3', 'L4'], { en: 'adductor part', de: 'Adduktorenanteil' }], ['n_sciatic', ['L4'], { en: 'hamstring part (tibial part)', de: 'ischiokruraler Anteil (Tibialisanteil)' }]], ['a_deep_femoral', 'a_obturator'], ['hip_bone'], ['femur'],
    { fibers: [[[4, -61, 1], [8, -68, -1.4], [11.4, -78, -0.4]], [[6.4, -62.6, -2.8], [7, -74, -2.6], [6.6, -86, -1.6], [6.6, -91, -1]]], r: 1.3 }),
  M('gracilis', 'thigh_medial',
    { en: 'Gracilis', de: 'Schlanker Muskel', la: 'Musculus gracilis' },
    { en: 'Body and inferior ramus of the pubis', de: 'Corpus und Ramus inferior ossis pubis' },
    { en: 'Upper medial tibia (pes anserinus)', de: 'Obere mediale Tibia (Pes anserinus superficialis)' },
    { en: 'Adducts the hip and flexes and internally rotates the knee: the only adductor that crosses the knee. It can be spared, so surgeons use it for muscle flaps.', de: 'Adduktion im Hüftgelenk, Beugung und Innenrotation im Knie: einziger Adduktor, der über das Kniegelenk zieht. Entbehrlich und deshalb für Muskellappen genutzt.' },
    [['n_obturator', ['L2', 'L3']]], ['a_deep_femoral', 'a_obturator'], ['hip_bone'], ['tibia'],
    { fibers: [[[2.4, -58, 3.4], [3.6, -70, 1.4], [4.8, -84, -1.4], [5.8, -96, -1.2], [7.6, -100, 0.8]]], r: 0.6 }),
  M('obturator_externus', 'thigh_medial',
    { en: 'Obturator externus', de: 'Äußerer Hüftlochmuskel', la: 'Musculus obturatorius externus' },
    { en: 'Outer surface of the obturator membrane and surrounding bone', de: 'Außenfläche der Membrana obturatoria und des umgebenden Knochens' },
    { en: 'Trochanteric fossa of the femur', de: 'Fossa trochanterica des Femur' },
    { en: 'Rotates the thigh outwards and stabilises the femoral head.', de: 'Außenrotation des Oberschenkels; stabilisiert den Femurkopf.' },
    [['n_obturator', ['L3', 'L4']]], ['a_obturator', 'a_med_circ_femoral'], ['hip_bone'], ['femur'],
    { fibers: [[[5, -59, 2.6], [8.6, -58.4, -1], [12.6, -56, -1.6]]], r: 0.7 }),

  // ----- thigh: posterior compartment (hamstrings)
  M('biceps_femoris', 'thigh_posterior',
    { en: 'Biceps femoris', de: 'Zweiköpfiger Schenkelmuskel', la: 'Musculus biceps femoris' },
    { en: 'Long head: ischial tuberosity. Short head: lateral lip of the linea aspera', de: 'Caput longum: Tuber ischiadicum. Caput breve: Labium laterale der Linea aspera' },
    { en: 'Head of the fibula', de: 'Caput fibulae' },
    { en: 'Flexes the knee and rotates the flexed knee outwards (the only external rotator of the knee); the long head also extends the hip.', de: 'Beugt im Knie und rotiert das gebeugte Knie nach außen (einziger Außenrotator des Knies); das Caput longum streckt zusätzlich im Hüftgelenk.' },
    [['n_sciatic', ['L5', 'S1', 'S2'], { en: 'long head: tibial part; short head: common fibular part', de: 'Caput longum: Tibialisanteil; Caput breve: Fibularisanteil' }]], ['a_deep_femoral', 'a_inf_gluteal'], ['hip_bone', 'femur'], ['fibula'],
    { fibers: [[[7, -62, -4.4], [10, -74, -6.4], [12, -88, -4.6], [12.2, -97, -2.4]], [[13, -74, -2], [12.6, -86, -3], [12.2, -97, -2.4]]], r: 1.1 }),
  M('semitendinosus', 'thigh_posterior',
    { en: 'Semitendinosus', de: 'Halbsehniger Muskel', la: 'Musculus semitendinosus' },
    { en: 'Ischial tuberosity', de: 'Tuber ischiadicum' },
    { en: 'Upper medial tibia (pes anserinus)', de: 'Obere mediale Tibia (Pes anserinus superficialis)' },
    { en: 'Extends the hip, flexes the knee and rotates it inwards. Its long tendon is a common graft for cruciate ligament reconstruction.', de: 'Streckt im Hüftgelenk, beugt und innenrotiert im Knie. Seine lange Sehne wird häufig als Transplantat beim Kreuzbandersatz verwendet.' },
    [['n_sciatic', ['L5', 'S1', 'S2'], TIBIAL_PART]], ['a_deep_femoral', 'a_inf_gluteal'], ['hip_bone'], ['tibia'],
    { fibers: [[[6.6, -62.4, -4.2], [7.4, -74, -5.4], [6.8, -88, -3.8], [6.4, -97, -1.2], [7.8, -100.6, 0.8]]], r: 1 }),
  M('semimembranosus', 'thigh_posterior',
    { en: 'Semimembranosus', de: 'Plattsehniger Muskel', la: 'Musculus semimembranosus' },
    { en: 'Ischial tuberosity', de: 'Tuber ischiadicum' },
    { en: 'Posterior medial condyle of the tibia (deep pes anserinus); oblique popliteal ligament', de: 'Hinterfläche des Condylus medialis tibiae (Pes anserinus profundus); Lig. popliteum obliquum' },
    { en: 'Extends the hip, flexes the knee and rotates it inwards; tightens the posterior knee capsule. A Baker cyst often arises from the bursa under its tendon.', de: 'Streckt im Hüftgelenk, beugt und innenrotiert im Knie; spannt die hintere Kniegelenkkapsel. Eine Baker-Zyste geht oft von der Bursa unter seiner Sehne aus.' },
    [['n_sciatic', ['L5', 'S1', 'S2'], TIBIAL_PART]], ['a_deep_femoral'], ['hip_bone'], ['tibia'],
    { fibers: [[[7.4, -62, -3], [7.4, -76, -3.8], [6.6, -90, -2.8], [6.8, -96.6, -2]]], r: 1.15 }),

  // ----- leg: anterior (extensor) compartment
  M('tibialis_anterior', 'leg_anterior',
    { en: 'Tibialis anterior', de: 'Vorderer Schienbeinmuskel', la: 'Musculus tibialis anterior' },
    { en: 'Lateral surface of the tibia and interosseous membrane', de: 'Lateralfläche der Tibia und Membrana interossea' },
    { en: 'Medial cuneiform and base of metatarsal I', de: 'Os cuneiforme mediale und Basis des Os metatarsi I' },
    { en: 'Main dorsiflexor of the ankle: lifts the foot so the toes clear the ground with every step. Also inverts the foot. Weakness causes foot drop.', de: 'Hauptdorsalextensor im oberen Sprunggelenk: hebt den Fuß, damit die Zehen bei jedem Schritt über den Boden kommen. Supiniert außerdem. Schwäche führt zum Fallfuß.' },
    [['n_deep_fibular', ['L4', 'L5']]], ['a_anterior_tibial'], ['tibia'], ['tarsals', 'metatarsals'],
    { fibers: [[[10.2, -99, 1.8], [10.4, -110, 2.2], [9.6, -124, 2.2], [8, -132, 2.8], [6.8, -137, 4.6]]], r: 1 }),
  M('extensor_hallucis_longus', 'leg_anterior',
    { en: 'Extensor hallucis longus', de: 'Langer Großzehenstrecker', la: 'Musculus extensor hallucis longus' },
    { en: 'Middle of the fibula and interosseous membrane', de: 'Mitte der Fibula und Membrana interossea' },
    { en: 'Base of the distal phalanx of the great toe', de: 'Basis der Endphalanx der Großzehe' },
    { en: 'Extends the great toe and dorsiflexes the ankle. Testing great-toe extension checks the L5 myotome (e.g. disc herniation L4/L5).', de: 'Streckt die Großzehe und hebt den Fuß. Die Prüfung der Großzehenhebung testet das Myotom L5 (z. B. Bandscheibenvorfall L4/L5).' },
    [['n_deep_fibular', ['L5', 'S1']]], ['a_anterior_tibial'], ['fibula'], ['toe_phalanges'],
    { fibers: [[[10.8, -108, 0.6], [10.2, -120, 1.6], [8.6, -132, 3], [7, -137.4, 7], [6.4, -139, 15]]], r: 0.6 }),
  M('extensor_digitorum_longus', 'leg_anterior',
    { en: 'Extensor digitorum longus', de: 'Langer Zehenstrecker', la: 'Musculus extensor digitorum longus' },
    { en: 'Lateral tibial condyle, upper fibula and interosseous membrane', de: 'Condylus lateralis tibiae, obere Fibula und Membrana interossea' },
    { en: 'Dorsal aponeuroses of toes 2–5', de: 'Dorsalaponeurosen der Zehen 2–5' },
    { en: 'Extends toes 2–5 and dorsiflexes the ankle; with fibularis tertius it also everts the foot.', de: 'Streckt die Zehen 2–5 und hebt den Fuß; mit dem M. fibularis tertius proniert er den Fuß.' },
    [['n_deep_fibular', ['L5', 'S1']]], ['a_anterior_tibial'], ['tibia', 'fibula'], ['toe_phalanges'],
    { fibers: [[[11.4, -100, 0.6], [11.4, -114, 1], [10.4, -128, 2], [9.6, -135, 5], [10, -138.6, 12], [10.4, -139.4, 14.5]]], r: 0.7 }),

  // ----- leg: lateral (fibular) compartment
  M('fibularis_longus', 'leg_lateral',
    { en: 'Fibularis (peroneus) longus', de: 'Langer Wadenbeinmuskel', la: 'Musculus fibularis longus' },
    { en: 'Head and upper two-thirds of the lateral fibula', de: 'Caput fibulae und obere zwei Drittel der lateralen Fibula' },
    { en: 'Medial cuneiform and base of metatarsal I (the tendon crosses the sole)', de: 'Os cuneiforme mediale und Basis des Os metatarsi I (die Sehne zieht quer durch die Fußsohle)' },
    { en: 'Everts the foot and plantar-flexes the ankle. With tibialis anterior it forms a "stirrup" under the foot that supports the transverse arch.', de: 'Proniert den Fuß und beugt ihn nach plantar. Bildet mit dem M. tibialis anterior einen „Steigbügel“ unter dem Fuß, der das Quergewölbe stützt.' },
    [['n_superficial_fibular', ['L5', 'S1']]], ['a_fibular', 'a_anterior_tibial'], ['fibula'], ['tarsals', 'metatarsals'],
    { fibers: [[[12.6, -99.4, -0.8], [12.8, -112, -0.8], [12, -126, -1.6], [11.2, -134.6, -2.4], [11.4, -138.4, 2], [7.6, -139, 5]]], r: 0.8 }),
  M('fibularis_brevis', 'leg_lateral',
    { en: 'Fibularis (peroneus) brevis', de: 'Kurzer Wadenbeinmuskel', la: 'Musculus fibularis brevis' },
    { en: 'Lower two-thirds of the lateral fibula', de: 'Untere zwei Drittel der lateralen Fibula' },
    { en: 'Tuberosity at the base of metatarsal V', de: 'Tuberositas ossis metatarsi V' },
    { en: 'Everts the foot and protects against ankle sprains (inversion injuries). A sprain can tear its insertion off metatarsal V.', de: 'Proniert den Fuß und schützt vor Supinationstraumen. Ein Umknicktrauma kann seinen Ansatz am Os metatarsi V abreißen.' },
    [['n_superficial_fibular', ['L5', 'S1']]], ['a_fibular'], ['fibula'], ['metatarsals'],
    { fibers: [[[12.4, -114, -0.6], [11.8, -126, -1.4], [11.2, -134.6, -2], [11.8, -137.6, 3.6]]], r: 0.7 }),

  // ----- leg: posterior (flexor) compartment
  M('gastrocnemius', 'leg_posterior',
    { en: 'Gastrocnemius', de: 'Zwillingswadenmuskel', la: 'Musculus gastrocnemius' },
    { en: 'Above the medial and lateral femoral condyles', de: 'Oberhalb des Condylus medialis und lateralis femoris' },
    { en: 'Calcaneal tuberosity via the Achilles (calcaneal) tendon', de: 'Tuber calcanei über die Achillessehne (Tendo calcaneus)' },
    { en: 'Plantar-flexes the ankle (push-off, standing on tiptoe, jumping) and flexes the knee. With soleus it forms triceps surae; the Achilles reflex tests S1.', de: 'Plantarflexion im oberen Sprunggelenk (Abstoßen, Zehenstand, Springen) und Beugung im Knie. Bildet mit dem M. soleus den M. triceps surae; der Achillessehnenreflex prüft S1.' },
    [['n_tibial', ['S1', 'S2']]], ['a_popliteal'], ['femur'], ['tarsals'],
    { fibers: [[[7, -91.6, -2.8], [7.6, -102, -5.8], [8.4, -114, -4.8], [8.8, -128, -3.6], [8.8, -136.6, -5.2]], [[11.4, -91.6, -2.8], [11, -102, -5.6], [9.6, -114, -4.8], [8.8, -128, -3.6], [8.8, -136.6, -5.2]]], r: 1.4 }),
  M('soleus', 'leg_posterior',
    { en: 'Soleus', de: 'Schollenmuskel', la: 'Musculus soleus' },
    { en: 'Head and upper fibula, soleal line of the tibia, and the tendinous arch between them', de: 'Caput und obere Fibula, Linea musculi solei der Tibia und der Sehnenbogen dazwischen (Arcus tendineus musculi solei)' },
    { en: 'Calcaneal tuberosity via the Achilles tendon', de: 'Tuber calcanei über die Achillessehne' },
    { en: 'Plantar-flexes the ankle and stops the body falling forwards when standing. Its veins form the "muscle pump" that returns blood from the leg; immobility here favours deep vein thrombosis.', de: 'Plantarflexion im oberen Sprunggelenk; verhindert im Stehen das Vornüberkippen. Seine Venen bilden die „Muskelpumpe“, die Blut aus dem Bein zurückführt; Immobilisation begünstigt hier tiefe Beinvenenthrombosen.' },
    [['n_tibial', ['S1', 'S2']]], ['a_posterior_tibial', 'a_fibular'], ['tibia', 'fibula'], ['tarsals'],
    { fibers: [[[11.4, -99.6, -2.6], [10, -110, -4], [9, -124, -3.6], [8.8, -136.4, -5]], [[8, -102, -1.8], [8.2, -112, -3.4], [8.6, -124, -3.4], [8.8, -136.4, -5]]], r: 1.25 }),
  M('popliteus', 'leg_posterior',
    { en: 'Popliteus', de: 'Kniekehlenmuskel', la: 'Musculus popliteus' },
    { en: 'Lateral femoral condyle and lateral meniscus', de: 'Condylus lateralis femoris und Meniscus lateralis' },
    { en: 'Posterior tibia above the soleal line', de: 'Hinterfläche der Tibia oberhalb der Linea musculi solei' },
    { en: '"Unlocks" the fully extended knee by rotating the femur outwards on the tibia (or the tibia inwards), so that flexion can begin.', de: '„Entriegelt“ das voll gestreckte Knie, indem er den Femur auf der Tibia nach außen (bzw. die Tibia nach innen) dreht, damit die Beugung beginnen kann.' },
    [['n_tibial', ['L4', 'L5', 'S1']]], ['a_popliteal'], ['femur'], ['tibia'],
    { fibers: [[[11.6, -95, -1.8], [9.6, -98.4, -2.6], [7.2, -100.4, -1.6]]], r: 0.6 }),
  M('tibialis_posterior', 'leg_posterior',
    { en: 'Tibialis posterior', de: 'Hinterer Schienbeinmuskel', la: 'Musculus tibialis posterior' },
    { en: 'Posterior surfaces of the tibia, fibula and interosseous membrane', de: 'Hinterfläche von Tibia, Fibula und Membrana interossea' },
    { en: 'Navicular tuberosity and plantar surfaces of the cuneiforms and metatarsals II–IV', de: 'Tuberositas ossis navicularis und Plantarflächen der Ossa cuneiformia und Ossa metatarsi II–IV' },
    { en: 'Strongest invertor of the foot; plantar-flexes the ankle and holds up the medial longitudinal arch. Failure of its tendon is a common cause of flat foot in adults.', de: 'Stärkster Supinator des Fußes; Plantarflexion; hält das mediale Längsgewölbe. Ein Versagen seiner Sehne ist eine häufige Ursache des erworbenen Plattfußes beim Erwachsenen.' },
    [['n_tibial', ['L4', 'L5']]], ['a_posterior_tibial', 'a_fibular'], ['tibia', 'fibula'], ['tarsals', 'metatarsals'],
    { fibers: [[[9.8, -104, -1.6], [9.4, -116, -1.8], [8, -128, -1.6], [6.6, -133.4, -1], [7, -137, 2.4]]], r: 0.8 }),
  M('flexor_digitorum_longus', 'leg_posterior',
    { en: 'Flexor digitorum longus', de: 'Langer Zehenbeuger', la: 'Musculus flexor digitorum longus' },
    { en: 'Posterior tibia below the soleal line', de: 'Hinterfläche der Tibia unterhalb der Linea musculi solei' },
    { en: 'Distal phalanges of toes 2–5', de: 'Endphalangen der Zehen 2–5' },
    { en: 'Flexes toes 2–5 (gripping the ground) and plantar-flexes and inverts the foot.', de: 'Beugt die Zehen 2–5 (Festkrallen am Boden), Plantarflexion und Supination.' },
    [['n_tibial', ['S1', 'S2']]], ['a_posterior_tibial'], ['tibia'], ['toe_phalanges'],
    { fibers: [[[8.4, -106, -2], [7.8, -118, -2.4], [6.8, -130, -1.6], [7.2, -136, 0.6], [9.2, -139.4, 6], [10, -139.8, 13]]], r: 0.7 }),
  M('flexor_hallucis_longus', 'leg_posterior',
    { en: 'Flexor hallucis longus', de: 'Langer Großzehenbeuger', la: 'Musculus flexor hallucis longus' },
    { en: 'Lower two-thirds of the posterior fibula', de: 'Untere zwei Drittel der Fibularückfläche' },
    { en: 'Base of the distal phalanx of the great toe', de: 'Basis der Endphalanx der Großzehe' },
    { en: 'Flexes the great toe: the final push-off in walking and running. Supports the medial arch; its tendon runs under the sustentaculum tali.', de: 'Beugt die Großzehe: der letzte Abstoß beim Gehen und Laufen. Stützt das mediale Längsgewölbe; seine Sehne verläuft unter dem Sustentaculum tali.' },
    [['n_tibial', ['S1', 'S2']]], ['a_fibular'], ['fibula'], ['toe_phalanges'],
    { fibers: [[[11, -108, -2.2], [10.2, -120, -2.6], [8.6, -131, -2.4], [7.6, -136.6, -0.4], [6.8, -139.6, 6], [6.4, -139.8, 15]]], r: 0.75 }),

  // ----- foot
  M('extensor_digitorum_brevis', 'foot',
    { en: 'Extensor digitorum brevis and extensor hallucis brevis', de: 'Kurzer Zehenstrecker und kurzer Großzehenstrecker', la: 'Musculus extensor digitorum brevis et musculus extensor hallucis brevis' },
    { en: 'Dorsal surface of the calcaneus', de: 'Dorsalfläche des Calcaneus' },
    { en: 'Extensor tendons of toes 1–4', de: 'Strecksehnen der Zehen 1–4' },
    { en: 'Extends toes 1–4. The only muscle on the dorsum of the foot; its belly can be felt in front of the lateral malleolus, which is useful for testing the deep fibular nerve.', de: 'Streckt die Zehen 1–4. Einziger Muskel des Fußrückens; sein Bauch ist vor dem Außenknöchel tastbar, nützlich zur Prüfung des N. fibularis profundus.' },
    [['n_deep_fibular', ['L5', 'S1']]], ['a_dorsalis_pedis'], ['tarsals'], ['toe_phalanges'],
    { fibers: [[[10.6, -136.2, 3], [9.6, -136.6, 6], [8.6, -137.4, 9]]], r: 0.6 }),
  M('abductor_hallucis', 'foot',
    { en: 'Abductor hallucis', de: 'Großzehenabspreizer', la: 'Musculus abductor hallucis' },
    { en: 'Medial process of the calcaneal tuberosity, flexor retinaculum, plantar aponeurosis', de: 'Processus medialis tuberis calcanei, Retinaculum musculorum flexorum, Plantaraponeurose' },
    { en: 'Medial base of the proximal phalanx of the great toe', de: 'Mediale Basis der Grundphalanx der Großzehe' },
    { en: 'Abducts and flexes the great toe; supports the medial arch.', de: 'Abduziert und beugt die Großzehe; stützt das mediale Längsgewölbe.' },
    [['n_medial_plantar', ['S1', 'S2']]], ['a_plantar'], ['tarsals'], ['toe_phalanges'],
    { fibers: [[[7.6, -138.4, -2.6], [6.6, -139, 3], [6.2, -139.4, 9], [6.4, -139.6, 13]]], r: 0.55 }),
  M('flexor_digitorum_brevis', 'foot',
    { en: 'Flexor digitorum brevis', de: 'Kurzer Zehenbeuger', la: 'Musculus flexor digitorum brevis' },
    { en: 'Calcaneal tuberosity and plantar aponeurosis', de: 'Tuber calcanei und Plantaraponeurose' },
    { en: 'Middle phalanges of toes 2–5', de: 'Mittelphalangen der Zehen 2–5' },
    { en: 'Flexes toes 2–5 at the proximal joints; supports the longitudinal arch.', de: 'Beugt die Zehen 2–5 in den proximalen Gelenken; stützt das Längsgewölbe.' },
    [['n_medial_plantar', ['S1', 'S2']]], ['a_plantar'], ['tarsals'], ['toe_phalanges'],
    { fibers: [[[9, -139.6, -2], [9.2, -140, 4], [9.6, -140, 10], [9.8, -139.8, 14]]], r: 0.6 }),
  M('adductor_hallucis', 'foot',
    { en: 'Adductor hallucis', de: 'Großzehenanzieher', la: 'Musculus adductor hallucis' },
    { en: 'Oblique head: bases of metatarsals II–IV and cuboid. Transverse head: ligaments of the MTP joints of toes 3–5', de: 'Caput obliquum: Basen der Ossa metatarsi II–IV und Os cuboideum. Caput transversum: Bänder der Grundgelenke der Zehen 3–5' },
    { en: 'Lateral base of the proximal phalanx of the great toe', de: 'Laterale Basis der Grundphalanx der Großzehe' },
    { en: 'Adducts the great toe and supports the transverse arch.', de: 'Adduziert die Großzehe und stützt das Quergewölbe.' },
    [['n_lateral_plantar', ['S2', 'S3']]], ['a_plantar'], ['tarsals', 'metatarsals'], ['toe_phalanges'],
    { fibers: [[[10, -139.6, 6], [8.4, -139.8, 10], [6.8, -139.8, 12.6]], [[11.6, -139.8, 11.4], [9.4, -139.9, 12], [7, -139.9, 12.8]]], r: 0.45 }),
  M('interossei_foot', 'foot',
    { en: 'Interossei of the foot (plantar and dorsal)', de: 'Zwischenknochenmuskeln des Fußes', la: 'Musculi interossei plantares et dorsales pedis' },
    { en: 'Sides of the metatarsals', de: 'Seitenflächen der Ossa metatarsi' },
    { en: 'Bases of the proximal phalanges of toes 2–5', de: 'Basen der Grundphalangen der Zehen 2–5' },
    { en: 'Dorsal interossei spread the toes away from the second toe, plantar interossei bring them together; together they flex the MTP joints and keep the toes straight. Their loss causes claw toes.', de: 'Mm. interossei dorsales spreizen die Zehen von der zweiten Zehe weg, plantares führen sie heran; gemeinsam beugen sie die Grundgelenke und halten die Zehen gestreckt. Ihr Ausfall führt zu Krallenzehen.' },
    [['n_lateral_plantar', ['S2', 'S3']]], ['a_plantar'], ['metatarsals'], ['toe_phalanges'],
    { fibers: [[[8.6, -138.6, 7], [8.8, -139, 11]], [[9.8, -138.6, 7], [10.2, -139, 11]], [[10.8, -138.8, 6.6], [11.4, -139.2, 10.6]]], r: 0.38 }),
  M('abductor_digiti_minimi_foot', 'foot',
    { en: 'Abductor digiti minimi (foot)', de: 'Kleinzehenabspreizer', la: 'Musculus abductor digiti minimi pedis' },
    { en: 'Lateral process of the calcaneal tuberosity', de: 'Processus lateralis tuberis calcanei' },
    { en: 'Lateral base of the proximal phalanx of the little toe', de: 'Laterale Basis der Grundphalanx der Kleinzehe' },
    { en: 'Abducts and flexes the little toe; supports the lateral arch.', de: 'Abduziert und beugt die Kleinzehe; stützt das laterale Längsgewölbe.' },
    [['n_lateral_plantar', ['S1', 'S2']]], ['a_plantar'], ['tarsals'], ['toe_phalanges'],
    { fibers: [[[10.2, -139, -2.6], [12, -139.4, 4], [12.6, -139.6, 10], [12.4, -139.6, 12]]], r: 0.5 })
];

export const structures = [...bones, ...nerves, ...arteries, ...muscles];

// Muscle groups, used to group the structure list.
export const muscleGroups = {
  hip: { en: 'Hip and buttock', de: 'Hüfte und Gesäß' },
  thigh_anterior: { en: 'Thigh: extensors', de: 'Oberschenkel: Extensoren' },
  thigh_medial: { en: 'Thigh: adductors', de: 'Oberschenkel: Adduktoren' },
  thigh_posterior: { en: 'Thigh: hamstrings', de: 'Oberschenkel: ischiokrurale Muskeln' },
  leg_anterior: { en: 'Leg: extensors', de: 'Unterschenkel: Extensoren' },
  leg_lateral: { en: 'Leg: fibular group', de: 'Unterschenkel: Fibularisgruppe' },
  leg_posterior: { en: 'Leg: flexors', de: 'Unterschenkel: Flexoren' },
  foot: { en: 'Foot', de: 'Fuß' }
};
