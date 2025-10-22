import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PersonCard } from '../dashboard/PersonCard';
import { Checkbox } from '../../components/Checkbox';
import { TaskModal } from '../../components/TaskModal';
import { useTasks, useTaskMutations, useCreateTask, useUpdateTask } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useUIStore } from '../../stores/uiStore';
import { useShowFamilyTodos } from '../../hooks/useSettings';
import { PersonCardSkeleton } from '../../components/Skeleton';
import { blastComplete } from '../../lib/emoji-blast';
import type { Task } from '../../types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 16},
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

export const TodosView = () => {
  const { data: users, error: usersError, status: usersStatus } = useUsers();
  const { data: tasks, error: tasksError, status: tasksStatus } = useTasks();
  const { mutate: updateTask } = useTaskMutations();
  const { mutate: createTask } = useCreateTask();
  const { mutate: updateTaskMutation } = useUpdateTask();
  const optimisticTaskStates = useUIStore((state) => state.optimisticTaskStates);
  const showFamilyTodos = useShowFamilyTodos();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [preselectedUserId, setPreselectedUserId] = useState<string | undefined>();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Set initial load to false after component mounts and data is available
  useEffect(() => {
    if (isInitialLoad && users && tasks) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setIsInitialLoad(false);
      });
    }
  }, [isInitialLoad, users, tasks]);
  
  // Listen for custom events from navigation plus button
  useEffect(() => {
    const handleOpenModal = () => {
      console.log('TodosView: Opening modal from navigation plus button');
      setEditingTask(undefined);
      setPreselectedUserId(undefined);
      setIsModalOpen(true);
    };
    
    window.addEventListener('openTodosModal', handleOpenModal);
    return () => window.removeEventListener('openTodosModal', handleOpenModal);
  }, []);
  
  // Handle errors
  if (usersError || tasksError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-xl font-semibold text-error">
          Error loading data: {usersError?.message || tasksError?.message}
        </div>
      </div>
    );
  }
  
  // Show loading state if either query is still loading/pending OR if we don't have data yet
  // Use status to be more precise about when to show loading
  const isStillLoading = usersStatus === 'pending' || tasksStatus === 'pending';
  const hasNoData = !users || !tasks;
  
  if (isStillLoading || hasNoData) {
    return (
      <motion.main 
        className="px-6 pb-40 overflow-y-auto h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={item}><PersonCardSkeleton /></motion.div>
              <motion.div variants={item}><PersonCardSkeleton /></motion.div>
              <motion.div variants={item}><PersonCardSkeleton /></motion.div>
              <motion.div variants={item}><PersonCardSkeleton /></motion.div>
            </motion.div>
          </div>

          {/* Shared Todos Sidebar Skeleton */}
          {showFamilyTodos && (
            <div className="w-96 sticky top-6 h-fit">
              <div className="rounded-3xl p-6 ">
                <div className="h-8 w-48 bg-white/20 rounded animate-pulse mb-6" />
                <div className="space-y-3">
                  <div className="h-12 bg-white/20 rounded animate-pulse" />
                  <div className="h-12 bg-white/20 rounded animate-pulse" />
                  <div className="h-12 bg-white/20 rounded animate-pulse" />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.main>
    );
  }
  
  // If we have no users or tasks, show empty state
  if (users.length === 0 && tasks.length === 0) {
    return (
      <motion.main 
        className="px-6 pb-40 overflow-y-auto h-full"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-2xl font-bold text-purple mb-2">Welcome to your family dashboard!</h2>
            <p className="text-gray-600">Add family members and tasks to get started.</p>
          </div>
        </div>
      </motion.main>
    );
  }
  
  // Group tasks by user
  const userTasks = users.map(user => ({
    user,
    tasks: tasks.filter(task => task.assignedTo === user.id && task.type === 'chore'),
    kudosCount: user.kudosReceived,
  }));
  
  // Shared todos
  const sharedTodos = tasks.filter(task => task.type === 'todo');
  
  const handleToggleTodo = (todo: typeof sharedTodos[0], checkmarkRef?: React.RefObject<HTMLDivElement>) => {
    // Always use the original Firestore state to determine the next state
    // This prevents double-click issues with optimistic updates
    const originalCompleted = todo.completed;
    const newCompleted = !originalCompleted;
    
    console.log('handleToggleTodo:', { 
      todoId: todo.id, 
      originalState: originalCompleted, 
      optimisticState: optimisticTaskStates.get(todo.id),
      newState: newCompleted 
    }); // Debug log
    
    updateTask({ taskId: todo.id, completed: newCompleted });
    
    // Blast emojis when completing a todo! 🎉
    if (!originalCompleted && checkmarkRef?.current) {
      blastComplete(checkmarkRef.current);
    }
  };
  
  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTaskMutation({ taskId: editingTask.id, updates: taskData });
    } else {
      createTask(taskData);
    }
    setEditingTask(undefined);
    setIsModalOpen(false);
  };
  
  
  const handleAddTaskForUser = (userId: string) => {
    // Pre-populate task with user assignment
    setEditingTask(undefined);
    setPreselectedUserId(userId);
    setIsModalOpen(true);
  };
  
  return (
    <motion.main 
      className="px-6 pb-40 overflow-y-auto h-full"
      variants={container}
      initial="hidden"
      animate="show"
    >
      
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Person Cards Grid */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" 
            variants={container}
            initial={isInitialLoad ? "show" : "hidden"}
            animate="show"
          >
            {userTasks.map(({ user, tasks, kudosCount }) => (
              <motion.div 
                key={user.id} 
                variants={item}
                initial={isInitialLoad ? "show" : "hidden"}
                animate="show"
              >
                <PersonCard
                  user={user}
                  tasks={tasks}
                  kudosCount={kudosCount}
                  onAddTask={() => handleAddTaskForUser(user.id)}
                />
              </motion.div>
            ))}
          </motion.div>
          
        </div>

        {/* Shared Todos Sidebar */}
        {showFamilyTodos && (
          <motion.div 
            className="w-80 flex-shrink-0" 
            variants={item}
            initial={isInitialLoad ? "show" : "hidden"}
            animate="show"
          >
            <div className="rounded-3xl p-6 bg-green sticky">
              <h3 className="text-3xl font-black text-cream mb-6">
                Family to-dos
              </h3>
            
            <div className="space-y-2">
              {sharedTodos.length > 0 ? (
                sharedTodos.map(todo => {
                  const isCompleted = optimisticTaskStates.has(todo.id)
                    ? optimisticTaskStates.get(todo.id)!
                    : todo.completed;
                  
                  const TodoCheckbox = () => {
                    const checkmarkRef = useRef<HTMLDivElement>(null);
                    
                    return (
                      <Checkbox
                        key={todo.id}
                        checked={isCompleted}
                        onChange={() => handleToggleTodo(todo, checkmarkRef)}
                        label={todo.title}
                        color="black"
                        textColor="#FAF8F3"
                        checkmarkRef={checkmarkRef}
                      />
                    );
                  };
                  
                  return <TodoCheckbox key={todo.id} />;
                })
              ) : (
                <p className="text-cream/80 text-center py-4">
                  No family to-dos yet
                </p>
              )}
            </div>
          </div>
        </motion.div>
        )}
      </div>

      {/* Footer */}
      <motion.div 
        className="text-center mt-12 mb-8" 
        variants={item}
        initial={isInitialLoad ? "show" : "hidden"}
        animate="show"
      >
        <h2 className="text-4xl font-handwritten tracking-tight text-purple transform -rotate-2">
          WE'RE DOIN' IT!
        </h2>
      </motion.div>
      
      
      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(undefined);
          setPreselectedUserId(undefined);
        }}
        onSave={handleSaveTask}
        task={editingTask || (preselectedUserId ? { assignedTo: preselectedUserId, type: 'chore' } as Task : undefined)}
        mode={editingTask ? 'edit' : 'add'}
      />
    </motion.main>
  );
};

