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
      family_members: {
        Row: {
          age: number
          allergies: string[] | null
          blood_type: string
          chronic_diseases: string[] | null
          created_at: string
          id: string
          name: string
          notes: string | null
          relation: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age: number
          allergies?: string[] | null
          blood_type?: string
          chronic_diseases?: string[] | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          relation: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number
          allergies?: string[] | null
          blood_type?: string
          chronic_diseases?: string[] | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          relation?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
