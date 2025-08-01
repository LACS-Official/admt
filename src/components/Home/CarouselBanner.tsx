import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Card,
  Text,
  Button,
  Badge,
} from "@fluentui/react-components";
import {
  ChevronLeft24Regular,
  ChevronRight24Regular,
  Circle12Filled,
  Circle12Regular,
  Star24Filled,
  Info24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "0px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    border: "1px solid var(--colorNeutralStroke1)",
  },
  carousel: {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    transition: "transform 0.5s ease-in-out",
  },
  slide: {
    minWidth: "100%",
    height: "100%",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px", // 减少内边距适配小尺寸
    background: "linear-gradient(135deg, #0078d4 0%, #106ebe 50%, #005a9e 100%)",
    color: "white",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.1) 100%)",
      pointerEvents: "none",
    },
  },
  slideContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px", // 减少间距适配小尺寸
    position: "relative",
    zIndex: 1,
  },
  slideTitle: {
    fontSize: "16px", // 减少字体大小适配小尺寸
    fontWeight: "700",
    lineHeight: "1.1", // 更紧凑的行高
    textShadow: "0 1px 3px rgba(0,0,0,0.3)",
  },
  slideDescription: {
    fontSize: "11px", // 减少字体大小
    opacity: 0.95,
    lineHeight: "1.2", // 更紧凑的行高
    textShadow: "0 1px 2px rgba(0,0,0,0.2)",
  },
  slideAction: {
    marginTop: "4px", // 减少顶部间距
  },
  slideIcon: {
    fontSize: "36px", // 减少图标大小
    opacity: 0.4,
    marginLeft: "16px", // 减少左边距
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
    position: "relative",
    zIndex: 1,
  },
  navigation: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "50%",
    width: "30px", // 减少按钮大小适配小尺寸
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    color: "white",
    backdropFilter: "blur(10px)",
    zIndex: 2,
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.25)",
      transform: "translateY(-50%) scale(1.1)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    },
  },
  prevButton: {
    left: "12px",
  },
  nextButton: {
    right: "12px",
  },
  indicators: {
    position: "absolute",
    bottom: "8px", // 减少底部距离
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "4px", // 减少间距
    zIndex: 2,
  },
  indicator: {
    cursor: "pointer",
    color: "rgba(255, 255, 255, 0.5)",
    transition: "all 0.3s ease",
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
    "&:hover": {
      color: "rgba(255, 255, 255, 0.8)",
      transform: "scale(1.2)",
    },
  },
  activeIndicator: {
    color: "white",
    transform: "scale(1.3)",
  },
});

interface SlideData {
  id: string;
  title: string;
  description: string;
  actionText: string;
  onAction: () => void;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: "success" | "warning" | "danger" | "brand" | "important" | "informative" | "severe" | "subtle";
}

interface CarouselBannerProps {
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const CarouselBanner: React.FC<CarouselBannerProps> = ({
  autoPlay = true,
  autoPlayInterval = 5000,
}) => {
  const styles = useStyles();
  const [currentSlide, setCurrentSlide] = useState(0);

  // 轮播图数据
  const slides: SlideData[] = [
    {
      id: "welcome",
      title: "欢迎使用 HOUT 工具箱",
      description: "现代化的Android设备管理工具，提供设备信息查看、文件管理、ADB工具等丰富功能",
      actionText: "开始使用",
      onAction: () => console.log("开始使用"),
      icon: <Star24Filled />,
      badge: "推荐",
      badgeColor: "success",
    },
    {
      id: "features",
      title: "强大的设备管理功能",
      description: "实时设备检测、详细信息展示、安全状态监控，让您轻松掌控Android设备",
      actionText: "查看功能",
      onAction: () => console.log("查看功能"),
      icon: <Info24Regular />,
    },
    {
      id: "settings",
      title: "个性化设置体验",
      description: "丰富的自定义选项，主题切换、语言设置、安全防护，打造专属的使用体验",
      actionText: "前往设置",
      onAction: () => console.log("前往设置"),
      icon: <Settings24Regular />,
      badge: "新功能",
      badgeColor: "informative",
    },
  ];

  // 自动播放
  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <Card className={styles.container}>
      <div 
        className={styles.carousel}
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className={styles.slide}>
            <div className={styles.slideContent}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Text className={styles.slideTitle}>{slide.title}</Text>
                {slide.badge && (
                  <Badge 
                    appearance="filled" 
                    color={slide.badgeColor || "informative"}
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                  >
                    {slide.badge}
                  </Badge>
                )}
              </div>
              <Text className={styles.slideDescription}>
                {slide.description}
              </Text>
              <div className={styles.slideAction}>
                <Button 
                  appearance="primary"
                  style={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    color: "white",
                  }}
                  onClick={slide.onAction}
                >
                  {slide.actionText}
                </Button>
              </div>
            </div>
            <div className={styles.slideIcon}>
              {slide.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 导航按钮 */}
      <button 
        className={`${styles.navigation} ${styles.prevButton}`}
        onClick={goToPrevious}
      >
        <ChevronLeft24Regular />
      </button>
      <button 
        className={`${styles.navigation} ${styles.nextButton}`}
        onClick={goToNext}
      >
        <ChevronRight24Regular />
      </button>

      {/* 指示器 */}
      <div className={styles.indicators}>
        {slides.map((_, index) => (
          <div
            key={index}
            className={`${styles.indicator} ${
              index === currentSlide ? styles.activeIndicator : ""
            }`}
            onClick={() => goToSlide(index)}
          >
            {index === currentSlide ? <Circle12Filled /> : <Circle12Regular />}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CarouselBanner;
