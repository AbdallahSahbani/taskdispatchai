import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WorkerWithState {
  id: number;
  name: string;
  role: string;
  on_shift: boolean;
  reliability_score: number;
  worker_state: {
    current_zone: string | null;
    zone_confidence: number;
    device_online: boolean;
    active_task_count: number;
    last_heartbeat_at: string | null;
  } | null;
}

interface ZoneEdge {
  from_zone: string;
  to_zone: string;
  travel_time_seconds: number;
}

// Dijkstra's algorithm for shortest path
function shortestPath(
  graph: Map<string, Map<string, number>>,
  from: string | null,
  to: string
): number {
  if (!from || from === to) return 0;

  const dist = new Map<string, number>();
  const visited = new Set<string>();

  for (const zone of graph.keys()) {
    dist.set(zone, Infinity);
  }
  dist.set(from, 0);

  while (true) {
    let u: string | null = null;
    let best = Infinity;

    for (const [zone, d] of dist.entries()) {
      if (!visited.has(zone) && d < best) {
        best = d;
        u = zone;
      }
    }

    if (!u || u === to) break;
    visited.add(u);

    const neighbors = graph.get(u);
    if (neighbors) {
      for (const [v, weight] of neighbors.entries()) {
        const nd = (dist.get(u) ?? Infinity) + weight;
        if (nd < (dist.get(v) ?? Infinity)) {
          dist.set(v, nd);
        }
      }
    }
  }

  return dist.get(to) ?? 999;
}

/**
 * Enhanced Dispatch Scoring Algorithm
 * Based on PDF spec: S(w,t) = λ₁P + λ₂R + λ₃L + λ₄D + λ₅M
 * 
 * Higher score = better candidate (0-100 scale)
 */

interface DispatchWeights {
  proximity: number;
  reliability: number;
  load: number;
  device: number;
  skill: number;
}

const PRIORITY_WEIGHTS: Record<string, DispatchWeights> = {
  low: { proximity: 0.25, reliability: 0.20, load: 0.35, device: 0.10, skill: 0.10 },
  normal: { proximity: 0.35, reliability: 0.20, load: 0.20, device: 0.10, skill: 0.15 },
  high: { proximity: 0.45, reliability: 0.15, load: 0.10, device: 0.10, skill: 0.20 },
  urgent: { proximity: 0.55, reliability: 0.10, load: 0.05, device: 0.10, skill: 0.20 },
};

function calculateProximityScore(currentZone: string | null, taskZone: string, travelTime: number): number {
  if (!currentZone) return 0;
  if (currentZone === taskZone) return 100;
  if (travelTime <= 60) return Math.round(100 - (travelTime / 6));
  return Math.max(0, Math.round(100 - (travelTime / 3)));
}

function calculateLoadScore(activeTaskCount: number): number {
  switch (activeTaskCount) {
    case 0: return 100;
    case 1: return 75;
    case 2: return 50;
    case 3: return 25;
    default: return 0;
  }
}

function calculateDeviceScore(lastHeartbeat: string | null, deviceOnline: boolean): number {
  if (!deviceOnline) return 0;
  if (!lastHeartbeat) return 20;
  
  const secondsAgo = (Date.now() - new Date(lastHeartbeat).getTime()) / 1000;
  if (secondsAgo <= 30) return 100;
  if (secondsAgo <= 60) return 80;
  if (secondsAgo <= 300) return 50;
  return 20;
}

function calculateSkillScore(taskType: string, workerRole: string): number {
  // Role-based skill matching
  if (taskType === 'maintenance' && workerRole === 'maintenance') return 100;
  if (['towels', 'cleaning', 'trash'].includes(taskType) && workerRole === 'housekeeping') return 100;
  if (taskType === 'room_service' && workerRole === 'room_service') return 100;
  if (workerRole === 'housekeeping') return 80; // Housekeeping can do most tasks
  return 50;
}

interface ScoreBreakdown {
  workerId: number;
  name: string;
  totalScore: number;
  proximityScore: number;
  reliabilityScore: number;
  loadScore: number;
  deviceScore: number;
  skillScore: number;
  travelTime: number;
  zone: string | null;
  confidence: number;
}

