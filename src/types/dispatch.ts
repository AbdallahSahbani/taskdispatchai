export type TaskType = 'towels' | 'maintenance' | 'trash' | 'cleaning' | 'room_service';
export type TaskStatus = 'new' | 'assigned' | 'in_progress' | 'completed';
export type Priority = 'normal' | 'urgent';
export type WorkerRole = 'housekeeping' | 'maintenance' | 'room_service';
export type AssignmentState = 'pending' | 'acked' | 'failed';

export interface Zone {
  id: string;
  name: string;
  neighbors: string[];
  travelTimeToNeighbor: Record<string, number>; // seconds
}

export interface Task {
  id: string;
  type: TaskType;
  source: string; // e.g., "Room 412"
  zoneId: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: Date;
  description?: string;
}

export interface Worker {
  id: string;
  name: string;
  role: WorkerRole;
  onShift: boolean;
  currentZoneId: string;
  reliabilityScore: number; // 0-100, starts at 50
  deviceStatus: 'online' | 'offline';
  avatar?: string;
}

export interface Assignment {
  id: string;
  taskId: string;
  workerId: string;
  assignedAt: Date;
  acknowledgedAt?: Date;
  completedAt?: Date;
  state: AssignmentState;
}

export interface Event {
  id: string;
  type: 'task_created' | 'assigned' | 'ack' | 'reroute' | 'complete';
  timestamp: Date;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export interface MetricsSummary {
  avgResponseTime: number; // seconds
  avgCompletionTime: number; // seconds
  totalTasks: number;
  completedTasks: number;
  reroutes: number;
  activeWorkers: number;
}
