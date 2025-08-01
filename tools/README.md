# 外部工具说明

本目录包含玩机管家项目使用的外部工具和依赖。

## 📋 工具列表

### scrcpy-win32-v3.3.1/
Android屏幕镜像工具
- **版本**: v3.3.1
- **平台**: Windows 32/64位
- **功能**: 实时屏幕镜像、设备控制
- **官网**: https://github.com/Genymobile/scrcpy

**包含文件:**
- `scrcpy.exe` - 主程序
- `adb.exe` - Android调试桥
- `scrcpy-server` - 服务端程序
- 相关DLL库文件

### activation-server/
激活服务器
- **功能**: 软件激活和授权管理
- **技术**: Node.js服务器
- **端口**: 默认3000

**包含文件:**
- `server.js` - 服务器主程序
- 相关配置文件

## 🔧 工具配置

### Scrcpy配置
```javascript
// 在应用中的配置
const scrcpyConfig = {
  path: './tools/scrcpy-win32-v3.3.1/scrcpy.exe',
  adbPath: './tools/scrcpy-win32-v3.3.1/adb.exe',
  options: {
    bitRate: '8M',
    maxSize: 1920,
    crop: null,
    record: null
  }
};
```

### 激活服务器配置
```javascript
// 服务器配置
const serverConfig = {
  port: 3000,
  host: 'localhost',
  apiKey: 'your-api-key',
  database: './data/activations.db'
};
```

## 📝 使用说明

### Scrcpy使用
1. **基本镜像**: 连接设备后自动启动镜像
2. **录制功能**: 支持屏幕录制为MP4文件
3. **控制功能**: 支持鼠标键盘控制设备
4. **性能调优**: 可调整比特率和分辨率

### 激活服务器使用
1. **启动服务**: `node tools/activation-server/server.js`
2. **API调用**: 通过HTTP API进行激活验证
3. **数据管理**: 激活数据存储和管理
4. **安全验证**: 支持多种验证方式

## ⚙️ 环境要求

### Scrcpy要求
- **Android版本**: Android 5.0+ (API 21+)
- **USB调试**: 必须启用USB调试
- **ADB驱动**: 正确安装ADB驱动
- **系统权限**: 可能需要管理员权限

### 激活服务器要求
- **Node.js**: v14.0+
- **NPM包**: express, sqlite3等
- **网络**: 需要网络连接
- **存储**: 足够的磁盘空间

## 🔄 更新维护

### Scrcpy更新
1. 从官网下载最新版本
2. 替换tools目录中的文件
3. 更新应用中的路径配置
4. 测试兼容性

### 激活服务器更新
1. 备份现有数据
2. 更新服务器代码
3. 迁移数据库结构
4. 测试功能完整性

## 🐛 故障排除

### Scrcpy常见问题
1. **连接失败**: 检查USB调试和驱动
2. **画面卡顿**: 降低比特率或分辨率
3. **音频问题**: 检查音频转发设置
4. **权限错误**: 使用管理员权限运行

### 激活服务器问题
1. **端口占用**: 更改服务器端口
2. **数据库错误**: 检查数据库文件权限
3. **网络问题**: 检查防火墙设置
4. **API错误**: 检查API密钥配置

## 📄 许可证

### Scrcpy
- **许可证**: Apache License 2.0
- **版权**: © Genymobile
- **使用限制**: 遵循Apache 2.0许可证

### 激活服务器
- **许可证**: 项目自定义许可证
- **版权**: © HOUT Team
- **使用限制**: 仅限项目内部使用

## 🔗 相关链接

- [Scrcpy官方文档](https://github.com/Genymobile/scrcpy)
- [ADB官方文档](https://developer.android.com/studio/command-line/adb)
- [Node.js官网](https://nodejs.org/)
- [项目主页](../README.md)
