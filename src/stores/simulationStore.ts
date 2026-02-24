/**
 * SIMULATION SERVICE
 * 
 * Controls demo mode for pitch presentations with:
 * - Realistic worker movement on blueprint SVG coordinates
 * - Auto-generated tasks at realistic intervals
 * - Configurable speed (1x, 2x, 5x, 10x)
 * - Toggle between LIVE and DEMO modes
 * - Floor-based navigation matching the blueprint map
 */

import { create } from 'zustand';
import { FLOOR_DATA } from '@/components/zones/BlueprintFloorPlan';

// ============================================
// TYPES
// ============================================

export interface Position {
  x: number; // SVG x coordinate (0-1100)
  y: number; // SVG y coordinate (0-700)
  zoneId: string;
}

export interface SimulatedWorker {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
  // Position on the SVG map
  mapX: number;
  mapY: number;
  currentFloor: number; // Floor index (0=B1, 1=G, 2=L1, 3=L2, ...)
  // Path & movement
  targetPosition: Position | null;
  path: Position[];
  pathIndex: number;
  status: 'idle' | 'moving' | 'working';
  currentTaskId: string | null;
  speed: number; // SVG pixels per tick
  // Stats
  reliabilityScore: number;
  tasksCompleted: number;
  avgResponseTime: number;
  // Legacy compat
  position: { x: number; y: number; zoneId: string };
}

export interface SimulatedTask {
  id: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  zoneId: string;
  zoneName: string;
  roomLabel: string; // Room label on blueprint (e.g. "205", "LOBBY")
  floor: number; // Floor index
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
  mode: 'live' | 'demo';
  isRunning: boolean;
  speed: number;
  workers: SimulatedWorker[];
  tasks: SimulatedTask[];
  zones: ZoneNode[];
  lastTick: number;
  taskGenerationTimer: number;
  metrics: SimulationMetrics;

  setMode: (mode: 'live' | 'demo') => void;
  start: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  tick: () => void;
  reset: () => void;

  _generateTask: () => void;
  _assignTask: (taskId: string) => void;
  _completeTask: (taskId: string) => void;
  _moveWorker: (workerId: string) => void;
}

// ============================================
// CONSTANTS
// ============================================

const MOVEMENT_SPEED = 6; // SVG pixels per tick (corridors are ~1040px wide)
const TASK_GENERATION_INTERVAL = 40; // ticks between new tasks

const WORKER_COLORS = [
  'hsl(210,70%,50%)',
  'hsl(160,60%,45%)',
  'hsl(280,60%,55%)',
  'hsl(340,65%,55%)',
  'hsl(190,70%,45%)',
  'hsl(30,70%,50%)',
];

const TASK_TYPES = [
  'Room Cleaning', 'Turndown Service', 'Room Service',
  'Maintenance', 'Guest Request', 'Linen Delivery',
  'Minibar Restock', 'Deep Cleaning',
];

// Corridor Y positions for each guest room floor (SVG coordinates)
const CORRIDOR_Y = 334; // Main corridor center Y

// ============================================
// DEMO ZONES (kept for compatibility, but map uses FLOOR_DATA)
// ============================================

