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
      active_ambulance_trips: {
        Row: {
          created_at: string
          current_lat: number | null
          current_lng: number | null
          destination_hospital_id: number
          destination_hospital_name: string
          driver_id: string
          driver_name: string | null
          ended_at: string | null
          estimated_arrival_minutes: number | null
          id: string
          origin_lat: number | null
          origin_lng: number | null
          patient_condition: string | null
          started_at: string
          status: Database["public"]["Enums"]["ambulance_trip_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          destination_hospital_id: number
          destination_hospital_name: string
          driver_id: string
          driver_name?: string | null
          ended_at?: string | null
          estimated_arrival_minutes?: number | null
          id?: string
          origin_lat?: number | null
          origin_lng?: number | null
          patient_condition?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["ambulance_trip_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          destination_hospital_id?: number
          destination_hospital_name?: string
          driver_id?: string
          driver_name?: string | null
          ended_at?: string | null
          estimated_arrival_minutes?: number | null
          id?: string
          origin_lat?: number | null
          origin_lng?: number | null
          patient_condition?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["ambulance_trip_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_ambulance_trips_destination_hospital_id_fkey"
            columns: ["destination_hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      ambulance_dispatch_requests: {
        Row: {
          created_at: string
          destination: string | null
          destination_lat: number | null
          destination_lng: number | null
          driver_id: string | null
          estimated_distance_km: number | null
          estimated_fee: number | null
          id: string
          notes: string | null
          patient_condition: string | null
          patient_name: string | null
          pickup_lat: number
          pickup_lng: number
          pickup_location: string
          requester_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          driver_id?: string | null
          estimated_distance_km?: number | null
          estimated_fee?: number | null
          id?: string
          notes?: string | null
          patient_condition?: string | null
          patient_name?: string | null
          pickup_lat: number
          pickup_lng: number
          pickup_location: string
          requester_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          driver_id?: string | null
          estimated_distance_km?: number | null
          estimated_fee?: number | null
          id?: string
          notes?: string | null
          patient_condition?: string | null
          patient_name?: string | null
          pickup_lat?: number
          pickup_lng?: number
          pickup_location?: string
          requester_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      driving_logs: {
        Row: {
          created_at: string
          date: string
          distance_km: number
          driver_id: string
          duration_minutes: number | null
          end_lat: number | null
          end_lng: number | null
          end_location: string
          end_time: string
          hospital_id: number | null
          hospital_name: string | null
          id: string
          notes: string | null
          patient_name: string | null
          payment_method: string | null
          revenue_amount: number | null
          revenue_memo: string | null
          start_lat: number | null
          start_lng: number | null
          start_location: string
          start_time: string
        }
        Insert: {
          created_at?: string
          date?: string
          distance_km?: number
          driver_id: string
          duration_minutes?: number | null
          end_lat?: number | null
          end_lng?: number | null
          end_location: string
          end_time: string
          hospital_id?: number | null
          hospital_name?: string | null
          id?: string
          notes?: string | null
          patient_name?: string | null
          payment_method?: string | null
          revenue_amount?: number | null
          revenue_memo?: string | null
          start_lat?: number | null
          start_lng?: number | null
          start_location: string
          start_time: string
        }
        Update: {
          created_at?: string
          date?: string
          distance_km?: number
          driver_id?: string
          duration_minutes?: number | null
          end_lat?: number | null
          end_lng?: number | null
          end_location?: string
          end_time?: string
          hospital_id?: number | null
          hospital_name?: string | null
          id?: string
          notes?: string | null
          patient_name?: string | null
          payment_method?: string | null
          revenue_amount?: number | null
          revenue_memo?: string | null
          start_lat?: number | null
          start_lng?: number | null
          start_location?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "driving_logs_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          age: number
          allergies: string[] | null
          birth_date: string | null
          blood_type: string
          chronic_diseases: string[] | null
          created_at: string
          gender: string | null
          guardian_contact: string | null
          id: string
          medications: string[] | null
          name: string
          notes: string | null
          relation: string
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          age: number
          allergies?: string[] | null
          birth_date?: string | null
          blood_type?: string
          chronic_diseases?: string[] | null
          created_at?: string
          gender?: string | null
          guardian_contact?: string | null
          id?: string
          medications?: string[] | null
          name: string
          notes?: string | null
          relation: string
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          age?: number
          allergies?: string[] | null
          birth_date?: string | null
          blood_type?: string
          chronic_diseases?: string[] | null
          created_at?: string
          gender?: string | null
          guardian_contact?: string | null
          id?: string
          medications?: string[] | null
          name?: string
          notes?: string | null
          relation?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      hospital_acceptance_stats: {
        Row: {
          acceptance_rate: number
          accepted_count: number
          created_at: string
          hospital_id: number
          id: string
          last_calculated_at: string
          rejected_count: number
          total_entries: number
          updated_at: string
        }
        Insert: {
          acceptance_rate?: number
          accepted_count?: number
          created_at?: string
          hospital_id: number
          id?: string
          last_calculated_at?: string
          rejected_count?: number
          total_entries?: number
          updated_at?: string
        }
        Update: {
          acceptance_rate?: number
          accepted_count?: number
          created_at?: string
          hospital_id?: number
          id?: string
          last_calculated_at?: string
          rejected_count?: number
          total_entries?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_acceptance_stats_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: true
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_monitors: {
        Row: {
          bed_type: string
          created_at: string
          hospital_id: number
          hospital_name: string
          id: string
          subscription_id: string
        }
        Insert: {
          bed_type?: string
          created_at?: string
          hospital_id: number
          hospital_name: string
          id?: string
          subscription_id: string
        }
        Update: {
          bed_type?: string
          created_at?: string
          hospital_id?: number
          hospital_name?: string
          id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_monitors_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_rejection_logs: {
        Row: {
          created_at: string
          driver_id: string
          hospital_id: number
          hospital_name: string
          id: string
          notes: string | null
          recorded_at: string
          rejection_reason: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          hospital_id: number
          hospital_name: string
          id?: string
          notes?: string | null
          recorded_at?: string
          rejection_reason: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          hospital_id?: number
          hospital_name?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          rejection_reason?: string
        }
        Relationships: []
      }
      hospital_status_cache: {
        Row: {
          general_beds: number
          hospital_id: number
          hpid: string | null
          id: number
          isolation_beds: number
          last_updated: string
          pediatric_beds: number
        }
        Insert: {
          general_beds?: number
          hospital_id: number
          hpid?: string | null
          id?: number
          isolation_beds?: number
          last_updated?: string
          pediatric_beds?: number
        }
        Update: {
          general_beds?: number
          hospital_id?: number
          hpid?: string | null
          id?: number
          isolation_beds?: number
          last_updated?: string
          pediatric_beds?: number
        }
        Relationships: []
      }
      hospitals: {
        Row: {
          address: string
          category: string | null
          created_at: string | null
          emergency_grade: string | null
          entrance_lat: number | null
          entrance_lng: number | null
          equipment: string[] | null
          has_pediatric: boolean | null
          hpid: string | null
          id: number
          is_trauma_center: boolean | null
          lat: number
          lng: number
          name: string
          name_en: string | null
          phone: string | null
          region: string
          sub_region: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          category?: string | null
          created_at?: string | null
          emergency_grade?: string | null
          entrance_lat?: number | null
          entrance_lng?: number | null
          equipment?: string[] | null
          has_pediatric?: boolean | null
          hpid?: string | null
          id?: number
          is_trauma_center?: boolean | null
          lat: number
          lng: number
          name: string
          name_en?: string | null
          phone?: string | null
          region: string
          sub_region?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          category?: string | null
          created_at?: string | null
          emergency_grade?: string | null
          entrance_lat?: number | null
          entrance_lng?: number | null
          equipment?: string[] | null
          has_pediatric?: boolean | null
          hpid?: string | null
          id?: number
          is_trauma_center?: boolean | null
          lat?: number
          lng?: number
          name?: string
          name_en?: string | null
          phone?: string | null
          region?: string
          sub_region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      location_logs: {
        Row: {
          created_at: string
          distance_from_hospital: number | null
          driver_id: string
          event_type: string
          hospital_id: number | null
          id: string
          lat: number
          lng: number
          recorded_at: string
        }
        Insert: {
          created_at?: string
          distance_from_hospital?: number | null
          driver_id: string
          event_type: string
          hospital_id?: number | null
          id?: string
          lat: number
          lng: number
          recorded_at?: string
        }
        Update: {
          created_at?: string
          distance_from_hospital?: number | null
          driver_id?: string
          event_type?: string
          hospital_id?: number | null
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_logs_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
        }
        Relationships: []
      }
      return_trip_requests: {
        Row: {
          accepted_by: string | null
          created_at: string
          destination: string
          destination_city: string
          distance: string
          estimated_fee: number
          id: string
          patient_age: string | null
          patient_condition: string | null
          patient_gender: string | null
          patient_name: string
          pickup_city: string
          pickup_location: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_by?: string | null
          created_at?: string
          destination: string
          destination_city: string
          distance: string
          estimated_fee: number
          id?: string
          patient_age?: string | null
          patient_condition?: string | null
          patient_gender?: string | null
          patient_name: string
          pickup_city: string
          pickup_location: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_by?: string | null
          created_at?: string
          destination?: string
          destination_city?: string
          distance?: string
          estimated_fee?: number
          id?: string
          patient_age?: string | null
          patient_condition?: string | null
          patient_gender?: string | null
          patient_name?: string
          pickup_city?: string
          pickup_location?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_audit_logs: {
        Row: {
          action_detail: string | null
          action_type: string
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          performed_by: string | null
          success: boolean
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action_detail?: string | null
          action_type: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          success?: boolean
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action_detail?: string | null
          action_type?: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          success?: boolean
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_rejection_logs: { Args: never; Returns: undefined }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ambulance_trip_status: "en_route" | "arrived" | "cancelled"
      user_role: "guardian" | "driver" | "admin"
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
    Enums: {
      ambulance_trip_status: ["en_route", "arrived", "cancelled"],
      user_role: ["guardian", "driver", "admin"],
    },
  },
} as const
