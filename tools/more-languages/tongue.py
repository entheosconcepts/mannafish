# Every Tongue (Ken, 8 Oct): ready-made phrases for sharing the gospel, in every fish language.
# Claude translated them; each needs a fluent reader's check. The four verses come from each language's Bible.
import json,sys
sys.path.insert(0,'.')
from study_i18n import BOOKS
L=['en','es','tl','zh','hi','el','de','ko','he']
G=[('open','Caring openers','Para empezar'),('ask','Conversation','Conversación'),('gift','Gift and follow-up','Regalo y seguimiento')]
P=[
('open','pray_for',"Can I pray for you?|¿Puedo orar por usted?|Maaari ba kitang ipanalangin?|我可以为你祷告吗？|क्या मैं आपके लिए प्रार्थना करूँ?|Μπορώ να προσευχηθώ για εσάς;|Darf ich für Sie beten?|당신을 위해 기도해 드려도 될까요?"),
('open','pray_together',"Let's pray together.|Oremos juntos.|Manalangin tayo nang sama-sama.|我们一起祷告吧。|आइए, हम मिलकर प्रार्थना करें।|Ας προσευχηθούμε μαζί.|Lassen Sie uns zusammen beten.|함께 기도합시다."),
('open','want_pray',"Would you like to pray?|¿Le gustaría orar?|Gusto mo bang manalangin?|你愿意祷告吗？|क्या आप प्रार्थना करना चाहेंगे?|Θα θέλατε να προσευχηθείτε;|Möchten Sie beten?|기도하시겠어요?"),
('open','god_loves',"God loves you, and so does Jesus.|Dios le ama, y Jesús también.|Mahal ka ng Diyos, at mahal ka rin ni Jesus.|神爱你，耶稣也爱你。|परमेश्वर आपसे प्रेम करता है, और यीशु भी।|Ο Θεός σας αγαπά, και ο Ιησούς επίσης.|Gott liebt Sie, und Jesus auch.|하나님은 당신을 사랑하십니다. 예수님도 당신을 사랑하십니다."),
('open','pray_about',"Is there anything I can pray with you about?|¿Hay algo por lo que pueda orar con usted?|May bagay ba na maaari nating ipanalangin nang magkasama?|有什么事情我可以和你一起祷告吗？|क्या कोई बात है जिसके लिए मैं आपके साथ प्रार्थना करूँ?|Υπάρχει κάτι για το οποίο μπορώ να προσευχηθώ μαζί σας;|Gibt es etwas, wofür ich mit Ihnen beten darf?|함께 기도해 드릴 일이 있을까요?"),
('ask','beliefs',"Do you have any spiritual beliefs?|¿Tiene alguna creencia espiritual?|Mayroon ka bang paniniwalang espirituwal?|你有什么信仰吗？|क्या आपकी कोई आध्यात्मिक मान्यता है?|Έχετε κάποιες πνευματικές πεποιθήσεις;|Haben Sie geistliche Überzeugungen?|믿고 계신 신앙이 있으신가요?"),
('ask','who_jesus',"Who do you think Jesus is?|¿Quién cree usted que es Jesús?|Sa palagay mo, sino si Jesus?|你认为耶稣是谁？|आपके विचार में यीशु कौन है?|Ποιος πιστεύετε ότι είναι ο Ιησούς;|Was meinen Sie, wer ist Jesus?|예수님이 누구라고 생각하세요?"),
('ask','heaven',"If you died today, do you know for sure you would go to heaven?|Si muriera hoy, ¿sabe con seguridad que iría al cielo?|Kung mamatay ka ngayon, sigurado ka bang mapupunta ka sa langit?|如果你今天离世，你确定自己会上天堂吗？|यदि आज आपकी मृत्यु हो जाए, तो क्या आप निश्चित रूप से जानते हैं कि आप स्वर्ग जाएँगे?|Αν πεθαίνατε σήμερα, ξέρετε με βεβαιότητα ότι θα πηγαίνατε στον ουρανό;|Wenn Sie heute sterben würden, wissen Sie sicher, dass Sie in den Himmel kommen?|오늘 세상을 떠난다면, 천국에 간다는 확신이 있으신가요?"),
('ask','shown_bible',"Has anyone ever shown you from the Bible how to know God?|¿Alguien le ha mostrado alguna vez en la Biblia cómo conocer a Dios?|May nagpakita na ba sa iyo mula sa Biblia kung paano makilala ang Diyos?|有没有人用圣经告诉过你怎样认识神？|क्या किसी ने कभी आपको बाइबल से दिखाया है कि परमेश्वर को कैसे जानें?|Σας έχει δείξει ποτέ κανείς από τη Βίβλο πώς να γνωρίσετε τον Θεό;|Hat Ihnen schon einmal jemand aus der Bibel gezeigt, wie man Gott kennenlernen kann?|누군가 성경으로 하나님을 아는 방법을 보여 준 적이 있나요?"),
('ask','know_jesus',"Would you like to know Jesus personally?|¿Le gustaría conocer a Jesús personalmente?|Gusto mo bang personal na makilala si Jesus?|你想亲自认识耶稣吗？|क्या आप यीशु को व्यक्तिगत रूप से जानना चाहेंगे?|Θα θέλατε να γνωρίσετε τον Ιησού προσωπικά;|Möchten Sie Jesus persönlich kennenlernen?|예수님을 인격적으로 알고 싶으신가요?"),
('ask','receive_jesus',"Would you like to receive Jesus as your Lord and Savior?|¿Le gustaría recibir a Jesús como su Señor y Salvador?|Gusto mo bang tanggapin si Jesus bilang iyong Panginoon at Tagapagligtas?|你愿意接受耶稣作你的主和救主吗？|क्या आप यीशु को अपने प्रभु और उद्धारकर्ता के रूप में ग्रहण करना चाहेंगे?|Θα θέλατε να δεχτείτε τον Ιησού ως Κύριο και Σωτήρα σας;|Möchten Sie Jesus als Ihren Herrn und Retter annehmen?|예수님을 당신의 주님과 구원자로 영접하시겠어요?"),
('ask','holy_spirit',"Have you received the Holy Spirit since you believed?|¿Ha recibido el Espíritu Santo desde que creyó?|Tinanggap mo na ba ang Espiritu Santo mula nang ikaw ay sumampalataya?|你信的时候受了圣灵没有？|क्या आपने विश्वास करने के बाद पवित्र आत्मा पाया?|Λάβατε Άγιο Πνεύμα αφού πιστέψατε;|Haben Sie den Heiligen Geist empfangen, seit Sie gläubig geworden sind?|믿은 후에 성령을 받으셨나요?"),
('gift','gift',"May I give you this? It's a free gift.|¿Puedo darle esto? Es un regalo gratis.|Maaari ko bang ibigay ito sa iyo? Libreng regalo ito.|我可以送你这个吗？这是免费的礼物。|क्या मैं आपको यह दूँ? यह एक मुफ़्त उपहार है।|Μπορώ να σας δώσω αυτό; Είναι δωρεάν δώρο.|Darf ich Ihnen das schenken? Es ist ein kostenloses Geschenk.|이것을 드려도 될까요? 무료 선물입니다."),
('gift','have_bible',"Do you have a Bible?|¿Tiene una Biblia?|Mayroon ka bang Biblia?|你有圣经吗？|क्या आपके पास बाइबल है?|Έχετε Βίβλο;|Haben Sie eine Bibel?|성경책 있으세요?"),
('gift','visit_church',"Would you like to visit a church?|¿Le gustaría visitar una iglesia?|Gusto mo bang dumalaw sa isang simbahan?|你愿意去教会看看吗？|क्या आप किसी चर्च में जाना चाहेंगे?|Θα θέλατε να επισκεφθείτε μια εκκλησία;|Möchten Sie einmal eine Kirche besuchen?|교회에 한번 가 보시겠어요?"),
]
# Hebrew (9 Oct): spoken to one man, the usual form; a fluent reader to check
HE={'pray_for':'אפשר להתפלל בשבילך?','pray_together':'בוא נתפלל יחד.','want_pray':'תרצה להתפלל?',
 'god_loves':'אלוהים אוהב אותך, וגם ישוע.','pray_about':'יש משהו שאפשר להתפלל עליו יחד איתך?',
 'beliefs':'יש לך אמונה רוחנית כלשהי?','who_jesus':'מי לדעתך הוא ישוע?',
 'heaven':'אם היית מת היום, האם אתה יודע בוודאות שהיית הולך לשמיים?',
 'shown_bible':'האם מישהו הראה לך פעם מתוך כתבי הקודש איך להכיר את אלוהים?',
 'know_jesus':'תרצה להכיר את ישוע באופן אישי?','receive_jesus':'תרצה לקבל את ישוע כאדון וכמושיע שלך?',
 'holy_spirit':'האם קיבלת את רוח הקודש מאז שהאמנת?','gift':'אפשר לתת לך את זה? זו מתנה חינם.',
 'have_bible':'יש לך תנ״ך וברית חדשה?','visit_church':'תרצה לבקר בכנסייה או בקהילה?'}
