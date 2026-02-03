/**
 * SIMULATION SERVICE
 * 
 * Controls demo mode for pitch presentations with:
 * - Realistic worker movement (walking speed, pathfinding)
 * - Auto-generated tasks at realistic intervals
 * - Configurable speed (1x, 2x, 5x, 10x)
 * - Toggle between LIVE and DEMO modes
 */

import { create } from 'zustand';

// ============================================
// TYPES
// ============================================

export interface Position {
  x: number;
  y: number;
  zoneId: string;
}

export interface SimulatedWorker {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
  position: Position;
  targetPosition: Position | null;
  path: Position[];
  pathIndex: number;
  status: 'idle' | 'moving' | 'working';
  currentTaskId: string | null;
  speed: number; // pixels per tick at 1x
  reliabilityScore: number;
  tasksCompleted: number;
  avgResponseTime: number;
}

export interface SimulatedTask {
  id: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  zoneId: string;
  zoneName: string;
  position: Position;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  assignedTo: string | null;
  createdAt: number;
  assignedAt: number | null;
  completedAt: number | null;
}

export interface ZoneNode {
  id: string;
  name: string;
  category: 'guest_floor' | 'outdoor' | 'f_and_b' | 'public' | 'service' | 'utility';
  x: number;
  y: number;
  width: number;
  height: number;
  connections: string[];
  floor?: number;
}

interface SimulationMetrics {
  activeTasks: number;
  completedTasks: number;
  avgResponseTime: number;
  avgCompletionTime: number;
  activeWorkers: number;
}

interface SimulationState {
  // Mode
  mode: 'live' | 'demo';
  isRunning: boolean;
  speed: number; // 1, 2, 5, 10
  
  // Data
  workers: SimulatedWorker[];
  tasks: SimulatedTask[];
  zones: ZoneNode[];
  
  // Time tracking
  lastTick: number;
  taskGenerationTimer: number;
  
  // Metrics
  metrics: SimulationMetrics;
  
  // Actions
  setMode: (mode: 'live' | 'demo') => void;
  start: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  tick: () => void;
  reset: () => void;
  
  // Internal
  _findPath: (from: string, to: string) => string[];
  _moveWorkerAlongPath: (workerId: string) => void;
  _generateTask: () => void;
  _assignTask: (taskId: string) => void;
  _completeTask: (taskId: string) => void;
}

// ============================================
// CONSTANTS
// ============================================

const MOVEMENT_SPEED = 2; // base pixels per tick
const TASK_WORK_TIME = 180; // ticks to complete a task (3 mins at 1x)
const TASK_GENERATION_INTERVAL = 60; // ticks between new tasks

const WORKER_COLORS = [
  'hsl(210, 70%, 50%)',  // blue
  'hsl(160, 60%, 45%)',  // emerald
  'hsl(280, 60%, 55%)',  // violet
  'hsl(340, 65%, 55%)',  // pink
  'hsl(190, 70%, 45%)',  // cyan
  'hsl(30, 70%, 50%)',   // amber
];

const TASK_TYPES = [
  'Room Cleaning',
  'Turndown Service',
  'Room Service',
  'Maintenance',
  'Guest Request',
  'Linen Delivery',
];

// ============================================
// DEMO ZONES - Professional hotel layout
// ============================================

