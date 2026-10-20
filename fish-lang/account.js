// The free MannaFish account, for the Bible (/bible/) and You (/you/) pages (the Today page has its own, the same account).
// Ken, 20 Oct: "create a free account to create notes, add prayers, highlights and see your recent and history".
// No password: an email with a code (or a link). Everything is kept on the device first, so nothing waits on the network; signed in,
// it goes to the account and comes back on any phone or computer:
//   notes (mf-notes2: a note whose id is not "d<digits>" is the account's row, the same rule as the Today page)
//   prayers (mf-prayers: c:true is the account's copy; the same as the Today page)
//   highlights (mf-hl; mf-hl-del lists the ones taken off, so the account forgets them too)
//   saved verses, my links, settings (one row each, "SYNC:<name>", the newest wins) and reading history (joined)
// MFacct.on(fn) hears sign-in and sign-out; MFacct.sync() runs soon after a change (MFacct.touch('saved'|'links'|'set'|'hist')).
(function(){
  var SB_URL='https://oblttpxqjvaglwfdszdg.supabase.co', SB_KEY='sb_publishable_Nl4EDkBHlrnEqFVcL_oGvQ_J-X-t3Wc', SITE='mannafish';
  var TOKEN='sb-oblttpxqjvaglwfdszdg-auth-token';
  var sb=null, me=null, loading=null, subs=[], busy=null, again=false, timer=null;
  function get(k,d){ try{ var v=JSON.parse(localStorage.getItem(k)||'null'); return v==null?d:v; }catch(e){ return d; } }
  function put(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
  function raw(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function hasSession(){ return !!raw(TOKEN)||/[#&?](access_token|code)=/.test(location.href); }
  function load(){ if(loading) return loading;
    loading=new Promise(function(ok,no){ if(window.supabase&&window.supabase.createClient) return ok();
      var s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; s.onload=ok; s.onerror=function(){ loading=null; no(new Error('offline')); }; document.head.appendChild(s); })
      .then(function(){ sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,detectSessionInUrl:true}});
        sb.auth.onAuthStateChange(function(ev,s){ setMe(s&&s.user||null); }); return sb.auth.getSession(); })
      .then(function(r){ setMe(r&&r.data&&r.data.session&&r.data.session.user||null); return sb; });
    return loading; }
  function setMe(u){ var was=me; me=u; if((was&&was.id)!==(u&&u.id)){ subs.forEach(function(f){ try{ f(u); }catch(e){} }); if(u) soon(50); } }
  function stamp(name){ var S=get('mf-sync-at',{}); S[name]=Date.now(); put('mf-sync-at',S); }

  // ── notes ──
  function isLocal(id){ return /^d\d+$/.test(String(id)); }
  function syncNotes(){ var gone=get('mf-notes-del',[]);
    return Promise.all(gone.map(function(id){ return sb.from('notes').delete().eq('id',id).eq('site',SITE); })).then(function(){ put('mf-notes-del',[]);
      return sb.from('notes').select('id,body,word_key,created_at,updated_at').eq('site',SITE).not('word_key','like','PRAYER:%').not('word_key','like','SYNC:%'); })
    .then(function(r){ if(r.error) throw r.error; var rows=(r.data||[]).filter(function(x){ return x.body; }), byId={}, byText={}, N=get('mf-notes2',{}), jobs=[], seen={};
      var newId={}, drop={}, text={};   // what changes here, applied to the notes as they are when the account answers
      rows.forEach(function(x){ byId[x.id]=x; byText[x.word_key+'\n'+x.body]=x; });
      Object.keys(N).forEach(function(k){ (N[k]||[]).forEach(function(n){ if(!n||!n.text) return;
        if(!isLocal(n.id)){ var row=byId[n.id]; if(!row){ drop[n.id]=1; return; }   // taken off on another device
          seen[n.id]=1; var up=Date.parse(row.updated_at||row.created_at)||0;
          if(row.body!==n.text){ if((n.ed||n.at||0)>up) jobs.push(sb.from('notes').update({body:n.text,updated_at:new Date().toISOString()}).eq('id',n.id)); else text[n.id]=[row.body,up]; }
          return; }
        var same=byText[k+'\n'+n.text]; if(same&&!seen[same.id]){ newId[n.id]=same.id; seen[same.id]=1; return; }
        jobs.push(sb.from('notes').insert({site:SITE,word_key:k,body:n.text,created_at:new Date(n.at||Date.now()).toISOString()}).select('id').then(function(r2){ var x=(r2.data||[])[0]; if(x){ newId[n.id]=x.id; seen[x.id]=1; } })); }); });
      return Promise.all(jobs).then(function(){ var M=get('mf-notes2',{}), have={};
        Object.keys(M).forEach(function(k){ M[k]=(M[k]||[]).filter(function(n){ return n&&!drop[n.id]; }).map(function(n){ if(newId[n.id]) n.id=newId[n.id]; if(text[n.id]){ n.text=text[n.id][0]; n.ed=text[n.id][1]; } have[n.id]=1; return n; }); if(!M[k].length) delete M[k]; });
        // what the account has that this device does not
        rows.forEach(function(x){ if(have[x.id]||seen[x.id]) return; var a=Date.parse(x.created_at)||Date.now(), u=Date.parse(x.updated_at)||0;
          (M[x.word_key]=M[x.word_key]||[]).push({id:x.id,text:x.body,at:a,ed:u&&u-a>60000?u:0}); });
        put('mf-notes2',M); }); }); }

  // ── prayers: the same as the Today page (the account's list is the list; this device's new ones go up first) ──
  function syncPrayers(){ var P=get('mf-prayers',[]), gone=get('mf-prayers-del',[]), jobs=[];
    gone.forEach(function(id){ jobs.push(sb.from('notes').delete().eq('id',id).eq('site',SITE)); });
    P.forEach(function(x){ if(x.c&&x.dirty) jobs.push(sb.from('notes').update({word_key:'PRAYER:'+(x.status||'open'),body:x.title+'\n'+(x.body||''),updated_at:new Date().toISOString()}).eq('id',x.id)); });
    return Promise.all(jobs).then(function(){ put('mf-prayers-del',[]);
      return sb.from('notes').select('id,body,word_key,created_at,updated_at').eq('site',SITE).like('word_key','PRAYER:%').order('created_at',{ascending:false}); })
    .then(function(r){ if(r.error) throw r.error; var rows=r.data||[], have={}; rows.forEach(function(x){ have[x.body]=1; });
      var up=get('mf-prayers',[]).filter(function(x){ return !x.c&&!have[x.title+'\n'+(x.body||'')]; });
      return Promise.all(up.map(function(x){ return sb.from('notes').insert({site:SITE,word_key:'PRAYER:'+(x.status||'open'),body:x.title+'\n'+(x.body||''),created_at:new Date(x.at||Date.now()).toISOString()}); }))
        .then(function(){ return up.length?sb.from('notes').select('id,body,word_key,created_at,updated_at').eq('site',SITE).like('word_key','PRAYER:%').order('created_at',{ascending:false}):r; }); })
    .then(function(r){ if(r.error) throw r.error; var cloud={}; (r.data||[]).forEach(function(x){ cloud[x.body]=1; });
      var extra=get('mf-prayers',[]).filter(function(x){ return !x.c&&!cloud[x.title+'\n'+(x.body||'')]; });
      put('mf-prayers',extra.concat((r.data||[]).map(function(x){ var b=x.body||'', i=b.indexOf('\n'); return {id:x.id,title:i<0?b:b.slice(0,i),body:i<0?'':b.slice(i+1),status:x.word_key.slice(7),at:Date.parse(x.created_at),done:Date.parse(x.updated_at),c:true}; }))); }); }

  // ── highlights ──
  function syncHl(){ var gone=get('mf-hl-del',[]), off={};
    gone.forEach(function(d){ off[d[0]+'|'+d[1]]=1; });
    return Promise.all(gone.map(function(d){ return sb.from('highlights').delete().eq('site',SITE).eq('verse_ref',d[0]).eq('version',d[1]); })).then(function(){ put('mf-hl-del',[]);
      return sb.from('highlights').select('verse_ref,version,color,created_at').eq('site',SITE); })
    .then(function(r){ if(r.error) throw r.error; var h=get('mf-hl',{}), mine={}, got={}, jobs=[], pull={};
      Object.keys(h).forEach(function(key){ var x=h[key]; mine[(x.kind==='note'?key:x.ref)+'|'+(x.kind==='note'?'note':x.ver)]=key; });
      (r.data||[]).forEach(function(row){ var id=row.verse_ref+'|'+row.version, c=row.color==='yellow'?'gold':(row.color||'gold'); got[id]=c; if(mine[id]||off[id]||row.version==='note') return;
        var m=row.verse_ref.match(/^(.*)\s+(\d+):(\d+)(?:#(\d+)-(\d+))?$/); if(!m) return;
        pull[id]={kind:m[4]?'phrase':'verse',ref:row.verse_ref,ver:row.version,k:'',i:0,l:row.version.indexOf('en:')===0||row.version==='orig'?'en':row.version,v:+m[3],s:m[4]?+m[4]:undefined,e:m[5]?+m[5]:undefined,c:c,text:'',at:Date.parse(row.created_at),bible:1}; });
      Object.keys(mine).forEach(function(id){ var x=h[mine[id]], c=x.kind==='note'?'gold':(x.c||'gold'); if(got[id]===c) return;
        jobs.push(sb.from('highlights').upsert({site:SITE,verse_ref:x.kind==='note'?mine[id]:x.ref,version:x.kind==='note'?'note':x.ver,color:c},{onConflict:'user_id,site,verse_ref,version'})); });
      var H=get('mf-hl',{}), off2={}; get('mf-hl-del',[]).forEach(function(d){ off2[d[0]+'|'+d[1]]=1; });
      Object.keys(pull).forEach(function(id){ if(!H[id]&&!off2[id]) H[id]=pull[id]; }); put('mf-hl',H); return Promise.all(jobs); }); }

  // ── saved verses, my links, settings (newest wins), reading history (joined) ──
  var BLOBS={saved:['mf-bible-saved',[]],links:['mf-bible-links',[]],set:['mf-set',{}],hist:['mf-bible-hist',[]]};
  function setPack(){ var s=get('mf-set',{}); s._mode=raw('mf-mode')||''; s._ver=raw('mf-bible-version')||''; s._hlc=raw('mf-hl-color')||''; return s; }
  function setUnpack(s){ s=s||{}; [['_mode','mf-mode'],['_ver','mf-bible-version'],['_hlc','mf-hl-color']].forEach(function(p){ if(s[p[0]]) try{ localStorage.setItem(p[1],s[p[0]]); }catch(e){} delete s[p[0]]; }); put('mf-set',s); }
  function syncBlobs(){ return sb.from('notes').select('id,word_key,body').eq('site',SITE).like('word_key','SYNC:%').then(function(r){ if(r.error) throw r.error; var have={}, S=get('mf-sync-at',{}), jobs=[];
      (r.data||[]).forEach(function(x){ var o=null; try{ o=JSON.parse(x.body); }catch(e){} if(o) have[x.word_key.slice(5)]={id:x.id,at:o.at||0,data:o.data}; });
      Object.keys(BLOBS).forEach(function(name){ var key=BLOBS[name][0], c=have[name], la=S[name]||0, local=name==='set'?setPack():get(key,BLOBS[name][1]), out=local;
        if(name==='hist'&&c){ var m={}, cut=Math.max(+raw('mf-bible-hist-cut')||0,c.cut||0); (c.data||[]).concat(local).forEach(function(x){ if(x.at<=cut) return; var k=x.b+':'+x.c; if(!m[k]||m[k].at<x.at) m[k]=x; });
          out=Object.keys(m).map(function(k){ return m[k]; }).sort(function(a,b){ return b.at-a.at; }).slice(0,200); put(key,out); try{ localStorage.setItem('mf-bible-hist-cut',String(cut)); }catch(e){}
          var same=JSON.stringify(out)===JSON.stringify(c.data||[])&&cut===(c.cut||0); if(same){ S[name]=c.at; return; } la=Math.max(la,c.at)+1; }
        else if(c&&c.at>la){ if(name==='set') setUnpack(c.data); else put(key,c.data); S[name]=c.at; return; }
        if(c&&c.at===la) return; if(!c&&!la) return;   // nothing changed here, and nothing there
        var body=JSON.stringify({at:la||Date.now(),data:out,cut:name==='hist'?(+raw('mf-bible-hist-cut')||0):undefined}); S[name]=la||Date.now();
        jobs.push(c?sb.from('notes').update({body:body,updated_at:new Date().toISOString()}).eq('id',c.id):sb.from('notes').insert({site:SITE,word_key:'SYNC:'+name,body:body})); });
      put('mf-sync-at',S); return Promise.all(jobs); }); }

  function syncAll(){ if(!sb||!me) return Promise.resolve(false); if(busy){ again=true; return busy; }
    var step=function(f){ return function(){ return f().catch(function(e){ console.warn('MannaFish sync',e&&e.message||e); }); }; };
    busy=Promise.resolve().then(step(syncNotes)).then(step(syncPrayers)).then(step(syncHl)).then(step(syncBlobs))
      .then(function(){ put('mf-synced',Date.now()); busy=null; subs.forEach(function(f){ try{ f(me,'synced'); }catch(e){} }); if(again){ again=false; soon(300); } return true; });
    return busy; }
  var due=0;
  function soon(ms){ ms=ms==null?1500:ms; var at=Date.now()+ms; if(timer&&due&&due<=at) return; clearTimeout(timer); due=at; timer=setTimeout(function(){ timer=null; due=0; if(me) syncAll(); },ms); }

  window.MFacct={
    // is someone signed in on this device (without loading anything)
    maybe:hasSession,
    load:load,
    me:function(){ return me; },
    on:function(f){ subs.push(f); },
    send:function(email,back){ return load().then(function(){ return sb.auth.signInWithOtp({email:email,options:{shouldCreateUser:true,emailRedirectTo:back||(location.origin+location.pathname)}}); }).then(function(r){ if(r.error) throw r.error; }); },
    verify:function(email,code){ return load().then(function(){ return sb.auth.verifyOtp({email:email,token:code,type:'email'}); }).then(function(r){ if(r.error) throw r.error; }); },
    out:function(){ return sb?sb.auth.signOut():Promise.resolve(); },
    sync:syncAll, soon:soon,
    // something changed on this device: remember when (saved, links, set, hist), and send it up shortly
    touch:function(name,lazy){ if(name) stamp(name); if(me) soon(lazy?60000:1500); },
    // a highlight taken off: the account forgets it too
    hlGone:function(x){ if(!x||x.kind==='note') return; var L=get('mf-hl-del',[]); L.push([x.ref,x.ver]); put('mf-hl-del',L.slice(-2000)); if(me) soon(); },
    noteGone:function(id){ if(isLocal(id)) return; var L=get('mf-notes-del',[]); L.push(id); put('mf-notes-del',L); if(me) soon(); },
    prayerGone:function(x){ if(!x||!x.c) return; var L=get('mf-prayers-del',[]); L.push(x.id); put('mf-prayers-del',L); if(me) soon(); }
  };
  // signed in on this device already: open the account and catch up, quietly
  if(hasSession()) load().catch(function(){});
})();
