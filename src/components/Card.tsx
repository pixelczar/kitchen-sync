import type { ReactNode } from 'react';

interface CardProps {
  borderColor?: string;
  padding?: 'small' | 'medium' | 'large';
  children: ReactNode;
}

export const Card = ({
  borderColor,
  padding = 'medium',
  children,
}: CardProps) => {
  const paddingClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };
  
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm ${paddingClasses[padding]}`}
      style={{
        borderTop: borderColor ? `4px solid ${borderColor}` : undefined,
      }}
    >
      {children}
    </div>
  );
};

