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
        'data-panel card-glow transition-all duration-200 hover:border-primary/30',
        task.priority === 'urgent' && task.status !== 'completed' && 'border-status-urgent/40',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-secondary/50">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{task.source}</span>
              <StatusBadge status={task.status} priority={task.priority} />
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
            )}
          </div>
        </div>
        <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
          {task.id.toUpperCase()}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span>{zone?.name || 'Unknown Zone'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDistanceToNow(task.createdAt, { addSuffix: true })}</span>
        </div>
        {assignedWorker && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            <span>{assignedWorker.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
