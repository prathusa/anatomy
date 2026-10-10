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
  if (r.camera?.target?.length !== 3 || r.camera?.position?.length !== 3) fail(`region ${r.id} has no camera`);
  for (const id of r.context || []) if (byId[id]?.type !== 'bone' || byId[id].region === r.id) fail(`region ${r.id}: context "${id}" is not a bone of another region`);
}

// a muscle lists each nerve once (otherwise the graph gets duplicate edge ids)
for (const s of structures.filter(s => s.type === 'muscle')) {
  const ns = s.nerves.map(inn => inn.n);
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

// Quiz: every generated question has 4 distinct options including the answer, all from the region.
const { makeQuestion, QUIZ_TYPES } = await import('../js/quiz.js');
let badQuiz = 0, count = 0;
for (const region of BODY_REGIONS.filter(r => r.available).map(r => r.id)) {
  for (const type of QUIZ_TYPES) {
    for (const lang of ['en', 'de']) {
      for (let i = 0; i < 300; i++, count++) {
        const q = makeQuestion(type, lang, region);
        const ids = q.options.map(o => o.id);
        if (ids.length !== 4 || new Set(ids).size !== 4 || !ids.includes(q.answer) || ids.some(id => byId[id].region !== region)) {
          if (badQuiz++ < 5) console.error(`FAIL quiz ${region}/${type}/${lang}: ${ids.join(',')} answer ${q.answer}`);
        }
      }
    }
  }
}
if (badQuiz) failures++; else console.log(`ok   quiz: ${count} generated questions well-formed`);

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nall checks passed');
