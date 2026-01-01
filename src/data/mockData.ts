import { Zone, Task, Worker, Assignment, MetricsSummary } from '@/types/dispatch';

export const zones: Zone[] = [
  { id: 'lobby', name: 'Lobby', neighbors: ['floor-1-east', 'floor-1-west'], travelTimeToNeighbor: { 'floor-1-east': 60, 'floor-1-west': 60 } },
  { id: 'floor-1-east', name: 'Floor 1 East', neighbors: ['lobby', 'floor-1-west', 'floor-2-east'], travelTimeToNeighbor: { 'lobby': 60, 'floor-1-west': 45, 'floor-2-east': 90 } },
  { id: 'floor-1-west', name: 'Floor 1 West', neighbors: ['lobby', 'floor-1-east', 'floor-2-west'], travelTimeToNeighbor: { 'lobby': 60, 'floor-1-east': 45, 'floor-2-west': 90 } },
  { id: 'floor-2-east', name: 'Floor 2 East', neighbors: ['floor-1-east', 'floor-2-west', 'floor-3-east'], travelTimeToNeighbor: { 'floor-1-east': 90, 'floor-2-west': 45, 'floor-3-east': 90 } },
  { id: 'floor-2-west', name: 'Floor 2 West', neighbors: ['floor-1-west', 'floor-2-east', 'floor-3-west'], travelTimeToNeighbor: { 'floor-1-west': 90, 'floor-2-east': 45, 'floor-3-west': 90 } },
  { id: 'floor-3-east', name: 'Floor 3 East', neighbors: ['floor-2-east', 'floor-3-west', 'floor-4-east'], travelTimeToNeighbor: { 'floor-2-east': 90, 'floor-3-west': 45, 'floor-4-east': 90 } },
  { id: 'floor-3-west', name: 'Floor 3 West', neighbors: ['floor-2-west', 'floor-3-east', 'floor-4-west'], travelTimeToNeighbor: { 'floor-2-west': 90, 'floor-3-east': 45, 'floor-4-west': 90 } },
  { id: 'floor-4-east', name: 'Floor 4 East', neighbors: ['floor-3-east', 'floor-4-west'], travelTimeToNeighbor: { 'floor-3-east': 90, 'floor-4-west': 45 } },
  { id: 'floor-4-west', name: 'Floor 4 West', neighbors: ['floor-3-west', 'floor-4-east'], travelTimeToNeighbor: { 'floor-3-west': 90, 'floor-4-east': 45 } },
  { id: 'pool', name: 'Pool Area', neighbors: ['lobby'], travelTimeToNeighbor: { 'lobby': 120 } },
];

export const workers: Worker[] = [
  { id: 'w1', name: 'Maria Santos', role: 'housekeeping', onShift: true, currentZoneId: 'floor-2-east', reliabilityScore: 85, deviceStatus: 'online' },
  { id: 'w2', name: 'James Chen', role: 'housekeeping', onShift: true, currentZoneId: 'floor-3-west', reliabilityScore: 72, deviceStatus: 'online' },
  { id: 'w3', name: 'Elena Rodriguez', role: 'housekeeping', onShift: true, currentZoneId: 'floor-1-east', reliabilityScore: 91, deviceStatus: 'online' },
  { id: 'w4', name: 'Mike Johnson', role: 'maintenance', onShift: true, currentZoneId: 'lobby', reliabilityScore: 68, deviceStatus: 'online' },
  { id: 'w5', name: 'Sarah Kim', role: 'maintenance', onShift: true, currentZoneId: 'floor-4-east', reliabilityScore: 88, deviceStatus: 'offline' },
  { id: 'w6', name: 'David Brown', role: 'room_service', onShift: false, currentZoneId: 'lobby', reliabilityScore: 75, deviceStatus: 'offline' },
  { id: 'w7', name: 'Lisa Park', role: 'housekeeping', onShift: true, currentZoneId: 'pool', reliabilityScore: 82, deviceStatus: 'online' },
];

export const tasks: Task[] = [
  { id: 't1', type: 'towels', source: 'Room 412', zoneId: 'floor-4-east', priority: 'normal', status: 'new', createdAt: new Date(Date.now() - 120000), description: 'Guest requested extra towels' },
  { id: 't2', type: 'maintenance', source: 'Room 215', zoneId: 'floor-2-west', priority: 'urgent', status: 'assigned', createdAt: new Date(Date.now() - 300000), description: 'AC not working' },
  { id: 't3', type: 'cleaning', source: 'Room 318', zoneId: 'floor-3-east', priority: 'normal', status: 'in_progress', createdAt: new Date(Date.now() - 600000), description: 'Standard room cleaning' },
  { id: 't4', type: 'trash', source: 'Pool Bar', zoneId: 'pool', priority: 'normal', status: 'new', createdAt: new Date(Date.now() - 60000), description: 'Bins need emptying' },
  { id: 't5', type: 'room_service', source: 'Room 108', zoneId: 'floor-1-east', priority: 'normal', status: 'completed', createdAt: new Date(Date.now() - 1800000), description: 'Breakfast delivery' },
  { id: 't6', type: 'maintenance', source: 'Room 421', zoneId: 'floor-4-west', priority: 'urgent', status: 'new', createdAt: new Date(Date.now() - 180000), description: 'Bathroom leak reported' },
  { id: 't7', type: 'towels', source: 'Room 302', zoneId: 'floor-3-east', priority: 'normal', status: 'assigned', createdAt: new Date(Date.now() - 240000), description: 'Pool towels needed' },
];

export const assignments: Assignment[] = [
  { id: 'a1', taskId: 't2', workerId: 'w4', assignedAt: new Date(Date.now() - 280000), acknowledgedAt: new Date(Date.now() - 260000), state: 'acked' },
  { id: 'a2', taskId: 't3', workerId: 'w2', assignedAt: new Date(Date.now() - 580000), acknowledgedAt: new Date(Date.now() - 560000), state: 'acked' },
  { id: 'a3', taskId: 't7', workerId: 'w1', assignedAt: new Date(Date.now() - 200000), state: 'pending' },
];

export const metrics: MetricsSummary = {
  avgResponseTime: 45,
  avgCompletionTime: 420,
  totalTasks: 47,
  completedTasks: 38,
  reroutes: 3,
  activeWorkers: 5,
};

export const getZoneById = (id: string): Zone | undefined => zones.find(z => z.id === id);
export const getWorkerById = (id: string): Worker | undefined => workers.find(w => w.id === id);
export const getTaskById = (id: string): Task | undefined => tasks.find(t => t.id === id);
export const getAssignmentByTaskId = (taskId: string): Assignment | undefined => assignments.find(a => a.taskId === taskId);
