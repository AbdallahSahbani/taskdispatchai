import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useDispatchState } from '@/hooks/useDispatchState';
import { Worker, Zone, Task } from '@/types/dispatch';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, AlertTriangle, MapPin, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Zone layout positions for the visual map
const zoneLayout: Record<string, { x: number; y: number; width: number; height: number; color: string }> = {
  // Ground level - outdoor
  'resort_beach': { x: 2, y: 75, width: 18, height: 22, color: 'hsl(200, 80%, 60%)' },
  'outdoor_patio': { x: 22, y: 75, width: 16, height: 22, color: 'hsl(140, 60%, 50%)' },
  'pool_deck': { x: 40, y: 75, width: 16, height: 22, color: 'hsl(190, 70%, 55%)' },
  
  // Ground level - indoor
  'lobby': { x: 58, y: 75, width: 20, height: 22, color: 'hsl(45, 70%, 60%)' },
  'bar': { x: 80, y: 75, width: 18, height: 10, color: 'hsl(340, 60%, 55%)' },
  'fine_dining': { x: 80, y: 87, width: 18, height: 10, color: 'hsl(280, 50%, 55%)' },
  'restaurant': { x: 58, y: 62, width: 20, height: 11, color: 'hsl(30, 65%, 55%)' },
  
  // Service areas
  'back_of_house': { x: 80, y: 62, width: 18, height: 11, color: 'hsl(220, 30%, 45%)' },
  'service_core': { x: 40, y: 62, width: 16, height: 11, color: 'hsl(220, 30%, 50%)' },
  'linen_storage': { x: 22, y: 62, width: 16, height: 11, color: 'hsl(220, 30%, 55%)' },
  
  // Floors
  'floor_1': { x: 2, y: 50, width: 47, height: 10, color: 'hsl(210, 40%, 60%)' },
  'floor_2': { x: 51, y: 50, width: 47, height: 10, color: 'hsl(210, 40%, 58%)' },
  'floor_3_west': { x: 2, y: 38, width: 23, height: 10, color: 'hsl(210, 40%, 56%)' },
  'floor_3_east': { x: 27, y: 38, width: 22, height: 10, color: 'hsl(210, 40%, 54%)' },
  'floor_4_west': { x: 51, y: 38, width: 23, height: 10, color: 'hsl(210, 40%, 52%)' },
  'floor_4_east': { x: 76, y: 38, width: 22, height: 10, color: 'hsl(210, 40%, 50%)' },
  'floor_5': { x: 2, y: 26, width: 47, height: 10, color: 'hsl(210, 40%, 48%)' },
  'floor_6': { x: 51, y: 26, width: 47, height: 10, color: 'hsl(210, 40%, 46%)' },
  'floor_7': { x: 2, y: 14, width: 47, height: 10, color: 'hsl(210, 40%, 44%)' },
  'floor_8': { x: 51, y: 14, width: 47, height: 10, color: 'hsl(210, 40%, 42%)' },
  'floor_9': { x: 2, y: 2, width: 47, height: 10, color: 'hsl(210, 40%, 40%)' },
  'floor_10': { x: 51, y: 2, width: 47, height: 10, color: 'hsl(210, 40%, 38%)' },
};

