const $ = (id) => document.getElementById(id);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const round = (n, d = 1) => Number(Number(n).toFixed(d));
const pct = (n, d = 2) => `${round(n, d)}%`;
const grams = (n) => `${n < 1 ? round(n, 2) : round(n, 1)}g`;

const SOURCE_URLS = {
  avpn: 'https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf',
  avpnRecipe: 'https://www.pizzanapoletana.org/en/ricetta_pizza_napoletana',
  caputoPizzeria: 'https://www.mulinocaputo.it/en/products/pizzeria/',
  caputoNuvola: 'https://www.mulinocaputo.it/en/products/nuvola/',
  ooniNeo: 'https://au.ooni.com/blogs/recipes/ooni-neapolitan-style-pizza-dough',
  ooniClassic: 'https://au.ooni.com/blogs/recipes/classic-pizza-dough',
  ooniNY: 'https://au.ooni.com/blogs/recipes/new-york-style-pizza-dough',
  ooniPoolish: 'https://au.ooni.com/blogs/recipes/our-best-poolish-dough',
  ooniBiga: 'https://au.ooni.com/blogs/recipes/100-biga'
};

const styleProfiles = {
  traditional: {
    name: 'Traditional Neapolitan', hydration: 60, salt: 3.0, oil: 0, sugar: 0,
    hydrationRange: [55.6, 62.5], saltRange: [2.2, 3.75],
    badge: 'source', badgeText: 'SOURCE',
    sourceText: 'AVPN permits 1 L water to 1.6–1.8 kg flour, 40–60 g salt, no fat or sugar, 200–280 g balls and 12–24 h overall fermentation.',
    sourceUrl: SOURCE_URLS.avpn
  },
  contemporary: {
    name: 'Contemporary Neapolitan', hydration: 65, salt: 3.0, oil: 0, sugar: 0,
    hydrationRange: [63, 70], saltRange: [2.5, 3.2],
    badge: 'source', badgeText: 'SOURCE + GUIDANCE',
    sourceText: 'The 65% baseline is from Ooni’s current Neapolitan-style formula. The wider 63–70% working range is Pizza Lab guidance, not an official standard.',
    sourceUrl: SOURCE_URLS.ooniNeo
  },
  canotto: {
    name: 'Canotto / high-hydration', hydration: 70, salt: 2.8, oil: 0, sugar: 0,
    hydrationRange: [68, 75], saltRange: [2.5, 3.2],
    badge: 'guidance', badgeText: 'GUIDANCE',
    sourceText: 'Pizza Lab working preset. High hydration is not a formal AVPN category; flour strength, mixing and fermentation control become more important.',
    sourceUrl: SOURCE_URLS.ooniNeo
  },
  hybrid: {
    name: 'Modern hybrid', hydration: 68, salt: 2.8, oil: 1.0, sugar: 0,
    hydrationRange: [65, 72], saltRange: [2.5, 3.2],
    badge: 'guidance', badgeText: 'GUIDANCE',
    sourceText: 'Pizza Lab working preset for a slightly longer, crisper bake than strict Neapolitan. Oil is optional and should be reduced to 0% at very high bake temperatures.',
    sourceUrl: SOURCE_URLS.ooniNeo
  },
  nyneo: {
    name: 'NY–Neapolitan hybrid', hydration: 68, salt: 2.8, oil: 1.5, sugar: 0.5,
    hydrationRange: [64, 70], saltRange: [2.5, 3.2],
    badge: 'guidance', badgeText: 'GUIDANCE',
    sourceText: 'Pizza Lab hybrid preset positioned between lean Neapolitan dough and Ooni’s enriched New York formula.',
    sourceUrl: SOURCE_URLS.ooniNY
  },
  ny: {
    name: 'New York', hydration: 65, salt: 3.0, oil: 5.0, sugar: 1.0,
    hydrationRange: [60, 65], saltRange: [2.5, 3.2],
    badge: 'source', badgeText: 'SOURCE',
    sourceText: 'Rounded from Ooni’s published NY formula: 567 g water, 872 g flour, 26 g salt, 44 g oil and 9 g sugar — about 65%, 3%, 5% and 1%.',
    sourceUrl: SOURCE_URLS.ooniNY
  },
  roman: {
    name: 'Roman / thin-crisp', hydration: 60, salt: 2.7, oil: 2.0, sugar: 0,
    hydrationRange: [55, 65], saltRange: [2.3, 3.0],
    badge: 'guidance', badgeText: 'GUIDANCE',
    sourceText: 'Pizza Lab working preset for a thin, crisp result. Roman pizza has multiple distinct styles, so use this as a starting point rather than a standard.',
    sourceUrl: SOURCE_URLS.ooniClassic
  },
  detroit: {
    name: 'Detroit / pan', hydration: 72, salt: 2.5, oil: 0, sugar: 0,
    hydrationRange: [70, 80], saltRange: [2.2, 3.0],
    badge: 'guidance', badgeText: 'GUIDANCE',
    sourceText: 'Pizza Lab working range for high-hydration pan dough. Pan oil is separate from dough oil and is not included here.',
    sourceUrl: 'https://au.ooni.com/blogs/recipes/ooni-detroit-style-pizza-dough-using-halo-pro'
  },
  pan: {
    name: 'General pan pizza', hydration: 70, salt: 2.5, oil: 2.0, sugar: 0,
    hydrationRange: [65, 78], saltRange: [2.2, 3.0],
    badge: 'guidance', badgeText: 'GUIDANCE',
    sourceText: 'Pizza Lab general-purpose pan preset. Adjust around your pan, flour, oven and desired crumb.',
    sourceUrl: SOURCE_URLS.ooniClassic
  },
  custom: {
    name: 'Custom', hydration: 65, salt: 2.8, oil: 0, sugar: 0,
    hydrationRange: null, saltRange: null,
    badge: 'guidance', badgeText: 'CUSTOM',
    sourceText: 'No style assumptions. You control the formula.',
    sourceUrl: null
  }
};

