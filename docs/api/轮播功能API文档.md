# 🎠 轮播功能 API 文档

> 📋 轮播图管理系统的完整API规范文档

## 📊 概述

本文档描述了轮播功能API接口的设计规范，支持轮播图的创建、读取、更新、删除等操作。API采用RESTful设计原则，提供标准化的轮播数据管理功能。

### 🎯 核心功能
- ✅ 轮播图列表查询
- ✅ 单个轮播项详情获取
- ✅ 轮播项创建
- ✅ 轮播项更新
- ✅ 轮播项删除
- ✅ 轮播顺序管理
- ✅ 批量操作支持

---

## 🔗 基础信息

```bash
# 基础URL
Production:  https://api-g.lacs.cc
Development: http://localhost:3000

# 认证方式
API Key:     X-API-Key: your-api-key

# 数据格式
Content-Type: application/json
Accept: application/json
```

---

## 📝 数据类型定义

### CarouselSlide（轮播项）

```typescript
interface CarouselSlide {
  id: string;                    // 轮播项唯一标识
  title: string;                 // 轮播项标题（必需）
  description: string;           // 轮播项内容文本（必需）
  backgroundColor: string;       // 背景颜色或渐变色（必需）
  backgroundImage?: string;      // 背景图片URL（可选）
  link?: string;                 // 点击跳转链接（可选）
  isActive: boolean;             // 是否启用（必需）
  displayOrder: number;          // 显示顺序（必需）
  createdAt: string;             // 创建时间（ISO 8601格式）
  updatedAt: string;             // 更新时间（ISO 8601格式）
  metadata?: {                   // 元数据（可选）
    author?: string;             // 创建者
    category?: string;           // 分类
    tags?: string[];             // 标签
  };
}
```

### ApiResponse（标准响应格式）

```typescript
interface ApiResponse<T> {
  success: boolean;              // 请求是否成功
  data?: T;                      // 响应数据
  message?: string;              // 响应消息
  error?: {                      // 错误信息（仅失败时）
    code: string;                // 错误代码
    details?: string;            // 错误详情
  };
  meta?: {                       // 元信息（可选）
    total?: number;              // 总数量
    page?: number;               // 当前页码
    limit?: number;              // 每页数量
    hasNext?: boolean;           // 是否有下一页
  };
}
```

---

## 🔌 API 接口规范

### 1. 获取轮播列表

#### GET `/api/carousel`

获取轮播图列表，支持分页和筛选。

**请求参数：**

| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `page` | integer | 否 | 1 | 页码（从1开始） |
| `limit` | integer | 否 | 10 | 每页数量（最大100） |
| `isActive` | boolean | 否 | - | 筛选启用状态 |
| `category` | string | 否 | - | 筛选分类 |
| `sortBy` | string | 否 | `displayOrder` | 排序字段 |
| `sortOrder` | string | 否 | `asc` | 排序方向：`asc`/`desc` |

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "欢迎使用",
      "description": "现代化的Android设备管理工具",
      "backgroundColor": "linear-gradient(135deg, #0078d4 0%, #106ebe 50%, #005a9e 100%)",
      "isActive": true,
      "displayOrder": 1,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "2",
      "title": "强大的设备管理",
      "description": "实时设备检测、详细信息展示",
      "backgroundColor": "linear-gradient(135deg, #16a085 0%, #27ae60 50%, #2ecc71 100%)",
      "isActive": true,
      "displayOrder": 2,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "hasNext": false
  }
}
```

### 2. 获取单个轮播项

#### GET `/api/carousel/{id}`

根据ID获取特定轮播项的详细信息。

**路径参数：**

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `id` | string | 是 | 轮播项唯一标识 |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "欢迎使用",
    "description": "现代化的Android设备管理工具",
    "backgroundColor": "linear-gradient(135deg, #0078d4 0%, #106ebe 50%, #005a9e 100%)",
    "backgroundImage": "https://example.com/banner1.jpg",
    "link": "https://example.com/welcome",
    "isActive": true,
    "displayOrder": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "metadata": {
      "author": "admin",
      "category": "welcome",
      "tags": ["welcome", "introduction"]
    }
  }
}
```

### 3. 创建轮播项

#### POST `/api/carousel`

创建新的轮播项。

**请求体：**

