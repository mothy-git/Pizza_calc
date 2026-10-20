PIZZA LAB V3
============

WHAT'S NEW
----------
V3 is built around one idea every serious dough guide agrees on: dough temperature
controls fermentation speed. Hit a target final dough temperature (FDT) and the rest
becomes predictable.

- Water-temperature calculator (King Arthur / Tom Lehmann method):
  water = 3 x target FDT - (room + flour + friction)   (x4 with a preferment)
  Tells you exactly how to get that water: tap/fridge-water blend, ice (Lehmann formula),
  or iced water for the Thermomix. Says when water alone can't do it and how cold the
  flour needs to be.
- Friction factors per mixing method: TM7 Dough mode, TM7 + folds, hand, folds, stand mixer.
  Dough day calibrates them from your real probe reading and saves them.
- New fermentation model: follows the dough's temperature hour by hour (mixing temp ->
  room/fridge/proof temps, bulk vs balls cool at different speeds) and sizes the yeast.
  Fitted to 6 published recipes - see Learn tab.
- Personal yeast calibration that learns from the journal (under/over-proofed).
- Schedules tuned to short Neapolitan ferments (6/8/12 h) plus 24 h and 48 h cold.
- Dough temperature chart + clock-time timeline + readiness window.
- Step-by-step method with exact grams for TM7, hand, folds or stand mixer.
- Dough day: probe after mixing -> re-plan (shorten proof or proof cooler/warmer).
  Ball check before opening (minutes to 13 C / 18 C).
- Tiny-yeast dilution helper for amounts under 1 g.
- Journal = the guide's Lab Test Protocol (temps, phases, scores, notes).
- My kitchen: thermometers (probe / probe + IR), fridge, tap water, defaults, backup/import.
- Learn: 8 consensus rules, the PizzaVibes guide verified line by line, model anchors, 35+ sources.
- FIX: icons now load from the repo root. V2 looked in icons/ (which doesn't exist), so its
  offline cache never installed.

UPLOAD TO GITHUB (Pizza_calc repo root)
---------------------------------------
Replace / add these files in the ROOT of the repo (not inside a folder):
  index.html, app.js, model.js (NEW), styles.css, sw.js, manifest.json, README.txt, CHANGELOG.txt
Keep icon-192.png and icon-512.png where they are (root).

1. Open the Pizza_calc repo on GitHub > Add file > Upload files.
2. Drag in the files above. Commit to main.
3. Wait 1-3 minutes, then open https://mothy-git.github.io/Pizza_calc/

If the iPhone still shows V2: open in Safari and refresh twice, close and reopen the Home
Screen app. Last resort: remove the Home Screen icon, open the URL in Safari, refresh,
Add to Home Screen again. Saved recipes and bakes carry over (same storage keys).

CALCULATION STATUS
------------------
Ingredient maths: exact baker's percentages, yeast included in the total.
Water/FDT/friction/ice: standard published formulas (SOURCE).
Yeast & timing: Pizza Lab MODEL - transparent, fitted to published recipes, tuned by your journal.
TM7 friction 24 C is an ESTIMATE (no published figure) - calibrate on your first batch.
