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
      clients: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      job_settings: {
        Row: {
          blade_kerf_mm: number
          created_at: string
          default_edge_profile: Database["public"]["Enums"]["edge_profile"]
          id: string
          project_id: string
          unit_preference: Database["public"]["Enums"]["unit_system"]
          updated_at: string
        }
        Insert: {
          blade_kerf_mm?: number
          created_at?: string
          default_edge_profile?: Database["public"]["Enums"]["edge_profile"]
          id?: string
          project_id: string
          unit_preference?: Database["public"]["Enums"]["unit_system"]
          updated_at?: string
        }
        Update: {
          blade_kerf_mm?: number
          created_at?: string
          default_edge_profile?: Database["public"]["Enums"]["edge_profile"]
          id?: string
          project_id?: string
          unit_preference?: Database["public"]["Enums"]["unit_system"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      off_cuts: {
        Row: {
          created_at: string
          id: string
          length_mm: number
          location: string | null
          notes: string | null
          parent_slab_id: string | null
          primary_color: string | null
          quantity: number
          secondary_color: string | null
          stone_name: string
          stone_type: string
          thickness_mm: number
          updated_at: string
          width_mm: number
        }
        Insert: {
          created_at?: string
          id?: string
          length_mm: number
          location?: string | null
          notes?: string | null
          parent_slab_id?: string | null
          primary_color?: string | null
          quantity?: number
          secondary_color?: string | null
          stone_name: string
          stone_type: string
          thickness_mm?: number
          updated_at?: string
          width_mm: number
        }
        Update: {
          created_at?: string
          id?: string
          length_mm?: number
          location?: string | null
          notes?: string | null
          parent_slab_id?: string | null
          primary_color?: string | null
          quantity?: number
          secondary_color?: string | null
          stone_name?: string
          stone_type?: string
          thickness_mm?: number
          updated_at?: string
          width_mm?: number
        }
        Relationships: [
          {
            foreignKeyName: "off_cuts_parent_slab_id_fkey"
            columns: ["parent_slab_id"]
            isOneToOne: false
            referencedRelation: "stock_slabs"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          allow_rotation: boolean
          assigned_offcut_id: string | null
          assigned_slab_id: string | null
          created_at: string
          cutout_data: Json | null
          edge_profiles: Json | null
          id: string
          is_locked: boolean
          length_mm: number
          name: string
          notes: string | null
          position_x: number | null
          position_y: number | null
          project_id: string
          rotation_degrees: number | null
          shape_data: Json | null
          shape_type: Database["public"]["Enums"]["shape_type"]
          sort_order: number
          updated_at: string
          width_mm: number
        }
        Insert: {
          allow_rotation?: boolean
          assigned_offcut_id?: string | null
          assigned_slab_id?: string | null
          created_at?: string
          cutout_data?: Json | null
          edge_profiles?: Json | null
          id?: string
          is_locked?: boolean
          length_mm: number
          name: string
          notes?: string | null
          position_x?: number | null
          position_y?: number | null
          project_id: string
          rotation_degrees?: number | null
          shape_data?: Json | null
          shape_type?: Database["public"]["Enums"]["shape_type"]
          sort_order?: number
          updated_at?: string
          width_mm: number
        }
        Update: {
          allow_rotation?: boolean
          assigned_offcut_id?: string | null
          assigned_slab_id?: string | null
          created_at?: string
          cutout_data?: Json | null
          edge_profiles?: Json | null
          id?: string
          is_locked?: boolean
          length_mm?: number
          name?: string
          notes?: string | null
          position_x?: number | null
          position_y?: number | null
          project_id?: string
          rotation_degrees?: number | null
          shape_data?: Json | null
          shape_type?: Database["public"]["Enums"]["shape_type"]
          sort_order?: number
          updated_at?: string
          width_mm?: number
        }
        Relationships: [
          {
            foreignKeyName: "parts_assigned_offcut_id_fkey"
            columns: ["assigned_offcut_id"]
            isOneToOne: false
            referencedRelation: "off_cuts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_assigned_slab_id_fkey"
            columns: ["assigned_slab_id"]
            isOneToOne: false
            referencedRelation: "stock_slabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          preferred_units: Database["public"]["Enums"]["unit_system"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          preferred_units?: Database["public"]["Enums"]["unit_system"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          preferred_units?: Database["public"]["Enums"]["unit_system"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          assigned_user_id: string | null
          client_id: string
          created_at: string
          description: string | null
          id: string
          kerf_width_mm: number
          name: string
          room_location: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          assigned_user_id?: string | null
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          kerf_width_mm?: number
          name: string
          room_location?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          assigned_user_id?: string | null
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          kerf_width_mm?: number
          name?: string
          room_location?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_slabs: {
        Row: {
          charge_per_unit: number | null
          cost_per_unit: number | null
          created_at: string
          id: string
          image_url: string | null
          length_mm: number
          location: string | null
          notes: string | null
          primary_color: string | null
          quantity: number
          secondary_color: string | null
          stone_name: string
          stone_type: string
          thickness_mm: number
          updated_at: string
          width_mm: number
        }
        Insert: {
          charge_per_unit?: number | null
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          length_mm: number
          location?: string | null
          notes?: string | null
          primary_color?: string | null
          quantity?: number
          secondary_color?: string | null
          stone_name: string
          stone_type: string
          thickness_mm?: number
          updated_at?: string
          width_mm: number
        }
        Update: {
          charge_per_unit?: number | null
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          length_mm?: number
          location?: string | null
          notes?: string | null
          primary_color?: string | null
          quantity?: number
          secondary_color?: string | null
          stone_name?: string
          stone_type?: string
          thickness_mm?: number
          updated_at?: string
          width_mm?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_registered_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "operator"
      edge_profile:
        | "raw"
        | "polished"
        | "bullnose"
        | "bevel"
        | "eased"
        | "ogee"
        | "waterfall"
      project_status: "draft" | "in_progress" | "completed" | "cancelled"
      shape_type: "rectangle" | "l_shape" | "circle" | "arc"
      unit_system: "metric" | "imperial"
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
      app_role: ["admin", "manager", "operator"],
      edge_profile: [
        "raw",
        "polished",
        "bullnose",
        "bevel",
        "eased",
        "ogee",
        "waterfall",
      ],
      project_status: ["draft", "in_progress", "completed", "cancelled"],
      shape_type: ["rectangle", "l_shape", "circle", "arc"],
      unit_system: ["metric", "imperial"],
    },
  },
} as const
