import { cn } from '@/lib/utils';
import { LayoutDashboard, ListTodo, Users, MapPin, BarChart3, Smartphone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  className?: string;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ListTodo, label: 'Tasks', path: '/tasks' },
  { icon: Users, label: 'Workers', path: '/workers' },
  { icon: MapPin, label: 'Zones', path: '/zones' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Smartphone, label: 'Worker App', path: '/worker-app' },
];

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'w-16 lg:w-56 flex flex-col border-r border-border bg-sidebar',
        className
      )}
    >
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden lg:block text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="hidden lg:block text-xs text-sidebar-foreground/60">
          <p>Dispatch v1.0</p>
          <p className="mt-0.5">© 2024 Hotel Ops</p>
        </div>
      </div>
    </aside>
  );
}
