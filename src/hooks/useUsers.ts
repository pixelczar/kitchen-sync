import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { User } from '../types';
import { useToast } from '../components/Toast';

const HOUSEHOLD_ID = import.meta.env.VITE_HOUSEHOLD_ID || 'demo-family-001';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users', HOUSEHOLD_ID],
    queryFn: async () => {
      const q = query(
        collection(firestore, 'users'),
        where('householdId', '==', HOUSEHOLD_ID)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    },
    refetchInterval: 10000, // Poll every 10s
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
