import { useState } from 'react';
import { Task } from '@/types/dispatch';
import { tasks, getZoneById, zones } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { MapPin, Clock, Check, Navigation, X, ChevronRight, User, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

// Simulated worker view
const currentWorker = {
  id: 'w1',
  name: 'Maria Santos',
  currentZoneId: 'floor-2-east',
};

export default function WorkerApp() {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [taskState, setTaskState] = useState<'idle' | 'seen' | 'on_my_way' | 'completed'>('idle');

  // Get tasks assigned to this worker (simulated)
  const myTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.zoneId !== currentWorker.currentZoneId
  ).slice(0, 2);

  const currentZone = getZoneById(currentWorker.currentZoneId);

  const handleSeen = () => {
    setTaskState('seen');
  };

  const handleOnMyWay = () => {
    setTaskState('on_my_way');
  };

  const handleComplete = () => {
    setTaskState('completed');
    setTimeout(() => {
      setActiveTask(null);
      setTaskState('idle');
    }, 1500);
  };

  const handleBusy = () => {
    setActiveTask(null);
    setTaskState('idle');
  };

  if (activeTask) {
    const taskZone = getZoneById(activeTask.zoneId);
    
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="px-4 py-3 border-b border-border bg-card/50">
          <div className="flex items-center justify-between">
            <button onClick={() => setActiveTask(null)} className="p-2 -ml-2">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="font-mono text-xs text-muted-foreground">
              {activeTask.id.toUpperCase()}
            </span>
          </div>
        </header>

        {/* Task Details */}
        <main className="flex-1 p-6 flex flex-col">
          <div className="flex-1 space-y-6">
            <div className="text-center space-y-2">
              <StatusBadge status={activeTask.status} priority={activeTask.priority} />
              <h1 className="text-2xl font-bold text-foreground">{activeTask.source}</h1>
              <p className="text-muted-foreground">{activeTask.description}</p>
            </div>

            <div className="data-panel space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">{taskZone?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium text-foreground">
                    {formatDistanceToNow(activeTask.createdAt, { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Navigation className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="font-medium text-foreground">~2 min walk</p>
                </div>
              </div>
            </div>

            {/* Status indicator */}
            {taskState !== 'idle' && (
              <div className={cn(
                'data-panel text-center py-4',
                taskState === 'completed' && 'border-status-completed/50 bg-status-completed/5'
              )}>
                <p className={cn(
                  'font-medium',
                  taskState === 'seen' && 'text-status-assigned',
                  taskState === 'on_my_way' && 'text-status-in-progress',
                  taskState === 'completed' && 'text-status-completed'
                )}>
                  {taskState === 'seen' && 'Task Acknowledged'}
                  {taskState === 'on_my_way' && 'En Route to Location'}
                  {taskState === 'completed' && '✓ Task Completed'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-6">
            {taskState === 'idle' && (
              <>
                <Button
                  onClick={handleSeen}
                  className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Seen
                </Button>
                <Button
                  onClick={handleBusy}
                  variant="outline"
                  className="w-full h-12"
                >
                  <X className="w-4 h-4 mr-2" />
                  Busy
                </Button>
              </>
            )}
            {taskState === 'seen' && (
              <Button
                onClick={handleOnMyWay}
                className="w-full h-14 text-lg bg-status-in-progress hover:bg-status-in-progress/90 text-warning-foreground"
              >
                <Navigation className="w-5 h-5 mr-2" />
                On My Way
              </Button>
            )}
            {taskState === 'on_my_way' && (
              <Button
                onClick={handleComplete}
                className="w-full h-14 text-lg bg-status-completed hover:bg-status-completed/90 text-success-foreground"
              >
                <Check className="w-5 h-5 mr-2" />
                Complete Task
              </Button>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{currentWorker.name}</p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{currentZone?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary animate-pulse" />
          <h2 className="font-semibold text-foreground">Incoming Tasks</h2>
        </div>

        {myTasks.length === 0 ? (
          <div className="data-panel text-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Check className="w-8 h-8 text-status-completed" />
            </div>
            <p className="text-foreground font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No pending tasks</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTasks.map((task) => {
              const zone = getZoneById(task.zoneId);
              return (
                <button
                  key={task.id}
                  onClick={() => setActiveTask(task)}
                  className={cn(
                    'w-full data-panel text-left transition-all hover:border-primary/30',
                    task.priority === 'urgent' && 'border-status-urgent/40 animate-pulse-slow'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{task.source}</span>
                        <StatusBadge status={task.status} priority={task.priority} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {zone?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(task.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Status */}
      <footer className="p-4 border-t border-border bg-card/50">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-status-completed animate-pulse" />
          <span className="text-muted-foreground">Online • Listening for tasks</span>
        </div>
      </footer>
    </div>
  );
}