NOTE={'holy_spirit':'Acts 19:2'}
V=[('jn316','John',3,16),('ro323','Romans',3,23),('ro623','Romans',6,23),('ro109','Romans',10,9)]
ES={'jn316':'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
 'ro323':'por cuanto todos pecaron, y están destituidos de la gloria de Dios,',
 'ro623':'Porque la paga del pecado es muerte, mas la dádiva de Dios es vida eterna en Cristo Jesús Señor nuestro.',
 'ro109':'que si confesares con tu boca que Jesús es el Señor, y creyeres en tu corazón que Dios le levantó de los muertos, serás salvo.'}
ESB={'John':'Juan','Romans':'Romanos'}
import contextlib,io
with contextlib.redirect_stdout(io.StringIO()): import study_build as sb
def full(l,b,c,v):
  if l=='en': t=sb.KJV[sb.CAN.index(b)][c-1][v-1]; import re; return re.sub(r'\s+',' ',re.sub(r'<[^>]+>|\{[^}]*\}','',t)).strip()
  if l=='es': return None
  return sb.verse(l,b,c,v)
out={'langs':L,'groups':[{'id':g,'en':a,'es':b} for g,a,b in G],'phrases':[],'verses':[]}
for g,i,t in P:
  parts=t.split('|')+[HE[i]]; assert len(parts)==9,(i,len(parts))
  d={'id':i,'g':g,'t':dict(zip(L,parts))}
  if i in NOTE: d['ref']=NOTE[i]
  out['phrases'].append(d)
