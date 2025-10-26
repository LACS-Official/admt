# Console.xx风格日志记录指南

## 概述

本指南介绍如何在Tauri项目中统一使用console.xx风格的日志记录方法，替代原有的enhancedLogService调用。

## 基础使用方法

### 1. 导入日志记录器

```typescript
import { consoleLogger } from '@/utils/consoleLogger';
```

### 2. 基本日志记录

```typescript
// 调试日志
consoleLogger.debug('调试信息', { data: '附加数据' });

// 信息日志
consoleLogger.info('操作完成', { result: 'success' });

// 警告日志
consoleLogger.warn('操作警告', { reason: '资源不足' });

// 错误日志
consoleLogger.error('操作失败', new Error('具体错误信息'));

// 用户操作日志
consoleLogger.userAction('用户点击按钮', { button: 'submit' });
```

### 3. 带上下文的日志记录

```typescript
// 创建带上下文的日志记录器
const componentLogger = consoleLogger.withContext('ComponentName', 'user');

// 使用带上下文的记录器
componentLogger.info('组件初始化完成');
componentLogger.error('组件渲染失败', error);
```

## 页面组件日志记录示例

### 1. HomePage.tsx - 首页组件

```typescript
import React, { useEffect, useState } from 'react';
import { consoleLogger } from '@/utils/consoleLogger';

const HomePage: React.FC = () => {
  const [data, setData] = useState(null);
  
  // 创建组件专用的日志记录器
  const logger = consoleLogger.withContext('HomePage', 'ui');

  useEffect(() => {
    logger.info('首页组件挂载');
    
    // 模拟数据加载
    const loadData = async () => {
      try {
        logger.debug('开始加载首页数据');
        const result = await fetchData();
        setData(result);
        logger.info('首页数据加载完成', { count: result.length });
      } catch (error) {
        logger.error('首页数据加载失败', error);
      }
    };
    
    loadData();
    
    return () => {
      logger.info('首页组件卸载');
    };
  }, []);

  const handleButtonClick = () => {
    logger.userAction('点击首页按钮', { button: 'action' });
    // 处理按钮点击逻辑
  };

  return (
    <div>
      <button onClick={handleButtonClick}>操作按钮</button>
      {/* 页面内容 */}
    </div>
  );
};

export default HomePage;
```

### 2. DeviceInfoCard.tsx - 设备信息卡片

```typescript
import React, { useEffect } from 'react';
import { consoleLogger } from '@/utils/consoleLogger';

const DeviceInfoCard: React.FC<{ deviceId: string }> = ({ deviceId }) => {
  const logger = consoleLogger.withContext('DeviceInfoCard', 'device');

  useEffect(() => {
    logger.info('设备信息卡片渲染', { deviceId });
    
    // 监听设备状态变化
    const unsubscribe = subscribeToDevice(deviceId, (status) => {
      logger.debug('设备状态更新', { deviceId, status });
    });

    return () => {
      logger.info('设备信息卡片卸载', { deviceId });
      unsubscribe();
    };
  }, [deviceId]);

  const handleRefresh = () => {
    logger.userAction('刷新设备信息', { deviceId });
    // 刷新逻辑
  };

  return (
    <div>
      <button onClick={handleRefresh}>刷新</button>
      {/* 设备信息显示 */}
    </div>
  );
};

export default DeviceInfoCard;
```

### 3. SettingsPanel.tsx - 设置面板

```typescript
import React, { useState } from 'react';
import { consoleLogger } from '@/utils/consoleLogger';

const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState({});
  const logger = consoleLogger.withContext('SettingsPanel', 'settings');

  const handleSettingChange = (key: string, value: any) => {
    logger.userAction('修改设置', { setting: key, oldValue: settings[key], newValue: value });
    
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    logger.info('设置已更新', { setting: key, value });
  };

  const handleSave = () => {
    logger.userAction('保存设置');
    
    try {
      // 保存设置逻辑
      saveSettings(settings);
      logger.info('设置保存成功');
    } catch (error) {
      logger.error('设置保存失败', error);
    }
  };

  return (
    <div>
      {/* 设置表单 */}
      <button onClick={handleSave}>保存</button>
    </div>
  );
};

export default SettingsPanel;
```

### 4. FlashZonePanel.tsx - 刷机区域面板

