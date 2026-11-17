# 贡献指南 (Contributing Guide)

感谢您关注并愿意为 **玩机管家 (ADMT)** 项目做出贡献！社区的参与是推动项目不断完善的关键。

## 如何参与贡献？

### 1. 反馈 Bug 或提出新功能
- 提交前请先在 [Issues](https://github.com/LACS-Official/admt/issues) 中搜索是否已有相同的问题或建议。
- 提交 Bug 时，请务必包含：
  - 操作系统及版本 (Windows 11 / macOS / Linux)
  - 设备型号与 Android 版本
  - 复现步骤与详细日志/截图
- 提出功能建议时，请说明使用场景及预期表现。

### 2. 提交代码 (Pull Request)

1. **Fork 并 Clone 仓库**
   ```bash
   git clone https://github.com/YOUR_USERNAME/admt.git
   cd admt
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **代码规范与检查**
   - 遵循项目根目录的 `AGENTS.md`：统一圆角令牌、主题变量、去 AI 模板化文案、标准日志规范、复用优先。
   - 提交前请依次运行以下检查，全部通过后再提交：
     ```bash
     cargo check --manifest-path src-tauri/Cargo.toml
     npx tsc --noEmit
     npx vitest run
     npm run build
     npm run lint
     ```
   - 新增 Tauri 命令需完成「Rust 定义 → `lib.rs` 注册 → 前端调用 → 契约测试」四步；文案改动需同步简中、繁中、英文三语。

4. **提交 commit**
   使用有意义的提交说明：
   - `feat: 添加无线 ADB 自动扫描功能`
   - `fix: 修复某些设备投屏断开的问题`
   - `docs: 更新 README 使用说明`

5. **提交 PR**
   推送分支至您的 Fork 仓库，并向主仓库提交 Pull Request，填写 [PR 模板](./PULL_REQUEST_TEMPLATE.md) 中的变更说明与自查清单。

---

## 相关文档

- [行为准则](./CODE_OF_CONDUCT.md) — 社区参与的行为标准
- [安全策略](../SECURITY.md) — 请勿在公开 Issue 中披露安全漏洞
- [无障碍声明](../ACCESSIBILITY.md) — 支持能力与反馈方式
- [Issue 模板](./ISSUE_TEMPLATE/) — Bug 反馈与功能建议

参与本项目即表示您同意遵守《行为准则》。感谢您对开源社区的贡献。
