import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Calendar, CheckSquare } from 'lucide-react';
// import { Settings } from 'lucide-react'; // Keep for future use

// Animated icon component
const AnimatedIcon = ({ 
  Icon, 
  isActive,
  isAnimating
}: { 
  Icon: typeof LayoutDashboard; 
  isActive: boolean;
  isAnimating: boolean;
}) => {
  return (
    <motion.div
      animate={isAnimating ? {
        scale: [1, 1.3, 0.85, 1.15, 0.95, 1.05, 1],
        rotate: [0, -15, 15, -10, 10, -5, 0],
      } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <Icon 
        size={36}
        strokeWidth={isActive ? 2.5 : 2}
        className="transition-all duration-200"
      />
    </motion.div>
  );
};

// Nav item wrapper with animation state
const NavItem = ({ 
  Icon, 
  label, 
  showPlusButton = false,
  isActive,
  onClick
}: { 
  Icon: typeof LayoutDashboard; 
  label: string;
  showPlusButton?: boolean;
  isActive: boolean;
  onClick: () => void;
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 700);
    onClick();
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`Navigation: Plus button clicked for ${label}`);
    
    // Trigger the modal directly without navigation
    if (label === 'Calendar') {
      console.log('Navigation: Dispatching openCalendarModal event');
      window.dispatchEvent(new CustomEvent('openCalendarModal'));
    } else if (label === 'Todos') {
      console.log('Navigation: Dispatching openTodosModal event');
      window.dispatchEvent(new CustomEvent('openTodosModal'));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-3xl transition-all duration-200 min-w-[120px] relative z-10 ${
          isActive ? 'text-cream' : 'text-charcoal/60 hover:text-charcoal'
        }`}
      >
        <motion.div 
          className="flex flex-col items-center gap-2"
          whileTap={{ scale: 0.90 }}
        >
          <AnimatedIcon Icon={Icon} isActive={isActive} isAnimating={isAnimating} />
          <span className="text-sm font-medium tracking-tight">
            {label}
          </span>
        </motion.div>
      </button>
      
      {/* Plus Button - Only show for active items that have showPlusButton */}
      {isActive && showPlusButton && (
        <motion.button
          onClick={handlePlusClick}
          className="absolute -top-6 -right-6 w-14 h-14 bg-blue/70 text-cream shadow-2xl flex items-center justify-center text-3xl font-bold rounded-2xl z-20 backdrop-blur-lg"  
          initial={{ opacity: 0, scale: 0.3, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: [0.3, 1.15, 0.95, 1.05, 1], 
            y: [20, -5, 0] 
          }}
          whileTap={{ scale: 0.92 }}
          transition={{ 
            // Entrance animation
            duration: 0.3,
            delay: 0.22,
            type: "spring",
            stiffness: 200,
            damping: 15,
            scale: {
              type: "spring",
              stiffness: 200,
              damping: 15
            },
            y: {
              type: "spring",
              stiffness: 200,
              damping: 15
            }
          }}
        >
          +
        </motion.button>
      )}
    </div>
  );
};

export const Navigation = () => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState<{ left: string; width: string }>({ left: '0px', width: '120px' });

  const navItems = useMemo(() => [
    { to: "/", Icon: LayoutDashboard, label: "Dashboard", showPlusButton: false },
    { to: "/calendar", Icon: Calendar, label: "Calendar", showPlusButton: true },
    { to: "/todos", Icon: CheckSquare, label: "Todos", showPlusButton: true },
  ], []);

  // Update active index based on current route
  useEffect(() => {
    const currentIndex = navItems.findIndex(item => item.to === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname, navItems]);

  // Update slider position when active index changes
  useEffect(() => {
    if (containerRef.current) {
      const itemWidth = 120; // min-w-[120px]
      const gap = 16; // gap-4 = 16px
      const leftPosition = activeIndex * (itemWidth + gap);
      
      setSliderStyle({
        left: `${leftPosition}px`,
        width: `${itemWidth}px`,
      });
    }
  }, [activeIndex]);

  const handleNavClick = (to: string) => {
    // Navigation will be handled by the router
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-30 pointer-events-none">
      <div className="flex justify-center pointer-events-auto">
        <div className="bg-cream/40 backdrop-blur-md rounded-3xl px-4 py-3 relative">
          <div ref={containerRef} className="flex items-center gap-4 will-change-auto relative">
            {/* Sliding background */}
            <motion.div
              className="absolute top-0 bottom-0 bg-purple rounded-3xl z-0"
              style={sliderStyle}
              animate={{
                left: sliderStyle.left,
                width: sliderStyle.width,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3
              }}
            />
            
            {/* Navigation items */}
            {navItems.map((item, index) => (
              <NavItem
                key={item.to}
                Icon={item.Icon}
                label={item.label}
                showPlusButton={item.showPlusButton}
                isActive={index === activeIndex}
                onClick={() => handleNavClick(item.to)}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

