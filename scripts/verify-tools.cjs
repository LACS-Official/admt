const fs = require('fs');
const path = require('path');

/**
 * 工具验证脚本
 * 验证构建前所有必要工具文件是否存在且完整
 */

const requiredTools = [
  // ADB工具
  {
    path: 'src-tauri/tools/adb/adb.exe',
    name: 'ADB',
    description: 'Android Debug Bridge executable'
  },
  {
    path: 'src-tauri/tools/adb/fastboot.exe',
    name: 'Fastboot',
    description: 'Android Fastboot executable'
  },
  {
    path: 'src-tauri/tools/adb/AdbWinApi.dll',
    name: 'ADB Win API',
    description: 'ADB Windows API Library'
  },
  {
    path: 'src-tauri/tools/adb/AdbWinUsbApi.dll',
    name: 'ADB Win USB API',
    description: 'ADB Windows USB API Library'
  },
  // SCRCPYs工具
  {
    path: 'src-tauri/tools/scrcpy-win32-v3.3.1',
    name: 'SCRCPY Directory',
    description: 'Screen mirroring tool directory',
    isDirectory: true
  },
  // LACS工具
  {
    path: 'src-tauri/tools/lacs',
    name: 'LACS Directory', 
    description: 'LACS USB tools directory',
    isDirectory: true
  }
];

function verifyTools() {
  console.log('🔍 Starting tools verification...\n');
  
  const missing = [];
  const found = [];
  
  for (const tool of requiredTools) {
    const fullPath = path.join(process.cwd(), tool.path);
    const exists = tool.isDirectory ? 
      fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory() :
      fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile();
    
    if (exists) {
      if (tool.isDirectory) {
        const items = fs.readdirSync(fullPath);
        console.log(`✅ ${tool.name}: ${fullPath} (${items.length} items)`);
      } else {
        const stats = fs.statSync(fullPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`✅ ${tool.name}: ${fullPath} (${sizeMB} MB)`);
      }
      found.push(tool);
    } else {
      console.log(`❌ ${tool.name}: ${fullPath} - NOT FOUND`);
      missing.push(tool);
    }
  }
  
  console.log(`\n📊 Verification Summary:`);
  console.log(`   Found: ${found.length}/${requiredTools.length} tools`);
  console.log(`   Missing: ${missing.length} tools\n`);
  
  if (missing.length > 0) {
    console.error('🚨 Missing required tool files:');
    missing.forEach(tool => {
      console.error(`   - ${tool.name}: ${tool.path}`);
      console.error(`     Description: ${tool.description}`);
    });
    console.error('\n💡 Please ensure all tools are properly placed in the src-tauri/tools/ directory');
    console.error('   ADB tools should be in: src-tauri/tools/adb/');
    console.error('   SCRCPY should be in: src-tauri/tools/scrcpy-win32-v3.3.1/');
    console.error('   LACS tools should be in: src-tauri/tools/lacs/');
    
    process.exit(1);
  }
  
  console.log('✅ All required tools are present and ready for build!');
  
  // 验证工具路径在Tauri配置中的配置
  verifyTauriConfig();
}

function verifyTauriConfig() {
  console.log('\n🔧 Verifying Tauri configuration...');
  
  const configPath = path.join(process.cwd(), 'src-tauri', 'tauri.conf.json');
  
  if (!fs.existsSync(configPath)) {
    console.error('❌ Tauri configuration file not found');
    process.exit(1);
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const bundle = config.bundle;
    
    if (!bundle) {
      console.error('❌ Bundle configuration not found in tauri.conf.json');
      process.exit(1);
    }
    
    // 检查resources配置
    const resources = bundle.resources || [];
    const expectedResources = ['tools', 'tools/adb', 'tools/scrcpy-win32-v3.3.1', 'tools/lacs'];
    
    console.log('📦 Bundle resources configuration:');
    resources.forEach(resource => {
      console.log(`   - ${resource}`);
    });
    
    const missingResources = expectedResources.filter(expected => 
      !resources.includes(expected)
    );
    
    if (missingResources.length > 0) {
      console.warn('⚠️  Some expected resources not found in bundle.resources:');
      missingResources.forEach(resource => {
        console.warn(`   - ${resource}`);
      });
    }
    
    // 检查externalBin配置
    const externalBin = bundle.externalBin || [];
    const expectedBin = ['tools/adb/adb', 'tools/adb/fastboot'];
    
    console.log('\n🔧 External binaries configuration:');
    externalBin.forEach(bin => {
      console.log(`   - ${bin}`);
    });
    
    const missingBin = expectedBin.filter(expected => 
      !externalBin.includes(expected)
    );
    
    if (missingBin.length > 0) {
      console.warn('⚠️  Some expected binaries not found in bundle.externalBin:');
      missingBin.forEach(bin => {
        console.warn(`   - ${bin}`);
      });
    }
    
    console.log('✅ Tauri configuration verification complete');
    
  } catch (error) {
    console.error('❌ Failed to parse Tauri configuration:', error.message);
    process.exit(1);
  }
}

// 主函数
function main() {
  console.log('🎯 ADMT Tools Verification Script');
  console.log('================================\n');
  
  try {
    verifyTools();
  } catch (error) {
    console.error('💥 Verification failed with error:', error.message);
    process.exit(1);
  }
}

// 直接运行时执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  verifyTools,
  verifyTauriConfig,
  requiredTools
};