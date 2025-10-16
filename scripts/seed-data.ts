import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

// This script seeds sample data for development
// Run with: npx tsx scripts/seed-data.ts

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const HOUSEHOLD_ID = 'demo-family-001';

async function seedData() {
  console.log('Seeding data for household:', HOUSEHOLD_ID);
  
  // Create users
  const users = [
    {
      id: 'user-sarah',
      householdId: HOUSEHOLD_ID,
      name: 'sarah',
      role: 'parent' as const,
      color: '#F7EA31',
      textColor: '#2D3748',
      currentStreak: 3,
      longestStreak: 7,
      kudosReceived: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-mike',
      householdId: HOUSEHOLD_ID,
      name: 'mike',
      role: 'parent' as const,
      color: '#F7313F',
      textColor: '#FAF8F3',
      currentStreak: 1,
      longestStreak: 4,
      kudosReceived: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-emma',
      householdId: HOUSEHOLD_ID,
      name: 'emma',
      role: 'child' as const,
      color: '#0A95FF',
      textColor: '#FAF8F3',
      currentStreak: 5,
      longestStreak: 8,
      kudosReceived: 7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-jake',
      householdId: HOUSEHOLD_ID,
      name: 'jake',
      role: 'child' as const,
      color: '#3C0E4D',
      textColor: '#FAF8F3',
      currentStreak: 0,
      longestStreak: 3,
      kudosReceived: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  
  for (const user of users) {
    await setDoc(doc(db, 'users', user.id), user);
    console.log('Created user:', user.name);
  }
  
  // Create tasks
  const tasks = [
    {
      id: 'task-1',
      householdId: HOUSEHOLD_ID,
      title: 'Review budget',
      type: 'chore' as const,
      assignedTo: 'user-sarah',
      completed: false,
      streak: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      householdId: HOUSEHOLD_ID,
      title: 'Call dentist',
      type: 'chore' as const,
      assignedTo: 'user-sarah',
      completed: true,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      householdId: HOUSEHOLD_ID,
      title: 'Fix bike',
      type: 'chore' as const,
      assignedTo: 'user-mike',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      householdId: HOUSEHOLD_ID,
      title: 'Water plants',
      type: 'chore' as const,
      assignedTo: 'user-mike',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-5',
      householdId: HOUSEHOLD_ID,
      title: 'Feed the cat',
      type: 'chore' as const,
      assignedTo: 'user-emma',
      completed: true,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-6',
      householdId: HOUSEHOLD_ID,
      title: 'Homework',
      type: 'chore' as const,
      assignedTo: 'user-emma',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-7',
      householdId: HOUSEHOLD_ID,
      title: 'Practice piano',
      type: 'chore' as const,
      assignedTo: 'user-emma',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-8',
      householdId: HOUSEHOLD_ID,
      title: 'Make bed',
      type: 'chore' as const,
      assignedTo: 'user-jake',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-9',
      householdId: HOUSEHOLD_ID,
      title: 'Read 20 minutes',
      type: 'chore' as const,
      assignedTo: 'user-jake',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-10',
      householdId: HOUSEHOLD_ID,
      title: 'Get groceries',
      type: 'todo' as const,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-11',
      householdId: HOUSEHOLD_ID,
      title: 'Plan weekend trip',
      type: 'todo' as const,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-12',
      householdId: HOUSEHOLD_ID,
      title: 'Clean garage',
      type: 'todo' as const,
      completed: true,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  
  for (const task of tasks) {
    await setDoc(doc(db, 'tasks', task.id), task);
    console.log('Created task:', task.title);
  }
  
  // Create calendar events
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const events = [
    {
      id: 'event-1',
      householdId: HOUSEHOLD_ID,
      title: 'Soccer practice',
      startTime: new Date(tomorrow.setHours(16, 0, 0, 0)).toISOString(),
      endTime: new Date(tomorrow.setHours(17, 30, 0, 0)).toISOString(),
      assignedTo: 'user-emma',
      color: '#0A95FF',
      source: 'manual' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  
  for (const event of events) {
    await setDoc(doc(db, 'calendar-events', event.id), event);
    console.log('Created event:', event.title);
  }
  
  console.log('✅ Seed data created successfully!');
  process.exit(0);
}

seedData().catch((error) => {
  console.error('Error seeding data:', error);
  process.exit(1);
});

