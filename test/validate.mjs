// Data integrity and lesion-model checks. Run: node test/validate.mjs
import { structures, byId, relations, BODY_REGIONS } from '../js/data.js';
import { computeLesion } from '../js/lesion.js';

let failures = 0;
const fail = msg => { failures++; console.error('FAIL', msg); };
const ok = msg => console.log('ok  ', msg);

// ids unique across all regions
const seen = new Set();
for (const s of structures) { if (seen.has(s.id)) fail('duplicate id ' + s.id); seen.add(s.id); }

// regions marked available have data, and all data belongs to an available region
for (const r of BODY_REGIONS) {
  for (const k of ['en', 'de']) if (!r.name[k]) fail(`region ${r.id} missing name.${k}`);
  const n = structures.filter(s => s.region === r.id).length;
  if (r.available && !n) fail(`region ${r.id} is available but has no structures`);
  if (!r.available && n) fail(`region ${r.id} has structures but is not marked available`);
}
for (const s of structures) if (!BODY_REGIONS.some(r => r.id === s.region && r.available)) fail(`${s.id} has unknown region ${s.region}`);
ok(`${BODY_REGIONS.filter(r => r.available).length} of ${BODY_REGIONS.length} body regions available`);

// region settings: start structure, list groups covering every nerve and muscle, camera
for (const r of BODY_REGIONS.filter(r => r.available)) {
  const own = structures.filter(s => s.region === r.id);
  if (byId[r.start]?.region !== r.id) fail(`region ${r.id}: start "${r.start}" is not in the region`);
  for (const k of ['en', 'de']) if (!r.plexus?.[k]) fail(`region ${r.id} missing plexus.${k}`);
  const nerveGroups = new Set((r.nerveGroups || []).map(([g]) => g));
  for (const n of own.filter(s => s.type === 'nerve')) if (!nerveGroups.has(n.group)) fail(`${n.id}: nerve group ${n.group} not listed in ${r.id} meta`);
  for (const m of own.filter(s => s.type === 'muscle')) if (!r.muscleGroups?.[m.group]) fail(`${m.id}: muscle group ${m.group} not in ${r.id} muscleGroups`);
  const organGroups = new Set((r.organGroups || []).map(([g]) => g));
  for (const o of own.filter(s => s.type === 'organ')) if (!organGroups.has(o.group)) fail(`${o.id}: organ group ${o.group} not listed in ${r.id} meta`);
  for (const [g, label] of r.organGroups || []) if (!label?.en || !label?.de) fail(`region ${r.id}: organ group ${g} needs en and de labels`);
  if (r.camera?.target?.length !== 3 || r.camera?.position?.length !== 3) fail(`region ${r.id} has no camera`);
  // context: structures of other regions shown for orientation (bones, and e.g. the phrenic nerve in the thorax)
  for (const id of r.context || []) if (!byId[id] || byId[id].region === r.id) fail(`region ${r.id}: context "${id}" is not a structure of another region`);
}

// a muscle lists each nerve once, an organ each nerve once per fibre kind (otherwise the graph gets duplicate edge ids)
for (const s of structures.filter(s => s.type === 'muscle' || s.type === 'organ')) {
  const ns = s.nerves.map(inn => inn.n + (inn.kind ? ':' + inn.kind : ''));
  if (new Set(ns).size !== ns.length) fail(`${s.id} lists a nerve twice`);
}

// every relation points at a real structure
for (const r of relations) {
  if (!byId[r.from]) fail(`relation ${r.type}: unknown from "${r.from}"`);
  if (!byId[r.to]) fail(`relation ${r.type}: unknown to "${r.to}"`);
}

