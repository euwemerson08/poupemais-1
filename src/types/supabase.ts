export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          closing_day: number | null
          color: string
          created_at: string | null
          due_day: number | null
          icon: string
          id: string
          limit: number | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          balance?: number
          closing_day?: number | null
          color: string
          created_at?: string | null
          due_day?: number | null
          icon: string
          id?: string
          limit?: number | null
          name: string
          type: string
          user_id: string
        }
        Update: {
          balance?: number
          closing_day?: number | null
          color?: string
          created_at?: string | null
          due_day?: number | null
          icon?: string
          id?: string
          limit?: number | null
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_plans: {
        Row: {
          created_at: string | null
          current_amount: number
          goal_amount: number
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number
          goal_amount: number
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number
          goal_amount?: number
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_expenses: {
        Row: {
          account_id: string | null
          amount: number
          category_icon: string
          category_name: string
          created_at: string | null
          description: string
          due_day: number
          id: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_icon: string
          category_name: string
          created_at?: string | null
          description: string
          due_day: number
          id?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_icon?: string
          category_name?: string
          created_at?: string | null
          description?: string
          due_day?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          account_id: string
          closing_date: string
          created_at: string | null
          due_date: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          account_id: string
          closing_date: string
          created_at?: string | null
          due_date: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          account_id?: string
          closing_date?: string
          created_at?: string | null
          due_date?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      receivables: {
        Row: {
          amount: number
          category_icon: string | null
          category_name: string | null
          created_at: string | null
          description: string
          due_date: string
          id: string
          received_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          category_icon?: string | null
          category_name?: string | null
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          received_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_icon?: string | null
          category_name?: string | null
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          received_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_receivables: {
        Row: {
          amount: number
          category_icon: string | null
          category_name: string | null
          created_at: string | null
          description: string
          end_date: string | null
          id: string
          recurrence_interval: string
          start_date: string
          user_id: string
        }
        Insert: {
          amount: number
          category_icon?: string | null
          category_name?: string | null
          created_at?: string | null
          description: string
          end_date?: string | null
          id?: string
          recurrence_interval: string
          start_date: string
          user_id: string
        }
        Update: {
          amount?: number
          category_icon?: string | null
          category_name?: string | null
          created_at?: string | null
          description?: string
          end_date?: string | null
          id?: string
          recurrence_interval?: string
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_receivables_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          is_purchased: boolean | null
          list_id: string
          price: number | null
          quantity: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          is_purchased?: boolean | null
          list_id: string
          price?: number | null
          quantity?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          is_purchased?: boolean | null
          list_id?: string
          price?: number | null
          quantity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_icon: string | null
          category_name: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          installment_number: number | null
          invoice_id: string | null
          is_installment: boolean
          is_paid: boolean
          original_purchase_id: string | null
          total_installments: number | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_icon?: string | null
          category_name?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          installment_number?: number | null
          invoice_id?: string | null
          is_installment?: boolean
          is_paid?: boolean
          original_purchase_id?: string | null
          total_installments?: number | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_icon?: string | null
          category_name?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          installment_number?: number | null
          invoice_id?: string | null
          is_installment?: boolean
          is_paid?: boolean
          original_purchase_id?: string | null
          total_installments?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          marketing_emails_enabled: boolean | null
          reminders_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          marketing_emails_enabled?: boolean | null
          reminders_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          marketing_emails_enabled?: boolean | null
          reminders_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_to_financial_plan: {
        Args: {
          p_plan_id: string
          p_amount_to_add: number
        }
        Returns: undefined
      }
      create_and_mark_recurring_receivable_instance_as_received: {
        Args: {
          p_recurring_receivable_id: string
          p_account_id: string
          p_received_date: string
        }
        Returns: undefined
      }
      create_expense: {
        Args: {
          p_description: string
          p_amount: number
          p_date: string
          p_account_id: string
          p_category_name: string
          p_category_icon: string
          p_total_installments: number
        }
        Returns: undefined
      }
      create_income: {
        Args: {
          p_description: string
          p_amount: number
          p_date: string
          p_account_id: string
          p_category_name: string
          p_category_icon: string
        }
        Returns: undefined
      }
      delete_receivable: {
        Args: {
          p_receivable_id: string
        }
        Returns: undefined
      }
      delete_recurring_receivable: {
        Args: {
          p_recurring_receivable_id: string
        }
        Returns: undefined
      }
      delete_transaction: {
        Args: {
          p_transaction_id: string
        }
        Returns: undefined
      }
      get_transactions_by_month_with_installments: {
        Args: {
          p_month: number
          p_year: number
        }
        Returns: {
          id: string
          user_id: string
          account_id: string
          description: string
          amount: number
          date: string
          is_paid: boolean
          is_installment: boolean
          installment_number: number
          total_installments: number
          original_purchase_id: string
          invoice_id: string
          created_at: string
          category_name: string
          category_icon: string
          account_name: string
          account_type: string
          account_balance: number
          account_color: string
          account_icon: string
          account_limit: number
          account_closing_day: number
          account_due_day: number
          invoice_closing_date: string
          invoice_due_date: string
          invoice_status: string
        }[]
      }
      handle_new_user_preferences: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      mark_receivable_as_received: {
        Args: {
          p_receivable_id: string
          p_account_id: string
        }
        Returns: undefined
      }
      pay_invoice: {
        Args: {
          invoice_id_param: string
        }
        Returns: undefined
      }
      recalculate_credit_card_balance: {
        Args: {
          p_account_id: string
        }
        Returns: undefined
      }
      update_transaction: {
        Args: {
          p_transaction_id: string
          p_description: string
          p_amount: number
          p_date: string
          p_account_id: string
          p_category_name: string
          p_category_icon: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[
      TableName
    ] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? (PublicSchema["Tables"])[PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[
      TableName
    ] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? (PublicSchema["Tables"])[PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  Name extends keyof PublicSchema["Enums"],
  Enum extends PublicSchema["Enums"][Name] = PublicSchema["Enums"][Name],
> = Enum