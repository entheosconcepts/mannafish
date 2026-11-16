// node tools/fish/pull-rule.mjs [base-url]  -- fetches the rule saved with the rule tool (/edit/rule/) into tools/fish-format/rule-override.json,
// so the next redraw (tools/fish/redraw-all.sh runs this first) draws every fish by it. No key needed to read. If the site can't be reached the file stays as it was.
import fs from 'node:fs';
const base = process.argv[2] || process.env.MF_SITE || 'https://yadamannafishtest.netlify.app';
const out = new URL('../fish-format/rule-override.json', import.meta.url);
try {
  const r = await fetch(base + '/api/fish-rule', { headers: { accept: 'application/json' } }); if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json(), rule = j.rule || {};
  if (!Object.keys(rule.minW || {}).length && !Object.keys(rule.steps || {}).length) { console.log('rule: nothing saved on the server; keeping the built-in rule'); }
  else { fs.writeFileSync(out, JSON.stringify(rule, null, 1) + '\n'); console.log('rule saved', j.at, JSON.stringify(rule)); }
} catch (e) { console.log('rule: could not reach', base, '(' + e.message + '); using the rule file as it is'); }
