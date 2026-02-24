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

// Zone category visual config using design tokens
const ZONE_VISUALS: Record<string, {
  wallColor: string;
  floorColor: string;
  roofColor: string;
  accent: string;
  label: string;
}> = {
  guest_floor: {
    wallColor: 'hsl(222, 45%, 28%)',
    floorColor: 'hsl(222, 40%, 18%)',
    roofColor: 'hsl(222, 45%, 24%)',
    accent: 'hsl(210, 70%, 50%)',
    label: 'text-zone-floor-border',
  },
  public: {
    wallColor: 'hsl(173, 50%, 28%)',
    floorColor: 'hsl(173, 45%, 18%)',
    roofColor: 'hsl(173, 50%, 24%)',
    accent: 'hsl(173, 58%, 45%)',
    label: 'text-zone-public-border',
  },
  f_and_b: {
    wallColor: 'hsl(35, 65%, 30%)',
    floorColor: 'hsl(35, 60%, 20%)',
    roofColor: 'hsl(35, 65%, 26%)',
    accent: 'hsl(43, 74%, 49%)',
    label: 'text-zone-food-border',
  },
  service: {
    wallColor: 'hsl(280, 35%, 28%)',
    floorColor: 'hsl(280, 30%, 18%)',
    roofColor: 'hsl(280, 35%, 24%)',
    accent: 'hsl(280, 60%, 60%)',
    label: 'text-zone-service-border',
  },
  utility: {
    wallColor: 'hsl(222, 15%, 30%)',
    floorColor: 'hsl(222, 12%, 20%)',
    roofColor: 'hsl(222, 15%, 26%)',
    accent: 'hsl(222, 15%, 55%)',
    label: 'text-zone-utility-border',
  },
  outdoor: {
    wallColor: 'hsl(158, 45%, 28%)',
    floorColor: 'hsl(158, 40%, 18%)',
    roofColor: 'hsl(158, 45%, 24%)',
    accent: 'hsl(158, 64%, 42%)',
    label: 'text-zone-outdoor-border',
  },
};

const WALL_HEIGHT = 8; // px for the 3D wall effect

interface IsometricZoneMapProps {
  className?: string;
  onZoneClick?: (zoneId: string) => void;
  onWorkerClick?: (workerId: string) => void;
}

