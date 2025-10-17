import { useState, useEffect } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { isGoogleCalendarConfigured, authorizeGoogleCalendar } from '../../lib/google-calendar';
import { authorizeGooglePhotos } from '../../lib/google-photos';
import { UserModal } from '../../components/UserModal';
import { User } from '../../types';

export const SettingsView = () => {
  const { data: users } = useUsers();
  const { mutate: createUser } = useCreateUser();
  const { mutate: updateUser } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [photosConnected, setPhotosConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showFamilyTodos, setShowFamilyTodos] = useState(() => {
    const saved = localStorage.getItem('showFamilyTodos');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [screensaverTimeout, setScreensaverTimeout] = useState(5); // minutes
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  
  // Check for existing tokens on component mount
  useEffect(() => {
    const photosToken = localStorage.getItem('googlePhotosToken');
    const calendarToken = localStorage.getItem('googleCalendarToken');
    
    if (photosToken) {
      setPhotosConnected(true);
    }
    if (calendarToken) {
      setGoogleConnected(true);
    }
  }, []);
  
  const handleConnectGoogleCalendar = async () => {
    if (!isGoogleCalendarConfigured()) {
      alert('Google Calendar API is not configured. See src/lib/google-calendar.ts for setup instructions.');
      return;
    }
    
    setIsConnecting(true);
    try {
      const token = await authorizeGoogleCalendar();
      setGoogleConnected(true);
      // TODO: Store token securely and start syncing
      console.log('Connected to Google Calendar!', token);
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect to Google Calendar');
    } finally {
      setIsConnecting(false);
    }
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
      setPhotosConnected(true);
      console.log('Connected to Google Photos!', result);
    } catch (error) {
      console.error('Failed to connect:', error);
      alert(`Failed to connect to Google Photos: ${error.message}`);
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

            <div className="flex items-center justify-between p-4 rounded-xl">
              <div>
                <h3 className="font-bold text-charcoal">Google Calendar</h3>
                <p className="text-sm text-gray-medium">
                  {googleConnected ? 'Syncing ✓' : 'Sync events'}
                </p>
              </div>
              <button
                onClick={handleConnectGoogleCalendar}
                disabled={isConnecting || googleConnected}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  googleConnected
                    ? 'bg-gray-light text-gray-medium cursor-not-allowed'
                    : 'bg-purple text-cream hover:bg-purple/90'
                }`}
              >
                {isConnecting ? 'Connecting...' : googleConnected ? 'Connected' : 'Connect'}
              </button>
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
                  className="px-4 py-2 rounded-lg font-semibold transition-all bg-red-500 text-white hover:bg-red-600"
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

