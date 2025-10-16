import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_5WLQZ1wqY2pkzejbrZ-F55xtZ0hlozg",
  authDomain: "kitchensync-4aa93.firebaseapp.com",
  projectId: "kitchensync-4aa93",
  storageBucket: "kitchensync-4aa93.firebasestorage.app",
  messagingSenderId: "820247008801",
  appId: "1:820247008801:web:357e5c3742165c47c93560"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log('🌱 Seeding KitchenSync database...\n');
  
  // Users
  await setDoc(doc(db, 'users', 'user-sarah'), {
    id: 'user-sarah',
    householdId: 'demo-family-001',
    name: 'Mom',
    role: 'parent',
    color: '#F7EA31',
    textColor: '#2D3748',
    currentStreak: 3,
    longestStreak: 7,
    kudosReceived: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log('✓ Created user: sarah');

  await setDoc(doc(db, 'users', 'user-mike'), {
    id: 'user-mike',
    householdId: 'demo-family-001',
    name: 'Dad',
    role: 'parent',
    color: '#F7313F',
    textColor: '#FAF8F3',
    currentStreak: 1,
    longestStreak: 4,
    kudosReceived: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log('✓ Created user: mike');

  await setDoc(doc(db, 'users', 'user-emma'), {
    id: 'user-emma',
    householdId: 'demo-family-001',
    name: 'Emma',
    role: 'child',
    color: '#0A95FF',
    textColor: '#FAF8F3',
    currentStreak: 5,
    longestStreak: 8,
    kudosReceived: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log('✓ Created user: emma');

  await setDoc(doc(db, 'users', 'user-jake'), {
    id: 'user-jake',
    householdId: 'demo-family-001',
    name: 'Jake',
    role: 'child',
    color: '#3C0E4D',
    textColor: '#FAF8F3',
    currentStreak: 0,
    longestStreak: 3,
    kudosReceived: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log('✓ Created user: jake');

  console.log('\n📋 Creating tasks...\n');

  // Tasks
  await setDoc(doc(db, 'tasks', 'task-1'), {
    id: 'task-1',
    householdId: 'demo-family-001',
    title: 'Review budget',
    type: 'chore',
    assignedTo: 'user-sarah',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log('✓ Task: Review budget (sarah)');

  await setDoc(doc(db, 'tasks', 'task-2'), {
    id: 'task-2',
    householdId: 'demo-family-001',
    title: 'Fix bike',
    type: 'chore',
    assignedTo: 'user-mike',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log('✓ Task: Fix bike (mike)');

  await setDoc(doc(db, 'tasks', 'task-3'), {
    id: 'task-3',
    householdId: 'demo-family-001',
    title: 'Feed the cat',
    type: 'chore',
    assignedTo: 'user-emma',
    completed: true,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log('✓ Task: Feed the cat (emma) [COMPLETED]');

  await setDoc(doc(db, 'tasks', 'task-4'), {
    id: 'task-4',
    householdId: 'demo-family-001',
    title: 'Homework',
    type: 'chore',
    assignedTo: 'user-emma',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log('✓ Task: Homework (emma)');

  await setDoc(doc(db, 'tasks', 'task-5'), {
    id: 'task-5',
    householdId: 'demo-family-001',
    title: 'Make bed',
    type: 'chore',
    assignedTo: 'user-jake',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log('✓ Task: Make bed (jake)');

  await setDoc(doc(db, 'tasks', 'task-6'), {
    id: 'task-6',
    householdId: 'demo-family-001',
    title: 'Get groceries',
    type: 'todo',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log('✓ Shared todo: Get groceries');

  console.log('\n✅ Database seeded successfully!');
  console.log('\n🎉 Open http://localhost:5173 to see your family dashboard!\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error seeding database:', err);
  process.exit(1);
});
