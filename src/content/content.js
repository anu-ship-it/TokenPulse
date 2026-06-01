/**
 * content.js
 * Runs on both ChatGPT and Claude pages.
 * Responsibilities:
 *  1. Detect platform
 *  2. Count context window tokens (both platforms)
 *  3. Fetch Claude API usage (Claude only — has cookie access here)
 *  4. Inject in-page token bar above input
 *  5. Report data to service worker
 */

(() => {
  "use strict";

  // ── Platform detection ────────────────────────────────────────────
  const IS_CLAUDE = location.hostname.includes("claude.ai");
  const IS_GPT    = location.hostname.includes("chatgpt.com") || location.hostname.includes("openai.com");
  if (!IS_CLAUDE && !IS_GPT) return;

  const PLATFORM = IS_CLAUDE ? "claude" : "chatgpt";

  // ── State ─────────────────────────────────────────────────────────
  let lastTokenCount  = 0;
  let lastSessionId   = getSessionId();
  let popupShown      = false;
  let rafPending      = false;
  let observer        = null;

  // ── Context limit ─────────────────────────────────────────────────
  function getLimit() {
    if (IS_CLAUDE) return TT_CONSTANTS.CONTEXT_LIMITS["default"];
    const btn = document.querySelector("[data-testid='model-switcher-dropdown-button'], button[aria-label*='GPT']");
    const txt = btn ? btn.textContent.toLowerCase() : "";
    if (txt.includes("o3"))  return TT_CONSTANTS.CONTEXT_LIMITS["o3"];
    if (txt.includes("o1"))  return TT_CONSTANTS.CONTEXT_LIMITS["o1"];
    if (txt.includes("4o"))  return TT_CONSTANTS.CONTEXT_LIMITS["gpt-4o"];
    if (txt.includes("3.5")) return TT_CONSTANTS.CONTEXT_LIMITS["gpt-3.5"];
    return TT_CONSTANTS.CONTEXT_LIMITS["gpt-4o"];
  }

  function getSessionId() {
    if (IS_CLAUDE) {
      const m = location.pathname.match(/\/chat\/([a-z0-9-]+)/i);
      return m ? m[1] : location.pathname;
    }
    const m = location.pathname.match(/\/c\/([a-z0-9-]+)/i);
    return m ? m[1] : "home";
  }

  // ── Token counting ────────────────────────────────────────────────
  function countTokens() {
    if (IS_CLAUDE) return countClaude();
    return countGPT();
  }

  function countClaude() {
    // Conversation lives in largest text child of body (confirmed via diagnostic)
    let best = null, bestLen = 0;
    for (const el of document.body.children) {
      if (el.id === "tt-bar" || el.id === "tt-popup") continue;
      const len = (el.textContent || "").trim().length;
      if (len > bestLen) { bestLen = len; best = el; }
    }
    if (!best || bestLen < 50) return 0;

    const inputEl   = document.querySelector("div[contenteditable='true']");
    const inputText = inputEl ? (inputEl.textContent || "").trim() : "";
    let text        = (best.textContent || "").trim();
    if (inputText && text.includes(inputText)) text = text.replace(inputText, "");
    return Tokenizer.estimate(text);
  }

  function countGPT() {
    const selectors = ["article[data-testid]", "div[data-message-id]", "[data-testid^='conversation-turn']"];
    for (const sel of selectors) {
      try {
        const nodes = document.querySelectorAll(sel);
        if (nodes.length > 0) return Tokenizer.estimateMessages(Array.from(nodes).map(n => n.textContent || ""));
      } catch (_) {}
    }
    return 0;
  }

  // ── Claude API fetch (content script has cookies) ─────────────────
  async function fetchClaudeUsage() {
    try {
      const orgsRes = await fetch(TT_CONSTANTS.CLAUDE_API.ORGANIZATIONS, { credentials: "include" });
      if (!orgsRes.ok) return null;
      const orgs    = await orgsRes.json();
      const chatOrg = orgs.find(o => Array.isArray(o.capabilities) && o.capabilities.includes("chat"));
      if (!chatOrg) return null;

      const usageRes = await fetch(TT_CONSTANTS.CLAUDE_API.USAGE(chatOrg.uuid), { credentials: "include" });
      if (!usageRes.ok) return null;
      const data = await usageRes.json();

      return {
        five_hour: { utilization: data.five_hour?.utilization ?? 0, resets_at: data.five_hour?.resets_at ?? null },
        seven_day: { utilization: data.seven_day?.utilization ?? 0, resets_at: data.seven_day?.resets_at ?? null },
      };
    } catch {
      return null;
    }
  }

  // ── Session reset ─────────────────────────────────────────────────
  function watchSession() {
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href === lastUrl) return;
      lastUrl = location.href;
      const newId = getSessionId();
      if (newId !== lastSessionId) {
        lastSessionId  = newId;
        lastTokenCount = 0;
        popupShown     = false;
        setTimeout(() => { injectBar(); scan(); }, 800);
      }
    }, 500);
    window.addEventListener("popstate", () => setTimeout(scan, 800));
  }

  // ── Scan ──────────────────────────────────────────────────────────
  function scan() {
    const tokens = countTokens();
    const limit  = getLimit();
    lastTokenCount = tokens;
    updateBar(tokens, limit);

    // Report to service worker
    chrome.runtime.sendMessage({
      type:     "CONTEXT_UPDATE",
      platform: PLATFORM,
      used:     tokens,
      limit,
    });
  }

  function scheduleScan() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; scan(); });
  }

  // ── MutationObserver ──────────────────────────────────────────────
  function startObserver() {
    observer = new MutationObserver(muts => {
      if (muts.some(m => m.addedNodes.length > 0)) scheduleScan();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Bar injection ─────────────────────────────────────────────────
  function resolveWrapper() {
    const selectors = IS_CLAUDE
      ? ["fieldset", "div[contenteditable='true']"]
      : ["form:has(#prompt-textarea)", "form:has(textarea)", "div[class*='stretch']"];
    for (const sel of selectors) {
      try { const el = document.querySelector(sel); if (el) return el; } catch (_) {}
    }
    return null;
  }

  function injectBar() {
    const existing = document.getElementById("tt-bar");
    if (existing && document.contains(existing)) return;
    if (existing) existing.remove();

    const bar   = document.createElement("div");
    bar.id      = "tt-bar";
    const inner = document.createElement("div");
    inner.className = "tt-inner";

    const label = document.createElement("span");
    label.className = "tt-label";
    label.textContent = "TOKENS";

    const track = document.createElement("div");
    track.className = "tt-track";
    const fill  = document.createElement("div");
    fill.className  = "tt-fill";
    fill.id         = "tt-fill";
    track.appendChild(fill);

    const count = document.createElement("span");
    count.className = "tt-count";
    count.id        = "tt-count";
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

  function updateBar(used, limit) {
    const fill  = document.getElementById("tt-fill");
    const count = document.getElementById("tt-count");
    if (!fill || !count) { injectBar(); return; }

    const pct       = Math.min((used / limit) * 100, 100);
    const remaining = Math.max(limit - used, 0);
    const color     = pct >= 90 ? "tt-red" : pct >= 70 ? "tt-yellow" : "";

    fill.style.width = pct + "%";
    fill.className   = "tt-fill" + (color ? " " + color : "");
    count.textContent = formatK(remaining) + " left";
    count.className   = "tt-count" + (color ? " " + color : "");

    if (pct >= 100 && !popupShown) { popupShown = true; showPopup(limit); }
  }

  function formatK(n) { return n >= 1000 ? (n/1000).toFixed(1)+"k" : String(n); }

  // ── Exhaustion popup ──────────────────────────────────────────────
  function showPopup(limit) {
    if (document.getElementById("tt-popup")) return;
    const popup = document.createElement("div");
    popup.id    = "tt-popup";

    const box   = document.createElement("div");
    box.className = "tt-popup-box";
    box.innerHTML = `
      <div class="tt-popup-icon">⚠</div>
      <div class="tt-popup-title">Context Limit Reached</div>
      <div class="tt-popup-body">This conversation has used ~${formatK(limit)} tokens — the full context window. The model may start losing earlier context.</div>
      <div class="tt-popup-tip">Start a new chat to reset.</div>
      <button class="tt-popup-btn" id="tt-popup-close">Got it</button>
    `;

    popup.appendChild(box);
    document.body.appendChild(popup);
    document.getElementById("tt-popup-close").onclick = () => {
      popup.style.opacity = "0";
      setTimeout(() => popup.remove(), 300);
    };
    setTimeout(() => {
      if (document.getElementById("tt-popup")) {
        popup.style.opacity = "0";
        setTimeout(() => popup.remove(), 300);
      }
    }, 12000);
  }

  // ── Message listener ──────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.type === "FETCH_CLAUDE_USAGE" && IS_CLAUDE) {
      fetchClaudeUsage().then(usage => {
        chrome.runtime.sendMessage({ type: "CLAUDE_USAGE_RESULT", usage });
      });
    }
    if (msg.type === "GET_CONTEXT_STATE") {
      sendResponse({ used: lastTokenCount, limit: getLimit(), platform: PLATFORM });
    }
    return true;
  });

  // ── Boot ──────────────────────────────────────────────────────────
  function init() {
    injectBar();
    startObserver();
    watchSession();
    setTimeout(scan, 800);
    setTimeout(scan, 2500);
    // Claude: also trigger an API fetch immediately
    if (IS_CLAUDE) {
      fetchClaudeUsage().then(usage => {
        if (usage) chrome.runtime.sendMessage({ type: "CLAUDE_USAGE_RESULT", usage });
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

})();
