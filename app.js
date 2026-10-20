/* Pizza Lab v3 — UI + recipe logic. Requires model.js (window.PizzaModel). */
'use strict';
const M = window.PizzaModel;
const $ = (id) => document.getElementById(id);
const clamp = M.clamp;
const round = (n, d = 1) => Number(Number(n).toFixed(d));
const pct = (n, d = 2) => `${round(n, d)}%`;
const grams = (n) => `${n < 10 ? round(n, 2) : round(n, 1)} g`;
const deg = (n, d = 1) => `${round(n, d)} °C`;
const esc = (s) => String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

// ---------- safe storage ----------
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* storage unavailable */ } }
};

// ---------- sources ----------
const SRC = {
  avpn: 'https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf',
  avpnRecipe: 'https://www.pizzanapoletana.org/en/ricetta_pizza_napoletana',
  fsanz: 'https://www.foodstandards.gov.au/business/safety/factsheets/charitiesandcommunityorganisationsfactsheets/temperaturecontrol',
  caputoRange: 'https://www.mulinocaputo.it/en/product-category/pizza-flour/',
  caputoPizzeria: 'https://www.mulinocaputo.it/en/products/pizzeria/',
  caputoNuvola: 'https://www.mulinocaputo.it/en/products/nuvola/',
  vorwerkTm7: 'https://globalsupport.vorwerk.com/hc/en-us/articles/22779771378076-What-to-know-about-functionalities-and-modes-of-TM7',
  vorwerkSpecs: 'https://globalsupport.vorwerk.com/hc/en-us/articles/18535706925724-What-are-the-technical-specifications-of-the-new-Thermomix-TM7',
  ooniNeo: 'https://au.ooni.com/blogs/recipes/ooni-neapolitan-style-pizza-dough',
  ooniForkish: 'https://au.ooni.com/blogs/recipes/ken-forkishs-i-slept-in-but-i-want-pizza-tonight-dough',
  ooniClassic: 'https://au.ooni.com/blogs/recipes/classic-pizza-dough',
  ooniNY: 'https://au.ooni.com/blogs/recipes/new-york-style-pizza-dough',
  ooniPoolish: 'https://au.ooni.com/blogs/recipes/our-best-poolish-dough',
  ooniBiga: 'https://au.ooni.com/blogs/recipes/100-biga',
  ooniDetroit: 'https://au.ooni.com/blogs/recipes/ooni-detroit-style-pizza-dough-using-halo-pro',
  gozneyProof: 'https://au.gozney.com/blogs/academy/how-to-proof-pizza-dough',
  kaPro: 'https://www.kingarthurbaking.com/pro/reference/dough-temperature',
  kaDdt: 'https://www.kingarthurbaking.com/blog/2018/05/29/desired-dough-temperature',
  kaFriction: 'https://www.kingarthurbaking.com/blog/2018/08/27/determining-the-friction-factor-in-baking',
  lehmannWet: 'https://pizzatoday.com/?p=130903',
  pmqHot: 'https://www.pmq.com/hot-stuff-temperatures-explained/',
  pmqOpen: 'https://www.pmq.com/check-your-doughs-temperature-before-opening-it-into-skins/',
  pmqManage: 'https://www.pmq.com/effective-dough-management/',
  pmqMerge: 'https://www.pmq.com/?p=40799',
  modernistCold: 'https://modernistcuisine.com/mp/cold-proofing-pizza-dough/',
  stadlerTemp: 'https://www.stadlermade.com/pizza/techniques/dough-temperature/',
  stadlerCold: 'https://www.stadlermade.com/pizza/techniques/cold-fermentation/',
  rule55: 'https://www.scattidigusto.it/2011/12/02/lezioni-di-pizza-lacqua-la-regola-del-55-sale-e-grassi/',
  ips: 'https://www.italianpizzasecrets.com/pizza-tools-recipe-calculator-kneading-pizza-dough/pizza-kneading-temperaturecalculator/',
  thermapen: 'https://thermapen.co.uk/blogs/inspiration/pizza-dough-guide',
  homebaking: 'https://www.homebaking.at/en/knetmaschinentest-thermomix/',
  atk8: 'https://www.americastestkitchen.com/recipes/2816-eight-hour-pizza-dough',
  innograin: 'https://innograin.uva.es/en/2024/01/08/controlled-or-retarded-fermentation/',
  unitbv: 'https://webbut.unitbv.ro/index.php/Series_II/article/download/1534/1382',
  kuYeast: 'https://test01.ku.dk/:obvius/pureproxy/3974268/da/publications/expansion-profiles-of-wheat-doughs-fermented-by-seven-commercial-',
  craigChart: 'https://www.pizzamaking.com/forum/index.php?msg=274393',
  craigMixed: 'https://www.pizzamaking.com/forum/index.php?topic=32961.0',
  pmFriction: 'https://www.pizzamaking.com/forum/index.php?msg=825091',
  tflFridge: 'https://thefreshloaf.com/comment/436021',
  tflHumidity: 'https://www.thefreshloaf.com/comment/463973'
};

const SOURCE_GROUPS = [
  { title: 'Primary / official', items: [
    ['AVPN International Regulations 2024', SRC.avpn, 'Water 16–22 °C; 12–24 h total fermentation; 0.1–3 g fresh yeast per litre; proof chamber 18–20 °C, 60–70% RH; 00 flour W 250–320; 200–280 g balls; floor 380–430 °C; 60–90 s bake.'],
    ['AVPN official recipe page', SRC.avpnRecipe, '1 L water to 1.6–1.8 kg flour, 40–60 g salt; dry yeast = 1/3 of fresh.'],
    ['Food Standards Australia — temperature control', SRC.fsanz, 'Refrigerated food 5 °C or colder.']
  ]},
  { title: 'Manufacturers', items: [
    ['Mulino Caputo — pizza flour range', SRC.caputoRange, 'Pizzeria W 260–280, P/L 0.50–0.60, leavening 8–12 h. Cloud/Nuvola: 24 h+ and high hydration.'],
    ['Mulino Caputo — Pizzeria', SRC.caputoPizzeria, '00, 12.5% protein; classic Neapolitan at high heat.'],
    ['Mulino Caputo — Nuvola', SRC.caputoNuvola, '0, contemporary / airy rims.'],
    ['Vorwerk — TM7 modes', SRC.vorwerkTm7, 'Dough mode will not start if the bowl is above 60 °C.'],
    ['Vorwerk — TM7 specifications', SRC.vorwerkSpecs, '2.2 L bowl. No official dough-mass limit published.'],
    ['Ooni — Neapolitan-style dough', SRC.ooniNeo, 'Target dough temp 21–23 °C in warm months, 23–26 °C in cool months; bulk 18–20 h at 16–20 °C; balls 5–6 h; halve yeast above 28 °C.'],
    ['Ooni — Ken Forkish “I slept in” dough', SRC.ooniForkish, '0.1% IDY, 64%, 2% salt, same-day 6–8 h.'],
    ['Ooni — Classic, NY, Poolish, 100% Biga', SRC.ooniClassic, 'Style presets and preferment defaults (see also NY, Poolish, Biga pages).'],
    ['Gozney — How to proof pizza dough', SRC.gozneyProof, 'Most doughs roughly double; poke test springs back slowly; overproofed = floppy and sour; temper ~2 h from fridge.']
  ]},
  { title: 'Bakers, trade experts & test kitchens', items: [
    ['King Arthur Pro — Dough temperature', SRC.kaPro, 'Water = 3 × DDT − (flour + room + friction); ×4 with a preferment; friction from a trial batch; DDT 75–78 °F.'],
    ['King Arthur — Desired dough temperature', SRC.kaDdt, 'Hand kneading friction 6–8 °F; KitchenAid 22–24 °F; aim cooler (~73 °F) on hot days.'],
    ['King Arthur — Determining the friction factor', SRC.kaFriction, 'Gentle folds 0–4 °F; Hamelman stand mixers 24–28 °F; tweak FF by the miss each batch.'],
    ['Tom Lehmann — “Get Wet” (Pizza Today)', SRC.lehmannWet, 'Dough temperature is “the key to effective dough management”; water and friction formulas; chill water with ice.'],
    ['PMQ — Temperatures explained (Lehmann)', SRC.pmqHot, 'Ice formula; flour near the mixer = room temperature.'],
    ['PMQ — Dough temperature before opening', SRC.pmqOpen, 'Warm balls to 50 °F (10 °C) before opening; then ~2.5–3 h working window.'],
    ['PMQ — Effective dough management', SRC.pmqManage, 'Box and cool dough within 20 min of mixing; lower dough temp 5–10 °F for reach-in fridges; temper to 50–55 °F.'],
    ['PMQ — Dough balls growing together', SRC.pmqMerge, 'Warm dough that cools slowly ferments fast; cool balls to 50–55 °F before covering.'],
    ['Modernist Cuisine — Cold-proofing pizza dough', SRC.modernistCold, 'Fridge ~4 °C; shape balls before cold-proofing; temper 2 h or to 13 °C.'],
    ['Stadler Made — Dough temperature', SRC.stadlerTemp, 'Ideal dough 20–26 °C; machine friction from a test batch.'],
    ['Stadler Made — Cold fermentation', SRC.stadlerCold, '0.5–1% yeast at ~4 °C for 24–48 h; balls back to ≥18 °C core before baking.'],
    ['Scatti di Gusto — Rule of 55', SRC.rule55, 'Room + flour + water = 55 → about 24 °C finished dough (Italian pizzeria rule of thumb).'],
    ['Italian Pizza Secrets — Kneading temperature', SRC.ips, 'Finish kneading at 23–25 °C (23 drier, 25 wetter doughs).'],
    ['Thermapen — Pizza dough temperature guide', SRC.thermapen, 'Measure air where the dough proofs; probe dough centre for FDT; poke test.'],
    ['homebaking.at — Thermomix kneading test', SRC.homebaking, 'Wheat doughs finished at 27.6–28.5 °C even with 1–4 °C water; 700–850 g best batch; ice cubes don\'t melt in a short knead; autolyse lowers dough temp.'],
    ['America’s Test Kitchen — Eight-hour pizza dough', SRC.atk8, 'Cool room (~20 °C) 8 h rise to double.']
  ]},
  { title: 'Academic', items: [
    ['Innograin (Univ. of Valladolid) — Controlled fermentation', SRC.innograin, 'Yeast slows almost to a standstill near 0 °C; dough is a poor conductor so the centre cools slowly; hold 4–5 °C.'],
    ['Univ. of Brașov — Salt and dough gas production', SRC.unitbv, 'Gas production fell as salt rose (≈1.5% → −15%, ≈3% → −45% vs no salt, single runs).'],
    ['Univ. of Copenhagen — Expansion profiles of 7 baker\'s yeasts', SRC.kuYeast, 'Dough expansion tested at 5–35 °C; fastest at 25 °C; strain matters.']
  ]},
  { title: 'Forums (used last, for practical cross-checks only)', items: [
    ['pizzamaking.com — Craig\'s yeast chart', SRC.craigChart, 'Starting-point chart, reliable ~60–80 °F; aim ~2× rise.'],
    ['pizzamaking.com — Mixed cold/warm schedules', SRC.craigMixed, 'Target 1.7–2.5× rise; pull-out time barely counts.'],
    ['pizzamaking.com — Friction factor ranges', SRC.pmFriction, 'Hand 6–8 °F, spiral 10–20 °F, planetary 20–30 °F.'],
    ['The Fresh Loaf — Fridge fermentation', SRC.tflFridge, 'Dough keeps fermenting while it cools.'],
    ['The Fresh Loaf — Humidity & hydration', SRC.tflHumidity, 'Anecdotal: humid days handle wetter; trim water slightly in summer.']
  ]},
  { title: 'The guide you supplied', items: [
    ['PizzaVibes_BAPI — “Dough Control” (Benjamin Oliver Schmitz)', null, 'Temperature as the system variable; FDT formula; 24 h beginner recipe; error table; Lab Test Protocol.']
  ]}
];

// ---------- styles / flours (v2 data, refined) ----------
const styleProfiles = {
  traditional: { name: 'Traditional Neapolitan', hydration: 60, salt: 3.0, oil: 0, sugar: 0, hydrationRange: [55.6, 62.5], saltRange: [2.2, 3.75], badge: 'source', badgeText: 'SOURCE',
    sourceText: 'AVPN: 1 L water to 1.6–1.8 kg flour, 40–60 g salt, no fat or sugar, 200–280 g balls, 12–24 h total fermentation, water 16–22 °C.', sourceUrl: SRC.avpn },
  contemporary: { name: 'Contemporary Neapolitan', hydration: 65, salt: 3.0, oil: 0, sugar: 0, hydrationRange: [63, 70], saltRange: [2.5, 3.2], badge: 'source', badgeText: 'SOURCE + GUIDANCE',
    sourceText: '65% is Ooni\'s Neapolitan-style formula. The 63–70% working range is Pizza Lab guidance, not an official standard.', sourceUrl: SRC.ooniNeo },
  canotto: { name: 'Canotto / high-hydration', hydration: 70, salt: 2.8, oil: 0, sugar: 0, hydrationRange: [68, 75], saltRange: [2.5, 3.2], badge: 'guidance', badgeText: 'GUIDANCE',
    sourceText: 'Working preset. Flour strength, mixing and temperature control matter more as hydration rises.', sourceUrl: SRC.caputoRange },
  hybrid: { name: 'Modern hybrid', hydration: 68, salt: 2.8, oil: 1.0, sugar: 0, hydrationRange: [65, 72], saltRange: [2.5, 3.2], badge: 'guidance', badgeText: 'GUIDANCE',
    sourceText: 'Working preset for a slightly longer, crisper bake than strict Neapolitan.', sourceUrl: SRC.ooniNeo },
  nyneo: { name: 'NY–Neapolitan hybrid', hydration: 68, salt: 2.8, oil: 1.5, sugar: 0.5, hydrationRange: [64, 70], saltRange: [2.5, 3.2], badge: 'guidance', badgeText: 'GUIDANCE',
    sourceText: 'Between lean Neapolitan and Ooni\'s enriched NY formula.', sourceUrl: SRC.ooniNY },
  ny: { name: 'New York', hydration: 65, salt: 3.0, oil: 5.0, sugar: 1.0, hydrationRange: [60, 65], saltRange: [2.5, 3.2], badge: 'source', badgeText: 'SOURCE',
    sourceText: 'Rounded from Ooni\'s NY formula: about 65% water, 3% salt, 5% oil, 1% sugar.', sourceUrl: SRC.ooniNY },
  roman: { name: 'Roman / thin-crisp', hydration: 60, salt: 2.7, oil: 2.0, sugar: 0, hydrationRange: [55, 65], saltRange: [2.3, 3.0], badge: 'guidance', badgeText: 'GUIDANCE',
    sourceText: 'Starting point for thin and crisp; Roman styles vary.', sourceUrl: SRC.ooniClassic },
  detroit: { name: 'Detroit / pan', hydration: 72, salt: 2.5, oil: 0, sugar: 0, hydrationRange: [70, 80], saltRange: [2.2, 3.0], badge: 'guidance', badgeText: 'GUIDANCE',
    sourceText: 'High-hydration pan dough. Pan oil is separate.', sourceUrl: SRC.ooniDetroit },
  pan: { name: 'General pan pizza', hydration: 70, salt: 2.5, oil: 2.0, sugar: 0, hydrationRange: [65, 78], saltRange: [2.2, 3.0], badge: 'guidance', badgeText: 'GUIDANCE',
    sourceText: 'General pan preset.', sourceUrl: SRC.ooniClassic },
  custom: { name: 'Custom', hydration: 65, salt: 2.8, oil: 0, sugar: 0, hydrationRange: null, saltRange: null, badge: 'guidance', badgeText: 'CUSTOM',
    sourceText: 'No style assumptions.', sourceUrl: null }
};

