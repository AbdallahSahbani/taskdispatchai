// Task types aligned with PDF architecture spec
export type TaskType = 'towels' | 'maintenance' | 'trash' | 'cleaning' | 'room_service';
export type TaskStatus = 'new' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'rerouted';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type WorkerRole = 'housekeeping' | 'maintenance' | 'room_service' | 'f_and_b';
export type AssignmentState = 'pending_ack' | 'acked' | 'completed' | 'failed';
export type DeviceStatus = 'online' | 'offline' | 'weak_signal';
export type ShiftStatus = 'on_shift' | 'off_shift' | 'break';

// Zone category enum matching PDF spec
export type ZoneCategory = 
  | 'guest_floor'
  | 'outdoor'
  | 'f_and_b'
  | 'public'
  | 'service';

export interface Zone {
  id: string;
  name: string;
  category?: ZoneCategory;
  floorNumber?: number | null;
  wing?: 'east' | 'west' | null;
  neighbors: string[];
  travelTimeToNeighbor: Record<string, number>; // seconds
  
  // Display properties
  displayOrder?: number;
  gridRow?: number;
  gridCol?: number;
  
  // Operational metadata
  avgTaskDurationSeconds?: number;
  typicalTaskTypes?: string[];
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
  requiredSkill?: string | null;
  
  // Scoring metadata (from routing)
  dispatchScore?: number;
}

export interface Worker {
  id: string;
  employeeId?: number;
  name: string;
  email?: string;
  phone?: string;
  
  // Role and skills
  role: WorkerRole;
  primarySkills?: string[];
  secondarySkills?: string[];
  
  // Status
  onShift: boolean;
  shiftStatus?: ShiftStatus;
  
  // Location
  currentZoneId: string;
  zoneConfidence?: number;
  
  // Performance metrics
  reliabilityScore: number; // 0.0 to 1.0
  avgResponseSeconds?: number;
  tasksCompleted?: number;
  tasksDeclined?: number;
  
  // Device
  deviceStatus: DeviceStatus;
  lastSeenAt?: Date;
  avatar?: string;
}

export interface WorkerState {
  workerId: number;
  
  // Shift status
  shiftStatus: ShiftStatus;
  shiftStarted?: Date;
  
  // Device connectivity
  deviceStatus: DeviceStatus;
  lastSeenAt?: Date;
  lastHeartbeat?: Date;
  
  // WiFi positioning data
  currentZoneId: string | null;
  currentBssid?: string;
  currentRssi?: number;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  positionConfidence: number;
  
  // Current workload
  activeTaskCount: number;
}

export interface Assignment {
  id: string;
  taskId: string;
  workerId: string;
  assignedAt: Date;
  acknowledgedAt?: Date;
  completedAt?: Date;
  state: AssignmentState;
  reroutes: number;
}

export interface Event {
  id: string;
  type: 
    | 'task_created' 
    | 'task_assigned' 
    | 'task_ack' 
    | 'task_reroute' 
    | 'task_complete'
    | 'task_escalate'
    | 'worker_created'
    | 'worker_sync'
    | 'worker_zone_update'
    | 'worker_busy';
  timestamp: Date;
  taskId?: number;
  workerId?: number;
  zoneId?: string;
  payload?: Record<string, unknown>;
}

export interface MetricsSummary {
  avgResponseTime: number; // seconds
  avgCompletionTime: number; // seconds
  totalTasks: number;
  completedTasks: number;
  reroutes: number;
  activeWorkers: number;
  pendingTasks: number;
}

export interface ZoneMetrics {
  zoneId: string;
  zoneName: string;
  volume: number;
  avgResponseSeconds: number | null;
  avgCompletionSeconds: number | null;
  rerouteCount: number;
}

// Dispatch scoring types
export interface DispatchScoreBreakdown {
  workerId: number;
  workerName: string;
  totalScore: number;
  
  // Component scores (0-100)
  proximityScore: number;
  reliabilityScore: number;
  loadScore: number;
  deviceScore: number;
  skillScore: number;
  
  // Metadata
  travelTimeSeconds: number;
  currentZone: string | null;
  eligible: boolean;
  ineligibleReason?: string;
}

// WiFi positioning types
export interface WiFiScanResult {
  bssid: string;
  ssid: string;
  rssi: number; // dBm, typically -30 to -90
  frequency: number;
  timestamp: number;
}

export interface IMUData {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  magnetometer: { x: number; y: number; z: number };
  barometer: number; // hPa
}
