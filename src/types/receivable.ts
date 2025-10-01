import { z } from 'zod';

export const receivableSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, "Descrição é obrigatória."),
  amount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val)),
    z.number({ required_error: "O valor é obrigatório." }).positive("O valor deve ser positivo.")
  ),
  due_date: z.date({ required_error: "Data de vencimento é obrigatória." }),
  category_id: z.string().min(1, "Categoria é obrigatória."),
});

export type ReceivableFormData = z.infer<typeof receivableSchema>;

export interface Receivable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'received';
  received_at: string | null;
  category_name: string | null;
  category_icon: string | null;
}