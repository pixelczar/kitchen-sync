import { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useUsers } from '../hooks/useUsers';
import type { CalendarEvent } from '../types';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => void;
  event?: CalendarEvent;
  mode: 'add' | 'edit';
  selectedDate?: Date;
}

export const CalendarEventModal = ({ isOpen, onClose, onSave, event, mode, selectedDate }: CalendarEventModalProps) => {
  const { data: users } = useUsers();
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState(event?.title || '');
  const [assignedTo, setAssignedTo] = useState(event?.assignedTo || '');
  const [startDate, setStartDate] = useState(
    event?.startTime 
      ? new Date(event.startTime).toISOString().slice(0, 16)
      : selectedDate?.toISOString().slice(0, 16) || new Date().toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState(
    event?.endTime 
      ? new Date(event.endTime).toISOString().slice(0, 16)
      : selectedDate 
        ? new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16)
        : new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  useEffect(() => {
    if (isOpen) {
      // Focus first input after modal opens
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = users?.find(u => u.id === assignedTo);
    
    const eventData: Partial<CalendarEvent> = {
      title,
      assignedTo,
      color: user?.color || '#0A95FF',
      startTime: new Date(startDate).toISOString(),
      endTime: new Date(endDate).toISOString(),
    };

    onSave(eventData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add Event' : 'Edit Event'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-2">
            Event Name
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-light rounded-xl focus:border-blue focus:outline-none text-base"
            placeholder="e.g., Soccer Practice, Piano Lesson"
            required
          />
        </div>

        {/* Assign To */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-2">
            For
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-light rounded-xl focus:border-blue focus:outline-none text-base"
            required
          >
            <option value="">Select person</option>
            {users?.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-2">
            Start Time
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-light rounded-xl focus:border-blue focus:outline-none text-base"
            required
          />
        </div>

        {/* End Time */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-2">
            End Time
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-light rounded-xl focus:border-blue focus:outline-none text-base"
            required
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
            disabled={!title.trim() || !startDate || !endDate}
          >
            {mode === 'add' ? 'Add Event' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

