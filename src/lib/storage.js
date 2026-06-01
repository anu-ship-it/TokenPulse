/**
 * storage.js
 * Every chrome.storage read/write goes through here. Nowhere else.
 * Keeps storage keys and serialization logic in one place.
 */

const Storage = {
  async get(key) {
    return new Promise(res => chrome.storage.local.get([key], r => res(r[key] ?? null)));
  },
  async set(key, value) {
    return new Promise(res => chrome.storage.local.set({ [key]: value }, res));
  },
  async getSettings() {
    const s = await Storage.get(TT_CONSTANTS.STORAGE_KEYS.SETTINGS);
    return { ...TT_CONSTANTS.DEFAULT_SETTINGS, ...(s || {}) };
  },
  async saveSettings(settings) {
    return Storage.set(TT_CONSTANTS.STORAGE_KEYS.SETTINGS, settings);
  },
  async getClaudeUsage() {
    return await Storage.get(TT_CONSTANTS.STORAGE_KEYS.CLAUDE_USAGE);
  },
  async saveClaudeUsage(usage) {
    return Storage.set(TT_CONSTANTS.STORAGE_KEYS.CLAUDE_USAGE, {
      ...usage,
      fetched_at: Date.now(),
    });
  },
  async getContext() {
    return (await Storage.get(TT_CONSTANTS.STORAGE_KEYS.CONTEXT)) || {};
  },
  async saveContext(platform, data) {
    const all = await Storage.getContext();
    all[platform] = { ...data, ts: Date.now() };
    return Storage.set(TT_CONSTANTS.STORAGE_KEYS.CONTEXT, all);
  },
  async getHistory() {
    return (await Storage.get(TT_CONSTANTS.STORAGE_KEYS.HISTORY)) || [];
  },
  async pushHistory(entry) {
    const h = await Storage.getHistory();
    const key = entry.platform + "_" + new Date().toDateString();
    const idx = h.findIndex(x => x.key === key);
    const record = { ...entry, key, ts: Date.now() };
    if (idx >= 0) h[idx] = record; else h.push(record);
    return Storage.set(TT_CONSTANTS.STORAGE_KEYS.HISTORY, h.slice(-60));
  },
  async getOrgId() {
    return Storage.get(TT_CONSTANTS.STORAGE_KEYS.CLAUDE_ORG_ID);
  },
  async saveOrgId(id) {
    return Storage.set(TT_CONSTANTS.STORAGE_KEYS.CLAUDE_ORG_ID, id);
  },
  async getLastNotified() {
    return (await Storage.get(TT_CONSTANTS.STORAGE_KEYS.LAST_NOTIFIED)) || {};
  },
  async saveLastNotified(data) {
    return Storage.set(TT_CONSTANTS.STORAGE_KEYS.LAST_NOTIFIED, data);
  },
};
