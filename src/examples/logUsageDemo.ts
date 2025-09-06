/**
 * 增强日志系统使用示例
 * 展示如何在应用的不同场景中使用结构化日志记录
 */

import { enhancedLogService } from '../services/enhancedLogService';
import { firmwareFlashService } from '../services/firmwareFlashService';

/**
 * 设备管理场景示例
 */
export class DeviceManagementDemo {
  
  /**
   * 模拟设备连接事件
   */
  static simulateDeviceConnection() {
    // 记录设备连接事件
    enhancedLogService.logDeviceEvent({
      type: 'connected',
      deviceId: 'ABC123456789',
      deviceModel: 'Xiaomi 13 Pro',
      currentMode: 'sys',
      timestamp: new Date().toISOString(),
      details: {
        brand: 'Xiaomi',
        androidVersion: '14',
        buildNumber: 'UKQ1.230804.001',
        connectionType: 'ADB',
        usbVersion: '3.0'
      }
    });
  }

  /**
   * 模拟设备模式变更
   */
  static simulateDeviceModeChange() {
    enhancedLogService.logDeviceEvent({
      type: 'mode_changed',
      deviceId: 'ABC123456789',
      deviceModel: 'Xiaomi 13 Pro',
      previousMode: 'sys',
      currentMode: 'fastboot',
      timestamp: new Date().toISOString(),
      details: {
        reason: 'user_initiated_reboot',
        command: 'adb reboot bootloader'
      }
    });
  }

  /**
   * 模拟设备错误
   */
  static simulateDeviceError() {
    enhancedLogService.logDeviceEvent({
      type: 'error',
      deviceId: 'ABC123456789',
      deviceModel: 'Xiaomi 13 Pro',
      timestamp: new Date().toISOString(),
      details: {
        errorType: 'unauthorized',
        errorMessage: 'device unauthorized. Please check the confirmation dialog on your device.',
        suggestedAction: 'enable_usb_debugging'
      }
    });
  }
}

/**
 * 固件刷写场景示例
 */
export class FirmwareFlashDemo {
  
  /**
   * 模拟完整的固件刷写流程
   */
  static async simulateCompleteFlashProcess() {
    const deviceId = 'ABC123456789';
    const firmwareFile = 'miui_14.0.6_recovery.img';
    
    try {
      // 1. 开始刷写
      const operationId = await firmwareFlashService.startFlash(deviceId, firmwareFile);
      
      // 2. 模拟进度更新
      const stages = [
        { progress: 10, stage: '准备刷写环境' },
        { progress: 25, stage: '传输固件文件' },
        { progress: 50, stage: '刷写到设备' },
        { progress: 75, stage: '验证固件完整性' },
        { progress: 90, stage: '重启设备' },
        { progress: 100, stage: '刷写完成' }
      ];
      
      for (const { progress, stage } of stages) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟延时
        firmwareFlashService.updateProgress(operationId, progress, stage);
        
        if (progress === 75) {
          firmwareFlashService.startVerification(operationId, 'MD5校验');
        }
      }
      
      // 3. 完成刷写
      const result = firmwareFlashService.completeFlash(operationId);
      console.log('刷写结果:', result);
      
    } catch (error) {
      console.error('刷写过程出错:', error);
    }
  }

  /**
   * 模拟刷写失败场景
   */
  static async simulateFlashFailure() {
    const deviceId = 'DEF987654321';
    const firmwareFile = 'corrupted_firmware.img';
    
    try {
      const operationId = await firmwareFlashService.startFlash(deviceId, firmwareFile);
      
      // 模拟进行到一半失败
      firmwareFlashService.updateProgress(operationId, 30, '传输固件文件');
      
      // 模拟失败
      const result = firmwareFlashService.failFlash(
        operationId,
        '固件文件校验失败，可能已损坏',
        'FIRMWARE_CORRUPTED'
      );
      
      console.log('刷写失败结果:', result);
      
    } catch (error) {
      console.error('刷写失败处理出错:', error);
    }
  }
}

/**
 * 系统错误处理示例
 */
export class SystemErrorDemo {
  
  /**
   * 模拟不同级别的系统错误
   */
  static simulateSystemErrors() {
    // 警告级别
    enhancedLogService.logWarning(
      '设备存储空间不足',
      'StorageManager',
      {
        deviceId: 'ABC123456789',
        availableSpace: '500MB',
        requiredSpace: '2GB',
        storageType: 'internal'
      }
    );

    // 错误级别
    enhancedLogService.logError(
      'ADB连接超时',
      'ADBManager',
      {
        deviceId: 'ABC123456789',
        timeout: 30000,
        retryCount: 3,
        lastCommand: 'shell getprop'
      },
      'ADB_TIMEOUT',
      new Error('Connection timeout after 30 seconds')
    );

    // 致命错误级别
    enhancedLogService.logFatal(
      '系统核心服务崩溃',
      'CoreService',
      {
        serviceName: 'DeviceManager',
        crashReason: 'OutOfMemoryError',
        affectedFeatures: ['device_scanning', 'file_transfer']
      },
      new Error('Java heap space')
    );
  }
}

