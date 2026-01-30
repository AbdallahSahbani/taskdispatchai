import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatchState } from '@/hooks/useDispatchState';
import { dispatchApi } from '@/lib/api';
import { initSpeechSynthesis, notifyWorkerOfTask, playNotificationPing } from '@/lib/speechNotification';
import { StatusBadge } from '@/components/StatusBadge';
import { MapPin, Clock, Check, Navigation, X, ChevronRight, User, Radio, RefreshCw, Volume2, VolumeX, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TaskStatus, Priority } from '@/types/dispatch';

export default function WorkerApp() {
  const { workers, tasks, zones, loading } = useDispatchState();
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [taskState, setTaskState] = useState<'idle' | 'seen' | 'on_my_way' | 'completed'>('idle');
  const [actionLoading, setActionLoading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  const previousTaskIds = useRef<Set<number>>(new Set());
  const hasInteracted = useRef(false);

  // Initialize speech synthesis on first user interaction
  const handleUserInteraction = useCallback(async () => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      initSpeechSynthesis();
      setAudioInitialized(true);
    }
  }, []);

  // Select first on-shift worker
  useEffect(() => {
    if (!selectedWorkerId && workers.length > 0) {
      const onShiftWorker = workers.find((w) => w.on_shift && w.worker_state?.device_online);
      if (onShiftWorker) setSelectedWorkerId(onShiftWorker.id);
    }
  }, [workers, selectedWorkerId]);

  const currentWorker = workers.find((w) => w.id === selectedWorkerId);
  const currentZone = zones.find((z) => z.id === currentWorker?.worker_state?.current_zone);

  const myTasks = tasks.filter((t) => {
    const a = t.task_assignments;
    return a?.worker_id === selectedWorkerId && (a.state === 'pending_ack' || a.state === 'acked');
  });

  // Watch for new task assignments and play speech notification
  useEffect(() => {
    if (!audioEnabled || !audioInitialized || !selectedWorkerId || !currentWorker) return;

    const currentTaskIds = new Set(myTasks.map(t => t.id));
    
    // Find newly assigned tasks
    myTasks.forEach((task) => {
      if (!previousTaskIds.current.has(task.id)) {
        // New task detected!
        const zone = zones.find((z) => z.id === task.zone_id);
        const priority = task.priority === 'urgent' ? 'urgent' : task.priority === 'high' ? 'high' : 'normal';
        
        console.log(`New task notification: ${task.type} at ${zone?.name}`);
        
        // Play speech notification
        notifyWorkerOfTask(
          {
            priority: priority as 'urgent' | 'high' | 'normal',
            type: task.type,
            zoneName: zone?.name || 'Unknown Location',
            roomNumber: undefined // Add room number if available in task data
          },
          {
            name: currentWorker.name
          }
        );
        
        // Show toast notification
        toast.info(
          `New ${priority === 'urgent' ? '🚨 URGENT ' : ''}task: ${task.type}`,
          { description: `Location: ${zone?.name}` }
        );
      }
    });

    previousTaskIds.current = currentTaskIds;
  }, [myTasks, zones, audioEnabled, audioInitialized, selectedWorkerId, currentWorker]);

  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null;
  const activeTaskZone = activeTask ? zones.find((z) => z.id === activeTask.zone_id) : null;

  const handleAction = async (action: 'seen' | 'onmyway' | 'busy' | 'complete') => {
    if (!activeTask || !selectedWorkerId) return;
    setActionLoading(true);
    await handleUserInteraction();
    
    try {
      if (action === 'complete') {
        await dispatchApi.completeTask(activeTask.id, selectedWorkerId);
        setTaskState('completed');
        if (audioEnabled) playNotificationPing();
        toast.success('Task completed!');
        setTimeout(() => { setActiveTaskId(null); setTaskState('idle'); }, 1500);
      } else if (action === 'busy') {
        await dispatchApi.ackTask(activeTask.id, selectedWorkerId, 'busy');
        toast.info('Task will be reassigned');
        setActiveTaskId(null); setTaskState('idle');
      } else if (action === 'onmyway') {
        await dispatchApi.ackTask(activeTask.id, selectedWorkerId, 'onmyway');
        setTaskState('on_my_way');
        if (audioEnabled) playNotificationPing();
      } else {
        await dispatchApi.ackTask(activeTask.id, selectedWorkerId, 'seen');
        setTaskState('seen');
        if (audioEnabled) playNotificationPing();
      }
    } catch { toast.error('Action failed'); }
    finally { setActionLoading(false); }
  };

  const toggleAudio = async () => {
    await handleUserInteraction();
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      playNotificationPing();
      toast.success('Audio notifications enabled');
    } else {
      toast.info('Audio notifications disabled');
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>;

  if (activeTask) {
    const aState = activeTask.task_assignments?.state;
    const effectiveState = aState === 'acked' && taskState === 'idle' ? 'seen' : taskState;

    return (
      <div className="min-h-screen bg-background flex flex-col" onClick={handleUserInteraction}>
        <header className="px-4 py-3 border-b border-border bg-card/50 flex items-center justify-between">
          <button onClick={() => { setActiveTaskId(null); setTaskState('idle'); }} className="p-2 -ml-2"><X className="w-5 h-5 text-muted-foreground" /></button>
          <span className="font-mono text-xs text-muted-foreground">TASK-{activeTask.id}</span>
          <button onClick={toggleAudio} className="p-2 -mr-2">
            {audioEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
          </button>
        </header>
        <main className="flex-1 p-6 flex flex-col">
          <div className="flex-1 space-y-6">
            <div className="text-center space-y-2">
              <StatusBadge status={activeTask.status as TaskStatus} priority={activeTask.priority as Priority} />
              <h1 className="text-2xl font-bold text-foreground capitalize">{activeTask.type}</h1>
              <p className="text-muted-foreground">{activeTask.type} request at {activeTaskZone?.name}</p>
            </div>
            <div className="data-panel space-y-4">
              <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-secondary"><MapPin className="w-5 h-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Location</p><p className="font-medium text-foreground">{activeTaskZone?.name}</p></div></div>
              <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-secondary"><Clock className="w-5 h-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Created</p><p className="font-medium text-foreground">{formatDistanceToNow(new Date(activeTask.created_at), { addSuffix: true })}</p></div></div>
            </div>
            {effectiveState !== 'idle' && <div className={cn('data-panel text-center py-4', effectiveState === 'completed' && 'border-status-completed/50 bg-status-completed/5')}><p className={cn('font-medium', effectiveState === 'seen' && 'text-status-assigned', effectiveState === 'on_my_way' && 'text-status-in-progress', effectiveState === 'completed' && 'text-status-completed')}>{effectiveState === 'seen' && 'Task Acknowledged'}{effectiveState === 'on_my_way' && 'En Route'}{effectiveState === 'completed' && '✓ Completed'}</p></div>}
          </div>
          <div className="space-y-3 pt-6">
            {effectiveState === 'idle' && aState === 'pending_ack' && <><Button onClick={() => handleAction('seen')} disabled={actionLoading} className="w-full h-14 text-lg"><Check className="w-5 h-5 mr-2" />Seen</Button><Button onClick={() => handleAction('busy')} disabled={actionLoading} variant="outline" className="w-full h-12"><X className="w-4 h-4 mr-2" />Busy</Button></>}
            {effectiveState === 'seen' && <Button onClick={() => handleAction('onmyway')} disabled={actionLoading} className="w-full h-14 text-lg bg-status-in-progress hover:bg-status-in-progress/90"><Navigation className="w-5 h-5 mr-2" />On My Way</Button>}
            {effectiveState === 'on_my_way' && <Button onClick={() => handleAction('complete')} disabled={actionLoading} className="w-full h-14 text-lg bg-status-completed hover:bg-status-completed/90"><Check className="w-5 h-5 mr-2" />Complete</Button>}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col" onClick={handleUserInteraction}>
      <header className="px-4 py-4 border-b border-border bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link 
            to="/" 
            className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary transition-all"
          >
            <Home className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <Select value={selectedWorkerId?.toString() || ''} onValueChange={(v) => setSelectedWorkerId(Number(v))}>
              <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                {workers.filter(w => w.on_shift).map((w) => (
                  <SelectItem key={w.id} value={w.id.toString()}>{w.name} ({w.role})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentWorker && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
                <MapPin className="w-3 h-3" />
                <span>{currentZone?.name || 'Unknown'}</span>
              </div>
            )}
          </div>
          <button 
            onClick={toggleAudio} 
            className="p-2.5 rounded-xl bg-secondary/80 hover:bg-secondary transition-all"
          >
            {audioEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary animate-pulse" />
          <h2 className="font-semibold text-foreground font-display">Incoming Tasks</h2>
          <span className="text-sm text-muted-foreground">({myTasks.length})</span>
          {audioEnabled && audioInitialized && (
            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/50">
              <Volume2 className="w-3 h-3 text-success" /> Audio On
            </span>
          )}
        </div>
        {myTasks.length === 0 ? (
          <div className="data-panel text-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Check className="w-8 h-8 text-status-completed" />
            </div>
            <p className="text-foreground font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No pending tasks</p>
            {!audioInitialized && (
              <p className="text-xs text-muted-foreground mt-4">
                Tap anywhere to enable audio notifications
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">{myTasks.map((task) => {
            const zone = zones.find((z) => z.id === task.zone_id);
            return (
              <button 
                key={task.id} 
                onClick={() => setActiveTaskId(task.id)} 
                className={cn(
                  'w-full data-panel text-left transition-all hover:border-primary/30',
                  task.priority === 'urgent' && 'border-status-urgent/40 animate-pulse'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground capitalize">{task.type}</span>
                      <StatusBadge status={task.status as TaskStatus} priority={task.priority as Priority} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{zone?.name}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            );
          })}</div>
        )}
      </main>
      <footer className="p-4 border-t border-border bg-card/50">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className={cn('w-2 h-2 rounded-full', currentWorker?.worker_state?.device_online ? 'bg-status-completed animate-pulse' : 'bg-muted-foreground')} />
          <span className="text-muted-foreground">{currentWorker?.worker_state?.device_online ? 'Online • Listening' : 'Offline'}</span>
        </div>
      </footer>
    </div>
  );
}
