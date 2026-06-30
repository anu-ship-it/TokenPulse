"use strict";

const SUPPORTED = ["chatgpt.com", "openai.com", "claude.ai", "gemini.google.com", "chat.deepseek.com"];
const STORE_REVIEW_URL = "https://chromewebstore.google.com/detail/tokenpulse-%E2%80%94-chatgpt-clau/oimclhdbljodjkankcnalklchfcehhic/reviews";
const FORMSPREE_URL = "https://formspree.io/f/xqeoqzdg";

// ── Helpers ────────────────────────────────────────────────────────
function fk(n) {
  if (n === null || n === undefined) return "—";
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return String(Math.round(n));
}

function safePct(used, limit) {
  if (!limit || used === undefined) return 0;
  const raw = (used / limit) * 100;
  if (raw <= 0) return 0;
  if (raw < 1) return 1;
  return Math.min(Math.round(raw), 100);
}

function colorFor(pct) {
  if (pct >= TT.DANGER) return TT.COLOR.RED;
  if (pct >= TT.WARN) return TT.COLOR.YELLOW;
  return TT.COLOR.GREEN;
}

function colorClass(pct) {
  if (pct >= TT.DANGER) return "red";
  if (pct >= TT.WARN) return "yellow";
  return "green";
}

function statusLabel(pct) {
  if (pct >= 100) return "MAXED OUT";
  if (pct >= TT.DANGER) return "CRITICAL";
  if (pct >= TT.WARN) return "WARNING";
  if (pct >= 1) return "HEALTHY";
  return "IDLE";
}

function countdown(resetsAt) {
  if (!resetsAt) return null;
  const diff = new Date(resetsAt) - Date.now();
  if (diff <= 0) return "Resetting soon";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `Resets in ${h}h ${m}m` : `Resets in ${m}m`;
}

function dayLabel(dateStr) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric"
  });
}

function fmtCost(usd) {
  if (!usd || usd <= 0) return "$0.00";
  if (usd < 0.001) return "<$0.001";
  if (usd < 0.01) return "$" + usd.toFixed(4);
  if (usd < 1) return "$" + usd.toFixed(3);
  return "$" + usd.toFixed(2);
}

const MODEL_LABELS = {
  "claude-sonnet-4": "Sonnet 4", "claude-opus-4": "Opus 4", "claude-haiku-4": "Haiku 4",
  "gpt-4o": "GPT-4o", "gpt-4": "GPT-4", "gpt-3.5": "GPT-3.5", "o1": "o1", "o3": "o3",
  "default": "Default",
  "gemini-default": "Gemini", "gemini-1.5-pro": "Gemini 1.5 Pro",
  "gemini-1.5-flash": "Gemini 1.5 Flash", "gemini-2.0-flash": "Gemini 2.0 Flash",
  "deepseek-v3": "DeepSeek V3", "deepseek-r1": "DeepSeek R1", "deepseek-default": "DeepSeek",
};

