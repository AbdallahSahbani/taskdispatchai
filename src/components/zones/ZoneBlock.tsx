import { cn } from '@/lib/utils';
import { WorkerMarkerGroup } from './WorkerMarker';
import { ZoneCategory, ZoneStats, WorkerStatus } from './types';

interface ZoneBlockProps {
  zoneId: string;
  zoneName: string;
  category: ZoneCategory;
  workers: Array<{
    id: string;
    name: string;
    status?: WorkerStatus;
    hasActiveTask?: boolean;
  }>;
  stats: ZoneStats;
  onClick?: () => void;
  className?: string;
}

const ZONE_STYLES: Record<ZoneCategory, {
  bg: string;
  border: string;
  activeBorder: string;
}> = {
  guestFloors: {
    bg: 'bg-gradient-to-br from-slate-700 to-slate-800',
    border: 'border-slate-600',
    activeBorder: 'border-blue-500'
  },
  publicAreas: {
    bg: 'bg-gradient-to-br from-teal-800 to-teal-900',
    border: 'border-teal-700',
    activeBorder: 'border-teal-400'
  },
  foodBeverage: {
    bg: 'bg-gradient-to-br from-amber-800 to-amber-900',
    border: 'border-amber-700',
    activeBorder: 'border-amber-400'
  },
  backOfHouse: {
    bg: 'bg-gradient-to-br from-purple-800 to-purple-900',
    border: 'border-purple-700',
    activeBorder: 'border-purple-400'
  },
  outdoor: {
    bg: 'bg-gradient-to-br from-green-800 to-green-900',
    border: 'border-green-700',
    activeBorder: 'border-green-400'
  },
  utility: {
    bg: 'bg-gradient-to-br from-gray-700 to-gray-800',
    border: 'border-gray-600',
    activeBorder: 'border-gray-400'
  }
};

export function ZoneBlock({
  zoneId,
  zoneName,
  category,
  workers,
  stats,
  onClick,
  className
}: ZoneBlockProps) {
  const styles = ZONE_STYLES[category];
  const hasActivity = workers.length > 0 || stats.taskCount > 0;
  const hasUrgent = stats.status === 'urgent';
  
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative h-full min-h-[80px] rounded-xl p-3 transition-all duration-200 cursor-pointer',
        styles.bg,
        'border-2',
        hasActivity ? styles.activeBorder : styles.border,
        'hover:scale-[1.02] hover:shadow-lg',
        hasUrgent && 'ring-2 ring-task-urgent/50 animate-pulse-slow',
        className
      )}
    >
      {/* Zone name header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold text-sm truncate">{zoneName}</h3>
        
        {/* Task indicators */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {stats.taskCount > 0 && stats.status !== 'urgent' && (
            <span className="flex items-center gap-1 bg-task-pending/20 text-task-pending text-[10px] px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-task-pending rounded-full" />
              {stats.taskCount}
            </span>
          )}
          {hasUrgent && (
            <span className="flex items-center gap-1 bg-task-urgent/20 text-task-urgent text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 bg-task-urgent rounded-full" />
              {stats.urgentCount}
            </span>
          )}
        </div>
      </div>
      
      {/* Workers area - positioned inside zone */}
      {workers.length > 0 ? (
        <WorkerMarkerGroup 
          workers={workers}
          max={4}
          size="sm"
        />
      ) : (
        /* Empty state */
        stats.taskCount === 0 && (
          <div className="flex items-center justify-center h-[calc(100%-32px)] opacity-30">
            <span className="text-muted-foreground text-xs">No activity</span>
          </div>
        )
      )}
    </div>
  );
}
