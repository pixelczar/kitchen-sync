import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { Household } from '../types';

export const useHouseholdUserCounts = (households: Household[]) => {
  return useQuery({
    queryKey: ['householdUserCounts', households.map(h => h.id)],
    queryFn: async () => {
      
      if (!households || households.length === 0) {
        return {};
      }
      
      const counts: Record<string, number> = {};
      
      // For each household, count the actual users
      for (const household of households) {
        try {
          const q = query(
            collection(firestore, 'users'),
            where('householdId', '==', household.id)
          );
          const snapshot = await getDocs(q);
          counts[household.id] = snapshot.docs.length;
        } catch (error) {
          console.error(`Failed to count users for household ${household.id}:`, error);
          // Fallback to 0 if query fails (not member array length)
          counts[household.id] = 0;
        }
      }
      
      return counts;
    },
    enabled: households && households.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes - user counts change infrequently
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
    retry: (failureCount, error) => {
      // Don't retry on permission errors
      if (error instanceof Error && error.message.includes('permissions')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};
