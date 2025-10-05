# ConsoleLogger 使用指南

## 概述

ConsoleLogger 是一个将系统级别的日志记录（如 console.log）与我们的日志管理系统集成的工具。它允许开发者继续使用熟悉的 console API，同时将日志自动记录到我们的日志系统中，方便在 LogsPanel 中查看和分析。

## 主要功能

1. **双重输出**：同时输出到控制台和日志管理系统
2. **上下文支持**：可以为日志添加来源、分类等上下文信息
3. **用户操作记录**：专门的用户操作记录方法
4. **全局包装**：可以包装全局 console 对象，自动捕获所有 console 调用
5. **类型安全**：提供完整的 TypeScript 类型支持

## 基本使用

### 1. 导入 ConsoleLogger

```typescript
import { consoleLogger } from '@/utils/consoleLogger';
```

### 2. 替换 console.log

```typescript
// 原来的代码
console.log('开始加载文件，设备:', selectedDevice.serial);

// 替换为
consoleLogger.log('开始加载文件，设备:', selectedDevice.serial);
```

### 3. 使用不同日志级别

```typescript
consoleLogger.debug('调试信息', { data: 'value' });
consoleLogger.info('一般信息', { data: 'value' });
consoleLogger.warn('警告信息', { data: 'value' });
consoleLogger.error('错误信息', { data: 'value' });
```

### 4. 记录用户操作

```typescript
consoleLogger.userAction('点击登录按钮', 'LoginComponent', {
  buttonId: 'loginButton',
  timestamp: new Date().toISOString()
});
```

## 高级使用

### 1. 创建带上下文的日志记录器

```typescript
// 创建带上下文的日志记录器
const logger = consoleLogger.withContext('MyComponent', 'category');

// 使用这个记录器记录的日志会自动包含上下文信息
logger.info('组件已加载');
logger.error('加载失败', error);
```

### 2. 自定义日志选项

```typescript
consoleLogger.info('消息', data, {
  includeConsole: true,  // 是否输出到控制台，默认为true
  includeSystem: true,   // 是否输出到系统日志，默认为true
  context: {
    source: 'MyComponent',
    category: 'custom',
    additionalData: {
      userId: '123'
    }
  }
});
```

### 3. 全局 Console 包装

在应用入口文件（如 main.tsx）中：

```typescript
import { installConsoleWrapper } from '@/utils/consoleLogger';

// 安装console包装器
installConsoleWrapper('Global', 'system');

// 现在所有的console.log、console.error等调用会自动同时输出到控制台和系统日志
console.log('这条消息会同时出现在控制台和LogsPanel中');
```

如需恢复原始 console：

```typescript
import { restoreConsole } from '@/utils/consoleLogger';

// 恢复原始console方法
restoreConsole();
```

## 实际示例

### 1. 文件管理器组件

```typescript
import { consoleLogger } from '@/utils/consoleLogger';

const loadFiles = useCallback(async (path: string) => {
  consoleLogger.log('loadFiles 被调用，路径:', path);
  if (!selectedDevice) {
    consoleLogger.log('没有选中的设备，退出');
    return;
  }

  consoleLogger.log('开始加载文件，设备:', selectedDevice.serial);
  setIsLoading(true);
  try {
    const result = await deviceService.listDeviceFiles(selectedDevice.serial, path);
    // 处理结果...
  } catch (error) {
    consoleLogger.error('加载文件失败', error);
  } finally {
    setIsLoading(false);
  }
}, [selectedDevice, deviceService]);
```

### 2. 表单提交处理

```typescript
import { consoleLogger } from '@/utils/consoleLogger';

const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault();
  
  const formData = new FormData(event.target as HTMLFormElement);
  const data = Object.fromEntries(formData.entries());
  
  // 记录表单提交（过滤敏感数据）
  const { password, ...safeData } = data;
  consoleLogger.userAction('提交登录表单', 'LoginForm', {
    formId: 'loginForm',
    formData: safeData,
    timestamp: new Date().toISOString()
  });
  
  try {
    // 提交表单...
    consoleLogger.info('表单提交成功', { formId: 'loginForm' });
  } catch (error) {
    consoleLogger.error('表单提交失败', error);
  }
};
```

### 3. 设备连接处理

```typescript
import { consoleLogger } from '@/utils/consoleLogger';

const deviceLogger = consoleLogger.withContext('DeviceManager', 'device');

const handleDeviceConnected = (device: Device) => {
  deviceLogger.info('设备已连接', {
    deviceId: device.id,
    deviceModel: device.model,
    connectionType: device.connectionType
  });
  
  // 记录用户操作
  consoleLogger.userAction('连接设备', 'DeviceManager', {
    deviceId: device.id,
    deviceModel: device.model
  });
};
```

## 最佳实践

1. **使用有意义的日志消息**：提供清晰、具体的描述，便于后续分析
2. **添加足够的上下文信息**：包括相关的参数、设置名称、新旧值等
3. **避免记录敏感数据**：在记录表单数据时，过滤掉密码、令牌等敏感信息
4. **在关键操作点记录日志**：如页面访问、重要操作开始前等
5. **注意性能**：避免在高频事件中记录日志，如鼠标移动、窗口调整等
6. **使用适当的日志级别**：
   - `debug`：详细的调试信息，仅在开发环境使用
   - `info`：一般信息，如操作开始、完成等
   - `warn`：警告信息，如可恢复的错误、即将弃用的功能等
   - `error`：错误信息，如操作失败、系统错误等

## 与 LogsPanel 的集成

所有通过 ConsoleLogger 记录的日志都会自动显示在 LogsPanel 中，您可以通过以下方式查看：

1. 导航到设置页面
2. 点击"日志"选项卡
3. 在日志列表中查看记录的日志
4. 可以使用过滤器按级别、分类、设备等筛选日志

## 注意事项

1. **循环引用**：避免在日志数据中包含循环引用的对象，这可能导致序列化错误
2. **大数据量**：避免在日志中包含大量数据，这可能影响性能
3. **生产环境**：在生产环境中，考虑降低日志级别或减少日志数量
4. **错误处理**：ConsoleLogger 内部已经包含错误处理，不会因为日志记录失败而影响应用运行

## 故障排除

### 日志未显示在 LogsPanel 中

1. 检查是否正确导入了 ConsoleLogger
2. 确认日志级别设置是否正确
3. 检查 LogsPanel 中的过滤器设置
4. 查看控制台是否有相关错误信息

### Console 包装器不工作

1. 确认是否正确调用了 `installConsoleWrapper()`
2. 检查是否有其他代码覆盖了 console 对象
3. 尝试在应用入口文件中尽早安装包装器

### 性能问题

1. 检查是否在高频事件中记录了过多日志
2. 考虑降低日志级别或减少日志数量
3. 使用条件日志记录，如 `if (process.env.NODE_ENV === 'development')`