```typescript
import React, { useState } from 'react';
import { consoleLogger } from '@/utils/consoleLogger';

const FlashZonePanel: React.FC = () => {
  const [flashProgress, setFlashProgress] = useState(0);
  const logger = consoleLogger.withContext('FlashZonePanel', 'firmware');

  const handleFlashStart = async (firmwareFile: File) => {
    logger.userAction('开始刷机', { firmware: firmwareFile.name });
    
    try {
      logger.info('刷机流程开始');
      
      // 刷机逻辑
      await flashFirmware(firmwareFile, (progress) => {
        setFlashProgress(progress);
        logger.debug('刷机进度更新', { progress });
      });
      
      logger.info('刷机完成');
    } catch (error) {
      logger.error('刷机失败', error);
    }
  };

  return (
    <div>
      {/* 刷机界面 */}
      <div>进度: {flashProgress}%</div>
    </div>
  );
};

export default FlashZonePanel;
```

## 服务类日志记录示例

### 1. DeviceService.ts - 设备服务

```typescript
import { consoleLogger } from '@/utils/consoleLogger';

class DeviceService {
  private logger = consoleLogger.withContext('DeviceService', 'device');

  async connectDevice(deviceId: string) {
    this.logger.info('连接设备', { deviceId });
    
    try {
      const result = await this.performConnection(deviceId);
      this.logger.info('设备连接成功', { deviceId });
      return result;
    } catch (error) {
      this.logger.error('设备连接失败', { deviceId, error });
      throw error;
    }
  }

  async disconnectDevice(deviceId: string) {
    this.logger.info('断开设备连接', { deviceId });
    
    try {
      await this.performDisconnection(deviceId);
      this.logger.info('设备断开成功', { deviceId });
    } catch (error) {
      this.logger.error('设备断开失败', { deviceId, error });
    }
  }
}

export const deviceService = new DeviceService();
```

### 2. VersionService.ts - 版本服务

```typescript
import { consoleLogger } from '@/utils/consoleLogger';

class VersionService {
  private logger = consoleLogger.withContext('VersionService', 'system');

  async checkForUpdates() {
    this.logger.debug('开始检查更新');
    
    try {
      const updateInfo = await this.fetchUpdateInfo();
      
      if (updateInfo.available) {
        this.logger.info('发现新版本', { 
          current: updateInfo.currentVersion,
          latest: updateInfo.latestVersion 
        });
      } else {
        this.logger.debug('当前已是最新版本');
      }
      
      return updateInfo;
    } catch (error) {
      this.logger.error('检查更新失败', error);
      throw error;
    }
  }
}

export const versionService = new VersionService();
```

## 最佳实践

### 1. 合理使用日志级别
- **DEBUG**: 详细的调试信息，开发时使用
- **INFO**: 重要的业务操作信息
- **WARN**: 警告信息，不影响系统运行
- **ERROR**: 错误信息，需要关注

### 2. 包含有用的上下文信息
```typescript
// 好的示例
logger.info('文件上传完成', { 
  fileName: file.name, 
  fileSize: file.size,
  uploadTime: Date.now() 
});

// 不好的示例
logger.info('操作完成'); // 缺少具体信息
```

### 3. 错误日志包含完整信息
```typescript
try {
  // 业务逻辑
} catch (error) {
  logger.error('操作失败', {
    operation: 'specificOperation',
    errorMessage: error.message,
    stack: error.stack,
    additionalContext: '具体上下文'
  });
}
```

### 4. 性能敏感区域谨慎使用
```typescript
// 在循环中避免过度日志记录
for (const item of largeArray) {
  // 避免在每次迭代中都记录日志
  if (item.isSpecial) {
    logger.debug('处理特殊项目', { itemId: item.id });
  }
}
```

## 迁移指南

### 从enhancedLogService迁移

**原有代码:**
```typescript
import { enhancedLogService } from '@/services/enhancedLogService';

enhancedLogService.logInfo('消息', '来源');
enhancedLogService.logError('错误', '来源', { error: error });
```

**迁移后代码:**
```typescript
import { consoleLogger } from '@/utils/consoleLogger';

const logger = consoleLogger.withContext('来源');
logger.info('消息');
logger.error('错误', error);
```

通过遵循这些指南，您可以在整个项目中统一使用console.xx风格的日志记录方法，提高代码的可读性和可维护性。