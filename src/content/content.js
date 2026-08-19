const TT = {
  // Fill in ANON_KEY from Supabase → Project Settings → API. Same value
  // that belongs in auth.html — these two copies must be kept in sync
  // manually, since they live in genuinely separate codebases (this
  // extension vs. the website) that can't share a single file.
  SUPABASE: {
    URL: "https://didixxqgrwoxytphiabx.supabase.co",
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZGl4eHFncndveHl0cGhpYWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjgzMzYsImV4cCI6MjEwMTcwNDMzNn0.1GOWsOpMVIq1TcmRAy9aJw6pIRdTsIGi72560veCDQg",
  },

  API: {
    ORGS:  "https://claude.ai/api/organizations",
    USAGE: (id) => `https://claude.ai/api/organizations/${id}/usage`,
  },

  // Single source of truth for everything platform-specific.
  // content.js, service-worker.js, and popup.js all read from this —
  // adding a new platform means editing ONLY this block plus LIMITS/
  // COST_PER_M/MODEL_LABELS/TIPS below. Nothing else should ever
  // hardcode a platform name again.
  PLATFORMS: {
    claude: {
      hosts: ["claude.ai"],
      label: "Claude",
      badgeClass: "badge-claude",
      newChatUrl: "https://claude.ai/new",
      defaultLimitKey: "default",
      defaultModelKey: "claude-sonnet-4",
      hasRateLimits: true,
    },
    chatgpt: {
      hosts: ["chatgpt.com", "openai.com"],
      label: "ChatGPT",
      badgeClass: "badge-chatgpt",
      newChatUrl: "https://chatgpt.com/",
      defaultLimitKey: "gpt-4o",
      defaultModelKey: "gpt-4o",
      hasRateLimits: false,
    },
    gemini: {
      hosts: ["gemini.google.com"],
      label: "Gemini",
      badgeClass: "badge-gemini",
      newChatUrl: "https://gemini.google.com/",
      defaultLimitKey: "gemini-default",
      defaultModelKey: "gemini-default",
      hasRateLimits: false,
    },
    deepseek: {
      hosts: ["chat.deepseek.com"],
      label: "DeepSeek",
      badgeClass: "badge-deepseek",
      newChatUrl: "https://chat.deepseek.com/",
      defaultLimitKey: "deepseek-default",
      defaultModelKey: "deepseek-default",
      hasRateLimits: false,
    },
    grok: {
      hosts: ["grok.com"],
      label: "Grok",
      badgeClass: "badge-grok",
      newChatUrl: "https://grok.com/",
      defaultLimitKey: "grok-default",
      defaultModelKey: "grok-default",
      hasRateLimits: false,
    },
  },

  LIMITS: {
    "default":            200000,
    "claude-sonnet-4":    200000,
    "claude-opus-4":      200000,
    "claude-haiku-4":     200000,
    "gpt-4o":             128000,
    "gpt-3.5":            16385,
    "o1":                 200000,
    "o3":                 200000,
    "gemini-1.5-pro":     1000000,
    "gemini-1.5-flash":   1000000,
    "gemini-2.0-flash":   1000000,
    "gemini-default":     1000000,
    "deepseek-v3":        128000,
    "deepseek-r1":        128000,
    "deepseek-default":   128000,
    "grok-4.5":           500000,
    "grok-4.3":           1000000,
    "grok-default":       500000,
  },
  COST_PER_M: {
    "default":            3.00,
    "claude-sonnet-4":    3.00,
    "claude-opus-4":      15.00,
    "claude-haiku-4":     0.80,
    "gpt-4o":             2.50,
    "gpt-3.5":            0.50,
    "o1":                 15.00,
    "o3":                 10.00,
    "gemini-1.5-pro":     3.50,
    "gemini-1.5-flash":   0.075,
    "gemini-2.0-flash":   0.10,
    "gemini-default":     0.10,
    "deepseek-v3":        0.27,
    "deepseek-r1":        0.55,
    "deepseek-default":   0.27,
    "grok-4.5":           2.00,
    "grok-4.3":           1.25,
    "grok-default":       2.00,
  },
  WARN:   70,
  DANGER: 90,
  COLOR: {
    GREEN:  "#06b6d4",
    YELLOW: "#f59e0b",
    RED:    "#ef4444",
  },
  KEY: {
    ORG_ID:       "tt_org_id",
    USAGE:        "tt_claude_usage",
    CONTEXT:      "tt_context",
    HISTORY:      "tt_history",
    SETTINGS:     "tt_settings",
    NOTIFIED:     "tt_last_notified",
    AUTH_SESSION: "tt_auth_session",
  },
  ALARM: "tt_fetch",
  DEFAULTS: {
    notify_50:       false,
    notify_75:       true,
    notify_90:       true,
    notify_100:      true,
    notify_response_ready: true,
    refresh_minutes: 5,
    show_bar:        true,
  },
};