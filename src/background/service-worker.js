importScripts(
  "../lib/constants.js",
  "../lib/storage.js"
);

// Notification icon — green square, no file dependency
const ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABIUlEQVR42u3awRHCIBAFUMaDVTi2Z4dWkiJswZOOB28k/L/8ZReFGc75L8AmkJSyWimny/W118/3bbenDo4AwiBIcAYwDMIEtwBcIZbwKUZDETxsfShC3h7Pbkjonf8Aat0d4Q1gIWHzvgWoQboQ6oWKAmQIz6rDTika4B0ehZhHYSQArVIwICL8EYKeSpGAFqIJ6Llwb5OMQgZA1ygsgAhQQ/wMoIZwrUCtoGg1mh5wNI0WYE2hfwK4lVElIORBtgDgy1wN4vo67QX49qk2NBAg65YSDm8FoHfMsqmnARYEe3H2pI4KzwKYQyv2YMsMQBFpw7MjMSI4HV6xFlTBzQBFWbWGlYTPcuA1xbcy1+ARiJTfi1ME94JM8c9EyuAZ2hsPB2OJfY4DKQAAAABJRU5ErkJggg==";

// ── Install ────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome/welcome.html") });
    chrome.runtime.setUninstallURL("https://token-pulse.in/uninstall");
  }
  await setupAlarm();
});

chrome.runtime.onStartup.addListener(setupAlarm);

async function setupAlarm() {
  const settings = await Storage.getSettings();
  const mins = settings.refresh_minutes || 5;
  await chrome.alarms.clearAll();
  chrome.alarms.create(TT.ALARM, {
    periodInMinutes: mins,
    delayInMinutes: 0.1,
  });
}

// ── Alarm ──────────────────────────────────────────────────────────
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== TT.ALARM) return;
  triggerUsageFetch();
});

function triggerUsageFetch() {
  chrome.tabs.query({ url: "https://claude.ai/*" }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "FETCH_CLAUDE_USAGE" }, () => {
        // "Could not establish connection" here means the tab's content
        // script isn't listening yet (still loading, or Chrome has the
        // tab discarded/asleep) — expected and harmless, not a failure.
        // Reading lastError inside the callback marks it handled so
        // Chrome doesn't also log an unhandled promise rejection.
        void chrome.runtime.lastError;
      });
    }
  });
}

// ── Messages ───────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Cases that are fire-and-forget (no sendResponse needed)
  // must NOT return true — returning true tells Chrome to keep
  // the channel open waiting for a response that never comes.

  if (msg.type === "CLAUDE_USAGE_RESULT") {
    // Fire and forget — no response needed
    (async () => {
      if (msg.usage) {
        await Storage.saveUsage(msg.usage);
        await checkRateLimitNotifications(msg.usage);
      }
    })();
    return false; // channel can close immediately
  }

  if (msg.type === "RESPONSE_READY") {
    // Fire and forget — no response needed
    (async () => {
      const settings = await Storage.getSettings();
      if (settings.notify_response_ready === false) return;
      chrome.notifications.create(`tt_response_ready_${Date.now()}`, {
        type: "basic",
        iconUrl: ICON,
        title: `${msg.platformName} — Response ready`,
        message: "Your response has finished generating. Switch back to continue.",
        priority: 1,
      });
    })();
    sendResponse({ ok: true });
    return false; // channel can close immediately
  }

  // All remaining cases send a response — return true to keep channel open.
  // Wrapped in try/catch so sendResponse is GUARANTEED to fire even if a
  // Storage call or anything else inside throws — return true is an
  // unconditional promise to Chrome that a response is coming, and an
  // uncaught throw here was breaking that promise, leaving the channel
  // open until the popup closed (which is when Chrome reports "channel
  // closed before response received").
  (async () => {
    try {
      switch (msg.type) {

        case "CONTEXT_UPDATE": {
          await Storage.saveContext(msg.platform, { used: msg.used, limit: msg.limit });
          await checkContextNotifications(msg.platform, msg.used, msg.limit);
          sendResponse({ ok: true });
          break;
        }

        case "GET_ALL_DATA": {
          const [usage, context, history, settings] = await Promise.all([
            Storage.getUsage(),
            Storage.getContext(),
            Storage.getHistory(),
            Storage.getSettings(),
          ]);
          sendResponse({ usage, context, history, settings });
          break;
        }

        case "SAVE_SETTINGS": {
          await Storage.saveSettings(msg.settings);
          await setupAlarm();
          sendResponse({ ok: true });
          break;
        }

        case "FORCE_REFRESH": {
          triggerUsageFetch();
          sendResponse({ ok: true });
          break;
        }

        default: {
          // Unknown message type — respond so the channel closes cleanly
          sendResponse({ ok: false, error: "unknown message type" });
          break;
        }
      }
    } catch (err) {
      sendResponse({ ok: false, error: String(err?.message || err) });
    }
  })();

  return true; // keep channel open for the async sendResponse above
});

