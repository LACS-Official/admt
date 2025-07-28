# 激活码管理 API 详细文档

## 概述

激活码管理系统是一个完整的软件许可证管理解决方案，提供激活码的生成、验证、查询、统计和管理功能。系统基于 PostgreSQL 数据库，支持高并发和大规模部署。
基础前置url: https://api-g.lacs.cc
## 核心功能

- ✅ **激活码生成** - 生成唯一的、安全的激活码
- ✅ **激活码验证** - 验证激活码有效性并标记使用状态
- ✅ **批量管理** - 支持分页查询和批量操作
- ✅ **统计分析** - 提供详细的使用统计信息
- ✅ **过期管理** - 自动处理过期激活码
- ✅ **元数据支持** - 支持自定义产品信息和元数据
- ✅ **安全性** - 内置防重放攻击和过期保护
- ✅ **真实过期时间** - 在API返回值中包含激活码的真实过期时间信息
- ✅ **自动清理机制** - 5分钟内未使用的激活码自动清理

## 数据模型

### ActivationCode 对象结构

```typescript
interface ActivationCode {
  id: string              // UUID 唯一标识符
  code: string            // 激活码字符串
  createdAt: Date         // 创建时间
  expiresAt: Date         // 过期时间
  isUsed: boolean         // 是否已使用
  usedAt?: Date           // 使用时间（可选）
  metadata?: object       // 自定义元数据（可选）
  productInfo?: {         // 产品信息（可选）
    name: string          // 产品名称
    version: string       // 产品版本
    features: string[]    // 功能列表
  }
}
```

### 激活码格式

激活码采用以下格式生成：
```
{timestamp}-{random}-{uuid}
```

- `timestamp`: 时间戳（36进制）
- `random`: 随机字符串（6位）
- `uuid`: UUID片段（8位）

示例：`1K2L3M4N-ABC123-DEF45678`

## API 端点详细说明

### 1. 生成激活码

**端点**: `POST /api/activation-codes`

