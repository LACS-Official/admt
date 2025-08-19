# 📡 LACS API Server 使用指南

> 🚀 完整的API集成指南，从入门到精通

## 🎯 快速导航

| 章节 | 内容 | 适用场景 |
|------|------|----------|
| [🚀 快速开始](#-快速开始) | 5分钟上手指南 | 新手入门 |
| [🔐 认证方式](#-认证方式) | API Key认证 | 安全集成 |
| [🔑 激活码管理](#-激活码管理api) | 激活码相关API | 许可证管理 |
| [📦 软件管理](#-软件管理api) | 软件信息管理API | 软件发布 |
| [📊 访问量统计](#-访问量统计功能说明) | 访问量统计和排行榜 | 数据分析 |
| [🔧 管理员功能](#-管理员访问量管理api) | 访问量管理和重置 | 系统管理 |
| [📊 用户行为统计](#-用户行为统计api) | 使用统计API | 数据分析 |
| [🌐 网站管理](#-网站管理api) | 网站管理API | 多站点管理 |
| [🎨 轮播图管理](#-轮播图管理api) | 轮播图管理API | 内容展示 |
| [📢 网站公告管理](#-网站公告管理api) | 网站公告管理API | 内容发布 |
| [💰 捐赠人员管理](#-捐赠人员管理api) | 捐赠人员管理API | 用户管理 |
| [🔧 管理员仪表板](#-管理员仪表板api) | 仪表板统计API | 系统监控 |
| [🚨 错误处理](#-错误处理) | 状态码和错误处理 | 异常处理 |
| [💻 代码示例](#-代码示例) | 多语言集成示例 | 实际开发 |

## 🚀 快速开始

### 📋 基础信息

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

### ⚡ 5分钟快速测试

```bash
# 1. 健康检查
curl https://your-domain.com/api/health

# 2. 生成激活码
curl -X POST "https://your-domain.com/api/activation-codes" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"expirationDays": 30}'

# 3. 获取软件列表
curl "https://your-domain.com/app/software" \
  -H "X-API-Key: your-api-key"

# 4. 获取软件详情（会自动增加访问量）
curl "https://your-domain.com/app/software/id/1" \
  -H "X-API-Key: your-api-key"

# 5. 获取访问量排行榜
curl "https://your-domain.com/app/software/ranking?limit=5" \
  -H "X-API-Key: your-api-key"

# 6. 获取统计信息
curl "https://your-domain.com/api/user-behavior/stats" \
  -H "X-API-Key: your-api-key"

# 7. 网站管理 - 获取网站列表
curl "https://your-domain.com/api/websites" \
  -H "X-API-Key: your-api-key"

# 8. 网站管理 - 创建新网站
curl -X POST "https://your-domain.com/api/websites" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "测试网站", "domain": "test.example.com"}'

# 9. 轮播图管理 - 获取轮播图列表
curl "https://your-domain.com/api/websites/1/banners" \
  -H "X-API-Key: your-api-key"

# 10. 公告管理 - 获取公告列表
curl "https://your-domain.com/api/websites/1/announcements" \
  -H "X-API-Key: your-api-key"

# 11. 捐赠人员 - 获取捐赠列表（公开访问）
curl "https://your-domain.com/api/donors"

# 12. 管理员仪表板 - 获取统计数据
curl "https://your-domain.com/api/admin/dashboard/stats" \
  -H "X-API-Key: your-admin-api-key"
```

## 🔐 认证方式

### 双重认证支持

激活码管理API支持两种认证方式：

#### 1. JWT Token 认证（推荐）

通过GitHub OAuth登录后获取的JWT Token，适用于前端管理界面：

```http
Authorization: Bearer your-jwt-token
```

**获取方式**：
1. 访问 `/admin` 页面
2. 通过GitHub OAuth登录
3. JWT Token自动存储在Cookie中
4. 前端自动在请求头中包含Token

#### 2. API Key 认证（传统方式）

适用于服务器端API调用：

```http
X-API-Key: your-api-key-here
```

**示例**:
```bash
# 使用API Key
curl -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     https://your-domain.com/api/activation-codes

# 使用JWT Token
curl -H "Authorization: Bearer your-jwt-token" \
     -H "Content-Type: application/json" \
     https://your-domain.com/api/activation-codes
```

### 认证优先级

1. **JWT Token优先**：首先检查Authorization头中的Bearer Token
2. **API Key备用**：如果JWT认证失败，检查X-API-Key头
3. **权限验证**：JWT Token需要验证GitHub用户的管理员权限

### 响应格式

**成功响应**:
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2025-08-01T00:00:00.000Z"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "错误类型",
  "message": "详细错误信息",
  "code": 400,
  "timestamp": "2025-08-01T00:00:00.000Z"
}
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'password'
  })
});

const { token } = await authResponse.json();

// 使用JWT Token
const response = await fetch('/admin/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 🔑 激活码管理API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/activation-codes` | 生成激活码 | JWT Token 或 API Key |
| POST | `/api/activation-codes/verify` | 验证激活码 | 无需认证 |
| GET | `/api/activation-codes` | 查询激活码列表 | JWT Token 或 API Key |
| GET | `/api/activation-codes/{id}` | 获取激活码详情 | JWT Token 或 API Key |
| DELETE | `/api/activation-codes/{id}` | 删除激活码 | JWT Token 或 API Key |
| GET | `/api/activation-codes/stats` | 获取统计信息 | JWT Token 或 API Key |
| POST | `/api/activation-codes/cleanup` | 清理过期激活码 | JWT Token 或 API Key |
| POST | `/api/activation-codes/cleanup-unused` | 清理未使用激活码 | JWT Token 或 API Key |

### 🎲 生成激活码

**端点**：`POST /api/activation-codes`

**请求参数**：
```json
{
  "expirationDays": 365,          // 过期天数（必需）
  "metadata": {                   // 元数据（可选）
    "purpose": "license",
    "features": ["feature1", "feature2"],
    "userId": "user123"
  },
  "productInfo": {                // 产品信息（可选）
    "name": "软件名称",
    "version": "1.0.0",
    "edition": "professional"
  }
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "code": "A1B2C3D4",
    "id": 123,
    "createdAt": "2025-01-29T10:00:00.000Z",
    "expiresAt": "2026-01-29T10:00:00.000Z",
    "isActivated": false,
    "metadata": {
      "purpose": "license",
      "features": ["feature1", "feature2"]
    }
  },
  "message": "激活码生成成功"
}
```

### ✅ 验证激活码

**端点**：`POST /api/activation-codes/verify`

**请求参数**：
```json
{
  "code": "A1B2C3D4"  // 激活码（必需）
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "code": "A1B2C3D4",
    "isValid": true,
    "isActivated": true,
    "activatedAt": "2025-01-29T10:05:00.000Z",
    "expiresAt": "2026-01-29T10:00:00.000Z",
    "metadata": {
      "purpose": "license",
      "features": ["feature1", "feature2"]
    },
    "productInfo": {
      "name": "软件名称",
      "version": "1.0.0"
    }
  },
  "message": "激活码验证成功"
}
```

### 📋 查询激活码列表

**端点**：`GET /api/activation-codes`

**查询参数**：
```bash
?page=1              # 页码（默认：1）
&limit=10            # 每页数量（默认：10，最大：100）
&status=all          # 状态筛选：all|active|expired|used
&search=A1B2C3     # 搜索关键词
&sortBy=createdAt    # 排序字段：createdAt|expiresAt|activatedAt
&sortOrder=desc      # 排序方向：asc|desc
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "code": "A1B2C3D4",
      "createdAt": "2025-01-29T10:00:00.000Z",
      "expiresAt": "2026-01-29T10:00:00.000Z",
      "isActivated": true,
      "activatedAt": "2025-01-29T10:05:00.000Z",
      "metadata": {
        "purpose": "license"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 📊 获取统计信息

**端点**：`GET /api/activation-codes/stats`

**响应示例**：
```json
{
  "success": true,
  "data": {
    "total": 1000,
    "active": 750,
    "expired": 200,
    "used": 600,
    "unused": 400,
    "recentlyCreated": 50,
    "recentlyActivated": 30,
    "expiringThisWeek": 25,
    "activationRate": 60.0,
    "dailyStats": [
      {
        "date": "2025-01-29",
        "created": 10,
        "activated": 8
      }
    ]
  }
}
```

## 📦 软件管理API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/app/software` | 获取软件列表 | API Key |
| GET | `/app/software/tags` | 获取所有可用标签 | API Key |
| POST | `/app/software` | 添加新软件 | API Key |
| GET | `/app/software/id/{id}` | 获取软件详情（含访问量统计） | API Key |
| GET | `/app/software/{name}` | 根据名称获取软件 | API Key |
| GET | `/app/software/ranking` | 获取访问量排行榜 | API Key |
| PUT | `/app/software/id/{id}` | 更新软件信息 | API Key |
| DELETE | `/app/software/id/{id}` | 删除软件 | API Key |

#### 🔧 管理员专用接口

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/admin/software/view-count` | 获取访问量统计数据 | API Key |
| POST | `/admin/software/view-count` | 重置软件访问量 | API Key |

### 📋 获取软件列表

**端点**：`GET /app/software`

**查询参数**：
```bash
?page=1              # 页码
&limit=10            # 每页数量
&category=tools      # 分类筛选
&tags=utility,productivity  # 标签筛选（多个标签用逗号分隔）
&search=软件名       # 搜索关键词
&sortBy=name         # 排序字段
&sortOrder=asc       # 排序方向
```

**标签筛选说明**：
- 支持单个标签：`?tags=utility`
- 支持多个标签：`?tags=utility,productivity,tools`
- 多个标签使用OR逻辑：软件包含任意一个标签即可匹配
- 标签名称区分大小写
- 自动去除空格和空标签

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "示例软件",
      "nameEn": "Example Software",
      "description": "这是一个示例软件",
      "descriptionEn": "This is an example software",
      "currentVersion": "1.0.0",
      "category": "tools",
      "tags": ["utility", "productivity"],
      "officialWebsite": "https://example.com",
      "openname": "main.exe",
      "filetype": "zip",
      "createdAt": "2025-01-29T10:00:00.000Z",
      "updatedAt": "2025-01-29T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### 🏷️ 根据标签获取软件

**端点**：`GET /app/software?tags=tag1,tag2`

**使用示例**：
```bash
# 获取包含"utility"标签的软件
curl "https://your-domain.com/app/software?tags=utility" \
  -H "X-API-Key: your-api-key"

# 获取包含多个标签的软件（OR逻辑）
curl "https://your-domain.com/app/software?tags=utility,productivity,tools" \
  -H "X-API-Key: your-api-key"

# 结合其他筛选条件
curl "https://your-domain.com/app/software?tags=utility&category=tools&page=1&limit=10" \
  -H "X-API-Key: your-api-key"
```

**JavaScript示例**：
```javascript
// 获取包含特定标签的软件
const utilitySoftware = await api.getSoftwareList({ tags: 'utility' });

// 获取包含多个标签的软件
const productivitySoftware = await api.getSoftwareList({
  tags: 'utility,productivity,tools'
});

// 结合分类和标签筛选
const filteredSoftware = await api.getSoftwareList({
  category: 'tools',
  tags: 'utility,productivity',
  page: 1,
  limit: 20
});
```

**Python示例**：
```python
# 获取包含特定标签的软件
utility_software = api.get_software_list(tags='utility')

# 获取包含多个标签的软件
productivity_software = api.get_software_list(tags='utility,productivity,tools')

# 结合其他筛选条件
filtered_software = api.get_software_list(
    category='tools',
    tags='utility,productivity',
    page=1,
    limit=20
)
```

### 🏷️ 获取所有可用标签

**端点**：`GET /app/software/tags`

**查询参数**：
```bash
?includeCount=true   # 是否包含标签使用次数
&minCount=1          # 最小使用次数筛选
&sortBy=name         # 排序字段：name|count
&sortOrder=asc       # 排序方向：asc|desc
```

**响应示例（不包含计数）**：
```json
{
  "success": true,
  "data": {
    "tags": [
      "utility",
      "productivity",
      "tools",
      "development",
      "design"
    ],
    "total": 5
  }
}
```

**响应示例（包含计数）**：
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "name": "utility",
        "count": 15
      },
      {
        "name": "productivity",
        "count": 12
      },
      {
        "name": "tools",
        "count": 8
      }
    ],
    "total": 3,
    "totalSoftware": 50
  }
}
```

**使用示例**：
```bash
# 获取所有标签
curl "https://your-domain.com/app/software/tags" \
  -H "X-API-Key: your-api-key"

# 获取标签及使用次数，按使用次数降序排列
curl "https://your-domain.com/app/software/tags?includeCount=true&sortBy=count&sortOrder=desc" \
  -H "X-API-Key: your-api-key"

# 只获取使用次数>=5的标签
curl "https://your-domain.com/app/software/tags?includeCount=true&minCount=5" \
  -H "X-API-Key: your-api-key"
```

### ➕ 添加新软件

**端点**：`POST /app/software`

**请求参数**：
```json
{
  "name": "新软件",                    // 软件名称（必需）
  "nameEn": "New Software",           // 英文名称（可选）
  "description": "软件描述",           // 描述（必需）
  "descriptionEn": "Software description", // 英文描述（可选）
  "currentVersion": "1.0.0",          // 当前版本（必需）
  "category": "tools",                // 分类（可选）
  "tags": ["utility", "productivity"], // 标签（可选）
  "officialWebsite": "https://example.com", // 官网（可选）
  "openname": "bypass/bypass.cmd",    // 启动文件名或命令（可选）
  "filetype": "7z",                   // 文件格式类型（可选）
  "metadata": {                       // 元数据（可选）
    "developer": "开发者名称",
    "license": "MIT",
    "platform": ["Windows", "macOS", "Linux"]
  }
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "新软件",
    "nameEn": "New Software",
    "description": "软件描述",
    "currentVersion": "1.0.0",
    "category": "tools",
    "createdAt": "2025-01-29T10:00:00.000Z"
  },
  "message": "软件添加成功"
}
```

### 🔍 获取软件详情

**端点**：`GET /app/software/id/{id}` 或 `GET /app/software/{name}`

**新增字段说明**：
- `openname`（字符串，可选）：软件的启动文件名或命令，用于指导用户如何启动软件
  - 示例：`"bypass/bypass.cmd"`、`"main.exe"`、`"start.sh"`
- `filetype`（字符串，可选）：软件包的文件格式类型，帮助用户了解下载文件的格式
  - 示例：`"7z"`、`"zip"`、`"apk"`、`"exe"`、`"dmg"`
- `viewCount`（整数，必需）：软件的访问量统计，记录软件详情页面的访问次数
  - 每次访问软件详情接口时自动递增
  - 用于统计软件的受欢迎程度和使用情况

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "示例软件",
    "nameEn": "Example Software",
    "description": "详细的软件描述",
    "currentVersionId": 2,
    "latestDownloadUrl": "https://example.com/download/example-software-v1.2.0.exe",
    "currentVersion": "1.2.0",
    "category": "tools",
    "tags": ["utility", "productivity"],
    "officialWebsite": "https://example.com",
    "systemRequirements": {
      "os": ["Windows", "macOS"],
      "memory": "4GB",
      "storage": "100MB"
    },
    "openname": "bypass/bypass.cmd",
    "filetype": "7z",
    "viewCount": 1250,
    "metadata": {
      "developer": "开发者名称",
      "license": "MIT"
    },
    "createdAt": "2025-01-29T10:00:00.000Z",
    "updatedAt": "2025-01-29T12:00:00.000Z"
  },
    "versions": [
      {
        "id": 1,
        "version": "1.2.0",
        "releaseDate": "2025-01-29T12:00:00.000Z",
        "isStable": true
      }
    ],
    "announcements": [
      {
        "id": 1,
        "title": "版本更新通知",
        "type": "update",
        "priority": "normal",
        "publishedAt": "2025-01-29T12:00:00.000Z"
      }
    ]
  }
}
```

### 🆕 版本相关字段说明

从 v2.1.0 开始，所有软件相关的API响应都包含版本相关字段：

**currentVersionId 字段**：
- **类型**: `number | null`
- **含义**: 指向版本历史表中最新稳定版本的ID
- **选择逻辑**:
  1. 筛选稳定版本 (`isStable: true`)
  2. 按发布日期降序排序
  3. 按版本号语义化排序
  4. 返回最新版本的ID

**latestDownloadUrl 字段**：
- **类型**: `string | null`
- **含义**: 最新稳定版本的下载链接
- **选择逻辑**:
  1. 从最新稳定版本的 `downloadLinks` 中选择
  2. 优先级：official > quark > pan123 > baidu > thunder > backup[0]
  3. 如果没有可用链接则返回 `null`

**使用示例**：
```javascript
// 获取软件信息
const software = await fetch('/app/software/id/1')
const data = await software.json()

// 直接使用 latestDownloadUrl（推荐方式）
if (data.data.latestDownloadUrl) {
  console.log('最新版本下载链接:', data.data.latestDownloadUrl)
  // 可以直接用于下载按钮或链接
  window.open(data.data.latestDownloadUrl)
}

// 或者使用 currentVersionId 获取完整版本详情
if (data.data.currentVersionId) {
  const versions = await fetch('/app/software/id/1/versions')
  const versionData = await versions.json()

  const currentVersion = versionData.data.find(
    v => v.id === data.data.currentVersionId
  )

  console.log('完整下载链接信息:', currentVersion.downloadLinks)
}
```

## 📊 访问量统计功能说明

### 🔄 自动访问量统计机制

访问量统计功能会在每次调用 `GET /app/software/id/{id}` 接口时自动触发：

1. **自动递增**：每次成功访问软件详情页面，对应软件的 `viewCount` 字段会自动递增 1
2. **原子性操作**：使用数据库原子性操作确保并发访问时的数据一致性
3. **容错设计**：即使访问量更新失败，也不会影响软件详情的正常返回
4. **实时更新**：访问量统计实时生效，立即反映在后续的API响应中

### 🛡️ 防刷机制

为防止恶意刷访问量，系统实施了多层防护机制：

#### 频率限制
- **时间窗口**：1分钟
- **最大请求数**：同一IP对同一软件最多访问10次
- **封禁时长**：超限后自动封禁15分钟

#### 异常检测
- **规律性检测**：识别过于规律的访问模式（疑似机器人）
- **短时间大量访问**：检测30秒内超过5次的异常访问
- **智能处理**：异常访问不增加访问量但仍返回软件信息

#### 错误响应
当触发防刷机制时，API会返回 `429 Too Many Requests` 状态码：
```json
{
  "success": false,
  "error": "访问频率过高",
  "retryAfter": 900
}
```

### 🏆 获取访问量排行榜

**端点**：`GET /app/software/ranking`

**查询参数**：
```bash
?page=1              # 页码（默认：1）
&limit=10            # 每页数量（默认：10，最大：100）
&category=tools      # 分类筛选（可选）
&tags=utility        # 标签筛选（可选）
&minViewCount=100    # 最小访问量筛选（可选）
&timeRange=all       # 时间范围：all|today|week|month|year（可选）
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "玩机管家",
      "nameEn": "Mobile Manager",
      "description": "专业的手机管理工具",
      "currentVersion": "1.0.0",
      "category": "tools",
      "tags": ["utility", "mobile"],
      "viewCount": 1250,
      "rank": 1,
      "officialWebsite": "https://example.com",
      "createdAt": "2025-01-29T10:00:00.000Z",
      "updatedAt": "2025-08-15T07:03:23.833Z"
    },
    {
      "id": 2,
      "name": "示例软件",
      "nameEn": "Example Software",
      "description": "另一个示例软件",
      "currentVersion": "2.0.0",
      "category": "productivity",
      "tags": ["productivity", "office"],
      "viewCount": 980,
      "rank": 2,
      "officialWebsite": "https://example2.com",
      "createdAt": "2025-01-28T10:00:00.000Z",
      "updatedAt": "2025-08-14T15:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "summary": {
    "totalSoftware": 50,
    "totalViews": 25000,
    "averageViews": 500
  }
}
```

**使用示例**：
```bash
# 获取访问量前10的软件
curl "https://your-domain.com/app/software/ranking?limit=10" \
  -H "X-API-Key: your-api-key"

# 获取特定分类的访问量排行榜
curl "https://your-domain.com/app/software/ranking?category=tools&limit=20" \
  -H "X-API-Key: your-api-key"

# 获取访问量超过100的软件排行榜
curl "https://your-domain.com/app/software/ranking?minViewCount=100" \
  -H "X-API-Key: your-api-key"
```

## � 管理员访问量管理API

### 📊 获取访问量统计数据

**端点**：`GET /admin/software/view-count`

**权限要求**：管理员API Key

**查询参数**：
```bash
?format=json             # 返回格式：json|csv（默认：json）
&startDate=2025-01-01    # 开始日期（可选）
&endDate=2025-01-31      # 结束日期（可选）
&minViewCount=100        # 最小访问量筛选（可选）
&maxViewCount=1000       # 最大访问量筛选（可选）
```

**响应示例（JSON格式）**：
```json
{
  "success": true,
  "data": {
    "statistics": [
      {
        "id": 1,
        "name": "玩机管家",
        "nameEn": "Mobile Manager",
        "category": "tools",
        "viewCount": 1250,
        "createdAt": "2025-01-29T10:00:00.000Z",
        "updatedAt": "2025-08-15T07:03:23.833Z"
      },
      {
        "id": 2,
        "name": "示例软件",
        "nameEn": "Example Software",
        "category": "productivity",
        "viewCount": 980,
        "createdAt": "2025-01-28T10:00:00.000Z",
        "updatedAt": "2025-08-14T15:30:00.000Z"
      }
    ],
    "summary": {
      "totalSoftware": 50,
      "totalViews": 25000,
      "averageViews": 500,
      "maxViews": 1250,
      "minViews": 10
    },
    "metadata": {
      "queryParams": {
        "format": "json",
        "startDate": null,
        "endDate": null,
        "minViewCount": null,
        "maxViewCount": null
      },
      "generatedAt": "2025-08-15T10:00:00.000Z"
    }
  }
}
```

**CSV导出示例**：
```bash
# 导出CSV格式的访问量统计
curl "https://your-domain.com/admin/software/view-count?format=csv" \
  -H "X-API-Key: your-admin-api-key" \
  -o software-view-stats.csv
```

### 🔄 重置软件访问量

**端点**：`POST /admin/software/view-count`

**权限要求**：管理员API Key

**请求体参数**：
```json
{
  "action": "reset",           // 操作类型（必需）
  "softwareId": "1",          // 软件ID（可选，不提供则重置所有）
  "newValue": 0               // 新的访问量值（可选，默认为0）
}
```

**响应示例（重置单个软件）**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "玩机管家",
    "oldViewCount": "unknown",
    "newViewCount": 0
  },
  "message": "软件 \"玩机管家\" 的访问量已重置为 0"
}
```

**响应示例（重置所有软件）**：
```json
{
  "success": true,
  "data": {
    "affectedCount": 50,
    "newViewCount": 0
  },
  "message": "已重置所有软件的访问量为 0"
}
```

**使用示例**：
```bash
# 重置特定软件的访问量
curl -X POST "https://your-domain.com/admin/software/view-count" \
  -H "X-API-Key: your-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reset",
    "softwareId": "1",
    "newValue": 0
  }'

# 重置所有软件的访问量
curl -X POST "https://your-domain.com/admin/software/view-count" \
  -H "X-API-Key: your-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reset",
    "newValue": 0
  }'
```

## �📝 版本管理API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/app/software/id/{id}/versions` | 获取版本历史 | API Key |
| POST | `/app/software/id/{id}/versions` | 添加新版本 | API Key |
| GET | `/app/software/id/{id}/versions/{versionId}` | 获取版本详情 | API Key |
| PUT | `/app/software/id/{id}/versions/{versionId}` | 更新版本信息 | API Key |
| DELETE | `/app/software/id/{id}/versions/{versionId}` | 删除版本 | API Key |

### 📋 获取版本历史

**端点**：`GET /app/software/id/{id}/versions`

**查询参数**：
```bash
?page=1              # 页码
&limit=10            # 每页数量
&versionType=all     # 版本类型：all|release|beta|alpha
&isStable=true       # 是否稳定版
&sortBy=releaseDate  # 排序字段
&sortOrder=desc      # 排序方向
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "software": {
      "id": 1,
      "name": "示例软件",
      "currentVersion": "1.2.0"
    },
    "versions": [
      {
        "id": 1,
        "version": "1.2.0",
        "releaseNotes": "修复了一些bug，增加了新功能",
        "releaseNotesEn": "Fixed bugs and added new features",
        "releaseDate": "2025-01-29T12:00:00.000Z",
        "downloadLinks": {
          "official": "https://download.com/v1.2.0.zip",
          "quark": "https://pan.quark.cn/file",
          "baidu": "https://pan.baidu.com/file"
        },
        "fileSize": "150MB",
        "isStable": true,
        "versionType": "release",
        "metadata": {
          "buildNumber": "1200",
          "commitHash": "abc123"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### ➕ 添加新版本

**端点**：`POST /app/software/id/{id}/versions`

**请求参数**：
```json
{
  "version": "1.3.0",                 // 版本号（必需）
  "releaseNotes": "更新内容",         // 更新说明（必需）
  "releaseNotesEn": "Release notes",  // 英文更新说明（可选）
  "releaseDate": "2025-01-30T10:00:00.000Z", // 发布时间（可选，默认当前时间）
  "downloadLinks": {                  // 下载链接（可选）
    "official": "https://download.com/v1.3.0.zip",
    "quark": "https://pan.quark.cn/file",
    "baidu": "https://pan.baidu.com/file",
    "github": "https://github.com/user/repo/releases/tag/v1.3.0"
  },
  "fileSize": "160MB",                // 文件大小（可选）
  "isStable": true,                   // 是否稳定版（默认：true）
  "versionType": "release",           // 版本类型（默认：release）
  "metadata": {                       // 元数据（可选）
    "buildNumber": "1300",
    "commitHash": "def456",
    "changelog": ["新增功能A", "修复bug B"]
  }
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 2,
    "version": "1.3.0",
    "releaseNotes": "更新内容",
    "releaseDate": "2025-01-30T10:00:00.000Z",
    "downloadLinks": {
      "official": "https://download.com/v1.3.0.zip"
    },
    "isStable": true,
    "versionType": "release"
  },
  "message": "版本添加成功"
}
```

## 📢 公告管理API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/app/software/id/{id}/announcements` | 获取公告列表 | API Key |
| POST | `/app/software/id/{id}/announcements` | 添加新公告 | API Key |
| GET | `/app/software/id/{id}/announcements/{announcementId}` | 获取公告详情 | API Key |
| PUT | `/app/software/id/{id}/announcements/{announcementId}` | 更新公告 | API Key |
| DELETE | `/app/software/id/{id}/announcements/{announcementId}` | 删除公告 | API Key |

### 📋 获取公告列表

**端点**：`GET /app/software/id/{id}/announcements`

**查询参数**：
```bash
?page=1              # 页码
&limit=10            # 每页数量
&type=all            # 公告类型：all|general|update|security|maintenance
&priority=all        # 优先级：all|low|normal|high|urgent
&isPublished=true    # 是否已发布
&sortBy=publishedAt  # 排序字段
&sortOrder=desc      # 排序方向
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "software": {
      "id": 1,
      "name": "示例软件"
    },
    "announcements": [
      {
        "id": 1,
        "title": "重要更新通知",
        "titleEn": "Important Update Notice",
        "content": "我们发布了新版本，包含重要的安全修复...",
        "contentEn": "We have released a new version with important security fixes...",
        "type": "update",
        "priority": "high",
        "version": "1.3.0",
        "isPublished": true,
        "publishedAt": "2025-01-29T10:00:00.000Z",
        "expiresAt": "2025-02-28T23:59:59.000Z",
        "metadata": {
          "author": "管理员",
          "tags": ["security", "update"]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

### ➕ 添加新公告

**端点**：`POST /app/software/id/{id}/announcements`

**请求参数**：
```json
{
  "title": "公告标题",               // 标题（必需）
  "titleEn": "Announcement Title", // 英文标题（可选）
  "content": "公告内容详情...",      // 内容（必需）
  "contentEn": "Announcement content...", // 英文内容（可选）
  "type": "update",                // 类型（默认：general）
  "priority": "high",              // 优先级（默认：normal）
  "version": "1.3.0",              // 关联版本（可选）
  "isPublished": true,             // 是否发布（默认：true）
  "publishedAt": "2025-01-29T10:00:00.000Z", // 发布时间（可选）
  "expiresAt": "2025-02-28T23:59:59.000Z",   // 过期时间（可选）
  "metadata": {                    // 元数据（可选）
    "author": "管理员",
    "tags": ["important", "update"],
    "targetAudience": "all"
  }
}
```

**公告类型说明**：
- `general`: 一般公告
- `update`: 更新通知
- `security`: 安全公告
- `maintenance`: 维护通知
- `feature`: 功能介绍
- `bugfix`: 修复通知

**优先级说明**：
- `low`: 低优先级
- `normal`: 普通优先级
- `high`: 高优先级
- `urgent`: 紧急优先级

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "公告标题",
    "content": "公告内容详情...",
    "type": "update",
    "priority": "high",
    "isPublished": true,
    "publishedAt": "2025-01-29T10:00:00.000Z"
  },
  "message": "公告添加成功"
}
```

## � 用户行为统计API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/user-behavior/stats` | 获取综合统计信息 | API Key |
| POST | `/api/user-behavior/usage` | 记录软件使用 | API Key |
| GET | `/api/user-behavior/usage` | 获取使用统计 | API Key |
| POST | `/api/user-behavior/device-connections` | 记录设备连接 | API Key |
| GET | `/api/user-behavior/device-connections` | 获取设备连接统计 | API Key |

### 📈 获取综合统计

**端点**：`GET /api/user-behavior/stats`

**查询参数**：
```bash
?softwareId=1        # 软件ID（可选，筛选特定软件）
&startDate=2025-01-01 # 开始日期（可选，YYYY-MM-DD格式）
&endDate=2025-01-31   # 结束日期（可选，YYYY-MM-DD格式）
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsage": 1000,
      "uniqueUsedDevices": 800,
      "totalConnections": 1500,
      "uniqueConnectedDevices": 900,
      "averageUsagePerDevice": "1.25",
      "averageConnectionsPerDevice": "1.67"
    },
    "trends": {
      "usageTrend": [
        {"date": "2025-08-01", "count": 50},
        {"date": "2025-08-02", "count": 45}
      ],
      "connectionTrend": [
        {"date": "2025-08-01", "count": 75},
        {"date": "2025-08-02", "count": 68}
      ]
    },
    "brandDistribution": [
      {"brand": "Samsung", "count": 200},
      {"brand": "Xiaomi", "count": 150}
    ],
    "metadata": {
      "queryParams": {
        "softwareId": 1,
        "startDate": "2025-01-01",
        "endDate": "2025-01-31"
      },
      "generatedAt": "2025-08-01T00:00:00.000Z"
    }
  }
}
```

### 📱 记录软件使用

**端点**：`POST /api/user-behavior/usage`

**请求参数**：
```json
{
  "softwareId": 1,                    // 软件ID（必需）
  "softwareName": "玩机管家",          // 软件名称（可选，默认：玩机管家）
  "softwareVersion": "1.0.0",         // 软件版本（可选）
  "deviceFingerprint": "device-123",  // 设备指纹（必需，用于唯一标识设备）
  "used": 1                           // 使用次数增量（必需，每次调用自增1）
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "softwareId": 1,
    "deviceFingerprint": "device-123",
    "usedAt": "2025-08-01T00:00:00.000Z"
  },
  "message": "使用记录成功"
}
```

### 📊 获取使用统计

**端点**：`GET /api/user-behavior/usage`

**查询参数**：
```bash
?softwareId=1        # 软件ID（可选）
&startDate=2025-01-01 # 开始日期（可选）
&endDate=2025-01-31   # 结束日期（可选）
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "totalUsage": 500,
    "uniqueDevices": 400,
    "recentUsage": [
      {
        "id": "uuid-123",
        "softwareName": "玩机管家",
        "softwareVersion": "1.0.0",
        "deviceFingerprint": "device-123",
        "used": 5,
        "usedAt": "2025-08-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "totalUsage": 500,
      "uniqueDevices": 400,
      "averageUsagePerDevice": "1.25"
    }
  }
}
```

### 🔌 记录设备连接

**端点**：`POST /api/user-behavior/device-connections`

**请求参数**：
```json
{
  "deviceSerial": "device-serial-123",     // 设备序列号（必需）
  "softwareId": 1,                         // 软件ID（必需）
  "userDeviceFingerprint": "fingerprint"   // 用户设备指纹（可选）
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "uuid-456",
    "deviceSerial": "device-serial-123",
    "softwareId": 1
  },
  "message": "设备连接记录已保存"
}
```

### 📱 获取设备连接统计

**端点**：`GET /api/user-behavior/device-connections`

**查询参数**：
```bash
?softwareId=1        # 软件ID（可选）
&startDate=2025-01-01 # 开始日期（可选）
&endDate=2025-01-31   # 结束日期（可选）
&page=1              # 页码（默认：1）
&limit=10            # 每页数量（默认：10）
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "totalConnections": 800,
    "uniqueDevices": 600,
    "brandStats": [
      {"brand": "Samsung", "count": 200},
      {"brand": "Xiaomi", "count": 150}
    ],
    "deviceModelStats": [
      {"model": "Galaxy S21", "count": 100},
      {"model": "Mi 11", "count": 80}
    ],
    "recentConnections": [
      {
        "id": "uuid-456",
        "deviceSerial": "device-serial-123",
        "deviceBrand": "Samsung",
        "deviceModel": "Galaxy S21",
        "connectedAt": "2025-08-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "totalConnections": 800,
      "uniqueDevices": 600,
      "averageConnectionsPerDevice": "1.33"
    }
  }
}
```

## 🌐 网站管理API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/websites` | 获取网站列表 | API Key |
| POST | `/api/websites` | 创建新网站 | API Key |
| GET | `/api/websites/{id}` | 获取网站详情 | API Key |
| PUT | `/api/websites/{id}` | 更新网站信息 | API Key |
| DELETE | `/api/websites/{id}` | 删除网站 | API Key |

### 📋 获取网站列表

**端点**：`GET /api/websites`

**查询参数**：
```bash
?page=1              # 页码（默认：1）
&limit=10            # 每页数量（默认：10，最大：100）
&search=关键词       # 搜索关键词（搜索网站名称和域名）
&status=all          # 状态筛选：all|active|inactive
&sortBy=createdAt    # 排序字段：createdAt|updatedAt|name|domain
&sortOrder=desc      # 排序方向：asc|desc
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "主站",
      "domain": "example.com",
      "title": "网站标题",
      "description": "网站描述",
      "logo": "https://example.com/logo.png",
      "favicon": "https://example.com/favicon.ico",
      "isActive": true,
      "isPublic": true,
      "config": {
        "theme": "default",
        "language": "zh-CN",
        "timezone": "Asia/Shanghai"
      },
      "createdAt": "2025-01-29T10:00:00.000Z",
      "updatedAt": "2025-01-29T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### ➕ 创建新网站

**端点**：`POST /api/websites`

**请求参数**：
```json
{
  "name": "新网站",                    // 网站名称（必需）
  "domain": "newsite.com",            // 域名（必需，唯一）
  "title": "网站标题",                // 网站标题（可选）
  "description": "网站描述",          // 网站描述（可选）
  "logo": "https://example.com/logo.png", // Logo URL（可选）
  "favicon": "https://example.com/favicon.ico", // Favicon URL（可选）
  "isActive": true,                   // 是否启用（默认：true）
  "isPublic": true,                   // 是否公开（默认：true）
  "config": {                         // 网站配置（可选）
    "theme": "default",
    "language": "zh-CN",
    "timezone": "Asia/Shanghai",
    "features": ["announcements", "banners"]
  }
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "新网站",
    "domain": "newsite.com",
    "isActive": true,
    "createdAt": "2025-01-29T10:00:00.000Z"
  },
  "message": "网站创建成功"
}
```

### 🔍 获取网站详情

**端点**：`GET /api/websites/{id}`

**响应示例**：
```json
{
  "success": true,
  "data": {
    "website": {
      "id": 1,
      "name": "主站",
      "domain": "example.com",
      "title": "网站标题",
      "description": "网站描述",
      "logo": "https://example.com/logo.png",
      "favicon": "https://example.com/favicon.ico",
      "isActive": true,
      "isPublic": true,
      "config": {
        "theme": "default",
        "language": "zh-CN"
      },
      "createdAt": "2025-01-29T10:00:00.000Z",
      "updatedAt": "2025-01-29T10:00:00.000Z"
    },
    "stats": {
      "bannersCount": 5,
      "announcementsCount": 10
    }
  }
}
```

### ✏️ 更新网站信息

**端点**：`PUT /api/websites/{id}`

**请求参数**：
```json
{
  "name": "更新后的网站名称",          // 网站名称（可选）
  "title": "更新后的标题",            // 网站标题（可选）
  "description": "更新后的描述",      // 网站描述（可选）
  "logo": "https://example.com/new-logo.png", // 新Logo（可选）
  "isActive": false,                  // 是否启用（可选）
  "config": {                         // 配置更新（可选）
    "theme": "dark",
    "language": "en-US"
  }
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "更新后的网站名称",
    "title": "更新后的标题",
    "isActive": false,
    "updatedAt": "2025-01-29T12:00:00.000Z"
  },
  "message": "网站信息更新成功"
}
```

### 🗑️ 删除网站

**端点**：`DELETE /api/websites/{id}`

**响应示例**：
```json
{
  "success": true,
  "message": "网站删除成功"
}
```

## 🎨 轮播图管理API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/websites/{id}/banners` | 获取轮播图列表 | API Key |
| POST | `/api/websites/{id}/banners` | 创建新轮播图 | API Key |
| GET | `/api/websites/{id}/banners/{bannerId}` | 获取轮播图详情 | API Key |
| PUT | `/api/websites/{id}/banners/{bannerId}` | 更新轮播图 | API Key |
| DELETE | `/api/websites/{id}/banners/{bannerId}` | 删除轮播图 | API Key |

### 📋 获取轮播图列表

**端点**：`GET /api/websites/{id}/banners`

**查询参数**：
```bash
?page=1              # 页码（默认：1）
&limit=10            # 每页数量（默认：10）
&isActive=true       # 状态筛选：true|false|all
&isPublished=true    # 发布状态：true|false|all
&sortBy=sortOrder    # 排序字段：sortOrder|createdAt|updatedAt
&sortOrder=asc       # 排序方向：asc|desc
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "website": {
      "id": 1,
      "name": "主站",
      "domain": "example.com"
    },
    "banners": [
      {
        "id": 1,
        "websiteId": 1,
        "title": "欢迎横幅",
        "description": "欢迎来到我们的网站",
        "imageUrl": "https://example.com/banner1.jpg",
        "imageAlt": "欢迎横幅图片",
        "linkUrl": "https://example.com/welcome",
        "linkTarget": "_self",
        "sortOrder": 1,
        "isActive": true,
        "isPublished": true,
        "createdAt": "2025-01-29T10:00:00.000Z",
        "updatedAt": "2025-01-29T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### ➕ 创建新轮播图

**端点**：`POST /api/websites/{id}/banners`

**请求参数**：
```json
{
  "title": "新轮播图",                 // 标题（必需）
  "description": "轮播图描述",         // 描述（可选）
  "imageUrl": "https://example.com/banner.jpg", // 图片URL（必需）
  "imageAlt": "轮播图图片",            // 图片alt文本（可选）
  "linkUrl": "https://example.com/link", // 点击链接（可选）
  "linkTarget": "_blank",             // 链接打开方式（默认：_self）
  "sortOrder": 1,                     // 排序顺序（默认：0）
  "isActive": true,                   // 是否启用（默认：true）
  "isPublished": true                 // 是否发布（默认：true）
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 2,
    "websiteId": 1,
    "title": "新轮播图",
    "imageUrl": "https://example.com/banner.jpg",
    "sortOrder": 1,
    "isActive": true,
    "createdAt": "2025-01-29T10:00:00.000Z"
  },
  "message": "轮播图创建成功"
}
```

### 🔍 获取轮播图详情

**端点**：`GET /api/websites/{id}/banners/{bannerId}`

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "websiteId": 1,
    "title": "欢迎横幅",
    "description": "欢迎来到我们的网站",
    "imageUrl": "https://example.com/banner1.jpg",
    "imageAlt": "欢迎横幅图片",
    "linkUrl": "https://example.com/welcome",
    "linkTarget": "_self",
    "sortOrder": 1,
    "isActive": true,
    "isPublished": true,
    "createdAt": "2025-01-29T10:00:00.000Z",
    "updatedAt": "2025-01-29T10:00:00.000Z"
  }
}
```

### ✏️ 更新轮播图

**端点**：`PUT /api/websites/{id}/banners/{bannerId}`

**请求参数**：
```json
{
  "title": "更新后的标题",             // 标题（可选）
  "description": "更新后的描述",       // 描述（可选）
  "imageUrl": "https://example.com/new-banner.jpg", // 新图片URL（可选）
  "linkUrl": "https://example.com/new-link", // 新链接（可选）
  "sortOrder": 2,                     // 新排序（可选）
  "isActive": false                   // 状态更新（可选）
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "更新后的标题",
    "imageUrl": "https://example.com/new-banner.jpg",
    "sortOrder": 2,
    "isActive": false,
    "updatedAt": "2025-01-29T12:00:00.000Z"
  },
  "message": "轮播图更新成功"
}
```

### 🗑️ 删除轮播图

**端点**：`DELETE /api/websites/{id}/banners/{bannerId}`

**响应示例**：
```json
{
  "success": true,
  "message": "轮播图删除成功"
}
```

## 📢 网站公告管理API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/websites/{id}/announcements` | 获取公告列表 | API Key |
| POST | `/api/websites/{id}/announcements` | 创建新公告 | API Key |
| GET | `/api/websites/{id}/announcements/{announcementId}` | 获取公告详情 | API Key |
| PUT | `/api/websites/{id}/announcements/{announcementId}` | 更新公告 | API Key |
| DELETE | `/api/websites/{id}/announcements/{announcementId}` | 删除公告 | API Key |

### 📋 获取公告列表

**端点**：`GET /api/websites/{id}/announcements`

**查询参数**：
```bash
?page=1              # 页码（默认：1）
&limit=10            # 每页数量（默认：10）
&type=all            # 公告类型：all|info|warning|error|success
&isActive=true       # 状态筛选：true|false|all
&isPublished=true    # 发布状态：true|false|all
&isSticky=all        # 置顶状态：true|false|all
&sortBy=sortOrder    # 排序字段：sortOrder|createdAt|updatedAt
&sortOrder=asc       # 排序方向：asc|desc
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "website": {
      "id": 1,
      "name": "主站",
      "domain": "example.com"
    },
    "announcements": [
      {
        "id": 1,
        "websiteId": 1,
        "title": "重要通知",
        "content": "这是一个重要的系统通知，请所有用户注意...",
        "type": "info",
        "isSticky": true,
        "sortOrder": 1,
        "startDate": "2025-01-29T00:00:00.000Z",
        "endDate": "2025-02-28T23:59:59.000Z",
        "isActive": true,
        "isPublished": true,
        "createdAt": "2025-01-29T10:00:00.000Z",
        "updatedAt": "2025-01-29T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

### ➕ 创建新公告

**端点**：`POST /api/websites/{id}/announcements`

**请求参数**：
```json
{
  "title": "新公告标题",               // 标题（必需）
  "content": "公告内容详情...",        // 内容（必需）
  "type": "info",                     // 类型（默认：info）
  "isSticky": false,                  // 是否置顶（默认：false）
  "sortOrder": 0,                     // 排序顺序（默认：0）
  "startDate": "2025-01-29T00:00:00.000Z", // 开始显示时间（可选）
  "endDate": "2025-02-28T23:59:59.000Z",   // 结束显示时间（可选）
  "isActive": true,                   // 是否启用（默认：true）
  "isPublished": true                 // 是否发布（默认：true）
}
```

**公告类型说明**：
- `info`: 信息通知（蓝色）
- `warning`: 警告通知（黄色）
- `error`: 错误通知（红色）
- `success`: 成功通知（绿色）

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 2,
    "websiteId": 1,
    "title": "新公告标题",
    "content": "公告内容详情...",
    "type": "info",
    "isSticky": false,
    "sortOrder": 0,
    "isActive": true,
    "isPublished": true,
    "createdAt": "2025-01-29T10:00:00.000Z"
  },
  "message": "公告创建成功"
}
```

### 🔍 获取公告详情

**端点**：`GET /api/websites/{id}/announcements/{announcementId}`

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "websiteId": 1,
    "title": "重要通知",
    "content": "这是一个重要的系统通知，请所有用户注意...",
    "type": "info",
    "isSticky": true,
    "sortOrder": 1,
    "startDate": "2025-01-29T00:00:00.000Z",
    "endDate": "2025-02-28T23:59:59.000Z",
    "isActive": true,
    "isPublished": true,
    "createdAt": "2025-01-29T10:00:00.000Z",
    "updatedAt": "2025-01-29T10:00:00.000Z"
  }
}
```

### ✏️ 更新公告

**端点**：`PUT /api/websites/{id}/announcements/{announcementId}`

**请求参数**：
```json
{
  "title": "更新后的标题",             // 标题（可选）
  "content": "更新后的内容",           // 内容（可选）
  "type": "warning",                  // 类型更新（可选）
  "isSticky": true,                   // 置顶状态（可选）
  "sortOrder": 5,                     // 排序更新（可选）
  "endDate": "2025-03-31T23:59:59.000Z", // 结束时间更新（可选）
  "isActive": false                   // 状态更新（可选）
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "更新后的标题",
    "content": "更新后的内容",
    "type": "warning",
    "isSticky": true,
    "sortOrder": 5,
    "isActive": false,
    "updatedAt": "2025-01-29T12:00:00.000Z"
  },
  "message": "公告更新成功"
}
```

### 🗑️ 删除公告

**端点**：`DELETE /api/websites/{id}/announcements/{announcementId}`

**响应示例**：
```json
{
  "success": true,
  "message": "公告删除成功"
}
```

## 💰 捐赠人员管理API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/donors` | 获取捐赠人员列表 | 公开访问（CORS限制） |
| POST | `/api/donors` | 添加新捐赠人员 | API Key |

