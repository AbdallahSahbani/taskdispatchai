import { Task, Worker, Zone } from '@/types/dispatch';
import { StatusBadge } from './StatusBadge';
import { Clock, MapPin, User, Wrench, Sparkles, Trash2, Coffee, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface TaskCardProps {
  task: Task;
  zone?: Zone;
  assignedWorker?: Worker;
  className?: string;
}

const taskTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  towels: Package,
  maintenance: Wrench,
  cleaning: Sparkles,
  trash: Trash2,
  room_service: Coffee,
};

export function TaskCard({ task, zone, assignedWorker, className }: TaskCardProps) {
  const Icon = taskTypeIcons[task.type] || Package;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-card/80 p-4 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:shadow-sm',
        task.priority === 'urgent' && task.status !== 'completed' && 'border-destructive/40 shadow-[0_0_15px_hsl(var(--destructive)/0.15)]',
        task.status === 'completed' && 'opacity-70',
        className
      )}
    >
      {/* Urgent pulse effect */}
      {task.priority === 'urgent' && task.status !== 'completed' && (
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent animate-pulse" />
      )}
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2.5 rounded-xl border',
            task.priority === 'urgent' && task.status !== 'completed'
              ? 'bg-destructive/10 border-destructive/30'
              : 'bg-secondary/50 border-border/30'
          )}>
            <Icon className={cn(
              'w-5 h-5',
              task.priority === 'urgent' && task.status !== 'completed'
                ? 'text-destructive'
                : 'text-muted-foreground'
            )} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{task.source}</span>
              <StatusBadge status={task.status} priority={task.priority} />
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
            )}
          </div>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60 whitespace-nowrap uppercase tracking-wider">
          {task.id}
        </span>
      </div>

      <div className="relative mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary/60" />
          <span>{zone?.name || 'Unknown Zone'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDistanceToNow(task.createdAt, { addSuffix: true })}</span>
        </div>
        {assignedWorker && (
          <div className="flex items-center gap-1.5 text-success">
            <User className="w-3.5 h-3.5" />
            <span className="font-medium">{assignedWorker.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
