/* Pizza Lab v3 — calculation engine (no DOM). Loaded before app.js.
   Everything here is pure maths so it can be checked in isolation. */
(function (global) {
  'use strict';

  // ---------- Fermentation model (Pizza Lab MODEL, fitted to published recipes) ----------
  // rate(T): relative yeast activity vs 25 °C, square-root (Ratkowsky-type) temperature curve.
  // Dough temperature moves toward the surrounding temperature exponentially (Newton cooling).
  // Required IDY % = K × saltFactor × calibration ÷ (Heq − lag)^p
  const FERMENT = {
    Tref: 25,      // °C reference
    Tmin: -1,      // °C notional zero-activity point (fitted)
    Tcap: 32,      // above this the curve is held flat (yeast stress, gluten damage)
    K: 0.93,       // fitted constant
    p: 1.3,        // fitted exponent (Craig/pizzamaking data suggest ~1.2–1.3)
    lag: 1.25,     // equivalent hours before gas production counts (yeast lag)
    tau: { bulk: 3.5, balls: 2.0 }, // hours: thermal time constant of one bulk mass vs single balls
    saltRef: 2.8,
    saltSlope: 0.10, // +10 % yeast per +1 % salt (conservative; salt inhibits yeast)
    rangePct: 0.25   // ± shown as the practical starting range
  };

  // Published anchors used to fit the model (shown live in the Learn tab).
  const ANCHORS = [
    { name: 'PizzaVibes guide 24 h dough', idy: 0.13, fdt: 22, salt: 2.5,
      phases: [{ hours: 2, temp: 22, form: 'bulk' }, { hours: 18, temp: 7, form: 'bulk' }, { hours: 3.5, temp: 22, form: 'balls' }],
      note: '1.3 g dry yeast / 1 kg flour; 2 h @22 °C, 16–20 h @7 °C, 3–4 h balls' },
    { name: 'Ken Forkish “I slept in” (Ooni)', idy: 0.10, fdt: 24, salt: 2.0,
      phases: [{ hours: 1.5, temp: 22, form: 'bulk' }, { hours: 5, temp: 22, form: 'balls' }],
      note: '0.1 % IDY, mix 11:30, ball 13:00, bake 17:00–19:00 (temps assumed 22–24 °C)' },
    { name: 'Craig (pizzamaking.com) chart point', idy: 0.036, fdt: 25, salt: 2.5,
      phases: [{ hours: 11, temp: 25, form: 'bulk' }],
      note: 'Forum-reported chart values ~0.03–0.04 % IDY for 10–12 h at 75–77 °F' },
    { name: 'Stadler Made cold ferment', idy: 0.25, fdt: 23, salt: 2.8,
      phases: [{ hours: 0.75, temp: 22, form: 'bulk' }, { hours: 36, temp: 4, form: 'balls' }, { hours: 3, temp: 22, form: 'balls' }],
      note: '0.5–1 % fresh yeast at ~4 °C for 24–48 h (midpoint used, ÷3 for IDY)' },
    { name: 'America’s Test Kitchen 8-hour dough', idy: 0.19, fdt: 24, salt: 1.5,
      phases: [{ hours: 8, temp: 20, form: 'bulk' }],
      note: 'Bread-style “doubled” endpoint — uses more yeast by design (low weight)' },
    { name: 'Ooni Classic (previous version)', idy: 1.15, fdt: 28, salt: 3.0,
      phases: [{ hours: 1, temp: 22, form: 'bulk' }, { hours: 2, temp: 22, form: 'balls' }],
      note: '7 g IDY / 607 g flour, 3–4 h, lukewarm water — fast recipe, deliberately high yeast (low weight)' }
  ];

  function rate(T) {
    const f = FERMENT;
    if (T <= f.Tmin) return 0;
    const t = Math.min(T, f.Tcap);
    return Math.pow((t - f.Tmin) / (f.Tref - f.Tmin), 2);
  }

  /** Simulate dough temperature and fermentation work through a list of phases.
   *  phases: [{hours, temp, form:'bulk'|'balls', label}] ; startTemp = final dough temperature after mixing. */
  function simulate(startTemp, phases, opts = {}) {
    const tau = Object.assign({}, FERMENT.tau, opts.tau || {});
    const dt = opts.dt || 1 / 12; // 5 min steps
    let T = startTemp, heq = 0, t = 0;
    const points = [{ t: 0, T, heq: 0, phase: 0 }];
    const ends = [];
    phases.forEach((ph, i) => {
      const hours = Math.max(0, Number(ph.hours) || 0);
      const k = tau[ph.form] || tau.bulk;
      const n = Math.round(hours / dt);
      const step = n > 0 ? hours / n : 0;
      for (let s = 0; s < n; s++) {
        const mid = ph.temp + (T - ph.temp) * Math.exp(-(step / 2) / k);
        heq += rate(mid) * step;
        T = ph.temp + (T - ph.temp) * Math.exp(-step / k);
        t += step;
        points.push({ t, T, heq, phase: i });
      }
      ends.push({ t, T, heq });
    });
    return { heq, endTemp: T, points, ends, totalHours: t };
  }

  function saltFactor(salt) {
    return clamp(1 + FERMENT.saltSlope * ((Number(salt) || FERMENT.saltRef) - FERMENT.saltRef), 0.75, 1.3);
  }

  function idyForHeq(heq, salt, calib = 1) {
    const f = FERMENT;
    const eff = Math.max(heq - f.lag, 0.3);
    return clamp((f.K * saltFactor(salt) * calib) / Math.pow(eff, f.p), 0.003, 3);
  }

  function heqNeededForIdy(idy, salt, calib = 1) {
    const f = FERMENT;
    return f.lag + Math.pow((f.K * saltFactor(salt) * calib) / Math.max(idy, 0.0001), 1 / f.p);
  }

  /** Given a yeast dose, find when the dough reaches readiness along the planned phases.
   *  Returns hours from mixing; if not reached by the end, extrapolates at the last phase temperature. */
  function readinessTime(startTemp, phases, idy, salt, calib = 1) {
    const need = heqNeededForIdy(idy, salt, calib);
    const sim = simulate(startTemp, phases);
    const hit = sim.points.find(p => p.heq >= need);
    if (hit) return { hours: hit.t, need, reached: true, temp: hit.T };
    const last = phases[phases.length - 1] || { temp: 22, form: 'balls' };
    const r = rate(last.temp) || 0.01;
    const extra = (need - sim.heq) / r;
    return { hours: sim.totalHours + extra, need, reached: false, extra, temp: last.temp };
  }

  // ---------- Dough temperature control (King Arthur / Tom Lehmann method) ----------
  // Factor 3 for straight dough (room + flour + water [+ friction]); 4 when a preferment is added.
  function tempFactor(hasPreferment) { return hasPreferment ? 4 : 3; }

  function waterTempNeeded({ target, room, flour, friction, prefTemp = null }) {
    const n = tempFactor(prefTemp !== null);
    return n * target - (room + flour + friction + (prefTemp !== null ? prefTemp : 0));
  }

  function predictFdt({ water, room, flour, friction, prefTemp = null }) {
    const n = tempFactor(prefTemp !== null);
    return (room + flour + water + friction + (prefTemp !== null ? prefTemp : 0)) / n;
  }

  function frictionFromMeasured({ fdt, water, room, flour, prefTemp = null }) {
    const n = tempFactor(prefTemp !== null);
    return n * fdt - (room + flour + water + (prefTemp !== null ? prefTemp : 0));
  }

  function flourTempNeeded({ target, room, water, friction, prefTemp = null }) {
    const n = tempFactor(prefTemp !== null);
    return n * target - (room + water + friction + (prefTemp !== null ? prefTemp : 0));
  }

  /** Ice needed (ice at 0 °C) so that tap water + ice melts to target. Celsius form of Lehmann's
   *  formula: ice = W × (tap − target) ÷ (tap + 80). W = total water weight including the ice. */
  function iceNeeded({ totalWater, tap, target }) {
    if (target >= tap) return 0;
    return Math.max(0, totalWater * (tap - target) / (tap + 80));
  }

  /** Blend fridge-cold water with tap water to hit a target temperature. */
  function blendWater({ totalWater, cold, tap, target }) {
    if (tap === cold) return { cold: 0, tap: totalWater };
    const coldG = clamp(totalWater * (tap - target) / (tap - cold), 0, totalWater);
    return { cold: coldG, tap: totalWater - coldG };
  }

  /** Minutes for a dough ball to warm from `from` to `to` at room temp, using the ball time constant. */
  function minutesToReach(from, to, room, form = 'balls') {
    const k = FERMENT.tau[form];
    if ((room - to) * (room - from) <= 0 && Math.abs(room - from) > 0.01 && Math.abs(to - from) > Math.abs(room - from)) return Infinity;
    if (Math.abs(room - to) < 0.05) return Infinity;
    const ratio = (room - to) / (room - from);
    if (ratio <= 0) return 0;
    if (ratio >= 1) return 0;
    return -Math.log(ratio) * k * 60;
  }

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  global.PizzaModel = {
    FERMENT, ANCHORS, rate, simulate, saltFactor, idyForHeq, heqNeededForIdy, readinessTime,
    waterTempNeeded, predictFdt, frictionFromMeasured, flourTempNeeded, iceNeeded, blendWater,
    minutesToReach, clamp
  };
})(typeof window !== 'undefined' ? window : globalThis);
