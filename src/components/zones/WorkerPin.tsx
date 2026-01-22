import { cn } from '@/lib/utils';
import { WorkerStatus } from './types';
import { generateColorFromId } from './zoneConfig';

interface WorkerPinProps {
  id: string;
  name: string;
  initials: string;
  x: number;
  y: number;
  status?: WorkerStatus;
  isMoving?: boolean;
  isAssigned?: boolean;
  className?: string;
}

const STATUS_RING_COLORS: Record<WorkerStatus, string> = {
  available: 'ring-worker-available',
  busy: 'ring-worker-busy',
  onBreak: 'ring-worker-break',
  offline: 'ring-worker-offline',
};

export function WorkerPin({
  id,
  name,
  initials,
  x,
  y,
  status = 'available',
  isMoving,
  isAssigned,
  className,
}: WorkerPinProps) {
  const avatarColor = generateColorFromId(id);

  return (
    <div
      className={cn(
        'absolute z-20 transform -translate-x-1/2 -translate-y-1/2 transition-all',
        isMoving ? 'duration-500 scale-110' : 'duration-300',
        isAssigned && 'z-30',
        className
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
      title={`${name}`}
    >
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg',
          'border-2 border-white ring-2 ring-offset-1 ring-offset-transparent',
          STATUS_RING_COLORS[status],
          isMoving && 'animate-bounce',
          isAssigned && 'ring-4 ring-task-complete ring-offset-2 ring-offset-background'
        )}
        style={{ backgroundColor: avatarColor }}
      >
        {initials}
      </div>
      
      {/* Assignment ping indicator */}
      {isAssigned && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-task-complete rounded-full border border-white animate-ping" />
      )}
      
      {/* Status dot */}
      <span
        className={cn(
          'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white',
          status === 'available' && 'bg-worker-available',
          status === 'busy' && 'bg-worker-busy',
          status === 'onBreak' && 'bg-worker-break',
          status === 'offline' && 'bg-worker-offline'
        )}
      />
    </div>
  );
}
