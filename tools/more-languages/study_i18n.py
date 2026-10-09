# Word study in each language (Ken, 8 Oct): labels, the Greek/Hebrew meanings (translated from the English
# meanings, to be checked by a fluent reader), and Bible book names.
KEYS=['REST','HOPE','LOVE','TRUST','PRAY','BELIEVE','FORGIVE','GIVE','SEEK','ASK','KNOCK','FOLLOW','LISTEN','REMEMBER','CHOOSE','HONOR','GROW','GATHER','ACCEPT','BREATHE','ENJOY','LIVE','SING','LAUGH']
LABELS={
 'tl':{'gk':'Griyego','hb':'Hebreo','conc':'Konkordansya','trace':'Sundan sa Kasulatan — pindutin ang talata'},
 'zh':{'gk':'希腊文','hb':'希伯来文','conc':'经文汇编','trace':'在圣经中追寻 — 点选经文'},
 'hi':{'gk':'यूनानी','hb':'इब्रानी','conc':'शब्द-अनुक्रमणिका','trace':'पवित्रशास्त्र में खोजें — पद चुनें'},
 'el':{'gk':'Ελληνικά','hb':'Εβραϊκά','conc':'Συμφωνία','trace':'Ακολουθήστε το στη Γραφή — πατήστε ένα εδάφιο'},
 'de':{'gk':'Griechisch','hb':'Hebräisch','conc':'Konkordanz','trace':'Durch die Schrift verfolgen — Vers antippen'},
 'ko':{'gk':'헬라어','hb':'히브리어','conc':'성구 사전','trace':'성경에서 찾아보기 — 구절을 누르세요'},
 'he':{'gk':'יוונית','hb':'עברית','conc':'קונקורדנציה','trace':'עקבו אחר המילה בכתובים — הקישו על פסוק'}}
