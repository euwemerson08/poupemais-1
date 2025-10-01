export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  is_installment: boolean;
  installment_number: number | null;
  total_installments: number | null;
}