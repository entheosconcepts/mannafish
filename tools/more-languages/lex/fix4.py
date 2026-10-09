import json,sys
F={
'es':{('G863','s'):'enviar, en diversas aplicaciones (como sigue)',('G863','d'):'de G575 (ἀπό) y ἵημι (enviar; forma intensiva de εἶμι, ir)',('G190','d'):'de G1 (Α) (como partícula de unión) y κέλευθος (camino)',('G1720','d'):'de G1722 (ἐν) y φυσάω (soplar) (compárese G5453 (φύω))'},
'tl':{('G863','s'):'magpaalis o magpadala, sa iba\'t ibang gamit (gaya ng sumusunod)',('G863','d'):'mula sa G575 (ἀπό) at ἵημι (magpadala; pinatinding anyo ng εἶμι, pumunta)',('G190','d'):'mula sa G1 (Α) (bilang katagang nag-uugnay) at κέλευθος (daan)',('G1720','d'):'mula sa G1722 (ἐν) at φυσάω (umihip) (ihambing ang G5453 (φύω))',
      ('H3513','s'):'maging mabigat, ibig sabihin, sa masamang diwa (pabigat, mabagsik, mapurol) o sa mabuting diwa (marami, mayaman, marangal); sa nagpapagawang anyo, gawing mabigat (sa parehong dalawang diwa)'},
'de':{('G863','s'):'aussenden, in verschiedenen Anwendungen (wie folgt)',('G863','d'):'von G575 (ἀπό) und ἵημι (senden; eine verstärkte Form von εἶμι, gehen)',('G190','d'):'von G1 (Α) (als Partikel der Verbindung) und κέλευθος (Weg)',('G1720','d'):'von G1722 (ἐν) und φυσάω (blasen) (vergleiche G5453 (φύω))'},
'ko':{('G863','s'):'내보내다, 여러 가지 뜻으로 쓰임 (아래와 같이)',('G863','d'):'G575 (ἀπό)와 ἵημι(‘보내다’; εἶμι ‘가다’의 강조형)에서 온 말',('G190','d'):'G1 (Α)(연결을 나타내는 말)와 κέλευθος(‘길’)에서 온 말',('G1720','d'):'G1722 (ἐν)와 φυσάω(‘불다’)에서 온 말 (G5453 (φύω) 참조)'},
'he':{('G863','s'):'לשלוח הלאה, בשימושים שונים (כמפורט)',('G863','d'):'מן G575 (ἀπό) ו־ἵημι (לשלוח; צורה מחוזקת של εἶμι, ללכת)',('G190','d'):'מן G1 (Α) (כמילית חיבור) ו־κέλευθος (דרך)',('G1720','d'):'מן G1722 (ἐν) ו־φυσάω (לנשוף) (השוו G5453 (φύω))'},
'hi':{('G863','s'):'आगे भेज देना, कई अलग-अलग अर्थों में (जैसे आगे दिया गया है)'},
}
for l in sys.argv[1:]:
  p=f'lex-{l}.json'; J=json.load(open(p))
  for (k,q),v in F.get(l,{}).items(): J['words'][k][q]=v
  json.dump(J,open(p,'w'),ensure_ascii=False,indent=1); print(l,'fixed',len(F.get(l,{})))
