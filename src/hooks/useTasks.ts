import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { queueFirestoreWrite } from '../lib/firestore-batch';
import { useUIStore } from '../stores/uiStore';
import { useCurrentHousehold } from './useCurrentHousehold';
import type { Task } from '../types';

// Stub task data for demo/fallback
const getStubTasks = (householdId: string): Task[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return [
    {
      id: 'task-1',
      householdId,
      title: 'Make bed',
      description: 'Make your bed every morning',
      assignedTo: 'user-1', // Emma
      type: 'chore',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      householdId,
      title: 'Feed the dog',
      description: 'Give Rex his breakfast and dinner',
      assignedTo: 'user-2', // Liam
      type: 'chore',
      completed: true,
      completedAt: new Date(today.getTime() + 8 * 60 * 60 * 1000).toISOString(), // 8am today
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      householdId,
      title: 'Set the table',
      description: 'Set the table for dinner',
      assignedTo: 'user-3', // Ava
      type: 'chore',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      householdId,
      title: 'Take out trash',
      description: 'Take the kitchen trash to the curb',
      assignedTo: 'user-4', // Noah
      type: 'chore',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'todo-1',
      householdId,
      title: 'Plan weekend trip',
      description: 'Research and plan family weekend getaway',
      assignedTo: 'user-5', // Mom
      type: 'todo',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'todo-2',
      householdId,
      title: 'Buy groceries',
      description: 'Weekly grocery shopping',
      assignedTo: 'user-5', // Mom
      type: 'todo',
      completed: true,
      completedAt: new Date(today.getTime() + 10 * 60 * 60 * 1000).toISOString(), // 10am today
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
};

export const useTasks = () => {
  const { currentHouseholdId } = useCurrentHousehold();
  
  return useQuery({
    queryKey: ['tasks', currentHouseholdId],
    queryFn: async () => {
      try {
        if (!currentHouseholdId) {
          console.log('No current household ID, returning empty array');
          return [];
        }

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 3000)
        );
        
        const queryPromise = (async () => {
          const q = query(
            collection(firestore, 'tasks'),
            where('householdId', '==', currentHouseholdId)
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
        })();
        
        const tasks = await Promise.race([queryPromise, timeoutPromise]);
        
        // If no tasks from DB, use stub data
        if (tasks.length === 0) {
          return getStubTasks(currentHouseholdId);
        }
        
        return tasks;
      } catch (error) {
        console.warn('Tasks query failed, using stub data:', error);
        return getStubTasks(currentHouseholdId || 'demo-family-001');
      }
    },
    enabled: !!currentHouseholdId,
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
    onError: (_error, variables) => {
      // Revert optimistic update on error
      clearOptimisticTaskState(variables.taskId);
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { currentHouseholdId } = useCurrentHousehold();

  return useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      console.log('Creating task with data:', taskData);
      
      if (!currentHouseholdId) {
        throw new Error('No current household ID');
      }
      
      // Remove undefined values (Firestore doesn't accept them)
      const cleanedData: Record<string, any> = {};
      Object.entries(taskData).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedData[key] = value;
        }
      });
      
      const newTask = {
        ...cleanedData,
        householdId: currentHouseholdId,
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