### 📋 获取捐赠人员列表

**端点**：`GET /api/donors`

**权限说明**：
- 此接口为公开访问，但通过CORS策略限制访问来源
- 允许的来源通过 `ALLOWED_ORIGINS` 环境变量配置
- 不需要API Key认证

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "张三",
      "amount": 100.00,
      "message": "感谢开发者的辛勤工作！",
      "isAnonymous": false,
      "donationDate": "2025-01-29T10:00:00.000Z",
      "createdAt": "2025-01-29T10:00:00.000Z",
      "updatedAt": "2025-01-29T10:00:00.000Z"
    },
    {
      "id": 2,
      "name": "匿名用户",
      "amount": 50.00,
      "message": "支持开源项目！",
      "isAnonymous": true,
      "donationDate": "2025-01-28T15:30:00.000Z",
      "createdAt": "2025-01-28T15:30:00.000Z",
      "updatedAt": "2025-01-28T15:30:00.000Z"
    }
  ]
}
```

### ➕ 添加新捐赠人员

**端点**：`POST /api/donors`

**权限要求**：需要API Key认证

**请求参数**：
```json
{
  "name": "李四",                     // 捐赠人姓名（必需）
  "amount": 200.00,                   // 捐赠金额（必需）
  "message": "希望项目越来越好！",     // 捐赠留言（可选）
  "isAnonymous": false,               // 是否匿名（默认：false）
  "donationDate": "2025-01-29T10:00:00.000Z", // 捐赠日期（可选，默认当前时间）
  "contact": "lisi@example.com",      // 联系方式（可选）
  "platform": "支付宝"                // 捐赠平台（可选）
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "李四",
    "amount": 200.00,
    "message": "希望项目越来越好！",
    "isAnonymous": false,
    "donationDate": "2025-01-29T10:00:00.000Z",
    "createdAt": "2025-01-29T10:00:00.000Z"
  },
  "message": "捐赠人员添加成功"
}
```

**使用示例**：
```bash
# 添加捐赠人员
curl -X POST "https://your-domain.com/api/donors" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "王五",
    "amount": 88.88,
    "message": "感谢开发者！",
    "isAnonymous": false
  }'

