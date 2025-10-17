import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { User } from '../types';
import { useToast } from '../components/Toast';

const HOUSEHOLD_ID = import.meta.env.VITE_HOUSEHOLD_ID || 'demo-family-001';

// Stub user data for demo/fallback
const getStubUsers = (): User[] => {
  return [
    {
      id: 'user-1',
      householdId: HOUSEHOLD_ID,
      name: 'Emma',
      role: 'child',
      color: '#FF6B6B',
      textColor: '#FFFFFF',
      currentStreak: 3,
      longestStreak: 7,
      kudosReceived: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-2',
      householdId: HOUSEHOLD_ID,
      name: 'Liam',
      role: 'child',
      color: '#4ECDC4',
      textColor: '#FFFFFF',
      currentStreak: 5,
      longestStreak: 10,
      kudosReceived: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-3',
      householdId: HOUSEHOLD_ID,
      name: 'Ava',
      role: 'child',
      color: '#45B7D1',
      textColor: '#FFFFFF',
      currentStreak: 2,
      longestStreak: 5,
      kudosReceived: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-4',
      householdId: HOUSEHOLD_ID,
      name: 'Noah',
      role: 'child',
      color: '#96CEB4',
      textColor: '#FFFFFF',
      currentStreak: 1,
      longestStreak: 3,
      kudosReceived: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-5',
      householdId: HOUSEHOLD_ID,
      name: 'Mom',
      role: 'parent',
      color: '#FFEAA7',
      textColor: '#2D3436',
      currentStreak: 7,
      longestStreak: 12,
      kudosReceived: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
};

export const useUsers = () => {
  return useQuery({
    queryKey: ['users', HOUSEHOLD_ID],
    queryFn: async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 3000)
        );
        
        const queryPromise = (async () => {
          const q = query(
            collection(firestore, 'users'),
            where('householdId', '==', HOUSEHOLD_ID)
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        })();
        
        const users = await Promise.race([queryPromise, timeoutPromise]);
        
        // If no users from DB, use stub data
        if (users.length === 0) {
          return getStubUsers();
        }
        
        return users;
      } catch (error) {
        console.warn('Users query failed, using stub data:', error);
        return getStubUsers();
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on timeout errors
      if (error?.message?.includes('timeout')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - makes subsequent loads instant
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (userData: Omit<User, 'id' | 'householdId' | 'createdAt' | 'updatedAt'>) => {
      const newUser = {
        ...userData,
        householdId: HOUSEHOLD_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(firestore, 'users'), newUser);
      return { id: docRef.id, ...newUser };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Family member added!', '👥');
    },
    onError: (error) => {
      console.error('User creation failed:', error);
      toast.error('Failed to add family member');
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Family member updated!', '✨');
    },
    onError: (error) => {
      console.error('User update failed:', error);
      toast.error('Failed to update family member');
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const userRef = doc(firestore, 'users', userId);
      await deleteDoc(userRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Family member removed', '👋');
    },
    onError: (error) => {
      console.error('User deletion failed:', error);
      toast.error('Failed to remove family member');
    },
  });
};
