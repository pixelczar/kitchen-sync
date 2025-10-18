import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { queryClient } from './lib/queryClient';
import { PageTransition } from './components/PageTransition';
import { Navigation } from './components/Navigation';
import { Layout } from './components/Layout';
import { KudosCelebration } from './components/KudosCelebration';
import { ToastContainer } from './components/Toast';
import { Dashboard } from './features/dashboard/Dashboard';
import { Calendar } from './features/calendar/Calendar';
import { TodosView } from './features/todos/TodosView';
import { SettingsView } from './features/settings/SettingsView';
import { Screensaver } from './features/screensaver/Screensaver';
import { useIdleDetection } from './hooks/useIdleDetection';
import { useStreakTracking } from './hooks/useStreaks';
import { useGoogleCalendarSync } from './hooks/useGoogleCalendarSync';

function AnimatedRoutes() {
  const location = useLocation();
  const [showScreensaver, setShowScreensaver] = useState(false);
  const isIdle = useIdleDetection(300000); // 5 minutes
  
  // Track streaks automatically based on task completion
  useStreakTracking();
  
  // Sync Google Calendar events automatically
  useGoogleCalendarSync();
  
  // Show screensaver when idle or manually triggered
  if (isIdle && !showScreensaver) {
    setShowScreensaver(true);
  }
  
  // Function to manually trigger screensaver
  const triggerScreensaver = () => {
    setShowScreensaver(true);
  };
  
  if (showScreensaver) {
    return (
      <Screensaver
        onWake={() => {
          setShowScreensaver(false);
        }}
      />
    );
  }
  
  // Get route index for directional transitions
  const routes = ['/', '/calendar', '/todos', '/settings'];
  const currentIndex = routes.indexOf(location.pathname);
  
  return (
    <Layout>
      <div className="relative h-full overflow-hidden">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <PageTransition direction={currentIndex}>
                  <Dashboard onTriggerScreensaver={triggerScreensaver} />
                </PageTransition>
              }
            />
            <Route
              path="/calendar"
              element={
                <PageTransition direction={currentIndex}>
                  <Calendar />
                </PageTransition>
              }
            />
            <Route
              path="/todos"
              element={
                <PageTransition direction={currentIndex}>
                  <TodosView />
                </PageTransition>
              }
            />
            <Route
              path="/settings"
              element={
                <PageTransition direction={currentIndex}>
                  <SettingsView />
                </PageTransition>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
      <Navigation />
      <KudosCelebration />
      <ToastContainer />
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <AnimatedRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

