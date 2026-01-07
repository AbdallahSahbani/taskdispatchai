import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dispatchApi, subscribeToTasks, subscribeToAssignments, subscribeToWorkerState } from "@/lib/api";
import type { DbTask, DbWorker, DbZone } from "@/types/dispatch";

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
