import { useState, useEffect } from 'react';

export const useShowFamilyTodos = () => {
  const [showFamilyTodos, setShowFamilyTodos] = useState(() => {
    const saved = localStorage.getItem('showFamilyTodos');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('showFamilyTodos');
      setShowFamilyTodos(saved !== null ? JSON.parse(saved) : true);
    };

    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-window updates
    window.addEventListener('familyTodosChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('familyTodosChanged', handleStorageChange);
    };
  }, []);

  return showFamilyTodos;
};

