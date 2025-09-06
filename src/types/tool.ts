export interface ToolConfig {
  name: string;
  folder: string;
  targetFile?: string;
  executable?: string;
  args?: string[];
}

export interface ConfigJson {
  targetFile: string;
  executable?: string;
  args?: string[];
  version?: string;
  description?: string;
}

export interface ToolCheckResult {
  success: boolean;
  message?: string;
  error?: string;
}