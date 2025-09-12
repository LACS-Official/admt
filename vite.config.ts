import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import { resolve } from "path";

// 读取package.json获取版本号
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, "package.json"), "utf-8")
);

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // 定义全局常量，注入版本信息
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_NAME__: JSON.stringify(packageJson.name),
  },

  // 环境变量配置
  envPrefix: ['VITE_'],
  
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  
  // 添加路径别名解析
  resolve: {
    alias: {
      "@": "/src",
      "@/components": "/src/components",
      "@/services": "/src/services",
      "@/stores": "/src/stores",
      "@/types": "/src/types",
      "@/utils": "/src/utils"
    }
  },

  // 构建配置
  build: {
    // 在构建时注入环境变量
    rollupOptions: {
      external: [],
    },
  },

  // 环境变量处理
  envDir: './',
}));