const DEMO_ZONES: ZoneNode[] = [
  // Upper floors (Guest)
  { id: 'floor_10', name: 'Floor 10', category: 'guest_floor', x: 2, y: 3, width: 47, height: 8, connections: ['floor_9'], floor: 10 },
  { id: 'floor_9', name: 'Floor 9', category: 'guest_floor', x: 51, y: 3, width: 47, height: 8, connections: ['floor_10', 'floor_8'], floor: 9 },
  { id: 'floor_8', name: 'Floor 8', category: 'guest_floor', x: 2, y: 13, width: 47, height: 8, connections: ['floor_9', 'floor_7'], floor: 8 },
  { id: 'floor_7', name: 'Floor 7', category: 'guest_floor', x: 51, y: 13, width: 47, height: 8, connections: ['floor_8', 'floor_6'], floor: 7 },
  { id: 'floor_6', name: 'Floor 6', category: 'guest_floor', x: 2, y: 23, width: 47, height: 8, connections: ['floor_7', 'floor_5'], floor: 6 },
  { id: 'floor_5', name: 'Floor 5', category: 'guest_floor', x: 51, y: 23, width: 47, height: 8, connections: ['floor_6', 'floor_4_west'], floor: 5 },
  
  // Split floors
  { id: 'floor_4_west', name: 'Floor 4 West', category: 'guest_floor', x: 2, y: 33, width: 23, height: 8, connections: ['floor_5', 'floor_4_east'], floor: 4 },
  { id: 'floor_4_east', name: 'Floor 4 East', category: 'guest_floor', x: 27, y: 33, width: 22, height: 8, connections: ['floor_4_west', 'floor_3_west'], floor: 4 },
  { id: 'floor_3_west', name: 'Floor 3 West', category: 'guest_floor', x: 51, y: 33, width: 23, height: 8, connections: ['floor_4_east', 'floor_3_east'], floor: 3 },
  { id: 'floor_3_east', name: 'Floor 3 East', category: 'guest_floor', x: 76, y: 33, width: 22, height: 8, connections: ['floor_3_west', 'floor_2'], floor: 3 },
  
  // Lower floors
  { id: 'floor_2', name: 'Floor 2', category: 'guest_floor', x: 2, y: 43, width: 47, height: 8, connections: ['floor_3_east', 'floor_1'], floor: 2 },
  { id: 'floor_1', name: 'Floor 1', category: 'guest_floor', x: 51, y: 43, width: 47, height: 8, connections: ['floor_2', 'lobby', 'service_core'], floor: 1 },
  
  // Public areas
  { id: 'lobby', name: 'Grand Lobby', category: 'public', x: 35, y: 54, width: 30, height: 12, connections: ['floor_1', 'restaurant', 'bar', 'pool_deck'] },
  
  // F&B
  { id: 'restaurant', name: 'Restaurant', category: 'f_and_b', x: 2, y: 54, width: 16, height: 12, connections: ['lobby', 'fine_dining'] },
  { id: 'fine_dining', name: 'Fine Dining', category: 'f_and_b', x: 19, y: 54, width: 14, height: 12, connections: ['restaurant', 'lobby'] },
  { id: 'bar', name: 'Lounge Bar', category: 'f_and_b', x: 67, y: 54, width: 14, height: 12, connections: ['lobby', 'back_of_house'] },
  
  // Service
  { id: 'service_core', name: 'Service Core', category: 'service', x: 2, y: 68, width: 18, height: 10, connections: ['floor_1', 'linen_storage', 'back_of_house'] },
  { id: 'linen_storage', name: 'Linen Storage', category: 'utility', x: 22, y: 68, width: 16, height: 10, connections: ['service_core'] },
  { id: 'back_of_house', name: 'Back of House', category: 'service', x: 40, y: 68, width: 20, height: 10, connections: ['bar', 'service_core'] },
  
  // Outdoor
  { id: 'pool_deck', name: 'Pool Deck', category: 'outdoor', x: 62, y: 68, width: 18, height: 10, connections: ['lobby', 'resort_beach'] },
  { id: 'resort_beach', name: 'Resort Beach', category: 'outdoor', x: 82, y: 54, width: 16, height: 24, connections: ['pool_deck'] },
];

// ============================================
// DEMO WORKERS
// ============================================

const createDemoWorkers = (): SimulatedWorker[] => {
  const workers: SimulatedWorker[] = [
    { id: 'w1', name: 'Maria Santos', initials: 'MS', role: 'Housekeeping', color: WORKER_COLORS[0], position: { x: 25, y: 7, zoneId: 'floor_10' }, targetPosition: null, path: [], pathIndex: 0, status: 'idle', currentTaskId: null, speed: MOVEMENT_SPEED, reliabilityScore: 0.95, tasksCompleted: 127, avgResponseTime: 42 },
    { id: 'w2', name: 'James Chen', initials: 'JC', role: 'Housekeeping', color: WORKER_COLORS[1], position: { x: 75, y: 17, zoneId: 'floor_7' }, targetPosition: null, path: [], pathIndex: 0, status: 'idle', currentTaskId: null, speed: MOVEMENT_SPEED, reliabilityScore: 0.88, tasksCompleted: 98, avgResponseTime: 55 },
    { id: 'w3', name: 'Ana Rodriguez', initials: 'AR', role: 'Housekeeping', color: WORKER_COLORS[2], position: { x: 10, y: 37, zoneId: 'floor_4_west' }, targetPosition: null, path: [], pathIndex: 0, status: 'idle', currentTaskId: null, speed: MOVEMENT_SPEED, reliabilityScore: 0.92, tasksCompleted: 145, avgResponseTime: 38 },
    { id: 'w4', name: 'Mike Thompson', initials: 'MT', role: 'Maintenance', color: WORKER_COLORS[3], position: { x: 10, y: 72, zoneId: 'service_core' }, targetPosition: null, path: [], pathIndex: 0, status: 'idle', currentTaskId: null, speed: MOVEMENT_SPEED * 1.1, reliabilityScore: 0.97, tasksCompleted: 203, avgResponseTime: 28 },
    { id: 'w5', name: 'Sofia Kim', initials: 'SK', role: 'Room Service', color: WORKER_COLORS[4], position: { x: 50, y: 72, zoneId: 'back_of_house' }, targetPosition: null, path: [], pathIndex: 0, status: 'idle', currentTaskId: null, speed: MOVEMENT_SPEED * 1.2, reliabilityScore: 0.91, tasksCompleted: 89, avgResponseTime: 45 },
    { id: 'w6', name: 'David Park', initials: 'DP', role: 'Housekeeping', color: WORKER_COLORS[5], position: { x: 85, y: 37, zoneId: 'floor_3_east' }, targetPosition: null, path: [], pathIndex: 0, status: 'idle', currentTaskId: null, speed: MOVEMENT_SPEED, reliabilityScore: 0.85, tasksCompleted: 76, avgResponseTime: 62 },
  ];
  return workers;
};

