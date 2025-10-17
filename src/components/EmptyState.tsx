import { motion } from 'framer-motion';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  emoji,
  title,
  description,
  action,
  className = ''
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 ${className}`}
    >
      <motion.div
        className="text-8xl tracking-tight mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        {emoji}
      </motion.div>
      
      <h3 className="text-3xl font-black text-charcoal mb-3">
        {title}
      </h3>
      
      <p className="text-lg text-gray-medium mb-8 max-w-md text-center">
        {description}
      </p>
      
      {action && (
        <motion.button
          onClick={action.onClick}
          className="bg-blue text-cream px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};

// Pre-built empty states for common scenarios
export const NoTasksEmpty = ({ onAddTask }: { onAddTask: () => void }) => (
  <EmptyState
    emoji="✨"
    title="All done!"
    description="No tasks to show right now. Take a breather or add a new one."
    action={{
      label: "Add Task",
      onClick: onAddTask
    }}
  />
);

export const NoEventsEmpty = ({ onAddEvent }: { onAddEvent: () => void }) => (
  <EmptyState
    emoji="📅"
    title="Nothing planned"
    description="Your calendar is clear. Want to add an event?"
    action={{
      label: "Add Event",
      onClick: onAddEvent
    }}
  />
);

export const NoFamilyEmpty = () => (
  <EmptyState
    emoji="👥"
    title="No family members"
    description="Add family members to get started with KitchenSync."
  />
);