# 获取捐赠人员列表（公开访问）
curl "https://your-domain.com/api/donors"
```

## 🔧 管理员仪表板API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/admin/dashboard/stats` | 获取仪表板统计数据 | API Key |
| GET | `/api/admin/dashboard/activities` | 获取最近活动记录 | API Key |

### 📈 获取仪表板统计数据

**端点**：`GET /api/admin/dashboard/stats`

**权限要求**：管理员API Key

**响应示例**：
```json
{
  "success": true,
  "data": {
    "software": {
      "total": 50,
      "active": 45,
      "recent": 5,
      "categories": [
        {
          "category": "tools",
          "count": 20
        },
        {
          "category": "productivity",
          "count": 15
        }
      ]
    },
    "activationCodes": {
      "total": 1000,
      "active": 750,
      "expired": 200,
      "used": 600,
      "unused": 400,
      "recentlyCreated": 50,
      "recentlyActivated": 30,
      "expiringThisWeek": 25,
      "activationRate": 60.0
    },
    "userBehavior": {
      "totalActivations": 1500,
      "recentActivations": 100,
      "uniqueDevices": 800,
      "topCountries": [
        {
          "country": "中国",
          "count": 1200
        }
      ]
    },
    "system": {
      "status": "healthy",
      "checks": {
        "database": true,
        "apiResponse": true,
        "timestamp": "2025-01-29T10:00:00.000Z"
      },
      "uptime": 86400,
      "memory": {
        "rss": 52428800,
        "heapTotal": 29360128,
        "heapUsed": 20971520
      },
      "version": "1.0.0"
    },
    "lastUpdated": "2025-01-29T10:00:00.000Z"
  }
}
```

