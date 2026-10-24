/* ============================================================================
   AXO CHAT — drop-in AI chatbot widget for any website.
   No build step. No framework. One <script> tag and you are live.

   Usage:
     <script src="dist/axo-chat.js"></script>
   Customise with window.AXO_CONFIG (see axo.config.js) or data-attributes:
     <script src="dist/axo-chat.js" data-bot-name="ShopBot"
             data-accent-color="#e91e63" data-theme="dark"></script>

   Modes: demo (no key, FAQ brain) · openai · gemini · custom endpoint.
   An API key entered in the widget settings is stored ONLY in the visitor's
   own browser (localStorage) and sent ONLY to the configured provider.
   MIT License — free for personal and commercial use.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------- defaults ---------------- */
  var DEFAULTS = {
    botName: 'Axo',
    botAvatar: '🤖',
    welcomeMessage: "Hi! I'm Axo — ask me anything about this website.",
    launcherLabel: 'Chat with us',
    theme: 'auto',
    accentColor: '#7c5cff',
    position: 'bottom-right',
    width: 380,
    suggestions: ['What do you offer?', 'What are your prices?', 'How can I contact you?'],
    faq: [],
    fallbackMessage: "I don't have an answer for that yet — leave your contact details here and the team will get back to you.",
    provider: 'demo',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    endpoint: '',
    systemPrompt: 'You are Axo, a friendly and helpful assistant for this website. Answer briefly and honestly. If you do not know something, say so.',
    persistHistory: true,
    typingDelayMs: 700,
    maxHistory: 50,
    showResetButton: true,
    showSettingsButton: true,
    showPoweredBy: true
  };

  /* ---------------- config resolution ---------------- */
  function mergeConfig() {
    var cfg = {};
    Object.keys(DEFAULTS).forEach(function (k) { cfg[k] = DEFAULTS[k]; });
    var user = window.AXO_CONFIG || {};
    Object.keys(user).forEach(function (k) { cfg[k] = user[k]; });
    // data-attributes on the <script> tag win over everything
    var script = document.currentScript;
    if (script && script.dataset) {
      var d = script.dataset;
      if (d.botName) cfg.botName = d.botName;
      if (d.botAvatar) cfg.botAvatar = d.botAvatar;
      if (d.theme) cfg.theme = d.theme;
      if (d.accentColor) cfg.accentColor = d.accentColor;
      if (d.position) cfg.position = d.position;
      if (d.apiKey) cfg.apiKey = d.apiKey;
      if (d.provider) cfg.provider = d.provider;
      if (d.model) cfg.model = d.model;
    }
    // visitor's own saved settings (theme, key, name) override file config
    try {
      var saved = JSON.parse(localStorage.getItem('axo-chat-settings') || '{}');
      Object.keys(saved).forEach(function (k) { if (saved[k] !== '') cfg[k] = saved[k]; });
    } catch (e) { /* private mode — ignore */ }
    return cfg;
  }

  var cfg = mergeConfig();
  var HISTORY_KEY = 'axo-chat-history';
  var messages = []; // {role: 'user'|'bot', text, time}

  /* ---------------- helpers ---------------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function renderText(s) {
    var h = esc(s);
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    return h.replace(/\n/g, '<br>');
  }
  function saveHistory() {
    if (!cfg.persistHistory) return;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-cfg.maxHistory))); } catch (e) {}
  }
  function loadHistory() {
    if (!cfg.persistHistory) return;
    try { messages = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { messages = []; }
  }
  function isApiMode() {
    return cfg.apiKey && cfg.provider !== 'demo';
  }

  /* ---------------- demo brain ---------------- */
  function demoAnswer(input) {
    var text = input.toLowerCase();
    var best = null, bestScore = 0;
    (cfg.faq || []).forEach(function (entry) {
      var score = 0;
      (entry.keywords || []).forEach(function (kw) {
        if (text.indexOf(kw.toLowerCase()) !== -1) score += kw.length;
      });
      if (score > bestScore) { bestScore = score; best = entry; }
    });
    return best ? best.answer : cfg.fallbackMessage;
  }

  /* ---------------- AI providers ---------------- */
  function apiMessages() {
    var out = [{ role: 'system', content: cfg.systemPrompt }];
    messages.filter(function (m) { return m.role !== 'system'; }).slice(-20).forEach(function (m) {
      out.push({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text });
    });
    return out;
  }
  function openAiReply() {
    var base = (cfg.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    return fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({ model: cfg.model, messages: apiMessages() })
    }).then(function (r) {
      if (!r.ok) throw new Error('API error ' + r.status);
      return r.json();
    }).then(function (j) {
      return j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : 'No reply received.';
    });
  }
  function geminiReply() {
    var contents = apiMessages().filter(function (m) { return m.role !== 'system'; }).map(function (m) {
      return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] };
    });
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(cfg.model) + ':generateContent?key=' + encodeURIComponent(cfg.apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_instruction: { parts: [{ text: cfg.systemPrompt }] }, contents: contents })
    }).then(function (r) {
      if (!r.ok) throw new Error('API error ' + r.status);
      return r.json();
    }).then(function (j) {
      var c = j.candidates && j.candidates[0];
      return c && c.content && c.content.parts ? c.content.parts.map(function (p) { return p.text; }).join('') : 'No reply received.';
    });
  }
  function customReply() {
    return fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages() })
    }).then(function (r) {
      if (!r.ok) throw new Error('API error ' + r.status);
      return r.json();
    }).then(function (j) {
      return j.reply || j.answer || j.message || (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || 'No reply received.';
    });
  }
  function getReply(input) {
    if (!isApiMode()) {
      return new Promise(function (res) {
        setTimeout(function () { res(demoAnswer(input)); }, cfg.typingDelayMs);
      });
    }
    if (cfg.provider === 'gemini') return geminiReply();
    if (cfg.provider === 'custom') return customReply();
    return openAiReply();
  }

  /* ---------------- DOM ---------------- */
  var root, panel, log, input, sendBtn, typingEl;

  function buildDom() {
    root = document.createElement('div');
    root.id = 'axo-chat-root';
    root.className = 'axo-pos-' + cfg.position + ' axo-theme-' + cfg.theme;
    root.style.setProperty('--axo-accent', cfg.accentColor);
    root.style.setProperty('--axo-width', cfg.width + 'px');

    var launcher = document.createElement('button');
    launcher.className = 'axo-launcher';
    launcher.title = cfg.launcherLabel;
    launcher.setAttribute('aria-label', cfg.launcherLabel);
    launcher.innerHTML = '<span class="axo-launcher-icon">' + esc(cfg.botAvatar) + '</span>';
    launcher.addEventListener('click', togglePanel);
    root.appendChild(launcher);

    panel = document.createElement('div');
    panel.className = 'axo-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', cfg.botName + ' chat');
    panel.innerHTML =
      '<div class="axo-header">' +
        '<span class="axo-avatar">' + esc(cfg.botAvatar) + '</span>' +
        '<span class="axo-title"><strong>' + esc(cfg.botName) + '</strong>' +
        '<small><span class="axo-dot"></span>' + (isApiMode() ? 'AI online' : 'Online · no key needed') + '</small></span>' +
        '<span class="axo-actions">' +
          (cfg.showResetButton ? '<button class="axo-icon-btn" data-act="reset" title="Reset chat" aria-label="Reset chat">↺</button>' : '') +
          (cfg.showSettingsButton ? '<button class="axo-icon-btn" data-act="settings" title="Settings" aria-label="Settings">⚙</button>' : '') +
          '<button class="axo-icon-btn" data-act="close" title="Close" aria-label="Close">✕</button>' +
        '</span>' +
      '</div>' +
      '<div class="axo-log"></div>' +
      '<div class="axo-suggestions"></div>' +
      '<div class="axo-settings" hidden></div>' +
      '<form class="axo-form">' +
        '<input class="axo-input" type="text" placeholder="Type your message…" aria-label="Type your message" autocomplete="off" />' +
        '<button class="axo-send" type="submit" aria-label="Send">➤</button>' +
      '</form>' +
      (cfg.showPoweredBy ? '<div class="axo-footer">Powered by <a href="https://github.com/ItsRayZer/axo-ai" target="_blank" rel="noopener">Axo Chat</a></div>' : '');
    root.appendChild(panel);

    log = panel.querySelector('.axo-log');
    input = panel.querySelector('.axo-input');
    sendBtn = panel.querySelector('.axo-send');

    panel.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var act = btn.getAttribute('data-act');
        if (act === 'close') togglePanel(false);
        if (act === 'reset') resetChat(true);
        if (act === 'settings') toggleSettings();
      });
    });
    panel.querySelector('.axo-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (text) { sendUser(text); input.value = ''; }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('axo-open')) togglePanel(false);
    });

    document.body.appendChild(root);
    renderSuggestions();
  }

  function renderSuggestions() {
    var box = panel.querySelector('.axo-suggestions');
    box.innerHTML = '';
    (cfg.suggestions || []).forEach(function (s) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'axo-chip';
      chip.textContent = s;
      chip.addEventListener('click', function () { sendUser(s); });
      box.appendChild(chip);
    });
  }

  function togglePanel(force) {
    var open = typeof force === 'boolean' ? force : !panel.classList.contains('axo-open');
    panel.classList.toggle('axo-open', open);
    if (open) { input.focus(); if (messages.length === 0) addBot(cfg.welcomeMessage, true); }
  }

  function addMsg(role, text, save) {
    var div = document.createElement('div');
    div.className = 'axo-msg axo-' + role;
    div.innerHTML = '<div class="axo-bubble">' + renderText(text) + '</div>';
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    messages.push({ role: role, text: text, time: Date.now() });
    if (save !== false) saveHistory();
  }
  function addBot(text, save) { addMsg('bot', text, save); }

  function showTyping() {
    typingEl = document.createElement('div');
    typingEl.className = 'axo-msg axo-bot axo-typing';
    typingEl.innerHTML = '<div class="axo-bubble"><span></span><span></span><span></span></div>';
    log.appendChild(typingEl);
    log.scrollTop = log.scrollHeight;
  }
  function hideTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }

  function sendUser(text) {
    addMsg('user', text);
    showTyping();
    getReply(text).then(function (reply) {
      hideTyping();
      addBot(reply);
    }).catch(function (err) {
      hideTyping();
      addBot('Something went wrong reaching the AI (' + esc(err.message) + '). Check the API key in Settings, or try again — demo answers still work without a key.');
    });
  }

  function resetChat(announce) {
    messages = [];
    try { localStorage.removeItem(HISTORY_KEY); } catch (e) {}
    log.innerHTML = '';
    if (announce) addBot(cfg.welcomeMessage);
    renderSuggestions();
  }

  function toggleSettings() {
    var box = panel.querySelector('.axo-settings');
    var open = box.hasAttribute('hidden');
    if (!open) { box.setAttribute('hidden', ''); return; }
    box.removeAttribute('hidden');
    box.innerHTML =
      '<label>Bot name <input data-set="botName" value="' + esc(cfg.botName) + '"></label>' +
      '<label>Theme <select data-set="theme">' +
        '<option value="auto"' + (cfg.theme === 'auto' ? ' selected' : '') + '>Auto</option>' +
        '<option value="light"' + (cfg.theme === 'light' ? ' selected' : '') + '>Light</option>' +
        '<option value="dark"' + (cfg.theme === 'dark' ? ' selected' : '') + '>Dark</option>' +
      '</select></label>' +
      '<label>Accent colour <input data-set="accentColor" type="color" value="' + esc(cfg.accentColor) + '"></label>' +
      '<label>Provider <select data-set="provider">' +
        '<option value="demo"' + (cfg.provider === 'demo' ? ' selected' : '') + '>Demo (no key)</option>' +
        '<option value="openai"' + (cfg.provider === 'openai' ? ' selected' : '') + '>OpenAI-compatible</option>' +
        '<option value="gemini"' + (cfg.provider === 'gemini' ? ' selected' : '') + '>Google Gemini</option>' +
        '<option value="custom"' + (cfg.provider === 'custom' ? ' selected' : '') + '>Custom endpoint</option>' +
      '</select></label>' +
      '<label>API key <input data-set="apiKey" type="password" placeholder="Leave empty for demo mode" value="' + esc(cfg.apiKey) + '"></label>' +
      '<label>Model <input data-set="model" value="' + esc(cfg.model) + '"></label>' +
      '<p class="axo-note">Your key stays in this browser only. It is sent only to the provider you chose.</p>' +
      '<button type="button" class="axo-save">Save settings</button>' +
      '<button type="button" class="axo-reset-all">Reset everything</button>';
    box.querySelector('.axo-save').addEventListener('click', function () {
      var saved = {};
      box.querySelectorAll('[data-set]').forEach(function (el) { saved[el.getAttribute('data-set')] = el.value; });
      try { localStorage.setItem('axo-chat-settings', JSON.stringify(saved)); } catch (e) {}
      location.reload();
    });
    box.querySelector('.axo-reset-all').addEventListener('click', function () {
      try { localStorage.removeItem('axo-chat-settings'); localStorage.removeItem(HISTORY_KEY); } catch (e) {}
      location.reload();
    });
  }

  /* ---------------- boot ---------------- */
  function init() {
    // auto-load the stylesheet sitting next to this script
    try {
      var scripts = document.getElementsByTagName('script');
      for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].getAttribute('src') || '';
        if (src.indexOf('axo-chat.js') !== -1) {
          var link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = src.replace('axo-chat.js', 'axo-chat.css');
          document.head.appendChild(link);
          break;
        }
      }
    } catch (e) {}
    loadHistory();
    buildDom();
    // restore previous conversation if any
    messages.slice().forEach(function (m) {
      var div = document.createElement('div');
      div.className = 'axo-msg axo-' + m.role;
      div.innerHTML = '<div class="axo-bubble">' + renderText(m.text) + '</div>';
      log.appendChild(div);
    });
    if (messages.length) log.scrollTop = log.scrollHeight;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
