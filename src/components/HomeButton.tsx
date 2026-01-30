import { Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HomeButtonProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
}

export function HomeButton({ 
  className, 
  variant = 'ghost', 
  size = 'icon' 
}: HomeButtonProps) {
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/dashboard';

  if (isHome) return null;

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn(
        'transition-all hover:bg-primary/10 hover:text-primary',
        className
      )}
    >
      <Link to="/" aria-label="Go to Dashboard">
        <Home className="h-5 w-5" />
      </Link>
    </Button>
  );
}
