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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          content_id: string | null
          content_label: string | null
          content_type: string
          created_at: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          admin_id: string
          content_id?: string | null
          content_label?: string | null
          content_type: string
          created_at?: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          admin_id?: string
          content_id?: string | null
          content_label?: string | null
          content_type?: string
          created_at?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      content_entries: {
        Row: {
          body: string | null
          content_type: string
          created_at: string
          deleted_at: string | null
          id: string
          image_path: string | null
          is_enabled: boolean
          is_featured: boolean
          payload: Json
          published_at: string | null
          scheduled_for: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string | null
          content_type: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_path?: string | null
          is_enabled?: boolean
          is_featured?: boolean
          payload?: Json
          published_at?: string | null
          scheduled_for?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string | null
          content_type?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_path?: string | null
          is_enabled?: boolean
          is_featured?: boolean
          payload?: Json
          published_at?: string | null
          scheduled_for?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      content_revisions: {
        Row: {
          change_note: string | null
          content_entry_id: string | null
          created_at: string
          created_by: string
          id: string
          revision_number: number
          site_settings_id: string | null
          snapshot: Json
        }
        Insert: {
          change_note?: string | null
          content_entry_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          revision_number: number
          site_settings_id?: string | null
          snapshot: Json
        }
        Update: {
          change_note?: string | null
          content_entry_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          revision_number?: number
          site_settings_id?: string | null
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "content_revisions_content_entry_id_fkey"
            columns: ["content_entry_id"]
            isOneToOne: false
            referencedRelation: "content_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_revisions_site_settings_id_fkey"
            columns: ["site_settings_id"]
            isOneToOne: false
            referencedRelation: "site_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string
          byte_size: number
          created_at: string
          deleted_at: string | null
          height: number | null
          id: string
          is_protected: boolean
          mime_type: string
          name: string
          storage_path: string
          updated_at: string
          uploaded_by: string
          usage_count: number
          width: number | null
        }
        Insert: {
          alt_text?: string
          byte_size: number
          created_at?: string
          deleted_at?: string | null
          height?: number | null
          id?: string
          is_protected?: boolean
          mime_type: string
          name: string
          storage_path: string
          updated_at?: string
          uploaded_by: string
          usage_count?: number
          width?: number | null
        }
        Update: {
          alt_text?: string
          byte_size?: number
          created_at?: string
          deleted_at?: string | null
          height?: number | null
          id?: string
          is_protected?: boolean
          mime_type?: string
          name?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
          usage_count?: number
          width?: number | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          company_name: string
          contact_email: string | null
          created_at: string
          default_language: string
          favicon_path: string | null
          footer_content: string
          global_status: string
          id: string
          is_active: boolean
          location: string
          logo_path: string | null
          open_graph_image_path: string | null
          phone: string | null
          profile_image_path: string | null
          seo_description: string
          seo_title: string
          setting_key: string
          social_links: Json
          updated_at: string
          updated_by: string | null
          website_name: string
          whatsapp: string | null
        }
        Insert: {
          company_name?: string
          contact_email?: string | null
          created_at?: string
          default_language?: string
          favicon_path?: string | null
          footer_content?: string
          global_status?: string
          id?: string
          is_active?: boolean
          location?: string
          logo_path?: string | null
          open_graph_image_path?: string | null
          phone?: string | null
          profile_image_path?: string | null
          seo_description?: string
          seo_title?: string
          setting_key?: string
          social_links?: Json
          updated_at?: string
          updated_by?: string | null
          website_name?: string
          whatsapp?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          created_at?: string
          default_language?: string
          favicon_path?: string | null
          footer_content?: string
          global_status?: string
          id?: string
          is_active?: boolean
          location?: string
          logo_path?: string | null
          open_graph_image_path?: string | null
          phone?: string | null
          profile_image_path?: string | null
          seo_description?: string
          seo_title?: string
          setting_key?: string
          social_links?: Json
          updated_at?: string
          updated_by?: string | null
          website_name?: string
          whatsapp?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
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
      is_content_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "content_manager"
        | "support"
        | "finance"
        | "member"
      content_status: "draft" | "published" | "unpublished" | "archived"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "super_admin",
        "admin",
        "content_manager",
        "support",
        "finance",
        "member",
      ],
      content_status: ["draft", "published", "unpublished", "archived"],
    },
  },
} as const