const flourProfiles = {
  'caputo-pizzeria': {
    name: 'Caputo Pizzeria', type: '00', protein: '12.5%', strength: 'W 260–280', pl: '0.50–0.60',
    sourceText: 'Mulino Caputo lists Pizzeria for classic Neapolitan pizza with 12.5% protein and W 260–280.',
    sourceUrl: SOURCE_URLS.caputoPizzeria,
    workingHydration: [58, 70],
    guidance: 'Pizza Lab working guidance: excellent for classic and contemporary Neapolitan. Above ~70% hydration, handling and fermentation control become less forgiving.'
  },
  'caputo-nuvola': {
    name: 'Caputo Nuvola', type: '0', protein: '12.5%', strength: 'W 270–290', pl: '0.50–0.60',
    sourceText: 'Mulino Caputo lists Nuvola for focaccia, pan and contemporary pizza, with 12.5% protein and W 270–290. Caputo also gives an approximately 72-hour example: 48 h refrigerated + 24 h at about 22°C.',
    sourceUrl: SOURCE_URLS.caputoNuvola,
    workingHydration: [63, 75],
    guidance: 'Pizza Lab working guidance: a better starting choice than Pizzeria when chasing a larger, airier rim and higher hydration.'
  },
  strong: {
    name: 'Strong bread flour', type: 'varies', protein: 'check pack', strength: 'unknown', pl: 'unknown',
    sourceText: 'No single official specification — this profile is generic.', sourceUrl: null,
    workingHydration: [60, 75], guidance: 'Check the actual flour protein/W rating. “Bread flour” varies substantially by brand.'
  },
  plain: {
    name: 'Plain / AP flour', type: 'varies', protein: 'check pack', strength: 'usually lower', pl: 'unknown',
    sourceText: 'No single official specification — this profile is generic.', sourceUrl: null,
    workingHydration: [55, 65], guidance: 'Start conservatively. Long ferments and high hydration can overwhelm weaker plain flour.'
  },
  custom: {
    name: 'Custom / unknown', type: 'unknown', protein: 'unknown', strength: 'unknown', pl: 'unknown',
    sourceText: 'Enter your formula and use the bake journal to tune it.', sourceUrl: null,
    workingHydration: null, guidance: 'Change one main variable per bake so you can see what actually helped.'
  }
};

const yeastFactors = { idy: 1, ady: 1.3, fresh: 3.0 };
const yeastNames = { idy: 'instant dry yeast', ady: 'active dry yeast', fresh: 'fresh yeast' };

const state = {
  recipes: JSON.parse(localStorage.getItem('pizzaLabRecipes') || '[]'),
  bakes: JSON.parse(localStorage.getItem('pizzaLabBakes') || '[]')
};

function getNum(id, fallback = 0) {
  const n = Number($(id).value);
  return Number.isFinite(n) ? n : fallback;
}

function getPreferment() {
  const type = $('prefermentType').value;
  if (type === 'none') return { type, pct: 0, hydration: 0, yeastShare: 0, hours: 0, temp: 20 };
  return {
    type,
    pct: clamp(getNum('prefermentPct'), 0, 100),
    hydration: clamp(getNum('prefermentHydration'), 0, 150),
    yeastShare: clamp(getNum('prefermentYeastShare'), 0, 100),
    hours: Math.max(0, getNum('prefermentHours')),
    temp: getNum('prefermentTemp', 20)
  };
}

function tempActivity(tempC) {
  // Pizza Lab model: Q10-style activity around 18°C, with extra suppression in refrigeration.
  let activity = Math.pow(2, (tempC - 18) / 10);
  if (tempC < 10) {
    const coldModifier = clamp(0.35 + ((tempC - 4) / 6) * 0.40, 0.20, 0.75);
    activity *= coldModifier;
  }
  return clamp(activity, 0.03, 4.0);
}

function getFermentationPlan() {
  return {
    bulkHours: Math.max(0, getNum('bulkHours')),
    bulkTemp: getNum('bulkTemp', 22),
    coldHours: Math.max(0, getNum('coldHours')),
    fridgeTemp: getNum('fridgeTemp', 4),
    proofHours: Math.max(0, getNum('ballProofHours')),
    proofTemp: getNum('ballProofTemp', 22),
    calibration: getNum('yeastCalibration', 1)
  };
}

function yeastEstimate() {
  const type = $('yeastType').value;
  const factor = yeastFactors[type] || 1;
  const mode = $('yeastMode').value;
  const pref = getPreferment();
  const plan = getFermentationPlan();

  if (mode === 'manual') {
    const actualPct = Math.max(0, getNum('manualYeastPct'));
    return {
      mode, type, actualPct, idyPct: actualPct / factor,
      lowIdyPct: actualPct / factor, highIdyPct: actualPct / factor,
      effectiveHours: null, coefficient: null
    };
  }

  const bulkEff = plan.bulkHours * tempActivity(plan.bulkTemp);
  const coldEff = plan.coldHours * tempActivity(plan.fridgeTemp);
  const proofEff = plan.proofHours * tempActivity(plan.proofTemp);
  const prefFraction = pref.pct / 100;
  const prefEff = pref.type === 'none' ? 0 : pref.hours * tempActivity(pref.temp) * prefFraction;
  const effectiveHours = Math.max(0.5, bulkEff + coldEff + proofEff + prefEff);

  // Calibrated to two published Ooni anchors:
  // ~0.44% IDY for a 3–4 hour 60% dough, and ~0.058% IDY for a ~25 hour 65% dough.
  let coefficient;
  if (effectiveHours <= 8) coefficient = 2.6;
  else if (effectiveHours < 16) coefficient = 2.6 - ((effectiveHours - 8) / 8) * 1.15;
  else coefficient = 1.45;

  const idyPct = clamp((coefficient / effectiveHours) * plan.calibration, 0.005, 1.5);
  return {
    mode, type,
    idyPct,
    actualPct: idyPct * factor,
    lowIdyPct: idyPct * 0.8,
    highIdyPct: idyPct * 1.2,
    effectiveHours,
    coefficient,
    bulkEff, coldEff, proofEff, prefEff
  };
}

