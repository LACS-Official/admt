# BatchExecutorDialog 组件使用文档

## 概述

`BatchExecutorDialog` 是一个功能强大的批处理脚本执行对话框组件，专门用于在 ADMT 应用中执行批处理文件（.bat）并提供实时输出显示、状态监控和用户交互功能。

## 主要特性

### 🚀 核心功能
- **实时流式输出**：支持实时显示脚本执行过程中的输出内容
- **状态监控**：提供执行状态、退出码、执行时间等详细信息
- **强制停止**：允许用户在执行过程中强制停止脚本
- **日志保存**：自动保存执行日志到本地文件
- **输出复制**：支持一键复制输出内容到剪贴板

### 🎨 UI/UX 特性
- **现代化界面**：采用深色终端风格，专业的命令行体验
- **状态指示器**：直观的状态徽章显示（执行中、成功、失败）
- **进度反馈**：实时倒计时和执行时间显示
- **响应式设计**：固定 1000x700 像素的对话框尺寸

## 组件接口

### Props

```typescript
interface BatchExecutorDialogProps {
  open: boolean;              // 控制对话框显示/隐藏
  title: string;              // 对话框标题
  batchFileName: string;      // 要执行的批处理文件名
  workingDirectory: string;   // 批处理文件所在的工作目录
  onClose: () => void;        // 对话框关闭回调函数
}
```

### 参数说明

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `open` | `boolean` | ✅ | 控制对话框的显示状态 |
| `title` | `string` | ✅ | 对话框顶部显示的标题文本 |
| `batchFileName` | `string` | ✅ | 要执行的 .bat 文件名（如："flash_all.bat"） |
| `workingDirectory` | `string` | ✅ | 批处理文件所在的完整路径 |
| `onClose` | `() => void` | ✅ | 对话框关闭时的回调函数 |

## 基本用法

### 🚀 推荐用法（简化 API）

#### 1. 导入 Hook

```typescript
import { useBatchExecutor } from "../Common/BatchExecutorDialog";
```

#### 2. 使用 Hook

```typescript
const MyComponent = () => {
  const { executeBatch, BatchExecutorDialog } = useBatchExecutor();

  const handleExecuteBatch = () => {
    executeBatch({
      title: "线刷清数据 (flash_all.bat)",
      batchFileName: "flash_all.bat",
      workingDirectory: "/path/to/batch/files"
    });
  };

  return (
    <>
      <Button onClick={handleExecuteBatch}>执行批处理</Button>
      <BatchExecutorDialog />
    </>
  );
};
```

### 📋 传统用法（完整控制）

#### 1. 导入组件

```typescript
import BatchExecutorDialog from "../Common/BatchExecutorDialog";
```

#### 2. 状态管理

```typescript
const [batchDialogOpen, setBatchDialogOpen] = useState(false);
const [batchDialogTitle, setBatchDialogTitle] = useState("");
const [batchFileName, setBatchFileName] = useState("");
const [batchWorkingDirectory, setBatchWorkingDirectory] = useState("");
```

#### 3. 基本使用示例

```typescript
// 在组件中使用
<BatchExecutorDialog
  open={batchDialogOpen}
  title={batchDialogTitle}
  batchFileName={batchFileName}
  workingDirectory={batchWorkingDirectory}
  onClose={() => setBatchDialogOpen(false)}
/>

// 触发执行
const handleExecuteBatch = () => {
  setBatchDialogTitle("线刷清数据 (flash_all.bat)");
  setBatchFileName("flash_all.bat");
  setBatchWorkingDirectory("/path/to/batch/files");
  setBatchDialogOpen(true);
};
```

## 典型使用场景

### 场景1：小米设备线刷工具（推荐用法）

