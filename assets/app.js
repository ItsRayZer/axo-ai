
/* =============== Rendering: messages =============== */
/* ---- Sent attachments & link previews inside a message ---- */
function escA(s){ return esc(s).replace(/"/g,'&quot;'); }
function fmtSize(n){
  if(n==null||isNaN(n)) return '';
  if(n<1024) return n+' B';
  if(n<1048576) return (n/1024).toFixed(1).replace(/\.0$/,'')+' KB';
  if(n<1073741824) return (n/1048576).toFixed(1).replace(/\.0$/,'')+' MB';
  return (n/1073741824).toFixed(2)+' GB';
}
function linkCardHTML(e){
  var inner='';
  if(e.image) inner+='<img class="lp-img" src="'+escA(e.image)+'" alt="" loading="lazy" onerror="this.remove()">';
  inner+='<div class="lp-body">'
    +(e.title? '<div class="lp-title">'+esc(e.title)+'</div>' : '')
    +(e.desc? '<div class="lp-desc">'+esc(e.desc)+'</div>' : '')
    +'<div class="lp-dom">'+(e.favicon? '<img src="'+escA(e.favicon)+'" alt="" onerror="this.remove()">' : '')+'<span>'+esc(e.domain||e.url)+'</span></div></div>';
  return '<a class="lp-card" href="'+escA(e.url)+'" target="_blank" rel="noopener noreferrer">'+inner+'</a>';
}
function msgAttHTML(m){
  var h='';
  if(m.links && m.links.length) h+=m.links.map(linkCardHTML).join('');
  if(m.attachments && m.attachments.length){
    var media='', files='';
    m.attachments.forEach(function(a){
      if(typeof a==='string'){ files+='<div class="msg-file">'+I.folder+'<span class="fmeta"><span class="fname">'+esc(a)+'</span></span></div>'; return; }
      if(a.kind==='image' && a.url) media+='<img class="mimg" src="'+escA(a.url)+'" alt="'+escA(a.name||'Image')+'">';
      else if(a.kind==='video' && a.url) media+='<video class="mvid" src="'+escA(a.url)+'" controls playsinline preload="metadata"></video>';
      else files+='<div class="msg-file">'+(a.kind==='video'?I.video:(a.kind==='image'?I.image:I.file))+'<span class="fmeta"><span class="fname">'+esc(a.name||'File')+'</span>'+(a.size!=null?'<span class="fsz"> '+esc(fmtSize(a.size))+'</span>':'')+'</span></div>';
    });
    if(media) h+='<div class="msg-media">'+media+'</div>';
    if(files) h+='<div class="msg-files">'+files+'</div>';
  }
  return h;
}
function canvasFeatureItems(m){
  var body=(m && m.code && m.code.body) || '';
  var controls=(body.match(/<(button|input|select|textarea)\b/gi)||[]).length;
  var hasScript=/<script\b/i.test(body);
  var items=['<li><strong>Single-file build:</strong> one HTML file, no setup — it opens anywhere.</li>'];
  if(controls && hasScript) items.push('<li><strong>Working interaction:</strong> '+controls+' interactive control'+(controls===1?'':'s')+' wired to JavaScript in the file.</li>');
  else if(hasScript) items.push('<li><strong>Working interaction:</strong> JavaScript behaviour is included in the file.</li>');
  else items.push('<li><strong>Finished layout:</strong> the complete content and styling are included in the file.</li>');
  if(/@media\b|name=["']viewport["']/i.test(body)) items.push('<li><strong>Responsive layout:</strong> viewport / media-query rules are included for phone and desktop widths.</li>');
  else items.push('<li><strong>Responsive layout:</strong> the layout is contained in one flexible HTML file.</li>');
  if(/--[\w-]+\s*:|prefers-color-scheme/i.test(body)) items.push('<li><strong>Theme system:</strong> reusable CSS theme values are built into the file.</li>');
  else items.push('<li><strong>Clean UI:</strong> the generated styling is self-contained in the same file.</li>');
  return items.join('');
}
function msgHTML(m, chatId){
  var cid=chatId||state.currentId;
  var quote=m.replyToText? '<div class="reply-quote">'+esc(m.replyToText)+'</div>' : '';
  var att=msgAttHTML(m);
  if(m.role==='user'){ return '<div class="msg user" data-msg-id="'+m.id+'" data-chat-id="'+cid+'" tabindex="0" role="button" aria-label="Your message — open message menu">'+quote+att+(m.text?'<div class="bubble-user">'+esc(m.text)+'</div>':'')+(m.reaction?'<span class="msg-reaction" aria-label="AI reaction">'+esc(m.reaction)+'</span>':'')+(m.liked?'<span class="msg-like" aria-label="You liked this message">'+LIKE_HEART+'</span>':'')+'</div>'; }
  var h='<div class="msg ai" data-msg-id="'+m.id+'" data-chat-id="'+cid+'" tabindex="0" role="button" aria-label="Assistant message — open message menu">'+quote+att+'<div class="body">'+esc(m.text)+'</div>';
  if(m.canvas){
    var cvDone=m.canvas.status==='done';
    h+='<div class="canvas-building">Building the application...</div>';
    h+='<div class="canvas-card'+(cvDone?'':' writing')+'">'
      +'<div class="canvas-top"><span class="canvas-ico">'+I.code+'</span>'
      +'<span class="canvas-meta"><span class="canvas-title">'+esc(m.canvas.title)+'</span>'
      +'<span class="canvas-status">'+(cvDone? esc(fmtCanvasTs(m.canvas.ts)) : 'Writing code...')+'</span></span></div>'
      +(cvDone? '<div class="canvas-open-row"><button type="button" class="canvas-open" data-act="canvasopen" data-id="'+m.id+'">Open</button></div>' : '')
      +'</div>';
    if(cvDone){
      h+='<div class="canvas-summary">I have generated the single-file <strong>'+esc(m.canvas.title)+'</strong> app. It runs as one HTML file — tap Open on the card, or Play on the code below, to run it here.</div>'
        +'<div class="canvas-features"><h4>Key Features Included:</h4><ul>'
        + canvasFeatureItems(m)
        +'</ul></div>';
    }
  }
  if(m.avatarProposal){
    var pr=m.avatarProposal;
    var prObj={shape:pr.shape, face:pr.face, color:pr.color, acc:pr.acc};
    h+='<div class="avpro-card"><div class="avpro-prev">'+customAvatarSVGFor(prObj,'idle')+'</div>'
      +'<div class="avpro-name">'+esc(pr.shape)+' · '+esc(pr.face)+'</div>'
      +'<div class="avpro-emotes">'+['idle','typing','dancing','sleeping','angry','sad'].map(function(em){ return '<span title="'+em+'">'+customAvatarSVGFor(prObj,em)+'</span>'; }).join('')+'</div>'
      +'<div class="avpro-emotes-lbl">Emotes created automatically for this avatar</div>'
      +(pr.resolved==='confirmed'
        ? '<div class="avpro-done">Saved as the new avatar</div>'
        : pr.resolved==='cancelled'
        ? '<div class="avpro-done">Not used — describe another one any time</div>'
        : '<div class="avpro-btns"><button type="button" class="btn-primary" data-act="avconfirm" data-id="'+m.id+'">Use this avatar</button><button type="button" class="btn-ghost" data-act="avcancel" data-id="'+m.id+'">Not yet</button></div>')
      +'</div>';
  }
  if(m.code){
    h+='<div class="codeblock"><div class="codeblock-head"><span>'+esc(m.code.lang||'code')+'</span><span class="sp"></span>'
      +'<button data-act="play" data-id="'+m.id+'">'+I.play+'Play</button>'
      +'<button data-act="copy" data-id="'+m.id+'">'+I.copy+'Copy</button></div>'
      +'<pre>'+esc(m.code.body)+'</pre></div>';
  }
  if(m.reaction) h+='<span class="msg-reaction" aria-label="Your reaction">'+esc(m.reaction)+'</span>';
  h+='<div class="msg-actions"><button data-act="copyai" data-id="'+m.id+'" aria-label="Copy reply">'+I.copy+'</button></div>'+(m.liked?'<span class="msg-like" aria-label="You liked this message">'+LIKE_HEART+'</span>':'')+'</div>';
  return h;
}
function findMsg(chat,id){ if(!chat) return null; for(var i=0;i<chat.messages.length;i++) if(chat.messages[i].id===id) return chat.messages[i]; return null; }
var lastMainChatId=null;
function renderMain(){
  var c=currentChat(), w=$('#msgWrap'), sc=$('#chatScroll');
  /* Scroll preservation: a re-render must never yank the reader.
     Switching chats lands at the latest message; re-rendering the
     SAME chat keeps the exact scroll offset, and only follows new
     messages when the reader was already near the bottom. This is
     what makes scrolling UP and DOWN stay put in both directions. */
  var switched = lastMainChatId!==c.id; lastMainChatId=c.id;
  var oldTop=sc.scrollTop, oldH=sc.scrollHeight;
  var nearBottom = oldH - oldTop - sc.clientHeight < 140;
  /* The agent head — circular avatar with the agent name label below
     it, as in the Appearance preview — shows in chat. No heading, no
     subtitle, no suggestion cards; the head and the composer only. */
  if(agentEmotion==='typing'){
    var lm0=c.messages[c.messages.length-1];
    if(lm0 && lm0.role==='ai' && !(lm0.canvas && lm0.canvas.state==='building')){
      var hh=new Date().getHours();
      agentEmotion=pendingEmotion||((hh>=23||hh<5)?'sleeping':'idle'); pendingEmotion=null;
    }
  }
  /* Agent head — shown as soon as the API is ADDED (a complete setup
     saved: key + provider, plus a base URL for a custom endpoint): a
     large circular agent avatar at the top centre of the chat, in the
     Axo UI, with the agent name label pill below it, exactly like the
     reference. It is deliberately NOT gated on the last reply's
     health: on mobile a single failed, CORS-blocked or quota reply
     flips apiHealth to error/quota, and gating on that made the
     avatar vanish even though the API was set — the "avatar not
     showing in mobile" bug. The top API pill still alerts on its own
     rules (not set / not working / quota / changed); the head only
     stays out before any complete setup is saved, or when the
     Appearance avatar size is Hidden. */
  /* The agent head is NOT part of the scrolling messages any more:
     it is pinned in #agentHeadBar above the chat (renderAgentHead),
     so it stays at the top and never scrolls down with messages. */
  renderAgentHead();
  /* Fast path: if nothing about this chat's messages changed
     (same ids, text, reactions, likes, canvas states), skip the
     full innerHTML rebuild entirely — re-renders triggered by
     unrelated state (API health, emotion, settings) stay free. */
  var sig=msgSig(c);
  if(sig!==lastMsgSig || switched){
    lastMsgSig=sig;
    w.innerHTML=c.messages.map(function(m){ return msgHTML(m, c.id); }).join('');
    if(switched || nearBottom) sc.scrollTop=sc.scrollHeight;
    else sc.scrollTop=Math.min(oldTop, Math.max(0, sc.scrollHeight - sc.clientHeight));
  }
}
function hashStr(s){ var h=0; for(var i=0;i<s.length;i++){ h=(h*31 + s.charCodeAt(i))|0; } return h; }
function msgSig(c){
  var s=c.id+'#'+c.messages.length;
  for(var i=0;i<c.messages.length;i++){
    var m=c.messages[i];
    s+='|'+m.id+':'+(m.text? m.text.length+':'+hashStr(m.text) : '0')+':'+(m.reaction||'')+(m.liked?'L':'')+(m.canvas? m.canvas.status : '')+(m.code? m.code.body.length : '')+(m.avatarProposal? (m.avatarProposal.resolved||'o') : '');
  }
  return s;
}
var lastMsgSig='';
var headSwapInDir=0;
function renderAgentHead(){
  var bar=$('#agentHeadBar'); if(!bar) return;
  var show = state.view==='chat' && !state.splitId && state.avatarSize!=='hidden' && !apiIncomplete();
  bar.innerHTML = show? chatAgentHeadHTML() : '';
  bar.style.display = show? 'flex' : 'none';
  /* Agent switch animation — ONLY after a left / right swipe on the
     top agent (switchTopAgent is the one place that sets
     headSwapInDir, and only the swipe handler calls it): the new
     agent's circle looms in from the side the swipe pointed to,
     sliding across and growing to full size as it lands. Renders
     for any other reason — first load, a menu switch, a re-render —
     never set the flag, so the head simply appears, unmoving. A
     flag left over while the head is hidden is dropped, never
     replayed later. */
  if(!show){ headSwapInDir=0; return; }
  if(headSwapInDir){
    var h=bar.querySelector('.chat-agent-head'), d=headSwapInDir; headSwapInDir=0;
    if(h && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      h.style.transition='none';
      h.style.transform='translateX('+(d*170)+'px) scale(.55)';
      h.style.opacity='0';
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        h.style.transition='transform .34s cubic-bezier(.32,.72,0,1), opacity .3s ease';
        h.style.transform=''; h.style.opacity='';
      }); });
    }
  }
}
/* Which chats the current chat agent sees: shared chats for every
   agent by default; an agent with individual history turned on sees
   only its own chats instead. */
function chatVisibleForAgent(c){
  var a=(typeof chatAgent==='function')? chatAgent() : null;
  if(a && a.individualHistory) return c.agentId===a.id;
  return !c.agentId;
}
function renderSplit(){
  var on=!!state.splitId && !!chatById(state.splitId);
  $('#splitBar').classList.toggle('show',on);
  $('#splitWrap').classList.toggle('show',on);
  if(state.view==='chat') $('#chatScroll').style.display=on?'none':'';
  updateTargetLine();
  if(!on) return;
  /* Capture pane scroll BEFORE replacing content (same preservation
     rule as the main list: keep the offset, follow new messages only
     when that pane was already near its bottom). */
  var ptEl=$('#paneTop .pane-scroll'), pbEl=$('#paneBottom .pane-scroll');
  function cap(p){ return { top:p.scrollTop, near:p.scrollHeight - p.scrollTop - p.clientHeight < 140 }; }
  var capT=cap(ptEl), capB=cap(pbEl);
  var topId=state.splitSwapped?state.splitId:state.currentId;
  var botId=state.splitSwapped?state.currentId:state.splitId;
  var tc=chatById(topId), bc=chatById(botId);
  $('#paneTopTitle').textContent=tc?tc.title:'';
  $('#paneBottomTitle').textContent=bc?bc.title:'';
  $('#paneTopMsgs').innerHTML=tc?tc.messages.map(function(m){ return msgHTML(m, tc.id); }).join(''):'';
  $('#paneBottomMsgs').innerHTML=bc?bc.messages.map(function(m){ return msgHTML(m, bc.id); }).join(''):'';
  $('#paneTop').classList.toggle('active',state.splitActive==='top');
  $('#paneBottom').classList.toggle('active',state.splitActive==='bottom');
  ptEl.scrollTop = capT.near ? ptEl.scrollHeight : capT.top;
  pbEl.scrollTop = capB.near ? pbEl.scrollHeight : capB.top;
}
function renderAll(){ if(typeof fireScheduled==='function') fireScheduled(); renderMain(); renderSplit(); renderSidebar(); updateTempIcon(); updPlaceholder(); if(typeof renderAgentHead==='function') renderAgentHead(); }
/* Icon state, applied to the chat header pill button and the
   sidebar header button beside "Gptopen" (#sbNewTop):
   temporary-chat icon before the first message, New chat
   (compose) icon once the current chat has messages.
   Exception: the side menu BOTTOM compose button (#sbNewIc) always
   shows the New chat (compose) symbol, never the temporary symbol.
   The header pill button's JOB follows its icon: while it shows the
   Temporary chat icon (empty chat) it is the Temporary chat toggle;
   once it shows the New chat icon (chat has started) clicking it
   starts a NEW CHAT — it must never turn Temporary chat on in that
   state. Temporary chat only ever turns on from its own toggle:
   this button while it shows the Temporary icon, or the "Temporary
   chat" row in the dots menu. The two sidebar buttons always start
   a new chat, whatever icon they are showing. */
function updateTempIcon(){
  var c=currentChat(); if(!c) return;
  var started=c.messages.length>0;
  var name=started?'compose':'temp';
  var want=started?I.compose:I.temp;
  ['#tempBtn'].forEach(function(sel){
    var b=$(sel); if(!b) return;
    if(b.getAttribute('data-ic')!==name){
      b.innerHTML=want; b.setAttribute('data-ic', name);
    }
  });
  /* The side menu BOTTOM compose button (#sbNewIc) always shows the
     New chat (compose) symbol — never the temporary chat symbol —
     icon only, and its job is unchanged (always starts a new chat). */
  var nc=$('#sbNewIc');
  if(nc && nc.getAttribute('data-ic')!=='compose'){
    nc.innerHTML=I.compose; nc.setAttribute('data-ic','compose');
  }
  var tb=$('#tempBtn');
  if(tb){
    tb.setAttribute('data-mode', started?'new':'temp');
    tb.setAttribute('aria-label', started?'New chat':'Temporary chat');
    tb.classList.toggle('temp-on', !!state.temp && !started);
  }
}
function updateTargetLine(){
  var t=$('#targetLine');
  if(state.splitId){ var c=activeTargetChat(); t.innerHTML='Sending to <b>'+esc(c?c.title:'')+'</b> — tap a pane to switch'; t.classList.add('show'); }
  else if(state.route){ t.innerHTML='Next message: <b>'+esc(state.route)+' mode</b>'; t.classList.add('show'); }
  else if(state.temp){ t.innerHTML='<b>Temporary chat on</b> — this main chat is not saved to history'; t.classList.add('show'); }
  else t.classList.remove('show');
}
/* =============== Sidebar =============== */
var lastSbSig='';
function sbSig(q){
  var s=q+'#'+state.currentId+'#'+(state.splitId||'')+'#'+(state.showArchived?1:0)+'#'+chatAgentId;
  for(var i=0;i<chats.length;i++) s+='|'+chats[i].id+':'+chats[i].title+':'+(chats[i].agentId||'');
  return s;
}
function renderSidebar(){
  syncSidebarAgent();
  var q=($('#sbSearch').value||'').toLowerCase();
  /* Fast path: unchanged chats/selection/search → no list rebuild. */
  var sig=sbSig(q);
  if(sig===lastSbSig) return;
  lastSbSig=sig;
  var list=$('#sbList'), html='';
  /* Preserve the chats-list scroll offset across rebuilds — rebuilding
     the rows used to reset it to the top, which read as "chats list
     won't stay scrolled / jumps back" in both directions. */
  var sbScrollEl=list.closest('.sb-scroll');
  var keepTop=sbScrollEl?sbScrollEl.scrollTop:0;
  var lbl=$('#sbChatsLabel'); if(lbl) lbl.textContent=state.showArchived?'Archived chats':'Side chats';
  var ab=$('#sbArchive'); if(ab) ab.classList.toggle('on', !!state.showArchived);
  if(state.showArchived){
    list.innerHTML='<div class="sb-empty">No archived chats</div>';
    if(sbScrollEl) sbScrollEl.scrollTop=keepTop;
    return;
  }
  chats.forEach(function(c, idx){
    /* The Main chat is universal and separate — it lives only on its
       Main chat tab and never appears as a side chat row. */
    if(c.main) return;
    if(!chatVisibleForAgent(c)) return;
    if(q && c.title.toLowerCase().indexOf(q)<0) return;
    var sel=c.id===state.currentId, sp=state.splitId===c.id;
    /* Original blue dot: first row only, and only when it is not selected. */
    var dot=(idx===0 && !sel && !sp);
    html+='<div class="chat-row'+(sel?' sel':'')+(sp?' splitp':'')+'" data-id="'+c.id+'">'
      +'<div class="chat-row-under"><span class="u-open">Open</span><span class="u-del">Delete</span></div>'
      +'<div class="chat-row-main" role="button" tabindex="0" aria-label="'+esc(c.title)+'"><span class="chat-row-title">'+esc(c.title)+'</span>'
      +(sp?'<span class="split-badge">Split</span>':'')
      +(dot?'<span class="row-dot"></span>':'')
      +'<button class="row-menu-btn" data-menu="'+c.id+'" aria-label="Chat options">'+I.dotsH+'</button></div></div>';
  });
  list.innerHTML=html || '<div class="sb-empty">No matching chats</div>';
  if(sbScrollEl) sbScrollEl.scrollTop=keepTop;
}
var app=$('#app'), sidebar=$('#sidebar'), stage=$('#stage'), scrim=$('#scrim');
function sbWidth(){ return Math.min(312, window.innerWidth-66); }
function sbOpen(){ return app.classList.contains('sb-open'); }
/* =============== API pill — alert only, never permanent ===============
   The pill at the top of the chat shows ONLY when the API needs
   attention: no key set, the provider is not working (a message just
   failed), or the quota / rate limit was reached. The moment a key
   has been added the pill is removed — adding (or changing) a key
   never brings it back; it only returns if a send actually fails.
   While a key is set, the pill is hidden, the header stays clean,
   and the centred agent avatar (below) is shown instead. Changing
   the model/key lives in the + sheet Model section and in Settings →
   APIs & Providers; both call setApiHealth / updateApiPill. */
function apiIncomplete(){ return !apiEntries().length; }
function apiWorking(){ return apiEntries().length>0 && state.apiHealth==='ok'; }
function updateApiPill(){
  var pill=$('#modelPill'); if(!pill) return;
  var txt=$('#modelPillText');
  var h=state.apiHealth||'unset';
  var show = apiIncomplete() || h==='error' || h==='quota';
  pill.hidden=!show;
  pill.classList.toggle('warn', h==='error'||h==='quota');
  pill.classList.toggle('on', !!state.apiKey && h==='ok');
  if(txt){
    if(h==='quota') txt.textContent='API quota reached';
    else if(h==='error') txt.textContent='API not working';
    else txt.textContent='+ API / Model';
  }
  if(show) pill.removeAttribute('tabindex'); else pill.setAttribute('tabindex','-1');
}
function setApiHealth(h, detail){ state.apiHealth=h; state.apiDetail=detail||''; updateApiPill(); /* Keep the chat in sync the moment the setup changes (key saved / removed / reply health): re-render so the agent head appears or clears right away instead of waiting for the next unrelated render. */ if(typeof renderMain==='function' && state.view==='chat'){ try{ renderMain(); }catch(e){} } }
function apiFailureKind(status, payload){
  var t=''; try{ t=(typeof payload==='string'?payload:JSON.stringify(payload||'')).toLowerCase(); }catch(e){}
  if(status===429 || t.indexOf('quota')>=0 || t.indexOf('rate limit')>=0 || t.indexOf('rate_limit')>=0 || t.indexOf('insufficient')>=0 || t.indexOf('resource_exhausted')>=0 || t.indexOf('billing')>=0) return 'quota';
  return 'error';
}
/* After a Save in the + sheet or Settings: no key → show the pill;
   a first working save → hide it; changing key/provider/base/model
   on an already-working setup → show it as "check API" until the
   next reply proves the new setup works. */
function apiSaved(prev, pastedKey){
  if(!state.apiKey || apiIncomplete()){ setApiHealth('unset'); return; }
  var changed = prev && prev.k && (prev.p!==state.provider || prev.b!==state.providerBase || prev.m!==state.model || (!!pastedKey && pastedKey!==prev.k));
  setApiHealth(changed?'changed':'ok');
  if(typeof renderMain==='function' && state.view==='chat') renderMain();
}
/* =============== APIs — paste a key, everything else automatic ===============
   The user only ever pastes a key. The provider, base URL and model
   are detected from the key itself and confirmed against the
   provider's own model list where it offers one. Any number of keys
   can be added; sending tries the active key first with its model,
   then every other model on that key, then the next key and every
   model on it, and only reports an error when every model on every
   key has failed. state.apiKey / provider / providerBase / model stay
   synced to the active entry for the rest of the app (top pill,
   agent head, usage page). */
var API_PROVIDERS={
  gemini:{name:'Google Gemini', type:'gemini', base:'https://generativelanguage.googleapis.com/v1beta', defModel:'gemini-2.5-flash'},
  openrouter:{name:'OpenRouter', type:'openai', base:'https://openrouter.ai/api/v1', defModel:'anthropic/claude-sonnet-4.5'},
  openai:{name:'OpenAI', type:'openai', base:'https://api.openai.com/v1', defModel:'gpt-4o-mini'},
  anthropic:{name:'Anthropic', type:'anthropic', base:'https://api.anthropic.com/v1', defModel:'claude-sonnet-4-5'},
  groq:{name:'Groq', type:'openai', base:'https://api.groq.com/openai/v1', defModel:'llama-3.3-70b-versatile'},
  xai:{name:'xAI', type:'openai', base:'https://api.x.ai/v1', defModel:'grok-4'},
  deepseek:{name:'DeepSeek', type:'openai', base:'https://api.deepseek.com/v1', defModel:'deepseek-chat'},
  nvidia:{name:'NVIDIA', type:'openai', base:'https://integrate.api.nvidia.com/v1', defModel:'meta/llama-3.3-70b-instruct'},
  mistral:{name:'Mistral', type:'openai', base:'https://api.mistral.ai/v1', defModel:'mistral-large-latest'},
  together:{name:'Together', type:'openai', base:'https://api.together.xyz/v1', defModel:'meta-llama/Llama-3.3-70B-Instruct-Turbo'}
};
function apiEntries(){ return (state.apiKeys||[]).filter(function(e){ return !!(e && e.key); }); }
function apiEntryById(id){ var l=apiEntries(); for(var i=0;i<l.length;i++) if(l[i].id===id) return l[i]; return null; }
function activeApiEntry(){ return apiEntryById(state.activeApiId) || apiEntries()[0] || null; }
function syncLegacyApi(){
  var e=activeApiEntry();
  if(!e){ state.apiKey=''; state.provider=''; state.providerBase=''; state.model=''; return; }
  state.apiKey=e.key; state.model=e.model||'';
  if(e.provider==='gemini'){ state.provider='gemini'; state.providerBase=''; }
  else if(e.provider==='openrouter'){ state.provider='openrouter'; state.providerBase=''; }
  else if(e.provider){ state.provider='custom'; state.providerBase=e.base||''; }
  else { state.provider=''; state.providerBase=''; }
}
function apiEntryLabel(e){ if(!e) return 'Not set'; if(!e.provider) return e.status==='unknown'? 'Unrecognised key' : 'Detecting…'; var p=API_PROVIDERS[e.provider]; return (p? p.name : 'API')+(e.model? ' · '+e.model : ''); }
function apiKeyMask(e){ return '•••• •••• '+String((e&&e.key)||'').slice(-4); }
function apiDetectProviderLocal(key){
  /* LOCAL detection only: the key's own prefix / format names its
     provider, with no network call. A key is only ever sent to
     that one provider's own API (its model list, then chat) —
     never probed against another provider's endpoint. A format
     no rule recognises detects as '' and the key is not sent
     anywhere at all. */
  var k=String(key||'');
  if(/^AIza/.test(k)) return 'gemini';
  if(/^sk-or-/.test(k)) return 'openrouter';
  if(/^sk-ant-/.test(k)) return 'anthropic';
  if(/^gsk_/.test(k)) return 'groq';
  if(/^xai-/.test(k)) return 'xai';
  if(/^nvapi-/.test(k)) return 'nvidia';
  if(/^sk-[0-9a-f]{32}$/i.test(k)) return 'deepseek';
  if(/^sk-/.test(k)) return 'openai';
  if(/^[0-9a-f]{64}$/i.test(k)) return 'together';
  if(/^[A-Za-z0-9_-]{32}$/.test(k)) return 'mistral';
  return '';
}
function apiPickModel(ids){
  if(!ids || !ids.length) return '';
  var usable=ids.filter(function(id){ var s=String(id).toLowerCase(); return !/(embed|whisper|tts|transcri|dall|image|moderation|rerank|guard|ocr|audio|realtime)/.test(s); });
  var list=usable.length? usable : ids;
  var prefs=['claude-sonnet','claude-3-5-sonnet','claude-3.5-sonnet','gpt-4o','gpt-4.1','gemini-2.5-flash','gemini-2.5-pro','gemini-2.0-flash','llama-3.3','llama3.3','deepseek-chat','grok','mistral-large','sonnet','opus','pro','flash','turbo','instruct','chat'];
  for(var p=0;p<prefs.length;p++){ for(var i=0;i<list.length;i++){ if(String(list[i]).toLowerCase().indexOf(prefs[p])>=0) return list[i]; } }
  return list[0];
}
/* Every model a key should be tried with, in order: the key's
   chosen model first, then the provider default, then every
   other model from that provider's own list, best first. This
   is the list sending and Test walk through — one model failing
   never gives up on the key, and one key failing never gives up
   on the message: all of this key's models, then all of the next
   key's models, and so on, in every way, before any error. */
function apiModelCandidates(e){
  if(!e) return [];
  var p=API_PROVIDERS[e.provider]; if(!p) return e.model? [e.model] : [];
  var seen={}, out=[];
  function add(m){ m=String(m||'').trim(); if(m && !seen[m]){ seen[m]=1; out.push(m); } }
  add(e.model); add(p.defModel);
  var cached=(e.models||[]).slice();
  var prefs=['claude-sonnet','claude-3-5-sonnet','claude-3.5-sonnet','gpt-4o','gpt-4.1','gemini-2.5-flash','gemini-2.5-pro','gemini-2.0-flash','llama-3.3','llama3.3','deepseek-chat','grok','mistral-large','sonnet','opus','pro','flash','turbo','instruct','chat'];
  function rank(id){ var s=String(id).toLowerCase(); for(var i=0;i<prefs.length;i++){ if(s.indexOf(prefs[i])>=0) return i; } return prefs.length; }
  cached.sort(function(a,b){ return rank(a)-rank(b); });
  var usable=cached.filter(function(id){ var s=String(id).toLowerCase(); return !/(embed|whisper|tts|transcri|dall|image|moderation|rerank|guard|ocr|audio|realtime)/.test(s); });
  (usable.length? usable : cached).forEach(add);
  return out;
}
function apiFetchModels(e){
  var p=API_PROVIDERS[e.provider]; if(!p) return Promise.resolve(null);
  if(p.type==='gemini'){
    return fetch(p.base+'/models',{headers:{'x-goog-api-key':e.key}})
      .then(function(r){ return r.ok? r.json() : null; })
      .then(function(j){ if(!j || !j.models) return null; return j.models.filter(function(m){ return (m.supportedGenerationMethods||[]).indexOf('generateContent')>=0; }).map(function(m){ return String(m.name||'').replace(/^models\//,''); }).filter(Boolean); })
      .catch(function(){ return null; });
  }
  if(p.type==='anthropic'){
    return fetch(p.base+'/models',{headers:{'x-api-key':e.key,'anthropic-version':'2023-06-01'}})
      .then(function(r){ return r.ok? r.json() : null; })
      .then(function(j){ return (j && j.data)? j.data.map(function(m){ return m.id; }).filter(Boolean) : null; })
      .catch(function(){ return null; });
  }
  return fetch(p.base+'/models',{headers:{'Authorization':'Bearer '+e.key}})
    .then(function(r){ return r.ok? r.json() : null; })
    .then(function(j){ return (j && j.data)? j.data.map(function(m){ return m.id; }).filter(Boolean) : null; })
    .catch(function(){ return null; });
}
function apiDetectEntry(key){
  /* The provider comes from the key's format alone (local, above).
     Only that provider's own model list is then asked — with the
     key, to its issuer's endpoint only — to pick the best chat
     model automatically. If the list does not answer (some
     endpoints block it), the provider's default model is used and
     sending checks it; failover across the user's other added
     keys covers the rest. */
  var pid=apiDetectProviderLocal(key);
  if(!pid) return Promise.resolve({provider:'', model:'', models:[], verified:false, unknown:true});
  return apiFetchModels({provider:pid, key:key}).then(function(models){
    if(models && models.length) return {provider:pid, model:apiPickModel(models)||API_PROVIDERS[pid].defModel, models:models, verified:true};
    return {provider:pid, model:API_PROVIDERS[pid].defModel, models:[], verified:false};
  });
}
function addApiKey(rawKey){
  var key=String(rawKey||'').trim();
  if(!key) return Promise.resolve(null);
  var existing=null;
  apiEntries().forEach(function(e){ if(e.key===key) existing=e; });
  if(existing){ state.activeApiId=existing.id; syncLegacyApi(); setApiHealth('changed'); return Promise.resolve(existing); }
  var entry={id:'api'+Date.now().toString(36)+Math.floor(Math.random()*99999), key:key, provider:'', base:'', model:'', models:[], status:'checking', detail:''};
  if(!state.apiKeys) state.apiKeys=[];
  state.apiKeys.push(entry); state.activeApiId=entry.id; syncLegacyApi();
  return apiDetectEntry(key).then(function(det){
    entry.provider=det.provider;
    entry.base=det.provider? API_PROVIDERS[det.provider].base : '';
    entry.model=det.provider? (det.model||API_PROVIDERS[det.provider].defModel) : '';
    entry.models=det.models||[];
    entry.status=det.unknown? 'unknown' : (det.verified? 'ok' : 'unverified');
    entry.detail=det.unknown? 'Provider not recognised from the key format — not sent anywhere' : (det.verified? 'Detected automatically' : 'Added — checked on the next message');
    if(state.activeApiId===entry.id) syncLegacyApi();
    setApiHealth('changed');
    return entry;
  });
}
function removeApiEntry(id){
  state.apiKeys=(state.apiKeys||[]).filter(function(e){ return e.id!==id; });
  if(state.activeApiId===id) state.activeApiId=(apiEntries()[0]||{}).id||'';
  syncLegacyApi();
  setApiHealth(apiEntries().length? 'changed' : 'unset');
}
function setActiveApi(id){ if(apiEntryById(id)){ state.activeApiId=id; syncLegacyApi(); setApiHealth('changed'); } }
/* Attempt order for a send: the active key first, then every other
   added key in the order it was added. */
function apiAttemptOrder(){
  /* Only keys whose provider was recognised are ever attempted —
     an unrecognised key is never sent anywhere. */
  var l=apiEntries().filter(function(e){ return !!e.provider; });
  var a=activeApiEntry(), out=[];
  if(a && a.provider) out.push(a);
  l.forEach(function(e){ if(!a || e.id!==a.id) out.push(e); });
  return out;
}
function apiStatusText(){
  var l=apiEntries(); if(!l.length) return 'Not set';
  if(state.apiHealth==='quota') return 'One API hit its limit — the next is tried automatically';
  if(state.apiHealth==='error') return 'Not working — the next API is tried automatically';
  if(state.apiHealth==='changed') return l.length+(l.length===1?' API':' APIs')+' added — send a message to check';
  return apiEntryLabel(activeApiEntry());
}
/* The models block under a key row: the actual models that key
   can use, asked from its own provider's model list. When the
   list is known it renders as a picker (auto-selected model
   first, tap to change — the pick is what sending uses). When it
   is not known yet, a Show models button loads it on demand; if
   the provider returns no list, the block says so honestly and
   the auto model stays in charge. */
function apiModelsHTML(e){
  if(!e || !e.provider) return '';
  var models=(e.models||[]).slice();
  if(models.length){
    if(e.model && models.indexOf(e.model)<0) models.unshift(e.model);
    return '<div class="api-models"><span class="api-models-lbl">Model · '+models.length+' available from '+esc(API_PROVIDERS[e.provider]? API_PROVIDERS[e.provider].name : 'this API')+'</span>'
      +'<select class="api-modelsel" data-apimodelsel="'+e.id+'" aria-label="Model for this API">'
      + models.map(function(m){ return '<option value="'+escA(m)+'"'+(m===e.model?' selected':'')+'>'+esc(m)+'</option>'; }).join('')
      +'</select></div>';
  }
  if(e.modelsFailed){
    return '<div class="api-models"><span class="api-models-lbl">This provider returned no model list — auto model: '+esc(e.model||'provider default')+'</span>'
      +'<button class="api-showmodels" data-apimodels="'+e.id+'">Try again</button></div>';
  }
  return '<div class="api-models"><button class="api-showmodels" data-apimodels="'+e.id+'">Show models</button></div>';
}
function apiListHTML(){
  var l=apiEntries(), a=activeApiEntry();
  if(!l.length) return '';
  return '<div class="api-list">'+l.map(function(e){
    var st=e.status==='ok'?'Ready':e.status==='quota'?'Quota reached':e.status==='error'?'Not working':e.status==='checking'?'Detecting…':e.status==='unknown'?'Provider not recognised — not sent anywhere':e.status==='unverified'?'Added — checks on next message':'Added';
    return '<div class="api-item"><div class="api-row'+(a&&e.id===a.id?' active':'')+'"><span class="api-dot '+esc(e.status||'')+'"></span><span class="api-meta"><span class="api-name">'+esc(apiEntryLabel(e))+'</span><span class="api-sub">'+esc(apiKeyMask(e))+' · '+esc(st)+'</span></span>'+(e.provider? '<button class="api-use" data-apitest="'+e.id+'">Test</button>' : '')+(a&&e.id===a.id? '<span class="api-active-tag">Active</span>' : '<button class="api-use" data-apiuse="'+e.id+'">Use</button>')+'<button class="api-x" data-apidel="'+e.id+'" aria-label="Remove this API">×</button></div>'
    + apiModelsHTML(e)
    +'</div>';
  }).join('')+'</div>';
}
function wireApiList(root, rerender){
  if(!root) return;
  root.querySelectorAll('[data-apimodelsel]').forEach(function(sel){ sel.addEventListener('change',function(){
    var e=apiEntryById(sel.getAttribute('data-apimodelsel')); if(!e) return;
    e.model=sel.value;
    if(state.activeApiId===e.id) syncLegacyApi();
    setApiHealth('changed');
    toast('Model set — '+e.model);
    if(rerender) rerender();
  }); });
  root.querySelectorAll('[data-apimodels]').forEach(function(b){ b.addEventListener('click',function(ev){
    ev.stopPropagation();
    var e=apiEntryById(b.getAttribute('data-apimodels')); if(!e) return;
    b.disabled=true; b.textContent='Loading models…';
    apiFetchModels(e).then(function(models){
      if(models && models.length){ e.models=models; e.modelsFailed=false; if(!e.model || models.indexOf(e.model)<0) e.model=apiPickModel(models)||e.model; if(state.activeApiId===e.id) syncLegacyApi(); }
      else e.modelsFailed=true;
      if(rerender) rerender();
    });
  }); });
  root.querySelectorAll('[data-apidel]').forEach(function(b){ b.addEventListener('click',function(ev){ ev.stopPropagation(); removeApiEntry(b.getAttribute('data-apidel')); toast('API removed'); if(rerender) rerender(); }); });
  root.querySelectorAll('[data-apiuse]').forEach(function(b){ b.addEventListener('click',function(){ setActiveApi(b.getAttribute('data-apiuse')); toast('Active API switched'); if(rerender) rerender(); }); });
  root.querySelectorAll('[data-apitest]').forEach(function(b){ b.addEventListener('click',function(ev){
    ev.stopPropagation();
    var e=apiEntryById(b.getAttribute('data-apitest')); if(!e) return;
    b.disabled=true; b.textContent='Testing…';
    setApiTestMsg('Testing '+apiEntryLabel(e)+'…');
    testApiEntry(e).then(function(r){
      setApiTestMsg(r.ok
        ? '✓ '+apiEntryLabel(e)+' is working — '+(e.model||'default model')+' · '+apiHost(e)
        : '✗ '+apiEntryLabel(e)+' is not working — '+r.msg);
      if(rerender) rerender();
    });
  }); });
}
/* =============== Test API ===============
   The Test button on each added key: first the provider's own
   model list is asked (issuer endpoint only), then a one-line
   ping is tried with EVERY model on that key, in order, until
   one answers — a single model failing never fails the test.
   A pass marks the key Working, keeps the model that answered
   as the key's model, makes it the active API, and the result
   text shows under the list; only when every model on the key
   has failed does a fail show, with the last provider error.
   Works the same for every provider. */
var apiTestMsgText='';
function setApiTestMsg(t){
  apiTestMsgText=t;
  var el=document.getElementById('apiTestMsg')||document.getElementById('plusTestMsg');
  if(el) el.textContent=t;
}
function apiHost(e){
  var p=e&&API_PROVIDERS[e.provider];
  try{ return new URL((e&&e.base)||(p?p.base:'')).host; }catch(err){ return (e&&e.base)||''; }
}
function pingApi(entry, modelOverride){
  var p=API_PROVIDERS[entry.provider]; if(!p) return Promise.resolve({ok:false, msg:'Provider not recognised'});
  var useModel=modelOverride||entry.model||p.defModel;
  var url, headers, body;
  if(p.type==='gemini'){
    url=p.base+'/models/'+encodeURIComponent(useModel)+':generateContent';
    headers={'Content-Type':'application/json','x-goog-api-key':entry.key};
    body={contents:[{role:'user',parts:[{text:'Reply with OK'}]}], generationConfig:{temperature:0, maxOutputTokens:8}};
  } else if(p.type==='anthropic'){
    url=p.base+'/messages';
    headers={'Content-Type':'application/json','x-api-key':entry.key,'anthropic-version':'2023-06-01'};
    body={model:useModel, max_tokens:8, messages:[{role:'user', content:'Reply with OK'}]};
  } else {
    url=(entry.base||p.base).replace(/\/$/,'')+'/chat/completions';
    headers={'Content-Type':'application/json','Authorization':'Bearer '+entry.key};
    body={model:useModel, messages:[{role:'user', content:'Reply with OK'}], temperature:0, max_tokens:8};
  }
  return fetch(url,{method:'POST', headers:headers, body:JSON.stringify(body)})
    .then(function(r){ return r.json().then(function(j){ return {ok:r.ok, j:j, status:r.status}; }).catch(function(){ return {ok:r.ok, j:null, status:r.status}; }); })
    .then(function(res){
      if(res.ok) return {ok:true};
      var em='';
      try{ var ej=res.j&&res.j.error; em=(ej&&(ej.message||ej))||(res.j&&res.j.message)||''; if(typeof em!=='string') em=JSON.stringify(em); }catch(e){}
      var kind=apiFailureKind(res.status, res.j);
      return {ok:false, kind:kind, modelError:(/model/i.test(em||'') && (res.status===400||res.status===404)),
        msg:(kind==='quota'? 'Quota / rate limit reached (HTTP '+res.status+')' : 'HTTP '+res.status+(em? ' — '+String(em).slice(0,140) : ''))};
    })
    .catch(function(){ return {ok:false, kind:'error', msg:'Network or CORS — the provider could not be reached from this page'}; });
}
function testApiEntry(entry){
  if(!entry || !entry.provider) return Promise.resolve({ok:false, msg:'Provider not recognised — this key is not sent anywhere.'});
  entry.status='checking';
  function done(ok, msg, kind){
    entry.status= ok? 'ok' : (kind||'error');
    entry.detail= ok? 'Working — tested' : msg;
    if(ok){
      state.activeApiId=entry.id; syncLegacyApi(); setApiHealth('ok');
    }
    return {ok:ok, msg:msg};
  }
  return apiFetchModels(entry).then(function(models){
    if(models && models.length) entry.models=models;
    var candidates=apiModelCandidates(entry);
    if(!candidates.length) candidates=[entry.model||(API_PROVIDERS[entry.provider]||{}).defModel].filter(Boolean);
    var last={ok:false, msg:'No model could be tried', kind:'error'};
    function tryPing(i){
      if(i>=candidates.length) return Promise.resolve(done(false, last.msg, last.kind));
      return pingApi(entry, candidates[i]).then(function(r){
        if(r.ok){ entry.model=candidates[i]; return done(true,'Working'); }
        last=r;
        return tryPing(i+1);
      });
    }
    return tryPing(0);
  });
}
/* Sidebar motion: one short iOS-style run (340ms, --sb-ease), started
   on the NEXT frame so the browser paints the starting position and
   no first frame is dropped; timers are kept and cleared so a fast
   re-tap never fights a stale timeout. Transforms are translate3d
   only — the compositor moves both layers without repainting. */
var SB_MS=340, sbAnimT=null, sbHideT=null;
function setSidebar(open, animate){
  if(sbAnimT){ clearTimeout(sbAnimT); sbAnimT=null; }
  if(sbHideT){ clearTimeout(sbHideT); sbHideT=null; }
  app.classList.remove('dragging');
  if(window.innerWidth>=820){
    app.classList.toggle('anim', !!animate);
    sidebar.style.transform=''; stage.style.transform=''; stage.style.borderRadius=''; scrim.style.opacity=''; sidebar.style.display='';
    app.classList.toggle('sb-closed', !open); app.classList.toggle('sb-open', open);
    if(animate) sbAnimT=setTimeout(function(){ app.classList.remove('anim'); }, SB_MS+30);
    return;
  }
  app.classList.toggle('sb-open', open); app.classList.toggle('sb-closed', !open);
  if(open){
    sidebar.style.display='flex';
    /* MENU COLOUR FIX: the sidebar head avatar is first rendered at
       boot while the sidebar is display:none (mobile), and some
       phone WebViews never repaint that SVG's gradient fills when
       the menu opens — the avatar shape then shows as a dark /
       wrong-coloured blob in the menu. Re-render the head avatar
       fresh on every open, while the sidebar is visible, so its
       shape always paints in its real colours. */
    try{ if(typeof syncSidebarAgent==='function') syncSidebarAgent(); }catch(e){}
  }
  var sbT=open?'translate3d(0,0,0)':'translate3d(-102%,0,0)';
  /* Curved peek (original, kept exactly): stage pushes right AND
     scales to .965 with the 34px radius; the scrim is a transparent
     tap shield over the peeking card only. */
  var stT=open?'translate3d('+sbWidth()+'px,0,0) scale(0.965)':'translate3d(0,0,0) scale(1)';
  var stR=open?'34px 0 0 34px':'0px';
  scrim.style.opacity='0';
  if(!animate){
    app.classList.remove('anim');
    sidebar.style.transform=sbT; stage.style.transform=stT; stage.style.borderRadius=stR;
    scrim.style.left=open?sbWidth()+'px':'0px';
    if(!open) sidebar.style.display='none';
    return;
  }
  app.classList.add('anim');
  /* Force the start frame, then apply the target on the next frame —
     this is what stops the opening frame from being skipped. */
  void stage.offsetWidth;
  requestAnimationFrame(function(){
    sidebar.style.transform=sbT; stage.style.transform=stT; stage.style.borderRadius=stR;
    scrim.style.left=open?sbWidth()+'px':'0px';
  });
  if(!open){
    /* Stage slides back over the sidebar first; only then is it removed,
       so the close never looks like a disappearance. */
    sbHideT=setTimeout(function(){ if(!sbOpen()) sidebar.style.display='none'; }, SB_MS+30);
  }
  sbAnimT=setTimeout(function(){ app.classList.remove('anim'); }, SB_MS+30);
}
(function(){
  var startX=0, startY=0, dragging=false, wasOpen=false, W=0, dragLock=null;
  var dragRaf=0, dragDx=0, dragVel=0, dragLastX=0, dragLastT=0;
  document.addEventListener('pointerdown',function(e){
    if(window.innerWidth>=820) return;
    if(e.target.closest('#settingsView,.sheet,.menu-pop')) return;
    if(e.target.closest('.chat-row')) return; /* rows run their own swipe (delete/open) */
    if(e.target.closest('button,input,textarea,select,a')) return;
    wasOpen=sbOpen(); W=sbWidth();
    if(!wasOpen){
      /* Swipe right anywhere on the chat background opens the menu —
         not just from the left edge — smooth and easy. Gestures that
         start on a message stay with the message (its own swipe to
         reply), and buttons/inputs are already excluded above. */
      if(e.target.closest('.msg')) return;
      if(!e.target.closest('#stage')) return;
    }
    if(wasOpen){
      /* When open, a drag may only start from the peeking stage on the
         right — never from sidebar content. Touches inside the sidebar
         belong to the chats list, so its up/down scrolling is never
         stolen by the open/close drag. */
      if(e.target.closest('#sidebar')) return;
      if(e.clientX<W) return;
    }
    startX=e.clientX; startY=e.clientY; dragging=true; dragLock=null;
    dragDx=0; dragVel=0; dragLastX=e.clientX; dragLastT=Date.now();
    sidebar.style.display='flex';
    app.classList.add('dragging');
    sidebar.classList.add('noanim'); stage.classList.add('noanim');
  },{passive:true});
  function applyDragFrame(){
    dragRaf=0; if(!dragging || dragLock!=='h') return;
    var dx=dragDx;
    var base=wasOpen?0:-W; var pos=Math.max(-W, Math.min(0, base+dx));
    var prog=W? (pos+W)/W : 0; /* 0 = closed, 1 = fully open */
    sidebar.style.transform='translate3d('+pos+'px,0,0)';
    /* The curve grows with the drag: radius 0→34px, scale 1→.965. */
    stage.style.transform='translate3d('+(pos+W)+'px,0,0) scale('+(1-0.035*prog)+')';
    stage.style.borderRadius=(34*prog)+'px 0 0 '+(34*prog)+'px';
    scrim.style.opacity='0';
    scrim.style.left=(pos+W)+'px';
  }
  document.addEventListener('pointermove',function(e){
    if(!dragging) return;
    var dx=e.clientX-startX, dy=e.clientY-startY;
    /* Velocity (px/ms) from the last move — a quick flick opens or
       closes even when the distance is short, like Apple's drawer. */
    var now=Date.now(), dt=now-dragLastT;
    if(dt>0){ dragVel=0.7*dragVel + 0.3*((e.clientX-dragLastX)/dt); dragLastX=e.clientX; dragLastT=now; }
    /* Direction lock: nothing moves until the gesture proves itself
       horizontal. A vertical-dominant move cancels the drag for good
       and hands the gesture back to the scroller under the finger, so
       scrolling up or down is never fought or frozen mid-swipe. */
    if(!dragLock){
      if(Math.abs(dy)>10 && Math.abs(dy)>=Math.abs(dx)*1.15){ dragging=false; app.classList.remove('dragging'); sidebar.classList.remove('noanim'); stage.classList.remove('noanim'); setSidebar(wasOpen,true); return; }
      if(Math.abs(dx)>10 && Math.abs(dx)>Math.abs(dy)*1.15) dragLock='h';
      else return;
    }
    /* Flow without missed frames: pointermove can fire faster than
       the screen refreshes, so the style write is coalesced into ONE
       requestAnimationFrame per frame using the latest position. */
    dragDx=dx;
    if(!dragRaf) dragRaf=requestAnimationFrame(applyDragFrame);
  },{passive:true});
  function up(e){
    if(!dragging) return; dragging=false;
    if(dragRaf){ cancelAnimationFrame(dragRaf); dragRaf=0; }
    app.classList.remove('dragging');
    sidebar.classList.remove('noanim'); stage.classList.remove('noanim');
    /* A swipe-left-to-open gesture (below) may have just opened the
       menu during this same touch — do not let this handler's release
       math close it again. */
    if(window.__axoSwipeLeftAt && Date.now()-window.__axoSwipeLeftAt<700) return;
    var dx=e.clientX-startX;
    var open;
    if(dragVel>0.45) open=true;
    else if(dragVel<-0.45) open=false;
    else open=wasOpen ? dx>-W*0.2 : dx>W*0.2;
    setSidebar(open,true);
  }
  document.addEventListener('pointerup',up,{passive:true});
  document.addEventListener('pointercancel',function(){ if(dragging){ dragging=false; if(dragRaf){ cancelAnimationFrame(dragRaf); dragRaf=0; } app.classList.remove('dragging'); sidebar.classList.remove('noanim'); stage.classList.remove('noanim'); setSidebar(wasOpen,true);} });
  scrim.addEventListener('click',function(){ setSidebar(false,true); });
})();
/* Pull-to-refresh / reload protection is CSS-only on purpose:
   html, body and every scroller carry overscroll-behavior: contain /
   none and the page itself never scrolls (body overflow hidden, #app
   fixed), so an edge swipe cannot chain to the page or reload it.
   The old JS guard preventDefault-ed touchmove at a scroller's edges;
   on mobile browsers that cancels the REST of the gesture too, which
   is exactly what froze scrolling up/down and made lists feel stuck.
   No JS ever preventDefaults a vertical scroll gesture now. */
/* =============== Menus & sheets =============== */
var pop=$('#popMenu');
/* The element that opened the pop menu. The outside-tap closer must
   NOT close the menu when the tap lands on its own anchor button:
   that pointerdown used to close it, and the anchor's click handler
   then reopened it — which is why clicking the dots button while
   its menu was open reopened the menu instead of toggling it shut. */
var popAnchor=null;
function closePop(){ pop.classList.remove('show'); pop.innerHTML=''; popAnchor=null; }
function openPop(anchorRect, items, anchorEl){
  popAnchor=anchorEl||null;
  pop.innerHTML=items.map(function(it){
    if(it.sep) return '<div class="msep"></div>';
    return '<button data-pi="'+it.id+'" class="'+(it.danger?'danger':'')+'">'+(it.icon||'')+'<span>'+esc(it.label)+'</span>'+(it.dot?'<span class="mdot2"></span>':'')+'</button>';
  }).join('');
  pop.classList.add('show');
  var w=236, left=Math.min(anchorRect.right-w, window.innerWidth-w-8); if(left<8) left=8;
  var top=anchorRect.bottom+8, est=items.length*46+14;
  if(top+est>window.innerHeight-10) top=Math.max(8, anchorRect.top-est-8);
  pop.style.left=left+'px'; pop.style.top=top+'px'; pop.style.width=w+'px';
  pop.querySelectorAll('button').forEach(function(b){
    b.addEventListener('click',function(){ var id=b.getAttribute('data-pi'); closePop(); handlePop(id); });
  });
}
document.addEventListener('pointerdown',function(e){
  if(!pop.classList.contains('show')) return;
  if(pop.contains(e.target)) return;
  if(popAnchor && popAnchor.contains(e.target)) return; /* the anchor's own click toggles */
  closePop();
});
var popCtx=null;
function handlePop(id){
  var ctx=popCtx||{}; popCtx=null;
  if(id==='temp'){ toggleTemp(); }
  else if(id==='settings'){ openSettings('list'); }
  else if(id==='split'){ if(ctx.chatId && ctx.chatId!==state.currentId){ if(state.splitId===ctx.chatId) exitSplit(); else enterSplit(ctx.chatId); } else if(state.splitId) exitSplit(); else { var t=chats.filter(function(c){return c.id!==state.currentId;})[0]; if(t) enterSplit(t.id); } }
  else if(id==='openchat'){ openChat(ctx.chatId); }
  else if(id==='rename'){ renameChat(ctx.chatId); }
  else if(id==='delete'){ askDelete(ctx.chatId); }
  else if(id==='clear'){ var c=chatById(ctx.chatId||state.currentId); if(c){ c.messages=[]; renderAll(); toast('Chat cleared'); } }
  else if(id==='share'){ toast('Nothing to share from a static preview'); }
}
var sheet=$('#sheet'), sheetScrim=$('#sheetScrim');
var sheetCloseTimer=null;
function openSheet(html){
  if(sheetCloseTimer){ clearTimeout(sheetCloseTimer); sheetCloseTimer=null; }
  sheet.innerHTML='<div class="grab"></div>'+html; sheet.classList.add('show'); sheetScrim.classList.add('show');
}
function closeSheet(){
  sheet.classList.remove('show'); sheetScrim.classList.remove('show');
  /* Destroy the sheet's content once it has slid away — including
     any code-preview iframe and its srcdoc — so a closed preview
     leaves nothing behind that a keyboard open/close (which lifts
     fixed elements by --kbFixed) could ever show again. The sheet
     is also visibility:hidden whenever it is not .show. */
  if(sheetCloseTimer) clearTimeout(sheetCloseTimer);
  sheetCloseTimer=setTimeout(function(){
    sheetCloseTimer=null;
    if(!sheet.classList.contains('show')) sheet.innerHTML='';
  }, 420);
}
sheetScrim.addEventListener('click',closeSheet);
function detailSheet(title, bullets){
  openSheet('<h3>'+esc(title)+'</h3><p class="sub">Full detail</p><ul>'+bullets.map(function(b){return '<li>'+esc(b)+'</li>';}).join('')+'</ul><button class="btn-ghost" id="sheetCloseBtn">Close</button>');
  $('#sheetCloseBtn').addEventListener('click',closeSheet);
}
var DETAILS={
  apis:{t:'API Keys & Automatic Failover', b:['Just paste a key — the provider, base URL and model are detected and selected automatically. Nothing else to fill in.','Every added key shows its models: the list under the key is the real model list from that key\u2019s own provider, with the auto-selected model picked. Tap it to choose a different model for that key, or tap Show models to load the list.','Add as many keys as you like, from any supported provider: OpenAI, Anthropic, Google Gemini, OpenRouter, Groq, xAI, DeepSeek, NVIDIA, Mistral, Together, or another OpenAI-compatible key.','Sending tries your active key first with its chosen model, then every other model on that key, then the next key and every model on it, and so on through all keys and all their models. An error is only shown when every model on every key has failed.','Keys are held for this session only in this preview and are never shown in full after saving.','Without a key, replies come from the built-in local reply engine.']},
  usage:{t:'Usage & Limits', b:['Pick the API you have at the top — the page then shows that API only.','This session counts are counted by the app itself, request by request: requests sent, replies received, failures, quota hits, and the token totals your provider returns with each reply. They reset when the page reloads, like the rest of this preview.','OpenRouter limit: tap Check live usage & limit and the app asks OpenRouter directly, with your saved key, how much this key has used, its limit and what remains. Nothing is estimated.','Google Gemini and custom endpoints do not offer a per-key limit check the app can call, so their limits live on the provider side — the page says so instead of inventing a number, and still shows your status and session counts.']},
  connectors:{t:'Connectors & Online Search', b:['Online Search is the only connector in this build.','When it is on, /search looks up live sources on Wikipedia and the open web.']},
  memory:{t:'Local Memory System', b:['Everything you say in any chat is saved to memory automatically, locally in this app, with no limit on entries.','Before every reply, the saved memory is searched by the incoming message\u2019s keywords, and the reply is built using the related memories found.','Memory never holds keys, secrets, emails or phone numbers — those are stripped out before a note is saved.','Turn it off any time and saving and searching both stop. The + sheet Memory switch and this switch always match.']},
  appearance:{t:'Appearance & Liquid Glass', b:['The phone preview at the top shows the agent avatar, its name label and your bubbles exactly as they will look in chat.','Chat theme is a row of colour circles — White is the default — and it recolours your bubbles and accents across the app.','Avatar size is Small, Medium, Large, Extra large or Hidden, and it sets the agent head size in chat.','Mode is System, Light or Dark; System follows your device setting.','Red appears only for delete and error states.']},
  agent:{t:'Agent', b:['The Agent page is the main agent\u2019s own page: avatar with the pencil menu (Change avatar / Edit name), name, live status, and tabs for Today, Approvals history, Reminders + Daily, and the profile with its VIBE and the SOUL / MEMORY cards.','Sub-agents live under it: the Sub-agents page lists every agent, and the New sub-agent page creates one with its own name, avatar, instructions and memory.','Any agent can be made the main agent at any time from its menu on the Sub-agents page.']},
  agents:{t:'Agents', b:['Settings \u2192 Agents opens the Agent page — the main agent\u2019s page with Today, Approvals, Reminders + Daily, and its profile.','Under it, the Sub-agents page holds the full agents list: create as many agents as you like and chat with any of them.','Each agent has its own name, avatar, custom instructions and custom memory.','Any agent can be made the main agent at any time from its menu.','History and memory are shared by all agents by default; turn on individual history or memory for one agent in its Edit page and only that agent keeps its own.','Animation speed for the Agents UI lives on the Sub-agents page — drag the slider slowly and the live preview changes as you drag.']},
  code:{t:'Code Mode & Play-First Preview', b:['Code replies arrive as artifacts with a Play button.','Play First runs the preview straight away; Code First shows the code first.']},
  skills:{t:'Skill Library (22 Built-In Skills)', b:['Each skill is one job: a document, a deck, a test pass, a theme.','Use /skill <name> to apply one skill to the next reply, or run a skill directly with its own command.','get-more-perspectives: an advisory panel (Operator, Skeptic, Visionary, Customer Advocate, Finance Mind) that commits to a vote before you decide. Custom panels persist for the session.','match-my-writing-style: drafts in your voice, learned only from your own writing in this app and samples you paste — never from incoming mail, and never a Gmail or Drive scan in this local app. Drafts only; it never sends.','focus-my-energy: matches tasks to your energy (sharp, steady, fried) — Deep Work, Steady Work, Low Drain — with one clear DO NOW. A hard deadline today overrides energy matching.','Disabled skills are skipped by the router.']},
  commands:{t:'Slash Commands', b:['Type / in the composer and the command box appears above it.','Tap a command to run it, or keep typing to filter the list.','/split opens the chosen chat beside your current one, top and bottom.']},
  safety:{t:'Privacy & Key Safety', b:['Your key is used only for calls to the provider you picked.','Never paste a key into a chat message — keys belong in the Model section of the + sheet.']}
};
function qBtn(key){ return '<span class="qbtn" role="button" tabindex="0" data-q="'+key+'" aria-label="More detail">?</span>'; }
document.addEventListener('click',function(e){
  var q=e.target.closest('[data-q]'); if(q){ var d=DETAILS[q.getAttribute('data-q')]; if(d) detailSheet(d.t,d.b); }
});
/* =============== Chat actions =============== */
function toggleTemp(){
  /* The ONLY function that can turn Temporary chat on. It is wired
     solely to Temporary chat's own toggles: the header pill button
     while it shows the Temporary icon, and the "Temporary chat" row
     in the dots menu. No New chat path calls this. */
  state.temp=!state.temp; updateTargetLine(); updateTempIcon();
  toast(state.temp?'Temporary chat on — main chat stays continuous':'Temporary chat off');
}
function openChat(id){
  if(!chatById(id)) return;
  state.replyTo=null; if(typeof renderReplyBar==='function') renderReplyBar(); closeMsgMenu();
  if(typeof setTabSel==='function') setTabSel('main');
  state.currentId=id; setSidebar(false,true); closeSettings(true); renderAll();
}
function newChat(){
  /* Starting a new chat NEVER turns Temporary chat on — it clears
     it, so a fresh chat never inherits the temp banner or state.
     Temporary chat turns on only from toggleTemp() (its own toggle). */
  state.temp=false;
  state.replyTo=null; if(typeof renderReplyBar==='function') renderReplyBar(); closeMsgMenu();
  var tb=$('#tempBtn'); if(tb) tb.classList.remove('temp-on');
  var c={id:'c'+(++uid), title:'New chat', messages:[]};
  var nca=(typeof chatAgent==='function')? chatAgent() : null;
  if(nca && nca.individualHistory) c.agentId=nca.id;
  chats.splice(1,0,c); state.currentId=c.id; state.splitId=null;
  setSidebar(false,true); closeSettings(true); renderAll();
  $('#chatInput').focus();
}
function enterSplit(id){
  if(id===state.currentId){ toast('Pick a different chat for split'); return; }
  state.splitId=id; state.splitActive='bottom'; closeSettings(true); renderAll();
  toast('Split screen on — tap a pane, then type');
}
function exitSplit(){ state.splitId=null; renderAll(); updateTargetLine(); }
function renameChat(id){
  var c=chatById(id); if(!c) return;
  openSheet('<h3>Rename chat</h3><div class="field"><label>Title</label><input id="rnInput" type="text" value="'+esc(c.title)+'"></div>'
    +'<button class="btn-primary" id="rnSave">Save</button><button class="btn-ghost" id="rnCancel">Cancel</button>');
  $('#rnSave').addEventListener('click',function(){ var v=$('#rnInput').value.trim(); if(v){ c.title=v; renderAll(); } closeSheet(); });
  $('#rnCancel').addEventListener('click',closeSheet);
}
function askDelete(id){
  var c=chatById(id); if(!c) return;
  openSheet('<h3>Delete this chat?</h3><p class="sub">'+esc(c.title)+' will be removed. This cannot be undone.</p>'
    +'<button class="btn-danger" id="delYes">Delete</button><button class="btn-ghost" id="delNo">Cancel</button>');
  $('#delYes').addEventListener('click',function(){
    chats=chats.filter(function(x){return x.id!==id;});
    if(state.splitId===id) state.splitId=null;
    if(state.currentId===id) state.currentId='main';
    closeSheet(); renderAll(); toast('Chat deleted');
  });
  $('#delNo').addEventListener('click',closeSheet);
}
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-act]');
  if(b){
    var m=null, mChat=null;
    for(var i=0;i<chats.length && !m;i++){ var fm=findMsg(chats[i], b.getAttribute('data-id')); if(fm){ m=fm; mChat=chats[i]; } }
    if(m){
      var act=b.getAttribute('data-act');
      if(act==='copy' && m.code) copyText(m.code.body);
      else if(act==='copyai') copyText(m.text);
      else if(act==='play' && m.code) openPreview(m.code.body);
      else if(act==='canvasopen' && m.code) openCanvasFull(m);
      else if(act==='avconfirm' && m.avatarProposal && !m.avatarProposal.resolved) confirmAvatarProposal(mChat, m);
      else if(act==='avcancel' && m.avatarProposal && !m.avatarProposal.resolved){ m.avatarProposal.resolved='cancelled'; renderAll(); toast('Okay — the avatar was not changed'); }
    }
  }
  var st=e.target.closest('[data-starter]');
  if(st) sendText(st.getAttribute('data-starter'));
});
function copyText(t){
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(function(){ toast('Copied'); },function(){ toast('Copy failed'); }); }
  else toast('Copy unavailable here');
}
function openPreview(code){
  openSheet('<h3>Preview</h3><p class="sub">Running the code from this reply.</p><iframe id="previewFrame" title="Code preview" sandbox="allow-scripts"></iframe><button class="btn-ghost" id="pvClose">Close</button>');
  $('#previewFrame').srcdoc=code;
  $('#pvClose').addEventListener('click',closeSheet);
}
/* =============== Message menu (liquid glass) ===============
   Tapping (or long-pressing) ANY message — main chat or either
   split pane, user or assistant — opens one small minimal
   Apple-like liquid glass menu anchored to that message:
   Reply · Copy · Select · Share, then Edit on your own messages
   or Regenerate on assistant messages, then Delete. Every row
   works in place; nothing here is a dead control. The menu was
   not showing before because messages rendered with no id and
   no tap handler at all — both are fixed here and in msgHTML. */
var msgMenu=$('#msgMenu'), msgMenuCtx=null, msgMenuEl=null;
function msgFullText(m){
  var t=m.text||'';
  if(m.links && m.links.length) t+=(t?'\n':'')+m.links.map(function(e){return e.url;}).join('\n');
  if(m.attachments && m.attachments.length) t+=(t?'\n':'')+m.attachments.map(function(a){return typeof a==='string'?a:(a.name||'File');}).join('\n');
  return t+(m.code? '\n\n'+m.code.body : '');
}
function closeMsgMenu(){
  msgMenu.classList.remove('show'); msgMenu.innerHTML=''; msgMenuCtx=null;
  if(msgMenuEl){ msgMenuEl.classList.remove('menu-open'); msgMenuEl=null; }
}
function renderReplyBar(){
  var bar=$('#replyBar'); if(!bar) return;
  var rt=state.replyTo;
  if(!rt){ bar.className=''; bar.innerHTML=''; return; }
  bar.className='show';
  bar.innerHTML='<span class="rb-label">Reply</span><span class="rb-text">'+esc(rt.text)+'</span><button id="replyCancel" aria-label="Cancel reply">'+I.x+'</button>';
  $('#replyCancel').addEventListener('click',function(){ state.replyTo=null; renderReplyBar(); });
}
function openMsgMenuFor(msgEl){
  if(!msgEl) return;
  var id=msgEl.getAttribute('data-msg-id'), cid=msgEl.getAttribute('data-chat-id');
  var chat=chatById(cid), m=findMsg(chat,id);
  if(!m){ for(var i=0;i<chats.length && !m;i++){ var f=findMsg(chats[i],id); if(f){ chat=chats[i]; m=f; } } }
  if(!m||!chat) return;
  if(msgMenuCtx && msgMenuCtx.msg.id===m.id && msgMenu.classList.contains('show')){
    /* A fresh tap on the same message toggles its menu closed; the
       duplicate guard keeps the pointer tap + its click (one real
       tap) from toggling it straight back. */
    if(Date.now()-lastMsgMenuOpen.at<600) return;
    lastMsgMenuOpen={key:m.id, at:Date.now()}; closeMsgMenu(); return;
  }
  closePop(); closeMsgMenu();
  msgMenuCtx={chat:chat, msg:m}; msgMenuEl=msgEl; msgEl.classList.add('menu-open');
  var items=[
    {a:'reply', icon:I.reply, label:'Reply'},
    {a:'copy', icon:I.copy, label:'Copy'},
    {a:'select', icon:I.select, label:'Select'},
    {a:'share', icon:I.share, label:'Share'}
  ];
  if(m.role==='user') items.push({a:'edit', icon:I.edit, label:'Edit'});
  else items.push({a:'regen', icon:I.refresh, label:'Regenerate'});
  items.push({sep:true});
  items.push({a:'delete', icon:I.trash, label:'Delete', danger:true});
  /* Reaction options lead the menu — they show on EVERY selected
     message (yours and the agent's). The quick set is drawn from
     the app's own reaction palette when it is loaded. */
  var quick=['😂','😍','🔥','😮','😭','🫶','✨'];
  if(typeof REACTION_SET!=='undefined') quick=quick.filter(function(e){ return REACTION_SET[e]; });
  var reactHTML='<div class="msg-react-row" role="group" aria-label="React to this message">'
    +quick.map(function(e){ return '<button data-mr="'+escA(e)+'" class="'+(m.reaction===e?'sel':'')+'" aria-label="React '+escA(e)+'">'+e+'</button>'; }).join('')+'</div>';
  msgMenu.innerHTML=reactHTML+items.map(function(it){
    if(it.sep) return '<div class="msep"></div>';
    return '<button data-ma="'+it.a+'" class="'+(it.danger?'danger':'')+'" role="menuitem">'+it.icon+'<span>'+it.label+'</span></button>';
  }).join('');
  /* Anchor to the message: user menus right-align to the bubble,
     assistant menus left-align to the text; flips above the message
     when there is no room below, and always stays on screen. */
  var anchor=msgEl.querySelector('.bubble-user')||msgEl.querySelector('.body')||msgEl;
  var aRect=anchor.getBoundingClientRect(), vRect=msgEl.getBoundingClientRect();
  var w=224, est=items.length*45+16+54;
  var left=(m.role==='user') ? aRect.right-w : aRect.left;
  left=Math.max(8, Math.min(left, window.innerWidth-w-8));
  var top=vRect.bottom+6;
  if(top+est>window.innerHeight-8) top=Math.max(8, vRect.top-est-6);
  msgMenu.style.left=left+'px'; msgMenu.style.top=top+'px';
  msgMenu.style.transformOrigin=(m.role==='user'?'top right':'top left');
  msgMenu.classList.add('show');
  lastMsgMenuOpen={key:m.id, at:Date.now()};
  msgMenu.querySelectorAll('[data-ma]').forEach(function(b){
    b.addEventListener('click',function(){ var a=b.getAttribute('data-ma'); var ctx=msgMenuCtx; closeMsgMenu(); if(ctx) handleMsgAction(a, ctx.chat, ctx.msg); });
  });
  msgMenu.querySelectorAll('[data-mr]').forEach(function(b){
    b.addEventListener('click',function(){
      var e=b.getAttribute('data-mr'); var ctx=msgMenuCtx; closeMsgMenu();
      if(!ctx) return;
      if(ctx.msg.reaction===e) delete ctx.msg.reaction;
      else ctx.msg.reaction=e;
      renderAll();
    });
  });
}
var lastMsgMenuOpen={key:'', at:0};
function handleMsgAction(a, chat, m){
  if(a==='copy'){ copyText(msgFullText(m)); }
  else if(a==='reply'){
    state.replyTo={chatId:chat.id, msgId:m.id, role:m.role, text:msgFullText(m).replace(/\s+/g,' ').slice(0,140)};
    renderReplyBar(); input.focus(); toast('Replying — type your answer');
  }
  else if(a==='select'){
    openSheet('<h3>Select text</h3><p class="sub">Tap and hold, or use Select all, to take any part of this message.</p>'
      +'<div class="field"><textarea id="selMsgText" rows="6" readonly>'+esc(msgFullText(m))+'</textarea></div>'
      +'<button class="btn-primary" id="selAllBtn">Select all</button><button class="btn-ghost" id="selCopyBtn">Copy text</button><button class="btn-ghost" id="selDoneBtn">Done</button>');
    $('#selAllBtn').addEventListener('click',function(){ var t=$('#selMsgText'); t.focus(); t.select(); });
    $('#selCopyBtn').addEventListener('click',function(){ copyText(msgFullText(m)); });
    $('#selDoneBtn').addEventListener('click',closeSheet);
  }
  else if(a==='share'){
    var t=msgFullText(m);
    if(navigator.share){ navigator.share({text:t}).catch(function(){}); }
    else copyText(t);
  }
  else if(a==='edit'){
    openSheet('<h3>Edit message</h3><div class="field"><textarea id="editMsgText" rows="5">'+esc(m.text)+'</textarea></div>'
      +'<button class="btn-primary" id="editMsgSave">Save</button><button class="btn-ghost" id="editMsgCancel">Cancel</button>');
    $('#editMsgSave').addEventListener('click',function(){
      var v=$('#editMsgText').value.trim(); if(!v){ toast('Message is empty'); return; }
      m.text=v; closeSheet(); renderAll(); toast('Message edited');
    });
    $('#editMsgCancel').addEventListener('click',closeSheet);
  }
  else if(a==='regen'){
    var idx=chat.messages.indexOf(m), prev='';
    for(var i=idx-1;i>=0;i--){ if(chat.messages[i].role==='user'){ prev=chat.messages[i].text; break; } }
    if(state.apiKey){ var oldCode=m.code||null; chat.messages.splice(idx,1); renderAll(); callProvider(chat, null, oldCode? {contextCode:oldCode} : null); toast('Regenerating…'); return; }
    toast('Regenerating…');
    setTimeout(function(){
      if(m.code){ var r=codeReply(prev||'a small example'); m.text=r.text; m.code=r.code; }
      else m.text=localReply(prev||m.text, state.memory? searchMemory(prev||m.text) : []);
      renderAll(); toast('Regenerated');
    },450);
  }
  else if(a==='delete'){
    openSheet('<h3>Delete this message?</h3><p class="sub">'+esc(msgFullText(m).slice(0,120))+'</p>'
      +'<button class="btn-danger" id="msgDelYes">Delete</button><button class="btn-ghost" id="msgDelNo">Cancel</button>');
    $('#msgDelYes').addEventListener('click',function(){
      var ix=chat.messages.indexOf(m); if(ix>=0) chat.messages.splice(ix,1);
      if(state.replyTo && state.replyTo.msgId===m.id){ state.replyTo=null; renderReplyBar(); }
      closeSheet(); renderAll(); toast('Message deleted');
    });
    $('#msgDelNo').addEventListener('click',closeSheet);
  }
}
/* Tap detection: a tap is a short press that barely moves, so
   scrolling up/down, sidebar swipes and row swipes never open the
   menu by accident; a 560ms long press opens it too (Apple-style).
   Buttons inside a message (Play, Copy) keep their own jobs and
   never open it. The click fallback covers mouse clicks and any
   tap the pointer stream misses; a 600ms duplicate guard stops
   the pointer tap and its click from opening it twice. */
var msgTap=null, msgTapTimer=null;
function msgTapClear(){ msgTap=null; if(msgTapTimer){ clearTimeout(msgTapTimer); msgTapTimer=null; } }
document.addEventListener('pointerdown',function(e){
  if(msgMenu.classList.contains('show') && !msgMenu.contains(e.target) && !e.target.closest('.msg[data-msg-id]')) closeMsgMenu();
  if(e.target.closest('#msgMenu,.sheet,#settingsView,#sidebar')) { msgTapClear(); return; }
  if(e.target.closest('button,a,input,textarea,select')) { msgTapClear(); return; }
  var msgEl=e.target.closest('.msg[data-msg-id]'); if(!msgEl){ msgTapClear(); return; }
  msgTap={x:e.clientX, y:e.clientY, el:msgEl};
  msgTapTimer=setTimeout(function(){ if(msgTap){ var el2=msgTap.el; msgTapClear(); openMsgMenuFor(el2); } },560);
},{passive:true});
document.addEventListener('pointermove',function(e){
  if(msgTap && (Math.abs(e.clientX-msgTap.x)>12 || Math.abs(e.clientY-msgTap.y)>12)) msgTapClear();
},{passive:true});
document.addEventListener('pointerup',function(e){
  if(!msgTap) return;
  var el2=msgTap.el; msgTapClear(); openMsgMenuFor(el2);
},{passive:true});
document.addEventListener('pointercancel',msgTapClear,{passive:true});
/* Double-tap to like: a second tap on the same message within 350ms
   likes it (or un-likes it) instead of opening the menu. The like
   shows as a heart badge on the message, and it is recorded in
   memory as a preference signal — sanitised like all memory — so
   the agent knows what landed well and can use it later: liked
   messages surface through the same keyword memory search that
   runs before replies. */
var LIKE_HEART='<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style="width:12px;height:12px;display:block"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.65l-1-1.05a5.5 5.5 0 0 0-7.8 7.8l1.05 1.05L12 21.2l7.75-7.75 1.05-1.05a5.5 5.5 0 0 0 0-7.8z"/></svg>';
function recordLike(chat, m){
  var clean=memorySanitize(msgFullText(m)).slice(0,220);
  if(!clean) return;
  for(var i=0;i<MEM.length;i++) if(MEM[i].msgId==='like:'+m.id) return;
  MEM.push({id:'mem'+(++uid), msgId:'like:'+m.id, chatId:chat.id, chatTitle:chat.title, text:'Liked message — a preference signal; the user double-tapped this: '+clean, keys:memoryKeywords(clean), ts:Date.now()});
}
function removeLike(chat, m){
  for(var i=MEM.length-1;i>=0;i--) if(MEM[i].msgId==='like:'+m.id) MEM.splice(i,1);
}
var likeToastShown=false;
function toggleLike(chat, m){
  m.liked=!m.liked;
  if(m.liked){ recordLike(chat, m); if(!likeToastShown){ likeToastShown=true; toast('Liked — saved as a preference signal'); } }
  else removeLike(chat, m);
  renderAll();
}
var lastTapLike={id:'', at:0}, likeDown=null;
document.addEventListener('pointerdown',function(e){
  likeDown={x:e.clientX, y:e.clientY};
},{passive:true});
document.addEventListener('pointerup',function(e){
  if(!likeDown) return;
  var moved=Math.abs(e.clientX-likeDown.x)>12 || Math.abs(e.clientY-likeDown.y)>12;
  likeDown=null;
  if(moved) return;
  if(e.target.closest && e.target.closest('button,a,input,textarea,select,.sheet,#msgMenu')) return;
  var msgEl=e.target.closest && e.target.closest('.msg[data-msg-id]'); if(!msgEl) return;
  var id=msgEl.getAttribute('data-msg-id'), now=Date.now();
  if(lastTapLike.id===id && now-lastTapLike.at<350){
    lastTapLike={id:'', at:0};
    var chat=chatById(msgEl.getAttribute('data-chat-id')), m=findMsg(chat,id);
    if(m){ closeMsgMenu(); toggleLike(chat, m); }
  } else {
    lastTapLike={id:id, at:now};
  }
},{passive:true});
document.addEventListener('click',function(e){
  if(e.target.closest('button,a,input,textarea,select,.sheet,#msgMenu')) return;
  if(window.__axoSuppressMsgClick && Date.now()<window.__axoSuppressMsgClick) return; /* a swipe-to-reply just ended here */
  var msgEl=e.target.closest('.msg[data-msg-id]'); if(!msgEl) return;
  if(lastMsgMenuOpen.key===msgEl.getAttribute('data-msg-id') && Date.now()-lastMsgMenuOpen.at<600) return;
  openMsgMenuFor(msgEl);
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape') closeMsgMenu();
  /* Keyboard: Enter or Space on a focused message opens its menu,
     so the menu is fully usable on desktop without a mouse. */
  if((e.key==='Enter'||e.key===' ') && e.target && e.target.classList && e.target.classList.contains('msg')){
    e.preventDefault(); openMsgMenuFor(e.target);
  }
});
document.addEventListener('scroll',function(e){
  if(msgMenu.classList.contains('show') && e.target && e.target.closest && e.target.closest('#chatScroll,.pane-scroll,.sb-scroll,.set-scroll')) closeMsgMenu();
},true);
/* =============== Swipe to reply ===============
   Swiping a message RIGHT (mobile touch or desktop mouse drag) replies
   to that exact message: the reply bar arms above the composer and the
   message is quoted in the next send — the same Reply the message menu
   offers. The message follows the finger a little as feedback, then
   snaps back. Direction lock keeps vertical scrolling untouched, a
   leftward swipe keeps its existing job (opening the chats menu in the
   message area), and the click that ends the swipe is suppressed so
   the message menu never pops open on top of the reply. */
(function(){
  var g=null;
  function begin(t,x,y){
    if(!t || !t.closest) { g=null; return; }
    if(t.closest('#sidebar,#settingsView,.sheet,.menu-pop,#composerZone,header,button,a,input,textarea,select,.codeblock pre')) { g=null; return; }
    var m=t.closest('.msg[data-msg-id]');
    g=m? {el:m, x:x, y:y, locked:null, fired:false} : null;
  }
  function fireReply(){
    if(!g) return;
    var msgEl=g.el, id=msgEl.getAttribute('data-msg-id'), cid=msgEl.getAttribute('data-chat-id');
    var chat=chatById(cid), m=findMsg(chat,id);
    if(!m){ for(var i=0;i<chats.length && !m;i++){ var f=findMsg(chats[i],id); if(f){ chat=chats[i]; m=f; } } }
    g.fired=true;
    msgEl.style.transition='transform .22s cubic-bezier(.32,.72,0,1)'; msgEl.style.transform='';
    msgTapClear(); closeMsgMenu();
    window.__axoSuppressMsgClick=Date.now()+500;
    if(!m || !chat) return;
    state.replyTo={chatId:chat.id, msgId:m.id, role:m.role, text:msgFullText(m).replace(/\s+/g,' ').slice(0,140)};
    renderReplyBar(); input.focus();
    toast('Replying — type your answer');
  }
  function drag(x,y){
    if(!g || g.fired) return;
    var dx=x-g.x, dy=y-g.y;
    if(!g.locked){
      if(Math.abs(dy)>10 && Math.abs(dy)>=Math.abs(dx)) g.locked='v';
      else if(dx>14 && Math.abs(dx)>Math.abs(dy)*1.5) g.locked='h';
    }
    if(g.locked==='h'){
      msgTapClear();
      g.el.style.transition='none';
      g.el.style.transform='translateX('+Math.min(72, Math.max(0, dx*0.55))+'px)';
      if(dx>=72) fireReply();
    }
  }
  function finish(){
    if(g && g.el && !g.fired){ g.el.style.transition='transform .22s cubic-bezier(.32,.72,0,1)'; g.el.style.transform=''; }
    g=null;
  }
  document.addEventListener('touchstart',function(e){ var t=e.touches[0]; if(t) begin(e.target,t.clientX,t.clientY); },{passive:true});
  document.addEventListener('touchmove',function(e){ var t=e.touches[0]; if(t) drag(t.clientX,t.clientY); },{passive:true});
  document.addEventListener('touchend',finish,{passive:true});
  document.addEventListener('touchcancel',finish,{passive:true});
  document.addEventListener('pointerdown',function(e){ if(e.pointerType==='touch') return; begin(e.target,e.clientX,e.clientY); },{passive:true});
  document.addEventListener('pointermove',function(e){ if(e.pointerType==='touch') return; if(e.buttons) drag(e.clientX,e.clientY); },{passive:true});
  document.addEventListener('pointerup',function(e){ if(e.pointerType==='touch') return; finish(); },{passive:true});
  document.addEventListener('pointercancel',function(e){ if(e.pointerType==='touch') return; finish(); },{passive:true});
})();
/* =============== AI reactions ===============
   Instructions for the AI (built in): you may react to a user message
   with ONE emoji from the reaction set below — casually, sparingly,
   and only when it genuinely fits that message's mood (a joke, good
   news, affection, sadness, a celebration). Never react to plain
   questions, technical or study messages, commands, or link/file-only
   messages, and never react to every message or twice in a row in the
   same chat. The reaction appears as a small badge on the user's own
   message. When a provider model is connected, the same instructions
   are sent with the request and its chosen reaction is honoured.
   The set is segmented by grapheme so the ZWJ emojis stay intact. */
var REACTION_SRC='🫠🥶🫶😂😶‍🌫️🥹😅😭✨🫴💋😘😳🙂‍↔️🔥💦🌝☠️😚🎀🎉🕺😮🤍😍🥰🥲🫢😑😐🤨🫡🤔🫣😶🫥😏🙄😮‍💨😪😔🤢🤮🤕😷😴🥵🥶🥸😎🧐🫤🙁💩💗😿🙀👿😈👾👻🙊🙉🙈';
var REACTION_EMOJIS=(function(){
  var fallback=['😂','🥰','🔥','🎉','🤔','😴','🫠','✨','🫶','🤍','😅','🥹','😔','🤕','☠️','😍','😘','😎','💗','🕺'];
  try{
    var seg=new Intl.Segmenter('en',{granularity:'grapheme'}), out=[], seen={};
    Array.prototype.forEach.call(seg.segment(REACTION_SRC),function(s){ if(!seen[s.segment]){ seen[s.segment]=1; out.push(s.segment); } });
    return out.length>20? out : fallback;
  }catch(e){ return fallback; }
})();
var REACTION_SET={}; REACTION_EMOJIS.forEach(function(e){ REACTION_SET[e]=1; });
var REACTION_INSTRUCTION='Reactions: you may react to the user\u2019s last message with ONE emoji from this set only: '+REACTION_SRC+'. Do it sparingly and casually — only when it genuinely fits the mood (a joke, good news, affection, sadness), never for plain questions and never on every message. To react, begin your reply with exactly "REACT: <emoji>" on its own line, then your reply. If no reaction fits, begin with "REACT: none".';
function pickReaction(text){
  var t=(text||'').trim(), low=t.toLowerCase();
  if(!t || t.charAt(0)==='/' || t.length<2) return '';
  var pick='';
  if(/(haha|lol\b|lmao|rofl|funny|hilarious)/.test(low) || t.indexOf('😂')>=0) pick='😂';
  else if(/(good night|sleepy|so tired|going to sleep|gn\b)/.test(low)) pick='😴';
  else if(/(fever|sick|vomit|headache|not well|unwell|in pain)/.test(low)) pick='🤕';
  else if(/(i am sad|i'm sad|feeling sad|crying|lonely|heartbroken|miss you|miss u\b)/.test(low)) pick='🥹';
  else if(/(love you|love u\b|my love|darling|cute|beautiful|gorgeous)/.test(low)) pick='🥰';
  else if(/(thank|thanks|thx)/.test(low)) pick='🫶';
  else if(/(passed|cleared the|won\b|success|selected|got the job|finished|completed|birthday|anniversary|placed first)/.test(low)) pick='🎉';
  else if(/(wow|amazing|awesome|incredible|damn|🔥)/.test(low)) pick='🔥';
  else if(/(confused|idk|don't understand|dont understand|hmm+\b)/.test(low)) pick='🤔';
  else if(/(hehe|silly|goofy|crazy me|🫠)/.test(low)) pick='🫠';
  else if(/(great|nice one|cool|good job|well done|perfect)/.test(low)) pick='✨';
  else if(/^(hi+|hello|hey+|good morning|good evening)\b/.test(low) && t.length<26) pick='🤍';
  if(!pick || !REACTION_SET[pick]) return '';
  /* Sparingly: even a fitting reaction lands only about half the time. */
  if(Math.random()>0.55) return '';
  return pick;
}
function scheduleReaction(chat, m){
  if(!m || m.role!=='user' || m.reaction) return;
  var pick=pickReaction(m.text);
  if(!pick) return;
  /* Never twice in a row in the same chat. */
  var idx=chat.messages.indexOf(m), prevUser=null;
  for(var i=idx-1;i>=0;i--){ if(chat.messages[i].role==='user'){ prevUser=chat.messages[i]; break; } }
  if(prevUser && prevUser.reaction) return;
  setTimeout(function(){ if(!m.reaction){ m.reaction=pick; if(state.view==='chat') renderAll(); } }, 650+Math.random()*700);
}
/* =============== Memory system ===============
   Automatic, local to this app, and unlimited: everything you say in
   ANY chat is saved to memory (no cap on entries), and before every
   reply the saved memory is searched by the incoming message's
   keywords — the reply is then built using the related memories
   found. Memory NEVER holds keys, secrets, emails or phone numbers:
   every note passes the sanitiser below before it is stored, and
   anything that looks like a credential value is removed, not kept. */
var MEM=[];
/* Memory pool for the current conversation: the shared MEM for every
   agent by default, or the chat agent's own private memory when that
   agent has individual memory turned on in its Agent page. */
function memoryPool(){ var a=(typeof chatAgent==='function')? chatAgent() : null; return (a && a.individualMemory && a.privateMem)? a.privateMem : MEM; }
var MEM_STOP={'the':1,'and':1,'for':1,'you':1,'your':1,'this':1,'that':1,'with':1,'from':1,'are':1,'was':1,'what':1,'when':1,'how':1,'can':1,'will':1,'have':1,'has':1,'had':1,'not':1,'but':1,'all':1,'any':1,'its':1,'it':1,'in':1,'on':1,'of':1,'to':1,'a':1,'an':1,'is':1,'me':1,'my':1,'i':1};
function memorySanitize(t){
  var s=String(t||'');
  s=s.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g,'[email removed]');
  s=s.replace(/\+?\d(?:[\s-]?\d){8,}/g,'[number removed]');
  s=s.replace(/(api[_-]?key|secret|password|passwd|token|bearer)\s*[:=]?\s*\S+/gi,'$1 [secret removed]');
  s=s.replace(/\b(sk-[A-Za-z0-9_-]{6,}|ghp_[A-Za-z0-9]{6,}|AKIA[A-Z0-9]{6,}|[A-Za-z0-9_-]{28,})\b/g,'[secret removed]');
  return s.replace(/\s+/g,' ').trim();
}
function memoryKeywords(t){
  var seen={}, out=[];
  String(t||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).forEach(function(w){
    if(w.length>2 && !MEM_STOP[w] && !seen[w]){ seen[w]=1; out.push(w); }
  });
  return out;
}
function saveMemory(chat, m){
  if(!m || m.role!=='user') return;
  var clean=memorySanitize(m.text||'');
  var extra=[];
  if(m.links) m.links.forEach(function(e){ extra.push(e.domain+' '+e.url); });
  if(m.attachments) m.attachments.forEach(function(a){ extra.push(typeof a==='string'?a:(a.name||'')); });
  var full=(clean+' '+extra.join(' ')).trim();
  if(!full) return;
  var pool=memoryPool();
  for(var i=0;i<pool.length;i++){ if(pool[i].chatId===chat.id && pool[i].msgId===m.id) return; }
  pool.push({id:'mem'+(++uid), msgId:m.id, chatId:chat.id, chatTitle:chat.title, text:full, keys:memoryKeywords(full), ts:Date.now()});
}
function searchMemory(query){
  var qk=memoryKeywords(query), ql=String(query||'').toLowerCase();
  if(!qk.length) return [];
  var scored=[];
  memoryPool().forEach(function(e){
    var score=0;
    qk.forEach(function(w){
      if(e.keys.indexOf(w)>=0) score+=2;
      else if(e.text.toLowerCase().indexOf(w)>=0) score+=1;
    });
    if(ql.length>3 && e.text.toLowerCase().indexOf(ql)>=0) score+=3;
    if(score>0) scored.push({e:e, score:score});
  });
  scored.sort(function(a,b){ return b.score-a.score || b.e.ts-a.e.ts; });
  return scored.slice(0,5).map(function(s){ return s.e; });
}
function memoryContextText(hits){
  if(!hits || !hits.length) return '';
  return hits.map(function(e){ return '• ('+e.chatTitle+') '+e.text; }).join('\n');
}
/* =============== User-added skills ===============
   get-more-perspectives, match-my-writing-style and focus-my-energy.
   Each runs for real in the local engine below, following the full
   instructions stored in SKILL_DEFS; with a provider key connected
   the same instructions are sent as a system message instead. */
/* ---- get-more-perspectives ---- */
function defaultPanel(){
  return [
    {name:'Operator', label:'OPERATOR', icon:'🔧', focus:'execution'},
    {name:'Skeptic', label:'SKEPTIC', icon:'⚠️', focus:'risk and downside'},
    {name:'Visionary', label:'VISIONARY', icon:'🚀', focus:'opportunity and upside'},
    {name:'Customer Advocate', label:'CUSTOMER', icon:'👤', focus:'the end user'},
    {name:'Finance Mind', label:'FINANCE', icon:'💰', focus:'money and ROI'}
  ];
}
function ensurePanel(){ if(!state.panel) state.panel=defaultPanel(); return state.panel; }
function advisorFocusFor(name){
  var n=name.toLowerCase();
  if(n.indexOf('legal')>=0) return 'regulatory risk, compliance, and liability';
  if(n.indexOf('architect')>=0||n.indexOf('technical')>=0) return 'systems design, scalability, and technical debt';
  if(n.indexOf('marketing')>=0) return 'brand, positioning, and go-to-market';
  if(n.indexOf('pragmatist')>=0) return 'practical, incremental thinking';
  if(n.indexOf('operator')>=0) return 'execution';
  if(n.indexOf('skeptic')>=0) return 'risk and downside';
  if(n.indexOf('visionary')>=0) return 'opportunity and upside';
  if(n.indexOf('customer')>=0) return 'the end user';
  if(n.indexOf('finance')>=0||n.indexOf('money')>=0) return 'money and ROI';
  return 'their own distinct angle on the decision';
}
function panelRosterText(){
  var p=ensurePanel();
  return 'Your panel ('+p.length+'):\n'+p.map(function(a){ return a.icon+' The '+a.name+' — focused on '+a.focus; }).join('\n')
    +'\n\nSay "add a Legal advisor to my panel", "replace the Visionary with a Pragmatist", or "remove the Skeptic" to customise it — your panel persists for the whole session.';
}
function advisorTake(a, decision){
  var d=decision.replace(/\s+/g,' ').trim(), low=d.toLowerCase();
  var shortD=d.length>90? d.slice(0,90)+'…' : d;
  switch(a.focus){
    case 'execution': return {vote:'conditional', text:'Yes, with conditions. "'+shortD+'" sounds clean in theory — here is what happens when it hits reality: the first step takes longer than planned and everything queued behind it slips. Start with the smallest version that proves it can actually be done, sequence the rest behind that proof, and it earns a yes.'};
    case 'risk and downside': return {vote:'no', text:'No — not yet. Everyone is excited about the upside and nobody has priced the worst case: if this goes wrong, what does it cost, and is it reversible? Test the weakest assumption cheaply first; until then, enthusiasm is doing the analysis.'};
    case 'opportunity and upside': return {vote:'yes', text:'Yes. You are thinking too small — the real question is what this unlocks in 2–3 years if it works, and that best case is much bigger than the current framing. Move while the window is open; a cautious version of a bold move usually gets neither safety nor upside.'};
    case 'the end user': return {vote:'conditional', text:'Yes, with conditions. Have you actually talked to the person this is for? It only works if it solves a real problem they already feel — not an imagined one. Validate that with two or three real users before committing fully, and it has my vote.'};
    case 'money and ROI': return {vote:'conditional', text:'Yes, with conditions — show me the numbers first. What does it cost in money and in time, what is the expected return, and what does it do to cash flow and runway while you wait for that return? If the payback is clear and the downside is capped, the money says go.'};
    default: return {vote:'conditional', text:'Yes, with conditions — judged through '+a.focus+': that lens is where this decision will quietly be won or lost, and it has not been examined hard enough yet. Pressure-test it from that angle before committing, and watch for the cost that only shows up late.'};
  }
}
function isSmallDecision(low){
  /* Only genuinely trivial either/or choices skip the panel — an
     everyday item, a short message, and no build / business / money
     weight behind it. "Build our own analytics or buy a tool?" is a
     real panel decision, never a small one. */
  if(/(build|buy a|tool|analytics|business|invest|loan|job|hire|quit|raise|software|app|website|series [a-c]\b)/.test(low)) return false;
  return /(tea or coffee|coffee or tea|which pen|which pencil|shirt (colour|color)|wallpaper|playlist|what (movie|film|snack))/.test(low)
    || (low.length<60 && /( or )/.test(low) && /(tea|coffee|pen|pencil|shirt|t-shirt|shoes|snack|lunch|dinner|movie|film|breakfast)/.test(low));
}
function panelReview(decision){
  var panel=ensurePanel(), low=decision.toLowerCase();
  if(isSmallDecision(low)) return 'This doesn\u2019t need a panel meeting. Just do it — pick the option you leaned toward first; the cost of being wrong here is basically zero, and the panel\u2019s time is worth more than this decision.';
  var takes=panel.map(function(a){ var t=advisorTake(a, decision); return {a:a, vote:t.vote, text:t.text}; });
  var yes=takes.filter(function(t){return t.vote==='yes';}).length,
      no=takes.filter(function(t){return t.vote==='no';}).length,
      cond=takes.length-yes-no;
  var frame=decision.replace(/\s+/g,' ').trim().replace(/[?.!]+$/,'');
  var verdict = no>yes+cond ? 'Hold off for now' : (yes>0 && cond>=no ? 'Proceed — with the conditions below locked in first' : 'Proceed carefully, conditions first');
  var keyCond='The weakest assumption must be tested cheaply before full commitment.';
  var sk=takes.filter(function(t){return t.a.focus==='money and ROI';})[0], op=takes.filter(function(t){return t.a.focus==='execution';})[0];
  if(op && cond>0) keyCond='The smallest provable first step must work before the rest is sequenced behind it.';
  if(/(buy|tool|subscription|price|cost)/.test(low)) keyCond='Any bought option must be verified against your core standards (privacy, fit, real need) before paying.';
  /* Weight by relevance */
  var weightNote='';
  if(/(build|code|app|software|system|technical|website|feature)/.test(low)) weightNote='On this decision, the Operator\u2019s view carries the most weight — it is an execution question first.';
  else if(/(sell|customer|user|launch|market|product|price)/.test(low)) weightNote='On this decision, the Customer Advocate and Finance Mind carry the most weight — it lives or dies on real demand and the numbers.';
  else if(/(invest|raise|money|budget|loan|fund)/.test(low)) weightNote='On this decision, the Finance Mind and the Skeptic carry the most weight — money and downside decide this one.';
  else weightNote='On this decision, the Operator\u2019s view carries the most weight.';
  var out='🏛️ PANEL REVIEW: '+frame+'\n\n📋 EXEC SUMMARY & PANEL RECOMMENDATION:\nVote: '+yes+' yes, '+no+' no, '+cond+' yes-with-conditions\nConsensus: '+verdict+'. The panel is split, and the split itself is the signal: upside is real, but execution and downside have not been priced in yet.\nKey condition: '+keyCond+'\n\n---\n\n'
    + takes.map(function(t){ return t.a.icon+' '+t.a.label+': '+t.text; }).join('\n');
  var hasSk=takes.some(function(t){return t.a.focus==='risk and downside';}), hasVi=takes.some(function(t){return t.a.focus==='opportunity and upside';});
  if(hasSk && hasVi) out+='\n\nFault line: The Skeptic\u2019s concern about downside directly challenges the Visionary\u2019s growth assumption — resolve that tension and the decision makes itself.';
  if(yes===takes.length || no===takes.length) out+='\n\nRare unanimous agreement — either this is clearly right, or the panel has a blind spot.';
  out+='\n'+weightNote;
  return out;
}
function panelSkillReply(text){
  var t=(text||'').trim(), low=t.toLowerCase();
  ensurePanel();
  if(!t || low==='show me my panel' || low==='show my panel' || low.indexOf('who is on my panel')>=0 || low.indexOf('who\u2019s on my panel')>=0) {
    if(!t) return 'Convene the panel by giving me a decision, strategy or dilemma — for example "Should we build our own analytics or buy a tool?"\n\n'+panelRosterText();
    return panelRosterText();
  }
  var m;
  if(m=low.match(/add (?:a |an )?(.+?) advisor/)) { var nm=m[1].trim().replace(/\b\w/g,function(c){return c.toUpperCase();}); if(!state.panel.some(function(a){return a.name.toLowerCase()===nm.toLowerCase();})) state.panel.push({name:nm, label:nm.toUpperCase(), icon:'🧭', focus:advisorFocusFor(nm)}); state.panelCustomised=true; return 'Added the '+nm+' advisor — focused on '+advisorFocusFor(nm)+'.\n\n'+panelRosterText(); }
  if(m=low.match(/add (.+?) to my panel/)) { var nm2=m[1].trim().replace(/\b\w/g,function(c){return c.toUpperCase();}); if(!state.panel.some(function(a){return a.name.toLowerCase()===nm2.toLowerCase();})) state.panel.push({name:nm2, label:nm2.toUpperCase(), icon:'🧭', focus:advisorFocusFor(nm2)}); state.panelCustomised=true; return 'Added the '+nm2+'.\n\n'+panelRosterText(); }
  if(m=low.match(/replace (?:the )?(.+?) with (?:a |an )?(.+)$/)) { var oldN=m[1].trim(), newN=m[2].trim().replace(/\b\w/g,function(c){return c.toUpperCase();}); var ix=-1; state.panel.forEach(function(a,i){ if(a.name.toLowerCase().indexOf(oldN)>=0) ix=i; }); if(ix>=0){ state.panel[ix]={name:newN, label:newN.toUpperCase(), icon:'🧭', focus:advisorFocusFor(newN)}; state.panelCustomised=true; return 'Replaced the '+oldN+' with the '+newN+' — the panel\u2019s centre of gravity just shifted.\n\n'+panelRosterText(); } return 'I couldn\u2019t find a "'+oldN+'" advisor on your panel.\n\n'+panelRosterText(); }
  if(m=low.match(/remove (?:the )?(.+?)( advisor)?$/)) { var rn=m[1].trim(); var before=state.panel.length; state.panel=state.panel.filter(function(a){ return a.name.toLowerCase().indexOf(rn)<0; }); if(state.panel.length<before){ state.panelCustomised=true; return 'Removed.\n\n'+panelRosterText(); } }
  if(low.indexOf('more aggressive')>=0){ state.panel.forEach(function(a){ if(a.focus==='risk and downside') a.focus='risk and downside (aggressive — tolerates bigger bets)'; }); state.panelCustomised=true; return 'Done — the whole panel just shifted toward higher risk tolerance. The Skeptic still argues, but accepts bigger bets.\n\n'+panelRosterText(); }
  return panelReview(t);
}
/* ---- match-my-writing-style ---- */
function userSamples(){
  var out=[];
  chats.forEach(function(c){ c.messages.forEach(function(m){
    if(m.role!=='user') return; var t=(m.text||'').trim();
    if(t.length<3 || t.charAt(0)==='/') return;
    if(/^(hi|hey|hello|ok|okay|yes|no|thanks|thank you)$/i.test(t)) return;
    out.push(t);
  }); });
  return out;
}
function buildVoiceCard(pasted){
  var samples=userSamples().concat(pasted||[]);
  var card={greeting:'Jumps straight to the point, or a short "Hey [Name],"', signOff:'"Thanks," or no sign-off on quick messages', rhythm:'Short, direct sentences; 1–2 sentence paragraphs', vocab:'Natural contractions, plain diction, no corporate filler', punct:'Em dashes to connect clauses; few exclamation marks', avoided:'"delve", "tapestry", "synergy", "thrilled to announce", "I hope this finds you well"', sources:(pasted&&pasted.length)?'Local chat samples, Pasted samples':'Local chat samples', count:samples.length};
  if(samples.length){
    var hey=0, hi=0, thanks=0, contr=0, words=0, excl=0, dash=0, lower=0;
    samples.forEach(function(s){
      if(/^hey\b/i.test(s)) hey++; if(/^hi\b/i.test(s)) hi++;
      if(/(thanks|thank you)[,.!]?\s*$/i.test(s)) thanks++;
      if(/\b\w+['’](t|s|re|ve|ll|d)\b/i.test(s)) contr++;
      if(/!$/.test(s.trim())) excl++; if(/—|--/.test(s)) dash++;
      if(/^[a-z]/.test(s)) lower++;
      words+=s.split(/\s+/).length;
    });
    var avg=Math.round(words/Math.max(1,samples.length));
    if(hey>hi && hey>0) card.greeting='Opens with "Hey [Name],"';
    else if(hi>0) card.greeting='Opens with "Hi [Name],"';
    if(thanks>0) card.signOff='Signs off with "Thanks,"';
    card.rhythm=(avg<=14?'Short punchy bursts — about ':'Layered but plain — about ')+avg+' words per message on average';
    card.vocab=(contr>0?'Uses contractions naturally ("don\u2019t", "I\u2019m")':'Few contractions — fairly formal diction')+', plain words over jargon';
    card.punct=(dash>0?'Em dashes show up':'Rarely uses em dashes')+(excl>0?'; occasional exclamation marks':'; almost no exclamation marks')+(lower>0?'; sometimes lowercase in quick chat':'');
  }
  state.voiceCard=card; return card;
}
function voiceSnapshot(card){
  return '\n\n---\n\n**Voice matched ('+card.sources+'):**\n- **Register used:** matched to the channel you asked for\n- **Openings & sign-offs:** '+card.greeting+'; '+card.signOff+'\n- **Rhythm & mechanics:** '+card.rhythm+'; '+card.vocab+'\n- **Avoided/banned phrasing:** '+card.avoided+'\n\nWant me to tweak anything in your Voice Card, or add words to your "never use" list? (This app learns only from your messages here and samples you paste — it never scans Gmail or Drive.)';
}
function voiceCardFull(card){
  return '**Your Voice Card · Sources used: '+card.sources+'**\n\n**Core Voice Profile:**\n- **Sentence & Paragraph Rhythm:** '+card.rhythm+'\n- **Vocabulary & Contractions:** '+card.vocab+'\n- **Signature Openings & Closings:** '+card.greeting+'; '+card.signOff+'\n- **Punctuation & Formatting Quirks:** '+card.punct+'\n\n**Channel Registers:**\n- **Email (External / Leadership):** Same direct openings, full sentences, sign-off kept.\n- **Email / Messages (Team & Peers):** Shorter, straight to the point, sign-off often dropped.\n- **Long-Form / Docs:** Same rhythm stretched into short paragraphs with clear lead-ins.\n\n**Guardrails:**\n- **Signature Phrases to Keep:** your own greetings and transitions, as sampled\n- **Words to Avoid:** '+card.avoided+'\n\nWhat would you like to draft first?';
}
function makeDraft(task, card){
  var t=task.trim();
  var rw=t.match(/rewrite[:\s]+([\s\S]+)/i);
  if(rw) return rw[1].trim();
  var toM=t.match(/\bto\s+([A-Z][a-z]+)\b/), name=toM? toM[1] : null;
  var greet=/^Opens with "Hey/.test(card.greeting)? 'Hey ' : (/^Opens with "Hi/.test(card.greeting)? 'Hi ' : '');
  var greeting=greet? (greet+(name||'there')+',') : (name? 'Hey '+name+',' : 'Hey there,');
  var isEmail=/e-?mail/i.test(t);
  var aboutM=t.match(/(?:asking|ask)\s+(?:to|about|if)\s+([^.;]+)/i) || t.match(/\bthat\s+([^.;]+)/i) || t.match(/\babout\s+([^.;]+)/i);
  var topic=aboutM? aboutM[1].trim() : t.replace(/^(help me )?(write|draft|compose|reply to|send)\b[^:]*?(?=\bto\b)/i,'').trim();
  topic=topic.replace(/\s+/g,' ');
  var body='Quick one — '+ (topic? (topic.charAt(0).toLowerCase()+topic.slice(1)) : 'wanted to check in on this') + (topic && !/[?.!]$/.test(topic)? '.' : '');
  var draft=(isEmail? 'Subject: '+(topic? topic.charAt(0).toUpperCase()+topic.slice(1).replace(/[?.!]$/,'') : 'Quick note')+'\n\n' : '')+greeting+'\n\n'+body+'\n\nJust let me know what you need from my end.\n\n'+(/Thanks/.test(card.signOff)? 'Thanks,' : '—');
  return draft;
}
function writingSkillReply(text){
  var t=(text||'').trim(), low=t.toLowerCase();
  var sm=t.match(/samples?\s*[:\-]\s*([\s\S]+)/i);
  if(sm){ var pasted=sm[1].split(/\n+/).map(function(s){return s.trim();}).filter(Boolean); var c2=buildVoiceCard(pasted); state.voiceSnapshotShown=true; return 'Voice Card updated from the samples you pasted — those are yours, so they count; incoming mail never does.\n\n'+voiceCardFull(c2); }
  if(!t || low==='match my writing style' || low==='build my voice card' || low==='@match_my_writing_style' || low==='show my voice card' || low==='my voice card'){
    var card=buildVoiceCard([]);
    state.voiceSnapshotShown=true;
    return voiceCardFull(card)+'\n\nBuilt only from your own writing in this app ('+card.count+' sample'+(card.count===1?'':'s')+') — this local app does not scan Gmail or Drive, and it never mimics incoming mail.';
  }
  var card=state.voiceCard||buildVoiceCard([]);
  var draft=makeDraft(t, card);
  var out=draft;
  if(!state.voiceSnapshotShown){ out+=voiceSnapshot(card); state.voiceSnapshotShown=true; }
  else if(/(linkedin|tweet|post|instagram|caption)/i.test(low)) out+='\n\nNote: that format isn\u2019t in your samples here, so I adapted your core rhythm and vocabulary to it.';
  return out;
}
/* ---- focus-my-energy ---- */
function classifyTask(t){
  var low=t.toLowerCase();
  if(/(write|draft .* from scratch|design|architect|strateg|build|code|debug|develop|create|study|learn|exam|problem|analyse|analyze|plan the|research deeply)/.test(low)) return 'deep';
  if(/(review|edit|reply|respond|prepare|plan|read|summary|summarise|summarize|meeting notes|feedback)/.test(low)) return 'steady';
  if(/(fil(e|ing)|schedul|book|data entry|inbox|clean|rename|sort|organise|organize|admin|update the list|simple reply)/.test(low)) return 'low';
  return 'steady';
}
var TIER_ICON={deep:'🔴', steady:'🟡', low:'🟢'};
var TIER_NAME={deep:'Deep Work', steady:'Steady Work', low:'Low Drain'};
function detectEnergy(text){
  var low=(text||'').toLowerCase();
  if(/(fried|brain dead|exhausted|so tired|very tired|low energy|drained|wiped)/.test(low)) return 'fried';
  if(/(sharp|high energy|feeling fresh|productive|energetic|in flow)/.test(low)) return 'sharp';
  if(/(steady|okay|fine|normal|alright)/.test(low)) return 'steady';
  return null;
}
function parseEnergyProfile(text){
  var low=text.toLowerCase(); if(low.indexOf('profile')<0 && !/(peak|dip window|chronotype)/.test(low)) return false;
  function grab(re){ var m=text.match(re); return m? m[1].trim() : null; }
  var p=state.energyProfile||{};
  var v;
  if(v=grab(/peak(?: hours)?\s*[:\-]\s*([^\n.;]+)/i)) p.peak=v;
  if(v=grab(/dip(?: window)?\s*[:\-]\s*([^\n.;]+)/i)) p.dip=v;
  if(v=grab(/second wind\s*[:\-]\s*([^\n.;]+)/i)) p.secondWind=v;
  if(v=grab(/(?:energy )?drains?\s*[:\-]\s*([^\n.;]+)/i)) p.drains=v;
  if(v=grab(/(?:energy )?boosts?\s*[:\-]\s*([^\n.;]+)/i)) p.boosts=v;
  if(v=grab(/weekly(?: pattern)?\s*[:\-]\s*([^\n.;]+)/i)) p.weekly=v;
  if(v=grab(/chronotype\s*[:\-]\s*([^\n.;]+)/i)) p.chronotype=v;
  if(/night owl/.test(low)) p.chronotype='night owl';
  if(/morning person/.test(low)) p.chronotype='morning person';
  if(!Object.keys(p).length) return false;
  state.energyProfile=p; return true;
}
function energySkillReply(text){
  var t=(text||'').trim(), low=t.toLowerCase();
  if(parseEnergyProfile(t) && (low.indexOf('profile')>=0 || Object.keys(state.energyProfile||{}).length>1)){
    var p=state.energyProfile;
    return 'Energy profile saved — I\u2019ll use it as a baseline, and what you tell me in the moment always overrides it.\n\n🔋 MY ENERGY PROFILE\nPEAK HOURS: '+(p.peak||'—')+'\nDIP WINDOW: '+(p.dip||'—')+'\nSECOND WIND: '+(p.secondWind||'—')+'\nENERGY DRAINS: '+(p.drains||'—')+'\nENERGY BOOSTS: '+(p.boosts||'—')+'\nWEEKLY PATTERN: '+(p.weekly||'—')+'\nCHRONOTYPE: '+(p.chronotype||'—')+'\n\nHow are you feeling right now — sharp, steady, or fried? And what\u2019s on your list?';
  }
  var energy=detectEnergy(t);
  if(/meeting/.test(low) && energy==='fried'){ state.energyNotes.push('fried after meetings'); }
  if(/context.?switch/.test(low) && energy==='fried'){ state.energyNotes.push('fried after context-switching'); }
  /* Pull candidate tasks out of the message: split on lines,
     semicolons, bullets and commas, then drop the parts that are
     questions or energy statements rather than tasks. */
  var tasks=[];
  var srcT=t, colonM=t.match(/tasks?\s*:/i);
  if(colonM) srcT=t.slice(t.indexOf(colonM[0])+colonM[0].length);
  srcT.split(/\n|;|•/).forEach(function(seg){
    seg.split(/, (?=[a-z])/).forEach(function(part){
      var s=part.replace(/^[-*\d.)\s]+/,'').trim();
      if(s.length<4) return;
      if(/^(what should|what do i|i\u2019m |i am |feeling|how are|my tasks?|tasks?|here\u2019s my|here is my)/i.test(s)) return;
      if(detectEnergy(s) && s.split(/\s+/).length<=5) return;
      if(/sharp, steady, or fried/.test(s.toLowerCase())) return;
      tasks.push(s);
    });
  });
  var deadlineTask=null;
  tasks.forEach(function(x){ if(/(due today|deadline|today\b.*\bdue\b|submit today)/i.test(x)) deadlineTask=x; });
  if(!energy && state.energyProfile){
    var h=new Date().getHours();
    if(state.energyProfile.dip && hourInWindow(h, state.energyProfile.dip)) energy='steady';
    else if(state.energyProfile.peak && hourInWindow(h, state.energyProfile.peak)) energy='sharp';
  }
  if(!tasks.length && !energy){
    var ask='How are you feeling right now — sharp, steady, or fried? Tell me that plus your task list, and I\u2019ll match them: 🔴 Deep Work, 🟡 Steady Work, 🟢 Low Drain.';
    if(!state.energyProfile && !state.energyOffered){ state.energyOffered=true; ask+='\n\nWant to set up your energy profile? Tell me your natural rhythms — peak hours, dip window, second wind, drains, boosts, weekly pattern, chronotype — and I\u2019ll use them as a baseline instead of guessing. It\u2019s one-time and fully optional.'; }
    else if(!state.energyProfile) ask+='\n\n(Energy profile is still optional — say "energy profile" any time to set one up.)';
    return ask;
  }
  if(!tasks.length){
    state.lastEnergy=energy;
    return '⚡ You said you\u2019re '+energy+'.\n\nYou haven\u2019t given me any tasks, and I won\u2019t invent work. Drop your list here and I\u2019ll classify it — 🔴 Deep Work, 🟡 Steady Work, 🟢 Low Drain — and give you one clear DO NOW for a '+energy+' head.';
  }
  if(!energy){
    var hh=new Date().getHours();
    energy= hh<12 ? 'sharp' : (hh>=13 && hh<16 ? 'steady' : 'steady');
    var inferred='⚡ No self-report, so I\u2019m reading the time: it\u2019s '+new Date().toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})+', so I\u2019m treating you as \u2019'+energy+'\u2019. Your real-time self-report always wins — tell me if that\u2019s off.';
    return inferred+'\n\n'+energyPlan(tasks, energy, deadlineTask);
  }
  state.lastEnergy=energy;
  return '⚡ You said you\u2019re '+energy+'.\n'+energyPlan(tasks, energy, deadlineTask);
}
function hourInWindow(h, s){
  var nums=[], re=/(\d{1,2})(?::\d{2})?\s*(am|pm)?/gi, m;
  while((m=re.exec(String(s)))!==null){ var n=+m[1]; if(m[2]==='pm'&&n<12)n+=12; if(m[2]==='am'&&n===12)n=0; nums.push(n); }
  if(nums.length>=2) return h>=nums[0] && h<nums[1];
  return false;
}
function energyPlan(tasks, energy, deadlineTask){
  var cls=tasks.map(function(x){ return {t:x, tier:classifyTask(x)}; });
  var classified='Your list, classified:\n'+cls.map(function(c){ return TIER_ICON[c.tier]+' '+c.t+' — '+TIER_NAME[c.tier]; }).join('\n')+'\n\n';
  var doNow=null, why='';
  if(deadlineTask){ doNow=deadlineTask; why='it\u2019s due today'; }
  else if(energy==='sharp'){ doNow=(cls.filter(function(c){return c.tier==='deep';})[0]||cls[0]).t; why='it needs peak energy and you have it — do it before the energy fades'; }
  else if(energy==='steady'){ var s1=cls.filter(function(c){return c.tier==='steady';})[0]||cls.filter(function(c){return c.tier==='deep';})[0]||cls[0]; doNow=s1.t; why='it needs attention, not invention — a perfect match for steady energy'; }
  else { var l1=cls.filter(function(c){return c.tier==='low';})[0]||cls[0]; doNow=l1.t; why='it\u2019s low drain — good call knocking out the easy stuff while fried; protect tomorrow morning for the hard thing'; }
  var later=cls.filter(function(c){ return c.t!==doNow && ((energy==='fried'&&c.tier!=='low')||(energy==='steady'&&c.tier==='deep')); });
  var wins=cls.filter(function(c){ return c.t!==doNow && c.tier==='low' && !later.some(function(l){return l.t===c.t;}); });
  var out=classified;
  if(deadlineTask && doNow===deadlineTask && energy!=='sharp') out+='Normally I\u2019d save this for when you\u2019re sharper, but it\u2019s due today — that overrides energy matching. Here\u2019s how to make it easier: (1) open it and do the ugliest 10 minutes first, (2) then the mechanical middle, (3) then a quick final check. Momentum beats motivation on this one.\n\n';
  out+='DO NOW:\n- '+doNow+' — '+why;
  if(later.length) out+='\nSAVE FOR LATER:\n'+later.map(function(c){ return '- '+c.t+' — needs more energy than you have right now'; }).join('\n');
  if(wins.length) out+='\nQUICK WINS (if you want easy momentum):\n'+wins.map(function(c){ return '- '+c.t+' — 5 min, low effort'; }).join('\n');
  var meetNotes=state.energyNotes.filter(function(n){return n==='fried after meetings';}).length;
  if(meetNotes>=2) out+='\n\nPattern I\u2019ve noticed: you\u2019ve mentioned being fried after meetings '+meetNotes+' times now. Consider blocking 30 min after meeting-heavy mornings.';
  return out;
}
function skillReply(name, text){
  if(name==='get-more-perspectives') return panelSkillReply(text);
  if(name==='match-my-writing-style') return writingSkillReply(text);
  if(name==='focus-my-energy') return energySkillReply(text);
  return '';
}
var SKILL_COMMANDS={'/get-more-perspectives':'get-more-perspectives','/match-my-writing-style':'match-my-writing-style','/focus-my-energy':'focus-my-energy'};

/* =============== Reply engine =============== */
function localReply(text, memHits){
  var t=text.trim(), low=t.toLowerCase();
  if(state.skillOnce){ var sk=state.skillOnce; state.skillOnce=null; if(SKILL_DEFS[sk]) return skillReply(sk, t); return 'Applied the '+sk+' skill to this reply: I worked through "'+t+'" step by step, kept it to one clear result, and skipped anything the skill says not to invent.'; }
  if(low==='hi'||low==='hello'||low==='hey') return 'Hi. Good to see you — ask me anything, or type /help to see what I can do.';
  if(low.indexOf('normalisation')>=0||low.indexOf('normalization')>=0) return 'Normalisation, one line each:\n1NF: every cell holds one atomic value.\n2NF: no partial dependency on part of a composite key.\n3NF: no transitive dependency — non-key attributes depend only on the key.';
  if(state.route==='agent') return chatAgent().name+' ran this as steps:\n1. Read the request: "'+t+'"\n2. Picked the shortest path that answers it fully.\n3. Checked the result once before replying.\nDone — routing is back to automatic for your next message.';
  if(state.deepThink) return 'Thought it through first, then kept it short: "'+t+'" is noted, and the useful next step is to act on the smallest piece of it today rather than planning the whole thing at once.';
  var base='Here is a straight answer on "'+t+'": noted, kept inside this chat, and ready to go deeper — try /code for a buildable example, /search for live sources, or /skills for a specialist pass.';
  /* Related memory, found by keyword search before this reply, is
     actually used in the reply — quoted back so the connection is
     visible, never invented. */
  if(memHits && memHits.length){
    var top=memHits[0];
    base+='\n\nFrom your memory ('+top.chatTitle+'): "'+top.text.slice(0,160)+'" — I kept that in mind for this answer.';
    if(memHits.length>1) base+=' '+(memHits.length-1)+' more related '+(memHits.length===2?'note':'notes')+' matched too.';
  }
  return base;
}
function codeReply(text){
  var topic=(text||'').replace(/^\s*(build|make|create)\s+/i,'')||'a tap counter page';
  return { text:'Here is a starter page for "'+topic+'". Connect a strong model in the Model section and send the request again, and Gptopen will write the complete build for exactly what you asked. Play runs this starter here; Copy takes its code.', code:{lang:'html', body:'<!doctype html>\n<html>\n<body style="font-family:sans-serif;text-align:center;padding:40px">\n<h2 id="n">0</h2>\n<p>'+topic.replace(/</g,'')+'</p>\n<button onclick="n.textContent=+n.textContent+1">Tap</button>\n</body>\n</html>'} };
}
/* =============== Canvas mode ===============
   When the user says "write code in canvas" (any message naming
   canvas), or Canvas is switched on in the + sheet and the message
   asks to write/build something, the reply uses the canvas UI:
   intro line, "Building the application...", then a code card with
   the app title and a "Writing code..." status that flips to the
   finished result — the card plus the code block with Play/Copy. */
function canvasWanted(text){
  if(!text) return false;
  if(/\bcanvas\b/i.test(text)) return true;
  return !!state.canvasMode && /(write|build|create|make|code|design|draw|app|page|game|ui|website|tool)/i.test(text);
}
function canvasTitle(text){
  var t=(text||'')
    .replace(/\b(write|build|create|make|code|in|on|canvas|mode|please|a|an|the|me|ui|app|page)\b/gi,' ')
    .replace(/\s+/g,' ').trim();
  if(!t) return 'Untitled App';
  return t.split(' ').slice(0,5).map(function(w){ return w.charAt(0).toUpperCase()+w.slice(1); }).join(' ');
}
function fmtCanvasTs(ts){
  if(!ts) return '';
  var d=new Date(ts), mon=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  var hh=d.getHours(), ap=hh>=12?'PM':'AM'; hh=hh%12; if(hh===0) hh=12;
  var mm=d.getMinutes(); if(mm<10) mm='0'+mm;
  return mon+' '+d.getDate()+', '+hh+':'+mm+' '+ap;
}
function canvasCode(title){
  var safe=title.replace(/</g,'');
  return '<!doctype html>\n<html>\n<head><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+safe+'</title></head>\n'
    +'<body style="margin:0;font-family:sans-serif;background:#0b0b0c;color:#f5f5f7;text-align:center;padding:48px 20px">\n'
    +'<h1 style="font-size:26px;margin:0 0 10px">'+safe+'</h1>\n'
    +'<p style="color:#a1a1a6;margin:0 0 26px">Single-file app, built in canvas. Tap the button — it works.</p>\n'
    +'<div id="n" style="font-size:52px;font-weight:700;margin-bottom:18px">0</div>\n'
    +'<button onclick="n.textContent=+n.textContent+1" style="font-size:16px;padding:12px 26px;border:0;border-radius:999px;background:#fff;color:#0b0b0c">Tap</button>\n'
    +'</body>\n</html>';
}
function pushCanvasPending(chat, text){
  var title=canvasTitle(text);
  var m={id:mid(), role:'ai',
    text:'I will generate a single-file '+title+' with a clean, modern UI — smooth interactions, and touch and keyboard controls where they fit.',
    canvas:{title:title, status:'writing'}};
  chat.messages.push(m);
  renderAll();
  return m;
}
function discardCanvasPending(chat, m){
  if(!chat || !m) return;
  var ix=chat.messages.indexOf(m);
  if(ix>=0) chat.messages.splice(ix,1);
}
function pushCanvas(chat, text){
  var title=canvasTitle(text);
  var ty=pushTyping();
  setTimeout(function(){
    ty.remove();
    var m={id:mid(), role:'ai',
      text:'I will generate a single-file '+title+' with a clean, modern UI — smooth interactions, and touch and keyboard controls where they fit.',
      canvas:{title:title, status:'writing'}};
    chat.messages.push(m);
    renderAll();
    setTimeout(function(){
      m.canvas.status='done';
      m.canvas.ts=Date.now();
      m.code={lang:'html', body:canvasCode(title)};
      renderAll();
    }, 1700);
  }, 500);
}
/* =============== Full-screen canvas view =============== */
/* cvOpen is the ONLY thing that may show the canvas: it is set true
   solely by openCanvasFull() (a real user tap on a canvas card) and
   false by closeCanvasFull(). guardPreviewsClosed() re-asserts
   hidden on every keyboard / viewport change, so toggling the
   keyboard can never resurrect a stale canvas or code preview. */
var cvMsg=null, cvOpen=false;
function cvSlug(title){
  var s=String(title||'canvas').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  return s||'canvas-app';
}
function cvShowCode(show){
  $('#cvCodeWrap').hidden=!show;
  $('#cvFrame').style.display=show? 'none' : '';
  if(show){ $('#cvCode').value=cvMsg? cvMsg.code.body : ''; }
}
function openCanvasFull(m){
  if(!m || !m.code) return;
  cvOpen=true;
  cvMsg=m;
  $('#cvTitle').textContent=m.canvas? m.canvas.title : 'Canvas';
  $('#cvMenu').hidden=true;
  $('#cvDots').setAttribute('aria-expanded','false');
  cvShowCode(false);
  $('#cvFrame').srcdoc=m.code.body;
  cvCollapseComposer();
  $('#canvasView').hidden=false;
}
function closeCanvasFull(){
  cvOpen=false;
  $('#canvasView').hidden=true;
  $('#cvFrame').srcdoc='';
  $('#cvCodeWrap').hidden=true;
  $('#cvMenu').hidden=true;
  cvMsg=null;
}
function cvCollapseComposer(){
  $('#cvComposer').hidden=true;
  $('#cvFab').hidden=false;
}
$('#cvBack').innerHTML=I.back;
$('#cvDots').innerHTML=I.dotsH;
$('#cvFab').innerHTML=I.chat;
$('#cvSend').innerHTML=I.send;
$('#cvApply').innerHTML=I.check+'<span>Done</span>';
$('#cvBack').addEventListener('click',function(){
  /* In the code editor, back first returns to the running canvas;
     from the canvas itself it closes back to the chat. */
  if(!$('#cvCodeWrap').hidden){ cvShowCode(false); $('#cvFrame').srcdoc=cvMsg.code.body; return; }
  closeCanvasFull();
});
$('#cvDots').addEventListener('click',function(){
  var menu=$('#cvMenu'), open=menu.hidden;
  menu.hidden=!open;
  this.setAttribute('aria-expanded',String(open));
});
$('#cvMenu').querySelectorAll('[data-cv]').forEach(function(b){
  b.addEventListener('click',function(){
    var a=b.getAttribute('data-cv');
    $('#cvMenu').hidden=true;
    $('#cvDots').setAttribute('aria-expanded','false');
    if(!cvMsg || !cvMsg.code) return;
    if(a==='code'){ cvShowCode(true); }
    else if(a==='copy'){ copyText(cvMsg.code.body); }
    else if(a==='download'){
      var blob=new Blob([cvMsg.code.body],{type:'text/html'});
      var el=document.createElement('a');
      el.href=URL.createObjectURL(blob);
      el.download=cvSlug(cvMsg.canvas? cvMsg.canvas.title : 'canvas')+'.html';
      document.body.appendChild(el); el.click(); el.remove();
      setTimeout(function(){ URL.revokeObjectURL(el.href); }, 4000);
      toast('Downloading HTML');
    }
    else if(a==='artifact'){
      /* Make it artifact: the canvas is saved as a standalone HTML
         file in Agents files (workspace/), ready to view, edit and
         download like any other agent file. */
      var p='workspace/'+cvSlug(cvMsg.canvas? cvMsg.canvas.title : 'canvas')+'.html';
      var f=afFind(p);
      if(f) f.content=cvMsg.code.body;
      else AGENT_FILES.push({path:p, content:cvMsg.code.body});
      var mt=afMeta(p); mt.mod=++afSeq;
      toast('Saved as artifact — Agents files → '+p);
    }
  });
});
$('#cvCopy2').addEventListener('click',function(){ copyText($('#cvCode').value); });
$('#cvApply').addEventListener('click',function(){
  if(!cvMsg) return;
  cvMsg.code.body=$('#cvCode').value;
  cvShowCode(false);
  $('#cvFrame').srcdoc=cvMsg.code.body;
  renderAll();
  toast('Code updated — canvas reloaded');
});
$('#cvFab').addEventListener('click',function(){
  $('#cvFab').hidden=true;
  $('#cvComposer').hidden=false;
  $('#cvInput').focus();
});
function cvSendNow(){
  var inp=$('#cvInput'), text=inp.value.trim();
  if(!text) return;
  inp.value='';
  cvCollapseComposer();
  sendText(text);
  toast('Sent to chat');
}
$('#cvSend').addEventListener('click',cvSendNow);
$('#cvInput').addEventListener('keydown',function(e){
  if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); cvSendNow(); }
});
$('#cvInput').addEventListener('input',function(){
  /* Same growing-box behaviour as the main composer. */
  var cap=Math.max(120, Math.min(240, Math.floor(window.innerHeight*0.36)));
  this.style.height='auto';
  var sh=this.scrollHeight;
  this.style.height=Math.min(sh,cap)+'px';
  this.style.overflowY=sh>cap?'auto':'hidden';
});
function activeWrap(){
  if(state.splitId) return state.splitActive==='top' ? $('#paneTopMsgs') : $('#paneBottomMsgs');
  return $('#msgWrap');
}
function pushTyping(){
  setAgentEmotion('typing');
  var ty=document.createElement('div'); ty.className='msg ai'; ty.innerHTML='<span class="typing"><i></i><i></i><i></i></span>';
  activeWrap().appendChild(ty);
  var sc=ty.closest('.pane-scroll')||$('#chatScroll'); if(sc) sc.scrollTop=sc.scrollHeight;
  return ty;
}
function pushAI(chat, reply){
  var ty=pushTyping();
  setTimeout(function(){
    ty.remove();
    if(typeof reply==='string') chat.messages.push({id:mid(), role:'ai', text:reply});
    else { var nm={id:mid(), role:'ai', text:reply.text, code:reply.code}; if(reply.avatarProposal) nm.avatarProposal=reply.avatarProposal; chat.messages.push(nm); }
    renderAll();
  }, 600);
}
/* Avatar changes straight from chat — the user has full ability to
   update the avatar by chatting and by uploading files:
   • Attach an image and mention "avatar" → that image becomes the
     agent avatar (animated in its circle, like any avatar here).
   • Describe / prompt one — "make my avatar a blue star with a wink",
     "create an avatar: red heart, happy face" → a custom shape + face
     + colour avatar is built from the description and applied.
   • Name a preset — cute/Mia, Muse, Botthew, Froggy, Berry, Sunny, Hearty, Mochi, Cue, Grokbot/robot, Dots, Muse.
   • "Open avatar editor" opens Settings → Agent → Change Avatar.
   The agent-side how-to lives in Agents files → agents/AVATAR.md. */
/* ===== Auto emotes for a new avatar (background) =====
   Every time an avatar is created or changed — built in chat,
   picked as a preset, built in Change Avatar, a created agent, or
   an uploaded photo — its full emote set (idle, typing, dancing,
   sleeping, angry, sad) is generated automatically in the
   background and stored on the agent, then the UI updates itself.
   The user never has to make emotes by hand. */
var AVATAR_EMOTES=['idle','typing','dancing','sleeping','angry','sad'];
function buildEmoteSet(a){
  if(!a) return null;
  if(a.avatar) return {mode:'photo', note:'Photo avatar — the full always-moving sway applies to every emote state.'};
  var set={mode:(a.preset==='custom'?'custom':'preset')};
  AVATAR_EMOTES.forEach(function(em){ set[em]=avatarHTMLFor(a, em); });
  return set;
}
function autoGenerateEmotes(a){
  if(!a) return;
  setTimeout(function(){
    try{ a.emoteSet=buildEmoteSet(a); a.emotesAuto=true; syncAgentFile(a); }catch(e){}
    if(state.view==='chat') renderAll();
  }, 0);
}
/* Parse a plain description ("a blue star with a wink") into a
   shape + face + colour build, falling back to the current build
   for anything the description does not mention. */
function parseAvatarDescription(text){
  var low=(text||'').toLowerCase();
  var shape=null; AVATAR_SHAPES.forEach(function(s){ if(low.indexOf(s)>=0) shape=s; });
  var face=null;
  var faceKeys={wink:'wink', sleepy:'sleepy', tired:'tired', tongue:'tongue', glasses:'glasses', sunglasses:'cool', shades:'cool', cooling:'cool', cool:'cool', star:'star', heart:'love', love:'love', moustache:'stache', mustache:'stache', hair:'hair', fringe:'hair', ears:'bigears', cap:'cap', wow:'wow', surprised:'wow', cat:'cat', kitty:'cat', dizzy:'dizzy', cry:'cry', laughing:'joy', laugh:'joy', joy:'joy', angry:'angry', happy:'smile', smile:'smile', smiling:'smile', flat:'flat', chev:'chev', open:'open', sad:'sad'};
  Object.keys(faceKeys).forEach(function(k){ if(low.indexOf(k)>=0) face=faceKeys[k]; });
  var accKeys={headphones:'phones', headphone:'phones', earphones:'phones', earphone:'phones', earbuds:'phones', bow:'bow', beret:'beret', crown:'crown', halo:'halo', party:'party', flower:'flower', sprout:'sprout', monocle:'monocle', horns:'horns', horn:'horns', antenna:'antenna', mask:'mask'};
  var acc=null;
  Object.keys(accKeys).forEach(function(k){ if(low.indexOf(k)>=0) acc=accKeys[k]; });
  if(low.indexOf('hat')>=0 && !acc) acc='party';
  var colorMap={brown:'#b57948', blue:'#3d9bff', red:'#f5534d', yellow:'#ffbf00', grey:'#8e8e93', gray:'#8e8e93', white:'#f5f5f7', black:'#26262b', pink:'#ff8fb2', orange:'#ff9f0a', green:'#32d74b', purple:'#5e5ce6', teal:'#64d2ff'};
  var color=null, colorName='';
  Object.keys(colorMap).forEach(function(k){ if(low.indexOf(k)>=0){ color=colorMap[k]; colorName=k; } });
  return {shape:shape, face:face, color:color, colorName:colorName, acc:acc};
}
/* ===== Create-your-own-avatar chat flow =====
   Tapping the "Create your own avatar" slide (the second slide of
   the swipe picker) or the Avatar page button opens the chat with
   the composer pre-filled with the perfect-grammar starter
   "Create an avatar of " — the user just finishes the sentence
   with what they want. On send, the avatar is BUILT and shown as
   a proposal card with its auto-generated emotes; it only becomes
   the new avatar when the user taps "Use this avatar". */
var createAvatarPromptPending=false, createAvatarTargetId=null;
function openCreateAvatarInChat(targetId){
  createAvatarTargetId=targetId||avatarTargetAgentId||chatAgentId||mainAgentId;
  createAvatarPromptPending=true;
  try{ closeSheet(); }catch(e){}
  if(state.view==='settings') closeSettings();
  setSidebar(false,true);
  var inp=$('#chatInput');
  if(inp){
    inp.value='Create an avatar of ';
    autoGrow(); updateSend();
    setTimeout(function(){ try{ inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }catch(e){} }, 60);
  }
  toast('Describe the avatar — finish the sentence and send');
}
function avatarCreateCommand(text){
  var t=String(text||'').trim();
  var viaTemplate=/^create an avatar of\b/i.test(t);
  /* After tapping Create, the very next message is the description
     the user typed — with or without the word "avatar" in it. */
  var viaPending=createAvatarPromptPending && t.length>=2;
  if(!viaTemplate && !viaPending) return null;
  createAvatarPromptPending=false;
  var desc=viaTemplate? t.replace(/^create an avatar of\s*/i,'') : t;
  if(desc.length<2) return 'Tell me what to create — finish the sentence after "Create an avatar of", like "a blue star with a wink".';
  var p=parseAvatarDescription(desc);
  var cur=agentById(createAvatarTargetId)||chatAgent();
  var proposal={
    shape:p.shape||(cur&&cur.shape)||avatarShape||'circle',
    face:p.face||(cur&&cur.face)||avatarFace||'open',
    color:p.color||(cur&&cur.color)||avatarColor||'#8e8e93',
    acc:p.acc||(cur&&cur.acc)||avatarAcc||'none',
    agentId:(cur&&cur.id)||chatAgentId,
    desc:desc, resolved:''
  };
  createAvatarTargetId=null;
  return {
    text:'Here is the avatar I created for you: '+(p.colorName?p.colorName+' ':'')+'a '+proposal.shape+' with a '+proposal.face+' face.\n\nIts emotes are already made — they are under the preview. Tap "Use this avatar" to make it my new avatar, or "Not yet" and describe a different one.',
    avatarProposal:proposal
  };
}
function confirmAvatarProposal(chat, m){
  var p=m.avatarProposal; if(!p) return;
  p.resolved='confirmed';
  avatarTargetAgentId=p.agentId||chatAgentId;
  applyCustomAvatar(p.shape, p.face, p.color, p.acc);
  avatarTargetAgentId=null;
  renderAll();
  toast('New avatar saved — its emotes were created automatically');
  if(chat) pushAI(chat, 'Done — that is my new avatar now. It is live at the top of the chat, and its full emote set (idle, typing, dancing, sleeping, angry and sad) was created automatically in the background — nothing for you to set up.');
}
function avatarChatCommand(text, atts){
  var low=(text||'').toLowerCase();
  if(low.indexOf('avatar')<0) return null;
  var img=null;
  (atts||[]).forEach(function(a){ if(a && a.kind==='image' && a.url) img=a; });
  if(img){
    agentAvatar=img.url; var caImg=chatAgent(); if(caImg){ caImg.avatar=img.url; if(caImg.id===mainAgentId) syncMainGlobals(); autoGenerateEmotes(caImg); }
    return 'Done — that image is now my avatar. It shows as a circular avatar at the top centre of the chat with my name below it, and it stays animated and moving, never static. You can replace it any time by uploading another image, or in Settings → Agent → Change Avatar.';
  }
  if(!/(make|create|generate|design|set|change|give|turn|open|use)/.test(low)) return null;
  var shape=null; AVATAR_SHAPES.forEach(function(s){ if(low.indexOf(s)>=0) shape=s; });
  var face=null;
  var faceKeys={wink:'wink', sleepy:'sleepy', tired:'tired', tongue:'tongue', glasses:'glasses', sunglasses:'cool', shades:'cool', cooling:'cool', cool:'cool', moustache:'stache', mustache:'stache', hair:'hair', fringe:'hair', ears:'bigears', cap:'cap', wow:'wow', surprised:'wow', kitty:'cat', dizzy:'dizzy', cry:'cry', laughing:'joy', laugh:'joy', joy:'joy', angry:'angry', happy:'smile', smile:'smile', smiling:'smile', flat:'flat', chev:'chev', open:'open'};
  Object.keys(faceKeys).forEach(function(k){ if(low.indexOf(k)>=0) face=faceKeys[k]; });
  var accKeys={headphones:'phones', headphone:'phones', earphones:'phones', earphone:'phones', earbuds:'phones', bow:'bow', beret:'beret', crown:'crown', halo:'halo', party:'party', flower:'flower', sprout:'sprout', monocle:'monocle', horns:'horns', horn:'horns', antenna:'antenna', mask:'mask'};
  var acc=null;
  Object.keys(accKeys).forEach(function(k){ if(low.indexOf(k)>=0) acc=accKeys[k]; });
  if(low.indexOf('hat')>=0 && !acc) acc='party';
  var colorMap={brown:'#b57948', blue:'#3d9bff', red:'#f5534d', yellow:'#ffbf00', grey:'#8e8e93', gray:'#8e8e93', white:'#f5f5f7', black:'#26262b', pink:'#ff8fb2', orange:'#ff9f0a', green:'#32d74b', purple:'#5e5ce6', teal:'#64d2ff'};
  var color=null, colorName='';
  Object.keys(colorMap).forEach(function(k){ if(low.indexOf(k)>=0){ color=colorMap[k]; colorName=k; } });
  if(!shape && !face && !color && /(editor|edit|customi)/.test(low)){
    setTimeout(function(){ openSettings('avataredit'); }, 650);
    return 'Opening Change Avatar — big preview at the top, the colour ring under it, faces in the middle and shapes below. Tap the blue check at the top right to save.';
  }
  var presets={cue:'cue', grok:'grok', robot:'grok', dots:'dots', claude:'claude', mia:'mia', cute:'mia', default:'mia', muse:'muse', botthew:'botthew', froggy:'froggy', frog:'froggy', berry:'berry', sunny:'sunny', hearty:'hearty', mochi:'mochi'};
  var preset=null;
  Object.keys(presets).forEach(function(k){ if(low.indexOf(k)>=0) preset=presets[k]; });
  if(preset && !shape){
    agentPreset=preset; agentAvatar=''; var caPre=chatAgent(); if(caPre){ caPre.preset=preset; caPre.avatar=''; if(caPre.id===mainAgentId) syncMainGlobals(); autoGenerateEmotes(caPre); }
    return 'Done — my avatar is now the '+preset+' preset, animated and moving at the top of the chat. Open Settings → Agent → Change Avatar any time to build your own shape, face and colour.';
  }
  avatarTargetAgentId=chatAgentId; applyCustomAvatar(shape||avatarShape, face||avatarFace, color||avatarColor, acc||avatarAcc); avatarTargetAgentId=null;
  return 'Done — I built your prompted avatar: a '+(colorName?colorName+' ':'')+avatarShape+' with a '+avatarFace+' face. It is live at the top of the chat, circular, with my name below it, and always animated. Say another description, upload an image, or open Change Avatar to tweak the shape, face and colour.';
}
function sendText(raw){
  var text=(raw!=null?raw:$('#chatInput').value).trim();
  if(!text && !state.attachments.length && !state.pendingLinks.length) return;
  /* Any link in the text (pasted or typed) raises its preview card
     first; the cards then travel into the sent message. */
  if(text) extractUrls(text).forEach(function(u){ ensurePendingLink(u); });
  var sentAtts=state.attachments.slice(), sentLinks=state.pendingLinks.slice();
  $('#chatInput').value=''; autoGrow(); hideCmds();
  var chat=activeTargetChat(); if(!chat) return;
  /* Memory: BEFORE replying, always search the saved memory by this
     message's keywords — the reply is built using what is found.
     Searching happens before this message itself is saved, so a
     message is never its own "related memory". */
  var memQuery=text || (sentLinks.length? sentLinks[0].domain : (sentAtts.length? (sentAtts[0].name||'file') : ''));
  var memHits=state.memory? searchMemory(memQuery) : [];
  if(text.charAt(0)==='/' && !sentAtts.length && !sentLinks.length){
    var cmd=text.split(' ')[0].toLowerCase(), rest=text.slice(cmd.length).trim();
    if(cmd==='/help'){ chat.messages.push({id:mid(),role:'user',text:text}); renderAll(); pushAI(chat,'Commands:\n'+COMMANDS.map(function(c){return c.c+' — '+c.d;}).join('\n')); return; }
    if(cmd==='/skills'){ chat.messages.push({id:mid(),role:'user',text:text}); renderAll(); pushAI(chat,'Skill library ('+SKILLS.length+'):\n'+SKILLS.map(function(s){ return SKILL_DESCS[s]? s+' — '+SKILL_DESCS[s] : s; }).join('\n')); return; }
    if(SKILL_COMMANDS[cmd]){ var snm=SKILL_COMMANDS[cmd]; if(state.skillsOn[snm]===false){ toast(snm+' is off — turn it on in Skills'); return; } chat.messages.push({id:mid(),role:'user',text:text}); renderAll(); if(state.apiKey && rest){ state.skillOnce=snm; callProvider(chat, memHits); return; } pushAI(chat, skillReply(snm, rest)); return; }
    if(cmd==='/skill'){ state.skillOnce=rest||'frontend-design'; toast('Skill set for next reply: '+state.skillOnce); return; }
    if(cmd==='/agent'){ openSettings('agentpage'); return; }
    if(cmd==='/chat'){ state.route='chat'; updateTargetLine(); toast('Next message: chat mode'); return; }
    if(cmd==='/code' && !rest){ state.route='code'; updateTargetLine(); toast('Next message: code mode'); return; }
    if(cmd==='/code' && rest){ chat.messages.push({id:mid(),role:'user',text:text}); renderAll(); if(state.apiKey){ state.codeOnce=true; callProvider(chat, memHits); } else pushAI(chat, codeReply(rest)); return; }
    if(cmd==='/clear'){ chat.messages=[]; renderAll(); toast('Chat cleared'); return; }
    if(cmd==='/settings'){ openSettings('list'); return; }
    if(cmd==='/dashboard'){ openSettings('dashboard'); return; }
    if(cmd==='/ide'){ openSettings('ide'); return; }
    if(cmd==='/terminal'){ chat.messages.push({id:mid(),role:'user',text:text}); renderAll(); pushAI(chat,'Terminal commands used in this chat appear here. None have run yet — code previews run in the Play pane, not a shell.'); return; }
    if(cmd==='/split'){ var tg=chats.filter(function(c){return c.id!==state.currentId;})[0]; if(tg) enterSplit(tg.id); else toast('No other chat to split with yet'); return; }
    if(cmd==='/search'){ doSearch(chat, rest||'Gptopen'); return; }
    if(cmd==='/code'){ chat.messages.push({id:mid(),role:'user',text:text}); renderAll(); pushAI(chat, codeReply(rest)); return; }
  }
  var newMsg={id:mid(), role:'user', text:text};
  if(sentAtts.length) newMsg.attachments=sentAtts;
  if(sentLinks.length) newMsg.links=sentLinks;
  state.attachments=[]; state.pendingLinks=[]; renderAttach(); renderLinkPreviews(); updateSend();
  if(state.replyTo){ newMsg.replyToText=state.replyTo.text; state.replyTo=null; renderReplyBar(); }
  chat.messages.push(newMsg);
  pendingEmotion=emotionForText(text);
  /* Reactions: the AI may react to this message — sparingly, and only
     when one from its set genuinely fits (see pickReaction). */
  scheduleReaction(chat, newMsg);
  /* Memory: this message is saved to memory automatically (sanitised
     first — keys, secrets, emails and phone numbers never enter it). */
  if(state.memory) saveMemory(chat, newMsg);
  /* Agents files auto-update: durable facts the user states are
     written into the agent files as the agent learns (sanitised). */
  afAutoUpdateLearn(text);
  /* While a new agent's onboarding is running, its answers are
     captured by the onboarding flow itself, not the generic learner. */
  if(!(chatAgent() && chatAgent().onboarding)) agentAutoLearn(text);
  if(chat.title==='New chat') chat.title=text? text.slice(0,34) : (sentAtts.length? (sentAtts[0].name||'Shared file') : (sentLinks.length? sentLinks[0].domain : 'New chat'));
  renderAll();
  if(state.route==='code'){ state.route=null; updateTargetLine(); if(state.apiKey){ state.codeOnce=true; callProvider(chat, memHits); } else pushAI(chat, codeReply(text||'a shared file page')); return; }
  /* New-agent onboarding: while it runs, every reply is one of the
     setup answers — it fills the agent's name, memory, instructions
     and vibe, ahead of every other chat command and any provider. */
  var obRes=agentOnboardingReply(text);
  if(obRes!==null){ pushAI(chat, obRes); return; }
  /* Goals & scheduled messages: when the user tells the agent to add,
     update, stop or delete a goal or a scheduled message, the app
     applies it directly and the reply confirms what changed. */
  var acRes=agentCommand(text);
  if(acRes!==null){ pushAI(chat, acRes); return; }
  var agCtl=agentsChatCommand(text);
  if(agCtl!==null){ pushAI(chat, agCtl); return; }
  /* Create-your-own-avatar flow: "Create an avatar of …" builds a
     proposal card first — the user confirms before it is applied. */
  var avCreate=avatarCreateCommand(text);
  if(avCreate!==null){ pushAI(chat, avCreate); return; }
  /* Avatar updates from chat: an uploaded image, or a described /
     prompted avatar, is applied directly (see avatarChatCommand). */
  var avRes=avatarChatCommand(text, sentAtts);
  if(avRes!==null){ pushAI(chat, avRes); return; }
  /* Canvas: "write code in canvas", or Canvas mode on in the +
     sheet, builds with the canvas card UI instead of a plain reply. */
  if(canvasWanted(text)){
    if(state.apiKey){ var pendingCanvas=pushCanvasPending(chat, text); callProvider(chat, memHits, {codeMode:true, canvasMsg:pendingCanvas}); }
    else pushCanvas(chat, text);
    return;
  }
  if(state.apiKey){ callProvider(chat, memHits); return; }
  pushAI(chat, localReply(text || (sentLinks.length? 'Shared link: '+sentLinks[0].url : 'Shared: '+(sentAtts[0]? (sentAtts[0].name||'a file') : 'a file')), memHits));
}
function doSearch(chat, q){
  chat.messages.push({id:mid(), role:'user', text:'/search '+q}); renderAll();
  if(!state.webSearch){ pushAI(chat,'Online Search is off. Turn on Web search in the + sheet, under Connectors.'); return; }
  var ty=pushTyping();
  fetch('https://en.wikipedia.org/w/api.php?action=opensearch&limit=4&namespace=0&format=json&origin=*&search='+encodeURIComponent(q))
    .then(function(r){ return r.json(); })
    .then(function(d){
      ty.remove();
      var titles=(d&&d[1])||[], descs=(d&&d[2])||[];
      var out=titles.length ? ('Live sources for "'+q+'":\n'+titles.map(function(t,i){ return '• '+t+(descs[i]?' — '+descs[i]:''); }).join('\n')) : 'No live sources found for "'+q+'".';
      chat.messages.push({id:mid(), role:'ai', text:out}); renderAll();
    })
    .catch(function(){ ty.remove(); chat.messages.push({id:mid(), role:'ai', text:'Search could not reach the network from this preview. Check the connection and try again.'}); renderAll(); });
}
/* =============== Agent-grade coding pipeline ===============
   When a provider is connected, coding work is no longer routed to
   the local starter generator. The model receives a strict coder
   brief, the recent code itself (not only the prose around it), a
   larger history and output budget, and its fenced result is turned
   back into the existing code / canvas objects. Generated HTML is
   inspected once in the browser; a structurally broken build gets
   one automatic repair request before it is shown as finished. */
var CODER_INSTRUCTION=[
  'You are Gptopen Coder, operating like a senior software engineer inside a chat-based coding workspace.',
  'Work in this order: understand the goal and the existing conversation; choose the smallest complete design that fully satisfies it; write the finished code; then mentally inspect it before answering.',
  'Return complete, runnable work — never a sketch, pseudo-code, placeholder, TODO, lorem ipsum, dead button, empty handler or “rest is left as an exercise”. Every visible control must do something real.',
  'For a web app, page, game, tool or UI, return exactly ONE complete self-contained HTML document in one fenced ```html block: inline CSS in <style>, inline JavaScript in a classic <script> (no modules, no eval, no Function constructor), no build step and no external files. Make it responsive with no horizontal scrolling on phone or desktop, support light and dark where the design allows, and wire every button, input and control.',
  'For non-web code, return the complete code in one fenced block labelled with its language, followed only by brief run notes if they are needed. If several files are genuinely required, keep the deliverable in the single block as clearly separated, named sections rather than omitting code.',
  'For debugging, find the root cause from the latest code and error in the conversation. If the change is substantial, return the full corrected file or code block; if it is tiny, give the exact replacement and say precisely where it goes.',
  'If the user says “continue”, continue from the exact stopping point of the previous partial answer without restarting, repeating completed code or changing direction.',
  'Before answering, check identifiers, event handlers, syntax, opening/closing tags, empty states, edge cases and mobile layout. Do not claim that you ran, tested, deployed, opened or verified anything outside this conversation.',
  'Keep prose outside the code concise: one short summary before the block and, only when useful, a few concrete notes after it. Do not ask questions that a sensible default can resolve; state any important assumption briefly.'
].join('\n');
var CANVAS_CODER_INSTRUCTION='This build will be placed into the existing Gptopen Canvas card and preview. Put one short sentence before the ```html block and nothing after the block. The single HTML file is the whole deliverable.';
function lastUserText(chat){
  if(!chat) return '';
  for(var i=chat.messages.length-1;i>=0;i--) if(chat.messages[i].role==='user') return chat.messages[i].text||'';
  return '';
}
function chatHasCode(chat){
  return !!(chat && chat.messages.some(function(m){ return !!(m.code && m.code.body); }));
}
function lastAiTruncated(chat){
  if(!chat) return false;
  for(var i=chat.messages.length-1;i>=0;i--) if(chat.messages[i].role==='ai') return !!chat.messages[i].truncated;
  return false;
}
function latestUserHasTextFile(chat){
  if(!chat) return false;
  for(var i=chat.messages.length-1;i>=0;i--){
    if(chat.messages[i].role==='user') return !!(chat.messages[i].attachments && chat.messages[i].attachments.some(function(a){ return !!(a && a.textContent); }));
  }
  return false;
}
function isCodeRequestText(text, chat){
  var t=String(text||'').toLowerCase();
  if(!t) return false;
  if(latestUserHasTextFile(chat) && /\b(fix|debug|review|explain|change|update|refactor|optimi[sz]e|code|error|bug)\b/.test(t)) return true;
  if(/```|<!doctype\s+html|<html\b|<script\b|<style\b/.test(t)) return true;
  if(/^(continue|finish it|complete it|keep going)\b/.test(t) && (chatHasCode(chat) || lastAiTruncated(chat))) return true;
  if(/\b(fix|debug|repair|refactor|optimi[sz]e|update|change|add|remove|improve)\b[\s\S]{0,90}\b(code|bug|error|function|script|app|page|website|button|feature|login|form|canvas|layout|ui)\b/.test(t)) return true;
  if(/\b(build|create|make|write|generate|develop|implement|design|code)\b[\s\S]{0,90}\b(app|application|web ?page|website|site|game|tool|calculator|dashboard|ui|interface|component|form|landing page|portfolio|clone|html|css|javascript|python|function|script|program)\b/.test(t)) return true;
  if(/\b(html|css|javascript|typescript|python|java|c\+\+|c#|php|ruby|swift|kotlin|sql|react|vue|angular|node\.?js)\b/.test(t) && /\b(build|write|create|make|code|fix|debug|error|function|app|page|website|program|script|api)\b/.test(t)) return true;
  if(/\b(error|bug|exception|stack trace|not working|doesn[’']t work|broken|syntax)\b/.test(t) && chatHasCode(chat)) return true;
  return false;
}
function providerContentForMessage(m){
  var content=m.text||'';
  if(m.attachments && m.attachments.length){
    m.attachments.forEach(function(a){
      if(a && a.textContent) content+='\n\nAttached file "'+(a.name||'file')+'"'+(a.textTruncated?' (first part shown)':'')+':\n```\n'+a.textContent+'\n```';
    });
  }
  if(m.code && m.code.body){
    content+=(content?'\n\n':'')+'```'+(m.code.lang||'')+'\n'+m.code.body+'\n```';
  }
  if(m.truncated) content+='\n\n[The previous reply hit the output limit and may be incomplete.]';
  return content;
}
function normalizeCodeLang(lang, body){
  var l=String(lang||'').toLowerCase().replace(/[^a-z0-9+#.-]/g,'');
  if(l==='js') return 'javascript';
  if(l==='ts') return 'typescript';
  if(l==='sh') return 'bash';
  if(!l && /<!doctype\s+html|<html\b/i.test(body||'')) return 'html';
  return l||'text';
}
function extractProviderCode(out, force){
  var src=String(out||''), blocks=[], re=/```([A-Za-z0-9_+#.-]*)\s*\n([\s\S]*?)```/g, match;
  while((match=re.exec(src))!==null){
    blocks.push({lang:match[1]||'', body:(match[2]||'').replace(/^\n+|\n+$/g,''), raw:match[0]});
  }
  var chosen=null, bestScore=-1;
  blocks.forEach(function(b){
    var score=b.body.length + (/<!doctype\s+html|<html\b/i.test(b.body)?1000000:0);
    if(score>bestScore){ bestScore=score; chosen=b; }
  });
  var incomplete=false;
  var residue=src;
  blocks.forEach(function(b){ residue=residue.replace(b.raw,''); });
  var openMatch=residue.match(/```([A-Za-z0-9_+#.-]*)\s*\n([\s\S]*)$/);
  if(openMatch && openMatch[2] && openMatch[2].trim()){
    var openBody=openMatch[2].replace(/\n+$/g,'');
    if(!chosen || openBody.length>chosen.body.length){
      chosen={lang:openMatch[1]||'', body:openBody, raw:openMatch[0]};
      incomplete=true;
    }
  }
  if(!chosen){
    var ds=src.search(/<!doctype\s+html/i); if(ds<0) ds=src.search(/<html\b/i);
    if(ds>=0){
      var end=src.lastIndexOf('</html>');
      var rawBody=end>=ds? src.slice(ds,end+7) : src.slice(ds);
      chosen={lang:'html', body:rawBody, raw:rawBody};
      incomplete=end<ds;
    }
  }
  if(!chosen) return null;
  var body=String(chosen.body||'').trim();
  if(!body) return null;
  var fullHtml=/<!doctype\s+html|<html\b/i.test(body);
  if(!force && !fullHtml && body.length<180) return null;
  var prose=src.replace(chosen.raw,'\n').replace(/\n{3,}/g,'\n\n').trim();
  return {text:prose, code:{lang:normalizeCodeLang(chosen.lang, body), body:body}, incomplete:incomplete};
}
function inspectHtmlCode(body){
  var src=String(body||''), issues=[];
  if(!/<!doctype\s+html/i.test(src)) issues.push('missing <!doctype html>');
  if(!/<html\b/i.test(src) || !/<\/html\s*>/i.test(src)) issues.push('missing a complete <html>...</html> structure');
  if(!/<head\b/i.test(src) || !/<\/head\s*>/i.test(src)) issues.push('missing a complete <head>...</head> structure');
  if(!/<body\b/i.test(src) || !/<\/body\s*>/i.test(src)) issues.push('missing a complete <body>...</body> structure');
  if(/<script[^>]+type\s*=\s*["']module["']/i.test(src)) issues.push('uses a module script instead of a classic script');
  if(/\beval\s*\(|new\s+Function\s*\(/.test(src)) issues.push('uses eval() or Function(), which are not allowed in the build');
  ['script','style'].forEach(function(tag){
    var opens=(src.match(new RegExp('<'+tag+'\\b','gi'))||[]).length;
    var closes=(src.match(new RegExp('</'+tag+'\\s*>','gi'))||[]).length;
    if(opens!==closes) issues.push('unbalanced <'+tag+'> tags');
  });
  var controls=(src.match(/<(button|input|select|textarea)\b/gi)||[]).length;
  if(controls && !/<script\b/i.test(src) && !/\son\w+\s*=/i.test(src)) issues.push('interactive controls have no JavaScript behaviour');
  var ids={}, dup={};
  src.replace(/\bid\s*=\s*["']([^"']+)["']/gi,function(_,id){ if(ids[id]) dup[id]=1; ids[id]=1; return _; });
  if(Object.keys(dup).length) issues.push('duplicate id values: '+Object.keys(dup).join(', '));
  return issues;
}
function callProvider(chat, memHits, opts){
  var canvasMsg=(opts && opts.canvasMsg) || null;
  var requestText=lastUserText(chat);
  var codeMode=!!(state.codeOnce || (opts && opts.codeMode) || (opts && opts.contextCode) || canvasMsg || isCodeRequestText(requestText, chat));
  state.codeOnce=false;
  /* A canvas card already shows its own “Writing code...” state, so
     it does not need a second typing bubble while the provider works. */
  var ty=canvasMsg? {remove:function(){}} : pushTyping();
  var history=chat.messages.filter(function(m){ return m!==canvasMsg; }).slice(codeMode? -24 : -10);
  var msgs=history.map(function(m){ return {role:m.role==='user'?'user':'assistant', content:providerContentForMessage(m)}; });
  if(opts && opts.contextCode && opts.contextCode.body){
    var contextMsg={role:'assistant', content:'Previous generated version — use it as the base for this fix, change or regeneration:\n```'+(opts.contextCode.lang||'')+'\n'+opts.contextCode.body+'\n```'};
    var contextAt=msgs.length;
    for(var ci=msgs.length-1;ci>=0;ci--){ if(msgs[ci].role==='user'){ contextAt=ci; break; } }
    msgs.splice(contextAt,0,contextMsg);
  }
  /* Related memory (keyword-searched before this reply, already
     sanitised — it never contains keys, secrets, emails or phone
     numbers) goes to the provider as context for this answer. */
  var memCtx=memoryContextText(memHits);
  if(memCtx) msgs.unshift({role:'system', content:'Relevant saved memory about the user — use it where it fits:\n'+memCtx});
  /* The reaction instructions travel with every provider request. */
  msgs.unshift({role:'system', content:REACTION_INSTRUCTION});
  /* The agent files are the standing instructions: SOUL.md (persona),
     AGENTS.md (workspace rules, including the auto-update rule) and
     USER.md travel with every provider request, read live from the
     editable files, so edits in Settings → Agents files apply at once. */
  var coreMsg=agentCoreMessage();
  if(coreMsg) msgs.unshift({role:'system', content:coreMsg});
  /* A skill chosen with /skill <name>, or invoked directly with its
     own slash command, travels as a system message carrying its FULL
     instructions, so a connected model follows the same skill the
     local engine does. */
  if(state.skillOnce){
    var pSkill=state.skillOnce; state.skillOnce=null;
    var pInstr=skillInstructions(pSkill);
    if(pInstr){
      var pExtra = pSkill==='match-my-writing-style' ? '\n\nLOCAL APP RULE (overrides any Workspace wording above): in this app, learn the voice ONLY from the user\u2019s own messages in this app and samples the user pastes here. Never claim a Gmail or Drive scan — those apps are not connected in this app. Never mimic incoming mail. Drafts are draft-only: never send anything.' : '';
      msgs.unshift({role:'system', content:'Apply the "'+pSkill+'" skill to your reply and follow these instructions exactly.\n\n'+pInstr+pExtra});
    }
  }
  if(codeMode){
    msgs.unshift({role:'system', content:CODER_INSTRUCTION+(canvasMsg? '\n\n'+CANVAS_CODER_INSTRUCTION : '')});
  }
  function buildProviderRequest(requestMsgs, entry, modelOverride){
    var temperature=codeMode? Math.min(state.tempVal, 0.4) : state.tempVal;
    var p=API_PROVIDERS[entry.provider] || API_PROVIDERS.openai;
    var model=modelOverride || entry.model || p.defModel;
    if(p.type==='gemini'){
      var systems=[], convo=[];
      requestMsgs.forEach(function(m){
        if(m.role==='system') systems.push(m.content);
        else convo.push({role:m.role==='assistant'?'model':'user', parts:[{text:m.content}]});
      });
      var gemBody={contents:convo, generationConfig:{temperature:temperature, maxOutputTokens:codeMode?8192:2048}};
      if(systems.length) gemBody.systemInstruction={parts:[{text:systems.join('\n\n---\n\n')}]};
      var gemHeaders={'Content-Type':'application/json','x-goog-api-key':entry.key};
      return {url:p.base+'/models/'+encodeURIComponent(model)+':generateContent', headers:gemHeaders, body:gemBody};
    }
    if(p.type==='anthropic'){
      var aSystems=[], aConvo=[];
      requestMsgs.forEach(function(m){
        if(m.role==='system') aSystems.push(m.content);
        else aConvo.push({role:m.role==='assistant'?'assistant':'user', content:m.content});
      });
      var aBody={model:model, messages:aConvo, temperature:temperature, max_tokens:codeMode?8192:2048};
      if(aSystems.length) aBody.system=aSystems.join('\n\n---\n\n');
      return {url:p.base+'/messages', headers:{'Content-Type':'application/json','x-api-key':entry.key,'anthropic-version':'2023-06-01'}, body:aBody};
    }
    var reqHeaders={'Content-Type':'application/json', Authorization:'Bearer '+entry.key};
    var outMsgs=requestMsgs, maxTok=codeMode?8192:2048;
    if(entry.provider==='groq'){
      /* Groq hardening: its OpenAI-compatible endpoint is picky
         about repeated system messages and lower completion-token
         ceilings — merge all system context into ONE system
         message at the head and cap the output budget. */
      maxTok=Math.min(maxTok,4096);
      var gSys=[], gRest=[];
      requestMsgs.forEach(function(m){ if(m.role==='system') gSys.push(m.content); else gRest.push(m); });
      if(gSys.length) outMsgs=[{role:'system', content:gSys.join('\n\n---\n\n')}].concat(gRest);
    }
    return {url:(entry.base||p.base).replace(/\/$/,'')+'/chat/completions', headers:reqHeaders, body:{model:model, messages:outMsgs, temperature:temperature, max_tokens:maxTok}};
  }
  function extractReplyText(j){
    if(!j) return null;
    if(j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) return j.choices[0].message.content;
    if(j.candidates && j.candidates[0] && j.candidates[0].content) return j.candidates[0].content.parts.map(function(pt){return pt.text||'';}).join('');
    if(Array.isArray(j.content)) return j.content.map(function(b){ return b && b.type==='text'? (b.text||'') : ''; }).join('') || null;
    return null;
  }
  /* Automatic failover — exhaustive, in every way: try the active
     key first with its chosen model, then EVERY other model on
     that same key (its full provider model list, freshly fetched
     if it was not known yet, and fetched again if the cached list
     is exhausted so any new model is tried too), then move to the
     next added key and try EVERY model on it the same way, and so
     on through all added keys. Keep trying like that and only
     when every model on every key has failed does the chat show
     an error. */
  var attemptEntries=apiAttemptOrder();
  if(!attemptEntries.length){
    ty.remove(); discardCanvasPending(chat, canvasMsg);
    if(apiEntries().length){
      setApiHealth('error','Unrecognised key');
      chat.messages.push({id:mid(), role:'ai', text:'The added key\u2019s provider could not be detected from its format, so it was not sent anywhere. Add a key from a supported provider — OpenAI, Anthropic, Google Gemini, OpenRouter, Groq, xAI, DeepSeek, NVIDIA, Mistral or Together.'});
    } else {
      setApiHealth('unset');
      chat.messages.push({id:mid(), role:'ai', text:'Add an API key first — paste one in APIs & Providers and everything else is selected automatically.'});
    }
    renderAll(); return;
  }
  function postToProvider(requestMsgs, entry, modelOverride){
    var req=buildProviderRequest(requestMsgs, entry, modelOverride);
    state.usage.requests++;
    return fetch(req.url,{method:'POST', headers:req.headers, body:JSON.stringify(req.body)});
  }
  function deliverProviderReply(finalOut, parsed, truncated){
    var limitNote='The model hit its output limit before finishing. Say “continue” and Gptopen will continue from the code and context already in this chat.';
    if(canvasMsg){
      if(parsed && parsed.code && parsed.code.lang==='html'){
        canvasMsg.text=parsed.text || ('Built the '+canvasMsg.canvas.title+' app in Canvas.');
        canvasMsg.canvas.status='done';
        canvasMsg.canvas.ts=Date.now();
        canvasMsg.code=parsed.code;
        canvasMsg.truncated=!!(truncated || parsed.incomplete);
        if(canvasMsg.truncated) canvasMsg.text+='\n\n'+limitNote;
        var canvasIssues=inspectHtmlCode(parsed.code.body);
        if(canvasIssues.length) canvasMsg.text+='\n\nBuild check: '+canvasIssues.join('; ')+'. Ask me to fix it and I will work from this exact code.';
      } else if(parsed && parsed.code){
        delete canvasMsg.canvas;
        canvasMsg.text=parsed.text || 'Here is the complete code.';
        canvasMsg.code=parsed.code;
        canvasMsg.truncated=!!(truncated || parsed.incomplete);
        if(canvasMsg.truncated) canvasMsg.text+='\n\n'+limitNote;
      } else {
        delete canvasMsg.canvas;
        canvasMsg.text=finalOut;
        canvasMsg.truncated=!!truncated;
        if(truncated) canvasMsg.text+='\n\n'+limitNote;
      }
      return;
    }
    if(parsed && parsed.code){
      var codedMsg={id:mid(), role:'ai', text:parsed.text || 'Here is the complete code.', code:parsed.code};
      codedMsg.truncated=!!(truncated || parsed.incomplete);
      if(codedMsg.truncated) codedMsg.text+='\n\n'+limitNote;
      if(parsed.code.lang==='html'){
        var codeIssues=inspectHtmlCode(parsed.code.body);
        if(codeIssues.length) codedMsg.text+='\n\nBuild check: '+codeIssues.join('; ')+'. Ask me to fix it and I will work from this exact code.';
      }
      chat.messages.push(codedMsg);
    } else if(finalOut){
      var plainMsg={id:mid(), role:'ai', text:finalOut};
      plainMsg.truncated=!!truncated;
      if(truncated) plainMsg.text+='\n\n'+limitNote;
      chat.messages.push(plainMsg);
    }
  }
  var lastFailKind='error';
  var lastFailDetail='';
  var totalTried=0;
  function attemptApi(idx){
    if(idx>=attemptEntries.length){
      /* Every model on every added API was tried automatically
         and none worked — only now does an error show. */
      ty.remove(); discardCanvasPending(chat, canvasMsg);
      setApiHealth(lastFailKind, 'All APIs and models failed');
      chat.messages.push({id:mid(), role:'ai', text:'None of your APIs worked — every model on every added key was tried automatically ('+totalTried+' attempt'+(totalTried===1?'':'s')+' across '+attemptEntries.length+' API'+(attemptEntries.length===1?'':'s')+'), in every way, before showing this error. Add another key, or check the keys in Settings → APIs & Providers.'});
      renderAll(); return;
    }
    var entry=attemptEntries[idx];
    if(entry.models && entry.models.length){
      attemptModel(idx, entry, apiModelCandidates(entry), 0, false);
    } else {
      /* No model list known for this key yet — fetch it from its
         own provider first so ALL its models can be tried, not
         just the default. */
      apiFetchModels(entry).then(function(fresh){
        if(fresh && fresh.length) entry.models=fresh;
        attemptModel(idx, entry, apiModelCandidates(entry), 0, true);
      });
    }
  }
  function attemptModel(apiIdx, entry, models, mIdx, didFreshFetch){
    if(mIdx>=models.length){
      if(!didFreshFetch){
        /* The cached list is exhausted — fetch the provider's
           list once more for this key and try any model that was
           not already tried before giving up on this key. */
        apiFetchModels(entry).then(function(fresh){
          if(fresh && fresh.length){
            entry.models=fresh;
            var all=apiModelCandidates(entry);
            var extra=all.filter(function(m){ return models.indexOf(m)<0; });
            if(extra.length){ attemptModel(apiIdx, entry, models.concat(extra), mIdx, true); return; }
          }
          entry.status=lastFailKind; entry.detail=lastFailDetail||'All models failed';
          attemptApi(apiIdx+1);
        });
        return;
      }
      entry.status=lastFailKind; entry.detail=lastFailDetail||'All models failed';
      attemptApi(apiIdx+1);
      return;
    }
    var model=models[mIdx];
    totalTried++;
    postToProvider(msgs, entry, model)
    .then(function(r){ return r.json().then(function(j){ return {ok:r.ok, j:j, status:r.status}; }).catch(function(){ return {ok:r.ok, j:null, status:r.status}; }); })
    .then(function(res){
      var out=extractReplyText(res.j);
      if(!(out && res.ok)){
        var kind=apiFailureKind(res.status, res.j);
        lastFailKind=kind;
        lastFailDetail='HTTP '+res.status+' · '+model;
        if(kind==='quota') state.usage.quota++; else state.usage.failed++;
        /* This model failed — keep trying: next model on the
           SAME key, not the next key yet. */
        attemptModel(apiIdx, entry, models, mIdx+1, didFreshFetch);
        return;
      }
      ty.remove();
      /* This model on this key answered: the working model is
         kept on the key, the key becomes the active API, and the
         top pill hides while the agent head shows. */
      entry.model=model;
      entry.status='ok'; entry.detail='Working — '+model;
      if(state.activeApiId!==entry.id){ state.activeApiId=entry.id; }
      syncLegacyApi();
      setApiHealth('ok');
      state.usage.ok++;
      var pu=res.j&&res.j.usage, gm=res.j&&res.j.usageMetadata;
      if(pu){ state.usage.tokIn+=(pu.prompt_tokens||pu.input_tokens||0); state.usage.tokOut+=(pu.completion_tokens||pu.output_tokens||0); }
      else if(gm){ state.usage.tokIn+=gm.promptTokenCount||0; state.usage.tokOut+=gm.candidatesTokenCount||0; }
      {
        /* Honour the provider's reaction choice: a leading
           "REACT: <emoji>" line is consumed as the reaction on the
           user's last message (palette-checked, never duplicated)
           and never shown as text. */
        var rm=out.match(/^REACT:\s*(\S+)\s*\n?/);
        if(rm){
          out=out.slice(rm[0].length);
          var em=rm[1];
          if(em!=='none' && REACTION_SET[em]){
            for(var i=chat.messages.length-1;i>=0;i--){ if(chat.messages[i].role==='user'){ if(!chat.messages[i].reaction) chat.messages[i].reaction=em; break; } }
          }
        }
        var finishTruncated=!!((res.j.choices && res.j.choices[0] && res.j.choices[0].finish_reason==='length') || (res.j.candidates && res.j.candidates[0] && /MAX_TOKENS/i.test(res.j.candidates[0].finishReason||'')));
        var parsed=extractProviderCode(out, codeMode || !!canvasMsg);
        var htmlIssues=(parsed && parsed.code && parsed.code.lang==='html')? inspectHtmlCode(parsed.code.body) : [];
        var needsRepair=!!(parsed && parsed.code && parsed.code.lang==='html' && (parsed.incomplete || htmlIssues.length));
        if(needsRepair){
          var repairPrompt='The HTML in your previous reply failed a structural check: '+((htmlIssues.length? htmlIssues.join('; ') : 'the code block is incomplete'))+'. Return the complete corrected build now. Fix every listed issue, keep the same app and features, and return exactly one complete self-contained HTML document in one fenced ```html block with no prose after it.';
          var repairMsgs=msgs.concat([{role:'assistant', content:out},{role:'user', content:repairPrompt}]);
          return postToProvider(repairMsgs, entry, model)
            .then(function(r){ return r.json().then(function(j){ return {ok:r.ok, j:j, status:r.status}; }); })
            .then(function(rr){
              var repairedOut=extractReplyText(rr.j);
              if(rr.ok && repairedOut){
                var repairedParsed=extractProviderCode(repairedOut, true);
                if(repairedParsed && repairedParsed.code && repairedParsed.code.lang==='html'){
                  var repairedIssues=inspectHtmlCode(repairedParsed.code.body);
                  if(!repairedParsed.incomplete && repairedIssues.length<=htmlIssues.length){
                    parsed=repairedParsed;
                    out=repairedOut;
                    finishTruncated=!!((rr.j.choices && rr.j.choices[0] && rr.j.choices[0].finish_reason==='length') || (rr.j.candidates && rr.j.candidates[0] && /MAX_TOKENS/i.test(rr.j.candidates[0].finishReason||'')));
                  }
                }
              }
              deliverProviderReply(out, parsed, finishTruncated);
              renderAll();
            })
            .catch(function(){ deliverProviderReply(out, parsed, finishTruncated); renderAll(); });
        }
        deliverProviderReply(out, parsed, finishTruncated);
        renderAll();
      }
    })
    .catch(function(){
      /* Network / CORS on this model: keep trying — next model
         on the same key, then the next key and all its models. */
      lastFailKind='error'; lastFailDetail='Network or CORS · '+model;
      state.usage.failed++;
      attemptModel(apiIdx, entry, models, mIdx+1, didFreshFetch);
    });
  }
  attemptApi(0);
}
/* =============== Composer =============== */
var input=$('#chatInput'), sendBtn=$('#sendBtn');
function autoGrow(){
  /* The box GROWS as you type: one line tall when empty, then it
     expands line by line with the text up to a generous ceiling —
     the smaller of 300px or 42% of the screen height — so a long
     message gets a big, comfortable box (as in the reference)
     instead of a cramped 5-line window. Past the ceiling the field
     scrolls internally, with no scrollbar bar ever painted. */
  var cap=Math.max(140, Math.min(300, Math.floor(window.innerHeight*0.42)));
  input.style.height='auto';
  var sh=input.scrollHeight;
  input.style.height=Math.min(sh,cap)+'px';
  input.style.overflowY=sh>cap?'auto':'hidden';
}
function updateSend(){ sendBtn.disabled=!input.value.trim() && !state.attachments.length && !state.pendingLinks.length; }
input.addEventListener('input',function(){ autoGrow(); updateSend(); updateCmds(); scanInputForLinks(); });
/* Pasting files or images straight into the composer attaches them
   (no limit); pasting a link is picked up by the input scan above,
   which raises its preview card above the composer automatically. */
input.addEventListener('paste',function(e){
  var cd=e.clipboardData||window.clipboardData;
  if(cd && cd.files && cd.files.length){ e.preventDefault(); handlePickedFiles(cd.files); }
  else setTimeout(scanInputForLinks,0);
});
input.addEventListener('keydown',function(e){
  if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendText(); }
  if(e.key==='Escape'){ hideCmds(); }
});
sendBtn.addEventListener('click',function(){ sendText(); });
var cmdBox=$('#cmdBox');
function updateCmds(){
  var v=input.value;
  if(v.charAt(0)!=='/' || v.indexOf(' ')>=0){ hideCmds(); return; }
  var q=v.toLowerCase();
  var hits=COMMANDS.filter(function(c){ return c.c.indexOf(q)===0; });
  if(!hits.length){ hideCmds(); return; }
  cmdBox.innerHTML=hits.map(function(c){ return '<button class="cmd-row" data-cmd="'+c.c+'"><span class="c">'+c.c+'</span><span class="d">'+esc(c.d)+'</span></button>'; }).join('');
  cmdBox.classList.add('show');
  cmdBox.querySelectorAll('[data-cmd]').forEach(function(b){
    b.addEventListener('pointerdown',function(e){ e.preventDefault(); pickCmd(b.getAttribute('data-cmd')); });
  });
}
function hideCmds(){ cmdBox.classList.remove('show'); cmdBox.innerHTML=''; }
function pickCmd(c){
  if(c==='/code'||c==='/agent'||c==='/chat'||c==='/skill'||c==='/search'||SKILL_COMMANDS[c]){ input.value=c+' '; autoGrow(); hideCmds(); input.focus(); return; }
  if(c==='/split'){ hideCmds(); input.value=''; updateSend(); var t=chats.filter(function(x){return x.id!==state.currentId;})[0]; if(t) enterSplit(t.id); else toast('No other chat to split with yet'); return; }
  input.value=c; sendText();
}
/* =============== Keyboard tracking ===============
   The composer must sit JUST above the keyboard, minimal gap:
   - The viewport meta opts into resizes-content, so on shells that
     resize the layout for the keyboard the composer already sits
     right above it — lifting by the full visual-viewport delta as
     well double-lifts it and leaves a big gap. Only lift when the
     layout did NOT resize (overlay-style keyboards).
   - While the keyboard is open (html.kb-open) the bottom nav is
     removed from the flow entirely and the composer's bottom
     margin / safe-area inset collapse to 6px, so neither the nav's
     height nor the home-indicator inset holds the box up — that
     reserved space was the rest of the visible gap.
   - The same handler also guards the canvas and the code preview:
     a keyboard open/close NEVER reopens them. The canvas stays
     hidden unless openCanvasFull() set cvOpen, and a closed sheet
     stays closed (it is visibility:hidden in CSS and closeSheet()
     destroys its content), so no stale preview can flash back. */
function guardPreviewsClosed(){
  var cv=$('#canvasView');
  if(cv && !cvOpen) cv.hidden=true;
  if(sheet && !sheet.classList.contains('show') && sheetScrim) sheetScrim.classList.remove('show');
}
if(window.visualViewport){
  var vv=window.visualViewport;
  var kbBase=window.innerHeight;
  function onVV(){
    if(window.innerHeight>kbBase) kbBase=window.innerHeight;
    var layoutResized=(kbBase-window.innerHeight)>40;
    var kb=layoutResized? 0 : Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--kb', kb+'px');
    /* Fixed elements (sheets) anchor to the layout viewport, so for
       them the RAW visual-viewport delta is the exact keyboard
       overlap in every shell: 0 when the layout fully resized, the
       full keyboard height when it did not, and just the uncovered
       remainder when it resized only part way. */
    document.documentElement.style.setProperty('--kbFixed', Math.max(0, window.innerHeight - vv.height - vv.offsetTop)+'px');
    /* Keyboard open in EITHER shell: the visual viewport is much
       shorter than the full-height baseline. */
    var kbOpen=(kbBase - vv.height)>120 || kb>80;
    document.documentElement.classList.toggle('kb-open', kbOpen);
    guardPreviewsClosed();
  }
  vv.addEventListener('resize',onVV); vv.addEventListener('scroll',onVV); onVV();
  var kbInput=$('#chatInput');
  if(kbInput){
    /* Focus starts the keyboard animation before the viewport
       settles — flag it immediately so the nav drops and the box
       lands right the first time; blur hands control back to onVV. */
    kbInput.addEventListener('focus',function(){ document.documentElement.classList.add('kb-open'); guardPreviewsClosed(); });
    kbInput.addEventListener('blur',function(){ setTimeout(onVV,60); });
  }
} else {
  var kbInput2=$('#chatInput');
  if(kbInput2){
    kbInput2.addEventListener('focus',function(){ document.documentElement.classList.add('kb-open'); guardPreviewsClosed(); });
    kbInput2.addEventListener('blur',function(){ document.documentElement.classList.remove('kb-open'); guardPreviewsClosed(); });
  }
}
$('#paneTop').addEventListener('click',function(){ state.splitActive='top'; renderSplit(); });
/* Split divider drag: press and drag the handle to resize the panes.
   The ratio is kept between 20% and 80% so neither pane can vanish. */
var splitRatio=0.5;
function applySplitRatio(){
  $('#paneTop').style.flex=splitRatio+' 1 0';
  $('#paneBottom').style.flex=(1-splitRatio)+' 1 0';
}
(function(){
  var h=$('#splitHandle'); if(!h) return;
  var drag=null;
  h.addEventListener('pointerdown',function(e){
    var wrap=$('#splitWrap'); if(!wrap.classList.contains('show')) return;
    drag={y:e.clientY, h:wrap.getBoundingClientRect().height, r:splitRatio};
    h.classList.add('drag');
    try{ h.setPointerCapture(e.pointerId); }catch(err){}
    e.preventDefault();
  });
  h.addEventListener('pointermove',function(e){
    if(!drag) return;
    var nr=drag.r + (e.clientY-drag.y)/Math.max(drag.h,1);
    splitRatio=Math.min(0.8, Math.max(0.2, nr));
    applySplitRatio();
  });
  function end(){ drag=null; h.classList.remove('drag'); }
  h.addEventListener('pointerup',end);
  h.addEventListener('pointercancel',end);
})();
$('#paneBottom').addEventListener('click',function(){ state.splitActive='bottom'; renderSplit(); });
$('#splitSwap').addEventListener('click',function(e){ e.stopPropagation(); state.splitSwapped=!state.splitSwapped; renderSplit(); });
$('#splitClose').addEventListener('click',function(e){ e.stopPropagation(); exitSplit(); });
/* =============== Header & sidebar wiring =============== */
$('#chatsBtn').innerHTML=I.menu+'<span class="dot"></span>';
$('#tempBtn').innerHTML=I.temp;
$('#dotsBtn').innerHTML=I.dotsV;
$('#modelPillChev').innerHTML=I.chevD;
$('#plusBtn').innerHTML=I.plus;
sendBtn.innerHTML=I.send;
$('#sbNewIc').innerHTML=I.compose;
$('#sbNewTop').innerHTML=I.plus;
$('#sbSettings').innerHTML=I.gear;
$('#sbSearchIc').innerHTML=I.search;
$('#tabMainIc').innerHTML=I.chat;
$('#tabLibraryIc').innerHTML=I.library;
$('#sbArchive').innerHTML=I.archive;
$('#chatsBtn').addEventListener('click',function(){ setSidebar(!sbOpen(),true); });
/* Top-left companion to the chats button, same glass circle style,
   just smaller: + opens the + sheet. It never opens Settings. */
/* Header pill button: job follows the icon it is showing. Once the
   chat has started it shows the New chat (compose) icon, so a click
   starts a new chat — never Temporary chat. Before the first message
   it shows the Temporary chat icon and acts as the Temporary chat
   toggle. Temporary chat also has its own toggle row in the dots
   menu (handlePop 'temp'), which is the other place it can turn on. */
$('#tempBtn').addEventListener('click',function(){
  var c=currentChat();
  if(c && c.messages.length>0) newChat();
  else toggleTemp();
});
$('#dotsBtn').addEventListener('click',function(){
  /* Proper toggle: first click opens, second click on the same
     button closes — it never reopens an already-open menu. */
  if(pop.classList.contains('show') && popAnchor===this){ closePop(); popCtx=null; return; }
  popCtx={chatId:state.currentId};
  openPop(this.getBoundingClientRect(),[
    {id:'temp', icon:I.temp, label: state.temp?'Temporary chat: On':'Temporary chat: Off', dot:state.temp},
    {id:'split', icon:I.split, label: state.splitId?'Exit Split Screen':'Split Screen…'},
    {id:'share', icon:I.upload, label:'Share chat'},
    {sep:true},
    {id:'settings', icon:I.gear, label:'Settings'},
    {sep:true},
    {id:'clear', icon:I.trash, label:'Clear this chat', danger:true}
  ], this);
});
/* The "+ API / Model" pill is an API/key/model control, so it opens
   the + sheet straight at its inline Model section — provider, base
   URL, key, model, Save and Remove all live there now; it never
   opens Settings. */
$('#modelPill').addEventListener('click',function(){ openPlusSheet(true); });
$('#sbNew').addEventListener('click',newChat);
$('#sbNewTop').addEventListener('click',function(){ sbCreateAgent(); });
$('#sbSettings').addEventListener('click',function(){ setSidebar(false,true); openSettings('list'); });
$('#sbSearch').addEventListener('input',renderSidebar);
/* Selecting Search in the side menu opens the full-screen Search
   page (see below) — it no longer just filters the chats list. */
$('#sbSearchPill').addEventListener('click',function(){ openSearch(); });
$('#sbSearch').addEventListener('focus',function(){ openSearch(); });
$('#sbArchive').addEventListener('click',function(){ state.showArchived=!state.showArchived; renderSidebar(); });
/* =============== Full-screen Search ===============
   Searches with full chat context — message content (and code),
   the chat name, and the message date — never just chat titles.
   A result tap closes Search, opens that chat and jumps straight
   to the message with a one-shot highlight pulse. The bottom-bar
   X exits back to exactly where Search was opened from (the side
   menu stays open on mobile if it was open); the small circled x
   inside the pill only clears the typed text. */
var searchViewEl=$('#searchView'), searchInputEl=$('#searchInput'), searchResultsEl=$('#searchResults');
var searchWasSidebar=false;
$('#searchGear').innerHTML=I.gear;
$('#searchPillIc').innerHTML=I.search;
$('#searchClear').innerHTML=I.x;
$('#searchClose').innerHTML=I.x;
function fmtMsgDate(m){
  var d=(m && m.ts)? new Date(m.ts) : new Date();
  function dayKey(x){ return x.getFullYear()+'-'+x.getMonth()+'-'+x.getDate(); }
  var now=new Date();
  if(dayKey(d)===dayKey(now)) return 'Today';
  var y=new Date(now); y.setDate(y.getDate()-1);
  if(dayKey(d)===dayKey(y)) return 'Yesterday';
  return d.toLocaleDateString('en-GB',{day:'numeric', month:'short', year:'numeric'});
}
function searchAllChats(qRaw){
  var q=qRaw.trim().toLowerCase(); if(!q) return [];
  var words=q.split(/\s+/), out=[];
  chats.forEach(function(c){
    c.messages.forEach(function(m){
      var text=(m.text||'')+(m.code? '\n'+m.code.body : '');
      var dl=fmtMsgDate(m);
      var ctx=(text+' '+c.title+' '+dl).toLowerCase();
      for(var i=0;i<words.length;i++){ if(ctx.indexOf(words[i])<0) return; }
      var score=text.toLowerCase().indexOf(q)>=0 ? 0 : (c.title.toLowerCase().indexOf(q)>=0 ? 1 : 2);
      out.push({chat:c, msg:m, score:score, date:dl});
    });
  });
  out.sort(function(a,b){ return a.score-b.score; });
  return out.slice(0,60);
}
function srSnippetHTML(text, qRaw){
  var plain=(text||'').replace(/\s+/g,' ').trim();
  var q=qRaw.trim().toLowerCase();
  var idx=q? plain.toLowerCase().indexOf(q) : -1, hl=q;
  if(idx<0 && q){ var ws=q.split(/\s+/); for(var i=0;i<ws.length;i++){ var j=plain.toLowerCase().indexOf(ws[i]); if(j>=0){ idx=j; hl=ws[i]; break; } } }
  var start=0, disp=plain;
  if(idx>50){ start=idx-30; disp='…'+plain.slice(start); idx=idx-start+1; }
  if(disp.length>170) disp=disp.slice(0,170)+'…';
  if(idx>=0 && hl){
    var at=disp.toLowerCase().indexOf(hl, Math.max(0,idx-2));
    if(at>=0) return esc(disp.slice(0,at))+'<b>'+esc(disp.slice(at,at+hl.length))+'</b>'+esc(disp.slice(at+hl.length));
  }
  return esc(disp);
}
function renderSearch(){
  var q=searchInputEl.value;
  $('#searchClear').classList.toggle('show', q.length>0);
  if(!q.trim()){
    searchResultsEl.innerHTML='<div class="search-empty">'+I.search+'<span>Search messages</span></div>';
    return;
  }
  var hits=searchAllChats(q);
  if(!hits.length){
    searchResultsEl.innerHTML='<div class="search-empty">'+I.search+'<span>No results for &ldquo;'+esc(q.trim())+'&rdquo;</span></div>';
    return;
  }
  searchResultsEl.innerHTML=hits.map(function(h){
    return '<button class="sr-row" data-schat="'+h.chat.id+'" data-smsg="'+h.msg.id+'">'
      +'<div class="sr-snip">'+srSnippetHTML(msgFullText(h.msg), q)+'</div>'
      +'<div class="sr-meta">'+esc(h.date)+' &middot; '+esc(h.chat.title)+'</div></button>';
  }).join('');
  searchResultsEl.scrollTop=0;
  searchResultsEl.querySelectorAll('[data-schat]').forEach(function(b){
    b.addEventListener('click',function(){ jumpToMessage(b.getAttribute('data-schat'), b.getAttribute('data-smsg')); });
  });
}
function openSearch(){
  if(searchViewEl.classList.contains('show')) return;
  searchWasSidebar=sbOpen();
  closePop(); closeMsgMenu();
  searchViewEl.classList.add('show');
  renderSearch();
  setTimeout(function(){ searchInputEl.focus(); },60);
}
function hideSearch(restore){
  searchViewEl.classList.remove('show');
  searchInputEl.value=''; searchInputEl.blur();
  var sb=$('#sbSearch'); if(sb) sb.value='';
  renderSidebar();
  if(restore && window.innerWidth<820 && searchWasSidebar) setSidebar(true,true);
}
function closeSearch(){ hideSearch(true); }
function jumpToMessage(chatId, msgId){
  hideSearch(false);
  openChat(chatId);
  setTimeout(function(){
    var els=document.querySelectorAll('.msg[data-msg-id="'+msgId+'"]'), target=null;
    for(var i=0;i<els.length;i++){ if(els[i].offsetParent!==null){ target=els[i]; break; } }
    if(!target && els.length) target=els[0];
    if(!target) return;
    target.scrollIntoView({block:'center', behavior:'smooth'});
    target.classList.add('jump-flash');
    setTimeout(function(){ target.classList.remove('jump-flash'); },1750);
  },90);
}
searchInputEl.addEventListener('input',renderSearch);
searchInputEl.addEventListener('keydown',function(e){ if(e.key==='Escape'){ e.preventDefault(); closeSearch(); } });
$('#searchClear').addEventListener('click',function(){ searchInputEl.value=''; renderSearch(); searchInputEl.focus(); });
$('#searchClose').addEventListener('click',closeSearch);
$('#searchGear').addEventListener('click',function(){ hideSearch(false); setSidebar(false,true); openSettings('list'); });
/* Side menu TABS — only Main chat and Library, as in the screenshot.
   Main chat returns to the continuous main chat; Library opens the
   IDE / library panel (the original Library & Code destination).
   Long press (480ms, as the note says) swaps the two rows' order and
   swallows the click that follows, so reordering never also opens. */
function setTabSel(which){
  $('#tabMain').classList.toggle('sel', which==='main');
  $('#tabLibrary').classList.toggle('sel', which==='library');
}
function openLibraryTab(){
  /* The sidebar Library tab opens the Library (Artefacts / Media)
     smoothly as the stage view. Clicking Library again while it is
     already open just opens the chat menu over it — the Library is
     never changed or closed by that click. */
  if(state.view==='settings' && lastSetView==='memorylib'){ setSidebar(true,true); return; }
  libReturn='tab'; libMenuOpen=false; setTabSel('library');
  if(state.view==='settings') renderSettings('memorylib'); else openSettings('memorylib');
  setSidebar(false,true);
}
(function(){
  var pressT=null, swapped=false;
  function arm(btn){
    btn.addEventListener('pointerdown',function(){
      swapped=false;
      pressT=setTimeout(function(){
        var p=$('#sbTabs'); if(p && p.firstElementChild) p.appendChild(p.firstElementChild);
        swapped=true; toast('Tabs reordered');
      },480);
    });
    ['pointerup','pointerleave','pointercancel'].forEach(function(ev){ btn.addEventListener(ev,function(){ clearTimeout(pressT); }); });
  }
  var tm=$('#tabMain'), tl=$('#tabLibrary');
  arm(tm); arm(tl);
  tm.addEventListener('click',function(){ if(swapped){ swapped=false; return; } setTabSel('main'); var mca=(typeof chatAgent==='function')?chatAgent():null; if(mca && mca.individualHistory){ var ac=ensureAgentChat(mca); if(ac){ openChat(ac.id); return; } } openChat('main'); });
  tl.addEventListener('click',function(){ if(swapped){ swapped=false; return; } openLibraryTab(); });
})();
$('#sbList').addEventListener('keydown',function(e){
  if(e.key!=='Enter') return;
  var row=e.target.closest('.chat-row'); if(row && !e.target.closest('[data-menu]')) openChat(row.getAttribute('data-id'));
});
$('#sbList').addEventListener('click',function(e){
  if(window.__axoSuppressRowClick && Date.now()<window.__axoSuppressRowClick){ window.__axoSuppressRowClick=0; return; }
  var menuBtn=e.target.closest('[data-menu]');
  var row=e.target.closest('.chat-row'); if(!row) return;
  var id=row.getAttribute('data-id');
  if(menuBtn){
    e.stopPropagation();
    /* Same toggle rule as the header dots button. */
    if(pop.classList.contains('show') && popAnchor===menuBtn){ closePop(); popCtx=null; return; }
    popCtx={chatId:id};
    openPop(menuBtn.getBoundingClientRect(),[
      {id:'openchat', icon:I.chat, label:'Open chat'},
      {id:'split', icon:I.split, label: state.splitId===id?'Exit Split Screen':'Split Screen'},
      {id:'rename', icon:I.edit, label:'Rename'},
      {sep:true},
      {id:'delete', icon:I.trash, label:'Delete', danger:true}
    ], menuBtn);
    return;
  }
  openChat(id);
});
/* Sidebar row swipe — same model as the source code (Sidebar.tsx):
   swipe LEFT = delete (in-app confirmation), swipe RIGHT = fast open,
   tap = open. Touch events with direction lock: once a horizontal drag
   locks in, the list scroll and the sidebar drag are shut out, so the
   gesture cannot be stolen or cancelled mid-swipe. */
(function(){
  var list=$('#sbList');
  var g=null; /* {id, main, startX, startY, dx, locked} */
  function begin(target, x, y){
    var r=target.closest('.chat-row');
    if(!r || target.closest('[data-menu]')) { g=null; return; }
    g={ id:r.getAttribute('data-id'), main:r.querySelector('.chat-row-main'), startX:x, startY:y, dx:0, locked:null };
  }
  function drag(x, y, prevent){
    if(!g) return;
    var dx=x-g.startX, dy=y-g.startY;
    if(!g.locked){
      /* Horizontal needs clear dominance — a vertical scroll of the
         chats list (which drifts sideways a few px) must lock to 'v'
         and scroll freely, never into a row swipe. */
      if(Math.abs(dy)>10 && Math.abs(dy)>=Math.abs(dx)) g.locked='v';
      else if(Math.abs(dx)>14 && Math.abs(dx)>Math.abs(dy)*1.5) g.locked='h';
    }
    if(g.locked==='h'){
      if(prevent) prevent();
      g.dx=Math.max(-110, Math.min(110, dx));
      g.main.style.transition='none';
      g.main.style.transform='translateX('+g.dx+'px)';
      /* Original under-layer: one tinted side at a time — red Delete
         revealed on a left swipe, blue Open on a right swipe. */
      var row=g.main.parentElement, u=row?row.querySelector('.chat-row-under'):null;
      if(u){
        var left=g.dx<0;
        u.style.opacity='1';
        u.style.background=left?'rgba(255,69,58,.72)':'rgba(10,132,255,.72)';
        u.style.justifyContent=left?'flex-end':'flex-start';
        var o=u.querySelector('.u-open'), d=u.querySelector('.u-del');
        if(o) o.style.display=left?'none':'flex';
        if(d) d.style.display=left?'flex':'none';
      }
    }
  }
  function finish(commit){
    if(!g) return;
    var dx=g.dx, id=g.id, main=g.main, locked=g.locked; g=null;
    main.style.transition='transform .25s cubic-bezier(.32,.72,0,1)';
    main.style.transform='';
    var rowU=main.parentElement?main.parentElement.querySelector('.chat-row-under'):null;
    setTimeout(function(){ main.style.transition=''; if(rowU) rowU.style.opacity='0'; },260);
    if(commit && locked==='h' && Math.abs(dx)>=20) window.__axoSuppressRowClick=Date.now()+400;
    if(commit){
      if(dx<=-56) askDelete(id);
      else if(dx>=56) openChat(id);
    }
  }
  list.addEventListener('touchstart',function(e){ var t=e.touches[0]; if(t) begin(e.target, t.clientX, t.clientY); },{passive:true});
  list.addEventListener('touchmove',function(e){ var t=e.touches[0]; if(t) drag(t.clientX, t.clientY, function(){ e.preventDefault(); }); },{passive:false});
  list.addEventListener('touchend',function(){ finish(true); });
  list.addEventListener('touchcancel',function(){ finish(false); });
  /* Mouse / pen drag uses pointer events; touch is handled above. */
  list.addEventListener('pointerdown',function(e){ if(e.pointerType==='touch') return; begin(e.target, e.clientX, e.clientY); },{passive:true});
  list.addEventListener('pointermove',function(e){ if(e.pointerType==='touch') return; drag(e.clientX, e.clientY, null); },{passive:true});
  list.addEventListener('pointerup',function(e){ if(e.pointerType==='touch') return; finish(true); });
  list.addEventListener('pointercancel',function(e){ if(e.pointerType==='touch') return; finish(false); });
})();
/* =============== Link previews ===============
   Pasting (or typing) a link in the composer automatically adds a
   preview card — preview image, title, site — in a small stack
   directly above the composer, like the file chip. On send, the same
   cards move into the sent message. Preview data comes from the
   page's own open-graph tags via the Microlink API; YouTube thumbnails
   and direct image/video links resolve instantly on-device. There is
   no limit on how many links can be queued. */
function extractUrls(text){
  var out=[], re=/(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/g, mm;
  while((mm=re.exec(text||''))){
    var u=mm[1].replace(/[.,;:!?)\]]+$/,'');
    if(u && out.indexOf(u)<0) out.push(u);
  }
  return out;
}
function normalizeUrl(u){ return /^https?:\/\//i.test(u)? u : 'https://'+u; }
function linkDomain(u){ try{ return new URL(normalizeUrl(u)).hostname.replace(/^www\./,''); }catch(e){ return u; } }
function makeLinkEntry(raw){
  var url=normalizeUrl(raw), dom=linkDomain(url);
  var e={url:url, domain:dom, title:'', desc:'', image:'',
    favicon:'https://www.google.com/s2/favicons?domain='+encodeURIComponent(dom)+'&sz=64', loading:true};
  var yt=url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  var isDirectImg=/\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i.test(url);
  var isDirectVid=/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
  if(yt){ e.image='https://i.ytimg.com/vi/'+yt[1]+'/hqdefault.jpg'; e.title='YouTube video'; }
  else if(isDirectImg){ e.image=url; e.title=decodeURIComponent(url.split('/').pop()||'Image'); }
  else if(isDirectVid){ e.title=decodeURIComponent(url.split('/').pop()||'Video'); }
  if(!isDirectImg && !isDirectVid) enrichLink(e);
  else e.loading=false;
  return e;
}
function enrichLink(e){
  fetch('https://api.microlink.io/?url='+encodeURIComponent(e.url))
    .then(function(r){ return r.json(); })
    .then(function(j){
      var d=j && j.data; e.loading=false;
      if(d){
        if(d.title) e.title=d.title;
        if(d.description) e.desc=d.description;
        if(d.image && d.image.url && !e.image) e.image=d.image.url;
        if(d.logo && d.logo.url) e.favicon=d.logo.url;
      }
      refreshLinkViews();
    })
    .catch(function(){ e.loading=false; refreshLinkViews(); });
}
function refreshLinkViews(){
  renderLinkPreviews();
  /* A preview that finishes loading after its message was sent still
     fills in the card inside that message (same entry object). */
  if(state.view==='chat' && !msgMenu.classList.contains('show')) renderAll();
}
function ensurePendingLink(raw){
  var url=normalizeUrl(raw);
  for(var i=0;i<state.pendingLinks.length;i++) if(state.pendingLinks[i].url===url) return state.pendingLinks[i];
  var e=makeLinkEntry(raw);
  state.pendingLinks.push(e);
  renderLinkPreviews(); updateSend();
  return e;
}
function scanInputForLinks(){
  extractUrls(input.value).forEach(function(u){ ensurePendingLink(u); });
}
function renderLinkPreviews(){
  var r=$('#linkPreviewRow'); if(!r) return;
  r.innerHTML=state.pendingLinks.map(function(e,i){
    var thumb=e.image? '<img class="lp-thumb" src="'+escA(e.image)+'" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span class="lp-thumb-ph" style="display:none">'+I.link+'</span>'
      : '<span class="lp-thumb-ph">'+I.link+'</span>';
    return '<div class="lp-pending">'+thumb+'<span class="lp-meta"><span class="lp-title">'+esc(e.title||e.domain)+'</span><span class="lp-url" style="display:block">'+esc(e.url)+'</span></span>'
      +'<button class="lp-x" data-lpdel="'+i+'" aria-label="Remove link preview">'+I.x+'</button></div>';
  }).join('');
  r.classList.toggle('show', state.pendingLinks.length>0);
  r.querySelectorAll('[data-lpdel]').forEach(function(b){
    b.addEventListener('click',function(){
      state.pendingLinks.splice(+b.getAttribute('data-lpdel'),1);
      renderLinkPreviews(); updateSend();
    });
  });
}
function openLinkSheet(){
  openSheet('<button class="sheet-back" id="linkBack">'+I.back+'<span>Add link</span></button>'
    +'<p class="sub">Paste any link — its preview card appears above the chat box, and sends inside your message. No limit.</p>'
    +'<div class="field"><label>Link</label><input id="linkUrlIn" type="url" placeholder="https://…" autocomplete="off"></div>'
    +'<button class="btn-primary" id="linkAddBtn">Add link</button><button class="btn-ghost" id="linkCancel">Cancel</button>');
  $('#linkBack').addEventListener('click',function(){ openPlusSheet('list'); });
  $('#linkCancel').addEventListener('click',closeSheet);
  $('#linkAddBtn').addEventListener('click',function(){
    var v=$('#linkUrlIn').value.trim();
    var found=extractUrls(v);
    if(!found.length && /^[^\s]+\.[^\s]{2,}$/.test(v)) found=[v];
    if(!found.length){ toast('Paste a full link first'); return; }
    found.forEach(function(u){ ensurePendingLink(u); });
    closeSheet(); input.focus(); toast('Link preview added');
  });
  setTimeout(function(){ var li=$('#linkUrlIn'); if(li) li.focus(); },80);
}
/* =============== + sheet & files =============== */
/* EVERY + feature works right here in the + sheet — Model/API key,
   Skills, Connectors, Design system and all switches are edited
   inline below; nothing in this sheet sends the user to Settings.
   Both places write the same `state`, so Settings (if opened later
   for anything else) always shows the same values. */
function plusSwitchRow(id, icon, label, key){
  return '<button class="sheet-row" data-psw="'+id+'">'+icon+'<span>'+label+'</span>'
    +'<span class="switch" role="switch" aria-checked="'+!!state[key]+'" data-pswkey="'+key+'"></span></button>';
}
function openPlusSheet(view){
  /* Navigation: the sheet ALWAYS opens on its full list with every
     section CLOSED (collapsed to one row each) — never all expanded
     at once. Tapping a menu row swaps the whole sheet to show ONLY
     that selected menu; its back button (top of the sub-menu) returns
     to the full list. view: 'list' (default) | 'model' | 'connectors'
     | 'design' | 'skills' | 'project'. true still means 'model' (the
     "+ API / Model" pill lands straight on the Model menu only). */
  var v = view===true ? 'model' : (typeof view==='string' ? view : 'list');
  var accents=[{n:'White', v:'#ffffff'},{n:'Blue', v:'#0a84ff'},{n:'Silver', v:'#c7c7cc'},{n:'Graphite', v:'#636366'}];
  function backHead(title){
    return '<button class="sheet-back" id="plusBack">'+I.back+'<span>'+esc(title)+'</span></button>';
  }
  function navRow(nav, icon, label, val){
    return '<button class="sheet-row" data-pnav="'+nav+'">'+icon+'<span>'+label+'</span><span class="val">'+esc(val)+'</span><span class="chev">'+I.chevR+'</span></button>';
  }
  var html='';
  if(v==='model'){
    /* ---- Model / API — only this menu ---- */
    html=backHead('Model')
    +'<p class="sub" style="margin:0 0 10px">Just paste a key — provider, base URL and model are selected automatically. Add as many as you like; if a model fails, every other model on that key is tried, then every model on the next key, and only then is an error shown.</p>'
    + apiListHTML()
    +'<div class="field"><label>API key</label><input id="plusKey" type="password" placeholder="Paste any API key" autocomplete="off"></div>'
    +'<button class="btn-primary" id="plusApiAdd" style="margin-top:2px">Add API</button>'
    +'<p class="sub" id="plusTestMsg" style="margin:10px 0 0" aria-live="polite">'+esc(apiTestMsgText)+'</p>'
    +'<p class="sub" style="margin:10px 0 0">Status: '+esc(apiStatusText())+'</p>';
  } else if(v==='connectors'){
    /* ---- Connectors — only this menu ---- */
    html=backHead('Connectors')
    + plusSwitchRow('websearch', I.search, 'Web search', 'webSearch')
    +'<p class="sub" style="margin:10px 0 0">When on, /search fetches live sources. Online Search is the only connector in this build.</p>';
  } else if(v==='design'){
    /* ---- Design system — only this menu ---- */
    html=backHead('Design system')
    +'<div class="field"><label>Theme</label><div class="seg" id="plusThemeSeg"><button data-v="black">Black</button><button data-v="white">White</button></div></div>'
    +'<div class="field" style="margin-bottom:2px"><label>Accent</label><div class="swatch-row">'
    + accents.map(function(a){ return '<button class="swatch'+(state.accent===a.v?' sel':'')+'" data-pacc="'+a.v+'" data-paccn="'+a.n+'"><i style="background:'+a.v+'"></i>'+a.n+'</button>'; }).join('')
    +'</div></div>';
  } else if(v==='skills'){
    /* ---- Skills — only this menu ---- */
    html=backHead('Skills')
    +'<p class="sub" style="margin:0 0 10px"><span id="plusSkillCount">'+enabledSkills()+'/'+SKILLS.length+' on</span> — tap to toggle.</p>'
    +'<div class="plus-skills">'
    + SKILLS.map(function(s){ return '<button class="sheet-row" data-pskill="'+s+'"><span style="flex:1;min-width:0"><span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+s+'</span>'+(SKILL_DESCS[s]?'<span style="display:block;color:var(--muted);font-size:12.5px;font-weight:400;margin-top:2px;line-height:1.35">'+esc(SKILL_DESCS[s])+'</span>':'')+'</span><span class="switch" role="switch" aria-checked="'+state.skillsOn[s]+'"></span></button>'; }).join('')
    +'</div><p class="sub" style="margin:8px 0 0">Use /skill &lt;name&gt; in chat to apply one to the next reply — or run it directly: /get-more-perspectives, /match-my-writing-style, /focus-my-energy.</p>';
  } else if(v==='project'){
    /* ---- Add to project — only this menu ---- */
    html=backHead('Add to project')
    +'<p class="sub" style="margin:0 0 6px">Open a chat beside this one in split screen.</p>'
    + chats.filter(function(c){return c.id!==state.currentId;}).map(function(c){ return '<button class="sheet-row" data-proj="'+c.id+'"><span>'+esc(c.title)+'</span><span class="val">Open in split</span></button>'; }).join('')
    + (chats.length<2 ? '<p class="sub" style="margin:8px 0">No other chat yet — start one from the sidebar first.</p>' : '');
  } else {
    /* ---- Full list — every section closed / collapsed ---- */
    v='list';
    html='<h3>Add</h3>'
    +'<button class="sheet-row" data-pact="upload">'+I.upload+'<span>Send anything</span><span class="val">Images · video · files — no limit</span></button>'
    +'<button class="sheet-row" data-pact="link">'+I.link+'<span>Add link</span><span class="val">Auto preview</span></button>'
    + navRow('project', I.folder, 'Add to project', 'Split workspace')
    +'<button class="sheet-row" data-pact="coder">'+I.code+'<span>CodeR</span><span class="val">Code mode</span></button>'
    +'<button class="sheet-row" data-pact="quiz">'+I.quiz+'<span>Quizzes</span><span class="val">One quick question</span></button>'
    + plusSwitchRow('think', I.brain, 'Deep Thinking', 'deepThink')
    + plusSwitchRow('memorysw', I.bookmark, 'Memory', 'memory')
    + navRow('model', I.cpu, 'Model', !state.apiKey?'Not set':state.apiHealth==='quota'?'Quota reached':state.apiHealth==='error'?'Not working':(state.model||keySummary()))
    + navRow('connectors', I.link, 'Connectors', state.webSearch?'Web search on':'Web search off')
    + plusSwitchRow('canvas', I.code, 'Canvas', 'canvasMode')
    + navRow('skills', I.layers, 'Skills', enabledSkills()+'/'+SKILLS.length+' on');
  }
  openSheet(html);
  /* Back button: a sub-menu returns to the full list. */
  var pb=$('#plusBack'); if(pb) pb.addEventListener('click',function(){ openPlusSheet('list'); });
  /* List rows navigate to their sub-menu (selected menu only). */
  sheet.querySelectorAll('[data-pnav]').forEach(function(b){
    b.addEventListener('click',function(){ openPlusSheet(b.getAttribute('data-pnav')); });
  });
  /* Quick actions (list only) */
  sheet.querySelectorAll('[data-pact]').forEach(function(b){
    b.addEventListener('click',function(){
      var id=b.getAttribute('data-pact');
      closeSheet();
      if(id==='upload'){ openFileSheet(); }
      else if(id==='link'){ openLinkSheet(); }
      else if(id==='coder'){ state.route='code'; updateTargetLine(); input.focus(); toast('Next message: code mode'); }
      else if(id==='quiz'){ sendText('Quiz me with one quick question'); }
    });
  });
  sheet.querySelectorAll('[data-proj]').forEach(function(b){
    b.addEventListener('click',function(){ closeSheet(); enterSplit(b.getAttribute('data-proj')); });
  });
  /* Inline switches (Deep Thinking, Memory in the list; Web search in Connectors) */
  sheet.querySelectorAll('[data-psw]').forEach(function(b){
    b.addEventListener('click',function(){
      var sw=b.querySelector('[data-pswkey]'); if(!sw) return;
      var key=sw.getAttribute('data-pswkey');
      state[key]=!state[key];
      sw.setAttribute('aria-checked',String(state[key]));
      var labels={deepThink:'Deep Thinking', memory:'Memory', webSearch:'Web search', canvasMode:'Canvas'};
      toast((labels[key]||key)+' '+(state[key]?'on':'off'));
    });
  });
  /* Inline skills toggles (Skills menu only) */
  sheet.querySelectorAll('[data-pskill]').forEach(function(b){
    b.addEventListener('click',function(){
      var s=b.getAttribute('data-pskill'); state.skillsOn[s]=!state.skillsOn[s];
      b.querySelector('.switch').setAttribute('aria-checked',String(state.skillsOn[s]));
      var cnt=$('#plusSkillCount'); if(cnt) cnt.textContent=enabledSkills()+'/'+SKILLS.length+' on';
    });
  });
  /* Inline Model / API (Model menu only): paste a key, Add, done —
     detection and selection are automatic, and the menu re-renders
     in place so the new API row and status are right there. */
  var plusAdd=$('#plusApiAdd');
  if(plusAdd){
    wireApiList(sheet, function(){ openPlusSheet('model'); });
    plusAdd.addEventListener('click',function(){
      var k=$('#plusKey').value.trim();
      if(!k){ toast('Paste a key first'); return; }
      plusAdd.disabled=true; plusAdd.textContent='Detecting…';
      addApiKey(k).then(function(e){ toast(e? 'Added — '+apiEntryLabel(e) : 'Added'); openPlusSheet('model'); });
    });
  }
  /* Inline Design system (Design menu only) */
  if($('#plusThemeSeg')) segWire('#plusThemeSeg', state.theme, function(v2){ state.theme=v2; document.documentElement.setAttribute('data-theme', v2); });
  sheet.querySelectorAll('[data-pacc]').forEach(function(b){ b.addEventListener('click',function(){
    state.accent=b.getAttribute('data-pacc'); state.accentName=b.getAttribute('data-paccn');
    applyAccent();
    sheet.querySelectorAll('[data-pacc]').forEach(function(x){x.classList.remove('sel');}); b.classList.add('sel');
  }); });
}

$('#plusBtn').addEventListener('click',function(){ openPlusSheet(false); });
function openProfileSheet(){
  openSheet(profileSheetHTML());
  wireProfileSave();
}
function openFileSheet(){
  /* Send anything — links, images, files, video, anything, with NO
     limit: every picker is multiple, none has a count or size cap,
     and the "anything" picker has no type filter at all. */
  openSheet('<button class="sheet-back" id="fileBack">'+I.back+'<span>Send anything</span></button>'
    +'<p class="sub">Links, images, files, video — anything. No limit on how many you attach.</p>'
    +(state.attachments.length? state.attachments.map(function(f){ return '<div class="sheet-row">'+(typeof f==='string'?I.folder:(f.kind==='image'?I.image:(f.kind==='video'?I.video:I.file)))+'<span>'+esc(typeof f==='string'?f:(f.name||'File'))+'</span></div>'; }).join('') : '')
    +'<button class="sheet-row" id="pickImages">'+I.image+'<span>Photos &amp; images</span><span class="val">No limit</span></button>'
    +'<button class="sheet-row" id="pickVideos">'+I.video+'<span>Video</span><span class="val">No limit</span></button>'
    +'<button class="sheet-row" id="pickFiles">'+I.folder+'<span>Files — anything</span><span class="val">Any type</span></button>'
    +'<button class="sheet-row" id="pickLink">'+I.link+'<span>Add link</span><span class="val">Auto preview</span></button>'
    +'<button class="btn-ghost" id="pfCancel">Cancel</button>');
  $('#fileBack').addEventListener('click',function(){ openPlusSheet('list'); });
  $('#pickImages').addEventListener('click',function(){ $('#imagePicker').click(); });
  $('#pickVideos').addEventListener('click',function(){ $('#videoPicker').click(); });
  $('#pickFiles').addEventListener('click',function(){ $('#filePicker').click(); });
  $('#pickLink').addEventListener('click',function(){ openLinkSheet(); });
  $('#pfCancel').addEventListener('click',closeSheet);
}
function attKindOf(f){
  var t=(f && f.type)||'';
  if(t.indexOf('image/')===0) return 'image';
  if(t.indexOf('video/')===0) return 'video';
  if(t.indexOf('audio/')===0) return 'audio';
  return 'file';
}
function handlePickedFiles(fileList){
  var files=Array.prototype.slice.call(fileList||[]);
  files.forEach(function(f){
    var kind=attKindOf(f);
    var rec={name:f.name, size:f.size, type:f.type||'', kind:kind,
      url:(kind==='image'||kind==='video')? URL.createObjectURL(f) : ''};
    state.attachments.push(rec);
    /* Text and code attachments are read locally so a connected
       model can actually inspect and fix the file the user sent,
       instead of only seeing its filename. Binary files are not
       decoded or sent as text. */
    var type=(f.type||'').toLowerCase(), fname=(f.name||'').toLowerCase();
    var readable=kind==='file' && (type.indexOf('text/')===0 || /^(application\/(json|javascript|xml|xhtml\+xml)|image\/svg\+xml)$/.test(type) || /\.(txt|md|html?|css|scss|js|jsx|ts|tsx|json|xml|svg|py|java|c|cc|cpp|h|hpp|cs|php|rb|go|rs|swift|kt|sql|sh|ya?ml|toml|ini|csv)$/i.test(fname));
    if(readable && window.FileReader){
      try{
        var reader=new FileReader();
        reader.onload=function(){
          var txt=String(reader.result||'');
          rec.textContent=txt.slice(0,60000);
          rec.textTruncated=txt.length>60000;
        };
        reader.readAsText(f);
      }catch(e){}
    }
  });
  renderAttach(); closeSheet(); updateSend();
  if(files.length) toast(files.length===1?'Attached — ready to send':'Files attached — ready to send');
}
['#filePicker','#imagePicker','#videoPicker'].forEach(function(sel){
  $(sel).addEventListener('change',function(){ handlePickedFiles(this.files); this.value=''; });
});
function renderAttach(){
  var r=$('#attachRow');
  r.innerHTML=state.attachments.map(function(f,i){
    if(typeof f==='string') return '<span class="attach-chip">'+I.folder+'<span>'+esc(f)+'</span><button data-detach="'+i+'" aria-label="Remove">'+I.x+'</button></span>';
    var lead=f.kind==='image' && f.url? '<img class="athumb" src="'+escA(f.url)+'" alt="">' : (f.kind==='video'?I.video:(f.kind==='image'?I.image:I.file));
    return '<span class="attach-chip">'+lead+'<span>'+esc(f.name||'File')+'</span>'+(f.size!=null?'<span class="asz">'+esc(fmtSize(f.size))+'</span>':'')+'<button data-detach="'+i+'" aria-label="Remove">'+I.x+'</button></span>';
  }).join('');
  r.classList.toggle('show', state.attachments.length>0);
  r.querySelectorAll('[data-detach]').forEach(function(b){ b.addEventListener('click',function(){
    var gone=state.attachments.splice(+b.getAttribute('data-detach'),1)[0];
    if(gone && gone.url) { try{ URL.revokeObjectURL(gone.url); }catch(e){} }
    renderAttach(); updateSend();
  }); });
}
/* =============== Settings =============== */
var setView=$('#settingsView');
function setHead(title, topic){
  return '<div class="set-head"><button class="circle-btn" id="setBack" aria-label="Back">'+I.back+'</button><h2>'+esc(title)+'</h2>'
    +(topic? '<button class="qbtn" data-q="'+topic+'" aria-label="More detail" style="width:38px;height:38px;font-size:16px">?</button>' : '<span style="width:38px"></span>')+'</div>';
}
function wireBack(fn){ var b=$('#setBack'); if(b) b.addEventListener('click',fn); }
function openSettings(view, origin){
  /* Origin remembers HOW this view was entered, so its back button
     returns to the right place: 'library' (the sidebar Library tab)
     backs out to the side menu — never to the Settings list — while
     every Settings entry ('list', gear, dots menu, /settings and the
     other direct commands) uses the collapsed Settings navigation:
     open on the full list, one row per section, a tapped row replaces
     the list with only that section, back returns to the full list. */
  if(origin) state.settingsOrigin=origin;
  else if(view==='list'||!state.settingsOrigin) state.settingsOrigin='settings';
  state.view='settings';
  $('#chatHead').style.display='none'; $('#composerZone').style.display='none'; $('#chatScroll').style.display='none'; var ahb=$('#agentHeadBar'); if(ahb) ahb.style.display='none';
  $('#splitWrap').classList.remove('show'); $('#splitBar').classList.remove('show');
  document.querySelector('.bottomblur').style.display='none'; document.querySelector('.topblur').style.display='none';
  setView.style.display='flex'; setView.classList.add('show');
  renderSettings(view||'list');
}
function closeSettings(){
  if(state.view!=='settings') return;
  if(typeof setTabSel==='function') setTabSel('main');
  state.settingsOrigin=null;
  state.view='chat';
  setView.classList.remove('show'); setView.style.display='none';
  $('#chatHead').style.display=''; $('#composerZone').style.display='';
  document.querySelector('.bottomblur').style.display=''; document.querySelector('.topblur').style.display='';
  renderAll();
  syncBnav();
}
function keySummary(){ var e=activeApiEntry(); return e? (API_PROVIDERS[e.provider]? API_PROVIDERS[e.provider].name : 'API') : 'Not set'; }
function enabledSkills(){ return SKILLS.filter(function(s){return state.skillsOn[s];}).length; }
var lastSetView=null;
function renderSettings(view){
  /* Re-rendering the SAME Settings screen in place (e.g. saving a key)
     keeps the scroll offset; moving to a different screen starts at
     its top, as expected. */
  var prevScroll=setView.querySelector('.set-scroll');
  var keepSetTop=(prevScroll && lastSetView===view)?prevScroll.scrollTop:null;
  lastSetView=view;
  renderSettingsInner(view);
  syncBnav();
  if(keepSetTop!=null){ var s2=setView.querySelector('.set-scroll'); if(s2) s2.scrollTop=keepSetTop; }
}
function renderSettingsInner(view){
  if(view==='apis') return settingsApis();
  if(view==='usage') return settingsUsage();
  if(view==='ai') return settingsAI();
  if(view==='connectors') return settingsConnectors();
  if(view==='memory') return settingsMemory();
  if(view==='appearance') return settingsAppearance();
  if(view==='agentedit') return settingsAgentEdit();
  if(view==='subagents') return settingsSubAgents();
  if(view==='agentcreate') return settingsAgentCreate();
  if(view==='code') return settingsSimple('Code & Play Preview','code',[['Preview order', state.autoPlay?'Play First':'Code First']], '<button class="sheet-row" id="apTog"><span>Auto-play preview</span><span class="switch" role="switch" aria-checked="'+state.autoPlay+'"></span></button>', function(){ $('#apTog').addEventListener('click',function(){ state.autoPlay=!state.autoPlay; renderSettings('code'); }); });
  if(view==='skills') return settingsSkills();
  if(view==='commands') return settingsCommands();
  if(view==='dashboard') return settingsDashboard();
  if(view==='ide') return settingsIDE();
  if(view==='agents') return settingsAgents();
  if(view==='agentpage') return settingsAgent();
  if(view==='agentprofile') return settingsAgentProfile();
  if(view==='avataredit') return settingsAvatarEdit();
  if(view==='agentfile') return settingsAgentFile();
  if(view==='memorylib') return settingsLibrary();
  if(view==='goals') return settingsGoals();
  if(view==='terminal') return settingsSimple('Terminal','commands',[['Commands run','0'],['Runs in','Play preview pane']], '<p class="set-note">Terminal-style commands from chats are listed here. Code previews run in the Play pane.</p>', null);
  if(view==='history') return settingsHistory();
  if(view==='safety') return settingsSimple('Privacy & safety','safety',[['Key storage','This session only'],['Chats','This preview only'],['Connectors','Online Search only']], '<p class="set-note">Your key is used only for calls to the provider you picked in APIs & Providers.</p>', null);
  if(view==='about') return settingsSimple('About', null, [['App', appNameShort()],['Version','v1.2'],['Build','This code, as main']], '<p class="set-note">Open source, your key, your chats.</p>', null);
  settingsList();
}
function segWire(sel, val, fn){
  var box=$(sel); if(!box) return;
  box.querySelectorAll('button').forEach(function(b){
    if(b.getAttribute('data-v')===val) b.classList.add('sel');
    b.addEventListener('click',function(){ fn(b.getAttribute('data-v')); box.querySelectorAll('button').forEach(function(x){x.classList.remove('sel');}); b.classList.add('sel'); });
  });
}
function settingsList(){
  /* The Settings list always opens Agents files in its normal
     folder view — the flat all-files mode is only for Library →
     System files, and it is exited before landing here. */
  agentsShowAll=false; agentsFromLib=false;
  var groups=[
    {rows:[
      {id:'apis', icon:I.key, label:'APIs & Providers', val:!state.apiKey?'Not set':state.apiHealth==='quota'?'Quota reached':state.apiHealth==='error'?'Not working':(state.model||keySummary()), q:'apis'},
      {id:'usage', icon:I.activity, label:'Usage & limits', val:!state.apiKey?'No API':(state.usage.requests? state.usage.requests+(state.usage.requests===1?' request':' requests') : 'Not used yet'), q:'usage'},
      {id:'ai', icon:I.sliders, label:'AI Customization', val:state.style+' · '+state.tempVal},
      {id:'connectors', icon:I.link, label:'Connectors & Online Search', val: state.webSearch?'Web Search On':'Off', q:'connectors'},
      {id:'memory', icon:I.bookmark, label:'Memory', val: state.memory?'On':'Off', q:'memory'},
      {id:'appearance', icon:I.sun, label:'Appearance', val:(state.mode==='system'?'System':state.mode==='dark'?'Dark':'Light')+' · '+state.chatThemeName, q:'appearance'}
    ]},
    {rows:[
      {id:'agentpage', icon:I.fingerprint, label:'Agents', val:mainAgent().name+' - '+AGENTS.length+(AGENTS.length===1?' agent':' agents')},
      {id:'subagents', icon:I.layers, label:'Sub-agents', val:Math.max(0,AGENTS.length-1)+' sub'},
      {id:'code', icon:I.code, label:'Code & Play Preview', val: state.autoPlay?'Play First':'Code First', q:'code'},
      {id:'skills', icon:I.layers, label:'Skill library', val:enabledSkills()+'/'+SKILLS.length, q:'skills'},
      {id:'commands', icon:I.slash, label:'Slash commands', val:String(COMMANDS.length), q:'commands'},
      {id:'dashboard', icon:I.grid, label:'Dashboard'},
      {id:'ide', icon:I.panel, label:'IDE panel'},
      {id:'agents', icon:I.folder, label:'Agents files', val:AGENT_FILES.length+' files'},
      {id:'terminal', icon:I.terminal, label:'Terminal'}
    ]},
    {rows:[
      {id:'history', icon:I.clock, label:'History & backups'},
      {id:'safety', icon:I.shield, label:'Privacy & safety', q:'safety'},
      {id:'about', icon:I.info, label:'About', val:'v1.2'}
    ]}
  ];
  setView.innerHTML='<div class="set-head"><button class="circle-btn" id="setBack" aria-label="Back">'+I.back+'</button><span style="flex:1"></span><span style="width:44px"></span></div>'
    +'<div class="set-scroll"><div class="set-inner">'
    +'<div class="set-profile-hero"><div class="sph-ava-wrap"><button class="sph-ava" id="sphAva" aria-label="Edit profile">'+esc(displayName().charAt(0).toUpperCase()||'Y')+'</button><button class="sph-pencil" id="sphEdit" aria-label="Edit profile">'+I.edit+'</button></div>'
    +'<div class="sph-name">'+esc(displayName())+'</div></div>'
    +groups.map(function(g){ return '<div class="set-group">'+g.rows.map(function(r){
        /* Collapsed list rows stay minimal: icon, label, value and
           chevron only — NO ? icon on any list row. The ? lives only
           inside the tapped section page (setHead), where the full
           detail is. */
        return '<button class="set-row" data-set="'+r.id+'"><span class="ric">'+r.icon+'</span><span>'+r.label+'</span><span class="val">'+(r.val?esc(r.val):'')+'</span>'+I.chevR+'</button>';
      }).join('')+'</div>'; }).join('')
    +'<div class="set-search">'+I.search+'<input id="setSearch" type="text" placeholder="Search settings" autocomplete="off"></div>'
    +'</div></div>';
  wireBack(closeSettings);
  /* Tapping a row replaces the full list with ONLY that section —
     same collapsed navigation as the + sheet. */
  setView.querySelectorAll('[data-set]').forEach(function(b){ b.addEventListener('click',function(){ renderSettings(b.getAttribute('data-set')); }); });
  function openProfile(){ openSheet(profileSheetHTML()); wireProfileSave(); }
  $('#sphEdit').addEventListener('click',openProfile);
  $('#sphAva').addEventListener('click',openProfile);
  $('#setSearch').addEventListener('input',function(){
    var q=this.value.toLowerCase();
    setView.querySelectorAll('.set-row').forEach(function(r){ r.style.display=r.textContent.toLowerCase().indexOf(q)>=0?'':'none'; });
  });
}
function settingsSimple(title, topic, kvs, extraHTML, wire){
  setView.innerHTML=setHead(title, topic)+'<div class="set-scroll"><div class="set-inner"><div class="set-group" style="padding:6px 15px">'
    +kvs.map(function(kv){ return '<div class="kv"><span>'+esc(kv[0])+'</span><b>'+esc(kv[1])+'</b></div>'; }).join('')
    +'</div>'+(extraHTML||'')+'</div></div>';
  wireBack(function(){ renderSettings('list'); });
  if(wire) wire();
}
function settingsApis(){
  setView.innerHTML=setHead('APIs & Providers','apis')+'<div class="set-scroll"><div class="set-inner">'
    +'<p class="set-note">Just paste a key — the provider, base URL and model are detected and selected automatically. Add as many APIs as you like; if a model fails, every other model on that key is tried, then every model on the next key, and an error only shows if every model on every key has failed.</p>'
    + apiListHTML()
    +'<div class="field"><label>API key</label><input id="apiKeyIn" type="password" placeholder="Paste any API key" autocomplete="off"></div>'
    +'<button class="btn-primary" id="apiAdd">Add API</button>'
    +'<p class="set-note" id="apiTestMsg" aria-live="polite">'+esc(apiTestMsgText)+'</p>'
    +'<p class="set-note">Status: <b>'+esc(apiStatusText())+'</b></p>'
    +'</div></div>';
  wireBack(function(){ renderSettings('list'); });
  wireApiList(setView, function(){ renderSettings('apis'); });
  $('#apiAdd').addEventListener('click',function(){
    var k=$('#apiKeyIn').value.trim();
    if(!k){ toast('Paste a key first'); return; }
    var btn=this; btn.disabled=true; btn.textContent='Detecting…';
    addApiKey(k).then(function(e){ toast(e? 'Added — '+apiEntryLabel(e) : 'Added'); renderSettings('apis'); });
  });
}
/* =============== Usage & limits ===============
   Pick the API you have; the page shows that API only. Session
   counts are counted by the app itself on every provider call
   (requests, replies, failures, quota hits, and token totals the
   provider returns). Limits: OpenRouter keys can be checked live
   against OpenRouter's own key endpoint with the saved key;
   Gemini and custom endpoints expose no per-key limit check, so
   the page says where the limit lives instead of inventing one. */
var usageLive=null;
function usMoney(n){
  if(n===null||n===undefined||isNaN(n)) return '—';
  return '$'+Number(n).toFixed(4).replace(/0+$/,'').replace(/\.$/,'.0');
}
function settingsUsage(){
  var prov=state.provider||'';
  var provName= prov==='openrouter'?'OpenRouter': prov==='gemini'?'Google Gemini': prov==='custom'?'Custom endpoint':'No API key';
  var healthTxt= !state.apiKey? 'No key set'
    : state.apiHealth==='ok'? 'Working'
    : state.apiHealth==='quota'? 'Quota / rate limit reached'
    : state.apiHealth==='error'? 'Not working'+(state.apiDetail?' — '+state.apiDetail:'')
    : state.apiHealth==='changed'? 'Changed — send a message to check it'
    : 'Not checked yet — send a message to check it';
  var u=state.usage;
  var endpoint= prov==='openrouter'?'openrouter.ai/api/v1': prov==='gemini'?'generativelanguage.googleapis.com': prov==='custom'?(state.providerBase||'Not set'):'—';
  function kv(k,v){ return '<div class="kv"><span>'+esc(k)+'</span><b>'+esc(v)+'</b></div>'; }
  function num(n){ return Number(n||0).toLocaleString('en-US'); }
  var limitHTML='';
  if(prov==='openrouter'){
    if(!state.apiKey){
      limitHTML='<p class="set-note">Add your OpenRouter key in APIs & Providers, then come back here to check this key\u2019s live usage and limit.</p>';
    } else if(usageLive && usageLive.loading){
      limitHTML='<p class="set-note">Checking with OpenRouter\u2026</p>';
    } else if(usageLive && usageLive.error){
      limitHTML='<p class="set-note">Could not check live: '+esc(usageLive.error)+'</p><button class="btn-ghost" id="usCheck">Try again</button>';
    } else if(usageLive && usageLive.data){
      var d=usageLive.data;
      limitHTML='<div class="set-group" style="padding:6px 15px">'
        +kv('Used by this key', usMoney(d.usage))
        +kv('Key limit', (d.limit===null||d.limit===undefined)? 'No limit set on this key' : usMoney(d.limit))
        +kv('Remaining', (d.limit_remaining===null||d.limit_remaining===undefined)? '—' : usMoney(d.limit_remaining))
        +kv('Free tier', d.is_free_tier? 'Yes':'No')
        +(d.label? kv('Key label', String(d.label)) : '')
        +'</div><button class="btn-ghost" id="usCheck">Check again</button>';
    } else {
      limitHTML='<button class="btn-primary" id="usCheck">Check live usage & limit</button>'
        +'<p class="set-note">Asks OpenRouter directly, with your saved key — real numbers from your account, nothing estimated.</p>';
    }
  } else if(prov==='gemini'){
    limitHTML='<p class="set-note">Google does not offer a per-key usage or limit check this app can call. Your quota and limits are managed on Google\u2019s side, in AI Studio / Google Cloud for this key. What the app can show is above: key status, health, and your counted session usage.</p>';
  } else if(prov==='custom'){
    limitHTML='<p class="set-note">A custom endpoint sets its own limits — this app cannot read them from the endpoint. What the app can show is above: key status, health, and your counted session usage.</p>';
  } else {
    limitHTML='<p class="set-note">No API key is set, so replies come from the built-in local engine and there is no API usage or limit to show. Pick your API above, then add its key in APIs & Providers.</p>';
  }
  setView.innerHTML=setHead('Usage & limits','usage')+'<div class="set-scroll"><div class="set-inner">'
    +'<div class="field"><label>Your API</label><select id="usProv"><option value="">No API key — local replies</option><option value="openrouter">OpenRouter</option><option value="gemini">Google Gemini</option><option value="custom">Custom endpoint (OpenAI-compatible)</option></select></div>'
    +'<div class="ap-label" style="margin-top:6px">'+esc(provName)+'</div>'
    +'<div class="set-group" style="padding:6px 15px">'
    +kv('Key', state.apiKey? 'Set':'Not set')
    +kv('Model', state.model||'Provider default')
    +kv('Endpoint', endpoint)
    +kv('Status', healthTxt)
    +'</div>'
    +'<div class="ap-label">This session — counted by the app</div>'
    +'<div class="set-group" style="padding:6px 15px">'
    +kv('Requests sent', num(u.requests))
    +kv('Replies received', num(u.ok))
    +kv('Failed requests', num(u.failed))
    +kv('Quota / rate-limit hits', num(u.quota))
    +kv('Tokens in', num(u.tokIn))
    +kv('Tokens out', num(u.tokOut))
    +kv('Total tokens', num((u.tokIn||0)+(u.tokOut||0)))
    +'</div>'
    +'<div class="ap-label">Limit</div>'
    +limitHTML
    +'<button class="btn-ghost" id="usGoApis" style="margin-top:14px">APIs & Providers — key & model</button>'
    +'</div></div>';
  wireBack(function(){ renderSettings('list'); });
  var sel=$('#usProv'); sel.value=prov;
  sel.addEventListener('change',function(){
    state.provider=this.value; usageLive=null;
    if(state.apiKey) setApiHealth('changed'); else setApiHealth('unset');
    renderSettings('usage');
    toast(state.provider? 'Your API: '+provNameFor(state.provider) : 'No API — local replies');
  });
  var chk=$('#usCheck');
  if(chk) chk.addEventListener('click',function(){
    usageLive={loading:true}; renderSettings('usage');
    fetch('https://openrouter.ai/api/v1/auth/key',{headers:{'Authorization':'Bearer '+state.apiKey}})
      .then(function(r){ return r.json().then(function(j){ return {ok:r.ok, j:j, status:r.status}; }); })
      .then(function(res){
        if(res.ok && res.j && res.j.data) usageLive={data:res.j.data};
        else usageLive={error:'OpenRouter replied HTTP '+res.status};
        renderSettings('usage');
      })
      .catch(function(){ usageLive={error:'Network or CORS — the provider could not be reached from this page.'}; renderSettings('usage'); });
  });
  $('#usGoApis').addEventListener('click',function(){ renderSettings('apis'); });
}
function provNameFor(p){ return p==='openrouter'?'OpenRouter': p==='gemini'?'Google Gemini': p==='custom'?'Custom endpoint':'No API key'; }
function settingsAI(){
  setView.innerHTML=setHead('AI Customization', null)+'<div class="set-scroll"><div class="set-inner">'
    +'<div class="field"><label>Response style</label><div class="seg" id="styleSeg"><button data-v="concise">Concise</button><button data-v="balanced">Balanced</button><button data-v="detailed">Detailed</button><button data-v="code-first">Code-first</button></div></div>'
    +'<div class="field"><label>Temperature — <span id="tempValOut">'+state.tempVal+'</span></label><input type="range" id="tempRange" min="0" max="1.5" step="0.1" value="'+state.tempVal+'"></div>'
    +'<button class="sheet-row" id="dtTog"><span>Deep Thinking</span><span class="switch" role="switch" aria-checked="'+state.deepThink+'"></span></button>'
    +'</div></div>';
  wireBack(function(){ renderSettings('list'); });
  segWire('#styleSeg', state.style, function(v){ state.style=v; });
  $('#tempRange').addEventListener('input',function(){ state.tempVal=+this.value; $('#tempValOut').textContent=state.tempVal; });
  $('#dtTog').addEventListener('click',function(){ state.deepThink=!state.deepThink; this.querySelector('.switch').setAttribute('aria-checked',String(state.deepThink)); });
}
function settingsConnectors(){
  setView.innerHTML=setHead('Connectors & Online Search','connectors')+'<div class="set-scroll"><div class="set-inner">'
    +'<div class="set-group"><button class="set-row" id="wsTog"><span class="ric">'+I.search+'</span><span>Online Search</span><span class="switch" role="switch" aria-checked="'+state.webSearch+'"></span></button></div>'
    +'<p class="set-note">The only connector in this build. /search uses it to fetch live sources. Anything that needs a live server is left out rather than shown not working.</p>'
    +'</div></div>';
  wireBack(function(){ renderSettings('list'); });
  $('#wsTog').addEventListener('click',function(){ state.webSearch=!state.webSearch; this.querySelector('.switch').setAttribute('aria-checked',String(state.webSearch)); toast('Online Search '+(state.webSearch?'on':'off')); });
}
function settingsMemory(){
  var recent=MEM.slice(-30).reverse();
  setView.innerHTML=setHead('Memory','memory')+'<div class="set-scroll"><div class="set-inner">'
    +'<div class="set-group"><button class="set-row" id="memTog"><span class="ric">'+I.bookmark+'</span><span>Memory</span><span class="switch" role="switch" aria-checked="'+state.memory+'"></span></button></div>'
    +'<p class="set-note">On: everything you say in any chat is saved to memory automatically, with no limit. Before every reply, memory is searched by the message&rsquo;s keywords and the reply uses what matches. Memory never holds keys, secrets, emails or phone numbers — those are stripped before anything is saved. The + sheet switch always matches this one.</p>'
    +'<div class="kv"><span>Saved memories</span><b>'+MEM.length+'</b></div>'
    +(recent.length? '<div class="set-group" style="margin-top:12px">'+recent.map(function(e){ return '<div class="set-row"><span style="flex:1;min-width:0"><span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(e.text)+'</span><span style="display:block;color:var(--muted);font-size:12.5px;font-weight:400;margin-top:2px">'+esc(e.chatTitle)+'</span></span></div>'; }).join('')+'</div>' : '<p class="set-note">No memories yet — send a message in any chat and it is saved here automatically.</p>')
    +(MEM.length? '<button class="btn-ghost" id="memClear" style="color:var(--danger)">Clear all memory</button>' : '')
    +'</div></div>';
  wireBack(function(){ renderSettings('list'); });
  $('#memTog').addEventListener('click',function(){ state.memory=!state.memory; this.querySelector('.switch').setAttribute('aria-checked',String(state.memory)); });
  var mc=$('#memClear'); if(mc) mc.addEventListener('click',function(){ MEM.length=0; renderSettings('memory'); toast('Memory cleared'); });
}
/* =============== Appearance (phone preview layout) ===============
   Matches the reference: a phone-shaped preview at the top (agent
   avatar + name label + bubbles + composer bar), then Chat theme
   colour circles, then Avatar size as a radio list (Small, Medium,
   Large, Extra large, Hidden), then Mode as a radio list (System,
   Light, Dark). White is the default chat theme. */
var CHAT_THEMES=[
  {n:'White', v:'#ffffff'},{n:'Blue', v:'#0a84ff'},{n:'Brown', v:'#a2845e'},
  {n:'Sky', v:'#409cff'},{n:'Purple', v:'#a55eea'},{n:'Pink', v:'#e84393'},
  {n:'Orange', v:'#e67e22'}
];
function applyChatTheme(v, name){
  state.chatTheme=v; state.chatThemeName=name||state.chatThemeName;
  state.accent=v; state.accentName=state.chatThemeName;
  applyAccent();
}
function applyAppearanceMode(m){
  state.mode=m;
  var dark = m==='dark' || (m==='system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  state.theme = dark? 'black' : 'white';
  document.documentElement.setAttribute('data-theme', state.theme);
}
if(window.matchMedia){
  var apModeMq=window.matchMedia('(prefers-color-scheme: dark)');
  var apModeListen=function(){ if(state.mode==='system') applyAppearanceMode('system'); };
  if(apModeMq.addEventListener) apModeMq.addEventListener('change', apModeListen);
  else if(apModeMq.addListener) apModeMq.addListener(apModeListen);
}
function settingsAppearance(){
  var sizes=[['small','Small'],['medium','Medium'],['large','Large'],['xl','Extra large'],['hidden','Hidden']];
  var modes=[['system','System'],['light','Light'],['dark','Dark']];
  var avaPx={small:52, medium:64, large:76, xl:92, hidden:76}[state.avatarSize]||76;
  function radio(sel){ return '<span class="radio'+(sel?' on':'')+'">'+(sel? I.check : '')+'</span>'; }
  setView.innerHTML=setHead('Appearance','appearance')+'<div class="set-scroll"><div class="set-inner">'
    +'<div class="aprev'+(state.avatarSize==='hidden'?' hideava':'')+'" aria-hidden="true">'
    +'<div class="aprev-ava" style="width:'+avaPx+'px;height:'+avaPx+'px"><span class="agent-ava-slot">'+agentAvatarHTML()+'</span></div>'
    +'<div class="aprev-name">'+esc(agentName)+'</div>'
    +'<div class="aprev-b me"></div>'
    +'<div class="aprev-b ai"></div>'
    +'<div class="aprev-b me short" style="width:56%"></div>'
    +'<div class="aprev-bar"></div>'
    +'</div>'
    +'<div class="ap-label">Chat theme</div>'
    +'<div class="theme-circles">'
    +'<button class="tcircle av" id="aprevAvaCircle" aria-label="Change avatar">'+agentAvatarHTML()+'</button>'
    +CHAT_THEMES.map(function(t){ return '<button class="tcircle'+(state.chatTheme===t.v?' sel':'')+'" data-ctheme="'+t.v+'" data-cthemen="'+t.n+'" style="background:'+t.v+'" aria-label="Chat theme '+t.n+'"></button>'; }).join('')
    +'</div>'
    +'<div class="ap-label">Avatar size</div>'
    +'<div class="radio-list">'
    +sizes.map(function(s){ return '<button class="radio-row" data-avsize="'+s[0]+'"><span>'+s[1]+'</span>'+radio(state.avatarSize===s[0])+'</button>'; }).join('')
    +'</div>'
    +'<div class="ap-label">Mode</div>'
    +'<div class="radio-list">'
    +modes.map(function(m){ return '<button class="radio-row" data-apmode="'+m[0]+'"><span>'+m[1]+'</span>'+radio(state.mode===m[0])+'</button>'; }).join('')
    +'</div>'
    +'<p class="set-note">White is the default chat theme. Picking a theme recolours your bubbles and accents across the app; Avatar size follows the agent head in chat, and Mode follows your system setting while System is picked.</p>'
    +'</div></div>';
  wireBack(function(){ renderSettings('list'); });
  var avc=$('#aprevAvaCircle'); if(avc) avc.addEventListener('click',function(){ avatarTargetAgentId=mainAgentId; avReturn='appearance'; avDraft=null; renderSettings('avataredit'); });
  setView.querySelectorAll('[data-ctheme]').forEach(function(b){ b.addEventListener('click',function(){
    applyChatTheme(b.getAttribute('data-ctheme'), b.getAttribute('data-cthemen'));
    renderSettings('appearance'); renderAll();
  }); });
  setView.querySelectorAll('[data-avsize]').forEach(function(b){ b.addEventListener('click',function(){
    state.avatarSize=b.getAttribute('data-avsize');
    renderSettings('appearance'); renderAll();
  }); });
  setView.querySelectorAll('[data-apmode]').forEach(function(b){ b.addEventListener('click',function(){
    applyAppearanceMode(b.getAttribute('data-apmode'));
    renderSettings('appearance'); renderAll();
  }); });
}
function settingsSkills(){
  setView.innerHTML=setHead('Skill library','skills')+'<div class="set-scroll"><div class="set-inner"><div class="set-group">'
    +SKILLS.map(function(s){ return '<button class="set-row" data-skill="'+s+'"><span style="flex:1;min-width:0"><span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+s+'</span>'+(SKILL_DESCS[s]?'<span style="display:block;color:var(--muted);font-size:12.5px;font-weight:400;margin-top:2px;line-height:1.35">'+esc(SKILL_DESCS[s])+'</span>':'')+'</span><span class="switch" role="switch" aria-checked="'+state.skillsOn[s]+'"></span></button>'; }).join('')
    +'</div><p class="set-note">'+enabledSkills()+' of '+SKILLS.length+' enabled. Use /skill &lt;name&gt; in chat to apply one to the next reply — or run the three newest directly: /get-more-perspectives, /match-my-writing-style, /focus-my-energy.</p></div></div>';
  wireBack(function(){ renderSettings('list'); });
  setView.querySelectorAll('[data-skill]').forEach(function(b){ b.addEventListener('click',function(){
    var s=b.getAttribute('data-skill'); state.skillsOn[s]=!state.skillsOn[s];
    b.querySelector('.switch').setAttribute('aria-checked',String(state.skillsOn[s]));
  }); });
}
function settingsCommands(){
  setView.innerHTML=setHead('Slash commands','commands')+'<div class="set-scroll"><div class="set-inner"><div class="set-group">'
    +COMMANDS.map(function(c){ return '<div class="set-row"><span style="font-family:ui-monospace,Menlo,monospace;font-size:14px;font-weight:650">'+c.c+'</span><span class="val">'+esc(c.d)+'</span></div>'; }).join('')
    +'</div><p class="set-note">Type / in the composer — the box appears above it. Go back and type /code to try it.</p></div></div>';
  wireBack(function(){ renderSettings('list'); });
}
function settingsDashboard(){
  var totalMsgs=chats.reduce(function(n,c){return n+c.messages.length;},0);
  settingsSimple('Dashboard', null, [['Chats', String(chats.length)],['Messages', String(totalMsgs)],['Skills enabled', enabledSkills()+'/'+SKILLS.length],['Commands', String(COMMANDS.length)],['Split screen', state.splitId?'On':'Off'],['Temporary chat', state.temp?'On':'Off']], '<button class="btn-ghost" id="dashSplit">Toggle split screen</button>', function(){
    $('#dashSplit').addEventListener('click',function(){
      if(state.splitId){ exitSplit(); closeSettings(); }
      else { var t=chats.filter(function(c){return c.id!==state.currentId;})[0]; if(t){ state.splitId=t.id; state.splitActive='bottom'; closeSettings(); } }
    });
  });
}
function settingsIDE(){
  var lastCode=null;
  chats.forEach(function(c){ c.messages.forEach(function(m){ if(m.code) lastCode=m; }); });
  /* This page serves two entries with two different backs:
     - From the sidebar Library tab it IS the Library page, and back
       must return to the side menu (sidebar chats menu) — NOT to
       Settings.
     - From the Settings list ("IDE panel" row) back returns to the
       full Settings list, like every other Settings section. */
  var fromLibrary=state.settingsOrigin==='library';
  setView.innerHTML=setHead(fromLibrary?'Library':'IDE panel', null)+'<div class="set-scroll"><div class="set-inner">'
    +(lastCode? '<div class="codeblock"><div class="codeblock-head"><span>'+esc(lastCode.code.lang||'code')+'</span><span class="sp"></span><button data-act="play" data-id="'+lastCode.id+'">'+I.play+'Play</button><button data-act="copy" data-id="'+lastCode.id+'">'+I.copy+'Copy</button></div><pre>'+esc(lastCode.code.body)+'</pre></div>' : '<p class="set-note">No code artifacts yet. Ask with /code in chat and the latest one lands here.</p>')
    +'</div></div>';
  if(fromLibrary){
    wireBack(function(){
      /* Close this view without landing on Settings, then reopen
         the side menu the user came from. closeSettings() resets
         the tab to Main, so restore the Library tab selection after
         it, then open the sidebar (curved side menu, as usual). */
      closeSettings();
      if(typeof setTabSel==='function') setTabSel('library');
      setSidebar(true,true);
    });
  } else {
    wireBack(function(){ renderSettings('list'); });
  }
}
/* =============== Agents files: browser, viewer, editor =============== */
var agentEditing=false;
function afSizeOf(e){ return e.size!=null? e.size : afBytes(e.content||''); }
function afDownload(name, blobOrUrl){
  var a=document.createElement('a');
  a.href=typeof blobOrUrl==='string'? blobOrUrl : URL.createObjectURL(blobOrUrl);
  a.download=name; a.click();
  if(typeof blobOrUrl!=='string') setTimeout(function(){ URL.revokeObjectURL(a.href); },2000);
}
function afCopyText(text){
  function done(){ toast('Copied'); }
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(done).catch(function(){ fallback(); }); }
  else fallback();
  function fallback(){ var ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); done(); }catch(e){ toast('Copy failed'); } ta.remove(); }
}
function afShare(entry){
  var name=afBase(entry.path);
  function fallback(){ if(entry.content) afCopyText(entry.content); else toast('Sharing is not available here — use Download'); }
  try{
    if(entry.dataUrl && navigator.canShare){
      fetch(entry.dataUrl).then(function(r){ return r.blob(); }).then(function(b){
        var f=new File([b], name, {type:b.type||'application/octet-stream'});
        if(navigator.canShare({files:[f]})){ navigator.share({files:[f], title:name}).catch(function(){}); }
        else if(navigator.share){ navigator.share({title:name, text:name}).catch(function(){ fallback(); }); }
        else fallback();
      }).catch(fallback);
    } else if(navigator.share){
      navigator.share({title:name, text:entry.content||name}).catch(function(){ fallback(); });
    } else fallback();
  }catch(e){ fallback(); }
}
/* Minimal real PDF writer: the file's text, wrapped and paginated,
   in a standard font — a genuine .pdf the user can keep. */
function afPdfBlob(entry){
  var raw=(entry.content||'');
  var clean=raw.replace(/[^\x20-\x7E\n]/g,'?');
  var lines=[];
  clean.split('\n').forEach(function(p){
    if(!p){ lines.push(''); return; }
    var words=p.split(/\s+/), cur='';
    words.forEach(function(w){
      while(w.length>88){ if(cur){ lines.push(cur); cur=''; } lines.push(w.slice(0,88)); w=w.slice(88); }
      if(!cur) cur=w; else if(cur.length+1+w.length<=88) cur+=' '+w; else { lines.push(cur); cur=w; }
    });
    lines.push(cur);
  });
  var per=44, pages=[];
  for(var i=0;i<lines.length;i+=per) pages.push(lines.slice(i,i+per));
  if(!pages.length) pages=[['']];
  function escPdf(s){ return s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)'); }
  var objs=[], kids=[];
  objs[1]='<< /Type /Catalog /Pages 2 0 R >>';
  var next=3;
  var pageIds=[], contentIds=[];
  pages.forEach(function(){ pageIds.push(next++); contentIds.push(next++); });
  var fontId=next++;
  objs[2]='<< /Type /Pages /Kids ['+pageIds.map(function(id){return id+' 0 R';}).join(' ')+'] /Count '+pages.length+' >>';
  pages.forEach(function(pg, idx){
    var stream='BT /F1 11 Tf 15.5 TL 56 740 Td ';
    pg.forEach(function(ln, li){ stream+=(li? 'T* ':'')+'('+escPdf(ln)+') Tj '; });
    stream+='ET';
    objs[contentIds[idx]]='<< /Length '+stream.length+' >>\nstream\n'+stream+'\nendstream';
    objs[pageIds[idx]]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 '+fontId+' 0 R >> >> /Contents '+contentIds[idx]+' 0 R >>';
  });
  objs[fontId]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  var pdf='%PDF-1.4\n', offsets=[0];
  for(var n=1;n<objs.length;n++){ if(!objs[n]) continue; offsets[n]=pdf.length; pdf+=n+' 0 obj\n'+objs[n]+'\nendobj\n'; }
  var xrefPos=pdf.length;
  pdf+='xref\n0 '+objs.length+'\n0000000000 65535 f \n';
  for(var m=1;m<objs.length;m++){ var off=String(offsets[m]||0); while(off.length<10) off='0'+off; pdf+=off+' 00000 n \n'; }
  pdf+='trailer\n<< /Size '+objs.length+' /Root 1 0 R >>\nstartxref\n'+xrefPos+'\n%%EOF';
  return new Blob([pdf], {type:'application/pdf'});
}
function afMenuSheet(title, rows){
  openSheet('<h3>'+esc(title)+'</h3>'+rows.map(function(r,i){ return '<button class="sheet-row" data-afm="'+i+'"'+(r.danger?' style="color:var(--danger)"':'')+'>'+(r.icon||'')+'<span>'+esc(r.label)+'</span></button>'; }).join('')+'<button class="btn-ghost" id="afMenuCancel">Cancel</button>');
  $('#afMenuCancel').addEventListener('click',closeSheet);
  sheet.querySelectorAll('[data-afm]').forEach(function(b){ b.addEventListener('click',function(){ var r=rows[+b.getAttribute('data-afm')]; closeSheet(); if(r.fn) r.fn(); }); });
}
function afAskDeleteFile(entry, after){
  openSheet('<h3>Delete '+esc(afBase(entry.path))+'?</h3><p class="sub">This deletes the file from Agents files in this app. Downloaded copies are not affected.</p><button class="btn-danger" id="afDelYes">Delete</button><button class="btn-ghost" id="afDelNo">Cancel</button>');
  $('#afDelNo').addEventListener('click',closeSheet);
  $('#afDelYes').addEventListener('click',function(){
    var ix=AGENT_FILES.indexOf(entry); if(ix>=0) AGENT_FILES.splice(ix,1);
    closeSheet(); toast('Deleted'); if(after) after(); else { agentFilePath=null; renderSettings('agents'); }
  });
}
function afFileMenu(entry){
  afMenuSheet(afBase(entry.path), [
    {icon:I.compose, label:'Edit', fn:function(){ agentFilePath=entry.path; agentEditing=true; renderSettings('agentfile'); }},
    {icon:I.share, label:'Share', fn:function(){ afShare(entry); }},
    {icon:I.copy, label:'Copy', fn:function(){ afCopyText(entry.content||''); }},
    {icon:I.file, label:'Download as PDF', fn:function(){ afDownload(afBase(entry.path).replace(/\.[^.]+$/,'')+'.pdf', afPdfBlob(entry)); }},
    {icon:I.download, label:'Download', fn:function(){ afDownload(afBase(entry.path), entry.dataUrl? entry.dataUrl : new Blob([entry.content||''], {type:'text/plain'})); }}
  ]);
}
function afHandleUploads(fileList){
  var files=Array.prototype.slice.call(fileList||[]); if(!files.length) return;
  var done=0;
  files.forEach(function(f){
    var target=(agentPath? agentPath+'/' : '')+f.name;
    var isText=/^text\//.test(f.type||'') || /\.(md|txt|json|js|ts|css|html|xml|csv)$/i.test(f.name);
    var rd=new FileReader();
    rd.onload=function(){
      var ex=afFind(target);
      if(isText && !/^image\//.test(f.type||'')){ var rec={path:target, content:String(rd.result||''), size:f.size}; }
      else { var rec={path:target, content:'', dataUrl:String(rd.result||''), size:f.size}; }
      if(ex){ ex.content=rec.content; ex.dataUrl=rec.dataUrl; ex.size=rec.size; } else AGENT_FILES.push(rec);
      done++; if(done===files.length){ renderSettings('agents'); toast(files.length===1? 'Uploaded '+f.name : 'Uploaded '+files.length+' files'); }
    };
    if(isText && !/^image\//.test(f.type||'')) rd.readAsText(f); else rd.readAsDataURL(f);
  });
}
function mdInline(s){
  return esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\*([^*]+)\*/g,'<i>$1</i>');
}
function mdRender(md){
  var lines=String(md||'').split('\n'), out=[], inCode=false, inList=false, inQuote=false;
  function closeBlocks(){ if(inList){ out.push('</ul>'); inList=false; } if(inQuote){ out.push('</blockquote>'); inQuote=false; } }
  lines.forEach(function(ln){
    if(/^\s*```/.test(ln)){ if(inCode){ out.push('</pre>'); inCode=false; } else { closeBlocks(); out.push('<pre><code>'); inCode=true; } return; }
    if(inCode){ out.push(esc(ln)+'\n'); return; }
    var h=ln.match(/^(#{1,3})\s+(.*)$/);
    if(h){ closeBlocks(); out.push('<h'+h[1].length+'>'+mdInline(h[2])+'</h'+h[1].length+'>'); return; }
    if(/^>\s?/.test(ln)){ if(!inQuote){ if(inList){ out.push('</ul>'); inList=false; } out.push('<blockquote>'); inQuote=true; } out.push(mdInline(ln.replace(/^>\s?/,''))+'<br>'); return; }
    if(/^\s*[-*]\s+/.test(ln)){ if(inQuote){ out.push('</blockquote>'); inQuote=false; } if(!inList){ out.push('<ul>'); inList=true; } out.push('<li>'+mdInline(ln.replace(/^\s*[-*]\s+/,''))+'</li>'); return; }
    closeBlocks();
    if(!ln.trim()) return;
    out.push('<p>'+mdInline(ln)+'</p>');
  });
  if(inCode) out.push('</code></pre>');
  closeBlocks();
  return out.join('');
}
/* =============== Agent page (Settings) ===============
   The agent's own page, same UI as the reference: avatar with a
   pencil badge (menu: Change avatar / Edit name), the agent name —
   editable right here — a live status line, and the pill tab bar
   (list · shield · clock · fingerprint; no computer tab). Tabs show
   Today, Approvals history, Reminders + Daily, and the agent
   profile with its VIBE and the SOUL / MEMORY cards, which open the
   matching Agents files. */
/* =============== Agents (multi-agent) ===============
   The old single "Agent mode" is replaced by an Agents hub: many
   agents, each with its own name, avatar, custom instructions and
   custom memory. Any agent can be made the main agent at any time,
   and you can chat with any of them. History and memory are SHARED
   by all agents by default; an agent with individual history or
   individual memory turned on (in its Edit page) keeps its own. */
var AGENTS=[
  {id:'mia', name:'Mia', vibe:'Sharp, warm, playful, a bit possessive, loyal. Roasts with love, matches his mood, stays clean and supportive in study, sad and crisis modes.', instructions:'', memoryText:'', preset:'mia', avatar:'', shape:'triangle', face:'wink', color:'#b57948', acc:'none', individualHistory:false, individualMemory:false, privateMem:[]}
];
var mainAgentId='mia', chatAgentId='mia', editingAgentId='mia', avatarTargetAgentId=null;
var avReturn='agentpage';
var agentsAnimSpeed=1;
function agentById(id){ for(var i=0;i<AGENTS.length;i++) if(AGENTS[i].id===id) return AGENTS[i]; return null; }
function mainAgent(){ return agentById(mainAgentId)||AGENTS[0]; }
function chatAgent(){ return agentById(chatAgentId)||mainAgent(); }
function targetAgent(){ return agentById(avatarTargetAgentId)||agentById(editingAgentId)||mainAgent(); }
function syncMainGlobals(){ var m=mainAgent(); if(!m) return; agentName=m.name; agentAvatar=m.avatar||''; agentPreset=m.preset||'mia'; avatarShape=m.shape||avatarShape; avatarFace=m.face||avatarFace; avatarColor=m.color||avatarColor; avatarAcc=m.acc||avatarAcc; if(m.vibe) agentVibe=m.vibe; syncSidebarAgent(); }
/* The sidebar head carries the MAIN agent — the exact same name
   and avatar the user set for it (no app logo there any more).
   Called whenever the main agent changes: rename, avatar save,
   photo upload, set-as-main, and on every sidebar render. */
var sbAgentSig='';
function syncSidebarAgent(){
  var m=mainAgent(); if(!m) return;
  /* Cached: the head avatar SVG is only rebuilt when the main
     agent (or the live emotion) actually changed — renderAll calls
     this on every render, and rebuilding it each time was pure
     wasted work. */
  var sig=m.id+'|'+(m.avatar||'')+'|'+(m.preset||'')+'|'+(m.shape||'')+'|'+(m.face||'')+'|'+(m.color||'')+'|'+(m.acc||'')+'|'+m.name+'|'+agentEmotion;
  if(sig===sbAgentSig) return;
  sbAgentSig=sig;
  var av=document.getElementById('sbAgentAva'); if(av) av.innerHTML=avatarHTMLFor(m,'idle');
  var nm=document.getElementById('sbAgentName'); if(nm) nm.textContent=m.name;
}
function agentSlug(name){ return String(name||'agent').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'agent'; }
function agentTextSanitize(t){ return String(t||'').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g,'[email removed]').replace(/\+?\d(?:[\s-]?\d){8,}/g,'[number removed]').replace(/(api[_-]?key|secret|password|passwd|token|bearer)\s*[:=]?\s*\S+/gi,'$1 [secret removed]'); }
function syncAgentFile(a){
  if(!a) return;
  var p='agents/'+agentSlug(a.name)+'.md';
  var content='# '+a.name+'\n\n- Role: '+(a.id===mainAgentId?'Main agent':'Sub-agent')+' in Gptopen.\n'
    +(a.vibe? '- Vibe: '+a.vibe+'\n' : '')
    +(a.instructions? '\n## Custom instructions\n'+a.instructions+'\n' : '')
    +(a.memoryText? '\n## Custom memory\n'+a.memoryText+'\n' : '')
    +'\n- History: '+(a.individualHistory?'Individual - this agent keeps its own chats.':'Shared - all chats are shared by default.')+'\n'
    +'- Memory: '+(a.individualMemory?'Individual - this agent keeps its own memory.':'Shared - memory is shared by default.')+'\n';
  var f=afFind(p); if(f) f.content=content; else AGENT_FILES.push({path:p, content:content});
}
function ensureAgentChat(a){
  if(!a||!a.individualHistory) return null;
  for(var i=0;i<chats.length;i++) if(chats[i].agentId===a.id) return chats[i];
  var c={id:'c-agent-'+a.id, title:a.name+' chat', agentId:a.id, messages:[]};
  chats.push(c); return c;
}
function setChatAgent(id){
  var a=agentById(id); if(!a) return;
  chatAgentId=id;
  if(a.individualHistory){ var c=ensureAgentChat(a); if(c) state.currentId=c.id; }
  else { var cur=chatById(state.currentId); if(cur && cur.agentId && cur.agentId!==id) state.currentId='main'; }
}
/* =============== Top agent: swipe to switch, tap for its page ===============
   Swiping the pinned top agent left / right changes the agent you
   are chatting with: the current circle slides out and the new
   agent's circle slides in (renderAgentHead consumes headSwapInDir).
   With no other agent to switch to, the swipe pops the real
   Create-agent page instead. Tapping the top agent opens THAT
   agent's own page — profile, vibe, features — never the Change
   Avatar page (avatar changing stays on the pencil / Edit page). */
var headSwipedAt=0;
var profileAgentId=null, agentEditReturn=null;
function openAgentPage(id){
  /* Tapping the top agent opens THAT agent's own page — its profile
     (avatar, name, vibe, what it is), never the editing page. The
     page is opened from the chat, so its back button returns
     straight to the chat — not to Settings or any other page.
     Editing stays one tap deeper, from the page's Edit row. */
  var a=agentById(id)||chatAgent(); if(!a) return;
  profileAgentId=a.id; editingAgentId=a.id; headSwapInDir=0;
  openSettings('agentprofile');
}
function switchTopAgent(dir){
  /* Only ever called from the swipe handler below — so the
     slide-out here and the slide-in in renderAgentHead happen
     only when the user actually swipes the top agent. */
  var bar=document.getElementById('agentHeadBar');
  var head=bar? bar.querySelector('.chat-agent-head') : null;
  function slideOut(done){
    if(head && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      head.style.transition='transform .22s cubic-bezier(.32,.72,0,1), opacity .22s ease';
      head.style.transform='translateX('+(-dir*170)+'px) scale(.8)';
      head.style.opacity='0';
      setTimeout(done,225);
    } else done();
  }
  if(AGENTS.length<2){ slideOut(function(){ openSettings('agentcreate'); }); return; }
  var idx=0; AGENTS.forEach(function(a,i){ if(a.id===chatAgentId) idx=i; });
  var next=AGENTS[(idx+dir+AGENTS.length)%AGENTS.length];
  slideOut(function(){ headSwapInDir=dir; setChatAgent(next.id); renderAll(); toast('Chatting with '+next.name); });
}
(function(){
  var bar=document.getElementById('agentHeadBar'); if(!bar) return;
  var sx=0, sy=0, dx=0, active=false, moved=false, dead=false;
  bar.addEventListener('pointerdown',function(e){
    if(!bar.querySelector('.chat-agent-head')) return;
    sx=e.clientX; sy=e.clientY; dx=0; active=true; moved=false; dead=false;
  },{passive:true});
  bar.addEventListener('pointermove',function(e){
    if(!active || dead) return;
    dx=e.clientX-sx;
    var dy=e.clientY-sy;
    if(!moved && Math.abs(dy)>10 && Math.abs(dy)>Math.abs(dx)){ dead=true; var h0=bar.querySelector('.chat-agent-head'); if(h0){ h0.style.transform=''; h0.style.opacity=''; } return; }
    if(Math.abs(dx)>6){
      moved=true;
      var h=bar.querySelector('.chat-agent-head');
      if(h){ h.style.transition='none'; h.style.transform='translateX('+dx+'px)'; h.style.opacity=String(Math.max(.2, 1-Math.abs(dx)/280)); }
    }
  },{passive:true});
  function end(){
    if(!active) return; active=false;
    var d=dx; dx=0;
    if(moved && Math.abs(d)>48){ headSwipedAt=Date.now(); switchTopAgent(d<0? 1 : -1); return; }
    var h=bar.querySelector('.chat-agent-head');
    if(h){ h.style.transition='transform .22s cubic-bezier(.32,.72,0,1), opacity .22s ease'; h.style.transform=''; h.style.opacity=''; }
  }
  bar.addEventListener('pointerup',end,{passive:true});
  bar.addEventListener('pointercancel',end,{passive:true});
  bar.addEventListener('click',function(e){
    var b=e.target.closest('[data-agenthead]'); if(!b) return;
    if(Date.now()-headSwipedAt<400) return; /* a swipe is not a tap */
    openAgentPage(b.getAttribute('data-agenthead'));
  });
})();
function agentsSpeedLabel(){ var p=Math.round(agentsAnimSpeed*100); return p+'% - '+(agentsAnimSpeed<0.75?'Slow':agentsAnimSpeed>1.35?'Fast':'Smooth'); }
function setAgentsAnimSpeed(v){
  agentsAnimSpeed=v;
  document.documentElement.style.setProperty('--agent-speed', String(v));
  var lbl=document.getElementById('agSpeedVal'); if(lbl) lbl.textContent=agentsSpeedLabel();
}
function hslToHex(h, sat, li){
  sat/=100; li/=100;
  var k=function(n){ return (n+h/30)%12; };
  var a=sat*Math.min(li,1-li);
  var f=function(n){ return li-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1))); };
  function to(x){ var t=Math.round(255*x).toString(16); return t.length<2? '0'+t : t; }
  return '#'+to(f(0))+to(f(8))+to(f(4));
}
/* Tapping an agent avatar opens its Change Avatar page: the pinned
   chat head avatar (for the agent you are chatting with) and any
   avatar marked data-avtap in the Agents hub / Edit page. */
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-avtap]'); if(!t) return;
  var id=t.getAttribute('data-avtap')||chatAgentId;
  avatarTargetAgentId=id; editingAgentId=id;
  avReturn = (state.view==='settings')? ((typeof lastSetView!=='undefined' && (lastSetView==='agentedit'||lastSetView==='subagents'||lastSetView==='agentprofile'))? lastSetView : 'agentpage') : 'chat';
  avDraft=null;
  openSettings('avataredit');
});
var agentName='Mia', agentAvatar='';
/* ===== Agent avatar presets (original Axo artwork) + context emotes ===== */
var AVATAR_PRESETS=[
 {id:'mia', name:'Mia — Default'},
 {id:'muse', name:'Muse style'},
 {id:'botthew', name:'Botthew style'},
 {id:'froggy', name:'Froggy style'},
 {id:'berry', name:'Berry style'},
 {id:'sunny', name:'Sunny style'},
 {id:'hearty', name:'Hearty style'},
 {id:'mochi', name:'Mochi style'},
 {id:'cue', name:'Cue style'},
 {id:'grok', name:'Grokbot style'},
 {id:'dots', name:'Dots style'},
 {id:'claude', name:'Claude style'}
];
/* Soft-3D shading helpers: every preset and custom shape is built
   from a light-from-top-left radial gradient, a glossy highlight
   and a darker rim, so the flat drawings read as plush 3D mascots
   (clay / felt look) instead of flat stickers. */
function avShade(hex, pct){
  var m=String(hex||'').replace('#',''); if(m.length<6) return hex;
  var r=parseInt(m.substr(0,2),16), g=parseInt(m.substr(2,2),16), b=parseInt(m.substr(4,2),16);
  function f(v){ if(pct>=0) v=Math.round(v+(255-v)*pct/100); else v=Math.round(v*(1+pct/100)); return Math.max(0,Math.min(255,v)); }
  function h(v){ var s=f(v).toString(16); return s.length<2? '0'+s : s; }
  return '#'+h(r)+h(g)+h(b);
}
function avGrad(id, color){
  return '<radialGradient id="'+id+'" cx="0.36" cy="0.27" r="0.95"><stop offset="0" stop-color="'+avShade(color,42)+'"/><stop offset="0.52" stop-color="'+color+'"/><stop offset="1" stop-color="'+avShade(color,-24)+'"/></radialGradient>';
}
/* COLOUR BUG FIX: every rendered avatar used to share the same
   gradient / clip-path IDs (avMia, avDotG, csg<hex>…). Browsers
   resolve url(#id) to the FIRST element with that ID in the whole
   document — and that first copy often sits in a hidden or
   off-canvas part of the app (the chat view while Settings is
   open, the slid-away sidebar). Mobile WebViews then fail the
   paint, the coloured body renders transparent, and the avatar
   shows dark and faint with only the solid face features left —
   exactly the reported bug on the Agent page. Every avatar SVG
   now gets its own unique ID suffix, so its gradients and clips
   always resolve inside its own SVG and colours always paint. */
var avUidC=0;
function avUniq(svg){
  var u='u'+(++avUidC);
  return svg.replace(/id="([^"]+)"/g,'id="$1'+u+'"').replace(/url\(#([^)]+)\)/g,'url(#$1'+u+')');
}
function avGloss(cx, cy, rx, ry, op){
  return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="#ffffff" opacity="'+(op||0.38)+'" transform="rotate(-18 '+cx+' '+cy+')"/>';
}
function avBlush(y){
  return '<ellipse cx="29" cy="'+(y||60)+'" rx="5.6" ry="3.4" fill="#ff9d9d" opacity="0.55"/><ellipse cx="67" cy="'+(y||60)+'" rx="5.6" ry="3.4" fill="#ff9d9d" opacity="0.55"/>';
}
var agentPreset='mia', agentEmotion='idle', pendingEmotion=null;
function avFace(emo, ink){
  var S='stroke="'+ink+'" stroke-width="3.4" stroke-linecap="round" fill="none"', eyes='', mouth='', extra='';
  if(emo==='sleeping'||emo==='dancing'){
    eyes='<path d="M33 47 q6 -7 12 0" '+S+'/><path d="M51 47 q6 -7 12 0" '+S+'/>';
  } else if(emo==='angry'){
    eyes='<path d="M32 40 l13 5" '+S+'/><path d="M64 40 l-13 5" '+S+'/><circle cx="38" cy="51" r="3.4" fill="'+ink+'"/><circle cx="58" cy="51" r="3.4" fill="'+ink+'"/>';
  } else if(emo==='sad'){
    eyes='<path d="M33 43 q6 -4 12 -1" '+S+'/><path d="M51 42 q6 -3 12 1" '+S+'/><circle cx="39" cy="50" r="3.2" fill="'+ink+'"/><circle cx="57" cy="50" r="3.2" fill="'+ink+'"/>';
  } else {
    eyes='<g class="av-eyes"><circle cx="38" cy="47" r="4.6" fill="'+ink+'"/><circle cx="58" cy="47" r="4.6" fill="'+ink+'"/><circle cx="36.5" cy="45.4" r="1.5" fill="#ffffff" opacity="0.95"/><circle cx="56.5" cy="45.4" r="1.5" fill="#ffffff" opacity="0.95"/></g>';
  }
  if(emo==='dancing') mouth='<path d="M40 58 q8 9 16 0 q-2 8 -8 8 q-6 0 -8 -8z" fill="'+ink+'"/>';
  else if(emo==='angry') mouth='<path d="M41 65 q7 -6 14 0" '+S+'/>';
  else if(emo==='sad') mouth='<path d="M41 66 q7 -7 14 0" '+S+'/>';
  else if(emo==='typing') mouth='<circle cx="48" cy="63" r="3" fill="'+ink+'"/>';
  else if(emo==='sleeping') mouth='<circle cx="48" cy="62" r="2.4" fill="'+ink+'"/>';
  else mouth='<path d="M40 59 q8 7 16 0" '+S+'/>';
  if(emo==='sleeping') extra='<text x="66" y="30" font-size="13" font-weight="700" fill="'+ink+'" class="av-z">z</text><text x="75" y="20" font-size="10" font-weight="700" fill="'+ink+'" class="av-z2">z</text>';
  if(emo==='dancing') extra='<path d="M23 30 q-5 7 0 14" '+S+'/><path d="M73 30 q5 7 0 14" '+S+'/>';
  return eyes+mouth+extra;
}
function avatarSVG(preset, emo){
  emo=emo||'idle';
  if(preset==='custom') return customAvatarSVG(avatarShape, avatarFace, avatarColor, avatarAcc).replace('emo-idle','emo-'+emo);
  var body='';
  if(preset==='muse'){
    /* Muse style — soft plush hoodie mascot: orange clay hood with
       two sprout loops on top, cream face, glossy eyes, tiny hands. */
    body='<defs>'+avGrad('avMuse','#e86a3c')+avGrad('avMuseFace','#ffe9d2')+'</defs>'
      +'<ellipse cx="39" cy="10" rx="11" ry="5.5" fill="url(#avMuse)" transform="rotate(-26 39 10)"/><ellipse cx="58" cy="8" rx="10" ry="5" fill="url(#avMuse)" transform="rotate(16 58 8)"/>'
      +'<path d="M48 12 C69 12 84 28 84 48 C84 73 68 90 48 90 C28 90 12 73 12 48 C12 28 27 12 48 12 Z" fill="url(#avMuse)"/>'
      +'<circle cx="14" cy="67" r="6.5" fill="#ffe9d2"/><circle cx="82" cy="63" r="6.5" fill="#ffe9d2"/>'
      +'<ellipse cx="48" cy="53" rx="27" ry="23" fill="url(#avMuseFace)"/>'
      +avGloss(34,24,13,6,0.30)+avFace(emo,'#3a2417')+avBlush(61);
  } else if(preset==='botthew'){
    /* Botthew style — fluffy scalloped orange dot with a monocle. */
    var botEyes, botMouth;
    if(emo==='sleeping'||emo==='dancing'){ botEyes='<path d="M31 47 q6 -6 12 0" stroke="#3a2418" stroke-width="3.2" stroke-linecap="round" fill="none"/><path d="M52 47 q6 -6 12 0" stroke="#3a2418" stroke-width="3.2" stroke-linecap="round" fill="none"/>'; }
    else if(emo==='angry'){ botEyes='<path d="M30 40 l13 4 M66 40 l-13 4" stroke="#3a2418" stroke-width="3.2" stroke-linecap="round"/><circle cx="37" cy="50" r="3.4" fill="#3a2418"/><circle cx="59" cy="50" r="3.4" fill="#3a2418"/>'; }
    else { botEyes='<circle cx="37" cy="47" r="3.8" fill="#3a2418"/><circle cx="35.8" cy="45.6" r="1.3" fill="#fff"/><circle cx="59" cy="47" r="7.6" stroke="#3a2418" stroke-width="3" fill="none"/><circle cx="59" cy="47" r="2.6" fill="#3a2418"/><path d="M59 55 q3 10 -3 15" stroke="#3a2418" stroke-width="2.4" fill="none" stroke-linecap="round"/>'; }
    botMouth=(emo==='sad'||emo==='angry')? '<path d="M42 66 q6 -5 12 0" stroke="#3a2418" stroke-width="3.2" stroke-linecap="round" fill="none"/>' : (emo==='typing'? '<circle cx="48" cy="63" r="3" fill="#3a2418"/>' : '<path d="M41 61 q3.5 3.5 7 0 q3.5 3.5 7 0" stroke="#3a2418" stroke-width="3.2" stroke-linecap="round" fill="none"/>');
    var botRing=''; [[48,14],[65,18],[78,29],[84,46],[78,63],[65,75],[48,80],[31,75],[18,63],[12,46],[18,29],[31,18]].forEach(function(p){ botRing+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="12" fill="url(#avBot)"/>'; });
    body='<defs>'+avGrad('avBot','#f0764a')+'</defs>'+botRing+'<circle cx="48" cy="47" r="34" fill="url(#avBot)"/>'
      +avGloss(34,26,12,6,0.32)+botEyes+botMouth+avBlush(58)
      +(emo==='sleeping'? '<text x="72" y="22" font-size="12" font-weight="700" fill="#3a2418" class="av-z">z</text>' : '');
  } else if(preset==='froggy'){
    /* Froggy style — plush green frog with big stalk eyes. */
    var frogEyes;
    if(emo==='sleeping'||emo==='dancing'){ frogEyes='<path d="M24 27 q8 -7 16 0" stroke="#22401a" stroke-width="3.2" stroke-linecap="round" fill="none"/><path d="M56 27 q8 -7 16 0" stroke="#22401a" stroke-width="3.2" stroke-linecap="round" fill="none"/>'; }
    else { frogEyes='<circle cx="32" cy="27" r="4.4" fill="#22401a"/><circle cx="64" cy="27" r="4.4" fill="#22401a"/><circle cx="30.6" cy="25.4" r="1.5" fill="#fff"/><circle cx="62.6" cy="25.4" r="1.5" fill="#fff"/>'; }
    var frogMouth=(emo==='sad'||emo==='angry')? '<path d="M40 68 q8 -6 16 0" stroke="#22401a" stroke-width="3.4" stroke-linecap="round" fill="none"/>' : (emo==='dancing'? '<path d="M38 62 q10 10 20 0 q-3 8 -10 8 q-7 0 -10 -8z" fill="#22401a"/>' : '<path d="M37 62 q11 9 22 0" stroke="#22401a" stroke-width="3.4" stroke-linecap="round" fill="none"/>');
    body='<defs>'+avGrad('avFrog','#6fbf4a')+'</defs>'
      +'<circle cx="32" cy="26" r="12" fill="url(#avFrog)"/><circle cx="64" cy="26" r="12" fill="url(#avFrog)"/>'
      +'<circle cx="32" cy="26" r="8.6" fill="#ffffff"/><circle cx="64" cy="26" r="8.6" fill="#ffffff"/>'+frogEyes
      +'<path d="M48 28 C68 28 84 42 84 59 C84 79 68 90 48 90 C28 90 12 79 12 59 C12 42 28 28 48 28 Z" fill="url(#avFrog)"/>'
      +avGloss(33,40,12,6,0.30)+frogMouth+avBlush(64)
      +(emo==='sleeping'? '<text x="74" y="18" font-size="12" font-weight="700" fill="#22401a" class="av-z">z</text>' : '');
  } else if(preset==='berry'){
    /* Berry style — blue clay blob wearing a little black beret. */
    body='<defs>'+avGrad('avBerry','#3f8ef7')+'</defs>'
      +'<path d="M48 28 C67 28 83 43 83 62 C83 80 69 89 48 89 C27 89 13 80 13 62 C13 43 29 28 48 28 Z" fill="url(#avBerry)"/>'
      +avGloss(33,40,12,6,0.34)+avFace(emo,'#12283f')+avBlush(62)
      +'<ellipse cx="47" cy="26" rx="24" ry="10" fill="#26262b" transform="rotate(-6 47 26)"/><circle cx="59" cy="17" r="4" fill="#26262b"/>';
  } else if(preset==='sunny'){
    /* Sunny style — yellow plush blob with round happy glasses. */
    var sunEyes=(emo==='sleeping'||emo==='dancing')
      ? '<path d="M27 48 q6 -6 12 0" stroke="#3a2c10" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M54 48 q6 -6 12 0" stroke="#3a2c10" stroke-width="3" stroke-linecap="round" fill="none"/>'
      : '<circle cx="36" cy="48" r="3.4" fill="#3a2c10"/><circle cx="60" cy="48" r="3.4" fill="#3a2c10"/><circle cx="34.8" cy="46.6" r="1.2" fill="#fff"/><circle cx="58.8" cy="46.6" r="1.2" fill="#fff"/>';
    body='<defs>'+avGrad('avSun','#ffcf3f')+'</defs>'
      +'<path d="M48 11 C61 26 81 40 81 60 C81 78 66 89 48 89 C30 89 15 78 15 60 C15 40 35 26 48 11 Z" fill="url(#avSun)"/>'
      +avGloss(34,30,11,6,0.36)+sunEyes
      +'<circle cx="36" cy="48" r="10.5" stroke="#26262b" stroke-width="3" fill="#ffffff" opacity="0.92" fill-opacity="0.10"/><circle cx="60" cy="48" r="10.5" stroke="#26262b" stroke-width="3" fill="#ffffff" opacity="0.92" fill-opacity="0.10"/><path d="M46.5 46 q1.5 -2 3 0" stroke="#26262b" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M25.5 46 L16 42 M70.5 46 L80 42" stroke="#26262b" stroke-width="3" stroke-linecap="round"/>'
      +'<path d="M41 65 q7 6 14 0" stroke="#3a2c10" stroke-width="3.4" stroke-linecap="round" fill="none"/>'
      +'<ellipse cx="28" cy="62" rx="5.4" ry="3.2" fill="#ff9d5c" opacity="0.6"/><ellipse cx="68" cy="62" rx="5.4" ry="3.2" fill="#ff9d5c" opacity="0.6"/>';
  } else if(preset==='hearty'){
    /* Hearty style — pink plush heart with cute sunglasses. */
    body='<defs>'+avGrad('avHeart','#ff5c8a')+'</defs>'
      +'<path d="M48 87 C16 63 11 43 20 28 C27 15 44 16 48 31 C52 16 69 15 76 28 C85 43 80 63 48 87 Z" fill="url(#avHeart)"/>'
      +avGloss(32,30,10,5,0.36)
      +'<circle cx="35" cy="43" r="9.5" fill="#1c1c1e"/><circle cx="61" cy="43" r="9.5" fill="#1c1c1e"/><path d="M44 41 q4 -3 8 0" stroke="#1c1c1e" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M29 39 q3 -3 6 -2 M55 39 q3 -3 6 -2" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity="0.75"/>'
      +((emo==='sad'||emo==='angry')? '<path d="M41 64 q7 -6 14 0" stroke="#6b2436" stroke-width="3.4" stroke-linecap="round" fill="none"/>' : '<path d="M40 61 q8 7 16 0" stroke="#6b2436" stroke-width="3.4" stroke-linecap="round" fill="none"/>');
  } else if(preset==='mochi'){
    /* Mochi style — soft cream cat, pink inner ears and whiskers. */
    body='<defs>'+avGrad('avMochi','#f6ead6')+'</defs>'
      +'<path d="M23 34 L27 13 Q29 7 35 12 L46 24 Z" fill="url(#avMochi)"/><path d="M73 34 L69 13 Q67 7 61 12 L50 24 Z" fill="url(#avMochi)"/>'
      +'<path d="M27 30 L29 19 L38 25 Z" fill="#ffb3c2"/><path d="M69 30 L67 19 L58 25 Z" fill="#ffb3c2"/>'
      +'<circle cx="48" cy="53" r="36" fill="url(#avMochi)"/>'+avGloss(33,32,12,6,0.5)
      +'<g class="av-eyes"><circle cx="36" cy="50" r="4.4" fill="#4a3626"/><circle cx="60" cy="50" r="4.4" fill="#4a3626"/><circle cx="34.6" cy="48.4" r="1.4" fill="#fff"/><circle cx="58.6" cy="48.4" r="1.4" fill="#fff"/></g>'
      +'<path d="M45 58 q3 -2.4 6 0 q-1 4 -3 4 q-2 0 -3 -4z" fill="#ff8fb2"/><path d="M41 65 q3.5 3.4 7 0 q3.5 3.4 7 0" stroke="#4a3626" stroke-width="2.8" stroke-linecap="round" fill="none"/>'
      +'<path d="M13 52 h11 M15 61 l10 -2 M83 52 H72 M81 61 l-10 -2" stroke="#4a3626" stroke-width="2" stroke-linecap="round" opacity="0.45"/>'+avBlush(60);
  } else if(preset==='cue'){
    body='<defs><radialGradient id="avGloss" cx="0.35" cy="0.3" r="0.95"><stop offset="0" stop-color="#ffffff"/><stop offset="0.55" stop-color="#dcdce1"/><stop offset="1" stop-color="#9a9aa2"/></radialGradient></defs>'
      +'<circle cx="48" cy="48" r="41" fill="url(#avGloss)"/>'+avGloss(33,26,14,7,0.65)+'<ellipse cx="48" cy="83" rx="23" ry="5" fill="#000000" opacity="0.10"/>'+avFace(emo,'#26262b')+avBlush(60);
  } else if(preset==='grok'){
    var visor='';
    if(emo==='angry') visor='<path d="M31 44 l12 4 M65 44 l-12 4" stroke="var(--accent)" stroke-width="3.4" stroke-linecap="round"/>';
    else if(emo==='sleeping'||emo==='dancing') visor='<path d="M30 45 q6 -6 12 0 M54 45 q6 -6 12 0" stroke="var(--accent)" stroke-width="3.2" stroke-linecap="round" fill="none"/>';
    else visor='<circle cx="37" cy="44.5" r="3.4" fill="var(--accent)"/><circle cx="59" cy="44.5" r="3.4" fill="var(--accent)"/>';
    var gm=(emo==='sad'||emo==='angry')? '<path d="M40 68 q8 -6 16 0" stroke="#f5f5f7" stroke-width="3.2" stroke-linecap="round" fill="none"/>'
      : (emo==='dancing'? '<path d="M39 63 q9 11 18 0" stroke="#f5f5f7" stroke-width="3.2" stroke-linecap="round" fill="none"/>'
      : '<path d="M40 64 q8 6 16 0" stroke="#f5f5f7" stroke-width="3.2" stroke-linecap="round" fill="none"/>');
    body='<defs>'+avGrad('avGrok','#43434a')+'</defs>'
      +'<path d="M48 13 v-6" stroke="#43434a" stroke-width="4" stroke-linecap="round"/><circle cx="48" cy="6" r="3.6" fill="var(--accent)"/>'
      +'<circle cx="11" cy="48" r="6" fill="url(#avGrok)"/><circle cx="85" cy="48" r="6" fill="url(#avGrok)"/>'
      +'<rect x="11" y="13" width="74" height="70" rx="23" fill="url(#avGrok)"/>'
      +'<rect x="23" y="35" width="50" height="18" rx="9" fill="#0f0f12"/><path d="M27 39.5 h42" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity="0.14"/>'+visor+gm
      +'<circle cx="29" cy="63" r="4" fill="var(--accent)" opacity="0.30"/><circle cx="67" cy="63" r="4" fill="var(--accent)" opacity="0.30"/>'
      +(emo==='sleeping'? '<text x="76" y="26" font-size="12" font-weight="700" fill="#f5f5f7" class="av-z">z</text>' : '');
  } else if(preset==='dots'){
    /* Dots style — now a tiny plush trio: green, pink and yellow
       dot-friends grouped together, each with its own little face. */
    var sl=(emo==='sleeping');
    body='<defs>'+avGrad('avDotG','#6fbf4a')+avGrad('avDotP','#ff5c8a')+avGrad('avDotY','#ffcf3f')+'</defs>'
      +'<circle cx="29" cy="38" r="18" fill="url(#avDotG)"/><circle cx="67" cy="38" r="18" fill="url(#avDotP)"/>'
      +'<circle cx="23" cy="36" r="2.5" fill="#22401a"/><circle cx="35" cy="36" r="2.5" fill="#22401a"/><path d="M24 43 q5 4 10 0" stroke="#22401a" stroke-width="2.4" stroke-linecap="round" fill="none"/>'
      +'<circle cx="61" cy="36" r="3.2" fill="#1c1c1e"/><circle cx="73" cy="36" r="3.2" fill="#1c1c1e"/><path d="M62 44 q5 4 10 0" stroke="#6b2436" stroke-width="2.4" stroke-linecap="round" fill="none"/>'
      +'<ellipse cx="48" cy="68" rx="27" ry="21" fill="url(#avDotY)"/>'
      +'<circle cx="41" cy="66" r="6.4" stroke="#26262b" stroke-width="2.4" fill="none"/><circle cx="56" cy="66" r="6.4" stroke="#26262b" stroke-width="2.4" fill="none"/><circle cx="41" cy="66" r="2" fill="#3a2c10"/><circle cx="56" cy="66" r="2" fill="#3a2c10"/><path d="M44 76 q4.5 4 9 0" stroke="#3a2c10" stroke-width="2.6" stroke-linecap="round" fill="none"/>'
      +(sl? '<text x="76" y="20" font-size="13" font-weight="700" fill="#f5f5f7" class="av-z">z</text>' : '');
  } else if(preset==='claude'){
    /* Claude style — soft rounded starburst, clay-orange gradient. */
    body='<defs>'+avGrad('avClaude','#eda964')+'</defs>'
      +'<path d="M48 5 L56 32 L83 25 L62 44 L77 67 L54 58 L48 85 L42 58 L19 67 L34 44 L13 25 L40 32 Z" fill="url(#avClaude)" stroke="'+avShade('#eda964',-8)+'" stroke-width="7" stroke-linejoin="round"/>'
      +avGloss(36,26,10,5,0.35)+avFace(emo,'#4a3220')+avBlush(59);
  } else {
    /* Mia — plush bear: cream clay head, pink inner ears, muzzle. */
    body='<defs>'+avGrad('avMia','#f6f1e7')+'</defs>'
      +'<circle cx="28" cy="18" r="11.5" fill="url(#avMia)"/><circle cx="68" cy="18" r="11.5" fill="url(#avMia)"/>'
      +'<circle cx="28" cy="18" r="5.6" fill="#ffb3c2"/><circle cx="68" cy="18" r="5.6" fill="#ffb3c2"/>'
      +'<circle cx="48" cy="51" r="38" fill="url(#avMia)"/>'+avGloss(32,28,13,6,0.55)
      +'<ellipse cx="48" cy="61" rx="13.5" ry="9.5" fill="#ffffff" opacity="0.75"/>'
      +avFace(emo,'#26262b')+avBlush(57);
  }
  return avUniq('<svg viewBox="0 0 96 96" class="av-svg emo-'+emo+'" aria-hidden="true">'+body+'</svg>');
}
function customAvatarSVGFor(a, emo){
  /* Custom (shape + face + colour) avatars get the full emote set
     too: eye-closing comes from the blink animation on open faces,
     and sleeping / angry / sad / dancing / typing swap the face. */
  var face=a.face||'open';
  if(emo==='sleeping') face='sleepy'; else if(emo==='angry') face='angry';
  else if(emo==='sad') face='sad'; else if(emo==='dancing') face='smile';
  else if(emo==='typing') face='tired';
  return avUniq('<svg viewBox="0 0 96 96" class="av-svg emo-'+(emo||'idle')+'" aria-hidden="true">'+avShapeSVG(a.shape||'circle', a.color||'#8e8e93')+avFaceSVG(face, avInkFor(a.color||'#8e8e93'))+avAccSVG(a.acc||'none', avInkFor(a.color||'#8e8e93'))+'</svg>');
}
function avatarHTMLFor(a, emo){
  if(!a) return avatarSVG('mia', emo||'idle');
  if(a.avatar) return '<img src="'+a.avatar+'" alt="">';
  if(a.preset==='custom') return customAvatarSVGFor(a, emo);
  return avatarSVG(a.preset||'mia', emo||agentEmotion);
}
function agentAvatarHTML(emo){
  var a=chatAgent();
  if(a && a.id!==mainAgentId) return avatarHTMLFor(a, emo);
  if(agentAvatar) return '<img src="'+agentAvatar+'" alt="">';
  if(agentPreset==='custom' && a) return customAvatarSVGFor(a, emo);
  return avatarSVG(agentPreset, emo||agentEmotion);
}
function setAgentEmotion(e){
  agentEmotion=e;
  var a=chatAgent();
  document.querySelectorAll('.agent-ava-slot').forEach(function(s){
    if(a && a.avatar) return;
    if(a && a.id!==mainAgentId){ s.innerHTML=avatarHTMLFor(a, e); return; }
    if(!agentAvatar) s.innerHTML = (agentPreset==='custom' && a)? customAvatarSVGFor(a, e) : avatarSVG(agentPreset, e);
  });
}
function emotionForText(t){
  var s=(t||'').toLowerCase(), h=new Date().getHours();
  if(/(angry|furious|annoyed|hate this|frustrated|stupid app|not working)/.test(s)) return 'angry';
  if(/(sad|crying|miss you|depressed|lonely|heartbroken|tired of)/.test(s)) return 'sad';
  if(/(haha|lol|party|dance|celebrate|funny|🎉|🕺)/.test(s)) return 'dancing';
  if(h>=23||h<5) return 'sleeping';
  return 'idle';
}
function chatAgentHeadHTML(){
  var sz={small:56, medium:84, large:112, xl:128}[state.avatarSize]||112;
  var a=chatAgent();
  /* Top avatar, clean: the mascot alone — fully transparent, no
     background disc or circle behind it, and no name pill / text
     under it. The button keeps its aria-label for accessibility. */
  return '<div class="chat-agent-head"><button class="ca-ava" data-agenthead="'+(a?a.id:'')+'" style="width:'+sz+'px;height:'+sz+'px" aria-label="Open '+(a?esc(a.name):'agent')+'\u2019s page — swipe left or right to switch agent"><span class="agent-ava-slot">'+avatarHTMLFor(a)+'</span></button></div>';
}
/* ===== Custom avatar builder (Change Avatar editor) =====
   A custom avatar is a shape + a face expression + a colour, drawn
   as original Axo SVG. It is always animated by the same always-
   moving CSS as every other avatar. The full how-to for the agent
   lives in Agents files → agents/AVATAR.md. */
/* A LOT of shapes: a full animal family first (all drawn as soft
   3D-look plush mascots with the same clay shading as the presets),
   then the classic objects and things. */
var AVATAR_SHAPES=['bear','cat','dog','panda','bunny','fox','koala','penguin','owl','pig','monkey','tiger','frog','chick','octopus','whale','bee','circle','blob','square','heart','star','triangle','flame','gear','bell','cloud','donut','ghost','peach','bag','bot','mushroom','planet','sun','egg','cupcake','diamond','crown','cactus','apple'];
var AVATAR_SHAPE_SAMPLE={bear:'#b57948',cat:'#ff9f0a',dog:'#d9a05b',panda:'#f5f5f7',bunny:'#ff8fb2',fox:'#ff9f0a',koala:'#a7a7ad',penguin:'#43434a',owl:'#5e8ce6',pig:'#ff9db0',monkey:'#b57948',tiger:'#ff9f0a',frog:'#32d74b',chick:'#ffcf3f',octopus:'#ff7ab8',whale:'#3d9bff',bee:'#ffbf00',circle:'#ffbf00',blob:'#3d9bff',square:'#8e8e93',heart:'#f5534d',star:'#ffbf00',triangle:'#3d9bff',flame:'#f5534d',gear:'#8e8e93',bell:'#b57948',cloud:'#64d2ff',donut:'#ff8fb2',ghost:'#f5f5f7',peach:'#f0764a',bag:'#b57948',bot:'#8e8e93',mushroom:'#f5534d',planet:'#64d2ff',sun:'#ffbf00',egg:'#f6ead6',cupcake:'#ff8fb2',diamond:'#64d2ff',crown:'#ffbf00',cactus:'#32d74b',apple:'#f5534d'};
function avShapeName(s){ return s==='bot'? 'Robot' : s.charAt(0).toUpperCase()+s.slice(1); }
/* 20 faces, every one different — plain expressions plus faces
   WITH things on them: nerd glasses, cooling shades, star shades,
   heart eyes, a moustache, fringe hair, big ears and a cap. */
var AVATAR_FACES=['open','smile','joy','wink','sleepy','tired','tongue','chev','flat','angry','sad','glasses','cool','star','love','stache','hair','bigears','cap','wow','cat','dizzy','cry'];
var AVATAR_FACE_NAMES={open:'Classic',smile:'Happy',joy:'Laughing',wink:'Winky',sleepy:'Sleepy',tired:'Tired',tongue:'Cheeky',chev:'Chevron',flat:'Chill',angry:'Angry',sad:'Sad',glasses:'Nerd glasses',cool:'Cooling shades',star:'Star shades',love:'In love',stache:'Moustache',hair:'Fringe hair',bigears:'Big ears',cap:'Cap',wow:'Wow',cat:'Kitty',dizzy:'Dizzy',cry:'Crybaby'};
/* Wear — accessories worn over any shape + face: bows, headphones,
   hats, cooling extras and more. Stored on the agent as `acc`. */
var AVATAR_ACCS=['none','bow','phones','beret','crown','halo','party','flower','sprout','monocle','horns','antenna','mask'];
var AVATAR_ACC_NAMES={none:'None',bow:'Bow',phones:'Headphones',beret:'Beret',crown:'Crown',halo:'Halo',party:'Party hat',flower:'Flower',sprout:'Sprout',monocle:'Monocle',horns:'Horns',antenna:'Antenna',mask:'Sleep mask'};
/* Every preset mascot is really a shape + face + colour + wear
   build underneath — so after swiping to a preset, the user can
   still change its shape, face, colour or wear and make it fully
   their own (the first change turns the preset into that build). */
var AVATAR_PRESET_BASE={
  mia:{shape:'bear',face:'open',color:'#f6f1e7',acc:'none'},
  muse:{shape:'blob',face:'open',color:'#e86a3c',acc:'sprout'},
  botthew:{shape:'peach',face:'open',color:'#f0764a',acc:'monocle'},
  froggy:{shape:'frog',face:'open',color:'#6fbf4a',acc:'none'},
  berry:{shape:'blob',face:'open',color:'#3f8ef7',acc:'beret'},
  sunny:{shape:'peach',face:'glasses',color:'#ffcf3f',acc:'none'},
  hearty:{shape:'heart',face:'cool',color:'#ff5c8a',acc:'none'},
  mochi:{shape:'cat',face:'open',color:'#f6ead6',acc:'none'},
  cue:{shape:'circle',face:'open',color:'#e8e8ec',acc:'none'},
  grok:{shape:'bot',face:'open',color:'#43434a',acc:'antenna'},
  dots:{shape:'circle',face:'glasses',color:'#ffcf3f',acc:'none'},
  claude:{shape:'star',face:'open',color:'#eda964',acc:'none'}
};
var AVATAR_COLORS=['#b57948','#3d9bff','#f5534d','#ffbf00','#8e8e93','#f5f5f7','#26262b','#ff8fb2','#ff9f0a','#32d74b','#5e5ce6','#64d2ff'];
var avatarShape='triangle', avatarFace='wink', avatarColor='#b57948', avatarAcc='none', avDraft=null;
function avShapeGeom(shape, F, stroke){
  var ST=stroke? ' stroke="'+stroke+'" stroke-width="6" stroke-linejoin="round"' : '';
  switch(shape){
    case 'square': return '<rect x="18" y="18" width="60" height="60" rx="16" '+F+'/>';
    case 'blob': return '<path d="M50 12 C68 12 82 27 82 47 C82 68 67 84 46 84 C27 84 14 71 14 52 C14 36 18 12 50 12 Z" '+F+'/>';
    case 'heart': return '<path d="M48 83 C19 61 13 43 23 28 C31 15 48 19 48 33 C48 19 65 15 73 28 C83 43 77 61 48 83 Z" '+F+'/>';
    case 'star': return '<polygon points="48,11 59,36 85,38 65,55 71,81 48,67 25,81 31,55 11,38 37,36" '+F+ST+'/>';
    case 'bag': return '<rect x="21" y="35" width="54" height="46" rx="11" '+F+'/>';
    case 'triangle': return '<path d="M48 13 L85 74 Q88 84 77 84 L19 84 Q8 84 11 74 Z" '+F+ST+'/>';
    case 'flame': return '<path d="M48 9 C58 26 73 36 73 56 A25 25 0 1 1 23 56 C23 42 31 33 38 25 C40 33 43 38 47 40 C43 30 44 19 48 9 Z" '+F+'/>';
    case 'gear': return '<polygon points="48,13 55,24 67,19 69,32 82,34 77,45 86,52 75,58 77,71 64,71 58,82 48,75 38,82 32,71 19,71 21,58 10,52 19,45 14,34 27,32 29,19 41,24" '+F+ST+'/>';
    case 'bell': return '<path d="M48 15 C63 15 69 28 69 44 L69 57 L77 68 Q78 73 72 73 L24 73 Q18 73 19 68 L27 57 L27 44 C27 28 33 15 48 15 Z" '+F+'/><circle cx="48" cy="79" r="5" '+F+'/>';
    case 'cloud': return '<circle cx="31" cy="59" r="16" '+F+'/><circle cx="48" cy="47" r="21" '+F+'/><circle cx="65" cy="59" r="16" '+F+'/><rect x="15" y="57" width="66" height="21" rx="10" '+F+'/>';
    case 'donut': return '<path fill-rule="evenodd" d="M48 13 a35 35 0 1 0 0.01 0 Z M48 36 a12 12 0 1 1 -0.01 0 Z" '+F+'/>';
    case 'ghost': return '<path d="M24 85 V45 a24 24 0 0 1 48 0 V85 l-8 -7.5 L56 85 L48 77.5 L40 85 L32 77.5 Z" '+F+'/>';
    case 'cat': return '<path d="M25 38 L28 16 Q30 11 35 15 L45 26 Z" '+F+'/><path d="M71 38 L68 16 Q66 11 61 15 L51 26 Z" '+F+'/><circle cx="48" cy="55" r="32" '+F+'/>';
    case 'peach': var ring=''; [[48,17],[64,21],[76,33],[80,49],[74,65],[62,76],[48,79],[34,76],[22,65],[16,49],[20,33],[34,21]].forEach(function(p){ ring+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="11.5" '+F+'/>'; }); return ring+'<circle cx="48" cy="48" r="32" '+F+'/>';
    case 'frog': return '<circle cx="31" cy="28" r="11" '+F+'/><circle cx="65" cy="28" r="11" '+F+'/><ellipse cx="48" cy="57" rx="35" ry="31" '+F+'/>';
    case 'bear': return '<circle cx="28" cy="18" r="11.5" '+F+'/><circle cx="68" cy="18" r="11.5" '+F+'/><circle cx="48" cy="51" r="38" '+F+'/>';
    case 'dog': return '<ellipse cx="15" cy="42" rx="9" ry="21" '+F+' transform="rotate(10 15 42)"/><ellipse cx="81" cy="42" rx="9" ry="21" '+F+' transform="rotate(-10 81 42)"/><circle cx="48" cy="52" r="34" '+F+'/>';
    case 'panda': return '<circle cx="27" cy="19" r="11" '+F+'/><circle cx="69" cy="19" r="11" '+F+'/><circle cx="48" cy="51" r="37" '+F+'/>';
    case 'bunny': return '<ellipse cx="33" cy="15" rx="8" ry="16" '+F+' transform="rotate(-8 33 15)"/><ellipse cx="63" cy="15" rx="8" ry="16" '+F+' transform="rotate(8 63 15)"/><ellipse cx="48" cy="58" rx="33" ry="30" '+F+'/>';
    case 'fox': return '<path d="M22 40 L24 12 Q26 6 33 11 L48 26 Z" '+F+'/><path d="M74 40 L72 12 Q70 6 63 11 L48 26 Z" '+F+'/><circle cx="48" cy="54" r="33" '+F+'/>';
    case 'koala': return '<circle cx="17" cy="34" r="13" '+F+'/><circle cx="79" cy="34" r="13" '+F+'/><circle cx="48" cy="52" r="33" '+F+'/>';
    case 'penguin': return '<ellipse cx="48" cy="50" rx="34" ry="38" '+F+'/>';
    case 'owl': return '<path d="M26 30 L30 14 L42 24 Z" '+F+'/><path d="M70 30 L66 14 L54 24 Z" '+F+'/><rect x="15" y="20" width="66" height="66" rx="30" '+F+'/>';
    case 'pig': return '<path d="M26 32 L24 15 L40 20 Z" '+F+'/><path d="M70 32 L72 15 L56 20 Z" '+F+'/><circle cx="48" cy="52" r="35" '+F+'/>';
    case 'monkey': return '<circle cx="13" cy="50" r="9.5" '+F+'/><circle cx="83" cy="50" r="9.5" '+F+'/><circle cx="48" cy="50" r="35" '+F+'/>';
    case 'tiger': return '<circle cx="27" cy="19" r="10.5" '+F+'/><circle cx="69" cy="19" r="10.5" '+F+'/><circle cx="48" cy="51" r="37" '+F+'/>';
    case 'chick': return '<ellipse cx="48" cy="54" rx="31" ry="34" '+F+'/>';
    case 'octopus': return '<path d="M20 56 C20 32 32 20 48 20 C64 20 76 32 76 56 Z" '+F+'/><circle cx="27" cy="60" r="8" '+F+'/><circle cx="41" cy="64" r="8" '+F+'/><circle cx="55" cy="64" r="8" '+F+'/><circle cx="69" cy="60" r="8" '+F+'/>';
    case 'whale': return '<ellipse cx="46" cy="54" rx="36" ry="28" '+F+'/><polygon points="78,42 92,28 92,54 78,56" '+F+ST+'/>';
    case 'bee': return '<ellipse cx="48" cy="54" rx="34" ry="30" '+F+'/>';
    case 'bot': return '<rect x="45" y="9" width="6" height="12" '+F+'/><circle cx="48" cy="7" r="5" '+F+'/><rect x="8" y="40" width="8" height="20" rx="4" '+F+'/><rect x="80" y="40" width="8" height="20" rx="4" '+F+'/><rect x="15" y="20" width="66" height="62" rx="19" '+F+'/>';
    case 'mushroom': return '<path d="M14 50 C14 28 30 16 48 16 C66 16 82 28 82 50 C82 56 78 58 72 58 L24 58 C18 58 14 56 14 50 Z" '+F+'/><path d="M34 58 L62 58 L58 84 Q48 88 38 84 Z" '+F+'/>';
    case 'planet': return '<circle cx="48" cy="48" r="31" '+F+'/>';
    case 'sun': var rays=''; for(var ri=0;ri<8;ri++){ rays+='<rect x="44.5" y="1" width="7" height="15" rx="3.5" '+F+' transform="rotate('+(ri*45)+' 48 48)"/>'; } return rays+'<circle cx="48" cy="48" r="30" '+F+'/>';
    case 'egg': return '<ellipse cx="48" cy="52" rx="30" ry="38" '+F+'/>';
    case 'cupcake': return '<path d="M22 46 C22 30 34 20 48 20 C62 20 74 30 74 46 C74 52 70 54 64 54 L32 54 C26 54 22 52 22 46 Z" '+F+'/><path d="M30 54 L66 54 L61 84 L35 84 Z" '+F+'/>';
    case 'diamond': return '<polygon points="48,86 19,38 33,15 63,15 77,38" '+F+ST+'/>';
    case 'crown': return '<path d="M15 78 L15 30 L32 47 L48 22 L64 47 L81 30 L81 78 Z" '+F+ST+'/>';
    case 'cactus': return '<path d="M33 58 C18 58 12 48 12 36 L12 30 Q12 24 18 24 Q24 24 24 30 L24 36 C24 42 27 46 33 46 Z" '+F+'/><path d="M63 58 C78 58 84 48 84 36 L84 30 Q84 24 78 24 Q72 24 72 30 L72 36 C72 42 69 46 63 46 Z" '+F+'/><rect x="31" y="12" width="34" height="72" rx="17" '+F+'/>';
    case 'apple': return '<path d="M48 30 C40 18 18 22 16 44 C14 64 30 86 40 84 C44 83 52 83 56 84 C66 86 82 64 80 44 C78 22 56 18 48 30 Z" '+F+'/>';
    default: return '<circle cx="48" cy="48" r="37" '+F+'/>';
  }
}
function avShapeSVG(shape, color){
  /* Soft-3D upgrade: the shape is filled with a light-from-top-left
     clay gradient, then a glossy highlight and a soft bottom shade
     are clipped inside the same silhouette — plush, not flat. */
  var hex=String(color||'#8e8e93').replace('#','');
  var gid='csg'+hex, cid='csc'+shape+hex;
  var F='fill="url(#'+gid+')"';
  var extra='';
  if(shape==='bag') extra='<path d="M37 36 v-5 a11 9 0 0 1 22 0 v5" stroke="'+avShade(color,-12)+'" stroke-width="7" fill="none"/>';
  if(shape==='donut') extra='<g stroke-width="3.4" stroke-linecap="round"><path d="M30 28 l6 3 M62 24 l6 3 M68 62 l6 -3 M28 64 l6 -3 M44 18 l2 6" stroke="#ffffff" opacity="0.85"/><path d="M56 74 l6 3 M36 76 l6 -3" stroke="#7a4a21" opacity="0.8"/></g>';
  if(shape==='peach') extra='<ellipse cx="56" cy="13" rx="9" ry="4.6" fill="#32d74b" transform="rotate(24 56 13)"/>';
  if(shape==='cat') extra='<path d="M29 33 L31 22 L39 27 Z" fill="#ffb3c2"/><path d="M67 33 L65 22 L57 27 Z" fill="#ffb3c2"/>';
  if(shape==='frog') extra='<circle cx="31" cy="28" r="3" fill="#ffffff" opacity="0.5"/><circle cx="65" cy="28" r="3" fill="#ffffff" opacity="0.5"/>';
  /* Animal details — inner ears, muzzles, masks, stripes and other
     markings drawn in shades of the body colour, so the face ink
     the face is drawn with afterwards keeps its contrast. */
  if(shape==='bear') extra='<circle cx="28" cy="18" r="5.6" fill="#ffb3c2"/><circle cx="68" cy="18" r="5.6" fill="#ffb3c2"/><ellipse cx="48" cy="62" rx="13" ry="9" fill="'+avShade(color,34)+'" opacity="0.8"/>';
  if(shape==='dog') extra='<circle cx="63" cy="35" r="10" fill="'+avShade(color,-16)+'" opacity="0.45"/><ellipse cx="48" cy="63" rx="12" ry="8.5" fill="'+avShade(color,32)+'" opacity="0.85"/>';
  if(shape==='panda') extra='<circle cx="27" cy="19" r="6.5" fill="'+avShade(color,-42)+'"/><circle cx="69" cy="19" r="6.5" fill="'+avShade(color,-42)+'"/><ellipse cx="35" cy="46" rx="7.5" ry="10" fill="'+avShade(color,-38)+'" transform="rotate(-14 35 46)"/><ellipse cx="61" cy="46" rx="7.5" ry="10" fill="'+avShade(color,-38)+'" transform="rotate(14 61 46)"/>';
  if(shape==='bunny') extra='<ellipse cx="33" cy="16" rx="4" ry="10" fill="#ffb3c2" transform="rotate(-8 33 16)"/><ellipse cx="63" cy="16" rx="4" ry="10" fill="#ffb3c2" transform="rotate(8 63 16)"/>';
  if(shape==='fox') extra='<path d="M27 33 L28 21 L37 26 Z" fill="'+avShade(color,-22)+'"/><path d="M69 33 L68 21 L59 26 Z" fill="'+avShade(color,-22)+'"/><ellipse cx="48" cy="67" rx="20" ry="13" fill="'+avShade(color,48)+'" opacity="0.95"/>';
  if(shape==='koala') extra='<circle cx="17" cy="34" r="7" fill="#e3e3e8" opacity="0.9"/><circle cx="79" cy="34" r="7" fill="#e3e3e8" opacity="0.9"/><ellipse cx="48" cy="49" rx="6" ry="7.5" fill="#4a4a50"/>';
  if(shape==='penguin') extra='<ellipse cx="48" cy="61" rx="21" ry="24" fill="'+avShade(color,44)+'" opacity="0.97"/>';
  if(shape==='owl') extra='<circle cx="35" cy="45" r="10.5" fill="'+avShade(color,40)+'"/><circle cx="61" cy="45" r="10.5" fill="'+avShade(color,40)+'"/><polygon points="42,53 54,53 48,60" fill="#ff9f0a"/>';
  if(shape==='pig') extra='<ellipse cx="48" cy="59" rx="11" ry="8" fill="'+avShade(color,22)+'" stroke="'+avShade(color,-18)+'" stroke-width="2"/><circle cx="44" cy="59" r="1.8" fill="'+avShade(color,-30)+'"/><circle cx="52" cy="59" r="1.8" fill="'+avShade(color,-30)+'"/>';
  if(shape==='monkey') extra='<ellipse cx="48" cy="50" rx="23" ry="19" fill="'+avShade(color,40)+'"/><ellipse cx="48" cy="63" rx="12.5" ry="8.5" fill="'+avShade(color,50)+'"/>';
  if(shape==='tiger') extra='<g stroke="'+avShade(color,-32)+'" stroke-width="3.4" stroke-linecap="round"><path d="M40 15 v8 M48 13 v9 M56 15 v8 M16 40 l7 3 M80 40 l-7 3 M18 62 l7 -2 M78 62 l-7 -2"/></g><circle cx="28" cy="18" r="5" fill="#ffb3c2"/><circle cx="68" cy="18" r="5" fill="#ffb3c2"/>';
  if(shape==='chick') extra='<g stroke="'+avShade(color,-25)+'" stroke-width="3" stroke-linecap="round" fill="none"><path d="M42 21 q1 -8 6 -10 M49 20 q2 -7 6 -9"/></g>';
  if(shape==='whale') extra='<path d="M48 3 q4.5 6.5 0 10 q-4.5 -3.5 0 -10z" fill="#64d2ff"/><path d="M38 7 q3.5 5 0 8 q-3.5 -3 0 -8z" fill="#64d2ff"/><path d="M58 7 q3.5 5 0 8 q-3.5 -3 0 -8z" fill="#64d2ff"/><path d="M24 62 q24 10 48 0" stroke="'+avShade(color,32)+'" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>';
  if(shape==='bee') extra='<ellipse cx="29" cy="21" rx="11" ry="7" fill="#ffffff" opacity="0.75" transform="rotate(-20 29 21)"/><ellipse cx="67" cy="21" rx="11" ry="7" fill="#ffffff" opacity="0.75" transform="rotate(20 67 21)"/><path d="M29 33 C24.5 48 24.5 60 29 75 M67 33 C71.5 48 71.5 60 67 75" stroke="'+avShade(color,-28)+'" stroke-width="6" fill="none" opacity="0.85"/>';
  if(shape==='bot') extra='<rect x="24" y="31" width="48" height="40" rx="11" fill="'+avShade(color,26)+'" opacity="0.92"/>';
  if(shape==='mushroom') extra='<circle cx="32" cy="34" r="6" fill="#ffffff" opacity="0.8"/><circle cx="59" cy="27" r="7.5" fill="#ffffff" opacity="0.8"/><circle cx="68" cy="43" r="5" fill="#ffffff" opacity="0.8"/>';
  if(shape==='planet') extra='<circle cx="36" cy="38" r="5.5" fill="'+avShade(color,-14)+'" opacity="0.7"/><circle cx="58" cy="58" r="4" fill="'+avShade(color,-14)+'" opacity="0.7"/><ellipse cx="48" cy="52" rx="45" ry="12" stroke="'+avShade(color,-22)+'" stroke-width="5" fill="none" opacity="0.9" transform="rotate(-14 48 52)"/>';
  if(shape==='cupcake') extra='<circle cx="48" cy="14" r="6" fill="#f5534d"/><path d="M48 9 q2 -5 6 -6" stroke="#7a4a21" stroke-width="2.4" fill="none" stroke-linecap="round"/><g stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" opacity="0.85"><path d="M33 34 l5 2 M56 30 l5 2 M42 42 l5 2"/></g>';
  if(shape==='diamond') extra='<g stroke="#ffffff" stroke-width="2" opacity="0.45" fill="none"><path d="M19 38 h58 M33 15 l8 23 M63 15 l-8 23 M41 38 l7 46 M55 38 l-7 46"/></g>';
  if(shape==='crown') extra='<circle cx="48" cy="64" r="4" fill="#f5534d"/><circle cx="31" cy="64" r="3.2" fill="#3d9bff"/><circle cx="65" cy="64" r="3.2" fill="#32d74b"/>';
  if(shape==='cactus') extra='<g stroke="'+avShade(color,-25)+'" stroke-width="2" stroke-linecap="round"><path d="M42 30 l3 3 M54 44 l3 3 M43 62 l3 3 M52 24 l3 3"/></g>';
  if(shape==='apple') extra='<rect x="46" y="7" width="4.5" height="11" rx="2" fill="#7a4a21" transform="rotate(8 48 12)"/><ellipse cx="59" cy="11" rx="8.5" ry="4.4" fill="#32d74b" transform="rotate(24 59 11)"/>';
  return '<defs>'+avGrad(gid, color)+'<clipPath id="'+cid+'">'+avShapeGeom(shape,'fill="#000"','')+'</clipPath></defs>'
    +avShapeGeom(shape, F, avShade(color,-6))
    +'<g clip-path="url(#'+cid+')"><ellipse cx="33" cy="25" rx="21" ry="11" fill="#ffffff" opacity="0.34" transform="rotate(-16 33 25)"/><ellipse cx="53" cy="89" rx="31" ry="12" fill="#000000" opacity="0.14"/></g>'
    +extra;
}
function avFaceSVG(face, ink){
  var S='stroke="'+ink+'" stroke-width="3.4" stroke-linecap="round" fill="none"';
  switch(face){
    case 'sleepy': return '<path d="M29 46 q7 -6 14 0" '+S+'/><path d="M53 46 q7 -6 14 0" '+S+'/><circle cx="48" cy="63" r="3" fill="'+ink+'"/>';
    case 'wink': return '<circle cx="35" cy="45" r="7.5" stroke="#ffffff" stroke-width="4.6" fill="none"/><path d="M54 45 h14" '+S+'/><path d="M42 64 l13 -4" '+S+'/>';
    case 'tired': return '<path d="M27 40 h16 M53 40 h16" '+S+'/><circle cx="35" cy="49" r="3.6" fill="'+ink+'"/><circle cx="61" cy="49" r="3.6" fill="'+ink+'"/><circle cx="48" cy="65" r="2.4" fill="'+ink+'"/>';
    case 'tongue': return '<circle cx="35" cy="46" r="4" fill="'+ink+'"/><circle cx="61" cy="46" r="4" fill="'+ink+'"/><path d="M39 59 q9 8 18 0" '+S+'/><path d="M44 64 q4 7 8 0 z" fill="'+ink+'"/>';
    case 'smile': return '<circle cx="35" cy="46" r="4" fill="'+ink+'"/><path d="M54 46 q7 -6 14 0" '+S+'/><path d="M38 58 q10 10 20 0" '+S+'/>';
    case 'chev': return '<circle cx="35" cy="46" r="4.4" fill="'+ink+'"/><path d="M66 39 l-9 7 9 7" '+S+'/><path d="M41 62 q7 5 14 0" '+S+'/>';
    case 'glasses': return '<circle cx="35" cy="46" r="3" fill="'+ink+'"/><circle cx="61" cy="46" r="3" fill="'+ink+'"/><circle cx="35" cy="46" r="8" stroke="'+ink+'" stroke-width="3.2" fill="none"/><circle cx="61" cy="46" r="8" stroke="'+ink+'" stroke-width="3.2" fill="none"/><path d="M27 38 q21 -8 42 0" '+S+'/><path d="M41 63 h14" '+S+'/>';
    case 'flat': return '<circle cx="35" cy="46" r="4" fill="'+ink+'"/><circle cx="61" cy="46" r="4" fill="'+ink+'"/><path d="M40 64 h16" '+S+'/>';
    case 'angry': return '<path d="M27 38 l15 5 M69 38 l-15 5" '+S+'/><circle cx="35" cy="50" r="3.6" fill="'+ink+'"/><circle cx="61" cy="50" r="3.6" fill="'+ink+'"/><path d="M41 68 q7 -6 14 0" '+S+'/>';
    case 'sad': return '<path d="M28 37 q7 -3 13 1 M55 38 q7 -4 13 -1" '+S+'/><circle cx="35" cy="49" r="3.6" fill="'+ink+'"/><circle cx="61" cy="49" r="3.6" fill="'+ink+'"/><path d="M41 68 q7 -7 14 0" '+S+'/><path d="M69 53 q4.5 6.5 0 9 q-4.5 -2.5 0 -9" fill="'+ink+'" opacity=".6"/>';
    case 'joy': return '<path d="M28 47 q7 -8 14 0" '+S+'/><path d="M54 47 q7 -8 14 0" '+S+'/><path d="M38 57 q10 12 20 0 q-2 10 -10 10 q-8 0 -10 -10z" fill="'+ink+'"/><ellipse cx="26" cy="57" rx="4.8" ry="2.9" fill="#ff9d9d" opacity="0.55"/><ellipse cx="70" cy="57" rx="4.8" ry="2.9" fill="#ff9d9d" opacity="0.55"/>';
    case 'cool': return '<rect x="24" y="38" width="21" height="14" rx="6" fill="#1c1c1e"/><rect x="51" y="38" width="21" height="14" rx="6" fill="#1c1c1e"/><path d="M45 43 h6 M24 42 L15 38 M72 42 L81 38" stroke="#1c1c1e" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="M28 42.5 h9" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity="0.5"/><path d="M55 42.5 h9" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity="0.5"/><path d="M40 64 q9 5 16 -2" '+S+'/>';
    case 'star': return '<polygon points="35,35 38,42.5 46,43 40,48 42,56 35,51.5 28,56 30,48 24,43 32,42.5" fill="#1c1c1e"/><polygon points="61,35 64,42.5 72,43 66,48 68,56 61,51.5 54,56 56,48 50,43 58,42.5" fill="#1c1c1e"/><path d="M43 44 q5 -3 10 0" stroke="#1c1c1e" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M40 62 q8 7 16 0" '+S+'/>';
    case 'love': return '<path d="M35 55 C25 47 24 39 29 36 C32 34 35 36 35 39 C35 36 38 34 41 36 C46 39 45 47 35 55 Z" fill="#ff5c8a"/><path d="M61 55 C51 47 50 39 55 36 C58 34 61 36 61 39 C61 36 64 34 67 36 C72 39 71 47 61 55 Z" fill="#ff5c8a"/><path d="M39 61 q9 9 18 0 q-2.5 7 -9 7 q-6.5 0 -9 -7z" fill="'+ink+'"/>';
    case 'stache': return '<circle cx="35" cy="44" r="4.4" fill="'+ink+'"/><circle cx="61" cy="44" r="4.4" fill="'+ink+'"/><path d="M28 36 q7 -3 13 0 M55 36 q7 -3 13 0" '+S+'/><path d="M48 57 q-5 -5 -13 -2 q-5 2 -3 6 q7 6 16 -1 q9 7 16 1 q2 -4 -3 -6 q-8 -3 -13 2z" fill="'+ink+'"/><path d="M43 70 q5 3 10 0" '+S+'/>';
    case 'hair': return '<path d="M21 40 q2 -19 27 -20 q25 1 27 18 q-7 -8 -15 -8 q3 5 1 9 q-9 -10 -24 -9 q-10 1 -16 10z" fill="#6b4a2b"/><path d="M21 40 q-1 8 2 13 l5 -3 q-3 -5 -2 -10z" fill="#6b4a2b"/><path d="M75 38 q1 8 -2 13 l-5 -3 q3 -5 2 -10z" fill="#6b4a2b"/><circle cx="35" cy="49" r="4.4" fill="'+ink+'"/><circle cx="61" cy="49" r="4.4" fill="'+ink+'"/><path d="M40 62 q8 7 16 0" '+S+'/>';
    case 'bigears': return '<ellipse cx="12" cy="50" rx="7" ry="12" fill="#e8b48c"/><ellipse cx="84" cy="50" rx="7" ry="12" fill="#e8b48c"/><ellipse cx="12" cy="50" rx="3.6" ry="7.5" fill="#d18d64"/><ellipse cx="84" cy="50" rx="3.6" ry="7.5" fill="#d18d64"/><circle cx="35" cy="46" r="4.8" fill="'+ink+'"/><circle cx="61" cy="46" r="4.8" fill="'+ink+'"/><circle cx="33.6" cy="44.4" r="1.5" fill="#ffffff" opacity="0.95"/><circle cx="59.6" cy="44.4" r="1.5" fill="#ffffff" opacity="0.95"/><path d="M40 59 q8 7 16 0" '+S+'/>';
    case 'cap': return '<path d="M23 36 a25 14 0 0 1 50 0 l0 3 -50 0z" fill="#3d9bff"/><ellipse cx="48" cy="39" rx="31" ry="5" fill="#2f7fd6"/><circle cx="48" cy="23" r="3.4" fill="#2f7fd6"/><circle cx="35" cy="49" r="4.4" fill="'+ink+'"/><path d="M54 49 h14" '+S+'/><path d="M40 62 q8 7 16 0" '+S+'/>';
    case 'wow': return '<path d="M27 35 q8 -5 15 -1 M54 34 q8 -4 15 1" '+S+'/><circle cx="35" cy="46" r="7.6" fill="#ffffff"/><circle cx="61" cy="46" r="7.6" fill="#ffffff"/><circle cx="35" cy="47" r="3.4" fill="'+ink+'"/><circle cx="61" cy="47" r="3.4" fill="'+ink+'"/><circle cx="48" cy="64" r="5.4" fill="'+ink+'"/>';
    case 'cat': return '<circle cx="35" cy="45" r="4.4" fill="'+ink+'"/><circle cx="61" cy="45" r="4.4" fill="'+ink+'"/><path d="M41 61 q3.5 3.6 7 0 q3.5 3.6 7 0" '+S+'/><path d="M12 52 h12 M14 61 l11 -2 M84 52 H72 M82 61 l-11 -2" stroke="'+ink+'" stroke-width="2" stroke-linecap="round" opacity="0.5"/>';
    case 'dizzy': return '<path d="M29 40 l12 12 M41 40 l-12 12 M55 40 l12 12 M67 40 l-12 12" '+S+'/><path d="M38 65 q5 -5 10 0 q5 5 10 0" '+S+'/>';
    case 'cry': return '<path d="M28 44 q7 -6 14 0 M54 44 q7 -6 14 0" '+S+'/><path d="M31 50 q4 8 0 11 q-4 -3 0 -11z" fill="#64d2ff"/><path d="M65 50 q4 8 0 11 q-4 -3 0 -11z" fill="#64d2ff"/><path d="M39 68 q4.5 -4.5 9 0 q4.5 4.5 9 0" '+S+'/>';
    default: return '<g class="emo-blinkeyes"><circle cx="35" cy="46" r="4.8" fill="'+ink+'"/><circle cx="61" cy="46" r="4.8" fill="'+ink+'"/><circle cx="33.6" cy="44.4" r="1.5" fill="#ffffff" opacity="0.95"/><circle cx="59.6" cy="44.4" r="1.5" fill="#ffffff" opacity="0.95"/></g><ellipse cx="26" cy="57" rx="4.8" ry="2.9" fill="#ff9d9d" opacity="0.5"/><ellipse cx="70" cy="57" rx="4.8" ry="2.9" fill="#ff9d9d" opacity="0.5"/><path d="M40 59 q8 7 16 0" '+S+'/>';
  }
}
function avInkFor(color){
  var hex=(color||'').replace('#',''); if(hex.length<6) return '#26262b';
  var r=parseInt(hex.substr(0,2),16), g=parseInt(hex.substr(2,2),16), b=parseInt(hex.substr(4,2),16);
  return ((0.2126*r+0.7152*g+0.0722*b)/255>0.55)?'#26262b':'#ffffff';
}
/* Wear accessories — drawn OVER the face, in fixed friendly
   colours, so a bow, headphones, a hat or a monocle reads on any
   shape and any body colour. */
function avAccSVG(acc, ink){
  switch(acc){
    case 'bow': return '<g transform="rotate(14 70 15)"><path d="M70 15 L56 6 Q52 14 56 22 Z" fill="#ff5c8a"/><path d="M70 15 L84 6 Q88 14 84 22 Z" fill="#ff5c8a"/><circle cx="70" cy="14.5" r="4.6" fill="#e0446f"/></g>';
    case 'phones': return '<path d="M21 47 a27 25 0 0 1 54 0" stroke="#26262b" stroke-width="5.5" fill="none" stroke-linecap="round"/><rect x="14" y="42" width="12" height="19" rx="6" fill="#26262b"/><rect x="70" y="42" width="12" height="19" rx="6" fill="#26262b"/><circle cx="20" cy="51.5" r="3" fill="#5b9dff"/><circle cx="76" cy="51.5" r="3" fill="#5b9dff"/>';
    case 'beret': return '<ellipse cx="47" cy="17" rx="23" ry="9.5" fill="#26262b" transform="rotate(-6 47 17)"/><circle cx="58" cy="9" r="3.6" fill="#26262b"/>';
    case 'crown': return '<polygon points="33,22 33,7 42,15 48,4 54,15 63,7 63,22" fill="#ffbf00" stroke="#e09e00" stroke-width="2" stroke-linejoin="round"/><circle cx="48" cy="17" r="2.4" fill="#f5534d"/>';
    case 'halo': return '<ellipse cx="48" cy="7" rx="14" ry="4.4" stroke="#ffd60a" stroke-width="3.2" fill="none"/>';
    case 'party': return '<polygon points="48,1 35,27 61,27" fill="#5e5ce6"/><circle cx="48" cy="3" r="4" fill="#ffcf3f"/><circle cx="44" cy="17" r="2.2" fill="#ffffff" opacity="0.85"/><circle cx="53" cy="22" r="2.2" fill="#ffffff" opacity="0.85"/><path d="M35 27 h26" stroke="#4845c4" stroke-width="3" stroke-linecap="round"/>';
    case 'flower': return '<g><circle cx="26" cy="8" r="4.2" fill="#ff8fb2"/><circle cx="19" cy="13" r="4.2" fill="#ff8fb2"/><circle cx="33" cy="13" r="4.2" fill="#ff8fb2"/><circle cx="21.5" cy="20" r="4.2" fill="#ff8fb2"/><circle cx="30.5" cy="20" r="4.2" fill="#ff8fb2"/><circle cx="26" cy="14" r="3.6" fill="#ffd60a"/></g>';
    case 'sprout': return '<path d="M48 16 v-7" stroke="#2aa84f" stroke-width="3" stroke-linecap="round"/><ellipse cx="41" cy="7" rx="6.5" ry="3.8" fill="#32d74b" transform="rotate(-24 41 7)"/><ellipse cx="55" cy="7" rx="6.5" ry="3.8" fill="#32d74b" transform="rotate(24 55 7)"/>';
    case 'monocle': return '<circle cx="61" cy="46" r="9.5" stroke="#c9962e" stroke-width="2.8" fill="#ffffff" fill-opacity="0.10"/><path d="M61 55.5 q4 11 -3 18" stroke="#c9962e" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    case 'horns': return '<path d="M24 22 q-4 -13 4 -19 q3 9 8 13 q-6 5 -12 6z" fill="#f5534d"/><path d="M72 22 q4 -13 -4 -19 q-3 9 -8 13 q6 5 12 6z" fill="#f5534d"/>';
    case 'antenna': return '<path d="M48 14 v-8" stroke="'+ink+'" stroke-width="3" stroke-linecap="round"/><polygon points="48,0 50.2,4.6 55,5 51.5,8.2 52.6,13 48,10.4 43.4,13 44.5,8.2 41,5 45.8,4.6" fill="#ffbf00"/>';
    case 'mask': return '<rect x="21" y="37" width="54" height="17" rx="8.5" fill="#64d2ff"/><path d="M21 44 L12 41 M75 44 L84 41" stroke="#64d2ff" stroke-width="3.4" stroke-linecap="round"/><text x="40" y="50" font-size="9" font-weight="700" fill="#ffffff">z z</text>';
    default: return '';
  }
}
function customAvatarSVG(shape, face, color, acc){
  return avUniq('<svg viewBox="0 0 96 96" class="av-svg emo-idle" aria-hidden="true">'+avShapeSVG(shape,color)+avFaceSVG(face, avInkFor(color))+avAccSVG(acc||'none', avInkFor(color))+'</svg>');
}
function applyCustomAvatar(shape, face, color, acc){
  avatarShape=shape; avatarFace=face; avatarColor=color; avatarAcc=acc||'none';
  agentPreset='custom'; agentAvatar='';
  var a=targetAgent();
  if(a){ a.shape=shape; a.face=face; a.color=color; a.acc=acc||'none'; a.preset='custom'; a.avatar=''; if(a.id===mainAgentId) syncMainGlobals(); autoGenerateEmotes(a); }
}
/* Settings page for the editor — registered in renderSettingsInner. */
function hexToHue(hex){
  var m=String(hex||'').replace('#',''); if(m.length<6) return 210;
  var r=parseInt(m.substr(0,2),16)/255, g=parseInt(m.substr(2,2),16)/255, b=parseInt(m.substr(4,2),16)/255;
  var mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn, h=0;
  if(d){ if(mx===r) h=((g-b)/d)%6; else if(mx===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; if(h<0) h+=360; }
  return Math.round(h);
}
function settingsAvatarEdit(){
  /* ONE Avatar page. Minimal and clean — one live preview at the
     top: swipes and ‹ › slide through the preset mascots, with
     crisp peek circles at the edges previewing each side. The
     Shape / Face / Colour selector under it swaps the panel
     below to that full list (every shape, every face plus the
     Wear accessories, or the colours) as scrollable avatar
     tiles — one tap picks, and picking on a preset customises
     that mascot. Then Presets, Emotes, and a photo upload. The
     check at the top saves the current pick. */
  var ta=targetAgent();
  if(!avDraft){
    var hasPhoto=!!(ta&&ta.avatar);
    var isPreset=!!(ta&&ta.preset&&ta.preset!=='custom');
    avDraft={
      mode: hasPhoto? 'photo' : (isPreset? 'preset' : 'custom'),
      preset: isPreset? ta.preset : 'mia',
      shape:(ta&&ta.shape)||avatarShape||'circle',
      face:(ta&&ta.face)||avatarFace||'open',
      color:(ta&&ta.color)||avatarColor||'#8e8e93',
      acc:(ta&&ta.acc)||avatarAcc||'none',
      emote:'idle',
      attr:'shape'
    };
  }
  var d=avDraft;
  if(!d.attr) d.attr='shape';
  if(!d.emote) d.emote='idle';
  var emos=[['idle','Idle'],['typing','Typing'],['dancing','Dancing'],['sleeping','Sleeping'],['angry','Angry'],['sad','Sad']];
  function draftEmote(emo){
    if(d.mode==='preset') return avatarSVG(d.preset, emo);
    return customAvatarSVGFor({shape:d.shape, face:d.face, color:d.color, acc:d.acc}, emo);
  }
  function emotesHTML(){
    if(d.mode==='photo') return '<p class="set-note" style="margin:0">Emotes are for drawn avatars — this avatar is a photo.</p>';
    return emos.map(function(e){ return '<button class="av-emote'+((d.emote||'idle')===e[0]?' sel':'')+'" data-avemote="'+e[0]+'" aria-label="Show '+e[1]+' in the big preview"><span class="av-prev sm">'+draftEmote(e[0])+'</span><span>'+e[1]+'</span></button>'; }).join('');
  }
  function presetsHTML(){
    return AVATAR_PRESETS.map(function(p){ return '<button class="av-card'+((d.mode==='preset'&&d.preset===p.id)?' sel':'')+'" data-avpreset="'+p.id+'" aria-label="Use the '+escA(p.name)+' preset"><span class="av-prev">'+avatarSVG(p.id,'idle')+'</span><span>'+esc(p.name)+'</span></button>'; }).join('');
  }
  function previewHTML(){
    var emo=d.emote||'idle';
    if(d.mode==='photo'&&ta&&ta.avatar) return '<img src="'+ta.avatar+'" alt="">';
    if(d.mode==='preset') return avatarSVG(d.preset, emo);
    /* Idle shows the picked face EXACTLY (no emote face swap), so
       Face steps are always visible in the preview. */
    if(emo==='idle') return customAvatarSVG(d.shape, d.face, d.color, d.acc);
    return customAvatarSVGFor({shape:d.shape, face:d.face, color:d.color, acc:d.acc}, emo);
  }
  function modeLine(){
    var base;
    if(d.mode==='photo') base='Photo avatar — swipe to replace it';
    else if(d.mode==='preset'){ base='Preset'; for(var i=0;i<AVATAR_PRESETS.length;i++) if(AVATAR_PRESETS[i].id===d.preset) base='Preset · '+AVATAR_PRESETS[i].name; }
    else base='Custom · '+avShapeName(d.shape)+' · '+(AVATAR_FACE_NAMES[d.face]||d.face)+((d.acc&&d.acc!=='none')? ' · '+(AVATAR_ACC_NAMES[d.acc]||d.acc) : '');
    var emo=d.emote||'idle';
    if(emo!=='idle' && d.mode!=='photo'){ for(var j=0;j<emos.length;j++) if(emos[j][0]===emo) base+=' · '+emos[j][1]; }
    return base;
  }
  /* The stage is the PRESET MASCOT carousel: swipes and the ‹ ›
     arrows slide through the preset mascots, and the crisp
     circles at the stage edges preview the mascot waiting on
     each side. Customising happens in the full panel below —
     and because every preset is a shape + face + colour + wear
     build underneath, changing any of those on a preset turns it
     into your own custom version of that mascot. */
  function presetIdx(){
    if(d.mode!=='preset') return -1;
    for(var i=0;i<AVATAR_PRESETS.length;i++) if(AVATAR_PRESETS[i].id===d.preset) return i;
    return 0;
  }
  function stepPreset(dir){
    var L=AVATAR_PRESETS, i=presetIdx();
    if(i<0) i=(dir>0? -1 : 0);
    var n=L[(i+dir+L.length)%L.length];
    d.mode='preset'; d.preset=n.id; d.emote='idle';
    upd();
  }
  function peekPreset(dir){
    var L=AVATAR_PRESETS, i=presetIdx(); if(i<0) i=0;
    return L[(i+dir+L.length)%L.length];
  }
  /* The build the chooser tiles show and edit: the live custom
     values, or the preset's own underlying build while a preset
     is showing. */
  function effCfg(){
    if(d.mode==='preset'){ var b=AVATAR_PRESET_BASE[d.preset]||AVATAR_PRESET_BASE.mia; return {shape:b.shape, face:b.face, color:b.color, acc:b.acc||'none'}; }
    return {shape:d.shape, face:d.face, color:d.color, acc:d.acc||'none'};
  }
  function toCustom(){
    if(d.mode==='custom') return;
    var c=effCfg();
    d.shape=c.shape; d.face=c.face; d.color=c.color; d.acc=c.acc;
    d.mode='custom';
  }
  function pickAttr(kind, v){
    toCustom();
    /* Any pick returns the preview to idle first — an active
       emote replaces the face, so the new pick would not show. */
    d.emote='idle';
    if(kind==='shape') d.shape=v;
    else if(kind==='face') d.face=v;
    else if(kind==='acc') d.acc=v;
    else if(kind==='colour'){ d.color=v; var hv=$('#avHue'); if(hv) hv.value=hexToHue(v); }
    upd();
  }
  function pickTile(kind, v, label, svg, cur){
    return '<button class="av-pick'+(cur===v?' sel':'')+'" data-avpick="'+kind+':'+v+'" aria-label="Use '+escA(label)+'"><span class="av-prev">'+svg+'</span><span>'+esc(label)+'</span></button>';
  }
  /* The panel that replaces the old emotes-only area: it shows
     the FULL list for whichever of Shape / Face is picked, in
     the same tile UI as the emotes, scrollable up and down so
     one tap picks — no stepping through one by one. Face also
     carries the Wear row (bows, headphones, hats and extras).
     Colour keeps its swatch + rainbow panel. */
  function pickHTML(){
    var c=effCfg();
    if(d.attr==='face'){
      return '<div class="av-pickgrid">'+AVATAR_FACES.map(function(f){ return pickTile('face', f, AVATAR_FACE_NAMES[f]||f, customAvatarSVG(c.shape, f, c.color, c.acc), c.face); }).join('')+'</div>'
        +'<div class="ap-label" style="margin-top:16px">Wear — bows, headphones, hats & extras</div>'
        +'<div class="av-pickgrid acc">'+AVATAR_ACCS.map(function(a){ return pickTile('acc', a, AVATAR_ACC_NAMES[a]||a, customAvatarSVG(c.shape, c.face, c.color, a), c.acc); }).join('')+'</div>';
    }
    if(d.attr==='colour') return '';
    return '<div class="av-pickgrid">'+AVATAR_SHAPES.map(function(s){ return pickTile('shape', s, avShapeName(s), customAvatarSVG(s, c.face, c.color, c.acc), c.shape); }).join('')+'</div>';
  }
  function attrValHTML(){
    var c=effCfg();
    if(d.attr==='colour') return '<span class="vchip" style="background:'+c.color+'"></span>'+esc(c.color.toUpperCase());
    if(d.attr==='face') return esc((AVATAR_FACE_NAMES[c.face]||c.face)+((c.acc&&c.acc!=='none')? ' · '+(AVATAR_ACC_NAMES[c.acc]||c.acc) : ''));
    return esc(avShapeName(c.shape));
  }
  function swipeOn(el, fn){
    if(!el) return; var sx=null;
    el.addEventListener('touchstart',function(e){ sx=e.touches[0].clientX; },{passive:true});
    el.addEventListener('touchend',function(e){ if(sx===null) return; var dx=e.changedTouches[0].clientX-sx; sx=null; if(dx<=-40) fn(1); else if(dx>=40) fn(-1); });
    el.addEventListener('mousedown',function(e){ sx=e.clientX; });
    el.addEventListener('mouseup',function(e){ if(sx===null) return; var dx=e.clientX-sx; sx=null; if(dx<=-40) fn(1); else if(dx>=40) fn(-1); });
  }
  setView.innerHTML='<div class="avedit-head"><button class="circle-btn" id="avEditBack" aria-label="Back">'+I.back+'</button><h2>Avatar</h2><button class="avedit-save" id="avEditSave" aria-label="Save avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 L9.5 18 L20 6.5"/></svg></button></div>'
    +'<div class="set-scroll"><div class="set-inner">'
    +'<div class="av-stage" id="avStage"><button class="av-peek" id="avPeekPrev" aria-label="Previous mascot"></button><button class="avp-arrow av-step" id="avStepPrev" aria-label="Previous mascot">'+I.back+'</button>'
    +'<div class="avedit-preview"><div class="avedit-previewback" id="avEditPreview">'+previewHTML()+'</div></div>'
    +'<button class="avp-arrow av-step" id="avStepNext" aria-label="Next mascot">'+I.chevR+'</button><button class="av-peek" id="avPeekNext" aria-label="Next mascot"></button></div>'
    +'<p id="avModeLine" style="text-align:center;color:var(--muted);font-size:13.5px;margin:2px 0 0">'+esc(modeLine())+'</p>'
    +'<div class="av-seg" role="tablist" aria-label="Pick what to change">'
    +'<button data-avattr="shape">Shape</button><button data-avattr="face">Face</button><button data-avattr="colour">Colour</button></div>'
    +'<div class="av-valrow"><span class="av-val" id="avAttrVal"></span></div>'
    +'<div id="avPickWrap"></div>'
    +'<div class="avedit-palwrap" id="avPalWrap">'
    +'<div class="avedit-pal" style="padding:0">'+AVATAR_COLORS.map(function(c){ return '<button data-avcol="'+c+'" class="'+(d.color===c?'sel':'')+'" style="background:'+c+'" aria-label="Colour '+c+'"></button>'; }).join('')+'</div>'
    +'<input type="range" class="avedit-hue" id="avHue" min="0" max="360" step="1" value="'+hexToHue(d.color)+'" aria-label="Custom colour hue">'
    +'<div style="display:flex;align-items:center;gap:10px;padding:6px 0 10px"><span style="width:26px;height:26px;border-radius:50%;border:2px solid var(--border2);flex:none" id="avChosenChip"></span><span style="flex:1;color:var(--muted);font-size:13.5px">Any colour — drag the rainbow bar</span></div>'
    +'</div>'
    +'<div class="ap-label">Presets</div>'
    +'<div class="av-grid" id="avPresets">'+presetsHTML()+'</div>'
    +'<div class="ap-label">Emotes</div>'
    +'<div class="av-emotes" id="avEmotes">'+emotesHTML()+'</div>'
    +'<div class="avedit-div"></div>'
    +'<button class="btn-ghost" id="avCreateChat" style="margin-top:18px">Create your own avatar in chat</button>'
    +'<button class="btn-ghost" id="avEditUpload" style="margin-top:9px">Upload a photo instead</button>'
    +'<p class="set-note" style="margin-top:12px">Swipe or tap ‹ › to change mascot — the clear circles at the edges preview what is on each side · pick Shape, Face or Colour and tap in the panel to customise it · tap an emote to see it big · the check saves.</p>'
    +'</div></div>';
  function upd(){
    $('#avEditPreview').innerHTML=previewHTML();
    var ml=$('#avModeLine'); if(ml) ml.textContent=modeLine();
    var em=$('#avEmotes'); if(em) em.innerHTML=emotesHTML();
    var chip=$('#avChosenChip'); if(chip) chip.style.background=effCfg().color;
    setView.querySelectorAll('[data-avemote]').forEach(function(b){ b.classList.toggle('sel', b.getAttribute('data-avemote')===(d.emote||'idle')); });
    setView.querySelectorAll('[data-avattr]').forEach(function(b){ b.classList.toggle('sel', b.getAttribute('data-avattr')===d.attr); });
    var vv=$('#avAttrVal'); if(vv) vv.innerHTML=attrValHTML();
    var pk=$('#avPickWrap'); if(pk) pk.innerHTML=pickHTML();
    var pp=$('#avPeekPrev'); if(pp) pp.innerHTML=avatarSVG(peekPreset(-1).id,'idle');
    var pn=$('#avPeekNext'); if(pn) pn.innerHTML=avatarSVG(peekPreset(1).id,'idle');
    var pw=$('#avPalWrap'); if(pw) pw.classList.toggle('show', d.attr==='colour');
    var hv2=$('#avHue'); if(hv2 && document.activeElement!==hv2) hv2.value=hexToHue(effCfg().color);
    setView.querySelectorAll('[data-avcol]').forEach(function(b){ b.classList.toggle('sel', b.getAttribute('data-avcol')===effCfg().color); });
    var pv=$('#avPresets'); if(pv) pv.innerHTML=presetsHTML();
  }
  function avGoBack(){
    avDraft=null;
    var r=avReturn; avReturn='agentpage'; avatarTargetAgentId=null;
    if(r==='chat'){ closeSettings(); return; }
    renderSettings(r||'agentpage');
  }
  upd();
  $('#avEditBack').addEventListener('click',avGoBack);
  $('#avEditSave').addEventListener('click',function(){
    if(d.mode==='preset'){
      var a=targetAgent();
      if(a){ a.preset=d.preset; a.avatar=''; if(a.id===mainAgentId){ agentPreset=d.preset; agentAvatar=''; syncMainGlobals(); } autoGenerateEmotes(a); }
      else { agentPreset=d.preset; agentAvatar=''; }
    } else if(d.mode==='custom'){
      applyCustomAvatar(d.shape,d.face,d.color,d.acc);
    }
    toast('Avatar saved — it stays animated in chat');
    avGoBack();
  });
  /* Shape / Face / Colour selector: the panel under it swaps to
     that full list. The stage arrows, swipes and crisp peeks
     slide through the preset mascots. */
  setView.querySelectorAll('[data-avattr]').forEach(function(b){ b.addEventListener('click',function(){ d.attr=b.getAttribute('data-avattr'); upd(); }); });
  $('#avStepPrev').addEventListener('click',function(){ stepPreset(-1); });
  $('#avStepNext').addEventListener('click',function(){ stepPreset(1); });
  $('#avPeekPrev').addEventListener('click',function(){ stepPreset(-1); });
  $('#avPeekNext').addEventListener('click',function(){ stepPreset(1); });
  swipeOn($('#avStage'), function(dir){ stepPreset(dir); });
  /* Chooser panel: one tap picks a shape, face or wear item —
     fast, no stepping. Delegated: upd() re-renders the panel. */
  var pkBox=$('#avPickWrap');
  if(pkBox) pkBox.addEventListener('click',function(e){ var b=e.target.closest('[data-avpick]'); if(!b) return; var kv=b.getAttribute('data-avpick').split(':'); pickAttr(kv[0], kv[1]); });
  /* Emotes down below: tapping one shows it in the big preview.
     Delegated — upd() re-renders the strip on every change. */
  var emBox=$('#avEmotes');
  if(emBox) emBox.addEventListener('click',function(e){ var b=e.target.closest('[data-avemote]'); if(!b) return; d.emote=b.getAttribute('data-avemote'); upd(); });
  /* Presets grid: tapping a preset shows it in the big preview at
     once (idle emote, so the character itself is what you judge);
     the top check saves it, like every other change on this page. */
  var pvBox=$('#avPresets');
  if(pvBox) pvBox.addEventListener('click',function(e){ var b=e.target.closest('[data-avpreset]'); if(!b) return; d.mode='preset'; d.preset=b.getAttribute('data-avpreset'); d.emote='idle'; upd(); });
  /* Colour: swatches and the rainbow hue bar (no native dialog).
     Picking a colour on a preset keeps the preset's shape, face
     and wear — only the colour changes. */
  $('#avHue').addEventListener('input',function(){ toCustom(); d.emote='idle'; d.color=hslToHex(+this.value, 72, 56); upd(); });
  setView.querySelectorAll('[data-avcol]').forEach(function(b){ b.addEventListener('click',function(){ pickAttr('colour', b.getAttribute('data-avcol')); }); });
  $('#avEditUpload').addEventListener('click',function(){ $('#agentAvatarPicker').click(); });
  $('#avCreateChat').addEventListener('click',function(){ var a=targetAgent(); openCreateAvatarInChat(a? a.id : chatAgentId); });
}

function openAvatarLibrary(){
  /* Presets & emotes are no longer a separate sheet — they live on
     the one combined Avatar page, so this opens that page. */
  avDraft=null;
  if(state.view==='settings') renderSettings('avataredit');
  else openSettings('avataredit');
}

var agentVibe='Sharp, warm, playful, a bit possessive, loyal. Roasts with love, matches his mood, stays clean and supportive in study, sad and crisis modes.';
var AGENT_TODAY=[];
var AGENT_APPROVALS=[];
var AGENT_REMINDERS=[];
var AGENT_DAILY=[];
function agCalIcon(){
  return '<svg width="50" height="50" viewBox="0 0 46 46" aria-hidden="true"><rect x="2" y="4" width="34" height="31" rx="7" fill="#f2f2f7"/><g fill="#b9b9c2"><circle cx="10" cy="13" r="1.6"/><circle cx="17" cy="13" r="1.6"/><circle cx="24" cy="13" r="1.6"/><circle cx="10" cy="20" r="1.6"/><circle cx="17" cy="20" r="1.6"/><circle cx="24" cy="20" r="1.6"/><circle cx="10" cy="27" r="1.6"/><circle cx="17" cy="27" r="1.6"/></g><circle cx="33" cy="32" r="9.5" fill="#f5a623"/><path d="M33 26.5V32l3.6 2.2" stroke="#fff" stroke-width="2.1" fill="none" stroke-linecap="round"/></svg>';
}
/* Renaming the agent renames the app too: everywhere the app name is
   shown (page title, About, the Library artefact, config/app.json)
   follows the agent name from the moment it is changed. */
var agentRenamed=false;
function appName(){ return agentRenamed? agentName : 'Gptopen'; }
function appNameShort(){ return agentRenamed? agentName : 'Gptopen'; }
function applyAgentName(){
  document.title=appName();
  syncSidebarAgent();
  var cfg=afFind('config/app.json');
  if(cfg) cfg.content=cfg.content.replace(/"app":\s*"[^"]*"/, '"app": "'+String(agentName).replace(/"/g,'')+'"');
}
/* =============== Agents hub & Sub-agents page ===============
   The Agent page is now the Agents hub: the main agent up top, the
   animation-speed control, a Sub-agents page (list, edit, create,
   set as main — everything for agents), and the full agents list.
   Tapping any agent row opens that agent's menu. */
function makeMainAgent(a){
  if(!a || a.id===mainAgentId) return false;
  mainAgentId=a.id; syncMainGlobals(); applyAgentName(); syncAgentFile(a);
  return true;
}
function createAgentRecord(name, instructions, preset){
  var colors=['#3d9bff','#ff8fb2','#32d74b','#ff9f0a','#5e5ce6','#64d2ff'];
  var shapes=['circle','star','blob','heart','flame','bell'];
  var faces=['open','smile','wink','chev','tongue','flat'];
  var ix=AGENTS.length;
  var presetOk=AVATAR_PRESETS.some(function(p){ return p.id===preset; });
  var a={id:'a'+(++uid), name:name, vibe:'', instructions:instructions||'', memoryText:'', preset:presetOk? preset : ['cue','dots','grok','claude','mia','muse','botthew','froggy','berry','sunny','hearty','mochi'][ix%12], avatar:'', shape:shapes[ix%shapes.length], face:faces[ix%faces.length], color:colors[ix%colors.length], acc:'none', individualHistory:false, individualMemory:false, privateMem:[], autoLearn:false};
  AGENTS.push(a); syncAgentFile(a); autoGenerateEmotes(a);
  return a;
}
function findAgentByName(q){
  q=String(q||'').trim().toLowerCase().replace(/[.!?]+$/,''); if(!q) return null;
  var exact=null, partial=null;
  AGENTS.forEach(function(a){ var n=a.name.toLowerCase(); if(n===q) exact=a; else if(!partial && (n.indexOf(q)===0 || n.indexOf(q)>-1)) partial=a; });
  return exact||partial;
}
/* Chat control for agents: "make Nova the main agent", "chat with
   Nova", "create agent Nova" — applied directly from chat, no
   Settings step needed. Runs inside sendText before any provider
   call, so it works with or without an API key. */
function agentsChatCommand(text){
  var t=String(text||'').trim(), m;
  m=t.match(/^(?:make|set)\s+(.+?)\s+(?:as\s+)?(?:the\s+)?main agent\.?$/i) || t.match(/^(?:make|set)\s+(.+?)\s+main\.?$/i);
  if(m){
    var a=findAgentByName(m[1]);
    if(!a) return 'I could not find an agent named "'+m[1].trim()+'". Your agents: '+AGENTS.map(function(x){ return x.name; }).join(', ')+'.';
    if(a.id===mainAgentId) return a.name+' is already the main agent.';
    makeMainAgent(a); renderAll();
    return 'Done — '+a.name+' is now the main agent. The main agent everywhere, including the app name, now follows '+a.name+'.';
  }
  m=t.match(/^(?:chat with|talk to|switch to)\s+(.+?)\.?$/i);
  if(m){
    var b=findAgentByName(m[1]);
    if(!b) return 'I could not find an agent named "'+m[1].trim()+'". Your agents: '+AGENTS.map(function(x){ return x.name; }).join(', ')+'.';
    setChatAgent(b.id); renderAll();
    return 'You are now chatting with '+b.name+'.'+(b.id===mainAgentId?' That is the main agent.':' Say "make '+b.name+' the main agent" any time to promote it.');
  }
  m=t.match(/^create (?:a )?(?:new )?agent(?:\s+named\s+|\s+called\s+|\s+)(.+?)\.?$/i);
  if(m){
    var nm=m[1].trim(); if(!nm) return null;
    if(findAgentByName(nm)) return 'There is already an agent named '+nm+'.';
    var na=createAgentRecord(nm,''); na.autoLearn=true;
    return 'Created a new agent: '+na.name+'. It will pick up memory and instructions from your chats — or set them now in Settings → Agents. Say "chat with '+na.name+'" to talk to it.';
  }
  return null;
}
/* A skipped-setup agent learns from the chat itself: durable facts
   land in its custom memory, and standing "always / never / your
   job is / focus on" lines land in its custom instructions. An
   explicit "remember ..." lands in any chat agent's memory. All of
   it is sanitised first — no credentials ever enter an agent file. */
function agentAutoLearn(text){
  var a=chatAgent(); if(!a || !text) return;
  var t=String(text).trim(), m, changed=false;
  function addMem(x){ x=agentTextSanitize(x).trim(); if(x.length<3) return; if((a.memoryText||'').indexOf(x)>-1) return; a.memoryText=((a.memoryText||'')+'\n- '+x).trim(); changed=true; }
  function addIns(x){ x=agentTextSanitize(x).trim(); if(x.length<3) return; if((a.instructions||'').indexOf(x)>-1) return; a.instructions=((a.instructions||'')+'\n- '+x).trim(); changed=true; }
  if(m=t.match(/^remember(?: that)?\s+(.+)/i)) addMem(m[1]);
  if(a.autoLearn){
    if(m=t.match(/(?:call me|my name is)\s+([A-Za-z][A-Za-z .]{1,24})/i)) addMem('User prefers to be called '+m[1].trim()+'.');
    if(m=t.match(/my favou?rite\s+([a-z ]{2,20}?)\s+is\s+([^.,\n]{2,40})/i)) addMem('Favourite '+m[1].trim()+': '+m[2].trim()+'.');
    if(m=t.match(/(?:i live in|i am from|i'm from)\s+([^.,\n]{2,40})/i)) addMem('Lives in / from '+m[1].trim()+'.');
    if(m=t.match(/(?:i (?:really )?(?:like|love|prefer))\s+([^.,\n]{2,48})/i)) addMem('Likes '+m[1].trim()+'.');
    if(/^(always|never|you should|please always|make sure)\b/i.test(t) && t.length<160) addIns(t);
    if(m=t.match(/your job is\s+(.{3,120})/i)) addIns('Job: '+m[1].trim());
    if(m=t.match(/focus on\s+(.{3,120})/i)) addIns('Focus on '+m[1].trim());
  }
  if(changed) syncAgentFile(a);
}
function agentRowHTML(a){
  var sub=(a.id===mainAgentId?'Main agent':'Sub-agent')+' · '+(a.individualHistory?'Own history':'Shared history')+' · '+(a.individualMemory?'Own memory':'Shared memory')+(a.autoLearn?' · Learning from chat':'');
  return '<div class="agent-list-row" data-agentrow="'+a.id+'" role="button" tabindex="0"><span class="mini-ava" style="width:46px;height:46px">'+avatarHTMLFor(a,'idle')+'</span><span style="flex:1;min-width:0"><span style="display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(a.name)+'</span><span style="display:block;color:var(--muted);font-size:13px;margin-top:2px">'+sub+'</span></span>'
    +(a.id===chatAgentId? '<span class="badge">Chatting</span>' : '')
    +(a.id===mainAgentId? '<span class="badge main">Main</span>' : '<button class="badge" data-setmain="'+a.id+'" style="cursor:pointer">Set as main</button>')
    +I.chevR+'</div>';
}
function wireAgentRows(){
  setView.querySelectorAll('[data-setmain]').forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); var a=agentById(b.getAttribute('data-setmain')); if(a && makeMainAgent(a)){ toast(a.name+' is now the main agent'); renderSettings(lastSetView||'agentpage'); } }); });
  setView.querySelectorAll('[data-agentrow]').forEach(function(r){ r.addEventListener('click',function(){ var a=agentById(r.getAttribute('data-agentrow')); if(a) openAgentMenu(a); }); });
}
function openAgentMenu(a){
  editingAgentId=a.id;
  var rows=[
    {icon:I.chat, label:'Chat with '+a.name, fn:function(){ setChatAgent(a.id); closeSettings(); toast('Chatting with '+a.name); }}
  ];
  if(a.id!==mainAgentId) rows.push({icon:I.spark, label:'Make main agent', fn:function(){ if(makeMainAgent(a)) toast(a.name+' is now the main agent'); renderSettings(lastSetView||'agentpage'); }});
  rows.push({icon:I.edit, label:'Edit — name, avatar, instructions, memory', fn:function(){ editingAgentId=a.id; agentEditReturn=null; renderSettings('agentedit'); }});
  rows.push({icon:I.userCircle, label:'Avatar — presets & change avatar', fn:function(){ avatarTargetAgentId=a.id; editingAgentId=a.id; avReturn='agentpage'; avDraft=null; renderSettings('avataredit'); }});
  if(AGENTS.length>1 && a.id!==mainAgentId) rows.push({icon:I.trash, label:'Delete agent', danger:true, fn:function(){ askDeleteAgent(a); }});
  afMenuSheet(a.name+(a.id===mainAgentId?' · Main agent':' · Sub-agent'), rows);
}
function askDeleteAgent(a){
  openSheet('<h3>Delete '+esc(a.name)+'</h3><p class="sub">This agent, its custom instructions and its own memory are removed. Shared chats and shared memory stay.</p><button class="btn-danger" id="agDelYes">Delete agent</button><button class="btn-ghost" id="agDelNo">Cancel</button>');
  $('#agDelNo').addEventListener('click',closeSheet);
  $('#agDelYes').addEventListener('click',function(){
    AGENTS=AGENTS.filter(function(x){ return x.id!==a.id; });
    chats=chats.filter(function(c){ return c.agentId!==a.id; });
    var f=afFind('agents/'+agentSlug(a.name)+'.md'); if(f) AGENT_FILES.splice(AGENT_FILES.indexOf(f),1);
    if(chatAgentId===a.id) chatAgentId=mainAgentId;
    if(state.currentId && !chatById(state.currentId)) state.currentId='main';
    closeSheet(); toast('Agent deleted'); renderSettings(lastSetView==='subagents'?'subagents':'agentpage');
  });
}
/* =============== Swipeable avatar picker ===============
   One big avatar at a time: swipe left / right to change to the
   other avatars, or tap the arrows and dots. Used by the Create
   agent sheet and the New sub-agent page. */
/* The swipe picker's slide list: the presets, with "Create your
   own avatar" as the SECOND slide — swipe once and it is there, in
   the same minimal clean preview UI as every other slide. */
function avatarPickerSlides(){
  var slides=AVATAR_PRESETS.slice();
  slides.splice(1,0,{id:'__create__', name:'Create your own avatar'});
  return slides;
}
function avatarPickerHTML(){
  var slides=avatarPickerSlides();
  return '<div class="avp" data-avp><div class="avp-track">'
    +slides.map(function(p){
      if(p.id==='__create__') return '<div class="avp-slide" data-avp-create><span class="avp-create-vis">'+I.spark+'<span class="avp-plus">'+I.plus+'</span></span><span class="avp-name">Create your own avatar</span><span class="avp-create-sub">Describe it in chat — the AI builds it, you confirm it</span><button type="button" class="avp-create-btn" data-avcreate>Create in chat</button></div>';
      return '<div class="avp-slide"><span class="av-prev">'+avatarSVG(p.id,'idle')+'</span><span class="avp-name">'+p.name+'</span></div>';
    }).join('')
    +'</div>'
    +'<button class="avp-arrow l" data-avp-prev aria-label="Previous avatar">'+I.back+'</button>'
    +'<button class="avp-arrow r" data-avp-next aria-label="Next avatar">'+I.chevR+'</button>'
    +'<div class="avp-dots">'+slides.map(function(p,i){ return '<button data-avp-dot="'+i+'" aria-label="Avatar '+escA(p.name)+'"></button>'; }).join('')+'</div>'
    +'<div class="avp-hint">Swipe left or right to change avatar</div></div>';
}
function wireAvatarPicker(root, state){
  var box=root.querySelector('[data-avp]'); if(!box) return;
  var track=box.querySelector('.avp-track');
  var slides=avatarPickerSlides();
  function idx(){ for(var i=0;i<slides.length;i++) if(slides[i].id===state.id) return i; return 0; }
  function show(){ track.style.transform='translateX(-'+(idx()*100)+'%)'; box.querySelectorAll('[data-avp-dot]').forEach(function(d,i){ d.classList.toggle('sel', i===idx()); }); }
  function step(d){ state.id=slides[(idx()+d+slides.length)%slides.length].id; show(); }
  box.querySelector('[data-avp-prev]').addEventListener('click',function(){ step(-1); });
  box.querySelector('[data-avp-next]').addEventListener('click',function(){ step(1); });
  box.querySelectorAll('[data-avp-dot]').forEach(function(d){ d.addEventListener('click',function(){ state.id=slides[+d.getAttribute('data-avp-dot')].id; show(); }); });
  var createBtn=box.querySelector('[data-avcreate]');
  if(createBtn) createBtn.addEventListener('click',function(e){ e.stopPropagation(); openCreateAvatarInChat(avatarTargetAgentId||chatAgentId); });
  var sx=null;
  function down(x){ sx=x; }
  function up(x){ if(sx===null) return; var dx=x-sx; sx=null; if(dx<=-40) step(1); else if(dx>=40) step(-1); }
  box.addEventListener('touchstart',function(e){ down(e.touches[0].clientX); },{passive:true});
  box.addEventListener('touchend',function(e){ up(e.changedTouches[0].clientX); });
  box.addEventListener('mousedown',function(e){ down(e.clientX); });
  box.addEventListener('mouseup',function(e){ up(e.clientX); });
  show();
}
/* =============== New-agent onboarding (in chat) ===============
   After Create, the new agent opens in chat and sets itself up by
   asking: it greets the user by name (asking for the user's name
   first only when it is not already known), asks what it should
   call itself, then asks about its memory, its instructions and
   its vibe — the answers are written into the agent as they come. */
function knownUserName(){
  var f=afFind('user/profile.md');
  if(f){ var m=f.content.match(/Display name:\s*(.+)/); if(m && m[1].trim()) return m[1].trim(); }
  return '';
}
/* The display name is ONE shared profile value, not a session
   throwaway: saving writes it into user/profile.md in Agents
   files — the profile every agent and chat reads — so the saved
   name applies to everyone at once, kept exactly as typed. */
function displayName(){
  return knownUserName()||'You';
}
function saveDisplayName(n){
  n=String(n||'').trim(); if(!n) return false;
  var f=afFind('user/profile.md');
  if(f){
    if(/Display name:\s*.*/.test(f.content)) f.content=f.content.replace(/Display name:\s*.*/, 'Display name: '+n);
    else f.content=f.content.replace(/^# Profile\s*/, '# Profile\n\n- Display name: '+n+'\n');
  } else {
    AGENT_FILES.push({path:'user/profile.md', content:'# Profile\n\n- Display name: '+n+'\n'});
  }
  return true;
}
function profileSheetHTML(){
  var n=displayName();
  return '<h3>Profile</h3>'
    +'<div class="profile-card" style="margin:6px 0 14px"><span class="avatar">'+esc(n.charAt(0).toUpperCase()||'Y')+'</span><span><b>'+esc(n)+'</b><span>Your profile — shared by every agent and chat</span></span></div>'
    +'<div class="field"><label>Display name</label><input id="pfName" type="text" value="'+escA(n)+'" autocomplete="off"></div>'
    +'<button class="btn-primary" id="pfSave">Save</button><button class="btn-ghost" id="pfCancel">Cancel</button>';
}
function wireProfileSave(){
  $('#pfSave').addEventListener('click',function(){
    if(!saveDisplayName($('#pfName').value)){ toast('Type a display name first'); return; }
    closeSheet(); toast('Display name saved');
    if(state.view==='settings') renderSettings('list');
  });
  $('#pfCancel').addEventListener('click',closeSheet);
}
function setKnownUserName(n){
  saveDisplayName(n);
}
function obQuestion(a, step){
  if(step==='username') return 'Before we start — what should I call you?';
  if(step==='name') return 'First things first: what should I call myself? You can keep \u201C'+a.name+'\u201D, or give me any name you like.';
  if(step==='memory') return 'Now my memory: what should I always remember — about you, your work, anything I should never forget? Or say \u201Cskip\u201D and I will pick it up from our chats instead.';
  if(step==='instructions') return 'And my instructions: how should I behave? Tell me my job, my tone, anything I should always or never do — or say \u201Cskip\u201D.';
  if(step==='vibe') return 'Last one: what vibe should I have — sharp and playful, calm and steady, short and direct? Or say \u201Cskip\u201D and I will find my own.';
  return '';
}
function startAgentOnboarding(a){
  a.autoLearn=true;
  var steps=[]; if(!knownUserName()) steps.push('username');
  steps.push('name','memory','instructions','vibe');
  a.onboarding={steps:steps, i:0};
  syncAgentFile(a);
  setChatAgent(a.id);
  if(state.view==='settings') closeSettings();
  var un=knownUserName();
  var greet='Hi'+(un?' '+un:'')+'! I\u2019m your new agent — fresh out of the box, with no name of my own yet, no memory and no instructions. Let\u2019s set me up right here: your answers become my name, my memory and my instructions.\n\n'+obQuestion(a, steps[0]);
  var chat=activeTargetChat(); if(chat) pushAI(chat, greet);
  toast('Chatting with '+a.name);
}
function agentOnboardingReply(text){
  var a=chatAgent(); if(!a || !a.onboarding) return null;
  var ob=a.onboarding, step=ob.steps[ob.i], t=String(text||'').trim();
  var skip=/^skip[.!]?$/i.test(t), ack='';
  function addMem(x){ x=agentTextSanitize(x).trim(); if(x.length<3) return; if((a.memoryText||'').indexOf(x)>-1) return; a.memoryText=((a.memoryText||'')+'\n- '+x).trim(); }
  function addIns(x){ x=agentTextSanitize(x).trim(); if(x.length<3) return; if((a.instructions||'').indexOf(x)>-1) return; a.instructions=((a.instructions||'')+'\n- '+x).trim(); }
  if(skip){ ack='Skipped — no problem.'; }
  else if(step==='username'){
    var un=t.replace(/[.!]+$/,'').slice(0,40); if(un){ setKnownUserName(un); addMem('User prefers to be called '+un+'.'); ack='Nice to meet you, '+un+'.'; }
  }
  else if(step==='name'){
    var nn=t.replace(/^(call yourself|your name is|name is|name:?)\s+/i,'').replace(/[.!]+$/,'').trim().slice(0,40);
    if(nn){ var oldPath='agents/'+agentSlug(a.name)+'.md'; a.name=nn; var np='agents/'+agentSlug(nn)+'.md'; if(oldPath!==np){ var of=afFind(oldPath); if(of) AGENT_FILES.splice(AGENT_FILES.indexOf(of),1); } if(a.id===mainAgentId){ syncMainGlobals(); applyAgentName(); } ack='Love it — '+a.name+' it is.'; }
  }
  else if(step==='memory'){ t.split(/\n+/).forEach(addMem); ack='Saved to my memory.'; }
  else if(step==='instructions'){ t.split(/\n+/).forEach(addIns); ack='Saved to my instructions.'; }
  else if(step==='vibe'){ a.vibe=agentTextSanitize(t); ack='Got it — that is my vibe now.'; }
  syncAgentFile(a);
  ob.i++;
  if(ob.i>=ob.steps.length){
    a.onboarding=null; syncAgentFile(a);
    return 'All set — I\u2019m '+a.name+' now.'
      +(a.vibe? '\nVibe: '+a.vibe : '')
      +(a.memoryText? '\nMemory so far:\n'+a.memoryText : '\nMemory: nothing fixed yet — I will learn it from our chats.')
      +(a.instructions? '\nInstructions:\n'+a.instructions : '\nInstructions: none fixed yet — add them any time in my Edit page.')
      +'\n\nYou can change all of this later in Settings \u2192 Agents \u2192 Sub-agents \u2192 my Edit page. So — what are we doing first?';
  }
  return (ack? ack+'\n\n' : '')+obQuestion(a, ob.steps[ob.i]);
}
function createAgentSheet(){
  var pick={id:'cue'};
  openSheet('<h3>Create agent</h3>'
    +'<div class="field"><label>Name</label><input id="naName" type="text" placeholder="e.g. Nova" autocomplete="off"></div>'
    +'<div class="field"><label>Avatar</label>'+avatarPickerHTML()+'</div>'
    +'<button class="btn-primary" id="naGo">Create agent</button>'
    +'<button class="btn-ghost" id="naSkip">Skip — just chat</button>'
    +'<p class="sub" style="margin-top:10px">No memory or instruction fields here any more — tap Create and the agent opens in chat, greets you, and asks for its name, memory and instructions there. Skip starts a plain chat instead, and the agent learns as you go.</p>');
  wireAvatarPicker(sheet, pick);
  $('#naGo').addEventListener('click',function(){
    var nm=$('#naName').value.trim(); if(!nm){ toast('Give the agent a name first — or tap Skip'); return; }
    if(findAgentByName(nm)){ toast('That name is taken'); return; }
    var a=createAgentRecord(nm, '', pick.id);
    syncAgentFile(a);
    closeSheet();
    startAgentOnboarding(a);
  });
  $('#naSkip').addEventListener('click',function(){
    var nm=$('#naName').value.trim() || ('Agent '+(AGENTS.length+1));
    if(findAgentByName(nm)) nm=nm+' '+(AGENTS.length+1);
    var a=createAgentRecord(nm,'',pick.id); a.autoLearn=true;
    syncAgentFile(a);
    closeSheet(); setChatAgent(a.id); closeSettings();
    toast('Chatting with '+a.name+' — it learns memory & instructions from your chat');
  });
  setTimeout(function(){ var ni=$('#naName'); if(ni) ni.focus(); },80);
}
/* The side menu's top-right button is a + for creating new agents. */
function sbCreateAgent(){ setSidebar(false,true); openSettings('agentcreate'); }
/* =============== Agent page (restored) ===============
   The old single Agent page is back as the Agents landing page:
   centred avatar with a pencil badge (Change avatar / Edit name),
   the main agent's name, a live status line, and the pill tab bar
   (Today · Approvals · Reminders + Daily · Profile). The multi-agent
   hub that used to sit here now lives under it as the Sub-agents
   page, and creating a sub-agent has its own page too. */
var agentTab='today';
function agOpenFile(path){
  var f=afFind(path); if(!f){ toast('That file is not in Agents files'); return; }
  afReturnTo='agents'; agentFilePath=path; agentEditing=false; renderSettings('agentfile');
}
function agStatusLine(){
  if(!state.apiKey) return 'Add an API key to chat live — everything else is ready';
  if(state.apiHealth==='quota') return 'Quota reached on the current key';
  if(state.apiHealth==='error') return 'The current key is not working — check APIs & Providers';
  if(state.apiHealth==='changed') return 'Key changed — send a message to check it';
  return 'Online — ready when you are';
}
/* =============== One agent's own page (from tapping the top agent) ===============
   A profile page for the tapped agent — main or sub-agent alike:
   its avatar, name, status, vibe and what it keeps, plus Chat /
   Edit / Make-main actions. It is NOT the editing page: no form
   fields live here; Edit is a separate row that opens the editor
   and comes back here. Opened from the chat's top agent, so Back
   leaves Settings entirely and lands back on the chat. */
function settingsAgentProfile(){
  var a=agentById(profileAgentId)||chatAgent(); profileAgentId=a.id; editingAgentId=a.id;
  var isMain=a.id===mainAgentId, isChat=a.id===chatAgentId;
  setView.innerHTML=setHead('Agent','agent')+'<div class="set-scroll"><div class="set-inner agent-flow">'
    +'<div style="--i:0"><div class="ag-avatar-wrap"><button class="ag-avatar" data-avtap="'+a.id+'" aria-label="Change avatar for '+escA(a.name)+'"><span class="agent-ava-slot">'+avatarHTMLFor(a,'idle')+'</span></button><button class="ag-pencil" id="apPencil" aria-label="Edit '+escA(a.name)+'">'+I.edit+'</button></div>'
    +'<div class="ag-name">'+esc(a.name)+'</div>'
    +'<p class="ag-status">'+esc(agStatusLine())+'</p>'
    +'<div style="text-align:center;margin:-8px 0 18px"><span class="badge'+(isMain?' main':'')+'">'+(isMain?'Main agent':'Sub-agent')+'</span>'+(isChat? '<span class="badge" style="margin-left:6px">Chatting now</span>' : '')+'</div></div>'
    +'<div class="set-group" style="--i:1">'
    +(isChat? '' : '<button class="set-row" id="apChat"><span class="ric">'+I.chat+'</span><span style="flex:1">Chat with '+esc(a.name)+'</span>'+I.chevR+'</button>')
    +'<button class="set-row" id="apEdit"><span class="ric">'+I.edit+'</span><span style="flex:1">Edit agent<span class="sub2">Name, vibe, instructions & memory</span></span>'+I.chevR+'</button>'
    +(isMain? '' : '<button class="set-row" id="apMakeMain"><span class="ric">'+I.spark+'</span><span style="flex:1">Make main agent</span>'+I.chevR+'</button>')
    +'</div>'
    +'<div style="--i:2"><p class="ag-vibe-label">VIBE</p>'
    +'<p class="ag-vibe-text">'+esc(a.vibe? a.vibe : (isMain? agentVibe : 'No vibe set yet — add one from Edit agent.'))+'</p>'
    +(a.instructions? '<p class="ag-vibe-label">INSTRUCTIONS</p><p class="ag-vibe-text">'+esc(a.instructions)+'</p>' : '')
    +(a.memoryText? '<p class="ag-vibe-label">MEMORY</p><p class="ag-vibe-text">'+esc(a.memoryText)+'</p>' : '')
    +'<p class="set-note">'+(a.individualHistory? 'Keeps its own chats.' : 'Shares chats with all agents.')+' '+(a.individualMemory? 'Keeps its own memory.' : 'Shares memory with all agents.')+'</p></div>'
    +'</div></div>';
  /* Back goes back to the chat — this page was opened from the
     chat's top agent, not from Settings or anywhere else. */
  wireBack(function(){ closeSettings(); });
  function goEdit(){ agentEditReturn='agentprofile'; renderSettings('agentedit'); }
  var pe=$('#apPencil'); if(pe) pe.addEventListener('click',goEdit);
  $('#apEdit').addEventListener('click',goEdit);
  var ch=$('#apChat'); if(ch) ch.addEventListener('click',function(){ setChatAgent(a.id); closeSettings(); toast('Chatting with '+a.name); });
  var mm=$('#apMakeMain'); if(mm) mm.addEventListener('click',function(){ if(makeMainAgent(a)){ toast(a.name+' is now the main agent'); renderSettings('agentprofile'); } });
}
function settingsAgent(){
  syncMainGlobals();
  var m=mainAgent(), ca=chatAgent();
  var subs=AGENTS.filter(function(a){ return a.id!==mainAgentId; });
  var tabs=[['today',I.list2,'Today'],['approvals',I.shield,'Approvals'],['reminders',I.clock,'Reminders'],['profile',I.fingerprint,'Profile']];
  /* TAB FIX: the header (avatar, name, status), the Sub-agents
     group and the tab bar are built ONCE. Switching a tab only
     swaps the HTML inside #agTabBody below them and moves the
     selected pill — the rest of the page is never rebuilt, so
     there is no full-page refresh, no scroll jump and no replay
     of the entrance animation when an option changes. */
  function tabBodyHTML(){
    var body='';
    if(agentTab==='today'){
      body='<div class="ag-sec">Today</div>'+(AGENT_TODAY.length? AGENT_TODAY.map(function(r){
        return '<div class="ag-row"><span class="ag-ic">'+(r.spin? '<span class="ag-spin"></span>' : I.spark)+'</span><span class="ag-row-main"><span class="ag-row-t">'+esc(r.t)+'</span><span class="ag-row-d">'+esc(r.d)+'</span></span><span class="ag-row-time">'+esc(r.time)+'</span></div>';
      }).join('') : '<p class="set-note">Nothing here yet.</p>');
    } else if(agentTab==='approvals'){
      body='<div class="ag-sec">Approvals history</div>'+(AGENT_APPROVALS.length? AGENT_APPROVALS.map(function(r){
        var icn=r.icon==='grid'? I.grid : I.globe;
        return '<div class="ag-row"><span class="ag-ic">'+icn+'</span><span class="ag-row-main"><span class="ag-row-t">'+esc(r.t)+'</span><span class="ag-row-d">'+esc(r.d)+'</span><span class="ag-row-time">'+esc(r.meta)+'</span></span></div>';
      }).join('') : '<p class="set-note">Nothing here yet.</p>');
    } else if(agentTab==='reminders'){
      body='<div class="ag-sec">Reminders</div>'+(AGENT_REMINDERS.length? AGENT_REMINDERS.map(function(r){
        return '<div class="ag-row"><span>'+agCalIcon()+'</span><span class="ag-row-main"><span class="ag-row-t">'+esc(r.t)+'</span><span class="ag-row-time">'+esc(r.d1)+' · '+esc(r.d2)+'</span></span><span class="ag-bell">'+I.bell+'</span></div>';
      }).join('') : '<p class="set-note">No reminders yet.</p>')
      +'<div class="ag-sec2">Daily</div>'+(AGENT_DAILY.length? AGENT_DAILY.map(function(r){
        return '<div class="ag-row"><span class="ag-tile">'+I.clock+'</span><span class="ag-row-main"><span class="ag-row-t">'+esc(r.t)+'</span></span><span class="ag-row-time">'+esc(r.time)+'</span></div>';
      }).join('') : '<p class="set-note">Nothing here yet.</p>');
    } else {
      body='<div class="ag-vibe-name">'+esc(m.name)+'</div>'
        +'<p class="ag-vibe-muted">Your main agent in Gptopen.</p>'
        +'<p class="ag-vibe-label">VIBE</p>'
        +'<p class="ag-vibe-text">'+esc(m.vibe||agentVibe)+'</p>'
        +'<button class="ag-editbtn" id="agEditProfile">'+I.edit+'<span>Edit agent — name, instructions & memory</span></button>'
        +'<div class="ag-cards">'
        +'<button class="ag-card soul" id="agCardSoul"><span class="ct">SOUL</span><span class="cs">SOUL.MD</span><span class="cic">'+I.fingerprint+'</span></button>'
        +'<button class="ag-card mem" id="agCardMem"><span class="ct">MEMORY</span><span class="cs">MEMORY.MD</span><span class="cic">'+I.bookmark+'</span></button>'
        +'</div>';
    }
    return body;
  }
  function wireTabBody(){
    var ep=$('#agEditProfile'); if(ep) ep.addEventListener('click',function(){ editingAgentId=m.id; agentEditReturn=null; renderSettings('agentedit'); });
    var cs=$('#agCardSoul'); if(cs) cs.addEventListener('click',function(){ agOpenFile('SOUL.md'); });
    var cme=$('#agCardMem'); if(cme) cme.addEventListener('click',function(){ libReturn='agentpage'; renderSettings('memorylib'); });
  }
  setView.innerHTML=setHead('Agent','agent')+'<div class="set-scroll"><div class="set-inner agent-flow">'
    +'<div style="--i:0"><div class="ag-avatar-wrap"><button class="ag-avatar" data-avtap="'+m.id+'" aria-label="Change avatar for '+escA(m.name)+'"><span class="agent-ava-slot">'+avatarHTMLFor(m,'idle')+'</span></button><button class="ag-pencil" id="agPencil" aria-label="Avatar and name options">'+I.edit+'</button></div>'
    +'<div class="ag-name">'+esc(m.name)+'</div>'
    +'<p class="ag-status">'+esc(agStatusLine())+'</p></div>'
    +'<div class="ag-tabbar" style="--i:1" role="tablist">'+tabs.map(function(t){ return '<button class="ag-tab'+(agentTab===t[0]?' sel':'')+'" data-agtab="'+t[0]+'" role="tab" aria-label="'+t[2]+'">'+t[1]+'</button>'; }).join('')+'</div>'
    +'<div class="set-group" style="--i:2"><button class="set-row" id="agSubBtn"><span class="ric">'+I.layers+'</span><span style="flex:1">Sub-agents<span class="sub2">All agents, animation speed, set the main agent</span></span><span class="val">'+subs.length+' sub</span>'+I.chevR+'</button>'
    +'<button class="set-row" id="agCreateBtn"><span class="ric">'+I.plus+'</span><span style="flex:1">New sub-agent<span class="sub2">Name & swipe-picked avatar — then it sets itself up with you in chat</span></span>'+I.chevR+'</button>'
    +(ca.id!==m.id? '<button class="set-row" id="agChatMain"><span class="ric">'+I.chat+'</span><span style="flex:1">Chat with '+esc(m.name)+'<span class="sub2">You are chatting with '+esc(ca.name)+' right now</span></span>'+I.chevR+'</button>' : '')
    +'</div>'
    +'<div id="agTabBody" style="--i:3">'+tabBodyHTML()+'</div>'
    +'</div></div>';
  wireBack(function(){ renderSettings('list'); });
  setView.querySelectorAll('[data-agtab]').forEach(function(b){ b.addEventListener('click',function(){
    var nt=b.getAttribute('data-agtab');
    if(nt===agentTab) return;
    agentTab=nt;
    /* Only the changing data below swaps — header and tabs stay
       exactly as they are, untouched in the DOM. */
    setView.querySelectorAll('[data-agtab]').forEach(function(x){ x.classList.toggle('sel', x.getAttribute('data-agtab')===agentTab); });
    var tb=$('#agTabBody'); if(tb){ tb.innerHTML=tabBodyHTML(); wireTabBody(); }
  }); });
  $('#agPencil').addEventListener('click',function(){
    afMenuSheet(m.name, [
      {icon:I.userCircle, label:'Avatar — presets & change avatar', fn:function(){ avatarTargetAgentId=m.id; editingAgentId=m.id; avReturn='agentpage'; avDraft=null; renderSettings('avataredit'); }},
      {icon:I.edit, label:'Edit name', fn:function(){
        openSheet('<h3>Agent name</h3><div class="field"><label>Name</label><input id="agNameIn" type="text" value="'+escA(m.name)+'" autocomplete="off"></div><button class="btn-primary" id="agNameSave">Save</button><button class="btn-ghost" id="agNameCancel">Cancel</button>');
        $('#agNameCancel').addEventListener('click',closeSheet);
        $('#agNameSave').addEventListener('click',function(){
          var n=$('#agNameIn').value.trim(); if(!n){ toast('Give the agent a name first'); return; }
          m.name=n; syncMainGlobals(); applyAgentName(); syncAgentFile(m);
          closeSheet(); toast('Name saved'); renderSettings('agentpage');
        });
        setTimeout(function(){ var ni=$('#agNameIn'); if(ni) ni.focus(); },80);
      }},
    ]);
  });
  $('#agSubBtn').addEventListener('click',function(){ renderSettings('subagents'); });
  $('#agCreateBtn').addEventListener('click',function(){ renderSettings('agentcreate'); });
  var cm=$('#agChatMain'); if(cm) cm.addEventListener('click',function(){ setChatAgent(m.id); closeSettings(); toast('Chatting with '+m.name); });
  wireTabBody();
}
/* The multi-agent hub, moved under the Agent page as the Sub-agents
   page: main agent card, animation speed with live preview, and the
   full agents list — list, edit, create and set as main. */
function settingsAgentHub(asSub){
  syncMainGlobals();
  var m=mainAgent(), ca=chatAgent();
  var subs=AGENTS.filter(function(a){ return a.id!==mainAgentId; });
  setView.innerHTML=setHead(asSub?'Sub-agents':'Agents','agents')+'<div class="set-scroll"><div class="set-inner agent-flow">'
    +'<div class="set-group" style="--i:0;padding:20px 16px 16px;text-align:center">'
    +'<span class="mini-ava" data-avtap="'+m.id+'" role="button" aria-label="Change main agent avatar" style="width:96px;height:96px;margin:0 auto;cursor:pointer">'+avatarHTMLFor(m,'idle')+'</span>'
    +'<div style="font-size:24px;font-weight:700;margin-top:12px">'+esc(m.name)+'</div>'
    +'<div style="margin-top:7px"><span class="badge main">Main agent</span>'+(ca.id!==m.id? '<span class="badge" style="margin-left:6px">Chatting with '+esc(ca.name)+'</span>' : '')+'</div>'
    +'<p class="set-note" style="margin:10px 0 14px">Tap the avatar to change it.</p>'
    +'<button class="btn-primary" id="hubChatMain">Chat with '+esc(m.name)+'</button>'
    +'<button class="btn-ghost" id="hubEditMain">Edit '+esc(m.name)+'</button>'
    +'</div>'
    +'<div class="set-group" style="--i:1;padding:16px">'
    +'<div style="display:flex;align-items:center;gap:10px"><b style="flex:1;font-size:15.5px">Animation speed</b><span id="agSpeedVal" style="color:var(--muted);font-size:13.5px">'+agentsSpeedLabel()+'</span></div>'
    +'<input type="range" class="speed-range" id="agSpeed" min="40" max="220" step="5" value="'+Math.round(agentsAnimSpeed*100)+'">'
    +'<div style="display:flex;justify-content:space-between;color:var(--muted);font-size:12.5px"><span>Slow</span><span>Fast</span></div>'
    +'<div class="speed-track"><span class="speed-dot"></span></div>'
    +'<div style="display:flex;align-items:center;gap:10px;margin-top:12px"><span class="mini-ava" style="width:40px;height:40px">'+avatarHTMLFor(m,'idle')+'</span><span style="color:var(--muted);font-size:13.5px;line-height:1.4">Live preview — drag the slider slowly and the motion changes as you drag.</span></div>'
    +'</div>'
    +(asSub? '' : '<div class="set-group" style="--i:2"><button class="set-row" id="hubSubBtn"><span class="ric">'+I.layers+'</span><span style="flex:1">Sub-agents<span class="sub2">List, edit, create and set the main agent</span></span><span class="val">'+subs.length+'</span>'+I.chevR+'</button></div>')
    +'<div class="sec-head-row" style="--i:3"><b>All agents</b><button class="add-round" id="hubCreate" aria-label="Create agent">'+I.plus+'</button></div>'
    +'<div class="set-group" style="--i:4">'+AGENTS.map(agentRowHTML).join('')+'</div>'
    +'<p class="set-note" style="--i:5">Tap any agent for its menu: chat, make main, edit its name, avatar, instructions and memory. History and memory are shared by all agents by default — turn on individual history or memory for one agent in its Edit page. Or just say it in chat: "make Nova the main agent", "chat with Nova", or "create agent Nova".</p>'
    +'</div></div>';
  wireBack(function(){ renderSettings(asSub?'agentpage':'list'); });
  $('#hubChatMain').addEventListener('click',function(){ setChatAgent(m.id); closeSettings(); toast('Chatting with '+m.name); });
  $('#hubEditMain').addEventListener('click',function(){ editingAgentId=m.id; agentEditReturn=null; renderSettings('agentedit'); });
  var hsb=$('#hubSubBtn'); if(hsb) hsb.addEventListener('click',function(){ renderSettings('subagents'); });
  $('#hubCreate').addEventListener('click',createAgentSheet);
  var sp=$('#agSpeed'); if(sp) sp.addEventListener('input',function(){ setAgentsAnimSpeed(+this.value/100); });
  wireAgentRows();
}
function settingsSubAgents(){
  /* The old Agents hub lives here now, under the Agent page. */
  settingsAgentHub(true);
}
/* =============== New sub-agent page (under Agents) ===============
   A full page for creating a sub-agent: name and a swipeable avatar
   picker only — no memory or instruction fields. Create opens the
   new agent in chat, where it greets the user and asks for its
   name, memory and instructions; Skip starts a plain chat and the
   agent auto-fills those from the conversation. */
function settingsAgentCreate(){
  /* New sub-agent as ONE small window, not a full messy page: a
     centred card holding only the Name field, the swipe avatar
     picker, Create and Skip. The how-it-works detail lives behind
     the ? in the window's title bar — no long text under the buttons.
     Typing fix: NO programmatic auto-focus any more. Focusing from
     a timer left the field "focused" with no keyboard on phone
     webviews, so later taps did nothing; the user's own tap now
     focuses it, and the field keeps its pointer events away from
     every global gesture handler. */
  var pick={id:'cue'};
  setView.innerHTML=setHead('New sub-agent', null)+'<div class="set-scroll"><div class="set-inner">'
    +'<div class="nc-window">'
    +'<div class="nc-win-head"><span class="nc-win-title">New sub-agent</span><button class="qbtn" id="ncHelp" aria-label="How creating a sub-agent works">?</button></div>'
    +'<div class="field"><label for="ncName">Name</label><input id="ncName" type="text" placeholder="e.g. Nova" autocomplete="off" enterkeyhint="done"></div>'
    +'<div class="field" style="margin-bottom:14px"><label>Avatar</label>'+avatarPickerHTML()+'</div>'
    +'<button class="btn-primary" id="ncGo">Create sub-agent</button>'
    +'<button class="btn-ghost" id="ncSkip">Skip — just chat</button>'
    +'</div>'
    +'</div></div>';
  wireBack(function(){ renderSettings('subagents'); });
  wireAvatarPicker(setView, pick);
  var ni=$('#ncName');
  if(ni){
    ni.addEventListener('pointerdown',function(e){ e.stopPropagation(); });
    ni.addEventListener('touchstart',function(e){ e.stopPropagation(); },{passive:true});
    ni.addEventListener('click',function(){ if(document.activeElement!==ni) ni.focus(); });
  }
  $('#ncHelp').addEventListener('click',function(){
    detailSheet('New sub-agent', [
      'Tap Create and the agent opens in chat: it greets you by name, asks what it should call itself, then asks about its memory and instructions — your answers fill those in.',
      'Skip starts a plain chat instead, and the agent learns as you go.',
      'Either way, everything stays editable later in its Edit page, under Sub-agents.'
    ]);
  });
  $('#ncGo').addEventListener('click',function(){
    var nm=$('#ncName').value.trim(); if(!nm){ toast('Give the agent a name first — or tap Skip'); if(ni) ni.focus(); return; }
    if(findAgentByName(nm)){ toast('That name is taken'); return; }
    var a=createAgentRecord(nm, '', pick.id);
    syncAgentFile(a);
    startAgentOnboarding(a);
  });
  $('#ncSkip').addEventListener('click',function(){
    var nm=$('#ncName').value.trim() || ('Agent '+(AGENTS.length+1));
    if(findAgentByName(nm)) nm=nm+' '+(AGENTS.length+1);
    var a=createAgentRecord(nm,'',pick.id); a.autoLearn=true;
    syncAgentFile(a);
    setChatAgent(a.id); closeSettings();
    toast('Chatting with '+a.name+' — it learns memory & instructions from your chat');
  });
}
function settingsAgentEdit(){
  var a=agentById(editingAgentId)||mainAgent(); editingAgentId=a.id;
  var isMain=a.id===mainAgentId;
  setView.innerHTML=setHead(a.name,'agents')+'<div class="set-scroll"><div class="set-inner agent-flow">'
    +'<div style="--i:0;text-align:center;padding:6px 0 2px"><span class="mini-ava" data-avtap="'+a.id+'" role="button" aria-label="Change avatar" style="width:92px;height:92px;margin:0 auto;cursor:pointer">'+avatarHTMLFor(a,'idle')+'</span>'
    +'<div style="margin-top:9px">'+(isMain? '<span class="badge main">Main agent</span>' : '<span class="badge">Sub-agent</span>')+(a.autoLearn? ' <span class="badge">Learning from chat</span>' : '')+'</div></div>'
    +'<div style="--i:1">'
    +'<div class="field"><label>Name</label><input id="aeName" type="text" value="'+escA(a.name)+'"></div>'
    +'<div class="field"><label>Vibe</label><textarea id="aeVibe" rows="2" style="'+TA_STYLE+'">'+esc(a.vibe||'')+'</textarea></div>'
    +'</div>'
    +'<div class="set-group" style="--i:2">'
    +'<button class="set-row" id="aeAvEdit"><span class="ric">'+I.userCircle+'</span><span style="flex:1">Avatar<span class="sub2">Presets & change avatar in one — face, shape, colour, emotes or a photo</span></span>'+I.chevR+'</button>'
    +'</div>'
    +'<div style="--i:3"><div class="field"><label>Custom instructions</label><textarea id="aeIns" rows="5" style="'+TA_STYLE+'" placeholder="How this agent should behave, its job, its rules">'+esc(a.instructions||'')+'</textarea></div>'
    +'<div class="field"><label>Custom memory</label><textarea id="aeMem" rows="5" style="'+TA_STYLE+'" placeholder="What this agent should always remember">'+esc(a.memoryText||'')+'</textarea></div>'
    +'<p class="set-note">Instructions and memory are this agent\u2019s own. They are sent with its chats and kept in its agent file. Passwords, keys, secrets, emails and phone numbers are stripped automatically — they never belong in a file.</p></div>'
    +'<div class="set-group" style="--i:4">'
    +'<button class="set-row" id="aeHist"><span style="flex:1">Individual history<span class="sub2">Off: chats are shared with all agents (default). On: this agent keeps its own chats.</span></span><span class="switch" role="switch" aria-checked="'+a.individualHistory+'"></span></button>'
    +'<button class="set-row" id="aeMemTog"><span style="flex:1">Individual memory<span class="sub2">Off: memory is shared with all agents (default). On: this agent keeps its own memory.</span></span><span class="switch" role="switch" aria-checked="'+a.individualMemory+'"></span></button>'
    +'</div>'
    +'<div style="--i:5"><button class="btn-primary" id="aeSave">Save</button>'
    +'<button class="btn-ghost" id="aeChat">Chat with '+esc(a.name)+'</button>'
    +(isMain? '' : '<button class="btn-ghost" id="aeMakeMain">Make main agent</button>')
    +'<button class="btn-ghost" id="aeFile">Open agent file</button>'
    +(!isMain && AGENTS.length>1? '<button class="btn-ghost" id="aeDelete" style="color:var(--danger)">Delete agent</button>' : '')
    +'</div>'
    +'</div></div>';
  wireBack(function(){ if(agentEditReturn){ renderSettings(agentEditReturn); return; } renderSettings(lastSetView==='subagents'?'subagents':'agentpage'); });
  function capture(){
    var n=$('#aeName'); if(n && n.value.trim()) a.name=n.value.trim();
    var v=$('#aeVibe'); if(v) a.vibe=v.value.trim();
    var i2=$('#aeIns'); if(i2) a.instructions=agentTextSanitize(i2.value.trim());
    var m2=$('#aeMem'); if(m2) a.memoryText=agentTextSanitize(m2.value.trim());
  }
  $('#aeSave').addEventListener('click',function(){
    capture();
    if(isMain) syncMainGlobals(); else syncAgentFile(a);
    if(isMain){ applyAgentName(); syncAgentFile(a); }
    toast('Saved'); renderSettings('agentedit'); renderAll();
  });
  $('#aeChat').addEventListener('click',function(){ capture(); setChatAgent(a.id); closeSettings(); toast('Chatting with '+a.name); });
  var mm=$('#aeMakeMain'); if(mm) mm.addEventListener('click',function(){ capture(); if(makeMainAgent(a)) toast(a.name+' is now the main agent'); renderSettings('agentedit'); });
  $('#aeFile').addEventListener('click',function(){ capture(); syncAgentFile(a); agentPath='agents'; agentFilePath='agents/'+agentSlug(a.name)+'.md'; agentEditing=false; renderSettings('agentfile'); });
  var del=$('#aeDelete'); if(del) del.addEventListener('click',function(){ askDeleteAgent(a); });
  $('#aeAvEdit').addEventListener('click',function(){ capture(); avatarTargetAgentId=a.id; avReturn='agentedit'; avDraft=null; renderSettings('avataredit'); });
  $('#aeHist').addEventListener('click',function(){ capture(); a.individualHistory=!a.individualHistory; if(a.individualHistory) ensureAgentChat(a); syncAgentFile(a); renderSettings('agentedit'); toast(a.individualHistory? a.name+' now keeps its own chats' : a.name+' now shares chats'); });
  $('#aeMemTog').addEventListener('click',function(){ capture(); a.individualMemory=!a.individualMemory; syncAgentFile(a); renderSettings('agentedit'); toast(a.individualMemory? a.name+' now keeps its own memory' : a.name+' now shares memory'); });
}

$('#agentAvatarPicker').addEventListener('change',function(){
  var f=this.files && this.files[0]; this.value='';
  if(!f) return;
  var rd=new FileReader();
  rd.onload=function(){ var url=String(rd.result||''); var a=targetAgent(); if(a){ a.avatar=url; if(a.id===mainAgentId) agentAvatar=url; autoGenerateEmotes(a); } else agentAvatar=url; avDraft=null; renderSettings((avReturn==='agentedit'||avReturn==='subagents'||avReturn==='agentprofile')? avReturn : 'agentpage'); toast('Avatar updated — animated in chat'); };
  rd.readAsDataURL(f);
});
var agentsShowAll=false, agentsFromLib=false;
function settingsAgents(){
  agentEditing=false; afReturnTo='agents';
  /* All-files mode (opened from Library → System files): every agent
     file is listed flat in one list, full paths shown — not just the
     current folder's children. */
  var showAll=agentsShowAll;
  var ch= showAll
    ? {folders:[], files:AGENT_FILES.slice().sort(function(a,b){ return a.path.localeCompare(b.path); })}
    : afChildren(agentPath);
  var head='<div class="set-head"><button class="circle-btn" id="setBack" aria-label="Back">'+I.back+'</button><h2>Agents files</h2><button class="af-head-btn" id="afMenuBtn" aria-label="Upload and create">'+I.dotsH+'</button></div>';
  var rows=ch.folders.map(function(f){
    return '<div class="af-row" data-affolder="'+escA(f)+'" role="button" tabindex="0"><span class="af-tile folder">'+I.folder+'</span><span class="af-meta"><span class="af-name">'+esc(afBase(f))+'</span><span class="af-sub">Folder</span></span><button class="af-dots" data-affolderdots="'+escA(f)+'" aria-label="Folder options">'+I.dotsV+'</button><span style="color:var(--muted)">'+I.chevR+'</span></div>';
  }).join('') + ch.files.map(function(f){
    return '<div class="af-row" data-affile="'+escA(f.path)+'" role="button" tabindex="0"><span class="af-tile">'+I.file+'<span class="ext">'+esc(afExt(afBase(f.path)))+'</span></span><span class="af-meta"><span class="af-name">'+esc(showAll? f.path : afBase(f.path))+'</span><span class="af-sub">'+esc(afExt(afBase(f.path)))+' · '+esc(fmtSize(afSizeOf(f)))+'</span></span><button class="af-dots" data-afdots="'+escA(f.path)+'" aria-label="File options">'+I.dotsV+'</button></div>';
  }).join('');
  setView.innerHTML=head+'<div class="set-scroll"><div class="set-inner">'
    +'<p class="af-path">System files'+(showAll? ' / All files' : (agentPath? ' / '+esc(agentPath.replace(/\//g,' / ')) : ''))+'</p>'
    +'<div class="af-sortrow"><b>Name</b><button class="af-sortbtn" id="afSortBtn">'+I.sliders+'<span>'+(agentSort==='name'?'A–Z':'Size')+'</span></button></div>'
    +'<p class="set-note" style="margin:0 4px 12px">Auto-update is always on — the agent writes and updates these files as it learns.</p>'
    +(rows? '<div class="set-group">'+rows+'</div>' : '<p class="set-note">This folder is empty. Use the dots menu to upload a file or create one here.</p>')
    +'<p class="set-note">'+AGENT_FILES.length+' files · '+AGENT_FOLDERS.length+' folders · tap a file to view it, tap Edit to change anything.</p>'
    +'</div></div>';
  $('#setBack').addEventListener('click',function(){
    if(showAll){ agentsShowAll=false; if(agentsFromLib){ agentsFromLib=false; renderSettings('memorylib'); } else renderSettings('list'); return; }
    if(agentPath){ agentPath=afDir(agentPath); renderSettings('agents'); }
    else if(agentsFromLib){ agentsFromLib=false; renderSettings('memorylib'); }
    else renderSettings('list');
  });
  $('#afSortBtn').addEventListener('click',function(){ agentSort=agentSort==='name'?'size':'name'; renderSettings('agents'); });
  $('#afMenuBtn').addEventListener('click',function(){
    afMenuSheet('Add to '+(agentPath? afBase(agentPath) : 'System files'), [
      {icon:I.file, label:'Upload file', fn:function(){ $('#afFilePicker').click(); }},
      {icon:I.image, label:'Upload from camera roll', fn:function(){ $('#afImagePicker').click(); }},
      {icon:I.plus, label:'New file', fn:function(){ afNewSheet('file'); }},
      {icon:I.folder, label:'New folder', fn:function(){ afNewSheet('folder'); }}
    ]);
  });
  setView.querySelectorAll('[data-affolder]').forEach(function(r){
    r.addEventListener('click',function(e){ if(e.target.closest('[data-affolderdots]')) return; agentPath=r.getAttribute('data-affolder'); renderSettings('agents'); });
  });
  setView.querySelectorAll('[data-affolderdots]').forEach(function(b){
    b.addEventListener('click',function(e){
      e.stopPropagation();
      var f=b.getAttribute('data-affolderdots');
      afMenuSheet(afBase(f), [
        {icon:I.folder, label:'Open', fn:function(){ agentPath=f; renderSettings('agents'); }},
        {icon:I.plus, label:'New file here', fn:function(){ agentPath=f; afNewSheet('file'); }}
      ]);
    });
  });
  setView.querySelectorAll('[data-affile]').forEach(function(r){
    r.addEventListener('click',function(e){ if(e.target.closest('[data-afdots]')) return; agentFilePath=r.getAttribute('data-affile'); agentEditing=false; renderSettings('agentfile'); });
  });
  setView.querySelectorAll('[data-afdots]').forEach(function(b){
    b.addEventListener('click',function(e){ e.stopPropagation(); var en=afFind(b.getAttribute('data-afdots')); if(en) afFileMenu(en); });
  });
}
function afNewSheet(kind){
  openSheet('<h3>New '+(kind==='file'?'file':'folder')+'</h3>'
    +'<div class="field"><label>Name</label><input id="afNewName" type="text" placeholder="'+(kind==='file'?'notes.md':'new-folder')+'" autocomplete="off"></div>'
    +'<button class="btn-primary" id="afNewGo">Create</button><button class="btn-ghost" id="afNewCancel">Cancel</button>');
  $('#afNewCancel').addEventListener('click',closeSheet);
  $('#afNewGo').addEventListener('click',function(){
    var nm=$('#afNewName').value.trim().replace(/^\/+|\/+$/g,'');
    if(!nm){ toast('Give it a name first'); return; }
    var p=(agentPath? agentPath+'/' : '')+nm;
    if(kind==='folder'){
      if(AGENT_FOLDERS.indexOf(p)>=0){ toast('That folder already exists'); return; }
      AGENT_FOLDERS.push(p); closeSheet(); renderSettings('agents'); toast('Folder created');
    } else {
      if(afFind(p)){ toast('A file with that name exists here'); return; }
      AGENT_FILES.push({path:p, content:''}); closeSheet();
      agentFilePath=p; agentEditing=true; renderSettings('agentfile'); toast('File created — start typing');
    }
  });
  setTimeout(function(){ var ni=$('#afNewName'); if(ni) ni.focus(); },80);
}
function settingsAgentFile(){
  var entry=agentFilePath? afFind(agentFilePath) : null;
  if(!entry){ agentPath=''; renderSettings('agents'); return; }
  afMeta(entry.path).opened=++afSeq;
  var name=afBase(entry.path), isImg=!!entry.dataUrl && /^data:image\//.test(entry.dataUrl);
  if(agentEditing && !entry.dataUrl){
    setView.innerHTML='<div class="set-head"><button class="circle-btn" id="setBack" aria-label="Back to viewer">'+I.back+'</button><span class="af-title">'+esc(name)+'</span><button class="af-head-btn" id="afSaveBtn" aria-label="Save changes" style="background:var(--accent);color:var(--accent-ink);border-color:transparent">'+I.check+'</button></div>'
      +'<div class="set-scroll"><div class="set-inner">'
      +'<div class="field"><label>File name</label><input id="afName" type="text" value="'+escA(name)+'"></div>'
      +'<textarea id="afEditor" spellcheck="false">'+esc(entry.content||'')+'</textarea>'
      +'<div class="af-stats"><span id="afStatSize">'+esc(fmtSize(afBytes(entry.content||'')))+'</span><span id="afStatLines">'+String(entry.content||'').split('\n').length+' lines</span><span>Tap ✓ to save</span></div>'
      +'</div></div>';
    $('#setBack').addEventListener('click',function(){ agentEditing=false; renderSettings('agentfile'); });
    var ed=$('#afEditor');
    ed.addEventListener('input',function(){ $('#afStatSize').textContent=fmtSize(afBytes(ed.value)); $('#afStatLines').textContent=ed.value.split('\n').length+' lines'; });
    $('#afSaveBtn').addEventListener('click',function(){
      var nn=$('#afName').value.trim().replace(/^\/+|\/+$/g,'');
      if(!nn){ toast('File name cannot be empty'); return; }
      var np=(afDir(entry.path)? afDir(entry.path)+'/' : '')+nn;
      var clash=afFind(np); if(clash && clash!==entry){ toast('A file with that name exists here'); return; }
      entry.path=np; entry.content=ed.value; entry.size=null; agentFilePath=np; agentEditing=false; afMeta(np).mod=++afSeq;
      renderSettings('agentfile'); toast('Saved');
    });
    return;
  }
  agentEditing=false;
  var bodyHtml='';
  if(isImg) bodyHtml='<img class="mdimg" style="width:100%;border-radius:14px;border:1px solid var(--border)" src="'+entry.dataUrl+'" alt="'+esc(name)+'">';
  else if(entry.dataUrl) bodyHtml='<div class="set-group" style="padding:16px 15px"><p style="margin:0 0 6px"><b>'+esc(name)+'</b></p><p class="set-note" style="margin:0">This file is not text, so it cannot be edited as text here. Download keeps the original file.</p></div><button class="btn-primary" id="afDlBtn">Download</button>';
  else bodyHtml='<div class="af-view">'+mdRender(entry.content||'')+'</div>';
  setView.innerHTML='<div class="set-head"><button class="circle-btn" id="setBack" aria-label="Back to files">'+I.back+'</button><span class="af-title">'+esc(name)+'</span>'
    +'<span class="head-pill">'+(entry.dataUrl? '' : '<button id="afEditBtn" aria-label="Edit file">'+I.compose+'</button><span class="sep"></span>')+'<button id="afDotsBtn" aria-label="File options">'+I.dotsH+'</button></span></div>'
    +'<div class="set-scroll"><div class="set-inner">'+bodyHtml
    +'<div class="af-stats"><span>'+esc(afExt(name))+' · '+esc(fmtSize(afSizeOf(entry)))+'</span><span>'+esc(entry.path)+'</span></div>'
    +'</div></div>';
  $('#setBack').addEventListener('click',function(){ if(afReturnTo==='memorylib'){ renderSettings('memorylib'); } else { agentPath=afDir(entry.path); renderSettings('agents'); } });
  var eb=$('#afEditBtn'); if(eb) eb.addEventListener('click',function(){ agentEditing=true; renderSettings('agentfile'); });
  var dl=$('#afDlBtn'); if(dl) dl.addEventListener('click',function(){ afDownload(name, entry.dataUrl); });
  $('#afDotsBtn').addEventListener('click',function(){
    afMenuSheet(name, [
      {icon:I.share, label:'Share', fn:function(){ afShare(entry); }},
      {icon:I.copy, label:'Copy', fn:function(){ afCopyText(entry.content||''); }},
      {icon:I.file, label:'Download as PDF', fn:function(){ afDownload(name.replace(/\.[^.]+$/,'')+'.pdf', afPdfBlob(entry)); }},
      {icon:I.download, label:'Download', fn:function(){ afDownload(name, entry.dataUrl? entry.dataUrl : new Blob([entry.content||''], {type:'text/plain'})); }}
    ]);
  });
}
/* =============== Library (opened from the Agent page MEMORY card
   and from the bottom navigation) =============== */
var afReturnTo='agents';
var libTab='art', libViewMode='list', libSort='modified', libSys=true, libReturn='agentpage', libMenuOpen=false;
function libItems(){
  var items=[];
  if(libTab==='media'){
    AGENT_FILES.forEach(function(f){ if(f.dataUrl && /^data:image\//.test(f.dataUrl)) items.push({kind:'file', path:f.path, name:afBase(f.path), type:'Image', img:f.dataUrl}); });
    items.push({kind:'asset', name:'gptopen-logo.png', type:'Image', img:'data:image/png;base64,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fRwEQXV4ePipRqMxqLXOtdZZlmXxyMjItoGBgSezLEsGBgaefuKJJx759a9//fiWLVt2bNu2bXTr1q2NnTt35mmamqGhISMyHqrQWkue5887NgAAAAAAAAAAAMDBgIAFAOwi3/clTdNJr9kgheM4kmWZaK1FKSVBEEie56K1lp6eHmfhwoVBf39/tGLFit5169atOeqoo45buHDhqq6urnlRFNWCICj39fUdHgRBxRijtdaZ53mR4zhKa505jqOMMVop5YmMV53I8zzRWudKKdeGJKZjjNE2UDGe2VBe8XmapvU8zxPXdQMb4LDL2cdpmjYajcbg2NjYjrGxsR2Dg4NPbd269bGBgYFtN9xww4+ffPLJndu2bWuOjIzkw8PDutFoiOu64nmeZFkmItKqemGMIXQBAAAAAAAAAACAAxYBCwDYTUopcV1XHMdphSiMMVIul6XZbIpSSvr7+9XSpUujI488ct7JJ5/8onXr1p26ePHioyqVSn93d/fSUqnU43lepJTyioEGz/OiPM+TNE3rrusGNvzgum5gt29bethQxUS7D52maX024y9Wryje223b52ma1m3AIs/zJAzDWnF7NuTRaDQGG43GYL1eHxwbG9uxZcuWTb/4xS9u+dnPfnbv448/Prh169bmtm3bsnq9btoDFTac0qlVCK1DAAAAAAAAAAAAsD8RsACAXaSUat2MMa1qFq7rSrlcdrq6utTy5ctLJ5xwwspTTjnl1GOOOeb0RYsWHV2pVPptmEIp5RbDEiLPtekwxuhiiKEYoLDv23CFVQw7tK93rhzHUVmWNSfG6WmtM7tOrXVmt53neWIrWriuG7iuGxhjdLPZHPI8LxQRmahysX1wcHDzAw88cNPPf/7zn95yyy0PDA0Nxdu2bUsGBgbyZrNpt9u6TexT656QBQAAAAAAAAAAAPYXAhYAsIvCMBStdatihed5smDBAnfNmjXdq1atWvCmN73pysWLF69ZuHDh0b7vl4wx2vf9kuu6gdY6s+EJkfEwg233YdkKFiLjIQallDdVeKIYeLDr01pn042/2EakvaWIDXlorbNiG5JiyCPP88SOr30Mto1JnueJXX5i/8t5niejo6Nbm83m8EMPPfTjW2655b9vu+22ezdt2jSwbdu2bGxszOR5Lp43fjhssIKABQAAAAAAAAAAAPYnAhYAIM9Vo7Bh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v/3fl1566a8WL17c29PTo+M43qp1iOH7/laVE/ItgOI4blS3MKGqarUqWZbJHnvsYe23336ls84669i3v/3tF+y///5/ZFmW093dvY9t216tVuv1fb8riqKyZVmOOW6jKCqbUFMcx9V8ixGR+vvNVMZIkiQwAY2xhi5aBSyyLNNmP5nPAPM787mQJEngOI5vHmvafKRpGpnWH7Zte5ZlOUEQ9PX09Czv7+9f94c//OGBO+644+ZbbrnlpVdffTVRSpmWQmJZliqXy7vfGx4AMCZMvAAAsOviex4AAADTHQELYCdpDleISGOi3UzcWpal0jTNoihqVLnYe++97SOOOGLmUUcdddDChQsP22uvvQ6eNWvWgmKx2OW6rj979uyDuru79xWpT9CK1Cdi8z+HC1gEQdDveV6bmdANgqA/CIKBcrm8qVKp9PT19a37wx/+8Pjvfve7Bx544IG1a9asSfPbZCaWm7fJXA499NDCj3/84++85S1v+UszgZskSRBFUblUKs02E8zDhSzGsE/HNWAxlmBK/rap7OF5XruZ1C8UCp3Lli2755Zbbln0pS996bdpmkq5XM5835ckSSRJEpkxY4bq6+vLTGWL3Pq2+rmrM210jEKhIEopieNY0jSVUqkk1WpVTjnllO4vfelL/3zSSSf9tdnvps2Mef/kW3KY1yJN08iEeIZCPaFlWbZlWY7WOrnnnnt+eMUVV1x22223vVoul7VSSmq1mti2LR0dHaqvry+zbVs8r15oIo7jRhAkX7lGKSXFYlGUUo0KFyZ8MX/+fGf+/Pn+kUceufcpp5xy2r777nt4qVTqmjlz5r7t7e1z2tra5ti27Zljwff97nw1ifx71LzfmsMQ28o8L4qisud57flKGkmSBGYd5vPBVJ0xzxERCcNw0LIsOwiC/lqt1letVnvXrVv34hNPPHHXHXfc8eCTTz7ZMzAwoMMwlCzLpFAoiGVZjWofza89AAB5TLwAALDr4nseAAAA0x0BC2ASmDCC4ziSpqlorRtBCxFptJFoPoPesizp6upSc+fOdbu6utw5c+a0HXroofsceOCBB5VKpfZCoVCcNWvWXl1dXXNbhQ+yOp0bhyUi0tPTs+bll19+5tVXX125efPm3nXr1vWtX7++8tJLL9W01hJFUaNkv+/7SkQkiqLMTDbnQxb5Mv1xHMtXvvKVU778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sNiWChbNt80kfBzHVcuyHNd1S+a2aYWRJElgtjOKorJt255lWU61Wt3iOE6hWCzODMNw4M477/zOz3/+85/9/ve/X9vb26uzLBPLshphinwVhPx9E0kpJYVCoVG54vDDDy+ef/75p7z3ve/920MOOeQsExwx22iCB2YbTTDBVH3IP8YEGcy+Hmk/b6/RltM8pvy48lUsmp9n2p0opaz+/v5VxWJxhnlv27bt3XTTTf/2nve856ul0msFOkzAIk3TRhWLHUUFCwDAdMWZrQAA7Lr4ngcAAMB0R8ACwIQpFAoSRZEUCgVJkkSUUhLHsRxwwAHuZz7zmbM/+clP/tRxHN+yLCeKonKpVJpdq9V6isXizCRJAjORbQII+QnxiWwRMtYJ/NECHvkJ+FZhgVbBgfy60zSNzH2mysPy5cvvu+GGG75366233rd48eKeSqWS1Wq1LPccERGxbbvRvqN5It2yrEY4wzzehGHiOG4839wfhqGI1F/PIAhERGTGjBkqDMPsqKOO6jjzzDOPOe200z7wxje+8ewZM2bsb8beap/saOglf30s+39b15XXqkXNcJVWWl2PoqjsOI7vum5p06ZNL86ZM+fQFStW3P+hD33o7Mcee6zseZ55fMsWIQQgAAC7KyZeAADYdfE9DwAAgOmOgAWACeO6rqRp2piYNxPGnufJ6aefPueLX/ziV97ylrf8pQkSuK5bqtVqPZ7ntecDCVM1YDHa40YLWLR6fH6ZWuvEsizHtNOwLMspFAqdWuskCIL+NWvWPHX33XdfdsMNN9z13HPP9VSrVa21liAIsiAIxFQMMZehZTYqTti23ZjIV0qJbdtiWZYkSSJpmopt21IoFMS2bVUsFpXv+5bjOOqNb3zjzNNPP/3E00477c9nzZq1/9y5cw8zFSmCIOgTEXEcx89Xfmi17dsSgGgVshgtYDGa0dbfKmCRH8NoAQvbtr1KpbLR87x213VLQRD0/fa3v/3iX//1X1/seZ4KgiDLPacRsGiuRAIAwO6GiRcAAHZdfM8DAABguiNgAWDCFQqFRhUEpZRkWSazZs1Sn/vc5976hS984XLP89pMJYs0TSMzMW8CCjszYDFe7SfMskaqWDHces315gl+EygwlT2q1epm87tqtdqzfPnyhx599NGbH3300SdWrly5JUkSXavVknK5nFSr1TRJksyEKZRS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J6I6wliMVtlhZxjv7Z7oCiDjqdX+b34/taqeYtqp2LbtJUkSxHFc9TyvfXBwcN3tt99++Z133vlqEARiWVajLU6SJI2gEQAAGFbPZA9gHASTPQAAAKYovucBAAAwbU2pCS4Au4d8NYs0TcW2bfE8Tx588MGeX/7ylxetW7ducRRFZdd1S0mSBK7rFrXWjVP+kyQJkiQJmpbZmAjfkXDFjm3Z1ra3goV57mQEFMazBctUN9r+b/Wc/HanaRqZlixBEPSFYTho27YXBEHfk08+efUtt9zy4MaNG3WhUBClVGMZlmURrgAAYHTrJ3sA42DjZA8AAIApiu95AAAATFvTfoIMwNSllNpqYrmZbdsiIqK1lkKhoKrVqtx0001/uOOOO36stU4GBwfXVavVLb7vd4uIDA4OrisWizMdx/GTJAnGElTYhrHudp+Hw+2zXSVAMR6a90N+f0VRVHYcxxcRieO4VigUOlzXLb300kt3/frXv/6vp59+ut91XbGs1xYRx7E0LW9iNwAAgOnr1ckewDhYPdkDAABgiuJ7HgAAANMWE2gAJtxwQYtCodBoERLHceb7vqxfvz695JJLrn7wwQcv7ejomO95XnutVuvxPK/N87w281zf97t3NFgxUjWGsQQMtrUqxXivf7zGN5ltSUayo/t3NKPtf3N/vh1IflxpmsamZY3jOIVCodC5bt26p2+55ZZLrr322qXlcjlzXVeCIBCllLS1tZntEqUU4QoAAEa2K0y8rJrsAQAAMEXxPQ8AAIBpi4AFgAljWoGYS7NqtSppmkoURRIEgdi2LUmSyAMPPDDwne9851urV69+rL29fV6apnGhUOj0PK89iqLyUDuGAa11orVOWk24b29AYbKqN0x2642JCFlMdEBiPLXa/61ej/z4Pc9rS9M0sm3bcxzH37Jly9Jbb731B1ddddV9mzdv1iL16ixDy2r8HK2yS/7xAADsxl6a7AGMgyWTPQAAAKYovucBAAAwbRGwADCpHMeRNE3FnOkvItLW1ia33nrr5q9+9asfjeO4WigUOkTqLRksy3J83+82wQqR14cDpkp7i/yk/WiXVs+brHGbMUzm+neG0fb/SKGXoYBFu4iI4zh+lmV61apVT95+++13PvXUUzXf9yVJEonjWHzflzRNpVKpNMJGJngBAACG9dxkD2AcPDXZAwAAYIriex4A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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgB/3/YnKaixR7pOoAAAAASUVORK5CYII='});
  } else {
    items.push({kind:'app', name:appName(), type:'Artefact', mod:999, opened:999});
    AGENT_FILES.forEach(function(f){
      if(f.dataUrl && /^data:image\//.test(f.dataUrl)) return;
      if(!libSys && f.path.indexOf('/')<0) return;
      var mt=afMeta(f.path);
      items.push({kind:'file', path:f.path, name:afBase(f.path), type:afExt(afBase(f.path)), mod:mt.mod, opened:mt.opened});
    });
  }
  if(libSort==='name') items.sort(function(a,b){ return a.name.localeCompare(b.name); });
  else if(libSort==='opened') items.sort(function(a,b){ return (b.opened||0)-(a.opened||0); });
  else items.sort(function(a,b){ return (b.mod||0)-(a.mod||0); });
  return items;
}
function libIcon(it){
  if(it.kind==='app') return '<span class="lib-ico art">'+I.chat+'</span>';
  if(it.type==='Image') return '<span class="lib-ico"><img src="'+it.img+'" alt=""></span>';
  return '<span class="lib-ico doc">'+I.file+'<span class="ext">'+esc(it.type)+'</span></span>';
}
function settingsLibrary(){
  var items=libItems();
  function lmRow(attr, icon, label, on){
    return '<button class="lm-row" data-lm="'+attr+'"><span class="lm-ico">'+icon+'</span><span>'+label+'</span>'+(on? '<span class="lm-check">'+I.check+'</span>' : '')+'</button>';
  }
  var menu='';
  if(libMenuOpen){
    menu='<div class="lib-menu" role="menu">'
      + lmRow('grid', I.grid, 'Show as grid', libViewMode==='grid')
      + lmRow('list', I.list2, 'Show as list', libViewMode==='list')
      + '<div class="lm-sep"></div>'
      + lmRow('modified', I.edit, 'Sort by last modified', libSort==='modified')
      + lmRow('opened', I.clock, 'Sort by last opened', libSort==='opened')
      + lmRow('name', '<span style="font-size:15px;font-weight:700">Aa</span>', 'Sort by name', libSort==='name')
      + '<div class="lm-sep"></div>'
      + lmRow('sys', I.folder, 'System files', libSys)
      + '</div>';
  }
  var body='';
  if(libViewMode==='grid'){
    body='<div class="lib-grid">'+items.map(function(it){
      return '<button class="lib-cell" data-libopen="'+escA(it.kind+'|'+(it.path||it.name))+'">'+libIcon(it)+'<span class="lib-name">'+esc(it.name)+'</span><span class="lib-type">'+esc(it.type)+'</span></button>';
    }).join('')+'</div>';
  } else {
    body=items.map(function(it){
      return '<div class="lib-row" data-libopen="'+escA(it.kind+'|'+(it.path||it.name))+'" role="button" tabindex="0">'+libIcon(it)+'<span class="lib-meta"><span class="lib-name" style="display:block">'+esc(it.name)+'</span><span class="lib-type" style="display:block">'+esc(it.type)+'</span></span>'+(it.kind==='file'? '<button class="lib-dots" data-libdots="'+escA(it.path)+'" aria-label="File options">'+I.dotsV+'</button>' : '')+'</div>';
    }).join('');
  }
  if(!items.length) body='<p class="set-note">Nothing here yet.</p>';
  setView.innerHTML=(libMenuOpen? '<div id="libScrim" style="position:fixed;inset:0;z-index:40"></div>' : '')
    +'<div class="set-head"><button class="circle-btn" id="libBack" aria-label="'+(libReturn==='tab'?'Open chats':'Back')+'">'+(libReturn==='tab'? I.menu+'<span class="dot"></span>' : I.back)+'</button><h2>Library</h2><span style="position:relative;display:flex"><button class="af-head-btn" id="libDotsBtn" aria-label="Library options" aria-expanded="'+libMenuOpen+'">'+I.dotsH+'</button>'+menu+'</span></div>'
    +'<div class="set-scroll"><div class="set-inner">'
    +'<div class="lib-tabs" role="tablist"><button class="lib-tab'+(libTab==='art'?' sel':'')+'" data-libtab="art" role="tab">Artefacts</button><button class="lib-tab'+(libTab==='media'?' sel':'')+'" data-libtab="media" role="tab">Media</button></div>'
    + body
    +'</div></div>';
  $('#libBack').addEventListener('click',function(){
    if(libReturn==='tab'){
      /* In tab mode the top-left button is the chat menu button —
         the same one as in chat. It opens the chat menu OVER the
         Library; the Library is not changed or closed, and closing
         the menu returns to it. */
      setSidebar(true,true);
      return;
    }
    /* Back from Library always returns to the open chat — never to
       the Settings list. */
    libMenuOpen=false;
    closeSettings();
  });
  var sc=$('#libScrim'); if(sc) sc.addEventListener('click',function(){ libMenuOpen=false; renderSettings('memorylib'); });
  $('#libDotsBtn').addEventListener('click',function(e){ e.stopPropagation(); libMenuOpen=!libMenuOpen; renderSettings('memorylib'); });
  setView.querySelectorAll('[data-libtab]').forEach(function(b){ b.addEventListener('click',function(){ libTab=b.getAttribute('data-libtab'); libMenuOpen=false; renderSettings('memorylib'); }); });
  setView.querySelectorAll('[data-lm]').forEach(function(b){ b.addEventListener('click',function(){
    var a=b.getAttribute('data-lm');
    if(a==='sys'){
      /* System files does not just toggle a filter — it opens the
         Agents files browser showing ALL of the agent files, flat,
         and Back returns here to the Library. */
      libMenuOpen=false; libSys=true;
      agentsFromLib=true; agentsShowAll=true; agentPath=''; agentFilePath=null;
      renderSettings('agents');
      return;
    }
    if(a==='grid'||a==='list') libViewMode=a;
    else libSort=a;
    libMenuOpen=false; renderSettings('memorylib');
  }); });
  setView.querySelectorAll('[data-libopen]').forEach(function(r){ r.addEventListener('click',function(e){
    if(e.target.closest('[data-libdots]')) return;
    var parts=r.getAttribute('data-libopen').split('|'); var kind=parts[0], key=parts.slice(1).join('|');
    if(kind==='app'){ detailSheet(appName(), ['Artefact — this app, the one you are using right now.', 'Its files live under Agents files in Settings.']); return; }
    if(kind==='asset'){ detailSheet(key, ['Image — the app logo, stored with the app assets.']); return; }
    afReturnTo='memorylib'; agentFilePath=key; agentEditing=false; renderSettings('agentfile');
  }); });
  setView.querySelectorAll('[data-libdots]').forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); var en=afFind(b.getAttribute('data-libdots')); if(en) afFileMenu(en); }); });
}
/* =============== Goals + scheduled messages =============== */
var GOAL_CATS=[
  {k:'health', n:'Health', icon:'heart'},
  {k:'relationships', n:'Relationships', icon:'userCircle'},
  {k:'finance', n:'Finance', icon:'dollar'},
  {k:'career', n:'Career', icon:'layers'},
  {k:'interests', n:'Interests', icon:'spark'},
  {k:'productivity', n:'Productivity', icon:'clock'},
  {k:'else', n:'Something else', icon:'grid4'}
];
function goalCatIcon(c){
  for(var i=0;i<GOAL_CATS.length;i++) if(GOAL_CATS[i].n===c){ var ic=GOAL_CATS[i].icon; return ic==='dollar'? '<span style="font-size:21px;font-weight:700;line-height:1">$</span>' : I[ic]; }
  return I.grid4;
}
var goalsTracking=[];
var goalsList=[];
var SCHED=[], NOTIFS=[], goalsUnread=0;
var goalShow={tracking:false, goals:false};
function goalFind(q){
  q=String(q||'').trim().toLowerCase(); if(!q) return null;
  var all=goalsTracking.concat(goalsList);
  for(var i=0;i<all.length;i++) if(all[i].title.toLowerCase().indexOf(q)>-1) return all[i];
  return null;
}
function goalRemove(g){
  goalsTracking=goalsTracking.filter(function(x){ return x!==g; });
  goalsList=goalsList.filter(function(x){ return x!==g; });
}
function goalGuessCat(t){
  t=t.toLowerCase();
  if(/\b(weight|gym|running|run|sleep|health|fitness|fit|walk|exercise)\b/.test(t)) return 'Health';
  if(/\b(hobby|music|game|games|art|draw|drawing|anime|guitar|piano|painting)\b/.test(t)) return 'Interests';
  if(/\b(study|exam|learn|learning|read|reading|course|practice|homework)\b/.test(t)) return 'Productivity';
  if(/\b(money|business|earn|earnings|income|finance|invest|investing|save|savings)\b/.test(t)) return 'Finance';
  if(/\b(job|internship|career|work|client|clients)\b/.test(t)) return 'Career';
  if(/\b(family|friend|friends|relationship)\b/.test(t)) return 'Relationships';
  return 'Something else';
}
function fmtSchedTime(ts){
  var d=new Date(ts), now=new Date();
  var sameDay=d.toDateString()===now.toDateString();
  var tm=d.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
  return sameDay? 'Today · '+tm : d.toLocaleDateString([], {day:'numeric', month:'short'})+' · '+tm;
}
function dtLocal(ts){
  var d=new Date(ts); function p(n){ return (n<10?'0':'')+n; }
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes());
}
var TA_STYLE='width:100%;background:var(--input);border:1px solid var(--border);border-radius:12px;padding:11px 13px;color:var(--text);font:inherit';
function settingsGoals(){
  goalsUnread=0;
  function sec(key, label, items){
    var showAll=goalShow[key];
    var vis=showAll? items : items.slice(0,4);
    var rows=vis.map(function(g){
      var left=g.expand
        ? '<button class="goal-chev" data-gexp="'+g.id+'" aria-label="Expand or collapse">'+I.chevR+'</button>'
        : '<button class="goal-check'+(g.done?' done':'')+'" data-gcheck="'+g.id+'" role="checkbox" aria-checked="'+g.done+'" aria-label="Mark done">'+I.check+'</button>';
      return '<div class="goal-row'+(g.done?' done':'')+(g.open?' open':'')+'">'+left
        +'<div class="goal-main"><div class="goal-name">'+esc(g.title)+'</div>'+(g.desc? '<div class="goal-desc">'+esc(g.desc)+'</div>' : '')+'</div>'
        +'<button class="goal-dots" data-gdots="'+g.id+'" aria-label="Goal options">'+I.dotsV+'</button></div>';
    }).join('');
    var more=(!showAll && items.length>4)? '<button class="goal-more" data-gmore="'+key+'">'+I.grid4+'<span>Show more</span></button>' : '';
    return '<div class="goal-sec"><span class="dot"><i></i></span><span class="lbl">'+label+'</span><button class="add" data-gadd="'+key+'" aria-label="Add to '+label+'">'+I.plus+'</button></div>'
      + (rows || '<p class="set-note" style="margin:2px 0 0">Nothing here yet — tap + to add one.</p>') + more;
  }
  var notifHtml=NOTIFS.length? '<div class="goal-sec"><span class="dot"><i></i></span><span class="lbl">Notifications</span></div>'
    + NOTIFS.slice(0,6).map(function(n){
        return '<div class="mini-row"><span class="mini-ico">'+I.bell+'</span><div class="goal-main"><div class="goal-name" style="font-size:15.5px">'+esc(n.text)+'</div><div class="goal-desc" style="-webkit-line-clamp:1">'+esc(new Date(n.ts).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}))+'</div></div></div>';
      }).join('') : '';
  var schedRows=SCHED.map(function(s){
    return '<div class="mini-row"><span class="mini-ico">'+I.clock+'</span><div class="goal-main"><div class="goal-name" style="font-size:15.5px">'+esc(s.text)+'</div><div class="goal-desc" style="-webkit-line-clamp:1">'+(s.done? 'Sent · ' : 'Scheduled · ')+esc(fmtSchedTime(s.at))+'</div></div>'
      + (s.done? '' : '<button class="goal-dots" data-sdots="'+s.id+'" aria-label="Scheduled message options">'+I.dotsV+'</button>')+'</div>';
  }).join('');
  var schedHtml='<div class="goal-sec"><span class="dot"><i></i></span><span class="lbl">Scheduled messages</span><button class="add" id="schedAdd" aria-label="Schedule a message">'+I.plus+'</button></div>'
    + (schedRows || '<p class="set-note" style="margin:2px 0 0">None scheduled. Schedule as many as you like — no limit. They send themselves in chat, fully local.</p>');
  var catsHtml='<h3 style="font-size:19px;margin:26px 0 4px">Create a goal</h3>'
    + GOAL_CATS.map(function(c){ return '<button class="cat-row" data-gcat="'+escA(c.n)+'"><span class="ci">'+goalCatIcon(c.n)+'</span><span>'+c.n+'</span><span class="cp">'+I.plus+'</span></button>'; }).join('');
  setView.innerHTML='<div class="set-head"><button class="circle-btn" id="setBack" aria-label="Back to chat">'+I.x+'</button><h2>Goals</h2><span style="width:42px"></span></div>'
    +'<div class="set-scroll"><div class="set-inner" style="padding-bottom:30px">'
    +'<div class="goals-title">Goals</div>'
    + notifHtml
    + sec('tracking','Tracking', goalsTracking)
    + sec('goals','Goals', goalsList)
    + schedHtml
    + catsHtml
    +'</div></div>';
  $('#setBack').addEventListener('click',function(){ closeSettings(); });
  setView.querySelectorAll('[data-gadd]').forEach(function(b){ b.addEventListener('click',function(){ goalCreateSheet(null, b.getAttribute('data-gadd')); }); });
  setView.querySelectorAll('[data-gcat]').forEach(function(b){ b.addEventListener('click',function(){ goalCreateSheet(b.getAttribute('data-gcat'), 'goals'); }); });
  setView.querySelectorAll('[data-gcheck]').forEach(function(b){ b.addEventListener('click',function(){
    var g=goalFindById(b.getAttribute('data-gcheck')); if(!g) return;
    g.done=!g.done; renderSettings('goals'); toast(g.done? 'Marked complete' : 'Resumed');
  }); });
  setView.querySelectorAll('[data-gexp]').forEach(function(b){ b.addEventListener('click',function(){
    var g=goalFindById(b.getAttribute('data-gexp')); if(!g) return;
    g.open=!g.open; renderSettings('goals');
  }); });
  setView.querySelectorAll('[data-gmore]').forEach(function(b){ b.addEventListener('click',function(){ goalShow[b.getAttribute('data-gmore')]=true; renderSettings('goals'); }); });
  setView.querySelectorAll('[data-gdots]').forEach(function(b){ b.addEventListener('click',function(){
    var g=goalFindById(b.getAttribute('data-gdots')); if(g) goalMenu(g);
  }); });
  $('#schedAdd').addEventListener('click',function(){ schedSheet(null, ''); });
  setView.querySelectorAll('[data-sdots]').forEach(function(b){ b.addEventListener('click',function(){
    var s=null; SCHED.forEach(function(x){ if(x.id===b.getAttribute('data-sdots')) s=x; });
    if(!s) return;
    afMenuSheet('Scheduled message', [
      {icon:I.edit, label:'Edit', fn:function(){ schedSheet(s, ''); }},
      {icon:I.trash, label:'Cancel scheduled message', danger:true, fn:function(){ SCHED=SCHED.filter(function(x){ return x!==s; }); renderSettings('goals'); toast('Scheduled message cancelled'); }}
    ]);
  }); });
}
function goalFindById(id){
  var all=goalsTracking.concat(goalsList);
  for(var i=0;i<all.length;i++) if(all[i].id===id) return all[i];
  return null;
}
function goalMenu(g){
  var inTracking=goalsTracking.indexOf(g)>-1;
  afMenuSheet(g.title, [
    {icon:I.check, label: g.done? 'Resume' : (inTracking? 'Stop tracking' : 'Mark complete'), fn:function(){ g.done=!g.done; renderSettings('goals'); }},
    {icon:I.edit, label:'Edit goal', fn:function(){ goalEditSheet(g); }},
    {icon:I.clock, label:'Schedule a message', fn:function(){ schedSheet(null, 'Work on: '+g.title); }},
    {icon:I.trash, label:'Delete goal', danger:true, fn:function(){ goalRemove(g); renderSettings('goals'); toast('Goal deleted'); }}
  ]);
}
function goalEditSheet(g){
  openSheet('<h3>Edit goal</h3>'
    +'<div class="field"><label>Title</label><input id="geTitle" type="text" value="'+escA(g.title)+'"></div>'
    +'<div class="field"><label>Note</label><textarea id="geDesc" rows="3" style="'+TA_STYLE+'">'+esc(g.desc||'')+'</textarea></div>'
    +'<button class="btn-primary" id="geSave">Save</button><button class="btn-ghost" id="geCancel">Cancel</button>');
  $('#geCancel').addEventListener('click',closeSheet);
  $('#geSave').addEventListener('click',function(){
    var t=$('#geTitle').value.trim(); if(!t){ toast('Title cannot be empty'); return; }
    g.title=t; g.desc=$('#geDesc').value.trim();
    closeSheet(); renderSettings('goals'); toast('Goal updated');
  });
}
function goalCreateSheet(catName, secKey){
  var selCat=catName||'Something else', selSec=secKey||'goals';
  openSheet('<h3>Create a goal</h3>'
    +'<div class="field"><label>Title</label><input id="gcTitle" type="text" placeholder="What do you want to achieve?"></div>'
    +'<div class="field"><label>Note (optional)</label><input id="gcDesc" type="text" placeholder="A line about where it stands"></div>'
    +'<div class="field"><label>Category</label><div class="seg" id="gcCatSeg" style="flex-wrap:wrap;height:auto;padding:4px;gap:4px">'+GOAL_CATS.map(function(c){ return '<button data-v="'+escA(c.n)+'">'+c.n+'</button>'; }).join('')+'</div></div>'
    +'<div class="field"><label>List</label><div class="seg" id="gcSecSeg"><button data-v="tracking">Tracking</button><button data-v="goals">Goals</button></div></div>'
    +'<button class="btn-primary" id="gcGo">Create goal</button><button class="btn-ghost" id="gcCancel">Cancel</button>');
  segWire('#gcCatSeg', selCat, function(v){ selCat=v; });
  segWire('#gcSecSeg', selSec, function(v){ selSec=v; });
  $('#gcCancel').addEventListener('click',closeSheet);
  $('#gcGo').addEventListener('click',function(){
    var t=$('#gcTitle').value.trim(); if(!t){ toast('Give the goal a title first'); return; }
    var g={id:'g'+(++uid), title:t, desc:$('#gcDesc').value.trim(), cat:selCat, done:false};
    (selSec==='tracking'? goalsTracking : goalsList).push(g);
    closeSheet();
    if(state.view==='settings') renderSettings('goals');
    toast('Goal created');
  });
  setTimeout(function(){ var ni=$('#gcTitle'); if(ni) ni.focus(); },80);
}
function schedSheet(existing, prefill){
  var s=existing||null;
  openSheet('<h3>'+(s? 'Edit scheduled message' : 'Schedule a message')+'</h3>'
    +'<div class="field"><label>Message</label><textarea id="scText" rows="3" style="'+TA_STYLE+'">'+esc(s? s.text : (prefill||''))+'</textarea></div>'
    +'<div class="field"><label>Send at</label><input id="scWhen" type="datetime-local" value="'+dtLocal(s? s.at : Date.now()+30*60000)+'"></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px"><button class="chip" data-scq="10">In 10 min</button><button class="chip" data-scq="60">In 1 hour</button><button class="chip" data-scq="tm9">Tomorrow 9 AM</button></div>'
    +'<button class="btn-primary" id="scGo">'+(s? 'Save' : 'Schedule')+'</button><button class="btn-ghost" id="scCancel">Cancel</button>');
  document.querySelectorAll('#sheet [data-scq]').forEach(function(b){ b.addEventListener('click',function(){
    var q=b.getAttribute('data-scq'); var ts;
    if(q==='tm9'){ var d=new Date(); d.setDate(d.getDate()+1); d.setHours(9,0,0,0); ts=d.getTime(); }
    else ts=Date.now()+(+q)*60000;
    $('#scWhen').value=dtLocal(ts);
  }); });
  $('#scCancel').addEventListener('click',closeSheet);
  $('#scGo').addEventListener('click',function(){
    var text=$('#scText').value.trim(); if(!text){ toast('Write the message first'); return; }
    var ts=new Date($('#scWhen').value).getTime();
    if(!ts || ts<=Date.now()){ toast('Pick a future time'); return; }
    if(s){ s.text=text; s.at=ts; }
    else SCHED.push({id:'s'+(++uid), text:text, at:ts, done:false});
    closeSheet();
    if(state.view==='settings' && lastSetView==='goals') renderSettings('goals');
    toast('Message scheduled for '+fmtSchedTime(ts));
  });
}
/* The agent manages goals and scheduled messages from chat, exactly
   as the user says: add, update, stop, delete — applied directly. */
function parseSchedTime(str){
  var s=String(str||'').trim().toLowerCase().replace(/^at\s+/,'');
  var now=new Date(), m;
  if(m=s.match(/^(\d+)\s*(minutes?|mins?|hours?|hrs?|h)$/)){
    return Date.now()+(+m[1])*(/^h/.test(m[2])? 3600000 : 60000);
  }
  var dayOff=0;
  if(/^tomorrow/.test(s)){ dayOff=1; s=s.replace(/^tomorrow\s*(at\s*)?/,''); }
  else if(/^today/.test(s)){ s=s.replace(/^today\s*(at\s*)?/,''); }
  if(m=s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/)){
    var hh=+m[1], mm=+(m[2]||0);
    if(m[3]==='pm' && hh<12) hh+=12;
    if(m[3]==='am' && hh===12) hh=0;
    var d=new Date(now); d.setDate(d.getDate()+dayOff); d.setHours(hh,mm,0,0);
    if(!dayOff && d.getTime()<=Date.now()) d.setDate(d.getDate()+1);
    return d.getTime();
  }
  return null;
}
function agentCommand(text){
  var t=String(text||'').trim(), m;
  if(m=t.match(/^(?:add|create) (?:a |new )?goal[:\s]+(.+)/i)){
    var title=m[1].trim(), cat=goalGuessCat(title);
    goalsList.push({id:'g'+(++uid), title:title, desc:'Added from chat.', cat:cat, done:false});
    NOTIFS.unshift({text:'Goal added: '+title, ts:Date.now()});
    return 'Added to Goals: "'+title+'" ('+cat+'). It is on the Goals page — tap the Goals icon in the bottom bar to see it.';
  }
  if(m=t.match(/^(?:rename|update) (?:the )?goal[:\s]+(.+?)\s+to\s+(.+)$/i)){
    var g0=goalFind(m[1]); if(!g0) return 'I could not find a goal matching "'+m[1].trim()+'".';
    var old=g0.title; g0.title=m[2].trim();
    return 'Updated: "'+old+'" is now "'+g0.title+'".';
  }
  if(m=t.match(/^(?:stop|complete|finish) (?:tracking )?(?:the )?goal[:\s]+(.+)/i)){
    var g1=goalFind(m[1]); if(!g1) return 'I could not find a goal matching "'+m[1].trim()+'".';
    g1.done=true;
    return 'Done — "'+g1.title+'" is marked complete and stopped.';
  }
  if(m=t.match(/^(?:delete|remove) (?:the )?goal[:\s]+(.+)/i)){
    var g2=goalFind(m[1]); if(!g2) return 'I could not find a goal matching "'+m[1].trim()+'".';
    goalRemove(g2);
    return 'Deleted the goal "'+g2.title+'".';
  }
  if(m=t.match(/^schedule (?:a )?message[:\s]+(.+?)\s+(?:at|on|in)\s+(.+)$/i)){
    var when=parseSchedTime(m[2]);
    if(!when) return 'I could not read that time. Try "schedule message <text> in 30 minutes" or "schedule message <text> tomorrow 9am".';
    SCHED.push({id:'s'+(++uid), text:m[1].trim(), at:when, done:false});
    return 'Scheduled: "'+m[1].trim()+'" for '+fmtSchedTime(when)+'. It sends itself here in chat — schedule as many as you like, there is no limit.';
  }
  if(m=t.match(/^(?:cancel|stop|delete) (?:the )?scheduled message[:\s]+(.+)/i)){
    var q=m[1].trim().toLowerCase();
    for(var i=0;i<SCHED.length;i++){
      if(!SCHED[i].done && SCHED[i].text.toLowerCase().indexOf(q)>-1){
        var st=SCHED[i].text; SCHED.splice(i,1);
        return 'Cancelled the scheduled message "'+st+'".';
      }
    }
    return 'No pending scheduled message matches that.';
  }
  if(/^list (?:my )?(?:goals|scheduled)/i.test(t)){
    var tr=goalsTracking.filter(function(g){ return !g.done; }).map(function(g){ return g.title; });
    var gl=goalsList.filter(function(g){ return !g.done; }).map(function(g){ return g.title; });
    var pd=SCHED.filter(function(s){ return !s.done; });
    return 'Tracking: '+(tr.length? tr.join(' · ') : 'nothing')+'\nGoals: '+(gl.length? gl.join(' · ') : 'nothing')+'\nScheduled messages: '+(pd.length? pd.map(function(s){ return '"'+s.text+'" ('+fmtSchedTime(s.at)+')'; }).join(' · ') : 'none');
  }
  return null;
}
/* Scheduled messages fire fully locally while the app is open: the
   message lands in the current chat as if sent, the agent replies,
   and a notification waits on the Goals page. */
function fireScheduled(){
  var now=Date.now(), fired=false;
  SCHED.forEach(function(s){
    if(s.done || s.at>now) return;
    s.done=true; fired=true;
    NOTIFS.unshift({text:'Scheduled message sent: '+s.text, ts:now});
    goalsUnread++;
    var chat=currentChat();
    if(chat){
      var msg={id:mid(), role:'user', text:s.text};
      chat.messages.push(msg);
      if(state.memory) saveMemory(chat, msg);
      if(state.apiKey) callProvider(chat); else pushAI(chat, localReply(s.text));
    }
  });
  if(fired){
    syncBnav();
    if(state.view==='settings' && lastSetView==='goals') renderSettings('goals');
    else if(state.view!=='settings') renderAll();
    toast('Scheduled message sent');
  }
}
setInterval(fireScheduled, 5000);
/* Due messages also flush the moment the app is looked at again —
   on visibility return, focus, page show, and every render — so a
   message lands even if the browser throttled or froze timers
   while the app was in the background. Fired items are marked done
   before any render runs, so these extra calls can never double
   fire one. */
document.addEventListener('visibilitychange', function(){ if(!document.hidden) fireScheduled(); });
window.addEventListener('focus', fireScheduled);
window.addEventListener('pageshow', fireScheduled);
/* =============== Bottom navigation (Chat · Goals · Library) ====== */
function updPlaceholder(){
  var inp=$('#chatInput'); if(!inp) return;
  var c=(typeof currentChat==='function')? currentChat() : null;
  var t=(c && c.title && c.title!=='New chat')? c.title : 'Main chat';
  inp.placeholder='Message in '+t;
  var nav=$('#bottomNav');
  if(nav) nav.classList.toggle('nav-hidden', inp.value.trim().length>0);
}
function syncBnav(){
  var nav=$('#bottomNav'); if(!nav) return;
  var inSet=state.view==='settings';
  var v=inSet? lastSetView : 'chat';
  var show=!inSet || v==='goals' || v==='memorylib';
  nav.style.display=show? 'flex' : 'none';
  document.querySelectorAll('#bottomNav [data-bnav]').forEach(function(b){
    var k=b.getAttribute('data-bnav');
    var on=(k==='chat' && !inSet) || (k==='goals' && inSet && v==='goals') || (k==='library' && inSet && v==='memorylib');
    b.classList.toggle('on', on);
  });
  var d=$('#goalsDot'); if(d) d.style.display=goalsUnread>0? 'block' : 'none';
}
$('#bnavChatIc').innerHTML=I.chat;
$('#bnavGoalsIc').innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="m8.5 12.2 2.4 2.4 4.6-5"/></svg>';
$('#bnavLibIc').innerHTML=I.library;
document.querySelectorAll('#bottomNav [data-bnav]').forEach(function(b){
  b.addEventListener('click',function(){
    var k=b.getAttribute('data-bnav');
    if(k==='chat'){ closeSettings(); }
    else if(k==='goals'){ if(state.view==='settings') renderSettings('goals'); else openSettings('goals'); }
    else if(k==='library'){
      /* Already in the Library: a second tap opens the chat menu
         over it and leaves the Library exactly as it is. */
      if(state.view==='settings' && lastSetView==='memorylib'){ setSidebar(true,true); return; }
      libReturn=(state.view==='settings')? 'list' : 'chat'; libMenuOpen=false;
      if(state.view==='settings') renderSettings('memorylib'); else openSettings('memorylib');
    }
  });
});
/* While the user is typing, the bottom menu slides away smoothly;
   it returns as soon as the composer is empty again. */
$('#chatInput').addEventListener('input',function(){
  var nav=$('#bottomNav'); if(!nav) return;
  nav.classList.toggle('nav-hidden', this.value.trim().length>0);
});
/* Composer mic: real dictation where the browser offers it. */
$('#micBtn').innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 19v3"/></svg>';
var micRec=null;
$('#micBtn').addEventListener('click',function(){
  var btn=this;
  var SR=window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ toast('Voice input is not available in this browser'); return; }
  if(micRec){ try{ micRec.stop(); }catch(e){} micRec=null; btn.classList.remove('rec'); return; }
  try{
    micRec=new SR();
    micRec.lang='en-IN'; micRec.interimResults=true;
    micRec.onresult=function(e){
      var txt='';
      for(var i=0;i<e.results.length;i++) txt+=e.results[i][0].transcript;
      var inp=$('#chatInput'); inp.value=txt;
      inp.dispatchEvent(new Event('input', {bubbles:true}));
    };
    micRec.onend=function(){ micRec=null; btn.classList.remove('rec'); };
    micRec.onerror=function(){ micRec=null; btn.classList.remove('rec'); };
    micRec.start(); btn.classList.add('rec');
  }catch(e){ micRec=null; toast('Voice input could not start'); }
});
$('#afFilePicker').addEventListener('change',function(){ afHandleUploads(this.files); this.value=''; });
$('#afImagePicker').addEventListener('change',function(){ afHandleUploads(this.files); this.value=''; });
function settingsHistory(){
  settingsSimple('History & backups', null, [['Saved chats', String(chats.length)],['Storage','This preview session']], '<button class="btn-primary" id="expBtn">Download backup (JSON)</button>', function(){
    $('#expBtn').addEventListener('click',function(){
      var blob=new Blob([JSON.stringify(chats,null,2)],{type:'application/json'});
      var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='gptopen-backup.json'; a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); },2000);
    });
  });
}
/* Accent: white by default (black / white / grey base). The user can
   pick Blue, Silver or Graphite in Appearance or the + sheet Design
   menu; --accent-ink keeps text on accent surfaces readable. */
function applyAccent(){
  var c=state.accent||'#ffffff';
  document.documentElement.style.setProperty('--accent', c);
  var hex=c.replace('#','');
  var r=parseInt(hex.substr(0,2),16), g=parseInt(hex.substr(2,2),16), b=parseInt(hex.substr(4,2),16);
  var lum=(0.2126*r+0.7152*g+0.0722*b)/255;
  document.documentElement.style.setProperty('--accent-ink', lum>0.6 ? '#0b0b0c' : '#ffffff');
}
/* =============== Boot =============== */
/* Memory covers ALL chats from the start: the messages already in
   every chat are saved to memory at boot (sanitised, like new ones). */
chats.forEach(function(c){ c.messages.forEach(function(m){ saveMemory(c, m); }); });
applyAccent();
applyAppearanceMode(state.mode);
if(window.innerWidth>=820){ app.classList.remove('sb-closed'); app.classList.add('sb-open'); }
else { sidebar.style.display='none'; }
updateApiPill();
renderAll(); updateTargetLine(); autoGrow(); updateSend(); syncBnav();

