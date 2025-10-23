import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KudosModal } from '../../components/KudosModal';
import { DashboardCalendarWidget } from '../../components/DashboardCalendarWidget';
import { WeatherWidget } from '../../components/WeatherWidget';
import { PhotoWidget } from '../../components/PhotoWidget';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useSendKudos } from '../../hooks/useKudos';
import { useUIStore } from '../../stores/uiStore';
import { useToast } from '../../components/Toast';
import { blastKudos } from '../../lib/emoji-blast';
import { loadSelectedPhotos } from '../../lib/google-photos';
import type { Kudos } from '../../types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Faster stagger for overlapping effect
      delayChildren: 0.1
    }
  }
};

const item = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      duration: 0.6
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
  
  // Load and rotate through photos for the photo container
  useEffect(() => {
    let rotationInterval: NodeJS.Timeout | null = null;
    
    const loadAndRotatePhotos = async () => {
      try {
        // Try to load selected photos from the Picker API
        const selectedPhotos = await loadSelectedPhotos();
        
        if (selectedPhotos.length > 0) {
          // Use the first selected photo as initial preview
          setPhotoPreview(selectedPhotos[0]);
          
          // Set up rotation through all selected photos
          if (selectedPhotos.length > 1) {
            let currentIndex = 0;
            rotationInterval = setInterval(() => {
              currentIndex = (currentIndex + 1) % selectedPhotos.length;
              
              // Update photo
              setPhotoPreview(selectedPhotos[currentIndex]);
              
            }, 8000); // Rotate every 8 seconds (longer display)
          }
        } else {
          // Fallback to sample photos rotation
          const samplePhotos = [
            'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop'
          ];
          
          setPhotoPreview(samplePhotos[0]);
          
          let currentIndex = 0;
          rotationInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % samplePhotos.length;
            
            // Update photo
            setPhotoPreview(samplePhotos[currentIndex]);
            
          }, 8000); // Rotate every 8 seconds (longer display)
        }
      } catch (error) {
        console.error('Failed to load preview photo:', error);
        // Fallback to sample photo
        setPhotoPreview('https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=400&fit=crop');
      }
    };
    
    loadAndRotatePhotos();
    
    // Cleanup function
    return () => {
      if (rotationInterval) {
        clearInterval(rotationInterval);
      }
    };
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
        className="px-6 pb-6 overflow-y-auto h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Greeting Skeleton */}
        <div className="mb-8">
          <div className="h-12 w-64 bg-gray-light/50 rounded animate-pulse mb-2" />
        </div>

        {/* Bento Grid Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8" style={{ 
          gridTemplateRows: 'repeat(4, minmax(200px, 1fr))',
          minHeight: '800px'
        }}>
          {/* Row 1: Stats Cards Skeleton */}
          <div className="lg:col-span-3 lg:row-span-1">
            <div className="rounded-3xl p-6 bg-gray-light/30 h-full">
              <div className="h-6 w-32 bg-gray-light/50 rounded animate-pulse mb-4" />
              <div className="text-center">
                <div className="h-16 w-16 bg-gray-light/50 rounded animate-pulse mx-auto mb-2" />
                <div className="h-4 w-24 bg-gray-light/50 rounded animate-pulse mx-auto" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 lg:row-span-1">
            <div className="rounded-3xl p-6 bg-gray-light/30 h-full">
              <div className="h-6 w-32 bg-gray-light/50 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-12 bg-gray-light/50 rounded animate-pulse" />
                <div className="h-12 bg-gray-light/50 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 lg:row-span-1">
            <div className="rounded-3xl p-6 bg-gray-light/30 h-full">
              <div className="h-6 w-32 bg-gray-light/50 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-10 bg-gray-light/50 rounded animate-pulse" />
                <div className="h-10 bg-gray-light/50 rounded animate-pulse" />
                <div className="h-10 bg-gray-light/50 rounded animate-pulse" />
                <div className="h-10 bg-gray-light/50 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 lg:row-span-3">
            <div className="rounded-3xl p-6 bg-gray-light/30 h-full">
              <div className="h-6 w-32 bg-gray-light/50 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-16 bg-gray-light/50 rounded animate-pulse" />
                <div className="h-16 bg-gray-light/50 rounded animate-pulse" />
                <div className="h-16 bg-gray-light/50 rounded animate-pulse" />
                <div className="h-16 bg-gray-light/50 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Row 2: Photo Widget Skeleton */}
          <div className="lg:col-span-9 lg:row-span-2">
            <div className="rounded-3xl bg-gray-light/30 h-full animate-pulse" />
          </div>

          {/* Row 3: Motivational Message Skeleton */}
          <div className="lg:col-span-9 lg:row-span-1 flex items-center justify-center">
            <div className="h-8 w-64 bg-gray-light/50 rounded animate-pulse" />
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
      className="px-6 pb-6 overflow-y-auto h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Welcome Message */}
      {/* <motion.div 
        className="mb-8" 
        variants={item}
        initial={isInitialLoad ? "show" : "hidden"}
        animate="show"
      >
        <h2 className="text-5xl font-black tracking-tight text-charcoal mb-2">
          Good {new Date().getHours() < 16 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}! 👋
        </h2>
      </motion.div> */}

      {/* Bento Grid Layout - Consistent Heights */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8"
        variants={container}
        initial="hidden"
        animate="show"
        style={{ 
          gridTemplateRows: 'repeat(4, minmax(200px, 1fr))',
          minHeight: '800px'
        }}
      >
        {/* Row 1: Stats Cards */}
        <motion.div 
          className="lg:col-span-3 lg:row-span-1 rounded-3xl p-6 bg-blue flex flex-col" 
          variants={item}
        >
          <h3 className="text-2xl font-black text-cream mb-4">
            Done Today
          </h3>
          <div className="text-center">
            <div className="text-5xl font-black tracking-tight text-cream mb-2">
              {completedToday}
            </div>
            <p className="text-cream/80 font-semibold">
              tasks completed
            </p>
          </div>
        </motion.div>

        <motion.div 
          className="lg:col-span-3 lg:row-span-1 flex flex-col" 
          variants={item}
        >
          <WeatherWidget />
        </motion.div>

        <motion.div 
          className="lg:col-span-3 lg:row-span-1 rounded-3xl p-6 bg-purple flex flex-col" 
          variants={item}
        >
          {/* <h3 className="text-2xl font-black text-cream mb-4">
            Family
          </h3> */}
          <div className="space-y-4">
            {users.slice(0, 4).map(user => (
              <div
                key={user.id}
                className="flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0"
                  style={{ backgroundColor: user.color, color: user.textColor }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xl font-bold text-cream truncate">
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

        {/* Calendar Widget - Spans 3 rows on the right */}
        <motion.div 
          className="lg:col-span-3 lg:row-span-3 flex flex-col" 
          variants={item}
        >
          <DashboardCalendarWidget date={new Date()} height={600} />
        </motion.div>

        {/* Row 2: Large Photo Widget */}
        <motion.div 
          className="lg:col-span-9 lg:row-span-2 rounded-3xl overflow-hidden cursor-pointer  flex flex-col" 
          variants={item}
        >
          <PhotoWidget
            photoUrl={photoPreview}
            onClick={onTriggerScreensaver}
            className="w-full h-full"
            alt="Family photo preview"
          />
        </motion.div>

        {/* Row 3: Motivational Message */}
        <motion.div 
          className="lg:col-span-9 lg:row-span-1 flex items-center justify-center" 
          variants={item}
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
        whileHover={{ 
          scale: 1.15,
          rotate: 5,
          transition: { type: "spring", stiffness: 400, damping: 10 }
        }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 15,
          delay: 0.8 // Appears after cards start animating
        }}
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