function dispatchScoreEnhanced(
  worker: WorkerWithState,
  taskZone: string,
  taskType: string,
  priority: string,
  travelTime: number
): ScoreBreakdown {
  const state = worker.worker_state;
  const weights = PRIORITY_WEIGHTS[priority] || PRIORITY_WEIGHTS.normal;
  
  if (!state || !state.device_online) {
    return {
      workerId: worker.id,
      name: worker.name,
      totalScore: 0,
      proximityScore: 0,
      reliabilityScore: 0,
      loadScore: 0,
      deviceScore: 0,
      skillScore: 0,
      travelTime,
      zone: state?.current_zone || null,
      confidence: 0,
    };
  }

  const proximityScore = calculateProximityScore(state.current_zone, taskZone, travelTime);
  const reliabilityScore = Math.round(worker.reliability_score * 100);
  const loadScore = calculateLoadScore(state.active_task_count);
  const deviceScore = calculateDeviceScore(state.last_heartbeat_at, state.device_online);
  const skillScore = calculateSkillScore(taskType, worker.role);

  const totalScore = 
    weights.proximity * proximityScore +
    weights.reliability * reliabilityScore +
    weights.load * loadScore +
    weights.device * deviceScore +
    weights.skill * skillScore;

  return {
    workerId: worker.id,
    name: worker.name,
    totalScore: Math.round(totalScore * 100) / 100,
    proximityScore,
    reliabilityScore,
    loadScore,
    deviceScore,
    skillScore,
    travelTime,
    zone: state.current_zone,
    confidence: state.zone_confidence,
  };
}