function bindHeaderButtons(state) {
  const tipsBtn = document.getElementById("tips-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const backBtn = document.getElementById("back-btn");

  if (tipsBtn) tipsBtn.addEventListener("click", () => renderTips(state));
  if (refreshBtn) refreshBtn.addEventListener("click", () => {
    refreshBtn.classList.add("spin");
    chrome.runtime.sendMessage({ type: "FORCE_REFRESH" });
    setTimeout(() => location.reload(), 1500);
  });
  if (settingsBtn) settingsBtn.addEventListener("click", () => renderSettings(state));
  if (backBtn) backBtn.addEventListener("click", () => renderMain(state));
}

// ── Tips content ───────────────────────────────────────────────────
const TIPS = {
  claude: [
    { title: "Start a new chat when topic changes", body: "Every message adds to the context. When you shift topics, start fresh — don't drag old context into a new task.", prompt: null },
    { title: "Ask for compact answers first", body: "Tell Claude to give the shortest useful answer, then expand only if needed. Saves tokens on both sides.", prompt: "Give me the shortest useful answer first. Ask if I want more detail." },
    { title: "Summarize before a long session", body: "When a conversation gets long, ask Claude to summarize key decisions. Start a new chat with just that summary.", prompt: "Summarize the key decisions from this conversation in under 150 words." },
    { title: "Use Projects for recurring context", body: "Put stable instructions and files in a Claude Project instead of repeating them every session.", prompt: null },
    { title: "Watch your 5-hour session limit", body: "Claude's 5-hour window resets independently of the 7-day limit. Check both before a heavy session.", prompt: null },
    { title: "Use faster models for simple tasks", body: "Don't use Opus for formatting a list. Save your premium quota for deep analysis and complex work.", prompt: null },
  ],
  chatgpt: [
    { title: "One job per chat", body: "ChatGPT works best with a single clear purpose per conversation. Mixing tasks burns context fast.", prompt: null },
    { title: "Put stable context in Custom Instructions", body: "Stop re-briefing ChatGPT on every chat. Put your tone, format preferences, and recurring context in Custom Instructions.", prompt: null },
    { title: "Split research from writing", body: "Do research in one chat, then start fresh for the final output. Don't carry the full thread into writing.", prompt: null },
    { title: "Skip Thinking mode for simple tasks", body: "Thinking models use more tokens. Use them for complex problems — not for rewriting emails.", prompt: "Give me a direct answer. No deep reasoning needed here." },
    { title: "Watch the bar during coding sessions", body: "Code and logs burn tokens fast. When TokenPulse hits 70%, wrap up or summarize before continuing in a new chat.", prompt: null },
    { title: "Use Projects for recurring work", body: "One project per client, one per research area. Keeps conversations focused and context lean.", prompt: null },
  ],
  gemini: [
    { title: "Gemini has a 1M token context window", body: "You have far more room than Claude or ChatGPT. Use it for large documents or codebases, but still start fresh between unrelated tasks.", prompt: null },
    { title: "Use Gems for recurring workflows", body: "Set up a Gem with stable instructions for tasks you repeat often instead of re-explaining context every time.", prompt: null },
    { title: "Switch to Flash for speed and cost", body: "Gemini Flash is dramatically cheaper than Pro. Use Pro only when you need the extra reasoning quality.", prompt: null },
  ],
  deepseek: [
    { title: "Use R1 for reasoning, V3 for speed", body: "R1's chain-of-thought uses more tokens. Switch to V3 for simple tasks that don't need deep reasoning.", prompt: null },
    { title: "Start new chats for unrelated tasks", body: "DeepSeek's context window is smaller than Gemini's. Keep conversations focused to avoid hitting the wall.", prompt: null },
    { title: "Ask for concise output", body: "DeepSeek can be verbose by default. Ask explicitly for brevity to save tokens.", prompt: "Keep your answer concise. No need to over-explain." },
  ],
};

function getRandomTips(platform) {
  const pool = [...(TIPS[platform] || TIPS.claude)];
  const picked = [];
  while (picked.length < 3 && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}

// ── Data row builder ───────────────────────────────────────────────
function dataRow(name, sub, pct) {
  const color = colorFor(pct);
  return `
    <div class="data-row">
      <div class="data-left">
        <div class="data-name">${name}</div>
        <div class="data-sub">${sub || "—"}</div>
      </div>
      <div class="data-right">
        <span class="data-pct ${colorClass(pct)}">${pct}%</span>
        <div class="mini-track">
          <div class="mini-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>
    </div>`;
}

function costRow(label, sub, costValue) {
  return `
    <div class="data-row">
      <div class="data-left">
        <div class="data-name">${label}</div>
        <div class="data-sub">${sub}</div>
      </div>
      <div class="data-right">
        <span class="data-pct" style="color:#67e8f9;font-size:14px">${fmtCost(costValue)}</span>
      </div>
    </div>`;
}

function rateLimitsHTML(usage) {
  const fhPct = Math.min(usage.five_hour?.utilization || 0, 100);
  const sdPct = Math.min(usage.seven_day?.utilization || 0, 100);
  return `
    <div class="section">
      <div class="section-title">Rate Limits</div>
      <div class="data-card">
        ${dataRow("5-Hour Session", countdown(usage.five_hour?.resets_at), fhPct)}
        ${dataRow("7-Day Weekly", countdown(usage.seven_day?.resets_at), sdPct)}
      </div>
    </div>`;
}

function costHTML(used, model, history, platform) {
  const pricePerM = (TT.COST_PER_M && TT.COST_PER_M[model]) || 3.00;
  const convCost = (used / 1_000_000) * pricePerM;
  const today = new Date().toDateString();
  const todayRec = (history || []).find(h => h.platform === platform && h.date === today);
  const dailyCost = todayRec?.cost ?? convCost;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyCost = (history || [])
    .filter(h => h.platform === platform && h.ts >= weekAgo)
    .reduce((sum, h) => sum + (h.cost || 0), 0);
  const modelLabel = MODEL_LABELS[model] || model;

  return `
    <div class="section">
      <div class="section-title">Estimated Cost · ${modelLabel}</div>
      <div class="data-card">
        ${costRow("This conversation", "Input tokens only", convCost)}
        ${costRow("Today", "Peak usage · all chats", dailyCost)}
        ${costRow("This week", "Last 7 days", weeklyCost)}
      </div>
      <div style="font-size:9px;color:#3a3a3a;margin-top:6px;padding:0 2px">±8% accuracy · input tokens only · output not included</div>
    </div>`;
}

function dailyHistoryHTML(history, platform) {
  const days = history
    .filter(h => h.platform === platform)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const rows = days.length === 0
    ? `<div class="no-history">No usage recorded yet.<br>Data saves automatically as you chat.</div>`
    : days.map(d => dataRow(dayLabel(d.date), `Peak ~${fk(d.used)} of ${fk(d.limit)} tokens`, safePct(d.used, d.limit))).join("");

  return `
    <div class="section">
      <div class="section-title">Daily Usage History</div>
      <div class="data-card">${rows}</div>
    </div>`;
}

// ── Header builder (shared across views) ──────────────────────────
function headerHTML(badgeClass, badgeLabel, heroColor, showBack, activeIcon) {
  const backBtn = showBack
    ? `<button class="icon-btn" id="back-btn" style="font-size:13px;color:#4a9ba5">←</button>`
    : `<div class="logo">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="#222" stroke-width="2"/>
          <path d="M9 2 a7 7 0 0 1 6.06 3.5" stroke="#06b6d4" stroke-width="2" stroke-linecap="round"/>
          <circle cx="9" cy="9" r="4" stroke="#1a1a1a" stroke-width="1.5"/>
          <path d="M9 5 a4 4 0 0 1 3.46 2 a4 4 0 0 1 0 4" stroke="#67e8f9" stroke-width="1.5" stroke-linecap="round"/>
          <text x="9" y="12.5" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="7" font-weight="800" fill="white">T</text>
        </svg>
      </div>`;

  return `
    <div class="hd">
      <div class="hd-left">
        ${backBtn}
        <span class="app-name">TokenPulse</span>
      </div>
      <div class="hd-right">
        <div class="dot" style="background:${heroColor};box-shadow:0 0 6px ${heroColor}66"></div>
        <span class="badge ${badgeClass}">${badgeLabel}</span>
        <button class="icon-btn ${activeIcon === 'tips' ? 'icon-btn-active' : ''}" id="tips-btn" title="Token tips">💡</button>
        <button class="icon-btn ${activeIcon === 'refresh' ? 'icon-btn-active' : ''}" id="refresh-btn" title="Refresh">↻</button>
        <button class="icon-btn ${activeIcon === 'settings' ? 'icon-btn-active' : ''}" id="settings-btn" title="Settings">⚙</button>
      </div>
    </div>`;
}

// ── Platform helper ─────────────────────────────────────────────────
function platformMeta(platform) {
  const isClaude = platform === "claude";
  const isGemini = platform === "gemini";
  const isDeepSeek = platform === "deepseek";
  return {
    isClaude, isGemini, isDeepSeek,
    badgeClass: isClaude ? "badge-claude" : isGemini ? "badge-gemini" : isDeepSeek ? "badge-deepseek" : "badge-chatgpt",
    badgeLabel: isClaude ? "Claude" : isGemini ? "Gemini" : isDeepSeek ? "DeepSeek" : "ChatGPT",
    newChatUrl: isClaude ? "https://claude.ai/new" : isGemini ? "https://gemini.google.com/" : isDeepSeek ? "https://chat.deepseek.com/" : "https://chatgpt.com/",
    defaultLimit: isClaude ? TT.LIMITS["default"] : isGemini ? TT.LIMITS["gemini-default"] : isDeepSeek ? TT.LIMITS["deepseek-default"] : TT.LIMITS["gpt-4o"],
  };
}

// ── Main view ──────────────────────────────────────────────────────
function renderMain(state) {
  const { usage, context, history, platform, model } = state;
  const root = document.getElementById("root");
  const pm = platformMeta(platform);
  const ctx = context?.[platform] || {};
  const used = ctx.used || 0;
  const limit = ctx.limit || pm.defaultLimit;
  const ctxPct = safePct(used, limit);
  const ctxColor = colorFor(ctxPct);
  const activeModel = model || (pm.isClaude ? "claude-sonnet-4" : "gpt-4o");

  let heroPct = ctxPct;
  if (pm.isClaude && usage) {
    heroPct = Math.max(ctxPct, usage.five_hour?.utilization || 0, usage.seven_day?.utilization || 0);
  }
  const heroColor = colorFor(heroPct);

  root.innerHTML = `
    ${headerHTML(pm.badgeClass, pm.badgeLabel, heroColor, false, null)}

    <div class="section">
      <div class="section-title">Context Window</div>
      <div class="ctx-used-label">TOKENS USED</div>
      <div class="ctx-hero">
        <span class="ctx-used-val ${colorClass(ctxPct)}">~${fk(used)}</span>
        <span style="font-size:11px;color:#3a3a3a;padding-bottom:5px">${fk(limit)} limit</span>
      </div>
      <div class="ctx-meta">
        <span class="remaining">~${fk(Math.max(limit - used, 0))} remaining</span>
        <span>${ctxPct}% used</span>
      </div>
      <div class="bar-wrap">
        <div class="bar-track">
          <div class="bar-fill" style="width:${ctxPct}%;background:${ctxColor}"></div>
        </div>
        <div class="bar-footer">
          <span class="bar-end">0</span>
          <span class="bar-status ${colorClass(ctxPct)}">${statusLabel(ctxPct)}</span>
          <span class="bar-end">${fk(limit)}</span>
        </div>
      </div>
    </div>

    ${costHTML(used, activeModel, history || [], platform)}
    ${pm.isClaude && usage ? rateLimitsHTML(usage) : ""}
    ${dailyHistoryHTML(history || [], platform)}

    <div class="footer">
      <span class="footer-note">chars ÷ 4 · ±8% · v2.2.0</span>
      <button class="new-chat" id="new-chat-btn">+ New chat</button>
    </div>
  `;

  bindHeaderButtons(state);
  document.getElementById("new-chat-btn").addEventListener("click", () => {
    chrome.tabs.update({ url: pm.newChatUrl });
    window.close();
  });
}

// ── Tips view ──────────────────────────────────────────────────────
function renderTips(state) {
  const root = document.getElementById("root");
  const pm = platformMeta(state.platform);
  const tips = getRandomTips(state.platform);

  root.innerHTML = `
    ${headerHTML(pm.badgeClass, pm.badgeLabel, TT.COLOR.GREEN, true, "tips")}
    <div class="section" style="padding-bottom:8px">
      <div class="section-title">Token Saving Tips · ${pm.badgeLabel}</div>
      <div style="font-size:10px;color:#3a3a3a;margin-top:-6px;margin-bottom:4px">Refreshes each time you open this panel</div>
    </div>
    <div style="padding:0 14px 14px;display:flex;flex-direction:column;gap:10px">
      ${tips.map((tip, i) => `
        <div class="tip-card">
          <div class="tip-num">0${i + 1}</div>
          <div class="tip-title">${tip.title}</div>
          <div class="tip-body">${tip.body}</div>
          ${tip.prompt ? `
            <div class="tip-prompt-wrap">
              <div class="tip-prompt" id="tp-${i}">${tip.prompt}</div>
              <button class="tip-copy-btn" data-idx="${i}" title="Copy prompt">Copy</button>
            </div>` : ""}
        </div>`).join("")}
    </div>
    <div class="footer">
      <span class="footer-note">v2.2.0</span>
      <button class="new-chat" id="more-tips-btn">Refresh tips</button>
    </div>
  `;

  bindHeaderButtons(state);
  document.getElementById("more-tips-btn").addEventListener("click", () => renderTips(state));
  document.querySelectorAll(".tip-copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const text = document.getElementById(`tp-${btn.dataset.idx}`).textContent;
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = "Copy"; }, 1500);
      });
    });
  });
}

