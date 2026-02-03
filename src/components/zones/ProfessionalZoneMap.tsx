import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSimulationStore } from '@/stores/simulationStore';
import { User, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Zone category styling with professional dark theme
const ZONE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  guest_floor: {
    bg: 'bg-slate-800/60',
    border: 'border-slate-600/50',
    text: 'text-slate-300',
  },
  public: {
    bg: 'bg-zinc-700/60',
    border: 'border-zinc-500/50',
    text: 'text-zinc-200',
  },
  f_and_b: {
    bg: 'bg-stone-700/60',
    border: 'border-amber-600/40',
    text: 'text-amber-100',
  },
  service: {
    bg: 'bg-neutral-800/60',
    border: 'border-neutral-600/50',
    text: 'text-neutral-300',
  },
  utility: {
    bg: 'bg-neutral-900/60',
    border: 'border-neutral-700/50',
    text: 'text-neutral-400',
  },
  outdoor: {
    bg: 'bg-slate-700/50',
    border: 'border-cyan-600/40',
    text: 'text-cyan-100',
  },
};

const PRIORITY_COLORS = {
  low: 'bg-slate-500',
  normal: 'bg-blue-500',
  high: 'bg-amber-500',
  urgent: 'bg-red-500 animate-pulse',
};

const STATUS_COLORS = {
  idle: 'bg-emerald-500',
  moving: 'bg-blue-500',
  working: 'bg-amber-500',
};

interface ProfessionalZoneMapProps {
  className?: string;
  showWorkers?: boolean;
  showTasks?: boolean;
  onZoneClick?: (zoneId: string) => void;
  onWorkerClick?: (workerId: string) => void;
}

