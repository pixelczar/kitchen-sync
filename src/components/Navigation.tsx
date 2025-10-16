import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Calendar, CheckSquare, Settings } from 'lucide-react';

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
        size={44}
        strokeWidth={isActive ? 2.5 : 2}
        className="transition-all duration-200"
      />
    </motion.div>
  );
};

// Nav item wrapper with animation state
const NavItem = ({ 
  to, 
  Icon, 
  label, 
  activeColor 
}: { 
  to: string; 
  Icon: typeof LayoutDashboard; 
  label: string;
  activeColor: string;
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 700);
  };

  return (
    <NavLink
      to={to}
      onClick={handleClick}
      className={({ isActive }: { isActive: boolean }) =>
        `flex flex-col items-center justify-center gap-3 px-10 py-5 rounded-3xl transition-all duration-200 min-w-[140px] backdrop-blur-md ${
          isActive
            ? `${activeColor}`
            : 'bg-cream/60 text-charcoal/60 hover:text-charcoal transition-all'
        }`
      }
    >
      {({ isActive }: { isActive: boolean }) => (
        <motion.div 
          className="flex flex-col items-center gap-3"
          whileTap={{ scale: 0.90 }}
        >
          <AnimatedIcon Icon={Icon} isActive={isActive} isAnimating={isAnimating} />
          <span className="text-sm font-medium tracking-tight">
            {label}
          </span>
        </motion.div>
      )}
    </NavLink>
  );
};

export const Navigation = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
      <div className="max-w-3xl mx-auto px-8 pb-8 pt-6 pointer-events-auto">
        <div className="flex justify-around items-center will-change-auto">
          <NavItem to="/" Icon={LayoutDashboard} label="Dashboard" activeColor="bg-purple text-cream" />
          <NavItem to="/calendar" Icon={Calendar} label="Calendar" activeColor="bg-purple text-cream" />
          <NavItem to="/todos" Icon={CheckSquare} label="Todos" activeColor="bg-purple text-cream" />
          <NavItem to="/settings" Icon={Settings} label="Settings" activeColor="bg-purple text-cream" />
        </div>
      </div>
    </nav>
  );
};

