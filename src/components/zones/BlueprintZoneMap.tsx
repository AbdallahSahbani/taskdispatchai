import { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSimulationStore } from '@/stores/simulationStore';
import type { SimulatedWorker, SimulatedTask } from '@/stores/simulationStore';
import { BlueprintFloorPlan, FLOOR_DATA } from './BlueprintFloorPlan';
import { BlueprintWorkerDot } from './BlueprintWorkerDot';
import { BlueprintLegend } from './BlueprintLegend';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Activity } from 'lucide-react';

interface BlueprintZoneMapProps {
  className?: string;
  onWorkerClick?: (workerId: string) => void;
}

export function BlueprintZoneMap({ className, onWorkerClick }: BlueprintZoneMapProps) {
  const { workers, tasks, isRunning, speed, mode } = useSimulationStore();
  const [currentFloor, setCurrentFloor] = useState(1); // Ground floor default
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const floorTabs = FLOOR_DATA.map((f, i) => ({
    index: i,
    num: f.num,
    tag: f.tag,
  }));

  // Workers on current floor
  const floorWorkers = useMemo(() => {
    return workers.filter(w => w.currentFloor === currentFloor);
  }, [workers, currentFloor]);

  // Tasks on current floor
  const floorTasks = useMemo(() => {
    return tasks.filter(t => t.floor === currentFloor && t.status !== 'completed');
  }, [tasks, currentFloor]);

  const floor = FLOOR_DATA[currentFloor];

  return (
    <div className={cn('relative w-full bg-[hsl(210,60%,6%)] rounded-xl overflow-hidden border border-[hsl(210,60%,18%)]', className)}>
      {/* Blueprint grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(13,74,140,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(13,74,140,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Scanline animation */}
      <div
        className="absolute left-0 right-0 h-[2px] pointer-events-none z-10"
        style={{
          background: 'linear-gradient(transparent, rgba(56,189,248,0.15), transparent)',
          animation: 'scanline 4s linear infinite',
        }}
      />

      {/* Floor selector tabs */}
      <div className="relative z-20 flex items-center gap-1 px-4 py-3 border-b border-[hsl(210,60%,18%)] bg-[hsl(210,60%,4%)]/90 backdrop-blur-sm overflow-x-auto">
        <span className="text-[10px] text-[hsl(210,40%,40%)] tracking-[3px] uppercase mr-2 font-mono flex-shrink-0">Floor</span>
        {floorTabs.map((tab) => (
          <button
            key={tab.index}
            onClick={() => setCurrentFloor(tab.index)}
            className={cn(
              'px-3 py-1.5 text-xs font-mono tracking-wider border transition-all flex-shrink-0',
              currentFloor === tab.index
                ? 'bg-[hsl(195,90%,50%)] border-[hsl(195,90%,50%)] text-[hsl(210,60%,6%)] font-bold'
                : 'border-[hsl(210,60%,18%)] text-[hsl(210,40%,40%)] hover:border-[hsl(195,90%,50%)] hover:text-[hsl(195,90%,50%)]'
            )}
          >
            {tab.num}
            <span className="ml-1.5 text-[9px] text-[hsl(43,80%,55%)] font-semibold">{tab.tag}</span>
          </button>
        ))}

        {/* Status indicator */}
        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          {isRunning && (
            <span className="flex items-center gap-1.5 text-[10px] text-[hsl(158,64%,42%)] font-mono">
              <Activity className="w-3 h-3 animate-pulse" />
              {mode === 'live' ? 'LIVE' : 'DEMO'} {speed}x
            </span>
          )}
          <span className="text-[10px] text-[hsl(210,40%,40%)] font-mono">
            {floorWorkers.length} workers • {floorTasks.length} tasks
          </span>
        </div>
      </div>

      {/* Legend bar */}
      <BlueprintLegend />

      {/* Floor title */}
      <div className="relative z-10 flex items-baseline gap-3 px-6 pt-4 pb-2">
        <span className="text-4xl font-mono text-[hsl(195,90%,50%)] opacity-25 leading-none">{floor?.num}</span>
        <span className="text-lg font-bold text-[hsl(210,20%,90%)] tracking-wider">{floor?.name}</span>
        <span className="text-[11px] text-[hsl(210,40%,40%)] font-mono ml-auto">{floor?.desc}</span>
      </div>

      {/* Blueprint SVG viewport */}
      <div className="relative px-4 pb-4">
        <div className="relative border border-[hsl(210,70%,40%)] bg-[hsl(210,60%,4%)]/95 overflow-hidden"
          style={{
            boxShadow: '0 0 60px rgba(42,141,232,0.12), inset 0 0 80px rgba(13,74,140,0.06)',
          }}
        >
          {/* Inner blueprint grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(42,141,232,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(42,141,232,0.04) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />

          <svg
            ref={svgRef}
            viewBox="0 0 1100 700"
            className="w-full h-auto relative z-5"
            style={{ display: 'block' }}
          >
            <defs>
              <pattern id="hash" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(42,141,232,0.2)" strokeWidth="1.5" />
              </pattern>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="workerGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Building outer wall */}
            <rect x="28" y="28" width="1044" height="644" stroke="hsl(210,70%,50%)" strokeWidth="3" fill="rgba(4,17,31,0.5)" rx="2" />
            <rect x="32" y="32" width="1036" height="636" stroke="hsl(210,60%,30%)" strokeWidth="1" fill="none" rx="1" strokeDasharray="8 4" />

            {/* Floor plan rooms */}
            <BlueprintFloorPlan
              floorIndex={currentFloor}
              hoveredRoom={hoveredRoom}
              onRoomHover={setHoveredRoom}
              tasks={floorTasks}
            />

            {/* Worker dots */}
            {floorWorkers.map(worker => (
              <BlueprintWorkerDot
                key={worker.id}
                worker={worker}
                onClick={() => onWorkerClick?.(worker.id)}
              />
            ))}

            {/* Worker movement paths */}
            {floorWorkers
              .filter(w => w.status === 'moving' && w.path.length > 0)
              .map(worker => {
                const pathPoints = [
                  { x: worker.mapX, y: worker.mapY },
                  ...worker.path.slice(worker.pathIndex).map(p => ({ x: p.x, y: p.y })),
                ];
                if (pathPoints.length < 2) return null;
                const d = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                return (
                  <path
                    key={`path-${worker.id}`}
                    d={d}
                    fill="none"
                    stroke="hsl(195,90%,50%)"
                    strokeWidth="1.5"
                    strokeDasharray="6,4"
                    strokeOpacity="0.4"
                  />
                );
              })}

            {/* Compass */}
            <g transform="translate(1030, 44)">
              <circle cx="0" cy="0" r="18" stroke="hsl(210,60%,30%)" strokeWidth="1" fill="none" />
              <polygon points="0,-16 3,0 0,-3 -3,0" fill="hsl(195,90%,50%)" opacity="0.9" />
              <polygon points="0,16 3,0 0,3 -3,0" fill="hsl(210,60%,30%)" opacity="0.7" />
              <text x="0" y="-20" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="hsl(195,90%,50%)">N</text>
            </g>

            {/* Scale bar */}
            <g transform="translate(950, 670)">
              <line x1="0" y1="0" x2="100" y2="0" stroke="hsl(210,60%,30%)" strokeWidth="1.5" />
              <line x1="0" y1="-5" x2="0" y2="5" stroke="hsl(210,60%,30%)" strokeWidth="1.5" />
              <line x1="50" y1="-3" x2="50" y2="3" stroke="hsl(210,60%,30%)" strokeWidth="1" />
              <line x1="100" y1="-5" x2="100" y2="5" stroke="hsl(210,60%,30%)" strokeWidth="1.5" />
              <text x="0" y="-8" fontFamily="monospace" fontSize="7" fill="hsl(210,40%,40%)">0</text>
              <text x="42" y="-8" fontFamily="monospace" fontSize="7" fill="hsl(210,40%,40%)">10m</text>
              <text x="88" y="-8" fontFamily="monospace" fontSize="7" fill="hsl(210,40%,40%)">20m</text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