for (const s of structures) {
  for (const k of ['en', 'de', 'la']) if (!s.name?.[k]) fail(`${s.id} missing name.${k}`);
  if (!s.info && s.type !== 'muscle') fail(`${s.id} missing info`);
  if (s.type === 'muscle') {
    if (!s.nerves.length) fail(`${s.id} has no nerve`);
    if (!s.arteries.length) fail(`${s.id} has no artery`);
    for (const k of ['origin', 'insertion', 'action']) if (!s[k]?.en || !s[k]?.de) fail(`${s.id} missing ${k}`);
    for (const inn of s.nerves) {
      const n = byId[inn.n];
      if (!n || n.type !== 'nerve') { fail(`${s.id}: ${inn.n} is not a nerve`); continue; }
      for (const seg of inn.seg) if (!n.segs.includes(seg)) fail(`${s.id}: segment ${seg} not carried by ${inn.n} (${n.segs})`);
    }
    if (!s.shape?.fibers?.length) fail(`${s.id} has no 3D shape`);
  }
  // a nerve or artery is drawn from `path`, or from `paths` (several segmental branches)
  const hasPath = s => s.paths ? s.paths.length && s.paths.every(p => p.length >= 2 && p.every(pt => pt.length === 3 && pt.every(Number.isFinite)))
    : s.path?.length >= 2 && s.path.every(pt => pt.length === 3 && pt.every(Number.isFinite));
  if (s.type === 'nerve') {
    if (!hasPath(s)) fail(`${s.id} has no path`);
    // child segments must be a subset of the union of parent segments
    if (s.parents.length) {
      const up = new Set(s.parents.flatMap(p => byId[p]?.segs || []));
      for (const seg of s.segs) if (!up.has(seg)) fail(`${s.id}: segment ${seg} not in parents ${s.parents}`);
    }
  }
  if (s.type === 'artery' && !hasPath(s)) fail(`${s.id} has no path`);
  if (s.type === 'artery') for (const p of s.parents) if (byId[p]?.type !== 'artery') fail(`${s.id}: parent ${p} is not an artery`);
  if (s.type === 'organ') {
    if (!s.info?.en || !s.info?.de) fail(`${s.id} missing info (function)`);
    if (s.lesion && (!s.lesion.en || !s.lesion.de)) fail(`${s.id} clinical note needs en and de`);
    for (const inn of s.nerves) {
      const n = byId[inn.n];
      if (!n || n.type !== 'nerve') { fail(`${s.id}: ${inn.n} is not a nerve`); continue; }
      if (!['sympathetic', 'parasympathetic', 'sensory'].includes(inn.kind)) fail(`${s.id}: unknown fibre kind ${inn.kind}`);
      if (!inn.seg?.length) fail(`${s.id}: innervation by ${inn.n} has no segments`);
      for (const seg of inn.seg || []) if (!n.segs.includes(seg)) fail(`${s.id}: segment ${seg} not carried by ${inn.n} (${n.segs})`);
    }
    // a whole organ needs nerves and arteries; parts (heart chambers, valves) may inherit them from the whole
    if (!s.partOf && !s.nerves.length) fail(`${s.id} has no innervation`);
    if (!s.partOf && !s.arteries.length) fail(`${s.id} has no arterial supply`);
    for (const a of s.arteries) if (byId[a]?.type !== 'artery') fail(`${s.id}: ${a} is not an artery`);
    for (const v of s.veins) if (byId[v]?.type !== 'vein') fail(`${s.id}: ${v} is not a vein`);
    if (s.partOf && byId[s.partOf]?.type !== 'organ') fail(`${s.id}: partOf ${s.partOf} is not an organ`);
    const finite = pt => pt?.length === 3 && pt.every(Number.isFinite);
    const sh = s.shape || {};
    const prims = [...(sh.ellipsoids || []), ...(sh.spheres || []), ...(sh.tubes || []), ...(sh.rings || [])];
    if (!prims.length) fail(`${s.id} has no 3D shape`);
    for (const [c, size, axis] of sh.ellipsoids || []) if (!finite(c) || !finite(size) || (axis && !finite(axis))) fail(`${s.id} has a broken ellipsoid`);
    for (const [c, r] of sh.spheres || []) if (!finite(c) || !(r > 0)) fail(`${s.id} has a broken sphere`);
    for (const [pts, r] of sh.tubes || []) if (pts.length < 2 || !pts.every(finite) || !(r > 0)) fail(`${s.id} has a broken tube`);
    for (const [c, r, nrm] of sh.rings || []) if (!finite(c) || !(r > 0) || !finite(nrm)) fail(`${s.id} has a broken ring`);
  }
  if (s.type === 'vein') {
    if (!hasPath(s)) fail(`${s.id} has no path`);
    if (!s.parents.length) fail(`${s.id} drains nowhere`);
    for (const p of s.parents) if (!['vein', 'organ'].includes(byId[p]?.type)) fail(`${s.id}: drains into ${p}, which is not a vein or organ`);
  }
  if (s.type === 'muscle' && s.shape?.fibers?.some(f => f.length < 2 || f.some(pt => pt.length !== 3 || !pt.every(Number.isFinite)))) fail(`${s.id} has a broken fibre`);
}
ok(`${structures.length} structures, ${relations.length} relations checked`);

