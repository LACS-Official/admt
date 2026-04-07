/**
 * 配置文件读取工具
 * 用于加载和解析ADB快捷命令配置文件
 */

import { invoke } from '@tauri-apps/api/core';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { resourceDir, appDataDir } from '@tauri-apps/api/path';
import { listen } from '@tauri-apps/api/event';
import i18n from '../i18n/config';

export interface AdbCommand {
  id: string;
  label: string;
  command: string;
  description: string;
}

export interface CommandCategory {
  id: string;
  name: string;
  description: string;
  commands: AdbCommand[];
}

export interface AdbCommandsConfig {
  categories: CommandCategory[];
  version: string;
  lastUpdated: string;
}

/**
 * 从配置文件加载ADB命令配置
 * @returns Promise<AdbCommandsConfig> 返回解析后的配置对象
 */
export async function loadAdbCommandsConfig(): Promise<AdbCommandsConfig> {
  try {
    // 尝试多种方法来读取配置文件
    
    // 方法1: 使用invoke API调用后端命令
    try {
      console.log('尝试使用invoke API读取配置文件');
      const config = await invoke<AdbCommandsConfig>('read_json_file', { 
        path: 'config/adbCommands.json' 
      });
      console.log('成功使用invoke API读取配置文件:', config);
      return config;
    } catch (invokeError) {
      console.warn('使用invoke API读取配置失败:', invokeError);
      
      // 方法2: 使用readTextFile尝试多种路径
      let configPath = '';
      let configContent = '';
      
      try {
        // 尝试resourceDir
        const resourceDirPath = await resourceDir();
        configPath = `${resourceDirPath}/config/adbCommands.json`;
        console.log('尝试从资源目录读取配置:', configPath);
        configContent = await readTextFile(configPath);
      } catch (resourceError) {
        console.warn('从资源目录读取配置失败:', resourceError);
        
        try {
          // 尝试appDataDir
          const appDataDirPath = await appDataDir();
          configPath = `${appDataDirPath}/config/adbCommands.json`;
          console.log('尝试从应用数据目录读取配置:', configPath);
          configContent = await readTextFile(configPath);
        } catch (appDataError) {
          console.warn('从应用数据目录读取配置失败:', appDataError);
          
          try {
            // 尝试相对路径
            configPath = './src-tauri/config/adbCommands.json';
            console.log('尝试使用相对路径读取配置:', configPath);
            configContent = await readTextFile(configPath);
          } catch (relativeError) {
            console.warn('使用相对路径读取配置失败:', relativeError);
            
            // 方法3: 使用硬编码的默认配置作为最后手段
            console.log('使用硬编码的默认配置');
            return getDefaultAdbCommandsConfig();
          }
        }
      }
      
      console.log('成功读取配置文件:', configPath);
      console.log('配置内容:', configContent);
      
      const config = JSON.parse(configContent) as AdbCommandsConfig;
      return config;
    }
  } catch (error) {
    console.error('加载ADB命令配置失败:', error);
    // 如果所有方法都失败，返回默认配置
    console.log('所有方法都失败，使用硬编码的默认配置');
    return getDefaultAdbCommandsConfig();
  }
}

