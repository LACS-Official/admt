import { deviceService } from "./deviceService";
import { logService } from "./logService";
import { useConfigStore } from "../stores/configStore";

export class ControlService {
  /**
   * 执行配置中的命令
   */
  async executeCommand(serial: string, commandId: string): Promise<{ success: boolean; error?: string }> {
    const { adbCommands } = useConfigStore.getState();
    
    if (!adbCommands) {
      return { success: false, error: 'Configuration not loaded' };
    }

    // 在所有分类中查找命令
    let foundCommand = null;
    for (const category of adbCommands.categories) {
      const cmd = category.commands.find(c => c.id === commandId);
      if (cmd) {
        foundCommand = cmd;
        break;
      }
    }

    if (!foundCommand) {
      return { success: false, error: `Command not found: ${commandId}` };
    }

    // 如果命令为空（如分区 ID 或滚动锚点），返回成功但提示不可执行
    if (!foundCommand.command || foundCommand.command.trim().length === 0) {
      return { success: true }; 
    }

    try {
      // 解析命令字符串
      const fullCmd = foundCommand.command.trim();
      let mainCmd: string;
      let args: string[];

      if (fullCmd.startsWith('shell ')) {
        // 如果是 shell 命令且包含 && || 等操作符，或者只是为了安全，将 shell 后的内容作为单个参数
        mainCmd = 'shell';
        const shellContent = fullCmd.substring(6).trim();
        
        // 如果包含 shell 特殊字符，则不拆分参数，整体作为字符串传递
        if (shellContent.includes('&') || shellContent.includes('|') || shellContent.includes('>') || shellContent.includes(';')) {
            args = [shellContent];
        } else {
            args = shellContent.split(/\s+/);
        }
      } else {
        const parts = fullCmd.split(/\s+/);
        mainCmd = parts[0];
        args = parts.slice(1);
      }

      const result = await deviceService.executeAdbCommand(serial, mainCmd, args);
      if (result.success) {
        await logService.info(`Executed command: ${commandId}`, 'ControlService', { serial });
        return { success: true };
      } else {
        await logService.error(`Command failed: ${commandId}`, 'ControlService', { error: result.error, serial });
        return { success: false, error: result.error };
      }
    } catch (error) {
      await logService.error(`Exception during command: ${commandId}`, 'ControlService', { error: String(error), serial });
      return { success: false, error: String(error) };
    }
  }
}

export const controlService = new ControlService();