// lesion cases
function expect(nerve, expectations) {
  const res = computeLesion(nerve);
  const status = Object.fromEntries(res.muscles.map(m => [m.id, m.status]));
  for (const [muscle, want] of Object.entries(expectations)) {
    const got = status[muscle] || 'unaffected';
    if (got !== want) fail(`lesion ${nerve}: ${muscle} expected ${want}, got ${got}`);
  }
  ok(`lesion ${nerve}: ${res.muscles.length} muscles affected`);
}

expect('trunk_sup', {
  deltoid: 'paralysed', supraspinatus: 'paralysed', infraspinatus: 'paralysed', teres_minor: 'paralysed',
  biceps_brachii: 'paralysed', brachioradialis: 'paralysed', brachialis: 'weakened',
  serratus_anterior: 'unaffected', interossei: 'unaffected', rhomboid_major: 'unaffected'
});
expect('n_radial', {
  extensor_carpi_radialis_longus: 'paralysed', extensor_carpi_radialis_brevis: 'paralysed',
  extensor_digitorum: 'paralysed', extensor_carpi_ulnaris: 'paralysed', brachioradialis: 'paralysed',
  triceps_brachii: 'paralysed', brachialis: 'weakened', flexor_carpi_ulnaris: 'unaffected', deltoid: 'unaffected'
});
expect('n_radial_deep', { extensor_digitorum: 'paralysed', extensor_carpi_radialis_longus: 'unaffected', triceps_brachii: 'unaffected' });
expect('n_ulnar', {
  interossei: 'paralysed', lumbricals_3_4: 'paralysed', adductor_pollicis: 'paralysed', hypothenar: 'paralysed',
  flexor_carpi_ulnaris: 'paralysed', flexor_digitorum_profundus: 'weakened', thenar: 'weakened', lumbricals_1_2: 'unaffected'
});
expect('n_median', {
  pronator_teres: 'paralysed', flexor_digitorum_superficialis: 'paralysed', flexor_pollicis_longus: 'paralysed',
  lumbricals_1_2: 'paralysed', thenar: 'weakened', flexor_digitorum_profundus: 'weakened', flexor_carpi_ulnaris: 'unaffected'
});
expect('trunk_inf', {
  interossei: 'paralysed', hypothenar: 'paralysed', adductor_pollicis: 'paralysed', lumbricals_1_2: 'paralysed',
  thenar: 'paralysed', deltoid: 'unaffected', biceps_brachii: 'unaffected', flexor_digitorum_superficialis: 'weakened'
});
expect('n_long_thoracic', { serratus_anterior: 'paralysed', rhomboid_major: 'unaffected' });
expect('n_axillary', { deltoid: 'paralysed', teres_minor: 'paralysed', supraspinatus: 'unaffected' });
expect('root_C5', { rhomboid_major: 'paralysed', deltoid: 'weakened', levator_scapulae: 'weakened', interossei: 'unaffected' });
expect('cord_post', { deltoid: 'paralysed', latissimus_dorsi: 'paralysed', extensor_digitorum: 'paralysed', biceps_brachii: 'unaffected' });