**描述**: 生成一个新的激活码，支持自定义过期时间和产品信息。

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "expirationDays": 365,           // 可选，过期天数，默认 365
  "metadata": {                    // 可选，自定义元数据
    "customerEmail": "user@example.com",
    "licenseType": "enterprise",
    "purchaseId": "PO-12345",
    "customerId": "CUST-67890"
  },
  "productInfo": {                 // 可选，产品信息
    "name": "我的软件专业版",
    "version": "2.1.0",
    "features": ["premium", "support", "analytics"]
  }
}
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "1K2L3M4N-ABC123-DEF45678",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2025-01-01T00:00:00.000Z",
    "isUsed": false,
    "productInfo": {
      "name": "我的软件专业版",
      "version": "2.1.0",
      "features": ["premium", "support", "analytics"]
    }
  }
}
```

**错误响应** (500):
```json
{
  "success": false,
  "error": "生成激活码失败"
}
```

### 2. 验证激活码

**端点**: `POST /api/activation-codes/verify`

**描述**: 验证激活码的有效性，如果有效则标记为已使用。

**请求体**:
```json
{
  "code": "1K2L3M4N-ABC123-DEF45678"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "1K2L3M4N-ABC123-DEF45678",
    "productInfo": {
      "name": "我的软件专业版",
      "version": "2.1.0",
      "features": ["premium", "support", "analytics"]
    },
    "metadata": {
      "customerEmail": "user@example.com",
      "licenseType": "enterprise"
    },
    "activatedAt": "2024-01-01T12:00:00.000Z",
    "apiValidation": {
      "expiresAt": "2025-01-01T12:00:00.000Z",
      "remainingTime": 31536000,
      "message": "激活码原本将在 365 天 0 小时 0 分钟后过期（现已激活）"
    }
  }
}
```

**错误响应**:

激活码不存在 (404):
```json
{
  "success": false,
  "error": "激活码不存在"
}
```

激活码已使用 (400):
```json
{
  "success": false,
  "error": "激活码已被使用",
  "usedAt": "2024-01-01T10:00:00.000Z"
}
```

激活码已过期 (400):
```json
{
  "success": false,
  "error": "激活码已过期",
  "expiresAt": "2023-12-31T23:59:59.000Z"
}
```

### 3. 获取激活码列表

**端点**: `GET /api/activation-codes`

**描述**: 获取激活码列表，支持分页和多种状态过滤。

**查询参数**:
- `page`: 页码，默认 1
- `limit`: 每页数量，默认 10，最大 100
- `status`: 状态过滤
  - `all`: 全部（默认）
  - `used`: 已使用
  - `unused`: 未使用
  - `expired`: 已过期
  - `active`: 有效（未使用且未过期）

**请求示例**:
```
GET /api/activation-codes?page=1&limit=20&status=active
```

**响应**:
```json
{
  "success": true,
  "data": {
    "codes": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "code": "1K2L3M4N-ABC123-DEF45678",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "expiresAt": "2025-01-01T00:00:00.000Z",
        "isUsed": false,
        "usedAt": null,
        "productInfo": {
          "name": "我的软件专业版",
          "version": "2.1.0",
          "features": ["premium"]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### 4. 获取单个激活码详情

**端点**: `GET /api/activation-codes/[id]`

**描述**: 根据 ID 获取激活码的详细信息。

**路径参数**:
- `id`: 激活码的 UUID

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "1K2L3M4N-ABC123-DEF45678",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2025-01-01T00:00:00.000Z",
    "isUsed": false,
    "usedAt": null,
    "isExpired": false,
    "productInfo": {
      "name": "我的软件专业版",
      "version": "2.1.0",
      "features": ["premium", "support"]
    },
    "metadata": {
      "customerEmail": "user@example.com",
      "licenseType": "enterprise"
    }
  }
}
```

**错误响应** (404):
```json
{
  "success": false,
  "error": "激活码不存在"
}
```

### 5. 删除激活码

**端点**: `DELETE /api/activation-codes/[id]`

**描述**: 根据 ID 删除指定的激活码。

**路径参数**:
- `id`: 激活码的 UUID

**响应**:
```json
{
  "success": true,
  "message": "激活码删除成功"
}
```

**错误响应** (404):
```json
{
  "success": false,
  "error": "激活码不存在"
}
```

### 6. 获取激活码统计信息

**端点**: `GET /api/activation-codes/stats`

**描述**: 获取激活码的统计信息，包括总数、使用情况等。

**响应**:
```json
{
  "success": true,
  "data": {
    "total": 1000,          // 总激活码数量
    "used": 450,            // 已使用数量
    "unused": 350,          // 未使用数量
    "expired": 200,         // 已过期数量
    "active": 350,          // 有效数量（未使用且未过期）
    "usageRate": 45.0,      // 使用率（百分比）
    "expirationRate": 20.0  // 过期率（百分比）
  }
}
```

### 7. 清理过期激活码

**端点**: `POST /api/activation-codes/cleanup`

**描述**: 清理过期超过指定天数的激活码。

**请求体**:
```json
{
  "daysOld": 30  // 可选，清理过期超过多少天的激活码，默认 30
}
```

**响应**:
```json
{
  "success": true,
  "message": "已清理 25 个过期激活码",
  "deletedCount": 25
}
```

### 8. API验证状态检查

**端点**: `GET /api/auth/validate`

**描述**: 检查API Key验证状态和过期时间信息。

**请求头**:
```
X-API-Key: your_api_key_here
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "authEnabled": true,
    "isValid": true,
    "expiresAt": "2024-01-02T12:00:00.000Z",
    "remainingTime": 86400,
    "message": "API验证有效，将在 24 小时 0 分钟后过期",
    "expirationHours": 24
  }
}
```

**验证失败响应** (401):
```json
{
  "success": false,
  "error": "Invalid or missing API Key",
  "data": {
    "authEnabled": true,
    "isValid": false
  }
}
```

### 9. 刷新API验证

**端点**: `POST /api/auth/validate`

**描述**: 刷新API验证状态，重新计算过期时间。

**请求头**:
```
X-API-Key: your_api_key_here
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "message": "API验证已刷新",
    "expiresAt": "2024-01-02T12:00:00.000Z",
    "remainingTime": 86400,
    "refreshedAt": "2024-01-01T12:00:00.000Z",
    "expirationHours": 24
  }
}
```

### 10. 清理未使用的激活码

**端点**: `POST /api/activation-codes/cleanup-unused`

**描述**: 手动清理指定时间内未使用的激活码。系统会自动在每次API调用时清理5分钟内未使用的激活码。

**请求头**:
```
X-API-Key: your_api_key_here
Content-Type: application/json
```

**请求体**:
```json
{
  "minutesOld": 5  // 可选，清理多少分钟前创建且未使用的激活码，默认 5，范围 1-1440
}
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "message": "成功清理了 3 个5分钟内未使用的激活码",
    "deletedCount": 3,
    "minutesOld": 5,
    "cleanupTime": "2024-01-01T12:00:00.000Z",
    "deletedCodes": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "code": "1K2L3M4N-ABC123-DEF45678",
        "createdAt": "2024-01-01T11:50:00.000Z",
        "expiresAt": "2024-12-31T11:50:00.000Z"
      }
    ]
  }
}
```

### 11. 预览将要清理的激活码

**端点**: `GET /api/activation-codes/cleanup-unused?minutesOld=5`

**描述**: 预览将要被清理的未使用激活码，不实际删除。

**请求头**:
```
X-API-Key: your_api_key_here
```

**查询参数**:
- `minutesOld`: 可选，查看多少分钟前创建且未使用的激活码，默认 5

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "message": "找到 2 个5分钟内未使用的激活码",
    "count": 2,
    "minutesOld": 5,
    "cutoffTime": "2024-01-01T11:55:00.000Z",
    "codes": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "code": "1K2L3M4N-ABC123-DEF45678",
        "createdAt": "2024-01-01T11:50:00.000Z",
        "expiresAt": "2024-12-31T11:50:00.000Z",
        "minutesSinceCreation": 10
      }
    ]
  }
}
```

