/* ============================================================================
   AXO CHAT — configuration file
   ----------------------------------------------------------------------------
   Copy this file next to your page (or paste its contents into a <script>
   tag before axo-chat.js) and edit anything you like. Every option below is
   optional — Axo Chat works with the defaults and NO api key at all.

   HOW THE MODES WORK
   - "demo" (default): no API key needed. Axo answers from your `faq` list
     below using keyword matching, greets visitors, and suggests questions.
     Perfect for a website that just needs a helpful assistant on day one.
   - "openai": uses any OpenAI-compatible chat API (OpenAI, Groq, Together,
     Ollama, ...). Set `apiKey`, `baseUrl` and `model`.
   - "gemini": uses Google Gemini. Set `apiKey` and `model`.
   - "custom": POSTs to your own `endpoint` (see below).

   PRIVACY: an API key typed into the widget settings panel is stored ONLY
   in that visitor's own browser (localStorage). It is never sent to Axo or
   to any server except the provider you configured.
   ========================================================================== */

window.AXO_CONFIG = {

  /* ---- Identity: what visitors see -------------------------------------- */
  botName: "Axo",
  botAvatar: "🤖",                 // emoji, or a URL to an image
  welcomeMessage: "Hi! I'm Axo — ask me anything about this website. I can help with prices, timings, services and more.",
  launcherLabel: "Chat with us",   // tooltip on the floating button

  /* ---- Look & feel -------------------------------------------------------- */
  theme: "auto",                   // "light" | "dark" | "auto" (follows device)
  accentColor: "#7c5cff",          // buttons, links, highlights
  position: "bottom-right",        // "bottom-right" | "bottom-left"
  width: 380,                      // panel width in px (max 92vw on mobile)

  /* ---- Suggested question chips shown under the welcome message ---------- */
  suggestions: [
    "What do you offer?",
    "What are your prices?",
    "What are your opening hours?",
    "How can I contact you?"
  ],

  /* ---- Brain: demo mode + FAQ -------------------------------------------- */
  /* Each entry: keywords that trigger it, and the answer Axo gives.        */
  /* Edit these to match YOUR business — this is the no-API-key brain.      */
  faq: [
    {
      keywords: ["price", "cost", "pricing", "charge", "rate", "fee", "how much"],
      answer: "Our prices depend on what you need — simple pages start low and bigger projects are quoted by scope. Tell me what you have in mind and I'll point you to the right option."
    },
    {
      keywords: ["hour", "open", "timing", "when", "close", "working"],
      answer: "We're generally available during normal business hours. Drop your question here any time and we'll get back to you as soon as we're online."
    },
    {
      keywords: ["contact", "phone", "email", "whatsapp", "reach", "call"],
      answer: "You can reach us through the contact page on this website, or just leave your details right here in this chat and we'll reply."
    },
    {
      keywords: ["service", "offer", "do you do", "what can you"],
      answer: "We build modern, mobile-first websites, redesign old ones, and help small businesses get found online. Ask me about a specific service and I'll explain it."
    },
    {
      keywords: ["hello", "hi", "hey", "good morning", "good evening", "namaste"],
      answer: "Hello! Great to meet you. Ask me anything about this website — prices, services, timings, or anything else."
    },
    {
      keywords: ["human", "agent", "person", "real person", "support"],
      answer: "I'm Axo, the assistant here. For anything I can't answer, leave your name and contact here and a human will follow up."
    }
  ],
  fallbackMessage: "Good question! I don't have an answer for that yet — but leave your contact details here and the team will get back to you. Meanwhile, try one of the suggestions below.",

  /* ---- AI provider (only used when an API key is set) -------------------- */
  provider: "demo",                // "demo" | "openai" | "gemini" | "custom"
  apiKey: "",                      // leave empty = demo mode; can also be set in the widget settings panel
  baseUrl: "https://api.openai.com/v1",   // OpenAI-compatible endpoint
  model: "gpt-4o-mini",            // model name for openai / gemini
  endpoint: "",                    // custom mode: your own POST endpoint
  systemPrompt: "You are Axo, a friendly and helpful assistant for this website. Answer briefly, honestly, and in the visitor's language. If you don't know something, say so and suggest they leave their contact details.",

  /* ---- Behaviour ---------------------------------------------------------- */
  persistHistory: true,            // remember the chat in the visitor's browser
  typingDelayMs: 700,              // fake "thinking" pause before a demo reply
  maxHistory: 50,                  // messages kept in memory
  showResetButton: true,           // "Reset chat" clears the conversation
  showSettingsButton: true,        // lets visitors set their own API key/theme
  showPoweredBy: true              // small "Powered by Axo Chat" footer
};
