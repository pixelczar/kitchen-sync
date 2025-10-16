import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import type { Kudos } from '../types';

const HOUSEHOLD_ID = import.meta.env.VITE_HOUSEHOLD_ID || 'demo-family-001';

export const useKudos = (userId?: string) => {
  return useQuery({
    queryKey: ['kudos', HOUSEHOLD_ID, userId],
    queryFn: async () => {
      const q = userId
        ? query(
            collection(firestore, 'kudos'),
            where('householdId', '==', HOUSEHOLD_ID),
            where('to', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(50)
          )
        : query(
            collection(firestore, 'kudos'),
            where('householdId', '==', HOUSEHOLD_ID),
            orderBy('timestamp', 'desc'),
            limit(100)
          );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Kudos));
    },
  });
};

export const useSendKudos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (kudosData: Omit<Kudos, 'id' | 'householdId' | 'timestamp'>) => {
      // Remove undefined values (Firestore doesn't accept them)
      const cleanedData: Record<string, any> = {};
      Object.entries(kudosData).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedData[key] = value;
        }
      });
      
      const newKudos = {
        ...cleanedData,
        householdId: HOUSEHOLD_ID,
        timestamp: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(firestore, 'kudos'), newKudos);
      return { id: docRef.id, ...newKudos };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kudos'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

