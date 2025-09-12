/// <reference types="vite/client" />

// Vite环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_SOFTWARE_ID: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENV: string
  readonly VITE_NODE_ENV: string
  readonly VITE_ENABLE_SIGNATURE: string
  readonly VITE_ENABLE_STRICT_USER_AGENT: string
  readonly VITE_SIGNATURE_SECRET: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_ENABLE_DEBUG: string
  readonly VITE_ENABLE_CONSOLE_LOGS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Vite构建时注入的全局变量
declare const __APP_VERSION__: string
declare const __APP_NAME__: string

// 扩展全局对象类型
declare global {
  const __APP_VERSION__: string
  const __APP_NAME__: string
}

export {}