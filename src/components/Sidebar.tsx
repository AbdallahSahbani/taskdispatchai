import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, MapPin, Home, Wifi, Presentation, CheckCircle2, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  className?: string;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: MapPin, label: 'Zone Map', path: '/zones' },
  { icon: Users, label: 'Workers', path: '/workers' },
  { icon: Presentation, label: 'Pitch', path: '/pitch' },
];

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { signOut, profile } = useAuth();

  return (
    <aside
      className={cn(
        'w-16 lg:w-60 flex flex-col border-r border-border bg-gradient-to-b from-sidebar to-sidebar/95',
        className
      )}
    >
      {/* Logo Section */}
      <div className="hidden lg:flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30">
          <Home className="w-4 h-4 text-primary" />
        </div>
        <div>
          <span className="font-display font-semibold text-foreground tracking-tight">Grand Hotel</span>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Operations</p>
        </div>
      </div>

      <nav className="flex-1 py-4">
        <div className="px-3 mb-2">
          <span className="hidden lg:block text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-2">
            Navigation
          </span>
        </div>
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-primary border border-primary/20 shadow-sm'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
                  )}
                >
                  <item.icon className={cn(
                    'w-5 h-5 flex-shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <span className="hidden lg:block text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        {profile && (
          <div className="hidden lg:flex items-center gap-2 px-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
              {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'M'}
            </div>
            <span className="text-[11px] text-foreground truncate flex-1">{profile.full_name || 'Manager'}</span>
          </div>
        )}
        <div className="hidden lg:flex items-center gap-2 px-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span className="text-[11px] text-success font-medium">System Online</span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2 px-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <Wifi className="w-3.5 h-3.5 text-info" />
            <span className="text-[11px] text-muted-foreground">WiFi Positioning Active</span>
          </div>
        </div>
        <button
          onClick={signOut}
          className="hidden lg:flex items-center gap-2 px-5 py-2 w-full rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-[11px]">Sign Out</span>
        </button>
        <div className="hidden lg:block text-[10px] text-sidebar-foreground/50 mt-2 px-2">
          <p className="font-display">Dispatch v4.0</p>
          <p className="mt-0.5">© 2026 Grand Hotel</p>
        </div>
      </div>
    </aside>
  );
}
