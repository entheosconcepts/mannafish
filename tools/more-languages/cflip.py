import sys
p=sys.argv[1]; s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s; assert s.count(a)==1,a[:90]; s=s.replace(a,b)
css='''
/* Ken, 8 Oct: the fish in the side-by-side view flip to the word study too (tap the fish) */
.cmp .cmpf{cursor:pointer}
.cmpb{display:none;container-type:inline-size;border:1px solid rgba(255,255,255,.18);border-radius:6px;background:#000;color:#eaf0f0;cursor:pointer}
.cmp figure.on .cmpf{display:none}
.cmp figure.on .cmpb{display:block;animation:cmpflip .35s ease}
@keyframes cmpflip{from{transform:perspective(900px) rotateY(90deg)}to{transform:none}}
.cmpb .face{position:static;inset:auto;backface-visibility:visible;-webkit-backface-visibility:visible;visibility:visible;padding:18px 14px 20px;border:0;background:none;transform:none}
.cmpb .refs{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 14px}
.cmpb .wtitle{font-size:clamp(1.6rem,9cqw,2.6rem)}
.cmp figure:only-child .cmpb .refs{grid-template-columns:repeat(4,minmax(0,1fr))}
'''
s=s.replace('</style>',css+'</style>',1)
old="    $('cmp').innerHTML=cmpLangs().map(function(l){ return '<figure data-l=\"'+l+'\"><div class=\"cmpf\">'+(fishFor(l,cur)||'<p class=\"cmpwait\">…</p>')+'</div><figcaption>'+cmpName(l)+spk+'</figcaption><div class=\"saybox\" hidden></div></figure>'; }).join(''); };"
new="""    var back='<div class="face back">'+document.querySelector('#stage .face.back').innerHTML.replace(/\\sid="[^"]*"/g,'')+'</div>';
    $('cmp').innerHTML=cmpLangs().map(function(l){ return '<figure data-l="'+l+'"'+(cmpOn[l]?' class="on"':'')+'><div class="cmpf">'+(fishFor(l,cur)||'<p class="cmpwait">…</p>')+'</div><div class="cmpb">'+back+'</div><figcaption>'+cmpName(l)+spk+'</figcaption><div class="saybox" hidden></div></figure>'; }).join(''); };
  var cmpOn={};
  // tap a fish to turn it over; on the back, verses and Strong's open just as on the single fish
  $('cmp').addEventListener('click',function(e){ var f=e.target.closest('figure[data-l]'); if(!f||e.target.closest('.spk,figcaption,.saybox')) return;
    var ref=e.target.closest('.ref'); if(ref){ e.stopPropagation(); openReader(cur,+ref.dataset.i); return; }
    var conc=e.target.closest('.conc'); if(conc){ var gk=conc===f.querySelectorAll('.conc')[0], sg=STRONGS[cur]||['',''], n=gk?sg[0]:sg[1];
      if(n && LEX[(gk?'G':'H')+n]){ e.preventDefault(); e.stopPropagation(); openStrongs(cur,gk); } return; }
    var l=f.dataset.l; cmpOn[l]=!cmpOn[l]; f.classList.toggle('on',!!cmpOn[l]); if(window.MFsave) MFsave(); });"""
rep(old,new)
# a new word starts every fish face-up
rep("  window.MFword=function(){ stopSpeak(); $('sayMain').hidden=true;","  window.MFword=function(){ stopSpeak(); $('sayMain').hidden=true; cmpOn={};")
open(p,'w',encoding='utf-8').write(s)
