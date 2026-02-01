import { TaskStatus, Priority } from '@/types/dispatch';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: TaskStatus;
  priority?: Priority;
  className?: string;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'status-new' },
  assigned: { label: 'Assigned', className: 'status-assigned' },
  in_progress: { label: 'In Progress', className: 'status-in-progress' },
  completed: { label: 'Done', className: 'status-completed' },
  cancelled: { label: 'Cancelled', className: 'status-completed' },
  rerouted: { label: 'Rerouted', className: 'status-urgent' },
};

export function StatusBadge({ status, priority, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const isUrgent = priority === 'urgent' && status !== 'completed';

  return (
    <span
      className={cn(
        'status-badge',
        isUrgent ? 'status-urgent' : config.className,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {isUrgent ? 'Urgent' : config.label}
    </span>
  );
}
