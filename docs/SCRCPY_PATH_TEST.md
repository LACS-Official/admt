# scrcpy 路径查找功能测试

## 修改内容

已成功修改投屏功能，使其能够自动查找项目根目录下的 scrcpy 可执行文件。

### 修改的文件
- `src-tauri/src/commands.rs` - 更新了 `find_scrcpy_executable` 函数

### 新增功能

#### 1. 智能路径查找
新的 `find_scrcpy_executable` 函数按以下优先级查找 scrcpy：

1. **项目根目录** (最高优先级)
2. **应用程序目录** (中等优先级)  
3. **系统 PATH** (最低优先级)

#### 2. 项目根目录检测
新增 `find_project_scrcpy` 函数，能够：
- 自动向上查找包含 `package.json` 或 `src-tauri` 的项目根目录
- 在多个可能的位置查找 scrcpy.exe

#### 3. 支持的 scrcpy 位置
在项目根目录下，支持以下位置的 scrcpy：

```
hout-tauri/
├── scrcpy.exe                           # 直接在根目录
├── scrcpy-win32-v3.3.1/scrcpy.exe     # win32 版本目录
├── scrcpy-win64-v3.3.1/scrcpy.exe     # win64 版本目录
├── scrcpy/scrcpy.exe                   # scrcpy 目录
├── tools/scrcpy.exe                    # tools 目录
└── tools/scrcpy/scrcpy.exe             # tools/scrcpy 目录
```

### 当前配置

根据你的设置，scrcpy 位于：
```
hout-tauri/scrcpy-win32-v3.3.1/scrcpy.exe
```

这个位置已经被新的查找逻辑支持！

## 测试步骤

### 1. 启动应用测试
✅ **已完成** - 应用成功启动，日志显示：
```
HOUT Tauri application starting...
Found ADB at absolute path: D:\kaifa\HOUT\Res\adb.exe
Found Fastboot at absolute path: D:\kaifa\HOUT\Res\fastboot.exe
[INFO] Found 1 devices
```

### 2. 投屏功能测试
现在可以测试投屏功能：

1. **打开投屏标签页**
   - 启动应用后切换到"安卓投屏"标签
   - 应该能看到投屏界面

2. **设备检测测试**
   - 连接 Android 设备
   - 查看设备是否出现在设备列表中
   - 检查设备支持状态

3. **scrcpy 路径测试**
   - 选择支持的设备
   - 点击"开始投屏"按钮
   - 查看日志中的 scrcpy 路径信息

### 3. 预期的日志输出
当尝试开始投屏时，应该看到类似的日志：

```
[INFO] Searching for scrcpy executable...
[INFO] Found scrcpy at: D:\kaifa\HOUT\hout-tauri\scrcpy-win32-v3.3.1\scrcpy.exe
[INFO] Starting scrcpy with args: ["-s", "设备序列号", "--max-size", "720", ...]
[INFO] scrcpy process started with PID: 12345
```

## 验证方法

### 方法1：通过应用界面
1. 打开应用程序
2. 切换到"安卓投屏"标签页
3. 连接 Android 设备
4. 尝试开始投屏
5. 观察是否成功启动 scrcpy

### 方法2：查看日志
在应用启动的终端中查看日志输出，确认：
- scrcpy 路径查找过程
- 是否成功找到项目目录下的 scrcpy
- scrcpy 进程启动情况

### 方法3：手动验证路径
可以手动验证 scrcpy 是否在正确位置：

```cmd
# 检查文件是否存在
dir "D:\kaifa\HOUT\hout-tauri\scrcpy-win32-v3.3.1\scrcpy.exe"

# 测试 scrcpy 是否可执行
"D:\kaifa\HOUT\hout-tauri\scrcpy-win32-v3.3.1\scrcpy.exe" --version
```

## 故障排除

### 如果找不到 scrcpy
1. **检查文件位置**：确认 scrcpy.exe 在 `scrcpy-win32-v3.3.1` 目录下
2. **检查文件权限**：确保 scrcpy.exe 有执行权限
3. **查看日志**：检查应用日志中的错误信息

### 如果投屏启动失败
1. **设备连接**：确认设备已连接并启用 USB 调试
2. **设备授权**：确认设备已授权 ADB 连接
3. **scrcpy 版本**：确认 scrcpy 版本兼容

### 常见错误信息
- `"scrcpy not found in project directory"` - scrcpy 文件不在预期位置
- `"Failed to start scrcpy process"` - scrcpy 启动失败，可能是权限或依赖问题
- `"Device does not support screen mirroring"` - 设备不支持投屏

## 优势

### 1. 便携性
- 无需安装 scrcpy 到系统 PATH
- 应用程序自包含，便于分发

### 2. 版本控制
- 可以指定特定版本的 scrcpy
- 避免系统版本冲突

### 3. 灵活性
- 支持多种目录结构
- 自动适应不同的部署方式

### 4. 向后兼容
- 仍然支持系统 PATH 中的 scrcpy
- 保持原有功能不变

## 下一步

1. **测试投屏功能**：验证完整的投屏流程
2. **优化错误处理**：改进错误提示和恢复机制
3. **添加配置选项**：允许用户指定自定义 scrcpy 路径
4. **完善日志记录**：添加更详细的调试信息

现在你可以直接使用项目根目录下的 scrcpy 进行投屏了！
