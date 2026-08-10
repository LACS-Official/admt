import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef } from "react";
import { useDeviceStore } from "../stores/deviceStore";
import { useAppStore } from "../stores/appStore";
import { DeviceInfo, DeviceProperties, CommandResult, InstalledApp, ApkInfo, BatchOperation, DeviceFile } from "../types/device";
import { logService } from "./logService";
import { enhancedLogService } from "./enhancedLogService";
import { deviceConnectionTrackingService } from "./deviceConnectionTrackingService";
import { generateDeviceUniqueIdFromProperties } from "../utils/deviceIdentification";
import { adbToolsManager } from "./adbToolsManager";

export class DeviceService {
  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private isScanning = false;
  private connectedDevices = new Map<string, { connectedAt: Date; properties?: DeviceProperties }>();
  private adbInitialized = false;
  private initialScanDone = false; // 确保启动前连接提示只出现一次
  private pendingScanTimeout: ReturnType<typeof setTimeout> | null = null;
  
  public isScanningNow(): boolean {
    return this.isScanning;
  }

  /**
   * 初始化ADB工具路径
   */
  async initializeAdbTools(): Promise<void> {
    if (this.adbInitialized) {
      return;
    }

    try {
      await adbToolsManager.initialize();
      this.adbInitialized = true;
      await logService.info('ADB工具初始化成功', '设备服务');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      await logService.error(`ADB工具初始化失败: ${errorMsg}`, '设备服务');
      throw new Error(`ADB工具初始化失败: ${errorMsg}`);
    }
  }

  /**
   * 检查ADB工具是否可用
   */
  async checkAdbAvailability(): Promise<boolean> {
    try {
      return await adbToolsManager.checkAvailability();
    } catch (error) {
      await logService.error(`ADB工具可用性检查失败: ${error}`, '设备服务');
      return false;
    }
  }

  /**
   * 获取ADB工具状态报告
   */
  async getAdbStatusReport() {
    return await adbToolsManager.getStatusReport();
  }

  async scanDevices(): Promise<DeviceInfo[]> {
    return await adbToolsManager.executeWithFallback(async () => {
      try {
        const devices = await invoke<DeviceInfo[]>("scan_devices");

        // 处理设备连接/断开统计
        await this.handleDeviceConnectionChanges(devices);

        return devices;
      } catch (error) {
        console.error("Failed to scan devices:", error);
        throw error;
      }
    });
  }

  async getDeviceInfo(serial: string): Promise<DeviceInfo> {
    try {
      const device = await invoke<DeviceInfo>("get_device_info", { serial });
      return device;
    } catch (error) {
      console.error("Failed to get device info:", error);
      throw error;
    }
  }

  async getDeviceProperties(serial: string): Promise<DeviceProperties> {
    try {
      const properties = await invoke<DeviceProperties>("get_device_properties", { serial });
      return properties;
    } catch (error) {
      console.error("Failed to get device properties:", error);
      throw error;
    }
  }

  async executeAdbCommand(
    serial: string,
    command: string,
    args: string[] = [],
    timeout?: number
  ): Promise<CommandResult> {
    return await adbToolsManager.executeWithFallback(async () => {
      try {
        const result = await invoke<CommandResult>("execute_adb_command_with_path", {
          adbPath: adbToolsManager.getAdbPath(),
          serial,
          command,
          args,
          timeout,
        });
        return result;
      } catch (error) {
        console.error("Failed to execute ADB command:", error);
        throw error;
      }
    });
  }

  async rebootDevice(serial: string, mode: string): Promise<CommandResult> {
    return await adbToolsManager.executeWithFallback(async () => {
      try {
        const result = await invoke<CommandResult>("reboot_device", {
          serial,
          mode,
        });
        return result;
      } catch (error) {
        console.error("Failed to reboot device:", error);
        throw error;
      }
    });
  }

