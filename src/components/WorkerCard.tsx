import { Worker, Zone } from '@/types/dispatch';
import { cn } from '@/lib/utils';
import { MapPin, Wifi, WifiOff, Star } from 'lucide-react';

interface WorkerCardProps {
  worker: Worker;
  zone?: Zone;
  tasksAssigned?: number;
  className?: string;
}

const roleLabels: Record<string, string> = {
  housekeeping: 'Housekeeping',
  maintenance: 'Maintenance',
  room_service: 'Room Service',
};

export function WorkerCard({ worker, zone, tasksAssigned = 0, className }: WorkerCardProps) {
  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'data-panel flex items-center gap-4 transition-all duration-200',
        !worker.onShift && 'opacity-50',
        className
      )}
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-medium text-sm">
          {initials}
        </div>
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card',
            worker.deviceStatus === 'online' ? 'bg-status-completed' : 'bg-muted-foreground'
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{worker.name}</span>
          {!worker.onShift && (
            <span className="text-xs text-muted-foreground">(Off Shift)</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
          <span>{roleLabels[worker.role]}</span>
          <span className="text-border">•</span>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{zone?.name || 'Unknown'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Star className="w-3.5 h-3.5" />
          <span className="font-mono">{worker.reliabilityScore}</span>
        </div>
        {worker.deviceStatus === 'online' ? (
          <Wifi className="w-4 h-4 text-status-completed" />
        ) : (
          <WifiOff className="w-4 h-4 text-muted-foreground" />
        )}
        {tasksAssigned > 0 && (
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono">
            {tasksAssigned} task{tasksAssigned > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
