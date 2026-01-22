import { cn } from '@/lib/utils';
import { WorkerStatus } from './types';

interface WorkerMarkerProps {
  id: string;
  name: string;
  status?: WorkerStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  hasActiveTask?: boolean;
}

const STATUS_COLORS: Record<WorkerStatus, string> = {
  available: 'hsl(var(--worker-available))',
  busy: 'hsl(var(--worker-busy))',
  onBreak: 'hsl(var(--worker-break))',
  offline: 'hsl(var(--worker-offline))'
};

const SIZE_CONFIG = {
  sm: { icon: 16, text: 'text-[9px]', gap: 'gap-0.5', padding: 'px-1 py-0.5' },
  md: { icon: 20, text: 'text-[10px]', gap: 'gap-1', padding: 'px-1.5 py-0.5' },
  lg: { icon: 24, text: 'text-xs', gap: 'gap-1', padding: 'px-2 py-1' }
};

export function WorkerMarker({ 
  id,
  name, 
  status = 'available', 
  size = 'md',
  className,
  hasActiveTask
}: WorkerMarkerProps) {
  const config = SIZE_CONFIG[size];
  const iconColor = STATUS_COLORS[status];
  const firstName = name.split(' ')[0];
  
  return (
    <div className={cn('flex flex-col items-center', config.gap, className)}>
      {/* Worker name above */}
      <span 
        className={cn(
          config.text,
          config.padding,
          'font-medium text-foreground bg-background/90 rounded whitespace-nowrap shadow-sm border border-border/50'
        )}
      >
        {firstName}
      </span>
      
      {/* Human icon */}
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
        
        {/* Task indicator dot */}
        {hasActiveTask && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-task-progress rounded-full border border-background animate-pulse" />
        )}
      </div>
    </div>
  );
}

// More detailed human icon variant
export function WorkerIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none"
      className="drop-shadow-lg"
    >
      {/* Shadow/base */}
      <ellipse cx="16" cy="30" rx="6" ry="2" fill="rgba(0,0,0,0.3)" />
      
      {/* Body */}
      <path 
        d="M8 28v-4c0-4.4 3.6-8 8-8s8 3.6 8 8v4H8z" 
        fill={color}
      />
      
      {/* Head */}
      <circle cx="16" cy="10" r="6" fill={color} />
      
      {/* Face highlight */}
      <circle cx="16" cy="9" r="4.5" fill="rgba(255,255,255,0.15)" />
    </svg>
  );
}

// Group of workers in a zone
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
  const visible = workers.slice(0, max);
  const overflow = workers.length - max;
  
  return (
    <div className="flex flex-wrap gap-3">
      {visible.map((worker) => (
        <WorkerMarker
          key={worker.id}
          id={worker.id}
          name={worker.name}
          status={worker.status}
          size={size}
          hasActiveTask={worker.hasActiveTask}
        />
      ))}
      {overflow > 0 && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            +{overflow}
          </span>
        </div>
      )}
    </div>
  );
}
