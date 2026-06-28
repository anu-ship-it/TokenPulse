# TokenPulse

**Live token & rate limit tracker for Claude, ChatGPT, Gemini, and DeepSeek.**

Built by Anoop Kumar and Mansi Rathore · Alpha

[Chrome Web Store](https://chromewebstore.google.com/detail/tokenpulse-%E2%80%94-chatgpt-clau/oimclhdbljodjkankcnalklchfcehhic) · [GitHub](https://github.com/anu-ship-it/TokenPulse)

---

## What it does

TokenPulse sits inside Claude, ChatGPT, Gemini, and DeepSeek and tells you exactly where you stand — before the model starts forgetting your conversation or your session gets cut off.

A live token bar above the input box tracks your context window in real time. Click the toolbar icon for the full dashboard.

---

## Features

| Feature | Claude | ChatGPT | Gemini | DeepSeek |
|---------|--------|---------|--------|----------|
| Live in-page token bar | ✅ | ✅ | ✅ | ✅ |
| Context window tracking | ✅ | ✅ | ✅ | ✅ |
| Daily usage history | ✅ | ✅ | ✅ | ✅ |
| Cost estimator | ✅ | ✅ | ✅ | ✅ |
| Token saving tips | ✅ | ✅ | ✅ | ✅ |
| Smart notifications (75%, 90%, 100%) | ✅ | ✅ | ✅ | ✅ |
| Real rate limit data (5hr + 7day) | ✅ | — | — | — |
| Reset countdowns | ✅ | — | — | — |
| Settings inside popup | ✅ | ✅ | ✅ | ✅ |

Claude is the only platform that exposes real rate limit data via API. All other platforms use context window estimation only.

---

## Install

### Chrome Web Store
[Install TokenPulse](https://chromewebstore.google.com/detail/tokenpulse-%E2%80%94-chatgpt-clau/oimclhdbljodjkankcnalklchfcehhic)

Works on Chrome, Edge, Brave, and Opera.

### Manual (Developer Mode)
1. Clone this repo
```bash
git clone https://github.com/anu-ship-it/TokenPulse
```
2. Go to `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `src/` folder

---

## Project Structure

```
src/
├── manifest.json
├── background/
│   └── service-worker.js     # Alarms, API fetch, notifications
├── content/
│   ├── content.js            # In-page token bar (all 4 platforms)
│   └── content.css           # Bar + exhaustion popup styles
├── lib/
│   ├── constants.js          # Config, limits, pricing, colors, keys
│   ├── storage.js            # All chrome.storage ops
│   └── tokenizer.js          # Character-based token estimator (±8%)
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js              # Main / Tips / Settings views
├── welcome/
│   └── welcome.html          # First install onboarding
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## How token counting works

TokenPulse estimates tokens using the `chars ÷ 4` rule — OpenAI's documented approximation for English text. Accuracy is ±8%.

**Platform-specific selectors:**
- **Claude** — scans largest body child element, subtracts input text
- **ChatGPT** — `article[data-testid]` message containers
- **Gemini** — `user-query` and `model-response` custom elements
- **DeepSeek** — `.ds-message` containers

For Claude, real rate limit data (5-hour session and 7-day weekly utilization) is fetched from Claude's internal API using your existing browser session. The in-page bar shows whichever is worse — context window usage or session rate limit — so you always see the real bottleneck.

---

## Cost Estimator

TokenPulse calculates estimated input token cost based on current model pricing:

| Model | Price per 1M tokens |
|-------|-------------------|
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

Accuracy: ±8% · Input tokens only · Output not included.

---

## Notifications

Notifications fire when you cross a new threshold — not on a timer. Once notified at 75%, you won't be notified again until you cross 90%. Resets when usage drops below all thresholds.

Default thresholds: **75%, 90%, 100%** (50% available, off by default).

---

## Privacy

- All data stored locally via `chrome.storage.local`
- No external servers, no analytics, no tracking
- Claude rate limit data fetched from `claude.ai/api` using your existing session only
- Full privacy policy: [privacy.html](./privacy.html)

---

## Roadmap

### v2.2.0 — Current
- Gemini support (1M context window)
- DeepSeek support (V3 + R1)
- Cost estimator across all platforms
- Smart rate limit bar — shows session limit when it's the bottleneck
- Tips panel with copy-to-clipboard prompts

### v2.1.0
- Cost estimator for Claude and ChatGPT
- Model detection for accurate pricing

### v2.0.0
- TokenPulse rebrand — dual-ring teal icon
- Real Claude API rate limits (5hr + 7day)
- Auto-saving daily usage history
- Smart threshold notifications
- Settings inside popup

### v1.0.0
- Initial release — Claude + ChatGPT token bar

### Coming next
- Response-ready notification (alert when model finishes generating while tab is backgrounded)
- VS Code extension — token and cost tracking inside the editor
- Firefox support
- Usage history export (CSV)

---

## Development

No build step. Pure vanilla JS, HTML, CSS.

```bash
git clone https://github.com/anu-ship-it/TokenPulse
# Load src/ as unpacked extension in chrome://extensions/
```

To release:
```bash
git tag v2.2.0
git push --tags
# GitHub Actions auto-zips src/ and creates a release
```

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)

---

## License

MIT — see LICENSE file

---

*TokenPulse is an independent project. Not affiliated with Anthropic, OpenAI, Google, or DeepSeek.*
