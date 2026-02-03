import { useSimulationStore } from '@/stores/simulationStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap,
  Radio,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SimulationControlsProps {
  className?: string;
}

export function SimulationControls({ className }: SimulationControlsProps) {
  const { mode, isRunning, speed, metrics, setMode, start, stop, setSpeed, reset } = useSimulationStore();

  const speedOptions = [1, 2, 5, 10];

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Mode Toggle */}
      <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
        <button
          onClick={() => setMode('live')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            mode === 'live' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3" />
            LIVE
          </span>
        </button>
        <button
          onClick={() => setMode('demo')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            mode === 'demo' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <span className="flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            DEMO
          </span>
        </button>
      </div>

      {/* Playback Controls (Demo mode only) */}
      {mode === 'demo' && (
        <>
          <div className="h-6 w-px bg-slate-700" />
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => isRunning ? stop() : start()}
                  className={cn(
                    'h-8 w-8 p-0',
                    isRunning ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
                  )}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isRunning ? 'Pause simulation' : 'Start simulation'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset simulation</TooltipContent>
            </Tooltip>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-md p-0.5">
            {speedOptions.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={cn(
                  'px-2 py-1 text-[10px] font-mono rounded transition-all',
                  speed === s 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </>
      )}

      {/* Metrics */}
      <div className="h-6 w-px bg-slate-700" />
      
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">{metrics.activeTasks}</span>
          <span className="text-slate-600">active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-mono">{metrics.completedTasks}</span>
          <span className="text-slate-600">done</span>
        </div>
        {metrics.avgResponseTime > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-blue-400 font-mono">{metrics.avgResponseTime}s</span>
            <span className="text-slate-600">avg</span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      {isRunning && (
        <Badge 
          variant="outline" 
          className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 animate-pulse"
        >
          <Activity className="w-3 h-3 mr-1" />
          Simulating
        </Badge>
      )}
    </div>
  );
}
