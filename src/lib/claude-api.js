/**
 * claude-api.js
 * Fetches real usage data from Claude's internal API.
 * Called from service-worker.js (background) via message passing,
 * and from content.js (which runs on claude.ai and has cookie access).
 *
 * API shape we know:
 * /usage → { five_hour: { utilization, resets_at }, seven_day: { utilization, resets_at } }
 * /organizations → array, filter for capabilities.includes("chat") to get claude.ai org
 */

const ClaudeAPI = {

  /**
   * Auto-detect the claude.ai org UUID.
   * Filters org list for the one with "chat" capability.
   * Caches result in storage.
   */
  async getOrgId() {
    const cached = await Storage.getOrgId();
    if (cached) return cached;

    try {
      const res = await fetch(TT_CONSTANTS.CLAUDE_API.ORGANIZATIONS, { credentials: "include" });
      if (!res.ok) return null;
      const orgs = await res.json();
      const chatOrg = orgs.find(o => Array.isArray(o.capabilities) && o.capabilities.includes("chat"));
      if (!chatOrg) return null;
      await Storage.saveOrgId(chatOrg.uuid);
      return chatOrg.uuid;
    } catch {
      return null;
    }
  },

  /**
   * Fetch current usage. Returns normalized object.
   * Returns null on any failure — callers handle gracefully.
   */
  async fetchUsage(orgId) {
    try {
      const res = await fetch(TT_CONSTANTS.CLAUDE_API.USAGE(orgId), { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();

      return {
        five_hour: {
          utilization: data.five_hour?.utilization ?? 0,
          resets_at:   data.five_hour?.resets_at   ?? null,
        },
        seven_day: {
          utilization: data.seven_day?.utilization ?? 0,
          resets_at:   data.seven_day?.resets_at   ?? null,
        },
      };
    } catch {
      return null;
    }
  },

  /**
   * Full refresh: detect org if needed, fetch usage, save to storage.
   * Returns the usage object or null.
   */
  async refresh() {
    const orgId = await ClaudeAPI.getOrgId();
    if (!orgId) return null;
    const usage = await ClaudeAPI.fetchUsage(orgId);
    if (!usage) return null;
    await Storage.saveClaudeUsage(usage);
    return usage;
  },

  /**
   * Format resets_at ISO string into a human countdown: "Resets in 4h 23m"
   */
  formatCountdown(resetsAt) {
    if (!resetsAt) return null;
    const diff = new Date(resetsAt) - Date.now();
    if (diff <= 0) return "Resetting soon";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 0) return `Resets in ${h}h ${m}m`;
    return `Resets in ${m}m`;
  },
};
