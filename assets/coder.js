/* codeR - agentic coding console for Gptopen.
   Standalone page. No external CDN. Model calls go to api/relay (free) or
   the user's own OpenAI-compatible endpoint. Code execution defaults to the
   free public Piston API. Workspace is virtual, stored in localStorage. */
(function(){
'use strict';

/* ---------------- constants ---------------- */
var LS_SETTINGS='coder_settings';
var LS_WS='coder_ws';
var LS_SESSIONS='coder_sessions';
var PISTON='https://emkc.org/api/v2/piston/runs';
var MAX_ITERS=25;
var LANGS={
  python:'python', python3:'python', py:'python',
  javascript:'javascript', js:'javascript', node:'javascript', nodejs:'javascript',
  typescript:'typescript', ts:'typescript',
  bash:'bash', sh:'bash', shell:'bash',
  java:'java', c:'c', cpp:'c++', 'c++':'c++', cxx:'c++',
  go:'go', golang:'go', rust:'rust', rs:'rust',
  ruby:'ruby', rb:'ruby', php:'php', swift:'swift', kotlin:'kotlin', kt:'kotlin',
  r:'r', lua:'lua', dart:'dart', elixir:'elixir', haskell:'haskell', perl:'perl',
  csharp:'csharp', 'c#':'csharp', scala:'scala', sqlite3:'sqlite3', sql:'sqlite3'
};
var PRESETS={
  groq:{base:'https://api.groq.com/openai/v1',model:'openai/gpt-oss-120b'},
  openrouter:{base:'https://openrouter.ai/api/v1',model:'nvidia/nemotron-3.5-super-vl:free'},
  gemini:{base:'https://generativelanguage.googleapis.com/v1beta/openai/',model:'gemini-2.5-flash'},
  nvidia:{base:'https://integrate.api.nvidia.com/v1',model:''}
};

/* ---------------- state ---------------- */
var settings=loadJSON(LS_SETTINGS,{mode:'relay',base:'',key:'',model:'',exec:'',plan:false,auto:false});
var ws=loadJSON(LS_WS,{});
var sessions=loadJSON(LS_SESSIONS,[]);
var history=[];            // model messages {role,content}
var transcript=[];         // display log {role,text}
var sessionId=null;
var running=false;
var planApproved=false;
var approvals={};          // id -> resolver
var approvalSeq=0;
var currentFile=null;

function loadJSON(k,fb){ try{ var v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch(e){ return fb; } }
function saveJSON(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ---------------- system prompt ---------------- */
function systemPrompt(){
  var L=[
  'You are codeR, an expert coding agent inside the Gptopen app.',
  'You build COMPLETE, production-ready software: full multi-file websites and apps (HTML, CSS, JS), working API integrations, error handling, responsive mobile-first design.',
  'Never output placeholders, TODO comments, lorem ipsum, or stubs. Every file you write must be finished and runnable.',
  'If the user says "with api" or asks for an API integration but does not name one, ask which API and base URL to wire before coding, or make the API base URL a clearly labeled constant at the top of the code.',
  '',
  'You control a virtual file workspace ONLY through tool calls. A tool call is a fenced code block with language "tool" containing exactly one JSON object. Nothing else may appear inside the fence.',
  'Example:',
  '```tool',
  '{"op":"write","path":"index.html","content":"<!doctype html>..."}',
  '```',
  '',
  'Available ops:',
  '- {"op":"think","text":"..."} : private reasoning, shown collapsed.',
  '- {"op":"plan","text":"..."} : a build plan. When Plan mode is on, emit this FIRST and wait; file ops only run after the user approves.',
  '- {"op":"list","path":""} : list files. Use "" for the workspace root.',
  '- {"op":"read","path":"..."} : read a file.',
  '- {"op":"search","query":"..."} : search file names and contents.',
  '- {"op":"write","path":"...","content":"..."} : create or overwrite a file. The user approves each write unless Auto mode is on.',
  '- {"op":"edit","path":"...","old":"...","new":"..."} : exact-match replacement. The user approves each edit unless Auto mode is on.',
  '- {"op":"run","language":"python","code":"print(1+1)"} : RUNS the code on a free sandboxed backend and returns real stdout/stderr. Language can be python, javascript, typescript, bash, java, c, cpp, go, rust, ruby, php and more. Use this to test code for real.',
  '- {"op":"run","cmd":"..."} : a raw shell command. This only works if the user set a custom exec endpoint in settings; otherwise it is honestly skipped.',
  '- {"op":"done","summary":"..."} : finish. Summarize what was built, which files exist, and how to run or preview it.',
  '',
  'Rules:',
  '- One JSON object per fence, valid JSON, escape content strings properly.',
  '- Paths are relative, no leading slash, no "..".',
  '- Explain briefly in normal text outside the fences, then emit tool calls.',
  '- After each batch of tool results, continue working until done, then emit the done op.',
  '- Never claim a command ran when it did not. Never invent files, test output, or URLs.',
  '- Prefer many small files over one giant file. Always include index.html as the entry point for websites.'
  ];
  return L.join('\n');
}

/* ---------------- model call ---------------- */
function modelLabel(){
  if(settings.mode==='relay') return 'Relay (free)';
  return settings.model || 'Custom';
}
async function callModel(msgs){
  if(settings.mode==='relay'){
    var r=await fetch('api/relay',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({provider:'auto',messages:msgs,temperature:0.4,max_tokens:4000})});
    var j=await r.json();
    var c=j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if(!c) throw new Error((j && j.error && j.error.message) || ('Relay error, HTTP '+r.status));
    return c;
  }
  if(!settings.base || !settings.key || !settings.model) throw new Error('Set base URL, API key and model in settings first.');
  var base=settings.base.replace(/\/+$/,'');
  var r2=await fetch(base+'/chat/completions',{method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+settings.key},
    body:JSON.stringify({model:settings.model,messages:msgs,temperature:0.4,max_tokens:4000})});
  var j2=await r2.json();
  var c2=j2 && j2.choices && j2.choices[0] && j2.choices[0].message && j2.choices[0].message.content;
  if(!c2) throw new Error((j2 && j2.error && j2.error.message) || ('API error, HTTP '+r2.status));
  return c2;
}

/* ---------------- tool block parsing ---------------- */
function parseToolBlocks(text){
  var out=[], re=/```tool\s*\n([\s\S]*?)```/g, m;
  while((m=re.exec(text))){
    var raw=m[1].trim(), op=null, err=null;
    try{ op=JSON.parse(raw); }
    catch(e){
      var s=raw.indexOf('{'), en=raw.lastIndexOf('}');
      if(s>=0 && en>s){ try{ op=JSON.parse(raw.slice(s,en+1)); }catch(e2){ err='Invalid JSON in tool block'; } }
      else err='Invalid JSON in tool block';
    }
    out.push({op:op,err:err,raw:raw});
  }
  return out;
}
function cleanPath(p){
  p=String(p||'').replace(/\\/g,'/').replace(/^\/+/,'').trim();
  var parts=p.split('/').filter(function(x){return x && x!=='.';});
  if(parts.indexOf('..')>=0) return null;
  return parts.join('/');
}

/* ---------------- UI helpers ---------------- */
function $(id){ return document.getElementById(id); }
function scrollDown(){ var m=$('msgs'); m.scrollTop=m.scrollHeight; }
function renderMiniMd(text){
  var html=esc(text);
  html=html.replace(/```(\w*)\n([\s\S]*?)```/g,function(mm,lang,code){
    return '<pre><code>'+code.replace(/^\n+|\n+$/g,'')+'</code></pre>';
  });
  html=html.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  html=html.replace(/\n/g,'<br>');
  return html;
}
function addMsg(role,text,isHtml){
  var d=document.createElement('div');
  d.className='msg '+role;
  if(isHtml) d.innerHTML=text; else d.innerHTML=renderMiniMd(text);
  $('msgs').appendChild(d); scrollDown();
  return d;
}
function addSys(text){ addMsg('sys',text); transcript.push({role:'sys',text:text}); }

var ICONS={think:'\u{1F4AD}',plan:'\u{1F4CB}',list:'\u{1F4C1}',read:'\u{1F4C4}',search:'\u{1F50D}',write:'\u270D\uFE0F',edit:'\u270F\uFE0F',run:'\u25B6\uFE0F',done:'\u2705',bad:'\u26A0\uFE0F'};

function toolCard(opName,title){
  var card=document.createElement('div'); card.className='tool';
  var head=document.createElement('div'); head.className='tool-head';
  var ic=document.createElement('span'); ic.className='tool-ic '+opName; ic.textContent=ICONS[opName]||ICONS.think;
  var nm=document.createElement('span'); nm.textContent=title;
  var path=document.createElement('span'); path.className='tool-path';
  var st=document.createElement('span'); st.className='tool-status';
  head.appendChild(ic); head.appendChild(nm); head.appendChild(path); head.appendChild(st);
  card.appendChild(head);
  var body=document.createElement('div'); body.className='tool-body'; body.style.display='none';
  card.appendChild(body);
  head.style.cursor='pointer';
  head.addEventListener('click',function(){ body.style.display=body.style.display==='none'?'block':'none'; });
  $('msgs').appendChild(card); scrollDown();
  return {card:card,path:path,status:st,body:body,
    setStatus:function(t,cls){ st.textContent=t; st.className='tool-status '+(cls||''); },
    showBody:function(){ body.style.display='block'; scrollDown(); },
    addLabel:function(t){ var l=document.createElement('div'); l.className='lbl'; l.textContent=t; body.appendChild(l); },
    addPre:function(t,maxH){ var p=document.createElement('pre'); p.textContent=t; if(maxH)p.style.maxHeight=maxH; body.appendChild(p); },
    addText:function(t){ var p=document.createElement('div'); p.style.margin='4px 0'; p.textContent=t; body.appendChild(p); },
    actions:function(){
      var a=document.createElement('div'); a.className='tool-actions';
      var ok=document.createElement('button'); ok.className='btn approve'; ok.textContent='Approve';
      var no=document.createElement('button'); no.className='btn reject'; no.textContent='Reject';
      a.appendChild(ok); a.appendChild(no); card.appendChild(a); scrollDown();
      return {ok:ok,no:no,done:function(){ ok.disabled=true; no.disabled=true; }};
    }};
}
function waitApproval(card){
  return new Promise(function(res){
    var id=++approvalSeq;
    var btns=card.actions();
    approvals[id]={res:res,btns:btns};
    btns.ok.addEventListener('click',function(){ finish(id,true); });
    btns.no.addEventListener('click',function(){ finish(id,false); });
  });
  function finish(id,v){ var a=approvals[id]; if(!a)return; delete approvals[id]; a.btns.done(); a.res(v); }
}

/* ---------------- workspace ops ---------------- */
function saveWS(){ saveJSON(LS_WS,ws); }
function listFiles(prefix){
  prefix=prefix||'';
  return Object.keys(ws).filter(function(p){ return !prefix || p===prefix || p.indexOf(prefix+'/')===0; }).sort();
}
function doList(path){
  var files=listFiles(path);
  if(!path){
    var top={};
    files.forEach(function(f){ var seg=f.split('/')[0]; top[seg]=top[seg]||[]; top[seg].push(f); });
    return {files:files,summary:Object.keys(top).length+' top-level entries, '+files.length+' files total'};
  }
  return {files:files,summary:files.length+' files under '+path};
}
function doRead(path){
  path=cleanPath(path);
  if(!path||!(path in ws)) return {ok:false,error:'File not found: '+path};
  return {ok:true,content:ws[path]};
}
function doSearch(q){
  q=String(q||'').toLowerCase();
  var hits=[];
  Object.keys(ws).forEach(function(p){
    if(p.toLowerCase().indexOf(q)>=0){ hits.push(p+' (name match)'); return; }
    var idx=ws[p].toLowerCase().indexOf(q);
    if(idx>=0) hits.push(p+' (line ~'+(ws[p].slice(0,idx).split('\n').length)+')');
  });
  return hits.slice(0,50);
}
function doWrite(path,content){
  path=cleanPath(path);
  if(!path) return {ok:false,error:'Bad path'};
  ws[path]=String(content==null?'':content);
  saveWS(); renderTree();
  return {ok:true,lines:ws[path].split('\n').length};
}
function doEdit(path,oldS,newS){
  path=cleanPath(path);
  if(!path||!(path in ws)) return {ok:false,error:'File not found: '+path};
  if(ws[path].indexOf(oldS)<0) return {ok:false,error:'"old" text not found exactly in '+path};
  ws[path]=ws[path].split(oldS).join(newS);
  saveWS(); renderTree();
  return {ok:true,lines:ws[path].split('\n').length};
}

/* ---------------- Piston exec ---------------- */
async function pistonRun(language,code,stdin){
  var lang=LANGS[String(language||'').toLowerCase().trim()];
  if(!lang) return {ok:false,error:'Unknown language "'+language+'". Try: python, javascript, typescript, bash, java, c, cpp, go, rust, ruby, php.'};
  var ctl=new AbortController();
  var t=setTimeout(function(){ ctl.abort(); },45000);
  try{
    var r=await fetch(PISTON,{method:'POST',headers:{'Content-Type':'application/json'},
      signal:ctl.signal,
      body:JSON.stringify({language:lang,version:'*',files:[{content:String(code||'')}],stdin:String(stdin||'')})});
    clearTimeout(t);
    var j=null;
    try{ j=await r.json(); }catch(e){}
    if(!r.ok || !j) return {ok:false,error:'Piston error, HTTP '+r.status+'. The exec backend is unreachable right now.'};
    if(j.message && !j.run) return {ok:false,error:'Piston: '+j.message};
    var out='';
    if(j.compile && (j.compile.stdout||j.compile.stderr)) out+='[compile]\n'+(j.compile.stdout||'')+(j.compile.stderr||'')+'\n';
    if(j.run){
      out+='[exit '+j.run.code+']\n';
      out+=(j.run.output||j.run.stdout||'')+(j.run.stderr?('\n[stderr]\n'+j.run.stderr):'');
    }
    return {ok:true,output:out.trim()||'(no output)',lang:lang};
  }catch(e){
    clearTimeout(t);
    return {ok:false,error:'Piston unreachable: '+(e&&e.name==='AbortError'?'timed out after 45s':(e&&e.message)||'network error')+'. Nothing was executed.'};
  }
}
async function customExec(payload){
  var ctl=new AbortController();
  var t=setTimeout(function(){ ctl.abort(); },45000);
  try{
    var r=await fetch(settings.exec,{method:'POST',headers:{'Content-Type':'application/json'},
      signal:ctl.signal,body:JSON.stringify(payload)});
    clearTimeout(t);
    var txt=await r.text();
    var j=null; try{ j=JSON.parse(txt); }catch(e){}
    var out=j?(j.stdout||j.output||j.stderr||JSON.stringify(j).slice(0,4000)):txt.slice(0,4000);
    return {ok:r.ok,output:String(out||'(no output)').slice(0,6000)};
  }catch(e){
    clearTimeout(t);
    return {ok:false,error:'Custom exec endpoint unreachable: '+((e&&e.message)||'network error')+'. Nothing was executed.'};
  }
}

/* ---------------- agent loop ---------------- */
async function runAgent(userText){
  if(running) return;
  running=true; $('send').disabled=true;
  if(!sessionId) newSession(userText);
  history.push({role:'user',content:userText});
  addMsg('user',userText); transcript.push({role:'user',text:userText});
  planApproved=!settings.plan;
  var typing=addMsg('agent','<span class="typing"><i></i><i></i><i></i></span>',true);
  transcript.push({role:'agent',text:''});
  try{
    var it=0, finished=false;
    while(it<MAX_ITERS && !finished){
      it++;
      var msgs=[{role:'system',content:systemPrompt()}].concat(history);
      var reply;
      try{ reply=await callModel(msgs); }
      catch(e){ typing.remove(); addSys('Model error: '+e.message); break; }
      typing.remove();
      var blocks=parseToolBlocks(reply);
      var textOnly=reply.replace(/```tool\s*\n[\s\S]*?```/g,'').trim();
      if(textOnly){ addMsg('agent',textOnly); transcript.push({role:'agent',text:textOnly}); }
      if(!blocks.length){ finished=true; break; }
      var results=[];
      for(var bi=0; bi<blocks.length; bi++){
        var b=blocks[bi];
        var res=await execOp(b);
        results.push(res.text);
        if(res.stop){ finished=true; break; }
        if(res.breakBatch) break;
      }
      history.push({role:'user',content:results.map(function(r,i){
        return '[tool_result '+(i+1)+']\n'+r; }).join('\n\n')});
      if(!finished){
        typing=addMsg('agent','<span class="typing"><i></i><i></i><i></i></span>',true);
        transcript.push({role:'agent',text:''});
      }
    }
    if(it>=MAX_ITERS) addSys('Stopped after '+MAX_ITERS+' steps. Ask me to continue.');
    saveSession();
  }finally{
    var t2=$('msgs').querySelector('.typing');
    if(t2 && t2.closest('.msg')) t2.closest('.msg').remove();
    running=false; $('send').disabled=false; renderTree();
  }
}

async function execOp(b){
  if(b.err || !b.op || !b.op.op){
    var c0=toolCard('bad','Bad tool block'); c0.setStatus('skipped','no');
    c0.addText(b.err||'Missing op'); c0.showBody();
    return {text:'Tool block rejected: '+(b.err||'missing op')+'. Emit one valid JSON object per ```tool fence.'};
  }
  var op=b.op.op, card;
  switch(op){
    case 'think':
      card=toolCard('think','Thinking'); card.setStatus('noted','ok');
      card.addText(String(b.op.text||'').slice(0,1200)); card.showBody();
      return {text:'Thinking noted.'};
    case 'plan':{
      card=toolCard('plan','Build plan'); card.showBody();
      card.addLabel('Plan'); card.addPre(String(b.op.text||'').slice(0,4000));
      if(!settings.plan){ card.setStatus('noted','ok'); planApproved=true; return {text:'Plan mode is off, continuing.'}; }
      if(planApproved){ card.setStatus('already approved','ok'); return {text:'Plan already approved, continuing.'}; }
      card.setStatus('waiting','wait');
      var ok=await waitApproval(card);
      if(ok){ card.setStatus('approved','ok'); planApproved=true; return {text:'Plan approved by user. Proceed with file operations.'}; }
      card.setStatus('rejected','no');
      return {text:'Plan rejected by user. Ask how to change it.',stop:true};
    }
    case 'list':{
      card=toolCard('list','List files'); var lr=doList(cleanPath(b.op.path||'')||'');
      card.path.textContent=b.op.path||'(root)';
      card.setStatus(lr.files.length+' files','ok'); card.showBody();
      card.addPre(lr.files.slice(0,80).join('\n')||'(empty workspace)');
      return {text:'List: '+lr.summary+'\n'+lr.files.slice(0,80).join('\n')};
    }
    case 'read':{
      card=toolCard('read','Read file'); var rr=doRead(b.op.path);
      card.path.textContent=b.op.path||'';
      if(!rr.ok){ card.setStatus('not found','no'); return {text:'Read failed: '+rr.error}; }
      card.setStatus(rr.content.split('\n').length+' lines','ok'); card.showBody();
      card.addPre(rr.content.slice(0,8000));
      return {text:'Content of '+b.op.path+':\n'+rr.content.slice(0,12000)};
    }
    case 'search':{
      card=toolCard('search','Search'); var hits=doSearch(b.op.query);
      card.path.textContent=b.op.query||'';
      card.setStatus(hits.length+' hits','ok'); card.showBody();
      card.addPre(hits.join('\n')||'(no matches)');
      return {text:'Search "'+b.op.query+'": '+(hits.join('; ')||'no matches')};
    }
    case 'write':
    case 'edit':{
      var isW=(op==='write');
      card=toolCard(op,isW?'Write file':'Edit file');
      card.path.textContent=b.op.path||'';
      card.showBody();
      var preview='';
      if(isW){
        var lines=String(b.op.content||'').split('\n');
        card.addLabel('New content ('+lines.length+' lines)');
        card.addPre(lines.slice(0,40).join('\n')+(lines.length>40?'\n... ('+(lines.length-40)+' more lines)':''));
        preview='write '+lines.length+' lines to '+b.op.path;
      }else{
        card.addLabel('Replace this'); card.addPre(String(b.op.old||'').slice(0,3000));
        card.addLabel('With this'); card.addPre(String(b.op.new||'').slice(0,3000));
        preview='edit '+b.op.path;
      }
      if(settings.plan && !planApproved){
        card.setStatus('needs plan approval','wait');
        return {text:'Blocked: the build plan is not approved yet. Ask the user to approve the plan first.',breakBatch:true};
      }
      if(!settings.auto){
        card.setStatus('waiting','wait');
        var ok2=await waitApproval(card);
        if(!ok2){ card.setStatus('rejected','no'); return {text:'User rejected the '+op+' of '+b.op.path+'. Ask what to change.'}; }
      }
      var wr=isW?doWrite(b.op.path,b.op.content):doEdit(b.op.path,b.op.old,b.op.new);
      if(!wr.ok){ card.setStatus('failed','no'); card.addText(wr.error); return {text:op+' failed: '+wr.error}; }
      card.setStatus('done, '+wr.lines+' lines','ok');
      return {text:'OK: '+preview+'. File now has '+wr.lines+' lines.'};
    }
    case 'run':{
      card=toolCard('run','Run'); card.showBody();
      if(b.op.code || b.op.language){
        card.path.textContent='piston:'+(b.op.language||'?');
        card.setStatus('running','wait');
        card.addLabel('Code'); card.addPre(String(b.op.code||'').slice(0,3000));
        var pr=await pistonRun(b.op.language,b.op.code,b.op.stdin);
        if(!pr.ok){ card.setStatus('failed','no'); card.addLabel('Error'); card.addPre(pr.error); return {text:'Run failed: '+pr.error}; }
        card.setStatus('exit ok ('+pr.lang+')','ok');
        card.addLabel('Output'); card.addPre(pr.output.slice(0,6000));
        return {text:'Run ('+pr.lang+') output:\n'+pr.output.slice(0,6000)};
      }
      if(b.op.cmd){
        card.path.textContent='shell';
        card.addLabel('Command'); card.addPre(String(b.op.cmd).slice(0,1000));
        if(!settings.exec){
          card.setStatus('needs endpoint','wait');
          card.addText('Honest note: shell commands need your own exec endpoint. Set one in settings (gear icon). Code snippets run free on Piston with the language+code form.');
          return {text:'Run skipped: no custom exec endpoint is configured, so the shell command did NOT run. Code snippets can run free via Piston using {"op":"run","language":"...","code":"..."}.'};
        }
        card.setStatus('running','wait');
        var cr=await customExec({cmd:b.op.cmd});
        if(!cr.ok){ card.setStatus('failed','no'); card.addLabel('Error'); card.addPre(cr.error||cr.output); return {text:'Custom exec failed: '+(cr.error||cr.output)}; }
        card.setStatus('done','ok'); card.addLabel('Output'); card.addPre(cr.output.slice(0,6000));
        return {text:'Shell output:\n'+cr.output.slice(0,6000)};
      }
      card.setStatus('bad op','no');
      return {text:'Run needs either {"op":"run","language":"...","code":"..."} for sandboxed execution or {"op":"run","cmd":"..."} with a custom exec endpoint.'};
    }
    case 'done':{
      card=toolCard('done','Done'); card.setStatus('complete','ok'); card.showBody();
      card.addText(String(b.op.summary||'').slice(0,2000));
      addSys('Build finished. Open Workspace to preview or export the files.');
      saveSession();
      return {text:'Done acknowledged.',stop:true};
    }
    default:{
      var cb=toolCard('bad','Unknown op'); cb.setStatus('skipped','no');
      cb.addText('Unknown op: '+op);
      return {text:'Unknown op "'+op+'". Valid ops: think, plan, list, read, search, write, edit, run, done.'};
    }
  }
}

/* ---------------- sessions ---------------- */
function newSession(firstText){
  if(sessionId) saveSession();
  sessionId='s'+Date.now();
  history=[]; transcript=[];
  $('msgs').innerHTML='';
  addSys('New codeR session. Describe what to build. Toggle Plan to approve a plan first, Auto to skip per-file approvals.');
  renderSessions();
}
function sessionTitle(){
  var u=transcript.find(function(t){return t.role==='user';});
  return (u?u.text:'Session').slice(0,60)||'Session';
}
function saveSession(){
  if(!sessionId) return;
  var i=sessions.findIndex(function(s){return s.id===sessionId;});
  var rec={id:sessionId,title:sessionTitle(),at:Date.now(),
    transcript:transcript.slice(-200),
    files:Object.keys(ws).sort()};
  if(i>=0) sessions[i]=rec; else sessions.unshift(rec);
  sessions=sessions.slice(0,50);
  saveJSON(LS_SESSIONS,sessions);
  renderSessions();
}
function renderSessions(){
  var box=$('sessList'); box.innerHTML='';
  if(!sessions.length){ box.innerHTML='<div class="ws-empty">No sessions yet.<br>Your agent runs will appear here.</div>'; return; }
  sessions.forEach(function(s){
    var b=document.createElement('button'); b.className='srow';
    var t=document.createElement('div'); t.className='st'; t.textContent=s.title;
    var m=document.createElement('div'); m.className='sm';
    m.textContent=new Date(s.at).toLocaleString()+' - '+s.transcript.length+' messages - '+s.files.length+' files';
    b.appendChild(t); b.appendChild(m);
    b.addEventListener('click',function(){ openSession(s.id); });
    box.appendChild(b);
  });
}
function openSession(id){
  var s=sessions.find(function(x){return x.id===id;});
  if(!s) return;
  var d=$('drawerSession'); d.classList.add('open');
  var body=$('sessView'); body.innerHTML='';
  var h=document.createElement('h3'); h.style.margin='0 0 4px'; h.textContent=s.title;
  body.appendChild(h);
  var snap=document.createElement('div'); snap.className='snap';
  snap.textContent='Workspace snapshot at save: '+s.files.length+' files'+(s.files.length?': '+s.files.join(', '):'');
  body.appendChild(snap);
  s.transcript.forEach(function(t){
    var div=document.createElement('div');
    div.className='msg '+(t.role==='user'?'user':(t.role==='sys'?'sys':'agent'));
    div.style.marginBottom='8px'; div.style.alignSelf='stretch';
    div.innerHTML=renderMiniMd(t.text||'');
    body.appendChild(div);
  });
}

/* ---------------- workspace drawer ---------------- */
function openDrawer(id){ $(id).classList.add('open'); }
function closeDrawer(el){ el.closest('.drawer').classList.remove('open'); }

function renderTree(){
  var box=$('fileTree'); box.innerHTML='';
  var files=Object.keys(ws).sort();
  if(!files.length){
    box.innerHTML='<div class="ws-empty">Workspace is empty.<br>Ask the agent to build something,<br>or tap New file to start by hand.</div>';
    return;
  }
  var groups={};
  files.forEach(function(f){
    var seg=f.indexOf('/')>=0?f.slice(0,f.indexOf('/')):'(root)';
    (groups[seg]=groups[seg]||[]).push(f);
  });
  Object.keys(groups).sort().forEach(function(g){
    if(g!=='(root)'){
      var dh=document.createElement('div'); dh.className='fdir'; dh.textContent=g+'/'; box.appendChild(dh);
    }
    groups[g].forEach(function(f){
      var b=document.createElement('div'); b.style.display='flex'; b.style.alignItems='center';
      var r=document.createElement('button'); r.className='frow'+(f===currentFile?' sel':'');
      var nm=document.createElement('span'); nm.className='fn'; nm.textContent=f;
      r.appendChild(nm);
      r.addEventListener('click',function(){ openFile(f); });
      var del=document.createElement('button'); del.className='fdel'; del.textContent='x'; del.setAttribute('aria-label','Delete '+f);
      del.addEventListener('click',function(ev){ ev.stopPropagation();
        if(confirm('Delete '+f+'?')){ delete ws[f]; if(currentFile===f)currentFile=null; saveWS(); renderTree(); }
      });
      b.appendChild(r); b.appendChild(del); box.appendChild(b);
    });
  });
  syncPreviewSelect();
}
function openFile(f){
  currentFile=f;
  $('editorName').textContent=f;
  $('editor').value=ws[f]||'';
  wsTab('edit');
  renderTree();
}
function newFile(){
  var n=prompt('New file path (e.g. index.html or css/app.css):');
  if(!n) return;
  n=cleanPath(n);
  if(!n){ alert('Bad path'); return; }
  if(!(n in ws)) ws[n]='';
  saveWS(); openFile(n);
}
function saveEditor(){
  if(!currentFile) return;
  ws[currentFile]=$('editor').value; saveWS();
  addSys('Saved '+currentFile+' ('+$('editor').value.split('\n').length+' lines).');
}
function wsTab(which){
  ['tree','edit','preview'].forEach(function(t){
    $('wsTab'+t[0].toUpperCase()+t.slice(1)).classList.toggle('on',t===which);
    $('wsPane'+t[0].toUpperCase()+t.slice(1)).style.display=t===which?'block':'none';
  });
  if(which==='preview') updatePreview();
}
function syncPreviewSelect(){
  var sel=$('previewFile'); var cur=sel.value;
  sel.innerHTML='';
  var files=Object.keys(ws).sort();
  files.forEach(function(f){
    var o=document.createElement('option'); o.value=f; o.textContent=f; sel.appendChild(o);
  });
  if(files.indexOf('index.html')>=0) sel.value='index.html';
  else if(files.indexOf(cur)>=0) sel.value=cur;
}
function updatePreview(){
  var f=$('previewFile').value;
  var frame=$('previewFrame');
  var note=$('previewNote');
  if(!f||!(f in ws)){ frame.removeAttribute('src'); note.textContent='No file selected.'; return; }
  var blob=new Blob([ws[f]],{type:'text/html'});
  var url=URL.createObjectURL(blob);
  frame.src=url;
  note.textContent='Previewing '+f+' (sandboxed). Relative file links will not load in preview, use Export to run the full site.';
  frame.onload=function(){ setTimeout(function(){ URL.revokeObjectURL(url); },5000); };
}
function download(name,content,mime){
  var blob=new Blob([content],{type:mime||'text/plain'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=name;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },2000);
}
function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
async function exportAll(){
  var files=Object.keys(ws).sort();
  if(!files.length){ alert('Workspace is empty.'); return; }
  addSys('Exporting '+files.length+' files, one download per file.');
  for(var i=0;i<files.length;i++){
    download(files[i].split('/').pop(),ws[files[i]]);
    await sleep(400);
  }
}

/* ---------------- settings ---------------- */
function openSettings(){
  $('setMode').value=settings.mode;
  $('setBase').value=settings.base;
  $('setKey').value=settings.key;
  $('setModel').value=settings.model;
  $('setExec').value=settings.exec;
  $('customBox').style.display=settings.mode==='custom'?'block':'none';
  $('modalSettings').classList.add('open');
}
function closeSettings(){ $('modalSettings').classList.remove('open'); }
function applyPreset(name){
  var p=PRESETS[name]; if(!p) return;
  $('setMode').value='custom';
  $('setBase').value=p.base; $('setModel').value=p.model;
  $('customBox').style.display='block';
}
function saveSettings(){
  settings.mode=$('setMode').value;
  settings.base=$('setBase').value.trim();
  settings.key=$('setKey').value.trim();
  settings.model=$('setModel').value.trim();
  settings.exec=$('setExec').value.trim();
  saveJSON(LS_SETTINGS,settings);
  closeSettings(); refreshChrome();
  addSys('Model: '+modelLabel()+(settings.exec?' - custom exec endpoint set':' - run uses free Piston sandbox')+'.');
}

/* ---------------- chrome ---------------- */
function refreshChrome(){
  $('modelBtn').textContent=modelLabel();
  $('chipPlan').classList.toggle('on',!!settings.plan);
  $('chipAuto').classList.toggle('on',!!settings.auto);
}

/* ---------------- init ---------------- */
/* Same theme as the main app: it stores {theme:'black'|'white', accent:'#hex'}
   in localStorage under axo.local.v1.state. codeR reads it and mirrors it,
   so the theme the user picked in Gptopen applies here too. */
function applyAppTheme(){
  var theme='black', accent='';
  try{
    var st=JSON.parse(window.localStorage.getItem('axo.local.v1.state')||'null');
    if(st){ if(st.theme==='white'||st.theme==='black') theme=st.theme; if(st.accent) accent=String(st.accent); }
  }catch(e){}
  document.documentElement.setAttribute('data-theme', theme);
  if(accent){
    document.documentElement.style.setProperty('--accent', accent);
    var hex=accent.replace('#','');
    var r=parseInt(hex.substr(0,2),16), g=parseInt(hex.substr(2,2),16), b=parseInt(hex.substr(4,2),16);
    var lum=(0.2126*r+0.7152*g+0.0722*b)/255;
    document.documentElement.style.setProperty('--accent-ink', lum>0.6 ? '#0b0b0c' : '#ffffff');
  }
}
function init(){
  applyAppTheme();
  /* theme changed in the main app while codeR is open: follow it live */
  window.addEventListener('storage', function(e){ if(e.key==='axo.local.v1.state') applyAppTheme(); });
  refreshChrome(); renderTree(); renderSessions();
  newSession();

  $('send').addEventListener('click',sendPrompt);
  $('prompt').addEventListener('keydown',function(e){
    if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendPrompt(); }
  });
  $('prompt').addEventListener('input',function(){
    this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,130)+'px';
  });

  $('chipPlan').addEventListener('click',function(){
    settings.plan=!settings.plan; saveJSON(LS_SETTINGS,settings); refreshChrome();
    addSys('Plan mode '+(settings.plan?'ON: the agent shows a plan for approval before touching files.':'OFF.'));
  });
  $('chipAuto').addEventListener('click',function(){
    settings.auto=!settings.auto; saveJSON(LS_SETTINGS,settings); refreshChrome();
    addSys('Auto mode '+(settings.auto?'ON: file writes apply without asking.':'OFF: each write or edit needs your approval.'));
  });

  $('btnWs').addEventListener('click',function(){ renderTree(); wsTab('tree'); openDrawer('drawerWs'); });
  $('btnPreview').addEventListener('click',function(){ syncPreviewSelect(); wsTab('preview'); openDrawer('drawerWs'); });
  $('btnSessions').addEventListener('click',function(){ renderSessions(); openDrawer('drawerSessions'); });
  $('btnNewSession').addEventListener('click',function(){ saveSession(); newSession(); });

  document.querySelectorAll('[data-close]').forEach(function(b){
    b.addEventListener('click',function(){ closeDrawer(b); });
  });
  document.querySelectorAll('.drawer .scrim').forEach(function(s){
    s.addEventListener('click',function(){ s.closest('.drawer').classList.remove('open'); });
  });

  $('wsTabTree').addEventListener('click',function(){ wsTab('tree'); });
  $('wsTabEdit').addEventListener('click',function(){ wsTab('edit'); });
  $('wsTabPreview').addEventListener('click',function(){ wsTab('preview'); });
  $('btnNewFile').addEventListener('click',newFile);
  $('btnSaveFile').addEventListener('click',saveEditor);
  $('btnCopyFile').addEventListener('click',function(){
    if(!currentFile)return;
    navigator.clipboard.writeText($('editor').value).then(function(){ addSys('Copied '+currentFile+'.'); });
  });
  $('btnDlFile').addEventListener('click',function(){
    if(!currentFile)return;
    download(currentFile.split('/').pop(),$('editor').value);
  });
  $('btnExportAll').addEventListener('click',exportAll);
  $('previewFile').addEventListener('change',updatePreview);

  $('modelBtn').addEventListener('click',openSettings);
  $('gearBtn').addEventListener('click',openSettings);
  $('setClose').addEventListener('click',closeSettings);
  $('setSave').addEventListener('click',saveSettings);
  $('setMode').addEventListener('change',function(){
    $('customBox').style.display=this.value==='custom'?'block':'none';
  });
  document.querySelectorAll('[data-preset]').forEach(function(b){
    b.addEventListener('click',function(){ applyPreset(b.getAttribute('data-preset')); });
  });
}
function sendPrompt(){
  var v=$('prompt').value.trim();
  if(!v||running) return;
  $('prompt').value=''; $('prompt').style.height='auto';
  runAgent(v);
}
document.addEventListener('DOMContentLoaded',init);
})();
