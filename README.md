# GptOpen

**GPT that's actually OPEN — not just in the name.**

![GptOpen — The Open AI Chat](https://drive.google.com/thumbnail?id=1Cd2nH1_n7CvVwMfqXfb53npaZFvZqDBu&sz=w1200)

[![Live](https://img.shields.io/badge/live-gptopen.vercel.app-limegreen)](https://gptopen.vercel.app/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![No build](https://img.shields.io/badge/vanilla%20JS-yes-blue)](https://github.com/ItsRayZer/axo-ai)

🔴 **Live app:** https://gptopen.vercel.app/

## What is this?

GptOpen is an **agentic AI chat app** — not just a chatbot, but a place where you create AI agents, give them their own instructions and personalities, and chat with them solo or together in group chats. Fully coded from scratch.

- 🤖 **Create custom agents** — name them, design their avatar, write their instructions, give each one a different personality and job
- 👥 **Group chats** — put multiple agents in one chat and watch them discuss, react, and answer together
- 🔑 **Any API model** — Groq, OpenRouter, Gemini, Mistral, NVIDIA, DeepSeek, Kimi, or any OpenAI-compatible endpoint. Paste your own key, chat **unlimited** — the only cost is your API usage
- 🆓 **Free to try** — built-in shared models work instantly, no key needed; redeem an invite code for unlimited shared use
- 🔒 **Keys stay safe** — API keys are stored server-side via a Vercel relay, never baked into the page
- ✨ **Premium mobile-first UI** — liquid glass, dark mode, smooth animations, Markdown rendering

![GPT that's actually open](https://drive.google.com/thumbnail?id=13iSUIEmxCiMVNjB1RssYG3D0yxwmliOT&sz=w1200)

## How it works

1. Open https://gptopen.vercel.app/
2. Start chatting instantly on the free shared models, **or**
3. Paste your own API key (Groq / OpenRouter / Gemini / ...) in Settings → chat unlimited, pay only your provider
4. Create agents, give them instructions, start a group chat

![Your AI, your rules](https://drive.google.com/thumbnail?id=1uuLrwaAfKL025Mcjy9PHccnqw8sx5eVs&sz=w1200)

## Tech

Vanilla HTML/CSS/JS, zero build step. Serverless API relay on Vercel (`api/relay.js`) with automatic model failover. Deploys from `main` via the Vercel GitHub integration.

## Run it yourself

The app is a static site + one serverless function. Fork it, connect to Vercel, add your API keys as environment variables, deploy.

## License

MIT — Copyright (c) 2026 Aben Sojan. Build on it.
