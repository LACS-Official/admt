/**
 * 增强的启动加载器
 * 提供统一的视觉风格、平滑动画和预加载功能
 */

import React, { useEffect, useState, useCallback } from 'react';
import { makeStyles, Text, ProgressBar, Spinner } from '@fluentui/react-components';
import { motion, AnimatePresence } from 'framer-motion';
import { versionManager, useVersionInfo } from '../../utils/versionManager';
import { admtLogo256 } from "../../assets/icons";

const useStyles = makeStyles({
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--colorNeutralBackground1) 0%, var(--colorNeutralBackground2) 100%)',
    zIndex: 9999,
    overflow: 'hidden',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--colorBrandForeground1)',
    textAlign: 'center',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: '48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  
  logo: {
    width: '120px',
    height: '120px',
    borderRadius: '24px',
    objectFit: 'contain',
    filter: 'drop-shadow(0 8px 32px rgba(0, 0, 0, 0.12))',
  },
  
  appTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--colorBrandForeground1)',
    textAlign: 'center',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  
  appSubtitle: {
    fontSize: '16px',
    color: 'var(--colorNeutralForeground2)',
    textAlign: 'center',
    fontWeight: '400',
    marginTop: '8px',
  },
  
  loadingSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    minWidth: '400px',
    maxWidth: '500px',
    width: '90%',
  },
  
  progressContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  
  statusText: {
    fontSize: '16px',
    color: 'var(--colorNeutralForeground1)',
    textAlign: 'center',
    fontWeight: '500',
    minHeight: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  progressBar: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: 'var(--colorNeutralBackground3)',
  },
  
  detailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    marginTop: '32px',
    opacity: 0.8,
  },
  
  phaseIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '20px',
    border: '1px solid var(--colorNeutralStroke2)',
  },
  
  phaseText: {
    fontSize: '14px',
    color: 'var(--colorNeutralForeground2)',
    fontWeight: '500',
  },
  
  spinner: {
    width: '16px',
    height: '16px',
  },
  
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.03,
    backgroundImage: `
      radial-gradient(circle at 25% 25%, var(--colorBrandBackground2) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, var(--colorBrandBackground2) 0%, transparent 50%)
    `,
    pointerEvents: 'none',
  },
  
  loadingDots: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--colorBrandForeground1)',
  },
});

interface EnhancedStartupLoaderProps {
  phase: string;
  progress: number;
  statusMessage: string;
  isVisible: boolean;
  onPreloadComplete?: () => void;
}

const EnhancedStartupLoader: React.FC<EnhancedStartupLoaderProps> = ({
  phase,
  progress,
  statusMessage,
  isVisible,
  onPreloadComplete,
}) => {
  const styles = useStyles();
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isPreloading, setIsPreloading] = useState(true);

  // 预加载关键资源
  const preloadResources = useCallback(async () => {
    const resources = [
      // 预加载主要组件的样式和资源
      '/src/components/MainContent/MainContent.tsx',
      '/src/components/Home/HomePage.tsx',
      '/src/assets/icons/admt/128x128.png',
      '/src/assets/icons/devices/',
    ];

    let loaded = 0;
    const total = resources.length;

    for (const resource of resources) {
      try {
        // 模拟资源加载
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        loaded++;
        setPreloadProgress((loaded / total) * 100);
      } catch (error) {
        console.warn('预加载资源失败:', resource, error);
        loaded++;
        setPreloadProgress((loaded / total) * 100);
      }
    }

    // 预加载完成后等待一小段时间确保平滑过渡
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsPreloading(false);
    onPreloadComplete?.();
  }, [onPreloadComplete]);

  useEffect(() => {
    if (isVisible && isPreloading) {
      preloadResources();
    }
  }, [isVisible, isPreloading, preloadResources]);

  const getPhaseDisplayName = (phase: string): string => {
    switch (phase) {
      case 'first-launch-detection':
        return '初始化设置';
      case 'privacy-consent':
        return '隐私政策确认';
      case 'version-check':
        return '版本检查';
      case 'activation-verification':
        return '激活验证';
      case 'main-app':
        return '加载主界面';
      case 'data-collection':
        return '启动服务';
      default:
        return '正在启动';
    }
  };

  const LoadingDots = () => (
    <div className={styles.loadingDots}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={styles.dot}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );

  const containerVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
    },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      }
    },
    exit: { 
      opacity: 0,
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      }
    }
  };

  const logoVariants = {
    hidden: { 
      scale: 0,
      rotate: -180,
    },
    visible: { 
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: 0.2,
      }
    }
  };

  const textVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: 0.4,
      }
    }
  };

  const progressVariants = {
    hidden: { 
      opacity: 0,
      y: 30,
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: 0.6,
      }
    }
  };

    const { versionInfo, loading: versionLoading } = useVersionInfo();
    const [fullVersionString, setFullVersionString] = useState('玩机管家 v1.0.0');

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={styles.container}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* 背景图案 */}
          <div className={styles.backgroundPattern} />
          
          {/* Logo 和标题区域 */}
          <motion.div 
            className={styles.logoContainer}
            variants={logoVariants}
          >
            <img
              src={admtLogo256}
              alt="玩机管家"
              className={styles.logo}
              onError={(e) => {
                // 如果图片加载失败，使用默认样式
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <motion.div variants={textVariants}>
              <Text className={styles.title}>玩机管家</Text>
            </motion.div>
          </motion.div>

          {/* 加载进度区域 */}
          <motion.div 
            className={styles.loadingSection}
            variants={progressVariants}
          >
            <div className={styles.progressContainer}>
              <div className={styles.statusText}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={statusMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {statusMessage}
                  </motion.span>
                </AnimatePresence>
                <LoadingDots />
              </div>
              
              <ProgressBar 
                value={isPreloading ? preloadProgress / 100 : progress / 100}
                className={styles.progressBar}
              />
            </div>

            {/* 阶段指示器 */}
            <motion.div 
              className={styles.detailsContainer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className={styles.phaseIndicator}>
                <Spinner className={styles.spinner} size="tiny" />
                <Text className={styles.phaseText}>
                  {getPhaseDisplayName(phase)}
                </Text>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedStartupLoader;