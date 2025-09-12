# 统一版本管理系统

本项目实现了一个统一的版本管理系统，通过环境变量文件集中管理版本号，确保前后端版本号的一致性。

## 🎯 功能特性

- ✅ **统一版本配置**: 通过 `version.config.json` 集中管理版本信息
- ✅ **自动同步**: 一键同步版本号到所有配置文件
- ✅ **版本校验**: 自动验证版本号格式和一致性
- ✅ **前后端统一**: 前端和后端自动读取相同的版本配置
- ✅ **环境变量支持**: 支持多个环境变量文件配置
- ✅ **版本检查**: 内置版本更新检查机制

## 📁 文件结构

```
项目根目录/
├── version.config.json          # 版本配置文件（主配置）
├── .env                        # 开发环境变量
├── .env.production             # 生产环境变量
├── package.json                # 前端包配置
├── src-tauri/
│   ├── Cargo.toml             # Rust包配置
│   └── tauri.conf.json        # Tauri应用配置
├── scripts/
│   ├── version-manager.cjs     # 版本管理工具
│   ├── validate-env.cjs       # 环境变量验证
│   └── load-env.cjs           # 环境变量加载器
└── src/
    └── utils/
        └── versionManager.ts   # 前端版本管理工具
```

## 🚀 快速开始

### 1. 版本配置文件

主版本配置文件 `version.config.json`：

```json
{
  "version": "1.0.0",
  "buildNumber": 1,
  "versionName": "1.0.0",
  "releaseDate": "2025-01-11",
  "description": "统一版本管理配置文件",
  "changelog": [
    "实现统一版本管理系统",
    "支持环境变量集中配置",
    "前后端版本号自动同步"
  ],
  "environments": {
    "development": {
      "version": "1.0.0-dev",
      "enableDebug": true
    },
    "production": {
      "version": "1.0.0",
      "enableDebug": false
    }
  }
}
```

### 2. 环境变量配置

在 `.env` 和 `.env.production` 文件中配置版本相关的环境变量：

```bash
# 版本管理配置
VITE_APP_VERSION=1.0.0
VITE_BUILD_NUMBER=1
VITE_VERSION_NAME=1.0.0
VITE_RELEASE_DATE=2025-01-11
VITE_VERSION_CONFIG_FILE=version.config.json
```

## 🛠️ 使用方法

### 命令行工具

```bash
# 同步版本号到所有配置文件
npm run sync-version

# 验证版本一致性
npm run validate-version

# 更新版本号
npm run update-version 1.0.1

# 查看版本管理帮助
npm run version-help

# 验证环境变量配置
npm run validate-env
```

### 版本管理脚本详细用法

```bash
# 基本命令
node scripts/version-manager.cjs sync              # 同步版本号
node scripts/version-manager.cjs validate         # 验证版本一致性
node scripts/version-manager.cjs update <version> # 更新版本号

# 更新版本示例
node scripts/version-manager.cjs update 1.0.1
node scripts/version-manager.cjs update 1.1.0 --buildNumber 10 --releaseDate 2025-01-15
```

### 前端使用

#### 1. 使用版本管理工具

```typescript
import { versionManager } from '@/utils/versionManager';

// 获取当前版本信息
const versionInfo = await versionManager.getCurrentVersionInfo();
console.log('当前版本:', versionInfo.version);

// 获取版本字符串
const versionString = await versionManager.getVersionString();
console.log('版本字符串:', versionString); // "1.0.0"

// 获取完整版本字符串
const fullVersionString = await versionManager.getFullVersionString();
console.log('完整版本:', fullVersionString); // "v1.0.0 Build 1 (abc123) [开发版]"

// 检查版本更新
const updateResult = await versionManager.checkForUpdates();
if (updateResult.hasUpdate) {
  console.log('发现新版本:', updateResult.latestVersion);
}
```

#### 2. 使用React Hooks

```typescript
import { useVersionInfo, useVersionCheck } from '@/utils/versionManager';

function MyComponent() {
  const { versionInfo, loading, error } = useVersionInfo();
  const { checkResult, checking, checkForUpdates } = useVersionCheck();

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <h3>版本信息</h3>
      <p>当前版本: {versionInfo?.version}</p>
      <p>构建号: {versionInfo?.buildNumber}</p>
      <p>发布日期: {versionInfo?.releaseDate}</p>
      
      <button onClick={checkForUpdates} disabled={checking}>
        {checking ? '检查中...' : '检查更新'}
      </button>
      
      {checkResult?.hasUpdate && (
        <p>发现新版本: {checkResult.latestVersion}</p>
      )}
    </div>
  );
}
```

