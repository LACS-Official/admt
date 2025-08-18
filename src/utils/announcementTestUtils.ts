/**
 * 公告功能测试工具
 * 用于测试和验证公告显示功能
 */

import { announcementService } from '../services/announcementService';

export interface AnnouncementTestResult {
  testName: string;
  passed: boolean;
  message: string;
  data?: any;
}

/**
 * 测试公告API连接
 */
export const testAnnouncementAPI = async (): Promise<AnnouncementTestResult> => {
  try {
    console.log('🧪 测试公告API连接...');
    
    const response = await announcementService.getAnnouncements({
      limit: 5,
      isPublished: true,
      sortBy: 'publishedAt',
      sortOrder: 'desc'
    });

    if (response.success) {
      return {
        testName: '公告API连接测试',
        passed: true,
        message: `成功获取 ${response.data.announcements.length} 条公告`,
        data: response.data
      };
    } else {
      return {
        testName: '公告API连接测试',
        passed: false,
        message: `API返回错误: ${response.error}`,
        data: response
      };
    }
  } catch (error) {
    return {
      testName: '公告API连接测试',
      passed: false,
      message: `API请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
      data: error
    };
  }
};

/**
 * 测试公告格式化功能
 */
export const testAnnouncementFormatting = async (): Promise<AnnouncementTestResult> => {
  try {
    console.log('🧪 测试公告格式化功能...');
    
    const response = await announcementService.getAnnouncements({ limit: 1 });
    
    if (response.success && response.data.announcements.length > 0) {
      const announcement = response.data.announcements[0];
      
      // 测试中文格式化
      const zhFormat = announcementService.formatAnnouncement(announcement, 'zh-CN');
      
      // 测试英文格式化
      const enFormat = announcementService.formatAnnouncement(announcement, 'en-US');
      
      return {
        testName: '公告格式化测试',
        passed: true,
        message: '公告格式化功能正常',
        data: {
          original: announcement,
          zhFormat,
          enFormat
        }
      };
    } else {
      return {
        testName: '公告格式化测试',
        passed: false,
        message: '没有可用的公告进行格式化测试',
        data: response
      };
    }
  } catch (error) {
    return {
      testName: '公告格式化测试',
      passed: false,
      message: `格式化测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
      data: error
    };
  }
};

/**
 * 测试重要公告获取
 */
export const testImportantAnnouncements = async (): Promise<AnnouncementTestResult> => {
  try {
    console.log('🧪 测试重要公告获取...');
    
    const announcements = await announcementService.getImportantAnnouncements();
    
    return {
      testName: '重要公告获取测试',
      passed: true,
      message: `成功获取 ${announcements.length} 条重要公告`,
      data: announcements
    };
  } catch (error) {
    return {
      testName: '重要公告获取测试',
      passed: false,
      message: `重要公告获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
      data: error
    };
  }
};

/**
 * 测试最新公告获取
 */
export const testLatestAnnouncements = async (): Promise<AnnouncementTestResult> => {
  try {
    console.log('🧪 测试最新公告获取...');
    
    const announcements = await announcementService.getLatestAnnouncements(3);
    
    return {
      testName: '最新公告获取测试',
      passed: true,
      message: `成功获取 ${announcements.length} 条最新公告`,
      data: announcements
    };
  } catch (error) {
    return {
      testName: '最新公告获取测试',
      passed: false,
      message: `最新公告获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
      data: error
    };
  }
};

/**
 * 运行所有公告测试
 */
