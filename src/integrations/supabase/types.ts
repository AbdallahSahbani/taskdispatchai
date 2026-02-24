export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      dispatch_events: {
        Row: {
          created_at: string
          event_type: string
          id: number
          payload: Json | null
          task_id: number | null
          worker_id: number | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: number
          payload?: Json | null
          task_id?: number | null
          worker_id?: number | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: number
          payload?: Json | null
          task_id?: number | null
          worker_id?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_events_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          acknowledged_at: string | null
          assigned_at: string
          completed_at: string | null
          reroutes: number
          state: string
          task_id: number
          worker_id: number
        }
        Insert: {
          acknowledged_at?: string | null
          assigned_at?: string
          completed_at?: string | null
          reroutes?: number
          state?: string
          task_id: number
          worker_id: number
        }
        Update: {
          acknowledged_at?: string | null
          assigned_at?: string
          completed_at?: string | null
          reroutes?: number
          state?: string
          task_id?: number
          worker_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          id: number
          priority: string
          status: string
          type: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          priority?: string
          status?: string
          type: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: number
          priority?: string
          status?: string
          type?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_ap_zones: {
        Row: {
          ap_id: string
          created_at: string
          zone_id: string | null
        }
        Insert: {
          ap_id: string
          created_at?: string
          zone_id?: string | null
        }
        Update: {
          ap_id?: string
          created_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wifi_ap_zones_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_state: {
        Row: {
          active_task_count: number
          connected_wifi_ap: string | null
          current_zone: string | null
          device_online: boolean
          last_heartbeat_at: string | null
          last_task_completed_at: string | null
          worker_id: number
          zone_confidence: number
          zone_last_updated_at: string
          zone_source: string | null
        }
        Insert: {
          active_task_count?: number
          connected_wifi_ap?: string | null
          current_zone?: string | null
          device_online?: boolean
          last_heartbeat_at?: string | null
          last_task_completed_at?: string | null
          worker_id: number
          zone_confidence?: number
          zone_last_updated_at?: string
          zone_source?: string | null
        }
        Update: {
          active_task_count?: number
          connected_wifi_ap?: string | null
          current_zone?: string | null
          device_online?: boolean
          last_heartbeat_at?: string | null
          last_task_completed_at?: string | null
          worker_id?: number
          zone_confidence?: number
          zone_last_updated_at?: string
          zone_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_state_current_zone_fkey"
            columns: ["current_zone"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_state_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: true
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          avg_ack_time_seconds: number
          avg_completion_time_seconds: number
          created_at: string
          id: number
          name: string
          on_shift: boolean
          reliability_score: number
          role: string
        }
        Insert: {
          avg_ack_time_seconds?: number
          avg_completion_time_seconds?: number
          created_at?: string
          id?: number
          name: string
          on_shift?: boolean
          reliability_score?: number
          role: string
        }
        Update: {
          avg_ack_time_seconds?: number
          avg_completion_time_seconds?: number
          created_at?: string
          id?: number
          name?: string
          on_shift?: boolean
          reliability_score?: number
          role?: string
        }
        Relationships: []
      }
      zone_edges: {
        Row: {
          from_zone: string
          to_zone: string
          travel_time_seconds: number
        }
        Insert: {
          from_zone: string
          to_zone: string
          travel_time_seconds: number
        }
        Update: {
          from_zone?: string
          to_zone?: string
          travel_time_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "zone_edges_from_zone_fkey"
            columns: ["from_zone"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_edges_to_zone_fkey"
            columns: ["to_zone"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
