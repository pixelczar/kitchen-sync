import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import { CalendarEventModal } from '../../components/CalendarEventModal';
import { EventDetailsModal } from '../../components/EventDetailsModal';
import { useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent } from '../../hooks/useCalendarEvents';
import { 
  toBigCalendarEvents, 
  getEventColor
} from '../../lib/calendar-event-adapter';
import type { CalendarEvent } from '../../types';
import type { BigCalendarEvent } from '../../lib/calendar-event-adapter';

// Import react-big-calendar styles
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup moment localizer
const localizer = momentLocalizer(moment);

// Custom 4-Day Family Calendar Component
interface CustomWeekViewProps {
  events: BigCalendarEvent[];
  onSelectEvent: (event: BigCalendarEvent) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date; slots: Date[] }) => void;
  onNavigate: (date: Date) => void;
  currentDate: Date;
}

const CustomWeekView = ({ events, onSelectEvent, onSelectSlot, currentDate }: CustomWeekViewProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const timeGridRef = useRef<HTMLDivElement>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate current time position based on actual current time
  const getCurrentTimePosition = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Calculate position based on time slots (6 AM to 11 PM = 18 hours)
    const totalMinutes = hour * 60 + minute;
    const startMinutes = 6 * 60; // 6 AM in minutes
    const adjustedMinutes = totalMinutes - startMinutes;
    
    // Each hour slot is 64px high, so calculate position
    const positionInPixels = (adjustedMinutes / 60) * 64;
    
    // Ensure position is within visible range (6 AM to 11 PM)
    return Math.max(0, Math.min(positionInPixels, 18 * 64));
  }, []);
  

  // Update current time every 30 minutes and auto-scroll to center current time
  useEffect(() => {
    const updateTimeAndScroll = () => {
      const now = new Date();
      setCurrentTime(now);
      
      // Auto-scroll to center current time in the view with smooth transition
      if (timeGridRef.current) {
        const currentTimePosition = getCurrentTimePosition();
        const containerHeight = timeGridRef.current.clientHeight;
        // Position current time at 25% down the view instead of center
        const scrollPosition = Math.max(0, currentTimePosition - (containerHeight * 0.25));
        
        timeGridRef.current.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    };
    
    // Initial scroll
    updateTimeAndScroll();
    
    // Update every 30 minutes (1800000 ms)
    const interval = setInterval(updateTimeAndScroll, 1800000);
    return () => clearInterval(interval);
  }, [getCurrentTimePosition]);

  // Get 4 days starting from currentDate
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 4; i++) {
      const day = new Date(currentDate);
      day.setDate(currentDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  
  // Time slots from 6 AM to 11 PM (extended for family activities)
  const timeSlots = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM
  
  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    const dayStr = day.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = event.start.toISOString().split('T')[0];
      return eventDate === dayStr;
    });
  };


  // Get all-day events for a specific day
  const getAllDayEventsForDay = (day: Date) => {
    const dayEvents = getEventsForDay(day);
    const allDayEvents = dayEvents.filter(event => event.allDay);
    
    // Remove duplicates based on event ID and title
    const seen = new Set();
    const uniqueEvents = allDayEvents.filter(event => {
      const key = `${event.id}-${event.title}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    
    return uniqueEvents;
  };

  // Get calendar color for events
  const getEventColor = (event: BigCalendarEvent) => {
    if (event.resource?.source === 'google' && event.resource?.externalId) {
      // Use brand-consistent colors for Google Calendar events
      const colors = [
        '#8B5CF6', // Purple variants
        '#A855F7', 
        '#C084FC',
        '#DDD6FE',
        '#0A95FF', // Blue variants (brand blue)
        '#3B82F6',
        '#60A5FA',
        '#93C5FD',
        '#10B981', // Green variants
        '#34D399',
        '#6EE7B7',
        '#A7F3D0',
        '#F59E0B', // Orange variants
        '#FBBF24',
        '#FCD34D',
        '#FEF3C7',
        '#EF4444', // Red variants
        '#F87171',
        '#FCA5A5',
        '#FECACA'
      ];
      const hash = event.resource.externalId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return colors[Math.abs(hash) % colors.length];
    }
    return event.resource?.color || '#0A95FF';
  };

  // Darken a hex color by a percentage
  const darkenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  // Get timed events for a specific day
  const getTimedEventsForDay = (day: Date) => {
    return getEventsForDay(day).filter(event => !event.allDay);
  };

  // Detect overlapping events and calculate their positions
  const getOverlappingEvents = (events: BigCalendarEvent[]) => {
    if (events.length === 0) return [];
    
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    
    const eventGroups: BigCalendarEvent[][] = [];
    let currentGroup: BigCalendarEvent[] = [sortedEvents[0]];
    
    for (let i = 1; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i];
      const lastEventInGroup = currentGroup[currentGroup.length - 1];
      
      // Check if current event overlaps with any event in current group
      const currentStart = new Date(currentEvent.start).getTime();
      const lastEnd = new Date(lastEventInGroup.end).getTime();
      
      if (currentStart < lastEnd) {
        // Events overlap, add to current group
        currentGroup.push(currentEvent);
      } else {
        // No overlap, start new group
        eventGroups.push([...currentGroup]);
        currentGroup = [currentEvent];
      }
    }
    
    // Add the last group
    eventGroups.push(currentGroup);
    
    return eventGroups;
  };

  // Check if current time is within visible range
  const isCurrentTimeVisible = () => {
    const now = currentTime;
    const hour = now.getHours();
    return hour >= 6 && hour <= 22; // Within our 6am-10pm range
  };

  // Check if it's today
  const isToday = (day: Date) => {
    const today = new Date();
    return day.toDateString() === today.toDateString();
  };


  return (
    <div 
      ref={calendarContainerRef}
      className="flex flex-col custom-week-view w-full max-w-full h-full"
    >
      {/* Day Headers */}
      <div className="flex border-b-2 border-gray-200">
        <div className="w-16 border-r border-gray-200 bg-gray-50 flex-shrink-0"></div>
        {weekDays.map((day, index) => (
          <div 
            key={index}
            className={`flex-1 px-4 py-2 text-center border-r border-gray-200 min-w-0 ${
              isToday(day) ? 'bg-yellow-100' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-charcoal tracking-tight">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-2xl font-regular tracking-tighter ${isToday(day) ? 'text-gray-900' : 'text-gray-700'}`}>
                {day.getDate()}
              </div>
            </div>
            
            {/* All-Day Events */}
            <div className="mt-1 flex flex-wrap gap-2">
              {getAllDayEventsForDay(day).map((event) => (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  className="rounded px-1.5 py-0.5 cursor-pointer shadow-sm font-medium tracking-tight bg-opacity-10"
                  style={{ 
                    backgroundColor: `${getEventColor(event)}1A`, // 10% alpha
                    color: darkenColor(getEventColor(event), 30), // Darken text by 30%
                    fontSize: '1.2vw',
                    flex: '0 0 auto',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}
                >
                  {event.title}
                </div>
              ))}
              {getAllDayEventsForDay(day).length === 0 && (
                <div className="text-xs text-gray-400 italic">No all-day events</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div ref={timeGridRef} className="flex flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {/* Time Labels - Ensure proper scrolling with content */}
        <div 
          className="w-16 bg-gray-50 border-r border-gray-200 flex-shrink-0 min-w-16 relative"
          style={{ height: `${timeSlots.length * 64}px` }}
        >
          {timeSlots.map(hour => (
            <div 
              key={hour} 
              className="h-16 border-b border-gray-200 flex items-center justify-center bg-gray-50 relative z-10"
              style={{ height: '64px' }}
            >
              <span className="text-xs font-semibold text-gray-600">
                {hour === 0 ? '12A' : hour === 12 ? '12P' : hour > 12 ? `${hour - 12}P` : `${hour}A`}
              </span>
            </div>
          ))}
        </div>

        {/* Day Columns */}
        {weekDays.map((day, dayIndex) => {
          const timedEvents = getTimedEventsForDay(day);
          const isTodayColumn = isToday(day);
          
          return (
            <div key={dayIndex} className="flex-1 relative min-w-0 p-1">
              {/* Time Slots Container */}
              <div className="relative" style={{ height: `${timeSlots.length * 64}px` }}>
                {/* Horizontal Grid Lines - Separate layer to ensure visibility */}
                {timeSlots.map((_, hourIndex) => (
                  <div
                    key={`h-grid-${hourIndex}`}
                    className="absolute left-0 right-0 border-b border-gray-300"
                    style={{
                      top: `${(hourIndex + 1) * 64 - 1}px`,
                      height: '1px',
                      zIndex: 2
                    }}
                  />
                ))}
                
                {/* Vertical Grid Line - Right border for each column */}
                <div
                  className="absolute top-0 bottom-0 border-r border-gray-300"
                  style={{
                    right: '0px',
                    width: '1px',
                    zIndex: 2
                  }}
                />
                
                {/* Time Slot Click Areas */}
                {timeSlots.map((hour, hourIndex) => (
                  <div
                    key={hourIndex}
                    onClick={() => {
                      const slotDate = new Date(day);
                      slotDate.setHours(hour, 0, 0, 0);
                      onSelectSlot({ 
                        start: slotDate, 
                        end: new Date(slotDate.getTime() + 60 * 60 * 1000),
                        slots: [slotDate]
                      });
                    }}
                    className={`absolute left-0 right-0 hover:bg-blue-50 cursor-pointer ${
                      isTodayColumn ? 'bg-yellow-50' : ''
                    }`}
                    style={{
                      top: `${hourIndex * 64}px`,
                      height: '64px',
                      zIndex: 1
                    }}
                  />
                ))}

              {/* Timed Events with Smart Overlapping */}
              {getOverlappingEvents(timedEvents).map((eventGroup) => {
                return eventGroup.map((event, eventIndex) => {
                  const start = new Date(event.start);
                  const end = new Date(event.end);
                  const startHour = start.getHours();
                  const startMinute = start.getMinutes();
                  const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
                  
                  const top = ((startHour - 6) * 64) + (startMinute / 60 * 64) + 4; // Add 4px for container padding
                  const height = Math.max(duration * 64, 40) - 8; // Subtract 8px for top/bottom padding
                  
                  // Calculate width and left position for overlapping events
                  const eventWidth = eventIndex === 0 ? 'calc(100% - 8px)' : `calc(100% - ${(eventIndex + 1) * 20}px)`;
                  const leftOffset = '0%';
                  
                  // Add indentation for overlapping events (like Google Calendar)
                  const indentAmount = eventIndex * 20;
                  
                  return (
                    <div
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className="absolute rounded-lg px-2 py-1 cursor-pointer shadow-sm tracking-tight"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `${leftOffset}`,
                        width: eventWidth,
                        marginLeft: `${indentAmount}px`,
                        backgroundColor: getEventColor(event),
                        color: 'white',
                        fontWeight: '600',
                        zIndex: 10 + eventIndex, // Rightmost events on top
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      <div className="truncate" style={{ fontSize: '1.4vw', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{event.title}</div>
                      <div className="opacity-90" style={{ fontSize: '1.1vw', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>
                        {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                  );
                });
              })}

                {/* Current Time Line */}
                {isCurrentTimeVisible() && isTodayColumn && (
                  <div
                    className="absolute left-0 right-0 h-1 margin-top-px bg-red z-20 shadow-lg rounded-full"
                    style={{ top: `${getCurrentTimePosition()}px` }}
                  >
                    <div className="absolute -left-2 -top-1 w-3 h-3 bg-red rounded-full shadow-md" />
                  </div>
                )}

                {/* Past Time Overlay - White div above current time line */}
                {isCurrentTimeVisible() && isTodayColumn && (
                  <div
                    className="absolute left-0 right-0 bg-white bg-opacity-70 pointer-events-none z-10"
                    style={{ 
                      top: '0px',
                      height: `${getCurrentTimePosition()}px`
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CalendarView = () => {
  const { data: calendarEvents, isLoading: eventsLoading } = useCalendarEvents();
  const { mutate: createEvent } = useCreateCalendarEvent();
  const { mutate: updateEvent } = useUpdateCalendarEvent();
  
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  
  const [events, setEvents] = useState<BigCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);


  // Convert events to big calendar format when they change
  useEffect(() => {
    if (calendarEvents && calendarEvents.length > 0) {
      console.log('Converting calendar events to big calendar format:', calendarEvents.length);
      const bigCalendarEvents = toBigCalendarEvents(calendarEvents);
      console.log('Converted to big calendar events:', bigCalendarEvents.length);
      setEvents(bigCalendarEvents);
    } else {
      setEvents([]);
    }
  }, [calendarEvents]);

  // Update loading state based on events loading
  useEffect(() => {
    setIsLoading(eventsLoading);
  }, [eventsLoading]);

  // Listen for custom events from navigation plus button
  useEffect(() => {
    const handleOpenModal = () => {
      console.log('Calendar: Opening modal from navigation plus button');
      setSelectedDate(new Date());
      setEditingEvent(undefined);
      setIsModalOpen(true);
    };
    
    window.addEventListener('openCalendarModal', handleOpenModal);
    return () => window.removeEventListener('openCalendarModal', handleOpenModal);
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: BigCalendarEvent) => {
    // Find the original CalendarEvent
    const originalEvent = events.find(e => e.id === event.id);
    if (originalEvent) {
      const calendarEvent: CalendarEvent = {
        id: originalEvent.id,
        title: originalEvent.title,
        startTime: originalEvent.start.toISOString(),
        endTime: originalEvent.end.toISOString(),
        assignedTo: originalEvent.resource?.assignedTo || '',
        color: originalEvent.resource?.color || '#0A95FF',
        source: originalEvent.resource?.source || 'manual',
        externalId: originalEvent.resource?.externalId,
        description: originalEvent.resource?.description,
        location: originalEvent.resource?.location,
        householdId: import.meta.env.VITE_HOUSEHOLD_ID || 'demo-family-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setSelectedEvent(calendarEvent);
      setIsDetailsModalOpen(true);
    }
  }, [events]);

  // Handle slot selection (create new event)
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date; slots: Date[] }) => {
    setSelectedDate(slotInfo.start);
    setEditingEvent(undefined);
    setIsModalOpen(true);
  }, []);

  // Handle event save
  const handleSaveEvent = useCallback(async (eventData: Partial<CalendarEvent>) => {
    try {
      if (editingEvent) {
        updateEvent({ eventId: editingEvent.id, updates: eventData });
      } else {
        createEvent(eventData);
      }
      
      setEditingEvent(undefined);
      setSelectedDate(undefined);
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  }, [editingEvent, updateEvent, createEvent]);

  // Handle event delete (for future use)
  // const handleDeleteEvent = useCallback(async (eventId: string) => {
  //   try {
  //     await deleteEvent(eventId);
  //     await loadEvents();
  //   } catch (error) {
  //     console.error('Failed to delete event:', error);
  //   }
  // }, [deleteEvent, loadEvents]);


  // Event style getter
  const eventStyleGetter = useCallback((event: BigCalendarEvent) => {
    let backgroundColor = getEventColor(event);
    
    // Use consistent color coding for all events
    if (event.resource?.source === 'google' && event.resource?.externalId) {
      const colors = [
        '#8B5CF6', // Purple variants
        '#A855F7', 
        '#C084FC',
        '#DDD6FE',
        '#0A95FF', // Blue variants (brand blue)
        '#3B82F6',
        '#60A5FA',
        '#93C5FD',
        '#10B981', // Green variants
        '#34D399',
        '#6EE7B7',
        '#A7F3D0',
        '#F59E0B', // Orange variants
        '#FBBF24',
        '#FCD34D',
        '#FEF3C7',
        '#EF4444', // Red variants
        '#F87171',
        '#FCA5A5',
        '#FECACA'
      ];
      const hash = event.resource.externalId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      backgroundColor = colors[Math.abs(hash) % colors.length];
    }

    return {
      style: {
        backgroundColor,
        color: '#fff',
        borderRadius: '8px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '600',
        padding: '4px 8px',
      },
    };
  }, []);

  // Custom components
  const components = useMemo(() => ({
    event: ({ event }: { event: BigCalendarEvent }) => (
      <div className="truncate">
        {event.title}
      </div>
    ),
    timeGutterHeader: () => (
      <div className="rbc-time-gutter-header">
        <div className="rbc-current-time-indicator" />
      </div>
    ),
  }), []);


  // Loading state
  if (isLoading) {
    return (
      <main className="px-6 pb-6 overflow-y-auto h-full">
        <div className="flex items-center justify-center py-20">
          <div className="text-xl font-semibold text-gray-medium">
            Loading calendar...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h2 className="text-4xl font-light tracking-tighter text-charcoal">
            {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          
        </div>
        
        {/* View Controls */}
        <div className="flex items-center gap-6">
          {/* Navigation Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newDate = new Date(date);
                if (view === 'week') {
                  newDate.setDate(date.getDate() - 4);
                } else if (view === 'month') {
                  newDate.setMonth(date.getMonth() - 1);
                } else if (view === 'day') {
                  newDate.setDate(date.getDate() - 1);
                }
                setDate(newDate);
              }}
              className="px-4 py-2 rounded-lg bg-gray-light hover:bg-gray-medium font-semibold text-charcoal transition-all"
            >
              ←
            </button>
            <button
              onClick={() => setDate(new Date())}
              className="px-4 py-2 rounded-lg bg-purple hover:bg-purple/80 font-semibold text-cream transition-all"
            >
              Today
            </button>
            <button
              onClick={() => {
                const newDate = new Date(date);
                if (view === 'week') {
                  newDate.setDate(date.getDate() + 4);
                } else if (view === 'month') {
                  newDate.setMonth(date.getMonth() + 1);
                } else if (view === 'day') {
                  newDate.setDate(date.getDate() + 1);
                }
                setDate(newDate);
              }}
              className="px-4 py-2 rounded-lg bg-gray-light hover:bg-gray-medium font-semibold text-charcoal transition-all"
            >
              →
            </button>
          </div>
          
          {/* View Type Buttons */}
          <div className="flex gap-2">
            {(['week', 'month', 'day'] as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg font-semibold capitalize transition-all ${
                  view === v 
                    ? 'bg-purple text-cream' 
                    : 'bg-gray-light text-charcoal hover:bg-gray-medium'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom 4-Day Family Calendar */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex-1">
        {view === 'week' ? (
          <CustomWeekView 
            events={events}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            onNavigate={setDate}
            currentDate={date}
          />
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '800px' }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            components={components}
            views={[Views.MONTH, Views.DAY]}
            step={30}
            timeslots={2}
            showMultiDayTimes
            popup
            popupOffset={{ x: 10, y: 10 }}
            doShowMoreDrillDown
            drilldownView={Views.DAY}
            getDrilldownView={(_, currentViewName) => {
              if (currentViewName === Views.MONTH) return Views.DAY;
              return null;
            }}
            culture="en-US"
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
              noEventsInRange: 'No events in this range.',
              showMore: (total: number) => `+${total} more`,
            }}
          />
        )}
      </div>

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
    </main>
  );
};
