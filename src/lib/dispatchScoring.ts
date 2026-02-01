/**
 * Dispatch Scoring Algorithm
 * Based on: RADAR research and multi-factor weighted scoring
 * 
 * Composite Score: S(w,t) = λ₁P + λ₂R + λ₃L + λ₄D + λ₅M
 * 
 * Where:
 * - P = Proximity score (0-100): How close is worker to task location?
 * - R = Reliability score (0-100): Worker's historical performance
 * - L = Load score (0-100): Inverse of current task count
 * - D = Device recency score (0-100): How fresh is position data?
 * - M = Skill match score (0-100): Does worker have required skills?
 */

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface DispatchWeights {
  proximity: number;    // λ₁
  reliability: number;  // λ₂
  load: number;         // λ₃
  device: number;       // λ₄
  skill: number;        // λ₅
}

// Weight distribution by priority level
export const PRIORITY_WEIGHTS: Record<TaskPriority, DispatchWeights> = {
  low: {
    proximity: 0.25,
    reliability: 0.20,
    load: 0.35,
    device: 0.10,
    skill: 0.10,
  },
  normal: {
    proximity: 0.35,
    reliability: 0.20,
    load: 0.20,
    device: 0.10,
    skill: 0.15,
  },
  high: {
    proximity: 0.45,
    reliability: 0.15,
    load: 0.10,
    device: 0.10,
    skill: 0.20,
  },
  urgent: {
    proximity: 0.55,
    reliability: 0.10,
    load: 0.05,
    device: 0.10,
    skill: 0.20,
  },
};

export interface WorkerScoreInput {
  // Worker info
  workerId: number;
  workerName: string;
  role: string;
  reliabilityScore: number; // 0.0 to 1.0
  primarySkills: string[];
  secondarySkills: string[];
  
  // Worker state
  currentZoneId: string | null;
  activeTaskCount: number;
  lastSeenAt: Date | null;
  deviceOnline: boolean;
  zoneConfidence: number;
}

export interface TaskScoreInput {
  taskId: number;
  zoneId: string;
  priority: TaskPriority;
  requiredSkill: string | null;
  taskType: string;
}

export interface ScoreBreakdown {
  workerId: number;
  workerName: string;
  totalScore: number;
  
  // Individual component scores (0-100)
  proximityScore: number;
  reliabilityScore: number;
  loadScore: number;
  deviceScore: number;
  skillScore: number;
  
  // Weighted contributions
  weightedProximity: number;
  weightedReliability: number;
  weightedLoad: number;
  weightedDevice: number;
  weightedSkill: number;
  
  // Metadata
  travelTimeSeconds: number;
  currentZone: string | null;
  eligible: boolean;
  ineligibleReason?: string;
}

/**
 * Calculate proximity score based on travel time
 * Same zone = 100, adjacent (≤60s) = linear decrease, farther = steeper decrease
 */
export function calculateProximityScore(
  currentZone: string | null,
  taskZone: string,
  travelTimeSeconds: number
): number {
  if (!currentZone) return 0;
  if (currentZone === taskZone) return 100;
  
  if (travelTimeSeconds <= 60) {
    // Adjacent zones: linear decrease from 100 to ~90
    return Math.round(100 - (travelTimeSeconds / 6));
  }
  
  // Farther zones: steeper decrease
  return Math.max(0, Math.round(100 - (travelTimeSeconds / 3)));
}

/**
 * Calculate reliability score (simple conversion from 0-1 to 0-100)
 */
export function calculateReliabilityScore(reliabilityScore: number): number {
  return Math.round(reliabilityScore * 100);
}

/**
 * Calculate load score (inverse of current tasks)
 */
export function calculateLoadScore(activeTaskCount: number): number {
  switch (activeTaskCount) {
    case 0: return 100;
    case 1: return 75;
    case 2: return 50;
    case 3: return 25;
    default: return 0;
  }
}

/**
 * Calculate device recency score based on last seen timestamp
 */
export function calculateDeviceScore(lastSeenAt: Date | null, deviceOnline: boolean): number {
  if (!deviceOnline) return 0;
  if (!lastSeenAt) return 20;
  
  const secondsAgo = (Date.now() - lastSeenAt.getTime()) / 1000;
  
  if (secondsAgo <= 30) return 100;
  if (secondsAgo <= 60) return 80;
  if (secondsAgo <= 300) return 50;
  return 20;
}

