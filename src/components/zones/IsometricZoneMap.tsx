import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSimulationStore } from '@/stores/simulationStore';
import type { SimulatedWorker, SimulatedTask, ZoneNode } from '@/stores/simulationStore';
import { User, AlertTriangle, Activity } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import hotelFloorplan from '@/assets/hotel-floorplan.jpg';

// ============================================
// Zone hotspot positions mapped to the image
// These are percentage-based coordinates over the floorplan image
// ============================================

const ZONE_HOTSPOTS: Record<string, { x: number; y: number; w: number; h: number }> = {
  // Guest rooms - top rows (beds visible in image)
  floor_10: { x: 3, y: 4, w: 22, h: 14 },
  floor_9: { x: 27, y: 4, w: 20, h: 14 },
  floor_8: { x: 49, y: 4, w: 22, h: 14 },
  floor_7: { x: 73, y: 4, w: 22, h: 14 },
  
  // Second row of rooms
  floor_6: { x: 3, y: 20, w: 22, h: 14 },
  floor_5: { x: 27, y: 20, w: 20, h: 14 },
  floor_4_west: { x: 49, y: 20, w: 11, h: 14 },
  floor_4_east: { x: 62, y: 20, w: 11, h: 14 },
  floor_3_west: { x: 75, y: 20, w: 10, h: 14 },
  floor_3_east: { x: 87, y: 20, w: 10, h: 14 },

  // Third row
  floor_2: { x: 3, y: 36, w: 22, h: 12 },
  floor_1: { x: 27, y: 36, w: 20, h: 12 },

  // Central areas - lobby / restaurant / bar
  lobby: { x: 35, y: 40, w: 25, h: 20 },
  restaurant: { x: 20, y: 52, w: 20, h: 22 },
  fine_dining: { x: 42, y: 52, w: 16, h: 12 },
  bar: { x: 60, y: 40, w: 14, h: 14 },

  // Service areas
  service_core: { x: 3, y: 50, w: 15, h: 14 },
  linen_storage: { x: 3, y: 66, w: 12, h: 10 },
  back_of_house: { x: 60, y: 56, w: 16, h: 12 },

  // Outdoor
  pool_deck: { x: 72, y: 55, w: 18, h: 20 },
  resort_beach: { x: 72, y: 78, w: 24, h: 18 },
};

// Category color mapping
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  guest_floor: { bg: 'bg-blue-500/15', border: 'border-blue-400/40', text: 'text-blue-300' },
  public: { bg: 'bg-emerald-500/15', border: 'border-emerald-400/40', text: 'text-emerald-300' },
  f_and_b: { bg: 'bg-amber-500/15', border: 'border-amber-400/40', text: 'text-amber-300' },
  service: { bg: 'bg-violet-500/15', border: 'border-violet-400/40', text: 'text-violet-300' },
  utility: { bg: 'bg-slate-500/15', border: 'border-slate-400/40', text: 'text-slate-300' },
  outdoor: { bg: 'bg-cyan-500/15', border: 'border-cyan-400/40', text: 'text-cyan-300' },
};

interface IsometricZoneMapProps {
  className?: string;
  onZoneClick?: (zoneId: string) => void;
  onWorkerClick?: (workerId: string) => void;
}

