import { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import { motion } from 'framer-motion';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { CalendarEventModal } from './CalendarEventModal';
import { EventDetailsModal } from './EventDetailsModal';
import { toBigCalendarEvents, getEventColor } from '../lib/calendar-event-adapter';
import type { CalendarEvent } from '../types';
import type { BigCalendarEvent } from '../lib/calendar-event-adapter';

// Import react-big-calendar styles
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup moment localizer
const localizer = momentLocalizer(moment);

interface DashboardCalendarWidgetProps {
  date?: Date;
  onEventClick?: (event: CalendarEvent) => void;
  height?: number;
}

export const DashboardCalendarWidget = ({ date = new Date(), onEventClick, height }: DashboardCalendarWidgetProps) => {
  const { data: events, isLoading } = useCalendarEvents();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [calendarHeight, setCalendarHeight] = useState(400);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic height based on available space or use passed height
  useEffect(() => {
    if (height) {
      setCalendarHeight(height);
      return;
    }
    
    const calculateHeight = () => {
      const viewportHeight = window.innerHeight;
      const headerHeight = 200; // Approximate header height
      const bottomNavHeight = 120; // Bottom navigation height
      const padding = 60; // More padding for better spacing
      const availableHeight = viewportHeight - headerHeight - bottomNavHeight - padding;
      setCalendarHeight(Math.max(300, Math.min(500, availableHeight))); // Limit max height to 500px
    };

    // Use a small delay to ensure DOM is ready
    const timeoutId = setTimeout(calculateHeight, 100);
    window.addEventListener('resize', calculateHeight);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculateHeight);
    };
  }, [height]);

  // Convert events to big calendar format
  const bigCalendarEvents = events ? toBigCalendarEvents(events) : [];


  // Handle event selection
  const handleSelectEvent = (event: BigCalendarEvent) => {
    // Find the original event from the events array
    const originalEvent = events?.find(e => e.id === event.id);
    if (originalEvent) {
      if (onEventClick) {
        onEventClick(originalEvent);
      } else {
        setSelectedEvent(originalEvent);
        setIsDetailsModalOpen(true);
      }
    }
  };

  // Handle slot selection
  const handleSelectSlot = (slotInfo: { start: Date; end: Date; slots: Date[] }) => {
    setSelectedDate(slotInfo.start);
    setEditingEvent(undefined);
    setIsModalOpen(true);
  };

  // Handle save event
  const handleSaveEvent = (eventData: Partial<CalendarEvent>) => {
    console.log('Save event:', eventData);
    setIsModalOpen(false);
    setEditingEvent(undefined);
    setSelectedDate(undefined);
  };

  // Custom event style getter
  const eventStyleGetter = (event: BigCalendarEvent) => {
    const color = getEventColor(event);
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        fontSize: '13px',
        fontWeight: '600',
        padding: '3px 6px',
        minHeight: '28px',
        maxHeight: '32px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'normal',
        lineHeight: '1.3',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
      },
    };
  };

  // Custom components for better styling
  const components = {
    event: ({ event }: { event: BigCalendarEvent }) => (
      <div 
        className="font-semibold" 
        style={{ 
          fontSize: '13px', 
          lineHeight: '1.3',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {event.title}
      </div>
    ),
    toolbar: () => null, // Hide toolbar
    header: ({ date }: { date: Date }) => (
      <div className="text-center py-2">
        <div className="text-lg font-bold text-gray-600">
          {date.toLocaleDateString('en-US', { weekday: 'long' })}
        </div>
        <div className="text-sm text-gray-500">
          {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </div>
      </div>
    ),
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl p-6 bg-gray-light/30 h-full">
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
        ref={calendarRef}
        className="rounded-3xl bg-white h-full flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        {/* Header */}
        {/* <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-black text-gray-600">
              Today's Schedule
            </h3>
            <p className="text-sm text-gray-500">
              {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="w-3 h-3 bg-red rounded-full animate-pulse" />
        </div> */}

        {/* Calendar */}
        <div className="flex-1" style={{ height: `${calendarHeight}px` }}>
          <Calendar
            localizer={localizer}
            events={bigCalendarEvents}
            startAccessor="start"
            endAccessor="end"
            defaultView={Views.DAY}
            date={date}
            onNavigate={() => {}} // Add empty onNavigate to fix console warning
            onView={() => {}} // Add empty onView to fix console warning
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            components={components}
            step={15}
            timeslots={4}
            showMultiDayTimes
            popup
            popupOffset={{ x: 10, y: 10 }}
            style={{ height: '100%' }}
            className="dashboard-calendar"
            messages={{
              today: 'Today',
              previous: 'Back',
              next: 'Next',
              month: 'Month',
              week: 'Week',
              day: 'Day',
              agenda: 'Agenda',
              date: 'Date',
              time: 'Time',
              event: 'Event',
              noEventsInRange: 'No events today',
              showMore: (total: number) => `+${total} more`,
            }}
          />
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
