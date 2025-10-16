import { motion, PanInfo } from 'framer-motion';
import type { ReactNode } from 'react';
import { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
  direction: number;
}

const routes = ['/', '/calendar', '/todos', '/settings'];

export const PageTransition = ({ children, direction }: PageTransitionProps) => {
  const prevDirection = useRef(direction);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    prevDirection.current = direction;
  }, [direction]);
  
  // Determine slide direction based on nav position
  const slideAmount = 30;
  const isMovingRight = direction > prevDirection.current;
  
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const swipeVelocity = 500;
    
    const currentIndex = routes.indexOf(location.pathname);
    
    // Swipe right (go to previous page/left in nav)
    if (info.offset.x > swipeThreshold || info.velocity.x > swipeVelocity) {
      if (currentIndex > 0) {
        navigate(routes[currentIndex - 1]);
      }
    }
    // Swipe left (go to next page/right in nav)
    else if (info.offset.x < -swipeThreshold || info.velocity.x < -swipeVelocity) {
      if (currentIndex < routes.length - 1) {
        navigate(routes[currentIndex + 1]);
      }
    }
  };
  
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        x: isMovingRight ? slideAmount : -slideAmount,
      }}
      animate={{ 
        opacity: 1, 
        x: 0,
      }}
      exit={{ 
        opacity: 0, 
        x: isMovingRight ? -slideAmount : slideAmount,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="w-full h-full cursor-grab active:cursor-grabbing"
    >
      {children}
    </motion.div>
  );
};

