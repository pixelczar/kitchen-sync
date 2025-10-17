import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarEventModal } from '../../components/CalendarEventModal';
import { useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent } from '../../hooks/useCalendarEvents';
import { useUsers } from '../../hooks/useUsers';
import { CalendarEventSkeleton } from '../../components/Skeleton';
import { NoEventsEmpty } from '../../components/EmptyState';
import type { CalendarEvent } from '../../types';

type CalendarView = 'week' | 'month' | 'day';

export const Calendar = () => {
  const { data: events, isLoading: eventsLoading, error: eventsError } = useCalendarEvents();
  const { data: users, isLoading: usersLoading, error: usersError } = useUsers();
  const { mutate: createEvent } = useCreateCalendarEvent();
  const { mutate: updateEvent } = useUpdateCalendarEvent();
  const { mutate: deleteEvent } = useDeleteCalendarEvent();
  
  const [view, setView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  
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
  
  // Helper: Get 5 days starting from current date
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Helper: Get events for a specific date
  const getEventsForDate = (date: Date) => {
    if (!events) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.startTime.startsWith(dateStr));
  };

  // Helper: Get user by ID
  const getUserById = (userId: string) => {
    return users?.find(u => u.id === userId);
  };

  // Helper: Format time from ISO string
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Helper: Calculate event position in time grid
  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
    
    return {
      top: ((startHour - 8) * 80) + (startMinute / 60 * 80), // 8am start, 80px per hour
      height: duration * 80,
      startHour,
      duration
    };
  };
  
  // Month view helpers (existing code)
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().getDate();
  const isCurrentMonth = new Date().getMonth() === month && new Date().getFullYear() === year;
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  const hasEvents = (day: number) => {
    if (!events) return false;
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return events.some(event => event.startTime.startsWith(dateStr));
  };
  
  const getDayEvents = (day: number) => {
    if (!events) return [];
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return events.filter(event => event.startTime.startsWith(dateStr));
  };
  
  
  const handleSaveEvent = (eventData: Partial<CalendarEvent>) => {
    if (editingEvent) {
      updateEvent({ eventId: editingEvent.id, updates: eventData });
    } else {
      createEvent(eventData);
    }
    setEditingEvent(undefined);
    setSelectedDate(undefined);
  };

  // Handle errors
  if (eventsError || usersError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-xl font-semibold text-error">
          Error loading data: {eventsError?.message || usersError?.message}
        </div>
      </div>
    );
  }
  
  // Loading state with skeletons
  if (eventsLoading || usersLoading) {
    return (
      <main className="px-6 pb-40 overflow-y-auto h-full">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-12 w-64 bg-gray-light/50 rounded animate-pulse mb-4" />
          <div className="flex gap-3 mb-6">
            <div className="h-10 w-24 bg-gray-light/50 rounded animate-pulse" />
            <div className="h-10 w-24 bg-gray-light/50 rounded animate-pulse" />
            <div className="h-10 w-24 bg-gray-light/50 rounded animate-pulse" />
          </div>
        </div>

        {/* Calendar Grid Skeleton */}
        <div className="grid grid-cols-7 gap-4 mb-6">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-light/30 rounded-2xl animate-pulse" />
          ))}
        </div>

        {/* Today's Events Skeleton */}
        <div className="rounded-3xl p-6 bg-gray-light/30">
          <div className="h-8 w-48 bg-gray-light/50 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            <CalendarEventSkeleton />
            <CalendarEventSkeleton />
          </div>
        </div>
      </main>
    );
  }
  
  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
    setEditingEvent(undefined);
    setIsModalOpen(true);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const clickedDate = new Date(date);
    clickedDate.setHours(hour, 0, 0, 0);
    setSelectedDate(clickedDate);
    setEditingEvent(undefined);
    setIsModalOpen(true);
  };

  const weekDays = getWeekDays();
  const timeSlots = Array.from({ length: 16 }, (_, i) => i + 8); // 8am to 11pm
  
  return (
    <main className="px-6 pb-40 overflow-y-auto h-full">
      {/* Header with View Toggle */}
      <div className="mb-6 flex justify-between items-center relative">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-5xl font-extrabold tracking-tight text-charcoal mb-2">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            {/* image.png */}
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          {/* Navigation */}
          <div className="flex gap-2">
              <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (view === 'week') newDate.setDate(currentDate.getDate() - 5);
                  else if (view === 'month') newDate.setMonth(currentDate.getMonth() - 1);
                  else newDate.setDate(currentDate.getDate() - 1);
                  setCurrentDate(newDate);
                }}
                className="px-6 py-3 rounded-xl bg-gray-light hover:bg-gray-medium flex items-center justify-center font-bold transition-all"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-6 py-3 rounded-xl bg-purple hover:bg-purple/80 font-bold text-cream transition-all"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (view === 'week') newDate.setDate(currentDate.getDate() + 5);
                  else if (view === 'month') newDate.setMonth(currentDate.getMonth() + 1);
                  else newDate.setDate(currentDate.getDate() + 1);
                  setCurrentDate(newDate);
                }}
                className="px-6 py-3 rounded-xl bg-gray-light hover:bg-gray-medium flex items-center justify-center font-bold transition-all"
              >
                →
              </button>
            </div>
            
          {/* View Toggle */}
          <div className="flex gap-2">
            {(['week', 'month', 'day'] as CalendarView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-6 py-3 rounded-xl font-bold capitalize transition-all  ${
                  view === v 
                    ? 'bg-purple text-cream' 
                    : 'bg-gray-light text-charcoal hover:bg-gray-medium transition-all'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Week View (5 Days) */}
      {view === 'week' && users && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Week Grid */}
          <div className="flex overflow-x-auto">
            {/* Time Labels Column */}
            <div className="flex-shrink-0 w-12 md:w-16 bg-gray-light/30">
              <div className="h-12 md:h-16 border-b border-gray-light" /> {/* Spacer for day headers */}
              {timeSlots.map(hour => (
                <div key={hour} className="h-16 md:h-20 flex items-start justify-center pt-1 border-b border-gray-light/50">
                  <span className="text-xs font-semibold text-gray-medium">
                    {hour === 0 ? '12A' : hour === 12 ? '12P' : hour > 12 ? `${hour - 12}P` : `${hour}A`}
                  </span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((date, dayIndex) => {
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div key={dayIndex} className="flex-1 min-w-[140px] md:min-w-[180px] border-l border-gray-light/50">
                  {/* Day Header */}
                  <div className={`h-12 md:h-16 flex flex-col items-center justify-center border-b border-gray-light/50 ${isToday ? 'bg-yellow/30' : 'bg-gray-light/20'}`}>
                    <div className={`text-xs font-bold ${isToday ? 'text-charcoal' : 'text-gray-medium'}`}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg md:text-xl font-black ${isToday ? 'text-charcoal bg-yellow rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center' : 'text-charcoal'}`}>
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Time Grid */}
                  <div className="relative">
                    {timeSlots.map((hour, hourIndex) => (
                      <div
                        key={hourIndex}
                        onClick={() => handleTimeSlotClick(date, hour)}
                        className="h-16 md:h-20 border-b border-gray-light/30 hover:bg-blue/5 cursor-pointer transition-colors group"
                      >
                        <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-1 h-1 bg-blue rounded-full" />
                        </div>
                      </div>
                    ))}

                    {/* Events Overlay */}
                    {dayEvents.map((event) => {
                      const pos = getEventPosition(event);
                      const user = getUserById(event.assignedTo);
                      
                      return (
                        <motion.div
                          key={event.id}
                          onClick={() => {
                            setEditingEvent(event);
                            setIsModalOpen(true);
                          }}
                          className="absolute left-1 right-1 rounded-lg p-1 md:p-2 cursor-pointer overflow-hidden shadow-sm"
                          style={{
                            top: `${pos.top}px`,
                            height: `${Math.max(pos.height, 40)}px`,
                            backgroundColor: user?.color || '#0A95FF',
                            opacity: 0.95
                          }}
                          whileHover={{ scale: 1.02, opacity: 1, y: -2 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="flex items-start gap-1 md:gap-2">
                            <div
                              className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {event.title}
                              </div>
                              <div className="text-xs text-white/80 hidden md:block">
                                {formatTime(event.startTime)} - {formatTime(event.endTime)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div className="bg-white rounded-2xl shadow-lg p-3 md:p-6">
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-bold text-gray-medium text-xs md:text-sm py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {days.map((day, index) => (
              <div
                key={index}
                onClick={() => day && handleDayClick(day)}
                className={`
                  aspect-square rounded-lg md:rounded-xl p-2 md:p-3 flex flex-col items-center justify-start
                  transition-all duration-200
                  ${day ? 'hover:bg-gray-light cursor-pointer hover:scale-105 hover:shadow-md' : ''}
                  ${day === today && isCurrentMonth ? 'bg-yellow font-black shadow-lg' : ''}
                `}
              >
                {day && (
                  <>
                    <div className={`text-sm md:text-lg font-semibold mb-1 md:mb-2 ${day === today && isCurrentMonth ? 'text-charcoal' : 'text-charcoal'}`}>
                      {day}
                    </div>
                    {hasEvents(day) && (
                      <div className="flex flex-col gap-1 w-full">
                        {getDayEvents(day).slice(0, window.innerWidth < 768 ? 1 : 2).map((event) => {
                          const user = getUserById(event.assignedTo);
                          return (
                            <div
                              key={event.id}
                              className="w-full rounded-md px-1 md:px-2 py-0.5 md:py-1 text-xs font-medium truncate"
                              style={{ 
                                backgroundColor: user?.color || '#0A95FF',
                                color: user?.textColor || '#fff'
                              }}
                            >
                              {event.title}
                            </div>
                          );
                        })}
                        {getDayEvents(day).length > (window.innerWidth < 768 ? 1 : 2) && (
                          <div className="text-xs text-gray-medium font-semibold text-center">
                            +{getDayEvents(day).length - (window.innerWidth < 768 ? 1 : 2)} more
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-light/50">
            <h3 className="text-3xl font-black text-charcoal">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
          </div>
          
          <div className="p-6">
            {getEventsForDate(currentDate).length > 0 ? (
              <div className="space-y-4">
                {getEventsForDate(currentDate)
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map(event => {
                    const user = getUserById(event.assignedTo);
                    const startTime = new Date(event.startTime);
                    const endTime = new Date(event.endTime);
                    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours
                    
                    return (
                      <motion.div
                        key={event.id}
                        className="rounded-xl p-4 flex items-center justify-between shadow-sm"
                        style={{ backgroundColor: user?.color || '#0A95FF', opacity: 0.95 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center">
                            <div className="text-sm font-bold text-white">
                              {formatTime(event.startTime)}
                            </div>
                            <div className="text-xs text-white/80">
                              {duration > 1 ? `${duration.toFixed(1)}h` : `${Math.round(duration * 60)}m`}
                            </div>
                          </div>
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                          >
                            {user?.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg">{event.title}</div>
                            <div className="text-sm text-white/90">
                              {formatTime(event.startTime)} - {formatTime(event.endTime)}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingEvent(event);
                              setIsModalOpen(true);
                            }}
                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="bg-red/80 hover:bg-red text-white px-4 py-2 rounded-lg font-semibold transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            ) : (
              <NoEventsEmpty
                onAddEvent={() => {
                  setSelectedDate(new Date());
                  setEditingEvent(undefined);
                  setIsModalOpen(true);
                }}
              />
            )}
          </div>
        </div>
      )}
        
        {/* Calendar Event Modal */}
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
    </main>
  );
};

