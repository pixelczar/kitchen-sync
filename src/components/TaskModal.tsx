import { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useUsers } from '../hooks/useUsers';
import type { Task } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task?: Task;
  mode: 'add' | 'edit';
}

export const TaskModal = ({ isOpen, onClose, onSave, task, mode }: TaskModalProps) => {
  const { data: users } = useUsers();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(task?.title || '');
  const [type, setType] = useState<'chore' | 'todo'>(task?.type || 'chore');
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || '');
  const [recurring, setRecurring] = useState(task?.recurring?.frequency || 'none');
  const [days, setDays] = useState<number[]>(task?.recurring?.days || []);

  // Sync state when modal opens or task changes
  useEffect(() => {
    if (isOpen) {
      setTitle(task?.title || '');
      setType(task?.type || 'chore');
      setAssignedTo(task?.assignedTo || '');
      setRecurring(task?.recurring?.frequency || 'none');
      setDays(task?.recurring?.days || []);
      
      // Focus first input
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen, task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData: Partial<Task> = {
      title,
      type,
      assignedTo: assignedTo || undefined,
      recurring: recurring !== 'none' ? {
        frequency: recurring as 'daily' | 'weekly' | 'monthly',
        days: recurring === 'weekly' ? days : undefined,
      } : undefined,
    };

    onSave(taskData);
    onClose();
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add Task' : 'Edit Task'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xl font-semibold tracking-tight text-charcoal mb-2">
            Task Name
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-light rounded-xl focus:border-blue focus:outline-none text-base"
            placeholder="e.g., Make bed, Take out trash"
            required
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xl font-semibold tracking-tight text-charcoal mb-2">
            Type
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType('chore')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                type === 'chore'
                  ? 'bg-blue text-cream'
                  : 'bg-gray-light text-gray-medium hover:bg-gray-medium hover:text-charcoal'
              }`}
            >
              Chore
            </button>
            <button
              type="button"
              onClick={() => setType('todo')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                type === 'todo'
                  ? 'bg-green text-cream'
                  : 'bg-gray-light text-gray-medium hover:bg-gray-medium hover:text-charcoal'
              }`}
            >
              Todo
            </button>
          </div>
        </div>

        {/* Assign To */}
        {type === 'chore' && users && (
          <div>
            <label className="block text-xl font-semibold tracking-tight text-charcoal mb-2">
              Assign To
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-light rounded-xl focus:border-blue focus:outline-none text-base"
            >
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Recurring */}
        <div>
          <label className="block text-xl font-semibold tracking-tight text-charcoal mb-2">
            Repeats
          </label>
          <select
            value={recurring}
            onChange={(e) => setRecurring(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-light rounded-xl focus:border-blue focus:outline-none text-base"
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Weekly Days */}
        {recurring === 'weekly' && (
          <div>
            <label className="block text-xl font-semibold tracking-tight text-charcoal mb-2">
              Repeat on
            </label>
            <div className="flex gap-2">
              {dayNames.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (days.includes(index)) {
                      setDays(days.filter(d => d !== index));
                    } else {
                      setDays([...days, index].sort());
                    }
                  }}
                  className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    days.includes(index)
                      ? 'bg-blue text-cream'
                      : 'bg-gray-light text-gray-medium hover:bg-gray-medium hover:text-charcoal'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            size="large"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="large"
            className="flex-1"
            disabled={!title.trim()}
          >
            {mode === 'add' ? 'Add Task' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