const flourProfiles = {
  'caputo-pizzeria': { name: 'Caputo Pizzeria', type: '00', protein: '12.5%', strength: 'W 260–280', pl: '0.50–0.60', leaven: [8, 12],
    sourceText: 'Caputo rates Pizzeria for 8–12 hours of leavening — a natural fit for short and same-day doughs.', sourceUrl: SRC.caputoRange, workingHydration: [58, 70],
    guidance: 'Great for classic and contemporary Neapolitan. For room-temp doughs beyond ~14 h or cold doughs beyond ~48 h, Nuvola or another stronger flour holds up better.' },
  'caputo-nuvola': { name: 'Caputo Nuvola / Cloud', type: '0', protein: '12.5%', strength: 'W 260–290', pl: '0.50–0.60', leaven: [24, 72],
    sourceText: 'Caputo rates Cloud/Nuvola for 24 hours or more and highly hydrated doughs, for high, airy rims.', sourceUrl: SRC.caputoRange, workingHydration: [63, 75],
    guidance: 'Better choice than Pizzeria for long ferments and 68%+ hydration. On a 6–8 h dough it can feel tight.' },
  strong: { name: 'Strong bread flour', type: 'varies', protein: 'check pack', strength: 'unknown', pl: 'unknown', leaven: null,
    sourceText: 'No single specification — check the pack.', sourceUrl: null, workingHydration: [60, 75], guidance: '“Bread flour” varies a lot by brand.' },
  plain: { name: 'Plain / AP flour', type: 'varies', protein: 'check pack', strength: 'usually lower', pl: 'unknown', leaven: [2, 8],
    sourceText: 'No single specification.', sourceUrl: null, workingHydration: [55, 65], guidance: 'Keep hydration and fermentation modest.' },
  custom: { name: 'Custom / unknown', type: 'unknown', protein: 'unknown', strength: 'unknown', pl: 'unknown', leaven: null,
    sourceText: 'Use the journal to tune it.', sourceUrl: null, workingHydration: null, guidance: 'Change one variable per bake.' }
};

const yeastFactors = { idy: 1, ady: 1.3, fresh: 3.0 };
const yeastNames = { idy: 'instant dry yeast', ady: 'active dry yeast', fresh: 'fresh yeast' };
const yeastShort = { idy: 'IDY', ady: 'ADY', fresh: 'fresh yeast' };

// ---------- mixing methods ----------
const METHODS = {
  tm7: { name: 'Thermomix TM7 · Dough mode', ff: 24, basis: 'model', basisText: 'ESTIMATE',
    note: 'No published TM7 figure. A Thermomix kneading test (homebaking.at) had wheat doughs finishing at 27.6–28.5 °C even with 1–4 °C water — it runs hot. 24 °C is a starting estimate for ~2 min Dough mode. Calibrate on your first batch.', src: SRC.homebaking },
  tm7folds: { name: 'TM7 short mix + stretch & folds', ff: 16, basis: 'model', basisText: 'ESTIMATE',
    note: 'Shorter machine time (≈1 min) then gentle folds. Estimate — calibrate.', src: SRC.homebaking },
  hand: { name: 'Hand knead', ff: 4, basis: 'source', basisText: 'SOURCE',
    note: 'King Arthur: 6–8 °F (≈3.3–4.4 °C) for ~8 min of hand kneading. The guide says +2–4 °C. A cold stone bench will pull this lower.', src: SRC.kaDdt },
  folds: { name: 'Stretch & folds only', ff: 1, basis: 'source', basisText: 'SOURCE',
    note: 'King Arthur: 0–4 °F (≈0–2 °C) for gentle folds or cool hands.', src: SRC.kaFriction },
  stand: { name: 'Stand mixer', ff: 13, basis: 'source', basisText: 'SOURCE',
    note: 'King Arthur KitchenAid 22–24 °F (≈12–13 °C); Hamelman 24–28 °F (≈13–16 °C). The guide\'s +5–8 °C is low.', src: SRC.kaFriction }
};

// ---------- schedule templates ----------
const TEMPLATES = {
  sd6: { bulk: 2, cold: 0, proof: 4, note: 'Fast same-day dough. Flavour is lighter; temperature control matters a lot because the yeast dose is higher.' },
  sd8: { bulk: 2, cold: 0, proof: 6, note: 'Sits in Caputo\'s 8–12 h window for Pizzeria. A good everyday Neapolitan schedule.' },
  sd12: { bulk: 6, cold: 0, proof: 6, note: 'Top of Caputo\'s Pizzeria window and the AVPN minimum of 12 h total.' },
  rt24: { bulk: 18, cold: 0, proof: 6, note: 'Ooni\'s Neapolitan pattern: 18–20 h bulk at 16–20 °C, then 5–6 h balls. Needs a cool spot; Caputo suggests a stronger flour (Nuvola) for 24 h+.' },
  cold24: { bulk: 2, cold: 18, proof: 4, coldForm: 'bulk', note: 'The PizzaVibes guide\'s recipe: 2 h at ~22 °C, 16–20 h in the fridge (guide uses 7 °C), ball, 3–4 h proof.' },
  cold48: { bulk: 1, cold: 44, proof: 3, coldForm: 'balls', note: 'Ball before the fridge so it chills fast (Modernist, PMQ). Temper to ≥13 °C before opening.' },
  custom: { note: 'Your own schedule.' }
};

// ---------- profile ----------
const DEFAULT_PROFILE = {
  thermo: 'probe', method: 'tm7', fridge: 5, tap: 20, coldWater: 5,
  flour: 'caputo-pizzeria', oven: 'sidekick', yeast: 'idy', balls: 4, ballW: 280,
  calib: 1, calibHistory: [], friction: {}
};
const state = {
  profile: Object.assign({}, DEFAULT_PROFILE, store.get('pizzaLabProfile', {})),
  recipes: store.get('pizzaLabRecipes', []),
  bakes: store.get('pizzaLabBakes', []),
  last: null,         // last computed plan
  live: null          // dough day result
};
if (!Array.isArray(state.recipes)) state.recipes = [];
if (!Array.isArray(state.bakes)) state.bakes = [];
state.profile.friction = state.profile.friction || {};
state.profile.calibHistory = state.profile.calibHistory || [];

function methodFF(key) {
  const saved = state.profile.friction[key];
  return saved && Number.isFinite(saved.ff) ? saved.ff : METHODS[key].ff;
}
function persist() {
  store.set('pizzaLabRecipes', state.recipes);
  store.set('pizzaLabBakes', state.bakes);
  store.set('pizzaLabProfile', state.profile);
}

// ---------- read inputs ----------
const num = (id, fallback = 0) => { const el = $(id); if (!el) return fallback; const n = parseFloat(el.value); return Number.isFinite(n) ? n : fallback; };

function readPlan() {
  const prefType = $('prefermentType').value;
  return {
    style: $('pizzaStyle').value,
    flourKey: $('flourProfile').value,
    balls: Math.max(0, Math.round(num('balls', 4))),
    ballWeight: Math.max(0, num('ballWeight', 280)),
    hydration: Math.max(0, num('hydration', 65)),
    salt: Math.max(0, num('salt', 3)),
    oil: Math.max(0, num('oil', 0)),
    sugar: Math.max(0, num('sugar', 0)),
    yeastType: $('yeastType').value,
    yeastMode: $('yeastMode').value,
    manualPct: Math.max(0, num('manualYeastPct', 0.1)),
    pref: prefType === 'none' ? null : {
      type: prefType, pct: clamp(num('prefermentPct', 30), 0, 100), hyd: clamp(num('prefermentHydration', 100), 0, 150),
      hours: Math.max(0.5, num('prefermentHours', 12)), temp: num('prefermentTemp', 18), tempAtMix: num('prefTempAtMix', 18)
    },
    bakeTime: $('bakeTime').value,
    template: $('scheduleTemplate').value,
    bulkHours: Math.max(0, num('bulkHours', 2)), bulkTemp: num('bulkTemp', 22),
    coldHours: Math.max(0, num('coldHours', 0)), fridgeTemp: num('fridgeTemp', 5), coldForm: $('coldForm').value,
    proofHours: Math.max(0, num('ballProofHours', 6)), proofTemp: num('ballProofTemp', 22),
    method: $('mixMethod').value, friction: num('friction', 24),
    room: num('roomTemp', 22), flourTemp: num('flourTemp', 22), tap: num('tapTemp', 20), coldWater: num('coldWaterTemp', 5),
    bench: $('benchTemp').value === '' ? null : num('benchTemp', null),
    fdtAuto: $('fdtAuto').checked, targetFdt: num('targetFdt', 24),
    oven: $('ovenProfile').value
  };
}

function buildPhases(p) {
  const phases = [];
  const ballsBeforeCold = p.coldHours > 0 && p.coldForm === 'balls';
  phases.push({ key: 'bulk', label: 'Bulk', hours: p.bulkHours, temp: p.bulkTemp, form: 'bulk' });
  if (p.coldHours > 0) phases.push({ key: 'cold', label: 'Fridge', hours: p.coldHours, temp: p.fridgeTemp, form: ballsBeforeCold ? 'balls' : 'bulk' });
  phases.push({ key: 'proof', label: 'Ball proof', hours: p.proofHours, temp: p.proofTemp, form: 'balls' });
  return phases.filter(ph => ph.hours > 0 || ph.key === 'proof');
}

function suggestFdt(p) {
  if (p.coldHours >= 6) return { t: 22, why: 'Cold ferment: start cooler so the dough doesn\'t race while it chills (guide example 22 °C; PMQ lowers targets for home fridges).' };
  if (p.bulkTemp >= 26 || p.room >= 26) return { t: 22, why: 'Warm kitchen: Ooni targets 21–23 °C in warmer months.' };
  if (p.bulkTemp <= 18 && p.room <= 19) return { t: 25, why: 'Cool kitchen: Ooni targets 23–26 °C in cooler months.' };
  return { t: 24, why: 'Normal kitchen: the sources cluster at 23–25 °C (Rule of 55 ≈ 24 °C; Italian Pizza Secrets 23–25 °C; Ooni 21–26 °C by season).' };
}

// ---------- core compute ----------
const WATER_MIN = 1;   // iced water, practical floor
const WATER_MAX = 38;  // keep yeast happy

