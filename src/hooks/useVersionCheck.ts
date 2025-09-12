import { useState, useEffect, useCallback } from 'react';
import { checkForUpdates } from '../services/versionService';

interface UseVersionCheckResult {
  isChecking: boolean;
  hasUpdate: boolean;
  updateInfo: {
    currentVersion: string;
    localVersion: string;
    downloadUrl: string;
    updateLog?: string;
  } | null;
  error: string | null;
  checkVersion: () => Promise<void>;
}

export function useVersionCheck(autoCheck: boolean = true): UseVersionCheckResult {
  const [isChecking, setIsChecking] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UseVersionCheckResult['updateInfo']>(null);
  const [error, setError] = useState<string | null>(null);

  const checkVersion = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const result = await checkForUpdates();
      
      if (result.hasUpdate && result.updateInfo) {
        setHasUpdate(true);
        setUpdateInfo({
          currentVersion: result.currentVersion,
          localVersion: result.localVersion,
          downloadUrl: result.updateInfo.downloadUrl,
          updateLog: result.updateInfo.updateLog,
        });
      } else {
        setHasUpdate(false);
        setUpdateInfo(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '版本检查失败';
      setError(errorMessage);
      console.error('Version check error:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (autoCheck) {
      // 延迟检查，避免阻塞应用启动
      const timer = setTimeout(() => {
        checkVersion();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [autoCheck, checkVersion]);

  return {
    isChecking,
    hasUpdate,
    updateInfo,
    error,
    checkVersion,
  };
}