const DEMO_ZONES: ZoneNode[] = [
  { id: 'basement', name: 'Basement', category: 'service', x: 2, y: 3, width: 96, height: 10, connections: ['ground'], floor: 0 },
  { id: 'ground', name: 'Ground Floor', category: 'public', x: 2, y: 15, width: 96, height: 10, connections: ['basement', 'level_1', 'restaurant', 'bar'], floor: 1 },
  { id: 'restaurant', name: 'Restaurant', category: 'f_and_b', x: 2, y: 15, width: 30, height: 10, connections: ['ground'] },
  { id: 'bar', name: 'Blue Bar', category: 'f_and_b', x: 60, y: 15, width: 30, height: 10, connections: ['ground'] },
  { id: 'level_1', name: 'Level 1', category: 'public', x: 2, y: 27, width: 96, height: 10, connections: ['ground', 'level_2'] },
  { id: 'level_2', name: 'Level 2', category: 'guest_floor', x: 2, y: 39, width: 96, height: 10, connections: ['level_1', 'level_3'], floor: 3 },
  { id: 'level_3', name: 'Level 3', category: 'guest_floor', x: 2, y: 51, width: 96, height: 10, connections: ['level_2', 'level_4'], floor: 4 },
  { id: 'level_4', name: 'Level 4', category: 'guest_floor', x: 2, y: 63, width: 96, height: 10, connections: ['level_3', 'level_5'], floor: 5 },
  { id: 'level_5', name: 'Level 5', category: 'guest_floor', x: 2, y: 75, width: 96, height: 10, connections: ['level_4', 'level_6'], floor: 6 },
  { id: 'level_6', name: 'Level 6', category: 'guest_floor', x: 2, y: 87, width: 96, height: 10, connections: ['level_5'], floor: 7 },
  { id: 'pool_deck', name: 'Pool Deck', category: 'outdoor', x: 70, y: 87, width: 28, height: 10, connections: ['level_6'] },
];

// ============================================
// DEMO WORKERS - positioned on blueprint SVG coords
// ============================================

