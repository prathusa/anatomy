// Pelvis and perineum: pelvic floor and perineal muscles, the pelvic organs (urinary, rectum and
// anal canal, female and male genital organs), the visceral branches of the internal iliac artery
// and their veins, the pudendal nerve and the pelvic autonomic nerves.
// Coordinates: [lateral, superior, anterior] in schematic cm, same body frame as the lower limb and
// abdomen (x > 0 is the body's right; the viewer mirrors x). Negative x is the body's left.
//
// The right hip bone, sacrum, common and internal iliac arteries, the gluteal and obturator
// arteries and the S2 and S3 ventral rami belong to the lower limb; this module adds the left hip
// bone, S4 and S5, the pudendal nerve and everything visceral. Male and female organs are drawn
// together in one schematic pelvis, so the uterus and vagina overlap the prostate region.
// Organs carry `nerves` ({ n, seg, kind }), `arteries`, `veins` and an optional `partOf`, as in the
// thorax and abdomen.

const r2 = x => Math.round(x * 100) / 100;
const round = p => p.map(r2);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const mirror = p => [-p[0], p[1], p[2]];
const both = path => [path, path.map(mirror)];
const bothFibers = fibers => [...fibers, ...fibers.map(f => f.map(mirror))];
// A horizontal ring of `n` points around `c` (sphincters).
const ring = (c, r, n = 12) => range(0, n).map(i => round([c[0] + r * Math.cos(2 * Math.PI * i / n), c[1], c[2] + r * Math.sin(2 * Math.PI * i / n)]));

const SEGMENTS = [['C', 8], ['T', 12], ['L', 5], ['S', 5]].flatMap(([p, n]) => range(1, n).map(i => p + i));
const segs = (from, to) => SEGMENTS.slice(SEGMENTS.indexOf(from), SEGMENTS.indexOf(to) + 1);
const S24 = segs('S2', 'S4');

// ------------------------------------------------------------ bones
const bones = [
  {
    id: 'hip_bone_left', type: 'bone',
    name: { en: 'Hip bone (left)', de: 'Hüftbein (links)', la: 'Os coxae sinistrum' },
    info: {
      en: 'The left hip bone closes the bony pelvic ring with the right hip bone (shown with the lower limb) and the sacrum. Landmarks of the lesser pelvis: the pelvic inlet (linea terminalis, promontory), the ischial spine (between the greater and lesser sciatic foramina; the sacrospinous ligament runs from it to the sacrum and coccyx, the sacrotuberous ligament from the ischial tuberosity), the pubic symphysis and the pubic arch formed by the ischiopubic rami. The pudendal nerve and internal pudendal vessels leave the pelvis through the greater sciatic foramen, hook around the ischial spine and re-enter the perineum through the lesser sciatic foramen.',
      de: 'Das linke Hüftbein schließt mit dem rechten (bei der unteren Extremität) und dem Kreuzbein den knöchernen Beckenring. Landmarken des kleinen Beckens: Beckeneingang (Linea terminalis, Promontorium), Spina ischiadica (zwischen Foramen ischiadicum majus und minus; von ihr zieht das Lig. sacrospinale zu Kreuz- und Steißbein, das Lig. sacrotuberale vom Tuber ischiadicum), Symphysis pubica und der von den Rr. ossis ischii und ossis pubis gebildete Arcus pubicus. N. pudendus und Vasa pudenda interna verlassen das Becken durch das Foramen ischiadicum majus, umschlingen die Spina ischiadica und ziehen durch das Foramen ischiadicum minus in den Damm.'
    },
    shape: {
      plate: [[4.6, -44.5, -9.6], [8.6, -39.6, -6.6], [12.6, -38.6, -1.6], [12.6, -41.4, 3.6], [11.6, -44.4, 6], [10.6, -48, 5], [9.4, -51.4, 3.6], [8, -53, 0], [7, -51, -5.4], [5.6, -48, -8.6]].map(mirror),
      tubes: [
        [[4.6, -44.5, -9.6], [8.6, -39.6, -6.6], [12.6, -38.6, -1.6], [12.6, -41.4, 3.6], [11.6, -44.4, 6]],
        [[8.6, -52.4, 3], [5, -54.6, 5.2], [1.3, -56, 6]],
        [[1.3, -57.6, 5.4], [3.6, -60.4, 2.6], [6.4, -62.4, -2.4]],
        [[8.2, -54.4, -2], [7.4, -58.6, -3.6], [6.4, -62.4, -2.4]]
      ].map(t => t.map(mirror)),
      r: 0.75
    }
  }
];

// ------------------------------------------------------------ muscles
// nerves: [nerveId, segments carried to this muscle, optional note]
const M = (id, group, name, o, i, action, nerveList, arteryList, oBones, iBones, shape) => ({
  id, type: 'muscle', group, name,
  origin: o, insertion: i, action,
  nerves: nerveList.map(([n, seg, note]) => ({ n, seg, note })),
  arteries: arteryList, originBones: oBones, insertionBones: iBones, shape
});

const ANAL_RING = [0, -61.2, -4.4], URETHRA_EUS = [0, -59.2, 2.7], PERINEAL_BODY = [0, -61.4, -0.8];

const muscles = [
  // ----- pelvic floor (pelvic diaphragm)
  M('puborectalis', 'pelvic_floor',
    { en: 'Puborectalis (levator ani)', de: 'M. puborectalis (Levator ani)', la: 'Musculus puborectalis (pars musculi levatoris ani)' },
    { en: 'Back of the body of the pubis on both sides of the symphysis', de: 'Rückfläche des Corpus ossis pubis beidseits der Symphyse' },
    { en: 'Loops behind the anorectal junction as a U-shaped sling, joining the fibres of the other side', de: 'Umschlingt als U-förmige Schlinge den anorektalen Übergang von hinten und vereinigt sich mit der Gegenseite' },
    { en: 'Pulls the anorectal junction forwards and creates the anorectal angle (about 90°), the most important mechanism of faecal continence; it relaxes during defecation. Its medial borders bound the levator hiatus (urogenital hiatus) through which the urethra and vagina pass. Stretching or tearing in vaginal birth weakens it.', de: 'Zieht den anorektalen Übergang nach vorn und erzeugt den anorektalen Winkel (etwa 90°), den wichtigsten Mechanismus der Stuhlkontinenz; bei der Defäkation erschlafft er. Seine medialen Ränder begrenzen den Levatorspalt (Hiatus urogenitalis), durch den Urethra und Vagina treten. Dehnung oder Riss bei der vaginalen Geburt schwächen ihn.' },
    [['n_levator_ani', ['S3', 'S4']], ['n_inferior_rectal', ['S4'], { en: 'contribution from below', de: 'Anteil von unten' }]],
    ['a_internal_pudendal', 'a_inferior_vesical'], ['hip_bone'], [],
    { fibers: bothFibers([[[1.4, -56.8, 5], [2.2, -57.8, 2.2], [2, -58.8, -1.6], [1.2, -59.3, -4.2], [0, -59.4, -4.9]]]), r: 0.5 }),
  M('pubococcygeus', 'pelvic_floor',
    { en: 'Pubococcygeus (levator ani)', de: 'M. pubococcygeus (Levator ani)', la: 'Musculus pubococcygeus (pars musculi levatoris ani)' },
    { en: 'Back of the body of the pubis and the front of the tendinous arch of levator ani', de: 'Rückfläche des Corpus ossis pubis und vorderer Teil des Arcus tendineus musculi levatoris ani' },
    { en: 'Anococcygeal body (ligament) and coccyx; medial fibres to the perineal body, prostate (levator prostatae) or vaginal wall (pubovaginalis)', de: 'Lig. anococcygeum und Steißbein; mediale Fasern zum Centrum tendineum perinei, zur Prostata (M. levator prostatae) oder zur Vaginalwand (M. pubovaginalis)' },
    { en: 'Main part of the levator ani: supports the pelvic organs and resists rises in abdominal pressure (coughing, lifting), tightening the urogenital hiatus. Damage during childbirth (overstretching, avulsion from the pubis, pudendal stretch) is the main cause of pelvic organ prolapse and stress incontinence later in life; pelvic floor training strengthens it.', de: 'Hauptteil des Levator ani: trägt die Beckenorgane und hält Druckanstiegen im Bauchraum stand (Husten, Heben), wobei er den Levatorspalt verengt. Schäden bei der Geburt (Überdehnung, Abriss vom Schambein, Zerrung des N. pudendus) sind die Hauptursache späterer Senkung (Deszensus, Prolaps) und Belastungsinkontinenz; Beckenbodentraining kräftigt ihn.' },
    [['n_levator_ani', ['S3', 'S4']]],
    ['a_internal_pudendal', 'a_inferior_vesical'], ['hip_bone'], ['sacrum'],
    { fibers: bothFibers([[[2, -56.6, 4.6], [3, -57.6, 1.4], [2.8, -58.8, -2.4], [1.6, -59.6, -5.6], [0.3, -60, -7.6]]]), r: 0.42 }),
  M('iliococcygeus', 'pelvic_floor',
    { en: 'Iliococcygeus (levator ani)', de: 'M. iliococcygeus (Levator ani)', la: 'Musculus iliococcygeus (pars musculi levatoris ani)' },
    { en: 'Tendinous arch of levator ani (a thickening of the obturator fascia) and the ischial spine', de: 'Arcus tendineus musculi levatoris ani (Verdickung der Fascia obturatoria) und Spina ischiadica' },
    { en: 'Anococcygeal body and coccyx', de: 'Lig. anococcygeum und Steißbein' },
    { en: 'Thin posterior part of the levator ani that forms the floor of the pelvis behind the rectum; together with the other parts it forms the funnel-shaped pelvic diaphragm, which holds the pelvic organs up.', de: 'Dünner hinterer Teil des Levator ani, der den Beckenboden hinter dem Rektum bildet; mit den übrigen Anteilen bildet er das trichterförmige Diaphragma pelvis, das die Beckenorgane trägt.' },
    [['n_levator_ani', ['S3', 'S4']], ['n_coccygeal_plexus', ['S4']]],
    ['a_internal_pudendal', 'a_inf_gluteal'], ['hip_bone'], ['sacrum'],
    { fibers: bothFibers([[[5.2, -55.4, 1.6], [4.2, -57.6, -1.8], [2.4, -59, -5.4], [0.4, -59.8, -7.8]], [[5.4, -56.6, -3], [3.8, -58, -5.2], [1.6, -59, -7.6], [0.4, -59.6, -8.2]]]), r: 0.38 }),
  M('coccygeus', 'pelvic_floor',
    { en: 'Coccygeus (ischiococcygeus)', de: 'M. coccygeus (M. ischiococcygeus)', la: 'Musculus coccygeus (ischiococcygeus)' },
    { en: 'Ischial spine', de: 'Spina ischiadica' },
    { en: 'Lateral border of the lower sacrum and coccyx; it lies on (and is partly fused with) the sacrospinous ligament', de: 'Seitenrand des unteren Kreuzbeins und des Steißbeins; liegt dem Lig. sacrospinale auf und ist teils mit ihm verwachsen' },
    { en: 'Completes the pelvic diaphragm behind the levator ani and supports the coccyx, pulling it forwards after defecation or childbirth.', de: 'Vervollständigt das Diaphragma pelvis hinter dem Levator ani und stützt das Steißbein, das er nach Defäkation oder Geburt nach vorn zieht.' },
    [['n_coccygeal_plexus', ['S4', 'S5']]],
    ['a_inf_gluteal', 'a_lateral_sacral'], ['hip_bone'], ['sacrum'],
    { fibers: bothFibers([[[5.6, -57.4, -5.4], [3.6, -57.8, -7.2], [1.2, -58.2, -8.8]], [[5.6, -57.8, -5.2], [3.4, -58.8, -7], [1, -59.4, -8.2]]]), r: 0.38 }),
  // ----- perineum: sphincters and perineal muscles
  M('external_anal_sphincter', 'perineum',
    { en: 'External anal sphincter', de: 'Äußerer Afterschließmuskel', la: 'Musculus sphincter ani externus' },
    { en: 'Deep, superficial and subcutaneous parts around the anal canal; superficial part from the anococcygeal body', de: 'Pars profunda, superficialis und subcutanea um den Analkanal; Pars superficialis vom Lig. anococcygeum' },
    { en: 'Perineal body; the deep part blends with the puborectalis', de: 'Centrum tendineum perinei; die Pars profunda verbindet sich mit dem M. puborectalis' },
    { en: 'Voluntary (striated) closure of the anus, which keeps it shut under stress and holds back stool until a suitable moment. It is supplied by the inferior rectal (anal) branches of the pudendal nerve; a pudendal lesion or a third-degree perineal tear in childbirth leads to faecal incontinence. The anal reflex (anal wink, S3–S5) tests its nerve supply.', de: 'Willkürlicher (quergestreifter) Verschluss des Afters, der ihn bei Belastung geschlossen hält und Stuhl bis zu einem passenden Zeitpunkt zurückhält. Versorgt von den Nn. anales (rectales) inferiores aus dem N. pudendus; eine Pudendusläsion oder ein Dammriss III. Grades bei der Geburt führt zur Stuhlinkontinenz. Der Analreflex (S3–S5) prüft seine Innervation.' },
    [['n_inferior_rectal', S24]],
    ['a_inferior_rectal'], [], ['sacrum'],
    { fibers: [ring([ANAL_RING[0], -60.6, -4.1], 1.05), ring(ANAL_RING, 1.1), [[0, -61.4, -3.4], [0, -61.4, -1.2]], [[0, -61, -5.5], [0, -60.6, -7.6]]], r: 0.32 }),
  M('external_urethral_sphincter', 'perineum',
    { en: 'External urethral sphincter', de: 'Äußerer Harnröhrenschließmuskel', la: 'Musculus sphincter urethrae externus' },
    { en: 'Ring of striated muscle around the membranous (intermediate) urethra in the deep perineal space; in women part of a complex with the compressor urethrae and urethrovaginal sphincter', de: 'Ring quergestreifter Muskulatur um die Pars membranacea (intermedia) urethrae im Spatium profundum perinei; bei der Frau Teil eines Komplexes mit M. compressor urethrae und M. sphincter urethrovaginalis' },
    { en: 'Encircles the urethra (and, in women, also the vagina); fibres reach the perineal body and the prostate', de: 'Umschließt die Urethra (bei der Frau auch die Vagina); Fasern ziehen zum Centrum tendineum perinei und zur Prostata' },
    { en: 'Voluntary closure of the urethra: it holds urine back and stops the stream, while the smooth internal sphincter at the bladder neck provides passive closure. The older term "urogenital diaphragm" for the deep perineal muscles is still used in German lectures. Weakness after childbirth or prostatectomy causes stress incontinence.', de: 'Willkürlicher Verschluss der Harnröhre: Er hält Harn zurück und unterbricht den Strahl, während der glatte M. sphincter urethrae internus am Blasenhals den passiven Verschluss leistet. Der ältere Begriff "Diaphragma urogenitale" für die tiefen Dammmuskeln ist in deutschen Vorlesungen noch verbreitet. Eine Schwäche nach Geburt oder Prostatektomie verursacht Belastungsinkontinenz.' },
    [['n_perineal', S24]],
    ['a_internal_pudendal', 'a_perineal'], [], [],
    { fibers: [ring([0, -58.8, 2.7], 0.75), ring([0, -59.6, 2.8], 0.75)], r: 0.24 }),
  M('bulbospongiosus', 'perineum',
    { en: 'Bulbospongiosus', de: 'M. bulbospongiosus', la: 'Musculus bulbospongiosus' },
    { en: 'Perineal body and (in men) the median raphe on the underside of the bulb of the penis', de: 'Centrum tendineum perinei und (beim Mann) die Raphe an der Unterseite des Bulbus penis' },
    { en: 'Men: wraps the bulb and corpus spongiosum and reaches the dorsum of the penis. Women: runs on each side of the vaginal orifice over the vestibular bulb to the clitoris', de: 'Mann: umhüllt Bulbus und Corpus spongiosum und erreicht den Penisrücken. Frau: zieht beidseits des Scheideneingangs über den Bulbus vestibuli zur Klitoris' },
    { en: 'Empties the urethra after urination and expels semen in rhythmic contractions during ejaculation; compresses the deep dorsal vein to help maintain erection. In women it narrows the vaginal orifice (sphincter vaginae) and supports clitoral erection.', de: 'Entleert die Harnröhre nach der Miktion und treibt bei der Ejakulation das Sperma mit rhythmischen Kontraktionen aus; drückt die V. dorsalis profunda ab und unterstützt so die Erektion. Bei der Frau verengt er den Scheideneingang und unterstützt die Erektion der Klitoris.' },
    [['n_perineal', S24]],
    ['a_perineal'], [], [],
    { fibers: bothFibers([[[0, -61.8, -0.6], [1, -62, 1.2], [1.2, -61.8, 3], [0.8, -61.4, 4.6], [0.2, -61, 5.6]]]), r: 0.35 }),
  M('ischiocavernosus', 'perineum',
    { en: 'Ischiocavernosus', de: 'M. ischiocavernosus', la: 'Musculus ischiocavernosus' },
    { en: 'Inner surface of the ischial tuberosity and ischiopubic ramus', de: 'Innenfläche von Tuber ischiadicum und Ramus ischiopubicus' },
    { en: 'Crus of the penis or clitoris and the tunica albuginea of the corpus cavernosum', de: 'Crus penis bzw. clitoridis und Tunica albuginea des Corpus cavernosum' },
    { en: 'Covers the crus of the penis or clitoris and squeezes blood into the corpus cavernosum, compressing the outflowing veins; it maintains and stiffens the erection.', de: 'Bedeckt das Crus penis bzw. clitoridis, presst Blut in den Schwellkörper und drückt die abführenden Venen ab; erhält und versteift die Erektion.' },
    [['n_perineal', S24]],
    ['a_perineal'], ['hip_bone'], [],
    { fibers: bothFibers([[[5.8, -62.6, -1.8], [4.4, -62, 0.4], [2.8, -61.2, 3], [1.4, -60.6, 5.2]]]), r: 0.35 }),
  M('superficial_transverse_perineal', 'perineum',
    { en: 'Superficial transverse perineal muscle', de: 'Oberflächlicher querer Dammmuskel', la: 'Musculus transversus perinei superficialis' },
    { en: 'Inner surface of the ischial tuberosity', de: 'Innenfläche des Tuber ischiadicum' },
    { en: 'Perineal body', de: 'Centrum tendineum perinei' },
    { en: 'Fixes the perineal body, the central anchor of the perineum where the bulbospongiosus, external anal sphincter, transverse perineal muscles and levator ani meet. A perineal tear or episiotomy cuts through this region; if the perineal body is not repaired the pelvic floor loses its support.', de: 'Fixiert das Centrum tendineum perinei, den zentralen Ankerpunkt des Damms, an dem M. bulbospongiosus, M. sphincter ani externus, die queren Dammmuskeln und der Levator ani zusammentreffen. Dammriss oder Episiotomie durchtrennen diese Region; wird das Centrum tendineum nicht versorgt, verliert der Beckenboden seinen Halt.' },
    [['n_perineal', S24]],
    ['a_perineal'], ['hip_bone'], [],
    { fibers: bothFibers([[[5.8, -62.8, -2], [3, -62.2, -1.4], PERINEAL_BODY]]), r: 0.28 }),
  M('deep_transverse_perineal', 'perineum',
    { en: 'Deep transverse perineal muscle', de: 'Tiefer querer Dammmuskel', la: 'Musculus transversus perinei profundus' },
    { en: 'Inner surface of the ischiopubic ramus', de: 'Innenfläche des Ramus ischiopubicus' },
    { en: 'Perineal body and the external urethral sphincter; covered below by the perineal membrane', de: 'Centrum tendineum perinei und M. sphincter urethrae externus; von unten bedeckt von der Membrana perinei' },
    { en: 'Stabilises the perineal body and supports the deep perineal space (the old "urogenital diaphragm"). In women it is largely replaced by smooth muscle and connective tissue.', de: 'Stabilisiert das Centrum tendineum perinei und stützt das Spatium profundum perinei (das alte "Diaphragma urogenitale"). Bei der Frau ist er weitgehend durch glatte Muskulatur und Bindegewebe ersetzt.' },
    [['n_perineal', S24]],
    ['a_internal_pudendal', 'a_perineal'], ['hip_bone'], [],
    { fibers: bothFibers([[[5, -61.4, 0], [2.6, -60.8, 0.2], [0, -60.4, 0.2]]]), r: 0.3 })
];

