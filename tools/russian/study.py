#!/usr/bin/env python3
"""The word study on the back of each fish, in Russian (fish-lang/study-ru.json): the Greek and Hebrew meanings, and each
reference with the start of its verse from the Synodal Bible. Same shape as the other languages' study files."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import SITE, verse, label
LABELS = {'gk': 'Греческий', 'hb': 'Еврейский', 'conc': 'Симфония', 'trace': 'Проследите по Писанию — нажмите на стих'}
MEAN = {   # translated from the English meanings (DATA in index.html); a Russian reader to check
 'REST': ('Давать покой; освежать; прекращать.', 'Прекращать; останавливаться; отдыхать; пребывать.'),
 'HOPE': ('Надежда, ожидание, уверенное упование.', 'Надежда, ожидание, нить надежды.'),
 'LOVE': ('Любовь, доброжелательность, благость; Божья любовь.', 'Любовь, привязанность; любить, дружить.'),
 'TRUST': ('Доверять, быть уверенным, убежденным.', 'Доверять, быть в безопасности, чувствовать себя защищенным.'),
 'PRAY': ('Молиться, умолять Бога.', 'Молиться, ходатайствовать, умолять.'),
 'BELIEVE': ('Верить, доверять, иметь веру.', 'Утверждать, поддерживать; быть твердым, верным.'),
 'FORGIVE': ('Прощать, освобождать, отпускать.', 'Прощать, миловать, щадить.'),
 'GIVE': ('Давать, даровать, наделять.', 'Давать, класть, ставить, дарить.'),
 'SEEK': ('Искать, разыскивать, стремиться.', 'Искать, вопрошать, исследовать.'),
 'ASK': ('Просить, требовать, призывать.', 'Спрашивать, вопрошать, просить.'),
 'KNOCK': ('Стучать, стучаться в дверь.', 'Стучать, бить, ударять.'),
 'FOLLOW': ('Следовать, сопровождать, идти вместе.', 'Ходить, идти, следовать за.'),
 'LISTEN': ('Слышать, слушать, внимать.', 'Слышать, слушать, повиноваться.'),
 'REMEMBER': ('Помнить, держать в уме.', 'Помнить, вспоминать, памятовать.'),
 'CHOOSE': ('Выбирать, избирать, отбирать.', 'Выбирать, избирать, предпочитать.'),
 'HONOR': ('Почитать, ценить, уважать, дорожить.', 'Почитать, прославлять; быть весомым.'),
 'GROW': ('Расти, увеличиваться, умножаться.', 'Расти, становиться великим, возвеличивать.'),
 'GATHER': ('Собираться вместе, сходиться.', 'Собирать, накоплять, созывать.'),
 'ACCEPT': ('Принимать, встречать с радостью.', 'Благоволить, принимать, радоваться.'),
 'BREATHE': ('Дуть на, вдыхать.', 'Дыхание, дыхание жизни; дух жизни.'),
 'ENJOY': ('Наслаждаться, получать пользу, радоваться.', 'Радоваться, веселиться, находить удовольствие.'),
 'LIVE': ('Жить, иметь жизнь.', 'Жить, оживать, быть живым.'),
 'SING': ('Петь, воспевать.', 'Петь; песнь.'),
 'LAUGH': ('Смеяться, радоваться.', 'Смеяться, радоваться, играть.'),
}
def snip(t, n=44):   # the start of a verse, as the other languages show it
    t = t.lstrip('"“”„«» ')
    if len(t) <= n + 6: return t
    s = t[:n]; s = s[:s.rfind(' ')] if ' ' in s else s
    return s.rstrip(',;:.-— ') + '…'
src = open(os.path.join(SITE, 'index.html'), encoding='utf-8').read()
D, _ = json.JSONDecoder().raw_decode(src[src.index('DATA=') + 5:])
W = {}
for k, d in D.items():
    refs = []
    for ref, _ in d['refs']:
        lab, b, c, v = label(ref); t = verse(b, c, v); refs.append([lab, snip(t) if t else ''])
    W[k] = {'gkm': MEAN[k][0], 'hbm': MEAN[k][1], 'refs': refs}
json.dump({'labels': LABELS, 'words': W}, open(os.path.join(SITE, 'fish-lang', 'study-ru.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(W), 'words;', W['REST']['refs'][:3])
