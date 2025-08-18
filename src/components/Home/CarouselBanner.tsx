import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Card,
  Text,
  Button,
} from "@fluentui/react-components";
import {
  ChevronLeft24Regular,
  ChevronRight24Regular,
  Circle12Filled,
  Circle12Regular,
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
    padding: "12px 20px",
    color: "white",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.6) 100%)",
      pointerEvents: "none",
    },
  },
  slideContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    position: "relative",
    zIndex: 1,
  },
  slideTitle: {
    fontSize: "18px",
    fontWeight: "700",
    lineHeight: "1.2",
    textShadow: "0 1px 3px rgba(0,0,0,0.3)",
  },
  slideDescription: {
    fontSize: "14px",
    opacity: 0.95,
    lineHeight: "1.3",
    textShadow: "0 1px 2px rgba(0,0,0,0.2)",
  },
  slideAction: {
    marginTop: "8px",
  },
  navigation: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
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
    bottom: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "6px",
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
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: "12px",
    color: "white",
    textAlign: "center",
    background: "linear-gradient(135deg, #0078d4 0%, #106ebe 50%, #005a9e 100%)",
  },
  errorState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: "12px",
    color: "white",
    textAlign: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #d13438 0%, #b71c1c 50%, #8e0000 100%)",
  },
  retryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    color: "white",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.3)",
    },
  },
});

// 暂时注释掉API数据接口，避免未使用的类型警告
/*
interface ApiBanner {
  id: number;
  websiteId: number;
  title: string;
  description: string | null;
  imageUrl: string;
  imageAlt?: string;
  linkUrl: string | null;
  linkTarget: string;
  sortOrder: number;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    website: {
      id: number;
      name: string;
      domain: string;
    };
    banners: ApiBanner[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
  message?: string;
}
*/

interface SlideData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  linkTarget: string;
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

  // 临时使用固定数据，避免API请求阻塞页面渲染
  const [slides] = useState<SlideData[]>([
    {
      id: "1",
      title: "欢迎使用 HOUT 工具箱",
      description: "现代化的Android设备管理工具，提供设备信息查看、文件管理、ADB工具等丰富功能",
      imageUrl: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop",
      linkTarget: "_self",
    },
    {
      id: "2",
      title: "强大的设备管理功能",
      description: "实时设备检测、详细信息展示、安全状态监控，让您轻松掌控Android设备",
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop",
      linkTarget: "_self",
    },
    {
      id: "3",
      title: "个性化设置体验",
      description: "丰富的自定义选项，主题切换、语言设置、安全防护，打造专属的使用体验",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
      linkTarget: "_self",
    },
  ]);

  // 暂时注释掉API相关状态
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  // const [retryCount, setRetryCount] = useState(0);

  // 暂时注释掉API请求函数，避免阻塞页面渲染
  /*
  const fetchBanners = async (): Promise<ApiBanner[]> => {
    const isDevelopment = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const baseUrl = isDevelopment ? '' : 'https://api-g.lacs.cc';

    const url = `${baseUrl}/api/websites/2/banners?isActive=true&isPublished=true&sortBy=sortOrder&sortOrder=asc`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API返回失败状态');
    }

    return data.data.banners || [];
  };
  */

  // 暂时注释掉API相关函数，避免阻塞页面渲染
  /*
  const convertApiDataToSlides = (banners: ApiBanner[]): SlideData[] => {
    return banners
      .filter(banner => {
        if (!banner || typeof banner !== 'object') return false;
        if (!banner.id || !banner.title || !banner.imageUrl) return false;
        return banner.isActive === true && banner.isPublished === true;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(banner => ({
        id: banner.id.toString(),
        title: banner.title.trim(),
        description: banner.description?.trim() || "点击了解更多详情",
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl || undefined,
        linkTarget: banner.linkTarget || '_self',
      }));
  };

  const loadBanners = async () => {
    // API loading logic commented out
  };

  const handleRetry = () => {
    // Retry logic commented out
  };

  useEffect(() => {
    // loadBanners(); // 暂时注释掉API调用
  }, []);
  */

  // 自动播放
  useEffect(() => {
    if (!autoPlay || slides.length === 0) return;

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

  const handleSlideClick = (slide: SlideData) => {
    if (slide.linkUrl) {
      try {
        if (slide.linkTarget === '_blank') {
          window.open(slide.linkUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = slide.linkUrl;
        }
      } catch (error) {
        console.error('打开链接失败:', error);
      }
    }
  };

  // 暂时注释掉加载和错误状态，直接渲染轮播图
  /*
  if (isLoading) {
    return (
      <Card className={styles.container}>
        <div className={styles.loadingState}>
          <Spinner size="large" />
          <Text>正在加载轮播图...</Text>
        </div>
      </Card>
    );
  }

  if (slides.length === 0) {
    return (
      <Card className={styles.container}>
        <div className={styles.errorState}>
          <ErrorCircle24Regular style={{ fontSize: "48px" }} />
          <Text size={400} weight="semibold">暂无内容</Text>
          <Text size={300}>当前没有可显示的轮播图内容</Text>
        </div>
      </Card>
    );
  }
  */

  return (
    <Card className={styles.container}>
      <div 
        className={styles.carousel}
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={styles.slide}
            onClick={() => handleSlideClick(slide)}
            style={{
              backgroundImage: `url(${slide.imageUrl})`,
              cursor: slide.linkUrl ? 'pointer' : 'default'
            }}
          >
            <div className={styles.slideContent}>
              <Text className={styles.slideTitle}>{slide.title}</Text>
              <Text className={styles.slideDescription}>
                {slide.description}
              </Text>
              {slide.linkUrl && (
                <div className={styles.slideAction}>
                  <Button 
                    appearance="primary"
                    style={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      color: "white",
                    }}
                  >
                    了解更多
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 导航按钮 - 只在有多个slides时显示 */}
      {slides.length > 1 && (
        <>
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
        </>
      )}

      {/* 指示器 - 只在有多个slides时显示 */}
      {slides.length > 1 && (
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
      )}
    </Card>
  );
};

export default CarouselBanner;
