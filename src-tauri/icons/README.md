# 图标资源

当前已有 PNG 与 Windows ICO。macOS 打包还需要 `icon.icns`，Linux 需要标准尺寸 PNG（已有 `64x64.png`、`128x128.png`、`icon.png`，可满足 deb/AppImage）。

补充 macOS 图标时把 `icon.icns` 放在本目录，并在 `tauri.conf.json` 的 `bundle.icon` 中加入 `icons/icon.icns`。在补齐之前，macOS job 会在打包阶段失败，属于已知缺口，不影响 Windows 与 Linux。