### 📋 获取最近活动记录

**端点**：`GET /api/admin/dashboard/activities`

**权限要求**：管理员API Key

**查询参数**：
```bash
?limit=20            # 活动记录数量限制（默认：20，最大：100）
&days=7              # 时间范围天数（默认：7天）
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity-1",
        "type": "software_created",
        "title": "新增软件",
        "description": "添加了新软件：玩机管家",
        "timestamp": "2025-01-29T10:00:00.000Z",
        "metadata": {
          "softwareName": "玩机管家",
          "softwareId": 1
        }
      },
      {
        "id": "activity-2",
        "type": "activation_code_generated",
        "title": "生成激活码",
        "description": "生成了新的激活码",
        "timestamp": "2025-01-29T09:30:00.000Z",
        "metadata": {
          "activationCodeId": "uuid-123"
        }
      },
      {
        "id": "activity-3",
        "type": "software_activated",
        "title": "软件激活",
        "description": "用户激活了软件：玩机管家",
        "timestamp": "2025-01-29T09:00:00.000Z",
        "metadata": {
          "softwareName": "玩机管家",
          "deviceInfo": "Windows 11 x64"
        }
      }
    ],
    "total": 3,
    "timeRange": {
      "start": "2025-01-22T10:00:00.000Z",
      "end": "2025-01-29T10:00:00.000Z",
      "days": 7
    },
    "lastUpdated": "2025-01-29T10:00:00.000Z"
  }
}
```

