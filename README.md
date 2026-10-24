# 🤖 Axo Chat

**A drop-in AI chatbot template for any website — no API key required, fully customizable.**

Axo Chat is a lightweight, dependency-free chatbot widget you can add to any website with a single script tag. It works out of the box with **no API key** (a built-in FAQ brain answers visitors), and the site owner — or any visitor — can paste their own API key any time to switch to real AI answers from OpenAI-compatible APIs or Google Gemini.

![License](https://img.shields.io/badge/license-MIT-green) ![No build](https://img.shields.io/badge/build-none-brightgreen) ![Size](https://img.shields.io/badge/vanilla%20JS-yes-blue)

## ✨ Features

- 🔑 **Works with NO API key** — smart FAQ brain with keyword matching
- 🧠 **Real AI on demand** — OpenAI-compatible APIs, Google Gemini, or your own backend endpoint
- 🎨 **Fully customizable** — bot name, avatar, colours, theme (light / dark / auto), position, welcome message, suggested questions, system prompt
- ↺ **Reset chat** — visitors can clear the conversation or wipe everything (settings + history)
- 💾 **History that respects privacy** — stored only in the visitor's browser, never on a server
- 📱 **Mobile-first, responsive** — clean panel that feels native on phones and desktops
- ⚡ **Zero dependencies, zero build** — plain HTML/CSS/JS, works on any static site
- ♿ **Accessible** — keyboard friendly, Esc closes, ARIA labels

## 🚀 Quick start (30 seconds)

1. Copy `axo.config.js` and the `dist/` folder into your website.
2. Paste this before `</body>`:

```html
<script src="axo.config.js"></script>
<script src="dist/axo-chat.js"></script>
```

3. Done! Edit `axo.config.js` to make it yours.

No config file? This alone works with sensible defaults:

```html
<script src="dist/axo-chat.js" data-bot-name="ShopBot" data-accent-color="#e91e63" data-theme="dark"></script>
```

## ⚙️ Customization

Everything lives in **`axo.config.js`** (fully commented). The highlights:

| Option | What it does | Default |
|---|---|---|
| `botName` | Name shown in the chat header | `"Axo"` |
| `botAvatar` | Emoji or image URL in the header/launcher | `"🤖"` |
| `theme` | `"light"`, `"dark"`, or `"auto"` (follows device) | `"auto"` |
| `accentColor` | Buttons, links, highlights | `"#7c5cff"` |
| `position` | `"bottom-right"` or `"bottom-left"` | `"bottom-right"` |
| `welcomeMessage` | First message visitors see | — |
| `suggestions` | Suggested question chips | — |
| `faq` | The no-API-key brain: `{ keywords: [...], answer: "..." }` | — |
| `provider` | `"demo"`, `"openai"`, `"gemini"`, `"custom"` | `"demo"` |
| `apiKey` | Your key (or leave empty for demo mode) | `""` |
| `baseUrl` | OpenAI-compatible endpoint | `https://api.openai.com/v1` |
| `model` | Model name | `"gpt-4o-mini"` |
| `systemPrompt` | Instructions for the AI | — |
| `persistHistory` | Remember chat in the visitor's browser | `true` |
| `showResetButton` / `showSettingsButton` | Show the ↺ and ⚙ buttons | `true` |

Visitors can also change the bot name, theme, colour, provider and API key themselves from the **⚙ Settings panel inside the chat** — those choices save to their own browser only.

## 🧠 How the modes work

| Mode | Needs a key? | How it answers |
|---|---|---|
| `demo` | ❌ No | Keyword-matches your `faq` list, greets visitors, suggests questions |
| `openai` | ✅ Yes | Any OpenAI-compatible chat API (OpenAI, Groq, Together, Ollama…) |
| `gemini` | ✅ Yes | Google Gemini (`generativelanguage.googleapis.com`) |
| `custom` | Depends | POSTs `{ messages }` to your own `endpoint`; reads `reply`, `answer`, `message`, or OpenAI-style `choices[0].message.content` |

> 🔒 **Privacy note:** a key typed into the widget settings is stored ONLY in that visitor's browser (`localStorage`) and sent ONLY to the provider you configured. There is no Axo server. For production sites, prefer the `custom` provider with your own backend so your key never appears in page source.

## 📁 Project structure

```
axo-chat/
├── index.html            # live demo page
├── axo.config.js         # 👈 edit this to customise everything
├── dist/
│   ├── axo-chat.js       # the widget (auto-loads the CSS next to it)
│   └── axo-chat.css      # widget styles (override in your own CSS if you like)
├── examples/
│   ├── basic-embed.html  # minimal embed with data-attributes
│   └── with-api-key.html # wiring a real AI provider
└── LICENSE               # MIT
```

## 🛠️ For developers

- No bundler, no npm install, no framework — open `index.html` in a browser and it works.
- Want to change behaviour? The widget is one readable file (`dist/axo-chat.js`, ~450 lines): config resolution, demo brain, providers, and DOM are clearly separated.
- Found a bug or want a feature? Open an issue or a pull request — contributions welcome.

## 📄 License

MIT — free for personal and commercial use. See [LICENSE](LICENSE).

## 👤 Author

Built by **Aben Sojan (RayZer)** — Founder & Developer at [Axofy](https://axofy.shop), building [MacHub](https://github.com/ItsRayZer/MacHub) and more.
Portfolio: [abensojan.vercel.app](https://abensojan.vercel.app) · GitHub: [@ItsRayZer](https://github.com/ItsRayZer)
