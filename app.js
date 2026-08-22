const $ = (id) => document.getElementById(id);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const round = (n, d=1) => Number(n.toFixed(d));

const flourProfiles = {
  'caputo-pizzeria': {name:'Caputo Pizzeria', note:'A classic Neapolitan 00 flour. For your Sidekick, 60–70% hydration is a sensible working zone while you dial in fermentation and handling.'},
  'caputo-nuvola': {name:'Caputo Nuvola', note:'Designed to support a lighter, airier rim. It generally tolerates higher hydration than Pizzeria, but high hydration still needs strong mixing and fermentation control.'},
  'strong': {name:'Strong bread flour', note:'Usually forgiving for longer ferments and higher hydration. Exact behaviour depends on protein and flour strength.'},
  'plain': {name:'Plain/AP flour', note:'Usually best with more conservative hydration and shorter fermentation than strong pizza flour.'},
  'custom': {name:'Custom flour', note:'Start conservatively and change one variable per bake. Flour absorption varies massively.'}
};

const state = {
  recipes: JSON.parse(localStorage.getItem('pizzaLabRecipes') || '[]'),
  bakes: JSON.parse(localStorage.getItem('pizzaLabBakes') || '[]')
};

function calcRecipe() {
  const balls = +$('balls').value || 0;
  const ballWeight = +$('ballWeight').value || 0;
  const hydration = +$('hydration').value || 0;
  const salt = +$('salt').value || 0;
  const oil = +$('oil').value || 0;
  const sugar = +$('sugar').value || 0;
  const total = balls * ballWeight;
  const factor = 1 + hydration/100 + salt/100 + oil/100 + sugar/100;
  const flour = total / factor;
  const water = flour * hydration/100;
  const saltG = flour * salt/100;
  const oilG = flour * oil/100;
  const sugarG = flour * sugar/100;
  const pType = $('prefermentType').value;
  const pPct = +$('prefermentPct').value || 0;
  const pHyd = +$('prefermentHydration').value || 0;
  const pFlour = pType === 'none' ? 0 : flour * pPct/100;
  const pWater = pType === 'none' ? 0 : pFlour * pHyd/100;
  const finalFlour = flour - pFlour;
  const finalWater = water - pWater;

  let prefHtml = '';
  if (pType !== 'none') {
    const impossible = finalWater < 0;
    prefHtml = `
      <div class="divider"></div>
      <strong>${pType === 'poolish' ? 'Poolish' : 'Biga'} split</strong>
      <div class="metric-grid" style="margin-top:10px">
        <div class="metric"><div class="value">${round(pFlour)}g</div><div class="label">preferment flour</div></div>
        <div class="metric"><div class="value">${round(pWater)}g</div><div class="label">preferment water</div></div>
        <div class="metric"><div class="value">${round(finalFlour)}g</div><div class="label">final flour</div></div>
        <div class="metric"><div class="value">${round(finalWater)}g</div><div class="label">final water</div></div>
      </div>
      ${impossible ? '<div class="warning">That preferment contains more water than the full recipe allows. Lower prefermented flour %, preferment hydration, or raise total hydration.</div>' : ''}
    `;
  }

  $('calcResults').innerHTML = `
    <div class="metric-grid">
      <div class="metric"><div class="value">${round(total,0)}g</div><div class="label">total dough</div></div>
      <div class="metric"><div class="value">${round(flour)}g</div><div class="label">flour</div></div>
      <div class="metric"><div class="value">${round(water)}g</div><div class="label">water</div></div>
      <div class="metric"><div class="value">${round(saltG)}g</div><div class="label">salt</div></div>
      <div class="metric"><div class="value">${round(oilG)}g</div><div class="label">oil</div></div>
      <div class="metric"><div class="value">${round(sugarG)}g</div><div class="label">sugar</div></div>
    </div>
    ${prefHtml}
  `;

  const flourInfo = flourProfiles[$('flourProfile').value];
  $('flourTip').innerHTML = `<strong>${flourInfo.name}:</strong> ${flourInfo.note}`;

  return {balls, ballWeight, total, hydration, salt, oil, sugar, flour, water, saltG, oilG, sugarG, pType, pPct, pHyd, pFlour, pWater, finalFlour, finalWater, flourProfile:$('flourProfile').value, pizzaStyle:$('pizzaStyle').value};
}

