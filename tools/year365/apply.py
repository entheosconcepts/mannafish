#!/usr/bin/env python3
"""365 action fish, one for every day of the year (Ken, 2 Nov: "for the year in a Bible, do we have 365 action fish?" ... "Ok").
The Bible-in-a-year plan reads six days a week (312 reading days, a morning and an evening fish each) and rests on the seventh.
- Each reading day's fish of the day is picks.txt: one of its two fish that is already an action word, or (NEW) one whose word is
  changed to a verb from its own verse (new-words.txt); the verse on the fish stays. Those fish are redrawn
  (node tools/fish-format/build.js daily-lines.json).
- Each Sabbath has a rest-and-worship action fish already drawn (sabbaths.txt): Rest, Cease, Delight, Meditate, Dwell, Abide ...
  and the 365th day is Gather.
Writes plan/year365.json [{day, week, dow, kind: read|sabbath|last, k, word, ref, verse}] and changes the words in
edit/daily/data.json, tools/fish-format/daily-lines.json and plan/plan.json."""
import json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); H = os.path.dirname(os.path.abspath(__file__))
J = lambda p: json.load(open(os.path.join(ROOT, p)))
picks = {l.split()[0]: l.split()[1:] for l in open(os.path.join(H, 'picks.txt')) if l.strip()}
new = {l.split()[0]: l.split()[1] for l in open(os.path.join(H, 'new-words.txt')) if l.strip()}
sab = open(os.path.join(H, 'sabbaths.txt')).read().split()
change = {picks[d][1]: w for d, w in new.items()}          # fish id -> its new word
def save(p, d, compact=True): json.dump(d, open(os.path.join(ROOT, p), 'w'), ensure_ascii=False, separators=(',', ':') if compact else None)
daily = J('edit/daily/data.json')
for f in daily['fish']:
    if f['k'] in change: f['word'] = change[f['k']]
save('edit/daily/data.json', daily)
lines = J('tools/fish-format/daily-lines.json')
for f in lines:
    if f['k'] in change: f['word'] = change[f['k']]
save('tools/fish-format/daily-lines.json', lines)
plan = J('plan/plan.json')
for w in plan['weeks']:
    for d in w['days']:
        for h in ('am', 'pm'):
            f = d.get(h, {}).get('f')
            if f and f.get('id') in change: f['word'] = change[f['id']]
save('plan/plan.json', plan)
D = {f['k']: f for f in daily['fish']}
W = J('netlify/functions/lib/words.json'); FL = J('netlify/functions/lib/fishlines.json')['en']; Y = {f['k']: f for f in J('edit/new/data.json')['fish']}
def info(k):
    if k in W['words']: return {'k': k, 'word': W['words'][k]['title'], 'ref': FL[k]['ref'], 'verse': (FL[k]['top'] + ' ' + FL[k]['bottom']).strip(), 'svg': '/fish/en/' + k + '.svg', 'href': '/?w=' + k.lower()}
    f = Y.get(k) or D.get(k); return {'k': k, 'word': f['word'], 'ref': f['ref'], 'verse': f.get('verse', ''), 'svg': '/fish/' + k + '.svg', 'href': '/fish/?id=' + k}
out, n = [], 0
for wk in range(1, 53):
    for dow in range(7):   # Sunday .. Friday read, Saturday rest (the plan's own weeks start on a Sunday)
        n += 1
        if dow == 6: out.append({'day': n, 'week': wk, 'dow': dow, 'kind': 'sabbath', **info(sab[wk - 1])}); continue
        p = picks[f'{wk}.{dow + 1}']; k = p[1] if p[0] == 'NEW' else p[0]
        out.append({'day': n, 'week': wk, 'dow': dow, 'kind': 'read', **info(k), 'reading': plan['weeks'][wk - 1]['days'][dow]['am'].get('label', '') + ' · ' + plan['weeks'][wk - 1]['days'][dow]['pm'].get('label', '')})
out.append({'day': 365, 'week': 53, 'dow': 0, 'kind': 'last', **info(sab[52])})
save('plan/year365.json', {'note': 'One action fish for every day of the year: tools/year365/apply.py', 'days': out})
print(len(out), 'days;', len(change), 'fish given a new word')
