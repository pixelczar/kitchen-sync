import { motion } from 'framer-motion';
import { RefObject } from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  color?: string;
  textColor?: string;
  checkmarkRef?: RefObject<HTMLDivElement>;
}

export const Checkbox = ({
  checked,
  onChange,
  label,
  color = '#0A95FF',
  textColor = '#2D3748',
  checkmarkRef,
}: CheckboxProps) => {
  // Smart color logic based on the card background
  const isYellow = color === '#F7EA31';
  const isWhite = color === 'white' || color === '#ffffff';
  
  // For white checkboxes, we need to use a contrasting color for the checkmark
  const checkmarkColor = isWhite ? '#2D3748' : textColor; // Dark gray for white checkboxes
  const borderColor = isWhite ? 'rgba(45, 55, 72, 0.3)' : 'rgba(255, 255, 255, 0.5)';
  const uncheckedBg = isYellow ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Checkbox clicked:', { checked, label }); // Debug log
    onChange();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
      onChange();
    }
  };
  
  return (
    <div 
      className="flex items-center gap-3 cursor-pointer min-h-[48px] py-2 px-3 rounded-xl transition-all w-full"
      style={{
        backgroundColor: checked ? 'transparent' : (isYellow ? 'rgb(255 255 255 / 30%)' : uncheckedBg),
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
    >
      <motion.div
        ref={checkmarkRef}
        className="flex items-center justify-center w-6 h-6 border-2 rounded transition-colors flex-shrink-0 pointer-events-none bg-transparent"
        style={{
          borderColor: checked ? color : borderColor,
          backgroundColor: checked ? color : uncheckedBg,
        }}
        whileTap={{ scale: 0.95 }}
      >
        {checked && (
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <motion.path
              d="M3 8L6 11L13 4"
              stroke={checkmarkColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </motion.div>
      
      {label && (
        <span
          className="text-base font-semibold transition-all pointer-events-none flex-1 truncate"
          style={{ 
            color: textColor,
            opacity: checked ? 0.5 : 1,
            textDecoration: checked ? 'line-through' : 'none'
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

