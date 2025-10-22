import { TaskItem } from './TaskItem';
import type { User, Task } from '../../types';

interface PersonCardProps {
  user: User;
  tasks: Task[];
  kudosCount: number;
  onAddTask?: () => void;
}

export const PersonCard = ({ user, tasks, kudosCount, onAddTask }: PersonCardProps) => {
  return (
    <div 
      className="rounded-3xl p-6 relative h-full flex flex-col"
      style={{ backgroundColor: user.color }}
    >
      {/* Quick Add Button */}
      {onAddTask && (
        <button
          onClick={onAddTask}
          className="absolute top-4 right-4 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold transition-transform hover:scale-110 active:scale-95"
          style={{ 
            backgroundColor: user.color === '#F7EA31' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.1)',
            color: user.color === '#F7EA31' ? '#3C0E4D' : user.textColor 
          }}
        >
          +
        </button>
      )}
      
      {/* Name */}
      <h2
        className="text-5xl font-black tracking-tight mb-6 pr-12"
        style={{ color: user.textColor }}
      >
        {user.name}
      </h2>
      
      {/* Task List */}
      <div className="space-y-2 flex-1">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskItem key={task.id} task={task} userColor={user.color} textColor={user.textColor} />
          ))
        ) : (
          <p className="text-sm italic py-2" style={{ color: user.textColor, opacity: 0.7 }}>
            No tasks yet
          </p>
        )}
      </div>
      
      {/* Streak and Kudos Badges */}
      {(user.currentStreak >= 3 || kudosCount > 0) && (
        <div className="flex gap-3 flex-wrap mt-4">
          {user.currentStreak >= 3 && (
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                color: user.textColor,
              }}
            >
              <span>🔥</span>
              <span>{user.currentStreak} DAYS</span>
            </div>
          )}
          
          {kudosCount > 0 && (
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                color: user.textColor,
              }}
            >
              <span>❤️</span>
              <span>{kudosCount} KUDOS</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