// ============================================
// STORE
// ============================================

export const useSimulationStore = create<SimulationState>((set, get) => ({
  mode: 'demo',
  isRunning: false,
  speed: 1,
  workers: createDemoWorkers(),
  tasks: [],
  zones: DEMO_ZONES,
  lastTick: Date.now(),
  taskGenerationTimer: 0,
  metrics: {
    activeTasks: 0,
    completedTasks: 0,
    avgResponseTime: 0,
    avgCompletionTime: 0,
    activeWorkers: 6,
  },

  setMode: (mode) => {
    set({ mode });
    if (mode === 'demo') {
      get().reset();
    }
  },

  start: () => {
    set({ isRunning: true, lastTick: Date.now() });
  },

  stop: () => {
    set({ isRunning: false });
  },

  setSpeed: (speed) => {
    set({ speed: Math.max(1, Math.min(10, speed)) });
  },

  reset: () => {
    set({
      workers: createDemoWorkers(),
      tasks: [],
      isRunning: false,
      taskGenerationTimer: 0,
      metrics: {
        activeTasks: 0,
        completedTasks: 0,
        avgResponseTime: 0,
        avgCompletionTime: 0,
        activeWorkers: 6,
      },
    });
  },

  // BFS pathfinding through zone connections
  _findPath: (from: string, to: string) => {
    const zones = get().zones;
    const zoneMap = new Map(zones.map(z => [z.id, z]));
    
    if (from === to) return [from];
    
    const queue: string[][] = [[from]];
    const visited = new Set<string>([from]);
    
    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];
      const zone = zoneMap.get(current);
      
      if (!zone) continue;
      
      for (const neighbor of zone.connections) {
        if (neighbor === to) {
          return [...path, neighbor];
        }
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    
    return [from]; // No path found, stay in place
  },

  _moveWorkerAlongPath: (workerId: string) => {
    set((state) => {
      const workerIndex = state.workers.findIndex(w => w.id === workerId);
      if (workerIndex === -1) return state;
      
      const worker = state.workers[workerIndex];
      if (worker.path.length === 0 || worker.pathIndex >= worker.path.length) {
        // Arrived at destination
        return {
          workers: state.workers.map((w, i) => 
            i === workerIndex ? { ...w, status: 'working' as const, path: [], pathIndex: 0 } : w
          ),
        };
      }
      
      const target = worker.path[worker.pathIndex];
      const dx = target.x - worker.position.x;
      const dy = target.y - worker.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const moveDistance = worker.speed * state.speed;
      
      if (distance <= moveDistance) {
        // Reached waypoint, move to next
        return {
          workers: state.workers.map((w, i) => 
            i === workerIndex ? {
              ...w,
              position: target,
              pathIndex: w.pathIndex + 1,
            } : w
          ),
        };
      }
      
      // Move toward waypoint
      const ratio = moveDistance / distance;
      const newX = worker.position.x + dx * ratio;
      const newY = worker.position.y + dy * ratio;
      
      return {
        workers: state.workers.map((w, i) => 
          i === workerIndex ? {
            ...w,
            position: { x: newX, y: newY, zoneId: w.position.zoneId },
          } : w
        ),
      };
    });
  },

  _generateTask: () => {
    const zones = get().zones.filter(z => z.category === 'guest_floor');
    const randomZone = zones[Math.floor(Math.random() * zones.length)];
    const priorities: SimulatedTask['priority'][] = ['low', 'normal', 'normal', 'normal', 'high', 'urgent'];
    
    const task: SimulatedTask = {
      id: `task-${Date.now()}`,
      type: TASK_TYPES[Math.floor(Math.random() * TASK_TYPES.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      zoneId: randomZone.id,
      zoneName: randomZone.name,
      position: {
        x: randomZone.x + randomZone.width / 2,
        y: randomZone.y + randomZone.height / 2,
        zoneId: randomZone.id,
      },
      status: 'pending',
      assignedTo: null,
      createdAt: Date.now(),
      assignedAt: null,
      completedAt: null,
    };
    
    set((state) => ({
      tasks: [...state.tasks, task],
      metrics: { ...state.metrics, activeTasks: state.metrics.activeTasks + 1 },
    }));
    
    // Auto-assign after short delay
    setTimeout(() => get()._assignTask(task.id), 500);
  },

  _assignTask: (taskId: string) => {
    set((state) => {
      const taskIndex = state.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return state;
      
      const task = state.tasks[taskIndex];
      if (task.status !== 'pending') return state;
      
      // Find best available worker (closest idle worker)
      const availableWorkers = state.workers.filter(w => w.status === 'idle');
      if (availableWorkers.length === 0) return state;
      
      // Simple scoring: prefer closer workers
      let bestWorker = availableWorkers[0];
      let bestDistance = Infinity;
      
      for (const worker of availableWorkers) {
        const path = get()._findPath(worker.position.zoneId, task.zoneId);
        if (path.length < bestDistance) {
          bestDistance = path.length;
          bestWorker = worker;
        }
      }
      
      // Build path positions
      const pathZones = get()._findPath(bestWorker.position.zoneId, task.zoneId);
      const pathPositions: Position[] = pathZones.map(zoneId => {
        const zone = state.zones.find(z => z.id === zoneId)!;
        return {
          x: zone.x + zone.width / 2,
          y: zone.y + zone.height / 2,
          zoneId: zone.id,
        };
      });
      
      return {
        tasks: state.tasks.map((t, i) => 
          i === taskIndex ? { ...t, status: 'assigned' as const, assignedTo: bestWorker.id, assignedAt: Date.now() } : t
        ),
        workers: state.workers.map(w => 
          w.id === bestWorker.id ? {
            ...w,
            status: 'moving' as const,
            currentTaskId: taskId,
            path: pathPositions,
            pathIndex: 0,
            targetPosition: task.position,
          } : w
        ),
      };
    });
  },

  _completeTask: (taskId: string) => {
    set((state) => {
      const taskIndex = state.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return state;
      
      const task = state.tasks[taskIndex];
      const worker = state.workers.find(w => w.id === task.assignedTo);
      
      const responseTime = task.assignedAt ? (Date.now() - task.assignedAt) / 1000 : 0;
      
      return {
        tasks: state.tasks.map((t, i) => 
          i === taskIndex ? { ...t, status: 'completed' as const, completedAt: Date.now() } : t
        ),
        workers: state.workers.map(w => 
          w.id === task.assignedTo ? {
            ...w,
            status: 'idle' as const,
            currentTaskId: null,
            path: [],
            pathIndex: 0,
            tasksCompleted: w.tasksCompleted + 1,
          } : w
        ),
        metrics: {
          ...state.metrics,
          completedTasks: state.metrics.completedTasks + 1,
          activeTasks: state.metrics.activeTasks - 1,
          avgResponseTime: Math.round((state.metrics.avgResponseTime + responseTime) / 2),
        },
      };
    });
  },

  tick: () => {
    const state = get();
    if (!state.isRunning || state.mode !== 'demo') return;
    
    // Update task generation timer
    set((s) => ({ taskGenerationTimer: s.taskGenerationTimer + s.speed }));
    
    // Generate new task periodically
    if (state.taskGenerationTimer >= TASK_GENERATION_INTERVAL) {
      state._generateTask();
      set({ taskGenerationTimer: 0 });
    }
    
    // Move workers along their paths
    for (const worker of state.workers) {
      if (worker.status === 'moving') {
        state._moveWorkerAlongPath(worker.id);
      } else if (worker.status === 'working' && worker.currentTaskId) {
        // Random chance to complete task each tick
        if (Math.random() < 0.02 * state.speed) {
          state._completeTask(worker.currentTaskId);
        }
      }
    }
    
    // Update in-progress tasks
    set((s) => ({
      tasks: s.tasks.map(t => 
        t.status === 'assigned' ? { ...t, status: 'in_progress' as const } : t
      ),
    }));
  },
}));

// Animation loop hook
export function useSimulationLoop() {
  const { isRunning, tick } = useSimulationStore();
  
  if (typeof window !== 'undefined') {
    let animationId: number;
    
    const loop = () => {
      tick();
      animationId = requestAnimationFrame(loop);
    };
    
    if (isRunning) {
      animationId = requestAnimationFrame(loop);
    }
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }
}
