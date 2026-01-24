import { AnimatePresence } from "framer-motion";
import { useAppStyles } from "../../styles/appStyles";
import PrivacyConsentDialog from "../StartupFlow/PrivacyConsentDialog";
import StartupTransition from "./StartupTransition";
import VersionChecker from "../Common/VersionChecker";

interface StartupFlowProps {
  currentPhase: string;
  showTransition: boolean;
  onPrivacyConsent: () => void;
  onActivationSuccess: (status: any) => void;
  onDataCollectionConsent: (consent: boolean) => void;
  onStartupFlowError: (error: string) => void;
  onStartupFlowComplete: (result: any) => void;
  onTransitionComplete: () => void;
}

export const StartupFlow = ({
  currentPhase,
  showTransition,
  onPrivacyConsent,
  onActivationSuccess,
  onDataCollectionConsent,
  onStartupFlowError,
  onStartupFlowComplete,
  onTransitionComplete
}: StartupFlowProps) => {
  const styles = useAppStyles();

  return (
    <div className={styles.startupFlowContainer}>
      {/* 根据当前阶段渲染不同的启动流程组件 */}
      {currentPhase === 'privacy-consent' && (
        <PrivacyConsentDialog
          open={true}
          onAccept={onPrivacyConsent}
          onReject={() => onStartupFlowError('用户拒绝隐私政策')}
        />
      )}
      
      
      {currentPhase === 'data-collection' && (
        <PrivacyConsentDialog
          open={true}
          onAccept={() => onDataCollectionConsent(true)}
          onReject={() => onStartupFlowError('用户拒绝数据收集')}
        />
      )}
      
      {currentPhase === 'version-check' && (
        <VersionChecker
          autoCheck={true}
          onUpdateFound={(result) => {
            // 检测到有更新，不调用onStartupFlowComplete，让用户停留在更新弹窗
            console.log('检测到有更新，显示更新弹窗，不允许进入主页面');
            // 确保不会进入主页面 - 不调用任何完成回调
            // 用户必须处理更新后才能继续
          }}
          onNoUpdate={(currentVersion) => {
            // 只有在没有更新时才允许进入主页面
            console.log('没有检测到更新，允许进入主页面');
            onStartupFlowComplete({ needsUpdate: false, currentVersion });
          }}
          onError={(error) => {
            // 版本检查出错，也不允许进入主页面
            console.log('版本检查出错，不允许进入主页面');
            // 不调用onStartupFlowError，阻止用户进入主页面
          }}
        />
      )}
      
      {/* 显示过渡动画 */}
      <AnimatePresence>
        {showTransition && (
          <div className={styles.transitionContainer}>
            <StartupTransition
              isTransitioning={showTransition}
              onComplete={onTransitionComplete}
            />
          </div>
        )}
      </AnimatePresence>
      
      {/* <StatusBar /> */}
    </div>
  );
};