// lower limb
expect('n_common_fibular', {
  tibialis_anterior: 'paralysed', extensor_hallucis_longus: 'paralysed', extensor_digitorum_longus: 'paralysed',
  extensor_digitorum_brevis: 'paralysed', fibularis_longus: 'paralysed', fibularis_brevis: 'paralysed',
  tibialis_posterior: 'unaffected', gastrocnemius: 'unaffected', biceps_femoris: 'unaffected'
});
expect('n_deep_fibular', { tibialis_anterior: 'paralysed', fibularis_longus: 'unaffected' });
expect('n_sup_gluteal', { gluteus_medius: 'paralysed', gluteus_minimus: 'paralysed', tensor_fasciae_latae: 'paralysed', gluteus_maximus: 'unaffected' });
expect('n_femoral', {
  rectus_femoris: 'paralysed', vastus_lateralis: 'paralysed', vastus_medialis: 'paralysed', vastus_intermedius: 'paralysed',
  sartorius: 'paralysed', iliopsoas: 'weakened', pectineus: 'weakened', adductor_longus: 'unaffected'
});
expect('n_obturator', {
  adductor_longus: 'paralysed', adductor_brevis: 'paralysed', gracilis: 'paralysed', obturator_externus: 'paralysed',
  adductor_magnus: 'weakened', pectineus: 'weakened'
});
expect('n_sciatic', {
  biceps_femoris: 'paralysed', semitendinosus: 'paralysed', semimembranosus: 'paralysed', gastrocnemius: 'paralysed',
  tibialis_anterior: 'paralysed', adductor_magnus: 'weakened', gluteus_maximus: 'unaffected', rectus_femoris: 'unaffected'
});
expect('n_tibial', {
  gastrocnemius: 'paralysed', soleus: 'paralysed', tibialis_posterior: 'paralysed', interossei_foot: 'paralysed',
  tibialis_anterior: 'unaffected', semitendinosus: 'unaffected'
});
expect('root_L5', { extensor_hallucis_longus: 'weakened', gluteus_medius: 'weakened', tibialis_anterior: 'weakened', rectus_femoris: 'unaffected' });
expect('trunk_lumbosacral', { tibialis_anterior: 'paralysed' });

// back and trunk wall
expect('n_phrenic', { diaphragm: 'paralysed', rectus_abdominis: 'unaffected' });
expect('n_suboccipital', { rectus_capitis_posterior_major: 'paralysed', obliquus_capitis_inferior: 'paralysed', semispinalis: 'unaffected' });
expect('n_medial_branches', { multifidus: 'paralysed', rotatores: 'paralysed', iliocostalis: 'unaffected', splenius: 'unaffected' });
expect('n_lateral_branches', { iliocostalis: 'paralysed', splenius: 'paralysed', multifidus: 'unaffected' });
expect('dr_thoracic', { rotatores: 'paralysed', multifidus: 'weakened', external_intercostals: 'unaffected' });
expect('n_thoracoabdominal', { rectus_abdominis: 'weakened', diaphragm: 'unaffected' });
expect('sn_thoracic', { rectus_abdominis: 'paralysed', serratus_posterior_superior: 'paralysed', internal_oblique: 'weakened', diaphragm: 'unaffected' });
expect('n_iliohypogastric', { internal_oblique: 'weakened' });
expect('n_subcostal', { quadratus_lumborum: 'weakened' });

// thorax: organs lose sympathetic, parasympathetic or sensory supply
function expectOrgans(nerve, expectations) {
  const res = computeLesion(nerve);
  const organs = Object.fromEntries(res.organs.map(o => [o.id, o]));
  for (const [organ, want] of Object.entries(expectations)) {
    const o = organs[organ];
    const [status, kinds] = Array.isArray(want) ? want : [want, {}];
    const got = o?.status || 'unaffected';
    if (got !== status) fail(`lesion ${nerve}: ${organ} expected ${status}, got ${got}`);
    for (const [kind, k] of Object.entries(kinds)) if (o?.kinds[kind] !== k) fail(`lesion ${nerve}: ${organ} ${kind} expected ${k}, got ${o?.kinds[kind]}`);
  }
  ok(`lesion ${nerve}: ${res.organs.length} organs affected`);
}

