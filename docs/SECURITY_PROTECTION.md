# 🛡️ 安全防护功能说明

## 概述

本应用集成了全面的安全防护功能，用于防止用户通过开发者工具访问和调试应用，保护应用的安全性和知识产权。

## 功能特性

### 1. 禁用右键菜单
- 阻止用户通过右键菜单访问"检查元素"等开发者工具选项
- 全局生效，覆盖所有页面元素

### 2. 禁用键盘快捷键
防护以下常见的开发者工具快捷键：
- **F12** - 开发者工具
- **Ctrl+Shift+I** (Windows/Linux) / **Cmd+Option+I** (Mac) - 开发者工具
- **Ctrl+Shift+J** (Windows/Linux) / **Cmd+Option+J** (Mac) - 控制台
- **Ctrl+U** (Windows/Linux) / **Cmd+U** (Mac) - 查看源代码
- **Ctrl+Shift+C** - 元素选择器

### 3. 开发者工具检测
- 实时检测开发者工具是否被打开
- 使用多种检测方法确保准确性：
  - 窗口尺寸变化检测
  - Console API 检测
  - Debugger 语句检测

### 4. 防护措施
当检测到开发者工具打开时：
- 隐藏页面内容
- 显示安全警告页面
- 提示用户关闭开发者工具

### 5. 文本选择和拖拽防护
- 禁用文本选择功能
- 防止页面元素被拖拽
- 保护页面内容不被轻易复制

## 使用方法

### 1. 启用安全防护

安全防护功能已自动集成到应用中，默认启用。你可以通过以下方式管理：

```typescript
import { SecurityProvider } from './components/Security';

// 在应用根组件中包装
<SecurityProvider enableProtection={true}>
  <App />
</SecurityProvider>
```

### 2. 访问安全设置

1. 打开应用设置页面
2. 点击"安全防护"选项卡
3. 在此页面可以：
   - 启用/禁用安全防护
   - 查看防护状态
   - 了解各项防护功能

### 3. 安全测试

1. 在设置页面点击"安全测试"选项卡
2. 运行各项安全测试：
   - 右键菜单测试
   - 键盘快捷键测试
   - 文本选择测试
   - 开发者工具检测测试
3. 查看测试结果确认防护效果

### 4. 自定义防护行为

```typescript
import { useSecurityContext } from './components/Security';

function MyComponent() {
  const { isProtectionEnabled, setProtectionEnabled, isDevToolsDetected } = useSecurityContext();
  
  // 自定义处理逻辑
  if (isDevToolsDetected) {
    // 执行自定义防护措施
  }
}
```

## 技术实现

### 核心组件

1. **SecurityProtection** - 核心安全防护类
2. **SecurityProvider** - React 上下文提供者
3. **SecuritySettings** - 安全设置界面
4. **SecurityWarning** - 安全警告组件
5. **SecurityTest** - 安全测试工具

### 检测机制

```typescript
// 窗口尺寸检测
const threshold = 160;
if (window.outerHeight - window.innerHeight > threshold) {
  // 检测到开发者工具
}

// Console API 检测
let devtoolsOpen = false;
let element = new Image();
Object.defineProperty(element, 'id', {
  get: () => {
    devtoolsOpen = true;
    handleDevToolsDetected();
  }
});
console.dir(element);
```

### 事件拦截

```typescript
// 禁用右键菜单
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  return false;
}, true);

// 禁用键盘快捷键
document.addEventListener('keydown', (e) => {
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
    e.preventDefault();
    return false;
  }
}, true);
```

## 注意事项

### 1. 开发环境
- 在开发环境中，建议禁用安全防护以便调试
- 可通过环境变量控制：`VITE_ENABLE_SECURITY=false`

### 2. 用户体验
- 安全防护可能影响正常的用户交互
- 建议在生产环境中谨慎启用
- 提供明确的用户提示和说明

### 3. 绕过方法
- 安全防护主要针对普通用户，有经验的开发者仍可能绕过
- 这些措施主要起到威慑和基础保护作用
- 不应作为唯一的安全防护手段

### 4. 性能影响
- 开发者工具检测会定期运行，可能有轻微性能影响
- 检测间隔可根据需要调整

## 配置选项

```typescript
interface SecurityConfig {
  enableProtection: boolean;          // 是否启用防护
  enableContextMenu: boolean;         // 是否禁用右键菜单
  enableKeyboardShortcuts: boolean;   // 是否禁用快捷键
  enableDevToolsDetection: boolean;   // 是否启用开发者工具检测
  enableTextSelection: boolean;       // 是否禁用文本选择
  detectionInterval: number;          // 检测间隔（毫秒）
  onDevToolsDetected?: () => void;    // 检测到开发者工具的回调
}
```

## 测试验证

### 手动测试
1. 启用安全防护
2. 尝试右键点击页面
3. 按 F12 或 Ctrl+Shift+I
4. 尝试选择页面文本
5. 观察是否被正确阻止

### 自动化测试
使用提供的 `SecurityTest` 组件进行自动化测试验证。

## 故障排除

### 常见问题

1. **防护功能不生效**
   - 检查是否正确启用了 SecurityProvider
   - 确认浏览器兼容性
   - 查看控制台是否有错误信息

2. **误触发防护**
   - 调整检测阈值
   - 检查是否有其他扩展程序干扰

3. **性能问题**
   - 增加检测间隔
   - 优化检测逻辑

### 调试模式
```typescript
// 启用调试模式
securityProtection.setDebugMode(true);
```

## 更新日志

### v1.0.0
- 初始版本发布
- 基础安全防护功能
- 设置界面和测试工具

---

**注意：** 安全防护功能主要用于保护应用免受普通用户的调试和逆向工程，但不能完全防止有经验的开发者绕过这些限制。建议结合其他安全措施使用。
