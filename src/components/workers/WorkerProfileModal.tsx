import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  MapPin,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimulatedWorker } from '@/stores/simulationStore';

interface WorkerProfileModalProps {
  worker: SimulatedWorker | null;
  open: boolean;
  onClose: () => void;
}

export function WorkerProfileModal({ worker, open, onClose }: WorkerProfileModalProps) {
  if (!worker) return null;

  const performanceMetrics = [
    { 
      label: 'Reliability Score', 
      value: worker.reliabilityScore * 100, 
      suffix: '%',
      color: worker.reliabilityScore >= 0.9 ? 'text-emerald-400' : worker.reliabilityScore >= 0.8 ? 'text-amber-400' : 'text-red-400'
    },
    { 
      label: 'Avg Response Time', 
      value: worker.avgResponseTime, 
      suffix: 's',
      color: worker.avgResponseTime <= 45 ? 'text-emerald-400' : worker.avgResponseTime <= 60 ? 'text-amber-400' : 'text-red-400'
    },
    { 
      label: 'Tasks Completed', 
      value: worker.tasksCompleted, 
      suffix: '',
      color: 'text-blue-400'
    },
  ];

  const statusConfig = {
    idle: { label: 'Available', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    moving: { label: 'En Route', color: 'bg-blue-500', textColor: 'text-blue-400' },
    working: { label: 'On Task', color: 'bg-amber-500', textColor: 'text-amber-400' },
  };

  const status = statusConfig[worker.status];

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            {/* Avatar */}
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shadow-lg"
              style={{ backgroundColor: worker.color }}
            >
              <span className="text-white">{worker.initials}</span>
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-100">{worker.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                  {worker.role}
                </Badge>
                <Badge className={cn('text-xs', status.color, 'border-none')}>
                  {status.label}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Current Location */}
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
            <MapPin className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Current Location</p>
              <p className="text-sm text-slate-200 capitalize">
                {worker.position.zoneId.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Performance Metrics
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {performanceMetrics.map((metric) => (
                <div 
                  key={metric.label}
                  className="p-3 bg-slate-800/50 rounded-lg text-center"
                >
                  <p className={cn('text-2xl font-bold font-mono', metric.color)}>
                    {metric.value.toFixed(0)}{metric.suffix}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reliability Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Reliability Score</span>
              <span className={performanceMetrics[0].color}>
                {(worker.reliabilityScore * 100).toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={worker.reliabilityScore * 100} 
              className="h-2 bg-slate-800"
            />
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </h3>
            
            <div className="space-y-2">
              {[
                { time: '2 min ago', action: 'Completed room cleaning', zone: 'Floor 7' },
                { time: '18 min ago', action: 'Started task assignment', zone: 'Floor 4 East' },
                { time: '45 min ago', action: 'Completed turndown service', zone: 'Floor 10' },
              ].map((activity, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/30"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-300">{activity.action}</p>
                    <p className="text-[10px] text-slate-500">{activity.zone}</p>
                  </div>
                  <span className="text-[10px] text-slate-600">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>Shift: 6:00 AM - 2:00 PM</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-4 h-4" />
              <span>On duty: 5h 23m</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
