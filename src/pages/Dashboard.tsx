import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { TaskCard } from '@/components/TaskCard';
import { WorkerCard } from '@/components/WorkerCard';
import { MetricsPanel } from '@/components/MetricsPanel';
import { ZoneMap } from '@/components/ZoneMap';
import { TaskFilters } from '@/components/TaskFilters';
import { tasks, workers, zones, metrics, getZoneById, getWorkerById, getAssignmentByTaskId, assignments } from '@/data/mockData';
import { TaskStatus } from '@/types/dispatch';

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    return tasks.filter((t) => t.status === statusFilter);
  }, [statusFilter]);

  const statusCounts = useMemo(() => {
    return {
      all: tasks.length,
      new: tasks.filter((t) => t.status === 'new').length,
      assigned: tasks.filter((t) => t.status === 'assigned').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  }, []);

  const activeWorkers = workers.filter((w) => w.onShift);

  const getWorkerTaskCount = (workerId: string) => {
    return assignments.filter(
      (a) => a.workerId === workerId && a.state !== 'failed'
    ).length;
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Metrics */}
          <MetricsPanel metrics={metrics} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Tasks Section */}
            <div className="xl:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Live Tasks</h2>
                <TaskFilters
                  activeFilter={statusFilter}
                  onFilterChange={setStatusFilter}
                  counts={statusCounts}
                />
              </div>
              <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <div className="data-panel text-center py-8">
                    <p className="text-muted-foreground">No tasks match this filter</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const zone = getZoneById(task.zoneId);
                    const assignment = getAssignmentByTaskId(task.id);
                    const assignedWorker = assignment
                      ? getWorkerById(assignment.workerId)
                      : undefined;
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        zone={zone}
                        assignedWorker={assignedWorker}
                        className="animate-fade-in"
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Zone Map */}
              <ZoneMap zones={zones} workers={workers} tasks={tasks} />

              {/* Active Workers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Active Workers</h2>
                  <span className="text-sm text-muted-foreground font-mono">
                    {activeWorkers.length} on shift
                  </span>
                </div>
                <div className="space-y-2">
                  {activeWorkers.map((worker) => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      zone={getZoneById(worker.currentZoneId)}
                      tasksAssigned={getWorkerTaskCount(worker.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