```json
{
  "title": "新的轮播标题",
  "description": "新的轮播描述内容",
  "backgroundColor": "linear-gradient(135deg, #8e44ad 0%, #9b59b6 50%, #e74c3c 100%)",
  "backgroundImage": "https://example.com/new-banner.jpg",
  "link": "https://example.com/new-feature",
  "isActive": true,
  "displayOrder": 3,
  "metadata": {
    "author": "admin",
    "category": "feature",
    "tags": ["new", "feature"]
  }
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "4",
    "title": "新的轮播标题",
    "description": "新的轮播描述内容",
    "backgroundColor": "linear-gradient(135deg, #8e44ad 0%, #9b59b6 50%, #e74c3c 100%)",
    "backgroundImage": "https://example.com/new-banner.jpg",
    "link": "https://example.com/new-feature",
    "isActive": true,
    "displayOrder": 3,
    "createdAt": "2024-12-17T10:30:00Z",
    "updatedAt": "2024-12-17T10:30:00Z",
    "metadata": {
      "author": "admin",
      "category": "feature",
      "tags": ["new", "feature"]
    }
  },
  "message": "轮播项创建成功"
}
```

### 4. 更新轮播项

#### PUT `/api/carousel/{id}`

更新指定ID的轮播项信息。

**路径参数：**

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `id` | string | 是 | 轮播项唯一标识 |

**请求体：**

```json
{
  "title": "更新的轮播标题",
  "description": "更新的描述内容",
  "backgroundColor": "linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #a93226 100%)",
  "isActive": false,
  "displayOrder": 2
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "4",
    "title": "更新的轮播标题",
    "description": "更新的描述内容",
    "backgroundColor": "linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #a93226 100%)",
    "isActive": false,
    "displayOrder": 2,
    "createdAt": "2024-12-17T10:30:00Z",
    "updatedAt": "2024-12-17T10:35:00Z"
  },
  "message": "轮播项更新成功"
}
```

### 5. 删除轮播项

#### DELETE `/api/carousel/{id}`

删除指定ID的轮播项。

**路径参数：**

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `id` | string | 是 | 轮播项唯一标识 |

**响应示例：**

```json
{
  "success": true,
  "message": "轮播项删除成功"
}
```

### 6. 批量更新顺序

#### PUT `/api/carousel/reorder`

批量更新多个轮播项的显示顺序。

**请求体：**

```json
{
  "orders": [
    {
      "id": "1",
      "displayOrder": 1
    },
    {
      "id": "2",
      "displayOrder": 3
    },
    {
      "id": "3",
      "displayOrder": 2
    }
  ]
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "轮播顺序更新成功",
  "data": {
    "updatedCount": 3
  }
}
```

### 7. 批量操作

#### POST `/api/carousel/batch`

批量操作多个轮播项（启用/禁用/删除）。

**请求体：**

```json
{
  "action": "enable",           // 操作类型：enable/disable/delete
  "ids": ["1", "2", "3"]        // 轮播项ID数组
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "processedCount": 3,
    "failedIds": []
  },
  "message": "批量操作执行成功"
}
```

### 8. 获取启用的轮播列表

#### GET `/api/carousel/active`

获取所有启用的轮播项，用于前端展示。

**请求参数：**

| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `limit` | integer | 否 | - | 限制返回数量 |
| `random` | boolean | 否 | false | 是否随机排序 |

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "欢迎使用",
      "description": "现代化的Android设备管理工具",
      "backgroundColor": "linear-gradient(135deg, #0078d4 0%, #106ebe 50%, #005a9e 100%)",
      "link": "https://example.com/welcome"
    },
    {
      "id": "2",
      "title": "强大的设备管理",
      "description": "实时设备检测、详细信息展示",
      "backgroundColor(135deg,": "linear-gradient #16a085 0%, #27ae60 50%, #2ecc71 100%)",
      "link": "https://example.com/devices"
    }
  ]
}
```

---

## 🚨 错误处理

### HTTP 状态码说明

| 状态码 | 说明 | 场景 |
|--------|------|------|
| `200` | OK | 请求成功 |
| `201` | Created | 资源创建成功 |
| `400` | Bad Request | 请求参数错误 |
| `401` | Unauthorized | 未认证或认证失败 |
| `403` | Forbidden | 权限不足 |
| `404` | Not Found | 资源不存在 |
| `409` | Conflict | 资源冲突（如重复ID） |
| `422` | Unprocessable Entity | 数据验证失败 |
| `429` | Too Many Requests | 请求频率限制 |
| `500` | Internal Server Error | 服务器内部错误 |

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": "title字段是必需的，backgroundColor字段格式不正确"
  },
  "message": "请求参数验证失败"
}
```

### 常见错误代码

