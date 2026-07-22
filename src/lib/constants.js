const TT = {
  API: {
    ORGS:  "https://claude.ai/api/organizations",
    USAGE: (id) => `https://claude.ai/api/organizations/${id}/usage`,
  },
  PLATFORM_LABELS: {
    claude:   "Claude",
    chatgpt:  "ChatGPT",
    gemini:   "Gemini",
    deepseek: "DeepSeek",
  },
  LIMITS: {
    "default":          200000,

    // Claude
    "claude-sonnet-4":  200000,
    "claude-opus-4":    200000,
    "claude-haiku-4":   200000,
    "claude-sonnet-5":  1000000,
    "claude-opus-4-8":  1000000,   
    "claude-haiku-4-5": 200000,

    // GPT
    "gpt-4o":           128000,
    "gpt-3.5":          16385,
    "o1":               200000,
    "o3":               200000,
    "gpt-5.5":          1000000,   

    // Gemini
    "gemini-1.5-pro":   1000000,
    "gemini-1.5-flash": 1000000,
    "gemini-2.0-flash": 1000000,
    "gemini-default":   1000000,
    "gemini-3.1-pro":   1000000,   
    "gemini-3.5-flash": 1000000,   

    // DeepSeek
    "deepseek-v3":      128000,
    "deepseek-r1":      128000,
    "deepseek-default": 1000000,   
    "deepseek-v4-pro":  1000000,   
    "deepseek-v4-flash":1000000,   
  },
  COST_PER_M: {
    "default":          3.00,

    // Claude
    "claude-sonnet-4":  3.00,
    "claude-opus-4":    15.00,
    "claude-haiku-4":   0.80,
    "claude-sonnet-5":  2.00,      
    "claude-opus-4-8":  5.00,
    "claude-haiku-4-5": 1.00,

    // GPT
    "gpt-4o":           2.50,
    "gpt-3.5":          0.50,
    "o1":               15.00,
    "o3":               10.00,
    "gpt-5.5":          5.00,

    // Gemini
    "gemini-1.5-pro":   3.50,
    "gemini-1.5-flash": 0.075,
    "gemini-2.0-flash": 0.10,
    "gemini-default":   0.10,
    "gemini-3.1-pro":   2.00,      
    "gemini-3.5-flash": 1.50,

    // DeepSeek
    "deepseek-v3":      0.27,
    "deepseek-r1":      0.55,
    "deepseek-default": 0.435,
    "deepseek-v4-pro":  0.435,     
    "deepseek-v4-flash":0.14,
  },
  WARN:   70,
  DANGER: 90,
  COLOR: {
    GREEN:  "#06b6d4",
    YELLOW: "#f59e0b",
    RED:    "#ef4444",
  },
  KEY: {
    ORG_ID:   "tt_org_id",
    USAGE:    "tt_claude_usage",
    CONTEXT:  "tt_context",
    HISTORY:  "tt_history",
    SETTINGS: "tt_settings",
    NOTIFIED: "tt_last_notified",
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
