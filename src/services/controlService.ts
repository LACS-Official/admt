import { deviceService } from "./deviceService";
import { logService } from "./logService";

export interface ControlCommand {
  id: string;
  label: string;
  command: string[];
  description: string;
  category: 'key' | 'system' | 'network';
}

export const CONTROL_COMMANDS: Record<string, ControlCommand> = {
  // Key Simulation
  'home': { id: 'home', label: 'adb.home', command: ["shell", "input", "keyevent", "3"], description: 'device_control.desc_home', category: 'key' },
  'back': { id: 'back', label: 'adb.back', command: ["shell", "input", "keyevent", "4"], description: 'device_control.desc_back', category: 'key' },
  'recent_apps': { id: 'recent_apps', label: 'adb.recent_apps', command: ["shell", "input", "keyevent", "187"], description: 'device_control.desc_recent_apps', category: 'key' },
  'screenshot': { id: 'screenshot', label: 'adb.screenshot', command: ["shell", "screencap", "/sdcard/screenshot.png"], description: 'device_control.desc_screenshot', category: 'key' },
  'lock_screen': { id: 'lock_screen', label: 'adb.lock_screen', command: ["shell", "input", "keyevent", "26"], description: 'device_control.desc_lock_screen', category: 'key' },
  'wake_up': { id: 'wake_up', label: 'adb.wake_up', command: ["shell", "input", "keyevent", "224"], description: 'device_control.desc_wake_up', category: 'key' },
  'volume_up': { id: 'volume_up', label: 'device_control.volume_up', command: ["shell", "input", "keyevent", "24"], description: 'device_control.desc_volume_up', category: 'key' },
  'volume_down': { id: 'volume_down', label: 'device_control.volume_down', command: ["shell", "input", "keyevent", "25"], description: 'device_control.desc_volume_down', category: 'key' },
  'volume_mute': { id: 'volume_mute', label: 'device_control.volume_mute', command: ["shell", "input", "keyevent", "164"], description: 'device_control.desc_volume_mute', category: 'key' },
  'media_play_pause': { id: 'media_play_pause', label: 'device_control.media_play_pause', command: ["shell", "input", "keyevent", "85"], description: 'device_control.desc_media_play_pause', category: 'key' },
  'media_next': { id: 'media_next', label: 'device_control.media_next', command: ["shell", "input", "keyevent", "87"], description: 'device_control.desc_media_next', category: 'key' },
  'media_previous': { id: 'media_previous', label: 'device_control.media_previous', command: ["shell", "input", "keyevent", "88"], description: 'device_control.desc_media_previous', category: 'key' },
  'menu_key': { id: 'menu_key', label: 'device_control.menu_key', command: ["shell", "input", "keyevent", "82"], description: 'device_control.desc_menu_key', category: 'key' },
  'search_key': { id: 'search_key', label: 'device_control.search_key', command: ["shell", "input", "keyevent", "84"], description: 'device_control.desc_search_key', category: 'key' },
  'power_button': { id: 'power_button', label: 'device_control.power_button', command: ["shell", "input", "keyevent", "26"], description: 'device_control.desc_power_button', category: 'key' },
  'split_screen': { id: 'split_screen', label: 'device_control.split_screen', command: ["shell", "input", "keyevent", "286"], description: 'device_control.desc_split_screen', category: 'key' },
  
  // Section IDs for scrolling
  'display_control': { id: 'display_control', label: 'device_control.display_control', command: [], description: '', category: 'system' },
  'animation_speed': { id: 'animation_speed', label: 'device_control.animation_speed', command: [], description: '', category: 'system' },
  'power_management': { id: 'power_management', label: 'device_control.power_management', command: [], description: '', category: 'system' },
};

export class ControlService {
  async executeCommand(serial: string, commandId: string): Promise<{ success: boolean; error?: string }> {
    const cmd = CONTROL_COMMANDS[commandId];
    if (!cmd || cmd.command.length === 0) {
      return { success: false, error: 'Command not found or not executable' };
    }

    try {
      const result = await deviceService.executeAdbCommand(serial, cmd.command[0], cmd.command.slice(1));
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
