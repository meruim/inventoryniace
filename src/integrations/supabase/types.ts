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
      activity_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          details: Json | null
          id: string
          occurred_at: string
          record_id: string | null
          summary: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          details?: Json | null
          id?: string
          occurred_at?: string
          record_id?: string | null
          summary?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          details?: Json | null
          id?: string
          occurred_at?: string
          record_id?: string | null
          summary?: string | null
          table_name?: string
        }
        Relationships: []
      }
      adjustments: {
        Row: {
          adjustment_date: string
          adjustment_type: string | null
          approved_by: string | null
          created_at: string
          id: string
          qty: number
          reason: string | null
          reference_no: string | null
          tire_id: string
          updated_at: string
        }
        Insert: {
          adjustment_date?: string
          adjustment_type?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          qty?: number
          reason?: string | null
          reference_no?: string | null
          tire_id: string
          updated_at?: string
        }
        Update: {
          adjustment_date?: string
          adjustment_type?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          qty?: number
          reason?: string | null
          reference_no?: string | null
          tire_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adjustments_tire_id_fkey"
            columns: ["tire_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjustments_tire_id_fkey"
            columns: ["tire_id"]
            isOneToOne: false
            referencedRelation: "tires"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          contact_no: string | null
          created_at: string
          customer_id: string
          customer_type: string | null
          id: string
          name: string
          payment_mode: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_no?: string | null
          created_at?: string
          customer_id: string
          customer_type?: string | null
          id?: string
          name: string
          payment_mode?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_no?: string | null
          created_at?: string
          customer_id?: string
          customer_type?: string | null
          id?: string
          name?: string
          payment_mode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          payment_term: string | null
          po_no: string | null
          purchase_date: string
          qty: number
          supplier_address: string | null
          supplier_name: string | null
          supplier_phone: string | null
          tire_id: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_term?: string | null
          po_no?: string | null
          purchase_date?: string
          qty?: number
          supplier_address?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          tire_id: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_term?: string | null
          po_no?: string | null
          purchase_date?: string
          qty?: number
          supplier_address?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          tire_id?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_tire_id_fkey"
            columns: ["tire_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_tire_id_fkey"
            columns: ["tire_id"]
            isOneToOne: false
            referencedRelation: "tires"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_paid: number
          created_at: string
          customer_address: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          invoice_no: string | null
          payment_mode: string
          qty: number
          sale_date: string
          tire_id: string
          unit_cost: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          invoice_no?: string | null
          payment_mode?: string
          qty?: number
          sale_date?: string
          tire_id: string
          unit_cost?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          invoice_no?: string | null
          payment_mode?: string
          qty?: number
          sale_date?: string
          tire_id?: string
          unit_cost?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_tire_id_fkey"
            columns: ["tire_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_tire_id_fkey"
            columns: ["tire_id"]
            isOneToOne: false
            referencedRelation: "tires"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          id: string
          name: string
          payment_terms: string | null
          phone: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          name: string
          payment_terms?: string | null
          phone?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          name?: string
          payment_terms?: string | null
          phone?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tires: {
        Row: {
          beginning_stock: number
          brand: string
          category: string | null
          created_at: string
          id: string
          load_index: string | null
          pattern: string | null
          reorder_level: number
          selling_price: number
          size: string
          speed_rating: string | null
          supplier_name: string | null
          tire_code: string
          tire_type: string | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          beginning_stock?: number
          brand: string
          category?: string | null
          created_at?: string
          id?: string
          load_index?: string | null
          pattern?: string | null
          reorder_level?: number
          selling_price?: number
          size: string
          speed_rating?: string | null
          supplier_name?: string | null
          tire_code: string
          tire_type?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          beginning_stock?: number
          brand?: string
          category?: string | null
          created_at?: string
          id?: string
          load_index?: string | null
          pattern?: string | null
          reorder_level?: number
          selling_price?: number
          size?: string
          speed_rating?: string | null
          supplier_name?: string | null
          tire_code?: string
          tire_type?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      transfers: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          qty: number
          reference_no: string | null
          tire_id: string
          transfer_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          qty?: number
          reference_no?: string | null
          tire_id: string
          transfer_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          qty?: number
          reference_no?: string | null
          tire_id?: string
          transfer_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_tire_id_fkey"
            columns: ["tire_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_tire_id_fkey"
            columns: ["tire_id"]
            isOneToOne: false
            referencedRelation: "tires"
            referencedColumns: ["id"]
          },
        ]
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
      inventory_view: {
        Row: {
          adjustment: number | null
          beginning_stock: number | null
          bodega_in: number | null
          bodega_out: number | null
          bodega_stock: number | null
          brand: string | null
          category: string | null
          current_stock: number | null
          id: string | null
          pattern: string | null
          reorder_level: number | null
          selling_price: number | null
          size: string | null
          status: string | null
          stock_in: number | null
          stock_out: number | null
          stock_value: number | null
          store_in: number | null
          store_out: number | null
          store_stock: number | null
          supplier_name: string | null
          tire_code: string | null
          unit_cost: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff"
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
      app_role: ["admin", "staff"],
    },
  },
} as const
