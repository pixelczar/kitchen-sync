import { useRef } from 'react';
import { Checkbox } from '../../components/Checkbox';
import { useTaskMutations } from '../../hooks/useTasks';
import { useUIStore } from '../../stores/uiStore';
import { blastComplete } from '../../lib/emoji-blast';
import type { Task } from '../../types';

interface TaskItemProps {
  task: Task;
  userColor: string;
  textColor: string;
}

export const TaskItem = ({ task, textColor }: TaskItemProps) => {
  const { mutate: updateTask } = useTaskMutations();
  const optimisticTaskStates = useUIStore((state) => state.optimisticTaskStates);
  const checkboxRef = useRef<HTMLDivElement>(null);
  const checkmarkRef = useRef<HTMLDivElement>(null);
  
  // Merge Firestore state with optimistic local state
  const isCompleted = optimisticTaskStates.has(task.id)
    ? optimisticTaskStates.get(task.id)! // Use optimistic state if available
    : task.completed; // Otherwise use Firestore state
  
  const handleToggle = () => {
    // Always use the original Firestore state to determine the next state
    // This prevents double-click issues with optimistic updates
    const originalCompleted = task.completed;
    const newCompleted = !originalCompleted;
    
    console.log('TaskItem handleToggle:', { 
      taskId: task.id, 
      originalState: originalCompleted, 
      optimisticState: optimisticTaskStates.get(task.id),
      newState: newCompleted 
    }); // Debug log
    
    updateTask({ taskId: task.id, completed: newCompleted });
    
    // Blast emojis when completing a task! 🎉
    if (!isCompleted) {
      // Use checkmark element if available, otherwise fall back to checkbox container
      const blastElement = checkmarkRef.current || checkboxRef.current;
      if (blastElement) {
        blastComplete(blastElement);
      }
    }
  };
  
  return (
    <div ref={checkboxRef}>
      <Checkbox
        checked={isCompleted}
        onChange={handleToggle}
        label={task.title}
        color="white"
        textColor={textColor}
        checkmarkRef={checkmarkRef}
      />
    </div>
  );
};

