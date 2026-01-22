import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useDispatchState } from '@/hooks/useDispatchState';
import { Worker, Zone, Task } from '@/types/dispatch';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, AlertTriangle, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import zone components
import { ZoneCard } from '@/components/zones/ZoneCard';
import { ZoneSummaryGrid } from '@/components/zones/ZoneSummaryGrid';
import { ZoneMapLegend } from '@/components/zones/ZoneMapLegend';
import { WorkerPin } from '@/components/zones/WorkerPin';
import { ZONE_LAYOUTS, ZONE_CATEGORY_MAP, generateColorFromId } from '@/components/zones/zoneConfig';
import type { ZoneStats, WorkerStatus, ZoneCategory } from '@/components/zones/types';

interface WorkerPinData {
  id: string;
  name: string;
  initials: string;
  zoneId: string;
  x: number;
  y: number;
  status: WorkerStatus;
  isMoving: boolean;
}

export default function Zones() {
  const { workers, tasks, zones, loading, refetch } = useDispatchState();
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [workerPositions, setWorkerPositions] = useState<Record<string, string>>({});
  const [movingWorkers, setMovingWorkers] = useState<Set<string>>(new Set());
  const [lastAssignment, setLastAssignment] = useState<{ taskId: string; workerId: string; zoneId: string } | null>(null);

  // Map DB zones to display zones
  const displayZones: Zone[] = useMemo(() => zones.map((z) => ({
    id: z.id,
    name: z.name,
    neighbors: ZONE_LAYOUTS[z.id]?.neighbors || [],
    travelTimeToNeighbor: {},
  })), [zones]);

  // Map DB tasks to display tasks
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

  // Map DB workers to display workers
  const displayWorkers: Worker[] = useMemo(() => workers.map((w) => ({
    id: String(w.id),
    name: w.name,
    role: w.role as Worker['role'],
    onShift: w.on_shift,
    currentZoneId: workerPositions[String(w.id)] || w.worker_state?.current_zone || 'lobby',
    deviceStatus: (w.worker_state?.device_online ? 'online' : 'offline') as Worker['deviceStatus'],
    reliabilityScore: w.reliability_score,
  })), [workers, workerPositions]);

  // Initialize worker positions from DB
  useEffect(() => {
    const initialPositions: Record<string, string> = {};
    workers.forEach((w) => {
      const zoneId = w.worker_state?.current_zone || 'lobby';
      initialPositions[String(w.id)] = zoneId;
    });
    setWorkerPositions(initialPositions);
  }, [workers]);

  // Move worker to neighboring zone
  const moveWorker = useCallback((workerId: string) => {
    setWorkerPositions((prev) => {
      const currentZone = prev[workerId] || 'lobby';
      const neighbors = ZONE_LAYOUTS[currentZone]?.neighbors || ['lobby'];
      const validNeighbors = neighbors.filter(n => ZONE_LAYOUTS[n]);
      if (validNeighbors.length === 0) return prev;
      
      const newZone = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
      return { ...prev, [workerId]: newZone };
    });
  }, []);

  // Simulation loop - moves random workers every 2 seconds
  useEffect(() => {
    if (!simulationRunning) return;
    
    const interval = setInterval(() => {
      const activeWorkers = displayWorkers.filter(w => w.onShift);
      if (activeWorkers.length === 0) return;
      
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

  // Track task assignments for visual feedback
  useEffect(() => {
    const assignedTask = tasks.find(t => t.status === 'assigned' && t.task_assignments);
    if (assignedTask && assignedTask.task_assignments) {
      setLastAssignment({
        taskId: String(assignedTask.id),
        workerId: String(assignedTask.task_assignments.worker_id),
        zoneId: assignedTask.zone_id,
      });
      
      setTimeout(() => setLastAssignment(null), 5000);
    }
  }, [tasks]);

  // Get zone statistics
  const getZoneStats = useCallback((zoneId: string): ZoneStats => {
    const zoneWorkers = displayWorkers.filter(w => w.currentZoneId === zoneId && w.onShift);
    const zoneTasks = displayTasks.filter(t => t.zoneId === zoneId && t.status !== 'completed');
    const urgentTasks = zoneTasks.filter(t => t.priority === 'urgent');
    const hasUrgent = urgentTasks.length > 0;
    
    return { 
      workerCount: zoneWorkers.length, 
      taskCount: zoneTasks.length, 
      urgentCount: urgentTasks.length,
      hasUrgent,
      status: hasUrgent ? 'urgent' : zoneTasks.length > 0 ? 'pending' : 'clear'
    };
  }, [displayWorkers, displayTasks]);

  // Generate worker pins with positions
  const workerPins: WorkerPinData[] = useMemo(() => {
    const pinsByZone: Record<string, Worker[]> = {};
    
    displayWorkers.filter(w => w.onShift).forEach((worker) => {
      const zoneId = worker.currentZoneId;
      if (!pinsByZone[zoneId]) pinsByZone[zoneId] = [];
      pinsByZone[zoneId].push(worker);
    });
    
    const pins: WorkerPinData[] = [];
    
    Object.entries(pinsByZone).forEach(([zoneId, zoneWorkers]) => {
      const layout = ZONE_LAYOUTS[zoneId];
      if (!layout) return;
      
      zoneWorkers.forEach((worker, idx) => {
        // Distribute workers within the zone
        const offsetX = (idx % 3) * 4 + 2;
        const offsetY = Math.floor(idx / 3) * 4 + 3;
        
        // Determine worker status
        const hasActiveTask = displayTasks.some(
          t => t.status === 'assigned' && tasks.find(
            dt => String(dt.id) === t.id && dt.task_assignments?.worker_id === parseInt(worker.id)
          )
        );
        
        pins.push({
          id: worker.id,
          name: worker.name,
          initials: worker.name.split(' ').map(n => n[0]).join('').toUpperCase(),
          zoneId,
          x: layout.x + offsetX,
          y: layout.y + offsetY,
          status: worker.deviceStatus === 'offline' ? 'offline' : hasActiveTask ? 'busy' : 'available',
          isMoving: movingWorkers.has(worker.id),
        });
      });
    });
    
    return pins;
  }, [displayWorkers, movingWorkers, displayTasks, tasks]);

  // Get workers for a specific zone
  const getZoneWorkers = useCallback((zoneId: string) => {
    return displayWorkers
      .filter(w => w.currentZoneId === zoneId && w.onShift)
      .map(w => ({
        id: w.id,
        name: w.name,
        status: (w.deviceStatus === 'offline' ? 'offline' : 'available') as WorkerStatus,
      }));
  }, [displayWorkers]);

  // Zone summary data for the grid
  const zoneSummaryData = useMemo(() => {
    return displayZones
      .filter(z => ZONE_LAYOUTS[z.id])
      .map(zone => ({
        id: zone.id,
        name: zone.name,
        category: ZONE_CATEGORY_MAP[zone.id] || 'utility' as ZoneCategory,
        stats: getZoneStats(zone.id),
      }));
  }, [displayZones, getZoneStats]);

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
            {/* Header */}
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
            <ZoneMapLegend showAssignmentIndicator={!!lastAssignment} />

            {/* Interactive Map */}
            <div className="data-panel p-4">
              <div className="relative w-full aspect-[2/1] bg-secondary/20 rounded-lg overflow-hidden border border-border/50">
                {/* Grid background */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
                  backgroundSize: '5% 10%'
                }} />
                
                {/* Zone Cards */}
                {displayZones.map((zone) => {
                  const layout = ZONE_LAYOUTS[zone.id];
                  if (!layout) return null;
                  
                  const stats = getZoneStats(zone.id);
                  const category = ZONE_CATEGORY_MAP[zone.id] || 'utility';
                  const isAssignmentTarget = lastAssignment?.zoneId === zone.id;
                  const zoneWorkers = getZoneWorkers(zone.id);

                  return (
                    <ZoneCard
                      key={zone.id}
                      zoneId={zone.id}
                      zoneName={zone.name}
                      category={category as ZoneCategory}
                      workers={zoneWorkers}
                      stats={stats}
                      isAssignmentTarget={isAssignmentTarget}
                      style={{
                        left: `${layout.x}%`,
                        top: `${layout.y}%`,
                        width: `${layout.width}%`,
                        height: `${layout.height}%`,
                      }}
                    />
                  );
                })}

                {/* Worker Pins */}
                {workerPins.map((pin) => (
                  <WorkerPin
                    key={pin.id}
                    id={pin.id}
                    name={pin.name}
                    initials={pin.initials}
                    x={pin.x}
                    y={pin.y}
                    status={pin.status}
                    isMoving={pin.isMoving}
                    isAssigned={lastAssignment?.workerId === pin.id}
                  />
                ))}

                {/* Assignment line visualization */}
                {lastAssignment && (() => {
                  const workerPin = workerPins.find(p => p.id === lastAssignment.workerId);
                  const targetLayout = ZONE_LAYOUTS[lastAssignment.zoneId];
                  if (!workerPin || !targetLayout) return null;
                  
                  const targetX = targetLayout.x + targetLayout.width / 2;
                  const targetY = targetLayout.y + targetLayout.height / 2;
                  
                  return (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--task-complete))" />
                        </marker>
                      </defs>
                      <line
                        x1={`${workerPin.x}%`}
                        y1={`${workerPin.y}%`}
                        x2={`${targetX}%`}
                        y2={`${targetY}%`}
                        stroke="hsl(var(--task-complete))"
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

            {/* Zone Summary Grid */}
            <ZoneSummaryGrid 
              zones={zoneSummaryData}
              onZoneClick={(zoneId) => {
                toast.info(`Selected: ${displayZones.find(z => z.id === zoneId)?.name || zoneId}`);
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
