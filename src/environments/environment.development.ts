export const environment = {
  production: false,

  // API Configuration
  apiUrl: 'http://localhost:8080/api',

  // Feature Flags
  useMockApi: true,  // 🔑 切換 Mock/Real API

  features: {
    workspace: true,
    aiChat: true,
    notionIntegration: true,
    learningPaths: true,
    excalidraw: true,
  },

  // AI Configuration (for future use)
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
  enableDebugLogs: true,
};
