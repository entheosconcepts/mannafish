# Russian names for the site's books (the Synodal Bible's own names), and a verse from the Russian Bible on the site.
import json, os, re
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
BOOKS = json.loads(re.search(r'^BOOKS = (\[.*\])$', open(os.path.join(SITE, 'tools', 'bible-orig', 'build.py'), encoding='utf-8').read(), re.M).group(1))
RU = ('Бытие|Исход|Левит|Числа|Второзаконие|Иисус Навин|Судьи|Руфь|1 Царств|2 Царств|3 Царств|4 Царств|1 Паралипоменон|'
      '2 Паралипоменон|Ездра|Неемия|Есфирь|Иов|Псалом|Притчи|Екклесиаст|Песнь Песней|Исаия|Иеремия|Плач Иеремии|Иезекииль|'
      'Даниил|Осия|Иоиль|Амос|Авдий|Иона|Михей|Наум|Аввакум|Софония|Аггей|Захария|Малахия|От Матфея|От Марка|От Луки|'
      'От Иоанна|Деяния|Римлянам|1 Коринфянам|2 Коринфянам|Галатам|Ефесянам|Филиппийцам|Колоссянам|1 Фессалоникийцам|'
      '2 Фессалоникийцам|1 Тимофею|2 Тимофею|Титу|Филимону|Евреям|Иакова|1 Петра|2 Петра|1 Иоанна|2 Иоанна|3 Иоанна|Иуды|'
      'Откровение').split('|')
assert len(RU) == 66
BOOK_RU = dict(zip(BOOKS, RU))
def verse(book, c, v):
    f = os.path.join(SITE, 'fish-lang', 'bible', 'ru', book.replace(' ', '_') + '-' + str(c) + '.json')
    t = json.load(open(f, encoding='utf-8'))['t']
    return t[v - 1] if v - 1 < len(t) else ''
def label(ref):   # "Psalm 42:5" -> "Псалом 42:5" (the KJV's numbers, like every language on the site)
    m = re.match(r'^(.+?) (\d+):(\d+)', ref); return BOOK_RU[m.group(1)] + ' ' + m.group(2) + ':' + m.group(3), m.group(1), int(m.group(2)), int(m.group(3))
