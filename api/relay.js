// api/relay.js — Vercel serverless function. This file runs ONLY
// on the server; it is not part of the web page and the browser
// never sees it or the keys.
//
// The keys live in Vercel environment variables, server-side.
// Every provider is read under the variable name it was added
// with, and the standard name works as a fallback too — no
// renaming is ever needed:
//   GROQ_API_KEY          — Groq          (api.groq.com/openai/v1)
//   OPENROUTER_API_KEY    — OpenRouter    (openrouter.ai/api/v1)
//   GEMINI_API_KEY        — Google Gemini (fallback: GOOGLE_API_KEY)
//   HUGGINGFACE_API_KEY   — Hugging Face  (fallback: HF_TOKEN)
//   DEEPSEEK_API_KEY      — DeepSeek      (api.deepseek.com/v1)
//   CHATGPT_API_KEY       — OpenAI        (fallback: OPENAI_API_KEY)
//   MISTRAL_API_KEY       — Mistral       (api.mistral.ai/v1)
//   MISTRAL2_API_KEY      — Mistral, second key: used automatically
//                           when MISTRAL_API_KEY hits its limit (429)
//   MISTRAL_AGENT_ID      — Mistral Agent id (ag_…) — optional; when
//                           set, EVERY relay user's Mistral chats use
//                           that saved agent automatically (Agents API)
//   KIMI_API_KEY          — Kimi / Moonshot AI (fallback: MOONSHOT_API_KEY)
//   TOGETHER_API_KEY      — Together      (api.together.xyz/v1)
//   COHERE_API_KEY        — Cohere        (api.cohere.com/compatibility/v1)
//   GITHUB_TOKEN          — GitHub Models (fallback: GH_TOKEN)
//   NVIDIA_API_KEY        — NVIDIA NIM    (integrate.api.nvidia.com/v1)
//   ANTHROPIC_API_KEY     — Anthropic     (fallback: CLAUDE_API_KEY)
//   XAI_API_KEY           — xAI           (api.x.ai/v1)
// Set the ones you have in Vercel -> Project -> Settings ->
// Environment Variables (Production), then redeploy. The app calls
// POST /api/relay with { provider, model, messages } and NO key;
// this function adds the matching key here, on the server, and
// forwards the call. Gemini and Anthropic replies are converted
// back to the OpenAI shape the app reads; every other reply
// passes untouched. When a provider has more than one key set
// (Mistral, or a name + its fallback holding different keys), a
// 429 from one key tries the next key automatically.

