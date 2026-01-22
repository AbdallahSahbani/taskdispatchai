import { cn } from '@/lib/utils';
import { ZoneCategory, ZoneStats } from './types';
import { ZONE_CATEGORY_CLASSES } from './zoneConfig';

interface ZoneSummaryItem {
  id: string;
  name: string;
  category: ZoneCategory;
  stats: ZoneStats;
}

interface ZoneSummaryGridProps {
  zones: ZoneSummaryItem[];
  onZoneClick?: (zoneId: string) => void;
}

function getStatusColor(status: ZoneStats['status']) {
  switch (status) {
    case 'urgent': return 'bg-task-urgent';
    case 'pending': return 'bg-task-pending';
    case 'clear': return 'bg-task-complete';
    default: return 'bg-muted';
  }
}

export function ZoneSummaryGrid({ zones, onZoneClick }: ZoneSummaryGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {zones.map((zone) => {
        const categoryStyles = ZONE_CATEGORY_CLASSES[zone.category];
        const statusColor = getStatusColor(zone.stats.status);
        
        return (
          <div
            key={zone.id}
            className="data-panel p-3 hover:bg-secondary/50 transition-colors cursor-pointer group"
            onClick={() => onZoneClick?.(zone.id)}
          >
            <div className="flex items-center gap-2 mb-2">
              {/* Status indicator dot */}
              <div
                className={cn(
                  'w-3 h-3 rounded-full transition-transform group-hover:scale-110',
                  statusColor,
                  zone.stats.hasUrgent && 'animate-pulse'
                )}
              />
              {/* Category color indicator */}
              <div
                className={cn(
                  'w-2 h-2 rounded-sm',
                  categoryStyles.bg
                )}
              />
              <span className="text-sm font-medium truncate flex-1">{zone.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{zone.stats.workerCount} workers</span>
              <span>•</span>
              <span className={cn(zone.stats.hasUrgent && 'text-task-urgent font-medium')}>
                {zone.stats.taskCount} tasks
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
