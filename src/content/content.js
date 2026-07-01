/**
 * content.js v2.2.0
 * Added: Gemini support
 */

(() => {
  "use strict";

  const IS_CLAUDE = location.hostname.includes("claude.ai");
  const IS_GPT = location.hostname.includes("chatgpt.com") || location.hostname.includes("openai.com");
  const IS_GEMINI = location.hostname.includes("gemini.google.com");
  const IS_DEEPSEEK = location.hostname.includes("chat.deepseek.com");

  if (!IS_CLAUDE && !IS_GPT && !IS_GEMINI && !IS_DEEPSEEK) return;

  const PLATFORM = IS_CLAUDE ? "claude" : IS_GPT ? "chatgpt" : IS_GEMINI ? "gemini" : "deepseek";

  let lastTokenCount = 0;
  let lastSessionId = getSessionId();
  let lastModel = "default";
  let popupShown = false;
  let rafPending = false;
  let isStreaming     = false;
  let streamTimer     = null;
  let lastMutationTime = 0;

  // ── Session ID ─────────────────────────────────────────────────
  function getSessionId() {
    if (IS_CLAUDE) {
      const m = location.pathname.match(/\/chat\/([a-z0-9-]+)/i);
      return m ? m[1] : location.pathname;
    }
    if (IS_GPT) {
      const m = location.pathname.match(/\/c\/([a-z0-9-]+)/i);
      return m ? m[1] : "home";
    }
    // Gemini uses URL hash or path
    return location.pathname + location.search;
  }

  // ── Model detection ────────────────────────────────────────────
  function getModel() {
    if (IS_CLAUDE) {
      const btn = document.querySelector("[data-testid='model-selector'], button[aria-label*='claude']");
      if (btn) {
        const txt = btn.textContent.toLowerCase();
        if (txt.includes("opus")) return "claude-opus-4";
        if (txt.includes("haiku")) return "claude-haiku-4";
        if (txt.includes("sonnet")) return "claude-sonnet-4";
      }
      return "claude-sonnet-4";
    }
    if (IS_GEMINI) {
      // Gemini model switcher
      const btn = document.querySelector("bard-mode-switcher, .model-switcher, [aria-label*='Gemini']");
      if (btn) {
        const txt = btn.textContent.toLowerCase();
        if (txt.includes("1.5 pro")) return "gemini-1.5-pro";
        if (txt.includes("1.5 flash")) return "gemini-1.5-flash";
        if (txt.includes("2.0")) return "gemini-2.0-flash";
        if (txt.includes("flash")) return "gemini-2.0-flash";
        if (txt.includes("pro")) return "gemini-1.5-pro";
      }
      return "gemini-default";
    }
    if (IS_DEEPSEEK) {
      const btn = document.querySelector('[class*="model"]');
      if (btn) {
        const txt = btn.textContent.toLowerCase();
        if (txt.includes("r1")) return "deepseek-r1";
        if (txt.includes("v3")) return "deepseek-v3";
      }
      return "deepseek-default";
    }
    // ChatGPT
    const btn = document.querySelector("[data-testid='model-switcher-dropdown-button'], button[aria-label*='GPT']");
    const txt = btn ? btn.textContent.toLowerCase() : "";
    if (txt.includes("o3")) return "o3";
    if (txt.includes("o1")) return "o1";
    if (txt.includes("4o")) return "gpt-4o";
    if (txt.includes("3.5")) return "gpt-3.5";
    return "gpt-4o";
  }

  // ── Context limit ──────────────────────────────────────────────
  function getLimit() {
    const model = getModel();
    return TT.LIMITS[model] || TT.LIMITS["default"];
  }

  // ── Cost estimation ────────────────────────────────────────────
  function estimateCost(tokens, model) {
    const pricePerM = TT.COST_PER_M[model] || TT.COST_PER_M["default"];
    return (tokens / 1_000_000) * pricePerM;
  }

  // ── Token counting ─────────────────────────────────────────────
  function countTokens() {
    if (IS_CLAUDE) return countClaude();
    if (IS_GEMINI) return countGemini();
    if (IS_DEEPSEEK) return countDeepSeek();
    return countGPT();
  }

  function countClaude() {
    let best = null, bestLen = 0;
    for (const el of document.body.children) {
      if (el.id === "tt-bar" || el.id === "tt-popup") continue;
      const len = (el.textContent || "").trim().length;
      if (len > bestLen) { bestLen = len; best = el; }
    }
    if (!best || bestLen < 50) return 0;
    const inputEl = document.querySelector("div[contenteditable='true']");
    const inputText = inputEl ? (inputEl.textContent || "").trim() : "";
    let text = (best.textContent || "").trim();
    if (inputText && text.includes(inputText)) text = text.replace(inputText, "");
    return Tokenizer.estimate(text);
  }

  function countGemini() {
    // Collect all user queries and model responses
    const userEls = document.getElementsByTagName("user-query");
    const modelEls = document.getElementsByTagName("model-response");

    if (userEls.length === 0 && modelEls.length === 0) return 0;

    let totalText = "";

    // Add all user messages
    Array.from(userEls).forEach(el => {
      totalText += (el.textContent || "").trim() + " ";
    });

    // Add all model responses — use message-content for cleaner text
    Array.from(modelEls).forEach(el => {
      const msgContent = el.querySelector("message-content");
      const text = msgContent
        ? (msgContent.textContent || "").trim()
        : (el.textContent || "").trim();
      totalText += text + " ";
    });

    // Subtract input box text to avoid double counting
    const inputEl = document.querySelector("rich-textarea");
    const inputText = inputEl ? (inputEl.textContent || "").trim() : "";
    if (inputText && totalText.includes(inputText)) {
      totalText = totalText.replace(inputText, "");
    }

    return Tokenizer.estimate(totalText.trim());
  }

  function countDeepSeek() {
  const msgs = document.querySelectorAll('.ds-message');
  if (msgs.length === 0) return 0;
  const text = Array.from(msgs).map(el => el.textContent || "").join(" ");
  const input = document.querySelector('textarea');
  const inputText = input ? (input.value || "").trim() : "";
  const clean = inputText && text.includes(inputText) ? text.replace(inputText, "") : text;
  return Tokenizer.estimate(clean.trim());
}

  function countGPT() {
    const selectors = [
      "article[data-testid]",
      "div[data-message-id]",
      "[data-testid^='conversation-turn']",
    ];
    for (const sel of selectors) {
      try {
        const nodes = document.querySelectorAll(sel);
        if (nodes.length > 0) {
          return Tokenizer.estimateMessages(
            Array.from(nodes).map(n => n.textContent || "")
          );
        }
      } catch (_) { }
    }
    return 0;
  }

  // ── Auto-save daily usage ──────────────────────────────────────
  function saveDailyUsage(tokens, limit, model) {
    if (tokens < 50) return;
    const today = new Date().toDateString();
    const key = TT.KEY.HISTORY;

    chrome.storage.local.get([key], (r) => {
      const history = r[key] || [];
      const recKey = PLATFORM + "_" + today;
      const idx = history.findIndex(x => x.key === recKey);
      const existing = idx >= 0 ? history[idx] : null;
      if (existing && existing.used >= tokens) return;

      const cost = estimateCost(tokens, model);
      const rec = { key: recKey, platform: PLATFORM, model, used: tokens, limit, cost, ts: Date.now(), date: today };

      if (idx >= 0) history[idx] = rec; else history.push(rec);
      chrome.storage.local.set({ [key]: history.slice(-60) });
    });
  }

  // ── Claude API fetch ───────────────────────────────────────────
  async function fetchClaudeUsage() {
    try {
      const orgsRes = await fetch(TT.API.ORGS, { credentials: "include" });
      if (!orgsRes.ok) return null;
      const orgs = await orgsRes.json();
      const chatOrg = orgs.find(o => Array.isArray(o.capabilities) && o.capabilities.includes("chat"));
      if (!chatOrg) return null;

      const usageRes = await fetch(TT.API.USAGE(chatOrg.uuid), { credentials: "include" });
      if (!usageRes.ok) return null;
      const data = await usageRes.json();

      return {
        five_hour: { utilization: data.five_hour?.utilization ?? 0, resets_at: data.five_hour?.resets_at ?? null },
        seven_day: { utilization: data.seven_day?.utilization ?? 0, resets_at: data.seven_day?.resets_at ?? null },
      };
    } catch { return null; }
  }

  // ── Session watcher ────────────────────────────────────────────
  function watchSession() {
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href === lastUrl) return;
      lastUrl = location.href;
      const newId = getSessionId();
      if (newId !== lastSessionId) {
        lastSessionId = newId;
        lastTokenCount = 0;
        popupShown = false;
        setTimeout(() => { injectBar(); scan(); }, 800);
      }
    }, 500);
    window.addEventListener("popstate", () => setTimeout(scan, 800));
  }

  // ── Scan ───────────────────────────────────────────────────────
  function scan() {
    const tokens = countTokens();
    const model = getModel();
    const limit = TT.LIMITS[model] || TT.LIMITS["default"];
    lastTokenCount = tokens;
    lastModel = model;

    // Get stored rate limit data to show whichever is worse
    if (IS_CLAUDE) {
      chrome.storage.local.get([TT.KEY.USAGE], (r) => {
        const usage = r[TT.KEY.USAGE];
        const sessionPct = usage?.five_hour?.utilization || 0;
        const weeklyPct = usage?.seven_day?.utilization || 0;
        const ratePct = Math.max(sessionPct, weeklyPct);
        const ctxPct = Math.round((tokens / limit) * 100);
        const worstPct = Math.max(ctxPct, ratePct);

        // If rate limit is the bottleneck, show it against a virtual 100-unit scale
        if (ratePct > ctxPct) {
          updateBar(ratePct, 100, true); // true = rateLimit mode
        } else {
          updateBar(tokens, limit, false);
        }
      });
    } else {
      updateBar(tokens, limit, false);
    }

    saveDailyUsage(tokens, limit, model);

    try {
      chrome.runtime.sendMessage({
        type: "CONTEXT_UPDATE", platform: PLATFORM,
        used: tokens, limit, model, cost: estimateCost(tokens, model),
      });
    } catch (_) { }
  }

  function scheduleScan() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; scan(); });
  }

  // ── MutationObserver ───────────────────────────────────────────
  function startObserver() {
    const obs = new MutationObserver(muts => {
      if (muts.some(m => m.addedNodes.length > 0)) scheduleScan();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // ── Bar injection ──────────────────────────────────────────────
  function resolveWrapper() {
    if (IS_CLAUDE) return document.querySelector("fieldset, div[contenteditable='true']");
    if (IS_GEMINI) return document.querySelector("input-area-v2, rich-textarea");
    if (IS_DEEPSEEK) return document.querySelector('textarea');
    return document.querySelector("form:has(#prompt-textarea), form:has(textarea)");
  }

  function injectBar() {
    const existing = document.getElementById("tt-bar");
    if (existing && document.contains(existing)) return;
    if (existing) existing.remove();

    const bar = document.createElement("div");
    bar.id = "tt-bar";
    const inner = document.createElement("div");
    inner.className = "tt-inner";
    const label = document.createElement("span");
    label.className = "tt-label";
    label.textContent = "TOKENS";
    const track = document.createElement("div");
    track.className = "tt-track";
    const fill = document.createElement("div");
    fill.className = "tt-fill";
    fill.id = "tt-fill";
    track.appendChild(fill);
    const count = document.createElement("span");
    count.className = "tt-count";
    count.id = "tt-count";
    count.textContent = "—";

    inner.append(label, track, count);
    bar.appendChild(inner);

    const anchor = () => {
      const w = resolveWrapper();
      if (w?.parentNode) { w.parentNode.insertBefore(bar, w); return true; }
      return false;
    };

    if (!anchor()) {
      document.body.appendChild(bar);
      const t = setInterval(() => { if (anchor()) clearInterval(t); }, 800);
      setTimeout(() => clearInterval(t), 15000);
    }
  }

  // ── Bar update ─────────────────────────────────────────────────
  function updateBar(used, limit, isRateLimit) {
    const fill = document.getElementById("tt-fill");
    const count = document.getElementById("tt-count");
    if (!fill || !count) { injectBar(); return; }

    const pct = Math.min((used / limit) * 100, 100);
    const remaining = Math.max(limit - used, 0);

    fill.style.width = pct + "%";
    fill.className = "tt-fill" + (pct >= TT.DANGER ? " tt-red" : pct >= TT.WARN ? " tt-yellow" : "");

    if (isRateLimit) {
      count.textContent = `Session ${Math.round(pct)}% used`;
    } else {
      count.textContent = formatK(remaining) + " left";
    }

    count.className = "tt-count" + (pct >= TT.DANGER ? " tt-red" : pct >= TT.WARN ? " tt-yellow" : "");

    if (pct >= 100 && !popupShown) { popupShown = true; showPopup(limit); }
  }

  function formatK(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
  }

  // ── Exhaustion popup ───────────────────────────────────────────
  function showPopup(limit) {
    if (document.getElementById("tt-popup")) return;
    const popup = document.createElement("div");
    popup.id = "tt-popup";
    const box = document.createElement("div");
    box.className = "tt-popup-box";
    const icon = document.createElement("div"); icon.className = "tt-popup-icon"; icon.textContent = "⚠";
    const title = document.createElement("div"); title.className = "tt-popup-title"; title.textContent = "Context Limit Reached";
    const body = document.createElement("div"); body.className = "tt-popup-body"; body.textContent = `This conversation has used ~${formatK(limit)} tokens — the full context window.`;
    const tip = document.createElement("div"); tip.className = "tt-popup-tip"; tip.textContent = "Start a new chat to reset.";
    const btn = document.createElement("button"); btn.className = "tt-popup-btn"; btn.textContent = "Got it";
    btn.addEventListener("click", () => { popup.style.opacity = "0"; setTimeout(() => popup.remove(), 300); });
    box.append(icon, title, body, tip, btn);
    popup.appendChild(box);
    document.body.appendChild(popup);
    setTimeout(() => { if (document.getElementById("tt-popup")) { popup.style.opacity = "0"; setTimeout(() => popup.remove(), 300); } }, 12000);
  }

  // ── Message listener ───────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.type === "FETCH_CLAUDE_USAGE" && IS_CLAUDE) {
      fetchClaudeUsage().then(usage => {
        try { chrome.runtime.sendMessage({ type: "CLAUDE_USAGE_RESULT", usage }); } catch (_) { }
      });
    }
    if (msg.type === "GET_CONTEXT_STATE") {
      sendResponse({
        used: lastTokenCount,
        limit: TT.LIMITS[lastModel] || TT.LIMITS["default"],
        model: lastModel,
        cost: estimateCost(lastTokenCount, lastModel),
        platform: PLATFORM,
      });
    }
    return true;
  });

  // ── Boot ───────────────────────────────────────────────────────
  function init() {
    injectBar();
    startObserver();
    startResponseReadyDetector();
    onResponseReady();
    watchSession();
    setTimeout(scan, 800);
    setTimeout(scan, 2500);

    if (IS_CLAUDE) {
      fetchClaudeUsage().then(usage => {
        if (usage) { try { chrome.runtime.sendMessage({ type: "CLAUDE_USAGE_RESULT", usage }); } catch (_) { } }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();