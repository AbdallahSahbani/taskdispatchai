import { cn } from '@/lib/utils';
import { Radio, Settings, Bell } from 'lucide-react';
import { HomeButton } from './HomeButton';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-md',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <HomeButton />
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Radio className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight font-display">
              Dispatch Center
            </h1>
            <p className="text-xs text-muted-foreground">Luxury Hotel Operations</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-success">System Online</span>
        </div>
        <button className="p-2.5 rounded-xl hover:bg-secondary/80 transition-all relative group">
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
        </button>
        <button className="p-2.5 rounded-xl hover:bg-secondary/80 transition-all group">
          <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </div>
    </header>
  );
}