**活动类型说明**：
- `software_created`: 软件创建
- `software_updated`: 软件更新
- `activation_code_generated`: 激活码生成
- `activation_code_used`: 激活码使用
- `software_activated`: 软件激活

**使用示例**：
```bash
# 获取仪表板统计数据
curl "https://your-domain.com/api/admin/dashboard/stats" \
  -H "X-API-Key: your-admin-api-key"

# 获取最近30天的活动记录，限制50条
curl "https://your-domain.com/api/admin/dashboard/activities?days=30&limit=50" \
  -H "X-API-Key: your-admin-api-key"
```

## �🚨 错误处理

### 📊 HTTP状态码

| 状态码 | 含义 | 描述 | 处理建议 |
|--------|------|------|----------|
| `200` | ✅ OK | 请求成功 | 正常处理响应数据 |
| `201` | ✅ Created | 资源创建成功 | 资源已成功创建 |
| `400` | ❌ Bad Request | 请求参数错误 | 检查请求参数格式和必填字段 |
| `401` | ❌ Unauthorized | 认证失败 | 检查API Key或JWT Token |
| `403` | ❌ Forbidden | 权限不足 | 检查用户权限或API访问范围 |
| `404` | ❌ Not Found | 资源不存在 | 检查资源ID或URL路径 |
| `409` | ❌ Conflict | 资源冲突 | 检查是否存在重复资源 |
| `422` | ❌ Unprocessable Entity | 数据验证失败 | 检查数据格式和业务规则 |
| `429` | ⚠️ Too Many Requests | 请求频率超限 | 降低请求频率，实施退避策略 |
| `500` | ❌ Internal Server Error | 服务器内部错误 | 联系技术支持或稍后重试 |