function calcRecipeData() {
  const balls = Math.max(0, getNum('balls'));
  const ballWeight = Math.max(0, getNum('ballWeight'));
  const hydration = Math.max(0, getNum('hydration'));
  const salt = Math.max(0, getNum('salt'));
  const oil = Math.max(0, getNum('oil'));
  const sugar = Math.max(0, getNum('sugar'));
  const total = balls * ballWeight;
  const yeast = yeastEstimate();
  const yeastPct = yeast.actualPct;

  const bakerTotalPct = 100 + hydration + salt + oil + sugar + yeastPct;
  const flour = total / (bakerTotalPct / 100);
  const water = flour * hydration / 100;
  const saltG = flour * salt / 100;
  const oilG = flour * oil / 100;
  const sugarG = flour * sugar / 100;
  const yeastG = flour * yeastPct / 100;

  const pref = getPreferment();
  const pFlour = pref.type === 'none' ? 0 : flour * pref.pct / 100;
  const pWater = pref.type === 'none' ? 0 : pFlour * pref.hydration / 100;
  const pYeast = pref.type === 'none' ? 0 : yeastG * pref.yeastShare / 100;
  const finalFlour = flour - pFlour;
  const finalWater = water - pWater;
  const finalYeast = yeastG - pYeast;
  const computedTotal = flour + water + saltG + oilG + sugarG + yeastG;

  return {
    balls, ballWeight, total, hydration, salt, oil, sugar,
    yeastPct, yeast, flour, water, saltG, oilG, sugarG, yeastG,
    bakerTotalPct, computedTotal,
    pType: pref.type, pPct: pref.pct, pHyd: pref.hydration, pYeastShare: pref.yeastShare,
    pHours: pref.hours, pTemp: pref.temp,
    pFlour, pWater, pYeast, finalFlour, finalWater, finalYeast,
    flourProfile: $('flourProfile').value,
    pizzaStyle: $('pizzaStyle').value,
    ovenProfile: $('ovenProfile').value,
    yeastType: $('yeastType').value,
    fermentation: getFermentationPlan()
  };
}

function getStyleWarnings(r) {
  const p = styleProfiles[r.pizzaStyle];
  const warnings = [];
  const infos = [];
  if (p?.hydrationRange && (r.hydration < p.hydrationRange[0] || r.hydration > p.hydrationRange[1])) {
    warnings.push(`${r.hydration}% hydration is outside this preset’s ${p.hydrationRange[0]}–${p.hydrationRange[1]}% working range.`);
  }
  if (p?.saltRange && (r.salt < p.saltRange[0] || r.salt > p.saltRange[1])) {
    warnings.push(`${r.salt}% salt is outside this preset’s ${p.saltRange[0]}–${p.saltRange[1]}% working range.`);
  }
  if (r.pizzaStyle === 'traditional') {
    if (r.oil > 0 || r.sugar > 0) warnings.push('AVPN traditional Neapolitan dough specifies no added fat or sugar.');
    if (r.ballWeight < 200 || r.ballWeight > 280) warnings.push('AVPN gives 200–280 g as the example dough-ball range for 22–35 cm pizzas.');
  }
  if (r.ovenProfile === 'home' && ['traditional', 'contemporary', 'canotto'].includes(r.pizzaStyle)) {
    infos.push('A home oven can make excellent pizza, but it cannot reproduce the same bake profile as a 400–500°C pizza oven. Consider the hybrid or NY preset if you want more browning/crispness.');
  }
  if (r.ovenProfile !== 'home' && r.oil >= 3 && ['traditional', 'contemporary', 'canotto'].includes(r.pizzaStyle)) {
    infos.push('At very high pizza-oven temperatures, enriched dough browns faster. Lean dough is normally easier to control.');
  }
  if (r.pizzaStyle === 'ny' && (r.oil < 3 || r.sugar === 0)) {
    infos.push('Ooni’s published NY formula uses about 5% oil and 1% sugar; your custom values are leaner than that source recipe.');
  }
  return { warnings, infos };
}

