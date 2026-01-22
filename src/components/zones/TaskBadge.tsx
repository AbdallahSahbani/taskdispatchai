import { cn } from '@/lib/utils';

type TaskBadgeType = 'urgent' | 'high' | 'pending' | 'inProgress' | 'completed';

interface TaskBadgeProps {
  count: number;
  type: TaskBadgeType;
  className?: string;
}

const BADGE_STYLES: Record<TaskBadgeType, { bg: string; text: string; icon: string; glow?: string; pulse?: boolean }> = {
  urgent: {
    bg: 'bg-task-urgent',
    text: 'text-white',
    icon: '🚨',
    glow: 'shadow-[0_0_12px_hsl(var(--task-urgent)/0.5)]',
    pulse: true,
  },
  high: {
    bg: 'bg-task-high',
    text: 'text-white',
    icon: '⚡',
    glow: 'shadow-[0_0_8px_hsl(var(--task-high)/0.4)]',
  },
  pending: {
    bg: 'bg-task-pending',
    text: 'text-black',
    icon: '📋',
  },
  inProgress: {
    bg: 'bg-task-progress',
    text: 'text-white',
    icon: '🔄',
    glow: 'shadow-[0_0_6px_hsl(var(--task-progress)/0.3)]',
  },
  completed: {
    bg: 'bg-task-complete',
    text: 'text-white',
    icon: '✅',
  },
};

export function TaskBadge({ count, type, className }: TaskBadgeProps) {
  const styles = BADGE_STYLES[type];

  if (count === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        styles.bg,
        styles.text,
        styles.glow,
        styles.pulse && 'animate-pulse-urgent',
        className
      )}
    >
      <span className="text-[10px]">{styles.icon}</span>
      <span>{count}</span>
    </span>
  );
}

interface TaskIndicatorProps {
  urgentCount: number;
  pendingCount: number;
  inProgressCount?: number;
  size?: 'sm' | 'md';
}

export function TaskIndicator({ urgentCount, pendingCount, inProgressCount = 0, size = 'sm' }: TaskIndicatorProps) {
  const sizeClass = size === 'sm' ? 'text-[10px]' : 'text-xs';
  
  return (
    <div className={cn('flex items-center gap-1', sizeClass)}>
      {urgentCount > 0 && <TaskBadge count={urgentCount} type="urgent" />}
      {inProgressCount > 0 && <TaskBadge count={inProgressCount} type="inProgress" />}
      {pendingCount > 0 && <TaskBadge count={pendingCount} type="pending" />}
    </div>
  );
}