### 🔍 错误响应格式

**标准错误响应**：
```json
{
  "success": false,
  "error": "错误描述信息",
  "code": "ERROR_CODE",
  "details": {
    "field": "具体错误字段",
    "message": "详细错误信息"
  },
  "timestamp": "2025-01-29T10:00:00.000Z",
  "path": "/api/activation-codes"
}
```

**防刷机制错误响应**：
```json
{
  "success": false,
  "error": "访问频率过高",
  "retryAfter": 900
}
```

**IP封禁错误响应**：
```json
{
  "success": false,
  "error": "IP被临时封禁",
  "retryAfter": 600
}
```

---

## 📚 更新日志

### v2.3.0 - 激活码格式优化与认证增强 (2025-08-17)

#### 🔄 激活码格式变更
- **新格式**：激活码从带连字符格式（如 `MDMNBPJX-3S0P6E-B1360C10`）更改为8位大写字母和数字组合（如 `A1B2C3D4`）
- **兼容性**：验证逻辑同时支持新旧两种格式，确保现有激活码仍可正常使用
- **生成规则**：新激活码使用8位随机大写字母（A-Z）和数字（0-9）组合
- **格式验证**：添加激活码格式验证，拒绝格式不正确的激活码

#### � 认证系统增强
- **双重认证支持**：激活码管理API现在支持JWT Token和API Key两种认证方式
- **GitHub OAuth集成**：通过GitHub OAuth登录的用户可以直接使用激活码功能
- **前端自动认证**：前端API客户端自动从Cookie中获取JWT Token
- **向后兼容**：保持API Key认证方式的完全兼容性

#### �🔧 技术改进
- 优化激活码生成算法，提高唯一性和安全性
- 简化激活码格式，便于用户输入和记忆
- 实现JWT认证优先，API Key备用的认证策略
- 更新API文档中的所有激活码示例和认证说明
- 保持向后兼容性，旧格式激活码继续有效

#### 🛠️ 问题修复
- **修复GitHub OAuth登录后无法生成激活码的问题**
- **解决前端401身份验证失败错误**
- **优化错误消息，提供更清晰的认证失败提示**

#### 📊 示例对比
- **旧格式**：`MDMNBPJX-3S0P6E-B1360C10`（带连字符，长度不固定）
- **新格式**：`A1B2C3D4`（8位固定长度，无连字符）

#### 🔑 认证方式
- **JWT Token**：`Authorization: Bearer <jwt-token>`（GitHub OAuth用户）
- **API Key**：`X-API-Key: <api-key>`（传统API调用）

### v2.2.0 - 网站管理功能 (2025-08-17)

#### 🆕 新增功能
- **网站管理**：新增完整的多站点管理功能
- **轮播图管理**：支持网站轮播图的增删改查操作
- **网站公告管理**：支持网站公告的发布和管理
- **捐赠人员管理**：新增捐赠人员信息管理功能
- **管理员仪表板**：提供系统统计和活动监控功能

#### 🔧 新增接口
**网站管理**：
- `GET /api/websites` - 获取网站列表
- `POST /api/websites` - 创建新网站
- `GET /api/websites/{id}` - 获取网站详情
- `PUT /api/websites/{id}` - 更新网站信息
- `DELETE /api/websites/{id}` - 删除网站

**轮播图管理**：
- `GET /api/websites/{id}/banners` - 获取轮播图列表
- `POST /api/websites/{id}/banners` - 创建新轮播图
- `GET /api/websites/{id}/banners/{bannerId}` - 获取轮播图详情
- `PUT /api/websites/{id}/banners/{bannerId}` - 更新轮播图
- `DELETE /api/websites/{id}/banners/{bannerId}` - 删除轮播图

**网站公告管理**：
- `GET /api/websites/{id}/announcements` - 获取公告列表
- `POST /api/websites/{id}/announcements` - 创建新公告
- `GET /api/websites/{id}/announcements/{announcementId}` - 获取公告详情
- `PUT /api/websites/{id}/announcements/{announcementId}` - 更新公告
- `DELETE /api/websites/{id}/announcements/{announcementId}` - 删除公告

**捐赠人员管理**：
- `GET /api/donors` - 获取捐赠人员列表（公开访问）
- `POST /api/donors` - 添加新捐赠人员

**管理员仪表板**：
- `GET /api/admin/dashboard/stats` - 获取仪表板统计数据
- `GET /api/admin/dashboard/activities` - 获取最近活动记录

#### 🎨 功能特性
- **多站点支持**：支持管理多个网站，每个网站独立配置
- **内容管理**：轮播图和公告支持排序、置顶、定时发布等功能
- **权限控制**：管理员功能需要API Key认证，捐赠列表支持公开访问
- **数据统计**：提供详细的系统运行状态和用户行为统计
- **活动监控**：实时记录系统重要操作和用户活动

#### 📊 数据模型
- 网站信息支持域名、标题、描述、Logo等完整配置
- 轮播图支持图片、链接、排序等属性
- 公告支持多种类型（info、warning、error、success）和时间控制
- 捐赠记录支持匿名选项和多平台标识

### v2.1.0 - 访问量统计功能 (2025-08-15)

#### 🆕 新增功能
- **访问量自动统计**：`GET /app/software/id/{id}` 接口现在会自动统计访问量
- **访问量排行榜**：新增 `GET /app/software/ranking` 接口，支持按访问量排序
- **防刷机制**：实施频率限制和异常检测，防止恶意刷访问量
- **管理员功能**：新增访问量统计查看和重置功能

#### 🔧 接口变更
- `GET /app/software/id/{id}` 响应中新增 `viewCount` 字段
- 新增 `GET /app/software/ranking` 排行榜接口
- 新增 `GET /admin/software/view-count` 管理员统计接口
- 新增 `POST /admin/software/view-count` 管理员重置接口

#### 🛡️ 安全增强
- 实施访问频率限制（1分钟内最多10次）
- 自动IP封禁机制（超限封禁15分钟）
- 异常访问模式检测和处理

#### 📊 数据格式
- 所有软件相关接口响应中现在包含 `viewCount` 字段
- 排行榜接口支持多种筛选和分页参数
- 管理员接口支持CSV格式数据导出

---

## 💻 代码示例

### 🌐 网站管理示例

#### JavaScript/Node.js 示例

```javascript
// 网站管理API客户端类
class WebsiteApiClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    const response = await fetch(url, config)
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'API request failed')
    }

    return data.data
  }

  // 获取网站列表
  async getWebsites(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/websites${query ? '?' + query : ''}`)
  }

  // 创建新网站
  async createWebsite(websiteData) {
    return this.request('/api/websites', {
      method: 'POST',
      body: JSON.stringify(websiteData)
    })
  }

  // 获取网站详情
  async getWebsite(id) {
    return this.request(`/api/websites/${id}`)
  }

  // 更新网站信息
  async updateWebsite(id, updateData) {
    return this.request(`/api/websites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    })
  }

  // 删除网站
  async deleteWebsite(id) {
    return this.request(`/api/websites/${id}`, {
      method: 'DELETE'
    })
  }

  // 获取轮播图列表
  async getBanners(websiteId, params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/websites/${websiteId}/banners${query ? '?' + query : ''}`)
  }

  // 创建轮播图
  async createBanner(websiteId, bannerData) {
    return this.request(`/api/websites/${websiteId}/banners`, {
      method: 'POST',
      body: JSON.stringify(bannerData)
    })
  }

  // 获取公告列表
  async getAnnouncements(websiteId, params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/websites/${websiteId}/announcements${query ? '?' + query : ''}`)
  }

  // 创建公告
  async createAnnouncement(websiteId, announcementData) {
    return this.request(`/api/websites/${websiteId}/announcements`, {
      method: 'POST',
      body: JSON.stringify(announcementData)
    })
  }

  // 获取捐赠人员列表（公开访问，不需要API Key）
  async getDonors() {
    const response = await fetch(`${this.baseUrl}/api/donors`)
    const data = await response.json()
    return data.success ? data.data : []
  }

  // 添加捐赠人员
  async addDonor(donorData) {
    return this.request('/api/donors', {
      method: 'POST',
      body: JSON.stringify(donorData)
    })
  }

  // 获取管理员仪表板统计
  async getDashboardStats() {
    return this.request('/api/admin/dashboard/stats')
  }

  // 获取管理员活动记录
  async getDashboardActivities(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/admin/dashboard/activities${query ? '?' + query : ''}`)
  }
}

