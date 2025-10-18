import { Modal } from './Modal';
import { useUsers } from '../hooks/useUsers';
import type { CalendarEvent } from '../types';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
}

export const EventDetailsModal = ({ isOpen, onClose, event }: EventDetailsModalProps) => {
  const { data: users } = useUsers();
  
  if (!event) return null;
  
  const assignedUser = users?.find(user => user.id === event.assignedTo);
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };
  
  const getCalendarColor = (source: string, externalId?: string) => {
    if (source === 'google') {
      // Use a hash of the externalId to generate consistent colors
      if (externalId) {
        const hash = externalId.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];
        return colors[Math.abs(hash) % colors.length];
      }
      return '#0A95FF'; // Default blue for Google events
    }
    return event.color || '#6C757D'; // Use event color or default
  };
  
  const calendarColor = getCalendarColor(event.source, event.externalId);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Event Details">
      <div className="space-y-6">
        {/* Event Title */}
        <div>
          <h3 className="text-2xl font-bold text-charcoal mb-2">{event.title}</h3>
          {event.description && (
            <p className="text-gray-medium">{event.description}</p>
          )}
        </div>
        
        {/* Time Information */}
        <div className="bg-gray-light/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: calendarColor }} />
            <span className="font-semibold text-charcoal">
              {formatDate(startTime)}
            </span>
          </div>
          <div className="text-lg text-gray-medium">
            {formatTime(startTime)} - {formatTime(endTime)}
          </div>
          <div className="text-xs text-gray-medium mt-1">
            Timezone: {localStorage.getItem('userTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone}
          </div>
          {event.location && (
            <div className="text-sm text-gray-medium mt-2">
              📍 {event.location}
            </div>
          )}
        </div>
        
        {/* Event Source */}
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: calendarColor }}
          />
          <div>
            <div className="font-semibold text-charcoal">
              {event.source === 'google' ? 'Google Calendar' : 'Manual Event'}
            </div>
            {event.source === 'google' && (
              <div className="text-sm text-gray-medium">
                Synced from Google Calendar (Read-only)
              </div>
            )}
          </div>
        </div>
        
        {/* Assigned User */}
        {assignedUser && (
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-cream font-bold"
              style={{ backgroundColor: assignedUser.color }}
            >
              {assignedUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-charcoal">Assigned to</div>
              <div className="text-gray-medium">{assignedUser.name}</div>
            </div>
          </div>
        )}
        
        {/* Event Metadata */}
        <div className="border-t border-gray-light pt-4">
          <div className="text-sm text-gray-medium space-y-1">
            <div>Created: {new Date(event.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(event.updatedAt).toLocaleString()}</div>
            {event.externalId && (
              <div>Google Event ID: {event.externalId}</div>
            )}
          </div>
        </div>
        
        {/* Close Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg font-semibold transition-all bg-charcoal text-cream hover:bg-charcoal/90"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
