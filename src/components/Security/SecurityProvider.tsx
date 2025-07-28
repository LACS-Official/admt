import React, { useEffect, useState, createContext, useContext } from 'react';
import { securityProtection } from '../../utils/securityProtection';

interface SecurityContextType {
  isProtectionEnabled: boolean;
  setProtectionEnabled: (enabled: boolean) => void;
  isDevToolsDetected: boolean;
  isRefreshProtectionEnabled: boolean;
  setRefreshProtectionEnabled: (enabled: boolean) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
  enableProtection?: boolean;
  onDevToolsDetected?: () => void;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({
  children,
  enableProtection = true,
  onDevToolsDetected
}) => {
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(enableProtection);
  const [isDevToolsDetected, setIsDevToolsDetected] = useState(false);
  const [isRefreshProtectionEnabled, setIsRefreshProtectionEnabled] = useState(true);

  useEffect(() => {
    // 设置保护状态
    securityProtection.setProtectionEnabled(isProtectionEnabled);
    securityProtection.setRefreshProtectionEnabled(isRefreshProtectionEnabled);

    // 设置开发者工具检测回调
    securityProtection.setDevToolsDetectedCallback(() => {
      setIsDevToolsDetected(true);
      if (onDevToolsDetected) {
        onDevToolsDetected();
      }
    });

    return () => {
      // 清理资源
      securityProtection.setProtectionEnabled(false);
      securityProtection.setRefreshProtectionEnabled(false);
    };
  }, [isProtectionEnabled, isRefreshProtectionEnabled, onDevToolsDetected]);

  const setProtectionEnabled = (enabled: boolean) => {
    setIsProtectionEnabled(enabled);
    securityProtection.setProtectionEnabled(enabled);
  };

  const setRefreshProtectionEnabled = (enabled: boolean) => {
    setIsRefreshProtectionEnabled(enabled);
    securityProtection.setRefreshProtectionEnabled(enabled);
  };

  const contextValue: SecurityContextType = {
    isProtectionEnabled,
    setProtectionEnabled,
    isDevToolsDetected,
    isRefreshProtectionEnabled,
    setRefreshProtectionEnabled
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};
