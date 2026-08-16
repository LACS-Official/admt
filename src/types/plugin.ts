export type PluginCategory =
  | "all"
  | "life"
  | "dev"
  | "common"
  | "tools"
  | "flash"
  | "tuning"
  | "ai"
  | "ui"
  | "system";

export type PluginPermission =
  | "adb:execute"
  | "fastboot:execute"
  | "device:info"
  | "fs:read"
  | "fs:write"
  | "net:http"
  | "ui:toast"
  | "ui:modal"
  | "mcp:access";

export interface PluginAuthor {
  name: string;
  email?: string;
  url?: string;
  avatar?: string;
}

export interface PluginSettingItem {
  id: string;
  name: string;
  description?: string;
  type: "string" | "number" | "boolean" | "select";
  default: any;
  options?: { label: string; value: any }[];
  current?: any;
}

export interface PluginManifest {
  id: string;
  name: string;
  nameEn?: string;
  version: string;
  description: string;
  descriptionEn?: string;
  author: PluginAuthor;
  icon?: string;
  category: PluginCategory;
  tags?: string[];
  minAppVersion?: string;
  permissions: PluginPermission[];
  homepage?: string;
  repository?: string;
  main?: string; // 入口脚本或主组件标识
  guiHtml?: string; // 内置 HTML GUI 界面源代码
  settingsSchema?: PluginSettingItem[];
}

export interface ADMTPlugin {
  manifest: PluginManifest;
  isEnabled: boolean;
  isInstalled: boolean;
  installedAt?: string;
  updatedAt?: string;
  settings?: Record<string, any>;
  source: "builtin" | "local" | "store" | "git";
  downloadUrl?: string;
  fileSize?: string;
  rating?: number;
  downloadsCount?: number;
}

export interface PluginStoreItem extends ADMTPlugin {
  screenshots?: string[];
  changelog?: { version: string; date: string; notes: string }[];
  readme?: string;
}