for i,b,c,v in V:
  t={l:(ES[i] if l=='es' else full(l,b,c,v)) for l in L}
  t={l:x.strip().lstrip('"“「').replace('」','') for l,x in t.items()}
  t={l:x.rstrip(',;，；·\u0387:').rstrip()+('' if x.rstrip()[-1] in '.。!?।' else ('。' if l=='zh' else '…' if x.rstrip()[-1] in ',;，；' else '.' if x.rstrip()[-1] in '·\u0387:' else '')) for l,x in t.items()}
  t={l:x[0].upper()+x[1:] for l,x in t.items()}
  if i=='ro323': t['de']='Denn alle haben gesündigt und erreichen nicht die Herrlichkeit Gottes…'  # Elberfelder joins the end of 3:22 to this verse
  r={l:(f'{BOOKS[l][b]} {c},{v}' if l=='de' else f'{BOOKS[l][b]} {c}:{v}') for l in BOOKS}; r['en']=f'{b} {c}:{v}'; r['es']=f'{ESB[b]} {c}:{v}'
  out['verses'].append({'id':i,'t':t,'r':r})
json.dump(out,open('tongue.json','w'),ensure_ascii=False,indent=1)
for v in out['verses']:
  for l in L: print(v['id'],l,v['r'][l],'|',v['t'][l])
