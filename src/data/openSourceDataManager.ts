/**
 * 开源项目数据管理
 */
import { OPEN_SOURCE_PROJECTS, OpenSourceProject } from './openSourceProjects';

export const LICENSE_TYPES = {
  MIT: 'MIT',
  APACHE: 'Apache 2.0',
  BSD: 'BSD',
  ISC: 'ISC',
  OTHER: 'Other'
};

export const PROJECT_CATEGORIES = {
  UI: 'UI Components',
  FRAMEWORK: 'Framework',
  TOOL: 'Tool',
  UTILS: 'Utilities',
  OTHER: 'Other'
};

export class OpenSourceDataManager {
  private static instance: OpenSourceDataManager;

  static getInstance(): OpenSourceDataManager {
    if (!OpenSourceDataManager.instance) {
      OpenSourceDataManager.instance = new OpenSourceDataManager();
    }
    return OpenSourceDataManager.instance;
  }

  getAllProjects(): OpenSourceProject[] {
    return OPEN_SOURCE_PROJECTS;
  }
}

export const openSourceDataManager = OpenSourceDataManager.getInstance();
