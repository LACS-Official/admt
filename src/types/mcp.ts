export interface McpServerConfig {
  enabled: boolean;
  port: number;
  host: string;
  authToken?: string;
  autoStart: boolean;
  allowDeviceCommands: boolean;
  allowFileOperations: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

export interface McpToolParameterProperty {
  type: string;
  description?: string;
  enum?: string[];
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, McpToolParameterProperty>;
    required?: string[];
  };
}

export interface McpServerStatus {
  isRunning: boolean;
  port: number;
  url: string;
  connectedClients: number;
  startTime?: string;
  toolsCount: number;
}

export interface AISkillResource {
  id: string;
  title: string;
  category: "flash" | "magisk" | "reverse" | "rom" | "kernel" | "tuning";
  description: string;
  author: string;
  tags: string[];
  systemPrompt: string;
  recommendedModels: string[];
}

export interface McpServerResource {
  id: string;
  name: string;
  description: string;
  category: "official" | "community" | "device" | "system" | "web" | "dev" | "ai";
  transport: "sse" | "stdio" | "http";
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  configSnippets: {
    cursor: string;
    claudeDesktop: string;
    antigravity: string;
    windsurf: string;
  };
}
