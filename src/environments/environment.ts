export const environment = {
  production: true,

  // API Configuration
  apiUrl: '/api',  // Same origin in production

  // Feature Flags
  useMockApi: false,

  features: {
    workspace: true,
    aiChat: true,
    notionIntegration: true,
    learningPaths: true,
    excalidraw: true,
  },

  // AI Configuration
  ai: {
    streamingEnabled: true,
    maxTokens: 2048,
  },

  // Storage
  storage: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    userKey: 'current_user',
  },

  // Debug
  enableDebugLogs: false,
};
