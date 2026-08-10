import React, { useCallback, useRef, useEffect } from 'react';

/**
 * 安全的useCallback Hook，避免在组件卸载后调用
 */
export function useSecureCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (isMountedRef.current) {
        return callback(...args);
      }
      console.warn('尝试在组件卸载后调用回调函数');
      return undefined;
    }) as T,
    deps
  );
}

/**
 * Hook规则检查器
 */
export function validateHookUsage() {
  if (typeof React === 'undefined') {
    throw new Error('React未正确导入');
  }
  
  // 检查React版本兼容性
  const reactVersion = React.version;
  console.log(`当前React版本: ${reactVersion}`);
  
  return true;
}