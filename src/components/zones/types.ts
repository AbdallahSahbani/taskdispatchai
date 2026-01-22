// Zone category types
export type ZoneCategory = 
  | 'guestFloors' 
  | 'publicAreas' 
  | 'foodBeverage' 
  | 'backOfHouse' 
  | 'outdoor' 
  | 'utility';

// Worker status types
export type WorkerStatus = 'available' | 'busy' | 'onBreak' | 'offline';

// Task priority types
export type TaskPriority = 'urgent' | 'high' | 'pending' | 'inProgress' | 'completed';

// Zone layout position
export interface ZoneLayoutPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Zone with category mapping
export interface ZoneConfig extends ZoneLayoutPosition {
  category: ZoneCategory;
  neighbors: string[];
}

// Worker display info
export interface WorkerDisplay {
  id: string;
  name: string;
  initials: string;
  status: WorkerStatus;
  currentZone: string;
  avatarColor: string;
}

// Task display info
export interface TaskDisplay {
  id: string;
  zoneId: string;
  priority: TaskPriority;
  type: string;
  description?: string;
}

// Zone statistics
export interface ZoneStats {
  workerCount: number;
  taskCount: number;
  urgentCount: number;
  hasUrgent: boolean;
  status: 'urgent' | 'pending' | 'clear';
}
