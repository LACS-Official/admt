import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  makeStyles,
  mergeClasses,
  Text,
} from "@fluentui/react-components";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight24Regular, ChevronLeft24Regular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  carousel: {
    position: "relative",
    width: "100%",
    height: "120px", // Slightly taller for better spacing
    overflow: "hidden",
    borderRadius: "12px", // Increased radius for modern look
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)", // Soft shadow
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
    // We'll apply the gradient via inline styles or motion component
    color: "var(--colorNeutralForegroundOnBrand)",
    textAlign: "center",
    padding: "24px",
    boxSizing: "border-box",
  },
  slideText: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "80%",
    zIndex: 1,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(4px)",
    border: "1px solid rgba(0,0,0,0.05)",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--colorNeutralForeground1)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "all 0.2s cubic-bezier(0.33, 1, 0.68, 1)",
    ":hover": {
      backgroundColor: "white",
      transform: "translateY(-50%) scale(1.1)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
    ":active": {
      transform: "translateY(-50%) scale(0.95)",
    }
  },
  prevButton: {
    left: "12px",
  },
  nextButton: {
    right: "12px",
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
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  activeDot: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    transform: "scale(1.2)",
    width: "18px",
    borderRadius: "4px",
  }
});

interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  gradient?: string;
}



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

/**
 * Experimenting with distrubuting `number` based index and direction.
 * We need to absolute position slides to animate them on top of each other.
 */
const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

interface CarouselProps {
  slides?: CarouselSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const CarouselComponent: React.FC<CarouselProps> = ({
  slides: propSlides,
  autoPlay = true,
  autoPlayInterval = 8000,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  
  const defaultSlides: CarouselSlide[] = useMemo(() => [
    {
      id: "1",
      title: t('carousel.slide1_title'),
      description: t('carousel.slide1_desc'),
      gradient: "linear-gradient(135deg, #0078d4 0%, #106ebe 50%, #005a9e 100%)",
    },
    {
      id: "2",
      title: t('carousel.slide2_title'),
      description: t('carousel.slide2_desc'),
      gradient: "linear-gradient(135deg, #16a085 0%, #27ae60 50%, #2ecc71 100%)",
    },
    {
      id: "3",
      title: t('carousel.slide3_title'),
      description: t('carousel.slide3_desc'),
      gradient: "linear-gradient(135deg, #8e44ad 0%, #9b59b6 50%, #e74c3c 100%)",
    },
  ], [t]);

  const slides = propSlides || defaultSlides;

  const [[page, direction], setPage] = useState([0, 0]);

  // We only have 3 images, but we paginate them
  const imageIndex = Math.abs(page % slides.length);

  const paginate = useCallback((newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  }, [page]);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      paginate(1);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, paginate]);

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
            style={{
              background: slides[imageIndex].gradient || "linear-gradient(135deg, var(--colorBrandBackground) 0%, var(--colorBrandBackground2) 100%)",
            }}
          >
           <div className={styles.slideText}>
              <Text size={500} weight="bold" style={{ color: "white", textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                {slides[imageIndex].title}
              </Text>
              <Text size={300} style={{ color: "rgba(255, 255, 255, 0.95)" }}>
                {slides[imageIndex].description}
              </Text>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div
        className={mergeClasses(styles.navButton, styles.prevButton)}
        onClick={() => paginate(-1)}
      >
        <ChevronLeft24Regular />
      </div>

      <div
        className={mergeClasses(styles.navButton, styles.nextButton)}
        onClick={() => paginate(1)}
      >
        <ChevronRight24Regular />
      </div>

      <div className={styles.dotsContainer}>
        {slides.map((_, index) => (
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
    </div>
  );
};

export default CarouselComponent;
