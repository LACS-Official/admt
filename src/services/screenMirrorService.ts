import { invoke } from "@tauri-apps/api/core";
import { 
  ScreenMirrorDevice, 
  ScreenMirrorSession, 
  ScreenMirrorConfig,
  ScreenMirrorStats,
  ScreenMirrorControlEvent 
} from "../types/screenMirror";
import { ScreenMirrorProcessMonitor } from "./screenMirrorProcessMonitor";

/**
 * 投屏服务 - 处理与后端的投屏相关通信
 */
export class ScreenMirrorService {
  /**
   * 检查设备是否支持投屏
   */
  static async checkDeviceSupport(deviceSerial: string): Promise<ScreenMirrorDevice> {
    try {
      console.log('Checking device support for:', deviceSerial);
      const device = await invoke<ScreenMirrorDevice>("check_screen_mirror_support", {
        deviceSerial,
      });
      console.log('Device support result:', device);
      return device;
    } catch (error) {
      console.error(`Failed to check screen mirror support for ${deviceSerial}:`, error);
      throw new Error(`检查设备支持失败: ${error}`);
    }
  }

  /**
   * 批量检查多个设备的投屏支持
   */
  static async checkMultipleDevicesSupport(deviceSerials: string[]): Promise<ScreenMirrorDevice[]> {
    const results = await Promise.allSettled(
      deviceSerials.map(serial => this.checkDeviceSupport(serial))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<ScreenMirrorDevice> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * 开始投屏
   */
  static async startMirror(
    deviceSerial: string, 
    config: ScreenMirrorConfig,
    onProcessTerminated?: (sessionId: string) => void
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
          }
        );
      }

      return session;
    } catch (error) {
      console.error(`Failed to start screen mirror for ${deviceSerial}:`, error);
      throw new Error(`启动投屏失败: ${error}`);
    }
  }

  /**
   * 停止投屏
   */
  static async stopMirror(sessionId: string): Promise<boolean> {
    try {
      // 获取进程监控实例
      const processMonitor = ScreenMirrorProcessMonitor.getInstance();
      
      // 首先尝试通过进程监控终止进程
      if (processMonitor.isMonitoring(sessionId)) {
        const terminated = await processMonitor.terminateProcess(sessionId);
        if (terminated) {
          return true;
        }
      }
      
      // 如果进程监控方式失败，回退到原来的方式
      const result = await invoke<boolean>("stop_screen_mirror", {
        sessionId,
      });
      
      // 确保停止监控
      processMonitor.unregisterSession(sessionId);
      
      return result;
    } catch (error) {
      console.error(`Failed to stop screen mirror session ${sessionId}:`, error);
      throw new Error(`停止投屏失败: ${error}`);
    }
  }

  /**
   * 发送控制事件到设备
   */
  static async sendControlEvent(sessionId: string, event: ScreenMirrorControlEvent): Promise<boolean> {
    try {
      // TODO: 实现控制事件发送
      console.log(`Sending control event for session ${sessionId}:`, event);
      
      // 暂时返回成功，实际需要后端实现
      return true;
    } catch (error) {
      console.error(`Failed to send control event:`, error);
      throw new Error(`发送控制指令失败: ${error}`);
    }
  }

  /**
   * 获取投屏统计信息
   */
  static async getSessionStats(sessionId: string): Promise<ScreenMirrorStats | null> {
    try {
      // TODO: 实现统计信息获取
      console.log(`Getting stats for session ${sessionId}`);
      
      // 暂时返回模拟数据
      return {
        sessionId,
        duration: Math.floor(Date.now() / 1000) % 3600, // 模拟运行时间
        framesReceived: Math.floor(Math.random() * 10000),
        framesDropped: Math.floor(Math.random() * 100),
        averageFps: 30 + Math.random() * 10,
        currentBitrate: 2 + Math.random() * 3,
        networkLatency: 10 + Math.random() * 50,
      };
    } catch (error) {
      console.error(`Failed to get session stats:`, error);
      return null;
    }
  }

  /**
   * 截图
   */
  static async takeScreenshot(sessionId: string): Promise<string | null> {
    try {
      // TODO: 实现截图功能
      console.log(`Taking screenshot for session ${sessionId}`);
      
      // 暂时返回空，实际需要后端实现
      return null;
    } catch (error) {
      console.error(`Failed to take screenshot:`, error);
      throw new Error(`截图失败: ${error}`);
    }
  }

  /**
   * 检查 scrcpy 是否可用
   */
  static async checkScrcpyAvailability(): Promise<boolean> {
    try {
      // TODO: 实现 scrcpy 可用性检查
      console.log("Checking scrcpy availability");
      
      // 暂时返回 true，实际需要后端实现
      return true;
    } catch (error) {
      console.error(`Failed to check scrcpy availability:`, error);
      return false;
    }
  }

  /**
   * 获取 scrcpy 版本信息
   */
  static async getScrcpyVersion(): Promise<string | null> {
    try {
      // TODO: 实现版本信息获取
      console.log("Getting scrcpy version");
      
      // 暂时返回模拟版本
      return "2.0";
    } catch (error) {
      console.error(`Failed to get scrcpy version:`, error);
      return null;
    }
  }

  /**
   * 模拟触摸事件
   */
  static async simulateTouch(sessionId: string, x: number, y: number, action: 'down' | 'up' | 'move'): Promise<boolean> {
    const event: ScreenMirrorControlEvent = {
      type: 'touch',
      timestamp: Date.now(),
      data: {
        action,
        x,
        y,
        pointerId: 0,
      },
    };

    return this.sendControlEvent(sessionId, event);
  }

  /**
   * 模拟按键事件
   */
  static async simulateKey(sessionId: string, keyCode: number, action: 'down' | 'up'): Promise<boolean> {
    const event: ScreenMirrorControlEvent = {
      type: 'key',
      timestamp: Date.now(),
      data: {
        action,
        keyCode,
        metaState: 0,
      },
    };

    return this.sendControlEvent(sessionId, event);
  }

  /**
   * 模拟滚动事件
   */
  static async simulateScroll(sessionId: string, x: number, y: number, deltaX: number, deltaY: number): Promise<boolean> {
    const event: ScreenMirrorControlEvent = {
      type: 'scroll',
      timestamp: Date.now(),
      data: {
        x,
        y,
        deltaX,
        deltaY,
      },
    };

    return this.sendControlEvent(sessionId, event);
  }

  /**
   * 常用按键代码
   */
  static readonly KeyCodes = {
    BACK: 4,
    HOME: 3,
    APP_SWITCH: 187,
    POWER: 26,
    VOLUME_UP: 24,
    VOLUME_DOWN: 25,
    MENU: 82,
    ENTER: 66,
    ESCAPE: 111,
  } as const;

  /**
   * 发送常用按键
   */
  static async sendCommonKey(sessionId: string, key: keyof typeof ScreenMirrorService.KeyCodes): Promise<boolean> {
    const keyCode = this.KeyCodes[key];
    
    // 发送按下和释放事件
    await this.simulateKey(sessionId, keyCode, 'down');
    await new Promise(resolve => setTimeout(resolve, 50)); // 短暂延迟
    return this.simulateKey(sessionId, keyCode, 'up');
  }
}

export default ScreenMirrorService;
