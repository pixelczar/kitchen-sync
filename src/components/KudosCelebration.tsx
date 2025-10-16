import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';

export const KudosCelebration = () => {
  const celebrationQueue = useUIStore((state) => state.celebrationQueue);
  const clearCelebration = useUIStore((state) => state.clearCelebration);
  
  const currentCelebration = celebrationQueue[0];

  useEffect(() => {
    if (currentCelebration) {
      const timer = setTimeout(() => {
        clearCelebration();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentCelebration, clearCelebration]);

  return (
    <AnimatePresence>
      {currentCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 border-4 border-yellow">
            <div className="text-center">
              {currentCelebration.type === 'kudos' && (
                <>
                  <div className="text-6xl tracking-tight mb-2">❤️</div>
                  <div className="text-2xl font-black text-charcoal mb-1">
                    Kudos Received!
                  </div>
                  <div className="text-lg text-gray-medium">
                    {currentCelebration.message}
                  </div>
                </>
              )}
              {currentCelebration.type === 'task-complete' && (
                <>
                  <div className="text-6xl tracking-tight mb-2">🎉</div>
                  <div className="text-2xl font-black text-charcoal mb-1">
                    Task Complete!
                  </div>
                  <div className="text-lg text-gray-medium">
                    {currentCelebration.taskName}
                  </div>
                </>
              )}
              {currentCelebration.type === 'streak' && (
                <>
                  <div className="text-6xl tracking-tight mb-2">🔥</div>
                  <div className="text-2xl font-black text-charcoal mb-1">
                    {currentCelebration.streakValue} Day Streak!
                  </div>
                  <div className="text-lg text-gray-medium">
                    Keep it up!
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

