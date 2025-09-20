/**
 * 启动过渡组件
 * 处理从启动流程到主页面的平滑过渡，消除白屏现象
 */

import React, { useEffect, useState } from 'react';
import { makeStyles } from '@fluentui/react-components';
import { motion, AnimatePresence } from 'framer-motion';

const useStyles = makeStyles({
  transitionContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9998,
    pointerEvents: 'none',
  },
  
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, var(--colorNeutralBackground1) 0%, var(--colorNeutralBackground2) 100%)',
  },
  
  curtain: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'var(--colorNeutralBackground1)',
  },
});

interface StartupTransitionProps {
  isTransitioning: boolean;
  onTransitionComplete?: () => void;
}

const StartupTransition: React.FC<StartupTransitionProps> = ({
  isTransitioning,
  onTransitionComplete,
}) => {
  const styles = useStyles();
  const [showCurtain, setShowCurtain] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      setShowCurtain(true);
      
      // 过渡完成后的回调
      const timer = setTimeout(() => {
        setShowCurtain(false);
        onTransitionComplete?.();
      }, 800); // 过渡动画持续时间

      return () => clearTimeout(timer);
    }
  }, [isTransitioning, onTransitionComplete]);

  const curtainVariants = {
    hidden: {
      clipPath: 'circle(0% at 50% 50%)',
    },
    visible: {
      clipPath: 'circle(150% at 50% 50%)',
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      }
    },
    exit: {
      clipPath: 'circle(0% at 50% 50%)',
      transition: {
        duration: 0.4,
        ease: "easeIn",
      }
    }
  };

  const overlayVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        delay: 0.2,
      }
    }
  };

  return (
    <AnimatePresence>
      {showCurtain && (
        <div className={styles.transitionContainer}>
          <motion.div
            className={styles.overlay}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className={styles.curtain}
              variants={curtainVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StartupTransition;