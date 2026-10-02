MANNAFISH — WEBSITE FILES (for Netlify)
========================================

WHAT'S IN THIS FOLDER
  index.html            → your HOME PAGE (the revamped MannaFish site)
  shop.html             → the store (decals, cart, Stripe checkout)
  free_devotional.html  → the devotional, all 24 designs
  todays_catch.html     → the daily single-word devotional ("Today's Catch")
  netlify.toml          → Netlify config (needed for checkout)
  netlify/edge-functions → the checkout function (needed for the store to take orders)

HOW TO PUT IT LIVE (drag-and-drop)
  1. Go to your site's page on Netlify → the "Deploys" tab.
  2. Drag THIS WHOLE FOLDER onto the "drag and drop your site output folder here" area.
  3. Netlify publishes it in a few seconds.

IMPORTANT
  • Keep the folder together — index.html, shop.html, the devotionals,
    netlify.toml AND the netlify/ folder must all be uploaded together.
  • After it publishes, TEST CHECKOUT once (add a decal, go to pay). The
    checkout uses a Netlify function; if it doesn't work on a drag-and-drop
    deploy, deploy through GitHub instead (that runs the full build).
  • To edit any text later: open any page and add #edit to the address
    (e.g. manna-fish.com/#edit), click text to change it, then Save — it
    downloads the updated file, which you re-upload the same way.

LINKS BETWEEN PAGES (already wired)
  • Home "Shop"/"Sponsor" buttons → shop.html
  • Home "Free devotional" → free_devotional.html
  • Store + devotionals have Back and Home buttons (Home → index.html)