expectOrgans('n_vagus', {
  heart: ['partial', { parasympathetic: 'lost' }], oesophagus_thoracic: ['partial', { parasympathetic: 'lost', sympathetic: undefined }],
  lung_right: ['partial', { parasympathetic: 'lost' }], thymus: ['partial', { parasympathetic: 'lost' }], pericardium: 'unaffected'
});
expectOrgans('n_sympathetic_trunk', { heart: ['partial', { sympathetic: 'lost' }], trachea: ['partial', { sympathetic: 'lost' }], pericardium: 'unaffected' });
expectOrgans('n_cardiac_plexus', { heart: 'denervated', conducting_system: 'denervated', lung_right: 'unaffected', oesophagus_thoracic: 'unaffected' });
expectOrgans('n_recurrent_laryngeal_left', {
  trachea: ['partial', { parasympathetic: 'reduced' }], oesophagus_thoracic: ['partial', { parasympathetic: 'reduced' }], heart: 'unaffected'
});
expectOrgans('n_phrenic', { pericardium: 'denervated', pleura: ['partial', { sensory: 'reduced' }], heart: 'unaffected' });
expect('n_phrenic', { diaphragm: 'paralysed' });
expectOrgans('n_greater_splanchnic', { heart: 'unaffected', lung_left: 'unaffected', oesophagus_thoracic: 'unaffected' });
expectOrgans('n_intercostal_upper', { pleura: ['partial', { sensory: 'reduced' }] });

// abdomen: foregut, midgut and hindgut plexuses, vagal trunks and referred-pain nerves
expectOrgans('n_vagus', {
  stomach: ['partial', { parasympathetic: 'lost', sympathetic: undefined }], jejunum: ['partial', { parasympathetic: 'lost' }],
  spleen: 'unaffected', sigmoid_colon: 'unaffected'
});
expectOrgans('n_greater_splanchnic', {
  stomach: ['partial', { sympathetic: 'lost' }], spleen: 'denervated', jejunum: ['partial', { sympathetic: 'reduced' }], kidneys: 'unaffected'
});
expectOrgans('n_coeliac_plexus', {
  stomach: ['partial', { sympathetic: 'lost', parasympathetic: undefined }], pancreas: 'denervated',
  jejunum: ['partial', { parasympathetic: 'lost', sympathetic: 'reduced' }]
});
expectOrgans('n_superior_mesenteric_plexus', {
  jejunum: 'denervated', appendix: 'denervated', transverse_colon: ['partial', { sympathetic: 'reduced', parasympathetic: 'reduced' }],
  descending_colon: 'unaffected'
});
expectOrgans('n_inferior_mesenteric_plexus', {
  sigmoid_colon: ['partial', { sympathetic: 'lost', parasympathetic: undefined }], ureters: ['partial', { sympathetic: 'reduced' }], jejunum: 'unaffected',
  bladder: ['partial', { sympathetic: 'lost', parasympathetic: undefined }]
});
expectOrgans('n_lesser_splanchnic', { appendix: ['partial', { sympathetic: 'lost' }], kidneys: ['partial', { sympathetic: 'reduced' }] });
expectOrgans('n_phrenic', { gallbladder: ['partial', { sensory: 'lost' }], liver: ['partial', { sensory: 'lost' }], peritoneum: ['partial', { sensory: 'reduced' }] });
expectOrgans('n_thoracoabdominal', { peritoneum: ['partial', { sensory: 'reduced' }], stomach: 'unaffected' });
expectOrgans('n_vagal_trunk_anterior', { liver: ['partial', { parasympathetic: 'lost' }], stomach: ['partial', { parasympathetic: 'reduced' }] });

