import { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { Button } from './Button';
import { useUsers } from '../hooks/useUsers';
import type { Kudos } from '../types';

interface KudosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (kudos: Omit<Kudos, 'id' | 'householdId' | 'timestamp'>) => void;
  fromUserId: string;
}

const kudosTypes = [
  { type: 'effort', emoji: '💪', label: 'Great Effort!' },
  { type: 'kindness', emoji: '❤️', label: 'So Kind!' },
  { type: 'smart', emoji: '🧠', label: 'Smart Thinking!' },
  { type: 'helpful', emoji: '🤝', label: 'Super Helpful!' },
  { type: 'funny', emoji: '😄', label: 'Made Me Laugh!' },
] as const;

export const KudosModal = ({ isOpen, onClose, onSend, fromUserId }: KudosModalProps) => {
  const { data: users } = useUsers();
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedType, setSelectedType] = useState<typeof kudosTypes[number]['type']>('effort');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const kudosType = kudosTypes.find(k => k.type === selectedType);
    if (!kudosType || !selectedUser) return;

    onSend({
      from: fromUserId,
      to: selectedUser,
      type: selectedType,
      message: message || kudosType.label,
      emoji: kudosType.emoji,
    });
    
    // Reset form
    setSelectedUser('');
    setSelectedType('effort');
    setMessage('');
    onClose();
  };

  const otherUsers = users?.filter(u => u.id !== fromUserId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Kudos ❤️">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Who to send to */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-3">
            Send kudos to
          </label>
          <div className="grid grid-cols-2 gap-3">
            {otherUsers?.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUser(user.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedUser === user.id
                    ? 'border-blue bg-blue/10'
                    : 'border-gray-light hover:border-gray-medium'
                }`}
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-xl font-black"
                  style={{ backgroundColor: user.color, color: user.textColor }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm font-bold text-charcoal capitalize">
                  {user.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Type of kudos */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-3">
            For being...
          </label>
          <div className="grid grid-cols-2 gap-2">
            {kudosTypes.map(kudos => (
              <motion.button
                key={kudos.type}
                type="button"
                onClick={() => setSelectedType(kudos.type)}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-xl transition-all ${
                  selectedType === kudos.type
                    ? 'bg-yellow text-charcoal'
                    : 'bg-gray-light text-gray-medium hover:bg-gray-medium hover:text-charcoal'
                }`}
              >
                <div className="text-2xl mb-1">{kudos.emoji}</div>
                <div className="text-xs font-bold">{kudos.label}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Optional message */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-2">
            Add a message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-light rounded-xl focus:border-blue focus:outline-none text-base resize-none"
            placeholder="You're awesome because..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={!selectedUser}
          >
            Send Kudos! 💖
          </Button>
        </div>
      </form>
    </Modal>
  );
};

