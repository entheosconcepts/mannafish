#!/usr/bin/env python3
"""Russian in the site's shared data (run after the Bible, the fish and strings.py are in place):
  - netlify/functions/lib/speak.json: the fish word and verse the voice says (Synodal)
  - fish-lang/tongue.json and netlify/functions/lib/tongue.json: Every Tongue phrases (a first translation, to be read over
    by a Russian speaker) and the four gospel verses (Synodal)"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import SITE, verse, BOOK_RU
import strings as R
P = lambda *a: os.path.join(SITE, *a)
# the voice
p = P('netlify', 'functions', 'lib', 'speak.json'); S = json.load(open(p, encoding='utf-8'))
S['ru'] = {k: {'word': w, 'verse': v + ' ' + r} for k, (w, v, r) in R.FISH24.items()}
json.dump(S, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
# Every Tongue
PH = {'pray_for': 'Можно я помолюсь за вас?', 'pray_together': 'Давайте помолимся вместе.', 'want_pray': 'Хотите помолиться?',
 'god_loves': 'Бог любит вас, и Иисус тоже.', 'pray_about': 'Есть ли что-то, о чем я могу помолиться вместе с вами?',
 'beliefs': 'Есть ли у вас какие-то духовные убеждения?', 'who_jesus': 'Кто, по-вашему, Иисус?',
 'heaven': 'Если бы вы умерли сегодня, знаете ли вы наверняка, что попадете на небеса?',
 'shown_bible': 'Показывал ли вам кто-нибудь по Библии, как познать Бога?', 'know_jesus': 'Хотели бы вы лично узнать Иисуса?',
 'receive_jesus': 'Хотели бы вы принять Иисуса как своего Господа и Спасителя?', 'holy_spirit': 'Приняли ли вы Святого Духа, уверовав?',
 'gift': 'Можно я подарю вам это? Это бесплатный подарок.', 'have_bible': 'У вас есть Библия?', 'visit_church': 'Хотели бы вы прийти в церковь?'}
V = {'jn316': ('John', 3, 16), 'ro323': ('Romans', 3, 23), 'ro623': ('Romans', 6, 23), 'ro109': ('Romans', 10, 9)}
def tidy(t):
    t = t.strip().lstrip('"“«').replace('»', '').rstrip()
    if t[-1] in ',;:': t = t[:-1].rstrip() + '…'
    elif t[-1] not in '.!?…': t += '.'
    return t[0].upper() + t[1:]
for p in (P('fish-lang', 'tongue.json'), P('netlify', 'functions', 'lib', 'tongue.json')):
    T = json.load(open(p, encoding='utf-8'))
    if 'ru' not in T['langs']: T['langs'].append('ru')
    for ph in T['phrases']: ph['t']['ru'] = PH[ph['id']]
    for x in T['verses']:
        b, c, v = V[x['id']]; x['t']['ru'] = tidy(verse(b, c, v)); x['r']['ru'] = f'{BOOK_RU[b]} {c}:{v}'
    json.dump(T, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('speak.json and tongue.json: ru added')