  async installApk(serial: string, apkPath: string, replace = false): Promise<CommandResult> {
    return await adbToolsManager.executeWithFallback(async () => {
      try {
        const result = await invoke<CommandResult>("install_apk", {
          serial,
          apkPath,
          replace,
        });
        return result;
      } catch (error) {
        console.error("Failed to install APK:", error);
        throw error;
      }
    });
  }

  async pushFile(serial: string, localPath: string, remotePath: string): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("push_file", {
        serial,
        localPath,
        remotePath,
      });
      return result;
    } catch (error) {
      console.error("Failed to push file:", error);
      throw error;
    }
  }

  async pullFile(serial: string, remotePath: string, localPath: string): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("pull_file", {
        serial,
        remotePath,
        localPath,
      });
      return result;
    } catch (error) {
      console.error("Failed to pull file:", error);
      throw error;
    }
  }

  async listDeviceFiles(serial: string, path: string): Promise<DeviceFile[]> {
    try {
      const files = await invoke<DeviceFile[]>("list_device_files", {
        serial,
        path,
      });
      return files;
    } catch (error) {
      console.error("Failed to list device files:", error);
      throw error;
    }
  }

  async getInstalledApps(serial: string, includeSystem: boolean = false): Promise<InstalledApp[]> {
    try {
      const apps = await invoke<InstalledApp[]>("get_installed_apps", {
        serial,
        includeSystem,
      });
      return apps;
    } catch (error) {
      console.error("Failed to get installed apps:", error);
      throw error;
    }
  }

  async uninstallApp(serial: string, packageName: string, keepData: boolean = false): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("uninstall_app", {
        serial,
        packageName,
        keepData,
      });
      return result;
    } catch (error) {
      console.error("Failed to uninstall app:", error);
      throw error;
    }
  }

  async getApkInfo(apkPath: string): Promise<ApkInfo> {
    try {
      const info = await invoke<ApkInfo>("get_apk_info", {
        apkPath,
      });
      return info;
    } catch (error) {
      console.error("Failed to get APK info:", error);
      throw error;
    }
  }

  async batchInstallApks(serial: string, apkPaths: string[], replaceExisting: boolean = false): Promise<BatchOperation> {
    try {
      const operation = await invoke<BatchOperation>("batch_install_apks", {
        serial,
        apkPaths,
        replaceExisting,
      });
      return operation;
    } catch (error) {
      console.error("Failed to batch install APKs:", error);
      throw error;
    }
  }

  async batchUninstallApps(serial: string, packageNames: string[], keepData: boolean = false): Promise<BatchOperation> {
    try {
      const operation = await invoke<BatchOperation>("batch_uninstall_apps", {
        serial,
        packageNames,
        keepData,
      });
      return operation;
    } catch (error) {
      console.error("Failed to batch uninstall apps:", error);
      throw error;
    }
  }

  async freezeApp(serial: string, packageName: string): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("freeze_app", {
        serial,
        packageName,
      });
      return result;
    } catch (error) {
      console.error("Failed to freeze app:", error);
      throw error;
    }
  }

  async unfreezeApp(serial: string, packageName: string): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("unfreeze_app", {
        serial,
        packageName,
      });
      return result;
    } catch (error) {
      console.error("Failed to unfreeze app:", error);
      throw error;
    }
  }

  async clearAppData(serial: string, packageName: string): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("clear_app_data", {
        serial,
        packageName,
      });
      return result;
    } catch (error) {
      console.error("Failed to clear app data:", error);
      throw error;
    }
  }

  async exportApk(serial: string, packageName: string, outputPath: string): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("export_apk", {
        serial,
        packageName,
        outputPath,
      });
      return result;
    } catch (error) {
      console.error("Failed to export APK:", error);
      throw error;
    }
  }

  async getFrozenApps(serial: string): Promise<InstalledApp[]> {
    try {
      const apps = await invoke<InstalledApp[]>("get_frozen_apps", {
        serial,
      });
      return apps;
    } catch (error) {
      console.error("Failed to get frozen apps:", error);
      throw error;
    }
  }

  async checkFastbootAvailability(): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("check_fastboot_availability");
      return result;
    } catch (error) {
      console.error("Failed to check Fastboot availability:", error);
      throw error;
    }
  }

  async executeFastbootCommand(
    serial: string,
    command: string,
    args: string[] = [],
    timeout?: number
  ): Promise<CommandResult> {
    console.log(`[DeviceService] executeFastbootCommand called with:`, { serial, command, args, timeout });
    
    return await adbToolsManager.executeWithFallback(async () => {
      try {
        console.log(`[DeviceService] 调用Tauri命令: execute_fastboot_command`);
        const result = await invoke<CommandResult>("execute_fastboot_command", {
          serial,
          command,
          args,
          timeout,
        });
        console.log(`[DeviceService] Tauri命令返回结果:`, result);
        return result;
      } catch (error) {
        console.error("[DeviceService] Failed to execute Fastboot command:", error);
        throw error;
      }
    });
  }

  async fastbootFlashImage(serial: string, imagePath: string, partition: string): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("fastboot_flash_image", {
        serial,
        imagePath,
        partition,
      });
      return result;
    } catch (error) {
      console.error("Failed to flash image via fastboot:", error);
      throw error;
    }
  }

  async getFastbootPartitions(serial: string): Promise<CommandResult> {
    return await adbToolsManager.executeWithFallback(async () => {
      try {
        console.log(`[DeviceService] 获取 fastboot 分区信息: ${serial}`);
        const result = await invoke<CommandResult>("execute_fastboot_command", {
          serial,
          command: "oem",
          args: ["partition", "list"],
          timeout: 30000, // 分区列表可能需要较长时间
        });
        console.log(`[DeviceService] fastboot 分区信息获取结果:`, result);
        return result;
      } catch (error) {
        console.error("[DeviceService] 获取 fastboot 分区信息失败:", error);
        throw error;
      }
    });
  }

  async getFastbootVariables(serial: string): Promise<CommandResult> {
    return await adbToolsManager.executeWithFallback(async () => {
      try {
        console.log(`[DeviceService] 获取 fastboot 变量信息: ${serial}`);
        const result = await invoke<CommandResult>("execute_fastboot_command", {
          serial,
          command: "getvar",
          args: ["all"],
          timeout: 30000, // 变量列表可能需要较长时间
        });
        console.log(`[DeviceService] fastboot 变量信息获取结果:`, result);
        return result;
      } catch (error) {
        console.error("[DeviceService] 获取 fastboot 变量信息失败:", error);
        throw error;
      }
    });
  }

  async checkDeviceConnection(serial: string): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("check_device_connection", {
        serial,
      });
      return result;
    } catch (error) {
      console.error("Failed to check device connection:", error);
      throw error;
    }
  }

  async getDeviceConnectionInfo(serial: string): Promise<Record<string, unknown>> {
    try {
      const info = await invoke<Record<string, unknown>>("get_device_connection_info", {
        serial,
      });
      return info;
    } catch (error) {
      console.error("Failed to get device connection info:", error);
      throw error;
    }
  }

  async getDeviceMemoryStorageInfo(serial: string): Promise<{
    memory: {
      memory_total: number | null;
      memory_used: number | null;
      memory_available: number | null;
      memory_usage_percent: number | null;
    };
    storage: {
      storage_total: number | null;
      storage_used: number | null;
      storage_available: number | null;
      storage_usage_percent: number | null;
    };
    battery: {
      battery_health_percent: number | null;
      battery_actual_capacity: number | null;
      battery_design_capacity: number | null;
      battery_health_status: string | null;
      battery_level: number | null;
      battery_temperature: number | null;
      health_calculation_method: string | null;
      charge_counter_available: boolean;
    };
  }> {
    try {
      const result = await invoke("get_device_memory_storage_info", { serial });
      return result as any;
    } catch (error) {
      console.error("Failed to get device memory/storage/battery info:", error);
      throw error;
    }
  }

  async getDevicePartitions(serial: string): Promise<string[]> {
    try {
      const partitions = await invoke<string[]>("get_device_partitions", { serial });
      return partitions;
    } catch (error) {
      console.error("Failed to get device partitions:", error);
      throw error;
    }
  }



  // ADB管理相关功能
  async stopAdbServer(): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("stop_adb_server");
      return result;
    } catch (error) {
      logService.error("停止 ADB 服务失败", "设备服务", { error: String(error) });
      throw error;
    }
  }

  async restartAdbServer(): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("restart_adb_server");
      return result;
    } catch (error) {
      logService.error("重启 ADB 服务失败", "设备服务", { error: String(error) });
      throw error;
    }
  }

  async installDeviceDriver(): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("install_device_driver");
      logService.info("已触发安装设备驱动程序", "设备服务");
      return result;
    } catch (error) {
      logService.error("安装设备驱动程序失败", "设备服务", { error: String(error) });
      throw error;
    }
  }

  async fixUsb3Connection(): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("fix_usb3_connection");
      logService.info("已尝试修复 USB 3.0 连接", "设备服务");
      return result;
    } catch (error) {
      logService.error("修复 USB 3.0 连接失败", "设备服务", { error: String(error) });
      throw error;
    }
  }

  async clearAdbAuthorization(serial: string): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("clear_adb_authorization", { serial });
      return result;
    } catch (error) {
      console.error("Failed to clear ADB authorization:", error);
      throw error;
    }
  }

  async diagnoseDeviceConnection(serial: string): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("diagnose_device_connection", { serial });
      logService.info(`已对设备进行连接诊断: ${serial}`, "设备服务");
      return result;
    } catch (error) {
      logService.error(`诊断设备连接失败: ${serial}`, "设备服务", { error: String(error) });
      throw error;
    }
  }

  startScanning(interval = 2000, delay = 0): void {
    // 检查全局开关，如果关闭则根本不启动扫描
    const isAutoDetectEnabled = useAppStore.getState().config.autoDetectDevices;
    if (!isAutoDetectEnabled) {
      logService.info("自动检测已关闭，跳过启动扫描任务", "DeviceService");
      this.stopScanning();
      return;
    }

    // 无论是否延迟，由于这是明确的开启操作，我们先清理任何存量的扫描任务
    this.stopScanning();

    if (delay > 0) {
      logService.info(`设备动态监控将延迟 ${delay}ms 开启`, "DeviceService");
      this.pendingScanTimeout = setTimeout(() => {
        this.pendingScanTimeout = null;
        // 延迟触发后再次检查开关状态（防止延迟期间开关被关闭）
        if (useAppStore.getState().config.autoDetectDevices) {
          this.startScanning(interval, 0);
        }
      }, delay);
      return;
    }

    logService.info("开启设备动态监控", "DeviceService");
    this.isScanning = true;
    useDeviceStore.getState().setScanning(true);

    const scanDevicesInternal = async () => {
      try {
        // 在循环内部也进行校验，作为最后的自我防御
        const isAutoDetectEnabled = useAppStore.getState().config.autoDetectDevices;
        if (!isAutoDetectEnabled) {
          this.stopScanning();
          return;
        }

        const isFlashing = useDeviceStore.getState().isFlashing;
        if (isFlashing) {
          return;
        }
        
        const devices = await this.scanDevices();
        useDeviceStore.getState().setDevices(devices);
      } catch (error) {
        // 静默处理轮询中的常规错误
      }
    };

    this.scanInterval = setInterval(scanDevicesInternal, interval);

    // 仅在首次启动时执行“初始扫描”逻辑（用于统计冷启动时的已连接设备）
    if (!this.initialScanDone) {
      this.initialDeviceScan().finally(() => {
        this.initialScanDone = true;
      });
    }
  }

  /**
   * 初始设备扫描，特别处理启动前已连接的设备
   * 确保在软件启动前连接的设备也能发送连接统计数据
   */
  private async initialDeviceScan(): Promise<void> {
    // 初始扫描也检查开关
    if (!useAppStore.getState().config.autoDetectDevices) {
      return;
    }

    try {
      console.log('🔍 执行初始设备扫描，检查启动前已连接的设备...');
      logService.info('开始初始设备扫描', 'DeviceService');
      
      const devices = await this.scanDevices();
      
      // 更新设备列表
      useDeviceStore.getState().setDevices(devices);
      
      // 特别处理：对所有已连接的设备记录连接统计
      const connectedDevices = devices.filter(device => device.connected);
      
      if (connectedDevices.length > 0) {
        console.log(`🔥 检测到 ${connectedDevices.length} 台启动前已连接的设备，开始记录连接统计...`);
        logService.info(`检测到 ${connectedDevices.length} 台启动前已连接的设备`, 'DeviceService');
        
        // 为每个已连接的设备记录连接统计
        for (const device of connectedDevices) {
          try {
            console.log(`📊 记录启动前连接设备: ${device.serial}`);
            await this.recordDeviceConnection(device, true); // 标记为启动扫描
          } catch (error) {
            console.warn(`记录设备连接统计失败: ${device.serial}`, error);
            logService.warning(`记录设备连接统计失败: ${device.serial}`, 'DeviceService', error);
          }
        }
        
        console.log('✅ 启动前已连接设备的连接统计记录完成');
        logService.info('启动前已连接设备的连接统计记录完成', 'DeviceService');
      } else {
        console.log('📋 未检测到启动前已连接的设备');
        logService.info('未检测到启动前已连接的设备', 'DeviceService');
      }
      
    } catch (error) {
      console.error('初始设备扫描失败:', error);
      logService.error('初始设备扫描失败', 'DeviceService', error);
      
      // 初始扫描失败不应阻止应用正常运行，继续执行常规扫描
      try {
        const devices = await this.scanDevices();
        useDeviceStore.getState().setDevices(devices);
      } catch (fallbackError) {
        console.error('备用设备扫描也失败:', fallbackError);
        logService.error('备用设备扫描也失败', 'DeviceService', fallbackError);
      }
    }
  }

  stopScanning(): void {
    // 只要有正在运行的或挂起的任务，就执行清理
    if (!this.isScanning && !this.pendingScanTimeout) {
      return;
    }

    logService.info("停止设备动态监控", "DeviceService");
    
    // 清除延迟启动任务
    if (this.pendingScanTimeout) {
      clearTimeout(this.pendingScanTimeout);
      this.pendingScanTimeout = null;
    }

    // 清除循环扫描任务
    this.isScanning = false;
    useDeviceStore.getState().setScanning(false);

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  resetConnectionState(): void {
    this.connectedDevices.clear();
    this.initialScanDone = false;
  }

  // APK下载相关方法
  async downloadApk(url: string, fileName: string, isDirect: boolean): Promise<string> {
    try {
      const filePath = await invoke<string>("download_apk", {
        url,
        fileName,
        isDirect,
      });
      return filePath;
    } catch (error) {
      // console.error("Failed to download APK:", error);
      throw error;
    }
  }

  async getDownloadSize(url: string, isDirect: boolean): Promise<number> {
    try {
      const size = await invoke<number>("get_download_size", {
        url,
        isDirect,
      });
      return size;
    } catch (error) {
      // console.error("Failed to get download size:", error);
      throw error;
    }
  }

  /**
   * 处理设备连接变化，记录统计数据
   */
  private async handleDeviceConnectionChanges(currentDevices: DeviceInfo[]): Promise<void> {
    try {
      const currentSerials = new Set(currentDevices.map(d => d.serial));
      const previousSerials = new Set(this.connectedDevices.keys());

      // 检测新连接的设备
      for (const device of currentDevices) {
        if (!previousSerials.has(device.serial) && device.connected) {
          await this.recordDeviceConnection(device);
        }
      }

      // 检测断开的设备
      for (const [serial, connectionInfo] of this.connectedDevices.entries()) {
        if (!currentSerials.has(serial)) {
          // 检查是否正在执行刷写操作
          const isFlashing = useDeviceStore.getState().isFlashing;
          
          if (isFlashing) {
            // 如果正在刷写，延迟处理设备断开事件，给设备更多时间恢复
            logService.info(`检测到设备 ${serial} 断开，但正在执行刷写操作，延迟处理断开事件`, "DeviceService");
            
            // 延迟10秒后再处理设备断开事件
            setTimeout(async () => {
              try {
                // 重新检查设备是否仍然断开
                const devices = await this.scanDevices();
                const deviceStillDisconnected = !devices.some(d => d.serial === serial);
                
                if (deviceStillDisconnected) {
                  await this.recordDeviceDisconnection(serial, connectionInfo);
                } else {
                  logService.info(`设备 ${serial} 已重新连接，取消断开事件`, "DeviceService");
                }
              } catch (error) {
                logService.error(`延迟处理设备断开事件失败: ${serial}`, "DeviceService", error);
                // 如果检查失败，仍然记录断开事件
                await this.recordDeviceDisconnection(serial, connectionInfo);
              }
            }, 10000); // 10秒延迟
          } else {
            // 如果不在刷写，立即处理设备断开事件
            await this.recordDeviceDisconnection(serial, connectionInfo);
          }
        }
      }

      // 更新连接设备记录
      this.updateConnectedDevicesRecord(currentDevices);
    } catch (error) {
      console.warn('处理设备连接变化失败:', error);
    }
  }

  /**
   * 记录设备连接
   */
  private async recordDeviceConnection(device: DeviceInfo, isStartupScan: boolean = false): Promise<void> {
    try {
      const scanType = isStartupScan ? '启动前连接' : '运行时连接';
      console.log(`记录设备连接 (${scanType}):`, device.serial);

      // 获取设备详细属性
      let properties: DeviceProperties | undefined;
      try {
        properties = await this.getDeviceProperties(device.serial);
      } catch (error) {
        console.warn('获取设备属性失败:', error);
        enhancedLogService.logWarning(
          `获取设备属性失败: ${device.serial}`,
          "DeviceService",
          { deviceSerial: device.serial, error: error?.toString() }
        );
      }

      // 记录连接信息
      this.connectedDevices.set(device.serial, { connectedAt: new Date(), properties });

      // 使用增强日志系统记录设备连接事件
      enhancedLogService.logDeviceEvent({
        type: 'connected',
        deviceId: device.serial,
        deviceModel: properties?.marketName || properties?.model || 'Unknown',
        currentMode: device.mode,
        timestamp: new Date().toISOString(),
        details: {
          brand: properties?.brand,
          androidVersion: properties?.androidVersion,
          buildNumber: properties?.buildUser,
          connectionType: device.mode === 'fastboot' ? 'Fastboot' : 'ADB',
          scanType // 添加扫描类型信息
        }
      });

      // 发送统计数据（只收集基本设备信息）
      const connectionData = {
        deviceSerial: device.serial,
        deviceBrand: properties?.brand,
        deviceModel: properties?.model,
        osVersion: properties?.androidVersion,
      };

      await deviceConnectionTrackingService.recordDeviceConnection(connectionData);
      console.log(`设备连接统计已记录 (${scanType}):`, device.serial);
    } catch (error) {
      console.error('记录设备连接失败:', error);
      enhancedLogService.logError(
        `记录设备连接失败: ${device.serial}`,
        "DeviceService",
        { deviceSerial: device.serial },
        'DEVICE_CONNECTION_RECORD_FAILED',
        error as Error
      );
    }
  }

  /**
   * 记录设备断开
   */
  private async recordDeviceDisconnection(
    serial: string,
    connectionInfo: { connectedAt: Date; properties?: DeviceProperties }
  ): Promise<void> {
    try {
      console.log('设备断开:', serial);
      
      // 计算连接持续时间
      const connectionDuration = Date.now() - connectionInfo.connectedAt.getTime();
      
      // 使用增强日志系统记录设备断开事件
      enhancedLogService.logDeviceEvent({
        type: 'disconnected',
        deviceId: serial,
        deviceModel: connectionInfo.properties?.marketName || connectionInfo.properties?.model || 'Unknown',
        timestamp: new Date().toISOString(),
        details: {
          connectionDuration: Math.round(connectionDuration / 1000), // 秒
          connectedAt: connectionInfo.connectedAt.toISOString(),
          brand: connectionInfo.properties?.brand,
          androidVersion: connectionInfo.properties?.androidVersion
        }
      });
      
    } catch (error) {
      console.error('处理设备断开失败:', error);
      enhancedLogService.logError(
        `记录设备断开失败: ${serial}`,
        "DeviceService",
        { deviceSerial: serial },
        'DEVICE_DISCONNECTION_RECORD_FAILED',
        error as Error
      );
    }
  }

  /**
   * 更新连接设备记录
   */
  private updateConnectedDevicesRecord(currentDevices: DeviceInfo[]): void {
    // 清除已断开的设备
    const currentSerials = new Set(currentDevices.map(d => d.serial));
    for (const serial of this.connectedDevices.keys()) {
      if (!currentSerials.has(serial)) {
        this.connectedDevices.delete(serial);
      }
    }
  }

  async getBoardSerialNumber(serial: string): Promise<string | null> {
    try {
      const result = await this.executeAdbCommand(serial, 'shell', ['cat', '/sys/devices/soc0/serial_number']);
      if (result.success && result.output) {
        return result.output.trim();
      }
      return null;
    } catch (error) {
      console.error("Failed to get board serial number:", error);
      return null;
    }
  }

  // A/B分区切换相关功能
  async switchABPartition(serial: string, slot: string): Promise<CommandResult> {
    try {
      console.log(`[DeviceService] 切换A/B分区: ${serial} 到 ${slot}`);
      const result = await invoke<CommandResult>("switch_ab_partition", {
        serial,
        slot,
      });
      console.log(`[DeviceService] A/B分区切换结果:`, result);
      return result;
    } catch (error) {
      console.error("[DeviceService] 切换A/B分区失败:", error);
      throw error;
    }
  }

  async getCurrentActiveSlot(serial: string): Promise<CommandResult> {
    try {
      console.log(`[DeviceService] 获取当前活跃分区: ${serial}`);
      const result = await invoke<CommandResult>("get_current_active_slot", {
        serial,
      });
      console.log(`[DeviceService] 当前活跃分区:`, result);
      return result;
    } catch (error) {
      console.error("[DeviceService] 获取当前活跃分区失败:", error);
      throw error;
    }
  }

  async getSlotInfo(serial: string): Promise<CommandResult> {
    try {
      console.log(`[DeviceService] 获取分区信息: ${serial}`);
      const result = await invoke<CommandResult>("get_slot_info", {
        serial,
      });
      console.log(`[DeviceService] 分区信息:`, result);
      return result;
    } catch (error) {
      console.error("[DeviceService] 获取分区信息失败:", error);
      throw error;
    }
  }

  /**
   * 获取设备网络状态 (WiFi SSID, WiFi状态, 移动数据状态, 飞行模式状态)
   */
  async getNetworkStatus(serial: string): Promise<{
    wifiEnabled: boolean;
    wifiSsid: string | null;
    mobileDataEnabled: boolean;
    airplaneModeEnabled: boolean;
  }> {
    try {
      // 1. 获取 WiFi 状态
      const wifiOnResult = await this.executeAdbCommand(serial, 'shell', ['settings', 'get', 'global', 'wifi_on']);
      const wifiEnabled = wifiOnResult.success && wifiOnResult.output.trim() === '1';

      // 2. 获取 WiFi SSID
      let wifiSsid = null;
      if (wifiEnabled) {
        const ssidResult = await this.executeAdbCommand(serial, 'shell', ['dumpsys', 'wifi', '|', 'grep', '-i', 'mNetworkInfo']);
        if (ssidResult.success && ssidResult.output) {
          // 格式通常为: mNetworkInfo [type: WIFI[], state: CONNECTED/CONNECTED, reason: (unspecified), extra: "SSID_NAME", ...]
          const match = ssidResult.output.match(/extra:\s+"([^"]+)"/);
          if (match && match[1]) {
            wifiSsid = match[1];
          }
        }
      }

      // 3. 获取移动数据状态
      const dataOnResult = await this.executeAdbCommand(serial, 'shell', ['settings', 'get', 'global', 'mobile_data']);
      const mobileDataEnabled = dataOnResult.success && dataOnResult.output.trim() === '1';

      // 4. 获取飞行模式状态
      const airplaneOnResult = await this.executeAdbCommand(serial, 'shell', ['settings', 'get', 'global', 'airplane_mode_on']);
      const airplaneModeEnabled = airplaneOnResult.success && airplaneOnResult.output.trim() === '1';

      return {
        wifiEnabled,
        wifiSsid,
        mobileDataEnabled,
        airplaneModeEnabled,
      };
    } catch (error) {
      console.error("Failed to get network status:", error);
      return {
        wifiEnabled: false,
        wifiSsid: null,
        mobileDataEnabled: false,
        airplaneModeEnabled: false,
      };
    }
  }
}

