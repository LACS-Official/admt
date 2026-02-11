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
      ["ip", "addr", "show", "wlan0"],
      ["ip", "addr", "show", "wlan1"],
      ["ifconfig", "wlan0"],
      ["getprop", "dhcp.wlan0.ipaddress"],
      ["ip", "addr"], // Fallback to all interfaces
    ];

    for (const args of commands) {
      try {
        const result = await invoke<CommandResult>("execute_adb_command", {
          serial,
          command: "shell",
          args,
        });

        if (result.success && result.output) {
          // Parse IP address from result.output
          // Standard ip addr format: inet 192.168.x.x/24
          const ipMatch = result.output.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
          if (ipMatch && ipMatch[1] && ipMatch[1] !== "127.0.0.1") {
            return ipMatch[1];
          }
          
          // ifconfig format: inet addr:192.168.x.x
          const ifconfigMatch = result.output.match(/inet\s+addr:(\d+\.\d+\.\d+\.\d+)/);
          if (ifconfigMatch && ifconfigMatch[1] && ifconfigMatch[1] !== "127.0.0.1") {
            return ifconfigMatch[1];
          }

          // Directly check if output itself is an IP (for getprop)
          const pureIpMatch = result.output.trim().match(/^(\d+\.\d+\.\d+\.\d+)$/);
          if (pureIpMatch && pureIpMatch[1] && pureIpMatch[1] !== "127.0.0.1") {
            return pureIpMatch[1];
          }
        }
      } catch (e) {
        // Continue to next command
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
      throw error;
    }
  }
}

export const wirelessService = new WirelessService();
