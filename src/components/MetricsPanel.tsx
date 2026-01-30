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
        'relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-card/80 p-4 backdrop-blur-sm transition-all hover:border-primary/30',
        highlight ? 'border-primary/30 shadow-sm' : 'border-border/50'
      )}
    >
      {/* Subtle glow effect */}
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      )}
      <div className="relative flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/50 border border-border/30">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-2xl font-semibold font-mono text-foreground tracking-tight">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
          {subValue && <div className="text-xs text-muted-foreground/80 mt-0.5">{subValue}</div>}
        </div>
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