function renderRecipe() {
  const r = calcRecipeData();
  const prefImpossible = r.pType !== 'none' && r.finalWater < -0.001;
  const styleMsg = getStyleWarnings(r);
  let prefHtml = '';

  if (r.pType !== 'none') {
    const label = r.pType === 'poolish' ? 'Poolish' : 'Biga';
    prefHtml = `
      <div class="divider"></div>
      <strong>${label} split</strong>
      <div class="metric-grid" style="margin-top:10px">
        <div class="metric"><div class="value">${grams(r.pFlour)}</div><div class="label">preferment flour</div></div>
        <div class="metric"><div class="value">${grams(r.pWater)}</div><div class="label">preferment water</div></div>
        <div class="metric"><div class="value">${grams(r.pYeast)}</div><div class="label">preferment yeast</div></div>
        <div class="metric"><div class="value">${grams(r.finalFlour)}</div><div class="label">final flour</div></div>
        <div class="metric"><div class="value">${grams(Math.max(0, r.finalWater))}</div><div class="label">final water</div></div>
        <div class="metric"><div class="value">${grams(r.finalYeast)}</div><div class="label">final yeast</div></div>
      </div>
      <div class="source-note">Overall hydration remains ${r.hydration}% — the preferment water is subtracted from the final mix rather than added on top.</div>
      ${prefImpossible ? '<div class="warning"><strong>Impossible split:</strong> the preferment contains more water than the whole recipe allows. Lower prefermented flour %, lower preferment hydration, or raise total hydration.</div>' : ''}
      ${r.pType === 'poolish' && Math.abs(r.pHyd - 100) > 0.1 ? '<div class="info">Poolish is conventionally 100% hydration; this custom setting is no longer a classic poolish.</div>' : ''}
      ${r.pType === 'biga' && r.pHyd > 60 ? '<div class="info">Biga is normally a stiff/low-hydration preferment. Above about 60% you are moving away from the usual biga concept.</div>' : ''}
    `;
  }

  const yeastRange = r.yeast.mode === 'auto'
    ? `<div class="source-note"><span class="badge model">MODEL</span> Starting range: ${pct(r.yeast.lowIdyPct * yeastFactors[r.yeastType], 3)}–${pct(r.yeast.highIdyPct * yeastFactors[r.yeastType], 3)} ${yeastNames[r.yeastType]}. The centre value below is used for the exact dough-weight calculation.</div>`
    : `<div class="source-note">Manual yeast percentage selected.</div>`;

  $('calcResults').innerHTML = `
    <div class="metric-grid">
      <div class="metric"><div class="value">${round(r.total, 0)}g</div><div class="label">target dough</div></div>
      <div class="metric"><div class="value">${grams(r.flour)}</div><div class="label">flour · 100%</div></div>
      <div class="metric"><div class="value">${grams(r.water)}</div><div class="label">water · ${pct(r.hydration,1)}</div></div>
      <div class="metric"><div class="value">${grams(r.saltG)}</div><div class="label">salt · ${pct(r.salt,2)}</div></div>
      <div class="metric"><div class="value">${grams(r.yeastG)}</div><div class="label">${yeastNames[r.yeastType]} · ${pct(r.yeastPct,3)}</div></div>
      <div class="metric"><div class="value">${grams(r.oilG)}</div><div class="label">oil · ${pct(r.oil,2)}</div></div>
      <div class="metric"><div class="value">${grams(r.sugarG)}</div><div class="label">sugar · ${pct(r.sugar,2)}</div></div>
    </div>
    ${yeastRange}
    ${prefHtml}
    ${styleMsg.warnings.map(w => `<div class="warning">${w}</div>`).join('')}
    ${styleMsg.infos.map(w => `<div class="info">${w}</div>`).join('')}
  `;

  $('mathExplanation').innerHTML = `
    <div class="math-line"><strong>1.</strong> Target dough = ${r.balls} × ${r.ballWeight} g = <strong>${round(r.total,0)} g</strong></div>
    <div class="math-line"><strong>2.</strong> Total baker's % = 100 + ${r.hydration} + ${r.salt} + ${round(r.yeastPct,3)} + ${r.oil} + ${r.sugar} = <strong>${round(r.bakerTotalPct,3)}%</strong></div>
    <div class="math-line"><strong>3.</strong> Flour = ${round(r.total,0)} ÷ ${round(r.bakerTotalPct / 100,5)} = <strong>${grams(r.flour)}</strong></div>
    <div class="math-line"><strong>4.</strong> Water = ${grams(r.flour)} × ${r.hydration}% = <strong>${grams(r.water)}</strong></div>
    <div class="math-line"><strong>5.</strong> Salt = ${grams(r.flour)} × ${r.salt}% = <strong>${grams(r.saltG)}</strong></div>
    <div class="math-line"><strong>6.</strong> Yeast = ${grams(r.flour)} × ${round(r.yeastPct,3)}% = <strong>${grams(r.yeastG)}</strong></div>
    <div class="math-line"><strong>Check.</strong> Flour + water + salt + yeast + oil + sugar = <strong>${round(r.computedTotal,2)} g</strong></div>
  `;

  updateFlourTip(r);
  updateStyleRecommendation();
  updateOven(r);
  return r;
}

function updateStyleRecommendation() {
  const p = styleProfiles[$('pizzaStyle').value];
  const oven = $('ovenProfile').value;
  let ovenText = '';
  if (oven === 'home' && ['traditional', 'contemporary', 'canotto'].includes($('pizzaStyle').value)) {
    ovenText = ' In a conventional oven, the style will bake differently from a high-temperature Neapolitan oven.';
  } else if (oven !== 'home' && p.oil >= 3) {
    ovenText = ' If you cook this enriched formula at Neapolitan temperatures, watch the floor closely because it will colour faster.';
  }
  $('styleRecommendation').innerHTML = `
    <h3>${p.name} starting point <span class="badge ${p.badge}">${p.badgeText}</span></h3>
    <div class="rec-grid">
      <div class="rec"><strong>${p.hydration}%</strong><span>hydration</span></div>
      <div class="rec"><strong>${p.salt}%</strong><span>salt</span></div>
      <div class="rec"><strong>${p.oil}%</strong><span>oil</span></div>
      <div class="rec"><strong>${p.sugar}%</strong><span>sugar</span></div>
    </div>
    <div class="source-note">${p.sourceText}${ovenText}${p.sourceUrl ? ` <a href="${p.sourceUrl}" target="_blank" rel="noopener">Open source ↗</a>` : ''}</div>
  `;
}

function updateFlourTip(r = calcRecipeData()) {
  const f = flourProfiles[$('flourProfile').value];
  const warnings = [];
  if (f.workingHydration && (r.hydration < f.workingHydration[0] || r.hydration > f.workingHydration[1])) {
    warnings.push(`${r.hydration}% is outside Pizza Lab’s ${f.workingHydration[0]}–${f.workingHydration[1]}% working zone for this flour profile.`);
  }
  $('flourTip').innerHTML = `
    <div><strong>${f.name}</strong> · ${f.type} · ${f.protein} protein · ${f.strength}${f.pl !== 'unknown' ? ` · P/L ${f.pl}` : ''}</div>
    <p>${f.sourceText} ${f.sourceUrl ? `<a href="${f.sourceUrl}" target="_blank" rel="noopener">Manufacturer source ↗</a>` : ''}</p>
    <div class="source-note"><span class="badge guidance">GUIDANCE</span> ${f.guidance}</div>
    ${warnings.map(w => `<div class="warning">${w}</div>`).join('')}
  `;
}