// 提供默认配置作为后备方案
function getDefaultAdbCommandsConfig(): AdbCommandsConfig {
  const t = i18n.t;
  return {
    categories: [
      {
        id: "software_activation",
        name: t('adb_commands.categories.software_activation'),
        description: "常用软件激活命令",
        commands: [
          {
            id: "activate_shizuku",
            label: t('adb_commands.commands.activate_shizuku'),
            command: "shell sh /sdcard/android/data/moe.shizuku.privileged.api/start.sh",
            description: "激活Shizuku权限管理工具"
          },
          {
            id: "activate_scene",
            label: t('adb_commands.commands.activate_scene'),
            command: "shell sh /data/user/0/com.omarea.vtools/files/up.sh",
            description: "激活Scene工具箱"
          }
        ]
      },
      {
        id: "device_info",
        name: t('adb_commands.categories.device_info'),
        description: "获取设备硬件和系统信息",
        commands: [
          {
            id: "get_device_info",
            label: t('adb_commands.commands.get_device_info'),
            command: "shell getprop",
            description: "获取设备所有系统属性"
          },
          {
            id: "battery_info",
            label: t('adb_commands.commands.battery_info'),
            command: "shell dumpsys battery",
            description: "查看电池状态和健康信息"
          },
          {
            id: "memory_info",
            label: t('adb_commands.commands.memory_info'),
            command: "shell cat /proc/meminfo",
            description: "查看系统内存使用情况"
          },
          {
            id: "storage_info",
            label: t('adb_commands.commands.storage_info'),
            command: "shell df",
            description: "查看存储空间使用情况"
          }
        ]
      },
      {
        id: "apps_processes",
        name: "应用与进程",
        description: "应用和进程管理相关命令",
        commands: [
          {
            id: "list_installed_apps",
            label: t('adb_commands.commands.list_packages'),
            command: "shell pm list packages",
            description: "列出设备上已安装的所有应用包名"
          },
          {
            id: "running_processes",
            label: t('adb_commands.commands.list_processes'),
            command: "shell ps",
            description: "查看当前运行的进程列表"
          },
          {
            id: "system_logs",
            label: t('adb_commands.commands.logcat'),
            command: "logcat -d",
            description: "获取系统日志信息"
          }
        ]
      },
      {
        id: "system_control",
        name: "系统控制",
        description: "系统重启和引导相关命令",
        commands: [
          {
            id: "reboot_recovery",
            label: t('adb_commands.commands.reboot_recovery'),
            command: "reboot recovery",
            description: "重启设备到Recovery模式"
          },
          {
            id: "reboot_fastboot",
            label: t('adb_commands.commands.reboot_fastboot'),
            command: "reboot bootloader",
            description: "重启设备到Fastboot模式"
          },
          {
            id: "reboot_system",
            label: t('adb_commands.commands.reboot_system'),
            command: "reboot",
            description: "重启设备到正常系统"
          }
        ]
      },
      {
        id: "key_simulation",
        name: t('adb_commands.categories.key_simulation'),
        description: "常用按键和媒体控制模拟",
        commands: [
          {
            id: "home",
            label: t('adb_commands.commands.key_home'),
            command: "shell input keyevent 3",
            description: "模拟按下桌面键"
          },
          {
            id: "back",
            label: t('adb_commands.commands.key_back'),
            command: "shell input keyevent 4",
            description: "模拟按下返回键"
          },
          {
            id: "recent_apps",
            label: t('adb_commands.commands.key_recent'),
            command: "shell input keyevent 187",
            description: "显示最近运行的应用列表"
          },
          {
            id: "volume_up",
            label: t('adb_commands.commands.key_volume_up'),
            command: "shell input keyevent 24",
            description: "增加系统音量"
          },
          {
            id: "volume_down",
            label: t('adb_commands.commands.key_volume_down'),
            command: "shell input keyevent 25",
            description: "降低系统音量"
          },
          {
            id: "volume_mute",
            label: t('adb_commands.commands.key_mute'),
            command: "shell input keyevent 164",
            description: "切换系统静音状态"
          },
          {
            id: "media_play_pause",
            label: t('adb_commands.commands.key_play_pause'),
            command: "shell input keyevent 85",
            description: "播放或暂停媒体内容"
          },
          {
            id: "media_next",
            label: t('adb_commands.commands.key_next'),
            command: "shell input keyevent 87",
            description: "切换到下一首媒体内容"
          },
          {
            id: "media_previous",
            label: t('adb_commands.commands.key_previous'),
            command: "shell input keyevent 88",
            description: "切换到上一首媒体内容"
          },
          {
            id: "screenshot",
            label: t('adb_commands.commands.key_screenshot'),
            command: "shell screencap /sdcard/screenshot.png",
            description: "截取当前屏幕并保存"
          },
          {
            id: "menu",
            label: t('adb_commands.commands.key_menu'),
            command: "shell input keyevent 82",
            description: "显示当前应用的菜单"
          },
          {
            id: "search",
            label: t('adb_commands.commands.key_search'),
            command: "shell input keyevent 84",
            description: "启动系统搜索功能"
          },
          {
            id: "power_button",
            label: t('adb_commands.commands.key_power'),
            command: "shell input keyevent 26",
            description: "模拟电源键点击"
          },
          {
            id: "split_screen",
            label: t('adb_commands.commands.key_split_screen'),
            command: "shell input keyevent 286",
            description: "进入或退出系统的分屏模式"
          }
        ]
      },
      {
        id: "quick_settings",
        name: t('adb_commands.categories.system_settings'),
        description: "系统快速设置和开关状态控制",
        commands: [
          {
            id: "brightness_max",
            label: t('adb_commands.commands.brightness_max'),
            command: "shell settings put system screen_brightness 255",
            description: "将屏幕亮度设置为最大值"
          },
          {
            id: "brightness_low",
            label: t('adb_commands.commands.brightness_down'),
            command: "shell settings put system screen_brightness 50",
            description: "将屏幕亮度设置为较低值"
          },
          {
            id: "developer_options",
            label: t('adb_commands.commands.open_developer'),
            command: "shell am start -a android.settings.APPLICATION_DEVELOPMENT_SETTINGS",
            description: "直接跳转到系统的开发者选项页面"
          },
          {
            id: "wifi_on",
            label: t('adb_commands.commands.wifi_on'),
            command: "shell svc wifi enable",
            description: "开启设备WiFi"
          },
          {
            id: "wifi_off",
            label: t('adb_commands.commands.wifi_off'),
            command: "shell svc wifi disable",
            description: "关闭设备WiFi"
          },
          {
            id: "data_on",
            label: t('adb_commands.commands.data_on'),
            command: "shell svc data enable",
            description: "开启移动数据网络"
          },
          {
            id: "data_off",
            label: t('adb_commands.commands.data_off'),
            command: "shell svc data disable",
            description: "关闭移动数据网络"
          },
          {
            id: "airplane_mode_on",
            label: t('adb_commands.commands.airplane_on'),
            command: "shell settings put global airplane_mode_on 1 && am broadcast -a android.intent.action.AIRPLANE_MODE --ez state true",
            description: "开启飞行模式"
          },
          {
            id: "airplane_mode_off",
            label: t('adb_commands.commands.airplane_off'),
            command: "shell settings put global airplane_mode_on 0 && am broadcast -a android.intent.action.AIRPLANE_MODE --ez state false",
            description: "关闭飞行模式"
          },
          {
            id: "flashlight_on",
            label: t('adb_commands.commands.flashlight_on'),
            command: "shell cmd flashlight set-on true",
            description: "开启核心手电筒"
          },
          {
            id: "flashlight_off",
            label: t('adb_commands.commands.flashlight_off'),
            command: "shell cmd flashlight set-on false",
            description: "关闭核心手电筒"
          },
          {
            id: "auto_rotate_on",
            label: t('adb_commands.commands.autorotate_on'),
            command: "shell settings put system accelerometer_rotation 1",
            description: "开启屏幕自动旋转"
          },
          {
            id: "auto_rotate_off",
            label: t('adb_commands.commands.autorotate_off'),
            command: "shell settings put system accelerometer_rotation 0",
            description: "关闭屏幕自动旋转"
          }
        ]
      }
    ],
    version: "1.0.0",
    lastUpdated: "2026-03-18"
  };
}