```typescript
// XiaomiFlashCard.tsx 中的使用示例（简化版）
import { useBatchExecutor } from "../Common/BatchExecutorDialog";

const XiaomiFlashCard = () => {
  const { executeBatch, BatchExecutorDialog } = useBatchExecutor();
  const [selectedFolderPath, setSelectedFolderPath] = useState("");

  // 线刷清数据
  const handleFlashWithWipe = () => {
    executeBatch({
      title: "线刷清数据 (flash_all.bat)",
      batchFileName: "flash_all.bat",
      workingDirectory: selectedFolderPath
    });
  };

  // 线刷不清数据
  const handleFlashWithoutWipe = () => {
    executeBatch({
      title: "线刷不清数据 (flash_all_except_storage.bat)",
      batchFileName: "flash_all_except_storage.bat",
      workingDirectory: selectedFolderPath
    });
  };

  // 线刷回锁
  const handleFlashAndLock = () => {
    executeBatch({
      title: "线刷清数据并回锁 (flash_all_lock.bat)",
      batchFileName: "flash_all_lock.bat",
      workingDirectory: selectedFolderPath
    });
  };

  return (
    <>
      {/* 触发按钮 */}
      <Button onClick={handleFlashWithWipe}>线刷清数据</Button>
      <Button onClick={handleFlashWithoutWipe}>线刷不清数据</Button>
      <Button onClick={handleFlashAndLock}>线刷清数据并回锁</Button>

      {/* 批处理执行对话框 - 只需一行！ */}
      <BatchExecutorDialog />
    </>
  );
};
```

### 场景1：小米设备线刷工具（传统用法）

```typescript
// XiaomiFlashCard.tsx 中的使用示例（传统版）
import BatchExecutorDialog from "../Common/BatchExecutorDialog";

const XiaomiFlashCard = () => {
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchDialogTitle, setBatchDialogTitle] = useState("");
  const [batchFileName, setBatchFileName] = useState("");
  const [batchWorkingDirectory, setBatchWorkingDirectory] = useState("");

  // 线刷清数据
  const handleFlashWithWipe = () => {
    setBatchDialogTitle("线刷清数据 (flash_all.bat)");
    setBatchFileName("flash_all.bat");
    setBatchWorkingDirectory(selectedFolderPath);
    setBatchDialogOpen(true);
  };

  // 线刷不清数据
  const handleFlashWithoutWipe = () => {
    setBatchDialogTitle("线刷不清数据 (flash_all_except_storage.bat)");
    setBatchFileName("flash_all_except_storage.bat");
    setBatchWorkingDirectory(selectedFolderPath);
    setBatchDialogOpen(true);
  };

  // 线刷回锁
  const handleFlashAndLock = () => {
    setBatchDialogTitle("线刷清数据并回锁 (flash_all_lock.bat)");
    setBatchFileName("flash_all_lock.bat");
    setBatchWorkingDirectory(selectedFolderPath);
    setBatchDialogOpen(true);
  };

  return (
    <>
      {/* 触发按钮 */}
      <Button onClick={handleFlashWithWipe}>线刷清数据</Button>
      <Button onClick={handleFlashWithoutWipe}>线刷不清数据</Button>
      <Button onClick={handleFlashAndLock}>线刷清数据并回锁</Button>

      {/* 批处理执行对话框 */}
      <BatchExecutorDialog
        open={batchDialogOpen}
        title={batchDialogTitle}
        batchFileName={batchFileName}
        workingDirectory={batchWorkingDirectory}
        onClose={() => setBatchDialogOpen(false)}
      />
    </>
  );
};
```

### 场景2：通用脚本执行工具（推荐用法）

```typescript
import { useBatchExecutor } from "../Common/BatchExecutorDialog";

const ScriptRunner = () => {
  const { executeBatch, BatchExecutorDialog } = useBatchExecutor();

  const executeScript = (scriptInfo: {
    title: string;
    fileName: string;
    workingDir: string;
  }) => {
    executeBatch({
      title: scriptInfo.title,
      batchFileName: scriptInfo.fileName,
      workingDirectory: scriptInfo.workingDir
    });
  };

  return (
    <>
      <Button onClick={() => executeScript({
        title: "系统清理脚本",
        fileName: "cleanup.bat",
        workingDir: "C:/scripts"
      })}>
        执行清理脚本
      </Button>
      
      <BatchExecutorDialog />
    </>
  );
};
```

