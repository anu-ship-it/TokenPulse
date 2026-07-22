# TokenPulse

> **The open-source AI workspace that helps you understand your AI usage before your AI tells you _"You've reached your limit."_**

<p align="center">

<a href="https://www.token-pulse.in">
<img src="https://img.shields.io/badge/Website-token--pulse.in-blue?style=for-the-badge"/>
</a>

<a href="https://chromewebstore.google.com/detail/oimclhdbljodjkankcnalklchfcehhic">
<img src="https://img.shields.io/badge/Chrome-Web%20Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white"/>
</a>

<img src="https://img.shields.io/badge/Manifest-V3-success?style=for-the-badge"/>

<img src="https://img.shields.io/badge/Open%20Source-MIT-orange?style=for-the-badge"/>

<img src="https://img.shields.io/badge/Privacy-First-success?style=for-the-badge"/>

<img src="https://img.shields.io/badge/Status-Active%20Development-blue?style=for-the-badge"/>

</p>

---

## AI platforms are becoming our daily workspace.

But none of them clearly tell you:

- How many tokens you've used
- How much context is left
- How close you are to platform limits
- How much your prompts are costing
- When your usage resets

TokenPulse solves this by bringing real-time AI usage insights directly into your workspace.

No dashboards.

No API keys.

No switching tabs.

Just open your favorite AI platform and keep working.

---

# Why TokenPulse?

As developers, researchers, writers, and AI power users, we constantly hit invisible limits.

Context windows overflow.

Claude sessions end unexpectedly.

Large prompts fail.

Token usage becomes impossible to estimate.

Every AI platform exposes different information—and some expose almost none.

TokenPulse creates a consistent experience across every major AI platform so you always know what's happening before you hit a limit.

---

# Features

### Live AI Workspace

- Live token tracking
- Real-time context window monitoring
- Claude session rate-limit tracking
- Daily usage analytics
- Cost estimation
- Smart notifications
- Lightweight dashboard
- Privacy-first architecture

---

## Supported AI Platforms

| Platform | Status |
|-----------|---------|
| ChatGPT | ✅ Supported |
| Claude | ✅ Supported |
| Gemini | ✅ Supported |
| DeepSeek | ✅ Supported |
| Grok | 🚧 Coming Soon |
| Perplexity | 📅 Planned |
| Mistral | 📅 Planned |
| OpenRouter | 📅 Planned |
| Microsoft Copilot | 📅 Planned |

---

# Feature Comparison

| Feature | Claude | ChatGPT | Gemini | DeepSeek |
|---------|--------|---------|--------|----------|
| Live Token Bar | ✅ | ✅ | ✅ | ✅ |
| Context Window Tracking | ✅ | ✅ | ✅ | ✅ |
| Daily Analytics | ✅ | ✅ | ✅ | ✅ |
| Cost Estimation | ✅ | ✅ | ✅ | ✅ |
| Smart Notifications | ✅ | ✅ | ✅ | ✅ |
| Token Saving Tips | ✅ | ✅ | ✅ | ✅ |
| Real Rate Limits | ✅ | — | — | — |
| Reset Countdown | ✅ | — | — | — |
| Dashboard | ✅ | ✅ | ✅ | ✅ |

> Claude currently provides real usage information through its authenticated browser session. Other platforms currently rely on advanced estimation.

---

# Screenshots

> Screenshots and GIF demonstrations will be added soon.

- Live Token Bar
- Dashboard
- Daily Analytics
- Claude Rate Limits
- Settings

---

# Installation

## Chrome Web Store (Recommended)

Install directly from the Chrome Web Store.

https://chromewebstore.google.com/detail/oimclhdbljodjkankcnalklchfcehhic

Compatible with:

- Google Chrome
- Microsoft Edge
- Brave
- Opera

---

## Manual Installation

```bash
git clone https://github.com/anu-ship-it/TokenPulse.git
```

Open

```
chrome://extensions
```

Enable Developer Mode.

Click **Load unpacked**.

Select the project folder.

---

# How TokenPulse Works

TokenPulse estimates token usage using platform-specific parsing and tokenizer logic.

General estimation:

```
Characters ÷ 4 ≈ Tokens
```

Average accuracy:

**±8%**

Supported parsers:

- ChatGPT
- Claude
- Gemini
- DeepSeek

For Claude, TokenPulse also retrieves actual usage information using your existing authenticated browser session.

The extension automatically determines the active bottleneck between:

- Context Window
- Session Rate Limit

This ensures you always see the limit that actually matters.

---

# Cost Estimation

Estimated pricing uses publicly available model pricing.

