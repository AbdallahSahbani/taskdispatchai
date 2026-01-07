-- ===========================================
-- HOTEL DISPATCH OS - PRODUCTION SCHEMA
-- ===========================================

-- 1. ZONES TABLE (physical areas)
CREATE TABLE public.zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ZONE GRAPH (travel times between zones)
CREATE TABLE public.zone_edges (
  from_zone TEXT REFERENCES public.zones(id) ON DELETE CASCADE,
  to_zone TEXT REFERENCES public.zones(id) ON DELETE CASCADE,
  travel_time_seconds INT NOT NULL,
  PRIMARY KEY (from_zone, to_zone)
);

-- 3. WI-FI AP TO ZONE MAPPING
CREATE TABLE public.wifi_ap_zones (
  ap_id TEXT PRIMARY KEY,
  zone_id TEXT REFERENCES public.zones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. WORKERS TABLE
CREATE TABLE public.workers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('housekeeping', 'maintenance')),
  on_shift BOOLEAN NOT NULL DEFAULT false,
  reliability_score REAL NOT NULL DEFAULT 0.8,
  avg_ack_time_seconds REAL NOT NULL DEFAULT 30,
  avg_completion_time_seconds REAL NOT NULL DEFAULT 300,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. WORKER STATE (ephemeral location/connectivity state)
CREATE TABLE public.worker_state (
  worker_id BIGINT PRIMARY KEY REFERENCES public.workers(id) ON DELETE CASCADE,
  current_zone TEXT REFERENCES public.zones(id),
  zone_confidence REAL NOT NULL DEFAULT 0.5,
  zone_source TEXT CHECK (zone_source IN ('task', 'wifi', 'manual', 'schedule')),
  zone_last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_online BOOLEAN NOT NULL DEFAULT false,
  last_heartbeat_at TIMESTAMPTZ,
  active_task_count INT NOT NULL DEFAULT 0,
  last_task_completed_at TIMESTAMPTZ,
  connected_wifi_ap TEXT
);

-- 6. TASKS TABLE
CREATE TABLE public.tasks (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  zone_id TEXT NOT NULL REFERENCES public.zones(id),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TASK ASSIGNMENTS
CREATE TABLE public.task_assignments (
  task_id BIGINT PRIMARY KEY REFERENCES public.tasks(id) ON DELETE CASCADE,
  worker_id BIGINT NOT NULL REFERENCES public.workers(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  state TEXT NOT NULL DEFAULT 'pending_ack' CHECK (state IN ('pending_ack', 'acked', 'completed', 'failed')),
  reroutes INT NOT NULL DEFAULT 0
);

-- 8. EVENTS (audit log - immutable)
CREATE TABLE public.dispatch_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  task_id BIGINT REFERENCES public.tasks(id),
  worker_id BIGINT REFERENCES public.workers(id),
  zone_id TEXT REFERENCES public.zones(id),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================
-- RLS POLICIES (public read for dispatch system)
-- ===========================================

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_ap_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_events ENABLE ROW LEVEL SECURITY;

-- Zones: public read
CREATE POLICY "Zones are publicly readable" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Zones can be inserted" ON public.zones FOR INSERT WITH CHECK (true);

-- Zone edges: public read
CREATE POLICY "Zone edges are publicly readable" ON public.zone_edges FOR SELECT USING (true);
CREATE POLICY "Zone edges can be inserted" ON public.zone_edges FOR INSERT WITH CHECK (true);

-- WiFi AP zones: public read
CREATE POLICY "WiFi AP zones are publicly readable" ON public.wifi_ap_zones FOR SELECT USING (true);
CREATE POLICY "WiFi AP zones can be inserted" ON public.wifi_ap_zones FOR INSERT WITH CHECK (true);

-- Workers: public read/write for dispatch
CREATE POLICY "Workers are publicly readable" ON public.workers FOR SELECT USING (true);
CREATE POLICY "Workers can be inserted" ON public.workers FOR INSERT WITH CHECK (true);
CREATE POLICY "Workers can be updated" ON public.workers FOR UPDATE USING (true);

-- Worker state: public read/write
CREATE POLICY "Worker state is publicly readable" ON public.worker_state FOR SELECT USING (true);
CREATE POLICY "Worker state can be inserted" ON public.worker_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Worker state can be updated" ON public.worker_state FOR UPDATE USING (true);

-- Tasks: public read/write
CREATE POLICY "Tasks are publicly readable" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Tasks can be inserted" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Tasks can be updated" ON public.tasks FOR UPDATE USING (true);

-- Task assignments: public read/write
CREATE POLICY "Task assignments are publicly readable" ON public.task_assignments FOR SELECT USING (true);
CREATE POLICY "Task assignments can be inserted" ON public.task_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Task assignments can be updated" ON public.task_assignments FOR UPDATE USING (true);
CREATE POLICY "Task assignments can be deleted" ON public.task_assignments FOR DELETE USING (true);

-- Events: public read, insert only
CREATE POLICY "Events are publicly readable" ON public.dispatch_events FOR SELECT USING (true);
CREATE POLICY "Events can be inserted" ON public.dispatch_events FOR INSERT WITH CHECK (true);

-- ===========================================
-- ENABLE REALTIME
-- ===========================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_events;

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_zone ON public.tasks(zone_id);
CREATE INDEX idx_worker_state_zone ON public.worker_state(current_zone);
CREATE INDEX idx_events_type ON public.dispatch_events(event_type);
CREATE INDEX idx_events_task ON public.dispatch_events(task_id);
CREATE INDEX idx_events_created ON public.dispatch_events(created_at DESC);