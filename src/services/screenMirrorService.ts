import { invoke } from "@tauri-apps/api/core";
import {
  ScreenMirrorDevice,
  ScreenMirrorSession,
  ScreenMirrorConfig,
} from "../types/screenMirror";
import { ScreenMirrorProcessMonitor } from "./screenMirrorProcessMonitor";

/**
 * 投屏服务 - 处理与后端的投屏相关通信
 */
export class ScreenMirrorService {
  /**
   * 检查设备是否支持投屏
   */
  static async checkDeviceSupport(
    deviceSerial: string,
  ): Promise<ScreenMirrorDevice> {
    try {
      console.log("Checking device support for:", deviceSerial);
      const device = await invoke<ScreenMirrorDevice>(
        "check_screen_mirror_support",
        {
          deviceSerial,
        },
      );
      console.log("Device support result:", device);
      return device;
    } catch (error) {
      console.error(
        `Failed to check screen mirror support for ${deviceSerial}:`,
        error,
      );
      throw new Error(`检查设备支持失败: ${error}`);
    }
  }

  /**
   * 批量检查多个设备的投屏支持
   */
  static async checkMultipleDevicesSupport(
    deviceSerials: string[],
  ): Promise<ScreenMirrorDevice[]> {
    const results = await Promise.allSettled(
      deviceSerials.map((serial) => this.checkDeviceSupport(serial)),
    );

    return results
      .filter(
        (result): result is PromiseFulfilledResult<ScreenMirrorDevice> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);
  }

  /**
   * 开始投屏
   */
  static async startMirror(
    deviceSerial: string,
    config: ScreenMirrorConfig,
    onProcessTerminated?: (sessionId: string) => void,
  ): Promise<ScreenMirrorSession> {
    try {
      const session = await invoke<ScreenMirrorSession>("start_screen_mirror", {
        deviceSerial,
        config,
      });

      // 获取进程监控实例
      const processMonitor = ScreenMirrorProcessMonitor.getInstance();

      // 注册会话并开始进程监控
      // 注意：这里假设后端返回的session中包含processId字段
      // 如果后端没有返回，需要通过其他方式获取进程ID
      if (session.processId) {
        await processMonitor.registerSession(
          session.id,
          session.processId,
          (isAlive) => {
            if (!isAlive && onProcessTerminated) {
              onProcessTerminated(session.id);
            }
          },
        );
      }

      return session;
    } catch (error: any) {
      console.error(
        `Failed to start screen mirror for ${deviceSerial}:`,
        error,
      );
      // 处理错误对象，避免 [object Object]
      const errorMessage =
        typeof error === "object"
          ? error.Process || error.Device || JSON.stringify(error)
          : error;
      throw new Error(`启动投屏失败: ${errorMessage}`);
    }
  }

  /**
   * 停止投屏
   */
  static async stopMirror(deviceSerial: string): Promise<boolean> {
    try {
      console.log("Stopping screen mirror for device:", deviceSerial);

      // 1. 调用后端专门的停止命令（它会清理进程和 MirrorManager 状态并移除端口映射）
      const result = await invoke<boolean>("stop_screen_mirror", {
        deviceSerial,
      });

      return result;
    } catch (error) {
      console.error(
        `Failed to stop screen mirror for device ${deviceSerial}:`,
        error,
      );
      throw new Error(`停止投屏失败: ${error}`);
    }
  }

  /**
   * 停止所有活跃的投屏会话并清理残留进程
   */
  static async stopAllMirrors(): Promise<boolean> {
    try {
      console.log("Stopping all screen mirrors...");
      return await invoke<boolean>("stop_all_screen_mirrors");
    } catch (error) {
      console.error("Failed to stop all screen mirrors:", error);
      return false;
    }
  }

  /**
   * 获取当前后端记录的所有活跃投屏会话
   */
  static async getActiveSessions(): Promise<ScreenMirrorSession[]> {
    try {
      return await invoke<ScreenMirrorSession[]>("get_active_mirror_sessions");
    } catch (error) {
      console.error("Failed to get active mirror sessions:", error);
      return [];
    }
  }

  /**
   * 检查指定设备是否正在投屏（后端状态验证）
   */
  static async isDeviceMirroring(deviceSerial: string): Promise<boolean> {
    try {
      return await invoke<boolean>("is_device_mirroring", { deviceSerial });
    } catch (error) {
      console.error(
        `Failed to check mirroring status for ${deviceSerial}:`,
        error,
      );
      return false;
    }
  }

}

export default ScreenMirrorService;
