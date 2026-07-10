# TokenPulse AI

> **Your AI workspace for ChatGPT, Claude, Gemini, DeepSeek, and more.**

Monitor token usage, context windows, usage analytics, and platform-specific limits directly inside your favorite AI platforms.

<p align="center">

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/oimclhdbljodjkankcnalklchfcehhic)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow)

</p>

An open-source project by **TokenPulse**.

---

# Overview

TokenPulse AI is a lightweight Chrome extension designed for AI power users.

Instead of switching between dashboards or guessing how much context remains, TokenPulse AI provides real-time insights directly inside supported AI platforms.

It currently supports:

- ChatGPT
- Claude
- Gemini
- DeepSeek

More AI platforms will be supported in future releases.

---

# Features

### Core Features

- Live token tracking
- Real-time context window monitoring
- Claude rate-limit tracking
- Daily usage analytics
- Cost estimation
- Smart usage notifications
- Lightweight dashboard
- Privacy-first architecture

---

## Feature Comparison

| Feature | Claude | ChatGPT | Gemini | DeepSeek |
|---------|--------|---------|--------|----------|
| Live in-page token bar | ✅ | ✅ | ✅ | ✅ |
| Context window tracking | ✅ | ✅ | ✅ | ✅ |
| Daily usage history | ✅ | ✅ | ✅ | ✅ |
| Cost estimator | ✅ | ✅ | ✅ | ✅ |
| Token-saving tips | ✅ | ✅ | ✅ | ✅ |
| Smart notifications | ✅ | ✅ | ✅ | ✅ |
| Real rate-limit data | ✅ | — | — | — |
| Reset countdown | ✅ | — | — | — |
| Settings dashboard | ✅ | ✅ | ✅ | ✅ |

> Claude is currently the only supported platform that exposes real usage limits through its API. Other platforms use context window estimation.

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
git clone https://github.com/anu-ship-it/TokenPulse
```

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the project folder

---

# Project Structure

```
src/
├── manifest.json
├── background/
│   └── service-worker.js
├── content/
│   ├── content.js
│   └── content.css
├── lib/
│   ├── constants.js
│   ├── storage.js
│   └── tokenizer.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── welcome/
│   └── welcome.html
└── icons/
```

---

# How Token Counting Works

TokenPulse AI estimates token usage using the commonly accepted approximation:

```
Characters ÷ 4 ≈ Tokens
```

Average accuracy:

**±8%**

Platform-specific parsing:

- Claude
- ChatGPT
- Gemini
- DeepSeek

For Claude, TokenPulse AI also retrieves actual usage information from Claude's internal API using the user's existing authenticated browser session.

The extension automatically displays whichever limit becomes the bottleneck:

- Context Window
- Session Rate Limit

This ensures users always see the most relevant limit.

---

# Cost Estimation

Estimated pricing uses publicly available model pricing.

| Model | Price / 1M Input Tokens |
|--------|------------------------:|
| Claude Sonnet 4 | $3.00 |
| Claude Opus 4 | $15.00 |
| Claude Haiku 4 | $0.80 |
| GPT-4o | $2.50 |
| GPT-4 | $30.00 |
| o1 / o3 | $15.00 / $10.00 |
| Gemini 1.5 Pro | $3.50 |
| Gemini 2.0 Flash | $0.10 |
| DeepSeek V3 | $0.27 |
| DeepSeek R1 | $0.55 |

Accuracy:

- Input tokens only
- ±8% estimation
- Output cost not included

---

# Notifications

Desktop notifications help prevent unexpected context exhaustion.

Default thresholds:

- 75%
- 90%
- 100%

Notifications trigger only once per threshold until usage falls below the configured limit.

---

# Privacy

TokenPulse AI is built with a privacy-first approach.

- Local storage only
- No analytics
- No advertisements
- No account required
- No external servers
- No selling of user data

Claude rate-limit information is retrieved using the user's existing authenticated browser session.

For full details, see the Privacy Policy.

---

# Roadmap

## Current

- ChatGPT support
- Claude support
- Gemini support
- DeepSeek support
- Live token tracking
- Context window monitoring
- Cost estimation
- Daily analytics
- Smart notifications

---

## Planned

- Additional AI model support
- Prompt Library
- Response Ready notifications
- Usage export
- Firefox support
- VS Code extension
- AI productivity tools
- Workspace enhancements

---

# Development

Built using:

- Manifest V3
- Vanilla JavaScript
- HTML
- CSS

No frameworks.

No external dependencies.

---

## Local Development

```bash
git clone https://github.com/anu-ship-it/TokenPulse
```

Load the extension as an unpacked extension from:

```
chrome://extensions
```

---

# Contributing

Contributions are welcome.

You can help by:

- Reporting bugs
- Suggesting new features
- Improving documentation
- Submitting pull requests

Please open an issue before working on large feature additions.

---

# Changelog

See:

```
CHANGELOG.md
```

---

# License

MIT License

See the LICENSE file for details.

---

# Disclaimer

TokenPulse AI is an independent open-source project.

It is not affiliated with or endorsed by:

- OpenAI
- Anthropic
- Google
- DeepSeek
- Microsoft
- Any other AI platform

All trademarks belong to their respective owners.
