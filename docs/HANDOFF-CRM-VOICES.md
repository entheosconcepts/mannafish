# Handoff: MannaFish voices for the Majestic Awards CRM tour speaker

For the Claude working in the CRM (`entheosconcepts/majestic-crm`). From Ken, 2 Nov 2026: "I need a hand off note for Claude to add
to my CRM tour speaker for our existing voices for MannaFish, so I can use it on that tour."

## What's ready (on the MannaFish side, nothing to set up)

MannaFish serves natural voices (OpenAI's speech model, the same family ChatGPT uses) at one address. The CRM's own pages are
already allowed to use it: `https://majestic-awards-crm.netlify.app` and any `*.majesticawards.com` page. (More addresses: Ken adds
them to `MF_SAY_ORIGINS` on the MannaFish Netlify site, comma-separated.)

- **The voices:** `GET https://manna-fish.com/api/say?list=1`
  returns `{ voices: [{ id, name, sounds }], languages: [...], play: "/api/say?t=<words>&l=<language>&v=<voice>" }`.
  (Until Ken says "push it live" on MannaFish, use the test site: `https://yadamannafishtest.netlify.app`.)
- **Play words:** `GET https://manna-fish.com/api/say?t=<words>&l=en&v=<voice id>` returns an MP3.
  - Up to 300 characters per request: split longer text into sentences and play them one after another.
  - The same words in the same voice come back instantly after the first time (kept for a year), so a fixed tour script costs
    nothing after it is played once.
  - New clips are limited per visitor per hour (400); if the answer is 429, wait and try again.

The 17 voices: Thunder (very deep, grand), Narrator (classic Bible reader), Highlander (Scottish gentleman), Grace (deep, mature
woman), Magnolia (Southern, sweet), Heather (Scottish lady), and Onyx, Ash, Fable, Sage, Coral, Ballad, Alloy, Echo, Nova,
Shimmer, Verse. Ids are the lower-case names (`highland` for Highlander).

## What to build in the CRM tour speaker

1. A voice choice for the tour (a list from `?list=1`, remembered in localStorage), with "This computer's voice" kept as a choice
   and as the fallback.
2. Play each tour step with `new Audio(url)` (no fetch needed; the MP3 is sent with `access-control-allow-origin: *`).
   Sentence by sentence: start the next clip on `ended`; Stop cancels the rest.
3. If a clip fails (offline, 403, 429, 501 "nokey"), fall back to the CRM's current `speechSynthesis` speaker for that step.
4. Keep the CRM's current text clean-up (`speakableNote`) before sending words.

## Example

```js
const MF = 'https://manna-fish.com';
async function mfVoices(){ const r = await fetch(MF + '/api/say?list=1'); return (await r.json()).voices; }
function mfSay(text, voice, lang = 'en'){
  return new Promise((ok, bad) => {
    const a = new Audio(MF + '/api/say?t=' + encodeURIComponent(text) + '&l=' + lang + '&v=' + encodeURIComponent(voice));
    a.onended = ok; a.onerror = bad; a.play().catch(bad);
  });
}
// a step, sentence by sentence; falls back to the computer's voice
async function speakStep(text, voice){
  for (const s of text.match(/[^.!?]+[.!?]*/g) || [text]) {
    try { await mfSay(s.trim().slice(0, 300), voice); } catch (e) { speakNote(s); return; }
  }
}
```

## Notes

- No key or password goes into the CRM: the voice key stays in MannaFish's Netlify settings.
- More realistic voices (ElevenLabs) can be added on the MannaFish side later; they would appear in `?list=1` with their own ids,
  so the CRM picks them up without changes.
