// api/relay.js — Vercel serverless function. This file runs ONLY
// on the server; it is not part of the web page and the browser
// never sees it or the keys. It powers the ONE built-in model the
// app shows — the Gptopen Model.
//
// The keys live in Vercel environment variables, server-side.
// The Gptopen Model has exactly TWO default providers — Groq
// and OpenRouter. Every other default provider was removed by
// the owner's decision. Set both in Vercel -> Project ->
// Settings -> Environment Variables (Production), then redeploy:
//   GROQ_API_KEY          — Groq          (api.groq.com/openai/v1)
//   OPENROUTER_API_KEY    — OpenRouter    (openrouter.ai/api/v1)
//
// MODELS — live-verified through this relay on 2026-10-29 with
// the app's real request shape (the previous defaults had been
// retired by the providers, which is why the Gptopen Model
// "didn't answer" even with working keys):
// - Groq: openai/gpt-oss-120b and openai/gpt-oss-20b answer on
//   the server key. llama-3.1-8b-instant, llama-3.3-70b-versatile,
//   qwen/qwen3-32b, kimi-k2 and llama-4-scout all returned
//   model_not_found; gemma2-9b-it is decommissioned.
// - OpenRouter: every named :free model tried had been retired
//   or paywalled (qwen3-next:free, deepseek-r1:free,
//   deepseek-chat:free, qwen3-coder:free, kimi-k2:free,
//   glm-4.5-air:free, gemma-3:free, llama-3.2/3.3:free — all
//   404). What answers: 'openrouter/free', OpenRouter's own
//   free-model router, and nvidia/nemotron-3.5-super-vl:free.
//   RE-VERIFIED later on 2026-10-29: the router is a roulette —
//   it landed on a content-safety classifier that answered
//   "User Safety: safe" instead of chatting — so the DEFAULT is
//   now the pinned, verified chat model
//   nvidia/nemotron-3.5-super-vl:free, and 'openrouter/free' is
//   only the fallback (the app rejects classifier-style
//   non-answers and moves on).
//
// WHY IT COULD FAIL BEFORE, AND WHAT THIS VERSION DOES ABOUT EACH:
// - Variable set for Preview only, or not set at all -> that
//   provider answers 501 and the app moves on to the other one;
//   set it for Production and redeploy (env vars never apply
//   retroactively).
// - A provider retired the model name the app asked for -> each
//   provider carries server-side FALLBACK models: a model error
//   (400/404 naming the model) retries the next model
//   automatically, then the app also gets a final
//   { provider: 'auto' } sweep (below) that ignores the
//   requested model entirely.
// - One key at its limit or rejected -> the NEXT key for that
//   provider is tried (429 / 401 / 403 move to the next key).
// - A provider hanging forever -> every upstream call has a 25s
//   timeout, so a dead route fails fast and failover proceeds.
// - POST /api/relay with { provider: 'auto', messages } -> the
//   server itself walks Groq, then OpenRouter, with its default
//   + fallback models, and returns the first real answer — the
//   app's last-resort call.
// - GET /api/relay answers { relay: true, ok: true } so the
//   deployment can be checked in a browser.
// Both providers speak the OpenAI chat shape, so replies pass
// through untouched.

const PROVIDERS = {
  groq:        { base: 'https://api.groq.com/openai/v1', envs: ['GROQ_API_KEY'] },
  openrouter:  { base: 'https://openrouter.ai/api/v1', envs: ['OPENROUTER_API_KEY'] }
};
const DEFAULT_MODEL = {
  groq: 'openai/gpt-oss-120b', openrouter: 'nvidia/nemotron-3.5-super-vl:free'
};
const FALLBACKS = {
  groq: ['openai/gpt-oss-20b'],
  openrouter: ['openrouter/free']
};
const AUTO_ORDER = ['groq', 'openrouter'];

function keysFor(p) {
  const out = [];
  (p.envs || []).forEach((name) => {
    const v = process.env[name];
    if (v && out.indexOf(v) < 0) out.push(v);
  });
  return out;
}
async function fetchT(url, opts) {
  const ctl = new AbortController();
  const t = setTimeout(() => { try { ctl.abort(); } catch (e) {} }, 25000);
  try { return await fetch(url, Object.assign({}, opts, { signal: ctl.signal })); }
  finally { clearTimeout(t); }
}