/**
 * 用户操作追踪示例
 */
export class UserActionDemo {
  
  /**
   * 模拟用户操作记录
   */
  static simulateUserActions() {
    // 应用安装
    enhancedLogService.logUserAction(
      '安装APK应用',
      'AppManager',
      {
        deviceId: 'ABC123456789',
        apkFile: 'example_app_v1.2.3.apk',
        packageName: 'com.example.app',
        installMethod: 'adb_install',
        replaceExisting: true
      }
    );

    // 文件传输
    enhancedLogService.logUserAction(
      '传输文件到设备',
      'FileManager',
      {
        deviceId: 'ABC123456789',
        sourceFile: 'C:\\Users\\Admin\\Documents\\photo.jpg',
        targetPath: '/sdcard/Pictures/photo.jpg',
        fileSize: 2048576,
        transferMethod: 'adb_push'
      }
    );

    // 设备重启
    enhancedLogService.logUserAction(
      '重启设备',
      'DeviceController',
      {
        deviceId: 'ABC123456789',
        rebootMode: 'recovery',
        reason: 'user_requested'
      }
    );
  }
}

/**
 * 网络请求记录示例
 */
export class NetworkDemo {
  
  /**
   * 模拟网络请求记录
   */
  static simulateNetworkRequests() {
    // 成功的API请求
    enhancedLogService.logNetworkRequest(
      'https://api.example.com/device/info',
      'GET',
      200,
      'DeviceInfoService',
      {
        responseTime: 245,
        dataSize: 1024,
        userAgent: 'ADMT/1.0.0'
      }
    );

    // 失败的下载请求
    enhancedLogService.logNetworkRequest(
      'https://download.example.com/firmware.zip',
      'GET',
      404,
      'DownloadService',
      {
        responseTime: 1200,
        errorMessage: 'File not found',
        retryAttempt: 2
      }
    );

    // 超时的请求
    enhancedLogService.logNetworkRequest(
      'https://slow-api.example.com/data',
      'POST',
      408,
      'DataSyncService',
      {
        timeout: 30000,
        requestSize: 4096,
        errorMessage: 'Request timeout'
      }
    );
  }
}

/**
 * 安全事件记录示例
 */
export class SecurityDemo {
  
  /**
   * 模拟安全事件记录
   */
  static simulateSecurityEvents() {
    // 未授权访问尝试
    enhancedLogService.logSecurityEvent(
      '检测到未授权的ADB连接尝试',
      'SecurityMonitor',
      {
        sourceIP: '192.168.1.100',
        deviceId: 'ABC123456789',
        attemptCount: 3,
        blocked: true
      }
    );

    // 可疑文件检测
    enhancedLogService.logSecurityEvent(
      '检测到可疑APK文件',
      'MalwareScanner',
      {
        fileName: 'suspicious_app.apk',
        filePath: 'C:\\Downloads\\suspicious_app.apk',
        threatLevel: 'medium',
        scanResult: 'potential_malware'
      }
    );

    // 权限提升请求
    enhancedLogService.logSecurityEvent(
      '应用请求提升权限',
      'PermissionManager',
      {
        requestedPermission: 'android.permission.WRITE_SECURE_SETTINGS',
        deviceId: 'ABC123456789',
        granted: false,
        reason: 'user_denied'
      }
    );
  }
}

/**
 * 运行所有演示
 */
export async function runAllDemos() {
  console.log('🚀 开始运行增强日志系统演示...');
  
  // 设备管理演示
  console.log('📱 设备管理演示');
  DeviceManagementDemo.simulateDeviceConnection();
  DeviceManagementDemo.simulateDeviceModeChange();
  DeviceManagementDemo.simulateDeviceError();
  
  // 固件刷写演示
  console.log('💾 固件刷写演示');
  await FirmwareFlashDemo.simulateCompleteFlashProcess();
  await FirmwareFlashDemo.simulateFlashFailure();
  
  // 系统错误演示
  console.log('⚠️ 系统错误演示');
  SystemErrorDemo.simulateSystemErrors();
  
  // 用户操作演示
  console.log('👤 用户操作演示');
  UserActionDemo.simulateUserActions();
  
  // 网络请求演示
  console.log('🌐 网络请求演示');
  NetworkDemo.simulateNetworkRequests();
  
  // 安全事件演示
  console.log('🔒 安全事件演示');
  SecurityDemo.simulateSecurityEvents();
  
  console.log('✅ 所有演示完成！请查看日志面板以查看记录的事件。');
}