/**
 * 系统服务使用示例
 * 展示如何使用系统托盘和开机自启动功能
 */

import { systemTrayService } from '../services/systemTrayService';
import { autoStartService } from '../services/autoStartService';

/**
 * 系统托盘使用示例
 */
export class SystemTrayExample {
  /**
   * 基本使用示例
   */
  static async basicUsage() {
    try {
      console.log('🚀 开始系统托盘基本使用示例');
      
      // 初始化托盘
      await systemTrayService.initialize({
        tooltip: '玩机管家 - 正在运行',
        icon: 'icons/app-icon.png',
        menuItems: [
          { id: 'show', label: '显示窗口' },
          { id: 'separator1', label: '-' },
          { id: 'settings', label: '设置' },
          { id: 'about', label: '关于' },
          { id: 'separator2', label: '-' },
          { id: 'exit', label: '退出' }
        ]
      });

      // 设置窗口关闭时最小化到托盘
      await systemTrayService.setupWindowCloseHandler(true);
      
      console.log('✅ 系统托盘基本功能设置完成');
    } catch (error) {
      console.error('❌ 系统托盘基本功能设置失败:', error);
    }
  }

  /**
   * 高级使用示例
   */
  static async advancedUsage() {
    try {
      console.log('🚀 开始系统托盘高级使用示例');
      
      // 检查系统是否支持托盘
      const isSupported = await systemTrayService.isSystemTraySupported();
      if (!isSupported) {
        console.warn('⚠️ 当前系统不支持系统托盘');
        return;
      }

      // 初始化托盘
      await systemTrayService.initialize();

      // 5秒后动态更新托盘菜单
      setTimeout(async () => {
        try {
          await systemTrayService.updateTrayMenu([
            { id: 'show', label: '显示主窗口' },
            { id: 'new', label: '新建项目', enabled: true },
            { id: 'recent', label: '最近项目', enabled: false },
            { id: 'separator1', label: '-' },
            { id: 'tools', label: '工具箱' },
            { id: 'separator2', label: '-' },
            { id: 'exit', label: '退出应用' }
          ]);
          console.log('✅ 托盘菜单已更新');
        } catch (error) {
          console.error('❌ 更新托盘菜单失败:', error);
        }
      }, 5000);

      // 10秒后更新托盘提示
      setTimeout(async () => {
        try {
          await systemTrayService.updateTrayTooltip('玩机管家 - 后台运行中...');
          console.log('✅ 托盘提示已更新');
        } catch (error) {
          console.error('❌ 更新托盘提示失败:', error);
        }
      }, 10000);

      console.log('✅ 系统托盘高级功能设置完成');
    } catch (error) {
      console.error('❌ 系统托盘高级功能设置失败:', error);
    }
  }
}

/**
 * 开机自启动使用示例
 */
export class AutoStartExample {
  /**
   * 基本使用示例
   */
  static async basicUsage() {
    try {
      console.log('🚀 开始开机自启动基本使用示例');
      
      // 初始化服务
      await autoStartService.initialize('玩机管家');

      // 检查当前状态
      const status = await autoStartService.getAutoStartStatus();
      console.log('📋 当前自启动状态:', status);

      // 如果未启用，则启用自启动
      if (!status.isEnabled) {
        const success = await autoStartService.enableAutoStart({
          appName: '玩机管家',
          appPath: '', // 将由后端自动获取
          args: ['--startup'],
          enabled: true
        });

        if (success) {
          console.log('✅ 开机自启动已启用');
        } else {
          console.error('❌ 开机自启动启用失败');
        }
      } else {
        console.log('ℹ️ 开机自启动已经启用');
      }

      console.log('✅ 开机自启动基本功能设置完成');
    } catch (error) {
      console.error('❌ 开机自启动基本功能设置失败:', error);
    }
  }

