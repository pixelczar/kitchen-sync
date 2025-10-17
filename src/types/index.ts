// Core data models from docs/technical.md

export interface User {
  id: string;
  householdId: string;
  name: string;
  role: 'parent' | 'child';
  color: string; // #F7EA31, #F7313F, #0A95FF, #3C0E4D
  textColor: string; // for contrast
  currentStreak: number;
  longestStreak: number;
  kudosReceived: number;
  lastActiveDate?: string; // ISO 8601 date (YYYY-MM-DD)
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface Task {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  type: 'chore' | 'todo';
  assignedTo?: string; // User ID
  completed: boolean;
  completedAt?: string; // ISO 8601
  streak?: number; // for chores only
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    days?: number[]; // [0-6] for weekly
    interval?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Kudos {
  id: string;
  householdId: string;
  from: string; // User ID
  to: string; // User ID
  type: 'effort' | 'kindness' | 'smart' | 'helpful' | 'funny' | 'streak-auto';
  message: string;
  emoji: string;
  timestamp: string; // ISO 8601
  streakValue?: number;
}

export interface CalendarEvent {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO 8601
  endTime: string;
  assignedTo: string; // User ID
  color: string;
  cluster?: string;
  source: 'google' | 'manual';
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  householdId: string;
  url: string;
  thumbnailUrl?: string;
  source: 'google-photos' | 'upload';
  takenAt?: string; // ISO 8601
  uploadedAt: string;
  faces?: string[];
  tags?: string[];
  aiCurated: boolean;
}

export interface Household {
  id: string;
  name: string;
  members: string[]; // User IDs
  createdAt: string;
  settings: HouseholdSettings;
}

export interface HouseholdSettings {
  // Display
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  
  // Screensaver
  screensaverEnabled: boolean;
  screensaverIdleMinutes: number;
  screensaverTransitionSeconds: number;
  photoAlbumIds: string[];
  
  // Celebrations
  celebrationsEnabled: boolean;
  celebrationVolume: number;
  celebrationStyle: 'full' | 'minimal';
  
  // Notifications
  pushNotificationsEnabled: boolean;
  notifyOnKudos: boolean;
  notifyOnStreaks: boolean;
  notifyOnEventReminders: boolean;
  
  // Calendar
  calendarView: 'month' | 'week' | 'day';
  startOfWeek: 0 | 1;
  showWeekNumbers: boolean;
  
  // Family
  parentPinCode?: string;
  allowChildrenToGiveKudos: boolean;
  
  // Privacy
  photoFaceDetection: boolean;
  shareDataWithAI: boolean;
}

export interface Celebration {
  type: 'task-complete' | 'streak' | 'kudos';
  userId: string;
  taskName?: string;
  streakValue?: number;
  kudosType?: string;
  message?: string;
}

