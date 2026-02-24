import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useSimulationStore } from '@/stores/simulationStore';
import { BlueprintZoneMap } from '@/components/zones/BlueprintZoneMap';
import { SimulationControls } from '@/components/zones/SimulationControls';
import { WorkerProfileModal } from '@/components/workers/WorkerProfileModal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Zones() {
  const { workers, tasks, metrics, isRunning, tick } = useSimulationStore();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  // Animation loop for simulation
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => tick(), 50);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  const selectedWorker = workers.find(w => w.id === selectedWorkerId) || null;

  return (
    <div className="flex h-screen bg-[hsl(210,60%,4%)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 bg-gradient-to-br from-[hsl(210,60%,4%)] via-[hsl(210,55%,6%)] to-[hsl(210,60%,4%)]">
          <div className="space-y-4 max-w-[1800px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-[hsl(210,20%,90%)] font-mono tracking-wider">
                  GRAND AZURE HOTEL — BLUEPRINT
                </h1>
                <p className="text-xs text-[hsl(210,40%,40%)] font-mono mt-0.5">
                  Real-time staff tracking & task dispatch visualization
                </p>
              </div>
              <SimulationControls />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: Users, value: workers.length, label: 'Active Workers', color: 'hsl(158,64%,42%)' },
                { icon: AlertTriangle, value: metrics.activeTasks, label: 'Active Tasks', color: 'hsl(43,80%,55%)' },
                { icon: CheckCircle, value: metrics.completedTasks, label: 'Completed', color: 'hsl(195,90%,50%)' },
                { icon: Clock, value: metrics.avgResponseTime > 0 ? `${metrics.avgResponseTime}s` : '--', label: 'Avg Response', color: 'hsl(280,60%,55%)' },
              ].map((stat, i) => (
                <Card key={i} className="bg-[hsl(210,60%,6%)]/80 border-[hsl(210,60%,18%)]">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: `${stat.color}15` }}
                    >
                      <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                    </div>
                    <div>
                      <p className="text-xl font-bold font-mono" style={{ color: stat.color }}>
                        {stat.value}
                      </p>
                      <p className="text-[10px] text-[hsl(210,40%,40%)] font-mono tracking-wider">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Blueprint Map */}
            <BlueprintZoneMap
              className="min-h-[600px]"
              onWorkerClick={(id) => setSelectedWorkerId(id)}
            />

            {/* Active Workers Bar */}
            <div className="flex items-center gap-2 px-2">
              <span className="text-[9px] text-[hsl(210,40%,40%)] tracking-[3px] uppercase font-mono">Workers</span>
              <div className="flex items-center gap-2 overflow-x-auto flex-1">
                {workers.map((worker) => (
                  <button
                    key={worker.id}
                    onClick={() => setSelectedWorkerId(worker.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded border transition-all flex-shrink-0',
                      'bg-[hsl(210,60%,6%)]/60 border-[hsl(210,60%,18%)] hover:border-[hsl(195,90%,50%)]',
                      worker.status !== 'idle' && 'border-[hsl(43,80%,55%)]/40'
                    )}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ backgroundColor: worker.color }}
                    >
                      {worker.initials}
                    </div>
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      worker.status === 'idle' ? 'bg-[hsl(158,64%,42%)]' :
                      worker.status === 'moving' ? 'bg-[hsl(195,90%,50%)]' : 'bg-[hsl(43,80%,55%)]'
                    )} />
                    <span className="text-[10px] text-[hsl(210,20%,80%)] font-mono">{worker.name.split(' ')[0]}</span>
                    <span className="text-[8px] text-[hsl(210,40%,40%)] font-mono">
                      F{worker.currentFloor}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Tasks */}
            {tasks.filter(t => t.status !== 'completed').length > 0 && (
              <div className="flex items-center gap-2 px-2 pb-2">
                <span className="text-[9px] text-[hsl(210,40%,40%)] tracking-[3px] uppercase font-mono">Tasks</span>
                <div className="flex items-center gap-2 overflow-x-auto flex-1">
                  {tasks.filter(t => t.status !== 'completed').slice(-8).map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded border bg-[hsl(210,60%,6%)]/60 border-[hsl(210,60%,18%)] flex-shrink-0"
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        task.priority === 'urgent' ? 'bg-[hsl(0,84%,60%)] animate-pulse' :
                        task.priority === 'high' ? 'bg-[hsl(25,95%,53%)]' :
                        'bg-[hsl(43,80%,55%)]'
                      )} />
                      <span className="text-[9px] text-[hsl(195,90%,50%)] font-mono">{task.roomLabel}</span>
                      <span className="text-[8px] text-[hsl(210,40%,40%)] font-mono">{task.type}</span>
                      <Badge variant="outline" className="text-[7px] px-1 py-0 border-[hsl(210,60%,18%)] text-[hsl(210,40%,40%)]">
                        {task.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <WorkerProfileModal
        worker={selectedWorker}
        open={!!selectedWorkerId}
        onClose={() => setSelectedWorkerId(null)}
      />
    </div>
  );
}
