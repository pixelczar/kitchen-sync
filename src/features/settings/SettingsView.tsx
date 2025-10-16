import { useState } from 'react';
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
      const result = await authorizeGooglePhotos();
      setPhotosConnected(true);
      console.log('Connected to Google Photos!', result);
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect to Google Photos');
    } finally {
      setIsConnecting(false);
    }
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
        <div className="rounded-3xl p-6 bg-purple">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black text-cream">
              👨‍👩‍👧‍👦 family members
            </h2>
            <button
              onClick={handleAddUser}
              className="px-4 py-2 rounded-xl bg-cream text-purple font-bold hover:scale-105 transition-transform"
            >
              + Add Member
            </button>
          </div>
          <div className="space-y-3">
            {users?.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black"
                  style={{ backgroundColor: user.color, color: user.textColor }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-cream">
                    {user.name}
                  </h3>
                  <p className="text-sm text-cream/70 capitalize">
                    {user.role}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4">
                    <div className="text-sm font-bold text-cream">
                      {user.currentStreak} day streak
                    </div>
                    <div className="text-xs text-cream/70">
                      {user.kudosReceived} kudos
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditUser(user)}
                    className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-cream text-sm font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="px-3 py-1 rounded-lg bg-red/80 hover:bg-red text-cream text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Household Settings */}
        <div className="rounded-3xl p-6 bg-green">
          <h2 className="text-3xl font-black text-cream mb-6">
            🏠 household
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/10 transition-colors">
              <div>
                <h3 className="font-bold text-cream">Screensaver Timeout</h3>
                <p className="text-sm text-cream/70">Activate after inactivity</p>
              </div>
              <select
                value={screensaverTimeout}
                onChange={(e) => setScreensaverTimeout(Number(e.target.value))}
                className="px-3 py-1 rounded-lg bg-white/20 text-cream font-bold border-none focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <option value={1}>1 min</option>
                <option value={3}>3 min</option>
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/10 transition-colors">
              <div>
                <h3 className="font-bold text-cream">Show Family Todos</h3>
                <p className="text-sm text-cream/70">Shared tasks on dashboard</p>
              </div>
              <button
                onClick={handleToggleFamilyTodos}
                className={`w-12 h-6 rounded-full transition-colors ${
                  showFamilyTodos ? 'bg-white' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-green transition-transform ${
                    showFamilyTodos ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/10 transition-colors">
              <div>
                <h3 className="font-bold text-cream">Notifications</h3>
                <p className="text-sm text-cream/70">Daily reminders & kudos</p>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-white' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-green transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/10 transition-colors">
              <div>
                <h3 className="font-bold text-cream">Daily Reset Time</h3>
                <p className="text-sm text-cream/70">When tasks reset</p>
              </div>
              <span className="font-bold text-cream">6:00 AM</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/10 transition-colors">
              <div>
                <h3 className="font-bold text-cream">Google Calendar</h3>
                <p className="text-sm text-cream/70">
                  {googleConnected ? 'Syncing ✓' : 'Sync events'}
                </p>
              </div>
              <button
                onClick={handleConnectGoogleCalendar}
                disabled={isConnecting || googleConnected}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  googleConnected
                    ? 'bg-white/20 text-cream/50 cursor-not-allowed'
                    : 'bg-white/30 text-cream hover:bg-white/40'
                }`}
              >
                {isConnecting ? 'Connecting...' : googleConnected ? 'Connected' : 'Connect'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/10 transition-colors">
              <div>
                <h3 className="font-bold text-cream">Google Photos</h3>
                <p className="text-sm text-cream/70">
                  {photosConnected ? 'Syncing ✓' : 'Screensaver photos'}
                </p>
              </div>
              <button
                onClick={handleConnectGooglePhotos}
                disabled={isConnecting || photosConnected}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  photosConnected
                    ? 'bg-white/20 text-cream/50 cursor-not-allowed'
                    : 'bg-white/30 text-cream hover:bg-white/40'
                }`}
              >
                {isConnecting ? 'Connecting...' : photosConnected ? 'Connected' : 'Connect'}
              </button>
            </div>
            
            <button
              onClick={handleExportData}
              className="w-full p-4 rounded-xl bg-white/30 hover:bg-white/40 transition-colors"
            >
              <h3 className="font-bold text-cream">Export Data</h3>
              <p className="text-sm text-cream/70">Download household data</p>
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