export const runAllAnnouncementTests = async (): Promise<AnnouncementTestResult[]> => {
  console.log('🚀 开始运行所有公告测试...');
  
  const tests = [
    testAnnouncementAPI,
    testAnnouncementFormatting,
    testImportantAnnouncements,
    testLatestAnnouncements
  ];
  
  const results: AnnouncementTestResult[] = [];
  
  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
      
      if (result.passed) {
        console.log(`✅ ${result.testName}: ${result.message}`);
      } else {
        console.log(`❌ ${result.testName}: ${result.message}`);
      }
    } catch (error) {
      results.push({
        testName: test.name,
        passed: false,
        message: `测试执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        data: error
      });
      console.log(`💥 ${test.name}: 测试执行失败`);
    }
  }
  
  // 输出测试总结
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log(`\n📊 测试总结:`);
  console.log(`✅ 通过: ${passedTests}/${totalTests}`);
  console.log(`❌ 失败: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  return results;
};

/**
 * 模拟启动流程中的公告获取
 */
export const simulateStartupAnnouncementFlow = async (): Promise<AnnouncementTestResult> => {
  try {
    console.log('🎭 模拟启动流程中的公告获取...');
    
    // 模拟版本检查完成后的公告获取
    const startTime = Date.now();
    
    const response = await announcementService.getAnnouncements({
      limit: 5,
      isPublished: true,
      sortBy: 'publishedAt',
      sortOrder: 'desc'
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.success) {
      const announcements = response.data.announcements;
      
      // 模拟公告显示逻辑
      const hasAnnouncements = announcements.length > 0;
      const displayTime = hasAnnouncements ? 3000 : 1000; // 有公告显示3秒，无公告1秒后跳转
      
      return {
        testName: '启动流程公告获取模拟',
        passed: true,
        message: `模拟成功 - 获取${announcements.length}条公告，耗时${duration}ms，${hasAnnouncements ? '将显示3秒' : '将直接跳转'}`,
        data: {
          announcements,
          duration,
          hasAnnouncements,
          displayTime,
          software: response.data.software
        }
      };
    } else {
      return {
        testName: '启动流程公告获取模拟',
        passed: false,
        message: `模拟失败 - ${response.error}`,
        data: response
      };
    }
  } catch (error) {
    return {
      testName: '启动流程公告获取模拟',
      passed: false,
      message: `模拟失败 - ${error instanceof Error ? error.message : '未知错误'}`,
      data: error
    };
  }
};

/**
 * 获取公告统计信息
 */
export const getAnnouncementStats = async () => {
  try {
    const response = await announcementService.getAnnouncements({
      limit: 100, // 获取更多数据用于统计
      isPublished: true
    });
    
    if (response.success) {
      const announcements = response.data.announcements;
      
      // 统计公告类型
      const typeStats = announcements.reduce((acc, announcement) => {
        acc[announcement.type] = (acc[announcement.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // 统计优先级
      const priorityStats = announcements.reduce((acc, announcement) => {
        acc[announcement.priority] = (acc[announcement.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        total: announcements.length,
        software: response.data.software,
        typeStats,
        priorityStats,
        latest: announcements.slice(0, 5)
      };
    } else {
      throw new Error(response.error || '获取公告统计失败');
    }
  } catch (error) {
    console.error('获取公告统计失败:', error);
    return null;
  }
};

/**
 * 快速测试公告API
 */
export const quickTestAPI = async () => {
  console.log('🚀 快速测试公告API...');

  try {
    const result = await testAnnouncementAPI();
    console.log('📊 测试结果:', result);

    if (result.passed && result.data) {
      console.log('📢 公告数据:', result.data.announcements);
      console.log('🏢 软件信息:', result.data.software);
    }

    return result;
  } catch (error) {
    console.error('💥 测试失败:', error);
    return {
      testName: '快速API测试',
      passed: false,
      message: `测试异常: ${error instanceof Error ? error.message : '未知错误'}`,
      data: error
    };
  }
};

// 在开发环境下将测试函数暴露到全局
if (import.meta.env.DEV) {
  (window as any).announcementTestUtils = {
    testAnnouncementAPI,
    testAnnouncementFormatting,
    testImportantAnnouncements,
    testLatestAnnouncements,
    runAllAnnouncementTests,
    simulateStartupAnnouncementFlow,
    getAnnouncementStats,
    quickTestAPI
  };

  // 自动运行快速测试
  setTimeout(() => {
    console.log('🔧 自动运行公告API测试...');
    quickTestAPI();
  }, 2000);
}
