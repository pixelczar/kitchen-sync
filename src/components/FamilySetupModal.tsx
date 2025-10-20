import { useState } from 'react';
import { Modal } from './Modal';
import { useCreateHousehold } from '../hooks/useHouseholds';
import { useAuth } from '../hooks/useAuth';

interface FamilySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (householdId: string) => void;
}

export const FamilySetupModal = ({ isOpen, onClose, onComplete }: FamilySetupModalProps) => {
  const [familyName, setFamilyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const createHousehold = useCreateHousehold();

  const handleCreateFamily = async () => {
    if (!familyName.trim()) return;
    
    setIsCreating(true);
    try {
      const newHousehold = await createHousehold.mutateAsync({
        name: familyName.trim(),
        settings: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
      });
      
      onComplete(newHousehold.id);
      onClose();
    } catch (error) {
      console.error('Failed to create family:', error);
      // The error will be handled by the toast in the mutation
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && familyName.trim() && !isCreating) {
      handleCreateFamily();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Up Your Family">
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏠</span>
          </div>
          <h2 className="text-2xl font-bold text-charcoal mb-2">Welcome to KitchenSync!</h2>
          <p className="text-gray-medium">
            Let's set up your family so you can start organizing your household together.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-2">
              Family Name
            </label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., The Smith Family, The Johnsons, etc."
              className="w-full px-4 py-3 rounded-xl border border-gray-light focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple text-charcoal"
              autoFocus
            />
            <p className="text-xs text-gray-medium mt-1">
              You can change this later in settings
            </p>
          </div>

          {user && (
            <div className="p-4 rounded-xl bg-gray-light/30">
              <h3 className="font-semibold text-charcoal text-sm mb-2">Your Account</h3>
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" />
                )}
                <div>
                  <div className="font-medium text-charcoal">{user.displayName || user.email}</div>
                  <div className="text-xs text-gray-medium">{user.email}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all bg-gray-light text-charcoal hover:bg-gray-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateFamily}
            disabled={!familyName.trim() || isCreating}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              !familyName.trim() || isCreating
                ? 'bg-gray-light text-gray-medium cursor-not-allowed'
                : 'bg-purple text-cream hover:bg-purple/90'
            }`}
          >
            {isCreating ? 'Creating...' : 'Create Family'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
