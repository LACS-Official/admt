//**  
// 这是应用的主组件，负责渲染应用的主要内容和启动流程。
// 主要流程
// 1. 应用初始化
//    - 加载配置
//    - 初始化日志服务
//    - 初始化 ADB 工具
//    - 检查应用是否已激活
// 2. 启动流程
//    - 显示隐私政策对话框
//    - 显示激活验证页面
//    - 显示应用加载动画
//    - 显示启动过渡效果
// 3. 主内容渲染
//    - 显示主内容区域
//    - 显示状态条
// 
//  */

import TitleBar from "./components/Bar/TitleBar";
import MainContent from "./components/MainContent/MainContent";
import StatusBar from "./components/Bar/StatusBar";
import { ErrorNotification } from "./components/Common/ErrorNotification";
import { StartupFlow } from "./components/StartupFlow/StartupFlow";
import StartupVersionChecker from "./components/Common/StartupVersionChecker";
import { useAppStyles } from "./styles/appStyles";
import { useAppStartup } from "./hooks/useAppStartup";
import { useState, useEffect } from "react";

function App() {
  const styles = useAppStyles();
  const {
    isLoading,
    error,
    showStartupFlow,
    showErrorNotification,
    countdown,
    showTransition,
    currentPhase,
    handlePrivacyConsent,
    handleActivationSuccess,
    handleDataCollectionConsent,
    handleStartupFlowError,
    handleStartupFlowComplete
  } = useAppStartup();

  // 版本检查状态
  const [showVersionCheck, setShowVersionCheck] = useState(true);
  const [versionCheckComplete, setVersionCheckComplete] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  // 处理版本检查完成
  const handleVersionCheckComplete = (updateRequired: boolean) => {
    setNeedsUpdate(updateRequired);
    setVersionCheckComplete(true);
    setShowVersionCheck(false);
  };

  // 处理离线使用
  const handleAllowOfflineUse = () => {
    setShowVersionCheck(false);
    setVersionCheckComplete(true);
  };

  // 加载中状态
  if (isLoading) {
    return null;
  }

  // 显示版本检查
  if (showVersionCheck) {
    return (
      <StartupVersionChecker
        onCheckComplete={handleVersionCheckComplete}
        onAllowOfflineUse={handleAllowOfflineUse}
      />
    );
  }

  // 如果需要更新，不继续启动流程
  if (needsUpdate) {
    return null; // StartupVersionChecker 组件会显示更新弹窗
  }

  // 显示错误通知
  if (showErrorNotification && error) {
    return <ErrorNotification error={error} countdown={countdown} />;
  }

  // 显示启动流程
  if (showStartupFlow) {
    return (
      <StartupFlow
        currentPhase={currentPhase}
        showTransition={showTransition}
        onPrivacyConsent={handlePrivacyConsent}
        onActivationSuccess={handleActivationSuccess}
        onDataCollectionConsent={handleDataCollectionConsent}
        onStartupFlowError={handleStartupFlowError}
        onStartupFlowComplete={handleStartupFlowComplete}
        onTransitionComplete={() => {
          // 过渡完成后的处理逻辑在 useAppStartup Hook 中已经处理
        }}
      />
    );
  }

  // 显示主应用界面
  return (
    <div className={styles.app}>
      <TitleBar />
      <MainContent />
      <StatusBar />
    </div>
  );
}

export default App;