function computePlan(p) {
  const out = { p, warnings: [], infos: [] };
  const style = styleProfiles[p.style] || styleProfiles.custom;
  const flour = flourProfiles[p.flourKey] || flourProfiles.custom;
  const phases = buildPhases(p);
  out.phases = phases;
  out.totalHours = phases.reduce((s, ph) => s + ph.hours, 0);

  // --- target FDT and water temperature ---
  const sug = suggestFdt(p);
  out.suggest = sug;
  const target = p.fdtAuto ? sug.t : p.targetFdt;
  out.target = target;
  const prefTemp = p.pref ? p.pref.tempAtMix : null;
  const tw = M.waterTempNeeded({ target, room: p.room, flour: p.flourTemp, friction: p.friction, prefTemp });
  out.waterNeeded = tw;
  const waterUse = clamp(tw, WATER_MIN, WATER_MAX);
  out.waterUse = waterUse;
  out.reachable = tw >= WATER_MIN && tw <= WATER_MAX;
  out.fdt = out.reachable ? target : M.predictFdt({ water: waterUse, room: p.room, flour: p.flourTemp, friction: p.friction, prefTemp });
  if (tw < WATER_MIN) out.flourNeeded = M.flourTempNeeded({ target, room: p.room, water: WATER_MIN, friction: p.friction, prefTemp });

  // --- fermentation simulation ---
  const sim = M.simulate(out.fdt, phases);
  out.sim = sim;
  const calib = state.profile.calib || 1;
  out.calib = calib;
  let mainIdy; // % of flour that the *main dough* schedule needs (IDY basis)
  if (p.yeastMode === 'manual') {
    mainIdy = p.manualPct / (yeastFactors[p.yeastType] || 1);
  } else {
    mainIdy = M.idyForHeq(sim.heq, p.salt, calib);
  }
  out.mainIdy = mainIdy;
  out.lowIdy = mainIdy * (1 - M.FERMENT.rangePct);
  out.highIdy = mainIdy * (1 + M.FERMENT.rangePct);
  out.ready = M.readinessTime(out.fdt, phases, mainIdy, p.salt, calib);
  out.readyFast = M.readinessTime(out.fdt, phases, mainIdy * 1.25, p.salt, calib);
  out.readySlow = M.readinessTime(out.fdt, phases, mainIdy * 0.75, p.salt, calib);

  // --- preferment yeast ---
  let prefIdyOfPrefFlour = 0;
  if (p.pref) {
    const pSim = M.simulate(p.pref.temp, [{ hours: p.pref.hours, temp: p.pref.temp, form: 'bulk' }]);
    prefIdyOfPrefFlour = M.idyForHeq(pSim.heq, 0, calib);
    out.prefSim = pSim;
  }
  const pFrac = p.pref ? p.pref.pct / 100 : 0;
  const finalIdyPct = mainIdy * (1 - pFrac);          // % of total flour, IDY basis
  const prefIdyPct = prefIdyOfPrefFlour * pFrac;       // % of total flour, IDY basis
  const yf = yeastFactors[p.yeastType] || 1;
  const totalYeastPct = (finalIdyPct + prefIdyPct) * yf; // in chosen yeast type

  // --- ingredient weights (exact baker's maths, yeast included in total) ---
  const total = p.balls * p.ballWeight;
  const bakerTotal = 100 + p.hydration + p.salt + p.oil + p.sugar + totalYeastPct;
  const flourG = total / (bakerTotal / 100);
  const r = {
    total, bakerTotal, flour: flourG, water: flourG * p.hydration / 100, salt: flourG * p.salt / 100,
    oil: flourG * p.oil / 100, sugar: flourG * p.sugar / 100, yeast: flourG * totalYeastPct / 100, yeastPct: totalYeastPct
  };
  r.pFlour = flourG * pFrac;
  r.pWater = r.pFlour * (p.pref ? p.pref.hyd : 0) / 100;
  r.pYeast = flourG * prefIdyPct * yf / 100;
  r.finalFlour = r.flour - r.pFlour;
  r.finalWater = r.water - r.pWater;
  r.finalYeast = r.yeast - r.pYeast;
  r.check = r.flour + r.water + r.salt + r.oil + r.sugar + r.yeast;
  out.r = r;
  out.prefIdyOfPrefFlour = prefIdyOfPrefFlour;

  // --- water handling instructions (for the final-mix water) ---
  out.waterPlan = waterPlan(p, out);

  // --- dilution helper for tiny yeast amounts ---
  if (r.finalYeast > 0 && r.finalYeast < 1 && r.finalWater > r.finalYeast * 100) {
    out.dilution = { solution: r.finalYeast * 100, waterInSolution: r.finalYeast * 99, remainingWater: r.finalWater - r.finalYeast * 99 };
  }

  collectWarnings(p, out, style, flour);
  return out;
}

function waterPlan(p, out) {
  const W = Math.max(0, out.r.finalWater);
  const t = out.waterUse;
  const lines = [];
  const isTM = p.method === 'tm7' || p.method === 'tm7folds';
  if (!out.reachable && out.waterNeeded > WATER_MAX) {
    lines.push(`Needs water hotter than ${WATER_MAX} °C — use ${WATER_MAX} °C water and expect about ${deg(out.fdt)} dough. Warming the flour or the room is safer than hotter water.`);
  } else if (t > p.tap + 0.4) {
    lines.push(`Use <strong>${grams(W)}</strong> water at <strong>${deg(t)}</strong> — tap water plus a splash from the kettle, stirred and probed.`);
  } else if (t >= p.coldWater - 0.2) {
    const b = M.blendWater({ totalWater: W, cold: p.coldWater, tap: p.tap, target: t });
    if (b.cold < 1) lines.push(`Use <strong>${grams(W)}</strong> tap water (≈${deg(p.tap)}).`);
    else if (b.tap < 1) lines.push(`Use <strong>${grams(W)}</strong> fridge-cold water (≈${deg(p.coldWater)}).`);
    else lines.push(`Blend <strong>${grams(b.cold)}</strong> fridge-cold water (${deg(p.coldWater)}) + <strong>${grams(b.tap)}</strong> tap water (${deg(p.tap)}) → ${grams(W)} at ≈${deg(t)}. Probe it before it goes in.`);
  } else {
    if (isTM) {
      lines.push(`Make iced water first: ice + water in a jug, stir 2–3 min, fish out the ice, then weigh <strong>${grams(W)}</strong> at <strong>${deg(t)}</strong>. Ice cubes won't melt during a short Thermomix knead (homebaking.at).`);
    } else {
      const ice = M.iceNeeded({ totalWater: W, tap: p.tap, target: t });
      lines.push(`Use <strong>${grams(ice)}</strong> ice + <strong>${grams(W - ice)}</strong> tap water (${deg(p.tap)}). Stir until the ice is gone (≈${deg(t)}). Lehmann ice formula, °C version.`);
    }
    if (!out.reachable) {
      lines.push(`Even ${WATER_MIN} °C water only gets you to about <strong>${deg(out.fdt)}</strong>. To hit ${deg(out.target)} chill the flour to about <strong>${deg(out.flourNeeded)}</strong> (fridge or freezer) — or accept ${deg(out.fdt)}; the yeast below already allows for it.`);
    }
  }
  return lines;
}

function collectWarnings(p, out, style, flour) {
  const W = out.warnings, I = out.infos;
  if (style.hydrationRange && (p.hydration < style.hydrationRange[0] || p.hydration > style.hydrationRange[1])) W.push(`${p.hydration}% hydration is outside this style's ${style.hydrationRange[0]}–${style.hydrationRange[1]}% range.`);
  if (style.saltRange && (p.salt < style.saltRange[0] || p.salt > style.saltRange[1])) W.push(`${p.salt}% salt is outside this style's ${style.saltRange[0]}–${style.saltRange[1]}% range.`);
  if (p.style === 'traditional') {
    if (p.oil > 0 || p.sugar > 0) W.push('AVPN traditional dough has no fat or sugar.');
    if (p.ballWeight < 200 || p.ballWeight > 280) W.push('AVPN ball weights are 200–280 g.');
    if (out.totalHours + (p.pref ? p.pref.hours : 0) < 12) I.push('AVPN specifies 12–24 h total fermentation. Shorter is fine at home — just not AVPN-spec.');
    if (out.waterUse < 16 || out.waterUse > 22) I.push(`AVPN's operating water temperature is 16–22 °C; your plan uses ${deg(out.waterUse)} to hit the dough temperature. Dough temperature is what matters.`);
  }
  if (out.fdt > 26) W.push(`Dough at ${deg(out.fdt)} after mixing: gas production and enzymes run fast and gluten weakens sooner (guide; Stadler Made). Aim lower if you can.`);
  if (out.fdt < 19) W.push(`Dough at ${deg(out.fdt)} after mixing will be sluggish; balls may flatten before they rise (Stadler Made).`);
  if (p.method !== 'folds' && p.method !== 'hand' && p.method !== 'stand' && out.r.total > 900) I.push(`TM7 batch is ${Math.round(out.r.total)} g. A Thermomix kneading test found 700–850 g dough works best — consider two batches (and recalibrate friction for the bigger batch if you don't).`);
  if (Math.max(p.bulkTemp, p.proofTemp) > 28) W.push('Proofing above 28 °C — Ooni halves the yeast in this heat. Check the dough early and often.');
  if (p.coldHours > 0 && p.fridgeTemp > 5) {
    const ratio = M.rate(p.fridgeTemp) / M.rate(4);
    I.push(`Fridge at ${deg(p.fridgeTemp)}: dough ferments about ${round(ratio, 1)}× faster than at 4 °C (model). Food Standards Australia recommends 5 °C or colder.`);
  }
  if (p.coldHours > 0) {
    const coldIdx = out.phases.findIndex(ph => ph.key === 'cold');
    if (coldIdx >= 0) {
      const start = out.phases.slice(0, coldIdx).reduce((s, ph) => s + ph.hours, 0);
      const target = p.fridgeTemp + 2;
      const pt = out.sim.points.find(x => x.t > start && x.T <= target);
      const hrs = pt ? pt.t - start : null;
      if (hrs !== null) I.push(`In the fridge as ${out.phases[coldIdx].form === 'balls' ? 'balls' : 'one bulk mass'}, the centre takes about ${round(hrs, 1)} h to get within 2 °C of fridge temp — yeast keeps working meanwhile (PMQ; Innograin).${out.phases[coldIdx].form === 'bulk' ? ' Balling first roughly halves that.' : ''}`);
    }
    const proof = out.phases[out.phases.length - 1];
    const startProof = out.totalHours - proof.hours;
    const warm = out.sim.points.find(x => x.t >= startProof && x.T >= 13);
    if (!warm) W.push(`Ball proof is too short for the balls to reach 13 °C — they'll be stiff to open. Allow more time out of the fridge (Modernist: 2 h or 13 °C).`);
  }
  if (out.totalHours < 4) W.push('Under 4 hours: needs a big yeast dose, limited flavour, and timing is touchy.');
  if (flour.leaven) {
    const roomHours = out.phases.filter(ph => ph.temp >= 12).reduce((s, ph) => s + ph.hours, 0);
    if (p.flourKey === 'caputo-pizzeria' && roomHours > 14) I.push(`Caputo rates Pizzeria for 8–12 h leavening. ${round(roomHours, 1)} h at room temp pushes it — Nuvola or a cold phase would be safer.`);
    if (p.flourKey === 'caputo-pizzeria' && p.coldHours > 48) I.push('Very long cold ferment on Pizzeria (W 260–280): the guide recommends W 280–300 for long fermentation. Watch for slackness.');
    if (p.flourKey === 'caputo-nuvola' && out.totalHours < 12) I.push('Caputo rates Nuvola for 24 h+ leavening — on a short dough it may stay tight. Give balls full proof time.');
  }
  const f = flour;
  if (f.workingHydration && (p.hydration < f.workingHydration[0] || p.hydration > f.workingHydration[1])) W.push(`${p.hydration}% is outside the ${f.workingHydration[0]}–${f.workingHydration[1]}% working zone for ${f.name}.`);
  if (p.pref && out.r.finalWater < -0.01) W.push('Impossible split: the preferment holds more water than the whole recipe. Lower prefermented flour %, lower preferment hydration, or raise hydration.');
  if (p.pref && p.pref.type === 'poolish' && Math.abs(p.pref.hyd - 100) > 0.1) I.push('Poolish is normally 100% hydration.');
  if (p.pref && p.pref.type === 'biga' && p.pref.hyd > 60) I.push('Biga is normally stiff (≈45–55%). Above 60% it behaves more like a poolish.');
  if (p.yeastMode === 'manual') {
    const diff = out.ready.hours - out.totalHours;
    if (Math.abs(diff) > 0.4) W.push(`With ${pct(p.manualPct, 3)} ${yeastShort[p.yeastType]}, the model expects the dough to be ready about ${round(Math.abs(diff), 1)} h ${diff < 0 ? 'early' : 'late'} for this schedule.`);
  }
  if (p.oven !== 'home' && p.oil >= 3 && ['traditional', 'contemporary', 'canotto'].includes(p.style)) I.push('Enriched dough browns fast at Neapolitan temperatures.');
}

// ---------- rendering: plan ----------
function renderStyleRecommendation(p) {
  const s = styleProfiles[p.style];
  $('styleRecommendation').innerHTML = `
    <h3>${s.name} <span class="badge ${s.badge}">${s.badgeText}</span></h3>
    <div class="rec-grid">
      <div class="rec"><strong>${s.hydration}%</strong><span>hydration</span></div>
      <div class="rec"><strong>${s.salt}%</strong><span>salt</span></div>
      <div class="rec"><strong>${s.oil}%</strong><span>oil</span></div>
      <div class="rec"><strong>${s.sugar}%</strong><span>sugar</span></div>
    </div>
    <div class="source-note">${s.sourceText}${s.sourceUrl ? ` <a href="${s.sourceUrl}" target="_blank" rel="noopener">Source ↗</a>` : ''}</div>`;
}

function renderFdt(out) {
  const p = out.p;
  const fr = state.profile.friction[p.method];
  $('frictionStatus').textContent = fr && fr.date ? `· calibrated ${fr.date}` : `· ${METHODS[p.method].basisText.toLowerCase()}`;
  if (p.fdtAuto) $('targetFdt').value = out.target;
  $('targetFdt').disabled = p.fdtAuto;
  const reach = out.reachable
    ? `<div class="good-box">Target <strong>${deg(out.target)}</strong> is reachable.</div>`
    : `<div class="warning">Target ${deg(out.target)} isn't reachable with water alone — planning around <strong>${deg(out.fdt)}</strong>.</div>`;
  $('fdtResults').innerHTML = `
    <div class="metric-grid">
      <div class="metric hero"><div class="value">${deg(out.waterUse)}</div><div class="label">water temperature</div></div>
      <div class="metric"><div class="value">${deg(out.fdt)}</div><div class="label">planned dough temp</div></div>
      <div class="metric"><div class="value">${round(p.friction, 1)}</div><div class="label">friction (${esc(METHODS[p.method].name.split(' ·')[0])})</div></div>
    </div>
    ${reach}
    <ul class="list">${out.waterPlan.map(l => `<li>${l}</li>`).join('')}</ul>
    <div class="formula small">${p.pref ? 4 : 3} × ${round(out.target, 1)} − (${round(p.room, 1)} room + ${round(p.flourTemp, 1)} flour + ${round(p.friction, 1)} friction${p.pref ? ` + ${round(p.pref.tempAtMix, 1)} preferment` : ''}) = <strong>${round(out.waterNeeded, 1)} °C</strong></div>
    <div class="source-note"><span class="badge source">SOURCE</span> Formula: King Arthur, Tom Lehmann, the guide. ${p.fdtAuto ? `<br>Target: ${esc(out.suggest.why)}` : ''}${p.bench !== null && p.bench < p.room - 3 && (p.method === 'hand' || p.method === 'folds') ? `<br><span class="badge guidance">GUIDANCE</span> Your bench is ${round(p.room - p.bench, 1)} °C below room — hand-worked dough will lose heat to it. Expect a lower friction factor; calibrate on Dough day.` : ''}</div>`;
}