  /**
   * 高级使用示例
   */
  static async advancedUsage() {
    try {
      console.log('🚀 开始开机自启动高级使用示例');
      
      // 初始化服务
      await autoStartService.initialize('玩机管家');

      // 检查是否支持自启动
      const isSupported = await autoStartService.isAutoStartSupported();
      if (!isSupported) {
        console.warn('⚠️ 当前系统不支持开机自启动');
        return;
      }

      // 获取详细状态
      const status = await autoStartService.getAutoStartStatus();
      console.log('📋 详细自启动状态:', status);

      // 验证自启动设置
      const validation = await autoStartService.validateAutoStart();
      console.log('🔍 自启动验证结果:', validation);

      // 如果验证失败，尝试修复
      if (!validation.isValid) {
        console.log('🔧 检测到自启动设置问题，尝试修复...');
        const repairSuccess = await autoStartService.repairAutoStart();
        
        if (repairSuccess) {
          console.log('✅ 自启动设置修复成功');
        } else {
          console.error('❌ 自启动设置修复失败');
        }
      }

      // 获取配置信息
      const config = await autoStartService.getAutoStartConfig();
      if (config) {
        console.log('⚙️ 当前自启动配置:', config);
      }

      console.log('✅ 开机自启动高级功能设置完成');
    } catch (error) {
      console.error('❌ 开机自启动高级功能设置失败:', error);
    }
  }

  /**
   * 切换自启动状态示例
   */
  static async toggleExample() {
    try {
      console.log('🚀 开始切换自启动状态示例');
      
      // 初始化服务
      await autoStartService.initialize('玩机管家');

      // 获取当前状态
      const beforeStatus = await autoStartService.getAutoStartStatus();
      console.log('📋 切换前状态:', beforeStatus.isEnabled ? '已启用' : '已禁用');

      // 切换状态
      const success = await autoStartService.toggleAutoStart();
      
      if (success) {
        // 获取切换后状态
        const afterStatus = await autoStartService.getAutoStartStatus();
        console.log('📋 切换后状态:', afterStatus.isEnabled ? '已启用' : '已禁用');
        console.log('✅ 自启动状态切换成功');
      } else {
        console.error('❌ 自启动状态切换失败');
      }

    } catch (error) {
      console.error('❌ 切换自启动状态失败:', error);
    }
  }
}

/**
 * 综合使用示例
 */
export class IntegratedExample {
  /**
   * 完整的应用启动示例
   */
  static async fullApplicationSetup() {
    try {
      console.log('🚀 开始完整应用设置示例');
      
      // 1. 初始化系统托盘
      console.log('1️⃣ 设置系统托盘...');
      await systemTrayService.initialize({
        tooltip: '玩机管家',
        menuItems: [
          { id: 'show', label: '显示窗口' },
          { id: 'separator1', label: '-' },
          { id: 'autostart', label: '开机自启动', checked: false },
          { id: 'separator2', label: '-' },
          { id: 'exit', label: '退出' }
        ]
      });

      // 2. 初始化开机自启动
      console.log('2️⃣ 设置开机自启动...');
      await autoStartService.initialize('玩机管家');
      
      // 检查自启动状态并更新托盘菜单
      const autoStartStatus = await autoStartService.getAutoStartStatus();
      await systemTrayService.updateTrayMenu([
        { id: 'show', label: '显示窗口' },
        { id: 'separator1', label: '-' },
        { id: 'autostart', label: '开机自启动', checked: autoStartStatus.isEnabled },
        { id: 'separator2', label: '-' },
        { id: 'exit', label: '退出' }
      ]);

      // 3. 设置窗口关闭行为
      console.log('3️⃣ 设置窗口关闭行为...');
      await systemTrayService.setupWindowCloseHandler(true);

      console.log('✅ 完整应用设置完成');
      console.log('📋 系统托盘:', systemTrayService.isReady() ? '已就绪' : '未就绪');
      console.log('📋 开机自启动:', autoStartService.isReady() ? '已就绪' : '未就绪');
      
    } catch (error) {
      console.error('❌ 完整应用设置失败:', error);
    }
  }
}

// 导出所有示例
export const SystemServicesExamples = {
  SystemTrayExample,
  AutoStartExample,
  IntegratedExample
};