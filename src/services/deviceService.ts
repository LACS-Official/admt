import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef } from "react";
import { useDeviceStore } from "../stores/deviceStore";
import { useAppStore } from "../stores/appStore";
import { DeviceInfo, DeviceProperties, CommandResult, InstalledApp, ApkInfo, BatchOperation, DeviceFile } from "../types/device";

export class DeviceService {
  private scanInterval: number | null = null;
  private isScanning = false;

  async scanDevices(): Promise<DeviceInfo[]> {
    try {
      const devices = await invoke<DeviceInfo[]>("scan_devices");
      return devices;
    } catch (error) {
      console.error("Failed to scan devices:", error);
      throw error;
    }
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
    try {
      const result = await invoke<CommandResult>("execute_adb_command", {
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
  }

  async rebootDevice(serial: string, mode: string): Promise<CommandResult> {
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
  }

  async installApk(serial: string, apkPath: string, replace = false): Promise<CommandResult> {
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

  async checkAdbAvailability(): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("check_adb_availability");
      return result;
    } catch (error) {
      console.error("Failed to check ADB availability:", error);
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

  startScanning(interval = 2000): void {
    if (this.isScanning) return;

    this.isScanning = true;

    const scanDevicesInternal = async () => {
      try {
        const devices = await this.scanDevices();
        useDeviceStore.getState().setDevices(devices);
      } catch (error) {
        console.error("Device scan failed:", error);
      }
    };

    this.scanInterval = setInterval(scanDevicesInternal, interval);

    // 立即执行一次扫描
    scanDevicesInternal();
  }

  stopScanning(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.isScanning = false;
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
}

// 创建单例实例
export const deviceService = new DeviceService();

// React Hook for device service
export const useDeviceService = () => {
  const { setLoading, addNotification } = useAppStore();
  const scanningRef = useRef(false);

  const startScanning = useCallback(() => {
    if (scanningRef.current) return;
    
    scanningRef.current = true;
    setLoading(true);
    deviceService.startScanning();
    
    addNotification({
      type: "info",
      title: "设备扫描",
      message: "开始扫描连接的设备",
    });
  }, [setLoading, addNotification]);

  const stopScanning = useCallback(() => {
    if (!scanningRef.current) return;
    
    scanningRef.current = false;
    setLoading(false);
    deviceService.stopScanning();
  }, [setLoading]);

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
