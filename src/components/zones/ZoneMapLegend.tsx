import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface ZoneMapLegendProps {
  showAssignmentIndicator?: boolean;
}

export function ZoneMapLegend({ showAssignmentIndicator }: ZoneMapLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {/* Worker legend */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-md">
          W
        </div>
        <span className="text-muted-foreground">Worker</span>
      </div>
      
      {/* Zone category legends */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-zone-floor" />
        <span className="text-muted-foreground text-xs">Floors</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-zone-outdoor" />
        <span className="text-muted-foreground text-xs">Outdoor</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-zone-food" />
        <span className="text-muted-foreground text-xs">F&B</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-zone-public" />
        <span className="text-muted-foreground text-xs">Public</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-zone-service" />
        <span className="text-muted-foreground text-xs">Service</span>
      </div>
      
      {/* Task status legends */}
      <div className="border-l border-border pl-4 flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-task-pending/50 border border-task-pending" />
        <span className="text-muted-foreground text-xs">Tasks</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-task-urgent/50 border border-task-urgent animate-pulse" />
        <span className="text-muted-foreground text-xs">Urgent</span>
      </div>
      
      {/* Assignment indicator */}
      {showAssignmentIndicator && (
        <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-task-complete/20 text-task-complete text-xs font-medium animate-pulse">
          <MapPin className="w-3 h-3" />
          Task assigned - Best route selected
        </div>
      )}
    </div>
  );
}
