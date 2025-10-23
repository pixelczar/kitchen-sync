import { motion } from 'framer-motion';
import { TaskItem } from './TaskItem';
import type { User, Task } from '../../types';

interface PersonCardProps {
  user: User;
  tasks: Task[];
  kudosCount: number;
  onAddTask?: () => void;
}

const cardContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const cardItem = {
  hidden: { 
    opacity: 0, 
    y: 20
  },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      duration: 0.4
    }
  }
};

const taskContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2
    }
  }
};

const taskItem = {
  hidden: { 
    opacity: 0, 
    y: 15
  },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      duration: 0.3
    }
  }
};

export const PersonCard = ({ user, tasks, kudosCount, onAddTask }: PersonCardProps) => {
  return (
    <motion.div 
      className="rounded-3xl p-6 relative h-full flex flex-col"
      style={{ backgroundColor: user.color }}
      variants={cardContainer}
      initial="hidden"
      animate="show"
    >
      {/* Quick Add Button */}
      {onAddTask && (
        <motion.button
          onClick={onAddTask}
          className="absolute top-4 right-4 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold transition-transform hover:scale-110 active:scale-95"
          style={{ 
            backgroundColor: user.color === '#F7EA31' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.1)',
            color: user.color === '#F7EA31' ? '#3C0E4D' : user.textColor 
          }}
          variants={cardItem}
        >
          +
        </motion.button>
      )}
      
      {/* Name */}
      <motion.h2
        className="text-5xl font-black tracking-tight mb-6 pr-12"
        style={{ color: user.textColor }}
        variants={cardItem}
      >
        {user.name}
      
      </motion.h2>
      
      {/* Streak Overlay */}
      {user.currentStreak >= 3 && (
        <motion.div
          className="absolute top-12 right-14 font-handwritten text-xl font-black uppercase"
          style={{
            color: user.textColor,
            transform: 'rotate(-8deg)',
            zIndex: 10
          }}
          variants={cardItem}
        >
          🔥 <span className="opacity-70">{user.currentStreak}DAY STREAK!</span> 
        </motion.div>
      )}
      
      
      {/* Task List */}
      <motion.div 
        className="space-y-2 flex-1"
        variants={taskContainer}
        initial="hidden"
        animate="show"
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <motion.div
              key={task.id}
              variants={taskItem}
            >
              <TaskItem task={task} userColor={user.color} textColor={user.textColor} />
            </motion.div>
          ))
        ) : (
          <motion.p 
            className="text-sm italic py-2" 
            style={{ color: user.textColor, opacity: 0.7 }}
            variants={taskItem}
          >
            No tasks yet
          </motion.p>
        )}
      </motion.div>
      
      {/* Kudos Badge */}
      {kudosCount > 0 && (
        <motion.div 
          className="flex gap-3 flex-wrap mt-4"
          variants={cardItem}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              color: user.textColor,
            }}
            variants={cardItem}
          >
            <span>❤️</span>
            <span>{kudosCount} KUDOS</span>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

