import { Transaction } from "./transaction";

export interface Invoice {
  id: string;
  account_id: string;
  closing_date: string;
  due_date: string;
  status: 'open' | 'closed' | 'paid';
  total_amount: number | null; // Adicionado para armazenar o total da fatura
  transactions: Transaction[];
}