import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rectangle';
  width?: string;
  height?: string;
}

export const Skeleton = ({ 
  className = '', 
  variant = 'rectangle',
  width,
  height 
}: SkeletonProps) => {
  const baseClasses = 'bg-gray-light/50 animate-pulse';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rectangle: 'rounded-2xl'
  };

  const style = {
    width: width || '100%',
    height: height || (variant === 'circle' ? width : '100%')
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton components for common use cases
export const PersonCardSkeleton = () => (
  <div className="bg-cream rounded-3xl p-6 w-full">
    <Skeleton variant="text" width="120px" height="32px" className="mb-6" />
    <div className="space-y-3 mb-6">
      <Skeleton variant="text" width="100%" height="48px" />
      <Skeleton variant="text" width="90%" height="48px" />
      <Skeleton variant="text" width="85%" height="48px" />
    </div>
    <div className="flex gap-3">
      <Skeleton variant="rectangle" width="80px" height="32px" />
      <Skeleton variant="rectangle" width="80px" height="32px" />
    </div>
  </div>
);

export const CalendarEventSkeleton = () => (
  <div className="p-3 rounded-lg bg-gray-light/30">
    <Skeleton variant="text" width="80%" height="16px" className="mb-2" />
    <Skeleton variant="text" width="50%" height="12px" />
  </div>
);

export const WidgetSkeleton = () => (
  <div className="rounded-3xl p-6 bg-gray-light/30">
    <Skeleton variant="text" width="100px" height="20px" className="mb-4" />
    <Skeleton variant="text" width="60px" height="48px" className="mb-2" />
    <Skeleton variant="text" width="120px" height="16px" />
  </div>
);