// ── Notification helper ────────────────────────────────────────────
function notify(id, title, message, priority) {
  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: ICON,
    title: `TokenPulse — ${title}`,
    message,
    priority: priority || 1,
  });
}

// ── Threshold tracker ──────────────────────────────────────────────
const THRESHOLDS = [50, 75, 90, 100];

async function shouldNotify(stateKey, currentPct, settings) {
  const enabled = THRESHOLDS.filter(t => {
    if (t === 50)  return settings.notify_50;
    if (t === 75)  return settings.notify_75;
    if (t === 90)  return settings.notify_90;
    if (t === 100) return settings.notify_100;
    return false;
  });

  if (enabled.length === 0) return null;

  const crossed = enabled.filter(t => currentPct >= t).pop() || 0;
  const lastNotified = await Storage.getLastNotified();
  const last = lastNotified[stateKey] || 0;

  if (crossed === 0 && last > 0) {
    lastNotified[stateKey] = 0;
    await Storage.saveLastNotified(lastNotified);
    return null;
  }

  if (crossed <= 0 || crossed <= last) return null;

  lastNotified[stateKey] = crossed;
  await Storage.saveLastNotified(lastNotified);
  return crossed;
}

// ── Claude rate limit notifications ───────────────────────────────
async function checkRateLimitNotifications(usage) {
  const settings = await Storage.getSettings();
  const sessionPct = usage.five_hour?.utilization || 0;
  const weeklyPct  = usage.seven_day?.utilization  || 0;
  const maxPct     = Math.max(sessionPct, weeklyPct);

  const threshold = await shouldNotify("claude_rate", maxPct, settings);
  if (!threshold) return;

  const isSession = sessionPct >= weeklyPct;
  const pct       = Math.round(isSession ? sessionPct : weeklyPct);
  const limitType = isSession ? "5-hour session" : "7-day weekly";
  const priority  = threshold >= 90 ? 2 : 1;

  const tips = {
    50:  "You're halfway through your Claude limit.",
    75:  "Only 25% of your Claude limit remaining.",
    90:  "Almost out — consider wrapping up soon.",
    100: "Limit reached. Usage will be restricted.",
  };

  notify(
    `tt_rate_${threshold}`,
    `Claude ${limitType} at ${pct}%`,
    tips[threshold] || `Your ${limitType} usage has reached ${pct}%.`,
    priority
  );
}

// ── Context window notifications ───────────────────────────────────
async function checkContextNotifications(platform, used, limit) {
  if (!used || !limit) return;
  const settings  = await Storage.getSettings();
  const pct       = Math.round((used / limit) * 100);
  const name      = TT.PLATFORMS[platform]?.label || platform;
  const remaining = Math.round((limit - used) / 1000);

  const threshold = await shouldNotify(`ctx_${platform}`, pct, settings);
  if (!threshold) return;

  const priority = threshold >= 90 ? 2 : 1;

  const messages = {
    50:  `~${remaining}k tokens remaining. You're halfway through this conversation's context.`,
    75:  `~${remaining}k tokens remaining. Consider starting a new chat soon.`,
    90:  `~${remaining}k tokens remaining. Context window nearly full — start a new chat.`,
    100: `Context window full. The model may lose earlier parts of your conversation.`,
  };

  notify(
    `tt_ctx_${platform}_${threshold}`,
    `${name} context at ${threshold}%`,
    messages[threshold] || `${name} context window is ${threshold}% full. ~${remaining}k tokens remaining.`,
    priority
  );
}

// ── External auth handoff ───────────────────────────────────────
// Only reachable from https://token-pulse.in (see manifest.json's
// externally_connectable) — Chrome enforces that origin restriction
// before this listener even fires, but sender.origin is checked again
// here too, defense in depth, in case that manifest entry ever
// broadens later without this file being revisited.
const AUTH_ORIGIN = "https://token-pulse.in";
const AUTH_SESSION_KEY = "tt_auth_session";

chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (sender.origin !== AUTH_ORIGIN) {
    sendResponse({ ok: false, error: "untrusted origin" });
    return false;
  }

  if (msg.type === "AUTH_SUCCESS" && msg.session) {
    chrome.storage.local.set({ [AUTH_SESSION_KEY]: msg.session }, () => {
      sendResponse({ ok: true });
    });
    return true; // async — storage.set's callback fires later
  }

  if (msg.type === "AUTH_SIGN_OUT") {
    chrome.storage.local.remove(AUTH_SESSION_KEY, () => {
      sendResponse({ ok: true });
    });
    return true;
  }

  sendResponse({ ok: false, error: "unknown message type" });
  return false;
});
