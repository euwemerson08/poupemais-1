import { Database } from "../types/supabase";

// Type for the raw transaction row from the database
type RawTransaction = Database['public']['Tables']['transactions']['Row'];

// Type for the account details returned by the RPC function
type RpcAccountDetails = {
  account_name: string;
  account_type: string;
  account_balance: number;
  account_color: string;
  account_icon: string;
  account_limit: number | null;
  account_closing_day: number | null;
  account_due_day: number | null;
};

// Type for the invoice details returned by the RPC function
type RpcInvoiceDetails = {
  invoice_closing_date: string | null;
  invoice_due_date: string | null;
  invoice_status: string | null;
};

// Combined Transaction type including details from joined tables via RPC
export type Transaction = RawTransaction & RpcAccountDetails & RpcInvoiceDetails;