import { MetricsSummary } from '@/types/dispatch';
import { Clock, CheckCircle2, AlertTriangle, Users, Timer, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsPanelProps {
  metrics: MetricsSummary;
  className?: string;
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
}

function MetricCard({ icon: Icon, label, value, subValue, highlight }: MetricCardProps) {
  return (
    <div
      className={cn(
        'data-panel flex items-center gap-4',
        highlight && 'border-primary/30'
      )}
    >
      <div className="p-3 rounded-lg bg-secondary/50">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div>
        <div className="text-2xl font-semibold font-mono text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {subValue && <div className="text-xs text-muted-foreground mt-0.5">{subValue}</div>}
      </div>
    </div>
  );
}

export function MetricsPanel({ metrics, className }: MetricsPanelProps) {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const completionRate = Math.round((metrics.completedTasks / metrics.totalTasks) * 100);

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4', className)}>
      <MetricCard
        icon={Timer}
        label="Avg Response"
        value={formatTime(metrics.avgResponseTime)}
        highlight
      />
      <MetricCard
        icon={Clock}
        label="Avg Completion"
        value={formatTime(metrics.avgCompletionTime)}
      />
      <MetricCard
        icon={CheckCircle2}
        label="Completed"
        value={metrics.completedTasks}
        subValue={`${completionRate}% rate`}
      />
      <MetricCard
        icon={AlertTriangle}
        label="Active Tasks"
        value={metrics.totalTasks - metrics.completedTasks}
      />
      <MetricCard
        icon={RotateCcw}
        label="Reroutes"
        value={metrics.reroutes}
      />
      <MetricCard
        icon={Users}
        label="Active Workers"
        value={metrics.activeWorkers}
      />
    </div>
  );
}
