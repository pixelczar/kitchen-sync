import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  showLogo?: boolean;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  message = 'Loading...', 
  showLogo = true,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {showLogo ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className={`${sizeClasses[size]} mx-auto mb-4 bg-yellow rounded-full flex items-center justify-center shadow-lg`}
        >
          <span className={`${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'} font-handwritten text-charcoal`}>
            KS
          </span>
        </motion.div>
      ) : (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`${sizeClasses[size]} border-2 border-blue border-t-transparent rounded-full`}
        />
      )}
      
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`${textSizes[size]} text-charcoal font-semibold`}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

// Convenience components for common use cases
export function LoadingSpinnerSmall({ message, className }: { message?: string; className?: string }) {
  return <LoadingSpinner size="sm" message={message} showLogo={false} className={className} />;
}

export function LoadingSpinnerMedium({ message, className }: { message?: string; className?: string }) {
  return <LoadingSpinner size="md" message={message} className={className} />;
}

export function LoadingSpinnerLarge({ message, className }: { message?: string; className?: string }) {
  return <LoadingSpinner size="lg" message={message} className={className} />;
}
