## 问题定位
- 开发版正常而发布版异常，典型与构建资源路径和多窗口 URL 解析有关。
- 证据：
  - 未设置 `base`：`e:\tauri\admt\vite.config.ts:6–21`。Vite 默认 `base: '/'`，在 Tauri 生产环境下易导致资源以绝对根路径解析。
  - 多窗口使用绝对路径：`e:\tauri\admt\src\components\MainContent\MainContent.tsx:1100–1102` 与 `1158–1160` 均为 `url: '/command_panel.html'`、`url: '/log_panel.html'`。Tauri v2 推荐传递“路径部分”，不带前导 `/`。
  - HTML 入口脚本与图标为绝对路径：`e:\tauri\admt\log_panel.html:45`、`e:\tauri\admt\command_panel.html:45`、`e:\tauri\admt\index.html:11` 以及 `link href="/favicon.png"`（`log_panel.html:5`、`command_panel.html:5`）。

## 造成原因
- `base: '/'` 使打包后的 JS/CSS 等资源在 HTML 中以以 `/assets/...` 的形式引用；在 Tauri 生产环境（asset 协议）下，次级窗口加载的页面可能无法正确解析这些绝对路径，导致内容与样式不显示。
- `WebviewWindow` 传入 `url` 带 `/` 的绝对路径，在生产资产解析时可能与资源根不一致；按照 Tauri v2 文档，应该传递不带 `/` 的路径片段（例如 `command_panel.html`）。

## 修改方案
1) 设置 Vite `base`
- 在 `e:\tauri\admt\vite.config.ts` 顶层配置中添加：`base: './'`（紧邻 `plugins`、`resolve` 同级）。
- 保留现有 `build.rollupOptions.input` 的多入口设置不变。

2) 修正多窗口 URL
- 将 `e:\tauri\admt\src\components\MainContent\MainContent.tsx:1100–1102` 的 `url: '/command_panel.html'` 改为 `url: 'command_panel.html'`。
- 将 `e:\tauri\admt\src\components\MainContent\MainContent.tsx:1158–1160` 的 `url: '/log_panel.html'` 改为 `url: 'log_panel.html'`。

3) （可选稳健性）入口 HTML 资源改为相对路径
- `e:\tauri\admt\index.html:5`、`log_panel.html:5`、`command_panel.html:5` 的 `href="/favicon.png"` 改为 `href="./favicon.png"`。
- 入口脚本 `src="/src/*.tsx"` 保持由 Vite重写即可；如需一致性也可改为相对路径 `./src/*.tsx`（Vite构建时会统一替换为打包产物）。

## 验证步骤
- 运行 `npm run tauri build`，确保生成的 `dist/*.html` 中资源链接为相对路径（`./assets/...`）。
- 启动发布版，打开命令工具与日志面板：
  - 触发创建窗口的入口，观察是否正确渲染内容与样式。
- 如仍异常，检查 `e:\tauri\admt\src-tauri\tauri.conf.json:35` 的 CSP 是否阻止资源（当前已包含 `style-src 'unsafe-inline'` 与 `script-src 'unsafe-inline' 'unsafe-eval'`，一般足够）。

## 预期结果
- 发布版中主窗口与所有子窗口（`command_panel.html`、`log_panel.html`）页面内容与样式正常显示，与开发版一致。