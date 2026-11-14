import { invoke } from "@tauri-apps/api/core";
import {
  KeyMappingConfig,
  KeyMappingProfile,
} from "../types/keyMapping";

/** 按键映射运行时诊断信息（与后端 get_key_mapping_diagnostics 对应） */
export interface KeyMappingDiagnostics {
  running: boolean;
  adbSession: boolean;
  hookInstalled: boolean;
  eventQueueReady: boolean;
  screenWidth: number;
  screenHeight: number;
  motionEventSupported: boolean;
  injectionMode: string;
  activeWindowOnly: boolean;
  profileName: string;
  itemCount: number;
  issues: string[];
}

/**
 * 把 DOM KeyboardEvent 规范化为后端 Windows Hook 使用的键名。
 *
 * 后端 vk_to_key_name 返回形如 "W" / "Space" / "ArrowUp" / "F1" / "Num1"，
 * 而 e.key 会是 "w" / " " / "ArrowUp" / "F1" / "1"，
 * 不统一的话用户录制的键位与运行时的键永远匹配不上。
 */
export function normalizeKeyName(e: Pick<KeyboardEvent, "key" | "code">): string {
  if (/^Numpad[0-9]$/.test(e.code)) {
    return `Num${e.code.slice(-1)}`;
  }
  if (e.key === " " || e.key === "Spacebar") return "Space";
  if (e.key.length === 1) {
    return /[a-z]/.test(e.key) ? e.key.toUpperCase() : e.key;
  }
  return e.key;
}

export class KeyMappingService {
  /**
   * 启动按键映射服务
   */
  static async startKeyMapping(config: KeyMappingConfig): Promise<boolean> {
    try {
      return await invoke<boolean>("start_key_mapping", { config });
    } catch (error) {
      console.error("Failed to start key mapping:", error);
      throw error;
    }
  }

  /**
   * 停止按键映射服务
   */
  static async stopKeyMapping(): Promise<boolean> {
    try {
      return await invoke<boolean>("stop_key_mapping");
    } catch (error) {
      console.error("Failed to stop key mapping:", error);
      throw error;
    }
  }

  /**
   * 把应用窗口内的键盘事件交给统一的映射引擎（全局 Hook 之外的第二条通道）
   */
  static async injectKeyEvent(key: string, isDown: boolean): Promise<boolean> {
    try {
      return await invoke<boolean>("inject_key_mapping_event", { key, isDown });
    } catch (error) {
      console.error("Failed to inject key mapping event:", error);
      return false;
    }
  }

  /**
   * 查询真实运行状态（ADB 会话、Hook、设备分辨率、注入能力等）
   */
  static async getDiagnostics(): Promise<KeyMappingDiagnostics | null> {
    try {
      return await invoke<KeyMappingDiagnostics>("get_key_mapping_diagnostics");
    } catch (error) {
      console.error("Failed to query key mapping diagnostics:", error);
      return null;
    }
  }

  /**
   * 检查按键映射服务是否处于运行状态
   */
  static async isKeyMappingActive(): Promise<boolean> {
    try {
      return await invoke<boolean>("is_key_mapping_active");
    } catch (error) {
      console.error("Failed to query key mapping active status:", error);
      return false;
    }
  }

  /**
   * 获取所有按键映射配置预设
   */
  static async getKeyMappingProfiles(): Promise<KeyMappingProfile[]> {
    try {
      return await invoke<KeyMappingProfile[]>("get_key_mapping_profiles");
    } catch (error) {
      console.error("Failed to load key mapping profiles:", error);
      return [];
    }
  }

  /**
   * 保存或更新按键映射预设
   */
  static async saveKeyMappingProfile(
    profile: KeyMappingProfile,
  ): Promise<boolean> {
    try {
      return await invoke<boolean>("save_key_mapping_profile", { profile });
    } catch (error) {
      console.error("Failed to save key mapping profile:", error);
      throw error;
    }
  }

  /**
   * 删除按键映射预设
   */
  static async deleteKeyMappingProfile(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>("delete_key_mapping_profile", { id });
    } catch (error) {
      console.error("Failed to delete key mapping profile:", error);
      throw error;
    }
  }

  /**
   * 模拟单次触控（用于界面点击测试）
   */
  static async simulateTouch(
    deviceSerial: string,
    action: "tap" | "swipe",
    x: number,
    y: number,
    endX?: number,
    endY?: number,
    durationMs?: number,
    orientation?: "landscape" | "portrait",
  ): Promise<boolean> {
    try {
      return await invoke<boolean>("simulate_key_mapping_touch", {
        deviceSerial,
        action,
        x,
        y,
        endX,
        endY,
        durationMs,
        orientation,
      });
    } catch (error) {
      console.error("Failed to simulate touch:", error);
      return false;
    }
  }
  /**
   * 捕获设备实时屏幕帧（返回 base64 数据）
   */
  static async captureDeviceScreen(deviceSerial: string): Promise<string> {
    try {
      return await invoke<string>("capture_device_screen", { deviceSerial });
    } catch (error) {
      console.error("Failed to capture device screen:", error);
      throw error;
    }
  }
}

export default KeyMappingService;