function renderRecipe(out) {
  const p = out.p, r = out.r;
  const yName = yeastNames[p.yeastType];
  const yRange = p.yeastMode === 'auto'
    ? `<div class="source-note"><span class="badge model">MODEL</span> Starting range ${pct(out.lowIdy * yeastFactors[p.yeastType], 3)}–${pct(out.highIdy * yeastFactors[p.yeastType], 3)} ${yeastShort[p.yeastType]} (main dough). Centre value used. Your calibration: ×${round(out.calib, 2)}.</div>`
    : '<div class="source-note">Manual yeast % in use.</div>';
  let prefHtml = '';
  if (p.pref) {
    const label = p.pref.type === 'poolish' ? 'Poolish' : 'Biga';
    prefHtml = `
      <div class="divider"></div>
      <h3>${label} <span class="muted">· make ${round(p.pref.hours, 1)} h ahead at ${deg(p.pref.temp)}</span></h3>
      <div class="metric-grid">
        <div class="metric"><div class="value">${grams(r.pFlour)}</div><div class="label">flour</div></div>
        <div class="metric"><div class="value">${grams(r.pWater)}</div><div class="label">water</div></div>
        <div class="metric"><div class="value">${grams(r.pYeast)}</div><div class="label">${yShortName(p)} · ${pct(out.prefIdyOfPrefFlour * yeastFactors[p.yeastType], 3)} of its flour</div></div>
      </div>
      <h3 style="margin-top:12px">Final mix</h3>
      <div class="metric-grid">
        <div class="metric"><div class="value">${grams(r.finalFlour)}</div><div class="label">flour</div></div>
        <div class="metric"><div class="value">${grams(Math.max(0, r.finalWater))}</div><div class="label">water</div></div>
        <div class="metric"><div class="value">${grams(r.finalYeast)}</div><div class="label">${yShortName(p)}</div></div>
      </div>
      <div class="source-note"><span class="badge model">MODEL</span> Preferment yeast is sized to peak at your preferment time and temperature; final-mix yeast is reduced by the share of flour already fermented. Overall hydration stays ${p.hydration}%.</div>`;
  }
  const dil = out.dilution ? `<div class="info"><strong>Tiny yeast amount?</strong> Weigh 1.00 g ${yName} into 99 g of the recipe water and stir. Add <strong>${grams(out.dilution.solution)}</strong> of that mix — it holds ${grams(r.finalYeast)} yeast — then add the remaining <strong>${grams(out.dilution.remainingWater)}</strong> water. Kitchen scales are rarely accurate below 1 g.</div>` : '';
  $('calcResults').innerHTML = `
    <h2>${p.balls} × ${p.ballWeight} g · ${p.hydration}%</h2>
    <div class="metric-grid">
      <div class="metric"><div class="value">${grams(r.flour)}</div><div class="label">flour · 100%</div></div>
      <div class="metric"><div class="value">${grams(r.water)}</div><div class="label">water · ${pct(p.hydration, 1)} · ${deg(out.waterUse)}</div></div>
      <div class="metric"><div class="value">${grams(r.salt)}</div><div class="label">salt · ${pct(p.salt, 2)}</div></div>
      <div class="metric hero"><div class="value">${grams(r.yeast)}</div><div class="label">${yName} · ${pct(r.yeastPct, 3)}</div></div>
      ${r.oil > 0 ? `<div class="metric"><div class="value">${grams(r.oil)}</div><div class="label">oil · ${pct(p.oil, 2)}</div></div>` : ''}
      ${r.sugar > 0 ? `<div class="metric"><div class="value">${grams(r.sugar)}</div><div class="label">sugar · ${pct(p.sugar, 2)}</div></div>` : ''}
      <div class="metric"><div class="value">${deg(out.fdt)}</div><div class="label">dough temp to hit</div></div>
    </div>
    ${yRange}${dil}${prefHtml}
    ${out.warnings.map(w => `<div class="warning">${w}</div>`).join('')}
    ${out.infos.map(w => `<div class="info">${w}</div>`).join('')}`;

  $('mathExplanation').innerHTML = `
    <div class="math-line"><strong>1.</strong> Target dough = ${p.balls} × ${p.ballWeight} g = <strong>${round(r.total, 0)} g</strong></div>
    <div class="math-line"><strong>2.</strong> Equivalent fermentation = <strong>${round(out.sim.heq, 2)} h at 25 °C</strong> (dough starts at ${deg(out.fdt)} and follows each phase's temperature)</div>
    <div class="math-line"><strong>3.</strong> IDY = 0.93 × ${round(M.saltFactor(p.salt), 3)} salt × ${round(out.calib, 2)} calibration ÷ (${round(out.sim.heq, 2)} − 1.25)^1.3 = <strong>${pct(out.mainIdy, 4)}</strong>${p.yeastMode === 'manual' ? ' (manual override)' : ''}</div>
    <div class="math-line"><strong>4.</strong> Baker's total = 100 + ${p.hydration} + ${p.salt} + ${p.oil} + ${p.sugar} + ${round(r.yeastPct, 4)} = <strong>${round(r.bakerTotal, 4)}%</strong></div>
    <div class="math-line"><strong>5.</strong> Flour = ${round(r.total, 0)} ÷ ${round(r.bakerTotal / 100, 5)} = <strong>${grams(r.flour)}</strong></div>
    <div class="math-line"><strong>6.</strong> Water ${grams(r.water)} · Salt ${grams(r.salt)} · Yeast ${grams(r.yeast)}</div>
    <div class="math-line"><strong>Check.</strong> Sum of ingredients = <strong>${round(r.check, 2)} g</strong></div>`;
}
function yShortName(p) { return yeastShort[p.yeastType]; }

function fmtTime(d) {
  return d.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}