// Single isometric zone block with 3D walls
function IsometricZone({
  zone,
  workers,
  tasks,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: {
  zone: ZoneNode;
  workers: SimulatedWorker[];
  tasks: SimulatedTask[];
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const visuals = ZONE_VISUALS[zone.category] || ZONE_VISUALS.utility;
  const hasUrgent = tasks.some(t => t.priority === 'urgent');
  const activeTasks = tasks.filter(t => t.status !== 'completed');

  return (
    <div
      className={cn(
        'absolute transition-all duration-300 cursor-pointer group',
        isHovered && 'z-30',
      )}
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* 3D block container */}
      <div
        className="relative w-full h-full"
        style={{
          transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Right wall (3D depth) */}
        <div
          className="absolute right-0 bottom-0 w-full overflow-hidden"
          style={{
            height: `${WALL_HEIGHT}px`,
            transform: `translateY(${WALL_HEIGHT}px) skewX(-45deg)`,
            transformOrigin: 'top left',
            background: `linear-gradient(180deg, ${visuals.wallColor}, ${visuals.floorColor})`,
            opacity: isHovered ? 0.9 : 0.7,
          }}
        />

        {/* Bottom wall (3D depth) */}
        <div
          className="absolute left-0 bottom-0 h-full overflow-hidden"
          style={{
            width: `${WALL_HEIGHT}px`,
            transform: `translateX(-${WALL_HEIGHT}px) skewY(-45deg)`,
            transformOrigin: 'top right',
            background: `linear-gradient(90deg, ${visuals.floorColor}, ${visuals.wallColor})`,
            opacity: isHovered ? 0.8 : 0.6,
          }}
        />

        {/* Top face (main surface) */}
        <div
          className={cn(
            'absolute inset-0 rounded-sm border overflow-hidden transition-all duration-200',
            hasUrgent && 'ring-1 ring-status-urgent/60',
            isHovered && 'ring-1 ring-foreground/20',
          )}
          style={{
            background: `linear-gradient(135deg, ${visuals.roofColor}, ${visuals.floorColor})`,
            borderColor: isHovered ? visuals.accent : `${visuals.wallColor}`,
            boxShadow: isHovered
              ? `0 8px 30px -5px ${visuals.accent}40, inset 0 1px 0 ${visuals.accent}20`
              : `0 2px 8px -2px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Floor texture pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 8px,
                rgba(255,255,255,0.3) 8px,
                rgba(255,255,255,0.3) 9px
              ), repeating-linear-gradient(
                0deg,
                transparent,
                transparent 8px,
                rgba(255,255,255,0.3) 8px,
                rgba(255,255,255,0.3) 9px
              )`,
            }}
          />

          {/* Zone header bar */}
          <div className="relative flex items-center justify-between px-1.5 py-0.5 h-full min-h-0">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {/* Category dot */}
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: visuals.accent }}
              />
              <span className={cn(
                'text-[9px] font-medium truncate',
                visuals.label,
              )}>
                {zone.name}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {workers.length > 0 && (
                <span className="flex items-center gap-0.5 text-[8px] text-success font-mono">
                  <User className="w-2.5 h-2.5" />
                  {workers.length}
                </span>
              )}
              {activeTasks.length > 0 && (
                <span className={cn(
                  'flex items-center gap-0.5 text-[8px] font-mono',
                  hasUrgent ? 'text-status-urgent' : 'text-warning'
                )}>
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {activeTasks.length}
                </span>
              )}
            </div>
          </div>

          {/* Task indicator dots */}
          {activeTasks.length > 0 && (
            <div className="absolute bottom-0.5 left-1.5 flex gap-0.5">
              {activeTasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    task.priority === 'urgent' && 'bg-status-urgent animate-pulse',
                    task.priority === 'high' && 'bg-task-high',
                    task.priority === 'normal' && 'bg-info',
                    task.priority === 'low' && 'bg-muted-foreground',
                  )}
                />
              ))}
              {activeTasks.length > 5 && (
                <span className="text-[7px] text-muted-foreground font-mono">+{activeTasks.length - 5}</span>
              )}
            </div>
          )}

          {/* Hover detail overlay */}
          {isHovered && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
              <div className="flex items-center justify-between text-[8px] text-foreground/80">
                <span className="font-mono">{zone.floor ? `F${zone.floor}` : zone.category.replace('_', ' ').toUpperCase()}</span>
                <span className="font-mono">
                  {workers.length}W / {activeTasks.length}T
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
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
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'absolute z-20 transition-all duration-300 ease-out cursor-pointer',
            worker.status === 'moving' && 'animate-pulse',
          )}
          style={{
            left: `${worker.position.x}%`,
            top: `${worker.position.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
          onClick={onClick}
        >
          <div
            className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold border-2 shadow-lg',
              isHovered && 'scale-150 ring-2 ring-foreground/30',
              worker.status !== 'idle' ? 'border-warning' : 'border-muted',
            )}
            style={{ backgroundColor: worker.color }}
          >
            <span className="text-white drop-shadow-md">{worker.initials}</span>
          </div>

          {/* Status pip */}
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background',
            worker.status === 'idle' && 'bg-success',
            worker.status === 'moving' && 'bg-info',
            worker.status === 'working' && 'bg-warning',
          )} />

          {isHovered && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-card px-1.5 py-0.5 rounded text-[9px] text-foreground shadow-lg border border-border">
              {worker.name}
            </div>
          )}
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
      {/* Isometric container with perspective */}
      <div
        className="relative w-full"
        style={{
          aspectRatio: '2 / 1.15',
          perspective: '1200px',
        }}
      >
        {/* The isometric plane */}
        <div
          className="absolute inset-0"
          style={{
            transform: 'rotateX(35deg) rotateZ(-10deg) scale(0.85)',
            transformOrigin: 'center center',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Ground plane shadow */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, hsl(var(--muted) / 0.3), transparent 70%)',
              filter: 'blur(20px)',
              transform: 'translateZ(-20px)',
            }}
          />

          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
              backgroundSize: '2.5% 5%',
            }}
          />

          {/* Elevator shaft */}
          <div
            className="absolute border border-dashed border-border/30 rounded flex items-center justify-center"
            style={{
              left: '48%',
              top: '3%',
              width: '4%',
              bottom: '22%',
            }}
          >
            <span className="text-[7px] text-muted-foreground/50 -rotate-90 whitespace-nowrap font-mono tracking-widest">
              ELEVATOR
            </span>
          </div>

          {/* Zone blocks */}
          {zones.map(zone => (
            <IsometricZone
              key={zone.id}
              zone={zone}
              workers={workersByZone.get(zone.id) || []}
              tasks={tasksByZone.get(zone.id) || []}
              isHovered={hoveredZone === zone.id}
              onHover={() => setHoveredZone(zone.id)}
              onLeave={() => setHoveredZone(null)}
              onClick={() => onZoneClick?.(zone.id)}
            />
          ))}

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

          {/* Movement path lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <marker id="iso-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="hsl(var(--info))" fillOpacity="0.6" />
              </marker>
            </defs>
            {workers
              .filter(w => w.status === 'moving' && w.path.length > 0)
              .map(worker => {
                const pathPoints = [worker.position, ...worker.path.slice(worker.pathIndex)];
                if (pathPoints.length < 2) return null;

                const pathData = pathPoints
                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}%`)
                  .join(' ');

                return (
                  <path
                    key={`path-${worker.id}`}
                    d={pathData}
                    fill="none"
                    stroke="hsl(var(--info))"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    strokeOpacity="0.4"
                    markerEnd="url(#iso-arrow)"
                  />
                );
              })}
          </svg>
        </div>
      </div>

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-t from-background to-transparent flex items-end justify-between px-4 pb-1.5">
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-info" />
            Moving
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-warning" />
            Working
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {isRunning && (
            <span className="text-success flex items-center gap-1 font-mono">
              <Activity className="w-3 h-3 animate-pulse" />
              LIVE {speed}x
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