const PROVIDERS = {
  groq:        { base: 'https://api.groq.com/openai/v1', envs: ['GROQ_API_KEY'] },
  openrouter:  { base: 'https://openrouter.ai/api/v1', envs: ['OPENROUTER_API_KEY'] },
  gemini:      { base: 'https://generativelanguage.googleapis.com/v1beta', envs: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'], gemini: true },
  huggingface: { base: 'https://router.huggingface.co/v1', envs: ['HUGGINGFACE_API_KEY', 'HF_TOKEN'] },
  deepseek:    { base: 'https://api.deepseek.com/v1', envs: ['DEEPSEEK_API_KEY'] },
  openai:      { base: 'https://api.openai.com/v1', envs: ['CHATGPT_API_KEY', 'OPENAI_API_KEY'] },
  mistral:     { base: 'https://api.mistral.ai/v1', envs: ['MISTRAL_API_KEY', 'MISTRAL2_API_KEY'] },
  kimi:        { base: 'https://api.moonshot.ai/v1', envs: ['KIMI_API_KEY', 'MOONSHOT_API_KEY'] },
  together:    { base: 'https://api.together.xyz/v1', envs: ['TOGETHER_API_KEY'] },
  cohere:      { base: 'https://api.cohere.com/compatibility/v1', envs: ['COHERE_API_KEY'] },
  github:      { base: 'https://models.github.ai/inference', envs: ['GITHUB_TOKEN', 'GH_TOKEN'] },
  nvidia:      { base: 'https://integrate.api.nvidia.com/v1', envs: ['NVIDIA_API_KEY'] },
  anthropic:   { base: 'https://api.anthropic.com/v1', envs: ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY'], anthropic: true },
  xai:         { base: 'https://api.x.ai/v1', envs: ['XAI_API_KEY'] }
};

function keysFor(p) {
  const out = [];
  (p.envs || []).forEach((name) => {
    const v = process.env[name];
    if (v && out.indexOf(v) < 0) out.push(v);
  });
  return out;
}

export default async function handler(req, res) {
  // Every response from this function carries this header, so the
  // app can positively tell a LIVE relay apart from a site where
  // api/relay was never deployed (whose 404 page has neither the
  // header nor a JSON body).
  res.setHeader('X-Axo-Relay', '1');
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'POST only' } });
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const p = PROVIDERS[body.provider];
    if (!p) {
      res.status(400).json({ error: { message: 'Unknown provider' } });
      return;
    }
    const keys = keysFor(p);
    if (!keys.length) {
      res.status(501).json({ error: { message: 'None of ' + p.envs.join(' / ') + ' is set on the server' } });
      return;
    }
    const messages = body.messages || [];

    async function attempt(key) {
      // Mistral Agent — automatic: the app's own agent_id wins,
      // otherwise the server's MISTRAL_AGENT_ID is used, so every
      // relay user gets the agent with nothing to set.
      if (body.provider === 'mistral') {
        const agentId = body.agent_id || process.env.MISTRAL_AGENT_ID || '';
        if (/^ag_/.test(agentId)) {
          const up = await fetch(p.base + '/agents/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
            body: JSON.stringify({ agent_id: agentId, messages })
          });
          return { status: up.status, text: await up.text() };
        }
      }
      // Gemini speaks its own format: convert in, convert back out.
      if (p.gemini) {
        const systems = [], convo = [];
        messages.forEach((m) => {
          if (m.role === 'system') systems.push(m.content);
          else convo.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content || '') }] });
        });
        const gBody = { contents: convo, generationConfig: { temperature: body.temperature, maxOutputTokens: body.max_tokens } };
        if (systems.length) gBody.systemInstruction = { parts: [{ text: systems.join('\n\n---\n\n') }] };
        const up = await fetch(p.base + '/models/' + encodeURIComponent(body.model || 'gemini-2.5-flash') + ':generateContent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify(gBody)
        });
        const j = await up.json().catch(() => null);
        if (!up.ok) return { status: up.status, json: j || { error: { message: 'Gemini error' } } };
        const cand = j && j.candidates && j.candidates[0];
        const text = cand && cand.content ? (cand.content.parts || []).map((pt) => pt.text || '').join('') : '';
        return { status: 200, json: { choices: [{ message: { content: text }, finish_reason: cand && /MAX_TOKENS/i.test(cand.finishReason || '') ? 'length' : 'stop' }], usage: j && j.usageMetadata ? { prompt_tokens: j.usageMetadata.promptTokenCount || 0, completion_tokens: j.usageMetadata.candidatesTokenCount || 0 } : undefined } };
      }
      // Anthropic speaks its own format too: convert in and out.
      if (p.anthropic) {
        const systems = [], convo = [];
        messages.forEach((m) => {
          if (m.role === 'system') systems.push(m.content);
          else convo.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '') });
        });
        const aBody = { model: body.model || 'claude-sonnet-4-5', messages: convo, temperature: body.temperature, max_tokens: body.max_tokens || 2048 };
        if (systems.length) aBody.system = systems.join('\n\n---\n\n');
        const up = await fetch(p.base + '/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify(aBody)
        });
        const j = await up.json().catch(() => null);
        if (!up.ok) return { status: up.status, json: j || { error: { message: 'Anthropic error' } } };
        const text = (j && Array.isArray(j.content)) ? j.content.map((b) => (b && b.type === 'text') ? (b.text || '') : '').join('') : '';
        return { status: 200, json: { choices: [{ message: { content: text }, finish_reason: j && j.stop_reason === 'max_tokens' ? 'length' : 'stop' }], usage: j && j.usage ? { prompt_tokens: j.usage.input_tokens || 0, completion_tokens: j.usage.output_tokens || 0 } : undefined } };
      }
      const up = await fetch(p.base + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ model: body.model, messages, temperature: body.temperature, max_tokens: body.max_tokens })
      });
      return { status: up.status, text: await up.text() };
    }

    // Try each configured key in order; a 429 (limit over) moves
    // on to the next key — e.g. MISTRAL_API_KEY, then
    // MISTRAL2_API_KEY — and only the last result is returned.
    let last = null;
    for (let i = 0; i < keys.length; i++) {
      last = await attempt(keys[i]);
      if (last.status !== 429) break;
    }
    res.status(last.status);
    res.setHeader('Content-Type', 'application/json');
    if (last.json !== undefined) {
      const j = last.json || {};
      // Mark relayed provider errors as relay answers: a provider
      // 404/429/501 passing through must never be mistaken by the
      // app for "no relay deployed on this site".
      if (last.status >= 400 && !j.relay) j.relay = true;
      res.json(j);
    } else {
      // ALWAYS answer JSON: pass provider JSON through untouched,
      // and wrap anything else (e.g. a provider HTML error page)
      // as JSON, so the app can always tell this function answered.
      let parsed = null;
      try { parsed = JSON.parse(last.text); } catch (e) {}
      if (parsed) res.json(parsed);
      else res.json({ relay: true, error: { message: String(last.text || 'Provider error').slice(0, 300) } });
    }
  } catch (e) {
    res.setHeader('X-Axo-Relay', '1');
    res.status(502).json({ relay: true, error: { message: 'Relay failed: ' + ((e && e.message) || 'network error') } });
  }
}
