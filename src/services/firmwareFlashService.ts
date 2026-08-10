import { enhancedLogService } from './enhancedLogService';
import { FirmwareFlashEvent } from './logTypes';

export interface FlashProgress {
  operationId: string;
  deviceId: string;
  stage: string;
  progress: number;
  message: string;
}

export interface FlashResult {
  success: boolean;
  operationId: string;
  deviceId: string;
  message: string;
  errorCode?: string;
  duration?: number;
}

export class FirmwareFlashService {
  private activeOperations = new Map<string, {
    deviceId: string;
    firmwareFile: string;
    startTime: Date;
    stages: string[];
    currentStage: number;
  }>();

  /**
   * 开始固件刷写操作
   */
  async startFlash(deviceId: string, firmwareFile: string): Promise<string> {
    const operationId = this.generateOperationId();
    
    try {
      // 记录操作开始
      this.activeOperations.set(operationId, {
        deviceId,
        firmwareFile,
        startTime: new Date(),
        stages: ['准备', '传输', '刷写', '验证', '重启'],
        currentStage: 0
      });

      // 记录刷写开始事件
      enhancedLogService.logFirmwareFlashEvent({
        type: 'started',
        operationId,
        deviceId,
        firmwareFile,
        timestamp: new Date().toISOString()
      });

      // 记录用户操作
      enhancedLogService.logUserAction(
        `开始固件刷写: ${firmwareFile}`,
        "FirmwareFlashService",
        {
          operationId,
          deviceId,
          firmwareFile,
          fileSize: await this.getFileSize(firmwareFile)
        }
      );

      return operationId;
    } catch (error) {
      enhancedLogService.logError(
        `启动固件刷写失败: ${firmwareFile}`,
        "FirmwareFlashService",
        { deviceId, firmwareFile },
        'FLASH_START_FAILED',
        error as Error
      );
      throw error;
    }
  }

  /**
   * 更新刷写进度
   */
  updateProgress(operationId: string, progress: number, stage?: string): void {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      enhancedLogService.logWarning(
        `尝试更新不存在的操作进度: ${operationId}`,
        "FirmwareFlashService",
        { operationId, progress, stage }
      );
      return;
    }

    const currentStage = stage || operation.stages[operation.currentStage] || '未知阶段';

