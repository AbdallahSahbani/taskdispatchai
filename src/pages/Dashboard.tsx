import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { TaskCard } from '@/components/TaskCard';
import { WorkerCard } from '@/components/WorkerCard';
import { MetricsPanel } from '@/components/MetricsPanel';
import { ZoneMap } from '@/components/ZoneMap';
import { TaskFilters } from '@/components/TaskFilters';
import { useDispatchState } from '@/hooks/useDispatchState';
import { useDispatchMetrics } from '@/hooks/useDispatchMetrics';
import { dispatchApi } from '@/lib/api';
import { TaskStatus, Task, Worker, Zone } from '@/types/dispatch';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { workers, tasks, zones, loading } = useDispatchState();
  const { metrics } = useDispatchMetrics();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [creating, setCreating] = useState(false);

  // Transform DB data to display format
  const displayTasks: Task[] = useMemo(() => tasks.map((t) => ({
    id: String(t.id),
    type: t.type,
    source: `${t.type} request`,
    description: `${t.type} at ${zones.find(z => z.id === t.zone_id)?.name || t.zone_id}`,
    zoneId: t.zone_id,
    priority: t.priority,
    status: t.status,
    createdAt: new Date(t.created_at),
  })), [tasks, zones]);

  const displayWorkers: Worker[] = useMemo(() => workers.map((w) => ({
    id: String(w.id),
    name: w.name,
    role: w.role,
    onShift: w.on_shift,
    currentZoneId: w.worker_state?.current_zone || '',
    deviceStatus: w.worker_state?.device_online ? 'online' : 'offline',
    reliabilityScore: w.reliability_score,
  })), [workers]);

  const displayZones: Zone[] = useMemo(() => zones.map((z) => ({
    id: z.id,
    name: z.name,
    neighbors: [],
    travelTimeToNeighbor: {},
  })), [zones]);

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return displayTasks;
    return displayTasks.filter((t) => t.status === statusFilter);
  }, [statusFilter, displayTasks]);

  const statusCounts = useMemo(() => ({
    all: displayTasks.length,
    new: displayTasks.filter((t) => t.status === 'new').length,
    assigned: displayTasks.filter((t) => t.status === 'assigned').length,
    in_progress: displayTasks.filter((t) => t.status === 'in_progress').length,
    completed: displayTasks.filter((t) => t.status === 'completed').length,
  }), [displayTasks]);

  const activeWorkers = displayWorkers.filter((w) => w.onShift);

  const handleCreateTask = async () => {
    setCreating(true);
    try {
      const taskTypes = ['towels', 'cleaning', 'maintenance', 'trash', 'room_service'];
      const randomType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
      const randomZone = zones[Math.floor(Math.random() * zones.length)];
      const priority = Math.random() > 0.8 ? 'urgent' : 'normal';

      const result = await dispatchApi.createTask(randomType, randomZone.id, priority);
      
      if (result.routing?.assigned) {
        toast.success(`Task assigned to ${result.routing.worker.name}`);
      } else {
        toast.warning('Task created but no worker available');
      }
    } catch (err) {
      toast.error('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const metricsForPanel = {
    avgResponseTime: metrics.reduce((acc, m) => acc + (m.avg_response_s || 0), 0) / (metrics.length || 1),
    avgCompletionTime: metrics.reduce((acc, m) => acc + (m.avg_completion_s || 0), 0) / (metrics.length || 1),
    totalTasks: displayTasks.length,
    completedTasks: displayTasks.filter(t => t.status === 'completed').length,
    activeWorkers: activeWorkers.length,
    pendingTasks: displayTasks.filter(t => t.status === 'new' || t.status === 'assigned').length,
    reroutes: metrics.reduce((acc, m) => acc + m.reroute_count, 0),
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <MetricsPanel metrics={metricsForPanel} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Live Tasks</h2>
                <div className="flex items-center gap-2">
                  <Button onClick={handleCreateTask} disabled={creating} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Task
                  </Button>
                  <TaskFilters activeFilter={statusFilter} onFilterChange={setStatusFilter} counts={statusCounts} />
                </div>
              </div>
              <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <div className="data-panel text-center py-8">
                    <p className="text-muted-foreground">No tasks match this filter</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const zone = displayZones.find((z) => z.id === task.zoneId);
                    const dbTask = tasks.find((t) => String(t.id) === task.id);
                    const workerId = dbTask?.task_assignments?.worker_id;
                    const assignedWorker = workerId ? displayWorkers.find((w) => w.id === String(workerId)) : undefined;

                    return (
                      <TaskCard key={task.id} task={task} zone={zone} assignedWorker={assignedWorker} className="animate-fade-in" />
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-6">
              <ZoneMap zones={displayZones} workers={displayWorkers} tasks={displayTasks} />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Active Workers</h2>
                  <span className="text-sm text-muted-foreground font-mono">{activeWorkers.length} on shift</span>
                </div>
                <div className="space-y-2">
                  {activeWorkers.map((worker) => {
                    const dbWorker = workers.find((w) => String(w.id) === worker.id);
                    const zone = displayZones.find((z) => z.id === worker.currentZoneId);
                    return (
                      <WorkerCard key={worker.id} worker={worker} zone={zone} tasksAssigned={dbWorker?.worker_state?.active_task_count || 0} />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
