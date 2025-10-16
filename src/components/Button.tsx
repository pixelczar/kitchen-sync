import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = ({
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  children,
  className = '',
  type = 'button',
}: ButtonProps) => {
  const baseClasses = 'font-bold rounded-xl transition-all min-h-[44px] min-w-[44px]';
  
  const variantClasses = {
    primary: 'bg-blue text-white hover:shadow-lg',
    secondary: 'bg-transparent border-2 border-gray-light text-charcoal hover:border-charcoal',
  };
  
  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-2xl',
  };
  
  return (
    <motion.button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.button>
  );
};