/**
 * 保存ADB命令配置到文件
 * @param config 要保存的配置对象
 * @returns Promise<boolean> 保存是否成功
 */
export async function saveAdbCommandsConfig(config: AdbCommandsConfig): Promise<boolean> {
  try {
    // 更新配置的修改时间
    config.lastUpdated = new Date().toISOString().split('T')[0]; // 格式化为YYYY-MM-DD
    
    const configContent = JSON.stringify(config, null, 2);
    
    // 使用新实现的write_json_file命令
    try {
      console.log('尝试使用write_json_file API保存配置文件');
      await invoke('write_json_file', { 
        path: 'config/adbCommands.json',
        content: configContent
      });
      console.log('成功使用write_json_file API保存配置文件');
      return true;
    } catch (error) {
      console.error('保存ADB命令配置失败:', error);
      return false;
    }
  } catch (error) {
    console.error('保存ADB命令配置失败:', error);
    return false;
  }
}

/**
 * 扁平化所有命令以便搜索
 * @param categories 命令分类数组
 * @returns 包含分类信息的扁平化命令数组
 */
export function flattenCommands(categories: CommandCategory[]): Array<AdbCommand & { category: string }> {
  return categories.flatMap(category => 
    category.commands.map(cmd => ({ ...cmd, category: category.name }))
  );
}

