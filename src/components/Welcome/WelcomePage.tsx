import React, { useEffect } from "react";
import {
  makeStyles,
  Card,
  Text,
  Button,
  Spinner,
  ProgressBar,
} from "@fluentui/react-components";
import {
  Sparkle24Regular,
  ArrowRight24Regular,
  ArrowLeft24Regular,
  Checkmark24Regular,
} from "@fluentui/react-icons";
import { useWelcomeStore, useAppConfigStore } from "../../stores/welcomeStore";
import { WelcomeStep } from "../../types/welcome";
import WelcomeStepComponent from "./WelcomeStep";

import ActivationStep from "./ActivationStep";
import CompleteStep from "./CompleteStep";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    backgroundColor: "var(--colorBrandBackground)",
    color: "white",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  progressContainer: {
    padding: "16px 24px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  content: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    overflow: "auto",
  },
  stepCard: {
    width: "100%",
    maxWidth: "600px",
    minHeight: "400px",
    display: "flex",
    flexDirection: "column",
  },
  stepContent: {
    flex: 1,
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  footerButtons: {
    display: "flex",
    gap: "12px",
  },
});

const WelcomePage: React.FC = () => {
  const styles = useStyles();
  const {
    currentStep,
    isLoading,
    error,
    nextStep,
    previousStep,
    canProceedToNext,
    setError,
  } = useWelcomeStore();
  
  const { setActivated } = useAppConfigStore();

  // 步骤配置
  const steps = [
    { key: WelcomeStep.WELCOME, title: "欢迎", description: "欢迎使用HOUT工具箱" },
    { key: WelcomeStep.ACTIVATION, title: "激活", description: "输入激活码" },
    { key: WelcomeStep.COMPLETE, title: "完成", description: "设置完成" },
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // 处理下一步
  const handleNext = async () => {
    if (currentStep === WelcomeStep.COMPLETE) {
      // 完成激活流程，进入主应用
      setActivated(true);
      // 这里应该触发路由跳转到主应用
      window.location.reload(); // 临时方案，重新加载应用
      return;
    }
    
    nextStep();
  };

  // 处理上一步
  const handlePrevious = () => {
    previousStep();
  };

  // 渲染当前步骤内容
  const renderStepContent = () => {
    console.log('Rendering step:', currentStep);

    switch (currentStep) {
      case WelcomeStep.WELCOME:
        return <WelcomeStepComponent />;
      case WelcomeStep.ACTIVATION:
        return <ActivationStep />;
      case WelcomeStep.COMPLETE:
        return <CompleteStep />;
      default:
        console.log('Unknown step:', currentStep);
        return null;
    }
  };

  // 获取按钮文本
  const getNextButtonText = () => {
    switch (currentStep) {
      case WelcomeStep.WELCOME:
        return "开始激活";
      case WelcomeStep.ACTIVATION:
        return "下一步";
      case WelcomeStep.COMPLETE:
        return "进入应用";
      default:
        return "下一步";
    }
  };

  // 清除错误
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Sparkle24Regular style={{ fontSize: "32px" }} />
          <Text size={600} weight="bold">HOUT 工具箱</Text>
        </div>
      </div>

      {/* 进度条 */}
      <div className={styles.progressContainer}>
        <div className={styles.progressInfo}>
          <Text size={300} weight="semibold">
            步骤 {currentStepIndex + 1} / {steps.length}: {steps[currentStepIndex]?.title}
          </Text>
          <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
            {Math.round(progress)}% 完成
          </Text>
        </div>
        <ProgressBar value={progress} max={100} />
      </div>

      {/* 主要内容 */}
      <div className={styles.content}>
        <Card className={styles.stepCard}>
          <div className={styles.stepContent}>
            {renderStepContent()}
          </div>
          
          {/* 底部按钮 */}
          <div className={styles.footer}>
            <div>
              {error && (
                <Text style={{ color: "var(--colorPaletteRedForeground1)" }}>
                  {error}
                </Text>
              )}
            </div>
            
            <div className={styles.footerButtons}>
              {currentStep !== WelcomeStep.WELCOME && (
                <Button
                  appearance="subtle"
                  icon={<ArrowLeft24Regular />}
                  onClick={handlePrevious}
                  disabled={isLoading}
                >
                  上一步
                </Button>
              )}
              
              <Button
                appearance="primary"
                icon={isLoading ? <Spinner size="tiny" /> : 
                      currentStep === WelcomeStep.COMPLETE ? <Checkmark24Regular /> : <ArrowRight24Regular />}
                iconPosition="after"
                onClick={handleNext}
                disabled={!canProceedToNext() || isLoading}
              >
                {getNextButtonText()}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WelcomePage;
