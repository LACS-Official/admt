#!/usr/bin/env node

/**
 * ADMT 项目命令行管理工具
 * 使用方法: node admt update <version>
 */

import VersionManager from './scripts/version-manager.cjs';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const value = args[1];

  if (!command) {
    showHelp();
    return;
  }

  const manager = new VersionManager();

  switch (command) {
    case 'update':
      if (!value) {
        console.error('❌ 请提供版本号: node admt update <version>');
        process.exit(1);
      }
      // 直接复用 VersionManager 的 sync 逻辑
      manager.syncVersions(value);
      break;

    case 'validate':
      manager.validateVersions();
      break;

    case 'current':
      const config = manager.readConfig();
      console.log(`📦 当前项目版本: ${config.version}`);
      break;

    case 'help':
    default:
      showHelp();
      break;
  }
}

function showHelp() {
  console.log(`
🚀 ADMT 管理工具用法:

  node admt update <version>    - 统一同步更新所有文件的版本号
  node admt validate           - 验证各文件版本一致性状态
  node admt current            - 查看当前版本信息
  node admt help               - 显示此帮助信息

示例:
  node admt update 1.3.1
  node admt validate
	`);
}

main().catch(error => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});
