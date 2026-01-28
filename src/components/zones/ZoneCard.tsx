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
        'absolute rounded-md border-2 transition-all duration-300 cursor-pointer overflow-hidden',
        'hover:scale-[1.02] hover:z-10 hover:shadow-lg',
        categoryStyles.gradient,
        stats.hasUrgent 
          ? 'border-task-urgent animate-pulse-urgent shadow-[0_0_15px_hsl(var(--task-urgent)/0.4)]' 
          : stats.taskCount > 0 
            ? categoryStyles.border 
            : 'border-border/30',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isAssignmentTarget && 'ring-4 ring-task-complete ring-opacity-50 shadow-[0_0_20px_hsl(var(--task-complete)/0.4)]',
        className
      )}
      style={style}
      onClick={onClick}
    >
      {/* Urgent task pulse overlay */}
      {stats.hasUrgent && (
        <div className="absolute inset-0 bg-task-urgent/10 animate-pulse" />
      )}
      
      <div className="absolute inset-0 p-1.5 flex flex-col justify-between">
        {/* Header: Zone name and task indicators */}
        <div className="flex items-start justify-between gap-1">
          <span className="text-[10px] font-semibold text-white drop-shadow-md truncate leading-tight flex-1">
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
            <div className="flex items-center justify-center opacity-30">
              <span className="text-muted-foreground text-[8px]">No activity</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
