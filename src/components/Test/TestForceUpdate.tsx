import React from 'react';
import StartupVersionChecker from '../Common/StartupVersionChecker';
import { VersionCheckResult } from '../../services/versionServiceAdapter';

const TestForceUpdate: React.FC = () => {
  // 模拟需要强制更新的版本检查结果
  const mockUpdateResult: VersionCheckResult = {
    hasUpdate: true,
    needsUpdate: true,
    currentVersion: '1.1.0',
    localVersion: '1.0.0',
    latestVersion: '1.1.0',
    isForceUpdate: true,
    message: '发现新版本 1.1.0',
    versionInfo: {
      version: '1.1.0',
      downloadUrl: 'https://admt.lacs.cc/',
      releaseNotes: '• 修复了一些已知问题\n• 优化了用户界面\n• 提升了性能和稳定性\n• 新增了强制更新功能',
      forceUpdate: true,
      publishedAt: new Date().toISOString()
    }
  };

  const handleCheckComplete = (needsUpdate: boolean, result?: VersionCheckResult) => {
    console.log('测试 - 版本检查完成:', { needsUpdate, result });
  };

  const handleAllowOfflineUse = () => {
    console.log('测试 - 允许离线使用');
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <StartupVersionChecker
        checkResult={mockUpdateResult}
        onCheckComplete={handleCheckComplete}
        onAllowOfflineUse={handleAllowOfflineUse}
      />
    </div>
  );
};

export default TestForceUpdate;