    // 记录进度事件（仅在关键进度点记录，避免日志过多）
    if (progress % 10 === 0 || progress === 100) {
      enhancedLogService.logFirmwareFlashEvent({
        type: 'progress',
        operationId,
        deviceId: operation.deviceId,
        firmwareFile: operation.firmwareFile,
        progress,
        stage: currentStage,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 进入验证阶段
   */
  startVerification(operationId: string, verificationType: string): void {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    enhancedLogService.logFirmwareFlashEvent({
      type: 'verification',
      operationId,
      deviceId: operation.deviceId,
      firmwareFile: operation.firmwareFile,
      stage: `验证: ${verificationType}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 完成刷写操作
   */
  completeFlash(operationId: string): FlashResult {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      const errorMsg = `尝试完成不存在的操作: ${operationId}`;
      enhancedLogService.logError(
        errorMsg,
        "FirmwareFlashService",
        { operationId },
        'OPERATION_NOT_FOUND'
      );
      return {
        success: false,
        operationId,
        deviceId: 'unknown',
        message: errorMsg,
        errorCode: 'OPERATION_NOT_FOUND'
      };
    }

    const duration = Date.now() - operation.startTime.getTime();

    try {
      // 记录刷写完成事件
      enhancedLogService.logFirmwareFlashEvent({
        type: 'completed',
        operationId,
        deviceId: operation.deviceId,
        firmwareFile: operation.firmwareFile,
        timestamp: new Date().toISOString()
      });

      // 记录成功信息
      enhancedLogService.logInfo(
        `固件刷写成功完成: ${operation.firmwareFile}`,
        "FirmwareFlashService",
        {
          operationId,
          deviceId: operation.deviceId,
          duration: Math.round(duration / 1000),
          firmwareFile: operation.firmwareFile
        }
      );

      // 清理操作记录
      this.activeOperations.delete(operationId);

      return {
        success: true,
        operationId,
        deviceId: operation.deviceId,
        message: '固件刷写成功完成',
        duration: Math.round(duration / 1000)
      };
    } catch (error) {
      enhancedLogService.logError(
        `完成固件刷写时发生错误: ${operation.firmwareFile}`,
        "FirmwareFlashService",
        { operationId, deviceId: operation.deviceId },
        'FLASH_COMPLETION_ERROR',
        error as Error
      );
      throw error;
    }
  }

  /**
   * 刷写失败处理
   */
  failFlash(operationId: string, errorMessage: string, errorCode?: string): FlashResult {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      enhancedLogService.logError(
        `尝试标记不存在的操作为失败: ${operationId}`,
        "FirmwareFlashService",
        { operationId, errorMessage, errorCode },
        'OPERATION_NOT_FOUND'
      );
      return {
        success: false,
        operationId,
        deviceId: 'unknown',
        message: errorMessage,
        errorCode: errorCode || 'OPERATION_NOT_FOUND'
      };
    }

    const duration = Date.now() - operation.startTime.getTime();

    // 记录刷写失败事件
    enhancedLogService.logFirmwareFlashEvent({
      type: 'failed',
      operationId,
      deviceId: operation.deviceId,
      firmwareFile: operation.firmwareFile,
      errorCode,
      errorMessage,
      timestamp: new Date().toISOString()
    });

    // 记录详细错误信息
    enhancedLogService.logError(
      `固件刷写失败: ${operation.firmwareFile} - ${errorMessage}`,
      "FirmwareFlashService",
      {
        operationId,
        deviceId: operation.deviceId,
        duration: Math.round(duration / 1000),
        firmwareFile: operation.firmwareFile,
        failureStage: operation.stages[operation.currentStage] || '未知阶段'
      },
      errorCode || 'FLASH_FAILED'
    );

    // 清理操作记录
    this.activeOperations.delete(operationId);

    return {
      success: false,
      operationId,
      deviceId: operation.deviceId,
      message: errorMessage,
      errorCode: errorCode || 'FLASH_FAILED',
      duration: Math.round(duration / 1000)
    };
  }

  /**
   * 取消刷写操作
   */
  cancelFlash(operationId: string): void {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    enhancedLogService.logUserAction(
      `取消固件刷写: ${operation.firmwareFile}`,
      "FirmwareFlashService",
      {
        operationId,
        deviceId: operation.deviceId,
        duration: Math.round((Date.now() - operation.startTime.getTime()) / 1000)
      }
    );

    this.activeOperations.delete(operationId);
  }

  /**
   * 获取活跃操作列表
   */
  getActiveOperations(): Array<{
    operationId: string;
    deviceId: string;
    firmwareFile: string;
    startTime: Date;
    duration: number;
  }> {
    const now = Date.now();
    return Array.from(this.activeOperations.entries()).map(([operationId, operation]) => ({
      operationId,
      deviceId: operation.deviceId,
      firmwareFile: operation.firmwareFile,
      startTime: operation.startTime,
      duration: Math.round((now - operation.startTime.getTime()) / 1000)
    }));
  }

  private generateOperationId(): string {
    return `flash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      // 这里应该调用实际的文件大小获取API
      // 暂时返回模拟值
      return Math.floor(Math.random() * 1000000000); // 随机文件大小
    } catch (error) {
      enhancedLogService.logWarning(
        `获取文件大小失败: ${filePath}`,
        "FirmwareFlashService",
        { filePath },
      );
      return 0;
    }
  }
}

// 创建全局固件刷写服务实例
export const firmwareFlashService = new FirmwareFlashService();