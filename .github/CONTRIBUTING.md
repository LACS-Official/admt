# 贡献指南 (Contributing Guide)

感谢您关注并愿意为 **玩机管家 (ADMT)** 项目做出贡献！社区的参与是推动项目不断完善的关键。

## 🤝 如何参与贡献？

### 1. 反馈 Bug 或提出新功能
- 提交前请先在 [Issues](../../issues) 中搜索是否已有相同的问题或建议。
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
   - 保持 TypeScript / React 编码风格一致。
   - 提交前请运行语法检查：
     ```bash
     npm run lint
     ```

4. **提交 commit**
   使用有意义的提交说明：
   - `feat: 添加无线 ADB 自动扫描功能`
   - `fix: 修复某些设备投屏断开的问题`
   - `docs: 更新 README 使用说明`

5. **提交 PR**
   推送分支至您的 Fork 仓库，并向主仓库提交 Pull Request。

---

感谢您对开源社区的奉献！