/**
 * 根据搜索词过滤命令
 * @param categories 命令分类数组
 * @param searchTerm 搜索词
 * @returns 过滤后的分类数组
 */
export function filterCommandsBySearchTerm(
  categories: CommandCategory[], 
  searchTerm: string
): CommandCategory[] {
  if (!searchTerm.trim()) {
    return categories;
  }
  
  const lowerSearch = searchTerm.toLowerCase();
  const filteredCategories: CommandCategory[] = [];
  
  for (const category of categories) {
    const filteredCommands = category.commands.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerSearch) || 
      cmd.command.toLowerCase().includes(lowerSearch) ||
      cmd.description.toLowerCase().includes(lowerSearch)
    );
    
    if (filteredCommands.length > 0) {
      filteredCategories.push({
        ...category,
        commands: filteredCommands
      });
    }
  }
  
  return filteredCategories;
}

/**
 * 启动配置文件监听
 * @param callback 配置文件变化时的回调函数
 * @returns Promise<() => void> 返回一个函数，调用它可以停止监听
 */
export async function watchConfigFile(callback: (config: AdbCommandsConfig) => void): Promise<() => void> {
  try {
    // 启动后端文件监听
    await invoke('watch_config_file');
    console.log('已启动配置文件监听');
    
    // 添加防抖动机制，避免短时间内多次重新加载配置
    let debounceTimer: NodeJS.Timeout | null = null;
    
    // 监听配置文件变化事件
    const unlisten = await listen('config-file-changed', async () => {
      console.log('检测到配置文件变化，准备重新加载配置');
      
      // 清除之前的防抖动定时器
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // 设置新的防抖动定时器，延迟500ms执行
      debounceTimer = setTimeout(async () => {
        try {
          console.log('正在重新加载配置文件...');
          const newConfig = await loadAdbCommandsConfig();
          console.log('配置文件重新加载完成，应用新配置');
          callback(newConfig);
        } catch (error) {
          console.error('重新加载配置失败:', error);
        }
      }, 500);
    });
    
    // 返回停止监听的函数
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      unlisten();
      console.log('已停止配置文件监听');
    };
  } catch (error) {
    console.error('启动配置文件监听失败:', error);
    // 返回一个空的停止函数
    return () => {};
  }
}

/**
 * 从配置文件加载Fastboot命令配置
 * @returns Promise<AdbCommandsConfig> 返回解析后的配置对象
 */
export async function loadFastbootCommandsConfig(): Promise<AdbCommandsConfig> {
  try {
    // 尝试多种方法来读取配置文件
    
    // 方法1: 使用invoke API调用后端命令
    try {
      console.log('尝试使用invoke API读取Fastboot配置文件');
      const config = await invoke<AdbCommandsConfig>('read_json_file', { 
        path: 'config/FastbootCommands.json' 
      });
      console.log('成功使用invoke API读取Fastboot配置文件:', config);
      return config;
    } catch (invokeError) {
      console.warn('使用invoke API读取Fastboot配置失败:', invokeError);
      
      // 方法2: 使用readTextFile尝试多种路径
      let configPath = '';
      let configContent = '';
      
      try {
        // 尝试resourceDir
        const resourceDirPath = await resourceDir();
        configPath = `${resourceDirPath}/config/FastbootCommands.json`;
        console.log('尝试从资源目录读取Fastboot配置:', configPath);
        configContent = await readTextFile(configPath);
      } catch (resourceError) {
        console.warn('从资源目录读取Fastboot配置失败:', resourceError);
        
        try {
          // 尝试appDataDir
          const appDataDirPath = await appDataDir();
          configPath = `${appDataDirPath}/config/FastbootCommands.json`;
          console.log('尝试从应用数据目录读取Fastboot配置:', configPath);
          configContent = await readTextFile(configPath);
        } catch (appDataError) {
          console.warn('从应用数据目录读取Fastboot配置失败:', appDataError);
          
          try {
            // 尝试相对路径
            configPath = './src-tauri/config/FastbootCommands.json';
            console.log('尝试使用相对路径读取Fastboot配置:', configPath);
            configContent = await readTextFile(configPath);
          } catch (relativeError) {
            console.warn('使用相对路径读取Fastboot配置失败:', relativeError);
            
            // 方法3: 使用硬编码的默认配置作为最后手段
            console.log('使用硬编码的默认Fastboot配置');
            return getDefaultFastbootCommandsConfig();
          }
        }
      }
      
      console.log('成功读取Fastboot配置文件:', configPath);
      console.log('Fastboot配置内容:', configContent);
      
      const config = JSON.parse(configContent) as AdbCommandsConfig;
      return config;
    }
  } catch (error) {
    console.error('加载Fastboot命令配置失败:', error);
    // 如果所有方法都失败，返回默认配置
    console.log('所有方法都失败，使用硬编码的默认Fastboot配置');
    return getDefaultFastbootCommandsConfig();
  }
}

