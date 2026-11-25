# ADMT 项目结构

ADMT 拆分为三个独立仓库，互不嵌套、不通过相对路径引用源码。桌面端与 Web 端可独立开发、构建、发版。

## 仓库职责

| 仓库 | 本地路径 | 职责 | 产物 |
|---|---|---|---|
| `admt` | `E:/tauri/admt` | 桌面端，Tauri 2，支持 Windows / macOS / Linux | 三平台安装包 |
| `admt-web` | `E:/tauri/admt-web` | Web 版，纯浏览器 + WebUSB，不依赖桌面端 | 静态站点 zip + GitHub Pages |
| `admt-shared` | `E:/tauri/admt-shared` | 跨端纯 TypeScript 共享包 `@admt/shared` | npm 包 |

`admt` 的远程为 `LACS-Official/admt`，分支 `master`。`admt-web` 与 `admt-shared` 目前仅在本地初始化为 `master` 分支的 Git 仓库，尚未配置远程；需要分别创建远程仓库后再推送。

## 目录职责

### admt（桌面端）

- `src/`：桌面前端，Tauri IPC 调用集中在这里。
- `src-tauri/src/`：Rust 后端命令与平台能力。
- `src-tauri/tools/adb-bin|lacs|scrcpy/`：运行时读取的生效目录，Windows 基线二进制保留在此。
- `src-tauri/tools/windows|macos|linux/`：各平台工具源目录，非 Windows 构建时由脚本覆盖到生效目录。
- `src-tauri/icons/`：图标资源；macOS 仍需补 `icon.icns`。
- `scripts/prepare-tools.mjs`：按当前系统准备外部工具二进制。
- `.github/workflows/ci.yml`：三平台质量检查。
- `.github/workflows/release.yml`：三平台构建，草稿 Release 汇总后统一发布并同步更新日志。
- `docs/updates/<版本>.md`：桌面版更新日志与 Release 正文。

### admt-web（Web 版）

- `web/`：全部应用代码、依赖与构建配置，仓库根目录不放应用源码。
- `web/src/platform/`：平台适配层，WebUSB 实现放 `webusb/`。
- `web/src/services/`：业务服务，只调用适配层。
- `.github/workflows/web-ci.yml`：Web 版推送与 PR 检查。
- `.github/workflows/web-release.yml`：`web-v*` tag 触发，产出独立 Release 与 Pages 部署。
- `docs/updates/<版本>.md`：Web 版更新日志与 Release 正文。

### admt-shared（共享包）

- `src/types.ts`：跨端类型。
- `src/constants.ts`：跨端常量。
- `src/i18n/`：跨端文案。
- `dist/`：构建产物，不入库。

## 命名规则

- 仓库：桌面 `admt`，Web `admt-web`，共享包 `admt-shared`。
- 桌面 tag：`v1.5.6`；Web tag：`web-v1.5.6`；版本号一致但前缀不同，互不触发对方 CI。
- 更新日志：桌面 `docs/updates/1.5.6.md`，Web `docs/updates/0.1.0.md`。
- 组件文件 PascalCase，服务与适配文件 camelCase，目录小写连字符。

## 共享代码放置规则

可以放入 `@admt/shared`：跨端一致的类型、常量、i18n 文案、无副作用纯函数。

禁止放入：Tauri API、WebUSB、DOM 操作、平台判断、子进程、文件读写、任何副作用。

平台相关实现留在各自仓库：桌面端在 `src/`、`src-tauri/src/`，Web 端在 `web/src/platform/`。两个应用以 `vendor/admt-shared-<版本>.tgz` 依赖共享包，不跨仓库 import 源码。桌面端 `src/generated/version.ts` 与 Web 端 `web/src/config/env.ts`、`App.tsx` 已使用共享的应用名、标识符、平台列表和版本号。三仓库版本由 `node scripts/sync-versions.mjs` 统一同步，`--check` 用于校验；发版工作流还会校验 tag 版本与 package.json 一致。

## 独立开发约定

桌面端：

```bash
npm ci
npm run typecheck
npm run test:run
npm run tauri:build
```

Web 端：

```bash
cd web
npm ci
npm run typecheck
npm run build
```

共享包：

```bash
npm ci
npm run build
```

`npm run build` 在桌面端只构建前端，不触碰平台工具；`npm run tauri:build` 才执行 `prepare:tools`。CI 的三平台 job 同理：前端检查不依赖二进制，只有 release job 准备平台工具。

## 已知缺口

- `src-tauri/icons/icon.icns` 尚未生成，macOS 打包会在打包阶段失败。
- `src-tauri/tools/macos/`、`linux/` 目前只有占位文件，需要放入对应平台的 adb / fastboot / scrcpy 二进制。
- macOS 暂按 ad-hoc 签名处理，首次运行需用户手动允许；正式分发需要 Apple Developer 签名与公证。
