import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useCurrentHousehold } from './useCurrentHousehold';
import type { Kudos } from '../types';

export const useKudos = (userId?: string) => {
  const { currentHouseholdId } = useCurrentHousehold();
  
  return useQuery({
    queryKey: ['kudos', currentHouseholdId, userId],
    queryFn: async () => {
      if (!currentHouseholdId) {
        return [];
      }
      
      const q = userId
        ? query(
            collection(firestore, 'kudos'),
            where('householdId', '==', currentHouseholdId),
            where('to', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(50)
          )
        : query(
            collection(firestore, 'kudos'),
            where('householdId', '==', currentHouseholdId),
            orderBy('timestamp', 'desc'),
            limit(100)
          );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Kudos));
    },
    enabled: !!currentHouseholdId,
  });
};

export const useSendKudos = () => {
  const queryClient = useQueryClient();
  const { currentHouseholdId } = useCurrentHousehold();

  return useMutation({
    mutationFn: async (kudosData: Omit<Kudos, 'id' | 'householdId' | 'timestamp'>) => {
      if (!currentHouseholdId) {
        throw new Error('No current household ID');
      }
      
      // Remove undefined values (Firestore doesn't accept them)
      const cleanedData: Record<string, any> = {};
      Object.entries(kudosData).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedData[key] = value;
        }
      });
      
      const newKudos = {
        ...cleanedData,
        householdId: currentHouseholdId,
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