// Legacy scoring function (lower is better) - kept for backward compatibility
function dispatchScore(
  worker: WorkerWithState,
  taskZone: string,
  travelTime: number
): number {
  const state = worker.worker_state;
  if (!state) return 9999;

  const loadPenalty = state.active_task_count * 15;
  const unreliabilityPenalty = (1 - worker.reliability_score) * 60;
  const uncertaintyPenalty = (1 - state.zone_confidence) * 45;

  return travelTime + loadPenalty + unreliabilityPenalty + uncertaintyPenalty;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // GET /dispatch/state - Get current system state
    if (req.method === "GET" && path === "state") {
      const [workersRes, tasksRes, zonesRes] = await Promise.all([
        supabase
          .from("workers")
          .select("*, worker_state(*)")
          .order("id"),
        supabase
          .from("tasks")
          .select("*, task_assignments(*)")
          .in("status", ["new", "assigned", "in_progress"])
          .order("created_at", { ascending: false }),
        supabase.from("zones").select("*"),
      ]);

      return new Response(
        JSON.stringify({
          workers: workersRes.data ?? [],
          tasks: tasksRes.data ?? [],
          zones: zonesRes.data ?? [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /dispatch/create-task - Create and route a task
    if (req.method === "POST" && path === "create-task") {
      const body = await req.json();
      const { type, zone_id, priority = "normal" } = body;

      if (!type || !zone_id) {
        return new Response(
          JSON.stringify({ error: "type and zone_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create task
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({ type, zone_id, priority, status: "new" })
        .select()
        .single();

      if (taskError) throw taskError;

      console.log(`Task created: ${task.id} - ${type} at ${zone_id}`);

      // Log event
      await supabase.from("dispatch_events").insert({
        event_type: "task_created",
        task_id: task.id,
        zone_id,
        payload: { type, priority },
      });

      // Route the task
      const routeResult = await routeTask(supabase, task);

      return new Response(
        JSON.stringify({ task, routing: routeResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /dispatch/ack - Acknowledge task
    if (req.method === "POST" && path === "ack") {
      const body = await req.json();
      const { task_id, worker_id, action } = body;

      const { data: assignment } = await supabase
        .from("task_assignments")
        .select("*, tasks(*)")
        .eq("task_id", task_id)
        .single();

      if (!assignment || assignment.worker_id !== worker_id) {
        return new Response(
          JSON.stringify({ error: "Invalid assignment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "busy") {
        // Reroute
        const worker = await supabase
          .from("worker_state")
          .select("*")
          .eq("worker_id", worker_id)
          .single();

        if (worker.data) {
          await supabase
            .from("worker_state")
            .update({
              active_task_count: Math.max(0, worker.data.active_task_count - 1),
            })
            .eq("worker_id", worker_id);
        }

        await supabase.from("task_assignments").delete().eq("task_id", task_id);
        await supabase.from("tasks").update({ status: "new" }).eq("id", task_id);

        await supabase.from("dispatch_events").insert({
          event_type: "worker_busy",
          task_id,
          worker_id,
          zone_id: assignment.tasks?.zone_id,
        });

        // Re-route
        const { data: taskData } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", task_id)
          .single();

        if (taskData) {
          await routeTask(supabase, taskData);
        }

        return new Response(
          JSON.stringify({ rerouted: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Seen or On my way = ack
      await supabase
        .from("task_assignments")
        .update({
          state: "acked",
          acknowledged_at: new Date().toISOString(),
        })
        .eq("task_id", task_id);

      await supabase.from("tasks").update({ status: "in_progress" }).eq("id", task_id);

      // Update worker reliability slightly
      const { data: workerData } = await supabase
        .from("workers")
        .select("reliability_score")
        .eq("id", worker_id)
        .single();

      if (workerData) {
        await supabase
          .from("workers")
          .update({
            reliability_score: Math.min(1, workerData.reliability_score + 0.01),
          })
          .eq("id", worker_id);
      }

      await supabase.from("dispatch_events").insert({
        event_type: "task_ack",
        task_id,
        worker_id,
        zone_id: assignment.tasks?.zone_id,
        payload: { action },
      });

      return new Response(
        JSON.stringify({ acknowledged: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /dispatch/complete - Complete task
    if (req.method === "POST" && path === "complete") {
      const body = await req.json();
      const { task_id, worker_id } = body;

      const { data: assignment } = await supabase
        .from("task_assignments")
        .select("*, tasks(*)")
        .eq("task_id", task_id)
        .single();

      if (!assignment || assignment.worker_id !== worker_id) {
        return new Response(
          JSON.stringify({ error: "Invalid assignment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const taskZone = assignment.tasks?.zone_id;

      // Update assignment
      await supabase
        .from("task_assignments")
        .update({
          state: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("task_id", task_id);

      // Update task
      await supabase.from("tasks").update({ status: "completed" }).eq("id", task_id);

      // Update worker state - ground truth location
      await supabase
        .from("worker_state")
        .update({
          current_zone: taskZone,
          zone_confidence: 1.0,
          zone_source: "task",
          zone_last_updated_at: new Date().toISOString(),
          active_task_count: 0, // Will be recalculated
          last_task_completed_at: new Date().toISOString(),
        })
        .eq("worker_id", worker_id);

      // Recalculate active task count
      const { count } = await supabase
        .from("task_assignments")
        .select("*", { count: "exact", head: true })
        .eq("worker_id", worker_id)
        .in("state", ["pending_ack", "acked"]);

      await supabase
        .from("worker_state")
        .update({ active_task_count: count ?? 0 })
        .eq("worker_id", worker_id);

      // Update worker reliability
      const { data: workerData } = await supabase
        .from("workers")
        .select("reliability_score")
        .eq("id", worker_id)
        .single();

      if (workerData) {
        await supabase
          .from("workers")
          .update({
            reliability_score: Math.min(1, workerData.reliability_score + 0.02),
          })
          .eq("id", worker_id);
      }

      await supabase.from("dispatch_events").insert({
        event_type: "task_complete",
        task_id,
        worker_id,
        zone_id: taskZone,
      });

      return new Response(
        JSON.stringify({ completed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /dispatch/wifi-update - Update worker location from WiFi
    if (req.method === "POST" && path === "wifi-update") {
      const body = await req.json();
      const { worker_id, connected_ap } = body;

      // Look up zone for AP
      const { data: apMapping } = await supabase
        .from("wifi_ap_zones")
        .select("zone_id")
        .eq("ap_id", connected_ap)
        .single();

      if (!apMapping) {
        return new Response(
          JSON.stringify({ updated: false, reason: "unknown AP" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get current worker state
      const { data: state } = await supabase
        .from("worker_state")
        .select("*")
        .eq("worker_id", worker_id)
        .single();

      if (!state) {
        return new Response(
          JSON.stringify({ updated: false, reason: "worker not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Don't override task truth within 60 seconds
      const lastUpdate = new Date(state.zone_last_updated_at).getTime();
      const now = Date.now();
      if (state.zone_source === "task" && now - lastUpdate < 60000) {
        return new Response(
          JSON.stringify({ updated: false, reason: "task truth holds" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update zone with confidence nudge
      await supabase
        .from("worker_state")
        .update({
          current_zone: apMapping.zone_id,
          zone_confidence: Math.min(1, state.zone_confidence + 0.15),
          zone_source: "wifi",
          zone_last_updated_at: new Date().toISOString(),
          connected_wifi_ap: connected_ap,
        })
        .eq("worker_id", worker_id);

      await supabase.from("dispatch_events").insert({
        event_type: "worker_zone_update",
        worker_id,
        zone_id: apMapping.zone_id,
        payload: { source: "wifi", ap: connected_ap },
      });

      return new Response(
        JSON.stringify({ updated: true, zone: apMapping.zone_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /dispatch/metrics - Get zone and worker metrics
    if (req.method === "GET" && path === "metrics") {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      const { data: events } = await supabase
        .from("dispatch_events")
        .select("*")
        .gte("created_at", sixHoursAgo)
        .order("created_at", { ascending: true });

      const { data: zones } = await supabase.from("zones").select("*");

      // Calculate metrics per zone
      const zoneMetrics: Record<string, {
        zone_id: string;
        zone_name: string;
        volume: number;
        avg_response_s: number | null;
        avg_completion_s: number | null;
        reroute_count: number;
      }> = {};

      for (const zone of zones ?? []) {
        zoneMetrics[zone.id] = {
          zone_id: zone.id,
          zone_name: zone.name,
          volume: 0,
          avg_response_s: null,
          avg_completion_s: null,
          reroute_count: 0,
        };
      }

      const assignedAt: Record<number, number> = {};
      const ackTimes: Record<string, number[]> = {};
      const completeTimes: Record<string, number[]> = {};
      const taskZones: Record<number, string> = {};

      for (const ev of events ?? []) {
        if (ev.zone_id) taskZones[ev.task_id] = ev.zone_id;

        if (ev.event_type === "task_created" && ev.zone_id) {
          if (zoneMetrics[ev.zone_id]) {
            zoneMetrics[ev.zone_id].volume++;
          }
        }

        if (ev.event_type === "task_assigned") {
          assignedAt[ev.task_id] = new Date(ev.created_at).getTime();
        }

        if (ev.event_type === "task_ack" && assignedAt[ev.task_id]) {
          const zone = taskZones[ev.task_id];
          if (zone) {
            const respTime = Math.round(
              (new Date(ev.created_at).getTime() - assignedAt[ev.task_id]) / 1000
            );
            if (!ackTimes[zone]) ackTimes[zone] = [];
            ackTimes[zone].push(respTime);
          }
        }

        if (ev.event_type === "task_complete" && assignedAt[ev.task_id]) {
          const zone = taskZones[ev.task_id];
          if (zone) {
            const compTime = Math.round(
              (new Date(ev.created_at).getTime() - assignedAt[ev.task_id]) / 1000
            );
            if (!completeTimes[zone]) completeTimes[zone] = [];
            completeTimes[zone].push(compTime);
          }
        }

        if (ev.event_type === "task_reroute" || ev.event_type === "worker_busy") {
          const zone = ev.zone_id || taskZones[ev.task_id];
          if (zone && zoneMetrics[zone]) {
            zoneMetrics[zone].reroute_count++;
          }
        }
      }

      // Calculate averages
      for (const zone of Object.keys(zoneMetrics)) {
        if (ackTimes[zone]?.length) {
          zoneMetrics[zone].avg_response_s = Math.round(
            ackTimes[zone].reduce((a, b) => a + b, 0) / ackTimes[zone].length
          );
        }
        if (completeTimes[zone]?.length) {
          zoneMetrics[zone].avg_completion_s = Math.round(
            completeTimes[zone].reduce((a, b) => a + b, 0) / completeTimes[zone].length
          );
        }
      }

      return new Response(
        JSON.stringify({ zones: Object.values(zoneMetrics) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /dispatch/create-worker - Add new employee
    if (req.method === "POST" && path === "create-worker") {
      const body = await req.json();
      const { name, role, employee_id } = body;

      if (!name || !role) {
        return new Response(
          JSON.stringify({ error: "name and role are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create worker
      const { data: worker, error: workerError } = await supabase
        .from("workers")
        .insert({
          name,
          role,
          on_shift: false,
          reliability_score: 0.8,
        })
        .select()
        .single();

      if (workerError) throw workerError;

      // Create worker state
      await supabase.from("worker_state").insert({
        worker_id: worker.id,
        current_zone: null,
        zone_confidence: 0.5,
        device_online: false,
        active_task_count: 0,
      });

      await supabase.from("dispatch_events").insert({
        event_type: "worker_created",
        worker_id: worker.id,
        payload: { employee_id, name, role },
      });

      console.log(`Worker created: ${worker.id} - ${name} (${role})`);

      return new Response(
        JSON.stringify({ worker }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /dispatch/sync-worker - Sync worker app
    if (req.method === "POST" && path === "sync-worker") {
      const body = await req.json();
      const { worker_id } = body;

      if (!worker_id) {
        return new Response(
          JSON.stringify({ error: "worker_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update worker state with heartbeat
      const { error } = await supabase
        .from("worker_state")
        .update({
          device_online: true,
          last_heartbeat_at: new Date().toISOString(),
        })
        .eq("worker_id", worker_id);

      if (error) {
        // If no state exists, create one
        await supabase.from("worker_state").insert({
          worker_id,
          current_zone: null,
          zone_confidence: 0.5,
          device_online: true,
          active_task_count: 0,
          last_heartbeat_at: new Date().toISOString(),
        });
      }

      await supabase.from("dispatch_events").insert({
        event_type: "worker_sync",
        worker_id,
        payload: { timestamp: new Date().toISOString() },
      });

      return new Response(
        JSON.stringify({ synced: true, timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /dispatch/position-update - Update worker position from RSSI measurements
    if (req.method === "POST" && path === "position-update") {
      const body = await req.json();
      const { worker_id, measurements } = body;

      if (!worker_id || !measurements || !Array.isArray(measurements)) {
        return new Response(
          JSON.stringify({ error: "worker_id and measurements array required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sort by signal strength (highest RSSI = strongest signal)
      const sortedMeasurements = [...measurements]
        .filter((m: any) => m.rssi > -90)
        .sort((a: any, b: any) => b.rssi - a.rssi);

      if (sortedMeasurements.length === 0) {
        return new Response(
          JSON.stringify({ updated: false, reason: "no valid measurements" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get strongest AP
      const strongestAp = sortedMeasurements[0];

      // Look up zone for AP
      const { data: apMapping } = await supabase
        .from("wifi_ap_zones")
        .select("zone_id")
        .eq("ap_id", strongestAp.bssid)
        .single();

      if (!apMapping) {
        // Try WKNN approach - average all known APs
        const bssids = sortedMeasurements.slice(0, 4).map((m: any) => m.bssid);
        const { data: knownAps } = await supabase
          .from("wifi_ap_zones")
          .select("zone_id")
          .in("ap_id", bssids);

        if (!knownAps || knownAps.length === 0) {
          return new Response(
            JSON.stringify({ updated: false, reason: "unknown APs" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Count zone occurrences for simple voting
        const zoneCounts: Record<string, number> = {};
        for (const ap of knownAps) {
          if (ap.zone_id) {
            zoneCounts[ap.zone_id] = (zoneCounts[ap.zone_id] || 0) + 1;
          }
        }

        const bestZone = Object.entries(zoneCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0];

        if (!bestZone) {
          return new Response(
            JSON.stringify({ updated: false, reason: "no zone match" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Calculate confidence based on agreement
        const confidence = Math.min(0.95, 0.5 + (zoneCounts[bestZone] / knownAps.length) * 0.45);

        await supabase
          .from("worker_state")
          .update({
            current_zone: bestZone,
            zone_confidence: confidence,
            zone_source: "wifi_wknn",
            zone_last_updated_at: new Date().toISOString(),
            device_online: true,
            last_heartbeat_at: new Date().toISOString(),
          })
          .eq("worker_id", worker_id);

        return new Response(
          JSON.stringify({ updated: true, zone: bestZone, confidence, method: "wknn" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Single strong AP match - calculate confidence based on RSSI
      const confidence = strongestAp.rssi > -50 ? 0.95 :
                        strongestAp.rssi > -65 ? 0.85 :
                        strongestAp.rssi > -75 ? 0.70 : 0.50;

      // Get current state to check for task truth
      const { data: state } = await supabase
        .from("worker_state")
        .select("*")
        .eq("worker_id", worker_id)
        .single();

      // Don't override task truth within 60 seconds
      if (state) {
        const lastUpdate = new Date(state.zone_last_updated_at).getTime();
        const now = Date.now();
        if (state.zone_source === "task" && now - lastUpdate < 60000) {
          return new Response(
            JSON.stringify({ updated: false, reason: "task truth holds" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      await supabase
        .from("worker_state")
        .update({
          current_zone: apMapping.zone_id,
          zone_confidence: confidence,
          zone_source: "wifi_rssi",
          zone_last_updated_at: new Date().toISOString(),
          device_online: true,
          last_heartbeat_at: new Date().toISOString(),
        })
        .eq("worker_id", worker_id);

      await supabase.from("dispatch_events").insert({
        event_type: "worker_zone_update",
        worker_id,
        zone_id: apMapping.zone_id,
        payload: { 
          source: "wifi_rssi", 
          bssid: strongestAp.bssid,
          rssi: strongestAp.rssi,
          confidence,
        },
      });

      return new Response(
        JSON.stringify({ updated: true, zone: apMapping.zone_id, confidence, method: "rssi" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Dispatch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Route task to best worker using enhanced scoring
async function routeTask(supabase: any, task: any) {
  // Get zone graph
  const { data: edges } = await supabase.from("zone_edges").select("*");

  const graph = new Map<string, Map<string, number>>();
  for (const edge of edges ?? []) {
    if (!graph.has(edge.from_zone)) {
      graph.set(edge.from_zone, new Map());
    }
    graph.get(edge.from_zone)!.set(edge.to_zone, edge.travel_time_seconds);
  }

  // Get eligible workers
  const roleFilter = task.type === "maintenance" ? "maintenance" : "housekeeping";
  const { data: workers } = await supabase
    .from("workers")
    .select("*, worker_state(*)")
    .eq("on_shift", true)
    .eq("role", roleFilter);

  const candidates: ScoreBreakdown[] = [];

  for (const worker of workers ?? []) {
    const state = worker.worker_state;
    if (!state?.device_online) continue;

    const travelTime = shortestPath(graph, state.current_zone, task.zone_id);
    const scoreBreakdown = dispatchScoreEnhanced(
      worker, 
      task.zone_id, 
      task.type, 
      task.priority, 
      travelTime
    );

    candidates.push(scoreBreakdown);
  }

  // Sort by total score descending (higher is better in new system)
  candidates.sort((a, b) => b.totalScore - a.totalScore);

  if (candidates.length === 0) {
    await supabase.from("dispatch_events").insert({
      event_type: "task_escalate",
      task_id: task.id,
      zone_id: task.zone_id,
      payload: { reason: "no eligible workers" },
    });
    return { assigned: false, reason: "no eligible workers" };
  }

  const best = candidates[0];

  // Create assignment
  await supabase.from("task_assignments").insert({
    task_id: task.id,
    worker_id: best.workerId,
    state: "pending_ack",
  });

  // Update task status
  await supabase.from("tasks").update({ status: "assigned" }).eq("id", task.id);

  // Update worker active task count
  const { data: currentState } = await supabase
    .from("worker_state")
    .select("active_task_count")
    .eq("worker_id", best.workerId)
    .single();

  await supabase
    .from("worker_state")
    .update({
      active_task_count: (currentState?.active_task_count ?? 0) + 1,
    })
    .eq("worker_id", best.workerId);

  await supabase.from("dispatch_events").insert({
    event_type: "task_assigned",
    task_id: task.id,
    worker_id: best.workerId,
    zone_id: task.zone_id,
    payload: { 
      score: best.totalScore, 
      candidates: candidates.length,
      breakdown: {
        proximity: best.proximityScore,
        reliability: best.reliabilityScore,
        load: best.loadScore,
        device: best.deviceScore,
        skill: best.skillScore,
      }
    },
  });

  console.log(`Task ${task.id} assigned to ${best.name} (score: ${best.totalScore.toFixed(1)})`);

  return {
    assigned: true,
    worker: best,
    candidates,
  };
}