// ------------------------------------------------------------ organs
const O = (id, group, name, info, nerves, arteries, veins, lesion, shape, extra) => ({
  id, type: 'organ', group, name, info, nerves: nerves.map(([n, kind, seg]) => ({ n, kind, seg })), arteries, veins, lesion, shape, ...extra
});
const SYMP = ['n_inferior_hypogastric_plexus', 'sympathetic', ['L1', 'L2']];
const PARA = ['n_inferior_hypogastric_plexus', 'parasympathetic', S24];
const VISC_SENSORY = ['n_inferior_hypogastric_plexus', 'sensory', S24];

const BLADDER = [[0, -54, 3.2], [2.8, 2.2, 2.3]];
const URETHRA_M = [[0, -56.1, 2.7], [0, -57.6, 2.5], URETHRA_EUS, [0, -60.6, 3.4], [0, -61, 4.6], [0, -60.6, 6.4], [0, -61.6, 8.6], [0, -64.4, 9.7]];
const RECTUM = [[-0.6, -49.6, -4.4], [-0.3, -51.6, -6], [0, -53.6, -7], [0, -55.4, -6.8], [0, -57, -5.2], [0, -58.8, -3.4]];
const ANAL_CANAL = [[0, -58.8, -3.4], [0, -60.2, -3.9], [0, -61.6, -4.6]];
const UTERUS = [[0, -51.4, -0.2], [2.2, 2.6, 1.4], [0, 0.75, 0.66]];
const CERVIX = [[0, -54.4, -2], [1.1, 1.4, 1.1], [0, 1, 0.4]];
const TUBE_R = [[2.1, -50.2, 0.9], [3.8, -50.2, 0.8], [5.4, -50.4, 0.2], [6.6, -51.2, -0.8], [6.8, -52.4, -1.8], [6.2, -53.2, -2.2]];
const VAGINA = [[0, -55, -2.6], [0, -57, -1.2], [0, -59, 0.8], [0, -61, 2.6]];
const DUCTUS_R = [[2.4, -66.6, 6.2], [2.8, -62, 7.4], [3.2, -56.4, 7.2], [5.4, -52.4, 6.6], [6.6, -50, 5.6], [6.4, -50.8, 3], [5.4, -52.4, 1], [3.6, -54, -0.4], [2.6, -54.6, -0.2], [1.4, -55.6, 0.6], [0.4, -57.2, 1.8]];
const URETER_PELVIC_R = [[4.4, -49.6, -1.2], [5, -51.4, -3.6], [5, -53.2, -3.8], [4.2, -54.6, -2.6], [3.2, -54.9, -1.5], [2.2, -55.4, 0], [0.9, -55.4, 1.9]];

