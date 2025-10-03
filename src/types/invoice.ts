import { Transaction } from "./transaction";
import { Account } from "./account"; // Importar o tipo Account

export interface Invoice {
  id: string;
  account_id: string;
  closing_date: string;
  due_date: string;
  status: 'open' | 'closed' | 'paid';
  transactions?: Transaction[]; // Tornar opcional se nem sempre for carregado
  
  // Adicionar propriedades da conta diretamente ao Invoice
  account_name: string;
  account_type: Account['type']; // Usar o tipo específico de Account
  account_balance: number; // Adicionar balance para consistência, embora possa ser 0 para CC
  account_color: string;
  account_icon: Account['icon']; // Usar o tipo específico de Account
  account_limit: number | null; // Adicionar limite para CC
  account_closing_day: number | null; // Adicionar dia de fechamento para CC
  account_due_day: number | null; // Adicionar dia de vencimento para CC
}