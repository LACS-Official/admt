# Linux 版本适配计划

本项目（玩机管家）目前由于硬编码了大量 Windows 特有的命令（如 `taskkill`、`tasklist`）以及依赖了特定的二进制可执行文件扩展名（`.exe`、`.dll`），无法直接在 Linux 系统上运行。

为了实现 Linux 版本的适配，我们将按以下计划分步骤进行代码重构与配置修改。

## 1. 环境与配置文件改造 (Tauri & Cargo)
- **Tauri 配置**：确认 `tauri.conf.json` 中针对不同平台的资源（resources）打包策略，可能需要将不同操作系统的依赖二进制分发到不同的子目录（如 `tools/windows/` 和 `tools/linux/`）。
- **Rust 依赖隔离**：在 `Cargo.toml` 中，继续保持 `winreg` 和 `winapi` 等 Windows 特有依赖仅限 `cfg(windows)` 环境。确保核心代码编译通过。

## 2. 工具路径与扩展名抽象化
- **消除硬编码后缀**：
  在 Rust 代码（如 `utils.rs`, `patch.rs`）中调用第三方工具（`adb`, `scrcpy`, `magiskboot`）时，不能直接写死 `.exe`。
  - **方案**：提供一个统一的助手函数，例如 `get_executable_name("adb")`。在 Windows 环境下返回 `"adb.exe"`，在非 Windows 环境下返回 `"adb"`。
- **动态链接库校验抽象**：
  在 `screen_mirror.rs` 等模块检查环境完整性时，不能在 Linux 下检查 `.dll` 文件的存在性。
  - **方案**：根据 `std::env::consts::OS` 动态判断需要校验哪些依赖（Linux 下可能不自带 Scrcpy 的那些 DLL，或者需要改为校验 .so 或忽略部分校验）。

## 3. 进程管理的跨平台重构
目前的进程查找与杀死功能（如 `adb_system_controler.rs`, `adb_command_runer.rs`, `commands/app.rs`）大量使用了 `tasklist` 和 `taskkill`。
- **方案 A（引入第三方库）**：引入 Rust 的 `sysinfo` 核心库来进行跨平台的进程枚举和杀死操作，这样代码只需写一套，不需要直接调用系统命令行工具。
- **方案 B（条件编译命令）**：通过 `#[cfg(target_os = "windows")]` 维持原状，通过 `#[cfg(target_os = "linux")]` 使用 `ps`、`kill -9` 或 `killall` 命令。
- **推荐方案**：为了保证高可靠性和后续的维护性，我们优先使用条件编译 `std::process::Command` 或者直接引入 `sysinfo` 库（如果允许增加依赖）。为稳妥起见，我们先使用条件编译 (`#[cfg(target_os = "windows")]` 与 `#[cfg(target_os = "linux")]`) 提供原生命令的适配。

## 4. 端口占用的跨平台处理
在清理 5037 端口（ADB 端口）时，原代码使用了 `netstat -aon | findstr :5037` 并结合 `taskkill`。
- **方案**：在 Linux 环境下，对应命令需替换为 `lsof -t -i:5037` 结合 `kill -9`。这部分代码同样通过条件编译拆分出 Linux 和 Windows 专用的执行流。

## 5. 补充与验证 Linux 版二进制资源 (手动步骤/未来计划)
- 将 Linux 版本的 `adb` 和 `scrcpy` 放入 `src-tauri/tools` 相应的目录下。
- 确保它们的权限为可执行（在打包脚本或 Tauri `beforeBuildCommand` 中进行 `chmod +x`）。

## 实施第一步：代码层面的解耦与适配
本计划批准后，我将：
1. 重构 `src-tauri/src/utils.rs` 和各处的 `.exe` 硬编码。
2. 重构进程管理相关的文件（`adb_system_controler.rs`, `adb_command_runer.rs`, `commands/app.rs`），使用条件编译为其增加 Linux 环境的处理逻辑。
3. 调整包含 `.dll` 校验的源码（如 `screen_mirror.rs`）。

请确认计划，随后我将正式开始实施这些代码层的修改。
