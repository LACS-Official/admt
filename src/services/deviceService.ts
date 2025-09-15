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

  async checkFastbootAvailability(): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("check_fastboot_availability");
      return result;
    } catch (error) {
      console.error("Failed to check Fastboot availability:", error);
      throw error;
    }
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

  // ADB管理相关功能
  async stopAdbServer(): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("stop_adb_server");
      return result;
    } catch (error) {
      console.error("Failed to stop ADB server:", error);
      throw error;
    }
  }

  async restartAdbServer(): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("restart_adb_server");
      return result;
    } catch (error) {
      console.error("Failed to restart ADB server:", error);
      throw error;
    }
  }

  async installDeviceDriver(): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("install_device_driver");
      return result;
    } catch (error) {
      console.error("Failed to install device driver:", error);
      throw error;
    }
  }

  async fixUsb3Connection(): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("fix_usb3_connection");
      return result;
    } catch (error) {
      console.error("Failed to fix USB 3.0 connection:", error);
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
      return result;
    } catch (error) {
      console.error("Failed to diagnose device connection:", error);
      throw error;
    }
  }

  startScanning(interval = 2000): void {
    if (this.isScanning) {
      logService.debug("设备扫描已在运行中", "DeviceService");
      return;
    }

    logService.info("开始设备扫描...", "DeviceService");
    this.isScanning = true;
    useDeviceStore.getState().setScanning(true);

    const scanDevicesInternal = async () => {
      try {
        const devices = await this.scanDevices();
        useDeviceStore.getState().setDevices(devices);
      } catch (error) {
        logService.error("设备扫描失败", "DeviceService", error);
      }
    };

    this.scanInterval = setInterval(scanDevicesInternal, interval);

    // 立即执行一次扫描，并处理启动前已连接的设备
    this.initialDeviceScan();
  }

  /**
   * 初始设备扫描，特别处理启动前已连接的设备
   * 确保在软件启动前连接的设备也能发送连接统计数据
   */
  private async initialDeviceScan(): Promise<void> {
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
    if (!this.isScanning) {
      logService.debug("设备扫描未在运行", "DeviceService");
      return;
    }

    logService.info("停止设备扫描...", "DeviceService");
    this.isScanning = false;
    useDeviceStore.getState().setScanning(false);

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
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
          await this.recordDeviceDisconnection(serial, connectionInfo);
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
}

// 单例实例将在文件末尾创建

// React Hook for device service
export const useDeviceService = () => {
  const { setLoading, addNotification, config } = useAppStore();
  const scanningRef = useRef(false);

  const startScanning = useCallback(() => {
    if (scanningRef.current) {
      console.log("useDeviceService: Scanning already started by this hook");
      return;
    }

    console.log("useDeviceService: Starting device scanning with interval:", config.scanInterval);
    scanningRef.current = true;
    deviceService.startScanning(config.scanInterval);

    // 显示启动扫描通知
    addNotification({
      type: "info",
      title: "设备扫描",
      message: `开始扫描连接的设备（间隔：${config.scanInterval}ms）`,
    });
  }, [addNotification, config.scanInterval]);

  const stopScanning = useCallback(() => {
    if (!scanningRef.current) {
      console.log("useDeviceService: Scanning not started by this hook");
      return;
    }

    console.log("useDeviceService: Stopping device scanning");
    scanningRef.current = false;
    deviceService.stopScanning();
  }, []);

  const refreshDeviceInfo = useCallback(async (serial: string) => {
    try {
      const properties = await deviceService.getDeviceProperties(serial);
      useDeviceStore.getState().updateDevice(serial, { properties });
      
      addNotification({
        type: "success",
        title: "设备信息",
        message: "设备信息已更新",
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "设备信息",
        message: `获取设备信息失败: ${error}`,
      });
    }
  }, [addNotification]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

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

  async backupApps(serial: string): Promise<void> {
    try {
      await invoke('backup_apps', { serial });
    } catch (error) {
      console.error('应用备份失败:', error);
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

// 创建并导出扩展的服务实例（替代原有的DeviceService实例）
export const deviceService = new ExtendedDeviceService();