// 单例实例将在文件末尾创建

// React Hook for device service
export const useDeviceService = () => {
  const { setLoading, setStatusBarMessage, config } = useAppStore();
  const scanningRef = useRef(false);

  const startScanning = useCallback(() => {
    // 统一改为静默检查，如果已经在扫描则不重复执行
    if (deviceService.isScanningNow()) {
      return;
    }
    
    deviceService.startScanning(config.scanInterval);
    
    // 仅在首次启动时打印到状态栏（可选）
    /*
    setStatusBarMessage({
      type: "info",
      message: `设备监控已就绪`,
    });
    */
  }, [config.scanInterval]);

  const stopScanning = useCallback(() => {
    deviceService.stopScanning();
  }, []);

  const refreshDeviceInfo = useCallback(async (serial: string) => {
    try {
      const properties = await deviceService.getDeviceProperties(serial);
      useDeviceStore.getState().updateDevice(serial, { properties });
      
      setStatusBarMessage({
        type: "success",
        message: "设备信息已更新",
      });
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `获取设备信息失败: ${error}`,
      });
    }
  }, [setStatusBarMessage]);

  return {
    startScanning,
    stopScanning,
    refreshDeviceInfo,
    deviceService,
  };
};

// 扩展deviceService类，添加设备操作功能
class ExtendedDeviceService extends DeviceService {
  // 设备操作功能
  async takeScreenshot(serial: string): Promise<void> {
    try {
      await invoke('take_screenshot', { serial });
    } catch (error) {
      console.error('截屏失败:', error);
      throw error;
    }
  }

  async startScreenRecord(serial: string): Promise<void> {
    try {
      await invoke('start_screen_record', { serial });
    } catch (error) {
      console.error('录屏失败:', error);
      throw error;
    }
  }

  async openFileManager(serial: string): Promise<void> {
    try {
      await invoke('open_file_manager', { serial });
    } catch (error) {
      console.error('打开文件管理器失败:', error);
      throw error;
    }
  }

  async openFileTransfer(serial: string): Promise<void> {
    try {
      await invoke('open_file_transfer', { serial });
    } catch (error) {
      console.error('打开文件传输失败:', error);
      throw error;
    }
  }



  async installApp(serial: string): Promise<void> {
    try {
      await invoke('install_app', { serial });
    } catch (error) {
      console.error('应用安装失败:', error);
      throw error;
    }
  }
}

export const deviceService = new DeviceService();
export default deviceService;
