PIZZA LAB v1

What is included
- Reverse dough calculator from pizza count + ball weight
- Baker's % hydration, salt, oil and sugar
- Poolish and biga split calculator
- Fermentation timeline working backwards from bake time
- Approximate yeast starting dose adjusted for time and temperature
- Oven starting guides including Camp Chef Sidekick
- Troubleshooting assistant
- Saved recipes and bake journal stored locally in the browser
- JSON data export
- PWA/offline support

IMPORTANT
The yeast and oven figures are practical starting points, not guaranteed fermentation predictions. Dough temperature, flour, yeast freshness, fridge cycling and handling all affect outcomes.

HOW TO RUN ON A COMPUTER
This app must be served over http:// or https:// for the service worker/PWA features to work properly.

Easy local test with Python:
1. Open Terminal in this folder.
2. Run: python3 -m http.server 8000
3. Open: http://localhost:8000

HOW TO PUT IT ON AN IPHONE
The easiest permanent setup is to host this folder on a simple static website host such as GitHub Pages, Netlify, Cloudflare Pages or similar.
Then on iPhone:
1. Open the hosted address in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Open Pizza Lab from the new Home Screen icon.

No account or server database is required. Recipes and journal entries are stored locally on that browser/device.