const organs = [
  O('bladder', 'urinary', { en: 'Urinary bladder', de: 'Harnblase', la: 'Vesica urinaria' },
    { en: 'Muscular reservoir behind the pubic symphysis (normal capacity about 400–500 ml). Apex (with the median umbilical ligament, the remnant of the urachus), body, fundus and neck. The trigone between the two ureteric orifices and the internal urethral orifice is smooth and fixed. The detrusor muscle contracts under parasympathetic control (pelvic splanchnic nerves, S2–S4); sympathetic fibres (T11–L2, via the hypogastric nerves) relax it and close the internal sphincter at the bladder neck. When full it rises above the symphysis and can be punctured there without opening the peritoneum (suprapubic catheter).',
      de: 'Muskulöser Speicher hinter der Symphyse (normale Kapazität etwa 400–500 ml). Apex (mit dem Lig. umbilicale medianum, dem Rest des Urachus), Corpus, Fundus und Cervix. Das Trigonum vesicae zwischen den beiden Ostia ureterum und dem Ostium urethrae internum ist glatt und unverschieblich. Der M. detrusor vesicae kontrahiert unter parasympathischer Steuerung (Nn. splanchnici pelvici, S2–S4); sympathische Fasern (Th11–L2, über die Nn. hypogastrici) entspannen ihn und verschließen den M. sphincter vesicae am Blasenhals. Gefüllt steigt die Blase über die Symphyse und kann dort ohne Eröffnung des Peritoneums punktiert werden (suprapubischer Katheter).' },
    [SYMP, PARA, ['n_hypogastric', 'sensory', ['L1', 'L2']], VISC_SENSORY],
    ['a_superior_vesical', 'a_inferior_vesical'], ['v_vesical_plexus'],
    { en: 'Pelvic splanchnic nerve injury (rectal cancer surgery, radical hysterectomy, sacral fractures) or a lesion of S2–S4 (cauda equina syndrome) paralyses the detrusor: an atonic, overfilling bladder with retention and overflow incontinence. A spinal cord lesion above the sacral centre instead causes a spastic reflex bladder with detrusor–sphincter dyssynergia.',
      de: 'Eine Verletzung der Nn. splanchnici pelvici (Rektumkarzinom-Operation, radikale Hysterektomie, Sakrumfrakturen) oder eine Läsion von S2–S4 (Kaudasyndrom) lähmt den Detrusor: atone, überlaufende Blase mit Harnverhalt und Überlaufinkontinenz. Eine Rückenmarksläsion oberhalb des sakralen Miktionszentrums verursacht dagegen eine spastische Reflexblase mit Detrusor-Sphinkter-Dyssynergie.' },
    { ellipsoids: [BLADDER], opacity: 0.45 },
    { color: 0xe3c35a }),
  O('ureter_pelvic', 'urinary', { en: 'Ureter (pelvic part)', de: 'Harnleiter (Pars pelvica)', la: 'Ureter, pars pelvica' },
    { en: 'The ureter enters the pelvis by crossing the bifurcation of the common iliac artery (or the start of the external iliac artery), runs down the lateral pelvic wall in front of the internal iliac artery, then turns forwards and medially at the level of the ischial spine to enter the bladder obliquely (this intramural course acts as a valve against reflux). In women it passes under the uterine artery about 2 cm lateral to the cervix ("water under the bridge"); in men the ductus deferens crosses above it. Narrowings where stones stick: at the pelvic brim and at the entry into the bladder.',
      de: 'Der Ureter tritt über die Teilung der A. iliaca communis (oder den Anfang der A. iliaca externa) ins Becken, verläuft an der seitlichen Beckenwand vor der A. iliaca interna abwärts, wendet sich in Höhe der Spina ischiadica nach vorn-medial und tritt schräg in die Blase ein (der intramurale Verlauf wirkt als Ventil gegen Reflux). Bei der Frau unterkreuzt er die A. uterina etwa 2 cm lateral der Cervix ("Wasser fließt unter der Brücke"); beim Mann überkreuzt ihn der Ductus deferens. Engstellen, an denen Steine stecken bleiben: an der Linea terminalis und beim Eintritt in die Blase.' },
    [SYMP],
    ['a_superior_vesical', 'a_uterine', 'a_inferior_vesical'], ['v_vesical_plexus'],
    { en: '"Water under the bridge": in a hysterectomy the uterine artery is clamped close to the cervix, where the ureter passes just below it; a clamp or ligature placed too far laterally can tie off or cut the ureter (hydronephrosis, urinary fistula, flank pain after surgery).',
      de: '"Wasser fließt unter der Brücke": Bei der Hysterektomie wird die A. uterina nahe der Cervix abgeklemmt, wo der Ureter direkt unter ihr verläuft; eine zu weit lateral gesetzte Klemme oder Ligatur kann den Ureter unterbinden oder durchtrennen (Harnstau, Urinfistel, Flankenschmerz nach der Operation).' },
    { tubes: both(URETER_PELVIC_R).map(p => [p, 0.2]), opacity: 0.85 },
    { color: 0xd9c27a, partOf: 'ureters' }),
  O('urethra_male', 'urinary', { en: 'Male urethra', de: 'Männliche Harnröhre', la: 'Urethra masculina' },
    { en: 'About 20 cm long, in four parts: intramural (preprostatic, with the internal sphincter), prostatic (receives the ejaculatory ducts on the seminal colliculus and the prostatic ducts), membranous or intermediate (the shortest and narrowest part, through the external urethral sphincter in the deep perineal space) and spongy (in the corpus spongiosum, with the bulbourethral glands opening into it, widening at the navicular fossa). Two curves (infrapubic and prepubic) and three narrowings matter for catheterisation.',
      de: 'Etwa 20 cm lang, in vier Abschnitten: Pars intramuralis (präprostatica, mit dem M. sphincter internus), Pars prostatica (nimmt auf dem Colliculus seminalis die Ductus ejaculatorii und die Prostatadrüsengänge auf), Pars membranacea bzw. intermedia (kürzester und engster Teil, durch den M. sphincter urethrae externus im Spatium profundum perinei) und Pars spongiosa (im Corpus spongiosum, mit der Mündung der Glandulae bulbourethrales, erweitert zur Fossa navicularis). Zwei Krümmungen (infra- und präpubisch) und drei Engstellen sind beim Katheterisieren wichtig.' },
    [SYMP, PARA, ['n_dorsal_penis_clitoris', 'sensory', S24]],
    ['a_inferior_vesical', 'a_internal_pudendal'], ['v_vesical_plexus', 'v_internal_pudendal'],
    { en: 'A pelvic fracture can tear the membranous urethra above the perineal membrane (urine leaks into the extraperitoneal pelvis); a fall astride a bar ruptures the spongy urethra below it, and urine spreads in the superficial perineal space into the scrotum, penis and lower abdominal wall but not into the thighs (Colles fascia).',
      de: 'Eine Beckenfraktur kann die Pars membranacea oberhalb der Membrana perinei abreißen (Urin tritt in den extraperitonealen Beckenraum); ein Sturz rittlings auf eine Stange zerreißt die Pars spongiosa darunter, und Urin breitet sich im Spatium superficiale perinei in Skrotum, Penis und untere Bauchwand aus, nicht aber in die Oberschenkel (Colles-Faszie).' },
    { tubes: [[URETHRA_M, 0.22]], opacity: 0.85 },
    { color: 0xe3c35a }),
  O('urethra_female', 'urinary', { en: 'Female urethra', de: 'Weibliche Harnröhre', la: 'Urethra feminina' },
    { en: 'Only about 4 cm long and straight; it runs from the bladder neck forwards and down, fused with the front wall of the vagina, through the external urethral sphincter and urethrovaginal sphincter, and opens in the vestibule between the clitoris and the vaginal orifice. Its continence depends on the sphincters and on the support of the pelvic floor (puborectalis, pubourethral ligaments).',
      de: 'Nur etwa 4 cm lang und gerade; zieht vom Blasenhals nach vorn-unten, mit der Vorderwand der Vagina verwachsen, durch M. sphincter urethrae externus und M. sphincter urethrovaginalis und mündet im Vestibulum zwischen Klitoris und Scheideneingang. Ihre Kontinenz hängt von den Schließmuskeln und vom Halt durch den Beckenboden ab (M. puborectalis, Ligg. pubourethralia).' },
    [SYMP, PARA, ['n_pudendal', 'sensory', S24]],
    ['a_vaginal', 'a_internal_pudendal'], ['v_uterine_plexus', 'v_internal_pudendal'],
    { en: 'The short urethra explains why women have far more bladder infections than men. Loss of pelvic floor support after vaginal births lets the bladder neck descend, so coughing or lifting leaks urine (stress incontinence).',
      de: 'Die kurze Harnröhre erklärt, warum Frauen viel häufiger Harnwegsinfekte haben als Männer. Verliert der Beckenboden nach vaginalen Geburten seinen Halt, sinkt der Blasenhals ab, und beim Husten oder Heben geht Urin ab (Belastungsinkontinenz).' },
    { tubes: [[[[0, -56.1, 2.9], [0, -58, 3.3], [0, -60.6, 3.9]], 0.22]], opacity: 0.85 },
    { color: 0xe3c35a }),
  O('rectum', 'rectum', { en: 'Rectum', de: 'Mastdarm', la: 'Rectum' },
    { en: 'Continues the sigmoid colon at S3 (the taeniae spread out, no haustra, no mesentery) and follows the curve of the sacrum (sacral flexure) to the anorectal junction, where the puborectalis sling pulls it forwards (perineal flexure, anorectal angle). Its lower part, the ampulla, stores faeces. Transverse folds (Kohlrausch fold on the right, about 6 cm from the anus). The upper third is covered by peritoneum in front and on the sides, the middle third only in front, the lower third not at all (rectouterine or rectovesical pouch). Blood: superior (IMA), middle (internal iliac) and inferior rectal arteries (internal pudendal).',
      de: 'Setzt das Sigma in Höhe S3 fort (die Tänien laufen auseinander, keine Haustren, kein Mesenterium) und folgt der Krümmung des Kreuzbeins (Flexura sacralis) bis zum anorektalen Übergang, wo die Puborektalisschlinge es nach vorn zieht (Flexura perinealis, anorektaler Winkel). Der untere Teil, die Ampulla recti, speichert Stuhl. Querfalten (Kohlrausch-Falte rechts, etwa 6 cm ab ano). Das obere Drittel ist vorn und seitlich von Peritoneum bedeckt, das mittlere nur vorn, das untere gar nicht (Excavatio rectouterina bzw. rectovesicalis, Douglas-Raum). Blut: Aa. rectales superior (AMI), media (A. iliaca interna) und inferior (A. pudenda interna).' },
    [SYMP, PARA, VISC_SENSORY],
    ['a_superior_rectal', 'a_middle_rectal', 'a_inferior_rectal'], ['v_superior_rectal', 'v_middle_rectal', 'v_rectal_venous_plexus'],
    { en: 'Rectal carcinoma is felt on digital rectal examination in the lower third. Total mesorectal excision removes the rectum in its fascial envelope; the hypogastric nerves and the pelvic splanchnic nerves and inferior hypogastric plexus run just outside it, so their injury causes bladder emptying problems and erectile and ejaculatory dysfunction. Rectal fullness is sensed through the pelvic splanchnic nerves (S2–S4).',
      de: 'Das Rektumkarzinom des unteren Drittels ist bei der digital-rektalen Untersuchung tastbar. Die totale mesorektale Exzision entfernt das Rektum in seiner Faszienhülle; Nn. hypogastrici, Nn. splanchnici pelvici und Plexus hypogastricus inferior liegen direkt außen davon, ihre Verletzung führt zu Blasenentleerungsstörungen sowie Erektions- und Ejakulationsstörungen. Die Füllung des Rektums wird über die Nn. splanchnici pelvici (S2–S4) wahrgenommen.' },
    { tubes: [[RECTUM, 1.1]], ellipsoids: [[[0, -57, -5.2], [1.8, 1.9, 1.4], [0, 1, -1.06]]], opacity: 0.45 },
    { color: 0xc99a72 }),
  O('anal_canal', 'rectum', { en: 'Anal canal', de: 'Analkanal', la: 'Canalis analis' },
    { en: 'The last 3–4 cm of the gut, from the anorectal junction (puborectalis) to the anus, running down and back. The pectinate (dentate) line divides it: above it the lining is endoderm (anal columns, internal rectal venous plexus, superior rectal artery, visceral innervation insensitive to pain, lymph to the internal iliac and inferior mesenteric nodes); below it the lining is ectoderm (inferior rectal artery and nerve, painful, lymph to the superficial inguinal nodes). It is closed by the smooth internal sphincter (sympathetic, continuous tone) and the striated external sphincter (pudendal nerve).',
      de: 'Die letzten 3–4 cm des Darms vom anorektalen Übergang (M. puborectalis) bis zum Anus, nach unten-hinten gerichtet. Die Linea pectinata (dentata) teilt ihn: oberhalb Entoderm (Columnae anales, Plexus venosus rectalis internus, A. rectalis superior, viszerale, schmerzunempfindliche Innervation, Lymphe zu den Nll. iliaci interni und mesenterici inferiores), unterhalb Ektoderm (A. und N. rectalis inferior, schmerzempfindlich, Lymphe zu den oberflächlichen Leistenlymphknoten). Verschlossen wird er durch den glatten M. sphincter ani internus (sympathisch, Dauertonus) und den quergestreiften M. sphincter ani externus (N. pudendus).' },
    [SYMP, PARA, ['n_inferior_rectal', 'sensory', S24]],
    ['a_superior_rectal', 'a_middle_rectal', 'a_inferior_rectal'], ['v_superior_rectal', 'v_inferior_rectal', 'v_rectal_venous_plexus'],
    { en: 'Haemorrhoids are enlarged arterial anal cushions (corpus cavernosum recti, fed by the superior rectal artery) above the pectinate line and are painless; perianal thromboses and fissures below the line hurt, because the skin there is supplied by the inferior rectal nerve. A low anal carcinoma spreads to the inguinal nodes.',
      de: 'Hämorrhoiden sind vergrößerte arterielle Gefäßpolster (Corpus cavernosum recti, gespeist von der A. rectalis superior) oberhalb der Linea pectinata und schmerzlos; Perianalthrombosen und Analfissuren unterhalb der Linie schmerzen, weil die Haut dort vom N. rectalis inferior versorgt wird. Ein tiefsitzendes Analkarzinom metastasiert in die Leistenlymphknoten.' },
    { tubes: [[ANAL_CANAL, 0.6]], opacity: 0.55 },
    { color: 0xb88a68 }),
  O('uterus', 'female', { en: 'Uterus', de: 'Gebärmutter', la: 'Uterus (Metra)' },
    { en: 'Pear-shaped muscular organ (about 7–8 cm) between bladder and rectum, normally anteverted (tilted forwards relative to the vagina) and anteflexed (body bent forwards on the cervix) so that it rests on the bladder. Parts: fundus, body, isthmus and cervix (with the portio projecting into the vagina). Held by the broad ligament (with the uterine tubes, ovarian ligament and round ligament) and, more importantly, by the cardinal (transverse cervical) and uterosacral ligaments and the pelvic floor. The uterine artery reaches it at the cervix and anastomoses at the fundus with the ovarian artery.',
      de: 'Birnenförmiges Muskelorgan (etwa 7–8 cm) zwischen Blase und Rektum, normalerweise antevertiert (gegenüber der Vagina nach vorn gekippt) und anteflektiert (Corpus gegen die Cervix nach vorn abgeknickt), sodass er der Blase aufliegt. Abschnitte: Fundus, Corpus, Isthmus und Cervix (mit der in die Vagina ragenden Portio). Gehalten vom Lig. latum uteri (mit Tube, Lig. ovarii proprium und Lig. teres uteri) und vor allem vom Lig. cardinale (Mackenrodt) und den Ligg. sacrouterina sowie vom Beckenboden. Die A. uterina erreicht ihn an der Cervix und anastomosiert am Fundus mit der A. ovarica.' },
    [SYMP, PARA, ['n_hypogastric', 'sensory', ['L1']], VISC_SENSORY],
    ['a_uterine', 'a_gonadal'], ['v_uterine_plexus'],
    { en: 'Labour pain from the uterine body travels with the sympathetic fibres (hypogastric nerves, T10–L1); pain from the cervix and birth canal travels with the pelvic splanchnic nerves (S2–S4) and the pudendal nerve, so an epidural must cover T10 to S4. Weakened ligaments and pelvic floor allow uterine prolapse (descensus uteri).',
      de: 'Wehenschmerz aus dem Corpus uteri läuft mit den sympathischen Fasern (Nn. hypogastrici, Th10–L1), Schmerz aus Cervix und Geburtskanal mit den Nn. splanchnici pelvici (S2–S4) und dem N. pudendus; eine Periduralanästhesie muss daher Th10 bis S4 abdecken. Geschwächte Bänder und Beckenboden ermöglichen eine Gebärmuttersenkung (Descensus uteri, Prolaps).' },
    { ellipsoids: [UTERUS, CERVIX], opacity: 0.45 },
    { color: 0xd88aa0 }),
  O('uterine_tubes', 'female', { en: 'Uterine tubes', de: 'Eileiter', la: 'Tubae uterinae (Salpinges)' },
    { en: 'About 10–12 cm long, running laterally in the upper free border of the broad ligament (mesosalpinx) from the uterine horn to the ovary. Parts: intramural part, isthmus, ampulla (where fertilisation usually happens) and infundibulum with fimbriae that catch the oocyte. The tube opens into the peritoneal cavity, which is therefore open to the outside in women.',
      de: 'Etwa 10–12 cm lang, verlaufen im oberen freien Rand des Lig. latum (Mesosalpinx) vom Tubenwinkel des Uterus zum Ovar. Abschnitte: Pars uterina, Isthmus, Ampulla (Ort der Befruchtung) und Infundibulum mit Fimbrien, die die Eizelle auffangen. Die Tube öffnet sich in die Peritonealhöhle, die bei der Frau daher nach außen offen ist.' },
    [SYMP, PARA],
    ['a_uterine', 'a_gonadal'], ['v_uterine_plexus', 'v_gonadal'],
    { en: 'Ectopic (tubal) pregnancy, most often in the ampulla, can rupture and bleed into the rectouterine pouch (pouch of Douglas); salpingitis can scar the tube and cause infertility or ectopic pregnancy.',
      de: 'Eine Extrauteringravidität (Tubargravidität), meist in der Ampulle, kann rupturieren und in den Douglas-Raum bluten; eine Salpingitis kann die Tube vernarben und Sterilität oder Tubargravidität verursachen.' },
    { tubes: both(TUBE_R).map(p => [p, 0.22]), opacity: 0.8 },
    { color: 0xd88aa0 }),
  O('ovaries', 'female', { en: 'Ovaries', de: 'Eierstöcke', la: 'Ovaria' },
    { en: 'Almond-sized gonads in the ovarian fossa on the lateral pelvic wall, between the external and internal iliac vessels, attached to the broad ligament by the mesovarium, to the uterus by the ovarian ligament and to the pelvic wall by the suspensory ligament, which carries the ovarian vessels and nerves. Because they descend from the posterior abdominal wall, the ovarian artery arises from the aorta (L2) and their nerves and pain come from T10–T11; the right ovarian vein drains into the IVC, the left into the left renal vein.',
      de: 'Mandelgroße Keimdrüsen in der Fossa ovarica an der seitlichen Beckenwand zwischen den äußeren und inneren Iliakalgefäßen; über die Mesovarium am Lig. latum, über das Lig. ovarii proprium am Uterus und über das Lig. suspensorium ovarii an der Beckenwand befestigt, das die Ovarialgefäße und -nerven führt. Weil sie von der hinteren Bauchwand absteigen, entspringt die A. ovarica aus der Aorta (L2) und Nerven und Schmerz stammen aus Th10–Th11; die rechte V. ovarica mündet in die V. cava inferior, die linke in die linke V. renalis.' },
    [['n_renal_plexus', 'sympathetic', ['T10', 'T11']], ['n_renal_plexus', 'sensory', ['T10', 'T11']]],
    ['a_gonadal', 'a_uterine'], ['v_gonadal', 'v_uterine_plexus'],
    { en: 'Ovarian torsion or a ruptured cyst causes acute lower abdominal pain referred around the umbilicus (T10); because the obturator nerve runs directly behind the ovarian fossa, ovarian disease can also be felt on the medial thigh.',
      de: 'Eine Ovarialtorsion oder rupturierte Zyste verursacht akute Unterbauchschmerzen, die in die Nabelregion (Th10) projizieren; weil der N. obturatorius direkt hinter der Fossa ovarica verläuft, kann eine Ovarerkrankung auch an der Oberschenkelinnenseite gespürt werden.' },
    { ellipsoids: [[6, -52.4, -1.4], [-6, -52.4, -1.4]].map(c => [c, [0.6, 1.2, 0.8]]), opacity: 0.6 },
    { color: 0xe8b0c0 }),
  O('vagina', 'female', { en: 'Vagina', de: 'Scheide', la: 'Vagina (Colpos)' },
    { en: 'Fibromuscular tube (about 8–10 cm) from the cervix down and forwards to the vestibule, between bladder and urethra in front and rectum behind. The cervix projects into its upper end, creating the anterior, lateral and deep posterior fornix; the posterior fornix lies directly in front of the rectouterine pouch (puncture of the pouch of Douglas). Upper part: uterine and vaginal arteries, visceral nerves from the uterovaginal plexus (insensitive to touch); lower fifth: internal pudendal artery and the perineal branch of the pudendal nerve (sensitive).',
      de: 'Fibromuskulärer Schlauch (etwa 8–10 cm) von der Cervix nach vorn-unten zum Vestibulum, vorn Blase und Urethra, hinten Rektum. Die Portio ragt in das obere Ende und bildet das vordere, die seitlichen und das tiefe hintere Scheidengewölbe; das hintere liegt direkt vor dem Douglas-Raum (Douglas-Punktion). Oberer Teil: A. uterina und A. vaginalis, viszerale Nerven aus dem Plexus uterovaginalis (berührungsunempfindlich); unteres Fünftel: A. pudenda interna und Nn. perineales des N. pudendus (sensibel).' },
    [SYMP, PARA, ['n_perineal', 'sensory', S24]],
    ['a_vaginal', 'a_uterine', 'a_internal_pudendal'], ['v_uterine_plexus'],
    { en: 'Pelvic floor damage after vaginal birth lets the vaginal walls sag: the bladder (cystocele) or rectum (rectocele) bulges into the vagina, with stress incontinence or difficulty emptying the bowel. A large perineal tear or an episiotomy (mediolateral, to spare the anal sphincter) involves the lower vagina and perineal body.',
      de: 'Ein Beckenbodenschaden nach vaginaler Geburt lässt die Scheidenwände absinken: Die Blase (Zystozele) oder das Rektum (Rektozele) wölbt sich in die Vagina vor, mit Belastungsinkontinenz oder Entleerungsstörungen des Darms. Ein großer Dammriss oder eine Episiotomie (mediolateral, um den Analsphinkter zu schonen) betrifft die untere Vagina und das Centrum tendineum perinei.' },
    { tubes: [[VAGINA, 0.9]], opacity: 0.4 },
    { color: 0xd88aa0 }),
  O('clitoris', 'female', { en: 'Clitoris', de: 'Kitzler', la: 'Clitoris' },
    { en: 'Erectile organ homologous to the penis: two crura on the ischiopubic rami (covered by ischiocavernosus) join into the body, which ends in the glans under the prepuce; the vestibular bulbs beside the vaginal orifice correspond to the bulb of the penis. Very densely innervated by the dorsal nerve of the clitoris (pudendal nerve); its erection depends on the cavernous nerves (parasympathetic, S2–S4).',
      de: 'Schwellkörperorgan, homolog zum Penis: Zwei Crura an den Rr. ischiopubici (bedeckt vom M. ischiocavernosus) vereinigen sich zum Corpus, das unter dem Präputium in der Glans endet; die Bulbi vestibuli beidseits des Scheideneingangs entsprechen dem Bulbus penis. Sehr dicht innerviert vom N. dorsalis clitoridis (N. pudendus); die Erektion hängt von den Nn. cavernosi ab (parasympathisch, S2–S4).' },
    [['n_cavernous', 'parasympathetic', S24], ['n_cavernous', 'sympathetic', ['L1', 'L2']], ['n_dorsal_penis_clitoris', 'sensory', S24]],
    ['a_penis_clitoris'], ['v_internal_pudendal', 'v_vesical_plexus'],
    { en: 'A pudendal nerve lesion or block abolishes clitoral sensation; injury of the cavernous nerves in pelvic surgery impairs arousal.',
      de: 'Eine Läsion oder Blockade des N. pudendus hebt die Sensibilität der Klitoris auf; eine Verletzung der Nn. cavernosi bei Beckenoperationen beeinträchtigt die Erregung.' },
    { tubes: [...both([[3.8, -61.4, 1], [2.2, -60.4, 3.8], [0.4, -59.6, 5.4]]).map(p => [p, 0.3]), [[[0, -59.4, 5.2], [0, -59.8, 6.2]], 0.35]], spheres: [[[0, -60.2, 6.6], 0.4]], opacity: 0.6 },
    { color: 0xd88aa0 }),
  O('prostate', 'male', { en: 'Prostate', de: 'Vorsteherdrüse', la: 'Prostata' },
    { en: 'Chestnut-sized gland below the bladder neck around the prostatic urethra, in front of the rectum (palpable on rectal examination). Zones (McNeal): peripheral zone at the back (about 70%, where most carcinomas arise), central zone around the ejaculatory ducts, transition zone around the urethra (benign prostatic hyperplasia) and the anterior fibromuscular stroma. Its secretion makes up about a third of the ejaculate; sympathetic fibres contract its smooth muscle at emission.',
      de: 'Kastaniengroße Drüse unter dem Blasenhals um die Pars prostatica urethrae, vor dem Rektum (bei der rektalen Untersuchung tastbar). Zonen (McNeal): periphere Zone hinten (etwa 70 %, Ursprung der meisten Karzinome), zentrale Zone um die Ductus ejaculatorii, Transitionalzone um die Urethra (benigne Prostatahyperplasie) und vorderes fibromuskuläres Stroma. Ihr Sekret macht etwa ein Drittel des Ejakulats aus; sympathische Fasern kontrahieren ihre glatte Muskulatur bei der Emission.' },
    [SYMP, PARA],
    ['a_inferior_vesical', 'a_middle_rectal', 'a_internal_pudendal'], ['v_vesical_plexus'],
    { en: 'Benign hyperplasia of the transition zone compresses the urethra (weak stream, urinary retention). In radical prostatectomy the cavernous nerves run in the neurovascular bundles at the posterolateral edge of the prostate; nerve-sparing surgery tries to preserve them to avoid erectile dysfunction. The prostatic venous plexus connects with the vertebral venous plexus (Batson), a route for bone metastases to the spine.',
      de: 'Die benigne Hyperplasie der Transitionalzone engt die Harnröhre ein (schwacher Strahl, Harnverhalt). Bei der radikalen Prostatektomie verlaufen die Nn. cavernosi in den Gefäß-Nerven-Bündeln am posterolateralen Rand der Prostata; die nervschonende Operation versucht sie zu erhalten, um eine Erektionsstörung zu vermeiden. Der Plexus venosus prostaticus steht mit den Wirbelvenenplexus in Verbindung (Batson), ein Weg für Knochenmetastasen in die Wirbelsäule.' },
    { ellipsoids: [[[0, -57.6, 2.3], [1.9, 1.4, 1.5]]], opacity: 0.55 },
    { color: 0xc98a6a }),
  O('seminal_vesicles', 'male', { en: 'Seminal glands (vesicles)', de: 'Bläschendrüsen', la: 'Glandulae vesiculosae (Vesiculae seminales)' },
    { en: 'Coiled glandular tubes (about 5 cm) behind the bladder base, lateral to the ampullae of the ductus deferens, above the prostate and separated from the rectum by the rectoprostatic fascia (Denonvilliers). Each joins its ductus deferens to form an ejaculatory duct. Their fructose-rich alkaline secretion forms most of the ejaculate volume.',
      de: 'Gewundene Drüsenschläuche (etwa 5 cm) hinter dem Blasengrund, lateral der Ampullen der Ductus deferentes, oberhalb der Prostata und vom Rektum durch die Fascia rectoprostatica (Denonvilliers) getrennt. Jede vereinigt sich mit ihrem Ductus deferens zum Ductus ejaculatorius. Ihr fruktosereiches, alkalisches Sekret bildet den größten Teil des Ejakulatvolumens.' },
    [SYMP, PARA],
    ['a_inferior_vesical', 'a_middle_rectal'], ['v_vesical_plexus'],
    { en: 'They are palpable on rectal examination when enlarged or inflamed; prostate cancer that has invaded them has a worse prognosis.',
      de: 'Vergrößert oder entzündet sind sie bei der rektalen Untersuchung tastbar; ein Prostatakarzinom, das sie infiltriert hat, hat eine schlechtere Prognose.' },
    { ellipsoids: [[[2.4, -55.2, -0.2], [0.55, 1.6, 0.5], [0.7, 1, -0.3]], [[-2.4, -55.2, -0.2], [0.55, 1.6, 0.5], [-0.7, 1, -0.3]]], opacity: 0.6 },
    { color: 0xc98a6a }),
  O('ductus_deferens', 'male', { en: 'Ductus deferens', de: 'Samenleiter', la: 'Ductus deferens (Vas deferens)' },
    { en: 'Thick-walled muscular duct (about 40 cm) from the tail of the epididymis up in the spermatic cord, through the inguinal canal, around the inferior epigastric artery at the deep inguinal ring, over the external iliac vessels and along the lateral pelvic wall; it crosses above the ureter, widens behind the bladder into the ampulla and joins the seminal gland to form the ejaculatory duct. Its strong smooth muscle propels sperm at emission (sympathetic, L1–L2).',
      de: 'Dickwandiger Muskelschlauch (etwa 40 cm) vom Nebenhodenschwanz im Samenstrang aufwärts durch den Leistenkanal, am inneren Leistenring um die A. epigastrica inferior, über die Vasa iliaca externa und an der seitlichen Beckenwand entlang; er überkreuzt den Ureter, erweitert sich hinter der Blase zur Ampulle und bildet mit der Bläschendrüse den Ductus ejaculatorius. Seine kräftige glatte Muskulatur befördert die Spermien bei der Emission (sympathisch, L1–L2).' },
    [SYMP],
    ['a_ductus_deferens'], ['v_vesical_plexus'],
    { en: 'Vasectomy cuts the ductus in the scrotal part of the spermatic cord, where it is felt as a firm cord. Injury to the lumbar sympathetic outflow or hypogastric nerves (retroperitoneal lymph node dissection) abolishes emission (dry ejaculation).',
      de: 'Bei der Vasektomie wird der Ductus im skrotalen Teil des Samenstrangs durchtrennt, wo er als derber Strang tastbar ist. Eine Verletzung des lumbalen Sympathikus oder der Nn. hypogastrici (retroperitoneale Lymphadenektomie) hebt die Emission auf (trockene Ejakulation).' },
    { tubes: both(DUCTUS_R).map(p => [p, 0.2]), opacity: 0.85 },
    { color: 0xc98a6a }),
  O('testis', 'male', { en: 'Testis and epididymis', de: 'Hoden und Nebenhoden', la: 'Testis (Orchis) et epididymis' },
    { en: 'Paired gonads in the scrotum, each with the epididymis on its back (head, body, tail), where sperm mature and are stored. They develop on the posterior abdominal wall and descend through the inguinal canal, taking their vessels and nerves with them: the testicular artery arises from the aorta at L2, the pampiniform plexus cools the arterial blood and drains into the testicular vein (right into the IVC, left into the left renal vein), and lymph goes to the para-aortic (lumbar) nodes, not the inguinal nodes. Visceral pain fibres reach T10–T11.',
      de: 'Paarige Keimdrüsen im Skrotum, jeweils mit dem Nebenhoden an der Rückseite (Caput, Corpus, Cauda), in dem die Spermien reifen und gespeichert werden. Sie entstehen an der hinteren Bauchwand und steigen durch den Leistenkanal ab und nehmen ihre Gefäße und Nerven mit: Die A. testicularis entspringt in Höhe L2 aus der Aorta, der Plexus pampiniformis kühlt das arterielle Blut und mündet in die V. testicularis (rechts in die V. cava inferior, links in die linke V. renalis), und die Lymphe fließt zu den paraaortalen (lumbalen) Lymphknoten, nicht zu den Leistenlymphknoten. Viszerale Schmerzfasern erreichen Th10–Th11.' },
    [['n_renal_plexus', 'sympathetic', ['T10', 'T11']], ['n_renal_plexus', 'sensory', ['T10']]],
    ['a_gonadal'], ['v_gonadal'],
    { en: 'Testicular torsion is an emergency (surgery within about 6 hours); its pain is often felt in the lower abdomen around the umbilicus (T10). A left-sided varicocele is commoner because the left testicular vein enters the renal vein at a right angle; a sudden left varicocele in an adult can signal a renal tumour. Testicular cancer spreads to the para-aortic nodes.',
      de: 'Die Hodentorsion ist ein Notfall (Operation innerhalb von etwa 6 Stunden); ihr Schmerz wird oft im Unterbauch um den Nabel empfunden (Th10). Eine linksseitige Varikozele ist häufiger, weil die linke V. testicularis rechtwinklig in die V. renalis mündet; eine neu aufgetretene linke Varikozele beim Erwachsenen kann auf einen Nierentumor hinweisen. Hodentumoren metastasieren in die paraaortalen Lymphknoten.' },
    { ellipsoids: [[2.2, -65.6, 6.8], [-2.2, -65.6, 6.8]].map(c => [c, [0.9, 1.4, 0.8]]), tubes: both([[2.6, -64.6, 6], [2.8, -65.8, 5.8], [2.5, -66.8, 6.1]]).map(p => [p, 0.35]), opacity: 0.6 },
    { color: 0xc98a6a }),
  O('penis', 'male', { en: 'Penis', de: 'Penis', la: 'Penis' },
    { en: 'Root in the superficial perineal space (bulb, covered by bulbospongiosus; two crura on the ischiopubic rami, covered by ischiocavernosus) and a free body made of two corpora cavernosa and the corpus spongiosum with the urethra, ending in the glans. Erection is parasympathetic (cavernous nerves, S2–S4: "point"): the helicine arteries dilate, the cavernous spaces fill and compress the veins. Emission is sympathetic (L1–L2) and ejaculation is somatic (pudendal nerve to bulbospongiosus: "shoot"). Sensation comes from the dorsal nerve of the penis.',
      de: 'Radix im Spatium superficiale perinei (Bulbus, bedeckt vom M. bulbospongiosus; zwei Crura an den Rr. ischiopubici, bedeckt vom M. ischiocavernosus) und ein freier Corpus aus zwei Corpora cavernosa und dem Corpus spongiosum mit der Urethra, das in der Glans endet. Die Erektion ist parasympathisch (Nn. cavernosi, S2–S4, "Nn. erigentes"): Die Aa. helicinae erweitern sich, die Schwellkörperräume füllen sich und drücken die Venen ab. Die Emission ist sympathisch (L1–L2), die Ejakulation somatisch (N. pudendus zum M. bulbospongiosus). Die Sensibilität kommt vom N. dorsalis penis.' },
    [['n_cavernous', 'parasympathetic', S24], ['n_cavernous', 'sympathetic', ['L1', 'L2']], ['n_dorsal_penis_clitoris', 'sensory', S24]],
    ['a_penis_clitoris'], ['v_internal_pudendal', 'v_vesical_plexus'],
    { en: 'Erectile dysfunction after pelvic surgery (radical prostatectomy, rectal excision) comes from injury to the pelvic splanchnic nerves or cavernous nerves; a pudendal lesion (cycling, pelvic fracture) abolishes penile sensation and the bulbospongiosus reflex.',
      de: 'Eine Erektionsstörung nach Beckenoperationen (radikale Prostatektomie, Rektumresektion) entsteht durch Verletzung der Nn. splanchnici pelvici oder der Nn. cavernosi; eine Pudendusläsion (Radfahren, Beckenfraktur) hebt die Sensibilität des Penis und den Bulbocavernosusreflex auf.' },
    { tubes: [[[[0, -61.6, 1.6], [0, -61.4, 3.4], [0, -60.8, 5.4], [0, -61.2, 7.8], [0, -63.8, 9.6]], 0.85], ...both([[4.4, -61.6, 0.4], [2.6, -60.8, 3.4], [0.8, -60.4, 5.8]]).map(p => [p, 0.4])],
      spheres: [[[0, -64.8, 9.7], 1]], opacity: 0.45 },
    { color: 0xc98a6a })
];

