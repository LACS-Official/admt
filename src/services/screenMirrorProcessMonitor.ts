import { invoke } from "@tauri-apps/api/core";
import { ScreenMirrorSession } from "../types/screenMirror";

/**
 * 投屏进程监控服务 - 负责系统级监控scrcpy进程状态
 */
export class ScreenMirrorProcessMonitor {
  private static instance: ScreenMirrorProcessMonitor;
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private sessionProcessMap: Map<string, number> = new Map(); // 会话ID到进程ID的映射
  private callbacks: Map<string, (isAlive: boolean) => void> = new Map(); // 会话状态变化回调

  private constructor() {}

  static getInstance(): ScreenMirrorProcessMonitor {
    if (!ScreenMirrorProcessMonitor.instance) {
      ScreenMirrorProcessMonitor.instance = new ScreenMirrorProcessMonitor();
    }
    return ScreenMirrorProcessMonitor.instance;
  }

  /**
   * 注册投屏会话并开始监控
   * @param sessionId 投屏会话ID
   * @param processId scrcpy进程ID
   * @param callback 状态变化回调函数
   */
  async registerSession(sessionId: string, processId: number, callback: (isAlive: boolean) => void): Promise<void> {
    // 保存会话与进程的映射关系
    this.sessionProcessMap.set(sessionId, processId);
    this.callbacks.set(sessionId, callback);

    // 如果已经在监控此会话，先停止之前的监控
    if (this.monitoringIntervals.has(sessionId)) {
      clearInterval(this.monitoringIntervals.get(sessionId));
      this.monitoringIntervals.delete(sessionId);
    }

    // 开始新的监控
    const interval = setInterval(async () => {
      await this.checkProcessStatus(sessionId);
    }, 2000); // 每2秒检查一次

    this.monitoringIntervals.set(sessionId, interval);
    console.log(`Started monitoring session ${sessionId} with process ${processId}`);
  }

  /**
   * 停止监控指定会话
   * @param sessionId 投屏会话ID
   */
  unregisterSession(sessionId: string): void {
    // 停止定时器
    if (this.monitoringIntervals.has(sessionId)) {
      clearInterval(this.monitoringIntervals.get(sessionId));
      this.monitoringIntervals.delete(sessionId);
    }

    // 清理映射关系
    this.sessionProcessMap.delete(sessionId);
    this.callbacks.delete(sessionId);

    console.log(`Stopped monitoring session ${sessionId}`);
  }

  /**
   * 检查进程状态
   * @param sessionId 投屏会话ID
   */
  private async checkProcessStatus(sessionId: string): Promise<void> {
    const processId = this.sessionProcessMap.get(sessionId);
    if (!processId) {
      console.warn(`No process ID found for session ${sessionId}`);
      return;
    }

    try {
      // 调用后端接口检查进程状态
      const isAlive = await invoke<boolean>("check_process_alive", { 
        processId 
      });

      // 如果进程已终止，触发回调
      if (!isAlive) {
        console.log(`Process ${processId} for session ${sessionId} is no longer alive`);
        const callback = this.callbacks.get(sessionId);
        if (callback) {
          callback(false);
        }
        
        // 停止监控已终止的进程
        this.unregisterSession(sessionId);
      }
    } catch (error) {
      console.error(`Failed to check process status for ${sessionId}:`, error);
    }
  }

  /**
   * 立即终止指定会话的进程
   * @param sessionId 投屏会话ID
   * @returns 是否成功终止
   */
  async terminateProcess(sessionId: string): Promise<boolean> {
    const processId = this.sessionProcessMap.get(sessionId);
    if (!processId) {
      console.warn(`No process ID found for session ${sessionId}`);
      return false;
    }

    try {
      // 调用后端接口终止进程
      const success = await invoke<boolean>("terminate_process", { 
        processId 
      });

      if (success) {
        console.log(`Successfully terminated process ${processId} for session ${sessionId}`);
        // 停止监控
        this.unregisterSession(sessionId);
        
        // 触发回调通知进程已终止
        const callback = this.callbacks.get(sessionId);
        if (callback) {
          callback(false);
        }
      }

      return success;
    } catch (error) {
      console.error(`Failed to terminate process for session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * 获取指定会话的进程ID
   * @param sessionId 投屏会话ID
   * @returns 进程ID，如果不存在则返回null
   */
  getProcessId(sessionId: string): number | null {
    return this.sessionProcessMap.get(sessionId) || null;
  }

  /**
   * 检查指定会话是否正在被监控
   * @param sessionId 投屏会话ID
   * @returns 是否正在监控
   */
  isMonitoring(sessionId: string): boolean {
    return this.monitoringIntervals.has(sessionId);
  }

  /**
   * 启动进程监控服务
   */
  startMonitoring(): void {
    console.log("ScreenMirrorProcessMonitor started");
    // 这里可以添加全局监控初始化逻辑
  }

  /**
   * 停止进程监控服务
   */
  stopMonitoring(): void {
    console.log("ScreenMirrorProcessMonitor stopping");
    this.stopAllMonitoring();
  }

  /**
   * 停止所有监控
   */
  stopAllMonitoring(): void {
    // 停止所有定时器
    this.monitoringIntervals.forEach((interval, sessionId) => {
      clearInterval(interval);
    });

    // 清理所有数据
    this.monitoringIntervals.clear();
    this.sessionProcessMap.clear();
    this.callbacks.clear();

    console.log("Stopped all process monitoring");
  }
}