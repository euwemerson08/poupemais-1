import { z } from 'zod';

export const recurrenceIntervals = ['daily', 'weekly', 'monthly', 'yearly'] as const;

export const receivableSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, "Descrição é obrigatória."),
  amount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val)),
    z.number({ required_error: "O valor é obrigatório." }).positive("O valor deve ser positivo.")
  ),
  due_date: z.date({ required_error: "Data de vencimento é obrigatória." }),
  category_id: z.string().min(1, "Categoria é obrigatória."),
  
  // New fields for recurrence
  is_recurring: z.boolean().optional(),
  recurrence_interval: z.enum(recurrenceIntervals).optional(),
  recurrence_end_date: z.date().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.is_recurring) {
    if (!data.recurrence_interval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Intervalo de recorrência é obrigatório para recebimentos recorrentes.",
        path: ['recurrence_interval'],
      });
    }
    // due_date will be used as start_date for recurring
  }
});

export type ReceivableFormData = z.infer<typeof receivableSchema>;

// This type represents the raw input values from the form
export type ReceivableFormInput = {
  description: string;
  amount: string; // Raw string input for the form
  due_date: Date;
  category_id: string;
  is_recurring?: boolean;
  recurrence_interval?: typeof recurrenceIntervals[number];
  recurrence_end_date?: Date | null;
}

export interface Receivable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'received' | 'recurring_template'; // Adicionado 'recurring_template'
  received_at: string | null;
  category_name: string | null;
  category_icon: string | null;
  // Novos campos para diferenciar e exibir templates recorrentes
  is_recurring_template?: boolean;
  recurrence_interval?: typeof recurrenceIntervals[number];
  recurrence_end_date?: string | null;
}

export interface RecurringReceivable {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  start_date: string;
  recurrence_interval: typeof recurrenceIntervals[number];
  end_date: string | null;
  category_name: string | null;
  category_icon: string | null;
  created_at: string;
}