// ------------------------------------------------------------ arteries
const A = (id, parents, name, info, extra) => ({ id, type: 'artery', parents, name, info, ...extra });
// Internal iliac artery (lower limb) ends at its division in front of the greater sciatic foramen.
const ANT_DIV = [[5.2, -51.8, -6.1], [5.5, -53.2, -5.4], [5.6, -54, -5], [5.6, -54.8, -4.7], [5.6, -55.2, -4.6]];
const PUDENDAL_A = [[5.6, -55.2, -4.6], [6.2, -56.2, -6.6], [6.2, -57.6, -5.6], [5.8, -59.6, -4], [4.9, -60.9, -1.4], [3.4, -61.5, 1.6]];

const arteries = [
  A('a_internal_iliac_anterior', ['a_internal_iliac'], { en: 'Internal iliac artery, anterior division', de: 'A. iliaca interna, vorderer Stamm', la: 'Arteria iliaca interna, truncus anterior' },
    { en: 'Runs down the lateral pelvic wall towards the greater sciatic foramen and gives the visceral branches: umbilical (with the superior vesical arteries), obturator, inferior vesical (men) or uterine and vaginal (women), middle rectal, internal pudendal and inferior gluteal arteries. The branching pattern varies a lot.',
      de: 'Zieht an der seitlichen Beckenwand zum Foramen ischiadicum majus und gibt die viszeralen Äste ab: A. umbilicalis (mit den Aa. vesicales superiores), A. obturatoria, A. vesicalis inferior (Mann) bzw. A. uterina und A. vaginalis (Frau), A. rectalis media, A. pudenda interna und A. glutea inferior. Das Verzweigungsmuster variiert stark.' },
    { paths: both(ANT_DIV), r: 0.38,
      lesion: { en: 'Severe bleeding from the uterus after birth or from a pelvic fracture can be stopped by ligating or embolising the anterior divisions; the pelvic organs survive through anastomoses with the other side and with the ovarian, superior rectal and lumbar arteries.',
        de: 'Schwere Blutungen aus dem Uterus nach der Geburt oder bei einer Beckenfraktur lassen sich durch Ligatur oder Embolisation der vorderen Stämme stillen; die Beckenorgane überleben über Anastomosen mit der Gegenseite und mit den Aa. ovaricae, rectalis superior und lumbales.' } }),
  A('a_internal_iliac_posterior', ['a_internal_iliac'], { en: 'Internal iliac artery, posterior division', de: 'A. iliaca interna, hinterer Stamm', la: 'Arteria iliaca interna, truncus posterior' },
    { en: 'Gives only parietal branches: the iliolumbar and lateral sacral arteries, then leaves through the greater sciatic foramen above piriformis as the superior gluteal artery.',
      de: 'Gibt nur parietale Äste ab: A. iliolumbalis und Aa. sacrales laterales, dann verlässt er das Becken oberhalb des M. piriformis durch das Foramen ischiadicum majus als A. glutea superior.' },
    { paths: both([[5.2, -51.8, -6.1], [4.8, -52.2, -7.2], [4.4, -52.4, -7.8]]), r: 0.34 }),
  A('a_lateral_sacral', ['a_internal_iliac_posterior'], { en: 'Lateral sacral arteries', de: 'Seitliche Kreuzbeinarterien', la: 'Arteriae sacrales laterales' },
    { en: 'Run down on the front of the sacrum lateral to the anterior sacral foramina and send spinal branches through them to the sacral canal (cauda equina, meninges) and the back muscles; they anastomose with the median sacral artery.',
      de: 'Ziehen auf der Vorderfläche des Kreuzbeins lateral der Foramina sacralia anteriora abwärts und schicken Rr. spinales durch sie in den Sakralkanal (Cauda equina, Meningen) und zu den Rückenmuskeln; sie anastomosieren mit der A. sacralis mediana.' },
    { paths: both([[4.4, -52.4, -7.8], [3.2, -53.6, -8.2], [2.8, -56, -8.4], [2.2, -58, -8.2]]), r: 0.16 }),
  A('a_umbilical', ['a_internal_iliac_anterior'], { en: 'Umbilical artery', de: 'Nabelarterie', la: 'Arteria umbilicalis' },
    { en: 'Before birth it carries fetal blood to the placenta. Afterwards only its first part stays open (pars patens) and gives the superior vesical arteries; the rest becomes the medial umbilical ligament, which raises the medial umbilical fold on the inside of the anterior abdominal wall.',
      de: 'Vor der Geburt führt sie fetales Blut zur Plazenta. Danach bleibt nur ihr Anfangsteil offen (Pars patens) und gibt die Aa. vesicales superiores ab; der Rest wird zum Lig. umbilicale mediale, das an der Innenseite der vorderen Bauchwand die Plica umbilicalis medialis aufwirft.' },
    { paths: both([[5.5, -53.2, -5.4], [5.2, -52.4, -2.6], [5.4, -52.4, 0], [4.6, -51.6, 3], [3.6, -49, 5.4], [2.4, -44, 6.4]]), r: 0.22 }),
  A('a_superior_vesical', ['a_umbilical'], { en: 'Superior vesical arteries', de: 'Obere Blasenarterien', la: 'Arteriae vesicales superiores' },
    { en: 'Two or three arteries from the patent part of the umbilical artery to the upper bladder; they also supply the pelvic ureter and, in men, often give the artery of the ductus deferens.',
      de: 'Zwei bis drei Arterien aus dem offenen Teil der A. umbilicalis zum oberen Teil der Blase; sie versorgen auch den pelvinen Ureter und geben beim Mann oft die A. ductus deferentis ab.' },
    { paths: both([[5.4, -52.4, 0], [3.6, -52.8, 1.8], [2.4, -52.6, 2.8]]), r: 0.16 }),
  A('a_ductus_deferens', ['a_superior_vesical'], { en: 'Artery of the ductus deferens', de: 'Samenleiterarterie', la: 'Arteria ductus deferentis' },
    { en: 'Accompanies the ductus deferens to the epididymis and anastomoses with the testicular artery, so the testis can survive ligation of the testicular artery.',
      de: 'Begleitet den Ductus deferens bis zum Nebenhoden und anastomosiert mit der A. testicularis, sodass der Hoden eine Ligatur der A. testicularis überleben kann.' },
    { paths: both([[3.6, -52.8, 1.8], [3.4, -54, 0.4], [2.6, -54.8, -0.1]]), r: 0.12 }),
  A('a_inferior_vesical', ['a_internal_iliac_anterior'], { en: 'Inferior vesical artery', de: 'Untere Blasenarterie', la: 'Arteria vesicalis inferior' },
    { en: 'In men it supplies the bladder base, prostate (prostatic branches), seminal glands and lower ureter. In women it is often replaced by the vaginal artery.',
      de: 'Versorgt beim Mann Blasengrund, Prostata (Rr. prostatici), Bläschendrüsen und unteren Ureter. Bei der Frau wird sie oft durch die A. vaginalis ersetzt.' },
    { paths: both([[5.6, -54, -5], [4.2, -55.4, -2.2], [2.6, -56, 0.4], [1.6, -56.8, 1.6]]), r: 0.16 }),
  A('a_uterine', ['a_internal_iliac_anterior'], { en: 'Uterine artery', de: 'Gebärmutterarterie', la: 'Arteria uterina' },
    { en: 'Runs medially in the base of the broad ligament (cardinal ligament), crosses above the ureter about 2 cm lateral to the cervix, then ascends tortuously along the side of the uterus and anastomoses at the uterine horn with the ovarian artery. It gives vaginal, tubal and ovarian branches; in pregnancy it enlarges greatly.',
      de: 'Zieht in der Basis des Lig. latum (Lig. cardinale) nach medial, überkreuzt etwa 2 cm lateral der Cervix den Ureter, steigt dann geschlängelt an der Uteruskante auf und anastomosiert am Tubenwinkel mit der A. ovarica. Gibt Rr. vaginales, tubarii und ovarici ab; in der Schwangerschaft wird sie stark erweitert.' },
    { paths: both([[5.6, -54, -5], [4.6, -54, -2.8], [3.2, -54, -1.2], [1.4, -54.2, -1.8], [2.5, -52.8, -1.2], [2.5, -51.4, -0.2], [2.2, -50.2, 0.9], [3.8, -50.4, 0.6]]), r: 0.2,
      lesion: { en: '"Water under the bridge": the ureter runs under the uterine artery beside the cervix. During hysterectomy the artery must be clamped close to the uterus; a clamp placed too far laterally can catch, kink or cut the ureter.',
        de: '"Wasser fließt unter der Brücke": Der Ureter verläuft neben der Cervix unter der A. uterina. Bei der Hysterektomie muss die Arterie nahe am Uterus abgeklemmt werden; eine zu weit lateral gesetzte Klemme kann den Ureter fassen, abknicken oder durchtrennen.' } }),
  A('a_vaginal', ['a_uterine'], { en: 'Vaginal artery', de: 'Scheidenarterie', la: 'Arteria vaginalis' },
    { en: 'Usually from the uterine artery (or directly from the anterior division); it supplies the vagina, the bladder base and the female urethra, corresponding to the inferior vesical artery of men.',
      de: 'Meist aus der A. uterina (oder direkt aus dem vorderen Stamm); versorgt Vagina, Blasengrund und weibliche Urethra und entspricht der A. vesicalis inferior des Mannes.' },
    { paths: both([[4.6, -54, -2.8], [2.8, -55.8, -2], [1.4, -57.4, -1.4]]), r: 0.14 }),
  A('a_middle_rectal', ['a_internal_iliac_anterior'], { en: 'Middle rectal artery', de: 'Mittlere Mastdarmarterie', la: 'Arteria rectalis media' },
    { en: 'Small and inconstant; runs in the lateral ligament of the rectum to the lower rectum and anastomoses with the superior and inferior rectal arteries. In men it also supplies the prostate and seminal glands.',
      de: 'Klein und inkonstant; zieht im seitlichen Rektumpfeiler zum unteren Rektum und anastomosiert mit den Aa. rectales superior und inferior. Beim Mann versorgt sie auch Prostata und Bläschendrüsen.' },
    { paths: both([[5.6, -54.8, -4.7], [3.8, -56, -5.4], [1.8, -56.6, -5.6]]), r: 0.14 }),
  A('a_internal_pudendal', ['a_internal_iliac_anterior'], { en: 'Internal pudendal artery', de: 'Innere Schamarterie', la: 'Arteria pudenda interna' },
    { en: 'Artery of the perineum. It leaves the pelvis through the greater sciatic foramen below piriformis, hooks around the ischial spine with the pudendal nerve, re-enters through the lesser sciatic foramen and runs forwards in the pudendal canal (Alcock) on the obturator internus. Branches: inferior rectal artery, perineal artery, artery of the bulb, and the deep and dorsal arteries of the penis or clitoris.',
      de: 'Die Arterie des Damms. Verlässt das Becken unterhalb des M. piriformis durch das Foramen ischiadicum majus, umschlingt mit dem N. pudendus die Spina ischiadica, tritt durch das Foramen ischiadicum minus wieder ein und zieht im Canalis pudendalis (Alcock-Kanal) auf dem M. obturatorius internus nach vorn. Äste: A. rectalis inferior, A. perinealis, A. bulbi penis bzw. vestibuli sowie A. profunda und A. dorsalis penis bzw. clitoridis.' },
    { paths: both(PUDENDAL_A), r: 0.2 }),
  A('a_inferior_rectal', ['a_internal_pudendal'], { en: 'Inferior rectal artery', de: 'Untere Mastdarmarterie', la: 'Arteria rectalis inferior' },
    { en: 'Crosses the ischioanal fossa from the pudendal canal to the anal canal below the pectinate line, the external anal sphincter and the perianal skin.',
      de: 'Durchquert die Fossa ischioanalis vom Pudendalkanal zum Analkanal unterhalb der Linea pectinata, zum M. sphincter ani externus und zur perianalen Haut.' },
    { paths: both([[5.8, -59.6, -4], [3.6, -60.6, -4.6], [1.2, -61.2, -4.6]]), r: 0.13 }),
  A('a_perineal', ['a_internal_pudendal'], { en: 'Perineal artery', de: 'Dammarterie', la: 'Arteria perinealis' },
    { en: 'Supplies the superficial perineal muscles (bulbospongiosus, ischiocavernosus, superficial transverse perineal) and, with its posterior scrotal or labial branches, the skin of the scrotum or labia.',
      de: 'Versorgt die oberflächlichen Dammmuskeln (Mm. bulbospongiosus, ischiocavernosus, transversus perinei superficialis) und mit ihren Rr. scrotales bzw. labiales posteriores die Haut von Skrotum bzw. Labien.' },
    { paths: both([[4.9, -60.9, -1.4], [3, -61.8, 0.2], [1.4, -62.2, 1.4]]), r: 0.13 }),
  A('a_penis_clitoris', ['a_internal_pudendal'], { en: 'Deep and dorsal arteries of the penis / clitoris', de: 'Tiefe und dorsale Penis- bzw. Klitorisarterien', la: 'Arteriae profunda et dorsalis penis / clitoridis' },
    { en: 'End branches of the internal pudendal artery. The deep artery runs in the corpus cavernosum and gives the helicine arteries, which open during erection; the dorsal artery runs on the back of the penis or clitoris to the glans.',
      de: 'Endäste der A. pudenda interna. Die A. profunda verläuft im Corpus cavernosum und gibt die Aa. helicinae ab, die sich bei der Erektion öffnen; die A. dorsalis zieht auf dem Rücken von Penis bzw. Klitoris zur Glans.' },
    { paths: both([[3.4, -61.5, 1.6], [2, -60.8, 4.4], [0.8, -60.6, 6.8], [0.4, -61.6, 9.4]]), r: 0.12 })
];

