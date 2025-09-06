/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_SOFTWARE_ID: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENABLE_SIGNATURE: string
  readonly VITE_ENABLE_STRICT_USER_AGENT: string
  readonly VITE_SIGNATURE_SECRET: string
  readonly VITE_ENABLE_DEBUG: string
  readonly VITE_ENABLE_CONSOLE_LOGS: string
  readonly VITE_APP_ENV: string
  readonly VITE_NODE_ENV: string
  readonly VITE_DEBUG_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}