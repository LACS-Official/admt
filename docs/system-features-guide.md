# 系统功能使用指南

本指南介绍如何使用应用的系统托盘和开机自启动功能。

## 功能概述

### 系统托盘功能
- 最小化到系统托盘
- 托盘图标和菜单
- 窗口显示/隐藏控制
- 应用退出管理

### 开机自启动功能
- Windows 注册表自启动
- 自启动状态检测
- 自启动配置管理
- 设置验证和修复

## 前端使用示例

### 1. 基本系统托盘使用

```typescript
import { systemTrayService } from '../services/systemTrayService';

// 初始化系统托盘
async function initializeTray() {
  try {
    await systemTrayService.initialize({
      tooltip: '玩机管家',
      menuItems: [
        { id: 'show', label: '显示窗口' },
        { id: 'separator1', label: '-' },
        { id: 'exit', label: '退出应用' }
      ]
    });
    
    // 设置窗口关闭时最小化到托盘
    await systemTrayService.setupWindowCloseHandler(true);
    
    console.log('✅ 系统托盘初始化成功');
  } catch (error) {
    console.error('❌ 系统托盘初始化失败:', error);
  }
}
```

### 2. 开机自启动管理

```typescript
import { autoStartService } from '../services/autoStartService';

// 检查并设置开机自启动
async function manageAutoStart() {
  try {
    // 初始化服务
    await autoStartService.initialize('玩机管家');
    
    // 检查当前状态
    const status = await autoStartService.getAutoStartStatus();
    console.log('当前自启动状态:', status.isEnabled);
    
    // 启用自启动
    if (!status.isEnabled) {
      const success = await autoStartService.enableAutoStart();
      console.log('自启动设置结果:', success);
    }
    
    // 验证设置
    const validation = await autoStartService.validateAutoStart();
    if (!validation.isValid) {
      console.warn('自启动设置有问题:', validation.issues);
    }
    
  } catch (error) {
    console.error('❌ 自启动管理失败:', error);
  }
}
```

### 3. React 组件集成

```tsx
import React, { useState, useEffect } from 'react';
import { Switch } from '@fluentui/react-components';
import { systemTrayService } from '../services/systemTrayService';
import { autoStartService } from '../services/autoStartService';

export const SystemSettingsPanel: React.FC = () => {
  const [minimizeToTray, setMinimizeToTray] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [loading, setLoading] = useState(false);

  // 初始化状态
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        // 检查自启动状态
        await autoStartService.initialize('玩机管家');
        const status = await autoStartService.getAutoStartStatus();
        setAutoStart(status.isEnabled);
      } catch (error) {
        console.error('初始化设置失败:', error);
      }
    };

    initializeSettings();
  }, []);

  // 处理系统托盘切换
  const handleTrayToggle = async (checked: boolean) => {
    try {
      setLoading(true);
      setMinimizeToTray(checked);

      if (checked) {
        await systemTrayService.initialize();
        await systemTrayService.setupWindowCloseHandler(true);
      } else {
        await systemTrayService.cleanup();
      }
    } catch (error) {
      console.error('托盘设置失败:', error);
      setMinimizeToTray(!checked);
    } finally {
      setLoading(false);
    }
  };

  // 处理自启动切换
  const handleAutoStartToggle = async (checked: boolean) => {
    try {
      setLoading(true);
      
      const success = checked 
        ? await autoStartService.enableAutoStart()
        : await autoStartService.disableAutoStart();

      if (success) {
        setAutoStart(checked);
      }
    } catch (error) {
      console.error('自启动设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <label>最小化到系统托盘</label>
        <Switch
          checked={minimizeToTray}
          disabled={loading}
          onChange={(_, data) => handleTrayToggle(data.checked)}
        />
      </div>
      
      <div>
        <label>开机自启动</label>
        <Switch
          checked={autoStart}
          disabled={loading}
          onChange={(_, data) => handleAutoStartToggle(data.checked)}
        />
      </div>
    </div>
  );
};
```

## 后端实现说明

### Rust 命令注册

```rust
// 在 lib.rs 中注册命令
.invoke_handler(tauri::generate_handler![
    // 系统托盘命令
    system_features::create_system_tray,
    system_features::setup_tray_event_listener,
    system_features::update_tray_menu,
    system_features::is_system_tray_supported,
    system_features::destroy_system_tray,
    
    // 开机自启动命令
    system_features::get_auto_start_status,
    system_features::enable_auto_start,
    system_features::disable_auto_start,
    system_features::is_auto_start_supported,
    system_features::validate_auto_start,
])
```

