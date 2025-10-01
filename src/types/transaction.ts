import { Account } from './account';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  is_paid: boolean;
  is_installment: boolean;
  installment_number: number | null;
  total_installments: number | null;
  category_name: string | null;
  category_icon: string | null;
  accounts: (Pick<Account, 'name' | 'type'> & { id: string }) | null;
}

export type TransactionFormData = {
    description: string;
    amount: string;
    date: Date;
    account_id: string;
    category_id: string;
    total_installments: number;
}