## 使用示例

### JavaScript/Node.js 示例

```javascript
// 1. 生成激活码
async function generateActivationCode() {
  const response = await fetch('/api/activation-codes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      expirationDays: 365,
      productInfo: {
        name: '我的软件专业版',
        version: '2.1.0',
        features: ['premium', 'support']
      },
      metadata: {
        customerEmail: 'customer@example.com',
        licenseType: 'enterprise'
      }
    })
  })
  
  const result = await response.json()
  if (result.success) {
    console.log('激活码生成成功:', result.data.code)
    return result.data
  } else {
    console.error('生成失败:', result.error)
  }
}

// 2. 验证激活码
async function verifyActivationCode(code) {
  const response = await fetch('/api/activation-codes/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code })
  })
  
  const result = await response.json()
  if (result.success) {
    console.log('激活成功!', result.data)
    return result.data
  } else {
    console.error('激活失败:', result.error)
    return null
  }
}

// 3. 获取激活码列表
async function getActivationCodes(page = 1, status = 'all') {
  const response = await fetch(
    `/api/activation-codes?page=${page}&limit=10&status=${status}`
  )
  
  const result = await response.json()
  if (result.success) {
    console.log('激活码列表:', result.data.codes)
    console.log('分页信息:', result.data.pagination)
    return result.data
  } else {
    console.error('获取列表失败:', result.error)
  }
}

// 4. 获取统计信息
async function getStats() {
  const response = await fetch('/api/activation-codes/stats')
  const result = await response.json()
  
  if (result.success) {
    console.log('统计信息:', result.data)
    return result.data
  } else {
    console.error('获取统计失败:', result.error)
  }
}
```

### Python 示例

```python
import requests
import json

class ActivationCodeAPI:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')

    def generate_code(self, expiration_days=365, product_info=None, metadata=None):
        """生成激活码"""
        url = f"{self.base_url}/api/activation-codes"
        data = {
            "expirationDays": expiration_days
        }

        if product_info:
            data["productInfo"] = product_info
        if metadata:
            data["metadata"] = metadata

        response = requests.post(url, json=data)
        return response.json()

    def verify_code(self, code):
        """验证激活码"""
        url = f"{self.base_url}/api/activation-codes/verify"
        data = {"code": code}

        response = requests.post(url, json=data)
        return response.json()

    def get_codes(self, page=1, limit=10, status='all'):
        """获取激活码列表"""
        url = f"{self.base_url}/api/activation-codes"
        params = {
            "page": page,
            "limit": limit,
            "status": status
        }

        response = requests.get(url, params=params)
        return response.json()

    def get_stats(self):
        """获取统计信息"""
        url = f"{self.base_url}/api/activation-codes/stats"
        response = requests.get(url)
        return response.json()

# 使用示例
api = ActivationCodeAPI("http://localhost:3000")

# 生成激活码
result = api.generate_code(
    expiration_days=365,
    product_info={
        "name": "我的软件专业版",
        "version": "2.1.0",
        "features": ["premium", "support"]
    },
    metadata={
        "customerEmail": "customer@example.com"
    }
)

if result["success"]:
    print(f"激活码生成成功: {result['data']['code']}")
else:
    print(f"生成失败: {result['error']}")
```

