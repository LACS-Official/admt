# ADMT 项目开发规范与设计指南 (Design Standards & Guidelines)

本文档定义了 **ADMT (玩机管家)** 项目的前端 UI/UX 设计规范、工程准则及交互标准。所有后续功能开发、页面重构与组件设计必须严格遵守本指南。

---

## 1. 核心设计哲学 (Core Design Philosophy)

遵循 **Apple 官网 / Craft Docs** 的人文极简与现代工具软件设计哲学：
- **纯粹与克制**：去除一切廉价生成感与花哨装饰，聚焦工具本身的操控效率与清晰度。
- **连续平滑圆角 (Squircle Radius)**：卡片采用 `12px ~ 16px` 大曲率圆角，交互胶囊采用 `9999px`（Pill）。
- **自然物理层级**：依靠柔和底色分层（如 `#ffffff` / `#f5f5f7` 或深色模式下的 Graphite Surface `#161617`）与极淡边框建立层级，拒绝生硬重边框与刺眼外发光。
- **沉浸式自适应布局**：各功能面板容器采用 `height: 100%` 弹性布局，内部内容区自适应滚动，杜绝生硬的写死像素高度（如 `height: 380px`）与双重嵌套滚动条。

---

## 2. 去 AI 刻板化准则 (Anti-AI Vibe & Clean Copywriting)

### 2.1 话术与文案规范 (Copywriting Standards)
| ❌ 严禁使用的 AI 模版味话术 | ✅ 专业、自然、符合人类习惯的用语 |
| :--- | :--- |
| **“模拟沙盒 / 遥测数据”** | **“状态调试 / 实时状态 / 实时参数”** |
| **“AI 助手深度赋能分析”** | **直接展示功能名称与具体动作（如“运行”、“搜索”、“导出”）** |
| **“我们概不负责”、“请谨慎操作因输入错误...”**（长篇说教型免责声明） | **简短技术提示或在关键高危操作弹窗做确认** |
| **生硬直译的英文或机械词汇**（如“实体”、“会话实例”、“Payload数据”） | **直观业务词汇**（如“已连接设备”、“执行命令”、“输出内容”） |

### 2.2 视觉与图标规范 (Visual & Icon Guidelines)
- **禁止在界面文案中随意堆砌 Emoji**（如 `⚡ 充电中`、`🔋 电池`、`🚀 一键加速`、`✨ AI 魔法` 等）。
- **统一使用单色高质量矢量图标**（来自 `@fluentui/react-icons`，尺寸标准为 `16px / 20px / 24px`），图标与文字颜色保持自然协调。
- **禁止使用彩虹/青紫渐变文字、霓虹外发光、扫光动画及大面积饱和色色块**。

---

## 3. 标准布局模式 (Layout & Component Patterns)

### 3.1 顶部栏与导航 (Header & Navigation)
- **分段胶囊选择器 (Segmented Pills)**：
  - 替代层级过深的多重侧边栏，将同模块内的子功能（如按键、显示、系统、电池）置于顶部横向分段胶囊中。
  - 活动状态采用背景高亮与品牌科技蓝（Light: `#0071e3`, Dark: `#2997ff`）。

### 3.2 模块化 Bento 容器 (Bento Cards)
- 每个功能卡片封装为独立模块（如 `bentoCard`），外层圆角 `14px`，内边距 `16px 18px`。
- 头部包含清晰的功能名称与微弱说明文字，右侧放置快捷重置或刷新操作。

### 3.3 终端与日志流 (Terminal & Log Stream)
- 采用现代等宽字体族（`ui-monospace, "SF Mono", Menlo, Consolas, "Cascadia Code", monospace`）。
- 底部集成紧凑的交互式 Prompt 命令行（`$ adb` / `$ fastboot`），支持键盘 `↑ / ↓` 切换历史命令。
- 日志级别使用细腻的单色胶囊药丸（`INFO` 蓝、`WARN` 橙、`ERROR` 红、`DEBUG` 紫）。

---

## 4. 色彩与主题令牌 (Theme Tokens)

- **浅色模式 (Light)**:
  - 页面背景底色: `var(--colorNeutralBackground1)` (`#ffffff` / `#f5f5f7`)
  - 卡片表面底色: `var(--colorNeutralBackground2)`
  - 激活/高亮背景: `rgba(0, 113, 227, 0.08)` / `#0071e3`
  - 边框与分隔线: `var(--colorNeutralStroke2)` (极淡细线)
- **深色模式 (Dark)**:
  - 页面背景底色: `var(--colorNeutralBackground1)` (`#1f1f1f` / `#161617`)
  - 卡片表面底色: `var(--colorNeutralBackground2)`
  - 激活/高亮背景: `rgba(41, 151, 255, 0.15)` / `#2997ff`
  - 边框与分隔线: `var(--colorNeutralStroke2)`
