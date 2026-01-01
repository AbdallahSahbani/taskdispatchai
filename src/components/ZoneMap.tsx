import { Zone, Worker, Task } from '@/types/dispatch';
import { cn } from '@/lib/utils';

interface ZoneMapProps {
  zones: Zone[];
  workers: Worker[];
  tasks: Task[];
  className?: string;
}

const zonePositions: Record<string, { x: number; y: number; width: number; height: number }> = {
  'lobby': { x: 35, y: 80, width: 30, height: 15 },
  'pool': { x: 70, y: 80, width: 25, height: 15 },
  'floor-1-west': { x: 5, y: 60, width: 30, height: 15 },
  'floor-1-east': { x: 65, y: 60, width: 30, height: 15 },
  'floor-2-west': { x: 5, y: 42, width: 30, height: 15 },
  'floor-2-east': { x: 65, y: 42, width: 30, height: 15 },
  'floor-3-west': { x: 5, y: 24, width: 30, height: 15 },
  'floor-3-east': { x: 65, y: 24, width: 30, height: 15 },
  'floor-4-west': { x: 5, y: 6, width: 30, height: 15 },
  'floor-4-east': { x: 65, y: 6, width: 30, height: 15 },
};

export function ZoneMap({ zones, workers, tasks, className }: ZoneMapProps) {
  const getZoneStats = (zoneId: string) => {
    const zoneWorkers = workers.filter(w => w.currentZoneId === zoneId && w.onShift);
    const zoneTasks = tasks.filter(t => t.zoneId === zoneId && t.status !== 'completed');
    const urgentTasks = zoneTasks.filter(t => t.priority === 'urgent');
    return { workers: zoneWorkers.length, tasks: zoneTasks.length, urgent: urgentTasks.length };
  };

  return (
    <div className={cn('data-panel', className)}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Zone Overview</h3>
      <div className="relative w-full aspect-[4/3] bg-secondary/30 rounded-lg overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid-lines opacity-30" />
        
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--border))" stopOpacity="0.2" />
              <stop offset="50%" stopColor="hsl(var(--border))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--border))" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {/* Vertical connectors */}
          <line x1="50" y1="13" x2="50" y2="80" stroke="url(#lineGradient)" strokeWidth="0.3" strokeDasharray="1,1" />
          {/* West stack */}
          <line x1="20" y1="21" x2="20" y2="75" stroke="url(#lineGradient)" strokeWidth="0.3" />
          {/* East stack */}
          <line x1="80" y1="21" x2="80" y2="75" stroke="url(#lineGradient)" strokeWidth="0.3" />
          {/* Floor connections */}
          <line x1="35" y1="67" x2="65" y2="67" stroke="url(#lineGradient)" strokeWidth="0.3" />
          <line x1="35" y1="49" x2="65" y2="49" stroke="url(#lineGradient)" strokeWidth="0.3" />
          <line x1="35" y1="31" x2="65" y2="31" stroke="url(#lineGradient)" strokeWidth="0.3" />
          <line x1="35" y1="13" x2="65" y2="13" stroke="url(#lineGradient)" strokeWidth="0.3" />
        </svg>

        {/* Zones */}
        {zones.map((zone) => {
          const pos = zonePositions[zone.id];
          if (!pos) return null;
          
          const stats = getZoneStats(zone.id);
          const hasUrgent = stats.urgent > 0;

          return (
            <div
              key={zone.id}
              className={cn(
                'absolute rounded border bg-card/80 backdrop-blur-sm p-2 transition-all duration-200 hover:bg-card cursor-pointer',
                hasUrgent ? 'border-status-urgent/50' : 'border-border/50',
                hasUrgent && 'animate-pulse-slow'
              )}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${pos.width}%`,
                height: `${pos.height}%`,
              }}
            >
              <div className="flex items-center justify-between h-full">
                <span className="text-[10px] font-medium text-foreground/80 truncate">
                  {zone.name}
                </span>
                <div className="flex items-center gap-1.5">
                  {stats.workers > 0 && (
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-status-completed/20 text-status-completed">
                      {stats.workers}W
                    </span>
                  )}
                  {stats.tasks > 0 && (
                    <span className={cn(
                      'text-[9px] font-mono px-1 py-0.5 rounded',
                      hasUrgent ? 'bg-status-urgent/20 text-status-urgent' : 'bg-status-new/20 text-status-new'
                    )}>
                      {stats.tasks}T
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
