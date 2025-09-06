/**
 * 增强日志服务测试
 * 用于验证日志系统是否正常工作
 */

import { enhancedLogService } from './enhancedLogService';

export const testEnhancedLogService = () => {
  console.log('开始测试增强日志服务...');
  
  try {
    // 测试基本日志记录
    enhancedLogService.logInfo('测试信息日志', 'LogTest');
    enhancedLogService.logWarning('测试警告日志', 'LogTest');
    enhancedLogService.logError('测试错误日志', 'LogTest');
    
    // 测试设备事件记录
    enhancedLogService.logDeviceEvent({
      type: 'connected',
      deviceId: 'test-device-001',
      deviceModel: 'Test Device',
      timestamp: new Date().toISOString(),
      details: {
        serialNumber: 'TEST123456',
        mode: 'system'
      }
    });
    
    // 测试固件刷写事件记录
    enhancedLogService.logFirmwareFlashEvent({
      type: 'started',
      operationId: 'flash-test-001',
      deviceId: 'test-device-001',
      firmwareFile: 'test-firmware-v1.0.0.bin',
      stage: 'initialization',
      timestamp: new Date().toISOString()
    });
    
    // 获取日志统计
    const stats = enhancedLogService.getLogStats();
    console.log('日志统计:', stats);
    
    // 获取最近的日志
    const recentLogs = enhancedLogService.getLogs({ level: 'info' });
    console.log('最近的日志:', recentLogs);
    
    console.log('增强日志服务测试完成！');
    return true;
  } catch (error) {
    console.error('增强日志服务测试失败:', error);
    return false;
  }
};

// 如果在开发环境中，自动运行测试
if (import.meta.env?.DEV) {
  setTimeout(() => {
    testEnhancedLogService();
  }, 200);
}