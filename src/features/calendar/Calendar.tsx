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
  const { data: events, isLoading: eventsLoading } = useCalendarEvents();
  const { data: users, isLoading: usersLoading } = useUsers();
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
  
  const getUserColor = (userId: string) => {
    return users?.find(u => u.id === userId)?.color || '#0A95FF';
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
        <div className="bg-cream">
          {/* Family Progress Bar */}
          {/* <div className="mb-6 flex gap-4 justify-center">
            {users.map(user => {
              const stats = getUserTaskStats(user.id);
              return (
                <div key={user.id} className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black"
                    style={{ backgroundColor: user.color, color: user.textColor }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-charcoal">
                    {user.name}
                  </span>
                  <div className="relative">
                    <div className="w-24 h-2 bg-gray-light rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: user.color,
                          width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-medium ml-2">{stats.completed}/{stats.total}</span>
                  </div>
                </div>
              );
            })}
          </div> */}

          {/* Week Grid */}
          <div className="flex gap-0 overflow-x-auto">
            {/* Time Labels Column */}
            <div className="flex-shrink-0 w-20 pr-2">
              <div className="h-16" /> {/* Spacer for day headers */}
              {timeSlots.map(hour => (
                <div key={hour} className="h-20 flex items-start justify-end pr-2">
                  <span className="text-sm font-semibold text-gray-medium">
                    {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((date, dayIndex) => {
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div key={dayIndex} className="flex-1 min-w-[200px] border-l border-gray-light">
                  {/* Day Header */}
                  <div className={`h-16 flex flex-col items-center justify-center border-b border-gray-light ${isToday ? 'bg-yellow/20' : ''}`}>
                    <div className={`text-sm font-bold ${isToday ? 'text-charcoal' : 'text-gray-medium'}`}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-2xl font-black ${isToday ? 'text-charcoal bg-yellow rounded-full w-10 h-10 flex items-center justify-center' : 'text-charcoal'}`}>
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Time Grid */}
                  <div className="relative">
                    {timeSlots.map((hour, hourIndex) => (
                      <div
                        key={hourIndex}
                        onClick={() => handleTimeSlotClick(date, hour)}
                        className="h-20 border-b border-gray-light/50 hover:bg-blue/5 cursor-pointer transition-colors"
                      />
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
                          className="absolute left-1 right-1 rounded-lg p-2 cursor-pointer overflow-hidden"
                          style={{
                            top: `${pos.top}px`,
                            height: `${Math.max(pos.height, 60)}px`,
                            backgroundColor: user?.color || '#0A95FF',
                            opacity: 0.9
                          }}
                          whileHover={{ scale: 1.02, opacity: 1 }}
                        >
                          <div className="flex items-start gap-1">
                            <div
                              className="w-5 h-5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: user?.color || '#0A95FF' }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-cream truncate">
                                {event.title}
                              </div>
                              <div className="text-xs text-cream/90">
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
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-bold text-gray-medium text-sm">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => (
              <div
                key={index}
                onClick={() => day && handleDayClick(day)}
                className={`
                  aspect-square rounded-lg p-2 flex flex-col items-center justify-center
                  transition-all
                  ${day ? 'hover:bg-gray-light cursor-pointer hover:scale-105' : ''}
                  ${day === today && isCurrentMonth ? 'bg-yellow font-black' : ''}
                `}
              >
                {day && (
                  <>
                    <div className="text-lg font-semibold text-charcoal mb-1">{day}</div>
                    {hasEvents(day) && (
                      <div className="flex gap-1 flex-wrap justify-center">
                        {getDayEvents(day).slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getUserColor(event.assignedTo) }}
                          />
                        ))}
                        {getDayEvents(day).length > 3 && (
                          <div className="text-xs text-gray-medium">
                            +{getDayEvents(day).length - 3}
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
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-3xl font-black text-charcoal mb-6">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          
          <div className="space-y-3">
            {getEventsForDate(currentDate).map(event => {
              const user = getUserById(event.assignedTo);
              return (
                <div
                  key={event.id}
                  className="rounded-xl p-4 flex items-center justify-between"
                  style={{ backgroundColor: user?.color || '#0A95FF', opacity: 0.9 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                      style={{ backgroundColor: user?.color || '#0A95FF', color: user?.textColor || '#fff' }}
                    >
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-cream">{event.title}</div>
                      <div className="text-sm text-cream/90">
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
                      className="bg-white/20 hover:bg-white/30 text-cream px-3 py-1 rounded-lg font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="bg-red/80 hover:bg-red text-cream px-3 py-1 rounded-lg font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
            {getEventsForDate(currentDate).length === 0 && (
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

