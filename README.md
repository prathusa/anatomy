# Anatomy · Anatomie

A free, interactive anatomy study tool in **English, German and Latin**.
It is built for people who learn anatomy by tracing the **connections**: which nerve supplies which muscle or organ, which segments it carries, which artery feeds it, and what is lost when a nerve is cut.

The site is built **region by region**. The **upper limb**, the **lower limb**, the **back and trunk wall** and the **thorax** are complete; the rest of the body follows piece by piece (see [Roadmap](#roadmap)). Switch regions with the menu at the top.

*Kostenloses, interaktives Lernwerkzeug für Anatomie auf Deutsch, Englisch und Latein. Es zeigt, wie Nerven, Muskeln, Organe, Knochen, Arterien und Venen zusammenhängen und was bei einer Nervenläsion ausfällt. Die Seite wächst Region für Region; obere und untere Extremität, Rücken und Rumpfwand sowie der Thorax sind fertig.*

## Features

- **3D view**: a schematic model of each region. Rotate, zoom, hover for names, click to select, and toggle each layer on or off.
  - Upper limb: 8 bones, 49 muscles or muscle groups, 28 nerves (brachial plexus roots to terminal branches) and 20 arteries.
  - Lower limb: 9 bones, 39 muscles or muscle groups, 31 nerves (lumbosacral plexus roots to terminal branches) and 17 arteries.
  - Back and trunk wall: 6 bones (vertebral column, ribs, sternum, occipital bone), 24 muscles or muscle groups (intrinsic back muscles, suboccipital muscles, thoracic wall, diaphragm, abdominal wall), 18 nerves (spinal nerves, dorsal rami and their branches, intercostal, subcostal and phrenic nerves) and 15 arteries.
  - Thorax: 15 organs (heart with its chambers, valves and conducting system; pericardium, lungs, pleura, trachea, main bronchi, oesophagus, thymus), 16 arteries (aorta and its arch branches, coronary and pulmonary arteries, bronchial and oesophageal branches), 9 veins (brachiocephalic veins, venae cavae, azygos system, pulmonary veins, coronary sinus) and 9 autonomic nerves (vagus and recurrent laryngeal nerves, sympathetic trunk, splanchnic nerves, cardiac, pulmonary and oesophageal plexuses).
  - Neighbouring structures from other regions are shown for orientation: e.g. the spine and ribs in the upper limb, the hip bone in the back, and the chest wall, diaphragm, phrenic nerve, thoracic aorta and subclavian arteries in the thorax.
- **Explore**: each structure has a card. All names are shown in DE, EN and Latin.
  - Muscles: origin, insertion and action, innervation with spinal segments, arterial supply and a clinical note.
  - Organs: function, parts, sympathetic, parasympathetic and sensory innervation with segments, blood supply, venous drainage and a clinical note.
  - Veins: what they drain into and which veins they receive.
- **Connection graph**: the graph has three views:
  - the selected structure's neighbourhood;
  - the region's whole plexus (brachial, lumbosacral, the spinal nerves and their rami, or the autonomic nerves of the thorax);
  - the plexus down to its muscles or organs, with edges coloured by sympathetic, parasympathetic and sensory fibres.
  An enlarge button (⤢) gives a full-screen view.
- **Lesion simulator**: cut any root, part of the plexus or nerve. Muscles turn red if paralysed and orange if weakened, each with the segments it lost. The rule is that only segments carried by the cut nerve are lost: a muscle is paralysed when every innervation it has is lost, and weakened when only some are. Organs work the same way per kind of fibre: an organ is denervated when all its innervation is lost and partly denervated otherwise, and the card names which kind (sympathetic, parasympathetic, sensory) is lost or reduced. A clinical picture is included, e.g. wrist drop, claw hand, Erb and Klumpke palsy, foot drop, Trendelenburg sign, phrenic nerve palsy, herpes zoster, recurrent laryngeal nerve palsy, Horner syndrome.
- **Quiz**: six question types, drawn from the current region (only the types that fit the region are offered):
  - name the highlighted structure;
  - which nerve supplies a muscle;
  - which muscle is paralysed after a given lesion;
  - DE ↔ EN translation;
  - which muscle performs a given action;
  - which artery or nerve supplies an organ.
- **Links**: URLs can be shared and bookmarked, e.g. `#explore/n_ulnar`, `#lesion/n_common_fibular`, `#quiz/lower_limb`, `#lesion/n_vagus`.

## Roadmap

| # | Region | Status |
| --- | --- | --- |
| 1 | Upper limb · Obere Extremität | ✅ available |
| 2 | Lower limb · Untere Extremität | ✅ available |
| 3 | Back and trunk wall · Rücken und Rumpfwand | ✅ available |
| 4 | Thorax | ✅ available |
| 5 | Abdomen | planned |
| 6 | Pelvis · Becken | planned |
| 7 | Head and neck · Kopf und Hals | planned |
| 8 | Neuroanatomy · Neuroanatomie | planned |

The order follows the usual German preclinical sequence (Bewegungsapparat → Situs → Kopf/Hals → Neuroanatomie) and can change to match what is being studied.
The planned regions are listed in the site's region menu as "coming soon".

## Run locally

No build step and no dependencies to install: it is a static site.

```bash
python3 test/serve.py 8000      # then open http://127.0.0.1:8000
node test/validate.mjs          # data integrity + lesion-model + quiz checks
```

Any static web server works; `test/serve.py` additionally disables caching for development.
To publish it, copy the folder to any static host, e.g. GitHub Pages or Netlify.

## Project layout

| Path | Contents |
| --- | --- |
| `js/regions/upper-limb.js`, `lower-limb.js`, `back.js`, `thorax.js` | Region data: names in EN/DE/Latin, attachments, actions or organ functions, innervation and segments, supply and drainage, 3D geometry, and region settings (`meta`) |
| `js/data.js` | Region registry and roadmap: merges all region modules and builds the relations between structures |
| `js/lesion.js` | Lesion model: which segments are lost downstream of a cut, which muscles are paralysed or weakened, and which organs are denervated or partly denervated |
| `js/viewer3d.js` | three.js scene |
| `js/graph.js` | Cytoscape connection graph |
| `js/quiz.js` | Question generators |
| `js/i18n.js` | UI strings in DE and EN |
| `test/validate.mjs` | Checks unique ids across regions, every relation, every name in all 3 languages, that each muscle's and organ's segments are carried by its nerve, organ and vein data, each region's settings, 35 lesion cases with known answers (28 muscle, 7 organ), and 10,800 generated quiz questions |

### Adding a region

1. Create `js/regions/<region>.js` exporting `structures`, `muscleGroups` and `meta` (start structure, plexus name, nerve list groups, home camera), in the same format as `lower-limb.js`.
   - `meta.context` (optional) lists structures from other regions to show for orientation; `meta.contextOpacity` fades them.
   - A nerve or artery made of several separate segmental branches can use `paths` (a list of polylines) instead of `path`.
   - A structure may name a parent or innervating nerve from another region (e.g. the abdominal wall muscles name the iliohypogastric nerve); a muscle's first nerve must be in its own region.
   - Organs (`type: 'organ'`, see `thorax.js`) list `nerves` with a `kind` (sympathetic, parasympathetic, sensory), `arteries`, `veins`, an optional `partOf`, and a `shape` made of ellipsoids, spheres, tubes and rings. Their list groups come from `meta.organGroups`; `meta.plexusTargets` renames the "plexus → muscles" graph view.
   - Veins (`type: 'vein'`) name the vein or organ they drain into as `parents`.
2. Import it in `js/data.js` and mark the region `available` in `BODY_REGIONS`.
3. Add its lesion cases to `test/validate.mjs` and run the checks.

## Accuracy and sources

Content follows standard textbook teaching, chiefly Moore's *Clinically Oriented Anatomy* and the *Prometheus LernAtlas*. German names follow common usage in German lectures.
Segmental innervation varies by about one segment between sources and between individuals. Check against the atlas your course uses.
The 3D model is **schematic**: positions and courses are simplified to show relationships, not exact morphology.

**This is a learning aid only and is not for clinical decisions.** Corrections are welcome: please open an issue that names the structure and cites a source.

## Licence

- Code is under the MIT licence.
- Anatomical content (texts and data in `js/regions/`, `js/data.js` and `js/i18n.js`) is under CC BY 4.0.
- See [LICENSE](LICENSE).
- Third-party libraries in `vendor/` keep their own licences:
  - three.js r170 (MIT);
  - Cytoscape.js 3.30.4 (MIT).
