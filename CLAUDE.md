# MannaFish: notes for Claude

MannaFish gives Scripture away: one word of Scripture in the middle of a fish, with its verse around it. A static site on Netlify with serverless functions.

## Start every session by reading docs/DECISIONS.md (then docs/UPDATES.md)
- `docs/DECISIONS.md` is the full record: Ken's rules and how he likes replies (A), every open question waiting on him (B), a map of every feature with its files, routes, storage and how to test it (C), a dated log of everything he asked (D), every error we hit and its fix (E), the environment variable names (F).
- Then read `docs/UPDATES.md` (Ken's to-do list).
- **Ask Ken nothing that DECISIONS.md already answers.** If a question is listed in section B, it is still open: do not change that behaviour until Ken answers. Do nothing about the daily-email fish choice ("Song", B1) until he says so.
- Ken dictates by voice, so read for meaning ("manifest" means MannaFish). Reply short and plain, and end with only https://yadamannafishtest.netlify.app/

## Session handoff protocol
- At the **end of each job**, append one dated entry to section D of `docs/DECISIONS.md` (date, Ken's request in his words, what was done, commit hash). Refresh B (move answered questions out, add new ones with the options given) and C (files, routes, storage keys, how to test) for the area you changed. Add new errors to E and new variable names (never values) to F.
- Add an item to the test checklist artifact for each new thing Ken should try.
- **Before a session gets long**, write the handoff (the steps above) and tell Ken he can start a fresh session. Long sessions cost Ken extra usage. **One topic per session saves cost.**
- Never put a secret, a token, a password, an EIN, Ken's home address or a model name in any file.

## Where to work
- Branch **`test-site`**. It deploys to https://yadamannafishtest.netlify.app.
- **Never push to `main`, and never touch manna-fish.com, unless Ken says "push it live".**
- Do **not** modify the Majestic Awards CRM (`/home/user/majestic-crm`). Reading it is fine.
- After every update, tell Ken only the main link: https://yadamannafishtest.netlify.app/

## Rules from Ken
- **Secrets live only in Netlify environment variables.** Never ask Ken for a key, never paste one, and tell users never to paste tokens, EINs or passwords into chat.
  Names in use: `BREVO_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY`, `MF_ADMIN_KEY`, `PROOF_KEY`, `ESV_API_KEY` (later `ELEVENLABS_API_KEY`).
- The fish are **never sold, never resold**. Sponsors pay so they can be given away.
- **No dollar amounts on the site** until Ken decides pricing.
- No earn-style rewards. No celebrity voice imitation.
- Business address on anything that goes out: Entheos Concepts, 4563 Technology Dr, Unit 6, Wilmington NC 28405. **Ken's home address must never appear.**
- Call the first 24 fish "the original 24". All the fish are Ken's.
- Make everything **server side** and forward compatible: pages call `/api/*`, state that matters is stored in Netlify Blobs or Supabase, and phones keep only personal conveniences (basket, settings, carts) that sync to the account when signed in. Don't send zip files.
- Style: short, plain English, honest. Say plainly when something was not tested.

## How the site is laid out
- Pages are plain HTML + inline JS in folders (`bible/`, `translate/`, `ride/`, `hubs/`, `my-fish/`, `edit/`, `print/` ...). The home page is `index.html`; it also shows any fish (`/?fish=ID`).
- Shared browser code is in `fish-lang/` (`basket.js`, `account.js`, `makefish.js`, `adminbar.js`, `voicepick.js`, the Bible data under `fish-lang/bible/`).
- Functions are in `netlify/functions/` (shared code in `lib/`). The path is set at the bottom of each file (`export const config = { path: ... }`). Scheduled ones: `email-daily`, `push-daily`, `sms-daily`, `hub-mail-daily`.
- Build tools are in `tools/` (`tools/fish` redraws every fish; `tools/fish-format` is the word size and placement standard; `tools/print` makes print runs). Templates and word-size rules are in `tools/fish-format`; the edit sheet is `/edit/`.
- Email goes through Brevo (`netlify/functions/lib/mail.mjs`). Admin pages use `MF_ADMIN_KEY` (kept in the browser after first entry, checked by the server).
- Storage: Netlify Blobs (stores named `mannafish-*`) and Supabase for accounts. Don't hold anything important only in `localStorage`.

## Working habits
- Test before saying it works: serve the site with `python3 -m http.server 8123`, drive it with Playwright (stub `/api/*` with route handlers), and check each inline `<script>` parses (`new Function(...)`). A `//` comment inside a one-line script swallows the code after it; use `/* */` or its own line.
- Functions can be tested by bundling them with esbuild and stand-ins for `@netlify/blobs` and `lib/mail.mjs`.
- After changing fish designs run `tools/fish/redraw-all.sh`; the word must be in its own verse (`tools/fish/in-verse.py --check`).
- Don't show the same fish two days in a row (`tools/fish/catch.py` keeps the order stable).
- Commit with `git -c user.name="Claude" -c user.email="noreply@anthropic.com"` and push to `test-site`. Add the attribution trailer lines the session gives. Don't put model names in files.

## Lists to keep up
- `docs/DECISIONS.md`: the full record and handoff (keep it current). `docs/UPDATES.md`: Ken's to-do list. `docs/LAUNCH.md`: app and launch plan. `docs/TODO.md`: the older master list.
- The test checklist (a Claude artifact) is linked from the admin menu; add an item for each new thing Ken should try.
