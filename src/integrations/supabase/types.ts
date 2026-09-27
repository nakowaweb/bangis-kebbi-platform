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
          author: string | null
          body: string | null
          canonical_url: string | null
          category: string | null
          completed_on: string | null
          content_type: string
          created_at: string
          deleted_at: string | null
          gallery: Json
          id: string
          image_alt: string | null
          image_path: string | null
          is_enabled: boolean
          is_featured: boolean
          language: string
          og_description: string | null
          og_image_path: string | null
          og_title: string | null
          payload: Json
          project_url: string | null
          published_at: string | null
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author?: string | null
          body?: string | null
          canonical_url?: string | null
          category?: string | null
          completed_on?: string | null
          content_type: string
          created_at?: string
          deleted_at?: string | null
          gallery?: Json
          id?: string
          image_alt?: string | null
          image_path?: string | null
          is_enabled?: boolean
          is_featured?: boolean
          language?: string
          og_description?: string | null
          og_image_path?: string | null
          og_title?: string | null
          payload?: Json
          project_url?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author?: string | null
          body?: string | null
          canonical_url?: string | null
          category?: string | null
          completed_on?: string | null
          content_type?: string
          created_at?: string
          deleted_at?: string | null
          gallery?: Json
          id?: string
          image_alt?: string | null
          image_path?: string | null
          is_enabled?: boolean
          is_featured?: boolean
          language?: string
          og_description?: string | null
          og_image_path?: string | null
          og_title?: string | null
          payload?: Json
          project_url?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          tags?: string[]
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
      content_translations: {
        Row: {
          body: string | null
          content_entry_id: string
          created_at: string
          created_by: string | null
          id: string
          image_alt: string | null
          is_machine_generated: boolean
          language: string
          og_description: string | null
          og_title: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          seo_description: string | null
          seo_title: string | null
          status: Database["public"]["Enums"]["translation_status"]
          summary: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string | null
          content_entry_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_alt?: string | null
          is_machine_generated?: boolean
          language: string
          og_description?: string | null
          og_title?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seo_description?: string | null
          seo_title?: string | null
          status?: Database["public"]["Enums"]["translation_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string | null
          content_entry_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_alt?: string | null
          is_machine_generated?: boolean
          language?: string
          og_description?: string | null
          og_title?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seo_description?: string | null
          seo_title?: string | null
          status?: Database["public"]["Enums"]["translation_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_translations_content_entry_id_fkey"
            columns: ["content_entry_id"]
            isOneToOne: false
            referencedRelation: "content_entries"
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
      member_documents: {
        Row: {
          byte_size: number
          created_at: string
          document_type: string
          id: string
          mime_type: string
          original_name: string
          review_status: string
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          byte_size: number
          created_at?: string
          document_type: string
          id?: string
          mime_type: string
          original_name: string
          review_status?: string
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          byte_size?: number
          created_at?: string
          document_type?: string
          id?: string
          mime_type?: string
          original_name?: string
          review_status?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          created_by: string | null
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          preferred_language?: string
          updated_at?: string
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
      site_social_links: {
        Row: {
          created_at: string
          created_by: string | null
          display_label: string
          icon_key: string | null
          id: string
          is_enabled: boolean
          platform: string
          sort_order: number
          updated_at: string
          updated_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_label?: string
          icon_key?: string | null
          id?: string
          is_enabled?: boolean
          platform: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_label?: string
          icon_key?: string | null
          id?: string
          is_enabled?: boolean
          platform?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          url?: string
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
      claim_first_super_admin: { Args: never; Returns: boolean }
      ensure_member_role: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_content_admin: { Args: { _user_id: string }; Returns: boolean }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
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
      translation_status: "draft" | "ready" | "published"
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
      translation_status: ["draft", "ready", "published"],
    },
  },
} as const
