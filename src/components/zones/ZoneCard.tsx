import { cn } from '@/lib/utils';
import { ZoneCategory, ZoneStats, WorkerStatus } from './types';
import { ZONE_CATEGORY_CLASSES } from './zoneConfig';
import { WorkerMarkerGroup } from './WorkerMarker';
import { TaskIndicator } from './TaskBadge';

interface ZoneCardProps {
  zoneId: string;
  zoneName: string;
  category: ZoneCategory;
  workers: Array<{ id: string; name: string; status?: WorkerStatus; hasActiveTask?: boolean }>;
  stats: ZoneStats;
  isSelected?: boolean;
  isAssignmentTarget?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function ZoneCard({
  zoneId,
  zoneName,
  category,
  workers,
  stats,
  isSelected,
  isAssignmentTarget,
  style,
  className,
  onClick,
}: ZoneCardProps) {
  const categoryStyles = ZONE_CATEGORY_CLASSES[category];
  
  return (
    <div
      className={cn(
        'absolute rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm',
        'hover:scale-[1.02] hover:z-10 hover:shadow-xl',
        categoryStyles.gradient,
        stats.hasUrgent 
          ? 'border-destructive animate-pulse shadow-[0_0_20px_hsl(var(--destructive)/0.35)]' 
          : stats.taskCount > 0 
            ? categoryStyles.border 
            : 'border-border/40',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isAssignmentTarget && 'ring-4 ring-success ring-opacity-60 shadow-[0_0_25px_hsl(var(--success)/0.4)]',
        className
      )}
      style={style}
      onClick={onClick}
    >
      {/* Urgent task pulse overlay */}
      {stats.hasUrgent && (
        <div className="absolute inset-0 bg-destructive/10 animate-pulse" />
      )}
      
      <div className="absolute inset-0 p-2 flex flex-col justify-between">
        {/* Header: Zone name and task indicators */}
        <div className="flex items-start justify-between gap-1">
          <span className="text-[10px] font-semibold text-white/90 drop-shadow-lg truncate leading-tight flex-1 font-display">
            {zoneName}
          </span>
          
          {/* Task indicators */}
          {stats.taskCount > 0 && (
            <TaskIndicator 
              urgentCount={stats.urgentCount} 
              pendingCount={stats.taskCount - stats.urgentCount} 
              size="sm"
            />
          )}
        </div>
        
        {/* Workers area - positioned inside zone */}
        {workers.length > 0 ? (
          <WorkerMarkerGroup workers={workers} max={4} size="sm" />
        ) : (
          stats.taskCount === 0 && (
            <div className="flex items-center justify-center opacity-40">
              <span className="text-white/60 text-[8px] uppercase tracking-wider">Empty</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