M={}
M['de']="""Ruhe geben; erquicken; aufhören lassen.|Aufhören; innehalten; ruhen; wohnen.
Hoffnung, Erwartung, festes Vertrauen.|Hoffnung, Erwartung, eine Schnur der Hoffnung.
Liebe, Wohlwollen, Güte; Gottes Liebe.|Liebe, Zuneigung; lieben, Freund sein.
Vertrauen, zuversichtlich, überzeugt sein.|Vertrauen, sicher sein, sich geborgen fühlen.
Beten, Gott anflehen.|Beten, Fürbitte tun, flehen.
Glauben, vertrauen, Glauben haben an.|Bestätigen, stützen; fest, treu sein.
Vergeben, freilassen, loslassen, wegschicken.|Vergeben, verzeihen, verschonen.
Geben, gewähren, schenken.|Geben, legen, setzen, schenken.
Suchen, forschen, trachten nach.|Suchen, fragen, erforschen.
Bitten, erbitten, verlangen.|Fragen, sich erkundigen, bitten.
Anklopfen, an eine Tür klopfen.|Klopfen, schlagen, pochen.
Folgen, begleiten, mitgehen.|Gehen, wandeln, nachfolgen.
Hören, zuhören, beachten.|Hören, zuhören, gehorchen.
Sich erinnern, im Sinn behalten.|Gedenken, sich erinnern, eingedenk sein.
Wählen, auswählen, aussuchen.|Wählen, erwählen, vorziehen.
Ehren, wertschätzen, achten.|Ehren, verherrlichen; gewichtig sein.
Wachsen, zunehmen, sich vergrößern.|Wachsen, groß werden, groß machen.
Sich versammeln, zusammenkommen.|Sammeln, zusammentragen, versammeln.
Aufnehmen, willkommen heißen, annehmen.|Gefallen haben an, annehmen, sich freuen an.
Anhauchen, einhauchen.|Atem, Lebensatem; der Geist des Lebens.
Genießen, Nutzen haben, sich freuen.|Sich freuen, froh sein, Gefallen finden.
Leben, Leben haben.|Leben, aufleben, lebendig sein.
Singen, lobsingen.|Singen; ein Lied.
Lachen, sich freuen.|Lachen, sich freuen, spielen."""
M['tl']="""Magbigay ng kapahingahan; magpaginhawa; magpatigil.|Tumigil; huminto; magpahinga; manahan.
Pag-asa, paghihintay, matibay na pagtitiwala.|Pag-asa, paghihintay, isang lubid ng pag-asa.
Pag-ibig, mabuting kalooban, kabaitan; ang pag-ibig ng Diyos.|Pag-ibig, pagmamahal; umibig, makipagkaibigan.
Magtiwala, maging panatag, maniwala nang lubos.|Magtiwala, maging ligtas, makadama ng kapanatagan.
Manalangin, makiusap sa Diyos.|Manalangin, mamagitan, makiusap.
Sumampalataya, magtiwala, manalig.|Patunayan, alalayan; maging matatag, tapat.
Magpatawad, magpalaya, bitawan, paalisin.|Magpatawad, ipagpaumanhin, kaawaan.
Magbigay, ipagkaloob, ibigay.|Magbigay, ilagay, itakda, ipagkaloob.
Humanap, magsaliksik, magsikap para rito.|Humanap, magtanong, saliksikin.
Humingi, makiusap, tumawag.|Magtanong, magsiyasat, humiling.
Kumatok, tumuktok sa pinto.|Kumatok, pumalo, tumuktok.
Sumunod, sumama, makisabay.|Lumakad, pumaroon, sumunod.
Makinig, dinggin, pansinin.|Makinig, dinggin, sumunod.
Alalahanin, isaisip.|Alalahanin, gunitain, pakatandaan.
Pumili, humirang, piliin.|Pumili, humirang, higit na piliin.
Igalang, pahalagahan, pakamahalin.|Igalang, luwalhatiin; maging mabigat.
Lumago, dumami, lumaki.|Lumago, maging dakila, dakilain.
Magtipon, magkatipon.|Magtipon, mangalap, tipunin.
Tumanggap, salubungin, tanggapin.|Kalugdan, tanggapin, maligaya sa.
Hingahan, hingahan sa loob.|Hininga, hininga ng buhay; ang espiritu ng buhay.
Magtamasa, makinabang, matuwa.|Magalak, matuwa, malugod.
Mabuhay, magkaroon ng buhay.|Mabuhay, muling mabuhay, maging buhay.
Umawit, umawit ng papuri.|Umawit; isang awit.
Tumawa, magalak.|Tumawa, magalak, maglaro."""
M['zh']="""使得安息；使复苏；使止息。|止息；停止；安息；居住。
盼望、期待、坚定的信靠。|盼望、期待、一条盼望的绳子。
爱、善意、仁慈；神的爱。|爱、情感；爱、结为朋友。
信靠、有把握、深信。|倚靠、安稳、感到平安。
祷告、恳求神。|祷告、代求、恳求。
相信、信靠、对神有信心。|坚立、扶持；坚定、忠信。
饶恕、释放、放下、打发走。|饶恕、赦免、宽容。
给予、赐予、赠与。|给予、放置、设立、赐予。
寻求、寻找、追求。|寻求、询问、查考。
求、请求、呼求。|求问、询问、请求。
叩、敲门。|叩、击打、敲。
跟从、陪伴、同行。|行走、前往、跟随。
听、聆听、留心。|听、聆听、顺从。
记念、记在心里。|记念、回想、留意。
拣选、挑选、选出。|拣选、挑选、更喜爱。
尊敬、珍视、看重。|尊敬、荣耀；有分量。
长进、增加、扩大。|长大、成为大、尊为大。
聚集、聚会。|聚集、收集、召集。
接纳、欢迎、接受。|喜悦、悦纳、以此为乐。
吹气在其上、吹入。|气息、生命之气；生命的灵。
享受、得益、喜乐。|欢喜、快乐、喜悦。
活着、有生命。|活着、复苏、存活。
歌唱、作乐赞美。|歌唱；诗歌。
笑、喜乐。|笑、喜乐、嬉戏。"""
M['hi']="""विश्राम देना; ताज़गी देना; रुकवाना।|रुकना; थमना; विश्राम करना; बसना।
आशा, प्रतीक्षा, दृढ़ भरोसा।|आशा, प्रतीक्षा, आशा की डोरी।
प्रेम, सद्भावना, कृपा; परमेश्वर का प्रेम।|प्रेम, स्नेह; प्रेम करना, मित्र बनना।
भरोसा करना, निश्चिन्त होना, आश्वस्त होना।|भरोसा करना, सुरक्षित होना, निडर रहना।
प्रार्थना करना, परमेश्वर से विनती करना।|प्रार्थना करना, मध्यस्थता करना, विनती करना।
विश्वास करना, भरोसा रखना, आस्था रखना।|पुष्ट करना, सहारा देना; दृढ़ और विश्वासयोग्य होना।
क्षमा करना, छोड़ देना, जाने देना, विदा करना।|क्षमा करना, माफ़ करना, छोड़ देना।
देना, प्रदान करना, दान करना।|देना, रखना, ठहराना, प्रदान करना।
खोजना, ढूँढ़ना, यत्न करना।|खोजना, पूछना, ढूँढ़ निकालना।
माँगना, विनती करना, पुकारना।|पूछना, पूछताछ करना, माँगना।
खटखटाना, द्वार खटखटाना।|खटखटाना, पीटना, ठोकना।
पीछे चलना, साथ चलना, संग जाना।|चलना, जाना, पीछे हो लेना।
सुनना, ध्यान से सुनना, ध्यान देना।|सुनना, ध्यान देना, आज्ञा मानना।
स्मरण करना, मन में रखना।|स्मरण करना, याद करना, ध्यान रखना।
चुनना, चुन लेना, छाँटना।|चुनना, चुन लेना, अधिक पसंद करना।
आदर करना, मूल्यवान समझना, सम्मान देना।|आदर करना, महिमा देना; भारी होना।
बढ़ना, वृद्धि होना, विस्तार होना।|बढ़ना, महान होना, बड़ाई करना।
इकट्ठा होना, एकत्र होना।|इकट्ठा करना, बटोरना, एकत्र करना।
ग्रहण करना, स्वागत करना, स्वीकार करना।|प्रसन्न होना, स्वीकार करना, आनन्दित होना।
फूँकना, भीतर साँस फूँकना।|साँस, जीवन की साँस; जीवन की आत्मा।
आनन्द लेना, लाभ उठाना, प्रसन्न होना।|आनन्दित होना, मगन होना, प्रसन्न होना।
जीवित रहना, जीवन पाना।|जीना, फिर जी उठना, जीवित रहना।
गाना, भजन गाना।|गाना; एक गीत।
हँसना, आनन्दित होना।|हँसना, आनन्दित होना, खेलना।"""
M['el']="""Δίνω ανάπαυση· αναζωογονώ· κάνω να παύσει.|Παύω· σταματώ· αναπαύομαι· κατοικώ.
Ελπίδα, προσδοκία, σταθερή εμπιστοσύνη.|Ελπίδα, προσδοκία, ένα σχοινί ελπίδας.
Αγάπη, καλή θέληση, καλοσύνη· η αγάπη του Θεού.|Αγάπη, στοργή· αγαπώ, γίνομαι φίλος.
Εμπιστεύομαι, είμαι βέβαιος, πεπεισμένος.|Εμπιστεύομαι, είμαι ασφαλής, νιώθω σιγουριά.
Προσεύχομαι, ικετεύω τον Θεό.|Προσεύχομαι, μεσιτεύω, ικετεύω.
Πιστεύω, εμπιστεύομαι, έχω πίστη.|Επιβεβαιώνω, στηρίζω· είμαι σταθερός, πιστός.
Συγχωρώ, απελευθερώνω, αφήνω, διώχνω.|Συγχωρώ, δίνω χάρη, λυπάμαι.
Δίνω, χορηγώ, δωρίζω.|Δίνω, θέτω, βάζω, δωρίζω.
Ζητώ, ψάχνω, επιδιώκω.|Ζητώ, ρωτώ, ερευνώ.
Ζητώ, παρακαλώ, καλώ.|Ρωτώ, ερευνώ, ζητώ.
Κρούω, χτυπώ την πόρτα.|Χτυπώ, κτυπώ, κρούω.
Ακολουθώ, συνοδεύω, πηγαίνω μαζί.|Περπατώ, πηγαίνω, ακολουθώ.
Ακούω, προσέχω, δίνω προσοχή.|Ακούω, προσέχω, υπακούω.
Θυμάμαι, έχω στον νου.|Θυμάμαι, ανακαλώ, μνημονεύω.
Επιλέγω, διαλέγω, ξεχωρίζω.|Εκλέγω, διαλέγω, προτιμώ.
Τιμώ, εκτιμώ, σέβομαι.|Τιμώ, δοξάζω· έχω βάρος.
Αυξάνομαι, πληθύνομαι, μεγαλώνω.|Μεγαλώνω, γίνομαι μέγας, μεγαλύνω.
Συναθροίζομαι, συγκεντρώνομαι.|Μαζεύω, συλλέγω, συναθροίζω.
Δέχομαι, καλωσορίζω, αποδέχομαι.|Ευαρεστούμαι, αποδέχομαι, χαίρομαι.
Εμφυσώ, φυσώ μέσα.|Πνοή, πνοή ζωής· το πνεύμα της ζωής.
Απολαμβάνω, ωφελούμαι, ευχαριστιέμαι.|Χαίρομαι, ευφραίνομαι, βρίσκω χαρά.
Ζω, έχω ζωή.|Ζω, αναζωογονούμαι, είμαι ζωντανός.
Ψάλλω, μελωδώ.|Ψάλλω· ένα τραγούδι.
Γελώ, χαίρομαι.|Γελώ, χαίρομαι, παίζω."""
M['ko']="""쉬게 하다; 새 힘을 주다; 그치게 하다.|그치다; 멈추다; 쉬다; 거하다.
소망, 기대, 굳은 신뢰.|소망, 기대, 소망의 줄.
사랑, 선의, 자비; 하나님의 사랑.|사랑, 애정; 사랑하다, 벗이 되다.
신뢰하다, 확신하다, 굳게 믿다.|의지하다, 안전하다, 평안을 느끼다.
기도하다, 하나님께 간구하다.|기도하다, 중보하다, 간구하다.
믿다, 신뢰하다, 믿음을 갖다.|확증하다, 붙들다; 견고하다, 신실하다.
용서하다, 놓아주다, 내려놓다, 보내다.|용서하다, 사하다, 아끼다.
주다, 베풀다, 선물하다.|주다, 두다, 세우다, 베풀다.
구하다, 찾다, 힘써 얻으려 하다.|구하다, 묻다, 찾아내다.
구하다, 청하다, 부르다.|묻다, 알아보다, 청하다.
두드리다, 문을 두드리다.|두드리다, 치다, 노크하다.
따르다, 동행하다, 함께 가다.|걷다, 가다, 뒤따르다.
듣다, 귀 기울이다, 주의하다.|듣다, 귀 기울이다, 순종하다.
기억하다, 마음에 두다.|기억하다, 회상하다, 유념하다.
택하다, 고르다, 골라내다.|택하다, 고르다, 더 좋아하다.
공경하다, 귀히 여기다, 존중하다.|공경하다, 영화롭게 하다; 무겁다.
자라다, 더하다, 커지다.|자라다, 위대해지다, 크게 하다.
함께 모이다, 모이다.|모으다, 거두다, 모이게 하다.
받다, 환영하다, 받아들이다.|기뻐하다, 받아들이다, 즐거워하다.
숨을 내쉬다, 불어넣다.|숨, 생명의 숨; 생명의 영.
누리다, 유익을 얻다, 즐거워하다.|기뻐하다, 즐거워하다, 기쁨을 얻다.
살다, 생명을 얻다.|살다, 소생하다, 살아 있다.
노래하다, 찬송하다.|노래하다; 노래.
웃다, 기뻐하다.|웃다, 기뻐하다, 놀다."""
M['he']="""לתת מנוחה; לרענן; להשבית.|לחדול; לעצור; לנוח; לשכון.
תקווה, ציפייה, ביטחון איתן.|תקווה, ציפייה, חוט של תקווה.
אהבה, רצון טוב, חסד; אהבת האלהים.|אהבה, חיבה; לאהוב, להתיידד.
לבטוח, להיות בטוח, משוכנע.|לבטוח, להיות מוגן, לחוש ביטחון.
להתפלל, להתחנן לאלהים.|להתפלל, להפציר בעד, להתחנן.
להאמין, לבטוח, להחזיק באמונה.|לאשר, לתמוך; להיות יציב ונאמן.
לסלוח, לשחרר, להרפות, לשלח.|לסלוח, למחול, לחוס.
לתת, להעניק, לתרום.|לתת, לשים, להציב, להעניק.
לבקש, לחפש, לשאוף אל.|לבקש, לשאול, לדרוש.
לבקש, להתחנן, לקרוא.|לשאול, לברר, לבקש.
לדפוק, להקיש על דלת.|לדפוק, להכות, להקיש.
ללכת אחרי, ללוות, להתלוות.|ללכת, להתהלך, ללכת אחרי.
לשמוע, להקשיב, לשים לב.|לשמוע, להקשיב, לציית.
לזכור, לשמור בלב.|לזכור, להיזכר, לשים לב.
לבחור, לברור, לבחור מתוך.|לבחור, לברור, להעדיף.
לכבד, להוקיר, להעריך.|לכבד, לפאר; להיות כבד.
לגדול, לרבות, להתרחב.|לגדול, להיות גדול, לגדל.
להתאסף, להתכנס.|לאסוף, לקבץ, לכנס.
לקבל, לקבל בברכה, לאמץ.|לרצות, לקבל, לשמוח ב־.
לנשוף, להפיח רוח.|נשימה, נשמת חיים; רוח החיים.
ליהנות, להפיק תועלת, לשמוח.|לשמוח, לעלוז, למצוא חן.
לחיות, שיהיו לו חיים.|לחיות, לקום לתחייה, להיות חי.
לשיר, לזמר תהלה.|לשיר; שיר.
לצחוק, לשמוח.|לצחוק, לשמוח, לשחק."""
MEAN={l:{k:tuple(line.split('|')) for k,line in zip(KEYS,txt.strip().split('\n'))} for l,txt in M.items()}
EN_BOOKS=['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','1 Samuel','1 Kings','1 Chronicles','2 Chronicles','Nehemiah','Job','Psalm','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Amos','Nahum','Habakkuk','Zephaniah','Haggai','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Hebrews','James','1 Peter','2 Peter','1 John','Revelation']
BN={
'tl':'Genesis|Exodo|Levitico|Mga Bilang|Deuteronomio|Josue|1 Samuel|1 Mga Hari|1 Mga Cronica|2 Mga Cronica|Nehemias|Job|Mga Awit|Mga Kawikaan|Eclesiastes|Awit ni Solomon|Isaias|Jeremias|Mga Panaghoy|Ezekiel|Daniel|Oseas|Amos|Nahum|Habacuc|Sofonias|Hagai|Malakias|Mateo|Marcos|Lucas|Juan|Mga Gawa|Mga Taga-Roma|1 Mga Taga-Corinto|2 Mga Taga-Corinto|Mga Taga-Galacia|Mga Taga-Efeso|Mga Taga-Filipos|Mga Taga-Colosas|1 Mga Taga-Tesalonica|2 Mga Taga-Tesalonica|1 Timoteo|2 Timoteo|Mga Hebreo|Santiago|1 Pedro|2 Pedro|1 Juan|Apocalipsis',
'zh':'创世记|出埃及记|利未记|民数记|申命记|约书亚记|撒母耳记上|列王纪上|历代志上|历代志下|尼希米记|约伯记|诗篇|箴言|传道书|雅歌|以赛亚书|耶利米书|耶利米哀歌|以西结书|但以理书|何西阿书|阿摩司书|那鸿书|哈巴谷书|西番雅书|哈该书|玛拉基书|马太福音|马可福音|路加福音|约翰福音|使徒行传|罗马书|哥林多前书|哥林多后书|加拉太书|以弗所书|腓立比书|歌罗西书|帖撒罗尼迦前书|帖撒罗尼迦后书|提摩太前书|提摩太后书|希伯来书|雅各书|彼得前书|彼得后书|约翰一书|启示录',
'hi':'उत्पत्ति|निर्गमन|लैव्यव्यवस्था|गिनती|व्यवस्थाविवरण|यहोशू|1 शमूएल|1 राजाओं|1 इतिहास|2 इतिहास|नहेम्याह|अय्यूब|भजन संहिता|नीतिवचन|सभोपदेशक|श्रेष्ठगीत|यशायाह|यिर्मयाह|विलापगीत|यहेजकेल|दानिय्येल|होशे|आमोस|नहूम|हबक्कूक|सपन्याह|हाग्गै|मलाकी|मत्ती|मरकुस|लूका|यूहन्ना|प्रेरितों के काम|रोमियों|1 कुरिन्थियों|2 कुरिन्थियों|गलातियों|इफिसियों|फिलिप्पियों|कुलुस्सियों|1 थिस्सलुनीकियों|2 थिस्सलुनीकियों|1 तीमुथियुस|2 तीमुथियुस|इब्रानियों|याकूब|1 पतरस|2 पतरस|1 यूहन्ना|प्रकाशितवाक्य',
'el':'Γένεση|Έξοδος|Λευιτικό|Αριθμοί|Δευτερονόμιο|Ιησούς του Ναυή|Α΄ Σαμουήλ|Α΄ Βασιλέων|Α΄ Χρονικών|Β΄ Χρονικών|Νεεμίας|Ιώβ|Ψαλμοί|Παροιμίες|Εκκλησιαστής|Άσμα Ασμάτων|Ησαΐας|Ιερεμίας|Θρήνοι|Ιεζεκιήλ|Δανιήλ|Ωσηέ|Αμώς|Ναούμ|Αββακούμ|Σοφονίας|Αγγαίος|Μαλαχίας|Ματθαίος|Μάρκος|Λουκάς|Ιωάννης|Πράξεις|Ρωμαίους|Α΄ Κορινθίους|Β΄ Κορινθίους|Γαλάτες|Εφεσίους|Φιλιππησίους|Κολοσσαείς|Α΄ Θεσσαλονικείς|Β΄ Θεσσαλονικείς|Α΄ Τιμόθεο|Β΄ Τιμόθεο|Εβραίους|Ιακώβου|Α΄ Πέτρου|Β΄ Πέτρου|Α΄ Ιωάννη|Αποκάλυψη',
'de':'1. Mose|2. Mose|3. Mose|4. Mose|5. Mose|Josua|1. Samuel|1. Könige|1. Chronik|2. Chronik|Nehemia|Hiob|Psalm|Sprüche|Prediger|Hohelied|Jesaja|Jeremia|Klagelieder|Hesekiel|Daniel|Hosea|Amos|Nahum|Habakuk|Zephanja|Haggai|Maleachi|Matthäus|Markus|Lukas|Johannes|Apostelgeschichte|Römer|1. Korinther|2. Korinther|Galater|Epheser|Philipper|Kolosser|1. Thessalonicher|2. Thessalonicher|1. Timotheus|2. Timotheus|Hebräer|Jakobus|1. Petrus|2. Petrus|1. Johannes|Offenbarung',
'ko':'창세기|출애굽기|레위기|민수기|신명기|여호수아|사무엘상|열왕기상|역대상|역대하|느헤미야|욥기|시편|잠언|전도서|아가|이사야|예레미야|예레미야애가|에스겔|다니엘|호세아|아모스|나훔|하박국|스바냐|학개|말라기|마태복음|마가복음|누가복음|요한복음|사도행전|로마서|고린도전서|고린도후서|갈라디아서|에베소서|빌립보서|골로새서|데살로니가전서|데살로니가후서|디모데전서|디모데후서|히브리서|야고보서|베드로전서|베드로후서|요한일서|요한계시록'}
BN['he']='בראשית|שמות|ויקרא|במדבר|דברים|יהושע|שמואל א׳|מלכים א׳|דברי הימים א׳|דברי הימים ב׳|נחמיה|איוב|תהלים|משלי|קהלת|שיר השירים|ישעיהו|ירמיהו|איכה|יחזקאל|דניאל|הושע|עמוס|נחום|חבקוק|צפניה|חגי|מלאכי|מתי|מרקוס|לוקס|יוחנן|מעשי השליחים|רומים|קורינתים א׳|קורינתים ב׳|גלטים|אפסים|פיליפים|קולוסים|תסלוניקים א׳|תסלוניקים ב׳|טימותיאוס א׳|טימותיאוס ב׳|עברים|יעקב|פטרוס א׳|פטרוס ב׳|יוחנן א׳|התגלות'
BOOKS={l:dict(zip(EN_BOOKS,v.split('|'))) for l,v in BN.items()}
assert all(len(b)==len(EN_BOOKS) for b in BOOKS.values())
assert all(len(m)==24 for m in MEAN.values())