// ------------------------------------------------------------ veins
const V = (id, parents, name, info, extra) => ({ id, type: 'vein', parents, name, info, ...extra });
const PORTAL = 0x7a55b8; // as in the abdomen: veins draining to the portal system are violet

const veins = [
  V('v_common_iliac', ['v_ivc_abdominal'], { en: 'Common iliac veins', de: 'Gemeinsame Beckenvenen', la: 'Venae iliacae communes' },
    { en: 'Formed in front of the sacroiliac joint by the external and internal iliac veins; they unite at L5, to the right of the aortic bifurcation, to form the inferior vena cava. The left vein is longer and crosses behind the right common iliac artery.',
      de: 'Entstehen vor dem Iliosakralgelenk aus V. iliaca externa und interna und vereinigen sich in Höhe L5 rechts der Aortengabel zur V. cava inferior. Die linke ist länger und zieht hinter der rechten A. iliaca communis vorbei.' },
    { paths: [[[1.8, -42.6, -3.4], [3.6, -46, -4], [4.4, -48.8, -4.4]], [[1.8, -42.6, -3.4], [-0.6, -44.4, -4.2], [-3, -46.6, -4.4], [-4.4, -48.8, -4.4]]], r: 0.6,
      lesion: { en: 'May–Thurner syndrome: the right common iliac artery compresses the left common iliac vein against the spine, which is one reason why deep vein thrombosis is more common in the left leg.',
        de: 'May-Thurner-Syndrom (Beckenvenensporn): Die rechte A. iliaca communis drückt die linke V. iliaca communis gegen die Wirbelsäule, ein Grund dafür, dass tiefe Beinvenenthrombosen links häufiger sind.' } }),
  V('v_internal_iliac', ['v_common_iliac'], { en: 'Internal iliac veins', de: 'Innere Beckenvenen', la: 'Venae iliacae internae' },
    { en: 'Lie behind the internal iliac arteries and collect the gluteal, obturator and lateral sacral veins and the visceral venous plexuses of the pelvis (vesical, prostatic, uterine, vaginal and rectal). The plexuses have no valves and connect with the vertebral venous plexus.',
      de: 'Liegen hinter den Aa. iliacae internae und nehmen die Vv. gluteae, obturatoriae und sacrales laterales sowie die viszeralen Venenplexus des Beckens auf (Plexus vesicalis, prostaticus, uterinus, vaginalis und rectalis). Die Plexus sind klappenlos und mit dem Wirbelvenenplexus verbunden.' },
    { paths: both([[4.4, -48.8, -4.4], [4.8, -51.2, -6.4], [5, -53.4, -6.8]]), r: 0.45 }),
  V('v_vesical_plexus', ['v_internal_iliac'], { en: 'Vesical and prostatic venous plexus', de: 'Blasen- und Prostatavenengeflecht', la: 'Plexus venosus vesicalis et prostaticus' },
    { en: 'Surrounds the bladder base and the prostate (in the prostatic capsule) and receives the deep dorsal vein of the penis or clitoris; it drains through the vesical veins to the internal iliac veins and is connected with the internal vertebral venous plexus (Batson).',
      de: 'Umgibt Blasengrund und Prostata (in der Prostatakapsel) und nimmt die V. dorsalis profunda penis bzw. clitoridis auf; leitet über die Vv. vesicales in die Vv. iliacae internae ab und ist mit dem Plexus venosus vertebralis internus verbunden (Batson).' },
    { paths: both([[1.6, -56.2, 1.8], [3, -55.6, 0.6], [4.4, -54.6, -2.6], [5, -53.4, -6.2]]), r: 0.16 }),
  V('v_uterine_plexus', ['v_internal_iliac'], { en: 'Uterine and vaginal venous plexus', de: 'Gebärmutter- und Scheidenvenengeflecht', la: 'Plexus venosus uterinus et vaginalis' },
    { en: 'Lies in the broad and cardinal ligaments beside the uterus and vagina and drains through the uterine veins to the internal iliac veins; it connects above with the ovarian veins.',
      de: 'Liegt in Lig. latum und Lig. cardinale neben Uterus und Vagina und fließt über die Vv. uterinae in die Vv. iliacae internae ab; oben ist er mit den Vv. ovaricae verbunden.' },
    { paths: both([[1.4, -53.4, -0.2], [3, -54, -1.6], [4.6, -54, -4.6], [5, -53.4, -6.4]]), r: 0.16 }),
  V('v_middle_rectal', ['v_internal_iliac'], { en: 'Middle rectal veins', de: 'Mittlere Mastdarmvenen', la: 'Venae rectales mediae' },
    { en: 'Drain the lower rectum through the lateral ligaments into the internal iliac veins (caval system).',
      de: 'Leiten das Blut des unteren Rektums über die seitlichen Rektumpfeiler in die Vv. iliacae internae (Kavasystem).' },
    { paths: both([[1.6, -56.6, -5.6], [3.4, -56, -5.8], [4.8, -54.4, -6.6], [5, -53.6, -6.8]]), r: 0.14 }),
  V('v_internal_pudendal', ['v_internal_iliac'], { en: 'Internal pudendal veins', de: 'Innere Schamvenen', la: 'Venae pudendae internae' },
    { en: 'Accompany the internal pudendal artery through the pudendal canal and drain the perineum, the erectile tissue (deep veins of the penis or clitoris) and the anal canal into the internal iliac veins.',
      de: 'Begleiten die A. pudenda interna durch den Pudendalkanal und leiten Blut aus Damm, Schwellkörpern (Vv. profundae penis bzw. clitoridis) und Analkanal in die Vv. iliacae internae.' },
    { paths: both([[3.2, -61.8, 2.2], [4.8, -61.4, -1], [5.8, -60.2, -3.8], [6.1, -57.6, -5.6], [6.6, -56, -6.6], [5.2, -53.8, -6.8]]), r: 0.17 }),
  V('v_inferior_rectal', ['v_internal_pudendal'], { en: 'Inferior rectal veins', de: 'Untere Mastdarmvenen', la: 'Venae rectales inferiores' },
    { en: 'Drain the anal canal below the pectinate line and the external sphincter into the internal pudendal veins (caval system).',
      de: 'Leiten Blut aus dem Analkanal unterhalb der Linea pectinata und dem äußeren Schließmuskel in die Vv. pudendae internae (Kavasystem).' },
    { paths: both([[1, -61.6, -4.8], [3.4, -61.2, -4.8], [5.8, -60.2, -3.9]]), r: 0.12 }),
  V('v_rectal_venous_plexus', ['v_superior_rectal', 'v_middle_rectal', 'v_inferior_rectal'], { en: 'Rectal venous plexus', de: 'Rektaler Venenplexus', la: 'Plexus venosus rectalis' },
    { en: 'Internal plexus under the mucosa and external plexus outside the muscle wall of the rectum and anal canal. It drains upwards through the superior rectal vein to the portal system and laterally and downwards through the middle and inferior rectal veins to the caval system, so it is a portocaval anastomosis.',
      de: 'Innerer Plexus unter der Schleimhaut und äußerer Plexus außerhalb der Muskelwand von Rektum und Analkanal. Er fließt nach oben über die V. rectalis superior ins Pfortadersystem und seitlich und nach unten über die Vv. rectales mediae und inferiores ins Kavasystem ab und ist damit eine portokavale Anastomose.' },
    { paths: [...both([[1.4, -56, -5.8], [1.3, -58.4, -4], [0.9, -60.6, -4.2]]), [[0, -56.4, -7], [0, -58.6, -5], [0, -60.8, -5]]], r: 0.12, color: PORTAL,
      lesion: { en: 'In portal hypertension this anastomosis can dilate into anorectal varices, which are distinct from haemorrhoids (arterial anal cushions). Rectal drugs absorbed low in the rectum partly bypass the liver through the caval veins.',
        de: 'Bei portaler Hypertension kann sich diese Anastomose zu anorektalen Varizen erweitern, die von Hämorrhoiden (arterielle Gefäßpolster) zu unterscheiden sind. Tief im Rektum aufgenommene Medikamente (Zäpfchen) umgehen über die Kavavenen teilweise die Leber.' } })
];

