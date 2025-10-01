import { z } from 'zod';
import { Account } from './account';

export const fixedExpenseSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  due_day: z.preprocess(
    (val) => val ? parseInt(String(val), 10) : undefined,
    z.number({ required_error: "Dia do vencimento é obrigatório" }).int().min(1, "Dia deve ser entre 1 e 31").max(31, "Dia deve ser entre 1 e 31")
  ),
  account_id: z.string().uuid({ message: "Conta de pagamento é obrigatória" }),
  category_name: z.string().min(1, "Categoria é obrigatória"),
});

export type FixedExpenseFormData = z.infer<typeof fixedExpenseSchema>;

export interface FixedExpense {
  id: string;
  description: string;
  amount: number;
  due_day: number;
  account_id: string;
  category_name: string;
  category_icon: string;
  accounts: Account | null;
}