// Zone hotspot overlay
function ZoneHotspot({
  zone,
  hotspot,
  workers,
  tasks,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: {
  zone: ZoneNode;
  hotspot: { x: number; y: number; w: number; h: number };
  workers: SimulatedWorker[];
  tasks: SimulatedTask[];
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const colors = CATEGORY_COLORS[zone.category] || CATEGORY_COLORS.utility;
  const hasUrgent = tasks.some(t => t.priority === 'urgent');
  const activeTasks = tasks.filter(t => t.status !== 'completed');

  return (
    <div
      className={cn(
        'absolute rounded-md border transition-all duration-200 cursor-pointer',
        colors.bg,
        colors.border,
        isHovered && 'z-30 shadow-lg scale-[1.02]',
        hasUrgent && 'ring-1 ring-red-500/50 animate-pulse',
        !isHovered && 'opacity-60 hover:opacity-100',
      )}
      style={{
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        width: `${hotspot.w}%`,
        height: `${hotspot.h}%`,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* Zone label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-1 pointer-events-none">
        <span className={cn('text-[9px] font-semibold truncate max-w-full', colors.text)}>
          {zone.name}
        </span>

        {/* Counts */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {workers.length > 0 && (
            <span className="flex items-center gap-0.5 text-[8px] text-emerald-400 font-mono">
              <User className="w-2.5 h-2.5" />
              {workers.length}
            </span>
          )}
          {activeTasks.length > 0 && (
            <span className={cn(
              'flex items-center gap-0.5 text-[8px] font-mono',
              hasUrgent ? 'text-red-400' : 'text-amber-400'
            )}>
              <AlertTriangle className="w-2.5 h-2.5" />
              {activeTasks.length}
            </span>
          )}
        </div>
      </div>

      {/* Hover detail */}
      {isHovered && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap bg-card/95 backdrop-blur px-2.5 py-1 rounded-md text-[10px] text-foreground shadow-xl border border-border">
          {workers.length}W · {activeTasks.length}T · {zone.category.replace('_', ' ')}
        </div>
      )}
    </div>
  );
}

// Worker dot on the map
function WorkerDot({
  worker,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: {
  worker: SimulatedWorker;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  // Map worker position to image coordinates using zone hotspot
  const hotspot = ZONE_HOTSPOTS[worker.position.zoneId];
  if (!hotspot) return null;

  // Position within the hotspot based on worker position offset
  const zone = useSimulationStore.getState().zones.find(z => z.id === worker.position.zoneId);
  if (!zone) return null;

  // Normalize worker position within zone bounds to hotspot bounds
  const relX = zone.width > 0 ? (worker.position.x - zone.x) / zone.width : 0.5;
  const relY = zone.height > 0 ? (worker.position.y - zone.y) / zone.height : 0.5;
  const mapX = hotspot.x + relX * hotspot.w;
  const mapY = hotspot.y + relY * hotspot.h;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'absolute z-40 transition-all duration-300 ease-out cursor-pointer',
            worker.status === 'moving' && 'animate-pulse',
          )}
          style={{
            left: `${mapX}%`,
            top: `${mapY}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
          onClick={onClick}
        >
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold border-2 shadow-lg',
              isHovered && 'scale-150 ring-2 ring-white/40',
              worker.status !== 'idle' ? 'border-amber-400' : 'border-white/40',
            )}
            style={{ backgroundColor: worker.color }}
          >
            <span className="text-white drop-shadow-md">{worker.initials}</span>
          </div>

          {/* Status pip */}
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background',
            worker.status === 'idle' && 'bg-emerald-500',
            worker.status === 'moving' && 'bg-blue-500',
            worker.status === 'working' && 'bg-amber-500',
          )} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-card border-border">
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-foreground">{worker.name}</p>
          <p className="text-muted-foreground capitalize">{worker.role}</p>
          <p className="text-muted-foreground font-mono text-[10px]">
            {worker.tasksCompleted} completed · {worker.avgResponseTime}s avg
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function IsometricZoneMap({ className, onZoneClick, onWorkerClick }: IsometricZoneMapProps) {
  const { zones, workers, tasks, isRunning, speed } = useSimulationStore();
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoveredWorker, setHoveredWorker] = useState<string | null>(null);

  const tasksByZone = useMemo(() => {
    const map = new Map<string, SimulatedTask[]>();
    for (const task of tasks.filter(t => t.status !== 'completed')) {
      const existing = map.get(task.zoneId) || [];
      map.set(task.zoneId, [...existing, task]);
    }
    return map;
  }, [tasks]);

  const workersByZone = useMemo(() => {
    const map = new Map<string, SimulatedWorker[]>();
    for (const worker of workers) {
      const zoneId = worker.position.zoneId;
      const existing = map.get(zoneId) || [];
      map.set(zoneId, [...existing, worker]);
    }
    return map;
  }, [workers]);

  return (
    <div className={cn('relative w-full bg-background rounded-xl overflow-hidden border border-border', className)}>
      {/* Background floorplan image */}
      <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
        <img
          src={hotelFloorplan}
          alt="Hotel floor plan"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Darkened overlay for contrast */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Zone hotspots */}
        {zones.map(zone => {
          const hotspot = ZONE_HOTSPOTS[zone.id];
          if (!hotspot) return null;

          return (
            <ZoneHotspot
              key={zone.id}
              zone={zone}
              hotspot={hotspot}
              workers={workersByZone.get(zone.id) || []}
              tasks={tasksByZone.get(zone.id) || []}
              isHovered={hoveredZone === zone.id}
              onHover={() => setHoveredZone(zone.id)}
              onLeave={() => setHoveredZone(null)}
              onClick={() => onZoneClick?.(zone.id)}
            />
          );
        })}

        {/* Worker dots */}
        {workers.map(worker => (
          <WorkerDot
            key={worker.id}
            worker={worker}
            isHovered={hoveredWorker === worker.id}
            onHover={() => setHoveredWorker(worker.id)}
            onLeave={() => setHoveredWorker(null)}
            onClick={() => onWorkerClick?.(worker.id)}
          />
        ))}
      </div>

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between px-4 pb-1.5">
        <div className="flex items-center gap-4 text-[10px] text-white/70">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Moving
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Working
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/70">
          {isRunning && (
            <span className="text-emerald-400 flex items-center gap-1 font-mono">
              <Activity className="w-3 h-3 animate-pulse" />
              LIVE {speed}x
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
