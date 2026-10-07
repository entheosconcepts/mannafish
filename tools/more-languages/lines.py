# Fish lines for the extra languages, quoted from each Bible's own text (see verses_all.json).
# key: (word, top, bottom, chapter:verse)
CV={'REST':'11:28','HOPE':'42:5','LOVE':'15:12','TRUST':'37:5','PRAY':'11:2','BELIEVE':'14:1','FORGIVE':'6:14','GIVE':'6:38','SEEK':'6:33','ASK':'11:13','KNOCK':'7:7-8','FOLLOW':'9:23','LISTEN':'1:33','REMEMBER':'22:19','CHOOSE':'30:19','HONOR':'6:2','GROW':'3:18','GATHER':'18:20','ACCEPT':'15:7','BREATHE':'37:9','ENJOY':'3:13','LIVE':'118:17','SING':'96:1','LAUGH':'3:4'}
BOOK={'REST':'Mt','HOPE':'Ps','LOVE':'Jn','TRUST':'Ps','PRAY':'Lk','BELIEVE':'Jn','FORGIVE':'Mt','GIVE':'Lk','SEEK':'Mt','ASK':'Lk','KNOCK':'Mt','FOLLOW':'Lk','LISTEN':'Pr','REMEMBER':'Lk','CHOOSE':'Dt','HONOR':'Ep','GROW':'2P','GATHER':'Mt','ACCEPT':'Ro','BREATHE':'Ez','ENJOY':'Ec','LIVE':'Ps','SING':'Ps','LAUGH':'Ec'}
L={}
L['tl']=dict(tag=' (ABTAG)', books={'Mt':('Mateo','Mat.'),'Ps':('Mga Awit','Awit'),'Jn':('Juan','Juan'),'Lk':('Lucas','Luc.'),'Pr':('Mga Kawikaan','Kaw.'),'Dt':('Deuteronomio','Deut.'),'Ep':('Mga Taga-Efeso','Efe.'),'2P':('2 Pedro','2 Ped.'),'Ro':('Mga Taga-Roma','Roma'),'Ez':('Ezekiel','Ezek.'),'Ec':('Eclesiastes','Ecl.')}, fish={
'REST':('Magpahinga','Magsiparito sa akin, kayong lahat na nangapapagal','at nangabibigatang lubha, at kayo’y aking papagpapahingahin.'),
'HOPE':('Umasa','Umasa ka sa Dios:','sapagka’t pupuri pa ako sa kaniya...'),
'LOVE':('Umibig','Ito ang aking utos, na kayo’y mangagibigan','sa isa’t isa, na gaya ng pagibig ko sa inyo.'),
'TRUST':('Magtiwala','Ihabilin mo ang iyong lakad sa Panginoon;','Tumiwala ka rin naman sa kaniya, at kaniyang papangyayarihin.'),
'PRAY':('Manalangin','Pagka kayo’y nagsisipanalangin, inyong sabihin,','Ama, Sambahin nawa ang pangalan mo.'),
'BELIEVE':('Sumampalataya','Huwag magulumihanan ang inyong puso:','magsisampalataya kayo sa Dios, magsisampalataya naman kayo sa akin.'),
'FORGIVE':('Magpatawad','Kung ipatawad ninyo sa mga tao ang kanilang mga kasalanan,','ay patatawarin naman kayo ng inyong Ama sa kalangitan.'),
'GIVE':('Magbigay','Mangagbigay kayo, at kayo’y bibigyan;','takal na mabuti, pikpik, liglig, at umaapaw...'),
'SEEK':('Humanap','Datapuwa’t hanapin muna ninyo ang kaniyang kaharian,','at ang kaniyang katuwiran...'),
'ASK':('Humingi','Gaano pa kaya ang inyong Ama sa kalangitan','na magbibigay ng Espiritu Santo sa nagsisihingi sa kaniya?'),
'KNOCK':('Kumatok','Magsituktok kayo, at kayo’y bubuksan:','Sapagka’t ang bawa’t humihingi ay tumatanggap...'),
'FOLLOW':('Sumunod','Kung ang sinomang tao ay ibig sumunod sa akin,','ay tumanggi sa kaniyang sarili, at pasanin sa araw-araw ang kaniyang krus...'),
'LISTEN':('Makinig','Nguni’t ang nakikinig sa akin ay tatahang tiwasay.','At tatahimik na walang takot sa kasamaan.'),
'REMEMBER':('Alalahanin','Ito’y aking katawan, na ibinibigay dahil sa inyo:','gawin ninyo ito sa pagaalaala sa akin.'),
'CHOOSE':('Pumili','...ilagay sa harap mo ang buhay at ang kamatayan...','kaya’t piliin mo ang buhay.'),
'HONOR':('Igalang','Igalang mo ang iyong ama at ina','(na siyang unang utos na may pangako).'),
'GROW':('Lumago','Datapuwa’t magsilago kayo sa biyaya at sa pagkakilala','sa ating Panginoon at Tagapagligtas na si Jesucristo.'),
'GATHER':('Magtipon','Kung saan nagkakatipon ang dalawa o tatlo sa aking pangalan,','ay naroroon ako sa gitna nila.'),
'ACCEPT':('Tumanggap','Sa ganito’y mangagtanggapan kayo,','gaya naman ni Cristo na tinanggap kayo sa kaluwalhatian ng Dios.'),
'BREATHE':('Huminga','Manggaling ka sa apat na hangin, Oh hinga,','at humihip ka sa mga patay na ito, upang sila’y mangabuhay.'),
'ENJOY':('Magalak','Ang bawa’t tao rin naman ay marapat kumain at uminom,','at magalak sa kabutihan sa lahat niyang gawa, siyang kaloob ng Dios.'),
'LIVE':('Mabuhay','Hindi ako mamamatay, kundi mabubuhay,','At magpapahayag ng mga gawa ng Panginoon.'),
'SING':('Umawit','Oh magsiawit kayo sa Panginoon ng bagong awit:','Magsiawit kayo sa Panginoon, buong lupa.'),
'LAUGH':('Tumawa','Panahon ng pagiyak, at panahon ng pagtawa;','panahon ng pagtangis, at panahon ng pagsayaw;')})
L['zh']=dict(tag='（和合本）', books={'Mt':('马太福音','太'),'Ps':('诗篇','诗'),'Jn':('约翰福音','约'),'Lk':('路加福音','路'),'Pr':('箴言','箴'),'Dt':('申命记','申'),'Ep':('以弗所书','弗'),'2P':('彼得后书','彼后'),'Ro':('罗马书','罗'),'Ez':('以西结书','结'),'Ec':('传道书','传')}, fish={
'REST':('安息','凡劳苦担重担的人','可以到我这里来，我就使你们得安息。'),
'HOPE':('仰望','应当仰望 神，','我还要称赞他。'),
'LOVE':('相爱','你们要彼此相爱，','像我爱你们一样；这就是我的命令。'),
'TRUST':('倚靠','当将你的事交托耶和华，','并倚靠他，他就必成全。'),
'PRAY':('祷告','你们祷告的时候，要说：','我们在天上的父：愿人都尊你的名为圣。'),
'BELIEVE':('信','你们心里不要忧愁；','你们信 神，也当信我。'),
'FORGIVE':('饶恕','你们饶恕人的过犯，','你们的天父也必饶恕你们的过犯。'),
'GIVE':('给予','你们要给人，就必有给你们的，','并且用十足的升斗，连摇带按，上尖下流地倒在你们怀里……'),
'SEEK':('寻求','你们要先求他的国和他的义，','这些东西都要加给你们了。'),
'ASK':('祈求','何况天父，','岂不更将圣灵给求他的人吗？'),
'KNOCK':('叩门','叩门，就给你们开门。','因为凡祈求的，就得着……'),
'FOLLOW':('跟从','若有人要跟从我，','就当舍己，天天背起他的十字架来跟从我。'),
'LISTEN':('听从','惟有听从我的，必安然居住，','得享安静，不怕灾祸。'),
'REMEMBER':('记念','这是我的身体，为你们舍的，','你们也应当如此行，为的是记念我。'),
'CHOOSE':('拣选','我将生死祸福陈明在你面前，','所以你要拣选生命。'),
'HONOR':('孝敬','要孝敬父母，','这是第一条带应许的诫命。'),
'GROW':('长进','你们却要在我们主－救主耶稣基督的','恩典和知识上有长进。'),
'GATHER':('聚会','无论在哪里，有两三个人奉我的名聚会，','那里就有我在他们中间。'),
'ACCEPT':('接纳','你们要彼此接纳，','如同基督接纳你们一样，使荣耀归与 神。'),
'BREATHE':('呼吸','气息啊，要从四方而来，','吹在这些被杀的人身上，使他们活了。'),
'ENJOY':('享福','人人吃喝，在他一切劳碌中享福，','这也是 神的恩赐。'),
'LIVE':('存活','我必不致死，仍要存活，','并要传扬耶和华的作为。'),
'SING':('歌唱','你们要向耶和华唱新歌！','全地都要向耶和华歌唱！'),
'LAUGH':('欢笑','哭有时，笑有时；','哀恸有时，跳舞有时；')})
L['hi']=dict(tag=' (IRV)', books={'Mt':('मत्ती','मत्ती'),'Ps':('भजन संहिता','भज.'),'Jn':('यूहन्ना','यूह.'),'Lk':('लूका','लूका'),'Pr':('नीतिवचन','नीति.'),'Dt':('व्यवस्थाविवरण','व्य.'),'Ep':('इफिसियों','इफि.'),'2P':('2 पतरस','2 पत.'),'Ro':('रोमियों','रोम.'),'Ez':('यहेजकेल','यहे.'),'Ec':('सभोपदेशक','सभो.')}, fish={
'REST':('विश्राम करो','हे सब परिश्रम करनेवालों और बोझ से दबे लोगों,','मेरे पास आओ; मैं तुम्हें विश्राम दूँगा।'),
'HOPE':('आशा रखो','परमेश्वर पर आशा लगाए रह;','क्योंकि मैं ... फिर उसका धन्यवाद करूँगा।'),
'LOVE':('प्रेम करो','मेरी आज्ञा यह है, कि जैसा मैंने तुम से प्रेम रखा,','वैसा ही तुम भी एक दूसरे से प्रेम रखो।'),
'TRUST':('भरोसा रखो','अपने मार्ग की चिन्ता यहोवा पर छोड़;','और उस पर भरोसा रख, वही पूरा करेगा।'),
'PRAY':('प्रार्थना करो','जब तुम प्रार्थना करो, तो कहो:','‘हे पिता, तेरा नाम पवित्र माना जाए, तेरा राज्य आए।’'),
'BELIEVE':('विश्वास करो','तुम्हारा मन व्याकुल न हो,','तुम परमेश्वर पर विश्वास रखते हो मुझ पर भी विश्वास रखो।'),
'FORGIVE':('क्षमा करो','यदि तुम मनुष्य के अपराध क्षमा करोगे,','तो तुम्हारा स्वर्गीय पिता भी तुम्हें क्षमा करेगा।'),
'GIVE':('दिया करो','दिया करो, तो तुम्हें भी दिया जाएगा:','लोग पूरा नाप दबा-दबाकर और हिला-हिलाकर और उभरता हुआ तुम्हारी गोद में डालेंगे...'),
'SEEK':('खोजो','पहले तुम परमेश्वर के राज्य','और धार्मिकता की खोज करो...'),
'ASK':('माँगो','तो तुम्हारा स्वर्गीय पिता अपने माँगनेवालों को','पवित्र आत्मा क्यों न देगा।'),
'KNOCK':('खटखटाओ','खटखटाओ, तो तुम्हारे लिये खोला जाएगा।','क्योंकि जो कोई माँगता है, उसे मिलता है...'),
'FOLLOW':('पीछे हो लो','यदि कोई मेरे पीछे आना चाहे,','तो अपने आप से इन्कार करे और प्रतिदिन अपना क्रूस उठाए हुए मेरे पीछे हो ले।'),
'LISTEN':('सुनो','परन्तु जो मेरी सुनेगा, वह निडर बसा रहेगा,','और विपत्ति से निश्चिन्त होकर सुख से रहेगा।'),
'REMEMBER':('स्मरण करो','यह मेरी देह है, जो तुम्हारे लिये दी जाती है:','मेरे स्मरण के लिये यही किया करो।'),
'CHOOSE':('चुनो','मैंने जीवन और मरण, आशीष और श्राप को तुम्हारे आगे रखा है;','इसलिए तू जीवन ही को अपना ले...'),
'HONOR':('आदर करो','अपनी माता और पिता का आदर कर','(यह पहली आज्ञा है, जिसके साथ प्रतिज्ञा भी है)।'),
'GROW':('बढ़ते जाओ','हमारे प्रभु, और उद्धारकर्ता यीशु मसीह के','अनुग्रह और पहचान में बढ़ते जाओ।'),
'GATHER':('इकट्ठे हो','जहाँ दो या तीन मेरे नाम पर इकट्ठे होते हैं','वहाँ मैं उनके बीच में होता हूँ।'),
'ACCEPT':('ग्रहण करो','जैसा मसीह ने भी परमेश्वर की महिमा के लिये तुम्हें ग्रहण किया है,','वैसे ही तुम भी एक दूसरे को ग्रहण करो।'),
'BREATHE':('साँस लो','हे साँस... चारों दिशाओं से आकर','इन घात किए हुओं में समा जा, कि ये जी उठें।'),
'ENJOY':('आनन्द करो','यह भी परमेश्वर का दान है','कि मनुष्य खाए-पीए और अपने सब परिश्रम में सुखी रहे।'),
'LIVE':('जीवित रहो','मैं न मरूँगा वरन् जीवित रहूँगा,','और परमेश्वर के कामों का वर्णन करता रहूँगा।'),
'SING':('गाओ','यहोवा के लिये एक नया गीत गाओ,','हे सारी पृथ्वी के लोगों यहोवा के लिये गाओ!'),
'LAUGH':('हँसो','रोने का समय, और हँसने का भी समय;','छाती पीटने का समय, और नाचने का भी समय है;')})
L['el']=dict(tag=' (FPB)', books={'Mt':('Ματθαίος','Ματθ.'),'Ps':('Ψαλμοί','Ψαλμ.'),'Jn':('Ιωάννης','Ιω.'),'Lk':('Λουκάς','Λουκ.'),'Pr':('Παροιμίες','Παρ.'),'Dt':('Δευτερονόμιο','Δευτ.'),'Ep':('Εφεσίους','Εφ.'),'2P':('Β΄ Πέτρου','Β΄ Πέτρ.'),'Ro':('Ρωμαίους','Ρωμ.'),'Ez':('Ιεζεκιήλ','Ιεζ.'),'Ec':('Εκκλησιαστής','Εκκλ.')}, fish={
'REST':('Αναπαύσου','Ελάτε σε μένα όλοι όσοι κοπιάζετε','και είστε φορτωμένοι, και εγώ θα σας αναπαύσω.'),
'HOPE':('Έλπισε','Έλπισε στον Θεό·','επειδή, ακόμα θα τον υμνώ...'),
'LOVE':('Αγάπα','Αυτή είναι η εντολή μου, να αγαπάτε','ο ένας τον άλλον, όπως εγώ σας αγάπησα.'),
'TRUST':('Εμπιστέψου','Ανάθεσε στον Κύριο τον δρόμο σου,','και έλπιζε σ’ αυτόν, και αυτός θα ενεργήσει.'),
'PRAY':('Προσευχήσου','Όταν προσεύχεστε, να λέτε: Πατέρα μας,','που είσαι στους ουρανούς, ας αγιαστεί το όνομά σου.'),
'BELIEVE':('Πίστευε','Ας μη ταράζεται η καρδιά σας·','πιστεύετε στον Θεό, και σε μένα πιστεύετε.'),
'FORGIVE':('Συγχώρεσε','Αν συγχωρήσετε στους ανθρώπους τα πταίσματά τους,','θα συγχωρήσει και σε σας ο ουράνιος Πατέρας σας.'),
'GIVE':('Δίνε','Να δίνετε, και θα σας δοθεί·','καλό μέτρο, πιεσμένο, και συγκαθισμένο και υπερξεχειλιζόμενο...'),
'SEEK':('Αναζήτα','Να ζητάτε πρώτα τη βασιλεία τού Θεού,','και τη δικαιοσύνη του...'),
'ASK':('Ζήτα','Πόσο μάλλον ο Πατέρας ο ουράνιος θα δώσει','Πνεύμα άγιο σ’ εκείνους που ζητούν απ’ αυτόν;'),
'KNOCK':('Κρούε','Κρούετε, και θα σας ανοιχτεί·','επειδή, καθένας που ζητάει, παίρνει...'),
'FOLLOW':('Ακολούθα','Αν κάποιος θέλει νάρθει πίσω μου,','ας απαρνηθεί τον εαυτό του, και ας σηκώσει τον σταυρό του, καθημερινά...'),
'LISTEN':('Άκου','Όποιος, όμως, με ακούει, θα κατοικήσει με ασφάλεια·','και θα ησυχάζει, χωρίς να φοβάται κακό.'),
'REMEMBER':('Θυμήσου','Τούτο είναι το σώμα μου, που δίνεται για σας·','αυτό να κάνετε στη δική μου ανάμνηση.'),
'CHOOSE':('Διάλεξε','Έβαλα μπροστά σας τη ζωή και τον θάνατο...','γι’ αυτό, διαλέξτε τη ζωή.'),
'HONOR':('Τίμα','«Τίμα τον πατέρα σου και τη μητέρα»,','αυτή είναι η πρώτη εντολή με υπόσχεση.'),
'GROW':('Αυξάνου','Να αυξάνεστε δε στη χάρη και στη γνώση','τού Κυρίου μας και Σωτήρα, του Ιησού Χριστού.'),
'GATHER':('Μαζευτείτε','Όπου είναι δύο ή τρεις συγκεντρωμένοι στο όνομά μου,','εκεί είμαι εγώ ανάμεσά τους.'),
'ACCEPT':('Δέξου','Προσδέχεστε ο ένας τον άλλον,','όπως και ο Χριστός προσδέχθηκε εμάς προς δόξαν τού Θεού.'),
'BREATHE':('Ανάπνευσε','Έλα, πνεύμα, από τους τέσσερις ανέμους,','και φύσηξε προς αυτούς τούς φονευμένους, και ας αναζήσουν.'),
'ENJOY':('Απόλαυσε','Το να τρώει κάθε άνθρωπος, και να πίνει,','και να απολαμβάνει καλό από ολόκληρο τον μόχθο του, είναι χάρισμα του Θεού.'),
'LIVE':('Ζήσε','Δεν θα πεθάνω, αλλά θα ζήσω,','και θα διηγούμαι τα έργα τού Κυρίου.'),
'SING':('Ψάλλε','Ψάλτε στον Κύριο ένα καινούργιο τραγούδι·','ψάλτε στον Κύριο, ολόκληρη η γη.'),
'LAUGH':('Γέλα','Καιρός να κλαίει, και καιρός να γελάει·','καιρός να πενθεί, και καιρός να χορεύει·')})
import json,re
ORDER=list(CV)
out={}
for lg,d in L.items():
    arr=[]
    for k in ORDER:
        w,t,b=d['fish'][k]; full,ab=d['books'][BOOK[k]]
        sep='' if lg=='zh' else ' '
        arr.append({'key':k,'word':w,'top':t,'bottom':b,'ref':full+sep+CV[k],'refShort':ab+sep+CV[k]})
        if lg=='el': assert not re.search('[A-Za-z]',w+t+b), (k,w,t,b)
    out[lg]={'tag':d['tag'],'fish':arr}
json.dump(out,open('lines.json','w'),ensure_ascii=False,indent=1)
print({k:len(v['fish']) for k,v in out.items()})
