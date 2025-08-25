/**
 * 应用图标组件
 * 使用玩机管家的实际图标
 */

import React from 'react';
import {
  makeStyles,
  mergeClasses,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
  },
  image: {
    objectFit: 'contain',
    borderRadius: '4px',
    width: '100%',
    height: '100%',
  },
  large: {
    width: '48px',
    height: '48px',
  },
  xlarge: {
    width: '64px',
    height: '64px',
  },
  small: {
    width: '24px',
    height: '24px',
  },
});

interface AppIconProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
}

const AppIcon: React.FC<AppIconProps> = ({ size = 'medium', className }) => {
  const styles = useStyles();

  const sizeClass = size === 'large' ? styles.large :
                   size === 'xlarge' ? styles.xlarge :
                   size === 'small' ? styles.small : '';

  // 根据尺寸选择合适的图标文件
  const getIconPath = () => {
    switch (size) {
      case 'small':
        return '/src-tauri/icons/32x32.png';
      case 'medium':
        return '/src-tauri/icons/64x64.png';
      case 'large':
        return '/src-tauri/icons/128x128.png';
      case 'xlarge':
        return '/src-tauri/icons/玩机管家_256.png';
      default:
        return '/src-tauri/icons/64x64.png';
    }
  };

  return (
    <div
      className={mergeClasses(styles.icon, sizeClass, className)}
      role="img"
      aria-label="玩机管家图标"
    >
      <img
        src={getIconPath()}
        alt="玩机管家"
        className={styles.image}
        onError={(e) => {
          // 如果图标加载失败，使用玩机管家.png作为备用
          const target = e.target as HTMLImageElement;
          target.src = '/src-tauri/icons/玩机管家.png';
        }}
      />
    </div>
  );
};

export default AppIcon;