### cURL 示例

```bash
# 1. 生成激活码
curl -X POST http://localhost:3000/api/activation-codes \
  -H "Content-Type: application/json" \
  -d '{
    "expirationDays": 365,
    "productInfo": {
      "name": "我的软件专业版",
      "version": "2.1.0",
      "features": ["premium", "support"]
    },
    "metadata": {
      "customerEmail": "customer@example.com",
      "licenseType": "enterprise"
    }
  }'

# 2. 验证激活码
curl -X POST http://localhost:3000/api/activation-codes/verify \
  -H "Content-Type: application/json" \
  -d '{"code": "1K2L3M4N-ABC123-DEF45678"}'

# 3. 获取激活码列表
curl "http://localhost:3000/api/activation-codes?page=1&limit=10&status=active"

# 4. 获取单个激活码详情
curl http://localhost:3000/api/activation-codes/550e8400-e29b-41d4-a716-446655440000

# 5. 获取统计信息
curl http://localhost:3000/api/activation-codes/stats

# 6. 清理过期激活码
curl -X POST http://localhost:3000/api/activation-codes/cleanup \
  -H "Content-Type: application/json" \
  -d '{"daysOld": 30}'

# 7. 删除激活码
curl -X DELETE http://localhost:3000/api/activation-codes/550e8400-e29b-41d4-a716-446655440000
```

## 错误处理

### 错误响应格式

所有 API 端点在出错时都会返回统一的错误格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

### 常见错误码和处理

| HTTP 状态码 | 错误类型 | 描述 | 处理建议 |
|------------|----------|------|----------|
| 400 | Bad Request | 请求参数错误 | 检查请求参数格式和必填字段 |
| 404 | Not Found | 资源不存在 | 确认激活码 ID 或路径正确 |
| 500 | Internal Server Error | 服务器内部错误 | 检查服务器日志，联系技术支持 |

### 错误处理最佳实践

```javascript
async function handleApiCall(apiFunction) {
  try {
    const response = await apiFunction()

    if (!response.success) {
      // 处理业务逻辑错误
      switch (response.error) {
        case '激活码已被使用':
          console.log('该激活码已经被使用过了')
          break
        case '激活码已过期':
          console.log('激活码已过期，请联系客服')
          break
        case '激活码不存在':
          console.log('激活码无效，请检查输入')
          break
        default:
          console.log('操作失败:', response.error)
      }
      return null
    }

    return response.data
  } catch (error) {
    // 处理网络错误或其他异常
    console.error('网络错误:', error.message)
    return null
  }
}
```

## 安全注意事项

### 1. 激活码安全性

- **唯一性保证**: 每个激活码都是全局唯一的
- **随机性**: 使用时间戳、随机数和 UUID 组合生成
- **防暴力破解**: 激活码长度足够，包含多种字符类型
- **过期保护**: 所有激活码都有明确的过期时间

### 2. API 安全建议

- **HTTPS**: 生产环境必须使用 HTTPS 协议
- **认证**: 建议添加 API 密钥或 JWT 认证
- **限流**: 实施 API 调用频率限制
- **日志记录**: 记录所有 API 调用和敏感操作
- **输入验证**: 严格验证所有输入参数

### 3. 数据库安全

- **连接加密**: 使用 SSL/TLS 加密数据库连接
- **参数化查询**: 防止 SQL 注入攻击
- **最小权限**: 数据库用户只授予必要权限
- **备份策略**: 定期备份激活码数据

## 性能优化

### 1. 数据库优化

```sql
-- 为常用查询字段添加索引
CREATE INDEX idx_activation_codes_code ON activation_codes(code);
CREATE INDEX idx_activation_codes_is_used ON activation_codes(is_used);
CREATE INDEX idx_activation_codes_expires_at ON activation_codes(expires_at);
CREATE INDEX idx_activation_codes_created_at ON activation_codes(created_at);

-- 复合索引用于状态查询
CREATE INDEX idx_activation_codes_status ON activation_codes(is_used, expires_at);
```