| Model | Input Price / 1M Tokens |
|--------|------------------------:|
| Claude Sonnet 4 | $3.00 |
| Claude Opus 4 | $15.00 |
| Claude Haiku 4 | $0.80 |
| GPT-4o | $2.50 |
| GPT-4 | $30.00 |
| o1 | $15.00 |
| o3 | $10.00 |
| Gemini 2.0 Flash | $0.10 |
| Gemini 1.5 Pro | $3.50 |
| DeepSeek V3 | $0.27 |
| DeepSeek R1 | $0.55 |

Current estimation includes:

- Input token cost
- Estimated token usage
- Approximate spending

(Output pricing will be added in a future release.)

---

# Smart Notifications

Desktop notifications help prevent unexpected context exhaustion.

Default thresholds:

- 75%
- 90%
- 100%

Notifications trigger only once until usage falls below the configured threshold.

---

# Privacy First

Privacy is one of TokenPulse's core principles.

TokenPulse:

- Never uploads prompts
- Never stores conversations
- Never sends your data to external servers
- Never requires an account
- Never includes advertisements
- Never sells user data

All analytics remain on your device.

Claude rate-limit information is obtained only through your authenticated browser session.

---

# Project Architecture

```
Browser

   │

   ▼

Content Scripts

   │

   ▼

DOM Parser

   │

   ▼

Tokenizer

   │

   ▼

Storage

   │

   ▼

Dashboard

   │

   ▼

Notifications
```

---

# Vision

TokenPulse isn't just another Chrome extension.

Our long-term vision is to become the universal productivity layer for AI.

Instead of building another chatbot, we're building tools that improve every chatbot.

One dashboard.

Every AI platform.

Every token.

---

# Roadmap

## Browser Extension

- ✅ ChatGPT
- ✅ Claude
- ✅ Gemini
- ✅ DeepSeek
- 🚧 Grok
- 🚧 Firefox
- 🚧 Microsoft Edge Store
- 🚧 Safari Support

---

## AI Workspace

- 🚧 Prompt Library
- 🚧 Conversation Search
- 🚧 Workspace Dashboard
- 🚧 Usage Insights
- 🚧 AI Productivity Tools
- 🚧 Export Analytics

---

## Developer Ecosystem

- 🚧 VS Code Extension
- 🚧 Desktop Application
- 🚧 Public API
- 🚧 CLI
- 🚧 SDK

---

## Team Features

- 🚧 Shared Workspaces
- 🚧 Team Analytics
- 🚧 Organization Dashboard
- 🚧 Usage Reports

---

# TokenPulse Ecosystem

```
Chrome Extension
        │
        ▼
VS Code Extension
        │
        ▼
Web Dashboard
        │
        ▼
Desktop App
        │
        ▼
Developer API
        │
        ▼
Team Workspace
```

---

# Project Structure

```
src/
├── background/
├── content/
├── popup/
├── welcome/
├── lib/
├── icons/
└── manifest.json
```

---

# Development

Built with:

- Manifest V3
- Vanilla JavaScript
- HTML
- CSS
- Chrome Extension APIs
- MutationObserver
- Storage API
- Notifications API

No frameworks.

No external dependencies.

---

# Local Development

```bash
git clone https://github.com/anu-ship-it/TokenPulse.git
```

Load the extension using:

```
chrome://extensions
```

Enable Developer Mode and select **Load unpacked**.

---

# Contributing

Contributions are always welcome.

You can help by:

- Reporting bugs
- Suggesting new features
- Improving documentation
- Submitting pull requests

Please open an issue before starting large feature implementations.

If you find TokenPulse useful, consider giving the repository a ⭐.

---

# FAQ

### How accurate is token estimation?

Token estimation is typically within ±8% depending on the platform and conversation structure.

---

### Why does Claude show real limits?

Claude exposes authenticated usage information through its browser session, allowing TokenPulse to display actual limits instead of estimates.

---

### Is my data uploaded anywhere?

No.

Everything remains inside your browser.

---

### Does TokenPulse require an API key?

No.

---

### Does TokenPulse work offline?

Most functionality works locally once the supported AI platform is loaded.

---

# License

MIT License

See the LICENSE file for details.

---

# Disclaimer

TokenPulse is an independent open-source project.

It is not affiliated with or endorsed by:

- OpenAI
- Anthropic
- Google
- xAI
- Microsoft
- DeepSeek
- Mistral AI
- Perplexity
- OpenRouter

All trademarks belong to their respective owners.

---

<p align="center">

Built with ❤️ by the TokenPulse community.

**Understand your AI usage before your AI understands your limits.**

</p>
