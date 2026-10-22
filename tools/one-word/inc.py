# which fish words are in which KJV chapters (with the verse where each first appears)
import json,re,collections,math
import os; W=os.environ.get('ONEWORD_WORK','work/')   # the work folder (DATA.json: the main fish, from index.html)
S='/home/user/mannafish/'
B=[["Genesis",50],["Exodus",40],["Leviticus",27],["Numbers",36],["Deuteronomy",34],["Joshua",24],["Judges",21],["Ruth",4],["1 Samuel",31],["2 Samuel",24],["1 Kings",22],["2 Kings",25],["1 Chronicles",29],["2 Chronicles",36],["Ezra",10],["Nehemiah",13],["Esther",10],["Job",42],["Psalm",150],["Proverbs",31],["Ecclesiastes",12],["Song of Solomon",8],["Isaiah",66],["Jeremiah",52],["Lamentations",5],["Ezekiel",48],["Daniel",12],["Hosea",14],["Joel",3],["Amos",9],["Obadiah",1],["Jonah",4],["Micah",7],["Nahum",3],["Habakkuk",3],["Zephaniah",3],["Haggai",2],["Zechariah",14],["Malachi",4],["Matthew",28],["Mark",16],["Luke",24],["John",21],["Acts",28],["Romans",16],["1 Corinthians",16],["2 Corinthians",13],["Galatians",6],["Ephesians",6],["Philippians",4],["Colossians",4],["1 Thessalonians",5],["2 Thessalonians",3],["1 Timothy",6],["2 Timothy",4],["Titus",3],["Philemon",1],["Hebrews",13],["James",5],["1 Peter",5],["2 Peter",3],["1 John",5],["2 John",1],["3 John",1],["Jude",1],["Revelation",22]]
CH=[]
for b,(n,k) in enumerate(B):
    for c in range(1,k+1):
        t=json.load(open(S+'fish-lang/bible/kjv/%s-%d.json'%(n.replace(' ','_'),c)))['t']
        CH.append({'b':b,'c':c,'t':t,'w':sum(len(v.split()) for v in t if v)})
# the fish words: main, year, daily (with where each is drawn)
words={}
D=json.load(open(W+'DATA.json'))
for k,v in D.items(): words.setdefault(v['title'].lower(),{'w':v['title'],'src':'main','k':k})
y=json.load(open(S+'tools/year-fish/weeks.json'))
for wk in y['weeks']:
    for p in wk['p']: words.setdefault(p[0].lower(),{'w':p[0],'src':'year','ref':p[1]})
d=json.load(open(S+'edit/daily/data.json'))
for f in d['fish']: words.setdefault(f['word'].lower(),{'w':f['word'],'src':'daily','k':f['k'],'ref':f['ref'],'inplan':f.get('inplan')})
IRR={'give':['gave','given','giveth','givest','giving','gives','gavest'],'seek':['sought','seeketh','seeking','seekest','seeks'],'rise':['rose','risen','riseth','rising','arise','arose'],
 'go':['went','gone','goeth','going'],'come':['came','cometh','coming','comest'],'see':['saw','seen','seeth','seeing'],'know':['knew','known','knoweth','knowest','knowing','knowledge'],
 'speak':['spake','spoken','speaketh','speaking'],'teach':['taught','teacheth','teaching'],'bring':['brought','bringeth','bringing'],'take':['took','taken','taketh'],'keep':['kept','keepeth','keeping','keepest'],
 'lead':['led','leadeth','leading'],'feed':['fed','feedeth'],'sing':['sang','sung','singeth','singing'],'fight':['fought','fighteth'],'hold':['held','holdeth'],'stand':['stood','standeth','standing'],
 'build':['built','buildeth','builded'],'fall':['fell','fallen','falleth'],'bear':['bare','born','borne','beareth'],'choose':['chose','chosen','chooseth'],'forgive':['forgave','forgiven','forgiveth','forgiveness'],
 'eat':['ate','eaten','eateth'],'drink':['drank','drunk','drinketh'],'hear':['heard','heareth','hearing'],'find':['found','findeth'],'sit':['sat','sitteth'],'win':['won','winneth'],'tell':['told','telleth'],
 'buy':['bought','buyeth'],'sell':['sold','selleth'],'catch':['caught'],'dwell':['dwelt','dwelleth','dwelling'],'abide':['abode','abideth'],'shine':['shone','shineth','shining'],'run':['ran','runneth'],
 'pray':['prayed','prayeth','prayer','prayers','praying'],'believe':['believed','believeth','believing','belief'],'love':['loved','loveth','lovest','loving'],'hope':['hoped','hopeth','hoping'],'trust':['trusted','trusteth','trusting'],
 'live':['lived','liveth','living','lives','alive','life'],'grow':['grew','grown','groweth'],'breathe':['breath','breathed'],'laugh':['laughed','laughter','laugheth'],'honor':['honour','honoured','honoureth','honourable'],
 'rejoice':['rejoiced','rejoiceth','rejoicing','joy'],'shepherd':['shepherds'],'child':['children'],'man':['men'],'woman':['women'],'brother':['brethren','brothers']}
# modern fish words whose King James words are different (Ken, 22 Oct: Hearken became Listen, Beseech Urge, Tarry Stay)
ALIAS={'listen':['hearken','hearkened','hearkeneth','hearkening','hear'],'urge':['beseech','beseeching','besought','beseecheth'],'stay':['tarry','tarried','tarrieth','tarrying']}
TOK=re.compile(r"[a-z]+")
def forms(w):
    w=w.lower(); f={w}|set(ALIAS.get(w,[]))
    if w in IRR: f|=set(IRR[w])
    if ' ' in w: return f
    f|={w+'s',w+'es',w+'ed',w+'eth',w+'est',w+'ing',w+'d',w+'th',w+'st'}
    if w.endswith('e'): b=w[:-1]; f|={b+'ing',b+'eth',b+'est',b+'ed'}
    if w.endswith('y') and len(w)>2 and w[-2] not in 'aeiou': b=w[:-1]+'i'; f|={b+'es',b+'ed',b+'eth',b+'est'}
    if re.search(r'[^aeiou][aeiou][bdgmnprt]$',w): f|={w+w[-1]+'ed',w+w[-1]+'ing',w+w[-1]+'eth'}
    return f
INC={}   # word -> {chapter index: [count, first verse]}
for lw,info in words.items():
    if ' ' in lw: continue
    F=forms(lw); m={}
    for i,ch in enumerate(CH):
        n=0; fv=0
        for v,txt in enumerate(ch['t']):
            if not txt: continue
            k=sum(1 for t in TOK.findall(txt.lower()) if t in F)
            if k and not fv: fv=v+1
            n+=k
        if n: m[i]=[n,fv]
    if m: INC[lw]=m
json.dump({'B':B,'CH':[{'b':c['b'],'c':c['c'],'w':c['w']} for c in CH],'words':words,'INC':INC},open(W+'inc.json','w'))
cnt=collections.Counter(); 
for lw,m in INC.items():
    for i in m: cnt[i]+=1
print('words with any chapter:',len(INC),'of',len(words))
zero=[i for i in range(len(CH)) if cnt[i]==0]; low=[i for i in range(len(CH)) if 0<cnt[i]<4]
print('chapters with no fish word:',len(zero),[B[CH[i]['b']][0]+' '+str(CH[i]['c']) for i in zero])
print('chapters with 1-3 fish words:',len(low),[B[CH[i]['b']][0]+' '+str(CH[i]['c'])+'('+str(cnt[i])+')' for i in low][:40])
