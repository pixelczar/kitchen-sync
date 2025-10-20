import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KudosModal } from '../../components/KudosModal';
import { SingleDayCalendar } from '../../components/SingleDayCalendar';
import { WeatherWidget } from '../../components/WeatherWidget';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useSendKudos } from '../../hooks/useKudos';
import { useUIStore } from '../../stores/uiStore';
import { WidgetSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { blastKudos } from '../../lib/emoji-blast';
import { loadSelectedPhotos } from '../../lib/google-photos';
import type { Kudos } from '../../types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

interface DashboardProps {
  onTriggerScreensaver: () => void;
}

export const Dashboard = ({ onTriggerScreensaver }: DashboardProps) => {
  const { data: users, error: usersError, status: usersStatus } = useUsers();
  const { data: tasks, error: tasksError, status: tasksStatus } = useTasks();
  const { mutate: sendKudos } = useSendKudos();
  const queueCelebration = useUIStore((state) => state.queueCelebration);
  const toast = useToast();
  const [isKudosModalOpen, setIsKudosModalOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // For demo, use first parent user
  const currentUserId = users?.find(u => u.role === 'parent')?.id || '';
  
  // Set initial load to false after component mounts and data is available
  useEffect(() => {
    if (isInitialLoad && users && tasks) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setIsInitialLoad(false);
      });
    }
  }, [isInitialLoad, users, tasks]);
  
  // Load a preview photo for the photo container
  useEffect(() => {
    const loadPreviewPhoto = async () => {
      try {
        // Try to load selected photos from the Picker API
        const selectedPhotos = await loadSelectedPhotos();
        
        if (selectedPhotos.length > 0) {
          // Use the first selected photo as preview
          setPhotoPreview(selectedPhotos[0]);
          console.log('Using selected photo as preview');
        } else {
          // Fallback to sample photo
          setPhotoPreview('https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=400&fit=crop');
        }
      } catch (error) {
        console.error('Failed to load preview photo:', error);
        // Fallback to sample photo
        setPhotoPreview('https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=400&fit=crop');
      }
    };
    
    loadPreviewPhoto();
  }, []);
  
  // Handle errors
  if (usersError || tasksError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-xl font-semibold text-error">
          Error loading data: {usersError?.message || tasksError?.message}
        </div>
      </div>
    );
  }
  
  // Show loading state if either query is still loading/pending OR if we don't have data yet
  // Use status to be more precise about when to show loading
  const isStillLoading = usersStatus === 'pending' || tasksStatus === 'pending';
  const hasNoData = !users || !tasks;
  
  if (isStillLoading || hasNoData) {
    return (
      <motion.main 
        className="px-6 pb-40 overflow-y-auto h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Greeting Skeleton */}
        <div className="mb-8">
          <div className="h-12 w-64 bg-gray-light/50 rounded animate-pulse mb-2" />
        </div>

        {/* Grid Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Stats Row Skeleton */}
          <div className="lg:col-span-3">
            <WidgetSkeleton />
          </div>
          <div className="lg:col-span-3">
            <div className="rounded-3xl p-6 bg-gray-light/30">
              <div className="h-8 w-32 bg-gray-light/50 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-16 bg-gray-light/50 rounded animate-pulse" />
                <div className="h-16 bg-gray-light/50 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="rounded-3xl p-6 bg-gray-light/30">
              <div className="h-8 w-32 bg-gray-light/50 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-12 bg-gray-light/50 rounded animate-pulse" />
                <div className="h-12 bg-gray-light/50 rounded animate-pulse" />
                <div className="h-12 bg-gray-light/50 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 lg:row-span-2">
            <div className="rounded-3xl p-6 bg-gray-light/30 h-full">
              <div className="h-8 w-32 bg-gray-light/50 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-16 bg-gray-light/50 rounded animate-pulse" />
                <div className="h-16 bg-gray-light/50 rounded animate-pulse" />
                <div className="h-16 bg-gray-light/50 rounded animate-pulse" />
                <div className="h-16 bg-gray-light/50 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Photo Row Skeleton */}
          <div className="lg:col-span-9">
            <div className="rounded-3xl h-80 bg-gray-light/30 animate-pulse" />
          </div>
        </div>
      </motion.main>
    );
  }
  
  // Calculate stats
  const completedToday = tasks.filter(t => t.completed).length;
  
  const handleSendKudos = (kudosData: Omit<Kudos, 'id' | 'householdId' | 'timestamp'>) => {
    sendKudos(kudosData, {
      onSuccess: () => {
        queueCelebration({
          type: 'kudos',
          userId: kudosData.to,
          message: `${kudosData.emoji} ${kudosData.message}`,
        });
        toast.success('Kudos sent!', '❤️');
        blastKudos(); // Blast emoji from center of screen
      },
    });
  };
  
  return (
    <motion.main 
      className="px-6 pb-40 overflow-y-auto h-full"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Welcome Message */}
      <motion.div 
        className="mb-8" 
        variants={item}
        initial={isInitialLoad ? "show" : "hidden"}
        animate="show"
      >
        <h2 className="text-5xl font-black tracking-tight text-charcoal mb-2">
          Good {new Date().getHours() < 16 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}! 👋
        </h2>
      </motion.div>

      {/* Grid Layout */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8"
        variants={container}
        initial={isInitialLoad ? "show" : "hidden"}
        animate="show"
      >
        {/* Stats Row - Top Row */}
        <motion.div 
          className="lg:col-span-3 rounded-3xl p-6 bg-green" 
          variants={item}
          initial={isInitialLoad ? "show" : "hidden"}
          animate="show"
        >
          <h3 className="text-3xl font-black text-cream mb-4">
            Done Today
          </h3>
          <div className="text-center">
            <div className="text-6xl font-black tracking-tight text-cream mb-2">
              {completedToday}
            </div>
            <p className="text-cream/80 font-semibold">
              tasks completed
            </p>
          </div>
        </motion.div>

        {/* Weather Widget - Top Row */}
        <motion.div 
          className="lg:col-span-3" 
          variants={item}
          initial={isInitialLoad ? "show" : "hidden"}
          animate="show"
        >
          <WeatherWidget />
        </motion.div>

        {/* Family Widget - Top Row */}
        <motion.div 
          className="lg:col-span-3 rounded-3xl p-6 bg-purple" 
          variants={item}
          initial={isInitialLoad ? "show" : "hidden"}
          animate="show"
        >
          <h3 className="text-3xl font-black text-cream mb-4">
            Family
          </h3>
          <div className="space-y-3">
            {users.slice(0, 4).map(user => (
              <div
                key={user.id}
                className="flex items-center gap-3"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0"
                  style={{ backgroundColor: user.color, color: user.textColor }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-cream truncate">
                    {user.name}
                  </h4>
                  <div className="text-xs text-cream/80">
                    {user.currentStreak >= 3 && (
                      <span>🔥 {user.currentStreak} days</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>


        {/* Single Day Calendar Widget - Extends to top row */}
        <motion.div 
          className="lg:col-span-3 lg:row-span-2" 
          variants={item}
          initial={isInitialLoad ? "show" : "hidden"}
          animate="show"
        >
          <SingleDayCalendar date={new Date()} />
        </motion.div>

        {/* Large Photo - Second Row Left */}
        <motion.div 
          className="lg:col-span-9 rounded-3xl overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 h-80" 
          variants={item}
          initial={isInitialLoad ? "show" : "hidden"}
          animate="show"
          onClick={onTriggerScreensaver}
        >
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Family photo preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-light/30 flex items-center justify-center">
              <div className="text-8xl">📸</div>
            </div>
          )}
        </motion.div>

        {/* Motivational Message - Bottom Row */}
        <motion.div 
          className="lg:col-span-12 text-center py-8" 
          variants={item}
          initial={isInitialLoad ? "show" : "hidden"}
          animate="show"
        >
          <h2 className="text-4xl font-handwritten tracking-tight text-purple transform -rotate-2">
            WE'RE DOIN' IT!
          </h2>
        </motion.div>
      </motion.div>

      {/* Kudos FAB */}
      <motion.button
        onClick={() => setIsKudosModalOpen(true)}
        className="fixed bottom-32 right-8 w-16 h-16 bg-red text-cream rounded-full shadow-2xl flex items-center justify-center text-4xl tracking-tight z-10"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        ❤️
      </motion.button>
      
      {/* Kudos Modal */}
      <KudosModal
        isOpen={isKudosModalOpen}
        onClose={() => setIsKudosModalOpen(false)}
        onSend={handleSendKudos}
        fromUserId={currentUserId}
      />
    </motion.main>
  );
};