function yeastEquiv(idy, type) {
  if (type === 'fresh') return idy * 3.0;
  if (type === 'ady') return idy * 1.25;
  return idy;
}

function tempActivity(tempC) {
  // Practical Q10-style approximation around 22 C. Not a predictive fermentation model.
  return Math.pow(2, (tempC - 22) / 10);
}

function formatDate(d) {
  return d.toLocaleString([], {weekday:'short', day:'numeric', month:'short', hour:'numeric', minute:'2-digit'});
}

function updatePlanner() {
  const bakeRaw = $('bakeTime').value;
  if (!bakeRaw) return;
  const bake = new Date(bakeRaw);
  const bulkHours = +$('bulkHours').value || 0;
  const bulkTemp = +$('bulkTemp').value || 22;
  const coldHours = +$('coldHours').value || 0;
  const fridgeTemp = +$('fridgeTemp').value || 4;
  const proofHours = +$('ballProofHours').value || 0;
  const proofTemp = +$('ballProofTemp').value || 22;
  const totalHours = bulkHours + coldHours + proofHours;
  const mix = new Date(bake.getTime() - totalHours*3600000);
  const coldStart = new Date(mix.getTime() + bulkHours*3600000);
  const ballStart = new Date(coldStart.getTime() + coldHours*3600000);

  const effectiveHours = bulkHours*tempActivity(bulkTemp) + coldHours*tempActivity(fridgeTemp) + proofHours*tempActivity(proofTemp);
  // A conservative home-pizza starting heuristic for IDY as baker's %.
  const idyPct = clamp(1.8 / Math.max(effectiveHours, 2), 0.015, 1.0);
  const recipe = calcRecipe();
  const idyGrams = recipe.flour * idyPct/100;
  const yeastType = $('yeastType').value;
  const yeastGrams = yeastEquiv(idyGrams, yeastType);
  const yeastLabel = yeastType === 'fresh' ? 'fresh yeast' : yeastType === 'ady' ? 'active dry yeast' : 'instant dry yeast';

  const warnings = [];
  if (effectiveHours < 6) warnings.push('Short fermentation: flavour development will be limited and the yeast dose becomes more sensitive.');
  if (effectiveHours > 60) warnings.push('Long fermentation: flour strength and fridge temperature matter a lot. Watch the dough, not only the clock.');
  if (proofHours < 1.5) warnings.push('Very short final ball proof. Dough may be tight and spring back when opening.');
  if (proofHours > 6 && proofTemp >= 22) warnings.push('Long warm ball proof. Keep an eye out for spreading or overproofing.');

  $('plannerResults').innerHTML = `
    <div class="metric-grid">
      <div class="metric"><div class="value">${round(yeastGrams,2)}g</div><div class="label">${yeastLabel}</div></div>
      <div class="metric"><div class="value">${round(idyPct,3)}%</div><div class="label">IDY equivalent</div></div>
      <div class="metric"><div class="value">${round(effectiveHours,1)}h</div><div class="label">temperature-weighted time</div></div>
    </div>
    <div class="divider"></div>
    <div class="timeline">
      <div class="timeline-item"><strong>${formatDate(mix)}</strong>Mix dough / start bulk</div>
      <div class="timeline-item"><strong>${formatDate(coldStart)}</strong>Move to fridge${bulkHours === 0 ? ' / start cold fermentation' : ''}</div>
      <div class="timeline-item"><strong>${formatDate(ballStart)}</strong>Ball dough and final proof</div>
      <div class="timeline-item"><strong>${formatDate(bake)}</strong>Bake</div>
    </div>
    <div class="warning"><strong>Yeast is a starting point.</strong> Real fermentation varies with dough temperature, yeast age, flour, salt, handling and fridge cycling. Log each bake and tune the number for your setup.</div>
    ${warnings.map(w=>`<div class="warning">${w}</div>`).join('')}
  `;
}