/**
 * Calculate skill match score
 */
export function calculateSkillScore(
  requiredSkill: string | null,
  taskType: string,
  workerRole: string,
  primarySkills: string[],
  secondarySkills: string[]
): number {
  // If no specific skill required, check role match
  if (!requiredSkill) {
    // Role-based matching
    if (taskType === 'maintenance' && workerRole === 'maintenance') return 100;
    if (['towels', 'cleaning', 'trash'].includes(taskType) && workerRole === 'housekeeping') return 100;
    if (taskType === 'room_service' && workerRole === 'room_service') return 100;
    
    // Housekeeping can do most tasks
    if (workerRole === 'housekeeping') return 80;
    
    return 50;
  }
  
  // Check skills
  if (primarySkills.includes(requiredSkill)) return 100;
  if (secondarySkills.includes(requiredSkill)) return 70;
  
  return 0;
}

/**
 * Calculate complete dispatch score for a worker-task pair
 */
export function calculateDispatchScore(
  worker: WorkerScoreInput,
  task: TaskScoreInput,
  travelTimeSeconds: number
): ScoreBreakdown {
  const weights = PRIORITY_WEIGHTS[task.priority] || PRIORITY_WEIGHTS.normal;
  
  // Check eligibility
  let eligible = true;
  let ineligibleReason: string | undefined;
  
  if (!worker.deviceOnline) {
    eligible = false;
    ineligibleReason = 'Device offline';
  }
  
  // Calculate individual scores
  const proximityScore = calculateProximityScore(
    worker.currentZoneId,
    task.zoneId,
    travelTimeSeconds
  );
  
  const reliabilityScore = calculateReliabilityScore(worker.reliabilityScore);
  const loadScore = calculateLoadScore(worker.activeTaskCount);
  const deviceScore = calculateDeviceScore(worker.lastSeenAt, worker.deviceOnline);
  const skillScore = calculateSkillScore(
    task.requiredSkill,
    task.taskType,
    worker.role,
    worker.primarySkills,
    worker.secondarySkills
  );
  
  // Check skill eligibility
  if (skillScore === 0 && task.requiredSkill) {
    eligible = false;
    ineligibleReason = 'Missing required skill';
  }
  
  // Calculate weighted scores
  const weightedProximity = proximityScore * weights.proximity;
  const weightedReliability = reliabilityScore * weights.reliability;
  const weightedLoad = loadScore * weights.load;
  const weightedDevice = deviceScore * weights.device;
  const weightedSkill = skillScore * weights.skill;
  
  // Total score (higher is better)
  const totalScore = weightedProximity + weightedReliability + weightedLoad + weightedDevice + weightedSkill;
  
  return {
    workerId: worker.workerId,
    workerName: worker.workerName,
    totalScore: Math.round(totalScore * 100) / 100,
    
    proximityScore,
    reliabilityScore,
    loadScore,
    deviceScore,
    skillScore,
    
    weightedProximity: Math.round(weightedProximity * 100) / 100,
    weightedReliability: Math.round(weightedReliability * 100) / 100,
    weightedLoad: Math.round(weightedLoad * 100) / 100,
    weightedDevice: Math.round(weightedDevice * 100) / 100,
    weightedSkill: Math.round(weightedSkill * 100) / 100,
    
    travelTimeSeconds,
    currentZone: worker.currentZoneId,
    eligible,
    ineligibleReason,
  };
}

/**
 * Rank workers for a task (returns sorted by total score, descending)
 */
export function rankWorkersForTask(
  workers: WorkerScoreInput[],
  task: TaskScoreInput,
  travelTimes: Map<number, number> // workerId -> travel time in seconds
): ScoreBreakdown[] {
  const scores = workers.map(worker => {
    const travelTime = travelTimes.get(worker.workerId) ?? 999;
    return calculateDispatchScore(worker, task, travelTime);
  });
  
  // Sort by eligible first, then by total score (descending)
  return scores.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    return b.totalScore - a.totalScore;
  });
}

/**
 * Format score for display (converts 0-100 score to display format)
 */
export function formatScoreForDisplay(score: number): string {
  return score.toFixed(0);
}

/**
 * Get score color class based on score value
 */
export function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-primary';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
}
