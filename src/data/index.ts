/**
 * 数据模块索引文件
 * 统一导出所有数据相关的模块
 */

// 开源项目数据
export {
  OPEN_SOURCE_PROJECTS,
  THANKS_PROJECTS,
  type OpenSourceProject,
  type ThanksProject
} from './openSourceProjects';

// 数据管理器
export {
  openSourceDataManager,
  OpenSourceDataManager,
  LICENSE_TYPES,
  PROJECT_CATEGORIES
} from './openSourceDataManager';

// 工具函数
export * from './openSourceDataManager';