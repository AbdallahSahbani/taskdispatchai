import { cn } from '@/lib/utils';
import { Radio, Settings, Bell } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
          <Radio className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            Dispatch Center
          </h1>
          <p className="text-xs text-muted-foreground">Hotel Operations Hub</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-completed/10 border border-status-completed/20">
          <span className="w-2 h-2 rounded-full bg-status-completed animate-pulse" />
          <span className="text-xs font-medium text-status-completed">System Online</span>
        </div>
        <button className="p-2 rounded-lg hover:bg-secondary transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-urgent" />
        </button>
        <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
