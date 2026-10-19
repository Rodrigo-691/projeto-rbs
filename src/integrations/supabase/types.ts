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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          created_at: string
          id: number
          sponsor_id: string | null
          summary: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          created_at?: string
          id?: number
          sponsor_id?: string | null
          summary?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          created_at?: string
          id?: number
          sponsor_id?: string | null
          summary?: string | null
          table_name?: string
        }
        Relationships: []
      }
      contract_signers: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_email: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          sponsor_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          sponsor_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_signers_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          body: string | null
          channel: string | null
          created_at: string
          created_by: string | null
          created_by_email: string | null
          id: string
          kind: string
          reach: number | null
          sponsor_id: string
          title: string
          url: string | null
        }
        Insert: {
          body?: string | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          kind: string
          reach?: number | null
          sponsor_id: string
          title: string
          url?: string | null
        }
        Update: {
          body?: string | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          kind?: string
          reach?: number | null
          sponsor_id?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_items_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      quota_modules: {
        Row: {
          quota: Database["public"]["Enums"]["quota_level"]
          tab_key: string
        }
        Insert: {
          quota: Database["public"]["Enums"]["quota_level"]
          tab_key: string
        }
        Update: {
          quota?: Database["public"]["Enums"]["quota_level"]
          tab_key?: string
        }
        Relationships: []
      }
      sponsor_files: {
        Row: {
          category: string
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number
          sponsor_id: string
          storage_path: string
          tab: string
          uploaded_by: string | null
          uploaded_by_email: string | null
        }
        Insert: {
          category: string
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number
          sponsor_id: string
          storage_path: string
          tab: string
          uploaded_by?: string | null
          uploaded_by_email?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number
          sponsor_id?: string
          storage_path?: string
          tab?: string
          uploaded_by?: string | null
          uploaded_by_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_files_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_members: {
        Row: {
          created_at: string
          email: string
          id: string
          sponsor_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          sponsor_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_members_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          cnpj: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          quota: Database["public"]["Enums"]["quota_level"]
          segment: string | null
          signer_document: string | null
          signer_email: string | null
          signer_name: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          quota?: Database["public"]["Enums"]["quota_level"]
          segment?: string | null
          signer_document?: string | null
          signer_email?: string | null
          signer_name?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          quota?: Database["public"]["Enums"]["quota_level"]
          segment?: string | null
          signer_document?: string | null
          signer_email?: string | null
          signer_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      survey_questions: {
        Row: {
          locked: boolean
          q1: string | null
          q2: string | null
          q3: string | null
          sponsor_id: string
          updated_at: string
        }
        Insert: {
          locked?: boolean
          q1?: string | null
          q2?: string | null
          q3?: string | null
          sponsor_id: string
          updated_at?: string
        }
        Update: {
          locked?: boolean
          q1?: string | null
          q2?: string | null
          q3?: string | null
          sponsor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: true
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_results: {
        Row: {
          answer: string
          created_at: string
          id: string
          percent: number
          question: string
          sponsor_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          percent: number
          question: string
          sponsor_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          percent?: number
          question?: string
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_results_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      can_access_sponsor: { Args: { _sponsor_id: string }; Returns: boolean }
      current_email: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_email_allowed: { Args: { _email: string }; Returns: boolean }
      quota_allows: {
        Args: { _sponsor_id: string; _tab_key: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin_rbs"
      quota_level: "master" | "subcota_g" | "subcota"
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
      app_role: ["admin_rbs"],
      quota_level: ["master", "subcota_g", "subcota"],
    },
  },
} as const
