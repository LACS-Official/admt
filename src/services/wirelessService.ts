import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../types/device";
import { logService } from "./logService";

export class WirelessService {
  /**
   * 将设备切换到 TCP/IP 模式
   */
  async switchToTcpIp(serial: string, port: number = 5555): Promise<CommandResult> {
    try {
      logService.info(`正在将设备 ${serial} 切换到 TCP/IP 模式 (端口: ${port})`, "无线调试");
      const result = await invoke<CommandResult>("execute_adb_command", {
        serial,
        command: "tcpip",
        args: [port.toString()],
      });
      
      if (result.success) {
        // 在切换完 TCP/IP 模式后，ADB 服务会重启，导致设备暂时断开连接
        // 我们需要等待设备重新上线。
        logService.info("等待设备在 TCP/IP 模式下重新上线...", "无线调试");
        await new Promise(resolve => setTimeout(resolve, 2000)); // 先等 2 秒
        
        // 尝试等待设备恢复
        for (let i = 0; i < 5; i++) {
          try {
            const check = await invoke<CommandResult>("execute_adb_command", {
              serial,
              command: "get-state",
              args: [],
            });
            if (check.success && check.output.trim() === "device") {
              logService.info("设备已重新上线", "无线调试");
              break;
            }
          } catch (e) {
            // 继续等待
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return result;
    } catch (error) {
      logService.error(`切换 TCP/IP 模式失败: ${error}`, "无线调试");
      throw error;
    }
  }

  /**
   * 获取设备的 IP 地址
   */
  async getDeviceIp(serial: string): Promise<string | null> {
    const commands = [
      ["ip", "route", "get", "1.1.1.1"],
      ["ip", "-4", "addr", "show", "wlan0"],
      ["ip", "-4", "addr", "show", "wlan1"],
      ["ip", "addr"],
      ["ifconfig", "wlan0"],
      ["getprop", "dhcp.wlan0.ipaddress"],
    ];

    for (const args of commands) {
      try {
        const result = await invoke<CommandResult>("execute_adb_command", {
          serial,
          command: "shell",
          args,
        });

        if (result.success && result.output) {
          // 1. 解析 ip route get 输出
          const routeMatch = result.output.match(/src\s+(\d+\.\d+\.\d+\.\d+)/);
          if (routeMatch && routeMatch[1] && routeMatch[1] !== "127.0.0.1") {
            return routeMatch[1];
          }

          // 2. 标准 ip addr 格式
          const ipMatch = result.output.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
          if (ipMatch && ipMatch[1] && ipMatch[1] !== "127.0.0.1") {
            return ipMatch[1];
          }
          
          // 3. ifconfig 格式
          const ifconfigMatch = result.output.match(/inet\s+addr:(\d+\.\d+\.\d+\.\d+)/);
          if (ifconfigMatch && ifconfigMatch[1] && ifconfigMatch[1] !== "127.0.0.1") {
            return ifconfigMatch[1];
          }

          // 4. 直接匹配
          const pureIpMatch = result.output.trim().match(/^(\d+\.\d+\.\d+\.\d+)$/);
          if (pureIpMatch && pureIpMatch[1] && pureIpMatch[1] !== "127.0.0.1") {
            return pureIpMatch[1];
          }
        }
      } catch (e) {
        // 继续尝试下一个命令
      }
    }
    return null;
  }

  /**
   * 连接无线设备
   */
  async connectWireless(ip: string, port: number): Promise<CommandResult> {
    try {
      logService.info(`正在连接无线设备: ${ip}:${port}`, "无线调试");
      const result = await invoke<CommandResult>("execute_adb_command_direct", {
        command: "connect",
        args: [`${ip}:${port}`],
      });
      return result;
    } catch (error) {
      logService.error(`无线连接失败: ${error}`, "无线调试");
      throw error;
    }
  }

  /**
   * 配对无线设备 (Android 11+)
   */
  async pairWireless(ip: string, port: number, code: string): Promise<CommandResult> {
    try {
      logService.info(`正在配对无线设备: ${ip}:${port}`, "无线调试");
      const result = await invoke<CommandResult>("execute_adb_command_direct", {
        command: "pair",
        args: [`${ip}:${port}`, code],
      });
      return result;
    } catch (error) {
      logService.error(`无线配对失败: ${error}`, "无线调试");
    }
  }

  /**
   * 启动无线配对服务器
   */
  async startPairingServer(): Promise<{ serviceName: string; port: number; pairingCode: string }> {
    try {
      logService.info("正在启动无线配对服务器...", "无线调试");
      const result = await invoke<{ serviceName: string; port: number; pairingCode: string }>("start_adb_pairing_server");
      return result;
    } catch (error) {
      logService.error(`启动配对服务器失败: ${error}`, "无线调试");
      throw error;
    }
  }

  /**
   * 停止无线配对服务器
   */
  async stopPairingServer(): Promise<void> {
    try {
      await invoke("stop_adb_pairing_server");
      logService.info("无线配对服务器已停止", "无线调试");
    } catch (error) {
      logService.error(`停止配对服务器失败: ${error}`, "无线调试");
    }
  }

  /**
   * 断开无线设备连接
   */
  async disconnectWireless(ip?: string, port?: number): Promise<CommandResult> {
    try {
      const target = ip && port ? `${ip}:${port}` : "";
      logService.info(target ? `正在断开无线连接: ${target}` : `正在断开所有无线连接`, "无线调试");
      const result = await invoke<CommandResult>("execute_adb_command_direct", {
        command: "disconnect",
        args: target ? [target] : [],
      });
      return result;
    } catch (error) {
      logService.error(`断开无线连接失败: ${error}`, "无线调试");
      throw error;
    }
  }
}

export const wirelessService = new WirelessService();
