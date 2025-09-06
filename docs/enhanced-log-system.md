# 增强日志系统

## 概述

增强日志系统是ADMT应用的核心日志记录解决方案，专注于记录核心运行状态信息，提供结构化JSON格式的日志记录，支持分级存储策略和详细的设备/固件状态追踪。

## 主要特性

### 🎯 核心功能
- **结构化日志记录**: 采用JSON格式，确保关键字段可检索过滤
- **实时设备状态追踪**: 记录设备连接/断开状态变更事件，包含时间戳和设备标识
- **固件刷写流程追踪**: 完整追踪固件刷写各阶段状态（开始/传输中/验证/完成）
- **分级错误处理**: 错误处理分级记录（警告/错误/致命），包含错误代码、描述和上下文环境信息
- **分级存储策略**: 基础状态信息保留30天，错误日志保留180天

### 📊 日志分类
- **设备日志** (device): 设备连接、断开、模式变更等
- **固件日志** (firmware): 固件刷写、验证、升级等
- **系统日志** (system): 系统运行状态、错误等
- **用户日志** (user): 用户操作记录
- **网络日志** (network): 网络请求、下载等
- **安全日志** (security): 安全事件、权限等

### 🔍 日志级别
- **Fatal**: 致命错误，导致系统崩溃
- **Error**: 错误，功能无法正常执行
- **Warning**: 警告，可能影响功能但不阻断执行
- **Info**: 信息，正常的系统状态记录
- **Debug**: 调试，详细的调试信息

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    增强日志系统架构                          │
├─────────────────────────────────────────────────────────────┤
│  应用层                                                     │
│  ├── LogsPanel (UI组件)                                    │
│  ├── DeviceService (设备事件)                              │
│  ├── FirmwareFlashService (固件事件)                       │
│  └── 其他服务...                                           │
├─────────────────────────────────────────────────────────────┤
│  服务层                                                     │
│  ├── EnhancedLogService (核心日志服务)                     │
│  ├── LogUtils (工具函数)                                   │
│  └── LogBackendMock (后端模拟)                             │
├─────────────────────────────────────────────────────────────┤
│  存储层                                                     │
│  ├── 内存存储 (实时日志，最多2000条)                       │
│  ├── 持久化存储 (文件系统/数据库)                          │
│  └── 分级清理 (基础30天，错误180天)                        │
└─────────────────────────────────────────────────────────────┘
```

## 使用指南

### 基本使用

```typescript
import { enhancedLogService } from '../services/enhancedLogService';

// 记录信息日志
enhancedLogService.logInfo('应用启动完成', 'AppService', {
  version: '1.0.0',
  startupTime: 1500
});

// 记录错误日志
enhancedLogService.logError(
  'ADB连接失败',
  'DeviceService',
  { deviceId: 'ABC123', timeout: 30000 },
  'ADB_CONNECTION_FAILED',
  error
);
```

### 设备事件记录

```typescript
// 设备连接
enhancedLogService.logDeviceEvent({
  type: 'connected',
  deviceId: 'ABC123456789',
  deviceModel: 'Xiaomi 13 Pro',
  currentMode: 'sys',
  timestamp: new Date().toISOString(),
  details: {
    brand: 'Xiaomi',
    androidVersion: '14',
    connectionType: 'ADB'
  }
});

// 设备断开
enhancedLogService.logDeviceEvent({
  type: 'disconnected',
  deviceId: 'ABC123456789',
  deviceModel: 'Xiaomi 13 Pro',
  timestamp: new Date().toISOString(),
  details: {
    connectionDuration: 3600, // 秒
    reason: 'user_disconnected'
  }
});
```

### 固件刷写追踪

```typescript
import { firmwareFlashService } from '../services/firmwareFlashService';

// 开始刷写
const operationId = await firmwareFlashService.startFlash(
  'ABC123456789',
  'miui_14.0.6_recovery.img'
);

// 更新进度
firmwareFlashService.updateProgress(operationId, 50, '刷写固件中');

// 开始验证
firmwareFlashService.startVerification(operationId, 'MD5校验');

