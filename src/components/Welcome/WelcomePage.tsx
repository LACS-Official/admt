import React, { useEffect } from "react";
import { useAppConfigStore, useWelcomeStore } from "../../stores/welcomeStore";
import { useStartupFlowStore } from "../../stores/startupFlowStore";
import { activationService } from "../../services/activationService";
import PaginatedWelcomePage from "./PaginatedWelcomePage";
import { WelcomeStep } from "../../types/welcome";

interface WelcomePageProps {
  onComplete?: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onComplete }) => {
  const { setActivated } = useAppConfigStore();
  const { setCurrentPhase } = useStartupFlowStore();
  const { setCurrentStep } = useWelcomeStore();

  // 检查激活状态，如果没有激活码则直接跳转到激活页面
  useEffect(() => {
    const activationInfo = activationService.checkActivationStatus();
    console.log('🔍 WelcomePage 检查激活状态:', {
      isActivated: activationInfo.isActivated,
      needsActivation: activationInfo.needsActivation,
    });

    // 如果需要激活，直接跳转到激活页面
    if (activationInfo.needsActivation || !activationInfo.isActivated) {
      console.log('🔄 检测到需要激活，直接跳转到激活页面');
      setCurrentStep(WelcomeStep.ACTIVATION);
    }
  }, [setCurrentStep]);

  // 使用新的分页式欢迎界面
  const handleWelcomeComplete = () => {
    console.log('🎉 欢迎流程完成');

    // 确保激活状态已设置（这应该在激活页面中已经完成）
    // 这里只是确保状态一致性
    const activationInfo = activationService.checkActivationStatus();
    if (activationInfo.isActivated && !activationInfo.isExpired) {
      setActivated(true);
      // 更新启动流程状态
      setCurrentPhase('completed');
      console.log('✅ 激活状态确认，启动流程完成');
    }

    // 如果有回调函数，调用它（来自StartupFlowManager）
    if (onComplete) {
      onComplete();
    } else {
      // 否则直接设置启动流程完成
      setCurrentPhase('completed');
    }
  };

  return <PaginatedWelcomePage onComplete={handleWelcomeComplete} />;
};

export default WelcomePage;
