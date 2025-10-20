import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Header } from '../features/dashboard/Header';
import { useUIStore } from '../stores/uiStore';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isModalOpen = useUIStore((state) => state.isModalOpen);

  return (
    <motion.div
      animate={{
        scale: isModalOpen ? 1 : 1,
        opacity: isModalOpen ? 1 : 1,
      }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="min-h-screen bg-cream overflow-hidden origin-center will-change-transform"
    >
      <Header />
      <div className="h-[calc(100vh-116px)]">
        {children}
      </div>
    </motion.div>
  );
};

