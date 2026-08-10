/**
 * 统一的日期时间格式化工具
 * 确保与后端API返回的时间格式保持一致
 */

/**
 * 格式化选项接口
 */
interface DateFormatOptions {
  includeTime?: boolean;
  includeSeconds?: boolean;
  timeZone?: string;
}

/**
 * 默认格式化选项
 */
const DEFAULT_OPTIONS: Required<DateFormatOptions> = {
  includeTime: true,
  includeSeconds: true,
  timeZone: 'Asia/Shanghai'
};

/**
 * 统一的日期时间格式化函数
 * 处理API返回的ISO 8601格式时间字符串
 * 
 * @param dateInput - 日期输入（Date对象或ISO字符串）
 * @param options - 格式化选项
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(
  dateInput: Date | string | null | undefined,
  options: DateFormatOptions = {}
): string {
  if (!dateInput) {
    return '未知';
  }

  try {
    // 确保输入是有效的Date对象
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      console.error('无效的日期格式:', dateInput);
      return '无效日期';
    }

    const finalOptions = { ...DEFAULT_OPTIONS, ...options };

    // 构建格式化选项
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: finalOptions.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };

    // 根据选项添加时间部分
    if (finalOptions.includeTime) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
      
      if (finalOptions.includeSeconds) {
        formatOptions.second = '2-digit';
      }
    }

    return date.toLocaleString('zh-CN', formatOptions);
  } catch (error) {
    console.error('日期格式化失败:', error, '输入值:', dateInput);
    return '格式化失败';
  }
}

/**
 * 格式化激活码过期时间
 * 专门用于显示激活码相关的过期时间
 * 
 * @param expiryDate - 过期时间（Date对象或ISO字符串）
 * @returns 格式化后的过期时间字符串
 */
export function formatActivationExpiryDate(expiryDate: Date | string | null | undefined): string {
  return formatDateTime(expiryDate, {
    includeTime: true,
    includeSeconds: true,
    timeZone: 'Asia/Shanghai'
  });
}

/**
 * 格式化版本发布时间
 * 专门用于显示软件版本发布时间
 * 
 * @param releaseDate - 发布时间（Date对象或ISO字符串）
 * @returns 格式化后的发布时间字符串
 */
export function formatVersionReleaseDate(releaseDate: Date | string | null | undefined): string {
  return formatDateTime(releaseDate, {
    includeTime: true,
    includeSeconds: false,
    timeZone: 'Asia/Shanghai'
  });
}

/**
 * 格式化日期（不包含时间）
 * 用于只需要显示日期的场景
 * 
 * @param date - 日期（Date对象或ISO字符串）
 * @returns 格式化后的日期字符串
 */
export function formatDateOnly(date: Date | string | null | undefined): string {
  return formatDateTime(date, {
    includeTime: false,
    includeSeconds: false,
    timeZone: 'Asia/Shanghai'
  });
}

/**
 * 解析API返回的ISO时间字符串
 * 确保正确处理UTC时间并转换为本地时间
 * 
 * @param isoString - ISO 8601格式的时间字符串
 * @returns Date对象或undefined（如果解析失败）
 */
export function parseApiDateTime(isoString: string | null | undefined): Date | undefined {
  if (!isoString) {
    return undefined;
  }

  try {
    // API返回的格式：2025-01-01T00:00:00.000Z
    const date = new Date(isoString);

    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      console.error('无效的API时间格式:', isoString);
      return undefined;
    }

    console.log('成功解析API时间:', {
      original: isoString,
      parsed: date.toISOString(),
      localTime: formatDateTime(date)
    });

    return date;
  } catch (error) {
    console.error('解析API时间失败:', error, '原始值:', isoString);
    return undefined;
  }
}

/**
 * 检查时间是否已过期
 * 
 * @param expiryDate - 过期时间
 * @returns 是否已过期
 */
export function isExpired(expiryDate: Date | string | null | undefined): boolean {
  if (!expiryDate) {
    return false;
  }

  try {
    const date = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    const now = new Date();
    
    return now > date;
  } catch (error) {
    console.error('检查过期状态失败:', error);
    return false;
  }
}

/**
 * 计算剩余天数
 * 
 * @param expiryDate - 过期时间
 * @returns 剩余天数（负数表示已过期）
 */
export function getRemainingDays(expiryDate: Date | string | null | undefined): number | null {
  if (!expiryDate) {
    return null;
  }

  try {
    const date = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('计算剩余天数失败:', error);
    return null;
  }
}

/**
 * 格式化剩余时间显示
 * 
 * @param minutes - 剩余分钟数
 * @returns 格式化后的剩余时间字符串
 */
export function formatRemainingTime(minutes: number): string {
  if (minutes <= 0) {
    return '已过期';
  }

  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = minutes % 60;

  if (days > 0) {
    return `${days}天${hours}小时${mins}分钟`;
  } else if (hours > 0) {
    return `${hours}小时${mins}分钟`;
  } else {
    return `${mins}分钟`;
  }
}
