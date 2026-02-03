import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  makeStyles,
  mergeClasses,
  Text,
} from "@fluentui/react-components";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Banner } from "../../types/app";
import { bannerService } from "../../services/bannerService";

const useStyles = makeStyles({
  carousel: {
    position: "relative",
    width: "100%",
    height: "120px", 
    overflow: "hidden",
    borderRadius: "12px", 
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none", 
  },
  slideContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  slideContent: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    textAlign: "center",
    padding: "24px",
    boxSizing: "border-box",
    cursor: "pointer",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    transition: "transform 0.5s ease",
    ":hover": {
       // subtle zoom effect removed to avoid interference with drag
    }
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4))",
    zIndex: 0,
  },
  slideText: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxWidth: "80%",
    zIndex: 1,
  },
  dotsContainer: {
    position: "absolute",
    bottom: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "8px",
    zIndex: 10,
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    border: "1px solid rgba(0, 0, 0, 0.3)", // 加入黑色半透明边框
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  activeDot: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    border: "1px solid rgba(0, 0, 0, 0.5)", // 激活状态边框更明显
    transform: "scale(1.2)",
    width: "18px",
    borderRadius: "4px",
  }
});

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.95,
  }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

interface CarouselProps {
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const CarouselComponent: React.FC<CarouselProps> = ({
  autoPlay = true,
  autoPlayInterval = 8000,
}) => {
  const styles = useStyles();
  const { i18n } = useTranslation();
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      setIsLoading(true);
      try {
        const data = await bannerService.getBanners(2);
        if (data && data.length > 0) {
          setBanners(data);
        }
      } catch (error) {
        console.error("Failed to fetch banners:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const [[page, direction], setPage] = useState([0, 0]);

  const imageIndex = banners.length > 0 ? Math.abs(page % banners.length) : 0;

  const paginate = useCallback((newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  }, [page]);

  useEffect(() => {
    if (!autoPlay || banners.length <= 1) return;
    const timer = setInterval(() => {
      paginate(1);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, paginate, banners.length]);

  // If no banners, don't render anything - moved after all hooks
  if (banners.length === 0) {
    return null;
  }

  const handleSlideClick = (banner: Banner) => {
    if (banner.linkUrl) {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        import('@tauri-apps/plugin-shell').then(({ open }) => {
          open(banner.linkUrl!);
        }).catch(err => {
          console.error("Failed to open link via Tauri shell:", err);
          window.open(banner.linkUrl, '_blank');
        });
      } else {
        window.open(banner.linkUrl, '_blank');
      }
    }
  };

  const currentSlide = banners[imageIndex];
  const isEnglish = i18n.language.startsWith('en');

  const displayTitle = (isEnglish && currentSlide.titleEn) ? currentSlide.titleEn : currentSlide.title;
  const displayDesc = (isEnglish && currentSlide.descriptionEn) ? currentSlide.descriptionEn : currentSlide.description;

  return (
    <div className={styles.carousel}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className={styles.slideContainer}
        >
          <div
            className={styles.slideContent}
            onClick={() => handleSlideClick(currentSlide)}
            style={{
              background: "transparent",
              padding: 0, 
            }}
          >
            {currentSlide.imgUrl && (
              <img 
                src={currentSlide.imgUrl} 
                alt={displayTitle}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none'
                }}
              />
            )}
            {/* <div className={styles.overlay} /> */}
            {/* <div className={styles.slideText}>
              <Text size={500} weight="bold" style={{ color: "white", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {displayTitle}
              </Text>
              <Text size={300} style={{ color: "rgba(255, 255, 255, 0.95)", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                {displayDesc}
              </Text>
            </div> */}
          </div>
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <div className={styles.dotsContainer}>
          {banners.map((_, index) => (
            <div
              key={index}
              className={mergeClasses(
                styles.dot,
                index === imageIndex && styles.activeDot
              )}
              onClick={() => {
                const direction = index > imageIndex ? 1 : -1;
                setPage([page + (index - imageIndex), direction]);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CarouselComponent;