function bakeDate(p) {
  const d = p.bakeTime ? new Date(p.bakeTime) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

function renderTimeline(out) {
  const p = out.p;
  const bake = bakeDate(p);
  const H = out.totalHours;
  const mix = bake ? new Date(bake.getTime() - H * 3600000) : null;
  const at = (h) => (mix ? fmtTime(new Date(mix.getTime() + h * 3600000)) : `+${round(h, 2)} h`);
  const steps = [];
  if (p.pref) steps.push([-p.pref.hours, `Make the ${p.pref.type}`, `${grams(out.r.pFlour)} flour + ${grams(out.r.pWater)} water + ${grams(out.r.pYeast)} yeast · ${round(p.pref.hours, 1)} h at ${deg(p.pref.temp)}`]);
  steps.push([0, 'Mix', `Water at ${deg(out.waterUse)} → probe the dough: aim for ${deg(out.fdt)}. Log it on Dough day.`]);
  if (p.method === 'folds' || p.method === 'tm7folds') {
    [0.33, 0.67, 1].forEach((h, i) => { if (h < p.bulkHours) steps.push([h, `Stretch & fold ${i + 1}`, 'Wet hands, 4 folds, cover']); });
  }
  let t = p.bulkHours;
  if (p.coldHours > 0) {
    if (p.coldForm === 'balls') steps.push([t, 'Divide, ball, into the fridge', `${p.balls} × ${p.ballWeight} g, spaced out or in separate containers so they chill fast · fridge ${deg(p.fridgeTemp)}`]);
    else steps.push([t, 'Into the fridge (bulk)', `Covered container · fridge ${deg(p.fridgeTemp)}`]);
    t += p.coldHours;
    steps.push([t, p.coldForm === 'balls' ? 'Out of the fridge' : 'Out of the fridge · divide & ball', `${p.coldForm === 'balls' ? '' : `${p.balls} × ${p.ballWeight} g · `}proof at ${deg(p.proofTemp)}`]);
    const warm13 = out.sim.points.find(x => x.t >= t && x.T >= 13);
    if (warm13) steps.push([warm13.t, 'Balls reach ~13 °C', 'Earliest sensible time to open (PMQ / Modernist). Warmer is easier to stretch.']);
  } else {
    steps.push([t, 'Divide & ball', `${p.balls} × ${p.ballWeight} g · proof at ${deg(p.proofTemp)}`]);
  }
  steps.push([Math.max(0, H - 0.75), 'Preheat the oven', 'Give the stone time to soak — check it with an IR thermometer if you have one.']);
  steps.push([Math.max(0, H - 0.5), 'Readiness check', '≈2× volume, slow poke spring-back, bubbles underneath']);
  steps.push([H, 'Bake', bake ? '' : 'Set a pizza time to see clock times']);
  steps.sort((a, b) => a[0] - b[0]);

  const r = out.ready, rf = out.readyFast, rs = out.readySlow;
  const windowText = mix
    ? `${fmtTime(new Date(mix.getTime() + rf.hours * 3600000))} – ${fmtTime(new Date(mix.getTime() + rs.hours * 3600000))}`
    : `+${round(rf.hours, 1)} h to +${round(rs.hours, 1)} h`;
  $('plannerResults').innerHTML = `
    <div class="metric-grid">
      <div class="metric"><div class="value">${mix ? fmtTime(mix).replace(/^\w+ /, '') : '—'}</div><div class="label">mix ${mix ? mix.toLocaleDateString([], { weekday: 'short' }) : ''}</div></div>
      <div class="metric"><div class="value">${round(H, 1)} h</div><div class="label">mix to bake</div></div>
      <div class="metric"><div class="value">${round(out.sim.heq, 1)} h</div><div class="label">equiv. hours at 25 °C</div></div>
    </div>
    <div class="info"><span class="badge model">MODEL</span> Ready window if your dough runs ±25%: <strong>${windowText}</strong>. Trust the dough over the clock.</div>
    <div class="timeline">${steps.map(s => `<div class="timeline-item"><strong>${at(s[0])} · ${esc(s[1])}</strong>${s[2] ? `<span>${s[2]}</span>` : ''}</div>`).join('')}</div>`;
  renderChart(out);
}

function renderChart(out) {
  const pts = out.sim.points;
  if (!pts.length || out.totalHours <= 0) { $('tempChart').innerHTML = ''; return; }
  const Wd = 640, Ht = 220, padL = 34, padR = 10, padT = 14, padB = 26;
  const temps = pts.map(x => x.T).concat(out.phases.map(ph => ph.temp));
  const lo = Math.floor(Math.min(...temps) - 2), hi = Math.ceil(Math.max(...temps) + 2);
  const X = h => padL + (h / out.totalHours) * (Wd - padL - padR);
  const Y = T => padT + (1 - (T - lo) / (hi - lo)) * (Ht - padT - padB);
  let bands = '', t0 = 0;
  out.phases.forEach(ph => {
    if (ph.hours <= 0) return;
    bands += `<rect x="${X(t0)}" y="${padT}" width="${X(t0 + ph.hours) - X(t0)}" height="${Ht - padT - padB}" class="band ${ph.key}"/>`;
    bands += `<line x1="${X(t0)}" x2="${X(t0 + ph.hours)}" y1="${Y(ph.temp)}" y2="${Y(ph.temp)}" class="amb"/>`;
    bands += `<text x="${X(t0) + 4}" y="${padT + 12}" class="lbl">${ph.label}</text>`;
    t0 += ph.hours;
  });
  const step = Math.max(1, Math.ceil(pts.length / 300));
  const d = pts.filter((_, i) => i % step === 0 || i === pts.length - 1).map((x, i) => `${i ? 'L' : 'M'}${X(x.t).toFixed(1)},${Y(x.T).toFixed(1)}`).join(' ');
  const ticksY = [];
  for (let T = Math.ceil(lo / 5) * 5; T <= hi; T += 5) ticksY.push(T);
  const tickEvery = out.totalHours > 36 ? 12 : out.totalHours > 16 ? 4 : out.totalHours > 8 ? 2 : 1;
  const ticksX = [];
  for (let h = 0; h <= out.totalHours + 0.001; h += tickEvery) ticksX.push(h);
  const has13 = out.phases.some(ph => ph.key === 'cold') && 13 > lo && 13 < hi;
  $('tempChart').innerHTML = `
    <svg viewBox="0 0 ${Wd} ${Ht}" role="img" aria-label="Predicted dough temperature over the schedule">
      ${bands}
      ${ticksY.map(T => `<line x1="${padL}" x2="${Wd - padR}" y1="${Y(T)}" y2="${Y(T)}" class="grid"/><text x="${padL - 6}" y="${Y(T) + 4}" class="axis" text-anchor="end">${T}°</text>`).join('')}
      ${ticksX.map(h => `<text x="${X(h)}" y="${Ht - 8}" class="axis" text-anchor="middle">${round(h, 0)}h</text>`).join('')}
      ${has13 ? `<line x1="${padL}" x2="${Wd - padR}" y1="${Y(13)}" y2="${Y(13)}" class="open"/><text x="${Wd - padR - 4}" y="${Y(13) - 4}" class="lbl" text-anchor="end">13° open</text>` : ''}
      <path d="${d}" class="dough"/>
      <circle cx="${X(0)}" cy="${Y(out.fdt)}" r="4" class="dot-start"/>
    </svg>
    <div class="chart-legend"><span><i class="sw dough"></i>dough temperature (model)</span><span><i class="sw amb"></i>where it sits</span></div>`;
}

function renderMethod(out) {
  const p = out.p, r = out.r;
  const W = Math.max(0, r.finalWater);
  const holdBack = p.hydration >= 68 ? Math.round(W * 0.07) : 0;
  const yeastLine = out.dilution
    ? `${grams(out.dilution.solution)} yeast mix (1 g in 99 g water) + ${grams(out.dilution.remainingWater - holdBack)} water`
    : `${grams(W - holdBack)} water + ${grams(r.finalYeast)} ${yeastShort[p.yeastType]}`;
  const prefLine = p.pref ? ` + the ${p.pref.type}` : '';
  const steps = {
    tm7: {
      title: 'Thermomix TM7',
      list: [
        `<strong>Water + yeast:</strong> ${yeastLine} at ${deg(out.waterUse)}${prefLine} into the bowl. <em>10 sec / speed 2.</em>`,
        `<strong>Flour:</strong> add ${grams(r.finalFlour)}. <em>15 sec / speed 3–4</em> until shaggy. Starting above speed 4 traps air around the blade (homebaking.at).`,
        `<strong>Rest (optional, recommended):</strong> lid on, 20 min. An autolyse lowers dough temp and shortens kneading — less Thermomix heat.`,
        `<strong>Salt${holdBack ? ' + held-back water' : ''}:</strong> add ${grams(r.salt)} salt${holdBack ? ` and drizzle the last ${holdBack} g water through the lid while kneading` : ''}. <em>Dough mode, 2 min.</em>`,
        `<strong>Probe straight away.</strong> Target ${deg(out.fdt)}. Enter it on Dough day — it calibrates your TM7 friction factor.`,
        `<strong>Bench:</strong> tip out, a few quick folds into a smooth ball, into a lightly oiled, covered container.`
      ]
    },
    tm7folds: {
      title: 'TM7 short mix + folds',
      list: [
        `<strong>Water + yeast:</strong> ${yeastLine} at ${deg(out.waterUse)}${prefLine}. <em>10 sec / speed 2.</em>`,
        `<strong>Flour + salt:</strong> ${grams(r.finalFlour)} flour, ${grams(r.salt)} salt. <em>Dough mode, 1 min.</em>`,
        `<strong>Probe.</strong> Target ${deg(out.fdt)}.`,
        `<strong>Folds:</strong> 3 sets of stretch &amp; folds, 20 min apart, wet hands, covered between sets.`
      ]
    },
    hand: {
      title: 'By hand',
      list: [
        `<strong>Dissolve:</strong> ${yeastLine} at ${deg(out.waterUse)}${prefLine}.`,
        `<strong>75% of the flour:</strong> add about ${grams(r.finalFlour * 0.75)} and mix until shaggy.`,
        `<strong>Rest of the flour</strong> (${grams(r.finalFlour * 0.25)}) bit by bit, then knead 10–15 min.`,
        `<strong>Salt:</strong> ${grams(r.salt)}, knead until smooth (guide method).`,
        `<strong>Probe.</strong> Target ${deg(out.fdt)}.`
      ]
    },
    folds: {
      title: 'Stretch & folds',
      list: [
        `<strong>Mix:</strong> ${yeastLine} at ${deg(out.waterUse)}${prefLine} with ${grams(r.finalFlour)} flour until no dry flour. Rest 20 min.`,
        `<strong>Salt:</strong> sprinkle ${grams(r.salt)}, pinch and fold through.`,
        `<strong>Probe.</strong> Target ${deg(out.fdt)}.`,
        `<strong>Folds:</strong> 4 sets, 20–30 min apart, until smooth and elastic.`
      ]
    },
    stand: {
      title: 'Stand mixer',
      list: [
        `<strong>Combine:</strong> ${yeastLine} at ${deg(out.waterUse)}${prefLine} + ${grams(r.finalFlour)} flour, low speed 2 min.`,
        `<strong>Salt:</strong> ${grams(r.salt)}, then medium 5–8 min until smooth.`,
        `<strong>Probe.</strong> Target ${deg(out.fdt)}.`
      ]
    }
  };
  const s = steps[p.method];
  const bench = [];
  bench.push(`<strong>Bulk:</strong> ${round(p.bulkHours, 2)} h at ${deg(p.bulkTemp)}, covered.`);
  if (p.coldHours > 0 && p.coldForm === 'balls') bench.push(`<strong>Ball:</strong> ${p.balls} × ${p.ballWeight} g, tight balls, then fridge ${round(p.coldHours, 1)} h at ${deg(p.fridgeTemp)} — spaced out so they chill fast.`);
  if (p.coldHours > 0 && p.coldForm === 'bulk') bench.push(`<strong>Fridge:</strong> ${round(p.coldHours, 1)} h at ${deg(p.fridgeTemp)}, then divide ${p.balls} × ${p.ballWeight} g and ball.`);
  if (p.coldHours === 0) bench.push(`<strong>Ball:</strong> ${p.balls} × ${p.ballWeight} g.`);
  bench.push(`<strong>Proof:</strong> ${round(p.proofHours, 2)} h at ${deg(p.proofTemp)}, covered so they don't skin (AVPN proof rooms run 60–70% humidity).`);
  $('methodTitle').textContent = s.title;
  $('methodSteps').innerHTML = `<ol class="steps">${s.list.map(x => `<li>${x}</li>`).join('')}${bench.map(x => `<li>${x}</li>`).join('')}</ol>
    <div class="source-note"><span class="badge guidance">GUIDANCE</span> Speeds and times are a practical sequence, not Vorwerk recipe settings. What matters is the dough temperature at the end — probe it.</div>`;
}

function renderFlourTip(p) {
  const f = flourProfiles[p.flourKey];
  $('flourTip').innerHTML = `
    <div><strong>${f.name}</strong> · ${f.type} · ${f.protein} protein · ${f.strength}${f.pl !== 'unknown' ? ` · P/L ${f.pl}` : ''}${f.leaven ? ` · leavening ${f.leaven[0]}–${f.leaven[1]}${f.leaven[1] >= 72 ? '+' : ''} h` : ''}</div>
    <p>${f.sourceText} ${f.sourceUrl ? `<a href="${f.sourceUrl}" target="_blank" rel="noopener">Manufacturer ↗</a>` : ''}</p>
    <div class="source-note"><span class="badge guidance">GUIDANCE</span> ${f.guidance}</div>`;
}

const ovenGuides = {
  sidekick: {
    traditional: ['Stone target: roughly 400–450 °C', 'Strong top heat / flame', 'Bake roughly 60–110 sec', 'If the base scorches before the top colours, reduce floor heat rather than adding oil/sugar.'],
    contemporary: ['Stone target: roughly 380–430 °C', 'Strong top heat', 'Bake roughly 90–150 sec', 'Higher hydration generally needs slightly more controlled floor heat.'],
    canotto: ['Stone target: roughly 370–420 °C', 'Strong top heat', 'Bake roughly 90–150 sec', 'Prioritise top heat and fermentation control over pushing hydration.'],
    hybrid: ['Stone target: roughly 330–400 °C', 'Moderate-high top heat', 'Bake roughly 2–4 min'],
    nyneo: ['Stone target: roughly 320–380 °C', 'Lower flame than Neapolitan', 'Bake roughly 3–5 min'],
    ny: ['Stone target: roughly 290–340 °C', 'Moderate top heat', 'Bake roughly 4–7 min'],
    roman: ['Run cooler than Neapolitan', 'Longer bake, dry/crisp finish', 'Keep toppings light'],
    detroit: ['Properly oiled pan', 'Bake long enough to set the crumb', 'Manage bottom heat'],
    pan: ['Oil the pan separately', 'Moderate-high heat, enough time to set the crumb'],
    custom: ['Log stone temp, flame setting and bake time.', 'Change one variable at a time.']
  },
  'high-temp': {
    traditional: ['AVPN: floor ~380–430 °C, dome ~485 °C', 'Bake 60–90 sec (AVPN)', 'Keep dough lean: flour, water, salt, yeast.'],
    contemporary: ['Stone roughly 380–430 °C', 'Strong top heat', 'Bake roughly 90–150 sec', 'Control the floor so the base doesn\'t outrun the wetter crumb.'],
    canotto: ['Stone roughly 370–420 °C', 'Strong top heat', 'Keep the floor under control'],
    hybrid: ['Cooler than strict Neapolitan', '2–4 min bake'],
    nyneo: ['Run lower than Neapolitan', 'Several-minute bake'],
    ny: ['Lower flame / longer bake', 'Around 4–5 min to start'],
    roman: ['Lower floor, longer bake'],
    detroit: ['Pan and much lower heat'],
    pan: ['Pan and lower heat, long bake'],
    custom: ['Log stone and dome temps with bake time.']
  },
  home: {
    traditional: ['Hottest safe setting', 'Preheat stone/steel thoroughly', 'Finish under the grill if appropriate', 'Expect a different texture to a 450 °C oven.'],
    contemporary: ['Maximum heat', 'Steel transfers more heat to the base', 'Grill to boost top colour'],
    canotto: ['A home oven struggles with very wet canotto dough', 'Consider lower hydration or the hybrid preset'],
    hybrid: ['Good home-oven target', 'Preheat fully'],
    nyneo: ['Strong fit for home ovens', 'Steel if available'],
    ny: ['Excellent home-oven fit', 'Oil and sugar help browning'],
    roman: ['Thin/crisp suits a home oven'],
    detroit: ['Well suited — oiled pan'],
    pan: ['Well suited — pan oil for release'],
    custom: ['Use the hottest appropriate setup and log results.']
  }
};
function renderOven(p) {
  const g = ovenGuides[p.oven]?.[p.style] || ovenGuides[p.oven]?.custom || [];
  $('ovenResults').innerHTML = `<ul class="list">${g.map(x => `<li>${x}</li>`).join('')}</ul>`;
}

// ---------- render all ----------
let suppressCustom = false;
function renderAll() {
  syncVisibility();
  const p = readPlan();
  const out = computePlan(p);
  state.last = out;
  renderStyleRecommendation(p);
  renderFdt(out);
  renderRecipe(out);
  renderTimeline(out);
  renderMethod(out);
  renderOven(p);
  renderFlourTip(p);
  $('scheduleNote').innerHTML = `${esc(TEMPLATES[p.template]?.note || '')} Total ${round(out.totalHours, 2)} h.`;
  savePlanInputs();
  renderLiveSummary();
}

function syncVisibility() {
  $('manualYeastWrap').classList.toggle('hidden', $('yeastMode').value !== 'manual');
  const hasPref = $('prefermentType').value !== 'none';
  $('prefermentFields').classList.toggle('hidden', !hasPref);
  $('prefTempWrap').classList.toggle('hidden', !hasPref);
  const ir = state.profile.thermo === 'probe+ir';
  $('benchWrap').classList.toggle('hidden', !ir);
  document.querySelectorAll('.ir-only').forEach(el => el.classList.toggle('hidden', !ir));
}

// ---------- plan persistence ----------
const PLAN_FIELDS = ['pizzaStyle', 'flourProfile', 'balls', 'ballWeight', 'hydration', 'salt', 'oil', 'sugar', 'yeastType', 'yeastMode', 'manualYeastPct',
  'prefermentType', 'prefermentPct', 'prefermentHydration', 'prefermentHours', 'prefermentTemp', 'prefTempAtMix', 'scheduleTemplate',
  'bulkHours', 'bulkTemp', 'coldHours', 'fridgeTemp', 'coldForm', 'ballProofHours', 'ballProofTemp', 'mixMethod', 'friction',
  'roomTemp', 'flourTemp', 'tapTemp', 'coldWaterTemp', 'benchTemp', 'targetFdt', 'ovenProfile'];
function savePlanInputs() {
  const o = {};
  PLAN_FIELDS.forEach(id => { o[id] = $(id).value; });
  o.fdtAuto = $('fdtAuto').checked;
  store.set('pizzaLabPlanV3', o);
}
function loadPlanInputs() {
  const o = store.get('pizzaLabPlanV3', null);
  if (!o) return false;
  PLAN_FIELDS.forEach(id => { if (o[id] !== undefined && $(id)) $(id).value = o[id]; });
  $('fdtAuto').checked = o.fdtAuto !== false;
  return true;
}

function applyProfileDefaults() {
  const pr = state.profile;
  $('mixMethod').value = pr.method;
  $('friction').value = methodFF(pr.method);
  $('fridgeTemp').value = pr.fridge;
  $('tapTemp').value = pr.tap;
  $('coldWaterTemp').value = pr.coldWater;
  $('flourProfile').value = pr.flour;
  $('ovenProfile').value = pr.oven;
  $('yeastType').value = pr.yeast;
  $('balls').value = pr.balls;
  $('ballWeight').value = pr.ballW;
}

function resetCalc() {
  $('pizzaStyle').value = 'contemporary';
  $('hydration').value = 65; $('salt').value = 3.0; $('oil').value = 0; $('sugar').value = 0;
  $('yeastMode').value = 'auto'; $('manualYeastPct').value = '0.100';
  $('prefermentType').value = 'none'; $('prefermentPct').value = 30; $('prefermentHydration').value = 100; $('prefermentHours').value = 12; $('prefermentTemp').value = 18; $('prefTempAtMix').value = 18;
  $('roomTemp').value = 22; $('flourTemp').value = 22; $('bulkTemp').value = 22; $('ballProofTemp').value = 22; $('benchTemp').value = '';
  $('fdtAuto').checked = true;
  applyProfileDefaults();
  $('scheduleTemplate').value = 'sd8';
  applyTemplate();
}

function applyTemplate() {
  const t = TEMPLATES[$('scheduleTemplate').value];
  if (t && t.bulk !== undefined) {
    suppressCustom = true;
    $('bulkHours').value = t.bulk; $('coldHours').value = t.cold; $('ballProofHours').value = t.proof;
    if (t.coldForm) $('coldForm').value = t.coldForm;
    if ($('scheduleTemplate').value === 'rt24' && num('roomTemp') > 20) { $('bulkTemp').value = 18; }
    suppressCustom = false;
  }
  renderAll();
}

function applyPreset() {
  const s = styleProfiles[$('pizzaStyle').value];
  $('hydration').value = s.hydration; $('salt').value = s.salt; $('oil').value = s.oil; $('sugar').value = s.sugar;
  $('enrichDetails').open = s.oil > 0 || s.sugar > 0;
  renderAll();
}

function applyPrefermentDefaults() {
  const type = $('prefermentType').value;
  if (type === 'poolish') { $('prefermentPct').value = 30; $('prefermentHydration').value = 100; $('prefermentHours').value = 12; $('prefermentTemp').value = 18; }
  else if (type === 'biga') { $('prefermentPct').value = 50; $('prefermentHydration').value = 45; $('prefermentHours').value = 18; $('prefermentTemp').value = 18; }
  $('prefTempAtMix').value = $('prefermentTemp').value;
  renderAll();
}

// ---------- recipe text / save ----------
function recipeText(out = state.last) {
  const p = out.p, r = out.r;
  const sName = styleProfiles[p.style]?.name || p.style;
  let t = `${sName} — ${p.balls} × ${p.ballWeight} g @ ${p.hydration}%\nFlour ${grams(r.flour)} · Water ${grams(r.water)} at ${deg(out.waterUse)} · Salt ${grams(r.salt)} · ${yeastNames[p.yeastType]} ${grams(r.yeast)} (${pct(r.yeastPct, 3)})`;
  if (r.oil) t += ` · Oil ${grams(r.oil)}`;
  if (r.sugar) t += ` · Sugar ${grams(r.sugar)}`;
  if (p.pref) t += `\n${p.pref.type}: ${grams(r.pFlour)} flour + ${grams(r.pWater)} water + ${grams(r.pYeast)} yeast (${p.pref.hours} h @ ${p.pref.temp} °C)\nFinal mix: ${grams(r.finalFlour)} flour + ${grams(Math.max(0, r.finalWater))} water + ${grams(r.finalYeast)} yeast + salt`;
  t += `\nTarget dough temp ${deg(out.fdt)} (${METHODS[p.method].name}, friction ${p.friction})`;
  t += `\nSchedule: ${p.bulkHours} h @ ${p.bulkTemp} °C${p.coldHours ? ` + ${p.coldHours} h fridge @ ${p.fridgeTemp} °C (${p.coldForm})` : ''} + ${p.proofHours} h balls @ ${p.proofTemp} °C`;
  return t;
}
function saveRecipe() {
  const out = state.last;
  const def = `${styleProfiles[out.p.style]?.name || 'Pizza'} — ${out.p.balls} × ${out.p.ballWeight} g @ ${out.p.hydration}%`;
  const name = window.prompt('Recipe name', def);
  if (!name) return;
  state.recipes.unshift({ id: uid(), name, created: new Date().toISOString(), version: 3, plan: out.p, text: recipeText(out),
    // v2-compatible summary fields
    balls: out.p.balls, ballWeight: out.p.ballWeight, hydration: out.p.hydration, pizzaStyle: out.p.style, flourProfile: out.p.flourKey });
  persist(); renderJournal();
}
async function copyRecipe() {
  const txt = recipeText();
  try { await navigator.clipboard.writeText(txt); flash($('copyRecipe'), 'Copied ✓'); }
  catch { window.prompt('Copy this recipe:', txt); }
}
function flash(btn, text) { const old = btn.textContent; btn.textContent = text; setTimeout(() => { btn.textContent = old; }, 1400); }

// ---------- dough day ----------
function renderLiveSummary() {
  const out = state.last; if (!out) return;
  const p = out.p;
  $('liveSummary').innerHTML = `Plan: <strong>${deg(out.fdt)}</strong> dough · water <strong>${deg(out.waterUse)}</strong> · ${yeastShort[p.yeastType]} <strong>${grams(out.r.yeast)}</strong> · ${esc(METHODS[p.method].name)} (friction ${round(p.friction, 1)})${bakeDate(p) ? ` · bake ${fmtTime(bakeDate(p))}` : ''}`;
}
function prefillLive() {
  const out = state.last; if (!out) return;
  $('actWater').value = round(out.waterUse, 1);
  $('actRoom').value = out.p.room;
  $('actFlour').value = out.p.flourTemp;
  $('ballRoom').value = out.p.proofTemp;
}

function checkFdt() {
  const out = state.last; if (!out) return;
  const p = out.p;
  const fdt = parseFloat($('actFdt').value);
  if (!Number.isFinite(fdt)) { $('liveResults').innerHTML = '<div class="warning">Enter the dough temperature from your probe.</div>'; $('liveResults').classList.add('show'); return; }
  const water = num('actWater', out.waterUse), room = num('actRoom', p.room), flour = num('actFlour', p.flourTemp);
  const prefTemp = p.pref ? p.pref.tempAtMix : null;
  const ff = M.frictionFromMeasured({ fdt, water, room, flour, prefTemp });
  const miss = fdt - out.fdt;
  // re-plan using actual dough temperature
  const phases = out.phases.map(ph => Object.assign({}, ph));
  const ready = M.readinessTime(fdt, phases, out.mainIdy, p.salt, out.calib);
  const delta = ready.hours - out.totalHours; // + = slow, − = fast
  const mixTime = bakeDate(p) ? new Date(bakeDate(p).getTime() - out.totalHours * 3600000) : null;
  const readyClock = mixTime ? fmtTime(new Date(mixTime.getTime() + ready.hours * 3600000)) : `+${round(ready.hours, 1)} h`;
  const sugg = [];
  if (Math.abs(delta) <= 0.33) {
    sugg.push(Math.abs(miss) > 1
      ? `Even with the miss, the model still has it ready within ${Math.max(1, Math.round(Math.abs(delta) * 60))} min of plan — no changes needed. Watch the dough near the end.`
      : 'On track — no changes needed.');
  } else {
    const last = phases[phases.length - 1];
    const fast = delta < 0;
    // option 1: change final proof length
    const newProof = Math.max(0, last.hours + delta);
    sugg.push(`${fast ? 'Shorten' : 'Extend'} the ball proof to about <strong>${round(newProof, 1)} h</strong> (from ${round(last.hours, 1)} h).`);
    // option 2: change proof temperature to keep the bake time
    const tSolve = solveProofTemp(fdt, phases, out.mainIdy, p.salt, out.calib, out.totalHours);
    if (tSolve !== null) sugg.push(`Or keep the bake time and proof the balls at about <strong>${deg(tSolve)}</strong> instead of ${deg(last.temp)}${fast ? ' — a cooler spot, or the fridge for a while' : ' — a warmer spot (e.g. oven with just the light on — probe it first)'}.`);
    if (p.coldHours > 0 && fast) sugg.push('With a fridge phase: get it into the fridge sooner, and ball it first so it chills faster.');
  }
  $('liveResults').innerHTML = `
    <div class="metric-grid">
      <div class="metric"><div class="value">${deg(fdt)}</div><div class="label">actual dough · ${miss >= 0 ? '+' : ''}${round(miss, 1)} vs plan</div></div>
      <div class="metric hero"><div class="value">${round(ff, 1)}</div><div class="label">measured friction factor</div></div>
      <div class="metric"><div class="value">${readyClock}</div><div class="label">predicted ready</div></div>
    </div>
    <div class="${Math.abs(miss) <= 1 ? 'good-box' : 'warning'}">${Math.abs(miss) <= 1 ? 'Within 1 °C of target — nicely controlled.' : `Missed by ${round(Math.abs(miss), 1)} °C — the dough starts ${miss > 0 ? 'warmer (faster)' : 'cooler (slower)'} than planned.`}</div>
    <div class="info"><strong>Re-plan</strong> <span class="badge model">MODEL</span><ul class="list">${sugg.map(s => `<li>${s}</li>`).join('')}</ul></div>
    <button id="saveFF" class="secondary wide">Save ${round(ff, 1)} as my ${esc(METHODS[p.method].name)} friction factor</button>
    <div class="source-note">Friction = ${p.pref ? 4 : 3} × ${fdt} − (${room} room + ${flour} flour + ${water} water${p.pref ? ` + ${prefTemp} preferment` : ''}). King Arthur method 2. Recalibrate when batch size or knead time changes (Lehmann).</div>`;
  $('liveResults').classList.add('show');
  state.live = { fdt, ff, water, room, flour, method: p.method, delta };
  $('saveFF').addEventListener('click', () => {
    state.profile.friction[p.method] = { ff: round(ff, 1), date: new Date().toLocaleDateString([], { day: 'numeric', month: 'short' }) };
    persist();
    $('friction').value = round(ff, 1);
    renderAll(); renderKitchen();
    flash($('saveFF'), 'Saved ✓');
  });
}

function solveProofTemp(fdt, phases, idy, salt, calib, targetHours) {
  const need = M.heqNeededForIdy(idy, salt, calib);
  let lo = 4, hi = 32;
  const heqAt = (T) => M.simulate(fdt, phases.map((ph, i) => i === phases.length - 1 ? Object.assign({}, ph, { temp: T }) : ph)).heq;
  if (heqAt(hi) < need || heqAt(lo) > need) return null;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (heqAt(mid) < need) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

function checkBall() {
  const core = parseFloat($('ballCore').value);
  const room = num('ballRoom', 22);
  if (!Number.isFinite(core)) { $('ballResults').innerHTML = '<div class="warning">Enter the ball core temperature.</div>'; $('ballResults').classList.add('show'); return; }
  const to13 = M.minutesToReach(core, 13, room);
  const to18 = M.minutesToReach(core, 18, room);
  let msg;
  if (core >= 18) msg = '<div class="good-box">Warm enough. Open when the proof looks right.</div>';
  else if (core >= 13) msg = `<div class="good-box">OK to open (≥13 °C). ${room > 18 && Number.isFinite(to18) ? `It'll stretch easier at ~18 °C — about ${Math.round(to18)} min more.` : ''}</div>`;
  else if (core >= 10) msg = `<div class="warning">Workable minimum (PMQ: 10 °C) but stiff. About <strong>${Number.isFinite(to13) ? Math.round(to13) : '—'} min</strong> to 13 °C${Number.isFinite(to18) ? `, ${Math.round(to18)} min to 18 °C` : ''}.</div>`;
  else msg = `<div class="warning">Too cold to open well. About <strong>${Number.isFinite(to13) ? Math.round(to13) : '—'} min</strong> to 13 °C${Number.isFinite(to18) ? ` and ${Math.round(to18)} min to 18 °C` : ''} at ${deg(room)}.${room < 14 ? ' Find a warmer spot.' : ''}</div>`;
  $('ballResults').innerHTML = msg + '<div class="source-note"><span class="badge model">MODEL</span> Warm-up uses a ~2 h time constant for single balls. Opening temps: PMQ ≥10 °C, Modernist 13 °C, Stadler ≈18 °C.</div>';
  $('ballResults').classList.add('show');
}

// ---------- fix it ----------
const fixes = {
  hotdough: { cause: 'Water too warm for the conditions, or more mixer friction than you allowed for.',
    now: ['Get it cold quickly: ball now and put the balls in the fridge, spaced out.', 'Shorten room-temp time — use Dough day to see the new ready time.', 'Proof somewhere cooler.'],
    hour: ['Cool the balls in the fridge 30–60 min, then continue.'], later: ['Swap some room time for fridge time.'],
    next: ['Save the measured friction factor on Dough day so the water calc corrects itself.', 'Use colder water or iced water; chill the flour on hot days.', 'Autolyse before the TM7 knead and keep Dough mode short.'] },
  colddough: { cause: 'Water too cold or less friction than expected; cool room.',
    now: ['Proof somewhere warmer (probe the spot).', 'Give it more time rather than more flour.'], hour: ['Warmer spot, more time.'], later: ['Extend proof — Dough day will estimate how long.'],
    next: ['Save the measured friction factor so the water calc corrects.', 'Use slightly warmer water.'] },
  sticky: { cause: 'Too wet for the flour, weak gluten, or over-fermented (too warm / too long).',
    now: ['Light dusting of semolina/flour on the bench and peel — don\'t knead flour in now.', 'Handle quickly; a short chill firms it for launching.'], hour: ['Chill briefly if spreading, keep covered.'], later: ['Move it colder and shorten the warm proof.'],
    next: ['Check the dough temperature log first — warm dough is often the real cause.', 'Drop hydration 2–3 points, or use Nuvola for 68%+.', 'On humid days hold back a little water (anecdotal).'] },
  tearing: { cause: 'Weak gluten, too much protease activity, cold dough, or over-fermented.',
    now: ['Let it rest 10–15 min.', 'Pinch small holes closed rather than re-balling.'], hour: ['Rest covered and warm enough to relax.'], later: ['Make sure the ball core is ≥13 °C before opening.'],
    next: ['Shorter ferment or stronger flour (guide).', 'Better gluten development (one more fold set or 30 s more knead).'] },
  springback: { cause: 'Under-fermented, cold, or not relaxed.',
    now: ['10–20 min more rest.', 'Open in stages.'], hour: ['Keep covered at room temp.'], later: ['Extend proof; check core temperature.'],
    next: ['Warmer proof or longer bulk (guide).', 'Slightly less kneading.'] },
  flat: { cause: 'Over-fermented (collapsed structure) or gas pressed out of the rim.',
    now: ['Handle the rim gently; launch straight after topping.'], hour: ['If over-proofed, cool it and handle carefully.'], later: ['Watch for a soft, lively ball.'],
    next: ['Reduce time, lower temperature or cut yeast (guide).', 'Hit your target dough temperature — speed decides structure.'] },
  dense: { cause: 'Under-fermented or under-baked.',
    now: ['Bake a little longer; lighter toppings.'], hour: ['More proof time if still tight.'], later: ['Check dough temperature and progress, not just the clock.'],
    next: ['More fermentation, better heat balance.'] },
  pale: { cause: 'Under-fermented or too short / cool a bake.',
    now: ['More top heat; less bench flour on top.'], hour: ['Let the oven recover between pizzas.'], later: ['Check fermentation isn\'t underdeveloped.'],
    next: ['Longer ferment; preheat properly (guide).'] },
  burntbottom: { cause: 'Floor hotter than the top.',
    now: ['Move to a cooler part of the stone; less loose flour underneath.'], hour: ['Let the stone cool a little between pizzas; measure several spots.'], later: ['More top heat, less floor.'],
    next: ['Lower stone target for wetter / longer-bake styles.'] },
  overproof: { cause: 'Too warm, too long or too much yeast.',
    now: ['Handle as little as possible; bake it.'], hour: ['Cool briefly to improve handling.'], later: ['Move colder now; shorten the remaining proof.'],
    next: ['Log it as “Overproofed” in the journal — your yeast calibration will adjust.', 'Measure fridge and proof temps.'] },
  underproof: { cause: 'Too cold, too short, or old yeast.',
    now: ['Bake it — expect tighter texture.'], hour: ['Warmest sensible spot.'], later: ['Extend proof until relaxed and aerated.'],
    next: ['Log it as “Underproofed” — calibration will adjust.', 'Check yeast freshness and dough temperature.'] },
  sour: { cause: 'Over-fermentation, enzyme overload.',
    now: ['Bake it if structure is OK; flavour will be tangy.'], hour: ['Cool it down.'], later: ['Move to the fridge.'],
    next: ['Shorter ferment, cooler environment (guide).'] },
  fridgeblob: { cause: 'Dough went into the fridge warm (or as one big mass), the fridge is warmer than you think, or too much yeast for the time.',
    now: ['Degas gently, re-ball if it has time to relax (2 h+), otherwise bake it.'], hour: ['Keep it cold until you need it.'], later: ['Re-ball and return to the fridge.'],
    next: ['Measure the fridge with a glass of water + probe.', 'Ball before the fridge and space the balls (Modernist, PMQ).', 'Lower the dough temperature before chilling (PMQ).'] }
};
function diagnose() {
  const f = fixes[$('problem').value];
  const t = $('timeToBake').value;
  const items = f[t] || f.next;
  $('fixResults').innerHTML = `<div class="muted"><strong>Likely cause:</strong> ${esc(f.cause)}</div>
    <strong>${t === 'next' ? 'Next batch' : 'Do this now'}:</strong><ul class="list">${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="warning">Change one major variable at a time and log it — otherwise you won't know what fixed it.</div>`;
  $('fixResults').classList.add('show');
}
const ERROR_ROWS = [
  ['Collapsed / flat', 'Overproofed, too warm, too much yeast', 'Less time, lower temp, cut yeast'],
  ['Doesn\'t rise', 'Underproofed, cold, old yeast', 'Longer proof, check temps, fresh yeast'],
  ['Tears when stretching', 'Weak gluten, protease activity, cold balls', 'Shorter ferment, stronger flour, core ≥13 °C'],
  ['Tight / rubbery', 'Under-fermented, cold, not relaxed', 'Rest, warmer proof, longer bulk'],
  ['Sour or off smell', 'Over-fermented, enzyme overload', 'Shorter ferment, cooler'],
  ['Pale crust', 'Under-fermented or short bake', 'Longer ferment, preheat properly'],
  ['Rose a lot in the fridge', 'Went in warm, bulk mass, warm fridge', 'Ball first, measure fridge, cooler dough'],
  ['Dough too warm off the mixer', 'Water/friction mismatch', 'Calibrate friction, colder water']
];

// ---------- journal ----------
function fillMethodSelects() {
  const opts = Object.entries(METHODS).map(([k, m]) => `<option value="${k}">${esc(m.name)}</option>`).join('');
  $('jMethod').innerHTML = opts; $('pMethod').innerHTML = opts;
  $('pFlour').innerHTML = Object.entries(flourProfiles).map(([k, f]) => `<option value="${k}">${esc(f.name)}</option>`).join('');
  $('pOven').innerHTML = $('ovenProfile').innerHTML;
}

function fillJournalFromPlan() {
  const out = state.last; if (!out) return;
  const p = out.p, lv = state.live;
  $('jMethod').value = p.method;
  $('jRoom').value = lv ? lv.room : p.room;
  $('jFlour').value = lv ? lv.flour : p.flourTemp;
  $('jWater').value = lv ? lv.water : round(out.waterUse, 1);
  $('jFdt').value = lv ? lv.fdt : '';
  $('jPrefTemp').value = p.pref ? p.pref.tempAtMix : '';
  $('jIce').value = out.waterUse < p.coldWater - 0.2 ? 'yes' : 'no';
  $('jBulkH').value = p.bulkHours; $('jBulkT').value = p.bulkTemp;
  $('jColdH').value = p.coldHours; $('jColdT').value = p.fridgeTemp;
  $('jProofH').value = p.proofHours; $('jProofT').value = p.proofTemp;
  $('jYeastPct').value = round(out.r.yeastPct, 3);
  $('jBallW').value = p.ballWeight;
  $('jOven').value = $('ovenProfile').selectedOptions[0]?.text || '';
  $('jBallCore').value = $('ballCore').value || '';
}

const CALIB_STEP = { under: 1.2, slightunder: 1.08, right: 1, slightover: 0.93, over: 0.83 };
function saveBake() {
  const out = state.last;
  const rid = $('jRecipe').value;
  const rec = state.recipes.find(x => x.id === rid);
  const val = id => { const v = $(id).value; return v === '' ? null : (isNaN(Number(v)) ? v : Number(v)); };
  const bake = {
    id: uid(), version: 3, date: $('jDate').value || new Date().toISOString().slice(0, 10),
    recipeId: rid || null, recipeName: rec?.name || (out ? `${styleProfiles[out.p.style].name} ${out.p.balls}×${out.p.ballWeight} g` : ''),
    method: $('jMethod').value, mixTime: val('jMixTime'), room: val('jRoom'), flourTemp: val('jFlour'), water: val('jWater'), fdt: val('jFdt'),
    prefTemp: val('jPrefTemp'), ice: $('jIce').value, bulkH: val('jBulkH'), bulkT: val('jBulkT'), coldH: val('jColdH'), coldT: val('jColdT'),
    proofH: val('jProofH'), proofT: val('jProofT'), yeastPct: val('jYeastPct'), outcome: $('jOutcome').value,
    ballW: val('jBallW'), ballCore: val('jBallCore'), oven: $('jOven').value, stone: val('jStone'), bakeTime: val('jBakeTime'), rating: val('jRating'),
    scores: { rise: val('sRise'), crumb: val('sCrumb'), flavour: val('sFlavour'), handling: val('sHandling'), spring: val('sSpring') },
    notes: $('jNotes').value.trim(), plan: out ? out.p : null, yeastMode: out ? out.p.yeastMode : null
  };
  state.bakes.unshift(bake);
  let msg = 'Bake saved.';
  if ($('jApplyCalib').checked) {
    if (bake.yeastMode === 'auto') {
      const old = state.profile.calib || 1;
      const next = clamp(old * CALIB_STEP[bake.outcome], 0.4, 2.5);
      state.profile.calib = round(next, 3);
      state.profile.calibHistory.unshift({ date: bake.date, outcome: bake.outcome, from: old, to: state.profile.calib });
      state.profile.calibHistory = state.profile.calibHistory.slice(0, 20);
      msg += bake.outcome === 'right' ? ' Calibration unchanged — nailed it.' : ` Yeast calibration ×${round(old, 2)} → ×${round(state.profile.calib, 2)}.`;
    } else msg += ' Calibration skipped — that plan used manual yeast.';
  }
  persist();
  $('jNotes').value = '';
  $('journalMsg').innerHTML = `<div class="good-box">${msg}</div>`;
  renderJournal(); renderKitchen(); renderAll();
}

const OUTCOME_TEXT = { right: 'Just right', under: 'Underproofed', slightunder: 'A bit slow', slightover: 'A bit fast', over: 'Overproofed' };
function renderJournal() {
  $('jRecipe').innerHTML = '<option value="">Current plan (not saved)</option>' + state.recipes.map(r => `<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('');
  $('savedRecipes').innerHTML = state.recipes.length ? state.recipes.map(r => {
    const sName = styleProfiles[r.pizzaStyle]?.name || r.pizzaStyle || 'Recipe';
    const fName = flourProfiles[r.flourProfile]?.name || '';
    const text = r.text || legacyText(r);
    return `<div class="saved-item"><div class="saved-item-head"><div><h3>${esc(r.name)}</h3>
      <span class="pill">${esc(sName)}</span>${r.hydration !== undefined ? `<span class="pill">${r.hydration}%</span>` : ''}${r.balls ? `<span class="pill">${r.balls} × ${r.ballWeight} g</span>` : ''}${fName ? `<span class="pill">${esc(fName)}</span>` : ''}${r.version === 3 ? '<button class="pill pill-btn" data-load-recipe="' + esc(r.id) + '">Load into plan</button>' : ''}</div>
      <button class="delete-btn" data-delete-recipe="${esc(r.id)}">Delete</button></div>
      <p class="muted pre">${esc(text)}</p></div>`;
  }).join('') : '<p class="muted">Save a recipe from the Plan tab and it shows here.</p>';

  $('savedBakes').innerHTML = state.bakes.length ? state.bakes.map(b => {
    const sc = b.scores ? Object.entries(b.scores).filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => `${k} ${v}`).join(' · ') : '';
    return `<div class="saved-item"><div class="saved-item-head"><div><h3>${esc(b.date)} — ${esc(b.recipeName || 'Bake')}</h3>
      ${b.rating !== undefined && b.rating !== null ? `<span class="pill">${esc(b.rating)}/10</span>` : ''}
      ${b.outcome ? `<span class="pill">${esc(OUTCOME_TEXT[b.outcome] || b.outcome)}</span>` : ''}
      ${b.fdt !== undefined && b.fdt !== null ? `<span class="pill">FDT ${esc(b.fdt)} °C</span>` : ''}
      ${b.method ? `<span class="pill">${esc(METHODS[b.method]?.name || b.method)}</span>` : ''}
      ${b.oven ? `<span class="pill">${esc(b.oven)}</span>` : ''}</div>
      <button class="delete-btn" data-delete-bake="${esc(b.id)}">Delete</button></div>
      ${b.bulkH !== undefined && b.bulkH !== null ? `<p class="muted">${esc(b.bulkH)} h @ ${esc(b.bulkT)} °C${b.coldH ? ` + ${esc(b.coldH)} h fridge @ ${esc(b.coldT)} °C` : ''} + ${esc(b.proofH)} h @ ${esc(b.proofT)} °C · yeast ${esc(b.yeastPct)}%${b.water !== null && b.water !== undefined ? ` · water ${esc(b.water)} °C` : ''}${b.room !== null && b.room !== undefined ? ` · room ${esc(b.room)} °C` : ''}</p>` : ''}
      ${sc ? `<p class="muted">${esc(sc)}</p>` : ''}
      <p>${esc(b.notes || '')}</p></div>`;
  }).join('') : '<p class="muted">Your bake history shows here.</p>';
}
function legacyText(r) {
  let s = `${r.balls || '?'} × ${r.ballWeight || '?'} g`;
  if (r.hydration !== undefined) s += ` · ${r.hydration}%`;
  if (r.flour !== undefined) s += ` · ${grams(r.flour)} flour`;
  if (r.water !== undefined) s += ` · ${grams(r.water)} water`;
  if (r.yeastG !== undefined) s += ` · ${grams(r.yeastG)} yeast`;
  return s;
}
function loadRecipe(id) {
  const r = state.recipes.find(x => x.id === id);
  if (!r || !r.plan) return;
  const p = r.plan;
  const map = { pizzaStyle: p.style, flourProfile: p.flourKey, balls: p.balls, ballWeight: p.ballWeight, hydration: p.hydration, salt: p.salt, oil: p.oil, sugar: p.sugar,
    yeastType: p.yeastType, yeastMode: p.yeastMode, manualYeastPct: p.manualPct, scheduleTemplate: p.template, bulkHours: p.bulkHours, bulkTemp: p.bulkTemp,
    coldHours: p.coldHours, fridgeTemp: p.fridgeTemp, coldForm: p.coldForm, ballProofHours: p.proofHours, ballProofTemp: p.proofTemp, mixMethod: p.method, friction: methodFF(p.method),
    ovenProfile: p.oven, prefermentType: p.pref ? p.pref.type : 'none' };
  Object.entries(map).forEach(([k, v]) => { if (v !== undefined && $(k)) $(k).value = v; });
  if (p.pref) { $('prefermentPct').value = p.pref.pct; $('prefermentHydration').value = p.pref.hyd; $('prefermentHours').value = p.pref.hours; $('prefermentTemp').value = p.pref.temp; }
  renderAll();
  switchTab('plan');
}

function exportData() {
  const blob = new Blob([JSON.stringify({ app: 'pizza-lab', version: 3, exported: new Date().toISOString(), recipes: state.recipes, bakes: state.bakes, profile: state.profile }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `pizza-lab-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const merge = (cur, inc) => { const ids = new Set(cur.map(x => x.id)); return cur.concat((inc || []).filter(x => x && !ids.has(x.id))); };
      state.recipes = merge(state.recipes, data.recipes);
      state.bakes = merge(state.bakes, data.bakes);
      if (data.profile && window.confirm('Also replace My kitchen settings with the imported ones?')) state.profile = Object.assign({}, DEFAULT_PROFILE, data.profile);
      persist(); renderJournal(); renderKitchen(); renderAll();
      $('profileMsg').innerHTML = `<div class="good-box">Imported ${data.recipes?.length || 0} recipes and ${data.bakes?.length || 0} bakes (duplicates skipped).</div>`;
    } catch { $('profileMsg').innerHTML = '<div class="warning">That file isn\'t a Pizza Lab backup.</div>'; }
  };
  reader.readAsText(file);
}

// ---------- my kitchen ----------
function renderKitchen() {
  const pr = state.profile;
  $('pThermo').value = pr.thermo; $('pMethod').value = pr.method; $('pFridge').value = pr.fridge; $('pTap').value = pr.tap; $('pColdWater').value = pr.coldWater;
  $('pFlour').value = pr.flour; $('pOven').value = pr.oven; $('pYeast').value = pr.yeast; $('pBalls').value = pr.balls; $('pBallW').value = pr.ballW;
  $('frictionTable').innerHTML = Object.entries(METHODS).map(([k, m]) => {
    const saved = pr.friction[k];
    return `<div class="ff-row">
      <div class="ff-head"><strong>${esc(m.name)}</strong> <span class="badge ${saved && saved.date ? 'source' : m.basis}">${saved && saved.date ? `CALIBRATED ${esc(saved.date)}` : m.basisText}</span></div>
      <div class="ff-inputs"><input type="number" inputmode="decimal" step="0.5" value="${methodFF(k)}" data-ff="${k}" aria-label="${esc(m.name)} friction factor" /><button class="ghost small" data-ff-reset="${k}">Default (${m.ff})</button></div>
      <div class="source-note">${esc(m.note)} <a href="${m.src}" target="_blank" rel="noopener">Source ↗</a></div></div>`;
  }).join('');
  const hist = pr.calibHistory.slice(0, 6).map(h => `<li>${esc(h.date)} · ${esc(OUTCOME_TEXT[h.outcome] || h.outcome)} · ×${round(h.from, 2)} → ×${round(h.to, 2)}</li>`).join('');
  $('calibBox').innerHTML = `<div class="metric-grid"><div class="metric hero"><div class="value">×${round(pr.calib || 1, 2)}</div><div class="label">yeast calibration</div></div></div>
    <p class="muted small-text">Above 1 = your dough runs slower than the model, so it gets more yeast. Below 1 = it runs faster. Each journal entry nudges it: underproofed ×1.20, a bit slow ×1.08, a bit fast ×0.93, overproofed ×0.83.</p>
    ${hist ? `<ul class="list">${hist}</ul>` : '<p class="muted">No calibration history yet.</p>'}`;
}
function saveProfile() {
  const pr = state.profile;
  pr.thermo = $('pThermo').value; pr.method = $('pMethod').value; pr.fridge = num('pFridge', 5); pr.tap = num('pTap', 20); pr.coldWater = num('pColdWater', 5);
  pr.flour = $('pFlour').value; pr.oven = $('pOven').value; pr.yeast = $('pYeast').value; pr.balls = Math.round(num('pBalls', 4)); pr.ballW = num('pBallW', 280);
  document.querySelectorAll('[data-ff]').forEach(inp => {
    const k = inp.dataset.ff, v = parseFloat(inp.value);
    if (Number.isFinite(v) && v !== methodFF(k)) pr.friction[k] = { ff: v, date: new Date().toLocaleDateString([], { day: 'numeric', month: 'short' }) };
  });
  persist();
  $('fridgeTemp').value = pr.fridge; $('tapTemp').value = pr.tap; $('coldWaterTemp').value = pr.coldWater;
  $('friction').value = methodFF($('mixMethod').value);
  renderKitchen(); renderAll();
  $('profileMsg').innerHTML = '<div class="good-box">Saved. Plans now use these settings.</div>';
}

// ---------- learn ----------
const RULES = [
  ['Temperature is the speed control.', 'Same flour, water and yeast at 18 °C vs 26 °C is a different dough. Lehmann calls dough temperature “the key to effective dough management”.', 'Guide · Lehmann · King Arthur · Ooni · Stadler'],
  ['Hit a final dough temperature, using the water.', 'Water = 3 × target − (room + flour + friction); 4 × with a preferment. Italy\'s “Rule of 55” is the same idea with ~17 °C of mixer friction built in.', 'King Arthur · Lehmann/PMQ · guide · Scatti di Gusto'],
  ['Aim for 22–25 °C for Neapolitan.', 'Cooler for cold ferments and hot weather, warmer for cool kitchens and short doughs.', 'Ooni 21–26 °C by season · Italian Pizza Secrets 23–25 °C · Rule of 55 ≈ 24 °C · guide 22 °C'],
  ['Measure your mixer\'s friction — don\'t guess.', 'It changes with machine, knead time and batch size. A Thermomix runs much hotter than hands.', 'King Arthur · Lehmann · homebaking.at'],
  ['Match flour strength to time.', 'Caputo Pizzeria (W 260–280) is rated for 8–12 h; Nuvola for 24 h+. AVPN 00: W 250–320.', 'Caputo · AVPN · guide'],
  ['Get it cold fast; warm it before opening.', 'Ball before the fridge so it chills quickly. Open at ≥10–13 °C core; ~18 °C stretches best.', 'PMQ · Modernist Pizza · Stadler Made'],
  ['Know your real fridge temperature.', 'FSANZ says 5 °C or colder. A 7 °C fridge ferments about 2.5× faster than a 4 °C one.', 'FSANZ · Modernist Pizza · Pizza Lab model'],
  ['Read the dough, log the result, change one thing.', 'About 2× volume and a slow poke spring-back mean ready. Log temps every batch.', 'Gozney · Thermapen · Craig · guide Lab Protocol']
];
const VERIFY = [
  ['Temperature controls the whole system', 'ok', 'Agrees', 'Lehmann (Pizza Today, PMQ), King Arthur, Ooni, Stadler Made all put dough temperature first.'],
  ['Water temp = 3 × FDT − (flour + room + mixing factor)', 'ok', 'Correct', 'Same formula as King Arthur and Lehmann. King Arthur adds: use 4 × and include preferment temp when a preferment goes in — the guide leaves this out.'],
  ['Example: 3 × 22 − (21 + 20 + 10) = 15 °C', 'ok', 'Correct', 'Arithmetic checks out; Pizza Lab returns the same 15 °C.'],
  ['Mixing factor “typical FDT increase”: spiral +8–12, stand +5–8, hand +2–4 °C', 'warn', 'Mislabelled, partly low', 'In the formula this is a friction factor, not the actual warm-up (friction ≈ 3 × the rise). Hand matches King Arthur (≈3–4 °C). Stand mixer is low vs King Arthur 12–13 °C / Hamelman 13–16 °C. No Thermomix figure — it runs hotter. All sources say: measure your own.'],
  ['Beginner recipe titled “24h, room temp dough”', 'warn', 'Mislabelled', 'The method actually spends 16–20 h in the fridge at 7 °C. Its 0.13% dry yeast is within ~20% of Pizza Lab\'s model for that schedule.'],
  ['“Salt 2.5% — technically high”', 'bad', 'Not supported', 'AVPN allows 40–60 g per litre of water ≈ 2.2–3.75% of flour, so 2.5% is low-to-mid. Salt does slow yeast (Univ. of Brașov test; Scatti di Gusto).'],
  ['W 280–300 flour for very long fermentation', 'ok', 'Agrees', 'AVPN 00 flour: W 250–320. Caputo rates Pizzeria (W 260–280) for 8–12 h and Nuvola for 24 h+. Your Pizzeria suits your short doughs.'],
  ['Fridge at 7 °C', 'warn', 'Warm', 'FSANZ: 5 °C or colder. Modernist Pizza: ~4 °C. At 7 °C dough ferments ~2.5× faster than at 4 °C, so the guide\'s yeast dose runs slow in a colder fridge.'],
  ['Bulk in the fridge, ball afterwards', 'warn', 'Works, but slower to chill', 'Modernist pre-shapes balls before cold-proofing; PMQ stresses chilling fast. A bulk mass takes hours to cool and keeps fermenting meanwhile.'],
  ['Error Point quick table', 'ok', 'Consistent', 'Matches Gozney (over/under signs, poke test), Thermapen and PMQ.'],
  ['Lab Test Protocol sheet', 'ok', 'Adopted', 'Now the Journal tab, with calibration built in.'],
  ['Not covered: ice, preferment ×4, chill time, opening temp, readiness cues, humidity', 'add', 'Added', 'Lehmann ice formula, King Arthur ×4 rule, PMQ/Modernist chilling and tempering, Gozney/Craig readiness, Fresh Loaf (anecdotal) humidity.']
];
function renderLearn() {
  $('rulesList').innerHTML = RULES.map(r => `<li><strong>${esc(r[0])}</strong><span>${esc(r[1])}</span><em>${esc(r[2])}</em></li>`).join('');
  const icon = { ok: '✓', warn: '!', bad: '✗', add: '+' };
  $('verifyTable').innerHTML = VERIFY.map(v => `<tr><td>${esc(v[0])}</td><td><span class="verdict ${v[1]}">${icon[v[1]]} ${esc(v[2])}</span></td><td>${esc(v[3])}</td></tr>`).join('');
  $('anchorTable').innerHTML = M.ANCHORS.map(a => {
    const s = M.simulate(a.fdt, a.phases);
    const pred = M.idyForHeq(s.heq, a.salt, 1);
    return `<tr><td>${esc(a.name)}<div class="muted small-text">${esc(a.note)}</div></td><td>${round(a.idy, 3)}</td><td>${round(pred, 3)}</td><td>${round(pred / a.idy, 2)}×</td></tr>`;
  }).join('');
  $('sourceList').innerHTML = SOURCE_GROUPS.map(g => `<h3 class="src-group">${esc(g.title)}</h3>` + g.items.map(([t, u, d]) =>
    u ? `<a href="${u}" target="_blank" rel="noopener"><strong>${esc(t)}</strong><span>${esc(d)}</span></a>` : `<div class="src-static"><strong>${esc(t)}</strong><span>${esc(d)}</span></div>`).join('')).join('');
  $('errorTable').innerHTML = ERROR_ROWS.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('');
}

// ---------- tabs / events ----------
function switchTab(id, scroll = true) {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.dataset.tab === id));
  document.querySelectorAll('.panel').forEach(x => x.classList.toggle('active', x.id === id));
  try { localStorage.setItem('pizzaLabTab', id); } catch { /* ignore */ }
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