// 使用示例
const api = new WebsiteApiClient('https://api-g.lacs.cc', 'your-api-key')

// 网站管理示例
async function websiteManagementExample() {
  try {
    // 1. 获取网站列表
    const websites = await api.getWebsites({ page: 1, limit: 10 })
    console.log('网站列表:', websites)

    // 2. 创建新网站
    const newWebsite = await api.createWebsite({
      name: '新测试网站',
      domain: 'test.example.com',
      title: '测试网站标题',
      description: '这是一个测试网站',
      isActive: true
    })
    console.log('新建网站:', newWebsite)

    // 3. 获取网站详情
    const websiteDetail = await api.getWebsite(newWebsite.id)
    console.log('网站详情:', websiteDetail)

    // 4. 创建轮播图
    const newBanner = await api.createBanner(newWebsite.id, {
      title: '欢迎横幅',
      description: '欢迎来到我们的网站',
      imageUrl: 'https://example.com/banner.jpg',
      linkUrl: 'https://example.com/welcome',
      sortOrder: 1
    })
    console.log('新建轮播图:', newBanner)

    // 5. 创建公告
    const newAnnouncement = await api.createAnnouncement(newWebsite.id, {
      title: '重要通知',
      content: '这是一个重要的系统通知',
      type: 'info',
      isSticky: true
    })
    console.log('新建公告:', newAnnouncement)

    // 6. 获取捐赠人员列表
    const donors = await api.getDonors()
    console.log('捐赠人员:', donors)

    // 7. 获取管理员统计数据
    const stats = await api.getDashboardStats()
    console.log('仪表板统计:', stats)

  } catch (error) {
    console.error('操作失败:', error.message)
  }
}

// 执行示例
websiteManagementExample()
```

#### Python 示例

```python
import requests
import json
from typing import Dict, List, Optional, Any

class WebsiteApiClient:
    """网站管理API客户端"""

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """通用请求方法"""
        url = f"{self.base_url}{endpoint}"

        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()

            data = response.json()
            if not data.get('success', False):
                raise Exception(data.get('error', 'API request failed'))

            return data.get('data', {})

        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {str(e)}")

    # 网站管理方法
    def get_websites(self, **params) -> List[Dict]:
        """获取网站列表"""
        return self._request('GET', '/api/websites', params=params)

    def create_website(self, website_data: Dict) -> Dict:
        """创建新网站"""
        return self._request('POST', '/api/websites', json=website_data)

    def get_website(self, website_id: int) -> Dict:
        """获取网站详情"""
        return self._request('GET', f'/api/websites/{website_id}')

    # 轮播图管理方法
    def get_banners(self, website_id: int, **params) -> List[Dict]:
        """获取轮播图列表"""
        return self._request('GET', f'/api/websites/{website_id}/banners', params=params)

    def create_banner(self, website_id: int, banner_data: Dict) -> Dict:
        """创建轮播图"""
        return self._request('POST', f'/api/websites/{website_id}/banners', json=banner_data)

    # 公告管理方法
    def get_announcements(self, website_id: int, **params) -> List[Dict]:
        """获取公告列表"""
        return self._request('GET', f'/api/websites/{website_id}/announcements', params=params)

    def create_announcement(self, website_id: int, announcement_data: Dict) -> Dict:
        """创建公告"""
        return self._request('POST', f'/api/websites/{website_id}/announcements', json=announcement_data)

    # 捐赠人员管理方法
    def get_donors(self) -> List[Dict]:
        """获取捐赠人员列表（公开访问）"""
        try:
            response = requests.get(f"{self.base_url}/api/donors")
            response.raise_for_status()
            data = response.json()
            return data.get('data', []) if data.get('success') else []
        except Exception as e:
            print(f"获取捐赠人员列表失败: {e}")
            return []

    def add_donor(self, donor_data: Dict) -> Dict:
        """添加捐赠人员"""
        return self._request('POST', '/api/donors', json=donor_data)

    # 管理员仪表板方法
    def get_dashboard_stats(self) -> Dict:
        """获取仪表板统计数据"""
        return self._request('GET', '/api/admin/dashboard/stats')

# 使用示例
def main():
    # 初始化API客户端
    api = WebsiteApiClient('https://api-g.lacs.cc', 'your-api-key')

    try:
        # 1. 网站管理示例
        print("=== 网站管理示例 ===")

        # 获取网站列表
        websites = api.get_websites(page=1, limit=10)
        print(f"网站列表: {len(websites)} 个网站")

        # 创建新网站
        new_website = api.create_website({
            'name': 'Python测试网站',
            'domain': 'python-test.example.com',
            'title': 'Python API测试',
            'description': '使用Python API创建的测试网站',
            'isActive': True
        })
        print(f"创建网站成功: {new_website['name']}")
        website_id = new_website['id']

        # 2. 轮播图管理示例
        print("\n=== 轮播图管理示例 ===")

        # 创建轮播图
        new_banner = api.create_banner(website_id, {
            'title': 'Python创建的横幅',
            'description': '这是通过Python API创建的轮播图',
            'imageUrl': 'https://example.com/python-banner.jpg',
            'linkUrl': 'https://python.org',
            'linkTarget': '_blank',
            'sortOrder': 1,
            'isActive': True
        })
        print(f"创建轮播图成功: {new_banner['title']}")

        # 3. 公告管理示例
        print("\n=== 公告管理示例 ===")

        # 创建公告
        new_announcement = api.create_announcement(website_id, {
            'title': 'Python API测试公告',
            'content': '这是通过Python API创建的测试公告。',
            'type': 'info',
            'isSticky': True,
            'sortOrder': 1,
            'isActive': True,
            'isPublished': True
        })
        print(f"创建公告成功: {new_announcement['title']}")

        # 4. 捐赠人员管理示例
        print("\n=== 捐赠人员管理示例 ===")

        # 获取捐赠人员列表
        donors = api.get_donors()
        print(f"捐赠人员列表: {len(donors)} 位捐赠者")

        # 添加捐赠人员
        new_donor = api.add_donor({
            'name': 'Python测试用户',
            'amount': 66.66,
            'message': '感谢提供Python API示例！',
            'isAnonymous': False,
            'platform': '支付宝'
        })
        print(f"添加捐赠人员成功: {new_donor['name']}")

        # 5. 管理员仪表板示例
        print("\n=== 管理员仪表板示例 ===")

        # 获取统计数据
        stats = api.get_dashboard_stats()
        print(f"系统统计 - 软件总数: {stats['software']['total']}")
        print(f"系统统计 - 激活码总数: {stats['activationCodes']['total']}")
        print(f"系统状态: {stats['system']['status']}")

        print("\n=== 所有操作完成 ===")

    except Exception as e:
        print(f"操作失败: {e}")

if __name__ == "__main__":
    main()
```

#### cURL 命令行示例

```bash
#!/bin/bash

# 设置API基础信息
API_BASE_URL="https://api-g.lacs.cc"
API_KEY="your-api-key"
ADMIN_API_KEY="your-admin-api-key"

echo "=== 网站管理API测试 ==="

# 1. 获取网站列表
echo "1. 获取网站列表"
curl -s -X GET "${API_BASE_URL}/api/websites?page=1&limit=5" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" | jq '.'

# 2. 创建新网站
echo -e "\n2. 创建新网站"
WEBSITE_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/websites" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cURL测试网站",
    "domain": "curl-test.example.com",
    "title": "cURL API测试",
    "description": "使用cURL命令创建的测试网站",
    "isActive": true
  }')

echo $WEBSITE_RESPONSE | jq '.'

# 提取网站ID用于后续操作
WEBSITE_ID=$(echo $WEBSITE_RESPONSE | jq -r '.data.id')
echo "创建的网站ID: $WEBSITE_ID"

# 3. 获取网站详情
echo -e "\n3. 获取网站详情"
curl -s -X GET "${API_BASE_URL}/api/websites/${WEBSITE_ID}" \
  -H "X-API-Key: ${API_KEY}" | jq '.'

# 4. 创建轮播图
echo -e "\n4. 创建轮播图"
curl -s -X POST "${API_BASE_URL}/api/websites/${WEBSITE_ID}/banners" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "cURL创建的横幅",
    "description": "这是通过cURL命令创建的轮播图",
    "imageUrl": "https://example.com/curl-banner.jpg",
    "linkUrl": "https://curl.se",
    "linkTarget": "_blank",
    "sortOrder": 1,
    "isActive": true
  }' | jq '.'

# 5. 获取轮播图列表
echo -e "\n5. 获取轮播图列表"
curl -s -X GET "${API_BASE_URL}/api/websites/${WEBSITE_ID}/banners" \
  -H "X-API-Key: ${API_KEY}" | jq '.'

# 6. 创建公告
echo -e "\n6. 创建公告"
curl -s -X POST "${API_BASE_URL}/api/websites/${WEBSITE_ID}/announcements" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "cURL API测试公告",
    "content": "这是通过cURL命令创建的测试公告，用于验证API功能。",
    "type": "info",
    "isSticky": true,
    "sortOrder": 1,
    "isActive": true,
    "isPublished": true
  }' | jq '.'