// ------------------------------------------------------------ nerves
const N = (id, group, segList, parents, name, info, extra) => ({ id, type: 'nerve', group, segs: segList, parents, name, info, ...extra });
// Ends of the S2–S4 ventral rami (S2 and S3 are drawn with the lower limb).
const S2_END = [4.2, -51.7, -7.6], S3_END = [4.2, -54.2, -7.6], S4_END = [3.6, -56.6, -7.8];
const PUDENDAL = [[4.4, -54.4, -7.6], [5.8, -56, -7], [5.9, -57.6, -6], [5.5, -59.4, -4.4], [4.6, -60.8, -1.6], [3.2, -61.4, 1.4]];
const IHP = [3.6, -52.4, -4.4];

const nerves = [
  N('root_S4', 'root', ['S4'], [], { en: 'S4 spinal nerve (ventral ramus)', de: 'Spinalnerv S4 (Ramus anterior)', la: 'Ramus anterior nervi spinalis S4' },
    { en: 'Leaves the fourth anterior sacral foramen. It joins S2 and S3 in the pudendal nerve and the pelvic splanchnic nerves, supplies the levator ani and coccygeus directly and joins S5 in the coccygeal plexus. Dermatome: the perianal skin (saddle region with S3 and S5).',
      de: 'Tritt aus dem vierten Foramen sacrale anterius. Bildet mit S2 und S3 den N. pudendus und die Nn. splanchnici pelvici, versorgt direkt Levator ani und M. coccygeus und bildet mit S5 den Plexus coccygeus. Dermatom: perianale Haut (Reithosenregion mit S3 und S5).' },
    { path: [[1.6, -55.6, -8.2], S4_END], r: 0.28,
      lesion: { en: 'A cauda equina syndrome (central disc prolapse, tumour) affecting S2–S5 causes saddle anaesthesia, loss of the anal reflex and bladder, bowel and sexual dysfunction: an emergency for decompression.',
        de: 'Ein Kaudasyndrom (medialer Bandscheibenvorfall, Tumor) mit Beteiligung von S2–S5 verursacht eine Reithosenanästhesie, Ausfall des Analreflexes sowie Blasen-, Mastdarm- und Sexualfunktionsstörungen: ein Notfall zur Dekompression.' } }),
  N('root_S5', 'root', ['S5'], [], { en: 'S5 spinal nerve (ventral ramus)', de: 'Spinalnerv S5 (Ramus anterior)', la: 'Ramus anterior nervi spinalis S5' },
    { en: 'Leaves the sacral hiatus beside the coccyx and forms the coccygeal plexus with S4 and the coccygeal nerve. Dermatome: the innermost ring of skin around the anus.',
      de: 'Tritt neben dem Steißbein aus dem Hiatus sacralis und bildet mit S4 und dem N. coccygeus den Plexus coccygeus. Dermatom: der innerste Hautring um den Anus.' },
    { path: [[1.2, -57.8, -8.2], [2.6, -58.4, -7.8]], r: 0.24 }),
  N('n_pudendal', 'somatic', S24, ['root_S2', 'root_S3', 'root_S4'], { en: 'Pudendal nerve', de: 'Schamnerv', la: 'Nervus pudendus' },
    { en: 'Somatic nerve of the perineum (S2–S4). It leaves the pelvis through the greater sciatic foramen below piriformis (infrapiriform foramen), crosses the back of the ischial spine and sacrospinous ligament, re-enters the perineum through the lesser sciatic foramen and runs forwards in the pudendal canal (Alcock) with the internal pudendal vessels. Branches: inferior rectal (anal) nerves, perineal nerves and the dorsal nerve of the penis or clitoris. Pudendal block: local anaesthetic is injected where the nerve crosses the ischial spine, felt through the vaginal wall, to numb the perineum for birth (forceps delivery, episiotomy repair); the anterior labia (ilioinguinal and genitofemoral nerves) still feel pain.',
      de: 'Somatischer Nerv des Damms (S2–S4). Verlässt das Becken unterhalb des M. piriformis durch das Foramen ischiadicum majus (Foramen infrapiriforme), zieht hinter Spina ischiadica und Lig. sacrospinale vorbei, tritt durch das Foramen ischiadicum minus in den Damm und verläuft mit den Vasa pudenda interna im Canalis pudendalis (Alcock-Kanal) nach vorn. Äste: Nn. anales (rectales) inferiores, Nn. perineales und N. dorsalis penis bzw. clitoridis. Pudendusblock: Lokalanästhetikum wird dort injiziert, wo der Nerv die Spina ischiadica kreuzt (durch die Scheidenwand tastbar), um den Damm für die Geburt zu betäuben (Zangengeburt, Naht einer Episiotomie); die vorderen Labien (N. ilioinguinalis und N. genitofemoralis) bleiben schmerzempfindlich.' },
    { paths: [...both(PUDENDAL), [S2_END, PUDENDAL[0]], [S4_END, PUDENDAL[0]]], r: 0.22,
      lesion: { en: 'A pudendal nerve lesion (stretching in prolonged vaginal birth, pelvic fracture, compression in the pudendal canal in cyclists) paralyses the external anal and urethral sphincters and the superficial perineal muscles: faecal and urinary incontinence, loss of the anal and bulbospongiosus reflexes, numbness of the perineum and genitals, and impaired ejaculation and orgasm. The levator ani, supplied directly from S3–S4, is largely spared.',
        de: 'Eine Läsion des N. pudendus (Dehnung bei protrahierter vaginaler Geburt, Beckenfraktur, Kompression im Alcock-Kanal bei Radfahrern) lähmt die äußeren Schließmuskeln von Anus und Urethra und die oberflächlichen Dammmuskeln: Stuhl- und Harninkontinenz, Ausfall von Anal- und Bulbocavernosusreflex, Taubheit von Damm und Genitale sowie gestörte Ejakulation und Orgasmus. Der Levator ani, direkt aus S3–S4 versorgt, bleibt weitgehend erhalten.' } }),
  N('n_inferior_rectal', 'somatic', S24, ['n_pudendal'], { en: 'Inferior rectal (anal) nerves', de: 'Untere Mastdarmnerven', la: 'Nervi anales (rectales) inferiores' },
    { en: 'Leave the pudendal nerve at the start of the pudendal canal and cross the ischioanal fossa to the external anal sphincter, the lining of the anal canal below the pectinate line and the perianal skin.',
      de: 'Verlassen den N. pudendus am Anfang des Pudendalkanals und durchqueren die Fossa ischioanalis zum M. sphincter ani externus, zur Auskleidung des Analkanals unterhalb der Linea pectinata und zur perianalen Haut.' },
    { paths: both([[5.5, -59.4, -4.4], [3.4, -60.8, -4.6], [1.2, -61.4, -4.8]]), r: 0.12,
      lesion: { en: 'Its loss weakens the external anal sphincter and abolishes the anal reflex and sensation around the anus; the visceral sensation of rectal fullness (pelvic splanchnic nerves) remains.',
        de: 'Sein Ausfall schwächt den M. sphincter ani externus und hebt Analreflex und Sensibilität um den Anus auf; die viszerale Wahrnehmung der Rektumfüllung (Nn. splanchnici pelvici) bleibt erhalten.' } }),
  N('n_perineal', 'somatic', S24, ['n_pudendal'], { en: 'Perineal nerves', de: 'Dammnerven', la: 'Nervi perineales' },
    { en: 'Superficial branches supply the skin of the perineum and the back of the scrotum or labia (posterior scrotal or labial nerves) and the lower vagina; deep branches supply the external urethral sphincter, bulbospongiosus, ischiocavernosus and the transverse perineal muscles.',
      de: 'Oberflächliche Äste versorgen die Haut von Damm und hinterem Skrotum bzw. den Labien (Nn. scrotales bzw. labiales posteriores) und die untere Vagina; tiefe Äste den M. sphincter urethrae externus, die Mm. bulbospongiosus, ischiocavernosus und die queren Dammmuskeln.' },
    { paths: [...both([[4.6, -60.8, -1.6], [2.8, -61.8, 0.6], [1.4, -62.2, 2.2]]), ...both([[2.8, -61.8, 0.6], [2.2, -63, 4]])], r: 0.12 }),
  N('n_dorsal_penis_clitoris', 'somatic', S24, ['n_pudendal'], { en: 'Dorsal nerve of the penis / clitoris', de: 'Rückennerv des Penis bzw. der Klitoris', la: 'Nervus dorsalis penis / clitoridis' },
    { en: 'Terminal branch of the pudendal nerve; it pierces the perineal membrane and runs on the back of the penis or clitoris, lateral to the dorsal artery, to the glans. The main sensory nerve of the external genitalia and the afferent limb of the bulbospongiosus reflex.',
      de: 'Endast des N. pudendus; durchbricht die Membrana perinei und zieht auf dem Rücken von Penis bzw. Klitoris lateral der A. dorsalis zur Glans. Wichtigster sensibler Nerv des äußeren Genitales und afferenter Schenkel des Bulbocavernosusreflexes.' },
    { paths: both([[3.2, -61.4, 1.4], [1.8, -60.5, 4.6], [0.5, -60.3, 7], [0.3, -61.2, 9.6]]), r: 0.11,
      lesion: { en: 'A penile block (around the base of the penis, e.g. for circumcision) anaesthetises these nerves.',
        de: 'Ein Peniswurzelblock (z. B. bei der Zirkumzision) betäubt diese Nerven.' } }),
  N('n_levator_ani', 'somatic', ['S3', 'S4'], ['root_S3', 'root_S4'], { en: 'Nerve to levator ani', de: 'Nerv des Levator ani', la: 'Nervus musculi levatoris ani' },
    { en: 'Direct branches of S3 and S4 that run on the pelvic (upper) surface of the levator ani, not with the pudendal nerve; they supply puborectalis, pubococcygeus and iliococcygeus.',
      de: 'Direkte Äste aus S3 und S4, die auf der Beckenseite (Oberseite) des Levator ani verlaufen, nicht mit dem N. pudendus; sie versorgen Mm. puborectalis, pubococcygeus und iliococcygeus.' },
    { paths: [...both([[3.4, -56.4, -7.4], [4, -57.4, -5.6], [3.8, -58.2, -3.6]]), [S3_END, [3.4, -56.4, -7.4]]], r: 0.11,
      lesion: { en: 'Stretching of these nerves and of the pudendal nerve in a long second stage of labour denervates the pelvic floor; together with muscle tears this leads to pelvic organ prolapse and incontinence years later.',
        de: 'Eine Dehnung dieser Nerven und des N. pudendus in einer langen Austreibungsperiode denerviert den Beckenboden; zusammen mit Muskelrissen führt das Jahre später zu Deszensus und Inkontinenz.' } }),
  N('n_coccygeal_plexus', 'somatic', ['S4', 'S5'], ['root_S4', 'root_S5'], { en: 'Coccygeal plexus', de: 'Steißbeingeflecht', la: 'Plexus coccygeus' },
    { en: 'Small plexus on the pelvic surface of coccygeus formed by S4, S5 and the coccygeal nerve. It supplies coccygeus and part of the levator ani and gives the anococcygeal nerves to the skin over the coccyx.',
      de: 'Kleines Geflecht auf der Beckenseite des M. coccygeus aus S4, S5 und dem N. coccygeus. Versorgt den M. coccygeus und Teile des Levator ani und gibt die Nn. anococcygei zur Haut über dem Steißbein ab.' },
    { paths: [[[2.6, -58.4, -7.8], [1.8, -59.2, -7.8], [0.8, -60.2, -7.4]], [S4_END, [2.6, -58.4, -7.8]], [[1.8, -59.2, -7.8], [3.4, -58.4, -7]]], r: 0.1 }),
  N('n_pelvic_splanchnic', 'parasympathetic', S24, ['root_S2', 'root_S3', 'root_S4'], { en: 'Pelvic splanchnic nerves', de: 'Beckeneingeweidenerven', la: 'Nervi splanchnici pelvici (Nervi erigentes)' },
    { en: 'The sacral parasympathetic outflow (S2–S4): preganglionic fibres leave the ventral rami beside the anterior sacral foramina and join the inferior hypogastric plexus. They supply the bladder detrusor, the erectile tissue (hence "nervi erigentes"), the rectum and, ascending through the hypogastric nerves, the descending and sigmoid colon (the hindgut beyond the reach of the vagus). Visceral pain fibres from organs below the pelvic pain line run back with them to S2–S4.',
      de: 'Der sakrale Parasympathikus (S2–S4): Präganglionäre Fasern verlassen die Rami anteriores neben den Foramina sacralia anteriora und ziehen zum Plexus hypogastricus inferior. Sie versorgen den Detrusor der Blase, die Schwellkörper (daher "Nn. erigentes"), das Rektum und, über die Nn. hypogastrici aufsteigend, Colon descendens und sigmoideum (den Enddarm jenseits des Vagusgebiets, Cannon-Böhm-Punkt). Viszerale Schmerzfasern aus Organen unterhalb der pelvinen Schmerzlinie laufen mit ihnen zurück nach S2–S4.' },
    { paths: [...both([[4.2, -51.7, -7.6], [3.8, -53, -5.2], [3.4, -53.8, -3.8]]), ...both([[4.2, -54.2, -7.6], [3.7, -54.4, -5.4], [3.4, -53.8, -3.8]]), ...both([[3.6, -56.6, -7.8], [3.5, -55.6, -5.6], [3.3, -55.2, -2.6]])], r: 0.12,
      lesion: { en: 'Injury during rectal cancer surgery, radical hysterectomy or prostatectomy, or a sacral fracture, causes an atonic bladder with urinary retention, erectile dysfunction (loss of the "point") and constipation from loss of rectal emptying, while sympathetic emission (L1–L2) can persist.',
        de: 'Eine Verletzung bei Rektumkarzinom-Operation, radikaler Hysterektomie oder Prostatektomie oder bei einer Sakrumfraktur verursacht eine atone Blase mit Harnverhalt, eine Erektionsstörung und eine Obstipation durch gestörte Rektumentleerung, während die sympathische Emission (L1–L2) erhalten bleiben kann.' } }),
  N('n_hypogastric', 'sympathetic', ['L1', 'L2'], ['n_inferior_mesenteric_plexus'], { en: 'Hypogastric nerves', de: 'Rechter und linker N. hypogastricus', la: 'Nervi hypogastrici dexter et sinister' },
    { en: 'The two continuations of the superior hypogastric plexus (in front of L5 and the sacral promontory) into the pelvis; they run down beside the rectum to the inferior hypogastric plexus. They carry sympathetic fibres from the lumbar splanchnic nerves (L1–L2) for bladder storage, closure of the internal urethral sphincter and emission, and pain fibres from organs above the pelvic pain line (uterine body, upper bladder).',
      de: 'Die beiden Fortsetzungen des Plexus hypogastricus superior (vor L5 und dem Promontorium) ins Becken; sie ziehen neben dem Rektum zum Plexus hypogastricus inferior. Sie führen sympathische Fasern aus den Nn. splanchnici lumbales (L1–L2) für die Speicherfunktion der Blase, den Verschluss des inneren Harnröhrenschließmuskels und die Emission sowie Schmerzfasern aus Organen oberhalb der pelvinen Schmerzlinie (Corpus uteri, obere Blase).' },
    { paths: [[[2.6, -46, -3.8], [3.4, -49.6, -5], IHP], [[-1.6, -46, -3.8], [-3.2, -49.6, -5], mirror(IHP)]], r: 0.12,
      lesion: { en: 'Damage during aortic, rectal or retroperitoneal lymph node surgery causes retrograde or absent ejaculation: the internal sphincter no longer closes, so semen flows back into the bladder.',
        de: 'Eine Verletzung bei Aorten-, Rektum- oder retroperitonealen Lymphknotenoperationen verursacht eine retrograde oder fehlende Ejakulation: Der innere Schließmuskel schließt nicht mehr, und das Sperma fließt in die Blase zurück.' } }),
  N('n_inferior_hypogastric_plexus', 'plexus', ['L1', 'L2', ...S24], ['n_hypogastric', 'n_pelvic_splanchnic'], { en: 'Inferior hypogastric (pelvic) plexus', de: 'Unteres Hypogastrikusgeflecht (Beckengeflecht)', la: 'Plexus hypogastricus inferior (Plexus pelvicus)' },
    { en: 'A plate of nerves and small ganglia on each side of the rectum, cervix and vagina or seminal glands and bladder base, where the sympathetic hypogastric nerves meet the parasympathetic pelvic splanchnic nerves. It continues into organ plexuses: middle rectal, vesical, prostatic, uterovaginal (Frankenhäuser) and the cavernous nerves.',
      de: 'Eine Platte aus Nerven und kleinen Ganglien beidseits von Rektum, Cervix und Vagina bzw. Bläschendrüsen und Blasengrund, in der die sympathischen Nn. hypogastrici auf die parasympathischen Nn. splanchnici pelvici treffen. Sie setzt sich in Organgeflechte fort: Plexus rectalis medius, vesicalis, prostaticus, uterovaginalis (Frankenhäuser) und die Nn. cavernosi.' },
    { paths: [...both([IHP, [3.4, -53.8, -3.6], [3.2, -55.2, -2.2], [2.8, -56.2, -0.4]]), ...both([[3.4, -53.8, -3.6], [2, -54.6, -5]]), ...both([[3.2, -55.2, -2.2], [2, -54, 0.2]])], r: 0.14,
      lesion: { en: 'Bilateral injury in deep pelvic surgery denervates the pelvic organs: urinary retention, loss of erection and ejaculation, and disturbed defecation; the striated sphincters (pudendal nerve) still work.',
        de: 'Eine beidseitige Verletzung bei tiefen Beckenoperationen denerviert die Beckenorgane: Harnverhalt, Verlust von Erektion und Ejakulation sowie gestörte Defäkation; die quergestreiften Schließmuskeln (N. pudendus) funktionieren weiter.' } }),
  N('n_cavernous', 'plexus', ['L1', 'L2', ...S24], ['n_inferior_hypogastric_plexus'], { en: 'Cavernous nerves of the penis / clitoris', de: 'Schwellkörpernerven', la: 'Nervi cavernosi penis / clitoridis' },
    { en: 'Continue from the prostatic or uterovaginal plexus in the neurovascular bundles at the posterolateral edge of the prostate (or beside the urethra and vagina), pierce the perineal membrane and enter the erectile bodies. Their parasympathetic fibres dilate the helicine arteries and cause erection.',
      de: 'Setzen sich aus dem Plexus prostaticus bzw. uterovaginalis in den Gefäß-Nerven-Bündeln am posterolateralen Rand der Prostata (bzw. neben Urethra und Vagina) fort, durchbrechen die Membrana perinei und treten in die Schwellkörper ein. Ihre parasympathischen Fasern erweitern die Aa. helicinae und bewirken die Erektion.' },
    { paths: both([[2.8, -56.2, -0.4], [1.6, -57.6, 1.2], [1, -59.4, 2.4], [0.8, -60.6, 4.6]]), r: 0.1,
      lesion: { en: 'Radical prostatectomy is done nerve-sparing where possible because cutting both cavernous nerves causes permanent erectile dysfunction.',
        de: 'Die radikale Prostatektomie wird möglichst nervschonend durchgeführt, weil die Durchtrennung beider Nn. cavernosi eine dauerhafte Erektionsstörung verursacht.' } })
];

