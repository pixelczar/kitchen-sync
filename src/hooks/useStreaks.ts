import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useTasks } from './useTasks';
import { useUsers } from './useUsers';
import { useUIStore } from '../stores/uiStore';

const HOUSEHOLD_ID = import.meta.env.VITE_HOUSEHOLD_ID || 'demo-family-001';

interface StreakMilestone {
  days: number;
  emoji: string;
  message: string;
}

const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, emoji: '🔥', message: '3 day streak!' },
  { days: 7, emoji: '⚡', message: '1 week streak!' },
  { days: 14, emoji: '💪', message: '2 week streak!' },
  { days: 30, emoji: '🏆', message: '1 month streak!' },
  { days: 60, emoji: '🌟', message: '2 month streak!' },
  { days: 90, emoji: '👑', message: '3 month streak!' },
];

/**
 * Check if a streak milestone was just reached
 */
const checkStreakMilestone = (currentStreak: number, previousStreak: number): StreakMilestone | null => {
  const milestone = STREAK_MILESTONES.find(
    m => m.days === currentStreak && currentStreak > previousStreak
  );
  return milestone || null;
};

/**
 * Update a user's streak based on task completion
 */
export const useUpdateStreak = () => {
  const queryClient = useQueryClient();
  const queueCelebration = useUIStore((state) => state.queueCelebration);

  return useMutation({
    mutationFn: async (userId: string) => {
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnap.data();
      const currentStreak = userData.currentStreak || 0;
      const lastActiveDate = userData.lastActiveDate || null;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if user was already active today
      if (lastActiveDate === today) {
        return { userId, streakUpdated: false };
      }

      // Check if streak should continue or reset
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const newStreak = lastActiveDate === yesterdayStr ? currentStreak + 1 : 1;
      const longestStreak = Math.max(userData.longestStreak || 0, newStreak);

      // Check for milestone
      const milestone = checkStreakMilestone(newStreak, currentStreak);

      // Update user document
      await updateDoc(userRef, {
        currentStreak: newStreak,
        longestStreak,
        lastActiveDate: today,
        updatedAt: new Date().toISOString(),
      });

      return { 
        userId, 
        streakUpdated: true, 
        newStreak, 
        milestone,
        userName: userData.name 
      };
    },
    onSuccess: (data) => {
      if (data.streakUpdated && data.milestone) {
        // Queue celebration for milestone
        queueCelebration({
          type: 'streak',
          userId: data.userId,
          message: `${data.userName}: ${data.milestone.emoji} ${data.milestone.message}`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * Automatically track streaks based on task completions
 * This hook should be called at the app level
 */
export const useStreakTracking = () => {
  const { data: tasks } = useTasks();
  const { data: users } = useUsers();
  const { mutate: updateStreak } = useUpdateStreak();

  useEffect(() => {
    if (!tasks || !users) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Check each user's task completion for today
    users.forEach(user => {
      const userTasks = tasks.filter(t => t.assignedTo === user.id && t.type === 'chore');
      const completedToday = userTasks.filter(t => {
        if (!t.completed || !t.completedAt) return false;
        const completedDate = t.completedAt.split('T')[0];
        return completedDate === today;
      });

      // If user completed at least one task today, update their streak
      if (completedToday.length > 0 && user.lastActiveDate !== today) {
        updateStreak(user.id);
      }
    });
  }, [tasks, users, updateStreak]);
};

/**
 * Reset streaks for inactive users (run daily)
 */
export const useStreakReset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Fetch users directly from hook instead of queryClient
      const users = queryClient.getQueryData(['users', HOUSEHOLD_ID]) as any[];

      if (!users || !Array.isArray(users)) return [];

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const resetPromises = users
        .filter((user: any) => {
          const lastActive = user.lastActiveDate;
          // Reset if user was last active before yesterday
          return lastActive && lastActive < yesterdayStr && user.currentStreak > 0;
        })
        .map(async (user: any) => {
          const userRef = doc(firestore, 'users', user.id);
          await updateDoc(userRef, {
            currentStreak: 0,
            updatedAt: new Date().toISOString(),
          });
          return user.id;
        });

      return await Promise.all(resetPromises);
    },
    onSuccess: (resetUserIds) => {
      if (resetUserIds.length > 0) {
        console.log(`Reset streaks for ${resetUserIds.length} inactive users`);
        queryClient.invalidateQueries({ queryKey: ['users'] });
      }
    },
  });
};