const ovenGuides = {
  sidekick: {
    neo: ['Stone: roughly 400–450°C', 'Strong top heat / flame', 'Bake: about 60–110 sec', 'If the base scorches first, lower stone temperature or reduce direct bottom heat before chasing more top colour.'],
    contemporary: ['Stone: roughly 380–430°C', 'Strong top heat', 'Bake: about 90–150 sec', 'Higher hydration benefits from a touch more time and controlled bottom heat.'],
    hybrid: ['Stone: roughly 330–400°C', 'Moderate-high top heat', 'Bake: about 2–4 min', 'Useful if you want more crispness while keeping an airy rim.'],
    ny: ['Stone/steel: roughly 290–340°C', 'Moderate top heat', 'Bake: about 4–7 min', 'Oil/sugar can help colour at lower temperatures.']
  },
  'high-temp': {
    neo: ['Stone: roughly 400–450°C', 'Dome: roughly 450–500°C', 'Bake: about 60–100 sec', 'Rotate early and often.'],
    contemporary: ['Stone: roughly 380–430°C', 'Dome: strong radiant heat', 'Bake: about 90–150 sec', 'Control the floor to avoid burning before the rim sets.'],
    hybrid: ['Stone: roughly 330–400°C', 'Moderate-high dome heat', 'Bake: about 2–4 min', 'Aim for crisp base plus open rim.'],
    ny: ['Stone: roughly 290–340°C', 'Lower flame / longer bake', 'Bake: about 4–7 min', 'A very hot Neapolitan oven often needs to cool down for NY style.']
  },
  home: {
    neo: ['Use the hottest setting available', 'Preheat stone/steel thoroughly', 'Use top grill/broiler near the finish if safe', 'Expect a longer bake and a different texture from a 450°C pizza oven.'],
    contemporary: ['Use maximum oven heat', 'Strong preheat on steel/stone', 'Finish under grill if needed', 'Keep hydration manageable so the centre sets before the crust dries out.'],
    hybrid: ['Excellent home-oven target', 'Steel or stone fully preheated', 'Bake until crisp and browned', 'This style is often more achievable than strict Neapolitan at home.'],
    ny: ['Steel is ideal if you have one', 'Preheat at maximum temperature', 'Bake until deeply browned and crisp', 'Oil/sugar can improve colour depending on your oven.']
  }
};

function updateOven() {
  const guide = ovenGuides[$('ovenProfile').value][$('ovenStyle').value];
  $('ovenResults').innerHTML = `<ul class="list">${guide.map(x=>`<li>${x}</li>`).join('')}</ul>`;
}

const fixes = {
  sticky: {
    now:['Use a light dusting of semolina/flour only on the outside; don’t knead extra flour into the ball at the last second.','Use a scraper and keep handling to a minimum.','Open on a well-dusted bench and get it topped/launched quickly.'],
    hour:['If it is clearly over-soft and spreading, 15–30 min in the fridge can make handling easier.','Reball only if it still has enough gas and strength; otherwise you may make it tighter and harder to open.','Keep it covered so the surface does not skin.'],
    later:['Cool the dough if fermentation is racing.','Consider one gentle fold if still in bulk and gluten is underdeveloped.','Do not repeatedly reball late in fermentation.'],
    next:['Drop hydration 2–4 points until handling is reliable.','Improve gluten development before bulk.','Reduce warm fermentation or yeast if the dough is overproofing.']
  },
  tearing: {
    now:['Stop stretching aggressively. Let the dough relax 10–15 min if possible.','Use fingertips from the centre outward and leave the rim alone.','Patch tiny holes by pinching rather than pulling harder.'],
    hour:['Give the dough more rest at room temperature.','If it is cold from the fridge, allow it to warm and relax.'],
    later:['Avoid degassing or repeated reballing.','Check whether fermentation is too far gone and gluten is breaking down.'],
    next:['Build more gluten during mixing/folds.','Use a stronger flour or lower hydration if the flour cannot hold your target water.','Avoid excessive fermentation.']
  },
  springback: {
    now:['Rest it 10–20 min and try again.','Do not force the diameter; that encourages tears.'],
    hour:['Keep balls covered at room temperature and let them relax.','If very cold, give them more time out of the fridge.'],
    later:['Extend final proof.','Avoid reballing close to bake time.'],
    next:['Increase final ball proof time.','Consider slightly less mixing or a touch more hydration if the dough is consistently too elastic.']
  },
  flat: {
    now:['Handle the rim gently and avoid pressing gas out of the edge.','Use strong top heat and launch as soon as topped.'],
    hour:['If underproofed, give it more warm time.','If overproofed and weak, cool it and handle carefully rather than reworking it heavily.'],
    later:['Watch for visible aeration and a soft, lively ball before baking.'],
    next:['Tune fermentation before chasing extreme hydration.','Improve gluten strength and avoid degassing during balling/opening.']
  },
  dense: {
    now:['Bake a little longer if the centre is genuinely undercooked.','Use less wet/heavy topping.'],
    hour:['Allow more proof time if the dough still feels tight and heavy.'],
    later:['Check dough temperature and fermentation progress rather than relying only on the clock.'],
    next:['Use adequate fermentation, stronger heat balance and avoid loading the centre with moisture.','For very high hydration dough, make sure the oven can set the crumb before the base burns.']
  },
  pale: {
    now:['Increase top heat or finish closer to the flame/grill.','Avoid excess bench flour on the top surface.'],
    hour:['Let the oven fully recover between pizzas.'],
    later:['Check that fermentation is not extremely underdeveloped.'],
    next:['For lower-temperature ovens, a small amount of oil or sugar can improve browning depending on style.','Dial in stronger top heat before increasing bake time dramatically.']
  },
  burntbottom: {
    now:['Move the pizza to a cooler part of the stone and reduce floor exposure.','Turn the flame/top heat up if possible while lowering bottom heat.','Use less loose flour/semolina under the pizza.'],
    hour:['Let the stone cool slightly between pizzas.','Measure stone temperature in several spots.'],
    later:['Change heat balance: more top, less floor.'],
    next:['Target a lower stone temperature for higher-hydration or longer-bake styles.','Consider a heat diffuser/management method specific to your oven if the floor routinely outruns the top.']
  },
  overproof: {
    now:['Handle as little as possible.','Use a scraper, dust lightly, and open gently.','Bake it rather than trying to “fix” it with lots of kneading.'],
    hour:['Cool it briefly to firm handling.','Avoid aggressive reballing if the gluten is already weak.'],
    later:['Move it colder now and shorten the remaining warm proof.'],
    next:['Use less yeast, less warm time, or a colder dough/fridge.','Record actual dough and room temperatures.']
  },
  underproof: {
    now:['You can bake it, but expect tighter texture and more springback.','Give it the warmest safe spot you have while the oven heats.'],
    hour:['Keep it covered and warm for the remaining time.'],
    later:['Extend warm proof until the ball is relaxed and aerated.'],
    next:['Increase yeast slightly or allow more warm fermentation time.','Measure dough temperature after mixing.']
  }
};