// pelvis: pudendal nerve, pelvic floor nerves and the pelvic autonomic nerves
expect('n_pudendal', {
  external_anal_sphincter: 'paralysed', external_urethral_sphincter: 'paralysed', bulbospongiosus: 'paralysed', ischiocavernosus: 'paralysed',
  superficial_transverse_perineal: 'paralysed', deep_transverse_perineal: 'paralysed', puborectalis: 'weakened',
  pubococcygeus: 'unaffected', iliococcygeus: 'unaffected', coccygeus: 'unaffected'
});
expect('n_levator_ani', { pubococcygeus: 'paralysed', puborectalis: 'weakened', iliococcygeus: 'weakened', external_anal_sphincter: 'unaffected' });
expect('n_perineal', { bulbospongiosus: 'paralysed', external_urethral_sphincter: 'paralysed', external_anal_sphincter: 'unaffected' });
expect('n_inferior_rectal', { external_anal_sphincter: 'paralysed', bulbospongiosus: 'unaffected' });
expect('root_S4', { external_anal_sphincter: 'weakened', coccygeus: 'weakened', pubococcygeus: 'weakened' });
expectOrgans('n_pudendal', {
  anal_canal: ['partial', { sensory: 'lost', parasympathetic: undefined }], penis: ['partial', { sensory: 'lost', parasympathetic: undefined }],
  urethra_female: ['partial', { sensory: 'lost' }], bladder: 'unaffected'
});
expectOrgans('n_pelvic_splanchnic', {
  bladder: ['partial', { parasympathetic: 'lost', sensory: 'reduced', sympathetic: undefined }], penis: ['partial', { parasympathetic: 'lost' }],
  rectum: ['partial', { parasympathetic: 'lost' }], sigmoid_colon: ['partial', { parasympathetic: 'lost' }], ovaries: 'unaffected'
});
expectOrgans('n_hypogastric', {
  bladder: ['partial', { sympathetic: 'lost', sensory: 'reduced', parasympathetic: undefined }], ductus_deferens: 'denervated', testis: 'unaffected'
});
expectOrgans('n_inferior_hypogastric_plexus', { prostate: 'denervated', bladder: ['partial', { sensory: 'reduced' }], anal_canal: ['partial', { sensory: undefined }] });
expectOrgans('n_cavernous', { penis: ['partial', { parasympathetic: 'lost', sympathetic: 'lost', sensory: undefined }], prostate: 'unaffected' });
expectOrgans('root_S3', { bladder: ['partial', { parasympathetic: 'reduced' }] });

