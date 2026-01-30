import { cn } from '@/lib/utils';
import { LayoutDashboard, ListTodo, Users, MapPin, BarChart3, Smartphone, Home, Wifi } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  className?: string;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: MapPin, label: 'Zone Map', path: '/zones' },
  { icon: Users, label: 'Workers', path: '/workers' },
  { icon: Smartphone, label: 'Worker App', path: '/worker-app' },
];

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();

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

      <div className="p-4 border-t border-sidebar-border">
        <div className="hidden lg:flex items-center gap-2 px-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <Wifi className="w-3.5 h-3.5 text-success" />
            <span className="text-[11px] text-muted-foreground">WiFi Positioning Active</span>
          </div>
        </div>
        <div className="hidden lg:block text-[10px] text-sidebar-foreground/50 mt-3 px-2">
          <p className="font-display">Dispatch v2.0</p>
          <p className="mt-0.5">© 2026 Grand Hotel</p>
        </div>
      </div>
    </aside>
  );
}