### 2. 缓存策略

- **Redis 缓存**: 缓存热点激活码数据
- **CDN**: 静态资源使用 CDN 加速
- **应用缓存**: 缓存统计信息和配置数据

### 3. 分页优化

- **游标分页**: 大数据量时使用游标分页
- **限制页面大小**: 最大每页 100 条记录
- **索引优化**: 确保排序字段有索引

## 监控和日志

### 1. 关键指标监控

- **API 响应时间**: 监控各端点响应时间
- **错误率**: 监控 4xx 和 5xx 错误率
- **激活码使用率**: 监控激活码的使用情况
- **数据库性能**: 监控查询执行时间

### 2. 日志记录

```javascript
// 示例日志记录
console.log({
  timestamp: new Date().toISOString(),
  action: 'ACTIVATION_CODE_GENERATED',
  codeId: newCode.id,
  productInfo: newCode.productInfo,
  expiresAt: newCode.expiresAt,
  metadata: {
    userAgent: request.headers['user-agent'],
    ip: request.ip
  }
})
```

### 3. 告警设置

- **激活码生成失败率 > 5%**
- **数据库连接失败**
- **API 响应时间 > 2 秒**
- **过期激活码堆积过多**

## 部署和运维

### 1. 环境配置

```env
# 数据库配置
DATABASE_URL=postgresql://username:password@host:5432/database

# API 配置
API_RATE_LIMIT=100  # 每分钟请求限制
API_TIMEOUT=30000   # API 超时时间（毫秒）

# 安全配置
API_SECRET_KEY=your-secret-key
CORS_ORIGINS=https://yourdomain.com

# 监控配置
LOG_LEVEL=info
METRICS_ENABLED=true
```

### 2. 健康检查

```javascript
// 健康检查端点
app.get('/api/health', async (req, res) => {
  try {
    // 检查数据库连接
    await db.select().from(activationCodes).limit(1)

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    })
  }
})
```

### 3. 备份和恢复

```bash
# 数据库备份
pg_dump $DATABASE_URL > activation_codes_backup_$(date +%Y%m%d).sql

# 数据恢复
psql $DATABASE_URL < activation_codes_backup_20240101.sql
```

## 常见问题解答

### Q: 激活码的有效期如何设置？
A: 在生成激活码时通过 `expirationDays` 参数设置，默认为 365 天。可以根据产品策略调整。

### Q: 如何处理激活码重复？
A: 系统使用时间戳、随机数和 UUID 组合生成激活码，重复概率极低。数据库层面也有唯一约束保证。

### Q: 激活码可以重复使用吗？
A: 不可以。激活码一旦验证成功就会被标记为已使用，无法再次使用。

### Q: 如何批量生成激活码？
A: 可以通过循环调用生成 API，或者扩展 API 支持批量生成功能。

### Q: 数据库连接失败怎么办？
A: 检查 `DATABASE_URL` 环境变量，确保数据库服务正常运行，网络连接正常。

### Q: 如何迁移现有的激活码数据？
A: 可以使用提供的迁移脚本，或者通过 API 重新导入数据。

## 更新日志

### v2.0.0 (2024-01-01)
- 彻底移除 v2 路由前缀，简化 API 路径
- 优化激活码生成算法
- 增加详细的中文文档
- 改进错误处理和响应格式
- 清理代码结构，移除冗余路由

### v1.2.0 (2023-12-15)
- 添加激活码统计功能
- 支持批量清理过期激活码
- 优化数据库查询性能

### v1.1.0 (2023-12-01)
- 添加元数据支持
- 改进产品信息结构
- 增加分页查询功能

### v1.0.0 (2023-11-15)
- 初始版本发布
- 基础的激活码生成和验证功能
- PostgreSQL 数据库支持

## 技术支持

如果您在使用过程中遇到问题，请：

1. 查看本文档的常见问题部分
2. 检查服务器日志和错误信息
3. 确认环境配置是否正确
4. 联系技术支持团队

---

**文档版本**: v2.0.0
**最后更新**: 2024-01-01
**维护团队**: 激活码系统开发组