function diagnose() {
  const p = $('problem').value;
  const t = $('timeToBake').value;
  const notes = $('problemNotes').value.trim();
  const items = fixes[p][t] || fixes[p].next;
  $('fixResults').innerHTML = `
    <strong>Do this ${t === 'next' ? 'next batch' : 'now'}:</strong>
    <ul class="list">${items.map(x=>`<li>${x}</li>`).join('')}</ul>
    ${notes ? `<div class="divider"></div><div class="muted">Your note: ${escapeHtml(notes)}</div>` : ''}
    <div class="warning">Best results come from changing one major variable at a time and logging the outcome.</div>
  `;
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function saveRecipe() {
  const r = calcRecipe();
  const defaultName = `${r.balls} × ${r.ballWeight}g @ ${r.hydration}%`;
  const name = window.prompt('Recipe name', defaultName);
  if (!name) return;
  state.recipes.unshift({id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name, created:new Date().toISOString(), ...r});
  persist();
  renderJournal();
}

function recipeText(r=calcRecipe()) {
  let s = `${r.balls} × ${r.ballWeight}g pizza balls\nTotal dough: ${round(r.total,0)}g\nFlour: ${round(r.flour)}g\nWater: ${round(r.water)}g (${r.hydration}%)\nSalt: ${round(r.saltG)}g (${r.salt}%)`;
  if (r.oil) s += `\nOil: ${round(r.oilG)}g (${r.oil}%)`;
  if (r.sugar) s += `\nSugar: ${round(r.sugarG)}g (${r.sugar}%)`;
  if (r.pType !== 'none') s += `\n${r.pType}: ${round(r.pFlour)}g flour + ${round(r.pWater)}g water`;
  return s;
}

async function copyRecipe() {
  const txt = recipeText();
  try { await navigator.clipboard.writeText(txt); alert('Recipe copied.'); }
  catch { window.prompt('Copy this recipe:', txt); }
}

function persist() {
  localStorage.setItem('pizzaLabRecipes', JSON.stringify(state.recipes));
  localStorage.setItem('pizzaLabBakes', JSON.stringify(state.bakes));
}

function renderJournal() {
  const select = $('journalRecipe');
  select.innerHTML = state.recipes.length ? state.recipes.map(r=>`<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('') : '<option value="">No saved recipes yet</option>';

  $('savedRecipes').innerHTML = state.recipes.length ? state.recipes.map(r=>`
    <div class="saved-item">
      <div class="saved-item-head">
        <div><h3>${escapeHtml(r.name)}</h3><span class="pill">${r.hydration}% hydration</span><span class="pill">${r.balls} × ${r.ballWeight}g</span><span class="pill">${flourProfiles[r.flourProfile]?.name || 'Flour'}</span></div>
        <button class="delete-btn" data-delete-recipe="${r.id}">Delete</button>
      </div>
      <p class="muted">${escapeHtml(recipeText(r)).replace(/\n/g,' · ')}</p>
    </div>`).join('') : '<p class="muted">Save a calculator recipe and it will appear here.</p>';

  $('savedBakes').innerHTML = state.bakes.length ? state.bakes.map(b=>`
    <div class="saved-item">
      <div class="saved-item-head">
        <div><h3>${escapeHtml(b.date)} — ${escapeHtml(b.recipeName || 'Unlinked recipe')}</h3><span class="pill">${b.rating}/10</span><span class="pill">${escapeHtml(b.oven)}</span></div>
        <button class="delete-btn" data-delete-bake="${b.id}">Delete</button>
      </div>
      <p>${escapeHtml(b.notes || 'No notes.')}</p>
    </div>`).join('') : '<p class="muted">Your bake history will appear here.</p>';
}

function saveBake() {
  const rid = $('journalRecipe').value;
  const r = state.recipes.find(x=>x.id === rid);
  state.bakes.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: $('journalDate').value || new Date().toISOString().slice(0,10),
    rating: +$('journalRating').value || 0,
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
  const blob = new Blob([JSON.stringify({version:1, exported:new Date().toISOString(), ...state}, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'pizza-lab-data.json'; a.click();
  URL.revokeObjectURL(url);
}

function setDefaultDates() {
  const now = new Date();
  const bake = new Date(now.getTime() + 24*3600000);
  bake.setHours(18,0,0,0);
  const pad = n=>String(n).padStart(2,'0');
  $('bakeTime').value = `${bake.getFullYear()}-${pad(bake.getMonth()+1)}-${pad(bake.getDate())}T${pad(bake.getHours())}:${pad(bake.getMinutes())}`;
  $('journalDate').value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
}

function resetCalc() {
  $('balls').value = 4; $('ballWeight').value = 280; $('hydration').value = 66; $('salt').value = 2.8; $('oil').value = 0; $('sugar').value = 0;
  $('prefermentType').value = 'none'; $('prefermentPct').value = 30; $('prefermentHydration').value = 100;
  calcRecipe();
}

// Tabs
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active'); $(btn.dataset.tab).classList.add('active');
}));

['balls','ballWeight','hydration','salt','oil','sugar','flourProfile','pizzaStyle','prefermentType','prefermentPct','prefermentHydration'].forEach(id=>$(id).addEventListener('input', calcRecipe));
['bakeTime','yeastType','bulkHours','bulkTemp','coldHours','fridgeTemp','ballProofHours','ballProofTemp'].forEach(id=>$(id).addEventListener('input', updatePlanner));
['ovenProfile','ovenStyle'].forEach(id=>$(id).addEventListener('input', updateOven));
$('diagnose').addEventListener('click', diagnose);
$('saveRecipe').addEventListener('click', saveRecipe);
$('copyRecipe').addEventListener('click', copyRecipe);
$('saveBake').addEventListener('click', saveBake);
$('exportData').addEventListener('click', exportData);
$('resetCalc').addEventListener('click', resetCalc);

document.addEventListener('click', e=>{
  const rr = e.target.dataset.deleteRecipe;
  const rb = e.target.dataset.deleteBake;
  if (rr) { state.recipes = state.recipes.filter(x=>x.id!==rr); state.bakes = state.bakes.filter(x=>x.recipeId!==rr); persist(); renderJournal(); }
  if (rb) { state.bakes = state.bakes.filter(x=>x.id!==rb); persist(); renderJournal(); }
});

let deferredPrompt;
window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault(); deferredPrompt = e; $('installBtn').classList.remove('hidden');
});
$('installBtn').addEventListener('click', async ()=>{
  if (!deferredPrompt) return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $('installBtn').classList.add('hidden');
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
setDefaultDates();
calcRecipe(); updatePlanner(); updateOven(); renderJournal();
