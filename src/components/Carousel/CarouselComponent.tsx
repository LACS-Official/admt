import React, { useState, useEffect, useCallback } from "react";
import {
  makeStyles,
  Text,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  carousel: {
    position: "relative",
    width: "100%",
    height: "130px",
    overflow: "hidden",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  slideContainer: {
    display: "flex",
    width: "100%",
    height: "100%",
    transition: "transform 0.5s ease-in-out",
  },
  slide: {
    minWidth: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  slideContent: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, var(--colorBrandBackground) 0%, var(--colorBrandBackground2) 100%)",
    color: "var(--colorNeutralForegroundOnBrand)",
    textAlign: "center",
    padding: "24px",
  },
  slideText: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 2,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    border: "none",
    borderRadius: "50%",
    width: "8px",
    height: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 1)",
      transform: "translateY(-50%) scale(1.2)",
    },
  },
  prevButton: {
    left: "8px",
  },
  nextButton: {
    right: "8px",
  },
});

interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  gradient?: string;
}

// 默认轮播图数据
const defaultSlides: CarouselSlide[] = [
  {
    id: "1",
    title: "欢迎使用 HOUT 工具箱",
    description: "现代化的Android设备管理工具",
    gradient: "linear-gradient(135deg, #0078d4 0%, #106ebe 50%, #005a9e 100%)",
  },
  {
    id: "2",
    title: "强大的设备管理功能",
    description: "实时设备检测、详细信息展示",
    gradient: "linear-gradient(135deg, #16a085 0%, #27ae60 50%, #2ecc71 100%)",
  },
  {
    id: "3",
    title: "个性化设置体验",
    description: "丰富的自定义选项和主题切换",
    gradient: "linear-gradient(135deg, #8e44ad 0%, #9b59b6 50%, #e74c3c 100%)",
  },
];

interface CarouselProps {
  slides?: CarouselSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}


const CarouselComponent: React.FC<CarouselProps> = ({
  slides = defaultSlides,
  autoPlay = true,
  autoPlayInterval = 8000,
}) => {
  const styles = useStyles();
  const [currentSlide, setCurrentSlide] = useState(0);
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, nextSlide, autoPlayInterval]);

  return (
    <div className={styles.carousel}>
      <div
        className={styles.slideContainer}
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
        }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className={styles.slide}>
            <div
              className={styles.slideContent}
              style={{
                background: slide.gradient || "linear-gradient(135deg, var(--colorBrandBackground) 0%, var(--colorBrandBackground2) 100%)",
              }}
            >
              <div className={styles.slideText}>
                <Text size={600} weight="semibold" style={{ color: "white" }}>
                  {slide.title}
                </Text>
                <Text size={400} style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  {slide.description}
                </Text>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`${styles.navButton} ${styles.prevButton}`}
        onClick={prevSlide}
      />

      <div
        className={`${styles.navButton} ${styles.nextButton}`}
        onClick={nextSlide}
      />
    </div>
  );
};

export default CarouselComponent;
