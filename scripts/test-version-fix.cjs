/**
 * 测试版本检查修复效果
 * 验证能否正确处理新的API响应格式
 */

console.log('🧪 测试版本检查修复效果...\n');

// 模拟实际的API响应
const mockApiResponse = {
  "success": true,
  "data": [
    {
      "id": 17,
      "version": "1.0.1",
      "releaseDate": "2025-09-06T15:40:58.500Z",
      "releaseNotes": "666",
      "downloadLinks": {
        "official": "https://admt.lacs.cc/"
      },
      "isStable": true,
      "versionType": "release"
    },
    {
      "id": 10,
      "version": "1.0.0",
      "releaseDate": "2025-08-21T05:42:50.600Z",
      "releaseNotes": "66",
      "downloadLinks": {
        "official": "https://admt.lacs.cc/"
      },
      "isStable": true,
      "versionType": "release"
    }
  ],
  "meta": {
    "software": {
      "currentVersion": "1.0.1",
      "name": "玩机管家",
      "officialWebsite": "https://admt.lacs.cc"
    }
  }
};

// 模拟版本信息转换逻辑
function convertApiResponseToVersionInfo(apiResponse) {
  console.log('📥 处理API响应...');
  
  if (!apiResponse.success || !apiResponse.data) {
    throw new Error('API响应格式错误');
  }
  
  const { data: versionsArray } = apiResponse;
  console.log(`📦 版本数组长度: ${versionsArray.length}`);
  
  if (!Array.isArray(versionsArray) || versionsArray.length === 0) {
    throw new Error('API响应中没有版本数据');
  }
  
  const latestVersionData = versionsArray[0]; // 第一个是最新版本
  console.log(`📦 最新版本数据:`, latestVersionData);
  
  // 转换为标准格式
  const versionInfo = {
    version: latestVersionData.version,
    downloadUrl: latestVersionData.downloadLinks?.official || apiResponse.meta?.software?.officialWebsite || 'https://admt.lacs.cc/',
    releaseNotes: latestVersionData.releaseNotes || '版本更新',
    forceUpdate: false, // API中没有此字段，默认为false
    publishedAt: latestVersionData.releaseDate || new Date().toISOString()
  };
  
  console.log(`📦 转换后的版本信息:`, versionInfo);
  return versionInfo;
}

// 模拟版本比较逻辑
function compareVersions(current, latest) {
  console.log(`🔄 版本比较: "${current}" vs "${latest}"`);
  
  const parseVersion = (version) => {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/);
    if (!match) throw new Error(`版本解析失败: ${version}`);
    
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10)
    };
  };

  const currentVer = parseVersion(current);
  const latestVer = parseVersion(latest);

  if (currentVer.major !== latestVer.major) {
    return currentVer.major < latestVer.major ? -1 : 1;
  }
  if (currentVer.minor !== latestVer.minor) {
    return currentVer.minor < latestVer.minor ? -1 : 1;
  }
  if (currentVer.patch !== latestVer.patch) {
    return currentVer.patch < latestVer.patch ? -1 : 1;
  }
  return 0;
}

// 执行测试
try {
  console.log('🎯 测试场景: 本地1.0.0 vs 云端1.0.1');
  console.log('=' .repeat(50));
  
  // 1. 转换API响应
  const versionInfo = convertApiResponseToVersionInfo(mockApiResponse);
  
  // 2. 验证转换结果
  console.log('\n✅ API响应转换成功!');
  console.log('- 版本号:', versionInfo.version);
  console.log('- 下载链接:', versionInfo.downloadUrl);
  console.log('- 发布说明:', versionInfo.releaseNotes);
  console.log('- 强制更新:', versionInfo.forceUpdate);
  console.log('- 发布时间:', versionInfo.publishedAt);
  
  // 3. 测试版本比较
  const currentVersion = '1.0.0';
  const comparison = compareVersions(currentVersion, versionInfo.version);
  const hasUpdate = comparison < 0;
  
  console.log('\n🔍 版本比较结果:');
  console.log('- 当前版本:', currentVersion);
  console.log('- 最新版本:', versionInfo.version);
  console.log('- 比较结果:', comparison);
  console.log('- 需要更新:', hasUpdate);
  
  // 4. 验证修复效果
  if (hasUpdate && versionInfo.version === '1.0.1') {
    console.log('\n🎉 修复成功！');
    console.log('✅ 正确识别1.0.0需要更新到1.0.1');
    console.log('✅ API响应格式处理正确');
    console.log('✅ 版本比较逻辑正常');
  } else {
    console.log('\n❌ 修复失败！');
    console.log('- hasUpdate:', hasUpdate);
    console.log('- versionInfo.version:', versionInfo.version);
  }
  
} catch (error) {
  console.error('\n❌ 测试失败:', error.message);
}

console.log('\n🏁 测试完成！');