export const structures = [...bones, ...muscles, ...organs, ...arteries, ...veins, ...nerves];

export const muscleGroups = {
  pelvic_floor: { en: 'Pelvic floor (pelvic diaphragm)', de: 'Beckenboden (Diaphragma pelvis)' },
  perineum: { en: 'Perineal muscles and sphincters', de: 'Dammmuskeln und Schließmuskeln' }
};

export const meta = {
  start: 'bladder',
  plexus: { en: 'Pelvic nerves', de: 'Beckennerven' },
  plexusTargets: { en: 'Pelvic nerves → muscles and organs', de: 'Beckennerven → Muskeln und Organe' },
  nerveGroups: [
    ['root', { en: 'Sacral ventral rami', de: 'Rami anteriores der Sakralnerven' }],
    ['somatic', { en: 'Pudendal nerve and pelvic floor nerves', de: 'N. pudendus und Beckenbodennerven' }],
    ['parasympathetic', { en: 'Parasympathetic: pelvic splanchnic nerves', de: 'Parasympathikus: Nn. splanchnici pelvici' }],
    ['sympathetic', { en: 'Sympathetic: hypogastric nerves', de: 'Sympathikus: Nn. hypogastrici' }],
    ['plexus', { en: 'Inferior hypogastric plexus and cavernous nerves', de: 'Plexus hypogastricus inferior und Nn. cavernosi' }]
  ],
  organGroups: [
    ['urinary', { en: 'Bladder, pelvic ureter and urethra', de: 'Harnblase, pelviner Ureter und Urethra' }],
    ['rectum', { en: 'Rectum and anal canal', de: 'Rektum und Analkanal' }],
    ['female', { en: 'Female genital organs', de: 'Weibliche Geschlechtsorgane' }],
    ['male', { en: 'Male genital organs', de: 'Männliche Geschlechtsorgane' }]
  ],
  // Bony pelvis, the iliac vessels, S2–S3 and the hip muscles of the lower limb, and the hindgut,
  // ureters, gonadal vessels and prevertebral plexuses of the abdomen.
  context: ['hip_bone', 'sacrum', 'lumbar_vertebrae', 'obturator_internus', 'piriformis',
    'a_abdominal_aorta', 'a_common_iliac', 'a_internal_iliac', 'a_external_iliac', 'a_obturator', 'a_inf_gluteal', 'a_sup_gluteal',
    'a_gonadal', 'a_superior_rectal', 'v_ivc_abdominal', 'v_gonadal', 'v_superior_rectal',
    'root_S2', 'root_S3', 'n_obturator', 'n_lumbar_splanchnic', 'n_inferior_mesenteric_plexus', 'n_renal_plexus',
    'ureters', 'sigmoid_colon'],
  contextOpacity: 0.3,
  camera: { target: [0, -56, 0], position: [14, -50, 46] }
};
