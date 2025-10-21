import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { Household, HouseholdSettings } from '../types';
import { useToast } from '../components/Toast';
import { useAuth } from './useAuth';

const DEFAULT_HOUSEHOLD_SETTINGS: HouseholdSettings = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  theme: 'auto',
  screensaverEnabled: true,
  screensaverIdleMinutes: 5,
  screensaverTransitionSeconds: 10,
  photoAlbumIds: [],
  celebrationsEnabled: true,
  celebrationVolume: 0.8,
  celebrationStyle: 'full',
  pushNotificationsEnabled: true,
  notifyOnKudos: true,
  notifyOnStreaks: true,
  notifyOnEventReminders: true,
  calendarView: 'month',
  startOfWeek: 0,
  showWeekNumbers: false,
  allowChildrenToGiveKudos: true,
  photoFaceDetection: true,
  shareDataWithAI: false,
};

export const useHouseholds = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['households', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        console.log('🏠 Fetching households for user:', user.uid);
        // Get households where user is a member
        const q = query(
          collection(firestore, 'households'),
          where('members', 'array-contains', user.uid)
        );
        const snapshot = await getDocs(q);
        console.log('🏠 Raw households snapshot:', snapshot.docs.length, 'households');
        
        // Log each household's data
        snapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`🏠 Household ${index}:`, {
            id: doc.id,
            name: data.name,
            members: data.members,
            createdBy: data.createdBy
          });
        });
        
        const households = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Household));
        console.log('🏠 Processed households:', households.map(h => `${h.name} (${h.id})`));
        return households;
      } catch (error) {
        console.error('Failed to fetch households:', error);
        // If it's a permissions error, the user might not have any households yet
        if (error instanceof Error && error.message.includes('permissions')) {
          console.log('No households found or insufficient permissions - user may need to create their first household');
          return [];
        }
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on permission errors - user just needs to create their first household
      if (error instanceof Error && error.message.includes('permissions')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useCreateHousehold = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (householdData: { name: string; settings?: Partial<HouseholdSettings> }) => {
      if (!user) throw new Error('User must be authenticated');
      
      const newHousehold = {
        name: householdData.name,
        members: [user.uid],
        createdAt: new Date().toISOString(),
        settings: {
          ...DEFAULT_HOUSEHOLD_SETTINGS,
          ...householdData.settings,
        },
        createdBy: user.uid,
      };

      const docRef = await addDoc(collection(firestore, 'households'), newHousehold);
      return { id: docRef.id, ...newHousehold };
    },
    onSuccess: (newHousehold) => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Created family "${newHousehold.name}"!`, '🏠');
    },
    onError: (error) => {
      console.error('Household creation failed:', error);
      toast.error('Failed to create family');
    },
  });
};

export const useUpdateHousehold = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ householdId, updates }: { householdId: string; updates: Partial<Household> }) => {
      const householdRef = doc(firestore, 'households', householdId);
      await updateDoc(householdRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      toast.success('Family updated!', '✨');
    },
    onError: (error) => {
      console.error('Household update failed:', error);
      toast.error('Failed to update family');
    },
  });
};

export const useJoinHousehold = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (householdId: string) => {
      if (!user) throw new Error('User must be authenticated');
      
      const householdRef = doc(firestore, 'households', householdId);
      const householdDoc = await getDoc(householdRef);
      
      if (!householdDoc.exists()) {
        throw new Error('Family not found');
      }
      
      const household = householdDoc.data() as Household;
      if (household.members.includes(user.uid)) {
        throw new Error('Already a member of this family');
      }
      
      await updateDoc(householdRef, {
        members: [...household.members, user.uid],
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Joined family!', '👥');
    },
    onError: (error) => {
      console.error('Failed to join household:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join family');
    },
  });
};

export const useLeaveHousehold = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (householdId: string) => {
      if (!user) throw new Error('User must be authenticated');
      
      const householdRef = doc(firestore, 'households', householdId);
      const householdDoc = await getDoc(householdRef);
      
      if (!householdDoc.exists()) {
        throw new Error('Family not found');
      }
      
      const household = householdDoc.data() as Household;
      const updatedMembers = household.members.filter(memberId => memberId !== user.uid);
      
      if (updatedMembers.length === 0) {
        // If no members left, delete the household
        await deleteDoc(householdRef);
      } else {
        // Otherwise, just remove the user
        await updateDoc(householdRef, {
          members: updatedMembers,
          updatedAt: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Left family', '👋');
    },
    onError: (error) => {
      console.error('Failed to leave household:', error);
      toast.error('Failed to leave family');
    },
  });
};

export const useDeleteHousehold = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (householdId: string) => {
      if (!user) throw new Error('User must be authenticated');
      
      const householdRef = doc(firestore, 'households', householdId);
      const householdDoc = await getDoc(householdRef);
      
      if (!householdDoc.exists()) {
        throw new Error('Family not found');
      }
      
      const household = householdDoc.data() as Household;
      
      // Only allow deletion if user is the creator
      if (household.createdBy && household.createdBy !== user.uid) {
        throw new Error('Only the family creator can delete this family');
      }
      
      // Delete the household
      await deleteDoc(householdRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Family deleted', '🗑️');
    },
    onError: (error) => {
      console.error('Failed to delete household:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete family');
    },
  });
};
