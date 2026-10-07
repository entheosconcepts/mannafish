window.__db={notes:[],activity:[],orders:[{id:'o1',created_at:'2026-10-07T12:00:00Z',status:'requested',site:'mannafish',order_items:[{word_key:'HOPE',language:'Español',qty:2}]}]};
window.__calls=[];
window.supabase={createClient:function(url,key){ __calls.push(['create',url,key]); var cbs=[], session=null;
  function Q(t){ var f=[], op='select', payload=null, single=false, lim=null, ord=null;
    var q={select:function(){op=op==='select'?'select':op;return q;}, eq:function(c,v){f.push([c,v]);return q;}, order:function(c,o){ord=[c,o&&o.ascending];return q;}, limit:function(n){lim=n;return q;},
      insert:function(p){op='insert';payload=p;return q;}, update:function(p){op='update';payload=p;return q;}, delete:function(){op='delete';return q;},
      then:function(res,rej){ var rows=__db[t]; var m=function(r){return f.every(function(x){return r[x[0]]===x[1];});};
        if(op==='insert'){ var p=Object.assign({id:'n'+Math.random(),updated_at:new Date().toISOString()},payload); rows.push(p); __calls.push(['insert',t,payload]); return Promise.resolve({data:[p]}).then(res,rej);}
        if(op==='update'){ rows.filter(m).forEach(function(r){Object.assign(r,payload);}); __calls.push(['update',t,payload]); return Promise.resolve({data:[]}).then(res,rej);}
        if(op==='delete'){ __db[t]=rows.filter(function(r){return !m(r);}); return Promise.resolve({data:[]}).then(res,rej);}
        var out=rows.filter(m); if(lim) out=out.slice(0,lim); return Promise.resolve({data:out}).then(res,rej);} };
    return q; }
  return {from:Q, auth:{
    getSession:function(){return Promise.resolve({data:{session:session}});},
    onAuthStateChange:function(cb){cbs.push(cb);},
    signInWithOtp:function(o){__calls.push(['otp',o.email,o.options.emailRedirectTo]);return Promise.resolve({});},
    verifyOtp:function(o){ __calls.push(['verify',o.email||o.token_hash,o.token,o.type]); if(o.token_hash){ if(o.token_hash!=='goodhash') return Promise.resolve({error:{message:'expired'}}); o.email='link@x.com'; o.token='123456'; } if(o.token!=='123456') return Promise.resolve({error:{message:'bad'}}); session={user:{id:'u1',email:o.email}}; cbs.forEach(function(c){c('SIGNED_IN',session);}); return Promise.resolve({data:{session:session}});},
    signOut:function(){ session=null; cbs.forEach(function(c){c('SIGNED_OUT',null);}); return Promise.resolve({});} }}; }};
