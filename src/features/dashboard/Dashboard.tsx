import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KudosModal } from '../../components/KudosModal';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useSendKudos } from '../../hooks/useKudos';
import { useUIStore } from '../../stores/uiStore';
import { PersonCardSkeleton, WidgetSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { blastKudos } from '../../lib/emoji-blast';
import { fetchRecentPhotos, getPhotoUrl, filterImages } from '../../lib/google-photos';
import { getKitchenSyncPhotos } from '../../lib/google-photos-album';
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
  const { data: users, isLoading: usersLoading, error: usersError } = useUsers();
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useTasks();
  const { mutate: sendKudos } = useSendKudos();
  const queueCelebration = useUIStore((state) => state.queueCelebration);
  const toast = useToast();
  const [isKudosModalOpen, setIsKudosModalOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // For demo, use first parent user
  const currentUserId = users?.find(u => u.role === 'parent')?.id || '';
  
  // Load a preview photo for the photo container
  useEffect(() => {
    const loadPreviewPhoto = async () => {
      const accessToken = localStorage.getItem('googlePhotosToken');
      if (!accessToken) {
        // Use a sample photo if no Google Photos token
        setPhotoPreview('https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=400&fit=crop');
        return;
      }
      
      try {
        // First try to get photos from the Kitchen Sync album
        let photos = await getKitchenSyncPhotos(accessToken, 1);
        
        // If no Kitchen Sync album photos, fall back to recent photos
        if (photos.length === 0) {
          console.log('No Kitchen Sync album found, trying recent photos...');
          photos = await fetchRecentPhotos(accessToken, 1);
        }
        
        const imagePhotos = filterImages(photos);
        
        if (imagePhotos.length > 0) {
          const photoUrl = getPhotoUrl(imagePhotos[0], 400, 400);
          setPhotoPreview(photoUrl);
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
  
  if (usersLoading || tasksLoading) {
    return (
      <motion.main 
        className="px-6 pb-40 overflow-y-auto h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Greeting Skeleton */}
            <div className="mb-8">
              <div className="h-12 w-64 bg-gray-light/50 rounded animate-pulse mb-2" />
              <div className="h-6 w-48 bg-gray-light/30 rounded animate-pulse" />
            </div>

            {/* Widgets Skeleton */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              variants={container}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={item}><WidgetSkeleton /></motion.div>
              <motion.div variants={item}><WidgetSkeleton /></motion.div>
              <motion.div variants={item}><WidgetSkeleton /></motion.div>
            </motion.div>

            {/* Person Cards Skeleton */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={item}><PersonCardSkeleton /></motion.div>
              <motion.div variants={item}><PersonCardSkeleton /></motion.div>
            </motion.div>
          </div>

          {/* Family Sidebar Skeleton */}
          <div className="w-80 sticky top-6 h-fit">
            <div className="rounded-3xl p-6 bg-gray-light/30">
              <div className="h-8 w-32 bg-gray-light/50 rounded animate-pulse mb-6" />
              <motion.div 
                className="space-y-4"
                variants={container}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={item}><PersonCardSkeleton /></motion.div>
                <motion.div variants={item}><PersonCardSkeleton /></motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.main>
    );
  }
  
  if (!users || !tasks) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-xl font-semibold text-error">Error loading data</div>
      </div>
    );
  }
  
  // Calculate stats
  const totalTasks = tasks.filter(t => t.type === 'chore' && !t.completed).length;
  const completedToday = tasks.filter(t => t.completed).length;
  const activeStreak = Math.max(...users.map(u => u.currentStreak));
  
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
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Welcome Message */}
          <motion.div className="mb-8" variants={item}>
            <h2 className="text-5xl font-black tracking-tight text-charcoal mb-2">
              Good {new Date().getHours() < 16 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}! 👋
            </h2>
            {/* <p className="text-xl text-gray-medium">
              Here's what's happening today
            </p> */}
          </motion.div>

          {/* Stats Grid */}
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" variants={container}>
        {/* Tasks Widget */}
        <motion.div className="rounded-3xl p-6 bg-blue" variants={item}>
          <h3 className="text-3xl font-black text-cream mb-4">
            Tasks
          </h3>
          <div className="text-center">
            <div className="text-6xl font-black tracking-tight text-cream mb-2">
              {totalTasks}
            </div>
            <p className="text-cream/80 font-semibold">
              tasks to complete
            </p>
          </div>
        </motion.div>

        {/* Completed Widget */}
        <motion.div className="rounded-3xl p-6 bg-green" variants={item}>
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

        {/* Streak Widget */}
        <motion.div className="rounded-3xl p-6 bg-red" variants={item}>
          <h3 className="text-3xl font-black text-cream mb-4">
            Hot Streak
          </h3>
          <div className="text-center">
            <div className="text-6xl font-black tracking-tight text-cream mb-2">
              {activeStreak}
            </div>
            <p className="text-cream/80 font-semibold">
              day streak
            </p>
          </div>
        </motion.div>

        {/* Photo Container Widget */}
        <motion.div 
          className="rounded-3xl overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 h-48" 
          variants={item}
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
              <div className="text-6xl">📸</div>
            </div>
          )}
        </motion.div>
      </motion.div>

          
      </div>

        {/* Family Sidebar */}
        <motion.div className="w-80 flex-shrink-0" variants={item}>
          <div className="rounded-3xl p-6 bg-purple sticky">
            <h3 className="text-4xl font-black text-cream mb-6">
              Family
            </h3>
            <div className="space-y-4">
              {users.map(user => (
                <div
                  key={user.id}
                  className="p-4 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black flex-shrink-0"
                      style={{ backgroundColor: user.color, color: user.textColor }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-cream mb-1">
                        {user.name}
                      </h4>
                      <div className="text-sm text-cream/80">
                        {user.currentStreak >= 3 && (
                          <span>🔥 {user.currentStreak} days</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      {/* Footer */}
      <motion.div className="text-center mt-12 mb-8" variants={item}>
            <h2 className="text-4xl font-handwritten tracking-tight text-purple transform -rotate-2">
              WE'RE DOIN' IT!
            </h2>
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

