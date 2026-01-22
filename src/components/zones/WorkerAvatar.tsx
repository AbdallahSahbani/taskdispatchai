import { cn } from '@/lib/utils';
import { WorkerStatus } from './types';
import { generateColorFromId } from './zoneConfig';

interface WorkerAvatarProps {
  id: string;
  name: string;
  status?: WorkerStatus;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

const STATUS_RING_COLORS: Record<WorkerStatus, string> = {
  available: 'ring-worker-available',
  busy: 'ring-worker-busy',
  onBreak: 'ring-worker-break',
  offline: 'ring-worker-offline',
};

const STATUS_DOT_COLORS: Record<WorkerStatus, string> = {
  available: 'bg-worker-available',
  busy: 'bg-worker-busy',
  onBreak: 'bg-worker-break',
  offline: 'bg-worker-offline',
};

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

const STATUS_DOT_SIZES = {
  sm: 'w-2 h-2 -bottom-0.5 -right-0.5',
  md: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
  lg: 'w-3 h-3 -bottom-0.5 -right-0.5',
};

export function WorkerAvatar({
  id,
  name,
  status = 'available',
  size = 'md',
  showStatus = true,
  className,
}: WorkerAvatarProps) {
  // Generate initials from name
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate consistent avatar color from ID
  const avatarColor = generateColorFromId(id);

  return (
    <div className={cn('relative inline-flex', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-semibold text-white shadow-md ring-2 ring-offset-1 ring-offset-background',
          SIZE_CLASSES[size],
          STATUS_RING_COLORS[status]
        )}
        style={{ backgroundColor: avatarColor }}
        title={`${name} (${status})`}
      >
        {initials}
      </div>
      {showStatus && (
        <span
          className={cn(
            'absolute rounded-full border-2 border-background',
            STATUS_DOT_SIZES[size],
            STATUS_DOT_COLORS[status]
          )}
        />
      )}
    </div>
  );
}

interface WorkerAvatarGroupProps {
  workers: Array<{ id: string; name: string; status?: WorkerStatus }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function WorkerAvatarGroup({ workers, max = 3, size = 'sm' }: WorkerAvatarGroupProps) {
  const visibleWorkers = workers.slice(0, max);
  const overflow = workers.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visibleWorkers.map((worker) => (
        <WorkerAvatar
          key={worker.id}
          id={worker.id}
          name={worker.name}
          status={worker.status}
          size={size}
          showStatus={false}
          className="ring-2 ring-background"
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'rounded-full flex items-center justify-center font-medium bg-muted text-muted-foreground ring-2 ring-background',
            SIZE_CLASSES[size]
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
