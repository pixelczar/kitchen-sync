import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { queueFirestoreWrite } from '../lib/firestore-batch';
import { useUIStore } from '../stores/uiStore';
import type { Task } from '../types';

const HOUSEHOLD_ID = import.meta.env.VITE_HOUSEHOLD_ID || 'demo-family-001';

export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks', HOUSEHOLD_ID],
    queryFn: async () => {
      const q = query(
        collection(firestore, 'tasks'),
        where('householdId', '==', HOUSEHOLD_ID)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
    },
  });
};

export const useTaskMutations = () => {
  const queryClient = useQueryClient();
  const { setOptimisticTaskState, clearOptimisticTaskState } = useUIStore();

  return useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      // 1. Optimistic update in Zustand (instant UI)
      setOptimisticTaskState(taskId, completed);
      
      // 2. Queue Firestore write (batched, 500ms delay)
      queueFirestoreWrite(async () => {
        const taskRef = doc(firestore, 'tasks', taskId);
        await updateDoc(taskRef, {
          completed,
          completedAt: completed ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        });
      });
      
      return { taskId, completed };
    },
    onSuccess: ({ taskId }) => {
      // Clear optimistic update and refetch tasks
      clearOptimisticTaskState(taskId);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: ({ taskId }) => {
      // Revert optimistic update on error
      clearOptimisticTaskState(taskId);
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      console.log('Creating task with data:', taskData);
      
      // Remove undefined values (Firestore doesn't accept them)
      const cleanedData: Record<string, any> = {};
      Object.entries(taskData).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedData[key] = value;
        }
      });
      
      const newTask = {
        ...cleanedData,
        householdId: HOUSEHOLD_ID,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log('Full task object:', newTask);
      const docRef = await addDoc(collection(firestore, 'tasks'), newTask);
      console.log('Task created with ID:', docRef.id);
      return { id: docRef.id, ...newTask };
    },
    onSuccess: (data) => {
      console.log('Task creation successful, invalidating queries', data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('Task creation failed:', error);
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      // Remove undefined values (Firestore doesn't accept them)
      const cleanedUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedUpdates[key] = value;
        }
      });
      
      const taskRef = doc(firestore, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...cleanedUpdates,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      await deleteDoc(doc(firestore, 'tasks', taskId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

