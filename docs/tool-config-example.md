# 工具配置文件说明

## config.json 文件格式

每个工具文件夹下都需要包含一个 `config.json` 配置文件，用于指定工具的执行方式和目标文件。

### 基本格式

```json
{
  "targetFile": "tool.exe",
  "executable": "launcher.exe",
  "args": ["--param1", "value1"],
  "version": "1.0.0",
  "description": "工具描述"
}
```

### 字段说明

- `targetFile` (必需): 目标文件路径，相对于工具文件夹
- `executable` (可选): 可执行文件路径，如果不指定则直接打开 targetFile
- `args` (可选): 启动参数数组
- `version` (可选): 工具版本号
- `description` (可选): 工具描述

### 示例配置

#### 小米解锁工具配置
```json
{
  "targetFile": "MiUnlock.exe",
  "version": "6.5.224.28",
  "description": "小米官方解锁工具"
}
```

#### Bypass解锁工具配置
```json
{
  "targetFile": "bypass-tool.exe",
  "executable": "launcher.bat",
  "args": ["--auto-detect"],
  "version": "2.1.0",
  "description": "通用Bypass解锁流程工具"
}
```

## 目录结构

```
Downloads/
├── xiaomi-unlock-tool/
│   ├── config.json
│   ├── MiUnlock.exe
│   └── 其他相关文件...
└── bypass-unlock-tool/
    ├── config.json
    ├── bypass-tool.exe
    ├── launcher.bat
    └── 其他相关文件...
```

## 错误处理

工具检查器会处理以下异常情况：
1. 文件夹不存在 - 自动创建并提示下载
2. config.json 不存在 - 提示下载完整工具包
3. JSON 格式错误 - 提示重新下载
4. 目标文件不存在 - 提示重新下载
5. 权限问题 - 提示检查权限设置