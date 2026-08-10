/**
 * 安全的useCallback Hook
 * 解决useCallback读取null属性的错误
 */

import { useCallback, useRef, useEffect } from 'react';

/**
 * 安全的useCallback实现
 * 防止在组件卸载后调用回调函数
 */
export function useSafeCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const isMountedRef = useRef(true);
  const callbackRef = useRef(callback);

  // 更新回调引用
  useEffect(() => {
    callbackRef.current = callback;
  });

  // 组件卸载时标记为未挂载
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(
    ((...args: any[]) => {
      // 检查组件是否仍然挂载
      if (!isMountedRef.current) {
        console.warn('尝试在组件卸载后调用回调函数');
        return;
      }

      // 检查回调函数是否存在
      if (!callbackRef.current) {
        console.warn('回调函数不存在');
        return;
      }

      try {
        return callbackRef.current(...args);
      } catch (error) {
        console.error('回调函数执行错误:', error);
        throw error;
      }
    }) as T,
    deps
  );
}

/**
 * 安全的异步回调Hook
 */
export function useSafeAsyncCallback<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  deps: React.DependencyList
): T {
  const isMountedRef = useRef(true);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(
    (async (...args: any[]) => {
      if (!isMountedRef.current) {
        console.warn('尝试在组件卸载后调用异步回调函数');
        return;
      }

      if (!callbackRef.current) {
        console.warn('异步回调函数不存在');
        return;
      }

      try {
        const result = await callbackRef.current(...args);
        
        // 再次检查组件是否仍然挂载
        if (!isMountedRef.current) {
          console.warn('异步回调完成时组件已卸载');
          return;
        }
        
        return result;
      } catch (error) {
        if (isMountedRef.current) {
          console.error('异步回调函数执行错误:', error);
          throw error;
        } else {
          console.warn('组件卸载后异步回调出错，忽略错误:', error);
        }
      }
    }) as T,
    deps
  );
}

/**
 * 防抖回调Hook
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: any[]) => {
      if (!isMountedRef.current) {
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          try {
            callback(...args);
          } catch (error) {
            console.error('防抖回调执行错误:', error);
          }
        }
      }, delay);
    }) as T,
    [...deps, delay]
  );
}

/**
 * 节流回调Hook
 */
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  const lastCallRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(
    ((...args: any[]) => {
      if (!isMountedRef.current) {
        return;
      }

      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        try {
          return callback(...args);
        } catch (error) {
          console.error('节流回调执行错误:', error);
          throw error;
        }
      }
    }) as T,
    [...deps, delay]
  );
}

export default useSafeCallback;