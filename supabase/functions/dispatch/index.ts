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

// Calculate dispatch score (lower is better)
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

// Route task to best worker
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

  const candidates: Array<{
    worker_id: number;
    name: string;
    score: number;
    zone: string | null;
    confidence: number;
    travel_time: number;
  }> = [];

  for (const worker of workers ?? []) {
    const state = worker.worker_state;
    if (!state?.device_online) continue;

    const travelTime = shortestPath(graph, state.current_zone, task.zone_id);
    const score = dispatchScore(worker, task.zone_id, travelTime);

    candidates.push({
      worker_id: worker.id,
      name: worker.name,
      score,
      zone: state.current_zone,
      confidence: state.zone_confidence,
      travel_time: travelTime,
    });
  }

  candidates.sort((a, b) => a.score - b.score);

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
    worker_id: best.worker_id,
    state: "pending_ack",
  });

  // Update task status
  await supabase.from("tasks").update({ status: "assigned" }).eq("id", task.id);

  // Update worker active task count
  const { data: currentState } = await supabase
    .from("worker_state")
    .select("active_task_count")
    .eq("worker_id", best.worker_id)
    .single();

  await supabase
    .from("worker_state")
    .update({
      active_task_count: (currentState?.active_task_count ?? 0) + 1,
    })
    .eq("worker_id", best.worker_id);

  await supabase.from("dispatch_events").insert({
    event_type: "task_assigned",
    task_id: task.id,
    worker_id: best.worker_id,
    zone_id: task.zone_id,
    payload: { score: best.score, candidates: candidates.length },
  });

  console.log(`Task ${task.id} assigned to ${best.name} (score: ${best.score.toFixed(1)})`);

  return {
    assigned: true,
    worker: best,
    candidates,
  };
}
