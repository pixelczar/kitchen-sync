import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query as firestoreQuery, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { User } from '../types';
import { useToast } from '../components/Toast';
import { useCurrentHousehold } from './useCurrentHousehold';

const DEMO_HOUSEHOLD_ID = 'demo-family-001';

// Stub user data for demo/fallback
const getStubUsers = (householdId: string): User[] => {
  return [
    {
      id: 'user-1',
      householdId: householdId,
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
      householdId: householdId,
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
      householdId: householdId,
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
      householdId: householdId,
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
      householdId: householdId,
      name: 'Mom',
      role: 'parent',
      color: '#F7EA31',
      textColor: '#000000',
      currentStreak: 0,
      longestStreak: 0,
      kudosReceived: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
};

export const useUsers = () => {
  const { currentHouseholdId } = useCurrentHousehold();
  const queryClient = useQueryClient();
  
  const query = useQuery<User[], Error>({
    queryKey: ['users', currentHouseholdId],
    queryFn: async () => {
      console.log('🔥 useUsers queryFn called for household:', currentHouseholdId);
      
      if (!currentHouseholdId) {
        console.log('❌ No household ID, returning empty array');
        return [];
      }
      
      // Demo mode - return demo data immediately
      if (currentHouseholdId === DEMO_HOUSEHOLD_ID) {
        console.log('🎭 Demo mode, returning stub data');
        return getStubUsers(currentHouseholdId);
      }
      
      
      // Query for the specific household
      console.log('🗄️ Querying database for household:', currentHouseholdId);
      const q = firestoreQuery(
        collection(firestore, 'users'),
        where('householdId', '==', currentHouseholdId)
      );
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
      console.log('📊 Database returned users for', currentHouseholdId, ':', users.length, users.map(u => u.name));
      return users;
    },
    enabled: !!currentHouseholdId,
    staleTime: 5 * 60 * 1000, // 5 minutes - reasonable for user data
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    refetchOnMount: false, // Use cache if available
    refetchOnWindowFocus: false, // Don't refetch on focus
    retry: (failureCount, error) => {
      // Don't retry on permission errors
      if (error instanceof Error && error.message.includes('permissions')) {
        return false;
      }
      return failureCount < 2;
    },
  });
  
  return {
    ...query,
    refetch: () => {
      return queryClient.refetchQueries({ queryKey: ['users', currentHouseholdId] });
    }
  };
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { currentHouseholdId } = useCurrentHousehold();

  return useMutation({
    mutationFn: async (userData: Omit<User, 'id' | 'householdId' | 'createdAt' | 'updatedAt'>) => {
      if (!currentHouseholdId) {
        throw new Error('No household selected');
      }
      
      const newUser = {
        ...userData,
        householdId: currentHouseholdId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(firestore, 'users'), newUser);
      return { id: docRef.id, ...newUser };
    },
    onSuccess: () => {
      console.log('User created successfully, triggering refetch');
      toast.success('Family member added!', '👥');
      // Invalidate all user-related queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['householdUserCounts'] });
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
      console.log('User updated successfully, triggering refetch');
      toast.success('Family member updated!', '✏️');
      // Invalidate all user-related queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['householdUserCounts'] });
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
      console.log('User deleted successfully, triggering refetch');
      toast.success('Family member removed', '👋');
      // Invalidate all user-related queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['householdUserCounts'] });
    },
    onError: (error) => {
      console.error('User deletion failed:', error);
      toast.error('Failed to remove family member');
    },
  });
};