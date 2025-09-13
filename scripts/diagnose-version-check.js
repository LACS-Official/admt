/**
 * 版本检查诊断脚本
 * 用于诊断版本检查功能在不同环境下的表现差异
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 版本检查诊断工具');
console.log('='.repeat(50));

// 检查配置文件
function checkConfigFiles() {
  console.log('\n📁 检查配置文件...');
  
  const configFiles = [
    'src/config/api.ts',
    'src/services/tauriHttpService.ts',
    'src/services/versionService.ts',
    'src-tauri/tauri.conf.json',
    'src-tauri/capabilities/default.json'
  ];
  
  configFiles.forEach(file => {
    const filePath = path.join(path.dirname(__dirname), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} - 存在`);
    } else {
      console.log(`❌ ${file} - 不存在`);
    }
  });
}

// 检查API配置
function checkApiConfig() {
  console.log('\n🔧 检查API配置...');
  
  try {
    const apiConfigPath = path.join(path.dirname(__dirname), 'src/config/api.ts');
    const apiConfigContent = fs.readFileSync(apiConfigPath, 'utf8');
    
    // 检查关键配置
    const checks = [
      { key: 'BASE_URL', pattern: /BASE_URL.*https:\/\/api-g\.lacs\.cc/, desc: 'API基础URL' },
      { key: 'SOFTWARE_ID', pattern: /SOFTWARE_ID.*\d+/, desc: '软件ID配置' },
      { key: 'TIMEOUT', pattern: /TIMEOUT.*\d+/, desc: '超时配置' }
    ];
    
    checks.forEach(check => {
      if (check.pattern.test(apiConfigContent)) {
        console.log(`✅ ${check.desc} - 配置正确`);
      } else {
        console.log(`⚠️ ${check.desc} - 可能有问题`);
      }
    });
    
  } catch (error) {
    console.log(`❌ 无法读取API配置: ${error.message}`);
  }
}

// 检查服务文件的修改
function checkServiceModifications() {
  console.log('\n🔄 检查服务文件修改...');
  
  const serviceFiles = [
    { file: 'src/services/versionService.ts', shouldContain: 'tauriHttpService' },
    { file: 'src/services/unifiedVersionService.ts', shouldContain: 'tauriHttpService' },
    { file: 'src/services/smartVersionService.ts', shouldContain: 'tauriHttpService' },
    { file: 'src/services/debugVersionService.ts', shouldContain: 'tauriHttpService' }
  ];
  
  serviceFiles.forEach(({ file, shouldContain }) => {
    try {
      const filePath = path.join(path.dirname(__dirname), file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes(shouldContain)) {
        console.log(`✅ ${file} - 已更新使用${shouldContain}`);
        
        // 检查是否还有原生fetch
        if (content.includes('await fetch(')) {
          console.log(`⚠️ ${file} - 仍包含原生fetch调用`);
        }
      } else {
        console.log(`❌ ${file} - 未找到${shouldContain}引用`);
      }
    } catch (error) {
      console.log(`❌ ${file} - 无法读取: ${error.message}`);
    }
  });
}

// 检查权限配置
function checkPermissions() {
  console.log('\n🔐 检查权限配置...');
  
  try {
    // 检查Tauri配置
    const tauriConfigPath = path.join(path.dirname(__dirname), 'src-tauri/tauri.conf.json');
    const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
    
    // 检查CSP配置
    if (tauriConfig.tauri?.security?.csp) {
      const csp = tauriConfig.tauri.security.csp;
      if (csp.includes('https://api-g.lacs.cc')) {
        console.log('✅ CSP配置包含API域名');
      } else {
        console.log('⚠️ CSP配置可能不包含API域名');
      }
    }
    
    // 检查capabilities
    const capabilitiesPath = path.join(path.dirname(__dirname), 'src-tauri/capabilities/default.json');
    const capabilities = JSON.parse(fs.readFileSync(capabilitiesPath, 'utf8'));
    
    if (capabilities.permissions && capabilities.permissions.some(p => 
      p.identifier === 'http:default' && 
      p.allow && 
      p.allow.some(a => a.url && a.url.includes('api-g.lacs.cc'))
    )) {
      console.log('✅ HTTP权限配置正确');
    } else {
      console.log('⚠️ HTTP权限配置可能有问题');
    }
    
  } catch (error) {
    console.log(`❌ 权限配置检查失败: ${error.message}`);
  }
}

// 生成诊断报告
function generateDiagnosticReport() {
  console.log('\n📋 生成诊断报告...');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    checks: {
      configFiles: '已检查',
      apiConfig: '已检查',
      serviceModifications: '已检查',
      permissions: '已检查'
    },
    recommendations: [
      '确保所有版本检查服务都使用tauriHttpService而不是原生fetch',
      '验证API配置中的BASE_URL和SOFTWARE_ID设置正确',
      '检查Tauri权限配置允许访问api-g.lacs.cc域名',
      '在开发和发布环境中测试版本检查功能'
    ]
  };
  
  const reportPath = path.join(path.dirname(__dirname), 'version-check-diagnostic-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 诊断报告已保存到: ${reportPath}`);
}

// 主函数
function main() {
  try {
    checkConfigFiles();
    checkApiConfig();
    checkServiceModifications();
    checkPermissions();
    generateDiagnosticReport();
    
    console.log('\n🎉 诊断完成！');
    console.log('\n建议：');
    console.log('1. 在开发环境测试版本检查功能');
    console.log('2. 构建发布版本并测试版本检查功能');
    console.log('3. 对比两个环境的行为差异');
    console.log('4. 如有问题，查看诊断报告获取详细信息');
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行诊断
main();