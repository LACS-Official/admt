# API规范更新说明

## 更新概述

根据 API 使用指南文档 `docs\API_USAGE_GUIDE.md` 中的最新规范，对用户行为追踪功能进行了重要更新，主要涉及认证方式和频率限制的修改。

## 主要变更

### 1. 软件使用记录API (`/api/user-behavior/usage`)

#### 变更前
- ✅ 需要API Key认证
- ✅ 包含User-Agent头
- ❌ 无频率限制机制

#### 变更后
- ✅ **无需任何认证** - 移除API Key要求
- ✅ **移除User-Agent头** - 只保留Content-Type
- ✅ **IP级别频率限制** - 10秒内只能发送一次
- ✅ **客户端频率控制** - 避免重复请求

#### 代码修改
**文件**: `src\services\usageTrackingService.ts`

```typescript
// 修改前
headers: {
  'Content-Type': 'application/json',
  'X-API-Key': config.api_key,
  'User-Agent': `${config.app_id}/${config.app_version}`,
}

// 修改后
headers: {
  'Content-Type': 'application/json',
}

// 新增频率限制检查
if (!this.canSendRequest('usage')) {
  console.log('⏰ IP频率限制：10秒内已发送过使用数据请求，跳过本次发送');
  return true;
}
```

### 2. 设备连接记录API (`/api/user-behavior/device-connections`)

#### 变更前
- ✅ 需要API Key认证
- ✅ 包含User-Agent头
- ✅ 发送额外的设备信息字段

#### 变更后
- ✅ **无需任何认证** - 移除API Key要求
- ✅ **移除User-Agent头** - 只保留Content-Type
- ✅ **精简请求数据** - 只发送API文档要求的字段
- ✅ **IP级别频率限制** - 10秒内只能发送一次

#### 代码修改
**文件**: `src\services\deviceConnectionTrackingService.ts`

```typescript
// 修改前
headers: {
  'Content-Type': 'application/json',
  'User-Agent': `${config.app_id}/${config.app_version}`,
}
body: JSON.stringify(data) // 包含所有字段

// 修改后
headers: {
  'Content-Type': 'application/json',
}

// 只发送API文档要求的字段
const apiData = {
  deviceSerial: data.deviceSerial,
  softwareId: data.softwareId,
  userDeviceFingerprint: data.userDeviceFingerprint
};
body: JSON.stringify(apiData)
```

## 技术实现细节

### 1. IP级别频率限制

实现了客户端级别的频率控制机制：

```typescript
export class UsageTrackingService {
  private lastRequestTimes: Map<string, number> = new Map();

  private canSendRequest(endpoint: string): boolean {
    const now = Date.now();
    const lastRequestTime = this.lastRequestTimes.get(endpoint);
    
    if (!lastRequestTime) {
      return true; // 首次请求
    }
    
    const timeDiff = now - lastRequestTime;
    const rateLimitMs = 10 * 1000; // 10秒
    
    return timeDiff >= rateLimitMs;
  }

  private recordRequestTime(endpoint: string): void {
    this.lastRequestTimes.set(endpoint, Date.now());
  }
}
```

### 2. 错误处理优化

增强了429频率限制错误的处理：

```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.warn(`⏰ 服务器频率限制，建议等待 ${retryAfter || '10'} 秒后重试`);
  return false; // 静默失败，不影响用户体验
}
```

### 3. 隐私政策检查

两个API都保持了严格的隐私政策检查：

```typescript
private canCollectData(): boolean {
  const privacyStore = usePrivacyConsentStore.getState();
  
  const hasConsent = privacyStore.hasCompletedPrivacySetup &&
                    privacyStore.hasAcceptedPrivacyPolicy &&
                    privacyStore.hasAcceptedUserAgreement &&
                    privacyStore.hasAcceptedDataCollection;

  const canCollectBehavior = privacyStore.canCollectUserBehavior();

  return hasConsent && canCollectBehavior;
}
```

## API请求示例

### 软件使用记录API

```bash
curl -X POST "https://api-g.lacs.cc/api/user-behavior/usage" \
  -H "Content-Type: application/json" \
  -d '{
    "softwareId": 1,
    "softwareName": "玩机管家",
    "softwareVersion": "1.0.0",
    "deviceFingerprint": "fp_1234567890abcdef",
    "used": 1
  }'
```

### 设备连接记录API

```bash
curl -X POST "https://api-g.lacs.cc/api/user-behavior/device-connections" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceSerial": "SM-G991B-123456789",
    "softwareId": 1,
    "userDeviceFingerprint": "fp_1234567890abcdef"
  }'
```

## 测试验证

### 1. 网络请求验证
在浏览器开发者工具的Network标签中，可以验证：
- ✅ 请求头只包含`Content-Type: application/json`
- ✅ 不包含`X-API-Key`或`User-Agent`头
- ✅ 请求体符合API文档规范

### 2. 频率限制验证
- ✅ 10秒内重复请求会被客户端拦截
- ✅ 服务器返回429时会正确处理
- ✅ 频率限制不影响应用正常使用

### 3. 隐私政策验证
- ✅ 未同意隐私政策时不发送数据
- ✅ 可以通过设置页面查看同意状态
- ✅ 支持动态权限控制

## 向后兼容性

### 保持兼容的功能
- ✅ 会话管理逻辑不变
- ✅ 设备指纹生成不变
- ✅ 错误处理机制不变
- ✅ 测试界面功能不变

### 移除的功能
- ❌ API Key认证（按API文档要求移除）
- ❌ User-Agent头（按API文档要求移除）
- ❌ 设备连接API的额外字段（精简为必需字段）

## 部署注意事项

### 1. 服务器端配置
- 确保API端点支持无认证访问
- 配置IP级别的频率限制（10秒）
- 设置正确的CORS策略

### 2. 客户端配置
- 无需修改API Key配置（已不使用）
- 确保隐私政策设置正确
- 验证频率限制逻辑工作正常

### 3. 监控和日志
- 监控API调用成功率
- 记录频率限制触发情况
- 跟踪隐私政策同意率

## 相关文件

### 修改的文件
- `src\services\usageTrackingService.ts` - 软件使用追踪服务
- `src\services\deviceConnectionTrackingService.ts` - 设备连接追踪服务
- `docs\用户行为追踪功能实现说明.md` - 实现文档更新

### 测试文件
- `src\components\Settings\UsageTrackingSettings.tsx` - 测试界面
- `scripts\test-usage-tracking.md` - 测试指南

### 参考文档
- `docs\API_USAGE_GUIDE.md` - API使用指南（权威规范）

## 总结

本次更新严格按照API使用指南文档的规范进行，主要目标是：

1. **简化认证** - 移除API Key要求，降低集成复杂度
2. **标准化请求** - 只发送必需的头部和数据字段
3. **频率控制** - 实现IP级别的频率限制，防止滥用
4. **保持隐私** - 继续严格执行隐私政策检查

所有修改都经过了充分的测试验证，确保功能正常且不影响用户体验。
