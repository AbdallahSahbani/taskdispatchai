import { TaskStatus } from '@/types/dispatch';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  activeFilter: TaskStatus | 'all';
  onFilterChange: (filter: TaskStatus | 'all') => void;
  counts: Record<TaskStatus | 'all', number>;
  className?: string;
}

const filters: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export function TaskFilters({ activeFilter, onFilterChange, counts, className }: TaskFiltersProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
            activeFilter === filter.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
        >
          {filter.label}
          <span
            className={cn(
              'font-mono text-xs px-1.5 py-0.5 rounded',
              activeFilter === filter.value
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {counts[filter.value]}
          </span>
        </button>
      ))}
    </div>
  );
}
