import { cn } from '@/lib/utils';
import { WorkerStatus } from './types';

interface WorkerMarkerProps {
  id: string;
  name: string;
  status?: WorkerStatus;
  hasActiveTask?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CONFIG = {
  sm: { icon: 14, text: 'text-[8px]', gap: 'gap-0.5', container: 'min-w-[32px]' },
  md: { icon: 18, text: 'text-[10px]', gap: 'gap-0.5', container: 'min-w-[40px]' },
  lg: { icon: 24, text: 'text-xs', gap: 'gap-1', container: 'min-w-[48px]' },
};

const STATUS_COLORS: Record<WorkerStatus, string> = {
  available: 'hsl(var(--worker-available))',
  busy: 'hsl(var(--worker-busy))',
  onBreak: 'hsl(var(--worker-break))',
  offline: 'hsl(var(--worker-offline))',
};

export function WorkerMarker({
  id,
  name,
  status = 'available',
  hasActiveTask = false,
  size = 'md',
  className,
}: WorkerMarkerProps) {
  const config = SIZE_CONFIG[size];
  const iconColor = STATUS_COLORS[status];
  const firstName = name.split(' ')[0];

  return (
    <div className={cn('flex flex-col items-center', config.gap, config.container, className)}>
      {/* Worker name above */}
      <span
        className={cn(
          config.text,
          'font-medium text-white bg-background/80 px-1 py-0.5 rounded whitespace-nowrap truncate max-w-full'
        )}
      >
        {firstName}
      </span>

      {/* Human silhouette icon */}
      <div className="relative">
        <svg
          width={config.icon}
          height={config.icon}
          viewBox="0 0 24 24"
          fill={iconColor}
          className="drop-shadow-md"
        >
          {/* Head */}
          <circle cx="12" cy="6" r="4" />
          {/* Body */}
          <path d="M12 12c-4 0-7 2-7 5v3h14v-3c0-3-3-5-7-5z" />
        </svg>

        {/* Active task indicator dot */}
        {hasActiveTask && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-task-progress rounded-full border border-background animate-pulse" />
        )}
      </div>
    </div>
  );
}

interface WorkerMarkerGroupProps {
  workers: Array<{
    id: string;
    name: string;
    status?: WorkerStatus;
    hasActiveTask?: boolean;
  }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function WorkerMarkerGroup({ workers, max = 4, size = 'sm' }: WorkerMarkerGroupProps) {
  const visibleWorkers = workers.slice(0, max);
  const overflow = workers.length - max;

  return (
    <div className="flex items-end gap-1 flex-wrap">
      {visibleWorkers.map((worker) => (
        <WorkerMarker
          key={worker.id}
          id={worker.id}
          name={worker.name}
          status={worker.status}
          hasActiveTask={worker.hasActiveTask}
          size={size}
        />
      ))}
      {overflow > 0 && (
        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1 py-0.5 rounded">
          +{overflow}
        </span>
      )}
    </div>
  );
}