export function ProfessionalZoneMap({
  className,
  showWorkers = true,
  showTasks = true,
  onZoneClick,
  onWorkerClick,
}: ProfessionalZoneMapProps) {
  const { zones, workers, tasks, isRunning, speed } = useSimulationStore();
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoveredWorker, setHoveredWorker] = useState<string | null>(null);

  // Get tasks grouped by zone
  const tasksByZone = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const task of tasks.filter(t => t.status !== 'completed')) {
      const existing = map.get(task.zoneId) || [];
      map.set(task.zoneId, [...existing, task]);
    }
    return map;
  }, [tasks]);

  // Get workers grouped by zone
  const workersByZone = useMemo(() => {
    const map = new Map<string, typeof workers>();
    for (const worker of workers) {
      const zoneId = worker.position.zoneId;
      const existing = map.get(zoneId) || [];
      map.set(zoneId, [...existing, worker]);
    }
    return map;
  }, [workers]);

  return (
    <div className={cn('relative w-full aspect-[2/1] bg-slate-950 rounded-xl overflow-hidden border border-slate-800', className)}>
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '2% 4%',
        }}
      />
      
      {/* Floor labels */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 text-[9px] font-mono text-slate-600">
        <span>F10</span>
        <span className="mt-6">F7</span>
        <span className="mt-6">F4</span>
        <span className="mt-4">F1</span>
        <span className="mt-4">GF</span>
      </div>
      
      {/* Elevator shaft indicator */}
      <div className="absolute left-[48%] top-[3%] bottom-[22%] w-[4%] border border-dashed border-slate-700/50 rounded flex items-center justify-center">
        <span className="text-[8px] text-slate-600 -rotate-90 whitespace-nowrap">ELEVATOR</span>
      </div>
      
      {/* Zones */}
      {zones.map((zone) => {
        const style = ZONE_STYLES[zone.category] || ZONE_STYLES.utility;
        const zoneTasks = tasksByZone.get(zone.id) || [];
        const zoneWorkers = workersByZone.get(zone.id) || [];
        const hasUrgent = zoneTasks.some(t => t.priority === 'urgent');
        const isHovered = hoveredZone === zone.id;
        
        return (
          <div
            key={zone.id}
            className={cn(
              'absolute rounded-md border transition-all duration-200 cursor-pointer overflow-hidden',
              style.bg,
              style.border,
              isHovered && 'ring-1 ring-white/20 scale-[1.02] z-10',
              hasUrgent && 'ring-1 ring-red-500/50'
            )}
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.width}%`,
              height: `${zone.height}%`,
            }}
            onMouseEnter={() => setHoveredZone(zone.id)}
            onMouseLeave={() => setHoveredZone(null)}
            onClick={() => onZoneClick?.(zone.id)}
          >
            {/* Zone header */}
            <div className="flex items-center justify-between px-1.5 py-0.5">
              <span className={cn('text-[9px] font-medium truncate', style.text)}>
                {zone.name}
              </span>
              <div className="flex items-center gap-1">
                {zoneWorkers.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[8px] text-emerald-400">
                    <User className="w-2.5 h-2.5" />
                    {zoneWorkers.length}
                  </span>
                )}
                {zoneTasks.length > 0 && (
                  <span className={cn(
                    'flex items-center gap-0.5 text-[8px]',
                    hasUrgent ? 'text-red-400' : 'text-amber-400'
                  )}>
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {zoneTasks.length}
                  </span>
                )}
              </div>
            </div>
            
            {/* Task indicators */}
            {showTasks && zoneTasks.length > 0 && (
              <div className="absolute bottom-1 left-1 flex gap-0.5">
                {zoneTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_COLORS[task.priority])}
                    title={`${task.type} (${task.priority})`}
                  />
                ))}
                {zoneTasks.length > 4 && (
                  <span className="text-[7px] text-slate-400">+{zoneTasks.length - 4}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Worker markers */}
      {showWorkers && workers.map((worker) => {
        const isHovered = hoveredWorker === worker.id;
        const hasTask = worker.status !== 'idle';
        
        return (
          <Tooltip key={worker.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'absolute z-20 transition-all duration-300 ease-out cursor-pointer',
                  worker.status === 'moving' && 'animate-pulse'
                )}
                style={{
                  left: `${worker.position.x}%`,
                  top: `${worker.position.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onMouseEnter={() => setHoveredWorker(worker.id)}
                onMouseLeave={() => setHoveredWorker(null)}
                onClick={() => onWorkerClick?.(worker.id)}
              >
                {/* Worker avatar */}
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shadow-lg border-2',
                    isHovered ? 'scale-125 ring-2 ring-white/40' : '',
                    hasTask ? 'border-amber-400' : 'border-slate-600'
                  )}
                  style={{ backgroundColor: worker.color }}
                >
                  <span className="text-white drop-shadow-sm">{worker.initials}</span>
                </div>
                
                {/* Status indicator */}
                <div 
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900',
                    STATUS_COLORS[worker.status]
                  )} 
                />
                
                {/* Name label on hover */}
                {isHovered && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 px-1.5 py-0.5 rounded text-[9px] text-slate-200 shadow-lg">
                    {worker.name}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-slate-800 border-slate-700">
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-slate-200">{worker.name}</p>
                <p className="text-slate-400">{worker.role}</p>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-700">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    {worker.tasksCompleted}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    {worker.avgResponseTime}s
                  </span>
                  <span className="flex items-center gap-1 text-blue-400">
                    <Activity className="w-3 h-3" />
                    {(worker.reliabilityScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
      
      {/* Path lines for moving workers */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="hsl(217, 91%, 60%)" fillOpacity="0.6" />
          </marker>
        </defs>
        {workers
          .filter(w => w.status === 'moving' && w.path.length > 0)
          .map((worker) => {
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
                stroke="hsl(217, 91%, 60%)"
                strokeWidth="1.5"
                strokeDasharray="4,4"
                strokeOpacity="0.5"
                markerEnd="url(#arrow)"
              />
            );
          })}
      </svg>
      
      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-slate-900 to-transparent flex items-end justify-between px-3 pb-1">
        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Available
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Moving
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Working
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          {isRunning && (
            <span className="text-emerald-400 flex items-center gap-1">
              <Activity className="w-3 h-3 animate-pulse" />
              LIVE {speed}x
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