async function attempt(p, key, model, body) {
  const messages = body.messages || [];
  // Both providers speak the OpenAI chat shape — one code path.
  // Groq hardening: Groq's endpoint is picky about repeated
  // system messages, so all system context is merged into ONE
  // system message at the head before the call (the app sends
  // several: persona, memory, reaction rules).
  let sendMessages = messages;
  if (p === PROVIDERS.groq) {
    const sys = [], rest = [];
    messages.forEach((m) => { if (m && m.role === 'system') sys.push(String(m.content || '')); else rest.push(m); });
    if (sys.length > 1) sendMessages = [{ role: 'system', content: sys.join('\n\n---\n\n') }].concat(rest);
  }
  const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key };
  if (p === PROVIDERS.openrouter) { headers['HTTP-Referer'] = 'https://gptopen.vercel.app'; headers['X-Title'] = 'Gptopen'; }
  const up = await fetchT(p.base + '/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages: sendMessages, temperature: body.temperature, max_tokens: body.max_tokens })
  });
  return { status: up.status, text: await up.text() };
}

function resultText(r) {
  if (!r) return '';
  if (r.text) return r.text;
  try { return JSON.stringify(r.json || ''); } catch (e) { return ''; }
}
function isModelError(status, text) {
  return (status === 400 || status === 404 || status === 422) && /model|not[ _-]?found|deprecated|does not exist/i.test(text || '');
}
function hasAnswer(r) {
  if (!r || r.status < 200 || r.status >= 300) return false;
  let j = r.json;
  if (!j && r.text) { try { j = JSON.parse(r.text); } catch (e) {} }
  if (!j) return false;
  const ch = j.choices && j.choices[0];
  return !!((ch && ch.message && (ch.message.content || ch.message.reasoning_content)) || (ch && ch.text) || j.output_text);
}

/* One provider, every way it can answer: each configured key,
   and for each key the requested model, the provider default,
   then its fallback models. A model error moves to the next
   model; a limit / rejected key (429 / 401 / 403) moves to the
   next key; any other error is returned as-is. */
async function runProvider(name, body) {
  const p = PROVIDERS[name];
  if (!p) return null;
  const keys = keysFor(p);
  if (!keys.length) return { status: 501, json: { relay: true, error: { message: 'None of ' + p.envs.join(' / ') + ' is set on the server' } } };
  const models = [], seen = {};
  [body.model, DEFAULT_MODEL[name]].concat(FALLBACKS[name] || []).forEach((m) => { if (m && !seen[m]) { seen[m] = 1; models.push(m); } });
  let last = null;
  for (let ki = 0; ki < keys.length; ki++) {
    for (let mi = 0; mi < models.length; mi++) {
      last = await attempt(p, keys[ki], models[mi], body);
      if (last.status >= 200 && last.status < 300) return last;
      if (isModelError(last.status, resultText(last))) continue;
      if (last.status === 429 || last.status === 401 || last.status === 403) break;
      return last;
    }
  }
  return last;
}

/* The auto sweep: walk the two default providers whose variable
   is set (Groq, then OpenRouter) and return the first real
   answer. */
async function runAuto(body) {
  let last = null;
  for (let i = 0; i < AUTO_ORDER.length; i++) {
    const name = AUTO_ORDER[i];
    if (!keysFor(PROVIDERS[name]).length) continue;
    const r = await runProvider(name, Object.assign({}, body, { model: '' }));
    if (hasAnswer(r)) return r;
    if (r) last = r;
  }
  return last || { status: 501, json: { relay: true, error: { message: 'No provider keys are set on the server' } } };
}

export default async function handler(req, res) {
  // Every response from this function carries this header, so the
  // app can positively tell a LIVE relay apart from a site where
  // api/relay was never deployed (whose 404 page has neither the
  // header nor a JSON body).
  res.setHeader('X-Axo-Relay', '1');
  if (req.method === 'GET') {
    // Health check: open /api/relay in a browser to prove the
    // function is deployed. (No key information is ever shown.)
    res.status(200).json({ relay: true, ok: true });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ relay: true, error: { message: 'POST only' } });
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    let last = null;
    if (body.provider === 'auto') {
      last = await runAuto(body);
    } else {
      if (!PROVIDERS[body.provider]) {
        res.status(400).json({ relay: true, error: { message: 'Unknown provider' } });
        return;
      }
      last = await runProvider(body.provider, body);
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
