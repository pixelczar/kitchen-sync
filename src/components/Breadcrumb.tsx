import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface BreadcrumbProps {
  className?: string;
}

const routeDescriptions = {
  '/': 'See everyone\'s progress',
  '/calendar': 'Events and schedules',
  '/todos': 'Tasks and to-dos',
  '/settings': 'App settings and preferences'
};

export const Breadcrumb = ({ className = '' }: BreadcrumbProps) => {
  const location = useLocation();
  const description = routeDescriptions[location.pathname as keyof typeof routeDescriptions] || '';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className="text-charcoal/40 text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        →
      </motion.div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 0, x: -10 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 0, x: 10 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.4, 0, 0.2, 1],
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="text-charcoal/70 text-lg font-medium tracking-tight"
        >
          {description}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