### Windows 注册表操作

```rust
// 启用 Windows 自启动
#[cfg(target_os = "windows")]
async fn enable_windows_auto_start(config: AutoStartConfig) -> Result<bool, String> {
    use winreg::{enums::*, RegKey};
    
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = hkcu.open_subkey_with_flags(
        "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", 
        KEY_WRITE
    )?;
    
    let command = format!("\"{}\"", config.app_path);
    run_key.set_value(&config.app_name, &command)?;
    
    Ok(true)
}
```

## 错误处理

### 常见错误及解决方案

1. **系统托盘不支持**
   ```typescript
   const isSupported = await systemTrayService.isSystemTraySupported();
   if (!isSupported) {
     console.warn('当前系统不支持系统托盘');
     // 禁用相关功能
   }
   ```

2. **注册表权限不足**
   ```typescript
   try {
     await autoStartService.enableAutoStart();
   } catch (error) {
     if (error.message.includes('权限')) {
       // 提示用户以管理员身份运行
     }
   }
   ```

3. **自启动验证失败**
   ```typescript
   const validation = await autoStartService.validateAutoStart();
   if (!validation.isValid) {
     // 尝试修复
     await autoStartService.repairAutoStart();
   }
   ```

## 最佳实践

### 1. 初始化顺序
```typescript
// 推荐的初始化顺序
async function initializeApp() {
  // 1. 先初始化基础服务
  await autoStartService.initialize('玩机管家');
  
  // 2. 检查系统支持
  const traySupported = await systemTrayService.isSystemTraySupported();
  const autoStartSupported = await autoStartService.isAutoStartSupported();
  
  // 3. 根据支持情况初始化功能
  if (traySupported) {
    await systemTrayService.initialize();
  }
  
  // 4. 恢复用户设置
  const settings = getUserSettings();
  if (settings.autoStart && autoStartSupported) {
    await autoStartService.enableAutoStart();
  }
}
```

### 2. 错误恢复
```typescript
// 带重试的操作
async function enableAutoStartWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const success = await autoStartService.enableAutoStart();
      if (success) return true;
    } catch (error) {
      console.warn(`自启动设置失败 (尝试 ${i + 1}/${maxRetries}):`, error);
      if (i === maxRetries - 1) throw error;
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}
```

### 3. 用户体验优化
```typescript
// 提供用户反馈
async function toggleAutoStart(enabled: boolean) {
  const loadingToast = showLoading('正在设置开机自启动...');
  
  try {
    const success = enabled 
      ? await autoStartService.enableAutoStart()
      : await autoStartService.disableAutoStart();
    
    if (success) {
      showSuccess(`开机自启动已${enabled ? '启用' : '禁用'}`);
    } else {
      showError('设置失败，请重试');
    }
    
    return success;
  } catch (error) {
    showError(`设置失败: ${error.message}`);
    return false;
  } finally {
    hideLoading(loadingToast);
  }
}
```

## 平台兼容性

| 功能 | Windows | macOS | Linux |
|------|---------|-------|-------|
| 系统托盘 | ✅ | ⚠️ 部分支持 | ⚠️ 部分支持 |
| 开机自启动 | ✅ | ❌ 待实现 | ❌ 待实现 |
| 注册表操作 | ✅ | ❌ | ❌ |

## 安全注意事项

1. **权限检查**: 在修改注册表前检查权限
2. **路径验证**: 验证应用路径的有效性
3. **错误处理**: 妥善处理权限不足等错误
4. **用户同意**: 在启用自启动前获得用户明确同意

## 调试技巧

### 1. 启用详细日志
```typescript
// 在开发模式下启用详细日志
if (process.env.NODE_ENV === 'development') {
  systemTrayService.enableDebugLogging();
  autoStartService.enableDebugLogging();
}
```

### 2. 状态检查工具
```typescript
// 创建状态检查工具
async function checkSystemFeatureStatus() {
  const status = {
    tray: {
      supported: await systemTrayService.isSystemTraySupported(),
      initialized: systemTrayService.isReady(),
    },
    autoStart: {
      supported: await autoStartService.isAutoStartSupported(),
      enabled: (await autoStartService.getAutoStartStatus()).isEnabled,
      valid: (await autoStartService.validateAutoStart()).isValid,
    }
  };
  
  console.table(status);
  return status;
}
```

这个指南提供了完整的系统功能使用方法，包括前端集成、后端实现、错误处理和最佳实践。