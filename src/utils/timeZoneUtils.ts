/**
 * 时区处理工具函数
 * 确保前端正确处理API返回的时间数据
 */

/**
 * 解析API返回的时间字符串，考虑时区处理
 * @param timeString API返回的时间字符串（ISO 8601格式）
 * @returns Date对象，如果解析失败返回null
 */
export function parseApiTime(timeString: string | undefined | null): Date | null {
  if (!timeString) {
    return null;
  }

  try {
    const date = new Date(timeString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('无效的时间字符串:', timeString);
      return null;
    }

    return date;
  } catch (error) {
    console.error('解析时间字符串失败:', timeString, error);
    return null;
  }
}

/**
 * 格式化过期时间显示
 * @param expiryDate 过期时间Date对象
 * @param includeTime 是否包含时间部分
 * @returns 格式化的时间字符串
 */
export function formatExpiryTime(expiryDate: Date | null, includeTime: boolean = true): string {
  if (!expiryDate) {
    return '未知';
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai', // 中国时区
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
  }

  return expiryDate.toLocaleDateString('zh-CN', options);
}

/**
 * 计算剩余时间
 * @param expiryDate 过期时间
 * @returns 剩余时间信息
 */
export function calculateRemainingTime(expiryDate: Date | null): {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  if (!expiryDate) {
    return {
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const isExpired = diffMs <= 0;

  if (isExpired) {
    return {
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}

/**
 * 格式化剩余时间显示
 * @param remainingTime 剩余时间信息
 * @returns 格式化的剩余时间字符串
 */
export function formatRemainingTime(remainingTime: ReturnType<typeof calculateRemainingTime>): string {
  if (remainingTime.isExpired) {
    return '已过期';
  }

  const parts: string[] = [];

  if (remainingTime.days > 0) {
    parts.push(`${remainingTime.days}天`);
  }

  if (remainingTime.hours > 0) {
    parts.push(`${remainingTime.hours}小时`);
  }

  if (remainingTime.minutes > 0 && remainingTime.days === 0) {
    parts.push(`${remainingTime.minutes}分钟`);
  }

  if (parts.length === 0) {
    if (remainingTime.seconds > 0) {
      return `${remainingTime.seconds}秒`;
    } else {
      return '即将过期';
    }
  }

  return parts.join('');
}

/**
 * 检查是否临近过期
 * @param expiryDate 过期时间
 * @param warningDays 警告天数阈值（默认7天）
 * @param criticalDays 紧急天数阈值（默认1天）
 * @returns 过期状态信息
 */
export function checkExpiryStatus(
  expiryDate: Date | null,
  warningDays: number = 7,
  criticalDays: number = 1
): {
  isExpired: boolean;
  isNearExpiry: boolean;
  isCritical: boolean;
  remainingDays: number;
} {
  if (!expiryDate) {
    return {
      isExpired: true,
      isNearExpiry: false,
      isCritical: false,
      remainingDays: 0,
    };
  }

  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isExpired = remainingDays <= 0;
  const isNearExpiry = remainingDays <= warningDays && remainingDays > criticalDays;
  const isCritical = remainingDays <= criticalDays && remainingDays > 0;

  return {
    isExpired,
    isNearExpiry,
    isCritical,
    remainingDays: Math.max(0, remainingDays),
  };
}

/**
 * 获取过期时间的优先级（API验证时间 > 本地存储时间）
 * @param apiValidationTime API验证返回的过期时间
 * @param localStorageTime 本地存储的过期时间
 * @returns 优先使用的过期时间
 */
export function getPriorityExpiryTime(
  apiValidationTime: string | undefined,
  localStorageTime: string | Date | undefined
): Date | null {
  // 优先使用API验证时间
  if (apiValidationTime) {
    const apiTime = parseApiTime(apiValidationTime);
    if (apiTime) {
      console.log('使用API验证过期时间:', apiValidationTime);
      return apiTime;
    }
  }

  // 备用：使用本地存储时间
  if (localStorageTime) {
    const localTime = typeof localStorageTime === 'string' 
      ? parseApiTime(localStorageTime)
      : localStorageTime;
    
    if (localTime) {
      // console.log('使用本地存储过期时间:', localStorageTime);
      return localTime;
    }
  }

  console.warn('无法获取有效的过期时间');
  return null;
}
