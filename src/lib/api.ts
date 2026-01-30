import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dispatch`;

async function callDispatch(path: string, method: string, body?: any) {
  const url = `${FUNCTION_URL}/${path}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API error");
  }

  return response.json();
}

export const dispatchApi = {
  getState: () => callDispatch("state", "GET"),
  
  createTask: (type: string, zone_id: string, priority: "normal" | "urgent" = "normal") =>
    callDispatch("create-task", "POST", { type, zone_id, priority }),
  
  ackTask: (task_id: number, worker_id: number, action: "seen" | "onmyway" | "busy") =>
    callDispatch("ack", "POST", { task_id, worker_id, action }),
  
  completeTask: (task_id: number, worker_id: number) =>
    callDispatch("complete", "POST", { task_id, worker_id }),
  
  updateWifi: (worker_id: number, connected_ap: string) =>
    callDispatch("wifi-update", "POST", { worker_id, connected_ap }),
  
  getMetrics: () => callDispatch("metrics", "GET"),
  
  createWorker: (name: string, role: string, employee_id: string) =>
    callDispatch("create-worker", "POST", { name, role, employee_id }),
  
  syncWorker: (worker_id: number) =>
    callDispatch("sync-worker", "POST", { worker_id }),
  
  // WiFi Positioning - Update worker location using RSSI fingerprinting
  updatePositionFromWifi: (worker_id: number, rssi_measurements: Array<{ bssid: string; rssi: number }>) =>
    callDispatch("position-update", "POST", { worker_id, measurements: rssi_measurements }),
};

// Real-time subscriptions
export function subscribeToTasks(callback: (payload: any) => void) {
  return supabase
    .channel("tasks-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tasks" },
      callback
    )
    .subscribe();
}

export function subscribeToAssignments(callback: (payload: any) => void) {
  return supabase
    .channel("assignments-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "task_assignments" },
      callback
    )
    .subscribe();
}

export function subscribeToWorkerState(callback: (payload: any) => void) {
  return supabase
    .channel("worker-state-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "worker_state" },
      callback
    )
    .subscribe();
}

export function subscribeToEvents(callback: (payload: any) => void) {
  return supabase
    .channel("events-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "dispatch_events" },
      callback
    )
    .subscribe();
}