// 提供默认Fastboot配置作为后备方案
function getDefaultFastbootCommandsConfig(): AdbCommandsConfig {
  const t = i18n.t;
  return {
    categories: [
      {
        id: "device_info",
        name: t('adb_commands.categories.fastboot_basic'),
        description: "获取fastboot设备的基本信息和状态",
        commands: [
          {
            id: "list_devices",
            label: t('adb_commands.commands.fb_devices'),
            command: "devices",
            description: "列出当前连接的所有fastboot设备"
          },
          {
            id: "get_variables",
            label: t('adb_commands.commands.fb_getvar'),
            command: "getvar all",
            description: "获取设备的所有变量信息"
          },
          {
            id: "oem_info",
            label: t('adb_commands.commands.fb_oem_info'),
            command: "oem device-info",
            description: "获取OEM设备信息"
          }
        ]
      },
      {
        id: "flash_operations",
        name: t('adb_commands.categories.fastboot_flash'),
        description: "刷写设备分区镜像",
        commands: [
          {
            id: "flash_boot",
            label: t('adb_commands.commands.fb_flash_boot'),
            command: "flash boot boot.img",
            description: "刷写boot分区镜像"
          },
          {
            id: "flash_recovery",
            label: t('adb_commands.commands.fb_flash_recovery'),
            command: "flash recovery recovery.img",
            description: "刷写recovery分区镜像"
          },
          {
            id: "flash_system",
            label: t('adb_commands.commands.fb_flash_system'),
            command: "flash system system.img",
            description: "刷写system分区镜像"
          },
          {
            id: "flash_vendor",
            label: t('adb_commands.commands.fb_flash_vendor'),
            command: "flash vendor vendor.img",
            description: "刷写vendor分区镜像"
          }
        ]
      },
      {
        id: "partition_operations",
        name: t('adb_commands.categories.fastboot_erase'),
        description: "擦除和格式化设备分区",
        commands: [
          {
            id: "erase_cache",
            label: t('adb_commands.commands.fb_erase_cache'),
            command: "erase cache",
            description: "擦除cache分区"
          },
          {
            id: "erase_userdata",
            label: t('adb_commands.commands.fb_erase_data'),
            command: "erase userdata",
            description: "擦除userdata分区（恢复出厂设置）"
          },
          {
            id: "format_cache",
            label: t('adb_commands.commands.fb_format_cache'),
            command: "format cache",
            description: "格式化cache分区"
          },
          {
            id: "format_userdata",
            label: t('adb_commands.commands.fb_format_data'),
            command: "format userdata",
            description: "格式化userdata分区"
          }
        ]
      },
      {
        id: "reboot_operations",
        name: t('adb_commands.categories.fastboot_reboot'),
        description: "设备重启和引导相关命令",
        commands: [
          {
            id: "reboot_system",
            label: t('adb_commands.commands.fb_reboot_system'),
            command: "reboot",
            description: "重启设备到正常系统"
          },
          {
            id: "reboot_bootloader",
            label: t('adb_commands.commands.fb_reboot_bootloader'),
            command: "reboot bootloader",
            description: "重启设备到bootloader模式"
          },
          {
            id: "reboot_recovery",
            label: t('adb_commands.commands.fb_reboot_recovery'),
            command: "reboot recovery",
            description: "重启设备到Recovery模式"
          },
          {
            id: "reboot_fastboot",
            label: t('adb_commands.commands.fb_reboot_fastboot'),
            command: "reboot-fastboot",
            description: "重启设备到fastboot模式"
          }
        ]
      },
      {
        id: "security_operations",
        name: t('adb_commands.categories.fastboot_unlock'),
        description: "Bootloader解锁和锁定相关操作",
        commands: [
          {
            id: "unlock_bootloader",
            label: t('adb_commands.commands.fb_unlock'),
            command: "unlock",
            description: "解锁设备Bootloader"
          },
          {
            id: "lock_bootloader",
            label: t('adb_commands.commands.fb_lock'),
            command: "lock",
            description: "锁定设备Bootloader"
          },
          {
            id: "flashing_unlock",
            label: t('adb_commands.commands.fb_unlock_critical'),
            command: "flashing unlock",
            description: "解锁设备刷写权限（新设备）"
          },
          {
            id: "flashing_lock",
            label: t('adb_commands.commands.fb_lock_critical'),
            command: "flashing lock",
            description: "锁定设备刷写权限"
          }
        ]
      }
    ],
    version: "2.0.0",
    lastUpdated: "2025-06-18"
  };
}