### 场景2：通用脚本执行工具（传统用法）

```typescript
import BatchExecutorDialog from "../Common/BatchExecutorDialog";

const ScriptRunner = () => {
  const [dialogState, setDialogState] = useState({
    open: false,
    title: "",
    fileName: "",
    workingDir: ""
  });

  const executeScript = (scriptInfo: {
    title: string;
    fileName: string;
    workingDir: string;
  }) => {
    setDialogState({
      open: true,
      title: scriptInfo.title,
      fileName: scriptInfo.fileName,
      workingDir: scriptInfo.workingDir
    });
  };

  const handleClose = () => {
    setDialogState(prev => ({ ...prev, open: false }));
  };

  return (
    <BatchExecutorDialog
      open={dialogState.open}
      title={dialogState.title}
      batchFileName={dialogState.fileName}
      workingDirectory={dialogState.workingDir}
      onClose={handleClose}
    />
  );
};
```

## 高级功能

### 1. 实时输出流

组件自动监听 Tauri 事件系统中的 `batch-output` 事件，支持：
- **stdout**：标准输出（白色文本）
- **stderr**：错误输出（红色文本）
- **info**：信息输出（蓝色文本）
- **error**：错误信息（红色文本）

### 2. 状态管理

组件内部维护以下状态：
- `isRunning`：脚本是否正在执行
- `isCompleted`：脚本是否执行完成
- `exitCode`：脚本退出码（0表示成功）
- `startTime` / `endTime`：执行开始和结束时间

### 3. 日志文件

执行过程中的所有输出会自动保存到：
```
AppData/Local/com.admt.app/logs/batch_logs/batch_YYYYMMDD_HHMMSS.log
```

### 4. 错误处理

组件提供完善的错误处理机制：
- 命令执行失败时的优雅降级
- 监听器自动清理防止内存泄漏
- 组件卸载时的资源清理

## 样式定制

组件使用 Fluent UI 的 `makeStyles` 进行样式管理，主要样式类：

```typescript
const useStyles = makeStyles({
  dialogSurface: {
    minWidth: '1000px',
    height: '700px',
    // ... 其他样式
  },
  outputArea: {
    fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    // ... 终端样式
  },
  // ... 其他样式类
});
```

## 注意事项

### ⚠️ 重要提醒

1. **文件路径**：确保 `workingDirectory` 是有效的绝对路径
2. **文件存在性**：确保 `batchFileName` 在指定目录中存在
3. **权限问题**：某些批处理文件可能需要管理员权限
4. **资源清理**：组件会自动清理事件监听器，无需手动处理

### 🔧 最佳实践

1. **状态重置**：对话框关闭时自动重置所有内部状态
2. **错误反馈**：利用应用的通知系统提供用户反馈
3. **日志管理**：定期清理旧的日志文件以节省磁盘空间
4. **用户体验**：提供清晰的执行状态和进度反馈

## 依赖项

- `@fluentui/react-components`：UI 组件库
- `@fluentui/react-icons`：图标库
- `@tauri-apps/api/core`：Tauri 核心 API
- `@tauri-apps/plugin-fs`：文件系统插件
- `@tauri-apps/api/event`：事件系统

## 版本历史

- **v1.0.0**：初始版本，支持基本的批处理执行功能
- **v1.1.0**：添加实时流式输出支持
- **v1.2.0**：增强 UI/UX，添加状态指示器和操作按钮
- **v1.3.0**：完善错误处理和资源清理机制

---

*最后更新：2025-08-26*
*作者：ADMT 开发团队*