#### 3. 使用版本显示组件

```typescript
import VersionDisplay from '@/components/Common/VersionDisplay';

// 完整版本卡片
<VersionDisplay showCard={true} showUpdateCheck={true} />

// 紧凑版本显示
<VersionDisplay compact={true} />

// 仅显示版本信息
<VersionDisplay showCard={false} showUpdateCheck={false} />
```

### 后端使用

后端会自动从版本配置文件读取版本信息，无需额外配置。

```rust
// Tauri命令会自动使用统一版本配置
#[tauri::command]
pub fn get_app_version() -> Result<String, String> {
    // 自动读取version.config.json或使用Cargo.toml版本
    let version = get_unified_version();
    Ok(version)
}
```

## 🔧 配置说明

### 版本配置文件字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `version` | string | ✅ | 主版本号 (semver格式) |
| `buildNumber` | number | ✅ | 构建号 |
| `versionName` | string | ✅ | 版本名称 |
| `releaseDate` | string | ✅ | 发布日期 (YYYY-MM-DD) |
| `description` | string | ❌ | 版本描述 |
| `changelog` | array | ❌ | 更新日志 |
| `environments` | object | ❌ | 环境特定配置 |

### 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_APP_VERSION` | 应用版本号 | `1.0.0` |
| `VITE_BUILD_NUMBER` | 构建号 | `1` |
| `VITE_VERSION_NAME` | 版本名称 | `1.0.0` |
| `VITE_RELEASE_DATE` | 发布日期 | `2025-01-11` |
| `VITE_VERSION_CONFIG_FILE` | 版本配置文件路径 | `version.config.json` |

## 🔍 版本校验

系统会自动验证：

1. **版本号格式**: 必须符合 semver 规范 (x.y.z)
2. **版本一致性**: 所有配置文件中的版本号必须一致
3. **必需字段**: 确保所有必需的版本字段都已配置
4. **环境变量**: 验证所有必需的环境变量都已设置

## 🚨 故障排除

### 常见问题

1. **版本不一致错误**
   ```bash
   # 运行同步命令修复
   npm run sync-version
   ```

2. **环境变量缺失**
   ```bash
   # 检查环境变量配置
   npm run validate-env
   ```

3. **版本配置文件格式错误**
   ```bash
   # 验证JSON格式是否正确
   node -e "console.log(JSON.parse(require('fs').readFileSync('version.config.json', 'utf8')))"
   ```

### 调试模式

在开发环境中，可以启用调试模式查看详细的版本管理日志：

```typescript
// 在浏览器控制台中
window.versionDebugger?.logVersionInfo();
```

## 📝 更新流程

### 发布新版本的标准流程

1. **更新版本配置**
   ```bash
   node scripts/version-manager.cjs update 1.0.1 --releaseDate 2025-01-15
   ```

2. **验证版本一致性**
   ```bash
   npm run validate-version
   ```

3. **验证环境变量**
   ```bash
   npm run validate-env
   ```

4. **构建和测试**
   ```bash
   npm run build
   npm run tauri:build
   ```

5. **提交更改**
   ```bash
   git add .
   git commit -m "chore: bump version to 1.0.1"
   git tag v1.0.1
   ```

## 🎨 自定义配置

### 添加新的环境变量

1. 在 `version.config.json` 中添加新字段
2. 在环境变量文件中添加对应的 `VITE_` 前缀变量
3. 更新 `scripts/validate-env.cjs` 中的验证规则
4. 在前端代码中使用 `import.meta.env.VITE_YOUR_VAR`

### 扩展版本管理功能

可以通过修改 `src/utils/versionManager.ts` 来添加新的版本管理功能，如：

- 版本比较算法
- 自动更新检查
- 版本回滚功能
- 版本统计分析

## 📚 API 参考

详细的API文档请参考：
- [前端版本管理API](../src/utils/versionManager.ts)
- [后端版本管理API](../src-tauri/src/version.rs)
- [版本管理脚本API](../scripts/version-manager.cjs)

## 🤝 贡献指南

如需扩展版本管理系统功能，请：

1. 确保新功能与现有架构兼容
2. 添加相应的测试用例
3. 更新文档说明
4. 遵循现有的代码风格

---

**注意**: 修改版本配置后，建议运行完整的验证流程确保系统正常工作。