// 完成刷写
const result = firmwareFlashService.completeFlash(operationId);
```

### 用户操作记录

```typescript
// 记录用户操作
enhancedLogService.logUserAction(
  '安装APK应用',
  'AppManager',
  {
    deviceId: 'ABC123456789',
    apkFile: 'example_app.apk',
    packageName: 'com.example.app'
  }
);
```

### 网络请求记录

```typescript
// 记录网络请求
enhancedLogService.logNetworkRequest(
  'https://api.example.com/data',
  'GET',
  200,
  'ApiService',
  {
    responseTime: 245,
    dataSize: 1024
  }
);
```

## 日志格式

### 结构化日志条目

```json
{
  "id": "1704067200000_abc123def",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "category": "device",
  "message": "设备已连接: Xiaomi 13 Pro",
  "source": "DeviceManager",
  "context": {
    "sessionId": "session_1704067200000_xyz789",
    "deviceId": "ABC123456789",
    "deviceModel": "Xiaomi 13 Pro",
    "eventType": "connected",
    "brand": "Xiaomi",
    "androidVersion": "14"
  },
  "metadata": {
    "version": "1.0.0",
    "platform": "Win32",
    "buildId": "20240101"
  }
}
```

### 关键字段说明

- **id**: 唯一标识符
- **timestamp**: ISO 8601格式时间戳
- **level**: 日志级别 (fatal/error/warning/info/debug)
- **category**: 日志分类 (device/firmware/system/user/network/security)
- **message**: 人类可读的日志消息
- **source**: 日志来源组件
- **context**: 上下文信息，包含相关的业务数据
- **metadata**: 元数据，包含应用版本、平台等信息

## 存储策略

### 内存存储
- 最多保存2000条日志在内存中
- 用于实时显示和快速查询
- 超出限制时自动清理最旧的日志

### 持久化存储
- 所有日志都会持久化到文件系统
- 支持按条件查询和过滤
- 定期清理过期日志

### 分级保留策略
- **基础日志**: 保留30天 (info, debug级别)
- **错误日志**: 保留180天 (error, fatal级别)
- **警告日志**: 保留90天 (warning级别)

## UI界面

### 日志查看器
- 实时日志显示
- 多维度过滤 (级别、分类、设备、时间范围)
- 搜索功能
- 自动滚动

### 统计面板
- 各级别日志统计
- 分类统计
- 错误模式分析
- 近期错误统计

### 导出功能
- 支持JSON和文本格式导出
- 按过滤条件导出
- 包含完整的上下文信息

## 性能考虑

### 异步处理
- 日志记录采用异步方式，不阻塞主线程
- 批量写入减少I/O操作
- 内存缓冲提高写入效率

### 存储优化
- 定期清理过期日志
- 压缩存储减少磁盘占用
- 索引优化提高查询速度

### 内存管理
- 限制内存中日志数量
- 及时释放不需要的日志对象
- 避免内存泄漏

## 最佳实践

### 日志记录原则
1. **适度记录**: 记录关键事件，避免过度记录
2. **结构化信息**: 使用context字段提供结构化上下文
3. **错误处理**: 记录错误时包含错误代码和堆栈信息
4. **用户隐私**: 避免记录敏感用户信息

### 性能优化
1. **异步记录**: 使用异步方式记录日志
2. **批量操作**: 批量处理日志写入
3. **合理分级**: 根据重要性选择合适的日志级别
4. **定期清理**: 定期清理过期和不必要的日志

### 错误处理
1. **分级记录**: 根据严重程度选择合适级别
2. **上下文信息**: 提供足够的上下文帮助调试
3. **错误代码**: 使用标准化的错误代码
4. **堆栈跟踪**: 包含完整的错误堆栈信息

## 故障排除

### 常见问题

**Q: 日志没有显示在界面上**
A: 检查日志级别设置，确保当前级别包含要显示的日志

**Q: 日志文件过大**
A: 检查保留策略设置，调整保留天数或启用自动清理

**Q: 搜索功能不工作**
A: 确保搜索关键词正确，检查是否有特殊字符需要转义

**Q: 导出功能失败**
A: 检查磁盘空间是否充足，确保有写入权限

### 调试模式
启用调试模式可以看到更详细的日志信息：

```typescript
// 设置为调试级别
enhancedLogService.setRetentionPolicy({
  maxMemoryLogs: 5000 // 增加内存日志数量用于调试
});
```

## 扩展开发

### 添加新的日志分类
1. 在`logTypes.ts`中添加新的分类
2. 在`LogUtils.ts`中添加对应的图标和颜色
3. 在UI组件中添加新分类的显示

### 自定义日志处理器
```typescript
// 创建自定义处理器
class CustomLogHandler {
  handle(logEntry: StructuredLogEntry) {
    // 自定义处理逻辑
    if (logEntry.level === 'error') {
      // 发送错误通知
      this.sendErrorNotification(logEntry);
    }
  }
}

// 注册处理器
enhancedLogService.addHandler(new CustomLogHandler());
```

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持结构化日志记录
- 实现设备状态追踪
- 添加固件刷写流程追踪
- 实现分级存储策略
- 提供完整的UI界面

---

更多信息请参考源代码注释和示例文件。