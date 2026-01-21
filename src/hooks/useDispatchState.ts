import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dispatchApi, subscribeToTasks, subscribeToAssignments, subscribeToWorkerState } from "@/lib/api";
import type { Tables } from "@/integrations/supabase/types";

// Types with joined relations from the API
export interface DbWorkerState {
  current_zone: string | null;
  zone_confidence: number;
  device_online: boolean;
  active_task_count: number;
}

export interface DbTaskAssignment {
  worker_id: number;
  state: string;
  acknowledged_at: string | null;
  completed_at: string | null;
  reroutes: number;
}

export type DbZone = Tables<"zones">;

export type DbWorker = Tables<"workers"> & {
  worker_state: DbWorkerState | null;
};

export type DbTask = Tables<"tasks"> & {
  task_assignments: DbTaskAssignment | null;
};

interface DispatchState {
  workers: DbWorker[];
  tasks: DbTask[];
  zones: DbZone[];
  loading: boolean;
  error: string | null;
}

export function useDispatchState() {
  const [state, setState] = useState<DispatchState>({
    workers: [],
    tasks: [],
    zones: [],
    loading: true,
    error: null,
  });

  const fetchState = useCallback(async () => {
    try {
      const data = await dispatchApi.getState();
      setState((prev) => ({
        ...prev,
        workers: data.workers ?? [],
        tasks: data.tasks ?? [],
        zones: data.zones ?? [],
        loading: false,
        error: null,
      }));
    } catch (err) {
      console.error("Failed to fetch dispatch state:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load",
      }));
    }
  }, []);

  useEffect(() => {
    fetchState();

    const tasksSub = subscribeToTasks(() => fetchState());
    const assignmentsSub = subscribeToAssignments(() => fetchState());
    const workerStateSub = subscribeToWorkerState(() => fetchState());

    return () => {
      supabase.removeChannel(tasksSub);
      supabase.removeChannel(assignmentsSub);
      supabase.removeChannel(workerStateSub);
    };
  }, [fetchState]);

  return { ...state, refetch: fetchState };
}
