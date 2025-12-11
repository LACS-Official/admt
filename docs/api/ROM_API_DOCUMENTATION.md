# XiaomiROM Mirrors API 文档

## 概述

XiaomiROM Mirrors ROM下载服务API文档。

- **响应格式**: JSON (UTF-8编码)
- **认证方式**: Bearer Token 或 Query Parameter

---

## 认证说明

所有API需要使用用户Token进行认证，支持两种方式：

**方式一：Authorization Header（推荐）**
```
Authorization: Bearer <user_token>
```

**方式二：Query Parameter**
```
?token=<user_token>
```

---

## 错误响应格式

```json
{
  "status": 400,
  "error": "错误描述",
  "error_code": "error_code"
}
```

### 常见错误码

| 错误码 | HTTP状态码 | 描述 |
|--------|-----------|------|
| `missing_params` | 400 | 缺少必需参数 |
| `invalid_params` | 400 | 参数格式不正确 |
| `invalid_token` | 401 | 认证令牌无效 |
| `token_expired` | 403 | 认证令牌已过期 |
| `insufficient_tokens` | 403 | 下载次数不足 |
| `device_not_supported` | 404 | 不支持的设备代号 |
| `version_not_found` | 404 | 版本不存在 |
| `resource_not_found` | 404 | 暂未收录该ROM |
| `service_unavailable` | 503 | 服务不可用 |

---

## API 列表

### 1. 列出版本

列出指定设备的所有可用ROM版本。

**请求**
```
GET /api/v1/ls/?code={device_code}&token={token}
```

或:
```
POST /api/v1/ls/?code={device_code}
Authorization: Bearer {token}
```

**参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `code` | string | 是 | 设备代号 |
| `token` | string | 是 | 用户令牌 |

**成功响应**
```json
{
  "status": "200",
  "code": "houji",
  "count": "3",
  "data": {
    "01": "OS1.0.7.0.UNOCNXM",
    "02": "OS1.0.6.0.UNOCNXM",
    "03": "OS1.0.5.0.UNOCNXM"
  }
}
```

**说明**: 此API不消耗下载次数。

---

### 2. 获取下载链接

获取指定ROM的下载链接。

**请求**
```
GET /api/v1/download/?code={device_code}&version={version}&type={file_type}&token={token}
```

或:
```
POST /api/v1/download/?code={device_code}&version={version}&type={file_type}
Authorization: Bearer {token}
```

**参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `code` | string | 是 | 设备代号 |
| `version` | string | 是 | ROM版本号 |
| `type` | string | 是 | 文件类型: `zip` 或 `tgz` |
| `token` | string | 是 | 用户令牌 |

**成功响应**
```json
{
  "status": "200",
  "device_code": "houji",
  "version": "OS1.0.7.0.UNOCNXM",
  "file_type": "zip",
  "download_url": "https://example.com/rom/abc12345",
  "expires_in": "2024-01-15 14:30:45",
  "remaining_access": 5
}
```

**响应字段**

| 字段 | 描述 |
|------|------|
| `download_url` | 下载链接（有效期内可重复使用） |
| `expires_in` | 链接过期时间 |
| `remaining_access` | 链接剩余可访问次数 |

**说明**: 
- 每次获取新链接消耗1次下载次数
- 链接有效期内重复请求返回缓存链接，不消耗次数

---

### 3. 通过包名下载

通过完整包名获取下载链接。

**请求**
```
GET /api/v1/pdownload/?name={package_name}&token={token}
```

或:
```
POST /api/v1/pdownload/?name={package_name}
Authorization: Bearer {token}
```

**参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `name` | string | 是 | 完整包名 |
| `token` | string | 是 | 用户令牌 |

**包名格式**
```
{device_code}_images_{version}_{timestamp}_{android_version}_{region}_{hash}
```

示例: `houji_images_OS1.0.7.0.UNOCNXM_20240911.0000.00_14.0_cn_4caffd47f3`

**成功响应**
```json
{
  "status": "200",
  "device_code": "houji",
  "version": "OS1.0.7.0.UNOCNXM",
  "download_url": "https://example.com/rom/abc12345",
  "expires_in": "2024-01-15 14:30:45",
  "remaining_access": 5
}
```

---

## 参数验证规则

| 参数 | 规则 |
|------|------|
| `code` | 最大50字符，仅字母、数字、下划线、连字符 |
| `version` | 最大100字符 |
| `type` | 仅允许 `zip` 或 `tgz` |
| `name` | 最大200字符，格式: `{code}_images_{version}_...` |
| `token` | 最大128字符，仅字母数字 |
