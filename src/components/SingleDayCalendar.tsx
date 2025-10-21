import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { useUsers } from '../hooks/useUsers';
import { CalendarEventModal } from './CalendarEventModal';
import { EventDetailsModal } from './EventDetailsModal';
import type { CalendarEvent } from '../types';

interface SingleDayCalendarProps {
  date?: Date;
  onEventClick?: (event: CalendarEvent) => void;
}

export const SingleDayCalendar = ({ date = new Date(), onEventClick }: SingleDayCalendarProps) => {
  const { data: events, isLoading } = useCalendarEvents();
  const { data: users } = useUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Get events for the specific date
  const getEventsForDate = (targetDate: Date) => {
    if (!events) return [];
    const dateStr = targetDate.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.startTime).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // Get user by ID
  const getUserById = (userId: string) => {
    return users?.find(u => u.id === userId);
  };

  // Format time from ISO string
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  // Get event color
  const getEventColor = (event: CalendarEvent) => {
    if (event.source === 'google' && event.externalId) {
      const colors = [
        '#8B5CF6', '#A855F7', '#C084FC', '#DDD6FE',
        '#0A95FF', '#3B82F6', '#60A5FA', '#93C5FD',
        '#10B981', '#34D399', '#6EE7B7', '#A7F3D0',
        '#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7',
        '#EF4444', '#F87171', '#FCA5A5', '#FECACA'
      ];
      const hash = event.externalId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return colors[Math.abs(hash) % colors.length];
    }
    return event.color || '#0A95FF';
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      setSelectedEvent(event);
      setIsDetailsModalOpen(true);
    }
  };

  // Handle add event
  const handleAddEvent = () => {
    setSelectedDate(date);
    setEditingEvent(undefined);
    setIsModalOpen(true);
  };

  // Handle save event
  const handleSaveEvent = (eventData: Partial<CalendarEvent>) => {
    // This would typically call a mutation hook
    console.log('Save event:', eventData);
    setIsModalOpen(false);
    setEditingEvent(undefined);
    setSelectedDate(undefined);
  };

  const dayEvents = getEventsForDate(date);
  const isToday = date.toDateString() === new Date().toDateString();

  if (isLoading) {
    return (
      <div className="rounded-3xl p-6 bg-gray-light/30">
        <div className="h-8 w-32 bg-gray-light/50 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-gray-light/50 rounded animate-pulse" />
          <div className="h-12 bg-gray-light/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div 
        className="rounded-3xl p-6 bg-white h-full flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-black text-charcoal">
              {date.toLocaleDateString('en-US', { weekday: 'long' })}
            </h3>
            <p className="text-lg text-gray-medium">
              {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
          </div>
          {isToday && (
            <div className="w-3 h-3 bg-red rounded-full animate-pulse" />
          )}
        </div>

        {/* Events List */}
        <div className="space-y-3 flex-1 flex flex-col">
          {dayEvents.length === 0 ? (
            <div className="text-center py-8 flex-1 flex flex-col justify-center">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-gray-medium font-semibold">No events today</p>
              <button
                onClick={handleAddEvent}
                className="mt-3 px-4 py-2 bg-purple text-cream rounded-xl font-semibold hover:bg-purple/80 transition-colors"
              >
                Add Event
              </button>
            </div>
          ) : (
            <>
              {dayEvents
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .slice(0, 4) // Show max 4 events
                .map(event => {
                  const user = getUserById(event.assignedTo);
                  const startTime = new Date(event.startTime);
                  const endTime = new Date(event.endTime);
                  const isAllDay = startTime.getHours() === 0 && startTime.getMinutes() === 0 && 
                                   endTime.getHours() === 0 && endTime.getMinutes() === 0;
                  
                  return (
                    <motion.div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="p-3 rounded-xl cursor-pointer hover:scale-105 transition-all"
                      style={{ backgroundColor: getEventColor(event) }}
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black bg-white/20 text-white">
                          {user?.name.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-sm truncate">
                            {event.title}
                          </div>
                          <div className="text-xs text-white/80">
                            {isAllDay ? 'All Day' : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              
              {dayEvents.length > 4 && (
                <div className="text-center">
                  <button
                    onClick={handleAddEvent}
                    className="text-sm text-gray-medium hover:text-purple font-semibold transition-colors"
                  >
                    +{dayEvents.length - 4} more events
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <CalendarEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(undefined);
          setSelectedDate(undefined);
        }}
        onSave={handleSaveEvent}
        event={editingEvent}
        mode={editingEvent ? 'edit' : 'add'}
        selectedDate={selectedDate}
      />
      
      <EventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        event={selectedEvent}
      />
    </>
  );
};