let prevRoom = null;
function onRoomChange() {
  const room = num('roomTemp', 22);
  if (prevRoom !== null) {
    ['bulkTemp', 'ballProofTemp', 'flourTemp'].forEach(id => { if (Math.abs(num(id) - prevRoom) < 0.01) $(id).value = room; });
  }
  prevRoom = room;
  renderAll();
}

function wire() {
  const live = ['pizzaStyle', 'flourProfile', 'balls', 'ballWeight', 'hydration', 'salt', 'oil', 'sugar', 'yeastType', 'yeastMode', 'manualYeastPct',
    'prefermentPct', 'prefermentHydration', 'prefermentHours', 'prefermentTemp', 'prefTempAtMix', 'bakeTime', 'bulkTemp', 'fridgeTemp', 'coldForm',
    'ballProofTemp', 'friction', 'flourTemp', 'tapTemp', 'coldWaterTemp', 'benchTemp', 'targetFdt', 'fdtAuto', 'ovenProfile'];
  live.forEach(id => $(id).addEventListener('input', renderAll));
  ['bulkHours', 'coldHours', 'ballProofHours'].forEach(id => $(id).addEventListener('input', () => { if (!suppressCustom) $('scheduleTemplate').value = 'custom'; renderAll(); }));
  $('roomTemp').addEventListener('input', onRoomChange);
  $('fdtAuto').addEventListener('change', renderAll);
  $('scheduleTemplate').addEventListener('change', applyTemplate);
  $('prefermentType').addEventListener('change', applyPrefermentDefaults);
  $('mixMethod').addEventListener('change', () => { $('friction').value = methodFF($('mixMethod').value); renderAll(); });
  $('applyPreset').addEventListener('click', applyPreset);
  $('resetCalc').addEventListener('click', resetCalc);
  $('saveRecipe').addEventListener('click', saveRecipe);
  $('copyRecipe').addEventListener('click', copyRecipe);
  $('startDoughDay').addEventListener('click', () => { prefillLive(); switchTab('live'); });
  $('checkFdt').addEventListener('click', checkFdt);
  $('checkBall').addEventListener('click', checkBall);
  $('diagnose').addEventListener('click', diagnose);
  $('fillFromPlan').addEventListener('click', fillJournalFromPlan);
  $('saveBake').addEventListener('click', saveBake);
  $('exportData').addEventListener('click', exportData);
  $('exportData2').addEventListener('click', exportData);
  $('importData').addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); });
  $('saveProfile').addEventListener('click', saveProfile);
  $('pThermo').addEventListener('change', () => { state.profile.thermo = $('pThermo').value; persist(); renderAll(); });
  $('resetCalib').addEventListener('click', () => { state.profile.calib = 1; persist(); renderKitchen(); renderAll(); });
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.dataset.deleteRecipe) {
      if (!window.confirm('Delete this recipe?')) return;
      state.recipes = state.recipes.filter(x => x.id !== t.dataset.deleteRecipe); persist(); renderJournal();
    } else if (t.dataset.deleteBake) {
      if (!window.confirm('Delete this bake?')) return;
      state.bakes = state.bakes.filter(x => x.id !== t.dataset.deleteBake); persist(); renderJournal();
    } else if (t.dataset.loadRecipe) {
      loadRecipe(t.dataset.loadRecipe);
    } else if (t.dataset.ffReset) {
      delete state.profile.friction[t.dataset.ffReset]; persist(); renderKitchen();
      if ($('mixMethod').value === t.dataset.ffReset) $('friction').value = methodFF(t.dataset.ffReset);
      renderAll();
    }
  });
}

function setDefaultDates() {
  const now = new Date();
  const bake = new Date(now.getTime());
  bake.setHours(18, 0, 0, 0);
  if (bake.getTime() - now.getTime() < 9 * 3600000) bake.setDate(bake.getDate() + 1);
  const pad = n => String(n).padStart(2, '0');
  $('bakeTime').value = `${bake.getFullYear()}-${pad(bake.getMonth() + 1)}-${pad(bake.getDate())}T${pad(bake.getHours())}:${pad(bake.getMinutes())}`;
  $('jDate').value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// install prompt (Android/desktop Chrome)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; $('installBtn').classList.remove('hidden'); });
$('installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $('installBtn').classList.add('hidden');
});

// ---------- init ----------
fillMethodSelects();
wire();
if (!loadPlanInputs()) { resetCalc(); }
setDefaultDates();
prevRoom = num('roomTemp', 22);
renderLearn();
renderKitchen();
renderJournal();
renderAll();
prefillLive();
try { const tab = localStorage.getItem('pizzaLabTab'); if (tab && $(tab)) switchTab(tab, false); } catch { /* ignore */ }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
