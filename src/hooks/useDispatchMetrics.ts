import { useState, useEffect, useCallback } from "react";
import { dispatchApi } from "@/lib/api";

interface ZoneMetric {
  zone_id: string;
  zone_name: string;
  volume: number;
  avg_response_s: number | null;
  avg_completion_s: number | null;
  reroute_count: number;
}

export function useDispatchMetrics() {
  const [metrics, setMetrics] = useState<ZoneMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await dispatchApi.getMetrics();
      setMetrics(data.zones ?? []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}
