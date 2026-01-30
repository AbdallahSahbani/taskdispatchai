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
        'relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-card/80 p-4 backdrop-blur-sm transition-all duration-200 hover:border-primary/30',
        !worker.onShift && 'opacity-50',
        worker.deviceStatus === 'online' && 'border-border/50',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center font-medium text-sm border',
            worker.deviceStatus === 'online'
              ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 text-primary'
              : 'bg-secondary border-border/30 text-muted-foreground'
          )}>
            {initials}
          </div>
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card',
              worker.deviceStatus === 'online' ? 'bg-success animate-pulse' : 'bg-muted-foreground'
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">{worker.name}</span>
            {!worker.onShift && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">(Off Shift)</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{roleLabels[worker.role]}</span>
            <span className="text-border/50">•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary/60" />
              <span className="truncate text-xs">{zone?.name || 'Unknown'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1 text-primary/80">
            <Star className="w-3.5 h-3.5" />
            <span className="font-mono text-xs">{worker.reliabilityScore?.toFixed(2) || '0.85'}</span>
          </div>
          {worker.deviceStatus === 'online' ? (
            <Wifi className="w-4 h-4 text-success" />
          ) : (
            <WifiOff className="w-4 h-4 text-muted-foreground" />
          )}
          {tasksAssigned > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-medium">
              {tasksAssigned} task{tasksAssigned > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