const createDemoWorkers = (): SimulatedWorker[] => [
  {
    id: 'w1', name: 'Maria Santos', initials: 'MS', role: 'Housekeeping',
    color: WORKER_COLORS[0],
    mapX: 160, mapY: 225, currentFloor: 3, // Level 2, room 201 area
    targetPosition: null, path: [], pathIndex: 0,
    status: 'idle', currentTaskId: null, speed: MOVEMENT_SPEED,
    reliabilityScore: 0.95, tasksCompleted: 127, avgResponseTime: 42,
    position: { x: 160, y: 225, zoneId: 'level_2' },
  },
  {
    id: 'w2', name: 'James Chen', initials: 'JC', role: 'Housekeeping',
    color: WORKER_COLORS[1],
    mapX: 600, mapY: 445, currentFloor: 4, // Level 3, south wing
    targetPosition: null, path: [], pathIndex: 0,
    status: 'idle', currentTaskId: null, speed: MOVEMENT_SPEED,
    reliabilityScore: 0.88, tasksCompleted: 98, avgResponseTime: 55,
    position: { x: 600, y: 445, zoneId: 'level_3' },
  },
  {
    id: 'w3', name: 'Ana Rodriguez', initials: 'AR', role: 'Housekeeping',
    color: WORKER_COLORS[2],
    mapX: 300, mapY: 334, currentFloor: 5, // Level 4, corridor
    targetPosition: null, path: [], pathIndex: 0,
    status: 'idle', currentTaskId: null, speed: MOVEMENT_SPEED,
    reliabilityScore: 0.92, tasksCompleted: 145, avgResponseTime: 38,
    position: { x: 300, y: 334, zoneId: 'level_4' },
  },
  {
    id: 'w4', name: 'Mike Thompson', initials: 'MT', role: 'Maintenance',
    color: WORKER_COLORS[3],
    mapX: 130, mapY: 360, currentFloor: 0, // Basement, mechanical
    targetPosition: null, path: [], pathIndex: 0,
    status: 'idle', currentTaskId: null, speed: MOVEMENT_SPEED * 1.1,
    reliabilityScore: 0.97, tasksCompleted: 203, avgResponseTime: 28,
    position: { x: 130, y: 360, zoneId: 'basement' },
  },
  {
    id: 'w5', name: 'Sofia Kim', initials: 'SK', role: 'Room Service',
    color: WORKER_COLORS[4],
    mapX: 750, mapY: 300, currentFloor: 1, // Ground floor, kitchen area
    targetPosition: null, path: [], pathIndex: 0,
    status: 'idle', currentTaskId: null, speed: MOVEMENT_SPEED * 1.2,
    reliabilityScore: 0.91, tasksCompleted: 89, avgResponseTime: 45,
    position: { x: 750, y: 300, zoneId: 'ground' },
  },
  {
    id: 'w6', name: 'David Park', initials: 'DP', role: 'Housekeeping',
    color: WORKER_COLORS[5],
    mapX: 400, mapY: 250, currentFloor: 6, // Level 5
    targetPosition: null, path: [], pathIndex: 0,
    status: 'idle', currentTaskId: null, speed: MOVEMENT_SPEED,
    reliabilityScore: 0.85, tasksCompleted: 76, avgResponseTime: 62,
    position: { x: 400, y: 250, zoneId: 'level_5' },
  },
];

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
    if (mode === 'demo') get().reset();
  },

  start: () => set({ isRunning: true, lastTick: Date.now() }),
  stop: () => set({ isRunning: false }),
  setSpeed: (speed) => set({ speed: Math.max(1, Math.min(10, speed)) }),

  reset: () => {
    set({
      workers: createDemoWorkers(),
      tasks: [],
      isRunning: false,
      taskGenerationTimer: 0,
      metrics: { activeTasks: 0, completedTasks: 0, avgResponseTime: 0, avgCompletionTime: 0, activeWorkers: 6 },
    });
  },

  _generateTask: () => {
    // Pick a random guest room floor (3-7 = L2-L6)
    const guestFloors = [3, 4, 5, 6, 7];
    const floorIdx = guestFloors[Math.floor(Math.random() * guestFloors.length)];
    const floor = FLOOR_DATA[floorIdx];
    if (!floor) return;

    // Pick a random guest room on this floor
    const guestRooms = floor.rooms.filter(r => r.type === 'guestroom' || r.type === 'suite');
    if (guestRooms.length === 0) return;
    const room = guestRooms[Math.floor(Math.random() * guestRooms.length)];

    const priorities: SimulatedTask['priority'][] = ['low', 'normal', 'normal', 'normal', 'high', 'urgent'];

    const task: SimulatedTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: TASK_TYPES[Math.floor(Math.random() * TASK_TYPES.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      zoneId: `floor_${floorIdx}`,
      zoneName: floor.name,
      roomLabel: room.label,
      floor: floorIdx,
      position: { x: room.x + room.w / 2, y: room.y + room.h / 2, zoneId: `floor_${floorIdx}` },
      status: 'pending',
      assignedTo: null,
      createdAt: Date.now(),
      assignedAt: null,
      completedAt: null,
    };

    set((s) => ({
      tasks: [...s.tasks, task],
      metrics: { ...s.metrics, activeTasks: s.metrics.activeTasks + 1 },
    }));

    // Auto-assign after short delay
    setTimeout(() => get()._assignTask(task.id), 300);
  },

  _assignTask: (taskId: string) => {
    set((state) => {
      const taskIndex = state.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return state;
      const task = state.tasks[taskIndex];
      if (task.status !== 'pending') return state;

      // Find best idle worker (prefer same floor, then closest floor)
      const idle = state.workers.filter(w => w.status === 'idle');
      if (idle.length === 0) return state;

      // Score: prefer same floor, then minimal floor distance
      let bestWorker = idle[0];
      let bestScore = Infinity;
      for (const w of idle) {
        const floorDist = Math.abs(w.currentFloor - task.floor);
        if (floorDist < bestScore) {
          bestScore = floorDist;
          bestWorker = w;
        }
      }

      // Build path: worker walks to corridor, then to room
      const targetX = task.position.x;
      const targetY = task.position.y;

      // Simple path: move to corridor Y first, then to target X, then to target Y
      const pathPositions: Position[] = [];

      if (bestWorker.currentFloor === task.floor) {
        // Same floor: walk through corridor
        pathPositions.push({ x: bestWorker.mapX, y: CORRIDOR_Y, zoneId: task.zoneId });
        pathPositions.push({ x: targetX, y: CORRIDOR_Y, zoneId: task.zoneId });
        pathPositions.push({ x: targetX, y: targetY, zoneId: task.zoneId });
      } else {
        // Different floor: walk to elevator, then to target floor
        const elevX = 530; // Elevator bank center X
        const elevY = 78; // Elevator bank center Y

        // Walk to elevator on current floor
        pathPositions.push({ x: bestWorker.mapX, y: CORRIDOR_Y, zoneId: task.zoneId });
        pathPositions.push({ x: elevX, y: CORRIDOR_Y, zoneId: task.zoneId });
        pathPositions.push({ x: elevX, y: elevY, zoneId: task.zoneId });
        // "Arrive" at elevator on target floor (same SVG coords, floor changes)
        pathPositions.push({ x: elevX, y: CORRIDOR_Y, zoneId: task.zoneId });
        pathPositions.push({ x: targetX, y: CORRIDOR_Y, zoneId: task.zoneId });
        pathPositions.push({ x: targetX, y: targetY, zoneId: task.zoneId });
      }

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
          activeTasks: Math.max(0, state.metrics.activeTasks - 1),
          avgResponseTime: Math.round((state.metrics.avgResponseTime + responseTime) / 2),
        },
      };
    });
  },

  _moveWorker: (workerId: string) => {
    set((state) => {
      const wi = state.workers.findIndex(w => w.id === workerId);
      if (wi === -1) return state;
      const worker = state.workers[wi];

      if (worker.path.length === 0 || worker.pathIndex >= worker.path.length) {
        // Arrived — start working
        const task = state.tasks.find(t => t.id === worker.currentTaskId);
        return {
          workers: state.workers.map((w, i) =>
            i === wi ? {
              ...w,
              status: 'working' as const,
              path: [],
              pathIndex: 0,
              currentFloor: task?.floor ?? w.currentFloor,
            } : w
          ),
        };
      }

      const target = worker.path[worker.pathIndex];
      const dx = target.x - worker.mapX;
      const dy = target.y - worker.mapY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const moveDistance = worker.speed * state.speed;

      if (distance <= moveDistance) {
        // Reached waypoint
        // Check if this waypoint represents a floor change (elevator arrival)
        const nextPathIndex = worker.pathIndex + 1;
        const task = state.tasks.find(t => t.id === worker.currentTaskId);

        // If the worker just "arrived at elevator" on the target floor (waypoint 3 of cross-floor path)
        let newFloor = worker.currentFloor;
        if (task && worker.currentFloor !== task.floor && worker.pathIndex >= 3) {
          newFloor = task.floor;
        }

        return {
          workers: state.workers.map((w, i) =>
            i === wi ? {
              ...w,
              mapX: target.x,
              mapY: target.y,
              pathIndex: nextPathIndex,
              currentFloor: newFloor,
              position: { x: target.x, y: target.y, zoneId: target.zoneId },
            } : w
          ),
        };
      }

      // Move toward waypoint
      const ratio = moveDistance / distance;
      const newX = worker.mapX + dx * ratio;
      const newY = worker.mapY + dy * ratio;

      return {
        workers: state.workers.map((w, i) =>
          i === wi ? {
            ...w,
            mapX: newX,
            mapY: newY,
            position: { x: newX, y: newY, zoneId: w.position.zoneId },
          } : w
        ),
      };
    });
  },

  tick: () => {
    const state = get();
    if (!state.isRunning) return;
    if (state.mode !== 'demo') return;

    // Task generation
    set((s) => ({ taskGenerationTimer: s.taskGenerationTimer + s.speed }));

    if (state.taskGenerationTimer >= TASK_GENERATION_INTERVAL) {
      state._generateTask();
      set({ taskGenerationTimer: 0 });
    }

    // Move workers
    for (const worker of state.workers) {
      if (worker.status === 'moving') {
        state._moveWorker(worker.id);
      } else if (worker.status === 'working' && worker.currentTaskId) {
        // Random chance to complete
        if (Math.random() < 0.015 * state.speed) {
          state._completeTask(worker.currentTaskId);
        }
      }
    }

    // Update assigned tasks to in_progress
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
