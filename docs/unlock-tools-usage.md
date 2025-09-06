# 解锁工具使用说明

## 功能概述

本功能实现了通过小米解锁工具和Bypass解锁流程的自动化检测和启动功能。

## 主要特性

1. **自动目录检测**: 检查下载目录中是否存在工具文件夹
2. **智能目录创建**: 如果目录不存在，自动创建并提示用户下载
3. **配置文件验证**: 读取并验证 config.json 配置文件
4. **异常处理**: 完整的错误处理和用户提示
5. **状态反馈**: 实时显示操作状态和进度

## 使用方法

### 1. 在组件中使用

```tsx
import { useToolAvailabilityChecker } from '../Common/ToolAvailabilityChecker';
import { ToolConfig } from '../../types/tool';

const MyComponent = () => {
  const { isChecking, checkAndExecuteTool } = useToolAvailabilityChecker();
  
  const toolConfig: ToolConfig = {
    name: '小米解锁工具',
    folder: 'xiaomi-unlock-tool'
  };
  
  const handleClick = async () => {
    const success = await checkAndExecuteTool(toolConfig);
    if (success) {
      console.log('工具启动成功');
    }
  };
  
  return (
    <button onClick={handleClick} disabled={isChecking}>
      {isChecking ? '检查中...' : '启动工具'}
    </button>
  );
};
```

### 2. 工具配置

在下载目录中创建对应的工具文件夹，并包含 `config.json` 文件：

```
Downloads/
├── xiaomi-unlock-tool/
│   ├── config.json
│   └── MiUnlock.exe
└── bypass-unlock-tool/
    ├── config.json
    ├── bypass-tool.exe
    └── launcher.bat
```

### 3. 配置文件格式

```json
{
  "targetFile": "MiUnlock.exe",
  "executable": "launcher.exe",
  "args": ["--param1", "value1"],
  "version": "1.0.0",
  "description": "工具描述"
}
```

## 错误处理

系统会自动处理以下异常情况：

- ✅ 文件夹不存在 → 自动创建并提示下载
- ✅ 配置文件不存在 → 提示下载完整工具包
- ✅ JSON 格式错误 → 提示重新下载
- ✅ 目标文件不存在 → 提示重新下载
- ✅ 权限问题 → 提示检查权限设置
- ✅ 启动失败 → 提示检查文件关联

## 状态提示

操作过程中会显示以下状态信息：

1. "正在检测文件夹..."
2. "正在读取配置文件..."
3. "正在解析配置文件..."
4. "正在检查目标文件..."
5. "正在启动工具..."
6. "工具启动成功" / "启动失败"

## API 参考

### useToolAvailabilityChecker()

返回对象包含：

- `isChecking: boolean` - 是否正在检查
- `checkAndExecuteTool(config: ToolConfig): Promise<boolean>` - 检查并执行工具
- `checkToolAvailability(config: ToolConfig): Promise<boolean>` - 仅检查工具可用性

### ToolConfig 接口

```typescript
interface ToolConfig {
  name: string;        // 工具名称
  folder: string;      // 文件夹名称
  targetFile?: string; // 目标文件（可选）
  executable?: string; // 可执行文件（可选）
  args?: string[];     // 启动参数（可选）
}
```

### ConfigJson 接口

```typescript
interface ConfigJson {
  targetFile: string;    // 目标文件（必需）
  executable?: string;   // 可执行文件（可选）
  args?: string[];       // 启动参数（可选）
  version?: string;      // 版本号（可选）
  description?: string;  // 描述（可选）
}