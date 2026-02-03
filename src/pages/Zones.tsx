import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useSimulationStore } from '@/stores/simulationStore';
import { ProfessionalZoneMap } from '@/components/zones/ProfessionalZoneMap';
import { SimulationControls } from '@/components/zones/SimulationControls';
import { WorkerProfileModal } from '@/components/workers/WorkerProfileModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  MapPin,
  Activity,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimulatedWorker } from '@/stores/simulationStore';

export default function Zones() {
  const { zones, workers, tasks, metrics, isRunning, tick } = useSimulationStore();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Animation loop for simulation
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      tick();
    }, 50); // 20fps for smooth animation
    
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  const selectedWorker = workers.find(w => w.id === selectedWorkerId) || null;

  // Zone statistics
  const zoneStats = zones.map(zone => {
    const zoneWorkers = workers.filter(w => w.position.zoneId === zone.id);
    const zoneTasks = tasks.filter(t => t.zoneId === zone.id && t.status !== 'completed');
    const urgentTasks = zoneTasks.filter(t => t.priority === 'urgent');
    
    return {
      ...zone,
      workerCount: zoneWorkers.length,
      taskCount: zoneTasks.length,
      urgentCount: urgentTasks.length,
    };
  });

  // Category summary
  const categorySummary = [
    { id: 'guest_floor', label: 'Guest Floors', icon: Layers, color: 'text-slate-300' },
    { id: 'public', label: 'Public Areas', icon: MapPin, color: 'text-zinc-200' },
    { id: 'f_and_b', label: 'F&B', icon: Activity, color: 'text-amber-300' },
    { id: 'service', label: 'Service', icon: Users, color: 'text-neutral-300' },
    { id: 'outdoor', label: 'Outdoor', icon: MapPin, color: 'text-cyan-300' },
  ].map(cat => ({
    ...cat,
    zones: zoneStats.filter(z => z.category === cat.id).length,
    workers: workers.filter(w => zones.find(z => z.id === w.position.zoneId)?.category === cat.id).length,
    tasks: tasks.filter(t => zones.find(z => z.id === t.zoneId)?.category === cat.id && t.status !== 'completed').length,
  }));

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="space-y-6 max-w-[1800px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-100 font-display">Zone Map</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Real-time employee locations and task distribution
                </p>
              </div>
              <SimulationControls />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-100">{workers.length}</p>
                    <p className="text-xs text-slate-500">Active Workers</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-100">{metrics.activeTasks}</p>
                    <p className="text-xs text-slate-500">Active Tasks</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-100">{metrics.completedTasks}</p>
                    <p className="text-xs text-slate-500">Completed Today</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-100">
                      {metrics.avgResponseTime > 0 ? `${metrics.avgResponseTime}s` : '--'}
                    </p>
                    <p className="text-xs text-slate-500">Avg Response</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Map */}
            <Card className="bg-slate-900/30 border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 border-b border-slate-800/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Hotel Floor Plan
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-600" />
                      Guest Floors
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-600/70" />
                      F&B
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-cyan-600/70" />
                      Outdoor
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-neutral-600" />
                      Service
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <ProfessionalZoneMap
                  className="min-h-[500px]"
                  onWorkerClick={(id) => setSelectedWorkerId(id)}
                  onZoneClick={(id) => setSelectedZoneId(id)}
                />
              </CardContent>
            </Card>

            {/* Category Summary */}
            <div className="grid grid-cols-5 gap-4">
              {categorySummary.map((cat) => (
                <Card 
                  key={cat.id}
                  className="bg-slate-900/30 border-slate-800 hover:bg-slate-800/30 transition-colors cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <cat.icon className={cn('w-4 h-4', cat.color)} />
                      <span className="text-xs font-medium text-slate-400">{cat.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{cat.zones} zones</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-[10px] px-1.5">
                          {cat.workers} <Users className="w-2.5 h-2.5 ml-0.5 inline" />
                        </Badge>
                        {cat.tasks > 0 && (
                          <Badge variant="secondary" className="bg-amber-900/50 text-amber-300 text-[10px] px-1.5">
                            {cat.tasks} <AlertTriangle className="w-2.5 h-2.5 ml-0.5 inline" />
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Worker List */}
            <Card className="bg-slate-900/30 border-slate-800">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Active Workers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-6 gap-3">
                  {workers.map((worker) => {
                    const hasTask = worker.status !== 'idle';
                    
                    return (
                      <button
                        key={worker.id}
                        onClick={() => setSelectedWorkerId(worker.id)}
                        className={cn(
                          'p-3 rounded-lg border transition-all text-left',
                          'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600',
                          hasTask && 'border-amber-500/30'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: worker.color }}
                          >
                            <span className="text-white">{worker.initials}</span>
                          </div>
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            worker.status === 'idle' ? 'bg-emerald-500' :
                            worker.status === 'moving' ? 'bg-blue-500' : 'bg-amber-500'
                          )} />
                        </div>
                        <p className="text-xs font-medium text-slate-200 truncate">{worker.name}</p>
                        <p className="text-[10px] text-slate-500 truncate capitalize">
                          {worker.position.zoneId.replace(/_/g, ' ')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Worker Profile Modal */}
      <WorkerProfileModal
        worker={selectedWorker}
        open={!!selectedWorkerId}
        onClose={() => setSelectedWorkerId(null)}
      />
    </div>
  );
}