// head and neck: cranial nerves, peripheral vs central facial palsy, laryngeal nerves, ansa cervicalis
expect('n_facial', {
  frontalis: 'paralysed', orbicularis_oculi: 'paralysed', orbicularis_oris: 'paralysed', buccinator: 'paralysed', platysma: 'paralysed',
  stapedius: 'paralysed', stylohyoid: 'paralysed', digastric: 'weakened', masseter: 'unaffected'
});
expectOrgans('n_facial', {
  lacrimal_gland: ['partial', { parasympathetic: 'lost' }], submandibular_gland: ['partial', { parasympathetic: 'lost' }],
  tongue: ['partial', { sensory: 'reduced' }]
});
expect('n_corticonuclear_facial', {
  orbicularis_oris: 'paralysed', zygomaticus_major: 'paralysed', depressor_anguli_oris: 'paralysed', buccinator: 'paralysed',
  frontalis: 'unaffected', orbicularis_oculi: 'weakened', stapedius: 'unaffected'
});
expect('n_parotid_plexus', { frontalis: 'paralysed', orbicularis_oris: 'paralysed', stapedius: 'unaffected', digastric: 'unaffected' });
expect('n_oculomotor', {
  superior_rectus: 'paralysed', inferior_rectus: 'paralysed', medial_rectus: 'paralysed', inferior_oblique: 'paralysed',
  levator_palpebrae: 'paralysed', lateral_rectus: 'unaffected', superior_oblique: 'unaffected'
});
expectOrgans('n_oculomotor', { eye: ['partial', { parasympathetic: 'lost' }] });
expect('n_abducens', { lateral_rectus: 'paralysed', medial_rectus: 'unaffected', superior_oblique: 'unaffected' });
expect('n_trochlear', { superior_oblique: 'paralysed', lateral_rectus: 'unaffected', inferior_oblique: 'unaffected' });
expect('n_hypoglossal', {
  genioglossus: 'paralysed', hyoglossus: 'paralysed', styloglossus: 'paralysed', intrinsic_tongue: 'paralysed',
  palatoglossus: 'unaffected', geniohyoid: 'unaffected'
});
expect('n_accessory', { sternocleidomastoid: 'paralysed', trapezius: 'paralysed' });
expect('n_recurrent_laryngeal_left', {
  posterior_cricoarytenoid: 'paralysed', lateral_cricoarytenoid: 'paralysed', vocalis: 'paralysed', cricothyroid: 'unaffected',
  inferior_constrictor: 'weakened'
});
expectOrgans('n_recurrent_laryngeal_left', { larynx: ['partial', { sensory: 'reduced' }] });
expect('n_external_laryngeal', { cricothyroid: 'paralysed', posterior_cricoarytenoid: 'unaffected' });
expect('n_vagus', {
  levator_veli_palatini: 'paralysed', superior_constrictor: 'paralysed', inferior_constrictor: 'paralysed', palatoglossus: 'paralysed',
  cricothyroid: 'paralysed', posterior_cricoarytenoid: 'paralysed', vocalis: 'paralysed', stylopharyngeus: 'unaffected'
});
expect('n_mandibular', {
  masseter: 'paralysed', temporalis: 'paralysed', medial_pterygoid: 'paralysed', lateral_pterygoid: 'paralysed', mylohyoid: 'paralysed',
  digastric: 'weakened', buccinator: 'unaffected'
});
expectOrgans('n_mandibular', { parotid_gland: ['partial', { sensory: 'reduced' }] });
expect('n_glossopharyngeal', { stylopharyngeus: 'paralysed', masseter: 'unaffected' });
expectOrgans('n_glossopharyngeal', { parotid_gland: ['partial', { parasympathetic: 'lost' }] });
expect('n_ansa_cervicalis', { sternohyoid: 'paralysed', sternothyroid: 'paralysed', omohyoid: 'paralysed', thyrohyoid: 'unaffected' });
expect('n_plexus_cervical', {
  geniohyoid: 'paralysed', thyrohyoid: 'paralysed', sternohyoid: 'paralysed', diaphragm: 'weakened', levator_scapulae: 'weakened',
  scalenus_anterior: 'unaffected'
});
expect('n_cervical_sympathetic', { superior_tarsal: 'paralysed', levator_palpebrae: 'unaffected' });
expectOrgans('n_cervical_sympathetic', { eye: ['partial', { sympathetic: 'lost' }] });

// Quiz: every generated question has 4 distinct options including the answer, all from the region
// (or its context structures).
const { makeQuestion, quizTypesFor } = await import('../js/quiz.js');
let badQuiz = 0, count = 0;
for (const r of BODY_REGIONS.filter(r => r.available)) {
  const region = r.id;
  const local = id => byId[id].region === region || (r.context || []).includes(id);
  if (r.organGroups && !quizTypesFor(region).includes('supply')) fail(`quiz ${region}: no organ supply questions`);
  for (const type of quizTypesFor(region)) {
    for (const lang of ['en', 'de']) {
      for (let i = 0; i < 300; i++, count++) {
        const q = makeQuestion(type, lang, region);
        const ids = q.options.map(o => o.id);
        if (ids.length !== 4 || new Set(ids).size !== 4 || !ids.includes(q.answer) || !ids.every(local)) {
          if (badQuiz++ < 5) console.error(`FAIL quiz ${region}/${type}/${lang}: ${ids.join(',')} answer ${q.answer}`);
        }
      }
    }
  }
}
if (badQuiz) failures++; else console.log(`ok   quiz: ${count} generated questions well-formed`);

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nall checks passed');