/**
 * 保存Fastboot命令配置到文件
 * @param config 要保存的配置对象
 * @returns Promise<boolean> 保存是否成功
 */
export async function saveFastbootCommandsConfig(config: AdbCommandsConfig): Promise<boolean> {
  try {
    // 更新配置的修改时间
    config.lastUpdated = new Date().toISOString().split('T')[0]; // 格式化为YYYY-MM-DD
    
    const configContent = JSON.stringify(config, null, 2);
    
    // 使用新实现的write_json_file命令
    try {
      console.log('尝试使用write_json_file API保存Fastboot配置文件');
      await invoke('write_json_file', { 
        path: 'config/FastbootCommands.json',
        content: configContent
      });
      console.log('成功使用write_json_file API保存Fastboot配置文件');
      return true;
    } catch (error) {
      console.error('保存Fastboot命令配置失败:', error);
      return false;
    }
  } catch (error) {
    console.error('保存Fastboot命令配置失败:', error);
    return false;
  }
}

/**
 * 启动Fastboot配置文件监听
 * @param callback 配置文件变化时的回调函数
 * @returns Promise<() => void> 返回一个函数，调用它可以停止监听
 */
export async function watchFastbootConfigFile(callback: (config: AdbCommandsConfig) => void): Promise<() => void> {
  try {
    // 启动后端文件监听
    await invoke('watch_fastboot_config_file');
    console.log('已启动Fastboot配置文件监听');
    
    // 添加防抖动机制，避免短时间内多次重新加载配置
    let debounceTimer: NodeJS.Timeout | null = null;
    
    // 监听配置文件变化事件
    const unlisten = await listen('fastboot-config-file-changed', async () => {
      console.log('检测到Fastboot配置文件变化，准备重新加载配置');
      
      // 清除之前的防抖动定时器
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // 设置新的防抖动定时器，延迟500ms执行
      debounceTimer = setTimeout(async () => {
        try {
          console.log('正在重新加载Fastboot配置文件...');
          const newConfig = await loadFastbootCommandsConfig();
          console.log('Fastboot配置文件重新加载完成，应用新配置');
          callback(newConfig);
        } catch (error) {
          console.error('重新加载Fastboot配置失败:', error);
        }
      }, 500);
    });
    
    // 返回停止监听的函数
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      unlisten();
      console.log('已停止Fastboot配置文件监听');
    };
  } catch (error) {
    console.error('启动Fastboot配置文件监听失败:', error);
    // 返回一个空的停止函数
    return () => {};
  }
}