// Get neighboring zones for movement simulation
const zoneNeighbors: Record<string, string[]> = {
  'resort_beach': ['outdoor_patio', 'lobby'],
  'outdoor_patio': ['resort_beach', 'pool_deck', 'lobby', 'linen_storage'],
  'pool_deck': ['outdoor_patio', 'service_core'],
  'lobby': ['resort_beach', 'outdoor_patio', 'bar', 'fine_dining', 'restaurant', 'floor_1'],
  'bar': ['lobby', 'fine_dining', 'back_of_house'],
  'fine_dining': ['lobby', 'bar', 'restaurant'],
  'restaurant': ['lobby', 'fine_dining', 'service_core', 'back_of_house'],
  'back_of_house': ['bar', 'restaurant', 'service_core'],
  'service_core': ['pool_deck', 'restaurant', 'back_of_house', 'linen_storage', 'floor_1'],
  'linen_storage': ['outdoor_patio', 'service_core', 'floor_1'],
  'floor_1': ['lobby', 'service_core', 'linen_storage', 'floor_2'],
  'floor_2': ['floor_1', 'floor_3_west', 'floor_3_east'],
  'floor_3_west': ['floor_2', 'floor_3_east', 'floor_4_west'],
  'floor_3_east': ['floor_2', 'floor_3_west', 'floor_4_east'],
  'floor_4_west': ['floor_3_west', 'floor_4_east', 'floor_5'],
  'floor_4_east': ['floor_3_east', 'floor_4_west', 'floor_5'],
  'floor_5': ['floor_4_west', 'floor_4_east', 'floor_6'],
  'floor_6': ['floor_5', 'floor_7'],
  'floor_7': ['floor_6', 'floor_8'],
  'floor_8': ['floor_7', 'floor_9'],
  'floor_9': ['floor_8', 'floor_10'],
  'floor_10': ['floor_9'],
};

interface WorkerPin {
  id: string;
  name: string;
  initials: string;
  zoneId: string;
  x: number;
  y: number;
  color: string;
  isMoving: boolean;
  targetX?: number;
  targetY?: number;
}

