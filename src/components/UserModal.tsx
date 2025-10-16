import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<User>) => void;
  user?: User;
  mode: 'add' | 'edit';
}

const COLORS = [
  { value: '#F7EA31', name: 'Yellow', textColor: '#3C0E4D' },
  { value: '#F7313F', name: 'Red', textColor: '#FFFFFF' },
  { value: '#0A95FF', name: 'Blue', textColor: '#FFFFFF' },
  { value: '#3C0E4D', name: 'Purple', textColor: '#FFFFFF' },
  { value: '#10B981', name: 'Green', textColor: '#FFFFFF' },
  { value: '#F97316', name: 'Orange', textColor: '#FFFFFF' },
];

const EMOJIS = ['👨', '👩', '👦', '👧', '🧑', '👴', '👵', '👶'];

export const UserModal = ({ isOpen, onClose, onSave, user, mode }: UserModalProps) => {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'parent' | 'child'>('child');
  const [color, setColor] = useState(COLORS[0].value);
  const [textColor, setTextColor] = useState(COLORS[0].textColor);
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setName(user.name);
        setRole(user.role);
        setColor(user.color);
        setTextColor(user.textColor);
      } else {
        setName('');
        setRole('child');
        setColor(COLORS[0].value);
        setTextColor(COLORS[0].textColor);
        setEmoji(EMOJIS[0]);
      }
      
      // Focus first input
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [user, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    onSave({
      name,
      role,
      color,
      textColor,
      currentStreak: user?.currentStreak || 0,
      longestStreak: user?.longestStreak || 0,
      kudosReceived: user?.kudosReceived || 0,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-charcoal/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative bg-cream rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <h2 className="text-4xl font-black text-charcoal mb-6">
            {mode === 'add' ? 'Add Family Member' : 'Edit Family Member'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-lg font-bold text-charcoal mb-2">
                Name
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-light/30 text-charcoal font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-blue"
                placeholder="Enter name"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-lg font-bold text-charcoal mb-2">
                Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('parent')}
                  className={`px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                    role === 'parent'
                      ? 'bg-blue text-cream'
                      : 'bg-gray-light/30 text-gray-medium hover:bg-gray-light/50'
                  }`}
                >
                  👨‍👩‍ Parent
                </button>
                <button
                  type="button"
                  onClick={() => setRole('child')}
                  className={`px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                    role === 'child'
                      ? 'bg-blue text-cream'
                      : 'bg-gray-light/30 text-gray-medium hover:bg-gray-light/50'
                  }`}
                >
                  👦👧 Child
                </button>
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-lg font-bold text-charcoal mb-2">
                Color
              </label>
              <div className="grid grid-cols-6 gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setColor(c.value);
                      setTextColor(c.textColor);
                    }}
                    className={`aspect-square rounded-xl transition-all ${
                      color === c.value ? 'ring-4 ring-charcoal ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Emoji Avatar (optional, for future) */}
            <div>
              <label className="block text-lg font-bold text-charcoal mb-2">
                Avatar Emoji (optional)
              </label>
              <div className="flex gap-3 flex-wrap">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-4xl p-3 rounded-xl transition-all ${
                      emoji === e ? 'bg-blue/20 scale-110' : 'bg-gray-light/20 hover:scale-105'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-xl bg-gray-light/30 text-gray-medium font-bold text-lg hover:bg-gray-light/50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 rounded-xl bg-blue text-cream font-bold text-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!name.trim()}
              >
                {mode === 'add' ? 'Add Member' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