// ── Settings view ────────────────────────────────────────────────
function renderSettings(state) {
  const root = document.getElementById("root");
  const pm = platformMeta(state.platform);

  chrome.storage.local.get([TT.KEY.SETTINGS], (r) => {
    const s = { ...TT.DEFAULTS, ...(r[TT.KEY.SETTINGS] || {}) };

    const metaLinksHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
      <button class="meta-link" id="rate-btn">⭐ review</button>
      <span style="color:#222;font-size:10px">·</span>
      <button class="meta-link" id="support-btn">help</button>
    </div>`;

    root.innerHTML = `
      ${headerHTML(pm.badgeClass, pm.badgeLabel, TT.COLOR.GREEN, true, "settings")}

      <div class="section">
        <div class="section-title">Notifications</div>
        <div class="data-card">
          ${toggleRow("n50", "Alert at 50%", "Halfway warning", s.notify_50)}
          ${toggleRow("n75", "Alert at 75%", "Last call warning", s.notify_75)}
          ${toggleRow("n90", "Alert at 90%", "Critical warning", s.notify_90)}
          ${toggleRow("n100", "Alert at 100%", "Limit reached", s.notify_100)}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Display</div>
        <div class="data-card">
          ${toggleRow("show_bar", "In-page token bar", "Show bar above input box", s.show_bar)}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Refresh Interval</div>
        <div class="data-card">
          <div class="data-row">
            <div class="data-left">
              <div class="data-name">Fetch Claude usage every</div>
              <div class="data-sub">Background refresh frequency</div>
            </div>
            <select id="refresh" class="sel">
              <option value="1"  ${s.refresh_minutes === 1 ? "selected" : ""}>1 min</option>
              <option value="2"  ${s.refresh_minutes === 2 ? "selected" : ""}>2 min</option>
              <option value="5"  ${s.refresh_minutes === 5 ? "selected" : ""}>5 min</option>
              <option value="10" ${s.refresh_minutes === 10 ? "selected" : ""}>10 min</option>
              <option value="15" ${s.refresh_minutes === 15 ? "selected" : ""}>15 min</option>
            </select>
          </div>
        </div>
      </div>

      <div style="padding:4px 14px 14px">
        <button class="save-btn" id="save-btn">Save Settings</button>
        <div class="saved-msg" id="saved-msg" style="opacity:0">✓ Settings saved</div>
      </div>

      <div class="meta-links">
        <button class="meta-link" id="rate-btn">⭐ review</button>
        <span class="meta-dot">·</span>
        <button class="meta-link" id="support-btn">help</button>
      </div>

      <div style="padding:0 14px 16px;border-top:1px solid #1a1a1a;margin-top:4px">
        <div style="padding-top:12px">
          <div style="font-size:12px;font-weight:600;color:#4a9ba5">TokenPulse <span style="color:#3a3a3a;font-weight:400">v2.2.0</span></div>
          <div style="font-size:10px;color:#3a3a3a;margin-top:2px">Built by Anoop Kumar and Mansi Rathore · Alpha</div>
          ${metaLinksHTML}
        </div>
      </div>
    `;

    bindHeaderButtons(state);

    document.getElementById("rate-btn").addEventListener("click", () => {
      chrome.tabs.create({ url: STORE_REVIEW_URL });
      window.close();
    });

    document.getElementById("support-btn").addEventListener("click", () => {
      chrome.tabs.create({ url: "https://anu-ship-it.github.io/TokenPulse/support.html" });
      window.close();
    });
    document.getElementById("save-btn").addEventListener("click", async () => {
      const settings = {
        notify_50: document.getElementById("n50").checked,
        notify_75: document.getElementById("n75").checked,
        notify_90: document.getElementById("n90").checked,
        notify_100: document.getElementById("n100").checked,
        show_bar: document.getElementById("show_bar").checked,
        refresh_minutes: parseInt(document.getElementById("refresh").value, 10),
      };
      await chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings });
      const msg = document.getElementById("saved-msg");
      msg.style.opacity = "1";
      setTimeout(() => { msg.style.opacity = "0"; }, 2000);
    });
  });
}


function toggleRow(id, label, desc, checked) {
  return `
    <div class="data-row">
      <div class="data-left">
        <div class="data-name">${label}</div>
        <div class="data-sub">${desc}</div>
      </div>
      <label class="toggle">
        <input type="checkbox" id="${id}" ${checked ? "checked" : ""}>
        <div class="track"></div>
      </label>
    </div>`;
}

// ── Empty state ────────────────────────────────────────────────────
function renderEmpty() {
  document.getElementById("root").innerHTML = `
    <div class="hd">
      <div class="hd-left">
        <div class="logo">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="#222" stroke-width="2"/>
            <path d="M9 2 a7 7 0 0 1 6.06 3.5" stroke="#06b6d4" stroke-width="2" stroke-linecap="round"/>
            <circle cx="9" cy="9" r="4" stroke="#1a1a1a" stroke-width="1.5"/>
            <path d="M9 5 a4 4 0 0 1 3.46 2 a4 4 0 0 1 0 4" stroke="#67e8f9" stroke-width="1.5" stroke-linecap="round"/>
            <text x="9" y="12.5" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="7" font-weight="800" fill="white">T</text>
          </svg>
        </div>
        <span class="app-name">TokenPulse</span>
      </div>
      <div class="hd-right"><span class="badge badge-none">—</span></div>
    </div>
    <div class="empty">
      <div class="empty-icon">◎</div>
      <p class="empty-text">Open <strong>ChatGPT</strong>, <strong>Claude</strong>, <strong>Gemini</strong>, or <strong>DeepSeek</strong> and start chatting</p>
    </div>
    <div class="footer"><span class="footer-note">v2.2.0</span></div>
  `;
}

// ── Init ───────────────────────────────────────────────────────────
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || "";
  const ok = SUPPORTED.some(s => url.includes(s));
  if (!ok) { renderEmpty(); return; }

  const platform = url.includes("claude.ai") ? "claude"
    : url.includes("gemini.google.com") ? "gemini"
      : url.includes("deepseek.com") ? "deepseek"
        : "chatgpt";

  const data = await chrome.runtime.sendMessage({ type: "GET_ALL_DATA" });

  let liveModel = null;
  try {
    const live = await chrome.tabs.sendMessage(tab.id, { type: "GET_CONTEXT_STATE" });
    if (live?.used !== undefined) {
      data.context = data.context || {};
      data.context[platform] = { used: live.used, limit: live.limit };
      liveModel = live.model || null;
    }
  } catch (_) { }

  renderMain({
    usage: data.usage,
    context: data.context || {},
    history: data.history || [],
    platform,
    model: liveModel,
  });
}

init();