export default function Zones() {
  const { workers, tasks, zones, loading, refetch } = useDispatchState();
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [workerPositions, setWorkerPositions] = useState<Record<string, string>>({});
  const [movingWorkers, setMovingWorkers] = useState<Set<string>>(new Set());
  const [lastAssignment, setLastAssignment] = useState<{ taskId: string; workerId: string; zoneId: string } | null>(null);

  const displayZones: Zone[] = useMemo(() => zones.map((z) => ({
    id: z.id,
    name: z.name,
    neighbors: zoneNeighbors[z.id] || [],
    travelTimeToNeighbor: {},
  })), [zones]);

  const displayTasks: Task[] = useMemo(() => tasks.map((t) => ({
    id: String(t.id),
    type: t.type as Task['type'],
    source: `${t.type} request`,
    description: `${t.type} at ${zones.find(z => z.id === t.zone_id)?.name || t.zone_id}`,
    zoneId: t.zone_id,
    priority: t.priority as Task['priority'],
    status: t.status as Task['status'],
    createdAt: new Date(t.created_at),
  })), [tasks, zones]);

  const displayWorkers: Worker[] = useMemo(() => workers.map((w) => ({
    id: String(w.id),
    name: w.name,
    role: w.role as Worker['role'],
    onShift: w.on_shift,
    currentZoneId: workerPositions[String(w.id)] || w.worker_state?.current_zone || 'lobby',
    deviceStatus: (w.worker_state?.device_online ? 'online' : 'offline') as Worker['deviceStatus'],
    reliabilityScore: w.reliability_score,
  })), [workers, workerPositions]);

  // Initialize worker positions
  useEffect(() => {
    const initialPositions: Record<string, string> = {};
    workers.forEach((w) => {
      const zoneId = w.worker_state?.current_zone || 'lobby';
      initialPositions[String(w.id)] = zoneId;
    });
    setWorkerPositions(initialPositions);
  }, [workers]);

  // Simulate worker movement
  const moveWorker = useCallback((workerId: string) => {
    setWorkerPositions((prev) => {
      const currentZone = prev[workerId] || 'lobby';
      const neighbors = zoneNeighbors[currentZone] || ['lobby'];
      const validNeighbors = neighbors.filter(n => zoneLayout[n]);
      if (validNeighbors.length === 0) return prev;
      
      const newZone = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
      return { ...prev, [workerId]: newZone };
    });
  }, []);

  // Simulation loop
  useEffect(() => {
    if (!simulationRunning) return;
    
    const interval = setInterval(() => {
      const activeWorkers = displayWorkers.filter(w => w.onShift);
      if (activeWorkers.length === 0) return;
      
      // Move a random worker
      const randomWorker = activeWorkers[Math.floor(Math.random() * activeWorkers.length)];
      
      setMovingWorkers((prev) => new Set([...prev, randomWorker.id]));
      
      setTimeout(() => {
        moveWorker(randomWorker.id);
        setMovingWorkers((prev) => {
          const next = new Set(prev);
          next.delete(randomWorker.id);
          return next;
        });
      }, 500);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [simulationRunning, displayWorkers, moveWorker]);

  // Track task assignments
  useEffect(() => {
    const assignedTask = tasks.find(t => t.status === 'assigned' && t.task_assignments);
    if (assignedTask && assignedTask.task_assignments) {
      setLastAssignment({
        taskId: String(assignedTask.id),
        workerId: String(assignedTask.task_assignments.worker_id),
        zoneId: assignedTask.zone_id,
      });
      
      // Clear after 5 seconds
      setTimeout(() => setLastAssignment(null), 5000);
    }
  }, [tasks]);

  // Generate worker pins with positions
  const workerPins: WorkerPin[] = useMemo(() => {
    const pinsByZone: Record<string, Worker[]> = {};
    
    displayWorkers.filter(w => w.onShift).forEach((worker) => {
      const zoneId = worker.currentZoneId;
      if (!pinsByZone[zoneId]) pinsByZone[zoneId] = [];
      pinsByZone[zoneId].push(worker);
    });
    
    const pins: WorkerPin[] = [];
    const colors = ['hsl(0, 70%, 55%)', 'hsl(120, 60%, 45%)', 'hsl(240, 60%, 55%)', 'hsl(300, 60%, 55%)', 'hsl(180, 60%, 45%)'];
    
    Object.entries(pinsByZone).forEach(([zoneId, zoneWorkers]) => {
      const layout = zoneLayout[zoneId];
      if (!layout) return;
      
      zoneWorkers.forEach((worker, idx) => {
        const offsetX = (idx % 3) * 4 + 2;
        const offsetY = Math.floor(idx / 3) * 4 + 3;
        
        pins.push({
          id: worker.id,
          name: worker.name,
          initials: worker.name.split(' ').map(n => n[0]).join('').toUpperCase(),
          zoneId,
          x: layout.x + offsetX,
          y: layout.y + offsetY,
          color: colors[parseInt(worker.id) % colors.length],
          isMoving: movingWorkers.has(worker.id),
        });
      });
    });
    
    return pins;
  }, [displayWorkers, movingWorkers]);

  const getZoneStats = (zoneId: string) => {
    const zoneWorkers = displayWorkers.filter(w => w.currentZoneId === zoneId && w.onShift);
    const zoneTasks = displayTasks.filter(t => t.zoneId === zoneId && t.status !== 'completed');
    const urgentTasks = zoneTasks.filter(t => t.priority === 'urgent');
    return { workers: zoneWorkers.length, tasks: zoneTasks.length, urgent: urgentTasks.length };
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeWorkerCount = displayWorkers.filter(w => w.onShift).length;
  const pendingTaskCount = displayTasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Zone Map</h1>
                <p className="text-muted-foreground mt-1">
                  Real-time employee locations and task distribution
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {activeWorkerCount} active
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {pendingTaskCount} tasks
                  </span>
                </div>
                <Button
                  variant={simulationRunning ? 'destructive' : 'default'}
                  onClick={() => {
                    setSimulationRunning(!simulationRunning);
                    toast.success(simulationRunning ? 'Simulation paused' : 'Simulation started');
                  }}
                  className="gap-2"
                >
                  {simulationRunning ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause Simulation
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Simulation
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">W</div>
                <span className="text-muted-foreground">Worker</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-status-new/50 border border-status-new" />
                <span className="text-muted-foreground">Task pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-status-urgent/50 border border-status-urgent animate-pulse" />
                <span className="text-muted-foreground">Urgent task</span>
              </div>
              {lastAssignment && (
                <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-status-completed/20 text-status-completed text-xs font-medium animate-pulse">
                  <MapPin className="w-3 h-3" />
                  Task assigned - Best route selected
                </div>
              )}
            </div>

            {/* Interactive Map */}
            <div className="data-panel p-4">
              <div className="relative w-full aspect-[2/1] bg-secondary/20 rounded-lg overflow-hidden border border-border/50">
                {/* Grid background */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
                  backgroundSize: '5% 10%'
                }} />
                
                {/* Zones */}
                {displayZones.map((zone) => {
                  const layout = zoneLayout[zone.id];
                  if (!layout) return null;
                  
                  const stats = getZoneStats(zone.id);
                  const hasUrgent = stats.urgent > 0;
                  const hasTasks = stats.tasks > 0;
                  const isAssignmentTarget = lastAssignment?.zoneId === zone.id;

                  return (
                    <div
                      key={zone.id}
                      className={cn(
                        'absolute rounded-md border-2 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:z-10',
                        hasUrgent ? 'border-status-urgent animate-pulse' : hasTasks ? 'border-status-new' : 'border-border/30',
                        isAssignmentTarget && 'ring-4 ring-status-completed ring-opacity-50'
                      )}
                      style={{
                        left: `${layout.x}%`,
                        top: `${layout.y}%`,
                        width: `${layout.width}%`,
                        height: `${layout.height}%`,
                        backgroundColor: `${layout.color}`,
                        opacity: 0.85,
                      }}
                    >
                      <div className="absolute inset-0 p-1 flex flex-col justify-between">
                        <span className="text-[10px] font-semibold text-white drop-shadow-md truncate">
                          {zone.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {stats.workers > 0 && (
                            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-white/30 text-white backdrop-blur-sm">
                              {stats.workers}👤
                            </span>
                          )}
                          {stats.tasks > 0 && (
                            <span className={cn(
                              'text-[9px] font-mono px-1 py-0.5 rounded backdrop-blur-sm',
                              hasUrgent ? 'bg-status-urgent/80 text-white' : 'bg-white/30 text-white'
                            )}>
                              {stats.tasks}📋
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Worker Pins */}
                {workerPins.map((pin) => {
                  const isAssigned = lastAssignment?.workerId === pin.id;
                  
                  return (
                    <div
                      key={pin.id}
                      className={cn(
                        'absolute z-20 transform -translate-x-1/2 -translate-y-1/2 transition-all',
                        pin.isMoving ? 'duration-500 scale-110' : 'duration-300',
                        isAssigned && 'ring-2 ring-status-completed ring-offset-2 ring-offset-background'
                      )}
                      style={{
                        left: `${pin.x}%`,
                        top: `${pin.y}%`,
                      }}
                      title={`${pin.name} - ${pin.zoneId}`}
                    >
                      <div 
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg border-2 border-white',
                          pin.isMoving && 'animate-bounce'
                        )}
                        style={{ backgroundColor: pin.color }}
                      >
                        {pin.initials}
                      </div>
                      {isAssigned && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-status-completed rounded-full border border-white animate-ping" />
                      )}
                    </div>
                  );
                })}

                {/* Assignment line visualization */}
                {lastAssignment && (() => {
                  const workerPin = workerPins.find(p => p.id === lastAssignment.workerId);
                  const targetLayout = zoneLayout[lastAssignment.zoneId];
                  if (!workerPin || !targetLayout) return null;
                  
                  const targetX = targetLayout.x + targetLayout.width / 2;
                  const targetY = targetLayout.y + targetLayout.height / 2;
                  
                  return (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--status-completed))" />
                        </marker>
                      </defs>
                      <line
                        x1={`${workerPin.x}%`}
                        y1={`${workerPin.y}%`}
                        x2={`${targetX}%`}
                        y2={`${targetY}%`}
                        stroke="hsl(var(--status-completed))"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        markerEnd="url(#arrowhead)"
                        className="animate-pulse"
                      />
                    </svg>
                  );
                })()}
              </div>
            </div>

            {/* Zone list */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {displayZones.filter(z => zoneLayout[z.id]).map((zone) => {
                const stats = getZoneStats(zone.id);
                const layout = zoneLayout[zone.id];
                
                return (
                  <div
                    key={zone.id}
                    className="data-panel p-3 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: layout?.color }}
                      />
                      <span className="text-sm font-medium truncate">{zone.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{stats.workers} workers</span>
                      <span>•</span>
                      <span className={cn(stats.urgent > 0 && 'text-status-urgent')}>
                        {stats.tasks} tasks
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
