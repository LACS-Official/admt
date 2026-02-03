/**
 * 开源项目数据定义
 */

export interface OpenSourceProject {
  name: string;
  description: string;
  author: string;
  url: string;
  license: string;
  category: string;
}

export interface ThanksProject {
  name: string;
  description?: string;
  url: string;
  avatar?: string;
}

export const OPEN_SOURCE_PROJECTS: OpenSourceProject[] = [];

export const THANKS_PROJECTS: ThanksProject[] = [];
