import { useState, useEffect, useCallback } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { isGoogleCalendarConfigured, authorizeGoogleCalendar, fetchGoogleCalendars } from '../../lib/google-calendar';
import { authorizeGooglePhotos, createPickerSession, checkPickerSession, getPickerMediaItems, PickerMediaItem } from '../../lib/google-photos';
import { useGoogleCalendarSync } from '../../hooks/useGoogleCalendarSync';
import { UserModal } from '../../components/UserModal';
import { User } from '../../types';

export const SettingsView = () => {
  const { data: users } = useUsers();
  const { mutate: createUser } = useCreateUser();
  const { mutate: updateUser } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();
  const { syncGoogleCalendar, isSyncing, lastSyncTime } = useGoogleCalendarSync();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [photosConnected, setPhotosConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Google Calendar selection
  const [availableCalendars, setAvailableCalendars] = useState<Array<{
    id: string;
    summary: string;
    description?: string;
    primary?: boolean;
    backgroundColor?: string;
  }>>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>(['primary']);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  
  // Timezone settings
  const [userTimezone, setUserTimezone] = useState<string>(() => {
    return localStorage.getItem('userTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  });
  
  // Screensaver configuration
  const [screensaverPhotos, setScreensaverPhotos] = useState<PickerMediaItem[]>([]);
  const [isSelectingPhotos, setIsSelectingPhotos] = useState(false);
  const [showFamilyTodos, setShowFamilyTodos] = useState(() => {
    const saved = localStorage.getItem('showFamilyTodos');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [screensaverTimeout, setScreensaverTimeout] = useState(5); // minutes
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  
  // Check for existing tokens on component mount
  useEffect(() => {
    const checkConnectionStatus = () => {
      const photosToken = localStorage.getItem('googlePhotosToken');
      const calendarToken = localStorage.getItem('googleCalendarToken');
      
      setPhotosConnected(!!photosToken);
      setGoogleConnected(!!calendarToken);
    };

    // Initial check
    checkConnectionStatus();
    
    // Load saved calendar selections
    const savedCalendarIds = localStorage.getItem('selectedGoogleCalendarIds');
    if (savedCalendarIds) {
      try {
        setSelectedCalendarIds(JSON.parse(savedCalendarIds));
      } catch (error) {
        console.error('Error loading saved calendar selections:', error);
      }
    }
    
    // Listen for storage changes (when OAuth completes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'googlePhotosToken' || e.key === 'googleCalendarToken') {
        checkConnectionStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkConnectionStatus, 1000);
    
    // Load saved screensaver photos
    const savedPhotos = localStorage.getItem('screensaverPhotos');
    if (savedPhotos) {
      try {
        setScreensaverPhotos(JSON.parse(savedPhotos));
      } catch (error) {
        console.error('Error loading saved screensaver photos:', error);
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleConnectGoogleCalendar = async () => {
    if (!isGoogleCalendarConfigured()) {
      alert('Google Calendar API is not configured. See src/lib/google-calendar.ts for setup instructions.');
      return;
    }
    
    setIsConnecting(true);
    try {
      await authorizeGoogleCalendar();
      // The OAuth flow will redirect, so this won't complete
      console.log('Redirecting to Google Calendar OAuth...');
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect to Google Calendar');
      setIsConnecting(false);
    }
  };

  const handleDisconnectGoogleCalendar = () => {
    // Clear the token from localStorage
    localStorage.removeItem('googleCalendarToken');
    setGoogleConnected(false);
    console.log('Disconnected from Google Calendar');

    // Show success message
    alert('Disconnected from Google Calendar. Please refresh the page to see changes.');
  };

  // Manual check for connection status (useful for debugging)
  const checkConnectionStatus = () => {
    const photosToken = localStorage.getItem('googlePhotosToken');
    const calendarToken = localStorage.getItem('googleCalendarToken');
    
    console.log('Checking connection status:');
    console.log('Photos token:', photosToken ? 'Present' : 'Missing');
    console.log('Calendar token:', calendarToken ? 'Present' : 'Missing');
    
    setPhotosConnected(!!photosToken);
    setGoogleConnected(!!calendarToken);
  };

  // Load available Google Calendars
  const loadAvailableCalendars = useCallback(async () => {
    const accessToken = localStorage.getItem('googleCalendarToken');
    if (!accessToken) {
      console.log('No Google Calendar token found');
      return;
    }

    setIsLoadingCalendars(true);
    try {
      console.log('Loading available Google Calendars...');
      const calendars = await fetchGoogleCalendars(accessToken);
      console.log('Available calendars:', calendars);
      setAvailableCalendars(calendars);
      
      // Auto-select the first calendar if none selected
      if (calendars.length > 0 && selectedCalendarIds.length === 0) {
        setSelectedCalendarIds([calendars[0].id]);
        localStorage.setItem('selectedGoogleCalendarIds', JSON.stringify([calendars[0].id]));
      }
    } catch (error) {
      console.error('Failed to load calendars:', error);
    } finally {
      setIsLoadingCalendars(false);
    }
  }, [selectedCalendarIds.length]);

  // Load calendars when Google Calendar is connected
  useEffect(() => {
    if (googleConnected && availableCalendars.length === 0) {
      loadAvailableCalendars();
    }
  }, [googleConnected, availableCalendars.length, loadAvailableCalendars]);

  // Handle calendar selection (checkbox paradigm)
  const handleCalendarToggle = (calendarId: string) => {
    const newSelection = selectedCalendarIds.includes(calendarId)
      ? selectedCalendarIds.filter(id => id !== calendarId)
      : [...selectedCalendarIds, calendarId];
    
    setSelectedCalendarIds(newSelection);
    localStorage.setItem('selectedGoogleCalendarIds', JSON.stringify(newSelection));
    console.log('Selected calendars:', newSelection);
  };

  // Select all calendars
  const handleSelectAll = () => {
    const allIds = availableCalendars.map(cal => cal.id);
    setSelectedCalendarIds(allIds);
    localStorage.setItem('selectedGoogleCalendarIds', JSON.stringify(allIds));
  };

  // Deselect all calendars
  const handleDeselectAll = () => {
    setSelectedCalendarIds([]);
    localStorage.setItem('selectedGoogleCalendarIds', JSON.stringify([]));
  };

  // Handle timezone change
  const handleTimezoneChange = (timezone: string) => {
    setUserTimezone(timezone);
    localStorage.setItem('userTimezone', timezone);
    console.log('Timezone changed to:', timezone);
  };

  const handleConnectGooglePhotos = async () => {
    setIsConnecting(true);
    try {
      const token = localStorage.getItem('googlePhotosToken');
      if (token) {
        setPhotosConnected(true);
        console.log('Already connected to Google Photos!');
        setIsConnecting(false);
        return;
      }
      
      // Start OAuth flow (GSI-based)
      const result = await authorizeGooglePhotos();
      
      // Store the token in localStorage
      localStorage.setItem('googlePhotosToken', result);
      setPhotosConnected(true);
    } catch (error) {
      console.error('Failed to connect:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to connect to Google Photos: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGooglePhotos = () => {
    // Clear the token from localStorage
    localStorage.removeItem('googlePhotosToken');
    setPhotosConnected(false);
    console.log('Disconnected from Google Photos');
    
    // Show success message
    alert('Disconnected from Google Photos. Please refresh the page to see changes.');
  };


  const handleSelectScreensaverPhotos = async () => {
    const token = localStorage.getItem('googlePhotosToken');
    if (!token) {
      alert('Please connect to Google Photos first');
      return;
    }

    setIsSelectingPhotos(true);
    try {
      // Create a new picker session
      const session = await createPickerSession(token);
      
      // Store session ID in a variable to avoid closure issues
      const sessionId = session.sessionId;
      
      // Open the picker URI in a new window
      const pickerWindow = window.open(session.pickerUri, 'google-photos-picker', 'width=800,height=600');
      
      if (!pickerWindow) {
        alert('Please allow popups for this site to select photos');
        setIsSelectingPhotos(false);
        return;
      }

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const isComplete = await checkPickerSession(token, sessionId);
          
          if (isComplete) {
            clearInterval(pollInterval);
            
            // Try to close the popup
            try {
              pickerWindow.close();
            } catch (e) {
              // Ignore popup close errors due to CORS policies
            }
            
            // Try to focus the parent window
            try {
              window.focus();
            } catch (e) {
              // Ignore focus errors
            }
            
            // Get the selected media items
            const mediaItems = await getPickerMediaItems(token, sessionId);
            
            setScreensaverPhotos(mediaItems);
            
            // Save to localStorage
            localStorage.setItem('screensaverPhotos', JSON.stringify(mediaItems));
            localStorage.setItem('screensaverPhotosTimestamp', new Date().toISOString());
            
            setIsSelectingPhotos(false);
            alert(`Selected ${mediaItems.length} photos for screensaver! You can now close the picker window.`);
          }
        } catch (error) {
          console.error('Error checking picker session:', error);
          clearInterval(pollInterval);
          setIsSelectingPhotos(false);
        }
      }, 2000); // Check every 2 seconds

      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (pickerWindow && !pickerWindow.closed) {
          pickerWindow.close();
        }
        setIsSelectingPhotos(false);
      }, 300000); // 5 minutes

    } catch (error) {
      console.error('Error creating picker session:', error);
      alert('Failed to open photo picker. Please try again.');
      setIsSelectingPhotos(false);
    }
  };

  const handleClearScreensaverPhotos = () => {
    setScreensaverPhotos([]);
    localStorage.removeItem('screensaverPhotos');
    localStorage.removeItem('screensaverPhotosTimestamp');
  };

  const handleExportData = () => {
    // Export household data as JSON
    const data = {
      users,
      exportDate: new Date().toISOString(),
      version: '0.1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kitchensync-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddUser = () => {
    setEditingUser(undefined);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (userData: Partial<User>) => {
    if (editingUser) {
      updateUser({ userId: editingUser.id, updates: userData });
    } else {
      createUser(userData as Omit<User, 'id' | 'householdId' | 'createdAt' | 'updatedAt'>);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to remove this family member?')) {
      deleteUser(userId);
    }
  };

  const handleToggleFamilyTodos = () => {
    const newValue = !showFamilyTodos;
    setShowFamilyTodos(newValue);
    localStorage.setItem('showFamilyTodos', JSON.stringify(newValue));
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('familyTodosChanged'));
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 pb-40 overflow-y-auto h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Family Members */}
        <div className="rounded-3xl p-6 bg-white border border-gray-light">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black text-charcoal">
              Family Members
            </h2>
            <button
              onClick={handleAddUser}
              className="px-4 py-2 rounded-xl bg-purple text-cream font-bold hover:bg-purple/90 transition-colors"
            >
              + Add Member
            </button>
          </div>
          <div className="space-y-3">
            {users?.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 rounded-xl"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black"
                  style={{ backgroundColor: user.color, color: user.textColor }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-charcoal">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-medium capitalize">
                    {user.role}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4">
                    <div className="text-sm font-bold text-charcoal">
                      {user.currentStreak} day streak
                    </div>
                    <div className="text-xs text-gray-medium">
                      {user.kudosReceived} kudos
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditUser(user)}
                    className="px-3 py-1 rounded-lg bg-gray-light text-charcoal text-sm font-semibold hover:bg-gray-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="px-3 py-1 rounded-lg bg-red text-cream text-sm font-semibold hover:bg-red/90"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Household Settings */}
        <div className="rounded-3xl p-6 bg-white border border-gray-light">
          <h2 className="text-3xl font-black text-charcoal mb-6">
            Household
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl">
              <div>
                <h3 className="font-bold text-charcoal">Screensaver Timeout</h3>
                <p className="text-sm text-gray-medium">Activate after inactivity</p>
              </div>
              <select
                value={screensaverTimeout}
                onChange={(e) => setScreensaverTimeout(Number(e.target.value))}
                className="px-3 py-1 rounded-lg bg-gray-light text-charcoal font-bold border border-gray-medium focus:outline-none focus:ring-2 focus:ring-purple/20"
              >
                <option value={1}>1 min</option>
                <option value={3}>3 min</option>
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl">
              <div>
                <h3 className="font-bold text-charcoal">Show Family Todos</h3>
                <p className="text-sm text-gray-medium">Shared tasks on dashboard</p>
              </div>
              <button
                onClick={handleToggleFamilyTodos}
                className={`w-12 h-6 rounded-full transition-colors ${
                  showFamilyTodos ? 'bg-purple' : 'bg-gray-light'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    showFamilyTodos ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl">
              <div>
                <h3 className="font-bold text-charcoal">Notifications</h3>
                <p className="text-sm text-gray-medium">Daily reminders & kudos</p>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-purple' : 'bg-gray-light'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl">
              <div>
                <h3 className="font-bold text-charcoal">Daily Reset Time</h3>
                <p className="text-sm text-gray-medium">When tasks reset</p>
              </div>
              <span className="font-bold text-charcoal">6:00 AM</span>
            </div>

            <div className="p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-charcoal">Google Calendar</h3>
                  <p className="text-sm text-gray-medium">
                    {googleConnected ? (
                      lastSyncTime ? `Last sync: ${lastSyncTime.toLocaleTimeString()}` : 'Syncing ✓'
                    ) : 'Sync events'}
                  </p>
                  {/* Debug info */}
                  <p className="text-xs text-gray-400">
                    Status: {googleConnected ? 'Connected' : 'Not connected'} | 
                    Token: {localStorage.getItem('googleCalendarToken') ? 'Present' : 'Missing'}
                  </p>
                </div>
                {googleConnected ? (
                  <div className="flex gap-2">
                    <button
                      onClick={syncGoogleCalendar}
                      disabled={isSyncing}
                      className={`px-3 py-2 rounded-lg font-semibold bg-charcoal transition-all text-sm ${
                        isSyncing
                          ? 'bg-gray-light text-gray-medium cursor-not-allowed'
                          : 'bg-charcoal text-white hover:bg-charcoal/90'
                      }`}
                    >
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={handleDisconnectGoogleCalendar}
                      className="px-3 py-2 rounded-lg font-semibold transition-all bg-red text-cream hover:bg-red/90 text-sm"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={checkConnectionStatus}
                      className="px-3 py-2 rounded-lg font-semibold transition-all bg-charcoal text-cream hover:bg-charcoal/90 text-sm"
                    >
                      Check Status
                    </button>
                    <button
                      onClick={handleConnectGoogleCalendar}
                      disabled={isConnecting}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        isConnecting
                          ? 'bg-gray-light text-gray-medium cursor-not-allowed'
                          : 'bg-purple text-cream hover:bg-purple/90'
                      }`}
                    >
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Calendar Selection */}
              {googleConnected && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-charcoal text-sm">Select Calendars</h4>
                      <p className="text-xs text-gray-medium">
                        {selectedCalendarIds.length} calendar{selectedCalendarIds.length !== 1 ? 's' : ''} selected
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={loadAvailableCalendars}
                        disabled={isLoadingCalendars}
                        className="px-3 py-1.5 rounded-lg font-semibold transition-all bg-blue text-cream hover:bg-blue/90 text-xs disabled:opacity-50"
                      >
                        {isLoadingCalendars ? 'Loading...' : 'Refresh'}
                      </button>
                      <button
                        onClick={() => setShowCalendarPicker(!showCalendarPicker)}
                        className="px-3 py-1.5 rounded-lg font-semibold transition-all bg-charcoal text-cream hover:bg-charcoal/90 text-xs"
                      >
                        {showCalendarPicker ? 'Hide' : 'Choose'}
                      </button>
                    </div>
                  </div>

                  {/* Calendar Picker Modal */}
                  {showCalendarPicker && availableCalendars.length > 0 && (
                    <div className="bg-white border border-gray-light rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-charcoal text-sm">Available Calendars</h5>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSelectAll}
                            className="px-2 py-1 rounded text-xs font-medium bg-yellow text-charcoal hover:bg-yellow/90 transition-all"
                          >
                            Select All
                          </button>
                          <button
                            onClick={handleDeselectAll}
                            className="px-2 py-1 rounded text-xs font-medium bg-gray-light text-charcoal hover:bg-gray-light/90 transition-all"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {availableCalendars.map((calendar) => {
                          const isSelected = selectedCalendarIds.includes(calendar.id);
                          const isPrimary = calendar.primary;
                          
                          return (
                            <label
                              key={calendar.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-light/50 ${
                                isSelected ? 'bg-blue/10 border border-blue/20' : 'border border-transparent'
                              }`}
                            >
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleCalendarToggle(calendar.id)}
                                  className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  isSelected 
                                    ? 'bg-blue border-blue' 
                                    : 'border-gray-medium hover:border-blue'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-cream" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-charcoal text-sm truncate">
                                    {calendar.summary}
                                  </span>
                                  {isPrimary && (
                                    <span className="px-2 py-0.5 bg-purple text-cream text-xs rounded-full font-medium">
                                      Primary
                                    </span>
                                  )}
                                </div>
                                {calendar.description && (
                                  <p className="text-xs text-gray-medium truncate mt-0.5">
                                    {calendar.description}
                                  </p>
                                )}
                              </div>
                              
                              {/* Calendar color indicator */}
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-light flex-shrink-0"
                                style={{ backgroundColor: calendar.backgroundColor || '#E0E0E0' }}
                              />
                            </label>
                          );
                        })}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-light">
                        <p className="text-xs text-gray-medium">
                          Events will sync from {selectedCalendarIds.length} selected calendar{selectedCalendarIds.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Quick selection buttons when picker is closed */}
                  {!showCalendarPicker && availableCalendars.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedCalendarIds.slice(0, 3).map((calendarId) => {
                        const calendar = availableCalendars.find(cal => cal.id === calendarId);
                        return (
                          <span
                            key={calendarId}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue/10 text-blue rounded-lg text-xs font-medium"
                          >
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: calendar?.backgroundColor || '#0A95FF' }}
                            />
                            {calendar?.summary || calendarId}
                          </span>
                        );
                      })}
                      {selectedCalendarIds.length > 3 && (
                        <span className="inline-flex items-center px-3 py-1.5 bg-gray-light text-charcoal rounded-lg text-xs font-medium">
                          +{selectedCalendarIds.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Timezone Settings */}
                  <div className="mt-4 pt-4 border-t border-gray-light">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-charcoal">Timezone:</label>
                      <select
                        value={userTimezone}
                        onChange={(e) => handleTimezoneChange(e.target.value)}
                        className="px-3 py-1 rounded-lg border border-gray-300 text-sm bg-white"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="America/Anchorage">Alaska Time (AKT)</option>
                        <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                        <option value="UTC">UTC</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                        <option value="Australia/Sydney">Sydney (AEST)</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-medium mt-1">
                      Current time: {new Date().toLocaleString('en-US', { timeZone: userTimezone })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl">
              <div>
                <h3 className="font-bold text-charcoal">Google Photos</h3>
                <p className="text-sm text-gray-medium">
                  {photosConnected ? 'Syncing ✓' : 'Screensaver photos'}
                </p>
              </div>
              {photosConnected ? (
                <button
                  onClick={handleDisconnectGooglePhotos}
                  className="px-4 py-2 rounded-lg font-semibold transition-all bg-red text-cream hover:bg-charcoal/90"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnectGooglePhotos}
                  disabled={isConnecting}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    isConnecting
                      ? 'bg-gray-light text-gray-medium cursor-not-allowed'
                      : 'bg-purple text-cream hover:bg-purple/90'
                  }`}
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>

            {/* Screensaver Configuration */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-purple/20">
              <div>
                <h3 className="font-bold text-charcoal">Screensaver Photos</h3>
                <p className="text-sm text-gray-medium">
                  {screensaverPhotos.length > 0 
                    ? `${screensaverPhotos.length} photos selected` 
                    : 'No photos selected'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectScreensaverPhotos}
                  disabled={isSelectingPhotos || !photosConnected}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    isSelectingPhotos || !photosConnected
                      ? 'bg-gray-light text-gray-medium cursor-not-allowed'
                      : 'bg-purple text-cream hover:bg-purple/90'
                  }`}
                >
                  {isSelectingPhotos ? 'Selecting...' : 'Select Photos'}
                </button>
                {screensaverPhotos.length > 0 && (
                  <button
                    onClick={handleClearScreensaverPhotos}
                    className="px-4 py-2 rounded-lg font-semibold transition-all bg-red text-cream hover:bg-red/90"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            
            <button
              onClick={handleExportData}
              className="w-full p-4 rounded-xl bg-gray-light hover:bg-gray-medium transition-colors"
            >
              <h3 className="font-bold text-charcoal">Export Data</h3>
              <p className="text-sm text-gray-medium">Download household data</p>
            </button>
          </div>
        </div>

        {/* About - spans 2 columns */}
        <div className="lg:col-span-2 text-center rounded-3xl p-6">
          <p className="text-gray-medium text-sm">
            KitchenSync v0.1.0 • Made with ❤️ for families
          </p>
        </div>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        user={editingUser}
        mode={editingUser ? 'edit' : 'add'}
      />
    </main>
  );
};