# 7. 获取公告列表
echo -e "\n7. 获取公告列表"
curl -s -X GET "${API_BASE_URL}/api/websites/${WEBSITE_ID}/announcements" \
  -H "X-API-Key: ${API_KEY}" | jq '.'

# 8. 获取捐赠人员列表（公开访问，不需要API Key）
echo -e "\n8. 获取捐赠人员列表"
curl -s -X GET "${API_BASE_URL}/api/donors" | jq '.'

# 9. 添加捐赠人员
echo -e "\n9. 添加捐赠人员"
curl -s -X POST "${API_BASE_URL}/api/donors" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cURL测试用户",
    "amount": 88.88,
    "message": "感谢提供cURL API示例！",
    "isAnonymous": false,
    "platform": "微信支付"
  }' | jq '.'

# 10. 获取管理员仪表板统计数据
echo -e "\n10. 获取管理员仪表板统计数据"
curl -s -X GET "${API_BASE_URL}/api/admin/dashboard/stats" \
  -H "X-API-Key: ${ADMIN_API_KEY}" | jq '.data.software, .data.system.status'

# 11. 获取管理员活动记录
echo -e "\n11. 获取管理员活动记录"
curl -s -X GET "${API_BASE_URL}/api/admin/dashboard/activities?limit=3" \
  -H "X-API-Key: ${ADMIN_API_KEY}" | jq '.data.activities[].title'

echo -e "\n=== 所有测试完成 ==="
```

### 🔧 最佳实践

#### 1. 错误处理
```javascript
// JavaScript 错误处理示例
async function safeApiCall(apiFunction, ...args) {
  try {
    const result = await apiFunction(...args)
    return { success: true, data: result }
  } catch (error) {
    console.error('API调用失败:', error.message)

    // 根据错误类型进行不同处理
    if (error.message.includes('401')) {
      // 认证失败，可能需要重新获取API Key
      console.log('请检查API Key是否正确')
    } else if (error.message.includes('429')) {
      // 请求频率过高，需要等待
      console.log('请求频率过高，请稍后重试')
    } else if (error.message.includes('500')) {
      // 服务器错误
      console.log('服务器内部错误，请联系技术支持')
    }

    return { success: false, error: error.message }
  }
}

// 使用示例
const result = await safeApiCall(api.getWebsites, { page: 1, limit: 10 })
if (result.success) {
  console.log('获取网站列表成功:', result.data)
} else {
  console.log('获取网站列表失败:', result.error)
}
```

#### 2. 批量操作
```python
# Python 批量操作示例
def batch_create_announcements(api_client, website_id, announcements_data):
    """批量创建公告"""
    results = []

    for announcement_data in announcements_data:
        try:
            result = api_client.create_announcement(website_id, announcement_data)
            results.append({'success': True, 'data': result})
            print(f"创建公告成功: {result['title']}")
        except Exception as e:
            results.append({'success': False, 'error': str(e)})
            print(f"创建公告失败: {e}")

    return results

# 使用示例
announcements = [
    {
        'title': '系统维护通知',
        'content': '系统将于今晚进行维护...',
        'type': 'warning',
        'isSticky': True
    },
    {
        'title': '新功能发布',
        'content': '我们很高兴地宣布新功能上线...',
        'type': 'success',
        'isSticky': False
    }
]

results = batch_create_announcements(api, website_id, announcements)
```

#### 3. 数据验证
```javascript
// JavaScript 数据验证示例
function validateWebsiteData(data) {
  const errors = []

  if (!data.name || data.name.trim().length === 0) {
    errors.push('网站名称不能为空')
  }

  if (!data.domain || data.domain.trim().length === 0) {
    errors.push('域名不能为空')
  }

  // 验证域名格式
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
  if (data.domain && !domainRegex.test(data.domain)) {
    errors.push('域名格式不正确')
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

// 使用示例
const websiteData = {
  name: '测试网站',
  domain: 'test.example.com',
  title: '测试网站标题'
}

const validation = validateWebsiteData(websiteData)
if (validation.isValid) {
  const result = await api.createWebsite(websiteData)
} else {
  console.log('数据验证失败:', validation.errors)
}
```

---

## 📝 总结

本文档详细介绍了LACS API Server的网站管理功能，包括：

- **🌐 网站管理**：支持多站点管理，包括网站的创建、更新、删除等操作
- **🎨 轮播图管理**：提供完整的轮播图管理功能，支持图片、链接、排序等配置
- **📢 公告管理**：支持多种类型的公告发布和管理，包括置顶、定时发布等功能
- **💰 捐赠人员管理**：管理捐赠人员信息，支持公开展示和后台管理
- **🔧 管理员仪表板**：提供系统统计和活动监控功能

所有API都遵循RESTful设计原则，支持标准的HTTP方法和状态码，提供详细的错误信息和响应格式。通过本文档的示例代码，开发者可以快速集成这些功能到自己的应用中。

#### Python 示例

```python
import requests
import json
from typing import Dict, List, Optional, Any

class WebsiteApiClient:
    """网站管理API客户端"""

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """通用请求方法"""
        url = f"{self.base_url}{endpoint}"

        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()

            data = response.json()
            if not data.get('success', False):
                raise Exception(data.get('error', 'API request failed'))

            return data.get('data', {})

        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {str(e)}")

    # 网站管理方法
    def get_websites(self, **params) -> List[Dict]:
        """获取网站列表"""
        return self._request('GET', '/api/websites', params=params)

    def create_website(self, website_data: Dict) -> Dict:
        """创建新网站"""
        return self._request('POST', '/api/websites', json=website_data)

    def get_website(self, website_id: int) -> Dict:
        """获取网站详情"""
        return self._request('GET', f'/api/websites/{website_id}')

    def update_website(self, website_id: int, update_data: Dict) -> Dict:
        """更新网站信息"""
        return self._request('PUT', f'/api/websites/{website_id}', json=update_data)

    def delete_website(self, website_id: int) -> Dict:
        """删除网站"""
        return self._request('DELETE', f'/api/websites/{website_id}')

    # 轮播图管理方法
    def get_banners(self, website_id: int, **params) -> List[Dict]:
        """获取轮播图列表"""
        return self._request('GET', f'/api/websites/{website_id}/banners', params=params)

    def create_banner(self, website_id: int, banner_data: Dict) -> Dict:
        """创建轮播图"""
        return self._request('POST', f'/api/websites/{website_id}/banners', json=banner_data)

    # 公告管理方法
    def get_announcements(self, website_id: int, **params) -> List[Dict]:
        """获取公告列表"""
        return self._request('GET', f'/api/websites/{website_id}/announcements', params=params)

    def create_announcement(self, website_id: int, announcement_data: Dict) -> Dict:
        """创建公告"""
        return self._request('POST', f'/api/websites/{website_id}/announcements', json=announcement_data)

    # 捐赠人员管理方法
    def get_donors(self) -> List[Dict]:
        """获取捐赠人员列表（公开访问）"""
        try:
            response = requests.get(f"{self.base_url}/api/donors")
            response.raise_for_status()
            data = response.json()
            return data.get('data', []) if data.get('success') else []
        except Exception as e:
            print(f"获取捐赠人员列表失败: {e}")
            return []

    def add_donor(self, donor_data: Dict) -> Dict:
        """添加捐赠人员"""
        return self._request('POST', '/api/donors', json=donor_data)

    # 管理员仪表板方法
    def get_dashboard_stats(self) -> Dict:
        """获取仪表板统计数据"""
        return self._request('GET', '/api/admin/dashboard/stats')

    def get_dashboard_activities(self, **params) -> Dict:
        """获取仪表板活动记录"""
        return self._request('GET', '/api/admin/dashboard/activities', params=params)

# 使用示例
def main():
    # 初始化API客户端
    api = WebsiteApiClient('https://api-g.lacs.cc', 'your-api-key')

    try:
        # 1. 网站管理示例
        print("=== 网站管理示例 ===")

        # 获取网站列表
        websites = api.get_websites(page=1, limit=10)
        print(f"网站列表: {len(websites)} 个网站")

        # 创建新网站
        new_website = api.create_website({
            'name': 'Python测试网站',
            'domain': 'python-test.example.com',
            'title': 'Python API测试',
            'description': '使用Python API创建的测试网站',
            'isActive': True
        })
        print(f"创建网站成功: {new_website['name']}")
        website_id = new_website['id']

        # 2. 轮播图管理示例
        print("\n=== 轮播图管理示例 ===")

        # 创建轮播图
        new_banner = api.create_banner(website_id, {
            'title': 'Python创建的横幅',
            'description': '这是通过Python API创建的轮播图',
            'imageUrl': 'https://example.com/python-banner.jpg',
            'linkUrl': 'https://python.org',
            'linkTarget': '_blank',
            'sortOrder': 1,
            'isActive': True
        })
        print(f"创建轮播图成功: {new_banner['title']}")

        # 3. 公告管理示例
        print("\n=== 公告管理示例 ===")

        # 创建公告
        new_announcement = api.create_announcement(website_id, {
            'title': 'Python API测试公告',
            'content': '这是通过Python API创建的测试公告。',
            'type': 'info',
            'isSticky': True,
            'sortOrder': 1,
            'isActive': True,
            'isPublished': True
        })
        print(f"创建公告成功: {new_announcement['title']}")

        # 4. 捐赠人员管理示例
        print("\n=== 捐赠人员管理示例 ===")

        # 获取捐赠人员列表
        donors = api.get_donors()
        print(f"捐赠人员列表: {len(donors)} 位捐赠者")

        # 添加捐赠人员
        new_donor = api.add_donor({
            'name': 'Python测试用户',
            'amount': 66.66,
            'message': '感谢提供Python API示例！',
            'isAnonymous': False,
            'platform': '支付宝'
        })
        print(f"添加捐赠人员成功: {new_donor['name']}")

        # 5. 管理员仪表板示例
        print("\n=== 管理员仪表板示例 ===")

        # 获取统计数据
        stats = api.get_dashboard_stats()
        print(f"系统统计 - 软件总数: {stats['software']['total']}")
        print(f"系统统计 - 激活码总数: {stats['activationCodes']['total']}")
        print(f"系统状态: {stats['system']['status']}")

        print("\n=== 所有操作完成 ===")

    except Exception as e:
        print(f"操作失败: {e}")

if __name__ == "__main__":
    main()
```
