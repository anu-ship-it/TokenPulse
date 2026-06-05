importScripts(
  "../lib/constants.js",
  "../lib/storage.js"
);

// ── Install ────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome/welcome.html") });
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
    delayInMinutes:  0.1,
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
      chrome.tabs.sendMessage(tabs[0].id, { type: "FETCH_CLAUDE_USAGE" });
    }
  });
}

// ── Messages ───────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg.type) {

      case "CLAUDE_USAGE_RESULT": {
        if (msg.usage) {
          await Storage.saveUsage(msg.usage);
          await checkRateLimitNotifications(msg.usage);
        }
        break;
      }

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
    }
  })();
  return true;
});

// ── Notification core ──────────────────────────────────────────────
const THRESHOLDS = [50, 75, 90, 100];

function notify(id, title, message, priority) {
  chrome.notifications.create(id, {
    type:     "basic",
    title,
    message,
    priority: priority || 1,
    iconUrl:  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  });
}

/**
 * Threshold tracker — only notifies when crossing a NEW higher threshold.
 * Resets when usage drops below the lowest threshold.
 * Key is stored per notification type so rate limits and context
 * windows track independently.
 */
async function shouldNotify(stateKey, currentPct, settings) {
  // Check which thresholds are enabled
  const enabledThresholds = THRESHOLDS.filter(t => {
    if (t === 50)  return settings.notify_50;
    if (t === 75)  return settings.notify_75;
    if (t === 90)  return settings.notify_90;
    if (t === 100) return settings.notify_100;
    return false;
  });

  if (enabledThresholds.length === 0) return null;

  // Find highest threshold crossed
  const crossed = enabledThresholds.filter(t => currentPct >= t).pop() || 0;

  // Get last notified threshold for this key
  const lastNotified = await Storage.getLastNotified();
  const lastThreshold = lastNotified[stateKey] || 0;

  // Reset if usage dropped below lowest enabled threshold
  if (crossed === 0 && lastThreshold > 0) {
    lastNotified[stateKey] = 0;
    await Storage.saveLastNotified(lastNotified);
    return null;
  }

  // Only notify if we crossed a NEW higher threshold
  if (crossed <= 0 || crossed <= lastThreshold) return null;

  // Save new threshold
  lastNotified[stateKey] = crossed;
  await Storage.saveLastNotified(lastNotified);

  return crossed;
}

// ── Claude rate limit notifications ───────────────────────────────
async function checkRateLimitNotifications(usage) {
  const settings   = await Storage.getSettings();
  const sessionPct = usage.five_hour?.utilization || 0;
  const weeklyPct  = usage.seven_day?.utilization  || 0;
  const maxPct     = Math.max(sessionPct, weeklyPct);

  const threshold = await shouldNotify("claude_rate", maxPct, settings);
  if (!threshold) return;

  const isSession  = sessionPct >= weeklyPct;
  const pct        = Math.round(isSession ? sessionPct : weeklyPct);
  const limitType  = isSession ? "5-hour session" : "7-day weekly";
  const priority   = threshold >= 90 ? 2 : 1;

  notify(
    `tt_rate_${threshold}`,
    `Claude usage at ${pct}%`,
    `Your ${limitType} limit has reached ${pct}%. ${threshold >= 90 ? "Consider starting a new session." : ""}`,
    priority
  );
}

// ── Context window notifications (both platforms) ─────────────────
async function checkContextNotifications(platform, used, limit) {
  if (!used || !limit) return;
  const settings = await Storage.getSettings();
  const pct      = Math.round((used / limit) * 100);
  const name     = platform === "claude" ? "Claude" : "ChatGPT";

  const threshold = await shouldNotify(`ctx_${platform}`, pct, settings);
  if (!threshold) return;

  const remaining = Math.round(((limit - used) / 1000));
  const priority  = threshold >= 90 ? 2 : 1;

  notify(
    `tt_ctx_${platform}_${threshold}`,
    `${name} context at ${threshold}%`,
    `~${remaining}k tokens remaining in this conversation. ${threshold >= 90 ? "Start a new chat to reset context." : threshold === 100 ? "Context window full." : ""}`,
    priority
  );
}
