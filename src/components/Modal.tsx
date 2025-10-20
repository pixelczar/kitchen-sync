import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode, useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const setModalOpen = useUIStore((state) => state.setModalOpen);

  useEffect(() => {
    setModalOpen(isOpen);
  }, [isOpen, setModalOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blue-white tint and blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.4, 0, 0.2, 1],
              exit: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
            }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-cream/70"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(32px)',
            }}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 1, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1, y: 30 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.4, 0, 0.2, 1],
                scale: { type: 'spring', stiffness: 300, damping: 30 },
                exit: { 
                  duration: 0.2, 
                  ease: [0.4, 0, 0.2, 1],
                  scale: { type: 'spring', stiffness: 400, damping: 25 }
                }
              }}
              className="bg-cream rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-light flex items-center justify-between">
                <h2 className="text-4xl font-extrabold tracking-tight text-charcoal">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-medium hover:text-charcoal transition-colors text-3xl leading-none"
                >
                  ×
                </button>
              </div>
              
              {/* Content */}
              <div className="px-8 py-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

