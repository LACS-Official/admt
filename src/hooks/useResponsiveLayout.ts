import { useState, useEffect } from 'react';

export type LayoutSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface ResponsiveBreakpoints {
  small: number;
  medium: number;
  large: number;
  xlarge: number;
}

const defaultBreakpoints: ResponsiveBreakpoints = {
  small: 600,
  medium: 900,
  large: 1200,
  xlarge: 1600,
};

export const useResponsiveLayout = (customBreakpoints?: Partial<ResponsiveBreakpoints>) => {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getLayoutSize = (): LayoutSize => {
    const { width } = windowSize;
    if (width >= breakpoints.xlarge) return 'xlarge';
    if (width >= breakpoints.large) return 'large';
    if (width >= breakpoints.medium) return 'medium';
    return 'small';
  };

  const layoutSize = getLayoutSize();

  const isSize = (size: LayoutSize) => layoutSize === size;
  const isAtLeast = (size: LayoutSize) => {
    const sizes: LayoutSize[] = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(layoutSize);
    const targetIndex = sizes.indexOf(size);
    return currentIndex >= targetIndex;
  };

  const getGridColumns = (config: { small: number; medium: number; large: number; xlarge?: number }) => {
    switch (layoutSize) {
      case 'xlarge':
        return config.xlarge || config.large;
      case 'large':
        return config.large;
      case 'medium':
        return config.medium;
      default:
        return config.small;
    }
  };

  return {
    windowSize,
    layoutSize,
    isSize,
    isAtLeast,
    getGridColumns,
    breakpoints,
  };
};