| 错误代码 | 说明 | 解决方案 |
|----------|------|----------|
| `VALIDATION_ERROR` | 请求参数验证失败 | 检查请求体格式和必填字段 |
| `UNAUTHORIZED` | 认证失败 | 检查API Key是否正确 |
| `FORBIDDEN` | 权限不足 | 联系管理员获取相应权限 |
| `NOT_FOUND` | 资源不存在 | 检查资源ID是否正确 |
| `DUPLICATE_ORDER` | 显示顺序重复 | 调整displayOrder值确保唯一性 |
| `RATE_LIMIT_EXCEEDED` | 请求频率超限 | 降低请求频率 |

---

## 💻 代码示例

### JavaScript/TypeScript

```typescript
// 获取轮播列表
async function getCarouselList() {
  const response = await fetch('/api/carousel?page=1&limit=10', {
    headers: {
      'X-API-Key': 'your-api-key',
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.message);
  }
}

// 创建轮播项
async function createCarouselItem(item: Partial<CarouselSlide>) {
  const response = await fetch('/api/carousel', {
    method: 'POST',
    headers: {
      'X-API-Key': 'your-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  });
  
  const result = await response.json();
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.message);
  }
}
```

### cURL

```bash
# 获取轮播列表
curl -X GET "https://api-g.lacs.cc/api/carousel?page=1&limit=10" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json"

# 创建轮播项
curl -X POST "https://api-g.lacs.cc/api/carousel" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新的轮播标题",
    "description": "新的轮播描述内容",
    "backgroundColor": "linear-gradient(135deg, #8e44ad 0%, #9b59b6 50%, #e74c3c 100%)",
    "isActive": true,
    "displayOrder": 3
  }'

# 更新轮播项
curl -X PUT "https://api-g.lacs.cc/api/carousel/1" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新的标题",
    "isActive": false
  }'

# 删除轮播项
curl -X DELETE "https://api-g.lacs.cc/api/carousel/1" \
  -H "X-API-Key: your-api-key"

# 批量更新顺序
curl -X PUT "https://api-g.lacs.cc/api/carousel/reorder" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "orders": [
      {"id": "1", "displayOrder": 1},
      {"id": "2", "displayOrder": 2}
    ]
  }'

# 获取启用的轮播列表
curl -X GET "https://api-g.lacs.cc/api/carousel/active" \
  -H "X-API-Key: your-api-key"
```

---

## 📋 验证规则

### 字段验证规则

| 字段名 | 类型 | 必需 | 验证规则 | 说明 |
|--------|------|------|----------|------|
| `title` | string | 是 | 1-100字符，不能为空 | 轮播项标题 |
| `description` | string | 是 | 1-500字符，不能为空 | 轮播项描述 |
| `backgroundColor` | string | 是 | 有效的CSS颜色值或渐变 | 背景颜色 |
| `backgroundImage` | string | 否 | 有效的URL格式 | 背景图片URL |
| `link` | string | 否 | 有效的URL格式 | 跳转链接 |
| `isActive` | boolean | 是 | 布尔值 | 是否启用 |
| `displayOrder` | integer | 是 | 正整数，范围1-999 | 显示顺序 |
| `metadata` | object | 否 | JSON对象 | 元数据 |

### 业务规则

1. **显示顺序唯一性**：同一时间不允许存在两个轮播项具有相同的`displayOrder`
2. **标题唯一性**：同一分类下标题应该唯一（可选业务规则）
3. **激活状态**：至少需要有一个启用的轮播项
4. **删除限制**：不能删除最后一个启用的轮播项

---

## 🔒 安全考虑

### 认证与授权

- 所有管理操作（创建、更新、删除）都需要有效的API Key
- 不同API Key可能具有不同的权限级别
- 公开查询接口（获取启用的轮播列表）可以无需认证

### 数据验证

- 所有输入数据都需要严格的格式验证
- 防止SQL注入和XSS攻击
- 限制请求频率防止API滥用

### 数据保护

- 敏感操作需要额外的权限验证
- 所有操作都应该有日志记录
- 定期备份轮播数据

---

## 📈 性能优化

### 缓存策略

- 启用的轮播列表可以缓存5分钟
- 单个轮播项详情可以缓存10分钟
- 使用ETag进行缓存验证

### 分页查询

- 默认每页10条记录
- 最大支持100条记录每页
- 提供总数统计信息

### 批量操作

- 支持批量更新顺序减少API调用
- 批量操作可以提高处理效率

---

## 🔄 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0.0 | 2024-12-17 | 初始版本，包含完整的轮播管理API |

---

## 📞 技术支持

如有技术问题，请联系开发团队：

- 邮箱：api-support@example.com
- 文档更新：定期检查API文档版本
- 反馈建议：欢迎提供改进建议

---

*本文档最后更新时间：2024年12月17日*