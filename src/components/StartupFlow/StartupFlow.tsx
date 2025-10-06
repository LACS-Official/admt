import { AnimatePresence } from "framer-motion";
import { useAppStyles } from "../../styles/appStyles";
import PrivacyConsentDialog from "../StartupFlow/PrivacyConsentDialog";
import ActivationPage from "../StartupFlow/ActivationPage";
import StartupTransition from "./StartupTransition";
import StatusBar from "../Bar/StatusBar";
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
      
      {currentPhase === 'activation-verification' && (
        <ActivationPage
          onSuccess={onActivationSuccess}
          onError={onStartupFlowError}
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
          }}
          onNoUpdate={(currentVersion) => onStartupFlowComplete({ needsUpdate: false, currentVersion })}
          onError={(error) => onStartupFlowError(error)}
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