function applyPreset() {
  const p = styleProfiles[$('pizzaStyle').value];
  $('hydration').value = p.hydration;
  $('salt').value = p.salt;
  $('oil').value = p.oil;
  $('sugar').value = p.sugar;
  renderAll();
}

function applyPrefermentDefaults() {
  const type = $('prefermentType').value;
  if (type === 'poolish') {
    $('prefermentPct').value = 33;
    $('prefermentHydration').value = 100;
    $('prefermentYeastShare').value = 100;
    $('prefermentHours').value = 12;
    $('prefermentTemp').value = 20;
  } else if (type === 'biga') {
    $('prefermentPct').value = 50;
    $('prefermentHydration').value = 45;
    $('prefermentYeastShare').value = 100;
    $('prefermentHours').value = 16;
    $('prefermentTemp').value = 18;
  }
  renderAll();
}

function formatDate(d) {
  return d.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

function updatePlanner() {
  const bakeRaw = $('bakeTime').value;
  if (!bakeRaw) return;
  const bake = new Date(bakeRaw);
  if (Number.isNaN(bake.getTime())) return;
  const plan = getFermentationPlan();
  const pref = getPreferment();
  const r = calcRecipeData();
  const mainHours = plan.bulkHours + plan.coldHours + plan.proofHours;
  const mix = new Date(bake.getTime() - mainHours * 3600000);
  const coldStart = new Date(mix.getTime() + plan.bulkHours * 3600000);
  const ballStart = new Date(coldStart.getTime() + plan.coldHours * 3600000);
  const prefStart = new Date(mix.getTime() - pref.hours * 3600000);
  const y = r.yeast;

  const warnings = [];
  if (y.mode === 'auto' && y.effectiveHours < 7) warnings.push('Very fast fermentation: yeast dose becomes sensitive and flavour development is limited.');
  if (plan.proofHours > 6 && plan.proofTemp >= 22) warnings.push('Long warm ball proof: watch for spreading and loss of strength rather than blindly following the clock.');
  if (plan.fridgeTemp > 6 && plan.coldHours >= 24) warnings.push('A warm fridge can ferment far faster than the planner assumes. Measure the actual shelf temperature if possible.');
  if (plan.bulkHours === 0 && plan.coldHours > 0) warnings.push('Zero room-temperature bulk is workable, but make sure the dough is mixed/developed properly before chilling.');

  const timeline = [];
  if (pref.type !== 'none') timeline.push(`<div class="timeline-item"><strong>${formatDate(prefStart)}</strong>Make ${pref.type} · ${pref.hours} h @ ${pref.temp}°C</div>`);
  timeline.push(`<div class="timeline-item"><strong>${formatDate(mix)}</strong>${pref.type !== 'none' ? 'Mix final dough / combine preferment' : 'Mix dough'} · start bulk</div>`);
  if (plan.coldHours > 0) timeline.push(`<div class="timeline-item"><strong>${formatDate(coldStart)}</strong>Move to fridge · ${plan.coldHours} h @ ${plan.fridgeTemp}°C</div>`);
  if (plan.proofHours > 0) timeline.push(`<div class="timeline-item"><strong>${formatDate(ballStart)}</strong>Ball dough / final proof · ${plan.proofHours} h @ ${plan.proofTemp}°C</div>`);
  timeline.push(`<div class="timeline-item"><strong>${formatDate(bake)}</strong>Bake</div>`);

  $('plannerResults').innerHTML = `
    <div class="metric-grid">
      <div class="metric"><div class="value">${grams(r.yeastG)}</div><div class="label">${yeastNames[r.yeastType]}</div></div>
      <div class="metric"><div class="value">${pct(y.idyPct,3)}</div><div class="label">IDY equivalent</div></div>
      <div class="metric"><div class="value">${y.effectiveHours === null ? 'manual' : `${round(y.effectiveHours,1)}h`}</div><div class="label">temperature-weighted time</div></div>
    </div>
    ${y.mode === 'auto' ? `<div class="info"><span class="badge model">MODEL</span> Suggested ${yeastNames[r.yeastType]} range: <strong>${pct(y.lowIdyPct * yeastFactors[r.yeastType],3)}–${pct(y.highIdyPct * yeastFactors[r.yeastType],3)}</strong>. The centre value is used in the recipe.</div>` : '<div class="info">Manual yeast mode is active. The planner is not changing your yeast dose.</div>'}
    <div class="divider"></div>
    <div class="timeline">${timeline.join('')}</div>
    <div class="source-note">Model basis: short-ferment and ~25-hour Ooni formulas provide the yeast anchors; the temperature weighting and cold suppression are Pizza Lab modelling. This is intentionally transparent rather than presented as an official fermentation law.</div>
    ${warnings.map(w => `<div class="warning">${w}</div>`).join('')}
  `;
}

const ovenGuides = {
  sidekick: {
    traditional: ['Stone target: roughly 400–450°C', 'Strong top heat / flame', 'Bake roughly 60–110 sec', 'If the base scorches before the top colours, reduce floor heat rather than adding oil/sugar.'],
    contemporary: ['Stone target: roughly 380–430°C', 'Strong top heat', 'Bake roughly 90–150 sec', 'Higher hydration generally needs slightly more controlled floor heat.'],
    canotto: ['Stone target: roughly 370–420°C', 'Strong top heat', 'Bake roughly 90–150 sec', 'Prioritise top heat and gluten/fermentation control over simply pushing hydration higher.'],
    hybrid: ['Stone target: roughly 330–400°C', 'Moderate-high top heat', 'Bake roughly 2–4 min', 'A touch of oil can be useful if you deliberately run a longer/cooler bake.'],
    nyneo: ['Stone target: roughly 320–380°C', 'Lower flame than Neapolitan', 'Bake roughly 3–5 min', 'Enrichment will colour faster than lean dough.'],
    ny: ['Stone target: roughly 290–340°C', 'Moderate top heat', 'Bake roughly 4–7 min', 'Ooni’s NY formula uses oil and sugar specifically for the longer, lower-temperature bake.'],
    roman: ['Run cooler than Neapolitan', 'Aim for a longer bake and dry/crisp finish', 'Keep toppings light', 'Exact Roman styles vary, so tune against the result you want.'],
    detroit: ['Use a properly oiled pan', 'Bake long enough to set the high-hydration crumb', 'Manage bottom heat so the cheese edge crisps without scorching', 'Pan dimensions matter as much as dough percentage.'],
    pan: ['Oil the pan separately', 'Use moderate-high heat with enough time to set the crumb', 'Do not confuse pan oil with dough oil', 'Judge doneness through the centre, not only the edge colour.'],
    custom: ['Use your selected formula and log stone temperature, flame setting and bake time.', 'Change one variable at a time.']
  },
  'high-temp': {
    traditional: ['AVPN-style pizza is designed for very high heat', 'Stone roughly 400–450°C', 'Strong radiant/top heat', 'Keep dough lean: flour, water, salt and yeast.'],
    contemporary: ['Stone roughly 380–430°C', 'Strong radiant/top heat', 'Bake roughly 90–150 sec', 'Control the floor so the base does not outrun the wetter crumb.'],
    canotto: ['Stone roughly 370–420°C', 'Strong top heat', 'Keep the floor under control', 'High hydration is only useful if the dough retains strength.'],
    hybrid: ['Cool the oven compared with strict Neapolitan', 'Aim for a 2–4 min bake', 'A crisper result usually needs more time rather than more flame.'],
    nyneo: ['Run lower than Neapolitan', 'Target a several-minute bake', 'Watch enriched dough carefully.'],
    ny: ['Ooni notes NY pizza is generally cooked much cooler than Neapolitan', 'Lower flame / longer bake', 'Aim around 4–5 min as a starting point.'],
    roman: ['Lower floor and longer bake', 'Prioritise crispness and drying rather than huge oven spring.'],
    detroit: ['Use a pan and substantially lower heat than Neapolitan', 'Long enough bake to set the centre.'],
    pan: ['Use a pan and lower heat', 'Long bake to set crumb and crisp base.'],
    custom: ['Log actual stone and air/top heat conditions alongside bake time.']
  },
  home: {
    traditional: ['Use the hottest safe oven setting', 'Preheat stone/steel thoroughly', 'Finish under the grill/broiler if appropriate', 'Expect a different texture from a 450°C pizza oven.'],
    contemporary: ['Maximum oven heat', 'Steel can help transfer more heat into the base', 'Use grill/broiler to boost top colour if safe', 'Very high hydration may be harder to set before the crust dries.'],
    canotto: ['A home oven is not ideal for a very wet canotto-style dough', 'Consider reducing hydration or switching to modern hybrid.'],
    hybrid: ['Good home-oven target', 'Preheat steel/stone fully', 'Bake until browned and crisp', 'Small enrichment can help colour.'],
    nyneo: ['Strong fit for home ovens', 'Use steel if available', 'Oil/sugar can help colour during the longer bake.'],
    ny: ['Excellent home-oven fit', 'Ooni’s NY recipes use lower bake temperatures than Neapolitan', 'Steel is useful for a crisp base', 'Oil and sugar support browning and texture.'],
    roman: ['Home oven suits a thin/crisp approach', 'Use steel/stone and a longer bake', 'Keep the centre thin and toppings controlled.'],
    detroit: ['Home oven is well suited to Detroit/pan styles', 'Use a properly oiled pan', 'Bake until the centre is fully set.'],
    pan: ['Home oven is well suited to pan pizza', 'Use pan oil for release/crispness', 'Allow enough bake time for the centre.'],
    custom: ['Use the hottest appropriate setup and log actual results.']
  }
};

function updateOven(r = calcRecipeData()) {
  const guide = ovenGuides[r.ovenProfile]?.[r.pizzaStyle] || ovenGuides[r.ovenProfile]?.custom || [];
  $('ovenResults').innerHTML = `<ul class="list">${guide.map(x => `<li>${x}</li>`).join('')}</ul>`;
}

const fixes = {
  sticky: {
    now: ['Use a light dusting of semolina/flour on the bench and peel — do not knead extra flour into the ball now.', 'Handle quickly and preserve the rim.', 'If the ball is extremely slack, a short chill can firm it enough to launch.'],
    hour: ['Chill briefly if spreading badly, then bring it back out before opening.', 'Keep it covered so the surface does not skin over.'],
    later: ['Move it colder and shorten the remaining warm proof if fermentation is racing.'],
    next: ['Reduce hydration a few points before changing everything else.', 'Use stronger flour or improve gluten development.', 'Reduce yeast/warm time if the dough is also overproofed.']
  },
  tearing: {
    now: ['Stop stretching aggressively and let the dough relax for 10–15 minutes if time allows.', 'Patch small holes by pinching rather than reballing the whole dough.', 'Use less force near the centre.'],
    hour: ['Rest the balls covered and warm enough to relax.', 'Do not keep kneading finished balls.'],
    later: ['Give the gluten time to relax; avoid repeated reballing.'],
    next: ['Improve gluten development and avoid excessive fermentation.', 'Use a stronger flour if long fermentation/high hydration repeatedly causes tearing.']
  },
  springback: {
    now: ['Give the ball 10–20 minutes more rest if possible.', 'Open in stages rather than forcing final diameter immediately.'],
    hour: ['Keep covered at room temperature and allow the gluten to relax.'],
    later: ['Extend final proof if the dough is still tight and underfermented.'],
    next: ['Increase final ball proof or slightly reduce mixing intensity if dough is consistently too elastic.']
  },
  flat: {
    now: ['Handle the rim gently and avoid pressing gas out of the edge.', 'Use strong top heat and launch promptly after topping.'],
    hour: ['If underproofed, give it more warm time.', 'If overproofed and weak, cool it and handle carefully rather than kneading it again.'],
    later: ['Watch for visible aeration and a soft, lively ball before baking.'],
    next: ['Tune fermentation before chasing extreme hydration.', 'Improve gluten strength and avoid degassing during balling/opening.']
  },
  dense: {
    now: ['Bake a little longer if the centre is genuinely undercooked.', 'Use less wet/heavy topping.'],
    hour: ['Allow more proof time if the dough still feels tight and heavy.'],
    later: ['Check dough temperature and fermentation progress rather than relying only on the clock.'],
    next: ['Use adequate fermentation and a better top/bottom heat balance.', 'For very wet dough, make sure the oven can set the crumb before the base burns.']
  },
  pale: {
    now: ['Increase top heat or finish closer to the flame/grill.', 'Avoid excess bench flour on the top surface.'],
    hour: ['Let the oven fully recover between pizzas.'],
    later: ['Check that fermentation is not extremely underdeveloped.'],
    next: ['For lower-temperature ovens, style-appropriate oil/sugar can improve browning.', 'Fix heat balance before dramatically extending bake time.']
  },
  burntbottom: {
    now: ['Move the pizza to a cooler part of the stone and reduce floor exposure.', 'Increase top heat if possible while reducing bottom heat.', 'Use less loose flour/semolina under the pizza.'],
    hour: ['Let the stone cool slightly between pizzas.', 'Measure several stone locations rather than one hot spot.'],
    later: ['Change the heat balance: more top, less floor.'],
    next: ['Target a lower stone temperature for wetter or longer-bake styles.', 'If the oven routinely overheats the floor, use a repeatable heat-management method.']
  },
  overproof: {
    now: ['Handle as little as possible.', 'Use a scraper, dust lightly and open gently.', 'Bake it rather than trying to repair it with lots of kneading.'],
    hour: ['Cool it briefly to improve handling.', 'Avoid aggressive reballing if the gluten is already weak.'],
    later: ['Move it colder now and shorten the remaining warm proof.'],
    next: ['Use less yeast, less warm time or a colder fridge/dough.', 'Record actual dough and room temperatures.']
  },
  underproof: {
    now: ['You can bake it, but expect tighter texture and more springback.', 'Give it the warmest sensible spot while the oven heats.'],
    hour: ['Keep it covered and warm for the remaining time.'],
    later: ['Extend warm proof until the ball is relaxed and visibly aerated.'],
    next: ['Increase yeast slightly or allow more warm fermentation.', 'Measure dough temperature after mixing.']
  }
};

function diagnose() {
  const problem = $('problem').value;
  const timing = $('timeToBake').value;
  const notes = $('problemNotes').value.trim();
  const items = fixes[problem]?.[timing] || fixes[problem]?.next || [];
  $('fixResults').innerHTML = `
    <strong>Do this ${timing === 'next' ? 'next batch' : 'now'}:</strong>
    <ul class="list">${items.map(x => `<li>${x}</li>`).join('')}</ul>
    ${notes ? `<div class="divider"></div><div class="muted">Your note: ${escapeHtml(notes)}</div>` : ''}
    <div class="warning">Change one major variable at a time and record the result — otherwise you won't know what fixed it.</div>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

function recipeText(r = calcRecipeData()) {
  const styleName = styleProfiles[r.pizzaStyle]?.name || r.pizzaStyle;
  let text = `${styleName}\n${r.balls} × ${r.ballWeight}g pizza balls\nTotal dough: ${round(r.total,0)}g\nFlour: ${grams(r.flour)}\nWater: ${grams(r.water)} (${r.hydration}%)\nSalt: ${grams(r.saltG)} (${r.salt}%)\n${yeastNames[r.yeastType]}: ${grams(r.yeastG)} (${round(r.yeastPct,3)}%)`;
  if (r.oil) text += `\nOil: ${grams(r.oilG)} (${r.oil}%)`;
  if (r.sugar) text += `\nSugar: ${grams(r.sugarG)} (${r.sugar}%)`;
  if (r.pType !== 'none') {
    text += `\n${r.pType === 'poolish' ? 'Poolish' : 'Biga'}: ${grams(r.pFlour)} flour + ${grams(r.pWater)} water + ${grams(r.pYeast)} yeast`;
    text += `\nFinal mix: ${grams(r.finalFlour)} flour + ${grams(Math.max(0,r.finalWater))} water + ${grams(r.finalYeast)} yeast + ${grams(r.saltG)} salt`;
  }
  const plan = r.fermentation;
  text += `\nFermentation: ${plan.bulkHours}h @ ${plan.bulkTemp}°C + ${plan.coldHours}h @ ${plan.fridgeTemp}°C + ${plan.proofHours}h @ ${plan.proofTemp}°C`;
  return text;
}

function saveRecipe() {
  const r = calcRecipeData();
  const defaultName = `${styleProfiles[r.pizzaStyle]?.name || 'Pizza'} — ${r.balls} × ${r.ballWeight}g @ ${r.hydration}%`;
  const name = window.prompt('Recipe name', defaultName);
  if (!name) return;
  state.recipes.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name, created: new Date().toISOString(), version: 2, ...r });
  persist();
  renderJournal();
}

async function copyRecipe() {
  const txt = recipeText();
  try {
    await navigator.clipboard.writeText(txt);
    alert('Recipe copied.');
  } catch {
    window.prompt('Copy this recipe:', txt);
  }
}

function persist() {
  localStorage.setItem('pizzaLabRecipes', JSON.stringify(state.recipes));
  localStorage.setItem('pizzaLabBakes', JSON.stringify(state.bakes));
}

function legacyRecipeText(r) {
  if (r.version === 2 && r.yeastG !== undefined) return recipeText(r);
  let s = `${r.balls || '?'} × ${r.ballWeight || '?'}g pizza balls`;
  if (r.hydration !== undefined) s += ` · ${r.hydration}% hydration`;
  if (r.flour !== undefined) s += ` · ${grams(r.flour)} flour`;
  return s;
}

function renderJournal() {
  const select = $('journalRecipe');
  select.innerHTML = state.recipes.length
    ? state.recipes.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('')
    : '<option value="">No saved recipes yet</option>';

  $('savedRecipes').innerHTML = state.recipes.length ? state.recipes.map(r => {
    const flourName = flourProfiles[r.flourProfile]?.name || 'Flour';
    const styleName = styleProfiles[r.pizzaStyle]?.name || r.pizzaStyle || 'Legacy recipe';
    return `
      <div class="saved-item">
        <div class="saved-item-head">
          <div><h3>${escapeHtml(r.name)}</h3><span class="pill">${escapeHtml(styleName)}</span><span class="pill">${r.hydration}% hydration</span><span class="pill">${r.balls} × ${r.ballWeight}g</span><span class="pill">${escapeHtml(flourName)}</span></div>
          <button class="delete-btn" data-delete-recipe="${r.id}">Delete</button>
        </div>
        <p class="muted">${escapeHtml(legacyRecipeText(r)).replace(/\n/g, ' · ')}</p>
      </div>`;
  }).join('') : '<p class="muted">Save a calculator recipe and it will appear here.</p>';

  $('savedBakes').innerHTML = state.bakes.length ? state.bakes.map(b => `
    <div class="saved-item">
      <div class="saved-item-head">
        <div><h3>${escapeHtml(b.date)} — ${escapeHtml(b.recipeName || 'Unlinked recipe')}</h3><span class="pill">${b.rating}/10</span><span class="pill">${escapeHtml(b.oven || '')}</span></div>
        <button class="delete-btn" data-delete-bake="${b.id}">Delete</button>
      </div>
      <p>${escapeHtml(b.notes || 'No notes.')}</p>
    </div>`).join('') : '<p class="muted">Your bake history will appear here.</p>';
}

function saveBake() {
  const rid = $('journalRecipe').value;
  const r = state.recipes.find(x => x.id === rid);
  state.bakes.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: $('journalDate').value || new Date().toISOString().slice(0, 10),
    rating: getNum('journalRating'),
    recipeId: rid,
    recipeName: r?.name || '',
    oven: $('journalOven').value.trim(),
    notes: $('journalNotes').value.trim()
  });
  persist();
  $('journalNotes').value = '';
  renderJournal();
}

function exportData() {
  const blob = new Blob([JSON.stringify({ version: 2, exported: new Date().toISOString(), ...state }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pizza-lab-v2-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

function setDefaultDates() {
  const now = new Date();
  const bake = new Date(now.getTime() + 24 * 3600000);
  bake.setHours(18, 0, 0, 0);
  const pad = n => String(n).padStart(2, '0');
  $('bakeTime').value = `${bake.getFullYear()}-${pad(bake.getMonth() + 1)}-${pad(bake.getDate())}T${pad(bake.getHours())}:${pad(bake.getMinutes())}`;
  $('journalDate').value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function resetCalc() {
  $('pizzaStyle').value = 'contemporary';
  $('ovenProfile').value = 'sidekick';
  $('flourProfile').value = 'caputo-pizzeria';
  $('yeastType').value = 'idy';
  $('yeastMode').value = 'auto';
  $('manualYeastPct').value = '0.100';
  $('balls').value = 4;
  $('ballWeight').value = 280;
  $('hydration').value = 65;
  $('salt').value = 3.0;
  $('oil').value = 0;
  $('sugar').value = 0;
  $('prefermentType').value = 'none';
  $('prefermentPct').value = 30;
  $('prefermentHydration').value = 100;
  $('prefermentYeastShare').value = 100;
  $('prefermentHours').value = 12;
  $('prefermentTemp').value = 20;
  $('yeastCalibration').value = '1';
  $('bulkHours').value = 2;
  $('bulkTemp').value = 22;
  $('coldHours').value = 20;
  $('fridgeTemp').value = 4;
  $('ballProofHours').value = 3;
  $('ballProofTemp').value = 22;
  syncYeastMode();
  renderAll();
}

function syncYeastMode() {
  $('manualYeastWrap').classList.toggle('hidden', $('yeastMode').value !== 'manual');
}

function renderAll() {
  syncYeastMode();
  renderRecipe();
  updatePlanner();
}

// Tabs
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  $(btn.dataset.tab).classList.add('active');
}));

['balls', 'ballWeight', 'hydration', 'salt', 'oil', 'sugar', 'flourProfile', 'pizzaStyle', 'ovenProfile', 'yeastType', 'yeastMode', 'manualYeastPct', 'prefermentPct', 'prefermentHydration', 'prefermentYeastShare', 'prefermentHours', 'prefermentTemp']
  .forEach(id => $(id).addEventListener('input', renderAll));

$('prefermentType').addEventListener('change', applyPrefermentDefaults);
['bakeTime', 'yeastCalibration', 'bulkHours', 'bulkTemp', 'coldHours', 'fridgeTemp', 'ballProofHours', 'ballProofTemp']
  .forEach(id => $(id).addEventListener('input', renderAll));

$('applyPreset').addEventListener('click', applyPreset);
$('diagnose').addEventListener('click', diagnose);
$('saveRecipe').addEventListener('click', saveRecipe);
$('copyRecipe').addEventListener('click', copyRecipe);
$('saveBake').addEventListener('click', saveBake);
$('exportData').addEventListener('click', exportData);
$('resetCalc').addEventListener('click', resetCalc);

document.addEventListener('click', e => {
  const rr = e.target.dataset.deleteRecipe;
  const rb = e.target.dataset.deleteBake;
  if (rr) {
    state.recipes = state.recipes.filter(x => x.id !== rr);
    state.bakes = state.bakes.filter(x => x.recipeId !== rr);
    persist();
    renderJournal();
  }
  if (rb) {
    state.bakes = state.bakes.filter(x => x.id !== rb);
    persist();
    renderJournal();
  }
});

let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  $('installBtn').classList.remove('hidden');
});
$('installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $('installBtn').classList.add('hidden');
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
setDefaultDates();
resetCalc();
renderJournal();
